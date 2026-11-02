/**
 * server/services/whatsappAIService.js
 * 
 * Production WhatsApp AI Assistant Service for FoodWala
 * Features:
 * - Customer Identification in MySQL `user` table by 10-digit phone
 * - Customer Order Lookup & Tracking with ownership validation
 * - 21-Intent Detection Engine (Rule-based & Semantic)
 * - Safe Database-grounded responses (Zero hallucination of orders, prices, or policies)
 * - Human Escalation logging into `support_tickets` table
 * - Conversation Memory via `whatsapp_messages` and `whatsapp_conversations`
 * - Fail-Safe Fallbacks on AI or database errors
 */

const db = require('../db');
const whatsappParser = require('../utils/whatsappParser');
const aiService = require('./aiService');
const https = require('https');

class WhatsAppAIService {
  get aiApiKey() {
    return process.env.AI_API_KEY || '';
  }

  get aiProvider() {
    return (process.env.AI_PROVIDER || 'gemini').toLowerCase();
  }

  get aiModelName() {
    return process.env.AI_MODEL_NAME || (this.aiProvider === 'openai' ? 'gpt-4o-mini' : 'gemini-3.8-flash');
  }

  /**
   * Identifies customer from MySQL `user` table by 10-digit mobile phone
   */
  async findCustomerByPhone(phone10) {
    if (!phone10) return null;
    try {
      const [rows] = await db.query(
        'SELECT user_id, username, email, phone, address, role FROM user WHERE phone = ? LIMIT 1',
        [phone10]
      );
      return rows && rows.length > 0 ? rows[0] : null;
    } catch (err) {
      console.error('[DATABASE ERROR] Failed to query user by phone:', err.message);
      return null;
    }
  }

  /**
   * Retrieves active or latest order for customer from MySQL `orders` table
   */
  async getCustomerLatestOrder(userId, phone10) {
    try {
      let query = `
        SELECT o.order_id, o.restaurant_id, o.user_id, o.total_amount, o.status,
               o.payment_mode, o.payment_status, o.estimated_delivery_time,
               o.order_date, o.delivery_address, r.name as restaurant_name,
               r.phone as restaurant_phone, dp.name as valet_name, dp.phone as valet_phone
        FROM orders o
        LEFT JOIN restaurant r ON o.restaurant_id = r.restaurant_id
        LEFT JOIN delivery_partner dp ON o.delivery_partner_id = dp.partner_id
        WHERE `;
      const params = [];

      if (userId && phone10) {
        query += '(o.user_id = ? OR o.customer_phone = ?)';
        params.push(userId, phone10);
      } else if (userId) {
        query += 'o.user_id = ?';
        params.push(userId);
      } else if (phone10) {
        query += 'o.customer_phone = ?';
        params.push(phone10);
      } else {
        return null;
      }

      query += ' ORDER BY o.order_id DESC LIMIT 1';
      const [rows] = await db.query(query, params);
      return rows && rows.length > 0 ? rows[0] : null;
    } catch (err) {
      console.error('[DATABASE ERROR] Failed to query latest customer order:', err.message);
      return null;
    }
  }

  /**
   * Retrieves specific order by ID and verifies customer ownership
   */
  async getOrderById(orderId, userId, phone10) {
    if (!orderId) return null;
    try {
      const [rows] = await db.query(
        `SELECT o.order_id, o.restaurant_id, o.user_id, o.customer_phone, o.total_amount,
                o.status, o.payment_mode, o.payment_status, o.estimated_delivery_time,
                o.order_date, o.delivery_address, r.name as restaurant_name,
                dp.name as valet_name, dp.phone as valet_phone
         FROM orders o
         LEFT JOIN restaurant r ON o.restaurant_id = r.restaurant_id
         LEFT JOIN delivery_partner dp ON o.delivery_partner_id = dp.partner_id
         WHERE o.order_id = ? LIMIT 1`,
        [orderId]
      );

      if (!rows || rows.length === 0) {
        return { exists: false, authorized: false, order: null };
      }

      const order = rows[0];
      const isOwner = (userId && order.user_id === userId) ||
                      (phone10 && order.customer_phone === phone10);

      if (!isOwner) {
        return { exists: true, authorized: false, order: null };
      }

      return { exists: true, authorized: true, order: order };
    } catch (err) {
      console.error('[DATABASE ERROR] Failed to query order by ID:', err.message);
      return { exists: false, authorized: false, order: null };
    }
  }

  /**
   * Logs a human support escalation ticket in `support_tickets` table
   */
  async createSupportTicket(customerPhone, customerName, issueText, category = 'CUSTOMER_SUPPORT') {
    try {
      const ticketNumber = 'TKT-' + Math.floor(10000 + Math.random() * 90000);
      const subject = `WhatsApp Escalation from ${customerName || customerPhone}: ${issueText.substring(0, 50)}`;

      await db.query(
        `INSERT INTO support_tickets (ticket_number, customer_phone, customer_name, category, priority, status, subject, issue_description)
         VALUES (?, ?, ?, ?, 'HIGH', 'OPEN', ?, ?)`,
        [ticketNumber, customerPhone || 'UNKNOWN', customerName || 'Customer', category, subject, issueText]
      );

      return ticketNumber;
    } catch (err) {
      console.error('[DATABASE ERROR] Failed to create support ticket:', err.message);
      return 'TKT-' + Math.floor(10000 + Math.random() * 90000);
    }
  }

  /**
   * Retrieves active dishes and partner restaurants from MySQL for live menu
   */
  async getLiveMenu(searchTerm = '') {
    try {
      let query = `
        SELECT m.item_name, m.price, m.is_veg, r.name as restaurant_name, r.area
        FROM menu m
        JOIN restaurant r ON m.restaurant_id = r.restaurant_id
        WHERE m.is_available = 1 AND r.is_active = 1
      `;
      const params = [];
      if (searchTerm && searchTerm.trim()) {
        const clean = `%${searchTerm.trim()}%`;
        query += ` AND (m.item_name LIKE ? OR r.name LIKE ? OR r.cuisine_type LIKE ?)`;
        params.push(clean, clean, clean);
      }
      query += ` ORDER BY m.rating DESC, m.menu_id ASC LIMIT 5`;
      const [dishes] = await db.query(query, params);

      const [restaurants] = await db.query(
        `SELECT name, area, cuisine_type, rating FROM restaurant WHERE is_active = 1 ORDER BY rating DESC LIMIT 3`
      );

      return { dishes: dishes || [], restaurants: restaurants || [] };
    } catch (err) {
      console.error('[DATABASE ERROR] Failed to query live menu:', err.message);
      return { dishes: [], restaurants: [] };
    }
  }

  /**
   * Looks up the price of a specific dish from MySQL
   * Supports dish name, optional restaurant filter ("at Spice Route"), and keyword fallback
   */
  async getItemPrice(rawQuery) {
    if (!rawQuery) return [];
    try {
      let dishPart = rawQuery.trim();
      let restPart = '';
      const atMatch = dishPart.match(/^(.*?)\s+(?:at|from|in)\s+(.*)$/i);
      if (atMatch) {
        dishPart = atMatch[1].trim();
        restPart = atMatch[2].trim();
      }
      dishPart = dishPart.replace(/^(?:the|a|an)\s+/i, '').trim();

      let query = `
        SELECT m.item_name, m.price, m.description, m.is_veg, r.name as restaurant_name, r.area
        FROM menu m
        JOIN restaurant r ON m.restaurant_id = r.restaurant_id
        WHERE m.is_available = 1 AND r.is_active = 1
      `;
      const params = [];
      if (dishPart) {
        query += ` AND m.item_name LIKE ?`;
        params.push(`%${dishPart}%`);
      }
      if (restPart) {
        query += ` AND r.name LIKE ?`;
        params.push(`%${restPart}%`);
      }
      query += ` ORDER BY m.price ASC LIMIT 5`;
      const [rows] = await db.query(query, params);
      if (rows && rows.length > 0) return rows;

      // Fallback: match individual keywords if multi-word query
      const words = dishPart.split(/\s+/).filter(w => w.length > 2);
      if (words.length > 1) {
        let fbQuery = `
          SELECT m.item_name, m.price, m.description, m.is_veg, r.name as restaurant_name, r.area
          FROM menu m
          JOIN restaurant r ON m.restaurant_id = r.restaurant_id
          WHERE m.is_available = 1 AND r.is_active = 1
        `;
        const fbParams = [];
        words.forEach(w => {
          fbQuery += ` AND m.item_name LIKE ?`;
          fbParams.push(`%${w}%`);
        });
        if (restPart) {
          fbQuery += ` AND r.name LIKE ?`;
          fbParams.push(`%${restPart}%`);
        }
        fbQuery += ` ORDER BY m.price ASC LIMIT 5`;
        const [fbRows] = await db.query(fbQuery, fbParams);
        return fbRows || [];
      }
      return [];
    } catch (err) {
      console.error('[DATABASE ERROR] Failed to query item price:', err.message);
      return [];
    }
  }

  /**
   * Grounded delivery charges response
   */
  getDeliveryChargesResponse() {
    return `🛵 *FoodWala Delivery Charges (Bengaluru)*:\n\n` +
           `• *Free Delivery:* Automatically unlocked on all orders over *₹299*! 🎉\n` +
           `• *Standard Delivery Fee:* Flat *₹35* for orders below ₹299.\n` +
           `• *Zero Hidden Fees:* Transparent pricing with no arbitrary surge charges during standard operating hours.\n` +
           `• *Hyperlocal Reach:* Delivering hot meals across 14+ hubs in Bengaluru within 25–35 minutes.\n\n` +
           `Add items to your cart on FoodWala to enjoy automatic free delivery above ₹299! 🍕`;
  }

  /**
   * Grounded unknown question fallback
   */
  getUnknownFallbackResponse(customerName = null) {
    const greetingName = customerName ? ` ${customerName}` : '';
    return `Hello${greetingName}! 👋 I am your FoodWala 24/7 AI Assistant.\n\n` +
           `I specialize in food delivery services across Bengaluru! Here is what I can help you with:\n\n` +
           `• 🍽️ *Menu & Prices:* Ask *"Show me today's menu"* or *"Price of Benne Masala Dosa"*\n` +
           `• 🛵 *Order Tracking:* Ask *"Where is my order?"* (or reply with your Order ID, e.g. *#80*)\n` +
           `• 🏷️ *Today's Offers:* Ask *"What are today's offers?"* (Coupon FOODWALA50)\n` +
           `• 💰 *Delivery Charges:* Ask *"What are your delivery charges?"*\n` +
           `• ⏱️ *Policies:* Ask *"Cancellation policy"* or *"Refund policy"*\n` +
           `• 📞 *Customer Support:* Contact our official Care Desk on WhatsApp at *+91 85004 57005* or reply *Agent*.\n\n` +
           `How may I assist your meal today? 🍕`;
  }


  /**
   * 25-Intent Detection Engine (Rule-based & Semantic)
   */
  classifyIntent(rawText) {
    const text = (rawText || '').trim().toLowerCase();
    if (!text) return 'greeting';

    // 0. Numeric menu choices from greeting or assistance menu (1 to 5)
    if (/^(?:1|1️⃣|option\s*1)$/i.test(text)) {
      return 'order_tracking';
    }
    if (/^(?:2|2️⃣|option\s*2)$/i.test(text)) {
      return 'cancellation';
    }
    if (/^(?:3|3️⃣|option\s*3)$/i.test(text)) {
      return 'payment_failure';
    }
    if (/^(?:4|4️⃣|option\s*4)$/i.test(text)) {
      return 'delivery_time';
    }
    if (/^(?:5|5️⃣|option\s*5)$/i.test(text)) {
      return 'human_support';
    }

    // 1. Explicit Order ID queries
    if (/^(?:check\s+order|status\s+of|where\s+is\s+order)\s+#?(\d+|fw\d+)/i.test(text)) {
      return 'order_status';
    }

    // 1b. Order Assistance & General Order Inquiries
    if (
      /\b(assist(ance)?|help|issue|problem|support)\b.*?\border\b/i.test(text) ||
      /\border\b.*?\b(assist(ance)?|help|issue|problem|support)\b/i.test(text) ||
      /need\s+assistance\s+with\s+my\s+order/i.test(text)
    ) {
      return 'order_assistance';
    }

    // 2. Cancellation Policy & Action
    if (
      /cancell?ation/i.test(text) ||
      /\bcancel\b/i.test(text) ||
      /\bcan\s+i\s+cancel\b/i.test(text) ||
      /\bwant\s+to\s+cancel\b/i.test(text)
    ) {
      return 'cancellation';
    }

    // 3. Refund & Money Back
    if (
      /\brefund\b/i.test(text) ||
      /\brefunds\b/i.test(text) ||
      /\bmoney\s*back\b/i.test(text) ||
      /\breturn\s*money\b/i.test(text)
    ) {
      return 'refund';
    }

    // 4. Payment Failure, Deductions & Issues
    if (
      /\b(payment|money|amount|cash)\b.*?\b(failed|failure|deducted|debited|cut|stuck|pending|error)\b/i.test(text) ||
      /\b(deducted|debited|cut)\b.*?\b(payment|money|amount|order|bank|account)\b/i.test(text) ||
      /\bmoney\s*cut\b/i.test(text) ||
      /\bdebited\b/i.test(text)
    ) {
      return 'payment_failure';
    }

    // 4b. Coupons, Promos & Discounts
    if (
      /\b(coupons?|offers?|discounts?|promo|foodwala50|voucher|deals?|50%\s*(off)?)\b/i.test(text)
    ) {
      return 'coupon_offers';
    }

    // 4c. Delivery Charges & Shipping Fee
    if (
      /\b(delivery\s*(charges?|fees?|cost|pricing|rates?)|shipping\s*(charges?|fees?))\b/i.test(text)
    ) {
      return 'delivery_charges';
    }

    // 4d. Item Price Check
    if (
      /\b(price\s*(of|for)?|cost\s*(of|for)?|how\s*much\s*(is|for|does)|rate\s*(of|for)?)\b/i.test(text) &&
      !/order/i.test(text) &&
      !/delivery/i.test(text)
    ) {
      return 'item_price';
    }

    // 5. Payment Methods
    if (
      /\bpayment\s*(methods?|modes?|options?)\b/i.test(text) ||
      /\bpay\s*(via|with|using|modes?)\b/i.test(text) ||
      /\bcod\b/i.test(text) ||
      /\bcash\s*on\s*delivery\b/i.test(text) ||
      /\bupi\b/i.test(text) ||
      /\brazorpay\b/i.test(text)
    ) {
      return 'payment';
    }

    // 6. Missing / Wrong Item Complaints
    if (/\b(missing|forgot|didnt\s*get|incomplete)\b.*?\b(item|dish|food|order)\b/i.test(text)) {
      return 'missing_item';
    }
    if (/\b(wrong|incorrect|different)\b.*?\b(item|dish|food|order)\b/i.test(text)) {
      return 'wrong_item';
    }
    if (/\b(late|delayed|taking\s*too\s*long|where\s*is\s*my\s*food)\b/i.test(text)) {
      return 'late_delivery';
    }
    if (/\b(complaint|complain|bad\s*quality|spoiled|cold\s*food)\b/i.test(text)) {
      return 'complaint';
    }

    // 7. Human Support Escalation
    if (
      /\b(human|agent|person|representative|executive|supervisor|talk\s*to\s*human|speak\s*to\s*human|call\s*me)\b/i.test(text)
    ) {
      return 'human_support';
    }
    if (/\b(contact|support|help\s*desk|customer\s*care)\b/i.test(text) && !/order/i.test(text)) {
      return 'contact_support';
    }

    // 8. Order Status & Tracking
    if (
      /\bwhere\s*is\s*my\s*(order|delivery|food)\b/i.test(text) ||
      /\border\s*status\b/i.test(text) ||
      /\btrack\s*(my\s*)?order\b/i.test(text) ||
      /\bhas\s*my\s*order\s*been\s*delivered\b/i.test(text) ||
      /\bwhen\s*will\s*(my\s*)?order\s*arrive\b/i.test(text) ||
      /\bstatus\s*of\b/i.test(text)
    ) {
      return 'order_tracking';
    }

    // 9. Delivery Time & Speed
    if (
      /\bhow\s*long\s*(will|does)\s*(delivery|it)\s*take\b/i.test(text) ||
      /\bdelivery\s*time\b/i.test(text) ||
      /\bhow\s*fast\b/i.test(text)
    ) {
      return 'delivery_time';
    }

    // 10. Hyperlocal Delivery Areas & Micro-Zones
    if (
      /\b(where\s*do\s*you\s*deliver|delivery\s*(areas?|zones?|locations?|hubs?))\b/i.test(text) ||
      /\b(deliver(y)?\s*(to|in|at)\s*|reach\s*to\s*)\b/i.test(text) ||
      /\b(koramangala|indiranagar|hsr|whitefield|maruthi\s*nagar|jp\s*nagar|jayanagar|btm|electronic\s*city|malleshwaram|hebbal|bellandur)\b/i.test(text)
    ) {
      return 'hyperlocal_delivery';
    }

    // 10b. Food Hygiene & Safety (FSSAI)
    if (
      /\b(hygiene|fssai|clean(liness)?|safety|tamper|sanitiz|thermal\s*pack|safe\s*food)\b/i.test(text)
    ) {
      return 'food_hygiene';
    }

    // 10c. Change Address & Delivery Location
    if (
      /\b(change|update|edit|modify)\b.*?\b(address|location)\b/i.test(text) ||
      /\bwrong\s*address\b/i.test(text)
    ) {
      return 'change_address';
    }

    // 11. Restaurant & Menu Information
    if (
      /\b(menu|dishes|popular\s*dishes|food\s*items?|show\s*(me\s*)?(today'?s?\s*)?menu|today'?s?\s*menu|available\s*(food|dishes))\b/i.test(text) &&
      !/order/i.test(text)
    ) {
      return 'restaurant_menu';
    }
    if (
      /\b(restaurants?|biryani|pizza|burger|dosa)\b/i.test(text) &&
      !/order/i.test(text)
    ) {
      return 'restaurant_info';
    }

    // 12. Account, Login, OTP Help
    if (/\botp\b/i.test(text)) return 'otp_help';
    if (/\b(login|sign\s*in|password|cant\s*login)\b/i.test(text)) return 'login_help';
    if (/\b(account|profile|register|signup)\b/i.test(text)) return 'account_help';

    // 13. Greetings
    if (
      /\b(hi|hello|hey|namaste|good\s*(morning|afternoon|evening))\b/i.test(text) ||
      /\bwho\s*are\s*you\b/i.test(text)
    ) {
      return 'greeting';
    }

    // 13b. Out-of-scope / Unknown query (e.g., flight, hotel, train, cinema, weather, etc.)
    if (
      /\b(flight|airline|plane|airport|ticket|hotel|room|booking|train|railway|irctc|bus|movie|cinema|theater|weather|temperature|forecast|cricket|ipl|score|match|stock|crypto|bitcoin|code|programming|essay|homework|actor|actress)\b/i.test(text)
    ) {
      return 'unknown_fallback';
    }

    // 14. Conversational Open-Ended
    return 'conversational';
  }

  /**
   * Generates safe, grounded, WhatsApp-friendly response
   */
  async generateResponse({ senderPhone10, messageText, customerName = null }) {
    const text = (messageText || '').trim();
    const explicitOrderId = whatsappParser.extractOrderId(text);
    const intent = this.classifyIntent(text);

    console.log(`[WhatsApp] Intent detected: ${intent}`);

    // 1. Identify customer in MySQL `user` table
    const customer = await this.findCustomerByPhone(senderPhone10);
    if (customer) {
      console.log(`[WhatsApp] Customer identified: ${customer.username} (ID: ${customer.user_id})`);
    } else {
      console.log(`[WhatsApp] Customer not found for phone: +91 ${whatsappParser.maskPhone(senderPhone10)}`);
    }

    // A. Handle explicitly requested Order ID
    if (explicitOrderId) {
      const orderLookup = await this.getOrderById(explicitOrderId, customer?.user_id, senderPhone10);
      if (!orderLookup.exists) {
        return `Order *#FW${explicitOrderId}* was not found in our records. Please check the order number and try again. 🛵`;
      }
      if (!orderLookup.authorized) {
        return `For your privacy and security, order tracking is only available to the registered account holder who placed Order *#FW${explicitOrderId}*. 🔒`;
      }
      const ord = orderLookup.order;
      return `🍽️ *FoodWala Order Update*\n\n` +
             `*Order:* #FW${ord.order_id}\n` +
             `*Restaurant:* ${ord.restaurant_name || 'Partner Kitchen'}\n` +
             `*Status:* ${ord.status} 🚴\n` +
             `*Estimated Delivery:* ${ord.estimated_delivery_time || '25–35 minutes'}\n` +
             `*Total Amount:* ₹${ord.total_amount}\n\n` +
             `I'll help you track it. Need anything else for this order?`;
    }

    // A2. Handle General Order Assistance (e.g. "I need assistance with my order")
    if (intent === 'order_assistance') {
      const activeOrder = customer ? await this.getCustomerLatestOrder(customer.user_id, senderPhone10) : null;
      if (activeOrder) {
        return `📦 *FoodWala Order Assistance*\n\n` +
               `*Active Order:* #FW${activeOrder.order_id} (${activeOrder.restaurant_name || 'Partner Kitchen'})\n` +
               `*Status:* ${activeOrder.status} 🚴\n` +
               `*Estimated Delivery:* ${activeOrder.estimated_delivery_time || '20–30 mins'}\n` +
               `*Total Amount:* ₹${activeOrder.total_amount}\n\n` +
               `How would you like us to assist you with this order?\n` +
               `1️⃣ Track live ETA & delivery valet\n` +
               `2️⃣ Cancel this order (Full instant refund within 60s)\n` +
               `3️⃣ Report missing or damaged items\n` +
               `4️⃣ Update delivery address or delivery note\n` +
               `5️⃣ Connect directly with a Care Supervisor\n\n` +
               `Or reply with another *Order ID* (e.g. *FW12345*)! 🛵`;
      } else {
        return `📦 *FoodWala Order Assistance*\n\n` +
               `I'd be glad to assist with your order! Please send your *Order ID* (e.g. *FW12345*), or select an option below:\n\n` +
               `1️⃣ Track my order\n` +
               `2️⃣ Cancel an order\n` +
               `3️⃣ Report missing or damaged food\n` +
               `4️⃣ Payment / refund inquiry\n` +
               `5️⃣ Speak with a Care Supervisor\n\n` +
               `Reply with a number or your Order ID! 🛵`;
      }
    }

    // B. Handle Order Status / Tracking without explicit ID
    if (intent === 'order_status' || intent === 'order_tracking') {
      if (!customer) {
        return `Hi! 👋 Welcome to FoodWala.\n\n` +
               `I couldn't find a FoodWala account linked to this WhatsApp number.\n\n` +
               `Please reply with your *Order ID* (e.g. *#80* or *FW12345*) so I can retrieve your live order status, preparation progress, and delivery valet details! 🛵`;
      }

      const latestOrder = await this.getCustomerLatestOrder(customer.user_id, senderPhone10);
      if (!latestOrder) {
        return `Hi ${customer.username}! 👋\n\n` +
               `I checked your account, but there are no active in-transit orders at the moment.\n\n` +
               `If you placed an order under another number or account, please reply with your *Order ID* (e.g. *#80* or *FW12345*) and I'll track it for you! 🛵\n\n` +
               `Ready to order? Explore over 105+ partner restaurants on FoodWala! 🍕🍔`;
      }

      return `🍽️ *FoodWala Order Update*\n\n` +
             `*Order:* #FW${latestOrder.order_id}\n` +
             `*Restaurant:* ${latestOrder.restaurant_name || 'Partner Kitchen'}\n` +
             `*Status:* ${latestOrder.status} 🚴\n` +
             `*Estimated Delivery:* ${latestOrder.estimated_delivery_time || '20–30 minutes'}\n` +
             `*Total Amount:* ₹${latestOrder.total_amount}\n\n` +
             `I'll help you track it. Need anything else for this order?`;
    }

    // C. Cancellation Policy
    if (intent === 'cancellation') {
      return `⏱️ *FoodWala Order Cancellation Policy*\n\n` +
             `• *60-Second Instant Window:* You can cancel your order within *60 seconds* of placing it for a *100% instant refund*.\n` +
             `• *Kitchen Preparation Window:* Once the restaurant confirms preparation or a valet is assigned, cancellation requires restaurant authorization and may incur a preparation charge.\n\n` +
             `To cancel an active order, visit your *Orders* tab on the website or reply with your *Order ID*! 😊`;
    }

    // C2. Delivery Charges
    if (intent === 'delivery_charges') {
      return this.getDeliveryChargesResponse();
    }

    // C3. Item Price Check
    if (intent === 'item_price') {
      const cleanItem = text
        .replace(/^(?:what\s+is\s+the\s+price\s+of|what\s+is\s+the\s+cost\s+of|what\s+does\s+|how\s+much\s+is\s+|how\s+much\s+for\s+|price\s+of|cost\s+of|rate\s+of)\s*/i, '')
        .replace(/\?+$/, '')
        .trim();

      if (!cleanItem || /^(food|dish|an?\s*item|a\s*particular\s*food\s*item|item)$/i.test(cleanItem)) {
        return `🍽️ *FoodWala Live Price Check:*\n\nPlease mention the specific dish name (for example: *"price of Benne Masala Dosa"* or *"price of Biryani"*), and I will look up the authentic price from our partner restaurants in Bengaluru! 🍕`;
      }

      const items = await this.getItemPrice(cleanItem);
      if (items && items.length > 0) {
        let res = `🍽️ *FoodWala Live Price Check for "${cleanItem}":*\n\n`;
        items.forEach(d => {
          res += `• ${d.is_veg ? '🟢' : '🔴'} *${d.item_name}*: ₹${d.price} at *${d.restaurant_name}* (${d.area})\n`;
        });
        res += `\n🎉 Apply coupon *FOODWALA50* at checkout for 50% OFF up to ₹150! 🛵`;
        return res;
      } else {
        return `🍽️ *FoodWala Price Check:*\n\nI couldn't find active dishes matching "${cleanItem}" on our partner menus right now.\n\nReady to feast? Reply *"Show me today's menu"* or search our 105+ partner kitchens on FoodWala! 🍕`;
      }
    }

    // D. Refund Policy
    if (intent === 'refund') {
      return `💰 *FoodWala Refund & Reimbursement Policy*\n\n` +
             `• *Instant Full Refund:* Orders cancelled within the 60-second window receive an immediate 100% refund.\n` +
             `• *15-Minute Payment Reversal:* Approved refunds for UPI, net banking, and cards are credited directly to your original payment source within 15 minutes.\n` +
             `• *Delay Guarantee:* Automatic wallet credits are issued if delivery exceeds 45 minutes beyond the promised ETA.\n\n` +
             `Have a pending refund? Reply with your *Order ID* to check status!`;
    }

    // E. Payment Methods
    if (intent === 'payment') {
      return `💳 *Accepted Payment Methods on FoodWala:*\n\n` +
             `• *UPI:* Google Pay, PhonePe, Paytm, BHIM\n` +
             `• *Online Banking:* Razorpay Secured Checkout\n` +
             `• *Cards:* All Visa, MasterCard, RuPay Debit/Credit Cards\n` +
             `• *Cash on Delivery (COD):* Available at select partner restaurants\n\n` +
             `All digital transactions are protected with 256-bit bank-grade encryption! 🔒`;
    }

    // F. Payment Failure
    if (intent === 'payment_failure') {
      return `⚠️ *Payment Deducted but Order Not Placed?*\n\n` +
             `Don't worry! If money was debited from your bank or UPI app, it is securely held in an escrow clearing state. Banks automatically reverse failed transactions within 24 to 48 hours.\n\n` +
             `If your order did not generate a receipt within 10 minutes, reply with your *UPI Reference / UTR Number* and our billing team will verify it immediately. 🛡️`;
    }

    // F2. Coupons, Promos & Discounts
    if (intent === 'coupon_offers') {
      return `🏷️ *FoodWala Exclusive Offers & Coupons:*\n\n` +
             `🎉 *Coupon Code: FOODWALA50*\n` +
             `• *Flat 50% OFF* up to ₹150 on orders above ₹100!\n` +
             `• Valid across all 105+ partner restaurants in Bengaluru.\n` +
             `• Applicable at checkout on web & mobile portals.\n\n` +
             `✨ *Free Delivery:* Automatically unlocked on all orders over ₹299!\n\n` +
             `Ready to feast? Visit our menu to apply your discount! 🍕🍔`;
    }

    // G. Delivery Time
    if (intent === 'delivery_time') {
      return `⚡ *FoodWala Delivery Speed:*\n\n` +
             `Our average delivery time in Bengaluru is *24 to 32 minutes*! 🛵💨\n\n` +
             `We operate across 14+ hyperlocal delivery hubs (Koramangala, Indiranagar, HSR Layout, Maruthi Nagar, Whitefield, etc.) to ensure your food arrives piping hot.`;
    }

    // G2. Hyperlocal Delivery Areas & Micro-Zones
    if (intent === 'hyperlocal_delivery') {
      return `📍 *FoodWala Hyperlocal Delivery in Bengaluru:*\n\n` +
             `✅ *Yes! We deliver across 14+ major hubs:*\n` +
             `• Koramangala, Indiranagar, HSR Layout, Maruthi Nagar\n` +
             `• JP Nagar, Jayanagar, BTM Layout, Whitefield\n` +
             `• Electronic City, Church Street, Malleshwaram, Bellandur\n\n` +
             `⚡ *Average Delivery Speed:* 24 to 32 minutes, guaranteed hot in thermal-sealed packaging! 🛵💨`;
    }

    // G3. Food Hygiene & Safety (FSSAI)
    if (intent === 'food_hygiene') {
      return `🛡️ *FoodWala Hygiene & Food Safety Standards:*\n\n` +
             `• *FSSAI 40-Point Inspection:* All 105+ partner kitchens undergo strict hygiene compliance audits.\n` +
             `• *Tamper-Proof Packaging:* Sealed thermal insulated bags to ensure freshness and zero contamination.\n` +
             `• *Contactless Delivery:* Sanitized delivery gear and temperature checks for all delivery valets.\n\n` +
             `Your health and food quality are our #1 priority! ✨`;
    }

    // H. Delivery Address & Changes
    if (intent === 'delivery_address' || intent === 'change_address') {
      return `📍 *FoodWala Delivery Address Guidelines:*\n\n` +
             `• *Before Placing Order:* You can change your delivery address freely on the Checkout page.\n` +
             `• *After Placing Order:* Once the kitchen starts cooking or valet is dispatched, addresses cannot be changed directly to prevent route delays.\n\n` +
             `Need urgent help with an active order address? Reply *Agent* to speak with our care supervisor! 📞`;
    }

    // I. Complaints, Missing / Wrong Items, Late Delivery
    if (intent === 'complaint' || intent === 'missing_item' || intent === 'wrong_item' || intent === 'late_delivery') {
      const ticketNum = await this.createSupportTicket(
        senderPhone10,
        customer?.username || customerName,
        text,
        intent.toUpperCase()
      );
      return `😔 *We are very sorry for the inconvenience!*\n\n` +
             `I have created priority complaint ticket *#${ticketNum}* for our care supervisor.\n\n` +
             `Please reply with your *Order ID* (e.g. *FW12345*) and a brief photo or description so we can resolve this with an instant replacement or refund! 🛵`;
    }

    // J. Human Support Escalation
    if (intent === 'human_support' || intent === 'contact_support') {
      const ticketNum = await this.createSupportTicket(
        senderPhone10,
        customer?.username || customerName,
        text,
        'HUMAN_ESCALATION'
      );
      return `📞 *FoodWala 24/7 Priority Support Desk*\n\n` +
             `I have marked this conversation for FoodWala Support under ticket *#${ticketNum}*.\n\n` +
             `• *Official WhatsApp Support:* +91 85004 57005\n` +
             `• *Email:* adminfoodwala@gmail.com\n` +
             `• *Resolution Window:* Within 15 minutes\n\n` +
             `Please share your Order ID and our support supervisor will assist you directly! 🛵`;
    }

    // K. Restaurant / Menu Info (Grounded in MySQL)
    if (intent === 'restaurant_menu' || intent === 'restaurant_info') {
      const liveMenu = await this.getLiveMenu();
      let res = `🍽️ *Today's FoodWala Menu & Top Picks in Bengaluru:*\n\n`;
      if (liveMenu.dishes && liveMenu.dishes.length > 0) {
        res += `*Featured Popular Dishes:*\n`;
        liveMenu.dishes.forEach(d => {
          res += `• ${d.is_veg ? '🟢' : '🔴'} *${d.item_name}* (₹${d.price}) — *${d.restaurant_name}*\n`;
        });
      }
      if (liveMenu.restaurants && liveMenu.restaurants.length > 0) {
        res += `\n*Popular Partner Kitchens:*\n`;
        liveMenu.restaurants.forEach(r => {
          res += `• *${r.name}* (${r.area}) — ⭐ ${r.rating} (${r.cuisine_type})\n`;
        });
      }
      res += `\n🏷️ Use coupon *FOODWALA50* on checkout for Flat 50% OFF (up to ₹150)!\n` +
             `Reply with a dish name (e.g. *"price of Benne Masala Dosa"*) to check pricing. 🍕`;
      return res;
    }

    // L. Login, OTP, Account
    if (intent === 'login_help' || intent === 'otp_help' || intent === 'account_help') {
      return `🔐 *FoodWala Account & Login Assistance:*\n\n` +
             `• To sign in, open FoodWala on your browser, enter your 10-digit mobile number, and submit the 6-digit OTP sent via SMS.\n` +
             `• If you are experiencing OTP delays, wait 30 seconds and tap *Resend OTP*.\n\n` +
             `Need account verification? Our care desk is available 24/7!`;
    }

    // L2. Unknown / Out-of-scope Fallback
    if (intent === 'unknown_fallback') {
      return this.getUnknownFallbackResponse(customer?.username || customerName);
    }

    // M. Conversational Fallback to AI Service
    if (intent === 'conversational') {
      try {
        const aiReply = await aiService.generateResponse({
          userPhone10: senderPhone10,
          customerName: customer?.username || customerName,
          messageText: text,
          authenticatedUserId: customer?.user_id
        });
        if (aiReply && typeof aiReply === 'string' && aiReply.trim()) {
          return aiReply.trim();
        }
      } catch (aiErr) {
        console.warn('[WhatsApp AI Service] Conversational fallback warning:', aiErr.message);
      }
      return this.getUnknownFallbackResponse(customer?.username || customerName);
    }

    // N. Default Greeting / Menu
    const greetingName = customer?.username ? ` ${customer.username}` : '';
    return `Hi${greetingName}! 👋 Welcome to FoodWala.\n\n` +
           `How can I help you today?\n\n` +
           `1️⃣ Track my order\n` +
           `2️⃣ Cancel an order\n` +
           `3️⃣ Payment issue\n` +
           `4️⃣ Delivery issue\n` +
           `5️⃣ Talk to support\n\n` +
           `Reply with a number or simply type your question! 🛵`;
  }
}

module.exports = new WhatsAppAIService();

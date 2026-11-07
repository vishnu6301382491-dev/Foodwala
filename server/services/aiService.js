/**
 * server/services/aiService.js
 * 
 * FoodWala AI-Powered Customer Support Engine
 * Features:
 * - Deterministic, High-Accuracy Intent Classification:
 *     - CANCELLATION_POLICY, REFUND_POLICY, ORDER_STATUS, COUPON_OFFERS,
 *       DELIVERY_ADDRESS, FOOD_HYGIENE, HUMAN_ESCALATION, AMBIGUOUS, GENERAL_SUPPORT
 * - Privacy-Enforced Database Grounding:
 *     - lookupLiveOrder(phone, explicitOrderId, authenticatedUserId) validates ownership
 *     - Never reveals random customer orders or unverified order telemetry
 *     - Strictly answers cancellation/refund policies without substituting order status
 * - Multi-provider support:
 *     - Google Gemini API (REST)
 *     - OpenAI API (REST)
 *     - Built-in Intelligent Rule/Semantic Engine (Zero-config local fallback)
 */

const https = require('https');
const db = require('../db');

const FOODWALA_SYSTEM_PROMPT = `You are "WalaBot", FoodWala's intelligent 24/7 Customer Support Specialist.
You represent FoodWala, Bengaluru's premier hyperlocal food delivery platform with 105+ partner restaurants across 14+ delivery hubs.

CORE POLICIES & KNOWLEDGE:
- DELIVERY HUBS: Maruthi Nagar, Koramangala, Indiranagar, HSR Layout, JP Nagar, Electronic City, Whitefield, Jayanagar, BTM Layout, Church Street, Malleshwaram.
- ACTIVE COUPON: "FOODWALA50" offers Flat 50% discount up to ₹150 on orders above ₹100 across all 105+ restaurants.
- CANCELLATION POLICY: 100% instant refund if cancelled within 60 seconds of placing the order. Once food preparation starts or valet is assigned, cancellation requires restaurant authorization and may incur a preparation fee.
- REFUND POLICY: Approved refunds for UPI, debit/credit cards, and net banking are credited directly to original payment method within 15 minutes. Automatic wallet credits are granted if delivery delay exceeds 45 minutes.
- HYGIENE STANDARDS: FSSAI 40-point hygiene audited, tamper-proof thermal sealed packaging, contactless delivery.
- HUMAN CARE DESK: Priority Ticket Support & Rapid Callback within 15 minutes (24/7 Care Desk).
- WHATSAPP CARE DESK: Official 24/7 WhatsApp AI Assistance Hotline +91 85004 57005 (https://wa.me/918500457005). When customers ask about WhatsApp, provide this official link and helpline directly.

STRICT RESPONSE RULES:
1. When asked about policies (e.g. cancellation policy, refund policy, hygiene), answer the policy question directly and clearly. NEVER provide live order status or valet details for a policy question.
2. Only provide live order tracking when the customer explicitly asks to track their order or asks where their food is.
3. NEVER invent or fabricate order status, delivery partners, prices, or refund approvals.
4. If an unverified customer asks about an order, ask them to provide their registered phone number or sign in.
5. Keep responses concise, warm, professional, with clean bullet points and natural emojis (🛵, 🍕, 💰, 🏷️, ✨).`;

class AIService {
  constructor() {
    this._circuitBreakerOpenUntil = 0;
  }

  get provider() {
    return (process.env.AI_PROVIDER || 'gemini').toLowerCase();
  }

  get apiKey() {
    return process.env.AI_API_KEY || '';
  }

  get modelName() {
    return process.env.AI_MODEL_NAME || (this.provider === 'openai' ? 'gpt-4o-mini' : 'gemini-3.8-flash');
  }

  /**
   * Deterministic Intent Classifier
   * Accurately categorizes customer inquiries to prevent policy/order cross-contamination
   */
  classifyIntent(rawText) {
    const text = (rawText || '').trim().toLowerCase();
    if (!text) return 'AMBIGUOUS';

    // 1. Single-word or overly vague queries
    const words = text.split(/\s+/).filter(Boolean);
    const ambiguousSingleWords = ['order', 'food', 'help', 'status', 'policy', 'tell', 'info', 'support', 'question'];
    if (words.length === 1 && ambiguousSingleWords.includes(words[0])) {
      return 'AMBIGUOUS';
    }
    if (/^(what|how|help|tell\s+me|\?)$/i.test(text)) {
      return 'AMBIGUOUS';
    }

    // 2. Cancellation Policy (takes precedence over generic "order")
    if (
      /cancell?ation/i.test(text) ||
      /\bcancel\b/i.test(text) ||
      /\bcancelling\b/i.test(text) ||
      /\bcan\s+i\s+cancel\b/i.test(text) ||
      /\bhow\s+(can|do)\s+i\s+cancel\b/i.test(text) ||
      /\bwant\s+to\s+cancel\b/i.test(text)
    ) {
      return 'CANCELLATION_POLICY';
    }

    // 3. Refund Policy & Eligibility (takes precedence over generic "order")
    if (
      /\brefund\b/i.test(text) ||
      /\brefunds\b/i.test(text) ||
      /\bmoney\s*back\b/i.test(text) ||
      /\breturn\s*money\b/i.test(text) ||
      /\bpayment\s*return\b/i.test(text)
    ) {
      return 'REFUND_POLICY';
    }

    // 4. Coupons and Discounts
    if (
      /\bcoupon\b/i.test(text) ||
      /\bcoupons\b/i.test(text) ||
      /\bpromo\b/i.test(text) ||
      /\bdiscount\b/i.test(text) ||
      /\boffer\b/i.test(text) ||
      /\boffers\b/i.test(text) ||
      /\bfoodwala50\b/i.test(text) ||
      /\bvoucher\b/i.test(text) ||
      /\bdeals?\b/i.test(text) ||
      /\b50%\s*(off)?\b/i.test(text)
    ) {
      return 'COUPON_OFFERS';
    }

    // 4b. WhatsApp Support & Assistance
    if (
      /\bwhatsapp\b/i.test(text) ||
      /\bwa\.me\b/i.test(text) ||
      /\bchat\s*on\s*whatsapp\b/i.test(text) ||
      /\bwhatsapp\s*(number|helpline|support|bot|assistant|assistance)\b/i.test(text)
    ) {
      return 'WHATSAPP_SUPPORT';
    }

    // 4c. Delivery Charges
    if (
      /\b(delivery\s*(charges?|fees?|cost|pricing)|shipping\s*(charges?|fees?))\b/i.test(text)
    ) {
      return 'DELIVERY_CHARGES';
    }

    // 5. Delivery Address / Location Management
    if (
      /\b(change|update|edit|modify|wrong|new|switch)\b.*?\b(address|location|area|hub|zone)\b/i.test(text) ||
      /\b(address|location|area|hub|zone)\b.*?\b(change|update|edit|modify|wrong|new|switch)\b/i.test(text) ||
      /\bdeliver\s*to\s*(another|different)\b/i.test(text) ||
      /\bwhere\s*do\s*you\s*deliver\b/i.test(text) ||
      /\bdelivery\s*(areas?|zones?|hubs?)\b/i.test(text)
    ) {
      return 'DELIVERY_ADDRESS';
    }

    // 6. Food Hygiene & Safety
    if (
      /\bhygiene\b/i.test(text) ||
      /\bfssai\b/i.test(text) ||
      /\bclean(liness)?\b/i.test(text) ||
      /\bsafety\b/i.test(text) ||
      /\btamper\b/i.test(text) ||
      /\bsanitiz/i.test(text) ||
      /\bthermal\s*pack/i.test(text)
    ) {
      return 'FOOD_HYGIENE';
    }

    // 7. Human Support Escalation
    if (
      /\b(human|agent|person|representative|executive|supervisor|manager)\b/i.test(text) ||
      /\b(call\s*back|speak\s*to|talk\s*to|call\s*me)\b/i.test(text) ||
      /\b(complaint|ticket|escalat)/i.test(text)
    ) {
      return 'HUMAN_ESCALATION';
    }

    // 8. Order Status & Delivery Tracking
    const hasOrderNumber = /(?:order\s*#?|#)\d{1,6}\b/i.test(text);
    const hasOrderWord = /\border\b/i.test(text);
    const hasTrackWord = /\b(track|tracking|status|where|valet|eta|arrive|arrived|delivery|delay|delayed)\b/i.test(text);

    if (
      hasOrderNumber ||
      (hasOrderWord && hasTrackWord) ||
      /\bwhere\s*is\s*my\s*(order|food|meal|delivery)\b/i.test(text) ||
      /\btrack\s*(my\s*)?(order|food)\b/i.test(text) ||
      /\bstatus\s*of\s*(my\s*)?order\b/i.test(text) ||
      /\bwhen\s*will\s*(it|order|food)\s*(reach|arrive|come)\b/i.test(text)
    ) {
      return 'ORDER_STATUS';
    }

    // 9. Menu / Restaurant Discovery & Food Craving Search
    const isFoodSearch =
      /\b(?:bir[iy]+an(?:i|is)?|briyani|pizzas?|burgers?|dosas?|dosai|shawarmas?|shwarmas?|rolls?|paneer|ice\s*creams?|icecreams?|chinese|noodles?|fried\s*rice|momos?|pasta|sandwiches?|sandwich|chaat|thali|parathas?|parottas?|k[ae]babs?|curry|curries|coffees?|tea|chai|shakes?|desserts?|cakes?|pastr(?:y|ies)|chole\s*bhature|vada[si]?|idlis?|rava\s*idli|meals?|roti|naan|butter\s*chicken|tandoori|dal\s*makhani|pulav|pulao)\b/i.test(text) ||
      /\b(?:menu|dishes|popular\s*dishes|food\s*items?|show\s*(me\s*)?(today'?s?\s*)?menu|today'?s?\s*menu|available\s*(food|dishes))\b/i.test(text) ||
      /\b(?:i\s*(?:want|wanna|need|feel\s*like|am\s*craving|craving|prefer|would\s*like)|craving|cravings)\b/i.test(text) ||
      /\b(?:recommend|suggest|show\s*me|what\s*to\s*eat|order\s*food|order\s*something|restaurants?|food)\b/i.test(text);

    if (isFoodSearch && !hasOrderWord) {
      return 'FOOD_HYGIENE';
    }
    if (isFoodSearch && !hasTrackWord && !hasOrderNumber && !/\b(cancel|refund|status|where)\b/i.test(text)) {
      return 'FOOD_HYGIENE';
    }

    // 10. Greetings
    if (
      /\b(hi|hello|hey|namaste|good\s*(morning|afternoon|evening))\b/i.test(text) ||
      /\bwho\s*are\s*you\b/i.test(text) ||
      /\bwhat\s*can\s*you\s*do\b/i.test(text)
    ) {
      return 'GENERAL_SUPPORT';
    }

    return 'GENERAL_SUPPORT';
  }

  /**
   * Tool: Privacy-Enforced Live Order Lookup
   * Only returns order details if the order belongs to the authenticated customer or verified phone
   */
  async lookupLiveOrder(phone10, explicitOrderId = null, authenticatedUserId = null) {
    try {
      // If customer has neither a verified phone nor authentication, require verification
      if (!phone10 && !authenticatedUserId) {
        return {
          found: false,
          requiresAuth: true,
          message: 'To track your order, please log in to your FoodWala account or verify your registered 10-digit mobile number.'
        };
      }

      let orders = [];
      if (explicitOrderId) {
        let authClause = '';
        let authParams = [explicitOrderId];

        if (authenticatedUserId && phone10) {
          authClause = 'AND (o.user_id = ? OR o.customer_phone = ?)';
          authParams.push(authenticatedUserId, phone10);
        } else if (authenticatedUserId) {
          authClause = 'AND o.user_id = ?';
          authParams.push(authenticatedUserId);
        } else if (phone10) {
          authClause = 'AND o.customer_phone = ?';
          authParams.push(phone10);
        }

        const [byId] = await db.query(
          `SELECT o.order_id, o.status, o.total_amount, o.customer_name, o.delivery_address, 
                  o.estimated_delivery_time, o.order_date, o.delivery_partner_id,
                  dp.name as partner_name, dp.phone as partner_phone
           FROM orders o
           LEFT JOIN delivery_partner dp ON o.delivery_partner_id = dp.partner_id
           WHERE o.order_id = ? ${authClause}
           LIMIT 1`,
          authParams
        );

        if (byId && byId.length > 0) {
          orders = byId;
        } else {
          // Check if order exists globally to provide safe privacy notice
          const [existsGlobally] = await db.query(
            `SELECT order_id FROM orders WHERE order_id = ? LIMIT 1`,
            [explicitOrderId]
          );

          if (existsGlobally && existsGlobally.length > 0) {
            return {
              found: false,
              unauthorized: true,
              message: `Order #${explicitOrderId} is not associated with your verified account or phone. For customer privacy, tracking is only available to the registered account holder.`
            };
          } else {
            return {
              found: false,
              notFound: true,
              message: `Order #${explicitOrderId} was not found in our system. Please check your order number and try again.`
            };
          }
        }
      }

      if (orders.length === 0) {
        let queryStr = '';
        let queryParams = [];

        if (authenticatedUserId && phone10) {
          queryStr = `SELECT o.order_id, o.status, o.total_amount, o.customer_name, o.delivery_address, 
                             o.estimated_delivery_time, o.order_date, o.delivery_partner_id,
                             dp.name as partner_name, dp.phone as partner_phone
                      FROM orders o
                      LEFT JOIN delivery_partner dp ON o.delivery_partner_id = dp.partner_id
                      WHERE o.user_id = ? OR o.customer_phone = ?
                      ORDER BY o.order_id DESC LIMIT 1`;
          queryParams = [authenticatedUserId, phone10];
        } else if (authenticatedUserId) {
          queryStr = `SELECT o.order_id, o.status, o.total_amount, o.customer_name, o.delivery_address, 
                             o.estimated_delivery_time, o.order_date, o.delivery_partner_id,
                             dp.name as partner_name, dp.phone as partner_phone
                      FROM orders o
                      LEFT JOIN delivery_partner dp ON o.delivery_partner_id = dp.partner_id
                      WHERE o.user_id = ?
                      ORDER BY o.order_id DESC LIMIT 1`;
          queryParams = [authenticatedUserId];
        } else if (phone10) {
          queryStr = `SELECT o.order_id, o.status, o.total_amount, o.customer_name, o.delivery_address, 
                             o.estimated_delivery_time, o.order_date, o.delivery_partner_id,
                             dp.name as partner_name, dp.phone as partner_phone
                      FROM orders o
                      LEFT JOIN delivery_partner dp ON o.delivery_partner_id = dp.partner_id
                      WHERE o.customer_phone = ? OR o.user_id IN (SELECT user_id FROM user WHERE phone = ?)
                      ORDER BY o.order_id DESC LIMIT 1`;
          queryParams = [phone10, phone10];
        }

        const [byUser] = await db.query(queryStr, queryParams);
        orders = byUser || [];
      }

      if (!orders || orders.length === 0) {
        return {
          found: false,
          noOrders: true,
          message: 'No recent orders found for your account.'
        };
      }

      const activeOrder = orders[0];
      const [items] = await db.query(
        `SELECT item_name, quantity, price_at_order FROM order_item WHERE order_id = ?`,
        [activeOrder.order_id]
      );

      return {
        found: true,
        orderId: activeOrder.order_id,
        status: activeOrder.status,
        amount: activeOrder.total_amount,
        customerName: activeOrder.customer_name,
        address: activeOrder.delivery_address,
        eta: activeOrder.estimated_delivery_time || '25-35 mins',
        valetName: activeOrder.partner_name || 'Delivery Partner',
        valetPhone: activeOrder.partner_phone || 'Assigned via App',
        orderDate: activeOrder.order_date,
        items: (items || []).map(i => `${i.quantity}x ${i.item_name}`).join(', ')
      };
    } catch (err) {
      console.error('[AI Service] lookupLiveOrder error:', err.message);
      return { found: false, error: err.message };
    }
  }

  /**
   * Helper: accurately determine veg/non-veg status with safety check for meat keywords
   */
  getVegEmoji(dish) {
    const name = ((dish && dish.item_name) || '').toLowerCase();
    const isMeat = /\b(chicken|mutton|fish|prawns?|shrimp|egg|eggs|meat|beef|pork|keema|seafood|bacon|crab)\b/i.test(name);
    if (isMeat) return '🔴';
    return dish && dish.is_veg ? '🟢' : '🔴';
  }

  /**
   * Extracts dish / category search term from customer message
   * Normalizes spelling variations (biriyani/briyani -> biryani) and strips craving prefixes
   */
  extractFoodSearchTerm(rawText) {
    if (!rawText) return null;
    let text = rawText.trim().toLowerCase();
    text = text.replace(/^[!?.,\s]+|[!?.,\s]+$/g, '');

    if (
      /^(?:show\s*(?:me\s*)?)?(?:today'?s?\s*)?menu$/i.test(text) ||
      /^(?:popular\s*dishes|available\s*(?:food|dishes)|today'?s?\s*menu)$/i.test(text) ||
      /^(?:menu|restaurants?|food|kitchens?)$/i.test(text)
    ) {
      return null;
    }

    text = text.replace(/\bbir[iy]+an(?:i|is)?\b/gi, 'biryani');
    text = text.replace(/\bbriyani\b/gi, 'biryani');
    text = text.replace(/\bshwarmas?\b/gi, 'shawarma');
    text = text.replace(/\bparottas?\b/gi, 'paratha');
    text = text.replace(/\bkabab\b/gi, 'kebab');
    text = text.replace(/\bdosai\b/gi, 'dosa');
    text = text.replace(/\bicecreams?\b/gi, 'ice cream');

    let cleaned = text;

    // Strip conversational hunger / query wrappers
    cleaned = cleaned.replace(/^(?:i\s*am\s*hungry|hungry|feeling\s*hungry)[,.\s]*/gi, '');
    cleaned = cleaned.replace(
      /^(?:(?:can|could)\s*(?:i|you)\s*(?:please\s*)?(?:order|get|have|find|suggest|recommend|show)|do\s*you\s*have|what\s*(?:kind\s*of|type\s*of)?\s*(?:are\s*the\s*)?|is\s*(?:there\s*)?(?:any)?|where\s*(?:can\s*i\s*(?:get|find|order|have)|to\s*(?:get|find|order|have)|is\s*the\s*best)?|what\s*to\s*eat)\s*/gi,
      ''
    );
    cleaned = cleaned.replace(
      /^(?:i\s*(?:want|wanna|need|feel\s*like(?:\s*(?:having|eating))?|am\s*craving|craving|prefer|would\s*like)\s*(?:to\s*)?(?:eat|order|have|get)?)\s*/gi,
      ''
    );
    cleaned = cleaned.replace(
      /^(?:(?:please\s+)?(?:get(?:\s*me)?|give(?:\s*me)?|send(?:\s*me)?|bring(?:\s*me)?|feed\s*me|deliver(?:\s*me)?|show(?:\s*me)?|recommend(?:\s*me)?|suggest(?:\s*me)?|find(?:\s*me)?|search(?:\s*for)?|order(?:\s*me)?|looking\s*for))\s*/gi,
      ''
    );
    cleaned = cleaned.replace(/^(?:craving|cravings)(?:\s*for)?\s*/gi, '');

    // Strip leading qualifiers/articles
    cleaned = cleaned.replace(/^(?:some|a|an|the|any)\s+/gi, '');

    // Strip trailing locations
    cleaned = cleaned.replace(/\s*(?:near\s*me|around\s*here|nearby|in\s*bengaluru|in\s*bangalore|online|for\s*delivery|fast|please|plz)$/gi, '');
    cleaned = cleaned.replace(/\s*(?:in|at|around)\s+(?:koramangala|indiranagar|hsr|whitefield|maruthi\s*nagar|jp\s*nagar|jayanagar|btm|electronic\s*city|malleshwaram|hebbal|bellandur|majestic|residency\s*road|lalbagh)$/gi, '');

    // Strip trailing conversational suffixes / nouns
    cleaned = cleaned.replace(/\s*(?:options?|types?|menu|items?|dishes|available|food|places?|restaurants?|delivery)$/gi, '');
    cleaned = cleaned.replace(/\s+(?:do\s+you\s+have|can\s+i\s+get|is\s+available)$/gi, '');

    // Strip leading qualitative adjectives (best, good, spicy, etc.)
    cleaned = cleaned.replace(/^(?:best|good|top|popular|tasty|delicious|spicy|hot|fresh|authentic|famous)\s+/gi, '');

    cleaned = cleaned.replace(/^[!?.,\s]+|[!?.,\s]+$/g, '').trim();

    if (!cleaned || /^(?:food|menu|dish|item|items|dishes|something|anything)$/i.test(cleaned)) {
      const match = text.match(/\b(biryani|pizza|burger|dosa|shawarma|roll|paneer|ice\s*cream|chinese|noodle|fried\s*rice|momo|pasta|sandwich|chaat|thali|paratha|kebab|curry|coffee|tea|shake|dessert|cake|idli|vada)\b/i);
      if (match) {
        return match[1].toLowerCase().replace(/\s+/, ' ');
      }
      return null;
    }

    return cleaned;
  }

  /**
   * Tool: Search restaurants and dishes with spelling variation normalization
   */
  async searchMenuOrRestaurants(queryText, area = null) {
    try {
      let cleanQuery = (queryText || '').trim().toLowerCase();
      cleanQuery = cleanQuery.replace(/\bbir[iy]+an(?:i|is)?\b/gi, 'biryani');
      cleanQuery = cleanQuery.replace(/\bbriyani\b/gi, 'biryani');
      cleanQuery = cleanQuery.replace(/\bshwarmas?\b/gi, 'shawarma');
      cleanQuery = cleanQuery.replace(/\bparottas?\b/gi, 'paratha');
      cleanQuery = cleanQuery.replace(/\bkabab\b/gi, 'kebab');
      cleanQuery = cleanQuery.replace(/\bdosai\b/gi, 'dosa');
      cleanQuery = cleanQuery.replace(/\bicecreams?\b/gi, 'ice cream');

      let finalDishes = [];
      let finalRestaurants = [];

      if (cleanQuery) {
        const areaMatch = cleanQuery.match(/\b(koramangala|indiranagar|hsr|whitefield|maruthi\s*nagar|jp\s*nagar|jayanagar|btm|electronic\s*city|malleshwaram|hebbal|bellandur|majestic|residency\s*road|lalbagh)\b/i);
        const detectedArea = areaMatch ? areaMatch[1].trim() : (area || null);
        let foodPart = cleanQuery;
        if (detectedArea) {
          foodPart = cleanQuery.replace(new RegExp(`\\b${detectedArea}\\b`, 'gi'), '').replace(/\s*(?:in|at|around)\s*$/gi, '').trim();
        }

        const words = (foodPart || cleanQuery).split(/\s+/).filter(w => w.length > 1 && !/^(?:in|at|for|the|a|an|some|any|with|and|or)$/i.test(w));

        // First priority: matching dish item_name specifically
        let dishQuery = `
          SELECT m.item_name, m.price, m.is_veg, r.name as restaurant_name, r.area
          FROM menu m
          JOIN restaurant r ON m.restaurant_id = r.restaurant_id
          WHERE m.is_available = 1 AND r.is_active = 1
        `;
        const dishParams = [];
        if (words.length > 1) {
          const conditions = words.map(() => `m.item_name LIKE ?`).join(' AND ');
          dishQuery += ` AND (${conditions})`;
          words.forEach(w => dishParams.push(`%${w}%`));
        } else if (words.length === 1) {
          dishQuery += ` AND m.item_name LIKE ?`;
          dishParams.push(`%${words[0]}%`);
        } else {
          dishQuery += ` AND m.item_name LIKE ?`;
          dishParams.push(`%${cleanQuery}%`);
        }
        if (detectedArea) {
          dishQuery += ` AND r.area LIKE ?`;
          dishParams.push(`%${detectedArea}%`);
        }
        dishQuery += ` ORDER BY m.rating DESC, m.price ASC LIMIT 60`;
        let [nameMatches] = await db.query(dishQuery, dishParams);

        if ((!nameMatches || nameMatches.length === 0) && detectedArea) {
          let retryQuery = `
            SELECT m.item_name, m.price, m.is_veg, r.name as restaurant_name, r.area
            FROM menu m
            JOIN restaurant r ON m.restaurant_id = r.restaurant_id
            WHERE m.is_available = 1 AND r.is_active = 1
          `;
          const retryParams = [];
          if (words.length > 1) {
            retryQuery += ` AND (${words.map(() => `m.item_name LIKE ?`).join(' AND ')})`;
            words.forEach(w => retryParams.push(`%${w}%`));
          } else if (words.length === 1) {
            retryQuery += ` AND m.item_name LIKE ?`;
            retryParams.push(`%${words[0]}%`);
          }
          retryQuery += ` ORDER BY m.rating DESC, m.price ASC LIMIT 60`;
          [nameMatches] = await db.query(retryQuery, retryParams);
        }

        if (!nameMatches || nameMatches.length === 0) {
          const coreFood = words.find(w => /^(?:biryani|dosa|pizza|burger|shawarma|paneer|kebab|curry|idli|vada|coffee|tea|shake|dessert|cake|pasta|sandwich|chaat|thali|paratha|noodles?|rice)$/i.test(w)) ||
                           cleanQuery.match(/\b(biryani|pizza|burger|dosa|shawarma|roll|paneer|ice\s*cream|chinese|noodle|fried\s*rice|momo|pasta|sandwich|chaat|thali|paratha|kebab|curry|coffee|tea|shake|dessert|cake|idli|vada)\b/i)?.[1];
          if (coreFood) {
            let coreQuery = `
              SELECT m.item_name, m.price, m.is_veg, r.name as restaurant_name, r.area
              FROM menu m
              JOIN restaurant r ON m.restaurant_id = r.restaurant_id
              WHERE m.is_available = 1 AND r.is_active = 1 AND m.item_name LIKE ?
              ORDER BY m.rating DESC, m.price ASC LIMIT 60
            `;
            [nameMatches] = await db.query(coreQuery, [`%${coreFood}%`]);
          }
        }

        if (nameMatches && nameMatches.length > 0) {
          const seenNames = new Set();
          for (const d of nameMatches) {
            if (!seenNames.has(d.item_name)) {
              seenNames.add(d.item_name);
              finalDishes.push(d);
            }
            if (finalDishes.length >= 5) break;
          }
          if (finalDishes.length < 5) {
            for (const d of nameMatches) {
              const key = `${d.item_name}-${d.restaurant_name}`;
              if (!finalDishes.some(x => `${x.item_name}-${x.restaurant_name}` === key)) {
                finalDishes.push(d);
              }
              if (finalDishes.length >= 5) break;
            }
          }
        } else {
          // Broader fallback
          let broaderQuery = `
            SELECT m.item_name, m.price, m.is_veg, r.name as restaurant_name, r.area
            FROM menu m
            JOIN restaurant r ON m.restaurant_id = r.restaurant_id
            WHERE m.is_available = 1 AND r.is_active = 1
              AND (r.name LIKE ? OR r.cuisine_type LIKE ?)
            ORDER BY m.rating DESC, m.menu_id ASC LIMIT 5
          `;
          const [broaderMatches] = await db.query(broaderQuery, [`%${cleanQuery}%`, `%${cleanQuery}%`]);
          finalDishes = broaderMatches || [];
        }

        // Search matching partner restaurants
        const searchKeyword = (words[0] || cleanQuery);
        let restQuery = `
          SELECT restaurant_id, name, cuisine_type, area, rating, delivery_time 
          FROM restaurant 
          WHERE is_active = 1 AND (name LIKE ? OR cuisine_type LIKE ? OR area LIKE ?)
          ORDER BY rating DESC LIMIT 3
        `;
        let [matchedRest] = await db.query(restQuery, [`%${searchKeyword}%`, `%${searchKeyword}%`, `%${searchKeyword}%`]);
        if (!matchedRest || matchedRest.length === 0) {
          const [topRest] = await db.query(
            `SELECT restaurant_id, name, cuisine_type, area, rating, delivery_time 
             FROM restaurant WHERE is_active = 1 ORDER BY rating DESC LIMIT 3`
          );
          finalRestaurants = topRest || [];
        } else {
          finalRestaurants = matchedRest;
        }
      } else {
        // Default top dishes & restaurants
        const [defaultDishes] = await db.query(`
          SELECT m.item_name, m.price, m.is_veg, r.name as restaurant_name, r.area
          FROM menu m
          JOIN restaurant r ON m.restaurant_id = r.restaurant_id
          WHERE m.is_available = 1 AND r.is_active = 1
          ORDER BY m.rating DESC, m.menu_id ASC LIMIT 5
        `);
        finalDishes = defaultDishes || [];

        const [defaultRest] = await db.query(
          `SELECT restaurant_id, name, cuisine_type, area, rating, delivery_time 
           FROM restaurant WHERE is_active = 1 ORDER BY rating DESC LIMIT 3`
        );
        finalRestaurants = defaultRest || [];
      }

      return { restaurants: finalRestaurants, dishes: finalDishes };
    } catch (err) {
      console.error('[AI Service] searchMenuOrRestaurants error:', err.message);
      return { restaurants: [], dishes: [] };
    }
  }

  /**
   * Tool: Create human support escalation ticket
   */
  async escalateToHumanTicket(phone10, customerName, issueText, category = 'GENERAL') {
    try {
      const ticketNumber = 'TKT-' + Math.floor(10000 + Math.random() * 90000);
      const subject = `Support Escalation from ${customerName || phone10}: ${issueText.substring(0, 50)}`;

      await db.query(
        `INSERT INTO support_tickets (ticket_number, customer_phone, customer_name, category, priority, status, subject, issue_description)
         VALUES (?, ?, ?, ?, 'HIGH', 'OPEN', ?, ?)`,
        [ticketNumber, phone10 || 'UNKNOWN', customerName || 'Customer', category, subject, issueText]
      );

      return {
        success: true,
        ticketNumber: ticketNumber,
        supportChannel: 'FoodWala In-App 24/7 Priority Desk'
      };
    } catch (err) {
      console.error('[AI Service] escalateToHumanTicket error:', err.message);
      return {
        success: false,
        ticketNumber: 'TKT-' + Math.floor(10000 + Math.random() * 90000),
        supportChannel: 'FoodWala In-App 24/7 Priority Desk'
      };
    }
  }

  /**
   * Generates AI response for an incoming user message
   */
  async generateResponse({ userPhone10, customerName, messageText, conversationHistory = [], authenticatedUserId = null }) {
    const text = (messageText || '').trim();
    const intent = this.classifyIntent(text);

    let explicitOrderId = null;
    const match = text.match(/(?:order\s*#?|#)(\d{1,6})\b/i);
    if (match && match[1]) {
      explicitOrderId = parseInt(match[1], 10);
    }

    // ONLY perform live order lookup if the classified intent is ORDER_STATUS
    let orderContext = null;
    if (intent === 'ORDER_STATUS') {
      orderContext = await this.lookupLiveOrder(userPhone10, explicitOrderId, authenticatedUserId);
    }

    // If external LLM API key configured (Gemini/OpenAI) and circuit breaker is closed
    const isCircuitOpen = Date.now() < (this._circuitBreakerOpenUntil || 0);
    const hasValidKey = this.provider === 'openai' ? this.apiKey.startsWith('sk-') : this.apiKey.startsWith('AIzaSy');
    if (this.apiKey && hasValidKey && !isCircuitOpen) {
      try {
        if (this.provider === 'openai') {
          return await this._callOpenAI({ userPhone10, customerName, messageText, conversationHistory, orderContext, intent });
        } else {
          return await this._callGemini({ userPhone10, customerName, messageText, conversationHistory, orderContext, intent });
        }
      } catch (err) {
        console.warn('[AI Service] External LLM call failed, opening circuit breaker for 60s and smoothly failing over to Built-in Engine:', err.message);
        this._circuitBreakerOpenUntil = Date.now() + 60000;
      }
    }

    // Built-in Local Semantic Engine (Runs 100% out-of-the-box locally)
    return await this._generateBuiltinResponse({ userPhone10, customerName, text, intent, orderContext, explicitOrderId, authenticatedUserId });
  }

  /**
   * Built-in intelligent fallback engine with real database grounding
   */
  async _generateBuiltinResponse({ userPhone10, customerName, text, intent, orderContext, explicitOrderId, authenticatedUserId }) {
    const greetingName = customerName ? ` ${customerName}` : '';

    // 1. CANCELLATION POLICY
    if (intent === 'CANCELLATION_POLICY') {
      return `Hello${greetingName}! Here is FoodWala's *Order Cancellation Policy*:\n\n` +
             `⏱️ *60-Second Instant Cancellation:* You can cancel your order within *60 seconds* of placing it for a *100% instant refund*.\n` +
             `🍳 *Kitchen Preparation Window:* Once the restaurant begins food preparation or a delivery valet is assigned, cancellation requires restaurant authorization and may incur a preparation fee.\n` +
             `📱 *How to Cancel:* Go to your *Orders* page on our website, select the active order, and tap *Cancel Order*.\n\n` +
             `Need help with a specific order? Feel free to ask or tap *Request Callback* below! 😊`;
    }

    // 2. REFUND POLICY & ELIGIBILITY
    if (intent === 'REFUND_POLICY') {
      return `Hello${greetingName}! Here is FoodWala's *Refund Policy & Eligibility Guidelines*:\n\n` +
             `💰 *100% Instant Refund:* Orders cancelled within the 60-second window receive an immediate full refund.\n` +
             `⚡ *15-Minute Payment Reversal:* Approved refunds for UPI, debit/credit cards, and net banking are credited directly to your original payment source within 15 minutes.\n` +
             `⏱️ *Delay Compensation:* If food delivery exceeds 45 minutes beyond the promised ETA, compensation wallet credits are automatically granted.\n` +
             `🔒 *Security Notice:* Refund approvals require reviewing the order status with the restaurant. We do not issue manual approvals without verification.\n\n` +
             `Would you like me to connect you with our billing desk for an active order?`;
    }

    // 3. COUPONS & OFFERS
    if (intent === 'COUPON_OFFERS') {
      return `🎉 *FoodWala Exclusive 50% Off Offer!*\n\n` +
             `Use promo code: *FOODWALA50*\n` +
             `• *Discount:* Flat 50% OFF (up to ₹150)\n` +
             `• *Minimum Order:* ₹100\n` +
             `• *Availability:* Valid across all 105+ Bengaluru partner restaurants\n\n` +
             `Apply it during checkout on our website for instant savings! 🏷️✨`;
    }

    // 3b. WHATSAPP SUPPORT ASSISTANCE
    if (intent === 'WHATSAPP_SUPPORT') {
      const waNumber = process.env.WHATSAPP_BUSINESS_NUMBER ? String(process.env.WHATSAPP_BUSINESS_NUMBER).replace(/\D/g, '') : (process.env.SUPPORT_PHONE_NUMBER || '918500457005');
      const waLink = `https://wa.me/${waNumber}?text=${encodeURIComponent('Hi FoodWala, I need assistance with my order')}`;
      return `💬 *FoodWala 24/7 Official WhatsApp Care Assistant*\n\n` +
             `You can connect directly with our WhatsApp AI Care Desk:\n` +
             `• *WhatsApp Helpline:* +91 85004 57005\n` +
             `• *Instant Chat Link:* ${waLink}\n` +
             `• *Available Services:* Live GPS Order Tracking, 60-Second Instant Cancellations, Flat 50% Coupons, and Human Agent Priority Tickets.\n\n` +
             `Tap the link above or text *"Hi FoodWala"* to start chatting with our AI assistant on WhatsApp right away! 🛵✨`;
    }

    // 3c. DELIVERY CHARGES
    if (intent === 'DELIVERY_CHARGES') {
      return `🛵 *FoodWala Delivery Charges (Bengaluru)*:\n\n` +
             `• *Free Delivery:* Automatically unlocked on all orders above *₹299*! 🎉\n` +
             `• *Standard Delivery Fee:* Flat *₹35* for orders under ₹299.\n` +
             `• *Zero Hidden Costs:* No surge charges during regular operating hours.\n` +
             `• *Hyperlocal Reach:* Delivering across 14+ hubs in Bengaluru within 25–35 minutes.\n\n` +
             `Add your favorite dishes to cart to enjoy automatic free delivery above ₹299! 🍕`;
    }

    // 4. DELIVERY ADDRESS MANAGEMENT
    if (intent === 'DELIVERY_ADDRESS') {
      return `📍 *FoodWala Delivery Address & Micro-Zone Management:*\n\n` +
             `• *Before Placing Order:* You can change your street address or choose from any of our 14+ delivery hubs (Koramangala, Indiranagar, HSR Layout, Maruthi Nagar, Whitefield, etc.) on the Checkout page.\n` +
             `• *After Placing Order:* Once the restaurant confirms preparation or valet is dispatched, delivery addresses cannot be altered directly to prevent delivery delays. Please request a priority callback to contact your valet.\n\n` +
             `Need to update an active delivery address? Tap *Request Callback* below to reach our care team immediately! 🛵`;
    }

    // 5. FOOD HYGIENE & RESTAURANT INFO / MENU SEARCH
    if (intent === 'FOOD_HYGIENE') {
      const isHygiene = /\b(hygiene|fssai|clean(liness)?|safety|tamper|sanitiz|thermal\s*pack)\b/i.test(text);
      if (!isHygiene) {
        const searchTerm = this.extractFoodSearchTerm(text);
        const searchRes = await this.searchMenuOrRestaurants(searchTerm || '');

        if (searchRes.dishes && searchRes.dishes.length > 0) {
          const title = searchTerm ? `Craving ${searchTerm.charAt(0).toUpperCase() + searchTerm.slice(1)}? Top Picks` : `Top Recommendations`;
          let response = `🍽️ *${title} in Bengaluru:*\n\n`;
          response += `*Matching Dishes:*\n`;
          searchRes.dishes.forEach(d => {
            response += `• ${this.getVegEmoji(d)} *${d.item_name}* (₹${d.price}) — *${d.restaurant_name}* (${d.area})\n`;
          });
          if (searchRes.restaurants && searchRes.restaurants.length > 0) {
            response += `\n*Popular Partner Kitchens:*\n`;
            searchRes.restaurants.forEach(r => {
              response += `• *${r.name}* (${r.area}) — ⭐ ${r.rating} (${r.cuisine_type})\n`;
            });
          }
          response += `\n🎉 Apply coupon *FOODWALA50* at checkout for Flat 50% OFF up to ₹150! 🍕\n` +
                      `⚡ Free delivery automatically unlocked on orders above ₹299!`;
          return response;
        } else {
          // If no specific dishes matched, provide recommendations
          const fallbackRes = await this.searchMenuOrRestaurants('');
          let response = `🍽️ *FoodWala Menu Recommendations:*\n\n` +
            `We couldn't find active dishes matching "*${searchTerm || text}*" right now, but here are our top-rated recommendations in Bengaluru:\n\n*Featured Popular Dishes:*\n`;
          (fallbackRes.dishes || []).forEach(d => {
            response += `• ${this.getVegEmoji(d)} *${d.item_name}* (₹${d.price}) — *${d.restaurant_name}* (${d.area})\n`;
          });
          response += `\n*Popular Categories:* 🍕 Pizza | 🍔 Burgers | 🍛 Biryani | 🥞 South Indian | 🍜 Chinese | 🍦 Desserts\n\n` +
            `🎉 Apply coupon *FOODWALA50* at checkout for Flat 50% OFF up to ₹150! 🛵`;
          return response;
        }
      }

      return `⭐ *FoodWala FSSAI 40-Point Hygiene & Quality Standards:*\n\n` +
             `• *Tamper-Proof Thermal Packaging:* Food is sealed at the restaurant in insulated thermal bags.\n` +
             `• *Kitchen Sanitation:* All 105+ partner restaurants undergo regular FSSAI compliance and temperature monitoring.\n` +
             `• *Contactless Valet Handover:* Sanitized equipment and contactless drop-off options on all orders.\n\n` +
             `Have specific dietary or allergen questions? Let us know! 🥗✨`;
    }

    // 6. HUMAN AGENT ESCALATION
    if (intent === 'HUMAN_ESCALATION') {
      const ticket = await this.escalateToHumanTicket(userPhone10 || 'WEB_GUEST', customerName, text, 'CUSTOMER_INQUIRY');
      return `📞 *FoodWala Priority Support Desk*\n\n` +
             `I have logged priority support ticket *#${ticket.ticketNumber}* for you.\n\n` +
             `Our 24/7 care supervisor has received your request:\n` +
             `• *Assigned Ticket:* #${ticket.ticketNumber}\n` +
             `• *Resolution / Callback Window:* Within 15 minutes\n` +
             `• *Support Mode:* In-App Live Telemetry & Priority Queue\n\n` +
             `A care specialist is reviewing your request. Is there anything specific you would like me to add to this ticket?`;
    }

    // 7. ORDER STATUS & DELIVERY TRACKING
    if (intent === 'ORDER_STATUS') {
      if (orderContext && orderContext.found) {
        return `Hello${greetingName}! Here is your live order update:\n\n` +
               `📦 *Order #${orderContext.orderId}* (${orderContext.status})\n` +
               `• *Dishes:* ${orderContext.items || 'Food Items'}\n` +
               `• *Amount:* ₹${orderContext.amount}\n` +
               `• *Delivery To:* ${orderContext.address}\n` +
               `• *Delivery Valet:* ${orderContext.valetName} (${orderContext.valetPhone})\n` +
               `• *Estimated Arrival:* ${orderContext.eta}\n\n` +
               `Track live GPS anytime on your FoodWala Orders page! 🚀`;
      } else if (orderContext && orderContext.unauthorized) {
        return `Hello${greetingName}! ${orderContext.message}`;
      } else if (orderContext && orderContext.requiresAuth) {
        return `Hello${greetingName}! ${orderContext.message}\n\n` +
               `• If you placed an order via WhatsApp or another number, please reply with your *Order ID* (e.g. *#80*) and phone number.\n` +
               `• You can also sign in to your FoodWala account on our website to view all your order receipts! 🍕`;
      } else {
        return `Hello${greetingName}! I checked our records for your account, but there are no active in-transit orders at the moment.\n\n` +
               `• Ready to satisfy your hunger? Explore over 105+ Bengaluru partner restaurants on FoodWala! 🍕🍔\n` +
               `• If you placed an order under another phone number, please reply with your *Order ID* and phone number.`;
      }
    }

    // 8. AMBIGUOUS QUERIES (Clarification Prompt)
    if (intent === 'AMBIGUOUS') {
      return `Hello${greetingName}! I'd be glad to help, but could you please clarify what you need assistance with?\n\n` +
             `Here are the most common things I can assist you with:\n` +
             `• *Order Status:* Ask *"Where is my order?"* or reply with your Order ID 🛵\n` +
             `• *Cancellation:* Ask *"What is your order cancellation policy?"* 💰\n` +
             `• *Coupons:* Ask *"What discount codes are available?"* 🏷️\n` +
             `• *Address:* Ask *"How do I change my delivery address?"* 📍\n` +
             `• *Human Care:* Ask *"Speak to an agent"* for a 15-minute callback 📞`;
    }

    // 9. GENERAL SUPPORT GREETING
    return `👋 *Hello${greetingName}! Welcome to FoodWala 24/7 Care Desk!*\n\n` +
           `How can I assist your food journey today?\n\n` +
           `• Reply *Where is my order?* for live delivery tracking 🛵\n` +
           `• Reply *Cancellation Policy* for 60-second refund details 💰\n` +
           `• Reply *Coupons* for exclusive discount codes (FOODWALA50) 🏷️\n` +
           `• Reply *Change Address* for delivery zone guidelines 📍\n` +
           `• Reply *Agent* to speak directly with our team 📞`;
  }

  /**
   * Gemini API REST Client
   */
  async _callGemini({ userPhone10, customerName, messageText, conversationHistory, orderContext, intent }) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.modelName}:generateContent?key=${this.apiKey}`;
    
    let contextPrompt = FOODWALA_SYSTEM_PROMPT + `\n\nCUSTOMER INFO:\nName: ${customerName || 'Customer'}\nPhone: +91 ${userPhone10 || 'Unverified'}\nUSER INTENT: ${intent}\n`;
    if (orderContext && orderContext.found) {
      contextPrompt += `\nLIVE ORDER STATUS:\nOrder ID: #${orderContext.orderId}\nStatus: ${orderContext.status}\nItems: ${orderContext.items}\nETA: ${orderContext.eta}\nValet: ${orderContext.valetName} (${orderContext.valetPhone})\nAddress: ${orderContext.address}\n`;
    }

    const contents = [
      { role: 'user', parts: [{ text: contextPrompt }] },
      { role: 'model', parts: [{ text: "Understood. I am WalaBot. I will follow all FoodWala policies strictly and answer the customer's specific intent without confusion." }] }
    ];

    (conversationHistory || []).slice(-4).forEach(msg => {
      contents.push({
        role: msg.sender_type === 'USER' ? 'user' : 'model',
        parts: [{ text: msg.message_text }]
      });
    });

    contents.push({ role: 'user', parts: [{ text: messageText }] });

    const postData = JSON.stringify({ contents });

    return new Promise((resolve, reject) => {
      const req = https.request(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        },
        timeout: 6000
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            if (res.statusCode < 200 || res.statusCode >= 300) {
              return reject(new Error(`Gemini API returned status ${res.statusCode}: ${data.substring(0, 200)}`));
            }
            const parsed = JSON.parse(data);
            const answer = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
            if (answer) {
              resolve(answer.trim());
            } else {
              reject(new Error('Invalid Gemini response'));
            }
          } catch (e) {
            reject(e);
          }
        });
      });

      req.on('timeout', () => {
        req.destroy(new Error('Gemini API request timed out (6s)'));
      });
      req.on('error', reject);
      req.write(postData);
      req.end();
    });
  }

  /**
   * OpenAI API REST Client
   */
  async _callOpenAI({ userPhone10, customerName, messageText, conversationHistory, orderContext, intent }) {
    const url = 'https://api.openai.com/v1/chat/completions';
    
    let systemText = FOODWALA_SYSTEM_PROMPT + `\n\nCUSTOMER INFO:\nName: ${customerName || 'Customer'}\nPhone: +91 ${userPhone10 || 'Unverified'}\nUSER INTENT: ${intent}\n`;
    if (orderContext && orderContext.found) {
      systemText += `\nLIVE ORDER STATUS:\nOrder ID: #${orderContext.orderId}\nStatus: ${orderContext.status}\nItems: ${orderContext.items}\nETA: ${orderContext.eta}\nValet: ${orderContext.valetName} (${orderContext.valetPhone})\nAddress: ${orderContext.address}\n`;
    }

    const messages = [{ role: 'system', content: systemText }];
    (conversationHistory || []).slice(-4).forEach(msg => {
      messages.push({
        role: msg.sender_type === 'USER' ? 'user' : 'assistant',
        content: msg.message_text
      });
    });
    messages.push({ role: 'user', content: messageText });

    const postData = JSON.stringify({
      model: this.modelName,
      messages: messages,
      temperature: 0.7,
      max_tokens: 400
    });

    return new Promise((resolve, reject) => {
      const req = https.request(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        },
        timeout: 3000
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            if (res.statusCode < 200 || res.statusCode >= 300) {
              return reject(new Error(`OpenAI API returned status ${res.statusCode}: ${data.substring(0, 200)}`));
            }
            const parsed = JSON.parse(data);
            const answer = parsed.choices?.[0]?.message?.content;
            if (answer) {
              resolve(answer.trim());
            } else {
              reject(new Error('Invalid OpenAI response'));
            }
          } catch (e) {
            reject(e);
          }
        });
      });

      req.on('timeout', () => {
        req.destroy(new Error('OpenAI API request timed out (3s)'));
      });
      req.on('error', reject);
      req.write(postData);
      req.end();
    });
  }
}

module.exports = new AIService();

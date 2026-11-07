/**
 * server/whatsapp/flows/orderFlow.js
 * Complete Order State Machine & Cart Flow
 * States: IDLE -> BROWSING -> ITEM_SELECTED -> ASK_QTY -> CART_REVIEW -> ASK_ADDRESS -> ASK_COUPON -> ASK_PAYMENT -> AWAITING_PAYMENT -> CONFIRMED
 */

const db = require('../../db');
const messages = require('../messages');
const sender = require('../sender');
const menuSearch = require('../menuSearch');
const crypto = require('crypto');

// Server-side Idempotency & Concurrency Management
const orderLocks = new Set();
const processedOrders = new Map(); // idempotencyKey -> cachedResult

class OrderFlow {
  /**
   * Main State Machine Handler
   */
  async handle(user, session, incomingMsg) {
    const text = (incomingMsg.text || incomingMsg.messageText || '').trim();
    const actionId = incomingMsg.actionId || '';
    const lang = user.language || 'en';
    const phoneE164 = user.phone_e164;

    // 1. Check Global navigation commands within order flow
    const lower = text.toLowerCase();
    if (lower === 'cart' || lower === 'view cart' || lower.includes('view cart') || actionId === 'VIEW_CART') {
      return this.showCart(user, session);
    }

    if (lower === 'cancel' || lower === 'clear' || lower === 'clear cart' || lower.includes('clear cart') || actionId === 'CART_CLEAR' || actionId === 'CLEAR_CART') {
      session.cart = {
        restaurantId: null,
        restaurantName: null,
        items: [],
        itemTotal: 0,
        deliveryFee: 30,
        taxes: 0,
        discount: 0,
        couponCode: null,
        total: 0,
        deliveryAddress: null
      };
      session.state = 'IDLE';
      return {
        replyType: 'buttons',
        bodyText: '🗑️ Your cart has been cleared. What would you like to order today?',
        buttons: messages.getMsg(lang, 'greetingButtons')
      };
    }

    if (lower === 'back') {
      return this.handleBack(user, session);
    }

    // Repeat Order Feature (Part 2 feature flag)
    const config = require('../config');
    if (config.features.repeat_order && (/^(?:repeat\s*(?:my\s*)?order|order\s*again|reorder|same\s*again)$/i.test(lower) || actionId === 'REPEAT_ORDER')) {
      return this.handleRepeatOrder(user, session);
    }

    // Check if the user is choosing a specific payment method or payment verification
    const isPaymentMethodSpecific = actionId === 'PAY_UPI' ||
      actionId === 'PAY_COD' ||
      actionId === 'UPI_VERIFY' ||
      actionId === 'PAY_CONFIRM_UPI' ||
      /\b(?:upi|cod|cash|online|paid)\b/i.test(lower);

    // Global Checkout handling (generic checkout intent without specific payment mode chosen)
    const isCheckout = !isPaymentMethodSpecific && (
      actionId === 'CART_CHECKOUT' ||
      actionId === 'CHECKOUT' ||
      actionId === 'PAY' ||
      /^(?:checkout|pay|proceed(?:\s*to\s*pay(?:ment)?)?|pay\s*now|place\s*order|order\s*now|make\s*payment|complete\s*payment|ready\s*(?:to|for)\s*pay(?:ment)?|proceed\s*with\s*payment|i\s*want\s*to\s*pay|pay\s*for\s*(?:my\s*)?order)$/i.test(lower) ||
      lower.includes('proceed to pay') ||
      lower.includes('proceed to payment') ||
      lower.includes('make payment') ||
      lower.includes('complete payment') ||
      lower.includes('checkout') ||
      lower === 'pay' ||
      lower === 'proceed'
    );

    if (isCheckout) {
      if (!session.cart || !session.cart.items || session.cart.items.length === 0) {
        return this.showCart(user, session);
      }
      if (session.state === 'ASK_PAYMENT' || (session.cart.deliveryAddress && session.state !== 'ASK_ADDRESS')) {
        return this.promptPayment(user, session);
      }
      return this.promptAddress(user, session);
    }

    const isAddMore = actionId === 'CART_ADD_MORE' ||
      actionId === 'ADD_MORE' ||
      lower.includes('add more food') ||
      lower.includes('add more items') ||
      lower.includes('add more') ||
      lower.includes('more food') ||
      lower.includes('add food') ||
      lower.includes('more items') ||
      lower.includes('add items');

    if (isAddMore) {
      return await this.suggestRestaurantDishes(user, session);
    }

    if (actionId.startsWith('SELECT_ITEM:')) {
      const menuId = parseInt(actionId.split(':')[1], 10);
      return this.promptAskQty(user, session, menuId);
    }

    if (actionId.startsWith('ADD_ITEM:')) {
      const parts = actionId.split(':');
      const menuId = parseInt(parts[1], 10);
      const qty = parseInt(parts[2], 10);
      if (!qty || isNaN(qty) || parts.length === 2) {
        return this.promptAskQty(user, session, menuId);
      }
      return this.addItemToCart(user, session, actionId);
    }

    if (actionId.startsWith('QTY:')) {
      return this.handleAskQty(user, session, text, actionId);
    }

    // 2. State-Specific Handlers
    switch (session.state) {
      case 'ASK_QTY':
        return this.handleAskQty(user, session, text, actionId);

      case 'AWAITING_PAYMENT':
        return this.handleAwaitingPayment(user, session, actionId, text);

      case 'BROWSING': {
        // If user typed a dish name or selection while browsing
        if (text && !actionId && !text.includes('?') && text.length > 2) {
          const isNav = /^(?:back|cancel|clear|cart|checkout|pay|proceed)\b/i.test(lower);
          if (!isNav) {
            const searchRes = await menuSearch.searchMenu(text);
            if (searchRes && searchRes.matches && searchRes.matches.length > 0) {
              if (searchRes.matches.length === 1 && !searchRes.isPopularFallback && !searchRes.quantity) {
                return this.promptAskQty(user, session, searchRes.matches[0].menu_id);
              }
              const formatted = menuSearch.formatSearchResults(user.phone_e164, searchRes);
              return {
                ...formatted,
                replyType: formatted.type,
                route: 'menu',
                intent: 'order_food'
              };
            }
          }
        }
        break;
      }

      case 'CART_REVIEW': {
        const isCartQuery = text.includes('?') ||
          /^(?:what|how|where|when|why|can\s*i|do\s*you|is\s*there|are\s*there|tell\s*me|suggest|give\s*me|i\s*want|craving)\b/i.test(text) ||
          /\b(?:coupon|discount|offer|cancel|refund|delivery|charge|fee|timings?|hours?|payment|cod|cash|upi|biryani|pizza|burger|dosa|idli|paneer|chicken|mutton|shawarma|paratha|noodles|rice|pasta|coffee|tea|dessert|tacos|sushi|rolls)\b/i.test(text);
        if (isCartQuery && !actionId) {
          return null;
        }
        return this.showCart(user, session);
      }

      case 'ASK_ADDRESS':
        return this.handleAddress(user, session, incomingMsg);

      case 'ASK_COUPON':
        return this.handleCoupon(user, session, text, actionId);

      case 'ASK_PAYMENT':
        return this.handlePaymentChoice(user, session, actionId, text);

      case 'SWITCH_RESTAURANT_CONFIRM':
        return this.handleSwitchRestaurant(user, session, actionId, text);

      default:
        break;
    }

    // Immediate payment verification / switch triggers (any state if cart has items)
    if (session.cart && session.cart.items && session.cart.items.length > 0) {
      if (actionId === 'UPI_VERIFY' || actionId === 'PAY_CONFIRM_UPI') {
        return await this.executeOrderPlacement(user, session, 'UPI / Online Payment', 'SUCCESS');
      }
      if (actionId === 'PAY_UPI') {
        return this.promptUpiPayment(user, session);
      }
      if (actionId === 'PAY_COD') {
        return await this.executeOrderPlacement(user, session, 'Cash on Delivery', 'PENDING');
      }
    }

    return null;
  }

  /**
   * Prompts user for dish quantity (ASK_QTY state)
   */
  async promptAskQty(user, session, menuId) {
    const lang = user.language || 'en';
    const [rows] = await db.query(
      'SELECT menu_id, restaurant_id, item_name, price, is_veg FROM menu WHERE menu_id = ? LIMIT 1',
      [menuId]
    );
    if (!rows || rows.length === 0) {
      return { replyType: 'text', bodyText: 'Sorry, this dish is not available right now.' };
    }
    const item = rows[0];
    session.pendingItem = item;
    if (!session.context) session.context = {};
    session.context.pendingItem = item;
    session.state = 'ASK_QTY';

    return {
      replyType: 'buttons',
      bodyText: `🍽️ How many portions of *${item.item_name}* (₹${item.price}) would you like?`,
      buttons: [
        { id: `QTY:1`, title: '1 Portion' },
        { id: `QTY:2`, title: '2 Portions' },
        { id: `QTY:3`, title: '3 Portions' }
      ]
    };
  }

  /**
   * Handles user quantity response in ASK_QTY state
   */
  async handleAskQty(user, session, text, actionId) {
    let qty = 1;
    if (actionId && actionId.startsWith('QTY:')) {
      qty = parseInt(actionId.split(':')[1], 10) || 1;
    } else {
      const normalizer = require('../normalizer');
      const entities = normalizer.extractFoodEntities(text);
      if (entities.quantity && entities.quantity > 0) {
        qty = entities.quantity;
      } else {
        const numMatch = (text || '').match(/\b([1-9]|1[0-9]|20)\b/);
        if (numMatch) qty = parseInt(numMatch[1], 10);
      }
    }

    const item = session.pendingItem || (session.context && session.context.pendingItem);
    if (!item) {
      session.state = 'BROWSING';
      return {
        replyType: 'buttons',
        bodyText: 'Please select an item from our menu to add to your cart:',
        buttons: messages.getMsg(user.language || 'en', 'greetingButtons')
      };
    }

    const targetActionId = `ADD_ITEM:${item.menu_id || item.menuId}:${qty}`;
    session.pendingItem = null;
    if (session.context) delete session.context.pendingItem;
    return this.addItemToCart(user, session, targetActionId);
  }

  /**
   * Adds an item to the cart and validates the single-restaurant rule
   */
  async addItemToCart(user, session, actionId) {
    const parts = actionId.split(':');
    const menuId = parseInt(parts[1], 10);
    const qty = parseInt(parts[2], 10) || 1;
    const lang = user.language || 'en';

    // Query item details from DB
    const [rows] = await db.query(
      `SELECT m.menu_id, m.restaurant_id, m.item_name, m.price, m.is_veg,
              r.name as restaurant_name, r.delivery_fee, r.delivery_time
       FROM menu m
       JOIN restaurant r ON m.restaurant_id = r.restaurant_id
       WHERE m.menu_id = ? LIMIT 1`,
      [menuId]
    );

    if (!rows || rows.length === 0) {
      return { replyType: 'text', bodyText: 'Sorry, this dish is currently unavailable.' };
    }

    const item = rows[0];

    // Single-restaurant rule check
    if (session.cart.restaurantId && session.cart.restaurantId !== item.restaurant_id && session.cart.items.length > 0) {
      session.pendingItem = { ...item, qty };
      if (!session.context) session.context = {};
      session.context.pendingItem = { ...item, qty };
      session.state = 'SWITCH_RESTAURANT_CONFIRM';
      return {
        replyType: 'buttons',
        bodyText: messages.getMsg(lang, 'cartDifferentRestaurant', session.cart.restaurantName, item.restaurant_name),
        buttons: messages.getMsg(lang, 'cartDifferentRestaurantButtons')
      };
    }

    // Set restaurant
    session.cart.restaurantId = item.restaurant_id;
    session.cart.restaurantName = item.restaurant_name;

    // Check if item already in cart
    const existingIdx = session.cart.items.findIndex(i => i.menuId === item.menu_id);
    if (existingIdx >= 0) {
      session.cart.items[existingIdx].qty += qty;
    } else {
      session.cart.items.push({
        menuId: item.menu_id,
        name: item.item_name,
        price: parseFloat(item.price),
        qty: qty,
        isVeg: item.is_veg === 1
      });
    }

    this._recalculateCart(session.cart, item.delivery_fee);
    session.state = 'CART_REVIEW';

    return this.showCart(user, session, `✅ Added *${qty}x ${item.item_name}* to your cart!\n\n`);
  }

  /**
   * Handles user decision when switching restaurants
   */
  async handleSwitchRestaurant(user, session, actionId, text = '') {
    const isConfirm = actionId === 'CART_SWITCH_CONFIRM' || /^(?:yes|clear\s*&?\s*add|switch|confirm|yes,\s*clear)/i.test((text || '').trim());
    if (isConfirm) {
      const item = session.pendingItem || (session.context && session.context.pendingItem);
      if (!item || !item.restaurant_id) {
        session.state = 'CART_REVIEW';
        return this.showCart(user, session, '👍 Kept your current cart!\n\n');
      }
      session.cart = {
        restaurantId: item.restaurant_id,
        restaurantName: item.restaurant_name,
        items: [{
          menuId: item.menu_id,
          name: item.item_name,
          price: parseFloat(item.price),
          qty: item.qty || 1,
          isVeg: item.is_veg === 1
        }],
        itemTotal: 0,
        deliveryFee: 30,
        taxes: 0,
        discount: 0,
        couponCode: null,
        total: 0,
        deliveryAddress: null
      };
      this._recalculateCart(session.cart, item.delivery_fee);
      session.pendingItem = null;
      if (session.context) delete session.context.pendingItem;
      session.state = 'CART_REVIEW';
      return this.showCart(user, session, `✅ Switched to *${item.restaurant_name}*!\n\n`);
    } else {
      session.pendingItem = null;
      if (session.context) delete session.context.pendingItem;
      session.state = 'CART_REVIEW';
      return this.showCart(user, session, '👍 Kept your current cart!\n\n');
    }
  }

  /**
   * Recalculates cart totals, taxes, delivery fee
   */
  _recalculateCart(cart, baseFee = 30) {
    let itemTotal = 0;
    for (const it of cart.items) {
      itemTotal += (it.price * it.qty);
    }
    cart.itemTotal = Math.round(itemTotal);

    // Free delivery above ₹299
    cart.deliveryFee = cart.itemTotal >= 299 ? 0 : (baseFee !== undefined ? baseFee : 30);
    cart.taxes = Math.round(cart.itemTotal * 0.05); // 5% GST
    cart.total = Math.max(0, Math.round(cart.itemTotal + cart.deliveryFee + cart.taxes - (cart.discount || 0)));
  }

  /**
   * Displays Cart Review Message with Interactive Buttons
   */
  showCart(user, session, prefix = '') {
    const lang = user.language || 'en';
    if (!session.cart || session.cart.items.length === 0) {
      return {
        replyType: 'buttons',
        bodyText: messages.getMsg(lang, 'cartEmpty'),
        buttons: messages.getMsg(lang, 'greetingButtons')
      };
    }

    const itemsText = session.cart.items
      .map(i => `• ${i.isVeg ? '🟢' : '🔴'} *${i.qty}x ${i.name}* — ₹${i.price * i.qty}`)
      .join('\n');

    const summary = {
      restaurantName: session.cart.restaurantName || 'Selected Kitchen',
      itemsText,
      itemTotal: session.cart.itemTotal,
      deliveryFee: session.cart.deliveryFee === 0 ? 'FREE (Orders > ₹299)' : `₹${session.cart.deliveryFee}`,
      taxes: session.cart.taxes,
      discount: session.cart.discount,
      total: session.cart.total
    };

    const reviewText = prefix + messages.getMsg(lang, 'cartReview', summary);

    return {
      replyType: 'buttons',
      bodyText: reviewText,
      buttons: messages.getMsg(lang, 'cartButtons')
    };
  }

  /**
   * Prompts for delivery address: checks saved default or requests text/pin
   */
  async promptAddress(user, session) {
    const lang = user.language || 'en';
    session.state = 'ASK_ADDRESS';

    // Check if user has saved address in database
    let defaultAddr = null;
    try {
      if (user.user_id) {
        const [addresses] = await db.query(
          'SELECT formatted_address, house_no, street, area, city FROM address WHERE user_id = ? ORDER BY is_default DESC, address_id DESC LIMIT 1',
          [user.user_id]
        );
        if (addresses && addresses.length > 0) {
          defaultAddr = addresses[0].formatted_address || `${addresses[0].house_no || ''} ${addresses[0].street || ''}, ${addresses[0].area || ''}, ${addresses[0].city || 'Bengaluru'}`.trim();
        }
      }
    } catch (e) {}

    if (defaultAddr) {
      session.savedAddress = defaultAddr;
      return {
        replyType: 'buttons',
        bodyText: messages.getMsg(lang, 'askAddress', defaultAddr),
        buttons: messages.getMsg(lang, 'addressButtons')
      };
    }

    return {
      replyType: 'text',
      bodyText: messages.getMsg(lang, 'askAddress', null)
    };
  }

  /**
   * Handles user address input or location pin with delivery zone validation
   */
  async handleAddress(user, session, incomingMsg) {
    const lang = user.language || 'en';
    const actionId = incomingMsg.actionId || '';
    const text = (incomingMsg.text || incomingMsg.messageText || '').trim();

    if (actionId === 'ADDR_USE_SAVED' && session.savedAddress) {
      session.cart.deliveryAddress = session.savedAddress;
      return this.promptCoupon(user, session);
    }

    if (actionId === 'ADDR_CHANGE') {
      return {
        replyType: 'text',
        bodyText: '📍 Please type your complete delivery address (House/Flat No, Landmark, Area in Bengaluru):'
      };
    }

    // Handle WhatsApp location pin with delivery boundary check
    if (incomingMsg.location) {
      const { latitude, longitude, name, address } = incomingMsg.location;
      // Bengaluru Delivery Bounding Box (Lat: 12.70 - 13.25, Lng: 77.40 - 77.85)
      const inZone = (latitude >= 12.70 && latitude <= 13.25 && longitude >= 77.40 && longitude <= 77.85);
      if (!inZone) {
        return {
          replyType: 'buttons',
          bodyText: `📍 Location (${latitude.toFixed(2)}, ${longitude.toFixed(2)}) is outside FoodWala's Bengaluru delivery boundary.\nPlease share an address within Bengaluru or choose Takeaway pickup.`,
          buttons: [
            { id: 'ADDR_CHANGE', title: 'Enter BLR Address ✏️' },
            { id: 'SUPPORT_AGENT', title: 'Contact Support 📞' }
          ]
        };
      }

      session.cart.deliveryAddress = address || name || `Bengaluru GPS (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`;
      session.cart.deliveryLat = latitude;
      session.cart.deliveryLng = longitude;
      return this.promptCoupon(user, session);
    }

    // If text looks like a question or policy inquiry, let outer router answer it while preserving ASK_ADDRESS
    const isQuestion = text.includes('?') || /^(?:what|how|where|when|why|can\s*i|do\s*you|is\s*there|are\s*there)\b/i.test(text);
    if (isQuestion) {
      return null;
    }

    if (text.length >= 5) {
      session.cart.deliveryAddress = text;
      return this.promptCoupon(user, session);
    }

    return {
      replyType: 'text',
      bodyText: 'Please provide a valid delivery address or share your location pin on WhatsApp.'
    };
  }

  /**
   * Prompts user for coupon code (ASK_COUPON state)
   */
  async promptCoupon(user, session, prefix = '') {
    const lang = user.language || 'en';
    try {
      const [coupons] = await db.query(
        'SELECT code, discount_type, discount_value, min_order_amount, max_discount FROM coupons WHERE is_active = 1 AND (expires_at IS NULL OR expires_at > NOW()) AND min_order_amount <= ? ORDER BY discount_value DESC LIMIT 1',
        [session.cart.itemTotal]
      );

      if (coupons && coupons.length > 0) {
        session.state = 'ASK_COUPON';
        const topCoupon = coupons[0];
        const discDesc = topCoupon.discount_type === 'PERCENTAGE' ? `${topCoupon.discount_value}% OFF` : `₹${topCoupon.discount_value} OFF`;
        return {
          replyType: 'buttons',
          bodyText: prefix + `🏷️ Available Offer: Apply *${topCoupon.code}* for ${discDesc}!\n\nWould you like to apply this coupon or proceed to payment?`,
          buttons: [
            { id: `APPLY_COUPON:${topCoupon.code}`, title: `Apply ${topCoupon.code}`.substring(0, 20) },
            { id: 'SKIP_COUPON', title: 'Skip to Payment 💳' }
          ]
        };
      }
    } catch (e) {
      console.warn('[OrderFlow] Coupon query notice:', e.message);
    }

    return this.promptPayment(user, session, prefix);
  }

  /**
   * Handles coupon selection or manual code entry
   */
  async handleCoupon(user, session, text, actionId) {
    const lang = user.language || 'en';
    const lower = (text || '').toLowerCase().trim();

    if (actionId === 'SKIP_COUPON' || lower === 'skip' || lower === 'no' || lower === 'pay') {
      return this.promptPayment(user, session);
    }

    let couponCode = '';
    if (actionId && actionId.startsWith('APPLY_COUPON:')) {
      couponCode = actionId.split(':')[1];
    } else {
      const codeMatch = (text || '').match(/[A-Z0-9_]{3,15}/i);
      couponCode = codeMatch ? codeMatch[0].toUpperCase() : (text || '').trim().toUpperCase();
    }

    try {
      const [rows] = await db.query(
        'SELECT code, discount_type, discount_value, min_order_amount, max_discount FROM coupons WHERE UPPER(code) = ? AND is_active = 1 AND (expires_at IS NULL OR expires_at > NOW()) LIMIT 1',
        [couponCode]
      );

      if (!rows || rows.length === 0) {
        return {
          replyType: 'buttons',
          bodyText: `❌ Coupon *${couponCode}* is invalid or expired. You can try another code or proceed to payment.`,
          buttons: [
            { id: 'SKIP_COUPON', title: 'Skip to Payment 💳' }
          ]
        };
      }

      const cp = rows[0];
      if (session.cart.itemTotal < parseFloat(cp.min_order_amount)) {
        return {
          replyType: 'buttons',
          bodyText: `⚠️ Coupon *${cp.code}* requires a minimum order of ₹${cp.min_order_amount}. Current item total: ₹${session.cart.itemTotal}.`,
          buttons: [
            { id: 'CART_ADD_MORE', title: 'Add More Food 🍕' },
            { id: 'SKIP_COUPON', title: 'Skip to Payment 💳' }
          ]
        };
      }

      let discount = 0;
      if (cp.discount_type === 'PERCENTAGE') {
        discount = Math.round(session.cart.itemTotal * (parseFloat(cp.discount_value) / 100));
        if (cp.max_discount && discount > parseFloat(cp.max_discount)) {
          discount = parseFloat(cp.max_discount);
        }
      } else {
        discount = parseFloat(cp.discount_value);
      }

      session.cart.discount = discount;
      session.cart.couponCode = cp.code;
      this._recalculateCart(session.cart);

      return this.promptPayment(user, session, `🎉 Coupon *${cp.code}* applied! You saved ₹${discount}.\n\n`);
    } catch (e) {
      console.error('[OrderFlow] Coupon error:', e.message);
      return this.promptPayment(user, session);
    }
  }

  /**
   * Prompts payment method selection
   */
  promptPayment(user, session, prefix = '') {
    const lang = user.language || 'en';
    session.state = 'ASK_PAYMENT';
    return {
      replyType: 'buttons',
      bodyText: prefix + messages.getMsg(lang, 'askPayment', session.cart.total),
      buttons: messages.getMsg(lang, 'paymentButtons')
    };
  }

  /**
   * Handles Payment Choice: Cash on Delivery or Online Payment (UPI)
   */
  async handlePaymentChoice(user, session, actionId, text) {
    const lower = text.toLowerCase();
    const isCod = actionId === 'PAY_COD' || /\b(?:cod|cash|cash\s*on\s*delivery|pay\s*on\s*delivery)\b/i.test(lower) || (lower.includes('delivery') && lower.includes('pay'));
    const isOnline = actionId === 'PAY_UPI' || /\b(?:upi|online|gpay|phonepe|paytm|card|net\s*banking|razorpay|pay\s*on\s*upi|pay\s*with\s*upi|pay\s*via\s*upi|pay\s*upi)\b/i.test(lower);

    if (isOnline) {
      return this.promptUpiPayment(user, session);
    }

    if (isCod) {
      return await this.executeOrderPlacement(user, session, 'Cash on Delivery', 'PENDING');
    }

    // If user clicked or typed checkout/pay, re-show payment options
    if (actionId === 'CART_CHECKOUT' || actionId === 'CHECKOUT' || actionId === 'PAY' || lower.includes('pay') || lower.includes('proceed') || lower.includes('checkout')) {
      return this.promptPayment(user, session);
    }

    // For free-text queries, return null so outer router can answer FAQ, policy, or assistance, and re-attach payment options
    return null;
  }

  /**
   * Generates dynamic UPI payment details, QR payment instructions & interactive action buttons
   */
  promptUpiPayment(user, session) {
    const paymentFlow = require('./paymentFlow');
    return paymentFlow.promptUpiPayment(user, session);
  }

  /**
   * Handles verification or payment method switch in AWAITING_PAYMENT state
   */
  async handleAwaitingPayment(user, session, actionId, text) {
    const lower = (text || '').toLowerCase().trim();

    const isPaid = actionId === 'UPI_VERIFY' ||
      actionId === 'PAY_CONFIRM_UPI' ||
      /^(?:i\s*have\s*paid|paid|payment\s*done|i\s*paid|done|paid\s*done|completed\s*payment|upi\s*paid|yes\s*paid)$/i.test(lower) ||
      lower.includes('i have paid') ||
      lower === 'paid';

    if (isPaid) {
      return await this.executeOrderPlacement(user, session, 'UPI / Online Payment', 'SUCCESS');
    }

    const isCod = actionId === 'PAY_COD' ||
      /\b(?:cod|cash|switch\s*to\s*cod|pay\s*cod|cash\s*on\s*delivery)\b/i.test(lower);

    if (isCod) {
      return await this.executeOrderPlacement(user, session, 'Cash on Delivery', 'PENDING');
    }

    if (actionId === 'PAY_UPI' || /\b(?:upi|pay\s*on\s*upi|pay\s*upi|online)\b/i.test(lower)) {
      return this.promptUpiPayment(user, session);
    }

    return null;
  }

  /**
   * Suggests top 3-5 popular dishes from the current restaurant on "Add More Food"
   * Preserves single-restaurant rule and prompts quantity on selection
   */
  async suggestRestaurantDishes(user, session) {
    const lang = user.language || 'en';
    const cart = session.cart || {};
    const restaurantId = cart.restaurantId;
    const cartItemIds = (cart.items || []).map(i => i.menuId || i.menu_id).filter(Boolean);

    let dishes = [];
    let restaurantName = cart.restaurantName;

    if (restaurantId) {
      if (!restaurantName) {
        try {
          const [rRows] = await db.query('SELECT name FROM restaurant WHERE restaurant_id = ? LIMIT 1', [restaurantId]);
          if (rRows && rRows.length > 0) restaurantName = rRows[0].name;
        } catch (e) {}
      }

      let sql = `
        SELECT menu_id, restaurant_id, item_name, description, price, is_veg, is_popular, rating, category_name
        FROM menu
        WHERE restaurant_id = ? AND is_available = 1
      `;
      const params = [restaurantId];

      if (cartItemIds.length > 0) {
        sql += ` AND menu_id NOT IN (${cartItemIds.map(() => '?').join(',')})`;
        params.push(...cartItemIds);
      }

      sql += ' ORDER BY is_popular DESC, rating DESC, menu_id ASC LIMIT 5';

      try {
        const [rows] = await db.query(sql, params);
        dishes = rows || [];
      } catch (err) {
        console.error('[OrderFlow] suggestRestaurantDishes error:', err.message);
      }
    }

    if (dishes.length === 0) {
      try {
        let sql = `
          SELECT menu_id, restaurant_id, item_name, description, price, is_veg, is_popular, rating, category_name
          FROM menu
          WHERE is_available = 1
        `;
        const params = [];
        if (cartItemIds.length > 0) {
          sql += ` AND menu_id NOT IN (${cartItemIds.map(() => '?').join(',')})`;
          params.push(...cartItemIds);
        }
        sql += ' ORDER BY is_popular DESC, rating DESC, menu_id ASC LIMIT 5';
        const [rows] = await db.query(sql, params);
        dishes = rows || [];
      } catch (e) {}
    }

    session.state = 'BROWSING';

    if (dishes.length === 0) {
      return {
        replyType: 'text',
        bodyText: '🍽️ Reply with the name of any dish you would like to add!'
      };
    }

    const restLabel = restaurantName ? `*${restaurantName}*` : 'our kitchen';
    const dishListText = dishes.map((d, idx) => {
      const vegIcon = d.is_veg ? '🟢' : '🔴';
      const cat = d.category_name ? ` (${d.category_name})` : '';
      return `${idx + 1}. ${vegIcon} *${d.item_name}* — ₹${d.price}${cat}`;
    }).join('\n');

    const bodyText = `🍕 *Popular Dishes from ${restLabel}*\n` +
      `Add more items to your meal:\n\n` +
      `${dishListText}\n\n` +
      `Tap a dish below or reply with any dish name:`;

    const buttons = dishes.slice(0, 3).map(d => ({
      id: `SELECT_ITEM:${d.menu_id}`,
      title: `${d.item_name.substring(0, 14)} ₹${d.price}`.substring(0, 20)
    }));

    return {
      replyType: 'buttons',
      bodyText,
      buttons,
      dishes
    };
  }

  /**
   * Executes ACID Order Placement in MySQL with strict Idempotency
   */
  async executeOrderPlacement(user, session, paymentMode, paymentStatus) {
    const lang = user.language || 'en';
    const cart = session.cart;
    if (!cart || cart.items.length === 0) {
      return { replyType: 'text', bodyText: 'Your cart is empty. Please select food items first.' };
    }

    // Server-side Idempotency Check (Session Phone + Normalized Cart Items & Total)
    const itemsSummary = (cart.items || []).map(i => `${i.menuId || i.menu_id}:${i.qty || i.quantity}`).sort().join(',');
    const cartHash = crypto.createHash('sha256').update(`${cart.restaurantId || ''}:${itemsSummary}:${Math.round(cart.total || 0)}`).digest('hex').substring(0, 12);
    const idempotencyKey = `wa_${user.phone_e164}_${cartHash}`;

    // Deduplication check: if order was already confirmed for this exact idempotency key, return existing response
    if (processedOrders.has(idempotencyKey)) {
      console.log(`🛡️ [OrderFlow Idempotency] Duplicate order placement for ${idempotencyKey} suppressed.`);
      const cached = processedOrders.get(idempotencyKey);
      session.state = 'CONFIRMED';
      if (cached.orderId) session.lastPlacedOrderId = cached.orderId;
      session.cart = {
        restaurantId: null,
        restaurantName: null,
        items: [],
        itemTotal: 0,
        deliveryFee: 30,
        taxes: 0,
        discount: 0,
        couponCode: null,
        total: 0,
        deliveryAddress: null
      };
      return cached;
    }

    // Concurrency lock: prevent race condition on parallel incoming webhooks
    if (orderLocks.has(idempotencyKey)) {
      console.log(`🛡️ [OrderFlow Lock] Order ${idempotencyKey} is currently processing.`);
      return { replyType: 'text', bodyText: '⏳ Your order is currently being placed. Please wait a moment.' };
    }

    orderLocks.add(idempotencyKey);

    // Get DB Connection for Transaction
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      const phone10 = user.phone_e164.length >= 10 ? user.phone_e164.slice(-10) : user.phone_e164;
      const effectiveUserId = user.user_id || 1; // Fallback to guest user ID

      // 1. Insert into orders table
      const [orderResult] = await connection.execute(
        `INSERT INTO orders (
          restaurant_id, user_id, total_amount, status, payment_mode,
          customer_name, customer_phone, delivery_address, delivery_fee,
          taxes, discount, item_total, payment_status, estimated_delivery_time,
          area, city
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          cart.restaurantId || 1,
          effectiveUserId,
          cart.total,
          'PLACED',
          paymentMode,
          user.name || 'Valued Customer',
          phone10,
          cart.deliveryAddress || 'Bengaluru Central',
          cart.deliveryFee,
          cart.taxes,
          cart.discount || 0,
          cart.itemTotal,
          paymentStatus,
          '30-35 mins',
          'Bengaluru',
          'Bengaluru'
        ]
      );

      const orderId = orderResult.insertId;

      // 2. Insert into order_item table
      for (const it of cart.items) {
        const itemTotal = it.price * it.qty;
        await connection.execute(
          `INSERT INTO order_item (order_id, menu_id, quantity, item_total, total_price, item_name, price_at_order)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [orderId, it.menuId, it.qty, itemTotal, itemTotal, it.name, it.price]
        );
      }

      // 3. Insert into payment table
      const txnId = `FW-WA-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      await connection.execute(
        `INSERT INTO payment (
          order_id, transaction_id, amount, payment_method, payment_status,
          gateway_reference, masked_account
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [orderId, txnId, cart.total, paymentMode, paymentStatus, 'WhatsApp Bot', paymentMode === 'Cash on Delivery' ? 'Cash' : 'UPI']
      );

      // 4. Insert into order_status_history
      await connection.execute(
        `INSERT INTO order_status_history (order_id, status, changed_by, remarks)
         VALUES (?, ?, ?, ?)`,
        [orderId, 'PLACED', 'WHATSAPP_BOT', `Order placed via WhatsApp Assistant (${paymentMode})`]
      );

      await connection.commit();
      connection.release();

      // Reset cart and state
      session.cart = {
        restaurantId: null,
        restaurantName: null,
        items: [],
        itemTotal: 0,
        deliveryFee: 30,
        taxes: 0,
        discount: 0,
        couponCode: null,
        total: 0,
        deliveryAddress: null
      };
      session.state = 'CONFIRMED';
      session.lastPlacedOrderId = orderId;

      const confirmText = messages.getMsg(lang, 'orderConfirmed', orderId, '30-35 mins', cart.total);

      const responsePayload = {
        replyType: 'buttons',
        bodyText: confirmText,
        orderId: orderId,
        buttons: [
          { id: `TRACK_ORDER:${orderId}`, title: '🛵 Track Order' },
          { id: 'CMD_ORDER', title: '🍽️ Order More' }
        ]
      };

      // Store in idempotency cache
      processedOrders.set(idempotencyKey, responsePayload);
      orderLocks.delete(idempotencyKey);

      return responsePayload;
    } catch (err) {
      await connection.rollback();
      connection.release();
      orderLocks.delete(idempotencyKey);
      console.error('[OrderFlow] Transaction failed:', err.message);
      return {
        replyType: 'text',
        bodyText: 'Sorry, we encountered an error while securing your order. Please try again or talk to an agent.'
      };
    }
  }

  handleBack(user, session) {
    const lang = user.language || 'en';
    if (session.state === 'AWAITING_PAYMENT') {
      session.state = 'ASK_PAYMENT';
      return this.promptPayment(user, session);
    }
    if (session.state === 'ASK_PAYMENT') {
      session.state = 'ASK_COUPON';
      return this.promptCoupon(user, session);
    }
    if (session.state === 'ASK_COUPON') {
      session.state = 'ASK_ADDRESS';
      return this.promptAddress(user, session);
    }
    if (session.state === 'ASK_ADDRESS') {
      session.state = 'CART_REVIEW';
      return this.showCart(user, session);
    }
    if (session.state === 'CART_REVIEW' || session.state === 'ASK_QTY') {
      session.state = 'BROWSING';
      return {
        replyType: 'buttons',
        bodyText: 'Returned to menu browsing. What would you like to explore?',
        buttons: messages.getMsg(lang, 'greetingButtons')
      };
    }
    session.state = 'IDLE';
    return {
      replyType: 'buttons',
      bodyText: 'Returned to main menu. How can I assist you?',
      buttons: messages.getMsg(lang, 'greetingButtons')
    };
  }

  /**
   * Part 2: Repeat Order Handler (Behind feature flag)
   */
  async handleRepeatOrder(user, session) {
    const lang = user.language || 'en';
    const phone10 = user.phone_e164.length >= 10 ? user.phone_e164.slice(-10) : user.phone_e164;

    const [recent] = await db.query(
      `SELECT o.order_id, o.restaurant_id, r.name as restaurant_name, r.delivery_fee
       FROM orders o
       JOIN restaurant r ON o.restaurant_id = r.restaurant_id
       WHERE o.customer_phone = ?
       ORDER BY o.order_id DESC LIMIT 1`,
      [phone10]
    );

    if (!recent || recent.length === 0) {
      return {
        replyType: 'buttons',
        bodyText: 'You do not have any past orders to repeat yet! Browse our menu to place your first order:',
        buttons: messages.getMsg(lang, 'greetingButtons')
      };
    }

    const lastOrder = recent[0];
    const [items] = await db.query(
      `SELECT oi.menu_id, oi.quantity, oi.item_name, oi.price_at_order, m.is_veg
       FROM order_item oi
       LEFT JOIN menu m ON oi.menu_id = m.menu_id
       WHERE oi.order_id = ?`,
      [lastOrder.order_id]
    );

    if (!items || items.length === 0) {
      return { replyType: 'text', bodyText: 'Unable to reload items from past order.' };
    }

    session.cart = {
      restaurantId: lastOrder.restaurant_id,
      restaurantName: lastOrder.restaurant_name,
      items: items.map(it => ({
        menuId: it.menu_id,
        name: it.item_name,
        price: parseFloat(it.price_at_order),
        qty: it.quantity,
        isVeg: it.is_veg === 1
      })),
      itemTotal: 0,
      deliveryFee: 30,
      taxes: 0,
      discount: 0,
      couponCode: null,
      total: 0,
      deliveryAddress: null
    };

    this._recalculateCart(session.cart, lastOrder.delivery_fee);
    session.state = 'CART_REVIEW';

    return this.showCart(user, session, `🔁 Loaded items from your previous order *FW${lastOrder.order_id}*!\n\n`);
  }
}

module.exports = new OrderFlow();

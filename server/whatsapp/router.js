/**
 * server/whatsapp/router.js
 * 8-Step Intent Router & Conversational Brain
 */

const normalizer = require('./normalizer');
const menuSearch = require('./menuSearch');
const faq = require('./faq');
const llmFallback = require('./llmFallback');
const messages = require('./messages');
const config = require('./config');
const db = require('../db');

// Import Flows
const orderFlow = require('./flows/orderFlow');
const trackingFlow = require('./flows/trackingFlow');
const cancelFlow = require('./flows/cancelFlow');
const paymentFlow = require('./flows/paymentFlow');
const deliveryIssueFlow = require('./flows/deliveryIssueFlow');
const couponFlow = require('./flows/couponFlow');
const addressFlow = require('./flows/addressFlow');
const supportFlow = require('./flows/supportFlow');

class IntentRouter {
  /**
   * Main Router Entry Point
   */
  async routeMessage(user, session, incomingMsg) {
    const rawText = incomingMsg.text || incomingMsg.messageText || '';
    const actionId = incomingMsg.actionId || '';
    const detectedLang = normalizer.detectLanguage(rawText);
    const lang = user.language || detectedLang || 'en';

    // Auto-update language if new language detected and differs
    if (detectedLang !== 'en' && user.language !== detectedLang) {
      user.language = detectedLang;
      db.query('UPDATE whatsapp_users SET language = ? WHERE id = ?', [detectedLang, user.id]).catch(() => {});
    }

    const normalized = normalizer.normalizeText(rawText);
    const lower = rawText.trim().toLowerCase();

    // -------------------------------------------------------------
    // Media Message Routing (Location, Image, Audio, Sticker)
    // -------------------------------------------------------------
    if (incomingMsg.location) {
      if (session.state === 'ASK_ADDRESS') {
        const flowRes = await orderFlow.handle(user, session, incomingMsg);
        if (flowRes) return { ...flowRes, route: 'flow', intent: 'order_address' };
      }
      return {
        replyType: 'buttons',
        bodyText: messages.getMsg(lang, 'mediaReceivedLocation'),
        buttons: messages.getMsg(lang, 'greetingButtons'),
        route: 'rule',
        intent: 'media_location'
      };
    }

    if (incomingMsg.type === 'image') {
      return {
        replyType: 'buttons',
        bodyText: messages.getMsg(lang, 'mediaReceivedImage'),
        buttons: messages.getMsg(lang, 'greetingButtons'),
        route: 'rule',
        intent: 'media_image'
      };
    }

    if (incomingMsg.type === 'audio' || incomingMsg.type === 'voice') {
      return {
        replyType: 'text',
        bodyText: messages.getMsg(lang, 'mediaVoiceNoteUnsupported'),
        route: 'rule',
        intent: 'media_voice'
      };
    }

    // -------------------------------------------------------------
    // STEP 1: Interactive replies (button_reply / list_reply)
    // -------------------------------------------------------------
    if (actionId) {
      session.unknownCount = 0;

      if (actionId.startsWith('ADD_ITEM:') || actionId.startsWith('SELECT_ITEM:') || actionId.startsWith('QTY:') || actionId.startsWith('CART_') || actionId.startsWith('ADDR_') || actionId.startsWith('PAY_') || actionId.startsWith('UPI_') || actionId === 'CHECKOUT' || actionId === 'PAY' || actionId === 'CLEAR_CART' || actionId === 'ADD_MORE' || actionId === 'UPI_VERIFY' || actionId === 'PAY_CONFIRM_UPI') {
        const flowRes = await orderFlow.handle(user, session, incomingMsg);
        if (flowRes) return { ...flowRes, route: 'rule', intent: 'order_action' };
      }

      if (actionId.startsWith('TRACK_ORDER:')) {
        const orderId = parseInt(actionId.split(':')[1], 10);
        const trackRes = await trackingFlow.handle(user, session, orderId);
        return { ...trackRes, route: 'rule', intent: 'track_order' };
      }

      if (actionId.startsWith('CANCEL_ORDER:')) {
        const orderId = parseInt(actionId.split(':')[1], 10);
        const cancelRes = await cancelFlow.handle(user, session, orderId);
        return { ...cancelRes, route: 'rule', intent: 'cancel_order' };
      }

      if (actionId.startsWith('CANCEL_CONFIRM_')) {
        const cancelRes = await cancelFlow.handle(user, session, null, actionId);
        return { ...cancelRes, route: 'rule', intent: 'cancel_confirm' };
      }

      if (actionId.startsWith('ISSUE_')) {
        const issueRes = await deliveryIssueFlow.handle(user, session, actionId, rawText);
        return { ...issueRes, route: 'rule', intent: 'delivery_issue' };
      }

      if (actionId === 'CMD_ORDER') {
        const searchRes = await menuSearch.searchMenu('menu');
        const formatted = menuSearch.formatSearchResults(user.phone_e164, searchRes);
        return { ...formatted, replyType: formatted.type, route: 'menu', intent: 'menu_browse' };
      }

      if (actionId === 'CMD_TRACK') {
        const trackRes = await trackingFlow.handle(user, session);
        return { ...trackRes, route: 'rule', intent: 'track_order' };
      }

      if (actionId === 'CMD_HELP' || actionId === 'SUPPORT_AGENT') {
        const supRes = await supportFlow.handle(user, session);
        return { ...supRes, route: 'rule', intent: 'support_agent' };
      }

      if (actionId.startsWith('SEARCH_MORE:')) {
        const parts = actionId.split(':');
        const q = parts[1] || 'menu';
        const offset = parseInt(parts[2], 10) || 0;
        const searchRes = await menuSearch.searchMenu(q);
        const formatted = menuSearch.formatSearchResults(user.phone_e164, searchRes, offset);
        return { ...formatted, replyType: formatted.type, route: 'menu', intent: 'menu_browse' };
      }

      if (actionId === 'VIEW_CART') {
        const cartRes = orderFlow.showCart(user, session);
        return { ...cartRes, route: 'rule', intent: 'view_cart' };
      }
    }

    // -------------------------------------------------------------
    // STEP 2: Global commands (any state)
    // -------------------------------------------------------------
    // Inactivity / Greeting Timing Check (Phase 8: only first message or >6 hours inactivity)
    const lastSeenTime = user.last_seen_at ? new Date(user.last_seen_at).getTime() : 0;
    const inactivityHours = lastSeenTime ? (Date.now() - lastSeenTime) / (1000 * 60 * 60) : 999;
    const isGreetingDue = (!user.last_seen_at || inactivityHours >= config.greetingInactivityHours);

    // Opt-out handling
    if (/^stop\b/i.test(lower)) {
      db.query('UPDATE whatsapp_users SET opted_in = 0 WHERE id = ?', [user.id]).catch(() => {});
      return {
        replyType: 'text',
        bodyText: messages.getMsg(lang, 'optOutConfirmed'),
        route: 'rule',
        intent: 'opt_out'
      };
    }
    if (/^start\b/i.test(lower)) {
      db.query('UPDATE whatsapp_users SET opted_in = 1 WHERE id = ?', [user.id]).catch(() => {});
      session.greetingSent = true;
      return {
        replyType: 'buttons',
        bodyText: messages.getMsg(lang, 'greeting', user.name),
        buttons: messages.getMsg(lang, 'greetingButtons'),
        route: 'rule',
        intent: 'opt_in'
      };
    }

    // Greetings
    if (/^(?:hi|hello|hey|namaste|vanakkam|namaskara|hola|good\s*(?:morning|evening|afternoon))$/i.test(lower)) {
      session.unknownCount = 0;
      if (isGreetingDue || !session.greetingSent) {
        session.greetingSent = true;
        return {
          replyType: 'buttons',
          bodyText: messages.getMsg(lang, 'greeting', user.name),
          buttons: messages.getMsg(lang, 'greetingButtons'),
          route: 'rule',
          intent: 'greeting'
        };
      } else {
        return {
          replyType: 'buttons',
          bodyText: `👋 Hello${user.name ? ' ' + user.name : ''}! How can I help with your food today?`,
          buttons: messages.getMsg(lang, 'greetingButtons'),
          route: 'rule',
          intent: 'greeting'
        };
      }
    }

    // Menu global command
    if (/^(?:menu|show\s*menu|today'?s?\s*menu|catalog)$/i.test(lower)) {
      session.unknownCount = 0;
      const searchRes = await menuSearch.searchMenu('menu');
      const formatted = menuSearch.formatSearchResults(user.phone_e164, searchRes);
      return { ...formatted, replyType: formatted.type, route: 'menu', intent: 'menu_browse' };
    }

    // Support / Agent / Human / Assistance / Help
    if (/\b(?:agent|human|support|assistance|assist|help|representative|executive|callback|call\s*me|helpline)\b/i.test(lower) || /need\s+(?:assistance|help)/i.test(lower)) {
      session.unknownCount = 0;
      const supRes = await supportFlow.handle(user, session, rawText);
      return { ...supRes, route: 'rule', intent: 'support_agent' };
    }

    // Back / Reset / Cancel
    if (/^(?:back|cancel|reset)$/i.test(lower)) {
      const flowRes = await orderFlow.handle(user, session, incomingMsg);
      if (flowRes) return { ...flowRes, route: 'rule', intent: 'navigation' };
      return {
        replyType: 'buttons',
        bodyText: 'Returned to main menu. How can I assist you?',
        buttons: messages.getMsg(lang, 'greetingButtons'),
        route: 'rule',
        intent: 'navigation'
      };
    }

    // Cart & Checkout Global Commands (any state)
    const hasCartItems = session && session.cart && session.cart.items && session.cart.items.length > 0;
    const isCartCheckoutTrigger = actionId === 'CART_CHECKOUT' || actionId === 'CHECKOUT' || actionId === 'PAY' ||
      actionId === 'VIEW_CART' || actionId === 'CART_CLEAR' || actionId === 'CLEAR_CART' ||
      actionId === 'CART_ADD_MORE' || actionId === 'ADD_MORE' ||
      actionId.startsWith('PAY_') || actionId.startsWith('UPI_') ||
      actionId === 'UPI_VERIFY' || actionId === 'PAY_CONFIRM_UPI' ||
      /^(?:cart|view\s*cart|show\s*cart|my\s*cart)$/i.test(lower) ||
      lower.includes('proceed to pay') ||
      lower.includes('proceed to payment') ||
      lower.includes('make payment') ||
      lower.includes('complete payment') ||
      lower.includes('ready to pay') ||
      lower.includes('ready for payment') ||
      lower.includes('clear cart') ||
      lower.includes('add more food') ||
      lower.includes('add more items') ||
      lower.includes('add more') ||
      lower.includes('more food') ||
      lower.includes('add food') ||
      lower.includes('pay on upi') ||
      lower.includes('pay with upi') ||
      lower.includes('pay upi') ||
      lower.includes('i have paid') ||
      /^(?:checkout|pay|proceed(?:\s*to\s*pay(?:ment)?)?|pay\s*now|place\s*order|make\s*payment|complete\s*payment|i\s*want\s*to\s*pay|pay\s*on\s*upi|pay\s*upi|i\s*have\s*paid|paid)$/i.test(lower) ||
      (hasCartItems && (/\b(?:checkout|proceed(?:\s*to\s*pay(?:ment)?)?|pay\s*now|place\s*order|make\s*payment|complete\s*payment|pay\s*for\s*(?:my\s*)?order|pay\s*on\s*upi|pay\s*upi|pay\s*via\s*upi|pay\s*with\s*upi|online\s*payment|i\s*have\s*paid|paid)\b/i.test(lower) || lower === 'pay' || lower === 'proceed' || lower === 'upi' || lower === 'online'));

    if (isCartCheckoutTrigger) {
      session.unknownCount = 0;
      const flowRes = await orderFlow.handle(user, session, incomingMsg);
      if (flowRes) {
        return { ...flowRes, route: 'rule', intent: 'cart_action' };
      }
    }

    // -------------------------------------------------------------
    // STEP 3: Order ID pattern FW\d+ (case-insensitive) -> lookup
    // -------------------------------------------------------------
    const orderId = normalizer.extractOrderId(rawText);
    const isOrderLookup = orderId && session.state !== 'ASK_QTY' && (
      /\bfw\d+\b/i.test(rawText) ||
      /\border\b/i.test(rawText) ||
      (/^\d{1,6}$/.test(rawText.trim()) && (!session.state || session.state === 'IDLE' || session.state === 'CONFIRMED'))
    );
    if (isOrderLookup) {
      session.unknownCount = 0;
      const trackRes = await trackingFlow.handle(user, session, orderId);
      return { ...trackRes, route: 'rule', intent: 'track_order' };
    }

    // -------------------------------------------------------------
    // STEP 4: Active flow handling (state expects answer)
    // -------------------------------------------------------------
    if (session.state && session.state !== 'IDLE' && session.state !== 'CONFIRMED') {
      const flowRes = await orderFlow.handle(user, session, incomingMsg);
      if (flowRes) {
        session.unknownCount = 0;
        return { ...flowRes, route: 'flow', intent: 'active_flow' };
      }
    }

    // -------------------------------------------------------------
    // STEP 5: Food Intent -> Menu Search Flow (Fixes "I want biriyani")
    // -------------------------------------------------------------
    const isFoodSearch = this._isFoodIntent(normalized, rawText);
    if (isFoodSearch) {
      session.unknownCount = 0;
      const searchRes = await menuSearch.searchMenu(rawText);
      // Direct text match without an explicit quantity count -> enter ASK_QTY directly
      const isDirectMatch = (searchRes.matches && searchRes.matches.length > 0 && !searchRes.isPopularFallback && !searchRes.quantity) &&
        (searchRes.matches.length === 1 || searchRes.isExactDishMatch);
      if (isDirectMatch) {
        let chosenItem = searchRes.matches[0];
        if (session && session.cart && session.cart.restaurantId) {
          const restItem = searchRes.matches.find(m => m.restaurant_id === session.cart.restaurantId);
          if (restItem) chosenItem = restItem;
        }
        const qtyRes = await orderFlow.promptAskQty(user, session, chosenItem.menu_id);
        return {
          ...qtyRes,
          route: 'flow',
          intent: 'ask_qty'
        };
      }
      const formatted = menuSearch.formatSearchResults(user.phone_e164, searchRes);
      return {
        ...formatted,
        replyType: formatted.type,
        route: 'menu',
        intent: 'order_food'
      };
    }

    // -------------------------------------------------------------
    // STEP 6: Rule Keywords (Multi-Language)
    // -------------------------------------------------------------
    // Tracking
    if (/\b(?:track|tracking|where\s*is\s*my\s*order|order\s*status|eta|rider|delivery\s*status|kaha\s*hai|ekkada|yelli)\b/i.test(lower)) {
      session.unknownCount = 0;
      const trackRes = await trackingFlow.handle(user, session, orderId);
      return { ...trackRes, route: 'rule', intent: 'track_order' };
    }

    // Cancellation
    if (/\b(?:cancel\s*order|order\s*cancel|radd|cancel\s*karna)\b/i.test(lower)) {
      session.unknownCount = 0;
      const cancelRes = await cancelFlow.handle(user, session, orderId);
      return { ...cancelRes, route: 'rule', intent: 'cancel_order' };
    }

    // Payment issues (only when actual issue, deduction, failure or refund is mentioned)
    if (/\b(?:payment\s*(?:issue|failed|failure|problem|error|deducted|pending|stuck)|deducted|double\s*charge|money\s*cut|paise\s*kat\s*gaye|failed\s*payment|refund)\b/i.test(lower)) {
      session.unknownCount = 0;
      const payRes = await paymentFlow.handle(user, session, orderId);
      return { ...payRes, route: 'rule', intent: 'payment_issue' };
    }

    // Coupons & Offers
    if (/\b(?:coupon|coupons|offer|offers|discount|discounts|promo|deal|deals|code)\b/i.test(lower)) {
      session.unknownCount = 0;
      const cpRes = await couponFlow.handle(user, session);
      return { ...cpRes, route: 'rule', intent: 'coupons' };
    }

    // Change Address
    if (/\b(?:change\s*address|wrong\s*address|update\s*location|deliver\s*to\s*another)\b/i.test(lower)) {
      session.unknownCount = 0;
      const addrRes = await addressFlow.handle(user, session, rawText);
      return { ...addrRes, route: 'rule', intent: 'change_address' };
    }

    // Delivery Complaints
    if (/\b(?:late|delayed|wrong\s*food|missing|cold|spilled|damaged|spoiled|kharab)\b/i.test(lower)) {
      session.unknownCount = 0;
      const delRes = await deliveryIssueFlow.handle(user, session, '', rawText);
      return { ...delRes, route: 'rule', intent: 'delivery_issue' };
    }

    // -------------------------------------------------------------
    // STEP 7: FAQ Match (Keyword + Similarity >= 0.75)
    // -------------------------------------------------------------
    const faqMatch = await faq.matchFaq(rawText, lang);
    if (faqMatch && faqMatch.score >= 0.65) {
      session.unknownCount = 0;
      return {
        replyType: 'buttons',
        bodyText: faqMatch.answer,
        buttons: this._getButtonsForState(session, lang),
        route: 'faq',
        intent: faqMatch.intent
      };
    }

    // -------------------------------------------------------------
    // STEP 8: LLM Fallback (Strict JSON Output, 3s Timeout)
    // -------------------------------------------------------------
    const llmRes = await llmFallback.classifyAndReply({
      messageText: rawText,
      customerName: user.name,
      language: lang
    });

    if (llmRes && llmRes.intent && llmRes.intent !== 'unknown' && llmRes.reply) {
      session.unknownCount = 0;
      return {
        replyType: 'buttons',
        bodyText: llmRes.reply,
        buttons: this._getButtonsForState(session, lang),
        route: 'llm',
        intent: llmRes.intent
      };
    }

    // -------------------------------------------------------------
    // STEP 9: Unknown Twice -> Offer Human Agent
    // -------------------------------------------------------------
    session.unknownCount = (session.unknownCount || 0) + 1;

    if (session.unknownCount >= 2) {
      session.unknownCount = 0;
      const supRes = await supportFlow.handle(user, session, `User repeated unknown queries: "${rawText}"`);
      return {
        ...supRes,
        bodyText: messages.getMsg(lang, 'unknownTwiceOfferAgent') + '\n\n' + supRes.bodyText,
        route: 'rule',
        intent: 'human_agent_escalation'
      };
    }

    // First unknown fallback: offer clear paths
    return {
      replyType: 'buttons',
      bodyText: `I'm not quite sure about that, but I'm here to help with your meals!\n\n` +
                `• Reply with any dish name (e.g. *Biryani*, *Pizza*, *Dosa*)\n` +
                `• Ask *"Where is my order?"* or reply with your Order ID\n` +
                `• Ask for *"Coupons"* or *"Cancellation Policy"*`,
      buttons: this._getButtonsForState(session, lang),
      route: 'rule',
      intent: 'unknown'
    };
  }

  _getButtonsForState(session, lang = 'en') {
    if (session && session.cart && session.cart.items && session.cart.items.length > 0) {
      if (session.state === 'CART_REVIEW') {
        return messages.getMsg(lang, 'cartButtons');
      }
      if (session.state === 'ASK_PAYMENT') {
        return messages.getMsg(lang, 'paymentButtons');
      }
      if (session.state === 'AWAITING_PAYMENT') {
        return [
          { id: 'UPI_VERIFY', title: 'I Have Paid ✅' },
          { id: 'PAY_COD', title: 'Switch to COD 💵' }
        ];
      }
      if (session.state === 'ASK_ADDRESS' && session.savedAddress) {
        return messages.getMsg(lang, 'addressButtons');
      }
      return [
        { id: 'CART_CHECKOUT', title: 'Proceed to Pay 💳' },
        { id: 'VIEW_CART', title: 'View Cart 🛒' },
        { id: 'CART_ADD_MORE', title: 'Add More Food 🍕' }
      ];
    }
    return messages.getMsg(lang, 'greetingButtons');
  }

  _isFoodIntent(normalized, rawText) {
    if (!normalized) return false;

    // Explicitly exclude non-food operational, policy, cart, checkout, and tracking queries
    if (/\b(?:policy|cancell?ation|refund|faq|track|tracking|status|where\s*is|hygiene|fssai|charges|fees|coupon|coupons|discount|discounts|promo|offer|offers|address|change\s*address|help|support|agent|complaint|checkout|pay|proceed|cart)\b/i.test(rawText)) {
      const hasSpecificFood = /\b(biryani|pizza|burger|dosa|idli|paneer|chicken|mutton|shawarma|paratha|kebab|noodles|fried\s*rice|pasta|sandwich|curry|coffee|tea|dessert|tacos|sushi|rolls|thali|chaat)\b/i.test(normalized);
      if (!hasSpecificFood) return false;
    }

    // Check known food terms
    if (/\b(biryani|pizza|burger|dosa|idli|paneer|chicken|mutton|shawarma|paratha|kebab|noodles|fried\s*rice|pasta|sandwich|curry|coffee|tea|dessert|tacos|sushi|rolls|thali|chaat)\b/i.test(normalized)) {
      return true;
    }
    // Check craving or ordering phrasing
    if (/\b(?:want|wanna|hungry|craving|get\s*me|send|plate|plates|portion)\b/i.test(normalized)) {
      return true;
    }
    if (/\b(?:order\s*food|i\s*want\s*to\s*order)\b/i.test(normalized)) {
      return true;
    }
    return false;
  }
}

module.exports = new IntentRouter();

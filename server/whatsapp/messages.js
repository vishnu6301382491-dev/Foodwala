/**
 * server/whatsapp/messages.js
 * Centralized User-Facing Copy with Multi-Language Support
 * Languages: en (English), hi (Hindi), te (Telugu), ta (Tamil), kn (Kannada)
 */

const messages = {
  en: {
    greeting: (name) => `👋 *Hi${name ? ' ' + name : ''}! Welcome to FoodWala!*\nHot meals delivered to your doorstep in 30 mins.\nWhat can I get for you today?`,
    greetingButtons: [
      { id: 'CMD_ORDER', title: '🍽️ Order food' },
      { id: 'CMD_TRACK', title: '🛵 Track order' },
      { id: 'CMD_HELP', title: '💬 More help' }
    ],
    menuNotFound: (query) => `Sorry, no exact matches for *${query}*.\nHere are our most popular dishes right now:`,
    itemAdded: (item, qty, rest) => `✅ Added *${qty}x ${item}* from *${rest}* to your cart!`,
    cartDifferentRestaurant: (oldRest, newRest) => `⚠️ Your cart contains items from *${oldRest}*.\nSwitching to *${newRest}* will reset your current cart.`,
    cartDifferentRestaurantButtons: [
      { id: 'CART_SWITCH_CONFIRM', title: 'Yes, clear & add' },
      { id: 'CART_SWITCH_CANCEL', title: 'No, keep my cart' }
    ],
    cartReview: (summary) => `🛒 *Your FoodWala Cart*\nFrom: *${summary.restaurantName}*\n\n${summary.itemsText}\n\nItem Total: ₹${summary.itemTotal}\nDelivery Fee: ₹${summary.deliveryFee}\nTaxes & Packing: ₹${summary.taxes}${summary.discount > 0 ? `\nDiscount: -₹${summary.discount}` : ''}\n*Total to Pay: ₹${summary.total}*`,
    cartButtons: [
      { id: 'CART_CHECKOUT', title: 'Proceed to Pay 💳' },
      { id: 'CART_ADD_MORE', title: 'Add More Food 🍕' },
      { id: 'CART_CLEAR', title: 'Clear Cart 🗑️' }
    ],
    cartEmpty: '🛒 Your cart is currently empty! Reply with a dish name or click below to browse our menu.',
    askAddress: (defaultAddr) => defaultAddr
      ? `📍 Deliver to your saved address?\n*${defaultAddr}*`
      : '📍 Where should we deliver your food? Reply with your address or share a WhatsApp location pin.',
    addressButtons: [
      { id: 'ADDR_USE_SAVED', title: 'Use this address ✅' },
      { id: 'ADDR_CHANGE', title: 'Enter new address ✏️' }
    ],
    askPayment: (total) => `💳 Total to pay: *₹${total}*\nPlease choose your preferred payment method:`,
    paymentButtons: [
      { id: 'PAY_COD', title: 'Cash on Delivery 💵' },
      { id: 'PAY_UPI', title: 'Pay Online (UPI) ⚡' }
    ],
    orderConfirmed: (orderId, eta, total) => `🎉 *Order FW${orderId} confirmed!*\nEstimated delivery: *${eta || '30-35 mins'}*\nTotal Amount: *₹${total}*\nWe are getting your food fresh from the kitchen! 🛵`,
    orderConfirmedButtons: (orderId) => [
      { id: `TRACK_ORDER:${orderId || ''}`, title: '🛵 Track Order' },
      { id: `SUPPORT_AGENT`, title: '💬 Help with order' }
    ],
    trackingActive: (order) => `🛵 *Order FW${order.order_id} (Order #${order.order_id}) Update*\nStatus: *${order.status}*\nRestaurant: *${order.restaurant_name || 'Kitchen'}*\nETA: *${order.estimated_delivery_time || '25-35 mins'}*${order.valet_name ? `\nRider: *${order.valet_name}* (${order.valet_phone || 'Assigned'})` : ''}`,
    trackingNotFound: 'No active orders found for your number right now.\nWould you like to order something delicious? 🍕',
    cancelConfirmation: (orderId) => `⚠️ Are you sure you want to cancel order *FW${orderId}*?\nFree cancellation is valid within 60s of placing.`,
    cancelButtons: [
      { id: 'CANCEL_CONFIRM_YES', title: 'Yes, cancel order' },
      { id: 'CANCEL_CONFIRM_NO', title: 'No, keep my order' }
    ],
    cancelSuccess: (orderId) => `✅ Order *FW${orderId}* has been cancelled.\nIf payment was deducted, your refund will reflect within 2-4 hours (UPI) or 3-5 days (Card).`,
    cancelNotAllowed: (status) => `Sorry, order cannot be cancelled as the kitchen has already started *${status}* to ensure hot food. Please reach out to an agent for assistance.`,
    paymentIssuePrompt: 'Did you face a deduction without order confirmation? Reply with your payment reference or Order ID and our supervisor will resolve it right away.',
    deliveryIssuePrompt: 'We apologize for the trouble! Please select the issue you experienced:',
    deliveryIssueButtons: [
      { id: 'ISSUE_LATE', title: 'Order is delayed ⏱️' },
      { id: 'ISSUE_WRONG', title: 'Wrong/missing item 🍱' },
      { id: 'ISSUE_SPILL', title: 'Food damaged 📦' }
    ],
    ticketCreated: (ticketNo) => `🎫 Support ticket *#${ticketNo}* has been logged!\nA customer care agent is reviewing your case and will respond in 5-10 minutes.`,
    agentHandoff: (phone) => `👨‍💼 Connecting you to our care specialist!\nYou can also call our official helpline directly at *${phone}*.`,
    mediaReceivedImage: '📸 Thank you for sharing the photo! We have attached it to your support case for our quality team.',
    mediaReceivedLocation: '📍 Location received! Checking delivery serviceability for this zone...',
    mediaVoiceNoteUnsupported: '🎤 I cannot listen to voice notes just yet. Please send a short text message and I will help you immediately! 😊',
    optOutConfirmed: 'You have been unsubscribed from WhatsApp notifications. Reply *START* anytime to re-enable our assistant.',
    unknownTwiceOfferAgent: 'I apologize for the confusion! Let me connect you directly with a human support agent who can help.'
  },

  hi: {
    greeting: (name) => `👋 *नमस्ते${name ? ' ' + name : ''}! फूडवाला में आपका स्वागत है!*\n30 मिनट में गरमा-गरम खाना आपके घर पर।\nआज आप क्या मंगाना चाहेंगे?`,
    greetingButtons: [
      { id: 'CMD_ORDER', title: '🍽️ खाना ऑर्डर करें' },
      { id: 'CMD_TRACK', title: '🛵 ऑर्डर ट्रैक करें' },
      { id: 'CMD_HELP', title: '💬 सहायता' }
    ],
    menuNotFound: (query) => `क्षमा करें, *${query}* के लिए कोई सीधा परिणाम नहीं मिला।\nयहाँ हमारे सबसे लोकप्रिय व्यंजन हैं:`,
    itemAdded: (item, qty, rest) => `✅ *${qty}x ${item}* (*${rest}*) आपकी कार्ट में जोड़ दिया गया है!`,
    orderConfirmed: (orderId, eta, total) => `🎉 *ऑर्डर FW${orderId} कन्फर्म हो गया!*\nडिलीवरी समय: *${eta || '30-35 मिनट'}*\nकुल राशि: *₹${total}* 🛵`,
    trackingNotFound: 'आपके नंबर पर अभी कोई सक्रिय ऑर्डर नहीं मिला। क्या आप कुछ मंगाना चाहेंगे? 🍕',
    agentHandoff: (phone) => `👨‍💼 हम आपको हमारे सपोर्ट विशेषज्ञ से जोड़ रहे हैं!\nआप हमारी हेल्पलाइन *${phone}* पर भी संपर्क कर सकते हैं।`
  },

  te: {
    greeting: (name) => `👋 *నమస్కారం${name ? ' ' + name : ''}! ఫుడ్‌వాలాకి స్వాగతం!*\n30 నిమిషాల్లో వేడి వేడి ఆహారం మీ ఇంటి వద్దకే.\nఈరోజు ఏమి ఆర్డర్ చేయాలనుకుంటున్నారు?`,
    greetingButtons: [
      { id: 'CMD_ORDER', title: '🍽️ ఫుడ్ ఆర్డర్' },
      { id: 'CMD_TRACK', title: '🛵 ఆర్డర్ ట్రాక్' },
      { id: 'CMD_HELP', title: '💬 సహాయం' }
    ],
    menuNotFound: (query) => `క్షమించండి, *${query}* అందుబాటులో లేదు.\nమా పాపులర్ వంటకాలు ఇక్కడ ఉన్నాయి:`,
    itemAdded: (item, qty, rest) => `✅ *${qty}x ${item}* (*${rest}*) కార్ట్‌కి జోడించబడింది!`,
    orderConfirmed: (orderId, eta, total) => `🎉 *ఆర్డర్ FW${orderId} నిర్ధారించబడింది!*\nడెలివరీ సమయం: *${eta || '30-35 నిమిషాలు'}*\nమొత్తం: *₹${total}* 🛵`,
    trackingNotFound: 'మీ నంబర్‌పై ప్రస్తుతం యాక్టివ్ ఆర్డర్‌లు లేవు. ఏదైనా ఆర్డర్ చేయాలనుకుంటున్నారా? 🍕',
    agentHandoff: (phone) => `👨‍💼 మిమ్మల్ని మా కస్టమర్ కేర్ ఎగ్జిక్యూటివ్‌తో కనెక్ట్ చేస్తున్నాము!\nహెల్ప్‌లైన్: *${phone}*.`
  },

  ta: {
    greeting: (name) => `👋 *வணக்கம்${name ? ' ' + name : ''}! ஃபுட்வாலாவுக்கு வரவேற்கிறோம்!*\n30 நிமிடங்களில் சூடான உணவு உங்கள் இல்லத்திற்கு.\nஇன்று என்ன ஆர்டர் செய்ய விரும்புகிறீர்கள்?`,
    greetingButtons: [
      { id: 'CMD_ORDER', title: '🍽️ உணவு ஆர்டர்' },
      { id: 'CMD_TRACK', title: '🛵 ஆர்டர் நிலை' },
      { id: 'CMD_HELP', title: '💬 உதவி' }
    ],
    menuNotFound: (query) => `மன்னிக்கவும், *${query}* கிடைக்கவில்லை.\nஎங்கள் பிரபலமான உணவுகள் இங்கே:`,
    itemAdded: (item, qty, rest) => `✅ *${qty}x ${item}* (*${rest}*) கூடையில் சேர்க்கப்பட்டது!`,
    orderConfirmed: (orderId, eta, total) => `🎉 *ஆர்டர் FW${orderId} உறுதி செய்யப்பட்டது!*\nநேரம்: *${eta || '30-35 நிமிடங்கள்'}*\nதொகை: *₹${total}* 🛵`,
    trackingNotFound: 'தற்போது செயலில் உள்ள ஆர்டர்கள் எதுவும் இல்லை. ஆர்டர் செய்ய விரும்புகிறீர்களா? 🍕',
    agentHandoff: (phone) => `👨‍💼 வாடிக்கையாளர் சேவை அதிகாரியுடன் இணைக்கப்படுகிறீர்கள்!\nஉதவி எண்: *${phone}*.`
  },

  kn: {
    greeting: (name) => `👋 *ನಮಸ್ಕಾರ${name ? ' ' + name : ''}! ಫುಡ್‌ವಾಲಾಗೆ ಸುಸ್ವಾಗತ!*\n30 ನಿಮಿಷಗಳಲ್ಲಿ ಬಿಸಿ ಊಟ ನಿಮ್ಮ ಮನೆ ಬಾಗಿಲಿಗೆ.\nಇಂದು ಏನು ಆರ್ಡರ್ ಮಾಡಲು ಬಯಸುತ್ತೀರಿ?`,
    greetingButtons: [
      { id: 'CMD_ORDER', title: '🍽️ ಊಟ ಆರ್ಡರ್' },
      { id: 'CMD_TRACK', title: '🛵 ಆರ್ಡರ್ ಟ್ರ್ಯಾಕ್' },
      { id: 'CMD_HELP', title: '💬 ಸಹಾಯ' }
    ],
    menuNotFound: (query) => `ಕ್ಷಮಿಸಿ, *${query}* ಲಭ್ಯವಿಲ್ಲ.\nನಮ್ಮ ಅತ್ಯಂತ ಜನಪ್ರಿಯ ತಿನಿಸುಗಳು ಇಲ್ಲಿವೆ:`,
    itemAdded: (item, qty, rest) => `✅ *${qty}x ${item}* (*${rest}*) ಕಾರ್ಟ್‌ಗೆ ಸೇರಿಸಲಾಗಿದೆ!`,
    orderConfirmed: (orderId, eta, total) => `🎉 *ಆರ್ಡರ್ FW${orderId} ದೃಢೀಕರಿಸಲಾಗಿದೆ!*\nವೇಳೆ: *${eta || '30-35 ನಿಮಿಷಗಳು'}*\nಒಟ್ಟು ಮೊತ್ತ: *₹${total}* 🛵`,
    trackingNotFound: 'ಪ್ರಸ್ತುತ ಸಕ್ರಿಯ ಆರ್ಡರ್‌ಗಳು ಯಾವುದೂ ಇಲ್ಲ. ಹೊಸ ಆರ್ಡರ್ ಮಾಡಲು ಬಯಸುವಿರಾ? 🍕',
    agentHandoff: (phone) => `👨‍💼 ನಮ್ಮ ಗ್ರಾಹಕ ಸೇವಾ ಅಧಿಕಾರಿಯೊಂದಿಗೆ ಸಂಪರ್ಕ ಕಲ್ಪಿಸಲಾಗುತ್ತಿದೆ!\nಸಹಾಯವಾಣಿ: *${phone}*.`
  }
};

function getMsg(lang, key, ...args) {
  const chosenLang = messages[lang] && messages[lang][key] ? lang : 'en';
  const val = messages[chosenLang][key];
  if (typeof val === 'function') {
    return val(...args);
  }
  return val || (messages.en[key] ? (typeof messages.en[key] === 'function' ? messages.en[key](...args) : messages.en[key]) : '');
}

module.exports = {
  messages,
  getMsg
};

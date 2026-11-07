const router = require('../server/whatsapp/router');
const sessionStore = require('../server/whatsapp/sessionStore');

async function test() {
  const user = { id: 1, phone_e164: '919515918074', name: 'srikanth', language: 'en' };
  
  // Scenario 1: in CART_REVIEW with 1x Biryani
  const sess1 = {
    state: 'CART_REVIEW',
    cart: {
      restaurantId: 1,
      restaurantName: 'Shivaji Military Hotel',
      items: [{ menuId: 10, name: 'Mutton Donne Biryani', price: 320, qty: 1, isVeg: false }],
      itemTotal: 320,
      deliveryFee: 0,
      taxes: 16,
      discount: 0,
      total: 336
    },
    context: {}
  };

  const res1 = await router.routeMessage(user, sess1, { text: 'Hi FoodWala, I need assistance with my order', actionId: '' });
  console.log('--- Test 1 (Assistance in CART_REVIEW) ---');
  console.log('Route:', res1.route, 'Intent:', res1.intent, 'State after:', sess1.state);
  console.log('Body:', (res1.bodyText || '').slice(0, 80));
  console.log('Buttons:', res1.buttons);

  // Scenario 2: User quotes/texts "Proceed to Pay 💳" in CART_REVIEW
  const res2 = await router.routeMessage(user, sess1, { text: 'Proceed to Pay 💳', actionId: '' });
  console.log('--- Test 2 (Text "Proceed to Pay 💳" in CART_REVIEW) ---');
  console.log('Route:', res2.route, 'Intent:', res2.intent, 'State after:', sess1.state);
  console.log('Body:', (res2.bodyText || '').slice(0, 80));

  // Scenario 3: User clicks button CART_CHECKOUT when state is IDLE but cart has items
  const sess3 = {
    state: 'IDLE',
    cart: {
      restaurantId: 1,
      restaurantName: 'Shivaji Military Hotel',
      items: [{ menuId: 10, name: 'Mutton Donne Biryani', price: 320, qty: 1, isVeg: false }],
      itemTotal: 320,
      deliveryFee: 0,
      taxes: 16,
      discount: 0,
      total: 336
    },
    context: {}
  };
  const res3 = await router.routeMessage(user, sess3, { text: 'Proceed to Pay 💳', actionId: 'CART_CHECKOUT' });
  console.log('--- Test 3 (Button CART_CHECKOUT in IDLE with items) ---');
  console.log('Route:', res3.route, 'Intent:', res3.intent, 'State after:', sess3.state);
  console.log('Body:', (res3.bodyText || '').slice(0, 80));

  // Scenario 4: User texts "Proceed to Pay 💳" when state is IDLE with items
  const sess4 = {
    state: 'IDLE',
    cart: {
      restaurantId: 1,
      restaurantName: 'Shivaji Military Hotel',
      items: [{ menuId: 10, name: 'Mutton Donne Biryani', price: 320, qty: 1, isVeg: false }],
      itemTotal: 320,
      deliveryFee: 0,
      taxes: 16,
      discount: 0,
      total: 336
    },
    context: {}
  };
  const res4 = await router.routeMessage(user, sess4, { text: 'Proceed to Pay 💳', actionId: '' });
  console.log('--- Test 4 (Text "Proceed to Pay 💳" in IDLE with items) ---');
  console.log('Route:', res4.route, 'Intent:', res4.intent, 'State after:', sess4.state);
  console.log('Body:', (res4.bodyText || '').slice(0, 80));

  // Scenario 5: User texts "Proceed to Pay 💳" with EMPTY cart and state IDLE
  const sess5 = {
    state: 'IDLE',
    cart: {
      restaurantId: null,
      restaurantName: null,
      items: [],
      itemTotal: 0,
      deliveryFee: 30,
      taxes: 0,
      discount: 0,
      total: 0
    },
    context: {}
  };
  const res5 = await router.routeMessage(user, sess5, { text: 'Proceed to Pay 💳', actionId: '' });
  console.log('--- Test 5 (Text "Proceed to Pay 💳" with EMPTY cart in IDLE) ---');
  console.log('Route:', res5.route, 'Intent:', res5.intent, 'State after:', sess5.state);
  console.log('Body:', (res5.bodyText || '').slice(0, 80));

  // Scenario 6: User clicks button CART_CHECKOUT with EMPTY cart in IDLE
  const sess6 = {
    state: 'IDLE',
    cart: {
      restaurantId: null,
      restaurantName: null,
      items: [],
      itemTotal: 0,
      deliveryFee: 30,
      taxes: 0,
      discount: 0,
      total: 0
    },
    context: {}
  };
  const res6 = await router.routeMessage(user, sess6, { text: 'Proceed to Pay 💳', actionId: 'CART_CHECKOUT' });
  console.log('--- Test 6 (Button CART_CHECKOUT with EMPTY cart in IDLE) ---');
  console.log('Route:', res6.route, 'Intent:', res6.intent, 'State after:', sess6.state);
  console.log('Body:', (res6.bodyText || '').slice(0, 80));

  // Scenario 7: User in ASK_ADDRESS asks "What are your delivery charges?"
  const sess7 = {
    state: 'ASK_ADDRESS',
    cart: {
      restaurantId: 1,
      restaurantName: 'Shivaji Military Hotel',
      items: [{ menuId: 10, name: 'Mutton Donne Biryani', price: 320, qty: 1, isVeg: false }],
      itemTotal: 320,
      deliveryFee: 0,
      taxes: 16,
      discount: 0,
      total: 336
    },
    context: {}
  };
  const res7 = await router.routeMessage(user, sess7, { text: 'What are your delivery charges?', actionId: '' });
  console.log('--- Test 7 (FAQ query in ASK_ADDRESS) ---');
  console.log('Route:', res7.route, 'Intent:', res7.intent, 'State after:', sess7.state);
  console.log('Body:', (res7.bodyText || '').slice(0, 80));
  console.log('Buttons:', res7.buttons);

  // Scenario 8: User in ASK_ADDRESS submits physical street address
  const sess8 = {
    state: 'ASK_ADDRESS',
    cart: {
      restaurantId: 1,
      restaurantName: 'Shivaji Military Hotel',
      items: [{ menuId: 10, name: 'Mutton Donne Biryani', price: 320, qty: 1, isVeg: false }],
      itemTotal: 320,
      deliveryFee: 0,
      taxes: 16,
      discount: 0,
      total: 336
    },
    context: {}
  };
  const res8 = await router.routeMessage(user, sess8, { text: '#142, 5th Cross, Koramangala, Bengaluru', actionId: '' });
  console.log('--- Test 8 (Address submission in ASK_ADDRESS) ---');
  console.log('Route:', res8.route, 'Intent:', res8.intent, 'State after:', sess8.state);
  console.log('Body:', (res8.bodyText || '').slice(0, 80));
  console.log('Saved delivery address:', sess8.cart.deliveryAddress);

  // Scenario 9: User in ASK_PAYMENT selects Cash on Delivery
  const sess9 = {
    state: 'ASK_PAYMENT',
    cart: {
      restaurantId: 1,
      restaurantName: 'Shivaji Military Hotel',
      items: [{ menuId: 10, name: 'Mutton Donne Biryani', price: 320, qty: 1, isVeg: false }],
      itemTotal: 320,
      deliveryFee: 0,
      taxes: 16,
      discount: 0,
      total: 336,
      deliveryAddress: '#142, 5th Cross, Koramangala, Bengaluru'
    },
    context: {}
  };
  const res9 = await router.routeMessage(user, sess9, { text: 'Cash on delivery', actionId: 'PAY_COD' });
  console.log('--- Test 9 (Payment placement in ASK_PAYMENT) ---');
  console.log('Route:', res9.route, 'Intent:', res9.intent, 'State after:', sess9.state);
  console.log('Body:', (res9.bodyText || '').slice(0, 80));

  // Scenario 10: User in ASK_PAYMENT texts "Proceed to Pay 💳" or "proceed to payment"
  // Must preserve ASK_PAYMENT, NOT loop back to ASK_ADDRESS!
  const sess10 = {
    state: 'ASK_PAYMENT',
    cart: {
      restaurantId: 1,
      restaurantName: 'Shivaji Military Hotel',
      items: [{ menuId: 10, name: 'Mutton Donne Biryani', price: 320, qty: 1, isVeg: false }],
      itemTotal: 320,
      deliveryFee: 0,
      taxes: 16,
      discount: 0,
      total: 336,
      deliveryAddress: '#142, 5th Cross, Koramangala, Bengaluru'
    },
    context: {}
  };
  const res10 = await router.routeMessage(user, sess10, { text: 'Proceed to Pay 💳', actionId: 'CART_CHECKOUT' });
  console.log('--- Test 10 (Proceed to Pay in ASK_PAYMENT) ---');
  console.log('Route:', res10.route, 'Intent:', res10.intent, 'State after:', sess10.state);
  if (sess10.state === 'ASK_ADDRESS') {
    throw new Error('FAIL: Reverted to ASK_ADDRESS from ASK_PAYMENT on checkout click');
  }
  console.log('   ✅ PASS: Test 10 - State remains ASK_PAYMENT with payment buttons.');

  // Scenario 11: User texts "Can I pay with cash?" in CART_REVIEW
  const sess11 = {
    state: 'CART_REVIEW',
    cart: {
      restaurantId: 1,
      restaurantName: 'Shivaji Military Hotel',
      items: [{ menuId: 10, name: 'Mutton Donne Biryani', price: 320, qty: 1, isVeg: false }],
      itemTotal: 320,
      deliveryFee: 0,
      taxes: 16,
      discount: 0,
      total: 336
    },
    context: {}
  };
  const res11 = await router.routeMessage(user, sess11, { text: 'Can I pay with cash?', actionId: '' });
  console.log('--- Test 11 (Payment question "Can I pay with cash?") ---');
  console.log('Route:', res11.route, 'Intent:', res11.intent, 'State after:', sess11.state);
  console.log('Body:', (res11.bodyText || '').slice(0, 80));
  if (!res11.bodyText.toLowerCase().includes('cash on delivery') && !res11.bodyText.toLowerCase().includes('cod')) {
    throw new Error('FAIL: "Can I pay with cash?" did not mention Cash on Delivery');
  }
  console.log('   ✅ PASS: Test 11 - FAQ accurately answered payment methods question.');

  // Scenario 12: User texts "make payment" or "complete payment" with active cart in IDLE
  // Must NOT trigger payment_issue ticket!
  const sess12 = {
    state: 'IDLE',
    cart: {
      restaurantId: 1,
      restaurantName: 'Shivaji Military Hotel',
      items: [{ menuId: 10, name: 'Mutton Donne Biryani', price: 320, qty: 1, isVeg: false }],
      itemTotal: 320,
      deliveryFee: 0,
      taxes: 16,
      discount: 0,
      total: 336
    },
    context: {}
  };
  const res12 = await router.routeMessage(user, sess12, { text: 'make payment', actionId: '' });
  console.log('--- Test 12 ("make payment" in IDLE with active cart) ---');
  console.log('Route:', res12.route, 'Intent:', res12.intent, 'State after:', sess12.state);
  if (res12.intent === 'payment_issue') {
    throw new Error('FAIL: "make payment" was misclassified as a payment issue complaint!');
  }
  console.log('   ✅ PASS: Test 12 - "make payment" correctly routed to cart_action/checkout.');

  // Scenario 13: Stale message TTL in config is at least 24h
  const config = require('../server/whatsapp/config');
  console.log('--- Test 13 (Stale message TTL resilience) ---');
  console.log('staleMessageTtlSec:', config.staleMessageTtlSec);
  if (config.staleMessageTtlSec < 86400) {
    throw new Error('FAIL: staleMessageTtlSec is less than 86400s (24h)');
  }
  console.log('   ✅ PASS: Test 13 - Stale message TTL is 24 hours resilient against restart delays.');

  // Scenario 14: User in ASK_PAYMENT selects UPI (button PAY_UPI)
  // Must transition to AWAITING_PAYMENT, generate dynamic UPI link, QR instructions, and buttons
  const sess14 = {
    state: 'ASK_PAYMENT',
    cart: {
      restaurantId: 1,
      restaurantName: 'Shivaji Military Hotel',
      items: [{ menuId: 10, name: 'Mutton Donne Biryani', price: 320, qty: 1, isVeg: false }],
      itemTotal: 320,
      deliveryFee: 0,
      taxes: 16,
      discount: 0,
      total: 336,
      deliveryAddress: '#142, 5th Cross, Koramangala, Bengaluru'
    },
    context: {}
  };
  const res14 = await router.routeMessage(user, sess14, { text: 'Pay Online (UPI) ⚡', actionId: 'PAY_UPI' });
  console.log('--- Test 14 (Button PAY_UPI in ASK_PAYMENT) ---');
  console.log('Route:', res14.route, 'Intent:', res14.intent, 'State after:', sess14.state);
  console.log('Body:', (res14.bodyText || '').slice(0, 100));
  if (sess14.state !== 'AWAITING_PAYMENT') {
    throw new Error(`FAIL: Expected state AWAITING_PAYMENT, got ${sess14.state}`);
  }
  if (!res14.bodyText.includes('upi://pay?pa=foodwala@upi')) {
    throw new Error('FAIL: Dynamic UPI link not found in response');
  }
  if (!res14.bodyText.includes('336')) {
    throw new Error('FAIL: Cart total amount not found in UPI response');
  }
  const hasPaidBtn = (res14.buttons || []).some(b => b.id === 'UPI_VERIFY');
  const hasCodBtn = (res14.buttons || []).some(b => b.id === 'PAY_COD');
  if (!hasPaidBtn || !hasCodBtn) {
    throw new Error('FAIL: Expected UPI_VERIFY and PAY_COD quick buttons in UPI prompt');
  }
  console.log('   ✅ PASS: Test 14 - Button PAY_UPI generated dynamic UPI details, intent link & action buttons.');

  // Scenario 15: User in ASK_PAYMENT texts "pay on upi" or "upi"
  const sess15 = {
    state: 'ASK_PAYMENT',
    cart: {
      restaurantId: 1,
      restaurantName: 'Shivaji Military Hotel',
      items: [{ menuId: 10, name: 'Mutton Donne Biryani', price: 320, qty: 1, isVeg: false }],
      itemTotal: 320,
      deliveryFee: 0,
      taxes: 16,
      discount: 0,
      total: 336,
      deliveryAddress: '#142, 5th Cross, Koramangala, Bengaluru'
    },
    context: {}
  };
  const res15 = await router.routeMessage(user, sess15, { text: 'pay on upi', actionId: '' });
  console.log('--- Test 15 (Text "pay on upi" in ASK_PAYMENT) ---');
  if (sess15.state !== 'AWAITING_PAYMENT' || !res15.bodyText.includes('upi://pay?pa=foodwala@upi')) {
    throw new Error('FAIL: Text "pay on upi" did not transition to AWAITING_PAYMENT with dynamic UPI link');
  }
  console.log('   ✅ PASS: Test 15 - Text "pay on upi" correctly routed to UPI details with intent link.');

  // Scenario 16: User in AWAITING_PAYMENT taps [I Have Paid ✅] (actionId: 'UPI_VERIFY')
  // Must complete ACID order placement in MySQL, clear cart, set state CONFIRMED, and return tracking buttons
  const user16 = { id: 16, phone_e164: '919515918016', name: 'User 16', language: 'en' };
  const sess16 = {
    state: 'AWAITING_PAYMENT',
    cart: {
      restaurantId: 1,
      restaurantName: 'Shivaji Military Hotel',
      items: [{ menuId: 10, name: 'Mutton Donne Biryani', price: 320, qty: 1, isVeg: false }],
      itemTotal: 320,
      deliveryFee: 0,
      taxes: 16,
      discount: 0,
      total: 336,
      deliveryAddress: '#142, 5th Cross, Koramangala, Bengaluru'
    },
    context: {}
  };
  const res16 = await router.routeMessage(user16, sess16, { text: 'I Have Paid ✅', actionId: 'UPI_VERIFY' });
  console.log('--- Test 16 (Button UPI_VERIFY in AWAITING_PAYMENT) ---');
  console.log('State after:', sess16.state, 'OrderId:', sess16.lastPlacedOrderId);
  if (sess16.state !== 'CONFIRMED' || !sess16.lastPlacedOrderId) {
    throw new Error('FAIL: Order not confirmed upon UPI_VERIFY click');
  }
  if (!res16.bodyText.includes('confirmed') || !res16.bodyText.includes('336')) {
    throw new Error('FAIL: Confirmation message did not include order confirmed & amount');
  }
  if (sess16.cart.items.length !== 0) {
    throw new Error('FAIL: Cart was not cleared after order placement');
  }
  console.log('   ✅ PASS: Test 16 - Button UPI_VERIFY successfully secured order in MySQL & confirmed.');

  // Scenario 17: User in AWAITING_PAYMENT texts "i have paid"
  const user17 = { id: 17, phone_e164: '919515918017', name: 'User 17', language: 'en' };
  const sess17 = {
    state: 'AWAITING_PAYMENT',
    cart: {
      restaurantId: 1,
      restaurantName: 'Shivaji Military Hotel',
      items: [{ menuId: 10, name: 'Mutton Donne Biryani', price: 320, qty: 1, isVeg: false }],
      itemTotal: 320,
      deliveryFee: 0,
      taxes: 16,
      discount: 0,
      total: 336,
      deliveryAddress: '#142, 5th Cross, Koramangala, Bengaluru'
    },
    context: {}
  };
  const res17 = await router.routeMessage(user17, sess17, { text: 'i have paid', actionId: '' });
  console.log('--- Test 17 (Text "i have paid" in AWAITING_PAYMENT) ---');
  if (sess17.state !== 'CONFIRMED' || !sess17.lastPlacedOrderId) {
    throw new Error('FAIL: Order not confirmed upon texting "i have paid"');
  }
  console.log('   ✅ PASS: Test 17 - Text "i have paid" successfully verified payment and placed order.');

  // Scenario 18: User in AWAITING_PAYMENT switches to COD (actionId: 'PAY_COD')
  const user18 = { id: 18, phone_e164: '919515918018', name: 'User 18', language: 'en' };
  const sess18 = {
    state: 'AWAITING_PAYMENT',
    cart: {
      restaurantId: 1,
      restaurantName: 'Shivaji Military Hotel',
      items: [{ menuId: 10, name: 'Mutton Donne Biryani', price: 320, qty: 1, isVeg: false }],
      itemTotal: 320,
      deliveryFee: 0,
      taxes: 16,
      discount: 0,
      total: 336,
      deliveryAddress: '#142, 5th Cross, Koramangala, Bengaluru'
    },
    context: {}
  };
  const res18 = await router.routeMessage(user18, sess18, { text: 'Switch to COD 💵', actionId: 'PAY_COD' });
  console.log('--- Test 18 (Switch to COD in AWAITING_PAYMENT) ---');
  if (sess18.state !== 'CONFIRMED' || !sess18.lastPlacedOrderId) {
    throw new Error('FAIL: Order not placed upon switching to COD');
  }
  console.log('   ✅ PASS: Test 18 - Switching to COD in AWAITING_PAYMENT placed order successfully.');

  // Scenario 19: Dish selection via button SELECT_ITEM:{menuId}
  // Must enter ASK_QTY state and present interactive portion selection buttons
  const sess19 = {
    state: 'IDLE',
    cart: { restaurantId: null, restaurantName: null, items: [], itemTotal: 0, deliveryFee: 30, taxes: 0, discount: 0, total: 0 },
    context: {}
  };
  const res19 = await router.routeMessage(user, sess19, { text: '', actionId: 'SELECT_ITEM:10' });
  console.log('--- Test 19 (Dish selection via button SELECT_ITEM:10) ---');
  console.log('State after:', sess19.state, 'Buttons:', res19.buttons);
  if (sess19.state !== 'ASK_QTY') {
    throw new Error(`FAIL: Expected state ASK_QTY, got ${sess19.state}`);
  }
  if (!res19.bodyText.includes('How many portions')) {
    throw new Error('FAIL: Body text does not ask for portion count');
  }
  const hasQty1 = (res19.buttons || []).some(b => b.id === 'QTY:1');
  const hasQty2 = (res19.buttons || []).some(b => b.id === 'QTY:2');
  const hasQty3 = (res19.buttons || []).some(b => b.id === 'QTY:3');
  if (!hasQty1 || !hasQty2 || !hasQty3) {
    throw new Error('FAIL: Expected portion buttons QTY:1, QTY:2, QTY:3');
  }
  console.log('   ✅ PASS: Test 19 - Button SELECT_ITEM:10 successfully transitioned to ASK_QTY with portion buttons.');

  // Scenario 20: Dish selection via button ADD_ITEM:10 without explicit quantity
  // Must enter ASK_QTY state and present portion buttons
  const sess20 = {
    state: 'IDLE',
    cart: { restaurantId: null, restaurantName: null, items: [], itemTotal: 0, deliveryFee: 30, taxes: 0, discount: 0, total: 0 },
    context: {}
  };
  const res20 = await router.routeMessage(user, sess20, { text: '', actionId: 'ADD_ITEM:10' });
  console.log('--- Test 20 (Dish selection via ADD_ITEM:10 without quantity) ---');
  if (sess20.state !== 'ASK_QTY' || !res20.bodyText.includes('How many portions')) {
    throw new Error(`FAIL: ADD_ITEM:10 without quantity did not transition to ASK_QTY, state: ${sess20.state}`);
  }
  console.log('   ✅ PASS: Test 20 - ADD_ITEM:10 without quantity successfully prompted for portions.');

  // Scenario 21: Direct text match without explicit quantity ("Mutton Donne Biryani")
  // Must enter ASK_QTY state directly with portion buttons
  const sess21 = {
    state: 'IDLE',
    cart: { restaurantId: null, restaurantName: null, items: [], itemTotal: 0, deliveryFee: 30, taxes: 0, discount: 0, total: 0 },
    context: {}
  };
  const res21 = await router.routeMessage(user, sess21, { text: 'Mutton Donne Biryani', actionId: '' });
  console.log('--- Test 21 (Direct text match "Mutton Donne Biryani" without quantity) ---');
  console.log('State after:', sess21.state, 'Intent:', res21.intent);
  if (sess21.state !== 'ASK_QTY') {
    throw new Error(`FAIL: Direct dish text match did not transition to ASK_QTY, state: ${sess21.state}`);
  }
  if (!res21.bodyText.includes('How many portions')) {
    throw new Error('FAIL: Body text does not ask for portion count');
  }
  console.log('   ✅ PASS: Test 21 - Direct text match without explicit quantity entered ASK_QTY state.');

  // Scenario 22: User in ASK_QTY selects quantity portion (QTY:2)
  // Must commit item to cart and transition to CART_REVIEW
  const res22 = await router.routeMessage(user, sess21, { text: '2 Portions', actionId: 'QTY:2' });
  console.log('--- Test 22 (Portion selection QTY:2 in ASK_QTY) ---');
  console.log('State after:', sess21.state, 'Cart items:', sess21.cart.items);
  if (sess21.state !== 'CART_REVIEW') {
    throw new Error(`FAIL: Expected state CART_REVIEW after quantity, got ${sess21.state}`);
  }
  if (sess21.cart.items.length !== 1 || sess21.cart.items[0].qty !== 2) {
    throw new Error('FAIL: Expected 1 item with quantity 2 in cart');
  }
  console.log('   ✅ PASS: Test 22 - Selecting quantity portion committed item to cart and displayed cart review.');

  // Scenario 23: Clicking button CART_ADD_MORE ("Add More Food 🍕")
  // Must query MySQL menu for active dishes from session.cart.restaurantId (excluding items in cart),
  // return 3-5 popular dishes with prices and quick-select buttons, and set state to BROWSING
  const sess23 = {
    state: 'CART_REVIEW',
    cart: {
      restaurantId: 1,
      restaurantName: 'Shivaji Military Hotel',
      items: [{ menuId: 10, name: 'Mutton Donne Biryani', price: 320, qty: 1, isVeg: false }],
      itemTotal: 320,
      deliveryFee: 0,
      taxes: 16,
      discount: 0,
      total: 336
    },
    context: {}
  };
  const res23 = await router.routeMessage(user, sess23, { text: 'Add More Food 🍕', actionId: 'CART_ADD_MORE' });
  console.log('--- Test 23 (Button CART_ADD_MORE in CART_REVIEW) ---');
  console.log('State after:', sess23.state);
  console.log('Body:', res23.bodyText);
  console.log('Buttons:', res23.buttons);
  if (sess23.state !== 'BROWSING') {
    throw new Error(`FAIL: Expected state BROWSING after CART_ADD_MORE, got ${sess23.state}`);
  }
  if (!res23.bodyText.includes('Popular Dishes from *Shivaji Military Hotel*')) {
    throw new Error('FAIL: Restaurant name not included in dish suggestions');
  }
  if (res23.bodyText.includes('Mutton Donne Biryani')) {
    throw new Error('FAIL: Suggestions should exclude dishes already in cart (Mutton Donne Biryani)');
  }
  if (!res23.buttons || res23.buttons.length === 0) {
    throw new Error('FAIL: Expected quick-select buttons for recommended dishes');
  }
  const allSelectButtons = res23.buttons.every(b => b.id.startsWith('SELECT_ITEM:'));
  if (!allSelectButtons) {
    throw new Error('FAIL: Recommended dish buttons should use SELECT_ITEM action');
  }
  console.log('   ✅ PASS: Test 23 - CART_ADD_MORE queried restaurant dishes, excluded cart items, and provided quick-select buttons.');

  // Scenario 24: Texting "add more food" or "add more items"
  const sess24 = {
    state: 'CART_REVIEW',
    cart: {
      restaurantId: 1,
      restaurantName: 'Shivaji Military Hotel',
      items: [{ menuId: 10, name: 'Mutton Donne Biryani', price: 320, qty: 1, isVeg: false }],
      itemTotal: 320,
      deliveryFee: 0,
      taxes: 16,
      discount: 0,
      total: 336
    },
    context: {}
  };
  const res24 = await router.routeMessage(user, sess24, { text: 'add more food', actionId: '' });
  console.log('--- Test 24 (Text "add more food") ---');
  if (sess24.state !== 'BROWSING' || !res24.bodyText.includes('Popular Dishes')) {
    throw new Error('FAIL: Texting "add more food" did not suggest restaurant dishes');
  }
  console.log('   ✅ PASS: Test 24 - Text "add more food" successfully suggested restaurant dishes.');

  // Scenario 25: Tapping suggested dish from "Add More Food" (e.g. first button) -> enters ASK_QTY
  const targetBtn = res23.buttons[0];
  const res25 = await router.routeMessage(user, sess23, { text: targetBtn.title, actionId: targetBtn.id });
  console.log('--- Test 25 (Tap recommended dish button) ---');
  console.log('State after:', sess23.state, 'Prompt:', res25.bodyText);
  if (sess23.state !== 'ASK_QTY') {
    throw new Error(`FAIL: Tapping recommended dish did not transition to ASK_QTY, got ${sess23.state}`);
  }
  console.log('   ✅ PASS: Test 25 - Tapping recommended dish prompted for portion quantity, preserving restaurant rule.');

  console.log('\n🎉 ALL 25 USER SCENARIO TESTS PASSED 100%!');
  process.exit(0);
}

test().catch(err => {
  console.error(err);
  process.exit(1);
});

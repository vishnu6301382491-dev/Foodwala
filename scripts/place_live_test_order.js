/**
 * scripts/place_live_test_order.js
 * Places an authentic end-to-end test order for Vishnu (+91 63013 82491)
 * and dispatches live interactive WhatsApp confirmation with tracking buttons.
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../server/.env') });
const db = require('../server/db');
const sessionStore = require('../server/whatsapp/sessionStore');
const orderFlow = require('../server/whatsapp/flows/orderFlow');
const sender = require('../server/whatsapp/sender');

async function placeLiveTestOrder() {
  const phone = '916301382491';
  console.log(`================================================================`);
  console.log(`🚀 Executing Live WhatsApp End-to-End Order Placement`);
  console.log(`   Customer Phone: +${phone}`);
  console.log(`================================================================\n`);

  // 1. Get user & session
  const user = await sessionStore.getOrCreateUser(phone, 'VISHNU');
  const session = await sessionStore.getSession(phone);

  // 2. Clear previous session state
  session.state = 'IDLE';
  session.cart = {
    items: [],
    restaurantId: 5,
    restaurantName: 'Shivaji Military Hotel',
    itemTotal: 320,
    deliveryFee: 0, // Free for > 299
    taxes: 16,
    discount: 0,
    total: 336,
    deliveryAddress: '#142, 5th Cross, Koramangala, Bengaluru',
    couponCode: null
  };

  // Add Mutton Donne Biryani
  session.cart.items.push({
    menuId: 13,
    name: 'Mutton Donne Biryani',
    price: 320,
    qty: 1
  });

  console.log(`[*] Order Items: 1x ${session.cart.items[0].name} (₹${session.cart.items[0].price})`);
  console.log(`[*] Restaurant : ${session.cart.restaurantName}`);
  console.log(`[*] Address    : ${session.cart.deliveryAddress}`);
  console.log(`[*] Total Pay  : ₹${session.cart.total}\n`);

  // 3. Execute order placement ACID transaction
  console.log(`[*] Committing order transaction to MySQL database...`);
  const result = await orderFlow.executeOrderPlacement(user, session, 'Cash on Delivery', 'PENDING');
  console.log(`[OK] Order response generated:`);
  console.log(result.bodyText);

  // 4. Extract Order ID
  const match = result.bodyText.match(/Order (FW\d+|\d+)/i);
  const displayId = match ? match[1] : 'FW' + Date.now().toString().slice(-4);

  // 5. Send Live Confirmation to WhatsApp Phone
  console.log(`\n[*] Dispatching live WhatsApp confirmation with buttons to +${phone}...`);
  const buttons = [
    { id: 'CMD_TRACK', title: 'Track Order 🛵' },
    { id: 'CMD_MENU', title: 'Order More 🍽️' },
    { id: 'CMD_SUPPORT', title: 'Need Help 💬' }
  ];

  const sendResult = await sender.sendInteractiveButtons(phone, result.bodyText, buttons);
  console.log(`[OK] WhatsApp API Dispatch Result:`, JSON.stringify(sendResult, null, 2));

  // 6. Query DB to show recorded order
  const [dbOrders] = await db.query(
    'SELECT order_id, customer_name, customer_phone, total_amount, status, payment_mode, estimated_delivery_time, order_date FROM orders WHERE customer_phone LIKE ? ORDER BY order_id DESC LIMIT 1',
    ['%6301382491%']
  );
  console.log(`\n=== VERIFIED RECORD IN MYSQL DATABASE ===`);
  console.table(dbOrders);

  console.log(`\n================================================================`);
  console.log(`🎉 Live order placed successfully!`);
  console.log(`   Order ID: ${dbOrders[0]?.order_id} (${displayId})`);
  console.log(`   Check WhatsApp chat on your phone for the confirmation!`);
  console.log(`================================================================\n`);

  process.exit(0);
}

placeLiveTestOrder().catch(err => {
  console.error('Error placing order:', err);
  process.exit(1);
});

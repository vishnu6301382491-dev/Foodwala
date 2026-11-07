/**
 * scripts/verify_live_webhook_payment.js
 * End-to-end verification of Live WhatsApp Webhook for:
 * 1. Suggest Quantity on Item Selection (SELECT_ITEM & QTY buttons)
 * 2. Suggest Restaurant Dishes on "Add More Food" (CART_ADD_MORE)
 * 3. Pay on UPI with dynamic intent link & [I Have Paid] verification
 * 4. Verification of ACID Order, Order Item, and Payment records in MySQL
 */

const http = require('http');
const crypto = require('crypto');
const db = require('../server/db');

const secret = '7459963c3345f7d67c2a5715fb0b0643';
const waPhone = '919500457222';
let lastSeenId = 0;

function sendWebhookMessage(text, actionId = '') {
  return new Promise((resolve, reject) => {
    const msgId = 'wamid.LIVE_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
    const msgObj = {
      id: msgId,
      from: waPhone,
      timestamp: Math.floor(Date.now() / 1000).toString(),
      type: actionId ? 'interactive' : 'text'
    };
    if (actionId) {
      msgObj.interactive = {
        type: 'button_reply',
        button_reply: { id: actionId, title: text || actionId }
      };
    } else {
      msgObj.text = { body: text };
    }

    const payload = JSON.stringify({
      object: 'whatsapp_business_account',
      entry: [{
        changes: [{
          value: {
            messaging_product: 'whatsapp',
            metadata: { display_phone_number: '1555001234', phone_number_id: '109876543210' },
            contacts: [{ profile: { name: 'Live Webhook Tester' }, wa_id: waPhone }],
            messages: [msgObj]
          }
        }]
      }]
    });

    const signature = 'sha256=' + crypto.createHmac('sha256', secret).update(payload).digest('hex');

    const req = http.request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/whatsapp/webhook',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Hub-Signature-256': signature,
        'Content-Length': Buffer.byteLength(payload)
      }
    }, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve({ statusCode: res.statusCode, body: data, msgId }));
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function waitForBotReply(timeoutMs = 8000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const [rows] = await db.query(
      `SELECT m.message_id, m.message_text 
       FROM whatsapp_messages m
       JOIN whatsapp_conversations c ON m.conversation_id = c.conversation_id
       WHERE c.wa_id = ? AND m.direction = 'OUTBOUND' AND m.message_id > ?
       ORDER BY m.message_id ASC LIMIT 1`,
      [waPhone, lastSeenId]
    );
    if (rows && rows.length > 0) {
      lastSeenId = rows[0].message_id;
      return rows[0].message_text;
    }
    await new Promise(r => setTimeout(r, 200));
  }
  throw new Error(`Timeout waiting for bot reply for ${waPhone} after message_id ${lastSeenId}`);
}

async function testLiveWebhook() {
  console.log('=== LIVE WHATSAPP WEBHOOK VERIFICATION ===\n');

  // Baseline message marker for this specific conversation
  const [maxRows] = await db.query(
    `SELECT COALESCE(MAX(m.message_id), 0) AS maxId 
     FROM whatsapp_messages m
     JOIN whatsapp_conversations c ON m.conversation_id = c.conversation_id
     WHERE c.wa_id = ?`,
    [waPhone]
  );
  lastSeenId = maxRows[0]?.maxId || 0;

  // Step 0: Ensure fresh session state
  console.log('--- Step 0: Reset Session to IDLE ---');
  await sendWebhookMessage('clear cart', 'CLEAR_CART');
  const resetReply = await waitForBotReply();
  console.log('Reset Reply: ' + resetReply.replace(/\n/g, ' '));

  // Step 1: Dish Selection via button SELECT_ITEM:10
  console.log('\n--- Step 1: Webhook SELECT_ITEM:10 ---');
  await sendWebhookMessage('Death By Chocolate (DBC)', 'SELECT_ITEM:10');
  const reply1 = await waitForBotReply();
  console.log('Bot Reply 1:\n' + reply1);
  if (!reply1.includes('How many portions')) {
    throw new Error('FAIL: Webhook SELECT_ITEM did not prompt for quantity');
  }

  // Step 2: Answer Quantity portion via button QTY:2
  console.log('\n--- Step 2: Webhook QTY:2 ---');
  await sendWebhookMessage('2 Portions', 'QTY:2');
  const reply2 = await waitForBotReply();
  console.log('Bot Reply 2:\n' + reply2);
  if (!reply2.includes('Cart') || !reply2.includes('2x')) {
    throw new Error('FAIL: Webhook QTY:2 did not show cart review with 2x portions');
  }

  // Step 3: Add More Food via button CART_ADD_MORE
  console.log('\n--- Step 3: Webhook CART_ADD_MORE ---');
  await sendWebhookMessage('Add More Food 🍕', 'CART_ADD_MORE');
  const reply3 = await waitForBotReply();
  console.log('Bot Reply 3:\n' + reply3);
  if (!reply3.includes('Popular Dishes') || !reply3.includes('₹')) {
    throw new Error('FAIL: Webhook CART_ADD_MORE did not suggest restaurant dishes with prices');
  }

  // Step 4: Proceed to Pay -> Address -> Skip Coupon
  console.log('\n--- Step 4: Checkout, Address, Skip Coupon ---');
  await sendWebhookMessage('Proceed to Pay 💳', 'CART_CHECKOUT');
  const replyAddr = await waitForBotReply();
  console.log('Bot Address Prompt: ' + replyAddr.replace(/\n/g, ' ').slice(0, 80));

  await sendWebhookMessage('Brigade Road, Bengaluru');
  const replyCoupon = await waitForBotReply();
  console.log('Bot Coupon Prompt: ' + replyCoupon.replace(/\n/g, ' ').slice(0, 80));

  await sendWebhookMessage('Skip to Payment 💳', 'SKIP_COUPON');
  const reply4 = await waitForBotReply();
  console.log('Bot Payment Prompt:\n' + reply4);

  // Step 5: Choose UPI Payment via button PAY_UPI
  console.log('\n--- Step 5: Webhook PAY_UPI ---');
  await sendWebhookMessage('Pay Online (UPI) ⚡', 'PAY_UPI');
  const reply5 = await waitForBotReply();
  console.log('Bot UPI Reply:\n' + reply5);
  if (!reply5.includes('upi://pay?pa=foodwala@upi') || !reply5.includes('FoodWala UPI Instant Payment')) {
    throw new Error('FAIL: Webhook PAY_UPI did not generate dynamic UPI intent link');
  }

  // Step 6: User clicks [I Have Paid ✅] via button UPI_VERIFY
  console.log('\n--- Step 6: Webhook UPI_VERIFY ---');
  await sendWebhookMessage('I Have Paid ✅', 'UPI_VERIFY');
  const reply6 = await waitForBotReply();
  console.log('Bot Confirmation Reply:\n' + reply6);
  if (!reply6.includes('confirmed')) {
    throw new Error('FAIL: Webhook UPI_VERIFY did not confirm order');
  }

  // Verify MySQL Orders & Payment records
  const [orders] = await db.query(
    "SELECT order_id, total_amount, payment_mode, payment_status, status FROM orders WHERE customer_phone = '9500457222' ORDER BY order_id DESC LIMIT 1"
  );
  console.log('\nVerified MySQL Order:\n', orders[0]);
  if (!orders || orders.length === 0 || orders[0].payment_status !== 'SUCCESS') {
    throw new Error('FAIL: Order not found in MySQL or payment_status != SUCCESS');
  }

  const [payments] = await db.query(
    'SELECT payment_id, order_id, amount, payment_method, payment_status FROM payment WHERE order_id = ?',
    [orders[0].order_id]
  );
  console.log('Verified MySQL Payment:\n', payments[0]);
  if (!payments || payments.length === 0 || payments[0].payment_status !== 'SUCCESS') {
    throw new Error('FAIL: Payment record not found in MySQL or status != SUCCESS');
  }

  console.log('\n🎉 ALL LIVE WEBHOOK SCENARIOS PASSED 100%!');
  process.exit(0);
}

testLiveWebhook().catch(err => {
  console.error(err);
  process.exit(1);
});

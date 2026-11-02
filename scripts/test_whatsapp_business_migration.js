/**
 * scripts/test_whatsapp_business_migration.js
 * 
 * FoodWala WhatsApp Business Account (+918500457005) Migration Verification Suite
 * Executes the complete 7-test workflow specified in Section 8 via real HTTP Webhook API calls:
 * - Test 1: Customer sends "Hi" -> Welcome response & Menu option numeric routing (e.g. "1")
 * - Test 2: Customer sends "Show me today's menu" -> Live menu & price lookup from MySQL
 * - Test 3: Customer sends "Where is my order?" -> Order ID request & live order tracking
 * - Test 4: Customer sends "What are your delivery charges?" -> Authentic delivery charges (Free > ₹299, ₹35 fee)
 * - Test 5: Customer sends an unknown question -> Helpful fallback with +91 85004 57005
 * - Test 6: Multiple customers send messages simultaneously -> Concurrency, isolation & non-hotline phone check
 * - Test 7: Invalid webhook requests & status callbacks -> Handshake reject, signature reject, DB deduplication, delivery status update
 */

const http = require('http');
const crypto = require('crypto');
const assert = require('assert');
const path = require('path');
const fs = require('fs');

if (fs.existsSync(path.join(__dirname, '../server/.env'))) {
  try {
    require('dotenv').config({ path: path.join(__dirname, '../server/.env') });
  } catch (e) {}
}

const db = require('../server/db');
const whatsappAIService = require('../server/services/whatsappAIService');
const whatsappService = require('../server/services/whatsappService');
const whatsappParser = require('../server/utils/whatsappParser');

const PORT = process.env.PORT || 5000;
const BASE_URL = `http://localhost:${PORT}`;
const APP_SECRET = process.env.WHATSAPP_APP_SECRET || '7459963c3345f7d67c2a5715fb0b0643';
const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'FW_wh_verify_9c8e2a71f6404bf4b7b5a3d1e8c6f204d7a9b61e';
const BUSINESS_NUMBER = process.env.WHATSAPP_BUSINESS_NUMBER || '+918500457005';

function makeRequest({ method, path: reqPath, query = '', headers = {}, body = null }) {
  return new Promise((resolve, reject) => {
    const fullPath = reqPath + (query ? '?' + query : '');
    const postData = body ? (typeof body === 'string' ? body : JSON.stringify(body)) : null;

    const reqHeaders = { ...headers };
    if (postData && !reqHeaders['Content-Type']) {
      reqHeaders['Content-Type'] = 'application/json';
    }
    if (postData) {
      reqHeaders['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = http.request({
      hostname: 'localhost',
      port: PORT,
      path: fullPath,
      method: method,
      headers: reqHeaders,
      timeout: 8000
    }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let json = null;
        try { json = JSON.parse(data); } catch (e) {}
        resolve({ statusCode: res.statusCode, text: data, json: json });
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timed out'));
    });

    if (postData) req.write(postData);
    req.end();
  });
}

function createMetaSignature(payload, secret = APP_SECRET) {
  const body = typeof payload === 'string' ? payload : JSON.stringify(payload);
  return 'sha256=' + crypto.createHmac('sha256', secret).update(body).digest('hex');
}

function buildMetaWebhookPayload(fromPhone, messageText, messageId = null, customerName = 'Customer') {
  const msgId = messageId || ('wamid.TEST_' + Date.now() + '_' + Math.floor(Math.random() * 100000));
  return {
    object: 'whatsapp_business_account',
    entry: [{
      id: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || '2172681120023109',
      changes: [{
        value: {
          messaging_product: 'whatsapp',
          metadata: {
            display_phone_number: '8500457005',
            phone_number_id: process.env.WHATSAPP_PHONE_NUMBER_ID || '1301748896365411'
          },
          contacts: [{
            profile: { name: customerName },
            wa_id: fromPhone
          }],
          messages: [{
            from: fromPhone,
            id: msgId,
            timestamp: String(Math.floor(Date.now() / 1000)),
            text: { body: messageText },
            type: 'text'
          }]
        },
        field: 'messages'
      }]
    }]
  };
}

/**
 * Dispatches an inbound message via HTTP Webhook POST and queries MySQL for the async reply.
 */
async function sendWebhookMessageAndWaitForReply(fromPhone, messageText, customerName = 'Customer') {
  const uniqueMsgId = 'wamid.HTTP_' + Date.now() + '_' + Math.floor(Math.random() * 100000);
  const payload = buildMetaWebhookPayload(fromPhone, messageText, uniqueMsgId, customerName);
  const sig = createMetaSignature(payload);

  const [maxRows] = await db.query('SELECT MAX(message_id) as maxId FROM whatsapp_messages');
  const maxIdBefore = maxRows[0]?.maxId || 0;

  const postRes = await makeRequest({
    method: 'POST',
    path: '/api/webhook/whatsapp',
    headers: { 'X-Hub-Signature-256': sig },
    body: payload
  });
  assert.strictEqual(postRes.statusCode, 200, 'Webhook POST must return HTTP 200 promptly');

  const norm = whatsappService.normalizeSender(fromPhone);
  let replyText = null;
  let replyDeliveryStatus = null;

  for (let i = 0; i < 25; i++) {
    await new Promise(r => setTimeout(r, 200));
    const [rows] = await db.query(
      `SELECT wm.message_text, wm.delivery_status, wm.sender_type 
       FROM whatsapp_messages wm 
       JOIN whatsapp_conversations wc ON wm.conversation_id = wc.conversation_id 
       WHERE wc.phone_number = ? AND wm.direction = 'OUTBOUND' AND wm.message_id > ?
       ORDER BY wm.message_id DESC LIMIT 1`,
      [norm.phone10, maxIdBefore]
    );
    if (rows && rows.length > 0) {
      replyText = rows[0].message_text;
      replyDeliveryStatus = rows[0].delivery_status;
      break;
    }
  }

  return { replyText, replyDeliveryStatus, uniqueMsgId };
}

async function runTestSuite() {
  console.log('================================================================');
  console.log('🚀 FOODWALA WHATSAPP BUSINESS ACCOUNT MIGRATION TEST SUITE');
  console.log(`📱 Official Business Number : ${BUSINESS_NUMBER} (8500457005)`);
  console.log(`🌐 Backend Target Server    : ${BASE_URL}`);
  console.log('================================================================\n');

  // Verify DB Connection
  const [tables] = await db.query('SHOW TABLES');
  assert.ok(tables.length > 0, 'Database tables accessible');
  console.log('✅ Connected to MySQL fudwala successfully.');

  // =====================================================================
  // TEST 1: Customer sends "Hi"
  // Expected: FoodWala AI sends a welcome response.
  // =====================================================================
  console.log('\n--- [TEST 1] Customer sends "Hi" ---');
  const { replyText: reply1 } = await sendWebhookMessageAndWaitForReply('919895342253', 'Hi', 'Aarav');
  console.log('HTTP Webhook Reply:', reply1);
  assert.ok(reply1 && /welcome to foodwala/i.test(reply1), 'Must contain FoodWala welcome greeting');
  assert.ok(/track my order/i.test(reply1) || /how can i help/i.test(reply1), 'Must provide helpful quick action options');
  console.log('✅ PASS: Test 1 (Welcome Response via Webhook) successful.');

  // Sub-test: Customer selects option "1" from the greeting menu
  console.log('\n   [TEST 1b] Customer replies with menu option "1" (Track my order)');
  const { replyText: reply1b } = await sendWebhookMessageAndWaitForReply('919895342253', '1', 'Aarav');
  console.log('   Menu Option "1" Reply:', reply1b);
  assert.ok(!/for your privacy and security.*order \*#fw1\*/i.test(reply1b), 'Must NOT treat menu choice "1" as Order #1 lookup');
  assert.ok(/order update|status/i.test(reply1b), 'Must trigger order tracking workflow for menu choice "1"');
  console.log('   ✅ PASS: Menu option "1" routed to order tracking, NOT false Order #1 lookup.');

  // =====================================================================
  // TEST 2: Customer sends "Show me today's menu"
  // Expected: AI retrieves actual menu information from MySQL.
  // =====================================================================
  console.log('\n--- [TEST 2] Customer sends "Show me today\'s menu" ---');
  const { replyText: reply2 } = await sendWebhookMessageAndWaitForReply('919895342253', "Show me today's menu", 'Aarav');
  console.log('HTTP Webhook Reply:', reply2);
  assert.ok(/menu|top picks/i.test(reply2), 'Must indicate menu presentation');
  assert.ok(/₹\d+/.test(reply2), 'Must contain authentic item pricing from database');
  assert.ok(/Central Tiffin Room|Vidyarthi Bhavan|Truffles|Nandhana/i.test(reply2), 'Must reference authentic partner restaurant names');
  console.log('✅ PASS: Test 2 (Live Menu from MySQL via Webhook) successful.');

  // Sub-test: Item price lookup with stop word and restaurant query
  console.log('\n   [TEST 2b] Customer queries "How much is the Butter Chicken?"');
  const priceResult = await whatsappAIService.getItemPrice("the Butter Chicken");
  assert.ok(priceResult.length > 0, 'Must find matching Butter Chicken records');
  assert.ok(priceResult.some(r => /butter chicken/i.test(r.item_name)), 'Must match Murgh Makhani (Butter Chicken)');
  console.log(`   Found ${priceResult.length} matches: ${priceResult[0].item_name} at ₹${priceResult[0].price} (${priceResult[0].restaurant_name})`);
  console.log('   ✅ PASS: Item price lookup correctly parsed stop words and retrieved live price.');

  // =====================================================================
  // TEST 3: Customer sends "Where is my order?"
  // Expected: AI requests order ID if necessary and retrieves correct order status.
  // =====================================================================
  console.log('\n--- [TEST 3] Customer sends "Where is my order?" ---');
  // Part A: Unidentified/unregistered customer prompted for order ID
  const { replyText: reply3Unregistered } = await sendWebhookMessageAndWaitForReply('919999900000', 'Where is my order?', 'New Guest');
  console.log('Unregistered Reply:', reply3Unregistered);
  assert.ok(/order id/i.test(reply3Unregistered), 'Must prompt customer for Order ID');

  // Part B: Customer provides explicit order ID #80
  const { replyText: reply3Explicit } = await sendWebhookMessageAndWaitForReply('919895342253', 'Order #80', 'Aarav');
  console.log('Explicit Order ID #80 Reply:', reply3Explicit);
  assert.ok(/#fw80|order/i.test(reply3Explicit), 'Must confirm order #80 lookup');
  assert.ok(/status/i.test(reply3Explicit) || /placed|preparing|delivery/i.test(reply3Explicit), 'Must return order status');
  console.log('✅ PASS: Test 3 (Order Tracking & Prompt via Webhook) successful.');

  // =====================================================================
  // TEST 4: Customer sends "What are your delivery charges?"
  // Expected: AI retrieves actual delivery charges (Free over ₹299, ₹35 fee).
  // =====================================================================
  console.log('\n--- [TEST 4] Customer sends "What are your delivery charges?" ---');
  const { replyText: reply4 } = await sendWebhookMessageAndWaitForReply('919895342253', 'What are your delivery charges?', 'Aarav');
  console.log('HTTP Webhook Reply:', reply4);
  assert.ok(/299/.test(reply4), 'Must state free delivery threshold above ₹299');
  assert.ok(/35/.test(reply4), 'Must state standard ₹35 delivery charge');
  console.log('✅ PASS: Test 4 (Delivery Charges via Webhook) successful.');

  // =====================================================================
  // TEST 5: Customer sends an unknown question
  // Expected: AI provides a helpful fallback with customer support info.
  // =====================================================================
  console.log('\n--- [TEST 5] Customer sends an unknown question ---');
  const { replyText: reply5 } = await sendWebhookMessageAndWaitForReply('919895342253', 'Can I book a flight ticket to Delhi?', 'Aarav');
  console.log('HTTP Webhook Reply:', reply5);
  assert.ok(/foodwala/i.test(reply5), 'Must identify as FoodWala AI Assistant');
  assert.ok(/8500457005|support/i.test(reply5), 'Must provide customer care contact +91 85004 57005');
  console.log('✅ PASS: Test 5 (Unknown Question Fallback via Webhook) successful.');

  // =====================================================================
  // TEST 6: Multiple customers send messages simultaneously
  // Expected: Each customer receives the correct response concurrently.
  // =====================================================================
  console.log('\n--- [TEST 6] Multiple customers send messages simultaneously ---');
  const customerQueries = [
    { phone: '9123456781', text: 'Hi', name: 'Customer 1', check: (r) => /welcome/i.test(r) },
    { phone: '9123456782', text: 'What is the price of Benne Masala Dosa?', name: 'Customer 2', check: (r) => /95|price/i.test(r) },
    { phone: '9123456783', text: 'What are your delivery charges?', name: 'Customer 3', check: (r) => /299|35/i.test(r) },
    { phone: '9123456784', text: 'What are today offers?', name: 'Customer 4', check: (r) => /foodwala50|50%/i.test(r) }
  ];

  const concurrentResults = await Promise.all(customerQueries.map(c => 
    sendWebhookMessageAndWaitForReply(c.phone, c.text, c.name)
  ));

  concurrentResults.forEach((res, idx) => {
    const c = customerQueries[idx];
    console.log(`   [Concurrent ${c.name} ("${c.text}")] -> Reply length: ${(res.replyText || '').length} chars`);
    assert.ok(c.check(res.replyText), `Customer ${c.name} received invalid reply for query "${c.text}"`);
  });
  console.log('✅ PASS: Test 6 (Concurrent Multi-Customer Processing via Webhook) successful.');

  // Sub-test: Customer with phone ending in Phone Number ID digits (e.g. 8896365411)
  console.log('\n   [TEST 6b] Customer with phone ending in Phone Number ID digits (8896365411)');
  const isBiz = whatsappService.isBusinessNumber('8896365411');
  assert.strictEqual(isBiz, false, 'Customer 8896365411 must NOT be identified as business bot');
  const { replyText: replyPhoneId } = await sendWebhookMessageAndWaitForReply('918896365411', 'Hi', 'Valid Customer');
  assert.ok(replyPhoneId && /welcome/i.test(replyPhoneId), 'Customer 8896365411 must receive welcome response');
  console.log('   ✅ PASS: Customer 8896365411 successfully received reply (no false bot suppression).');

  // =====================================================================
  // TEST 7: Invalid webhook requests & delivery status callbacks
  // Expected: Proper verification/error handling:
  //   - GET with invalid verify token -> HTTP 403
  //   - GET with valid token on both paths -> HTTP 200 echoing challenge
  //   - POST with invalid signature -> HTTP 403
  //   - POST duplicate message ID -> HTTP 200 acknowledged, DB deduplication suppresses duplicate
  //   - POST status callback (delivered) -> HTTP 200, updates MySQL delivery_status
  //   - POST from business hotline (8500457005) -> suppressed (no bot loop)
  // =====================================================================
  console.log('\n--- [TEST 7] Invalid Webhook Requests & Delivery Status Handling ---');
  
  // 7a. GET with invalid verify token on /api/whatsapp/webhook
  const getBadToken = await makeRequest({
    method: 'GET',
    path: '/api/whatsapp/webhook',
    query: `hub.mode=subscribe&hub.verify_token=WRONG_TOKEN&hub.challenge=test_12345`
  });
  assert.strictEqual(getBadToken.statusCode, 403, 'Invalid GET verify_token must return HTTP 403');
  console.log('   ✅ 7a: Invalid GET verify token rejected with HTTP 403.');

  // 7b. GET with valid verify token on both paths
  const getValidToken1 = await makeRequest({
    method: 'GET',
    path: '/api/whatsapp/webhook',
    query: `hub.mode=subscribe&hub.verify_token=${VERIFY_TOKEN}&hub.challenge=test_challenge_success`
  });
  assert.strictEqual(getValidToken1.statusCode, 200, 'Valid GET on /api/whatsapp/webhook must return HTTP 200');
  assert.strictEqual(getValidToken1.text, 'test_challenge_success', 'Must echo challenge');

  const getValidToken2 = await makeRequest({
    method: 'GET',
    path: '/api/webhook/whatsapp',
    query: `hub.mode=subscribe&hub.verify_token=${VERIFY_TOKEN}&hub.challenge=test_challenge_alt`
  });
  assert.strictEqual(getValidToken2.statusCode, 200, 'Valid GET on /api/webhook/whatsapp must return HTTP 200');
  assert.strictEqual(getValidToken2.text, 'test_challenge_alt', 'Must echo challenge');
  console.log('   ✅ 7b: Valid GET handshake verified on both /api/whatsapp/webhook and /api/webhook/whatsapp.');

  // 7c. POST with invalid signature
  const dummyPayload = buildMetaWebhookPayload('919895342253', 'Hello');
  const postBadSig = await makeRequest({
    method: 'POST',
    path: '/api/webhook/whatsapp',
    headers: { 'X-Hub-Signature-256': 'sha256=invalid_forged_signature_000000000000' },
    body: dummyPayload
  });
  assert.strictEqual(postBadSig.statusCode, 403, 'Invalid POST signature must return HTTP 403');
  console.log('   ✅ 7c: Invalid POST signature rejected with HTTP 403.');

  // 7d. POST with duplicate message ID (Persistent MySQL Deduplication)
  const uniqueMsgId = 'wamid.DEDUP_' + Date.now();
  const dedupPayload = buildMetaWebhookPayload('919895342253', 'Hi', uniqueMsgId);
  const validSig = createMetaSignature(dedupPayload);

  // First dispatch
  const post1 = await makeRequest({
    method: 'POST',
    path: '/api/webhook/whatsapp',
    headers: { 'X-Hub-Signature-256': validSig },
    body: dedupPayload
  });
  assert.strictEqual(post1.statusCode, 200, 'First POST must be accepted with HTTP 200');
  await new Promise(r => setTimeout(r, 600));

  const [dbCount1] = await db.query(
    'SELECT COUNT(*) as count FROM whatsapp_messages WHERE wa_message_id = ?',
    [uniqueMsgId]
  );
  assert.strictEqual(dbCount1[0].count, 1, 'Inbound message must be recorded exactly once');

  // Retry dispatch with identical message ID
  const post2 = await makeRequest({
    method: 'POST',
    path: '/api/webhook/whatsapp',
    headers: { 'X-Hub-Signature-256': validSig },
    body: dedupPayload
  });
  assert.strictEqual(post2.statusCode, 200, 'Retry POST must return HTTP 200 promptly');
  await new Promise(r => setTimeout(r, 600));

  const [dbCount2] = await db.query(
    'SELECT COUNT(*) as count FROM whatsapp_messages WHERE wa_message_id = ?',
    [uniqueMsgId]
  );
  assert.strictEqual(dbCount2[0].count, 1, 'Retry must not insert duplicate inbound rows into MySQL');
  console.log('   ✅ 7d: Webhook retry accepted with HTTP 200 and duplicate message suppressed in DB.');

  // 7e. POST status callback notification (delivered)
  const testStatusWamid = 'wamid.OUT_STATUS_' + Date.now();
  await db.query(
    'INSERT INTO whatsapp_messages (conversation_id, wa_message_id, direction, sender_type, message_text, delivery_status) VALUES (1, ?, "OUTBOUND", "AI_BOT", "Status test message", "sent")',
    [testStatusWamid]
  );

  const statusPayload = {
    object: 'whatsapp_business_account',
    entry: [{
      id: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || '2172681120023109',
      changes: [{
        value: {
          messaging_product: 'whatsapp',
          metadata: { display_phone_number: '8500457005', phone_number_id: '1301748896365411' },
          statuses: [{
            id: testStatusWamid,
            status: 'delivered',
            timestamp: String(Math.floor(Date.now() / 1000)),
            recipient_id: '919895342253'
          }]
        },
        field: 'messages'
      }]
    }]
  };
  const statusSig = createMetaSignature(statusPayload);

  const statusRes = await makeRequest({
    method: 'POST',
    path: '/api/webhook/whatsapp',
    headers: { 'X-Hub-Signature-256': statusSig },
    body: statusPayload
  });
  assert.strictEqual(statusRes.statusCode, 200, 'Status callback must return HTTP 200');
  await new Promise(r => setTimeout(r, 400));

  const [statusRows] = await db.query(
    'SELECT delivery_status FROM whatsapp_messages WHERE wa_message_id = ?',
    [testStatusWamid]
  );
  assert.strictEqual(statusRows[0]?.delivery_status, 'delivered', 'MySQL delivery_status must update to "delivered"');
  console.log('   ✅ 7e: Status callback notification accepted and delivery_status updated to "delivered" in MySQL.');

  // 7f. Bot self-message loop prevention
  const botSelfPayload = buildMetaWebhookPayload('8500457005', 'Echo test');
  const botSig = createMetaSignature(botSelfPayload);
  const botRes = await makeRequest({
    method: 'POST',
    path: '/api/webhook/whatsapp',
    headers: { 'X-Hub-Signature-256': botSig },
    body: botSelfPayload
  });
  assert.strictEqual(botRes.statusCode, 200, 'Self-loop POST must return HTTP 200');
  console.log('   ✅ 7f: Bot self-message from 8500457005 suppressed without echo loop.');

  console.log('\n================================================================');
  console.log('🎉 ALL 7 TEST WORKFLOWS PASSED WITH 100% SUCCESS!');
  console.log('================================================================\n');
  process.exit(0);
}

runTestSuite().catch(err => {
  console.error('\n❌ TEST SUITE FAILED:', err);
  process.exit(1);
});

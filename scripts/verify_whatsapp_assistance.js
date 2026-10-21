/**
 * scripts/verify_whatsapp_assistance.js
 * 
 * End-to-End Verification Test for FoodWala WhatsApp Assistance Feature:
 * 1. Meta Webhook Handshake (GET /api/webhook/whatsapp)
 * 2. Inbound Customer WhatsApp Message (POST /api/webhook/whatsapp)
 * 3. AI Intent Routing on WhatsApp (Cancellation policy grounded reply)
 * 4. Database Persistence (whatsapp_conversations & whatsapp_messages)
 * 5. Web Chat WhatsApp Assistance Discovery (POST /api/support/chat)
 * 6. Frontend UI WhatsApp Integration Checks (Floating action, modal chip, header button)
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

const PORT = process.env.PORT || 5000;
const BASE_URL = `http://localhost:${PORT}`;
const APP_SECRET = process.env.WHATSAPP_APP_SECRET || '';
const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'FW_wh_verify_9c8e2a71f6404bf4b7b5a3d1e8c6f204d7a9b61e';
const SUPPORT_PHONE = process.env.SUPPORT_PHONE_NUMBER || '918500457005';

function request({ method, path: reqPath, headers = {}, body = null }) {
  return new Promise((resolve, reject) => {
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
      path: reqPath,
      method: method,
      headers: reqHeaders
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
    if (postData) req.write(postData);
    req.end();
  });
}

async function runVerification() {
  console.log('\n============================================================');
  console.log('🧪 VERIFYING FOODWALA WHATSAPP ASSISTANCE FEATURE');
  console.log('============================================================\n');

  // Check 1: GET Handshake Verification
  console.log('Test 1: Meta Webhook GET Handshake Verification...');
  const challengeCode = 'fw_challenge_' + Date.now();
  const getRes = await request({
    method: 'GET',
    path: `/api/webhook/whatsapp?hub.mode=subscribe&hub.verify_token=${encodeURIComponent(VERIFY_TOKEN)}&hub.challenge=${challengeCode}`
  });
  assert.strictEqual(getRes.statusCode, 200, 'Handshake must return HTTP 200');
  assert.strictEqual(getRes.text, challengeCode, 'Handshake must return challenge plain text');
  console.log('   ✅ PASS: Meta Webhook handshake verified successfully (HTTP 200).');

  // Check 2: Web Support Chat Discovery of WhatsApp Assistance
  console.log('\nTest 2: Web Support Chat Discovery of WhatsApp Assistance...');
  const webChatRes = await request({
    method: 'POST',
    path: '/api/support/chat',
    body: { message: 'Can I chat with FoodWala on WhatsApp?' }
  });
  assert.strictEqual(webChatRes.statusCode, 200, 'Web chat must return HTTP 200');
  const chatReply = webChatRes.json?.reply || '';
  assert.ok(chatReply.includes('WhatsApp'), 'Must identify WhatsApp support');
  assert.ok(chatReply.includes(SUPPORT_PHONE), 'Must include official support phone number');
  assert.ok(chatReply.includes('wa.me'), 'Must include click-to-chat wa.me link');
  console.log('   ✅ PASS: Web chat returns verified WhatsApp hotline and direct click-to-chat link.');

  // Check 3: Inbound WhatsApp Customer Message Processing
  console.log('\nTest 3: Inbound WhatsApp Customer Message Simulation...');
  const testPhone = '919895342253';
  const testMsgId = 'wamid.WA_ASSIST_TEST_' + Date.now();

  const [beforeCount] = await db.query(
    'SELECT COUNT(*) as count FROM whatsapp_messages wm JOIN whatsapp_conversations wc ON wm.conversation_id = wc.conversation_id WHERE wc.wa_id = ? AND wm.direction = "OUTBOUND"',
    [testPhone]
  );
  const outCountBefore = beforeCount[0].count;

  const inboundPayload = JSON.stringify({
    object: 'whatsapp_business_account',
    entry: [{
      id: '2172681120023109',
      changes: [{
        value: {
          messaging_product: 'whatsapp',
          metadata: { display_phone_number: '15550234567', phone_number_id: '1301748896365411' },
          contacts: [{ profile: { name: 'WhatsApp Assistance User' }, wa_id: testPhone }],
          messages: [{
            from: testPhone,
            id: testMsgId,
            timestamp: String(Math.floor(Date.now() / 1000)),
            text: { body: 'Hi FoodWala, what is your order cancellation policy?' },
            type: 'text'
          }]
        },
        field: 'messages'
      }]
    }]
  });

  const hmac = 'sha256=' + crypto.createHmac('sha256', APP_SECRET).update(inboundPayload).digest('hex');
  const inboundRes = await request({
    method: 'POST',
    path: '/api/webhook/whatsapp',
    headers: {
      'Content-Type': 'application/json',
      'X-Hub-Signature-256': hmac
    },
    body: inboundPayload
  });

  assert.strictEqual(inboundRes.statusCode, 200, 'Webhook must accept event with HTTP 200');
  assert.strictEqual(inboundRes.json?.status, 'EVENT_RECEIVED');
  console.log('   ✅ PASS: WhatsApp incoming message safely accepted with HTTP 200.');

  // Check 4: Outbound AI Reply Verification in Database
  console.log('\nTest 4: WhatsApp Outbound AI Reply Generation & Delivery...');
  let replyRecord = null;
  for (let i = 0; i < 50; i++) {
    await new Promise(r => setTimeout(r, 200));
    const [msgs] = await db.query(
      `SELECT wm.message_text, wm.delivery_status, wm.direction, wm.created_at
       FROM whatsapp_messages wm
       JOIN whatsapp_conversations wc ON wm.conversation_id = wc.conversation_id
       WHERE wc.wa_id = ? AND wm.direction = "OUTBOUND"
       ORDER BY wm.message_id DESC
       LIMIT 1`,
      [testPhone]
    );

    const [currentCount] = await db.query(
      'SELECT COUNT(*) as count FROM whatsapp_messages wm JOIN whatsapp_conversations wc ON wm.conversation_id = wc.conversation_id WHERE wc.wa_id = ? AND wm.direction = "OUTBOUND"',
      [testPhone]
    );

    if (currentCount[0].count > outCountBefore && msgs && msgs.length > 0) {
      replyRecord = msgs[0];
      break;
    }
  }

  assert.ok(replyRecord, 'Outbound reply must be recorded in MySQL database');
  assert.ok(replyRecord.message_text.includes('Cancellation Policy') || replyRecord.message_text.includes('60 seconds') || replyRecord.message_text.includes('60-Second'), 'WhatsApp reply must contain cancellation policy');
  console.log('   ✅ PASS: Outbound WhatsApp reply generated and recorded in database.');
  console.log(`   Reply Preview: "${replyRecord.message_text.split('\n')[0]}"`);

  // Check 5: Frontend UI Code Integrity
  console.log('\nTest 5: Frontend UI WhatsApp Integration Integrity...');
  const helpJs = fs.readFileSync(path.join(__dirname, '../js/help-assistance.js'), 'utf8');
  assert.ok(helpJs.includes('fw-floating-whatsapp-btn'), 'help-assistance.js must contain floating WhatsApp button');
  assert.ok(helpJs.includes('wa.me'), 'help-assistance.js must contain wa.me link');
  assert.ok(helpJs.includes('WhatsApp Support'), 'help-assistance.js must contain WhatsApp Support chip');

  const css = fs.readFileSync(path.join(__dirname, '../css/animations-3d.css'), 'utf8');
  assert.ok(css.includes('.fw-help-floating-wa-btn'), 'animations-3d.css must contain .fw-help-floating-wa-btn styles');
  console.log('   ✅ PASS: Frontend UI assets correctly configured for WhatsApp Assistance.');

  console.log('\n============================================================');
  console.log('🎉 ALL WHATSAPP ASSISTANCE TESTS PASSED 100%!');
  console.log('============================================================\n');

  process.exit(0);
}

runVerification().catch(err => {
  console.error('\n❌ Verification Failed:', err);
  process.exit(1);
});

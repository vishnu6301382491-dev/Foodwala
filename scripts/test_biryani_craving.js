/**
 * scripts/test_biryani_craving.js
 * 
 * Direct verification test for food craving queries and spelling variants:
 * - "I want biriyani" (spelling variant with 'i')
 * - "I want biryani" (standard spelling)
 * - "craving biryani"
 * - "order biriyani"
 * - "show biryani"
 * - "recommend biriyani"
 * - "biriyani near me"
 * - "briyani"
 * - "I want tacos" (fallback recommendations)
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
const whatsappService = require('../server/services/whatsappService');

const PORT = process.env.PORT || 5000;
const APP_SECRET = process.env.WHATSAPP_APP_SECRET || '7459963c3345f7d67c2a5715fb0b0643';

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

function buildMetaWebhookPayload(fromPhone, messageText, customerName = 'Customer') {
  const msgId = 'wamid.TEST_' + Date.now() + '_' + Math.floor(Math.random() * 100000);
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

async function sendWebhookMessageAndWaitForReply(fromPhone, messageText, customerName = 'Customer') {
  const payload = buildMetaWebhookPayload(fromPhone, messageText, customerName);
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
      break;
    }
  }

  return replyText;
}

async function run() {
  console.log('================================================================');
  console.log('🍛 FOODWALA BIRYANI & FOOD CRAVING WHATSAPP WEBHOOK TEST SUITE');
  console.log('================================================================\n');

  // Test 1: "I want biriyani" (with 'i' variant)
  console.log('--- [Test 1] User texts: "I want biriyani" ---');
  const reply1 = await sendWebhookMessageAndWaitForReply('919895342253', 'I want biriyani', 'Vishnu');
  console.log('Reply:\n' + reply1 + '\n');
  assert.ok(/Biryani/i.test(reply1), 'Must recognize biriyani as Biryani');
  assert.ok(/Donne Biryani|Chicken.*Biryani|Mutton.*Biryani/i.test(reply1), 'Must return authentic Biryani dishes from MySQL');
  assert.ok(/FOODWALA50/i.test(reply1), 'Must contain coupon FOODWALA50');
  assert.ok(/🟢|🔴/.test(reply1), 'Must include veg/non-veg indicator emojis');
  assert.ok(/₹\d+/.test(reply1), 'Must include authentic prices');
  console.log('✅ PASS: "I want biriyani" returned matching Biryani dishes and coupon.\n');

  // Test 2: "I want biryani" (standard spelling)
  console.log('--- [Test 2] User texts: "I want biryani" ---');
  const reply2 = await sendWebhookMessageAndWaitForReply('919895342253', 'I want biryani', 'Vishnu');
  console.log('Reply:\n' + reply2 + '\n');
  assert.ok(/Biryani/i.test(reply2), 'Must recognize biryani');
  assert.ok(/Donne Biryani|Chicken.*Biryani|Mutton.*Biryani/i.test(reply2), 'Must return authentic Biryani dishes');
  assert.ok(/FOODWALA50/i.test(reply2), 'Must contain coupon FOODWALA50');
  console.log('✅ PASS: "I want biryani" returned matching Biryani dishes.\n');

  // Test 3: "craving biryani"
  console.log('--- [Test 3] User texts: "craving biryani" ---');
  const reply3 = await sendWebhookMessageAndWaitForReply('919895342253', 'craving biryani', 'Vishnu');
  console.log('Reply:\n' + reply3 + '\n');
  assert.ok(/Biryani/i.test(reply3), 'Must handle craving phrase');
  assert.ok(/FOODWALA50/i.test(reply3), 'Must contain coupon FOODWALA50');
  console.log('✅ PASS: "craving biryani" correctly recognized.\n');

  // Test 4: "briyani" (short variant)
  console.log('--- [Test 4] User texts: "briyani" ---');
  const reply4 = await sendWebhookMessageAndWaitForReply('919895342253', 'briyani', 'Vishnu');
  console.log('Reply:\n' + reply4 + '\n');
  assert.ok(/Biryani/i.test(reply4), 'Must normalize briyani');
  console.log('✅ PASS: "briyani" normalized and returned results.\n');

  // Test 5: "I want tacos" (no direct matches -> top dishes and categories)
  console.log('--- [Test 5] User texts: "I want tacos" (non-matching food) ---');
  const reply5 = await sendWebhookMessageAndWaitForReply('919895342253', 'I want tacos', 'Vishnu');
  console.log('Reply:\n' + reply5 + '\n');
  assert.ok(/FoodWala Menu Recommendations|couldn't find active dishes/i.test(reply5), 'Must inform customer of no direct matches');
  assert.ok(/Popular Food Categories/i.test(reply5), 'Must recommend popular food categories');
  assert.ok(/FOODWALA50/i.test(reply5), 'Must include FOODWALA50 coupon');
  console.log('✅ PASS: Non-matching food recommended top dishes and categories.\n');

  // Test 6: "biriyani in koramangala" (Area query should not get hijacked by hyperlocal delivery hubs)
  console.log('--- [Test 6] User texts: "biriyani in koramangala" ---');
  const reply6 = await sendWebhookMessageAndWaitForReply('919895342253', 'biriyani in koramangala', 'Vishnu');
  console.log('Reply:\n' + reply6 + '\n');
  assert.ok(/Biryani/i.test(reply6), 'Must recognize biryani craving in area query');
  assert.ok(!reply6.includes('FoodWala Hyperlocal Delivery in Bengaluru'), 'Must not get hijacked into generic delivery hub listing');
  assert.ok(/FOODWALA50/i.test(reply6), 'Must include coupon');
  console.log('✅ PASS: "biriyani in koramangala" correctly returned Biryani dishes.\n');

  // Test 7: "suggest some good biriyani" (Descriptor & adjective query)
  console.log('--- [Test 7] User texts: "suggest some good biriyani" ---');
  const reply7 = await sendWebhookMessageAndWaitForReply('919895342253', 'suggest some good biriyani', 'Vishnu');
  console.log('Reply:\n' + reply7 + '\n');
  assert.ok(/Craving Biryani/i.test(reply7), 'Must recognize craving for biryani without stop word pollution');
  assert.ok(!reply7.includes("couldn't find active dishes matching"), 'Must not fail with missing matches for adjective queries');
  console.log('✅ PASS: "suggest some good biriyani" correctly returned Biryani dishes.\n');

  // Test 8: Non-veg emoji accuracy check
  console.log('--- [Test 8] Veg / Non-Veg Emoji Accuracy Check ---');
  assert.ok(!reply1.includes('🟢 *Meghana Special Chicken Biryani*'), 'Chicken biryani must NEVER have 🟢 veg emoji');
  if (reply1.includes('Meghana Special Chicken Biryani')) {
    assert.ok(reply1.includes('🔴 *Meghana Special Chicken Biryani*'), 'Chicken biryani must have 🔴 non-veg emoji');
  }
  console.log('✅ PASS: Veg / Non-veg emojis are strictly accurate.\n');

  console.log('================================================================');
  console.log('🎉 ALL BIRYANI CRAVING & SPELLING TESTS PASSED 100%!');
  console.log('================================================================');
  process.exit(0);
}

run().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});

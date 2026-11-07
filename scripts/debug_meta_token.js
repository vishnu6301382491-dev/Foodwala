const https = require('https');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../server/.env') });

const token = process.env.WHATSAPP_ACCESS_TOKEN || process.env.META_ACCESS_TOKEN;
const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
const wabaId = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID;

console.log('Testing Meta Token with phone ID:', phoneId);

function callGet(url) {
  return new Promise((resolve) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    }).on('error', err => resolve({ error: err.message }));
  });
}

async function run() {
  console.log('\n--- 0. Debugging Token Info ---');
  const r0 = await callGet(`https://graph.facebook.com/debug_token?input_token=${token}&access_token=${token}`);
  console.log('Token Info:', JSON.stringify(r0, null, 2));

  console.log('\n--- 1. Checking Phone Number ID endpoint ---');
  const r1 = await callGet(`https://graph.facebook.com/v21.0/${phoneId}?fields=id,verified_name,display_phone_number,quality_rating,account_mode,status&access_token=${token}`);
  console.log('Result:', JSON.stringify(r1, null, 2));

  console.log('\n--- 2. Checking /me endpoint ---');
  const r2 = await callGet(`https://graph.facebook.com/v21.0/me?fields=id,name,business&access_token=${token}`);
  console.log('Result:', JSON.stringify(r2, null, 2));

  console.log('\n--- 2b. Checking /me/permissions ---');
  const r2b = await callGet(`https://graph.facebook.com/v21.0/me/permissions?access_token=${token}`);
  console.log('Permissions:', JSON.stringify(r2b, null, 2));

  console.log('\n--- 2c. Checking App WABAs ---');
  const r2c = await callGet(`https://graph.facebook.com/v21.0/4702946809933364/whatsapp_business_accounts?access_token=${token}`);
  console.log('App WABAs:', JSON.stringify(r2c, null, 2));

  console.log('\n--- 3. Testing POST /messages (Template hello_world) ---');
  const postPayload = JSON.stringify({
    messaging_product: 'whatsapp',
    to: '916301382491',
    type: 'template',
    template: {
      name: 'hello_world',
      language: { code: 'en_US' }
    }
  });
  const postRes = await new Promise((resolve) => {
    const postReq = https.request({
      hostname: 'graph.facebook.com',
      path: `/v21.0/${phoneId}/messages`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postPayload)
      }
    }, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve({ status: res.statusCode, body: d }));
    });
    postReq.on('error', err => resolve({ error: err.message }));
    postReq.write(postPayload);
    postReq.end();
  });
  console.log('POST Result:', JSON.stringify(postRes, null, 2));
}

run();

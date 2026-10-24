const https = require('https');
require('dotenv').config({ path: 'server/.env' });

const token = process.env.WHATSAPP_ACCESS_TOKEN || process.env.META_ACCESS_TOKEN;
const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;

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
  console.log('\n--- 1. Checking Phone Number ID endpoint ---');
  const r1 = await callGet(`https://graph.facebook.com/v21.0/${phoneId}?access_token=${token}`);
  console.log('Result:', JSON.stringify(r1, null, 2));

  console.log('\n--- 2. Checking /me endpoint ---');
  const r2 = await callGet(`https://graph.facebook.com/v21.0/me?access_token=${token}`);
  console.log('Result:', JSON.stringify(r2, null, 2));

  console.log('\n--- 3. Checking WABA endpoint ---');
  const wabaId = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID;
  const r3 = await callGet(`https://graph.facebook.com/v21.0/${wabaId}?access_token=${token}`);
  console.log('Result:', JSON.stringify(r3, null, 2));
}

run();

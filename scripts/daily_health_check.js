/**
 * scripts/daily_health_check.js
 * FoodWala Automated Daily Morning Health & Tunnel Inspection
 */

const path = require('path');
const http = require('http');
const https = require('https');
require('dotenv').config({ path: path.join(__dirname, '../server/.env') });
const db = require('../server/db');

async function runHealthCheck() {
  console.log('================================================================');
  console.log('  FoodWala Daily Morning Health & Tunnel Inspection');
  console.log(`  Timestamp: ${new Date().toISOString()}`);
  console.log('================================================================\n');

  let allHealthy = true;

  // 1. Backend Port 5000 Health
  console.log('[1/3] Checking Backend API Server on port 5000...');
  const healthPromise = new Promise((resolve) => {
    http.get('http://localhost:5000/api/whatsapp/health', res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try {
          const json = JSON.parse(d);
          if (json.success && json.tokenValid) {
            console.log('   ✅ Backend API Healthy:', json.service);
            console.log('   ✅ Business Hotline   :', json.businessNumber);
            console.log('   ✅ WhatsApp Token     : Valid');
          } else {
            console.warn('   ⚠️ Backend Warning:', d);
            allHealthy = false;
          }
        } catch (e) {
          console.error('   ❌ Invalid JSON from /api/whatsapp/health');
          allHealthy = false;
        }
        resolve();
      });
    }).on('error', err => {
      console.error('   ❌ API Server Unreachable on port 5000:', err.message);
      allHealthy = false;
      resolve();
    });
  });
  await healthPromise;

  // 2. MySQL Connection
  console.log('\n[2/3] Checking MySQL Database connection...');
  try {
    const [restaurants] = await db.query('SELECT COUNT(*) as cnt FROM restaurant WHERE is_active = 1');
    const [orders] = await db.query('SELECT COUNT(*) as cnt FROM orders');
    console.log(`   ✅ MySQL fudwala Connected -> Active Restaurants: ${restaurants[0].cnt} | Orders: ${orders[0].cnt}`);
  } catch (err) {
    console.error('   ❌ MySQL Error:', err.message);
    allHealthy = false;
  }

  // 3. Meta Cloud API Subscription
  console.log('\n[3/3] Checking Meta Cloud API Webhook Subscription...');
  const APP_ID = '4702946809933364';
  const APP_SECRET = process.env.WHATSAPP_APP_SECRET || '7459963c3345f7d67c2a5715fb0b0643';
  const appToken = APP_ID + '|' + APP_SECRET;

  const metaPromise = new Promise((resolve) => {
    https.get('https://graph.facebook.com/v21.0/' + APP_ID + '/subscriptions?access_token=' + appToken, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try {
          const json = JSON.parse(d);
          const sub = json.data?.[0];
          if (sub && sub.active) {
            console.log('   ✅ Meta Webhook Subscription Active');
            console.log('   ✅ Live Callback URL:', sub.callback_url);
          } else {
            console.warn('   ⚠️ Webhook subscription inactive on Meta!');
            allHealthy = false;
          }
        } catch (e) {
          console.error('   ❌ Meta Subscription query failed:', d);
          allHealthy = false;
        }
        resolve();
      });
    }).on('error', err => {
      console.error('   ❌ Meta API unreachable:', err.message);
      allHealthy = false;
      resolve();
    });
  });
  await metaPromise;

  console.log('\n================================================================');
  if (allHealthy) {
    console.log('🎉 ALL SYSTEMS HEALTHY & OPERATIONAL (No action required)');
  } else {
    console.log('⚠️ ATTENTION NEEDED: One or more services reported warnings.');
  }
  console.log('================================================================\n');

  process.exit(allHealthy ? 0 : 1);
}

runHealthCheck();

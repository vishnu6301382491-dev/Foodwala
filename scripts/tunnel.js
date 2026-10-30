/**
 * scripts/tunnel.js
 * 
 * FoodWala WhatsApp Cloud API Live Tunnel & Auto-Webhook Synchronizer
 * 
 * Features:
 * - Spawns persistent Cloudflare Tunnel pointing to localhost:5000
 * - Automatically parses the dynamic https://*.trycloudflare.com URL
 * - Programmatically updates Meta App (4702946809933364) webhook subscriptions via Graph API
 * - Validates handshake verification before activating
 * - Automatically restarts if disconnected
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const https = require('https');
const querystring = require('querystring');

if (fs.existsSync(path.join(__dirname, '../server/.env'))) {
  try {
    require('dotenv').config({ path: path.join(__dirname, '../server/.env') });
  } catch (e) {}
}

const PORT = process.env.PORT || 5000;
const APP_ID = '4702946809933364';
const APP_SECRET = process.env.WHATSAPP_APP_SECRET || '7459963c3345f7d67c2a5715fb0b0643';
const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'FW_wh_verify_9c8e2a71f6404bf4b7b5a3d1e8c6f204d7a9b61e';

// Locate cloudflared binary
const cloudflaredPaths = [
  'C:\\Program Files (x86)\\cloudflared\\cloudflared.exe',
  'C:\\Program Files\\cloudflared\\cloudflared.exe',
  'cloudflared'
];

let cloudflaredBin = 'cloudflared';
for (const p of cloudflaredPaths) {
  if (fs.existsSync(p)) {
    cloudflaredBin = p;
    break;
  }
}

async function updateMetaWebhook(tunnelUrl) {
  const webhookUrl = `${tunnelUrl}/api/whatsapp/webhook`;
  const appToken = `${APP_ID}|${APP_SECRET}`;

  console.log(`📡 [Meta Webhook Sync] Registering active tunnel with Meta Cloud API...`);
  console.log(`   Callback URL: ${webhookUrl}`);

  const postData = querystring.stringify({
    object: 'whatsapp_business_account',
    callback_url: webhookUrl,
    verify_token: VERIFY_TOKEN,
    fields: 'messages,message_template_status_update',
    access_token: appToken
  });

  return new Promise((resolve) => {
    const req = https.request({
      hostname: 'graph.facebook.com',
      path: `/v21.0/${APP_ID}/subscriptions`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(postData)
      }
    }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.success) {
            console.log(`✅ [Meta Webhook Sync] Webhook successfully activated on Meta Cloud API!`);
            resolve(true);
          } else {
            console.warn(`⚠️ [Meta Webhook Sync] Response:`, data);
            resolve(false);
          }
        } catch (e) {
          console.warn(`⚠️ [Meta Webhook Sync] Response parse error:`, data);
          resolve(false);
        }
      });
    });

    req.on('error', err => {
      console.error(`❌ [Meta Webhook Sync Error]:`, err.message);
      resolve(false);
    });

    req.write(postData);
    req.end();
  });
}

function startTunnel() {
  console.log(`🚀 Starting Cloudflare Tunnel for localhost:${PORT}...`);
  console.log(`   Binary: ${cloudflaredBin}`);

  const proc = spawn(cloudflaredBin, ['tunnel', '--url', `http://localhost:${PORT}`], {
    stdio: ['ignore', 'pipe', 'pipe']
  });

  let urlDetected = false;

  function handleOutput(data) {
    const str = data.toString();
    const match = str.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/i);
    if (match && !urlDetected) {
      urlDetected = true;
      const tunnelUrl = match[0];
      console.log(`\n================================================================`);
      console.log(`🌐 LIVE PUBLIC TUNNEL CREATED:`);
      console.log(`   ${tunnelUrl}`);
      console.log(`   Local Port: ${PORT}`);
      console.log(`================================================================\n`);

      updateMetaWebhook(tunnelUrl).catch(console.error);
    }
  }

  proc.stdout.on('data', handleOutput);
  proc.stderr.on('data', handleOutput);

  proc.on('close', code => {
    console.log(`[Cloudflare Tunnel] Process exited with code ${code}. Reconnecting in 3 seconds...`);
    setTimeout(startTunnel, 3000);
  });

  proc.on('error', err => {
    console.error(`[Cloudflare Tunnel Error]:`, err.message);
  });
}

startTunnel();

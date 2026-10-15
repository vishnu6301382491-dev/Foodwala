/**
 * scripts/verify-deploy.js
 * 
 * Verifies live deployment of the FoodWala API backend.
 * Zero external dependencies (uses standard Node.js https/http).
 * 
 * Usage:
 *   node scripts/verify-deploy.js [baseUrl] [expectedCommit]
 *   npm run verify
 */

const https = require('https');
const http = require('http');
const { URL } = require('url');

const DEFAULT_URL = 'https://foodwala-backend.onrender.com';
const baseUrl = (process.argv[2] || process.env.RENDER_SERVICE_URL || DEFAULT_URL).replace(/\/+$/, '');
const expectedCommit = process.argv[3] || process.env.EXPECTED_COMMIT || null;

const POLL_INTERVAL_MS = 10000; // 10 seconds
const MAX_ATTEMPTS = 30; // 30 * 10s = 5 minutes

function fetchHealth(urlStr) {
  return new Promise((resolve) => {
    try {
      const parsedUrl = new URL(urlStr);
      const client = parsedUrl.protocol === 'https:' ? https : http;

      const req = client.get(urlStr, { timeout: 8000 }, (res) => {
        let rawData = '';
        res.on('data', (chunk) => { rawData += chunk; });
        res.on('end', () => {
          let json = null;
          try {
            json = JSON.parse(rawData);
          } catch (e) {
            // Not JSON (e.g. 404 HTML)
          }
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: rawData,
            json: json
          });
        });
      });

      req.on('error', (err) => {
        resolve({
          statusCode: null,
          error: err.message
        });
      });

      req.on('timeout', () => {
        req.destroy();
        resolve({
          statusCode: null,
          error: 'Request timed out after 8000ms'
        });
      });
    } catch (err) {
      resolve({
        statusCode: null,
        error: err.message
      });
    }
  });
}

async function verify() {
  const targetUrl = `${baseUrl}/api/health`;
  console.log('======================================================');
  console.log('🔍 FoodWala Deployment Verification');
  console.log(`🌐 Target URL      : ${targetUrl}`);
  if (expectedCommit) {
    console.log(`🎯 Expected Commit : ${expectedCommit}`);
  }
  console.log(`⏱️ Polling Interval: 10s (max 5 minutes / 30 attempts)`);
  console.log('======================================================\n');

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const timestamp = new Date().toLocaleTimeString();
    process.stdout.write(`[Attempt ${attempt}/${MAX_ATTEMPTS} @ ${timestamp}] Probing ${targetUrl}... `);

    const result = await fetchHealth(targetUrl);

    if (result.statusCode === 200 && result.json && result.json.status === 'ok') {
      const data = result.json;
      console.log('SUCCESS (HTTP 200 OK)');
      console.log('\n------------------------------------------------------');
      console.log('✅ DEPLOYMENT STATUS: HEALTHY');
      console.log(`📦 Version         : ${data.version || 'unknown'}`);
      console.log(`🔖 Deployed Commit : ${data.commit || 'unknown'}`);
      console.log(`🗄️ Database Live   : ${data.db ? 'YES (Connected)' : 'NO (Disconnected)'}`);
      if (data.database && data.database.error) {
        console.log(`⚠️ Database Error  : ${data.database.error}`);
      } else if (data.database && data.database.database) {
        console.log(`💾 Connected DB    : ${data.database.database} on ${data.database.host}:${data.database.port}`);
      }

      if (expectedCommit) {
        const matches = (data.commit || '').startsWith(expectedCommit) || expectedCommit.startsWith(data.commit || '');
        if (matches) {
          console.log(`🎯 Commit Match    : MATCHED (${expectedCommit})`);
          console.log('------------------------------------------------------');
          console.log('🎉 RESULT: PASS - Live service is running the expected commit!\n');
          process.exit(0);
        } else {
          console.log(`❌ Commit Mismatch : Expected ${expectedCommit}, but running ${data.commit}`);
          console.log('------------------------------------------------------');
          console.log('⚠️ Service responded HTTP 200, but is running a different commit.');
          // Continue polling if attempts remain, in case a build is currently deploying
        }
      } else {
        console.log('------------------------------------------------------');
        console.log('🎉 RESULT: PASS - Service is live and responding to /api/health!\n');
        process.exit(0);
      }
    } else {
      if (result.statusCode) {
        console.log(`HTTP ${result.statusCode} (Not ready)`);
        if (result.statusCode === 404) {
          console.log(`   ↳ Endpoint returned 404. Live container is not running current server routes.`);
        }
      } else {
        console.log(`Connection failed: ${result.error}`);
      }
    }

    if (attempt < MAX_ATTEMPTS) {
      await new Promise(r => setTimeout(r, POLL_INTERVAL_MS));
    }
  }

  console.log('\n======================================================');
  console.log('❌ RESULT: FAIL - Verification timed out after 5 minutes.');
  console.log('👉 Please check Render dashboard build logs or trigger a Manual Deploy.');
  console.log('======================================================\n');
  process.exit(1);
}

verify();

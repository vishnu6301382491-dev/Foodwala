const fs = require('fs');
const path = require('path');

const OLD_CLIENT_ID = '1058620864344-9f2h83v8o9m4d8b9j3k4r2m1n0o9p8q7.apps.googleusercontent.com';
const NEW_CLIENT_ID = '387098615100-026midj2987jt0p75sqjmi5f94a0nib7.apps.googleusercontent.com';

function updateFile(filePath, search, replace) {
  const full = path.resolve(__dirname, '..', filePath);
  let content = fs.readFileSync(full, 'utf8');
  const usesCrlf = content.includes('\r\n');
  const normalized = content.replace(/\r\n/g, '\n');
  const normSearch = search.replace(/\r\n/g, '\n');
  const normReplace = replace.replace(/\r\n/g, '\n');

  if (!normalized.includes(normSearch)) {
    console.error(`[FAIL] String match not found in ${filePath}`);
    process.exit(1);
  }

  let updated = normalized.replace(normSearch, normReplace);
  if (usesCrlf) {
    updated = updated.replace(/\n/g, '\r\n');
  }
  fs.writeFileSync(full, updated, 'utf8');
  console.log(`[PASS] Updated ${filePath}`);
}

// 1. Update js/google-auth.js
updateFile(
  'js/google-auth.js',
  `  const DEFAULT_CLIENT_ID = '${OLD_CLIENT_ID}';`,
  `  const DEFAULT_CLIENT_ID = '${NEW_CLIENT_ID}';`
);

// 2. Update login.html (add meta tag)
updateFile(
  'login.html',
  `  <!-- Google Identity Services (GIS) -->\n  <script src="https://accounts.google.com/gsi/client" async defer></script>`,
  `  <!-- Google Identity Services (GIS) -->\n  <meta name="google-signin-client_id" content="${NEW_CLIENT_ID}">\n  <script src="https://accounts.google.com/gsi/client" async defer></script>`
);

// 3. Update register.html (add meta tag)
updateFile(
  'register.html',
  `  <!-- Google Identity Services (GIS) -->\n  <script src="https://accounts.google.com/gsi/client" async defer></script>`,
  `  <!-- Google Identity Services (GIS) -->\n  <meta name="google-signin-client_id" content="${NEW_CLIENT_ID}">\n  <script src="https://accounts.google.com/gsi/client" async defer></script>`
);

// 4. Update scripts/test_google_auth.js
updateFile(
  'scripts/test_google_auth.js',
  `  const clientId = GoogleAuth.getClientId();\n  assert.ok(clientId, 'Client ID must be defined');`,
  `  const clientId = GoogleAuth.getClientId();\n  assert.strictEqual(clientId, '${NEW_CLIENT_ID}', 'Configured Client ID must match newly generated Google OAuth Web Client ID');`
);

// 5. Update scripts/test_otp_manual_entry.js to assert meta tag and client id
updateFile(
  'scripts/test_otp_manual_entry.js',
  `assert(loginHtml.includes('id="google-signin-btn-container"'), 'FAIL: google-signin-btn-container missing in login.html');`,
  `assert(loginHtml.includes('id="google-signin-btn-container"'), 'FAIL: google-signin-btn-container missing in login.html');\nassert(loginHtml.includes('${NEW_CLIENT_ID}'), 'FAIL: Configured client_id missing in login.html');`
);

updateFile(
  'scripts/test_otp_manual_entry.js',
  `assert(regHtml.includes('id="google-signup-btn-container"'), 'FAIL: google-signup-btn-container missing in register.html');`,
  `assert(regHtml.includes('id="google-signup-btn-container"'), 'FAIL: google-signup-btn-container missing in register.html');\nassert(regHtml.includes('${NEW_CLIENT_ID}'), 'FAIL: Configured client_id missing in register.html');`
);

// 6. Mirror all modified files to src/main/webapp
const filesToSync = [
  'login.html',
  'register.html',
  'js/google-auth.js'
];

for (const rel of filesToSync) {
  const src = path.resolve(__dirname, '..', rel);
  const dst = path.resolve(__dirname, '..', 'src/main/webapp', rel);
  fs.copyFileSync(src, dst);
  console.log(`[PASS] Mirrored ${rel} -> src/main/webapp/${rel}`);
}

console.log('[ALL COMPLETED] Client ID successfully configured and mirrored.');

const fs = require('fs');

const fbStyle = `    .btn-facebook-auth {
      background-color: #1877F2;
      color: #ffffff;
      border: 1px solid #1877F2;
      transition: all 0.2s ease-in-out;
    }
    .btn-facebook-auth:hover {
      background-color: #166fe5;
      border-color: #166fe5;
      color: #ffffff;
      box-shadow: 0 4px 12px rgba(24, 119, 242, 0.35);
      transform: translateY(-1px);
    }
    .btn-facebook-auth:active {
      background-color: #1465cc;
      transform: translateY(0);
    }`;

const fbBtn = `              <button type="button" class="btn btn-facebook-auth w-100 rounded-pill py-2 d-flex align-items-center justify-content-center gap-2 fw-semibold shadow-sm js-facebook-auth-btn" style="background:#1877F2; border:1px solid #1877F2; color:#fff; height:44px; font-size: 0.95rem;">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="#ffffff" class="flex-shrink-0">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                <span>Continue with Facebook</span>
              </button>
              <div class="d-none">
                <fb:login-button scope="public_profile,email" onlogin="checkLoginState();"></fb:login-button>
              </div>`;

function patchFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // 1. Add CSS
  if (!content.includes('.btn-facebook-auth')) {
    content = content.replace('.letter-spacing-2 {', fbStyle + '\n    .letter-spacing-2 {');
  }

  // 2. Add script tag
  if (!content.includes('facebook-auth.js')) {
    content = content.replace(
      '<script src="./js/google-auth.js?v=20261022_05"></script>',
      '<script src="./js/google-auth.js?v=20261022_05"></script>\n  <script src="./js/facebook-auth.js"></script>'
    );
  }

  // 3. Add Facebook button under Google sign-in container
  if (filePath.includes('login.html')) {
    content = content.replace(
      /(<div id="google-signin-btn-container" class="w-100 d-flex justify-content-center mb-3">[\s\S]*?<\/div>)/,
      '$1\n            <div id="facebook-signin-btn-container" class="w-100 d-flex justify-content-center mb-3">\n' + fbBtn + '\n            </div>'
    );
    content = content.replace(
      /(<div id="google-signin-btn-mobile-container" class="w-100 d-flex justify-content-center mb-3">[\s\S]*?<\/div>)/,
      '$1\n              <div id="facebook-signin-btn-mobile-container" class="w-100 d-flex justify-content-center mb-3">\n' + fbBtn + '\n              </div>'
    );
  } else if (filePath.includes('register.html')) {
    content = content.replace(
      /(<div id="google-signup-btn-container" class="w-100 d-flex justify-content-center mb-3">[\s\S]*?<\/div>)/,
      '$1\n          <div id="facebook-signup-btn-container" class="w-100 d-flex justify-content-center mb-3">\n' + fbBtn + '\n          </div>'
    );
  }

  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Successfully patched:', filePath);
}

patchFile('D:/FoodWala_Eclipse_Project/login.html');
patchFile('D:/FoodWala_Eclipse_Project/register.html');
patchFile('D:/FoodWala_Eclipse_Project/src/main/webapp/login.html');
patchFile('D:/FoodWala_Eclipse_Project/src/main/webapp/register.html');

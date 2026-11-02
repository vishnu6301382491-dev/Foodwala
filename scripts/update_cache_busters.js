const fs = require('fs');
const path = require('path');

const root = 'D:\\FoodWala_Eclipse_Project';
const v = '20261102_03';

const targets = ['login.html', 'register.html', 'checkout.html', 'cart.html', 'index.html', 'home.html'];

targets.forEach(fileName => {
  const filePath = path.join(root, fileName);
  let content = fs.readFileSync(filePath, 'utf8');

  // Replace script tags matching ./js/(app|app.min|api|facebook-auth|config|liveAdapter|mockAdapter).js with or without ?v=
  content = content.replace(/(src=["']\.\/js\/(app|app\.min|api|facebook-auth|config|liveAdapter|mockAdapter)\.js)(?:\?v=[^"']*)?(["'])/g, `$1?v=${v}$3`);

  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Updated ' + fileName);

  const mirrorPath = path.join(root, 'src', 'main', 'webapp', fileName);
  if (fs.existsSync(mirrorPath)) {
    fs.writeFileSync(mirrorPath, content, 'utf8');
    console.log('Mirrored to ' + mirrorPath);
  }
});

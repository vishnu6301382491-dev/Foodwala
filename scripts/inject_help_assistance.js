const fs = require('fs');
const path = require('path');

const customerPages = [
  'login.html',
  'register.html',
  'restaurant-details.html',
  'menu.html',
  'checkout.html',
  'order-track.html',
  'order-tracking.html',
  'addresses.html',
  'profile.html',
  'search.html'
];

const roots = [
  'D:/FoodWala_Eclipse_Project',
  'D:/FoodWala_Eclipse_Project/src/main/webapp'
];

roots.forEach(r => {
  customerPages.forEach(p => {
    const fp = path.join(r, p);
    if (fs.existsSync(fp)) {
      let c = fs.readFileSync(fp, 'utf8');
      if (!c.includes('help-assistance.js')) {
        c = c.replace('</body>', '  <script src="./js/help-assistance.js" defer></script>\n</body>');
        fs.writeFileSync(fp, c, 'utf8');
        console.log('Added help-assistance.js to', fp);
      }
    }
  });
});

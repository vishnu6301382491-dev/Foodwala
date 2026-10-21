const fs = require('fs');
const path = require('path');

const htmlFiles = [
  'index.html', 'login.html', 'register.html', 'delivery-dashboard.html', 'admin.html',
  'restaurant-dashboard.html', 'restaurant-details.html', 'restaurants.html', 'cart.html',
  'checkout.html', 'order-tracking.html', 'orders.html', 'profile.html', 'search.html',
  'src/main/webapp/index.html', 'src/main/webapp/login.html', 'src/main/webapp/register.html',
  'src/main/webapp/delivery-dashboard.html', 'src/main/webapp/admin.html',
  'src/main/webapp/restaurant-dashboard.html'
];

for (const rel of htmlFiles) {
  const p = path.resolve(rel);
  if (fs.existsSync(p)) {
    let c = fs.readFileSync(p, 'utf8');
    c = c.replace(/\?v=202610\d+_\d+/g, '?v=20261022_05');
    fs.writeFileSync(p, c, 'utf8');
    console.log('Bumped cache-buster in', rel);
  }
}

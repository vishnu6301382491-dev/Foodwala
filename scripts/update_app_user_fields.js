const fs = require('fs');

const files = [
  'js/app.js',
  'js/app.min.js',
  'src/main/webapp/js/app.js',
  'src/main/webapp/js/app.min.js'
];

for (const f of files) {
  let c = fs.readFileSync(f, 'utf8');
  const target = "role: data.user.role || 'CUSTOMER',";
  const replacement = "role: data.user.role || 'CUSTOMER',\n            restaurantId: data.user.restaurantId || data.user.restaurant_id || null,\n            restaurant_id: data.user.restaurant_id || data.user.restaurantId || null,\n            restaurantName: data.user.restaurantName || data.user.restaurant_name || null,\n            partnerId: data.user.partnerId || data.user.partner_id || null,\n            partner_id: data.user.partner_id || data.user.partnerId || null,";

  if (c.includes(target)) {
    c = c.replace(target, replacement);
    fs.writeFileSync(f, c, 'utf8');
    console.log('Updated', f);
  } else {
    console.warn('Target pattern not found in', f);
  }
}

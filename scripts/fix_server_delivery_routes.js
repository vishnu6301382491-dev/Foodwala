const fs = require('fs');

const serverFile = 'D:/FoodWala_Eclipse_Project/server/server.js';
let code = fs.readFileSync(serverFile, 'utf8');

// 1. Cut the delivery partner block from its current location
const startMarker = '// =======================================================================\n// 11. DELIVERY PARTNER ENDPOINTS (SWIGGY-GRADE DELIVERY PLATFORM)';
const endMarker = 'async function seedAdminUser() {';

const startIdx = code.indexOf(startMarker);
const endIdx = code.indexOf(endMarker);

if (startIdx !== -1 && endIdx !== -1) {
  const deliveryBlock = code.substring(startIdx, endIdx);
  code = code.substring(0, startIdx) + code.substring(endIdx);
  console.log('✅ Extracted delivery block from after 404 handler');

  // Insert it before the 404 NOT FOUND HANDLER
  const notFoundMarker = '// 404 NOT FOUND HANDLER (Ensures CORS headers are attached)';
  const notFoundIdx = code.indexOf(notFoundMarker);
  if (notFoundIdx !== -1) {
    code = code.substring(0, notFoundIdx) + deliveryBlock + '\n\n' + code.substring(notFoundIdx);
    console.log('✅ Placed delivery block BEFORE 404 handler');
  } else {
    console.error('❌ notFoundMarker not found');
  }
} else {
  console.warn('⚠️ delivery block markers not found, checking if already moved');
}

// 2. In /api/auth/login, enrich userPayload with delivery partner info
const oldLoginPayload = `    let restaurantId = null;
    let restaurantName = null;
    if ((user.role || '').toLowerCase() === 'restaurant' || (user.role || '').toLowerCase() === 'manager') {
      try {
        const [rRows] = await db.query(
          'SELECT restaurant_id, name FROM restaurant WHERE admin_user_id = ? LIMIT 1',
          [user.user_id]
        );
        if (rRows && rRows.length > 0) {
          restaurantId = rRows[0].restaurant_id;
          restaurantName = rRows[0].name;
        }
      } catch (rErr) {
        console.warn('[Login Restaurant Lookup Warning]:', rErr.message);
      }
    }

    const userPayload = {
      userId: user.user_id,
      name: user.username,
      username: user.username,
      email: user.email,
      phone: user.phone,
      role: (user.role || 'customer').toLowerCase(),
      address: user.address || '',
      addresses: addresses,
      restaurantId: restaurantId,
      restaurant_id: restaurantId,
      restaurantName: restaurantName,
      lastLogin: new Date().toISOString()
    };`;

const newLoginPayload = `    let restaurantId = null;
    let restaurantName = null;
    let partnerId = null;
    let vehicleNumber = null;

    const userRole = (user.role || '').toLowerCase();
    if (userRole === 'restaurant' || userRole === 'manager') {
      try {
        const [rRows] = await db.query(
          'SELECT restaurant_id, name FROM restaurant WHERE admin_user_id = ? LIMIT 1',
          [user.user_id]
        );
        if (rRows && rRows.length > 0) {
          restaurantId = rRows[0].restaurant_id;
          restaurantName = rRows[0].name;
        }
      } catch (rErr) {
        console.warn('[Login Restaurant Lookup Warning]:', rErr.message);
      }
    } else if (userRole === 'partner' || userRole === 'delivery_partner') {
      try {
        const [pRows] = await db.query(
          'SELECT partner_id, vehicle_number FROM delivery_partner WHERE user_id = ? LIMIT 1',
          [user.user_id]
        );
        if (pRows && pRows.length > 0) {
          partnerId = pRows[0].partner_id;
          vehicleNumber = pRows[0].vehicle_number;
        }
      } catch (pErr) {
        console.warn('[Login Partner Lookup Warning]:', pErr.message);
      }
    }

    const userPayload = {
      userId: user.user_id,
      name: user.username,
      username: user.username,
      email: user.email,
      phone: user.phone,
      role: (user.role || 'customer').toLowerCase(),
      address: user.address || '',
      addresses: addresses,
      restaurantId: restaurantId,
      restaurant_id: restaurantId,
      restaurantName: restaurantName,
      partnerId: partnerId,
      partner_id: partnerId,
      vehicleNumber: vehicleNumber,
      lastLogin: new Date().toISOString()
    };`;

code = code.split('\r\n').join('\n');
if (code.includes(oldLoginPayload)) {
  code = code.replace(oldLoginPayload, newLoginPayload);
  console.log('✅ Enriched /api/auth/login with partnerId and vehicleNumber');
} else {
  console.warn('⚠️ oldLoginPayload pattern not matched directly');
}

code = code.split('\n').join('\r\n');
fs.writeFileSync(serverFile, code, 'utf8');
console.log('✅ server/server.js updated.');

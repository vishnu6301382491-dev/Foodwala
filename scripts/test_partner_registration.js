const http = require('http');
const mysql = require('mysql2/promise');

async function testPartnerRegistration() {
  console.log('--- Testing Delivery Partner Registration ---');

  const testUser = {
    name: 'Ramesh Rider Fleet',
    email: `ramesh.rider.${Date.now()}@foodwala.com`,
    phone: `98${Math.floor(10000000 + Math.random() * 90000000)}`,
    password: 'Password123!',
    confirmPassword: 'Password123!',
    address: 'Koramangala 4th Block, Bengaluru',
    role: 'partner',
    vehicleType: 'Electric Scooter',
    vehicleNumber: 'KA-01-EV-' + Math.floor(1000 + Math.random() * 9000),
    deliveryZone: 'Koramangala & HSR Layout',
    drivingLicense: 'DL-04-2024009988'
  };

  console.log('Registering test partner:', testUser.email, testUser.phone, testUser.vehicleNumber);

  // 1. Send POST request to /api/auth/register
  const payload = JSON.stringify(testUser);
  const response = await fetch('http://127.0.0.1:5000/api/auth/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload)
    },
    body: payload
  });

  const resData = await response.json();
  console.log('HTTP Status:', response.status);
  console.log('Response Body:', resData);

  if (!resData.success) {
    throw new Error('Partner registration failed: ' + (resData.message || 'Unknown error'));
  }

  const registeredUser = resData.user;
  console.log('✅ Registered User ID:', registeredUser.id);
  console.log('✅ User Role:', registeredUser.role);
  console.log('✅ Partner ID in payload:', registeredUser.partnerId);

  // 2. Query MySQL directly to verify database records in both user and delivery_partner tables
  const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'root',
    database: process.env.DB_NAME || 'fudwala',
    port: parseInt(process.env.DB_PORT || '3306', 10)
  };

  const pool = mysql.createPool(dbConfig);
  try {
    const [userRows] = await pool.query('SELECT * FROM user WHERE user_id = ?', [registeredUser.id]);
    console.log('MySQL user record found:', userRows.length > 0 ? 'YES' : 'NO');
    if (userRows.length === 0) throw new Error('User not found in user table');
    console.log('User Role in DB:', userRows[0].role);

    const [partnerRows] = await pool.query('SELECT * FROM delivery_partner WHERE user_id = ?', [registeredUser.id]);
    console.log('MySQL delivery_partner record found:', partnerRows.length > 0 ? 'YES' : 'NO');
    if (partnerRows.length === 0) throw new Error('Delivery partner record NOT created in delivery_partner table');

    const partnerRecord = partnerRows[0];
    console.log('Partner DB Details:', {
      partner_id: partnerRecord.partner_id,
      user_id: partnerRecord.user_id,
      name: partnerRecord.name,
      phone: partnerRecord.phone,
      vehicle_number: partnerRecord.vehicle_number,
      vehicle_type: partnerRecord.vehicle_type,
      status: partnerRecord.status,
      is_available: partnerRecord.is_available,
      rating: partnerRecord.rating
    });

    if (partnerRecord.vehicle_number !== testUser.vehicleNumber) {
      throw new Error(`Vehicle number mismatch: expected ${testUser.vehicleNumber}, got ${partnerRecord.vehicle_number}`);
    }

    console.log('🎉 ALL BACKEND AND DATABASE VERIFICATIONS PASSED SUCCESSFULLY!');
  } finally {
    await pool.end();
  }
}

testPartnerRegistration().catch(err => {
  console.error('❌ Test Error:', err);
  process.exit(1);
});

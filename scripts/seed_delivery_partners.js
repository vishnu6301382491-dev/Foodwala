const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../server/.env') });

const UNIVERSAL_PASSWORD = 'Vishnu@143';
const PRIMARY_DELIVERY_EMAIL = 'deliveryfoodwala@gmail.com';
const PRIMARY_PHONE = '9900000201';

async function seedDeliveryPartners() {
  console.log('============================================================');
  console.log('🚀 SEEDING OFFICIAL DELIVERY PARTNER ACCOUNTS');
  console.log('============================================================');

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'root',
    database: process.env.DB_NAME || 'fudwala',
    port: parseInt(process.env.DB_PORT || '3306', 10)
  });

  try {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(UNIVERSAL_PASSWORD, salt);

    // 1. Seed or synchronize primary delivery partner (deliveryfoodwala@gmail.com)
    const [existingPrimary] = await connection.query(
      'SELECT user_id, email, phone, role FROM user WHERE email = ?',
      [PRIMARY_DELIVERY_EMAIL]
    );

    let primaryUserId;
    if (existingPrimary.length > 0) {
      primaryUserId = existingPrimary[0].user_id;
      await connection.query(
        'UPDATE user SET password_hash = ?, role = "partner", username = "Kiran Kumar (Delivery Hero)" WHERE user_id = ?',
        [passwordHash, primaryUserId]
      );
      console.log(`✅ Updated existing user record for ${PRIMARY_DELIVERY_EMAIL} (User ID: ${primaryUserId})`);
    } else {
      const [insertUser] = await connection.query(
        'INSERT INTO user (username, email, phone, role, password_hash) VALUES (?, ?, ?, "partner", ?)',
        ['Kiran Kumar (Delivery Hero)', PRIMARY_DELIVERY_EMAIL, PRIMARY_PHONE, passwordHash]
      );
      primaryUserId = insertUser.insertId;
      console.log(`✅ Created user record for ${PRIMARY_DELIVERY_EMAIL} (User ID: ${primaryUserId})`);
    }

    // 2. Ensure record in delivery_partner table
    const [existingPartnerRecord] = await connection.query(
      'SELECT partner_id FROM delivery_partner WHERE user_id = ?',
      [primaryUserId]
    );

    let partnerId;
    if (existingPartnerRecord.length > 0) {
      partnerId = existingPartnerRecord[0].partner_id;
      await connection.query(
        `UPDATE delivery_partner 
         SET name = 'Kiran Kumar', phone = ?, vehicle_number = 'KA 05 MN 7890', vehicle_type = 'Electric Scooter',
             rating = 4.89, status = 'AVAILABLE', is_available = 1, current_lat = 12.9352, current_lng = 77.6245
         WHERE partner_id = ?`,
        [PRIMARY_PHONE, partnerId]
      );
      console.log(`✅ Updated delivery_partner record for ${PRIMARY_DELIVERY_EMAIL} (Partner ID: ${partnerId})`);
    } else {
      const [insertPartner] = await connection.query(
        `INSERT INTO delivery_partner 
         (user_id, name, phone, vehicle_number, current_lat, current_lng, accuracy, is_available, vehicle_type, profile_image, rating, status)
         VALUES (?, 'Kiran Kumar', ?, 'KA 05 MN 7890', 12.9352, 77.6245, 5, 1, 'Electric Scooter', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb', 4.89, 'AVAILABLE')`,
        [primaryUserId, PRIMARY_PHONE]
      );
      partnerId = insertPartner.insertId;
      console.log(`✅ Created delivery_partner record for ${PRIMARY_DELIVERY_EMAIL} (Partner ID: ${partnerId})`);
    }

    // 3. Synchronize existing partner rahul.delivery@foodwala.com with Vishnu@143
    await connection.query(
      'UPDATE user SET password_hash = ?, role = "partner" WHERE email = "rahul.delivery@foodwala.com"',
      [passwordHash]
    );
    console.log(`✅ Synchronized password for rahul.delivery@foodwala.com to ${UNIVERSAL_PASSWORD}`);

    // 4. Save audit log
    const auditData = {
      primaryPartner: {
        email: PRIMARY_DELIVERY_EMAIL,
        password: UNIVERSAL_PASSWORD,
        name: 'Kiran Kumar',
        phone: PRIMARY_PHONE,
        role: 'partner',
        partnerId: partnerId,
        userId: primaryUserId,
        vehicleNumber: 'KA 05 MN 7890',
        vehicleType: 'Electric Scooter',
        rating: 4.89
      },
      secondaryPartner: {
        email: 'rahul.delivery@foodwala.com',
        password: UNIVERSAL_PASSWORD,
        name: 'Rahul Kumar',
        phone: '9876543220',
        role: 'partner',
        partnerId: 1,
        userId: 3,
        vehicleNumber: 'KA 01 AB 1234'
      },
      seededAt: new Date().toISOString()
    };

    fs.writeFileSync(
      path.join(__dirname, '../server/delivery_partner_credentials.json'),
      JSON.stringify(auditData, null, 2),
      'utf8'
    );
    console.log('✅ Exported delivery partner credentials to server/delivery_partner_credentials.json');

    console.log('============================================================');
    console.log('🎉 DELIVERY PARTNER SEEDING COMPLETED SUCCESSFULLY!');
    console.log('============================================================');
  } catch (err) {
    console.error('❌ Error seeding delivery partners:', err);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

seedDeliveryPartners();

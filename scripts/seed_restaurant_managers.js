/**
 * scripts/seed_restaurant_managers.js
 * 
 * FoodWala Enterprise Seed Migration:
 * 1. Synchronizes Super Admin: adminfoodwala@gmail.com / Vishnu@143
 * 2. Generates individual restaurant manager accounts (<restaurantname>@gmail.com) for all 105 restaurants
 * 3. Sets password to 'Vishnu@143' (bcrypt 12 salt rounds) for all managers
 * 4. Links each restaurant's admin_user_id to the created manager's user_id
 * 5. Generates an audit mapping JSON and summary table
 */

const db = require('../server/db');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const ADMIN_EMAIL = 'adminfoodwala@gmail.com';
const ADMIN_PASSWORD = 'Vishnu@143';
const RESTAURANT_PASSWORD = 'Vishnu@143';
const BCRYPT_ROUNDS = 12;

function normalizeRestaurantEmail(name, id) {
  let clean = String(name || '').toLowerCase();

  // Normalize common words & suffixes
  clean = clean.replace(/\bfoods\b/g, 'food');
  clean = clean.replace(/\bthe\b/g, '');
  clean = clean.replace(/\(.*?\)/g, ''); // strip parentheses & contents like (CTR)
  clean = clean.replace(/[^a-z0-9]/g, ''); // strip non-alphanumeric

  if (!clean || clean.length < 3) {
    clean = 'restaurant' + id;
  }

  return `${clean}@gmail.com`;
}

async function runSeed() {
  console.log('============================================================');
  console.log('🚀 SEEDING FOODWALA ADMIN & RESTAURANT MANAGER ACCOUNTS');
  console.log('============================================================\n');

  try {
    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, BCRYPT_ROUNDS);

    // 1. Seed / Update Super Admin: adminfoodwala@gmail.com
    console.log(`[Admin] Setting up Super Admin: ${ADMIN_EMAIL}...`);
    const [existingAdmin] = await db.query('SELECT user_id, email FROM user WHERE email = ?', [ADMIN_EMAIL]);

    let adminUserId = null;
    if (existingAdmin.length === 0) {
      // Check if user 5 (admin@foodwala.com) exists and update it, or insert fresh
      const [user5] = await db.query('SELECT user_id FROM user WHERE email = ?', ['admin@foodwala.com']);
      if (user5.length > 0) {
        adminUserId = user5[0].user_id;
        await db.query(
          `UPDATE user SET username = 'FoodWala Super Admin', email = ?, role = 'admin', password_hash = ?, failed_attempts = 0, locked_until = NULL WHERE user_id = ?`,
          [ADMIN_EMAIL, passwordHash, adminUserId]
        );
        console.log(`✅ [Admin] Migrated admin account (ID: ${adminUserId}) to ${ADMIN_EMAIL}`);
      } else {
        const [insertRes] = await db.query(
          `INSERT INTO user (username, email, phone, role, password_hash, address)
           VALUES (?, ?, ?, 'admin', ?, 'FoodWala HQ, Bengaluru')`,
          ['FoodWala Super Admin', ADMIN_EMAIL, '8500457005', passwordHash]
        );
        adminUserId = insertRes.insertId;
        console.log(`✅ [Admin] Created new Super Admin account: ${ADMIN_EMAIL} (ID: ${adminUserId})`);
      }
    } else {
      adminUserId = existingAdmin[0].user_id;
      await db.query(
        'UPDATE user SET role = ?, password_hash = ?, failed_attempts = 0, locked_until = NULL WHERE user_id = ?',
        ['admin', passwordHash, adminUserId]
      );
      console.log(`✅ [Admin] Updated existing Super Admin account: ${ADMIN_EMAIL} (ID: ${adminUserId})`);
    }

    // Demote any old admin accounts so ONLY adminfoodwala@gmail.com is admin
    await db.query(
      `UPDATE user SET role = 'customer' WHERE role = 'admin' AND email != ?`,
      [ADMIN_EMAIL]
    );

    // 2. Fetch all restaurants
    const [restaurants] = await db.query('SELECT restaurant_id, name, address, phone FROM restaurant ORDER BY restaurant_id');
    console.log(`\n[Restaurants] Found ${restaurants.length} restaurants to process.`);

    const emailMap = new Map();
    const mappings = [];

    // Pre-load all existing phones to avoid unique index collisions
    const [phoneRows] = await db.query('SELECT phone FROM user WHERE phone IS NOT NULL');
    const usedPhones = new Set(phoneRows.map(p => p.phone));

    for (const r of restaurants) {
      const id = r.restaurant_id;
      let email = normalizeRestaurantEmail(r.name, id);

      // Uniqueness check for email
      if (emailMap.has(email)) {
        email = email.replace('@gmail.com', `${id}@gmail.com`);
      }
      emailMap.set(email, id);

      // Check if user exists with this email
      const [existingUsers] = await db.query('SELECT user_id, email FROM user WHERE email = ?', [email]);
      let managerUserId = null;

      const managerUsername = `${r.name} Manager`;
      
      // Compute safe unique phone or null
      let managerPhone = null;
      const candidatePhone = `99${String(id).padStart(8, '0')}`;
      if (!usedPhones.has(candidatePhone)) {
        managerPhone = candidatePhone;
        usedPhones.add(candidatePhone);
      }

      if (existingUsers.length === 0) {
        const [userRes] = await db.query(
          `INSERT INTO user (username, email, phone, role, password_hash, address)
           VALUES (?, ?, ?, 'restaurant', ?, ?)`,
          [managerUsername, email, managerPhone, passwordHash, r.address || 'Bengaluru']
        );
        managerUserId = userRes.insertId;
      } else {
        managerUserId = existingUsers[0].user_id;
        await db.query(
          `UPDATE user SET username = ?, role = 'restaurant', password_hash = ?, failed_attempts = 0, locked_until = NULL WHERE user_id = ?`,
          [managerUsername, passwordHash, managerUserId]
        );
      }

      // Link restaurant.admin_user_id to manager user_id
      await db.query(
        'UPDATE restaurant SET admin_user_id = ? WHERE restaurant_id = ?',
        [managerUserId, id]
      );

      mappings.push({
        restaurantId: id,
        restaurantName: r.name,
        managerEmail: email,
        managerUserId: managerUserId,
        password: RESTAURANT_PASSWORD
      });
    }

    // Write audit file
    const auditPath = path.join(__dirname, '../server/restaurant_managers.json');
    fs.writeFileSync(auditPath, JSON.stringify({
      superAdmin: {
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        role: 'admin'
      },
      totalRestaurants: mappings.length,
      defaultPasswordForAllRestaurants: RESTAURANT_PASSWORD,
      restaurants: mappings
    }, null, 2), 'utf8');

    console.log(`\n============================================================`);
    console.log(`🎉 SUCCESS: ${mappings.length} RESTAURANT MANAGERS SEEDED!`);
    console.log(`📁 Audit file saved to: ${auditPath}`);
    console.log(`============================================================\n`);

    console.log('Sample Logins:');
    mappings.slice(0, 10).forEach(m => {
      console.log(`  [ID ${String(m.restaurantId).padStart(3)}] ${m.restaurantName.padEnd(35)} -> ${m.managerEmail} (Pass: ${m.password})`);
    });

    process.exit(0);
  } catch (err) {
    console.error('❌ [Seed Error]:', err);
    process.exit(1);
  }
}

runSeed();

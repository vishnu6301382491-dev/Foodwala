const mysql = require('mysql2/promise');
require('dotenv').config({ path: 'D:/FoodWala_Eclipse_Project/server/.env' });

(async () => {
  try {
    const conn = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'root',
      database: process.env.DB_NAME || 'fudwala',
      port: process.env.DB_PORT || 3306
    });

    const [u3] = await conn.query('SELECT user_id, username, email, phone, role FROM user WHERE user_id = 3');
    console.log('User ID 3:', u3);

    const [allDP] = await conn.query('SELECT dp.*, u.email, u.role FROM delivery_partner dp LEFT JOIN user u ON dp.user_id = u.user_id');
    console.log('All delivery partners:', allDP);

    await conn.end();
  } catch (err) {
    console.error('DB Error:', err.message);
  }
})();

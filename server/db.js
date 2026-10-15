const mysql = require('mysql2/promise');
const path = require('path');
const fs = require('fs');

// Ensure environment variables are loaded
if (fs.existsSync(path.join(__dirname, '.env'))) {
  try {
    require('dotenv').config({ path: path.join(__dirname, '.env') });
  } catch (e) {}
}

const poolConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'fudwala',
  waitForConnections: true,
  connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT, 10) || 15,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
  dateStrings: true
};

// Enable SSL support for cloud-hosted MySQL databases (Render, Railway, Aiven, etc.)
if (process.env.DB_SSL === 'true' || process.env.MYSQL_SSL === 'true') {
  poolConfig.ssl = { rejectUnauthorized: false };
}

const pool = mysql.createPool(poolConfig);

// Immediate connectivity test
(async () => {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.query('SELECT DATABASE() as db, VERSION() as ver');
    console.log(`[Database] Connected to MySQL (${rows[0].ver}) -> Database: ${rows[0].db}`);
    connection.release();
  } catch (err) {
    console.error('[Database Connection Error]: Could not connect to MySQL:', err.message);
  }
})();

module.exports = {
  pool,
  execute: (sql, params) => pool.execute(sql, params),
  query: (sql, params) => pool.query(sql, params),
  getConnection: () => pool.getConnection()
};

const mysql = require('mysql2/promise');
const path = require('path');
const fs = require('fs');

// Ensure environment variables are loaded
if (fs.existsSync(path.join(__dirname, '.env'))) {
  try {
    require('dotenv').config({ path: path.join(__dirname, '.env') });
  } catch (e) {}
}

const isDeployed = process.env.NODE_ENV === 'production' || Boolean(process.env.RENDER);

// Database host selection: in production / Render deployment, do NOT fallback to localhost
const host = process.env.DB_HOST || (isDeployed ? '' : 'localhost');
const port = parseInt(process.env.DB_PORT, 10) || 3306;
const user = process.env.DB_USER || (isDeployed ? '' : 'root');
const password = process.env.DB_PASSWORD || '';
const database = process.env.DB_NAME || 'fudwala';

// Determine SSL: Enable if DB_SSL=true, or if cloud host unless DB_SSL=false
const enableSSL = process.env.DB_SSL === 'true' || 
                  process.env.MYSQL_SSL === 'true' || 
                  (isDeployed && process.env.DB_SSL !== 'false' && host && host !== 'localhost' && host !== '127.0.0.1');

const poolConfig = {
  host: host || 'localhost',
  port: port,
  user: user || 'root',
  password: password,
  database: database,
  waitForConnections: true,
  connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT, 10) || 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,
  dateStrings: true
};

if (enableSSL) {
  poolConfig.ssl = { rejectUnauthorized: false };
}

// Log warning if deployed without remote DB configuration
if (isDeployed && (!host || host === 'localhost' || host === '127.0.0.1')) {
  console.warn('\n⚠️ [Database Warning] Deployed environment detected on Render, but DB_HOST is not configured with a remote MySQL server.');
  console.warn('⚠️ Please set DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, and DB_PORT in your Render environment variables.\n');
}

// Create connection pool (does not throw on creation, connections are acquired on demand)
const pool = mysql.createPool(poolConfig);

/**
 * Health check helper for /api/health endpoint
 * Returns connectivity status and DB details without throwing
 */
async function checkHealth() {
  if (isDeployed && (!host || host === 'localhost' || host === '127.0.0.1')) {
    return {
      connected: false,
      configured: false,
      error: 'DB_HOST environment variable not configured for cloud deployment. Please configure cloud MySQL credentials on Render.'
    };
  }

  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.query('SELECT 1 as healthy, DATABASE() as db, VERSION() as ver');
    connection.release();
    return {
      connected: true,
      configured: true,
      host: host,
      database: rows[0].db,
      version: rows[0].ver,
      ssl: Boolean(enableSSL)
    };
  } catch (err) {
    return {
      connected: false,
      configured: Boolean(host),
      host: host,
      error: err.message
    };
  }
}

// Non-blocking connectivity test on startup
(async () => {
  try {
    if (!isDeployed || (host && host !== 'localhost' && host !== '127.0.0.1')) {
      const health = await checkHealth();
      if (health.connected) {
        console.log(`[Database] Connected to MySQL (${health.version}) -> Database: ${health.database} (SSL: ${health.ssl})`);
      } else {
        console.warn('[Database] Initial connection check warning:', health.error);
      }
    }
  } catch (err) {
    console.warn('[Database Initial Test Warning]:', err.message);
  }
})();

module.exports = {
  pool,
  execute: (sql, params) => pool.execute(sql, params),
  query: (sql, params) => pool.query(sql, params),
  getConnection: () => pool.getConnection(),
  checkHealth
};

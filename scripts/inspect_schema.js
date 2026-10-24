const db = require('../server/db');

async function inspect() {
  try {
    const [tables] = await db.query('SHOW TABLES');
    const tableNames = tables.map(r => Object.values(r)[0]);
    console.log('Tables:', tableNames);

    const [fks] = await db.query(`
      SELECT TABLE_NAME, COLUMN_NAME, CONSTRAINT_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
      FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
      WHERE TABLE_SCHEMA = 'fudwala' AND REFERENCED_TABLE_NAME IS NOT NULL
    `);
    console.log('FKs:', JSON.stringify(fks, null, 2));

    for (const t of ['user', 'restaurant', 'menu', 'menu_category', 'orders', 'order_item', 'payment', 'order_status_history', 'address', 'cart', 'cart_item', 'coupons', 'delivery_partner', 'whatsapp_conversations']) {
      if (tableNames.includes(t)) {
        const [cols] = await db.query(`DESCRIBE ${t}`);
        console.log(`\n=== Table: ${t} ===`);
        cols.slice(0, 10).forEach(c => console.log(`  ${c.Field} (${c.Type}) ${c.Key ? '['+c.Key+']' : ''}`));
      }
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    process.exit(0);
  }
}

inspect();

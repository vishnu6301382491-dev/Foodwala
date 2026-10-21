const fs = require('fs');
const path = require('path');
const db = require('../server/db');

async function runMigration() {
  const sqlPath = path.resolve(__dirname, '../database/whatsapp_support_schema.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  // Remove comment lines and split on semicolon at end of line
  const cleaned = sql
    .split('\n')
    .filter(line => !line.trim().startsWith('--'))
    .join('\n');

  const statements = cleaned
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0);

  for (const statement of statements) {
    console.log('Executing statement:', statement.substring(0, 40) + '...');
    await db.query(statement);
  }

  console.log('✅ Migration applied successfully!');
  const [waTables] = await db.query("SHOW TABLES LIKE 'whatsapp%'");
  console.log('WhatsApp tables:', waTables);
  const [ticketTables] = await db.query("SHOW TABLES LIKE 'support_tickets'");
  console.log('Support ticket tables:', ticketTables);
  process.exit(0);
}

runMigration().catch(err => {
  console.error('❌ Migration failed:', err.message);
  process.exit(1);
});

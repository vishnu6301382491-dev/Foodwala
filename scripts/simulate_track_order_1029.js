/**
 * scripts/simulate_track_order_1029.js
 * Simulates selecting Order #1029 to track live on WhatsApp
 * Dispatches the live order telemetry to Vishnu's WhatsApp (+91 63013 82491)
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../server/.env') });
const db = require('../server/db');
const sessionStore = require('../server/whatsapp/sessionStore');
const trackingFlow = require('../server/whatsapp/flows/trackingFlow');
const sender = require('../server/whatsapp/sender');

async function simulateTrack() {
  const phone = '916301382491';
  console.log(`================================================================`);
  console.log(`🛵 Simulating Live WhatsApp Tracking for Order #1029`);
  console.log(`   Recipient Phone: +${phone}`);
  console.log(`================================================================\n`);

  const user = await sessionStore.getOrCreateUser(phone, 'VISHNU');
  const session = await sessionStore.getSession(phone);

  // 1. Call trackingFlow with orderId 1029
  console.log(`[*] Querying tracking telemetry from database...`);
  const result = await trackingFlow.handle(user, session, 1029);

  console.log(`[OK] Tracking Message Generated:`);
  console.log(result.bodyText);
  console.log('Buttons:', result.buttons);

  // 2. Dispatch Live WhatsApp Interactive Message
  console.log(`\n[*] Dispatching live tracking card to WhatsApp +${phone}...`);
  const sendResult = await sender.sendInteractiveButtons(phone, result.bodyText, result.buttons);
  console.log(`[OK] WhatsApp API Dispatch Result:`, JSON.stringify(sendResult, null, 2));

  // 3. Log into whatsapp_messages audit trail
  const [convRows] = await db.query(
    'SELECT conversation_id FROM whatsapp_conversations WHERE wa_id = ? LIMIT 1',
    [phone]
  );
  const convId = convRows[0]?.conversation_id || 5;

  await db.query(
    `INSERT INTO whatsapp_messages (conversation_id, user_id, wa_message_id, direction, sender_type, message_text, message_type, delivery_status)
     VALUES (?, ?, ?, 'OUTBOUND', 'AI_BOT', ?, 'interactive', 'delivered')`,
    [convId, user.user_id, sendResult?.messages?.[0]?.id || `wamid.SIM_TRACK_${Date.now()}`, result.bodyText]
  );

  console.log(`\n================================================================`);
  console.log(`🎉 Live Tracking for Order #1029 dispatched successfully!`);
  console.log(`   Check your WhatsApp chat on +${phone} to view the live update!`);
  console.log(`================================================================\n`);

  process.exit(0);
}

simulateTrack().catch(err => {
  console.error('Error tracking order:', err);
  process.exit(1);
});

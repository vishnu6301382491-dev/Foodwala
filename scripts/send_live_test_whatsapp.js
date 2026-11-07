const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../server/.env') });
const sender = require('../server/whatsapp/sender');

async function testSend() {
  const phone = '916301382491';
  const msg = `🎉 *FoodWala 24/7 AI Assistant is now LIVE!*\n\n` +
              `Hi Vishnu! Your WhatsApp ordering assistant is fully operational.\n\n` +
              `Try replying:\n` +
              `• "I want biriyani"\n` +
              `• "Where is my order?"\n` +
              `• "Coupons"\n\n` +
              `We are ready to take your order! 🛵`;

  console.log(`Sending message to ${phone}...`);
  const result = await sender.sendTextMessage(phone, msg);
  console.log('Result:', JSON.stringify(result, null, 2));
  process.exit(0);
}

testSend().catch(err => {
  console.error(err);
  process.exit(1);
});

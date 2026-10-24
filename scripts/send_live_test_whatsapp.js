require('dotenv').config({ path: 'server/.env' });
const ws = require('../server/services/whatsappService');

async function testSend() {
  const phone = '916301382491';
  const msg = `🎉 *FoodWala 24/7 AI Assistant is now LIVE!*\n\n` +
              `Hi Vishnu! Welcome to FoodWala Customer Care.\n\n` +
              `How can I assist you right now?\n` +
              `1️⃣ Track my order\n` +
              `2️⃣ Cancel an order\n` +
              `3️⃣ Payment issue\n` +
              `4️⃣ Delivery issue\n` +
              `5️⃣ Talk to support\n\n` +
              `Reply with any question or your *Order ID* (e.g. *FW70*)! 🛵`;

  console.log(`Sending message to ${phone}...`);
  const result = await ws.sendWhatsAppMessage(phone, msg);
  console.log('Result:', JSON.stringify(result, null, 2));
  process.exit(0);
}

testSend().catch(err => {
  console.error(err);
  process.exit(1);
});

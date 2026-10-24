const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../server/.env') });
const whatsappAIService = require('../server/services/whatsappAIService');

const testQuestions = [
  'Where is my order?',
  'Hi FoodWala, what is your order cancellation policy?',
  'Hi FoodWala, I need assistance with my order',
  'What coupons are available?',
  'Do you deliver to Koramangala?',
  'I want to speak with a human support agent',
  'My food is late and cold',
  'Can I pay via cash on delivery or UPI?',
  'My payment was deducted but order failed'
];

async function testAll() {
  console.log('=== TESTING WHATSAPP AI SERVICE RESPONSES ===\n');
  for (const q of testQuestions) {
    console.log(`\n-----------------------------------------`);
    console.log(`[USER QUERY]: "${q}"`);
    const waReply = await whatsappAIService.generateResponse({
      senderPhone10: '6301382491',
      messageText: q,
      customerName: 'Vishnu'
    });
    console.log(`[WHATSAPP AI REPLY]:\n${waReply}`);
  }
  process.exit(0);
}

testAll().catch(err => {
  console.error(err);
  process.exit(1);
});

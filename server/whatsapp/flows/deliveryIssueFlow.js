/**
 * server/whatsapp/flows/deliveryIssueFlow.js
 * Delivery Complaints (Late, Wrong/Missing, Food Damaged) & Support Ticket Generation
 */

const db = require('../../db');
const messages = require('../messages');

class DeliveryIssueFlow {
  async handle(user, session, actionId = '', text = '') {
    const lang = user.language || 'en';
    const phone10 = user.phone_e164.length >= 10 ? user.phone_e164.slice(-10) : user.phone_e164;

    // Check if an issue category was chosen
    let category = 'DELIVERY';
    let issueType = 'General Delivery Issue';

    if (actionId === 'ISSUE_LATE' || /late|delayed|taking\s*too\s*long/i.test(text)) {
      category = 'DELAYED_DELIVERY';
      issueType = 'Order is delayed';
    } else if (actionId === 'ISSUE_WRONG' || /wrong|missing|incorrect/i.test(text)) {
      category = 'WRONG_ITEMS';
      issueType = 'Wrong or missing items';
    } else if (actionId === 'ISSUE_SPILL' || /cold|spilled|damaged|spoiled/i.test(text)) {
      category = 'DAMAGED_FOOD';
      issueType = 'Food damaged / cold / spilled';
    } else {
      // Prompt issue selection buttons
      return {
        replyType: 'buttons',
        bodyText: messages.getMsg(lang, 'deliveryIssuePrompt'),
        buttons: messages.getMsg(lang, 'deliveryIssueButtons')
      };
    }

    try {
      // Find latest order
      const [recent] = await db.query(
        'SELECT order_id FROM orders WHERE customer_phone = ? ORDER BY order_id DESC LIMIT 1',
        [phone10]
      );
      const orderId = recent && recent.length > 0 ? recent[0].order_id : null;

      // Create support ticket in support_tickets table
      const ticketNo = 'TKT' + Date.now().toString().slice(-6) + Math.floor(100 + Math.random() * 900);
      await db.query(
        `INSERT INTO support_tickets (ticket_number, user_id, order_id, customer_phone, category, priority, status, subject, issue_description)
         VALUES (?, ?, ?, ?, ?, 'HIGH', 'OPEN', ?, ?)`,
        [ticketNo, user.user_id, orderId, phone10, category, issueType, `Customer reported: ${issueType}. Text: "${text}"`]
      );

      session.activeTicketNo = ticketNo;

      return {
        replyType: 'buttons',
        bodyText: `🙏 We are so sorry for this experience!\n` +
                  `Support ticket *#${ticketNo}* has been opened for our quality manager.\n` +
                  `You may also send a photo here if applicable.`,
        buttons: [
          { id: 'SUPPORT_AGENT', title: 'Talk to Agent 📞' },
          { id: 'CMD_ORDER', title: 'Main Menu 🍕' }
        ]
      };
    } catch (err) {
      console.error('[DeliveryIssueFlow] Error:', err.message);
      return { replyType: 'text', bodyText: 'Thank you for your report. Our care team will look into it promptly.' };
    }
  }
}

module.exports = new DeliveryIssueFlow();

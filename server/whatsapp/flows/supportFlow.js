/**
 * server/whatsapp/flows/supportFlow.js
 * Human Support Agent Escalation & Ticketing
 */

const db = require('../../db');
const config = require('../config');

class SupportFlow {
  async handle(user, session, context = '') {
    const phone10 = user.phone_e164.length >= 10 ? user.phone_e164.slice(-10) : user.phone_e164;
    const ticketNo = 'SUP' + Date.now().toString().slice(-6) + Math.floor(100 + Math.random() * 900);

    try {
      await db.query(
        `INSERT INTO support_tickets (ticket_number, user_id, customer_phone, customer_name, category, priority, status, subject, issue_description)
         VALUES (?, ?, ?, ?, 'ESCALATION', 'HIGH', 'OPEN', 'Agent Callback Request', ?)`,
        [ticketNo, user.user_id, phone10, user.name, `Escalation requested via WhatsApp bot. Context: ${context || 'Direct user request'}`]
      );
    } catch (e) {
      console.warn('[SupportFlow] Ticket warning:', e.message);
    }

    const hotline = config.supportPhoneOrUrl || '+918500457005';
    const waLink = `https://wa.me/${hotline.replace(/\D/g, '')}`;

    const buttons = (session && session.cart && session.cart.items && session.cart.items.length > 0)
      ? [
          { id: 'CART_CHECKOUT', title: 'Proceed to Pay 💳' },
          { id: 'VIEW_CART', title: 'View Cart 🛒' },
          { id: 'CMD_TRACK', title: 'Track Order 🛵' }
        ]
      : [
          { id: 'CMD_ORDER', title: 'Order Food 🍽️' },
          { id: 'CMD_TRACK', title: 'Track Order 🛵' }
        ];

    return {
      replyType: 'buttons',
      bodyText: `👨‍💼 *FoodWala Priority Support Desk*\n\n` +
                `Ticket *#${ticketNo}* created. An agent is reviewing your account and will message/call within *5–10 minutes*.\n\n` +
                `Helpline: *${hotline}*\nOperating hours: 7:00 AM – 11:30 PM`,
      buttons
    };
  }
}

module.exports = new SupportFlow();

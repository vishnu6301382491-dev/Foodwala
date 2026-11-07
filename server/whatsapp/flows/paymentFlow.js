/**
 * server/whatsapp/flows/paymentFlow.js
 * Payment Inquiries, Status Investigation & Support Ticket Logging
 */

const db = require('../../db');
const messages = require('../messages');

class PaymentFlow {
  /**
   * Generates working UPI payment details with dynamic link & QR instructions
   */
  generateUpiDetails(cart, orderId = null) {
    const total = cart ? (cart.total || 0) : 0;
    const upiRef = orderId ? `FW${orderId}` : ('FW' + Date.now().toString().slice(-4));
    const upiLink = `upi://pay?pa=foodwala@upi&pn=FoodWala&am=${total}&cu=INR&tn=${upiRef}`;

    return {
      upiRef,
      upiLink,
      vpa: 'foodwala@upi',
      name: 'FoodWala',
      amount: total,
      bodyText: `⚡ *FoodWala UPI Instant Payment*\n\n` +
        `Amount to Pay: *₹${total}*\n` +
        `UPI ID (VPA): *foodwala@upi*\n` +
        `Payee Name: *FoodWala*\n` +
        `Reference: *${upiRef}*\n\n` +
        `📲 *Click to Pay via UPI App:*\n${upiLink}\n\n` +
        `📱 *QR / Manual UPI Instructions:*\n` +
        `1. Open Google Pay, PhonePe, Paytm, or BHIM\n` +
        `2. Pay *₹${total}* to UPI ID: *foodwala@upi*\n` +
        `3. Enter reference note: *${upiRef}*\n\n` +
        `Once payment is completed, tap *[I Have Paid ✅]* below to confirm your order!`,
      buttons: [
        { id: 'UPI_VERIFY', title: 'I Have Paid ✅' },
        { id: 'PAY_COD', title: 'Switch to COD 💵' }
      ]
    };
  }

  /**
   * Prompts user with interactive UPI payment details and buttons
   */
  promptUpiPayment(user, session) {
    const cart = session.cart;
    if (!cart || !cart.items || cart.items.length === 0) {
      const orderFlow = require('./orderFlow');
      return orderFlow.showCart(user, session);
    }

    session.state = 'AWAITING_PAYMENT';
    const upiData = this.generateUpiDetails(cart);
    session.upiTxnRef = upiData.upiRef;

    return {
      replyType: 'buttons',
      bodyText: upiData.bodyText,
      buttons: upiData.buttons,
      upiLink: upiData.upiLink
    };
  }

  async handle(user, session, orderId = null, actionId = '', text = '') {
    const lang = user.language || 'en';
    const phone10 = user.phone_e164.length >= 10 ? user.phone_e164.slice(-10) : user.phone_e164;
    const lower = (text || '').toLowerCase().trim();

    // Check if user is in an active cart payment flow
    const hasActiveCart = session && session.cart && session.cart.items && session.cart.items.length > 0;
    const isUpiPaid = actionId === 'UPI_VERIFY' || actionId === 'PAY_CONFIRM_UPI' ||
      /^(?:i\s*have\s*paid|paid|payment\s*done|i\s*paid)$/i.test(lower);

    if (hasActiveCart && isUpiPaid) {
      const orderFlow = require('./orderFlow');
      return await orderFlow.executeOrderPlacement(user, session, 'UPI / Online Payment', 'SUCCESS');
    }

    const isUpiSelect = actionId === 'PAY_UPI' || /\b(?:pay\s*on\s*upi|pay\s*upi|pay\s*with\s*upi|online)\b/i.test(lower);
    if (hasActiveCart && (isUpiSelect || session.state === 'ASK_PAYMENT' || session.state === 'AWAITING_PAYMENT')) {
      return this.promptUpiPayment(user, session);
    }

    try {
      // Find latest order or specified order
      let query = 'SELECT order_id, total_amount, payment_mode, payment_status, status, order_date FROM orders WHERE ';
      const params = [];
      if (orderId) {
        query += 'order_id = ?';
        params.push(orderId);
      } else {
        query += 'customer_phone = ? ORDER BY order_id DESC LIMIT 1';
        params.push(phone10);
      }

      const [rows] = await db.query(query, params);

      if (rows && rows.length > 0) {
        const ord = rows[0];
        const pStatus = (ord.payment_status || '').toUpperCase();
        
        let explanation = `💳 *Payment Status for Order FW${ord.order_id}*\n` +
                          `Method: *${ord.payment_mode}*\n` +
                          `Status: *${pStatus}*\n` +
                          `Amount: *₹${ord.total_amount}*\n\n`;

        if (pStatus === 'SUCCESS') {
          explanation += '✅ Your payment was successfully confirmed! Your order is being handled by our kitchen.';
        } else if (pStatus === 'PENDING') {
          explanation += '⏳ Your payment is currently being verified by the payment gateway. If money was deducted, it will automatically confirm within 2 minutes.';
        } else {
          explanation += '❌ The payment attempt was marked as failed or incomplete by the bank. If your account was debited, your bank will auto-refund within 2-4 hours.';
        }

        return {
          replyType: 'buttons',
          bodyText: explanation,
          buttons: [
            { id: `TICKET_PAYMENT:${ord.order_id}`, title: 'Log Payment Ticket 🎫' },
            { id: 'SUPPORT_AGENT', title: 'Talk to Agent 📞' }
          ]
        };
      }

      // No order found: prompt to log ticket
      const ticketNo = 'TKT' + Date.now().toString().slice(-6) + Math.floor(100 + Math.random() * 900);
      await db.query(
        `INSERT INTO support_tickets (ticket_number, user_id, customer_phone, category, priority, status, subject, issue_description)
         VALUES (?, ?, ?, 'PAYMENT', 'HIGH', 'OPEN', 'Payment Deducted Without Order', 'Customer reported money deducted without confirmed order')`,
        [ticketNo, user.user_id, phone10]
      );

      return {
        replyType: 'buttons',
        bodyText: `🎫 We've created priority support ticket *#${ticketNo}* for your payment inquiry.\nOur payment desk is auditing the gateway logs and will resolve this within 15 minutes!`,
        buttons: [
          { id: 'SUPPORT_AGENT', title: 'Talk to Agent 📞' },
          { id: 'CMD_ORDER', title: 'Main Menu 🍕' }
        ]
      };
    } catch (e) {
      console.error('[PaymentFlow] Error:', e.message);
      return { replyType: 'text', bodyText: 'Unable to check payment status. Please reach out to an agent.' };
    }
  }
}

module.exports = new PaymentFlow();

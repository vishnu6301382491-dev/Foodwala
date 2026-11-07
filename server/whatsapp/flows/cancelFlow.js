/**
 * server/whatsapp/flows/cancelFlow.js
 * Order Cancellation Flow with 60-Second Policy Enforcement & Refund Timeline
 */

const db = require('../../db');
const messages = require('../messages');

class CancelFlow {
  /**
   * Evaluates order cancellation eligibility and confirms with buttons
   */
  async handle(user, session, orderId = null, confirmationAction = null) {
    const lang = user.language || 'en';
    const phone10 = user.phone_e164.length >= 10 ? user.phone_e164.slice(-10) : user.phone_e164;

    // 1. Handle confirmation callback (Yes / No)
    if (confirmationAction === 'CANCEL_CONFIRM_YES') {
      const targetOrderId = session.pendingCancelOrderId;
      if (!targetOrderId) {
        return { replyType: 'text', bodyText: 'No pending cancellation request found.' };
      }
      return this._executeCancel(user, session, targetOrderId);
    }

    if (confirmationAction === 'CANCEL_CONFIRM_NO') {
      session.pendingCancelOrderId = null;
      return {
        replyType: 'buttons',
        bodyText: '👍 Cancellation dismissed. Your meal is on its way to you!',
        buttons: messages.getMsg(lang, 'greetingButtons')
      };
    }

    // 2. Identify target order to cancel
    let targetId = orderId;
    if (!targetId) {
      const [recent] = await db.query(
        'SELECT order_id, status, order_date FROM orders WHERE customer_phone = ? ORDER BY order_id DESC LIMIT 1',
        [phone10]
      );
      if (!recent || recent.length === 0) {
        return {
          replyType: 'text',
          bodyText: 'You do not have any recent orders eligible for cancellation.'
        };
      }
      targetId = recent[0].order_id;
    }

    // 3. Verify order status & policy
    const [orders] = await db.query(
      'SELECT order_id, status, total_amount, payment_mode, order_date FROM orders WHERE order_id = ? LIMIT 1',
      [targetId]
    );

    if (!orders || orders.length === 0) {
      return { replyType: 'text', bodyText: `Order *FW${targetId}* was not found.` };
    }

    const ord = orders[0];
    const status = (ord.status || '').toUpperCase();

    const config = require('../config');
    const cancelWindowSec = config.cancellationWindowSec || 60;
    let elapsedSec = 0;
    const orderTimestamp = ord.order_date;
    if (orderTimestamp) {
      elapsedSec = Math.floor((Date.now() - new Date(orderTimestamp).getTime()) / 1000);
    }

    // Policy check: Only allow cancellation if PLACED or within initial window
    if ((status !== 'PLACED' && status !== 'CONFIRMED') || elapsedSec > cancelWindowSec) {
      const reason = elapsedSec > cancelWindowSec ? `past the free ${cancelWindowSec}-second cancellation window` : status;
      return {
        replyType: 'buttons',
        bodyText: messages.getMsg(lang, 'cancelNotAllowed', reason),
        buttons: [
          { id: 'SUPPORT_AGENT', title: 'Talk to Agent 📞' },
          { id: 'CMD_TRACK', title: 'Track Order 🛵' }
        ]
      };
    }

    // Prompt confirmation with Yes/No buttons
    session.pendingCancelOrderId = targetId;
    return {
      replyType: 'buttons',
      bodyText: messages.getMsg(lang, 'cancelConfirmation', targetId),
      buttons: messages.getMsg(lang, 'cancelButtons')
    };
  }

  async _executeCancel(user, session, orderId) {
    const lang = user.language || 'en';
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      await connection.execute(
        'UPDATE orders SET status = "CANCELLED", updated_at = NOW() WHERE order_id = ?',
        [orderId]
      );

      await connection.execute(
        'INSERT INTO order_status_history (order_id, status, changed_by, remarks) VALUES (?, "CANCELLED", "CUSTOMER", "Cancelled via WhatsApp bot within policy window")',
        [orderId]
      );

      await connection.commit();
      connection.release();

      session.pendingCancelOrderId = null;

      return {
        replyType: 'buttons',
        bodyText: messages.getMsg(lang, 'cancelSuccess', orderId),
        buttons: [
          { id: 'CMD_ORDER', title: 'Order Again 🍽️' },
          { id: 'CMD_HELP', title: 'Care Desk 💬' }
        ]
      };
    } catch (err) {
      await connection.rollback();
      connection.release();
      console.error('[CancelFlow] Error executing cancellation:', err.message);
      return {
        replyType: 'text',
        bodyText: 'We encountered an error processing your cancellation. Please contact our support team.'
      };
    }
  }
}

module.exports = new CancelFlow();

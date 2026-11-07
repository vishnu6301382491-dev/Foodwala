/**
 * server/whatsapp/flows/trackingFlow.js
 * Order Tracking Flow: Live Status, Rider Assignment, ETA, and Ownership Verification
 */

const db = require('../../db');
const messages = require('../messages');

class TrackingFlow {
  /**
   * Tracks customer order by specific Order ID or latest active order for user's phone
   */
  async handle(user, session, orderId = null) {
    const lang = user.language || 'en';
    const phone10 = user.phone_e164.length >= 10 ? user.phone_e164.slice(-10) : user.phone_e164;

    try {
      if (orderId) {
        // Direct order ID lookup with ownership validation
        const [rows] = await db.query(
          `SELECT o.order_id, o.restaurant_id, o.user_id, o.total_amount, o.status,
                  o.payment_mode, o.payment_status, o.estimated_delivery_time,
                  o.order_date, o.delivery_address, o.customer_phone,
                  r.name as restaurant_name, dp.name as valet_name, dp.phone as valet_phone
           FROM orders o
           LEFT JOIN restaurant r ON o.restaurant_id = r.restaurant_id
           LEFT JOIN delivery_partner dp ON o.delivery_partner_id = dp.partner_id
           WHERE o.order_id = ? LIMIT 1`,
          [orderId]
        );

        if (!rows || rows.length === 0) {
          return {
            replyType: 'text',
            bodyText: `We could not find any order matching *FW${orderId}*. Please verify the number.`
          };
        }

        const ord = rows[0];

        // Privacy check: verify phone or user matches if order customer phone is recorded
        const matchesPhone = ord.customer_phone && ord.customer_phone === phone10;
        const matchesUser = ord.user_id && user.user_id && ord.user_id === user.user_id;
        if (ord.customer_phone && !matchesPhone && !matchesUser) {
          return {
            replyType: 'text',
            bodyText: `🔒 For customer security and privacy, you can only track orders associated with your registered account holder phone number.`
          };
        }

        return {
          replyType: 'buttons',
          bodyText: messages.getMsg(lang, 'trackingActive', ord),
          buttons: [
            { id: 'CMD_HELP', title: 'Need Help 💬' },
            { id: 'CMD_ORDER', title: 'Order Food 🍽️' }
          ]
        };
      }

      // Check if user is an unauthenticated guest without phone
      const isGuest = !phone10 || phone10.startsWith('guest') || (user.phone_e164 && user.phone_e164.startsWith('web_guest'));
      if (isGuest && !user.user_id) {
        return {
          replyType: 'buttons',
          bodyText: '🔒 Please log in or verify your registered FoodWala account to track live orders.\n\nReply with your registered phone number or Order ID (e.g. *FW80*).',
          buttons: [
            { id: 'CMD_ORDER', title: 'Browse Menu 🍽️' },
            { id: 'CMD_HELP', title: 'Support Care 💬' }
          ]
        };
      }

      // Latest active orders lookup
      const [activeOrders] = await db.query(
        `SELECT o.order_id, o.status, o.total_amount, o.estimated_delivery_time,
                r.name as restaurant_name, dp.name as valet_name, dp.phone as valet_phone
         FROM orders o
         LEFT JOIN restaurant r ON o.restaurant_id = r.restaurant_id
         LEFT JOIN delivery_partner dp ON o.delivery_partner_id = dp.partner_id
         WHERE (o.customer_phone = ? OR (o.user_id = ? AND ? IS NOT NULL))
         ORDER BY o.order_id DESC LIMIT 3`,
        [phone10, user.user_id, user.user_id]
      );

      if (!activeOrders || activeOrders.length === 0) {
        return {
          replyType: 'buttons',
          bodyText: messages.getMsg(lang, 'trackingNotFound'),
          buttons: [
            { id: 'CMD_ORDER', title: 'Browse Menu 🍽️' },
            { id: 'CMD_HELP', title: 'Support Care 💬' }
          ]
        };
      }

      if (activeOrders.length === 1) {
        const ord = activeOrders[0];
        return {
          replyType: 'buttons',
          bodyText: messages.getMsg(lang, 'trackingActive', ord),
          buttons: [
            { id: `CANCEL_ORDER:${ord.order_id}`, title: 'Cancel Order ❌' },
            { id: 'CMD_ORDER', title: 'Order More 🍽️' }
          ]
        };
      }

      // Multiple orders: present interactive list
      const rows = activeOrders.map(o => ({
        id: `TRACK_ORDER:${o.order_id}`,
        title: `FW${o.order_id} - ₹${o.total_amount}`.substring(0, 24),
        description: `${o.status} | ${o.restaurant_name} | ${o.estimated_delivery_time || '30m'}`.substring(0, 72)
      }));

      return {
        replyType: 'list',
        headerText: 'Active Orders',
        bodyText: 'You have multiple recent orders. Which one would you like to track?',
        buttonText: 'Select Order',
        sections: [{ title: 'Recent Orders', rows }]
      };
    } catch (err) {
      console.error('[TrackingFlow] Error:', err.message);
      return {
        replyType: 'text',
        bodyText: 'Unable to retrieve tracking telemetry right now. Please try again in a moment.'
      };
    }
  }
}

module.exports = new TrackingFlow();

/**
 * server/whatsapp/flows/addressFlow.js
 * Address Modifications for Live Orders
 */

const db = require('../../db');

class AddressFlow {
  async handle(user, session, newAddressText = null) {
    const phone10 = user.phone_e164.length >= 10 ? user.phone_e164.slice(-10) : user.phone_e164;

    try {
      const [recent] = await db.query(
        'SELECT order_id, status, delivery_address FROM orders WHERE customer_phone = ? ORDER BY order_id DESC LIMIT 1',
        [phone10]
      );

      if (!recent || recent.length === 0) {
        return {
          replyType: 'buttons',
          bodyText: 'You do not have an active order right now. You can update your default delivery address in your FoodWala profile!',
          buttons: [
            { id: 'CMD_ORDER', title: 'Order Food 🍽️' },
            { id: 'CMD_HELP', title: 'Care Desk 💬' }
          ]
        };
      }

      const ord = recent[0];
      const status = (ord.status || '').toUpperCase();

      if (status === 'OUT_FOR_DELIVERY' || status === 'DELIVERED') {
        return {
          replyType: 'buttons',
          bodyText: `Order *FW${ord.order_id}* is already *${status}* and rider is on the road. Address cannot be changed directly via bot.\nPlease contact our support supervisor immediately!`,
          buttons: [
            { id: 'SUPPORT_AGENT', title: 'Call Supervisor 📞' },
            { id: `TRACK_ORDER:${ord.order_id}`, title: 'Track Rider 🛵' }
          ]
        };
      }

      if (newAddressText && newAddressText.length >= 5) {
        await db.query(
          'UPDATE orders SET delivery_address = ?, updated_at = NOW() WHERE order_id = ?',
          [newAddressText, ord.order_id]
        );
        return {
          replyType: 'buttons',
          bodyText: `✅ Address for Order *FW${ord.order_id}* updated to:\n*${newAddressText}*`,
          buttons: [
            { id: `TRACK_ORDER:${ord.order_id}`, title: 'Track Order 🛵' },
            { id: 'CMD_ORDER', title: 'Main Menu 🍕' }
          ]
        };
      }

      session.expectingAddressChangeForOrder = ord.order_id;
      return {
        replyType: 'text',
        bodyText: `Order *FW${ord.order_id}* is in *${status}* state. Please reply with the new address you'd like to deliver to:`
      };
    } catch (e) {
      console.error('[AddressFlow] Error:', e.message);
      return { replyType: 'text', bodyText: 'Unable to update address. Please contact support.' };
    }
  }
}

module.exports = new AddressFlow();

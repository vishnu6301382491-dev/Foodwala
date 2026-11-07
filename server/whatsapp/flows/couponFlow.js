/**
 * server/whatsapp/flows/couponFlow.js
 * Active Coupons & Offers directly from MySQL coupons table
 */

const db = require('../../db');

class CouponFlow {
  async handle(user, session) {
    try {
      const [rows] = await db.query(
        'SELECT code, discount_type, discount_value, min_order_amount, max_discount, description FROM coupons WHERE is_active = 1 AND (expires_at IS NULL OR expires_at > NOW()) ORDER BY discount_value DESC LIMIT 5'
      );

      if (!rows || rows.length === 0) {
        return {
          replyType: 'buttons',
          bodyText: '🏷️ There are currently no active public coupons available. Check back soon for exciting festive discounts!',
          buttons: [
            { id: 'CMD_ORDER', title: 'Order Food 🍽️' },
            { id: 'CMD_HELP', title: 'Care Desk 💬' }
          ]
        };
      }

      let text = '🎉 *Exclusive FoodWala Offers & Coupons:*\n\n';
      for (const cp of rows) {
        const discDesc = cp.discount_type === 'PERCENTAGE'
          ? `${cp.discount_value}% OFF${cp.max_discount ? ` up to ₹${cp.max_discount}` : ''}`
          : `Flat ₹${cp.discount_value} OFF`;
        text += `• *${cp.code}* — ${discDesc}\n  ${cp.description || `Min order ₹${cp.min_order_amount}`}\n\n`;
      }
      text += '⚡ Free delivery automatically unlocked on orders above ₹299!';

      return {
        replyType: 'buttons',
        bodyText: text.trim(),
        buttons: [
          { id: 'CMD_ORDER', title: 'Order Food Now 🍽️' },
          { id: 'VIEW_CART', title: 'View My Cart 🛒' }
        ]
      };
    } catch (e) {
      console.error('[CouponFlow] Error:', e.message);
      return { replyType: 'text', bodyText: 'Unable to load coupons right now. Please try again later.' };
    }
  }
}

module.exports = new CouponFlow();

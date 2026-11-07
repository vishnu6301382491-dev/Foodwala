/**
 * server/whatsapp/templates.js
 * Meta WhatsApp Business Approved Utility Template Definitions
 * Submit these 4 templates in Meta WhatsApp Manager > Message Templates for 24h customer window compliance.
 */

const templates = {
  // 1. Order Confirmation (Utility)
  ORDER_CONFIRMATION: {
    name: 'foodwala_order_confirmation',
    category: 'UTILITY',
    language: 'en_US',
    components: [
      {
        type: 'BODY',
        text: 'Hi {{1}}, your FoodWala order FW{{2}} is confirmed! Total: ₹{{3}}. Estimated delivery time is {{4}}. Our kitchen is preparing your meal fresh and hot. 🛵',
        example: {
          body_text: [['Vishnu', '101', '350', '30-35 mins']]
        }
      },
      {
        type: 'BUTTONS',
        buttons: [
          {
            type: 'QUICK_REPLY',
            text: 'Track Order'
          }
        ]
      }
    ]
  },

  // 2. Out For Delivery (Utility)
  OUT_FOR_DELIVERY: {
    name: 'foodwala_order_out_for_delivery',
    category: 'UTILITY',
    language: 'en_US',
    components: [
      {
        type: 'BODY',
        text: 'Hi {{1}}, your FoodWala order FW{{2}} is out for delivery! Your delivery partner {{3}} ({{4}}) is on the way. ETA: {{5}}.',
        example: {
          body_text: [['Vishnu', '101', 'Ramesh Kumar', '+919876543210', '15 mins']]
        }
      }
    ]
  },

  // 3. Order Delivered (Utility)
  ORDER_DELIVERED: {
    name: 'foodwala_order_delivered',
    category: 'UTILITY',
    language: 'en_US',
    components: [
      {
        type: 'BODY',
        text: 'Hi {{1}}, order FW{{2}} has been delivered! Enjoy your meal. We would love to know how your food was! 🍽️',
        example: {
          body_text: [['Vishnu', '101']]
        }
      }
    ]
  },

  // 4. Payment Pending (Utility)
  PAYMENT_PENDING: {
    name: 'foodwala_payment_pending',
    category: 'UTILITY',
    language: 'en_US',
    components: [
      {
        type: 'BODY',
        text: 'Hi {{1}}, your payment of ₹{{2}} for order FW{{3}} is pending. Please complete your payment within 15 minutes to secure your meal from the kitchen.',
        example: {
          body_text: [['Vishnu', '249', '102']]
        }
      }
    ]
  }
};

module.exports = templates;

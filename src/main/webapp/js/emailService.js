/**
 * FoodWala — Customer Order Email Receipt Service
 * Powered by EmailJS Browser SDK (Client-side dispatch for static hosting / GitHub Pages)
 * Sends automated, styled order confirmation receipts to customer email from foodwalapp@gmail.com
 */
(function (window) {
  'use strict';

  /* =======================================================================
   * 📧 EMAILJS CONFIGURATION (Replace placeholder values below)
   * Refer to EMAIL_SETUP.md for step-by-step instructions.
   * NOTE: Never enter your raw Gmail password! EmailJS uses secure API tokens.
   * ======================================================================= */
  const EMAILJS_CONFIG = {
    SERVICE_ID: 'service_s6chkik',       // EmailJS Gmail Service ID
    TEMPLATE_ID: 'template_fs6ee5x',     // EmailJS Receipt Template ID
    PUBLIC_KEY: 'wE9osxGnQVfki9oIW',     // EmailJS Browser Public Key
    SENDER_EMAIL: 'foodwalapp@gmail.com' // Verified sender email
  };

  const EMAILJS_CDN = 'https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js';

  // Helper: check if EmailJS credentials have been supplied by developer
  function isEmailJsConfigured() {
    return Boolean(
      EMAILJS_CONFIG.SERVICE_ID && !EMAILJS_CONFIG.SERVICE_ID.includes('YOUR_') &&
      EMAILJS_CONFIG.TEMPLATE_ID && !EMAILJS_CONFIG.TEMPLATE_ID.includes('YOUR_') &&
      EMAILJS_CONFIG.PUBLIC_KEY && !EMAILJS_CONFIG.PUBLIC_KEY.includes('YOUR_')
    );
  }

  // Helper: load EmailJS SDK dynamically if not yet attached to window
  function ensureEmailJsLoaded() {
    return new Promise((resolve, reject) => {
      if (window.emailjs) {
        return resolve(window.emailjs);
      }

      let existing = document.querySelector(`script[src="${EMAILJS_CDN}"]`);
      if (existing) {
        existing.addEventListener('load', () => resolve(window.emailjs));
        existing.addEventListener('error', (e) => reject(e));
        return;
      }

      const script = document.createElement('script');
      script.src = EMAILJS_CDN;
      script.crossOrigin = 'anonymous';
      script.onload = () => {
        if (window.emailjs) {
          resolve(window.emailjs);
        } else {
          reject(new Error('EmailJS script loaded but window.emailjs is missing.'));
        }
      };
      script.onerror = (e) => reject(e);
      document.head.appendChild(script);
    });
  }

  // Format line-items list for email template
  function formatItemsText(items) {
    if (!Array.isArray(items) || items.length === 0) {
      return '1x Authentic Bengaluru Meal Combo (Rs. 0)';
    }
    return items.map((it, idx) => {
      const qty = it.quantity || 1;
      const price = Number(it.price) || 0;
      const total = price * qty;
      return `${idx + 1}. ${qty}x ${it.name || 'Delicacy'} — Rs. ${total}`;
    }).join('\n');
  }

  // Format date and time
  function formatOrderDate(dateInput) {
    const d = dateInput ? new Date(dateInput) : new Date();
    if (isNaN(d.getTime())) return new Date().toLocaleString('en-IN');
    return d.toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  }

  /**
   * Sends an order receipt to the customer's email address exactly ONCE.
   * Tracks an `emailSent` flag on the order object in localStorage.
   * 
   * @param {Object} order - FoodWala order object
   * @param {Object} [user] - Logged-in user or customer profile
   * @returns {Promise<Object>} Status of the email dispatch
   */
  async function sendReceiptEmail(order, user) {
    if (!order) {
      console.warn('[FoodWala EmailService] No order provided.');
      return { success: false, reason: 'NO_ORDER' };
    }

    // 1. Guard against duplicate sending (Run exactly ONCE per order)
    if (order.emailSent === true) {
      console.log(`[FoodWala EmailService] Receipt already sent for order #${order.orderId || order.id}. Skipping.`);
      return { success: true, alreadySent: true };
    }

    // 2. Resolve recipient email address
    let recipientEmail = '';
    if (order.customerEmail && order.customerEmail.includes('@') && !order.customerEmail.includes('example.com')) {
      recipientEmail = order.customerEmail.trim();
    } else if (user && user.email && user.email.includes('@')) {
      recipientEmail = user.email.trim();
    } else if (order.email && order.email.includes('@')) {
      recipientEmail = order.email.trim();
    } else {
      // Check FoodWalaAuth current user
      try {
        const authUser = window.FoodWalaApp && window.FoodWalaApp.Auth && window.FoodWalaApp.Auth.getCurrentUser();
        if (authUser && authUser.email && authUser.email.includes('@')) {
          recipientEmail = authUser.email.trim();
        }
      } catch (e) {}
    }

    if (!recipientEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientEmail)) {
      console.warn('[FoodWala EmailService] Recipient email is missing or invalid:', recipientEmail);
      return { success: false, reason: 'INVALID_EMAIL' };
    }

    const orderId = String(order.orderId || order.id || 'FW-ORDER').replace(/^#/, '');
    const customerName = order.customerName || (user ? user.name : 'Valued Customer');
    const restaurant = order.restaurantName || 'Bengaluru Restaurant';
    const totalAmount = 'Rs. ' + (Number(order.grandTotal) || 0).toFixed(2);
    const paymentMode = order.paymentMethod || 'UPI Instant';
    const orderDate = formatOrderDate(order.createdAtMs || order.createdAt);
    const address = order.deliveryAddress || (order.address || 'Bengaluru, Karnataka');
    const itemsFormatted = formatItemsText(order.items);

    // 3. Check if EmailJS keys have been configured
    if (!isEmailJsConfigured()) {
      console.warn('[FoodWala EmailService] EmailJS keys are not yet configured. See EMAIL_SETUP.md.');
      // Mark as emailSent: true so we do not spam user with warning toasts on subsequent visits/refreshes
      order.emailSent = true;
      order.emailAttempted = true;
      if (window.FoodWalaApp && window.FoodWalaApp.Orders) {
        window.FoodWalaApp.Orders.saveOrder(order);
      }
      if (window.FoodWalaApp && window.FoodWalaApp.showToast) {
        window.FoodWalaApp.showToast('Order confirmed. Receipt email could not be sent (EmailJS not yet configured).', 'warning');
      }
      return { success: false, reason: 'NOT_CONFIGURED' };
    }

    // 4. Dispatch email via EmailJS browser SDK
    try {
      const emailjs = await ensureEmailJsLoaded();
      emailjs.init({ publicKey: EMAILJS_CONFIG.PUBLIC_KEY });

      const templateParams = {
        to_email: recipientEmail,
        customer_name: customerName,
        order_id: `#${orderId}`,
        restaurant: restaurant,
        items: itemsFormatted,
        total: totalAmount,
        payment_mode: paymentMode,
        order_date: orderDate,
        address: address,
        from_name: 'FoodWala'
      };

      console.log(`[FoodWala EmailService] Dispatching receipt for #${orderId} to ${recipientEmail}...`);
      await emailjs.send(
        EMAILJS_CONFIG.SERVICE_ID,
        EMAILJS_CONFIG.TEMPLATE_ID,
        templateParams,
        EMAILJS_CONFIG.PUBLIC_KEY
      );

      console.log(`[FoodWala EmailService] Receipt successfully emailed to ${recipientEmail}!`);
      
      // Mark order as sent & save
      order.emailSent = true;
      if (window.FoodWalaApp && window.FoodWalaApp.Orders) {
        window.FoodWalaApp.Orders.saveOrder(order);
      }

      if (window.FoodWalaApp && window.FoodWalaApp.showToast) {
        window.FoodWalaApp.showToast(`Receipt sent to ${recipientEmail}`, 'success');
      }

      return { success: true, email: recipientEmail };
    } catch (err) {
      console.error('[FoodWala EmailService] Error sending receipt email:', err);
      // Even if email delivery fails, the order has succeeded
      order.emailSent = false;
      order.emailAttempted = true;
      if (window.FoodWalaApp && window.FoodWalaApp.Orders) {
        window.FoodWalaApp.Orders.saveOrder(order);
      }

      if (window.FoodWalaApp && window.FoodWalaApp.showToast) {
        window.FoodWalaApp.showToast('Order confirmed. Receipt email could not be sent.', 'warning');
      }

      return { success: false, error: err };
    }
  }

  window.FoodWalaEmail = {
    sendReceiptEmail: sendReceiptEmail,
    CONFIG: EMAILJS_CONFIG,
    isConfigured: isEmailJsConfigured
  };

})(typeof window !== 'undefined' ? window : this);

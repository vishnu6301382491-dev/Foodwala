/**
 * FoodWala — Customer & Admin Order Email Receipt Service
 * Powered by EmailJS Browser SDK (Client-side dispatch for static hosting / GitHub Pages)
 * Sends automated, styled order confirmation receipts:
 * 1. Customer Copy: to_email = customer's email entered at checkout (NEVER falls back to foodwalapp@gmail.com)
 * 2. Admin Copy: to_email = foodwalapp@gmail.com with admin_note: "Copy of customer receipt (customer: <customer email>)"
 */
(function (window) {
  'use strict';

  /* =======================================================================
   * 📧 EMAILJS CONFIGURATION (Real Active Keys)
   * ======================================================================= */
  const EMAILJS_CONFIG = {
    SERVICE_ID: 'service_s6chkik',       // EmailJS Service ID (Active)
    TEMPLATE_ID: 'template_fs6ee5x',     // EmailJS Receipt Template ID (Active)
    PUBLIC_KEY: 'wE9osxGnQVfki9oIW',     // EmailJS Browser Public Key (Active)
    SENDER_EMAIL: 'foodwalapp@gmail.com' // Admin copy destination / sender email
  };

  const EMAILJS_CDN = 'https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js';

  // Helper: check if EmailJS credentials have been supplied
  function isEmailJsConfigured() {
    return Boolean(
      EMAILJS_CONFIG.SERVICE_ID &&
      EMAILJS_CONFIG.SERVICE_ID.trim() !== '' &&
      !EMAILJS_CONFIG.SERVICE_ID.includes('YOUR_') &&
      EMAILJS_CONFIG.TEMPLATE_ID &&
      EMAILJS_CONFIG.TEMPLATE_ID.trim() !== '' &&
      !EMAILJS_CONFIG.TEMPLATE_ID.includes('YOUR_') &&
      EMAILJS_CONFIG.PUBLIC_KEY &&
      EMAILJS_CONFIG.PUBLIC_KEY.trim() !== '' &&
      !EMAILJS_CONFIG.PUBLIC_KEY.includes('YOUR_')
    );
  }

  // Helper: load EmailJS SDK dynamically if not yet attached to window
  function ensureEmailJsLoaded() {
    return new Promise((resolve, reject) => {
      if (window.emailjs && typeof window.emailjs.send === 'function') {
        return resolve(window.emailjs);
      }

      let existing = document.querySelector('script[src*="emailjs"]');
      if (existing) {
        if (window.emailjs && typeof window.emailjs.send === 'function') {
          return resolve(window.emailjs);
        }
        existing.addEventListener('load', () => {
          if (window.emailjs) resolve(window.emailjs);
          else reject(new Error('EmailJS script loaded but window.emailjs is missing.'));
        });
        existing.addEventListener('error', (e) => reject(e));
        setTimeout(() => {
          if (window.emailjs && typeof window.emailjs.send === 'function') resolve(window.emailjs);
        }, 150);
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
   * Sends order receipts via EmailJS Browser SDK:
   * 1. Customer copy sent to customer's email (to_email = customer email). NEVER falls back to foodwalapp@gmail.com.
   * 2. Admin copy sent to foodwalapp@gmail.com with admin_note = "Copy of customer receipt (customer: <customer email>)".
   * 
   * Tracks customerEmailSent and adminEmailSent flags on the order object.
   * 
   * @param {Object} order - FoodWala order object
   * @param {Object} [user] - Logged-in user or customer profile
   * @param {boolean} [forceResend=false] - If true, re-sends even if already marked sent
   * @returns {Promise<Object>} Status of dispatches
   */
  async function sendReceiptEmail(order, user, forceResend = false) {
    if (!order) {
      console.warn('[FoodWala EmailService] No order provided.');
      return { success: false, reason: 'NO_ORDER' };
    }

    // Guard: If both customer and admin receipts have already been sent, skip completely
    if (order.customerEmailSent === true && order.adminEmailSent === true && !forceResend) {
      console.log(`[FoodWala EmailService] Both customer and admin receipts already sent for order #${order.orderId || order.id}. Skipping.`);
      return { success: true, alreadySent: true, status: 200 };
    }

    // 1. Resolve customer email strictly from order or profile (NEVER fall back to foodwalapp@gmail.com)
    let customerEmail = '';
    if (order.customerEmail && order.customerEmail.includes('@') && !order.customerEmail.includes('example.com')) {
      customerEmail = order.customerEmail.trim();
    } else if (order.email && order.email.includes('@') && !order.email.includes('example.com')) {
      customerEmail = order.email.trim();
    } else if (user && user.email && user.email.includes('@') && !user.email.includes('example.com')) {
      customerEmail = user.email.trim();
    } else {
      try {
        const authUser = window.FoodWalaApp && window.FoodWalaApp.Auth && window.FoodWalaApp.Auth.getCurrentUser();
        if (authUser && authUser.email && authUser.email.includes('@') && !authUser.email.includes('example.com')) {
          customerEmail = authUser.email.trim();
        }
      } catch (e) {}
    }

    const isCustomerEmailValid = Boolean(customerEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail));

    const orderId = String(order.orderId || order.id || 'FW-ORDER').replace(/^#/, '');
    const customerName = order.name || order.customerName || (user ? user.name : 'Valued Customer');
    const restaurant = order.restaurantName || (order.restaurant ? order.restaurant.name : 'Bengaluru Restaurant');
    const totalAmount = 'Rs. ' + (Number(order.grandTotal) || 0).toFixed(2);
    const paymentMode = order.paymentMethod || 'UPI Instant';
    const orderDate = formatOrderDate(order.createdAtMs || order.createdAt);
    const address = order.deliveryAddress || order.address || 'Bengaluru, Karnataka';
    const itemsFormatted = formatItemsText(order.items);

    // 2. Verify EmailJS configuration
    if (!isEmailJsConfigured()) {
      console.error('[FoodWala EmailService] EmailJS keys are not configured. Cannot send email.');
      order.customerEmailSent = false;
      order.adminEmailSent = false;
      order.emailSent = false;
      if (window.FoodWalaApp && typeof window.FoodWalaApp.showToast === 'function') {
        window.FoodWalaApp.showToast('Order confirmed. Receipt email could not be sent.', 'warning');
      }
      return { success: false, reason: 'NOT_CONFIGURED' };
    }

    let emailjs;
    try {
      emailjs = await ensureEmailJsLoaded();
      emailjs.init({ publicKey: EMAILJS_CONFIG.PUBLIC_KEY });
    } catch (loadErr) {
      console.error('[FoodWala EmailService] Failed to load EmailJS SDK:', loadErr);
      if (window.FoodWalaApp && typeof window.FoodWalaApp.showToast === 'function') {
        window.FoodWalaApp.showToast('Order confirmed. Receipt email could not be sent.', 'warning');
      }
      return { success: false, error: loadErr };
    }

    let customerResult = { success: false, skipped: false };
    let adminResult = { success: false, skipped: false };

    // =========================================================================
    // PART 1: SEND CUSTOMER COPY (to_email = customer's email)
    // NEVER fall back to foodwalapp@gmail.com for this copy.
    // =========================================================================
    const shouldSendCustomer = (!order.customerEmailSent || forceResend);
    if (shouldSendCustomer) {
      if (!isCustomerEmailValid) {
        console.warn('[FoodWala EmailService] Customer email is missing or invalid. Customer receipt NOT sent (no fallback):', customerEmail);
        order.customerEmailSent = false;
        if (window.FoodWalaApp && typeof window.FoodWalaApp.showToast === 'function') {
          window.FoodWalaApp.showToast('Order confirmed. Receipt email could not be sent.', 'warning');
        }
        customerResult = { success: false, reason: 'INVALID_CUSTOMER_EMAIL' };
      } else {
        const customerParams = {
          to_email: customerEmail,
          customer_name: customerName,
          order_id: `#${orderId}`,
          restaurant: restaurant,
          items: itemsFormatted,
          total: totalAmount,
          payment_mode: paymentMode,
          order_date: orderDate,
          address: address,
          admin_note: ''
        };

        try {
          console.log(`[FoodWala EmailService] Dispatching customer receipt for #${orderId} to ${customerEmail}...`, customerParams);
          const custResponse = await emailjs.send(
            EMAILJS_CONFIG.SERVICE_ID,
            EMAILJS_CONFIG.TEMPLATE_ID,
            customerParams,
            EMAILJS_CONFIG.PUBLIC_KEY
          );

          console.log('[FoodWala EmailService] Customer EmailJS response:', {
            status: custResponse ? custResponse.status : null,
            text: custResponse ? custResponse.text : null,
            response: custResponse
          });

          if (custResponse && custResponse.status === 200) {
            order.customerEmailSent = true;
            order.customerEmailSentAt = new Date().toISOString();
            order.emailSent = true; // backward compatibility

            console.log(`[FoodWala EmailService] Customer receipt successfully sent to ${customerEmail}!`);
            if (window.FoodWalaApp && typeof window.FoodWalaApp.showToast === 'function') {
              window.FoodWalaApp.showToast(`Receipt sent to ${customerEmail}`, 'success');
            }
            customerResult = { success: true, status: 200, email: customerEmail, response: custResponse };
          } else {
            console.error('[FoodWala EmailService] Customer receipt returned non-200 status:', custResponse);
            order.customerEmailSent = false;
            if (window.FoodWalaApp && typeof window.FoodWalaApp.showToast === 'function') {
              window.FoodWalaApp.showToast('Order confirmed. Receipt email could not be sent.', 'warning');
            }
            customerResult = { success: false, reason: 'NON_200_STATUS', response: custResponse };
          }
        } catch (custErr) {
          console.error('[FoodWala EmailService] Error sending customer receipt to ' + customerEmail + ':', {
            status: custErr && custErr.status ? custErr.status : 'N/A',
            text: custErr && custErr.text ? custErr.text : (custErr && custErr.message ? custErr.message : String(custErr)),
            error: custErr
          });
          order.customerEmailSent = false;
          if (window.FoodWalaApp && typeof window.FoodWalaApp.showToast === 'function') {
            window.FoodWalaApp.showToast('Order confirmed. Receipt email could not be sent.', 'warning');
          }
          customerResult = { success: false, error: custErr };
        }
      }
    } else {
      customerResult = { success: true, alreadySent: true, status: 200, email: customerEmail };
    }

    // =========================================================================
    // PART 2: SEND ADMIN COPY (to_email = foodwalapp@gmail.com)
    // Extra param: admin_note = "Copy of customer receipt (customer: <customer email>)"
    // If admin copy fails, do NOT show an error to customer; log to console only.
    // =========================================================================
    const shouldSendAdmin = (!order.adminEmailSent || forceResend);
    if (shouldSendAdmin) {
      const adminEmail = EMAILJS_CONFIG.SENDER_EMAIL || 'foodwalapp@gmail.com';
      const adminNoteText = `Copy of customer receipt (customer: ${isCustomerEmailValid ? customerEmail : (order.customerEmail || 'Guest')})`;

      const adminParams = {
        to_email: adminEmail,
        customer_name: customerName,
        order_id: `#${orderId}`,
        restaurant: restaurant,
        items: itemsFormatted,
        total: totalAmount,
        payment_mode: paymentMode,
        order_date: orderDate,
        address: address,
        admin_note: adminNoteText
      };

      try {
        console.log(`[FoodWala EmailService] Dispatching admin receipt copy for #${orderId} to ${adminEmail}...`, adminParams);
        const admResponse = await emailjs.send(
          EMAILJS_CONFIG.SERVICE_ID,
          EMAILJS_CONFIG.TEMPLATE_ID,
          adminParams,
          EMAILJS_CONFIG.PUBLIC_KEY
        );

        console.log('[FoodWala EmailService] Admin EmailJS response:', {
          status: admResponse ? admResponse.status : null,
          text: admResponse ? admResponse.text : null,
          response: admResponse
        });

        if (admResponse && admResponse.status === 200) {
          order.adminEmailSent = true;
          order.adminEmailSentAt = new Date().toISOString();
          console.log(`[FoodWala EmailService] Admin copy successfully emailed to ${adminEmail}!`);
          adminResult = { success: true, status: 200, email: adminEmail, response: admResponse };
        } else {
          // Requirement 4: If admin copy fails, do not show error to customer! Log to console only!
          console.error('[FoodWala EmailService] Admin receipt copy returned non-200 status:', admResponse);
          order.adminEmailSent = false;
          adminResult = { success: false, reason: 'NON_200_STATUS', response: admResponse };
        }
      } catch (admErr) {
        // Requirement 4: If admin copy fails, do not show error to customer! Log to console only!
        console.error('[FoodWala EmailService] Error sending admin receipt copy to ' + adminEmail + ':', {
          status: admErr && admErr.status ? admErr.status : 'N/A',
          text: admErr && admErr.text ? admErr.text : (admErr && admErr.message ? admErr.message : String(admErr)),
          error: admErr
        });
        order.adminEmailSent = false;
        adminResult = { success: false, error: admErr };
      }
    } else {
      adminResult = { success: true, alreadySent: true, status: 200 };
    }

    // Save updated order with customerEmailSent and adminEmailSent flags
    if (window.FoodWalaApp && window.FoodWalaApp.Orders && typeof window.FoodWalaApp.Orders.saveOrder === 'function') {
      window.FoodWalaApp.Orders.saveOrder(order);
    }

    return {
      success: Boolean(customerResult && customerResult.success),
      status: customerResult && customerResult.status === 200 ? 200 : (customerResult.alreadySent ? 200 : 0),
      customer: customerResult,
      admin: adminResult
    };
  }

  /**
   * Sends 6-digit password reset verification OTP to user's email via EmailJS
   * @param {string} email - Recipient email address
   * @param {string} otp - 6-digit OTP verification code
   * @param {string} [userName] - Optional recipient name
   * @returns {Promise<Object>} Status of dispatch
   */
  async function sendOtpEmail(email, otp, userName) {
    if (!email || !email.includes('@')) {
      console.warn('[FoodWala EmailService] Invalid email address for OTP dispatch:', email);
      return { success: false, reason: 'INVALID_EMAIL' };
    }

    const safeEmail = email.trim();
    const safeName = (userName && userName.trim()) || 'FoodWala Member';
    const otpCode = String(otp).trim();
    const formattedDate = formatOrderDate(new Date());

    if (!isEmailJsConfigured()) {
      console.warn('[FoodWala EmailService] EmailJS not configured. Utilizing sandbox OTP display.');
      return { success: true, isDevSandbox: true, otp: otpCode };
    }

    try {
      const emailjs = await ensureEmailJsLoaded();
      emailjs.init({ publicKey: EMAILJS_CONFIG.PUBLIC_KEY });

      const emailParams = {
        to_email: safeEmail,
        customer_name: safeName,
        order_id: `VERIFY-${otpCode}`,
        restaurant: 'FoodWala Account Security',
        items: `Your FoodWala Password Reset Verification OTP is:\n\n👉  ${otpCode}  👈\n\nThis verification code is strictly valid for 15 minutes. If you did not request a password reset, please ignore this email or secure your account.`,
        total: `OTP: ${otpCode}`,
        payment_mode: 'Security Verification Code',
        order_date: formattedDate,
        address: 'Account Security / Password Reset Verification',
        admin_note: `Password Reset OTP dispatch to ${safeEmail}`
      };

      console.log(`[FoodWala EmailService] Dispatching Password Reset OTP to ${safeEmail}...`, emailParams);
      const response = await emailjs.send(
        EMAILJS_CONFIG.SERVICE_ID,
        EMAILJS_CONFIG.TEMPLATE_ID,
        emailParams,
        EMAILJS_CONFIG.PUBLIC_KEY
      );

      console.log('[FoodWala EmailService] OTP Email response:', response);
      if (response && response.status === 200) {
        return { success: true, status: 200, email: safeEmail, otp: otpCode };
      }
      return { success: false, reason: 'NON_200_STATUS', response: response, otp: otpCode };
    } catch (err) {
      console.warn('[FoodWala EmailService] EmailJS send error for OTP (falling back to sandbox preview):', err);
      return { success: true, isDevFallback: true, error: err, otp: otpCode };
    }
  }

  window.FoodWalaEmail = {
    sendReceiptEmail: sendReceiptEmail,
    sendOtpEmail: sendOtpEmail,
    CONFIG: EMAILJS_CONFIG,
    isConfigured: isEmailJsConfigured
  };

})(typeof window !== 'undefined' ? window : this);

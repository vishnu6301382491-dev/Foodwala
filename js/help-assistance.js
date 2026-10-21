/**
 * FoodWala — 24/7 Help Assistance System
 * Provides an intelligent, instant-resolution customer support widget across all pages.
 */
(function(window, document) {
  'use strict';

  var FoodWalaHelpAssistant = {
    initialized: false,

    init: function() {
      if (this.initialized) return;
      this.initialized = true;

      this.injectFloatingButton();
      this.injectModal();
      this.bindEvents();
    },

    injectFloatingButton: function() {
      if (document.getElementById('fw-floating-help-btn')) return;

      var waPhone = (window.FOODWALA_CONFIG && window.FOODWALA_CONFIG.WHATSAPP_SUPPORT_NUMBER) || '918500457005';
      var waUrl = 'https://wa.me/' + waPhone + '?text=' + encodeURIComponent('Hi FoodWala, I need assistance with my order');

      // 1. Floating WhatsApp Assistance Button
      var waBtn = document.createElement('a');
      waBtn.id = 'fw-floating-whatsapp-btn';
      waBtn.className = 'fw-help-floating-wa-btn';
      waBtn.href = waUrl;
      waBtn.target = '_blank';
      waBtn.rel = 'noopener noreferrer';
      waBtn.setAttribute('aria-label', 'Chat with FoodWala Support on WhatsApp');
      waBtn.setAttribute('title', 'Direct WhatsApp AI Assistance (+91 85004 57005)');
      waBtn.innerHTML = [
        '<i class="bi bi-whatsapp fs-5"></i>',
        '<span>WhatsApp</span>'
      ].join('');
      document.body.appendChild(waBtn);

      // 2. Floating 24/7 Web Care Center Button
      var btn = document.createElement('button');
      btn.id = 'fw-floating-help-btn';
      btn.className = 'fw-help-floating-btn';
      btn.type = 'button';
      btn.setAttribute('aria-label', 'Open 24/7 Customer Help Assistance');
      btn.setAttribute('data-bs-toggle', 'modal');
      btn.setAttribute('data-bs-target', '#foodwalaHelpModal');
      btn.innerHTML = [
        '<span class="fw-help-pulse-dot"></span>',
        '<i class="bi bi-headset fs-5"></i>',
        '<span>24/7 Help</span>'
      ].join('');

      document.body.appendChild(btn);
    },

    injectModal: function() {
      if (document.getElementById('foodwalaHelpModal')) return;

      var waPhone = (window.FOODWALA_CONFIG && window.FOODWALA_CONFIG.WHATSAPP_SUPPORT_NUMBER) || '918500457005';
      var waUrl = 'https://wa.me/' + waPhone + '?text=' + encodeURIComponent('Hi FoodWala, I need assistance with my order');

      var modalHtml = [
        '<div class="modal fade fw-help-modal" id="foodwalaHelpModal" tabindex="-1" aria-labelledby="foodwalaHelpModalLabel" aria-hidden="true">',
        '  <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable" style="max-width: 440px;">',
        '    <div class="modal-content shadow-2xl border-0">',
        '      <!-- Modal Header -->',
        '      <div class="modal-header fw-help-modal-header text-white d-flex align-items-center justify-content-between">',
        '        <div class="d-flex align-items-center gap-2">',
        '          <div class="bg-white text-danger rounded-circle d-flex align-items-center justify-content-center shadow-sm" style="width: 38px; height: 38px;">',
        '            <i class="bi bi-headset fs-5"></i>',
        '          </div>',
        '          <div>',
        '            <h6 class="modal-title fw-bold lh-1 mb-1" id="foodwalaHelpModalLabel">FoodWala 24/7 Care</h6>',
        '            <small class="text-white text-opacity-85 d-flex align-items-center gap-1" style="font-size: 0.75rem;">',
        '              <span class="fw-help-pulse-dot" style="width: 7px; height: 7px;"></span> Live Online • Avg Response: 15s',
        '            </small>',
        '          </div>',
        '        </div>',
        '        <div class="d-flex align-items-center gap-2">',
        '          <a href="' + waUrl + '" target="_blank" rel="noopener noreferrer" class="btn btn-sm btn-success rounded-pill px-2.5 py-1 text-white fw-bold d-flex align-items-center gap-1 shadow-sm text-decoration-none" style="font-size: 0.76rem;" title="Chat directly with FoodWala on WhatsApp">',
        '            <i class="bi bi-whatsapp"></i> WhatsApp',
        '          </a>',
        '          <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>',
        '        </div>',
        '      </div>',
        '      <!-- Chat Body -->',
        '      <div class="fw-help-chat-box" id="fw-help-chat-messages">',
        '        <div class="fw-chat-msg-agent">',
        '          👋 <strong>Hello! Welcome to FoodWala 24/7 Support.</strong><br>',
        '          How can we help you today with your order, cancellation, refund, delivery, or discount queries?',
        '          <div class="mt-2 pt-2 border-top border-light-subtle d-flex align-items-center justify-content-between flex-wrap gap-1">',
        '            <span class="small text-muted"><i class="bi bi-whatsapp text-success me-1"></i> Prefer WhatsApp?</span>',
        '            <a href="' + waUrl + '" target="_blank" rel="noopener noreferrer" class="badge bg-success text-white text-decoration-none py-1.5 px-2.5 rounded-pill d-inline-flex align-items-center gap-1">',
        '              <i class="bi bi-whatsapp"></i> Chat on WhatsApp AI',
        '            </a>',
        '          </div>',
        '        </div>',
        '      </div>',
        '      <!-- Smart Suggestions Chips -->',
        '      <div class="p-2.5 px-3 bg-white border-top border-bottom d-flex flex-wrap gap-1.5" id="fw-help-chips-container">',
        '        <button type="button" class="fw-smart-chip-btn bg-success bg-opacity-10 text-success border-success fw-bold" data-query="whatsapp"><i class="bi bi-whatsapp"></i> WhatsApp Support</button>',
        '        <button type="button" class="fw-smart-chip-btn" data-query="track_order">🛵 Where is my order?</button>',
        '        <button type="button" class="fw-smart-chip-btn" data-query="refund">💰 Refund & Cancel</button>',
        '        <button type="button" class="fw-smart-chip-btn" data-query="coupon">🏷️ 50% Off Coupon</button>',
        '        <button type="button" class="fw-smart-chip-btn" data-query="request_callback">📞 Request Callback</button>',
        '        <button type="button" class="fw-smart-chip-btn" data-query="location">📍 Change Address</button>',
        '        <button type="button" class="fw-smart-chip-btn" data-query="hygiene">⭐ Kitchen Hygiene</button>',
        '      </div>',
        '      <!-- Chat Input Area -->',
        '      <div class="p-3 bg-white">',
        '        <form id="fw-help-chat-form" class="d-flex align-items-center gap-2 mb-2">',
        '          <input type="text" id="fw-help-chat-input" class="form-control form-control-sm rounded-pill px-3 py-2" placeholder="Type your question or query..." autocomplete="off">',
        '          <button type="submit" class="btn btn-danger btn-sm rounded-pill px-3 py-2 fw-bold d-flex align-items-center gap-1">',
        '            <i class="bi bi-send-fill"></i>',
        '          </button>',
        '        </form>',
        '        <!-- Privacy-Protected Escalation Bar -->',
        '        <div class="d-flex align-items-center justify-content-between pt-2 border-top text-muted" style="font-size: 0.75rem;">',
        '          <a href="' + waUrl + '" target="_blank" rel="noopener noreferrer" class="btn btn-link text-decoration-none text-success fw-bold d-flex align-items-center gap-1 p-0">',
        '            <i class="bi bi-whatsapp"></i> WhatsApp',
        '          </a>',
        '          <span class="text-muted">•</span>',
        '          <button type="button" class="btn btn-link text-decoration-none text-danger fw-bold d-flex align-items-center gap-1 p-0 js-callback-prompt-btn">',
        '            <i class="bi bi-telephone-inbound-fill"></i> Callback',
        '          </button>',
        '          <span class="text-muted">•</span>',
        '          <button type="button" class="btn btn-link text-decoration-none text-success fw-bold d-flex align-items-center gap-1 p-0 js-priority-ticket-btn">',
        '            <i class="bi bi-ticket-perforated-fill"></i> Priority Ticket',
        '          </button>',
        '          <span class="text-muted">•</span>',
        '          <span class="text-secondary d-flex align-items-center gap-1">',
        '            <i class="bi bi-shield-lock-fill text-primary"></i> 100% Private',
        '          </span>',
        '        </div>',
        '      </div>',
        '    </div>',
        '  </div>',
        '</div>'
      ].join('\n');

      var div = document.createElement('div');
      div.innerHTML = modalHtml;
      document.body.appendChild(div.firstElementChild);
    },

    bindEvents: function() {
      var self = this;

      // Smart chips & callback triggers
      document.addEventListener('click', function(e) {
        var callbackTrigger = e.target.closest('.js-callback-prompt-btn, .js-priority-ticket-btn, .js-trigger-callback-action');
        if (callbackTrigger) {
          e.preventDefault();
          self.handleSmartQuery('request_callback', '📞 Request Priority Callback');
          return;
        }

        var chip = e.target.closest('.fw-smart-chip-btn');
        if (chip) {
          var queryType = chip.getAttribute('data-query');
          self.handleSmartQuery(queryType, chip.textContent.trim());
          return;
        }

        // Open 24/7 help from any navbar button
        var navTrigger = e.target.closest('.js-open-247-help');
        if (navTrigger) {
          e.preventDefault();
          self.openModal();
        }
      });

      // Chat form submit
      var form = document.getElementById('fw-help-chat-form');
      if (form) {
        form.addEventListener('submit', function(e) {
          e.preventDefault();
          var input = document.getElementById('fw-help-chat-input');
          if (!input) return;
          var text = input.value.trim();
          if (!text) return;
          input.value = '';

          self.appendUserMessage(text);
          self.processUserQuery(text);
        });
      }
    },

    openModal: function() {
      var modalElem = document.getElementById('foodwalaHelpModal');
      if (!modalElem) return;

      if (window.bootstrap && window.bootstrap.Modal) {
        var bsModal = window.bootstrap.Modal.getInstance(modalElem) || new window.bootstrap.Modal(modalElem);
        bsModal.show();
      } else {
        modalElem.classList.add('show');
        modalElem.style.display = 'block';
      }
    },

    appendUserMessage: function(text) {
      var container = document.getElementById('fw-help-chat-messages');
      if (!container) return;

      var div = document.createElement('div');
      div.className = 'fw-chat-msg-user';
      div.textContent = text;
      container.appendChild(div);
      container.scrollTop = container.scrollHeight;
    },

    appendAgentMessage: function(htmlContent) {
      var container = document.getElementById('fw-help-chat-messages');
      if (!container) return;

      var div = document.createElement('div');
      div.className = 'fw-chat-msg-agent';
      div.innerHTML = htmlContent;
      container.appendChild(div);
      container.scrollTop = container.scrollHeight;
    },

    handleSmartQuery: function(type, userLabel) {
      var queryMap = {
        'whatsapp': 'How can I connect with FoodWala WhatsApp AI support assistance?',
        'track_order': 'Where is my order?',
        'refund': 'What is your order cancellation and refund policy?',
        'coupon': 'What discount coupons and offers are available?',
        'location': 'How do I change my delivery address or area?',
        'hygiene': 'What are your kitchen hygiene and food safety standards?',
        'request_callback': 'I would like to request a callback from a support supervisor.'
      };

      var queryText = queryMap[type] || userLabel;
      this.appendUserMessage(userLabel || queryText);
      this.processUserQuery(queryText);
    },

    
    getSmartLocalReply: function(rawQuery, userName, userPhone) {
      var q = (rawQuery || '').toLowerCase().trim();
      var waPhone = (window.FOODWALA_CONFIG && window.FOODWALA_CONFIG.WHATSAPP_SUPPORT_NUMBER) || '918500457005';
      var waUrl = 'https://wa.me/' + waPhone + '?text=' + encodeURIComponent('Hi FoodWala, I need help: ' + rawQuery);

      // 1. Coupon / Promo / Discount
      if (q.includes('coupon') || q.includes('discount') || q.includes('50%') || q.includes('offer') || q.includes('promo')) {
        return [
          '🎉 <strong>Special FoodWala Discount Active!</strong><br><br>',
          'Use promo code <span class="badge bg-warning text-dark fs-6 px-2 py-1 shadow-sm">FOODWALA50</span> at checkout to receive <strong>Flat 50% OFF</strong> (up to ₹150) on all orders above ₹199.<br><br>',
          '<div class="d-flex gap-2">',
          '  <button type="button" class="btn btn-sm btn-warning rounded-pill fw-bold text-dark shadow-sm" onclick="navigator.clipboard && navigator.clipboard.writeText(\'FOODWALA50\'); window.FoodWalaApp && FoodWalaApp.showToast(\'Coupon FOODWALA50 copied to clipboard!\', \'success\');">📋 Copy Code FOODWALA50</button>',
          '  <a href="./restaurants.html" class="btn btn-sm btn-outline-danger rounded-pill fw-bold text-decoration-none">Order Now</a>',
          '</div>'
        ].join('');
      }

      // 2. Order Tracking
      if (q.includes('order') || q.includes('where') || q.includes('track') || q.includes('status') || q.includes('deliver')) {
        return [
          '🍽️ <strong>Live Order Tracking</strong><br><br>',
          'Please enter your <strong>Order ID</strong> (e.g. <code>#FW1042</code>) or view active delivery status in your orders dashboard.<br><br>',
          '<div class="d-flex gap-2 flex-wrap">',
          '  <a href="./orders.html" class="btn btn-sm btn-danger rounded-pill fw-bold text-white text-decoration-none shadow-sm"><i class="bi bi-box-seam me-1"></i> View My Orders</a>',
          '  <a href="' + waUrl + '" target="_blank" class="btn btn-sm btn-success rounded-pill fw-bold text-white text-decoration-none shadow-sm"><i class="bi bi-whatsapp me-1"></i> Track via WhatsApp</a>',
          '</div>'
        ].join('');
      }

      // 3. Refund & Cancellation
      if (q.includes('cancel') || q.includes('refund') || q.includes('return') || q.includes('money')) {
        return [
          '⚡ <strong>FoodWala Cancellation & Refund Policy</strong><br><br>',
          '• <strong>Instant 60-Second Window</strong>: You can cancel free of charge within 60 seconds of placing an order.<br>',
          '• <strong>Kitchen Prep Cutoff</strong>: Once the restaurant begins cooking, cancellations are non-refundable to maintain food safety standards.<br>',
          '• <strong>Refund Timeline</strong>: Approved refunds are credited to original payment source within 3–5 business days.<br><br>',
          '<button type="button" class="btn btn-sm btn-danger rounded-pill fw-bold text-white js-trigger-callback-action shadow-sm">📞 Speak to Care Supervisor</button>'
        ].join('');
      }

      // 4. Change Address / Location
      if (q.includes('address') || q.includes('location') || q.includes('hub') || q.includes('area')) {
        return [
          '📍 <strong>Delivery Address Management</strong><br><br>',
          'You can switch delivery hubs directly using the location selector in the navigation bar, or manage saved home and work addresses.<br><br>',
          '<a href="./addresses.html" class="btn btn-sm btn-outline-danger rounded-pill fw-bold text-decoration-none shadow-sm"><i class="bi bi-geo-alt-fill me-1"></i> Manage Addresses</a>'
        ].join('');
      }

      // 5. Kitchen Hygiene
      if (q.includes('hygiene') || q.includes('safety') || q.includes('clean') || q.includes('quality') || q.includes('fssai')) {
        return [
          '⭐ <strong>FoodWala Hygiene Standards</strong><br><br>',
          '• 100% of partner kitchens are <strong>FSSAI certified</strong>.<br>',
          '• Daily temperature monitoring & sanitized preparation areas.<br>',
          '• All orders are dispatched in <strong>tamper-evident sealed packaging</strong>.'
        ].join('');
      }

      // 6. WhatsApp Support
      if (q.includes('whatsapp') || q.includes('phone') || q.includes('hotline') || q.includes('agent')) {
        return [
          '📲 <strong>Direct WhatsApp AI Assistance</strong><br><br>',
          'Our WhatsApp AI care desk is active 24/7! Send messages to check orders, browse menus, or connect with our support team.<br><br>',
          '<a href="' + waUrl + '" target="_blank" class="btn btn-sm btn-success rounded-pill fw-bold text-white text-decoration-none shadow-sm"><i class="bi bi-whatsapp me-1"></i> Open WhatsApp (+91 85004 57005)</a>'
        ].join('');
      }

      // 7. Request Callback
      if (q.includes('callback') || q.includes('call me') || q.includes('speak') || q.includes('supervisor')) {
        return [
          '📞 <strong>Priority Callback Request Logged!</strong><br><br>',
          'A FoodWala care supervisor will call you within <strong>5–10 minutes</strong> at your registered phone number.<br><br>',
          '<span class="badge bg-success bg-opacity-10 text-success border border-success px-3 py-1.5 rounded-pill fw-bold"><i class="bi bi-check-circle-fill me-1"></i> Priority Ticket Logged</span>'
        ].join('');
      }

      // Default Helpful Response
      return [
        '👋 <strong>FoodWala 24/7 Care Desk</strong><br><br>',
        'I am here to assist with order tracking, discounts, refunds, and menu inquiries. You can choose a quick action below or chat directly on WhatsApp:<br><br>',
        '<div class="d-flex gap-2 flex-wrap">',
        '  <button type="button" class="btn btn-sm btn-warning rounded-pill fw-bold text-dark shadow-sm" onclick="window.FoodWalaHelpAssistant && window.FoodWalaHelpAssistant.handleSmartQuery(\'coupon\', \'🏷️ 50% Off Coupon\')">🏷️ 50% Off Coupon</button>',
        '  <button type="button" class="btn btn-sm btn-outline-danger rounded-pill fw-bold" onclick="window.FoodWalaHelpAssistant && window.FoodWalaHelpAssistant.handleSmartQuery(\'track_order\', \'🛵 Where is my order?\')">🛵 Track Order</button>',
        '  <a href="' + waUrl + '" target="_blank" class="btn btn-sm btn-success rounded-pill fw-bold text-white text-decoration-none shadow-sm"><i class="bi bi-whatsapp me-1"></i> WhatsApp AI</a>',
        '</div>'
      ].join('');
    },

    retryLastQuery: function(text) {
      if (!text) return;
      this.processUserQuery(text);
    },

    processUserQuery: function(rawText) {
      var self = this;
      var text = (rawText || '').trim();
      if (!text) return;

      var typingIndicatorId = 'fw-help-typing-' + Date.now();
      var container = document.getElementById('fw-help-chat-messages');
      if (container) {
        var typingDiv = document.createElement('div');
        typingDiv.id = typingIndicatorId;
        typingDiv.className = 'fw-chat-msg-agent small text-muted py-2 fst-italic';
        typingDiv.innerHTML = '<span class="spinner-grow spinner-grow-sm text-danger me-1"></span> FoodWala AI is typing...';
        container.appendChild(typingDiv);
        container.scrollTop = container.scrollHeight;
      }

      function removeTyping() {
        var el = document.getElementById(typingIndicatorId);
        if (el && el.parentNode) el.parentNode.removeChild(el);
      }

      var apiBase = (window.FOODWALA_CONFIG && window.FOODWALA_CONFIG.API_BASE_URL) || 'http://localhost:5000';
      var chatEndpoint = apiBase.replace(/\/+$/, '') + '/api/support/chat';

      var userPhone = null;
      var userName = null;
      var token = '';
      try {
        var storedUser = JSON.parse(localStorage.getItem('foodwala_current_user') || '{}');
        userPhone = storedUser.phone || null;
        userName = storedUser.name || storedUser.username || null;
        token = localStorage.getItem('foodwala_auth_token') || '';
      } catch (e) {}

      var reqHeaders = { 'Content-Type': 'application/json' };
      if (token) {
        reqHeaders['Authorization'] = 'Bearer ' + token;
      }

      var controller = (typeof AbortController !== 'undefined') ? new AbortController() : null;
      var timeoutId = controller ? setTimeout(function() { controller.abort(); }, 15000) : null;

      fetch(chatEndpoint, {
        method: 'POST',
        headers: reqHeaders,
        body: JSON.stringify({ message: text, phone: userPhone, name: userName }),
        signal: controller ? controller.signal : undefined
      })
      .then(function(res) {
        if (timeoutId) clearTimeout(timeoutId);
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then(function(data) {
        removeTyping();
        if (data && data.reply) {
          var formatted = data.reply
            .replace(/\n\n/g, '<br><br>')
            .replace(/\n/g, '<br>')
            .replace(/\*(.*?)\*/g, '<strong>$1</strong>');
          self.appendAgentMessage(formatted);
        } else {
          throw new Error('Empty reply');
        }
      })
      .catch(function() {
        if (timeoutId) clearTimeout(timeoutId);
        removeTyping();
        // Intelligent client-side fallback (solves GitHub Pages & offline service drops)
        var fallback = self.getSmartLocalReply(text, userName, userPhone);
        if (fallback) {
          self.appendAgentMessage(fallback);
        } else {
          self.appendAgentMessage([
            '⚠️ <strong>Support Service Momentarily Unavailable</strong><br>',
            'Our care desk is momentarily unreachable. Please try again or request a callback.<br>',
            '<div class="d-flex gap-2 mt-2">',
            '  <button type="button" class="btn btn-sm btn-outline-danger rounded-pill fw-bold" onclick="window.FoodWalaHelpAssistant && window.FoodWalaHelpAssistant.retryLastQuery(\'' + text.replace(/'/g, "\\'") + '\')">🔄 Retry</button>',
            '  <button type="button" class="btn btn-sm btn-danger rounded-pill fw-bold text-white js-trigger-callback-action">📞 Request Callback</button>',
            '</div>'
          ].join(''));
        }
      });
    }
  };

  // Auto-initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      FoodWalaHelpAssistant.init();
    });
  } else {
    FoodWalaHelpAssistant.init();
  }

  window.FoodWalaHelpAssistant = FoodWalaHelpAssistant;
})(window, document);

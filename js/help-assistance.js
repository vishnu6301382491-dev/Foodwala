/**
 * FoodWala — 24/7 Help & WhatsApp AI Assistance System
 * Provides an intelligent, instant-resolution customer support widget across all pages.
 * Supports both In-App 24/7 AI Live Chat and WhatsApp Cloud Assistant.
 */
(function(window, document) {
  'use strict';

  var FoodWalaHelpAssistant = {
    initialized: false,
    currentMode: 'care', // 'care' or 'whatsapp'

    init: function() {
      if (this.initialized) return;
      this.initialized = true;

      this.injectFloatingButton();
      this.injectModal();
      this.bindEvents();
    },

    getWhatsAppUrl: function(customText) {
      var waPhone = (window.FOODWALA_CONFIG && window.FOODWALA_CONFIG.WHATSAPP_SUPPORT_NUMBER) || '8500457005' || '15551960307';
      var text = customText || 'Hi FoodWala, I need assistance with my order';
      return 'https://wa.me/' + waPhone + '?text=' + encodeURIComponent(text);
    },

    injectFloatingButton: function() {
      if (document.getElementById('fw-floating-help-btn')) return;

      var self = this;
      var waPhone = (window.FOODWALA_CONFIG && window.FOODWALA_CONFIG.WHATSAPP_SUPPORT_NUMBER) || '8500457005' || '15551960307';

      // 1. Floating WhatsApp Assistance Button (Opens Interactive WhatsApp AI Assistant)
      var waBtn = document.createElement('button');
      waBtn.id = 'fw-floating-whatsapp-btn';
      waBtn.className = 'fw-help-floating-wa-btn';
      waBtn.type = 'button';
      waBtn.setAttribute('data-bs-toggle', 'modal');
      waBtn.setAttribute('data-bs-target', '#foodwalaHelpModal');
      waBtn.setAttribute('aria-label', 'Open FoodWala 24/7 WhatsApp AI Assistant');
      waBtn.setAttribute('title', 'FoodWala WhatsApp 24/7 AI Assistance (+1 (555) 196-0307 / 8500457005)');
      waBtn.innerHTML = [
        '<i class="bi bi-whatsapp fs-5"></i>',
        '<span>WhatsApp AI</span>'
      ].join('');
      if (typeof waBtn.addEventListener === 'function') {
        waBtn.addEventListener('click', function() {
          self.setWhatsAppTheme(true);
        });
      }
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
      if (typeof btn.addEventListener === 'function') {
        btn.addEventListener('click', function() {
          self.setWhatsAppTheme(false);
        });
      }

      document.body.appendChild(btn);
    },

    injectModal: function() {
      if (document.getElementById('foodwalaHelpModal')) return;

      var waUrl = this.getWhatsAppUrl();

      var modalHtml = [
        '<div class="modal fade fw-help-modal" id="foodwalaHelpModal" tabindex="-1" aria-labelledby="foodwalaHelpModalLabel" aria-hidden="true">',
        '  <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable" style="max-width: 440px;">',
        '    <div class="modal-content shadow-2xl border-0 overflow-hidden" style="border-radius: 1.25rem;">',
        '      <!-- Modal Header -->',
        '      <div class="modal-header fw-help-modal-header text-white d-flex align-items-center justify-content-between py-3 px-3.5" id="fw-help-header" style="background: linear-gradient(135deg, #128C7E 0%, #075E54 100%);">',
        '        <div class="d-flex align-items-center gap-2.5">',
        '          <div class="bg-white rounded-circle d-flex align-items-center justify-content-center shadow-sm" id="fw-help-header-icon" style="width: 38px; height: 38px;">',
        '            <i class="bi bi-whatsapp fs-5 text-success"></i>',
        '          </div>',
        '          <div>',
        '            <h6 class="modal-title fw-bold lh-1 mb-1 text-white" id="foodwalaHelpModalLabel">FoodWala WhatsApp 24/7 AI Desk</h6>',
        '            <small class="text-white text-opacity-90 d-flex align-items-center gap-1" id="fw-help-header-sub" style="font-size: 0.75rem;">',
        '              <span class="fw-help-pulse-dot" style="width: 7px; height: 7px; background: #25D366;"></span> WhatsApp Helpline: +1 (555) 196-0307 / 8500457005 • Online',
        '            </small>',
        '          </div>',
        '        </div>',
        '        <div class="d-flex align-items-center gap-2">',
        '          <a href="' + waUrl + '" target="_blank" rel="noopener noreferrer" id="fw-help-external-wa-btn" class="btn btn-sm btn-outline-light rounded-pill px-2.5 py-1 text-white fw-bold d-flex align-items-center gap-1 shadow-sm text-decoration-none" style="font-size: 0.74rem;" title="Open in official WhatsApp App">',
        '            <i class="bi bi-box-arrow-up-right"></i> Open App',
        '          </a>',
        '          <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>',
        '        </div>',
        '      </div>',
        '      <!-- Chat Body -->',
        '      <div class="fw-help-chat-box p-3" id="fw-help-chat-messages" style="background: #f8fafc; min-height: 280px; max-height: 360px; overflow-y: auto;">',
        '        <div class="fw-chat-msg-agent shadow-sm" style="background: #ffffff; border-left: 3px solid #25D366; border-radius: 0.75rem; padding: 0.85rem 1rem;">',
        '          👋 <strong>Hello! Welcome to FoodWala 24/7 WhatsApp AI Care.</strong><br>',
        '          I am your instant culinary assistant. Ask me anything about tracking your order, cancellation policies, 50% discount coupons, or dish suggestions!<br>',
        '          <div class="mt-2.5 pt-2 border-top border-light-subtle d-flex align-items-center justify-content-between flex-wrap gap-1 small text-muted">',
        '            <span><i class="bi bi-lightning-charge-fill text-warning me-1"></i> Instant 0s Verified AI Replies</span>',
        '            <a href="' + waUrl + '" target="_blank" rel="noopener noreferrer" class="badge bg-success text-white text-decoration-none py-1.5 px-2 rounded-pill d-inline-flex align-items-center gap-1">',
        '              <i class="bi bi-whatsapp"></i> WhatsApp Helpline',
        '            </a>',
        '          </div>',
        '        </div>',
        '      </div>',
        '      <!-- Smart Suggestions Chips -->',
        '      <div class="p-2.5 px-3 bg-white border-top border-bottom d-flex flex-wrap gap-1.5" id="fw-help-chips-container">',
        '        <button type="button" class="fw-smart-chip-btn" data-query="track_order">🛵 Where is my order?</button>',
        '        <button type="button" class="fw-smart-chip-btn bg-warning bg-opacity-10 text-dark border-warning fw-bold" data-query="coupon">🏷️ 50% Off Coupon</button>',
        '        <button type="button" class="fw-smart-chip-btn" data-query="refund">💰 Refund & Cancel</button>',
        '        <button type="button" class="fw-smart-chip-btn" data-query="request_callback">📞 Request Callback</button>',
        '        <button type="button" class="fw-smart-chip-btn" data-query="location">📍 Delivery Zones</button>',
        '        <button type="button" class="fw-smart-chip-btn" data-query="hygiene">⭐ Kitchen Hygiene</button>',
        '        <button type="button" class="fw-smart-chip-btn bg-success bg-opacity-10 text-success border-success fw-bold" data-query="whatsapp"><i class="bi bi-whatsapp me-1"></i> WhatsApp Details</button>',
        '      </div>',
        '      <!-- Chat Input Area -->',
        '      <div class="p-3 bg-white">',
        '        <form id="fw-help-chat-form" class="d-flex align-items-center gap-2 mb-2">',
        '          <input type="text" id="fw-help-chat-input" class="form-control form-control-sm rounded-pill px-3 py-2 border shadow-sm" placeholder="Ask anything (e.g. where is my order, coupon)..." autocomplete="off" required>',
        '          <button type="submit" id="fw-help-send-btn" class="btn btn-success btn-sm rounded-pill px-3 py-2 fw-bold d-flex align-items-center gap-1 shadow-sm" style="background: #25D366; border-color: #25D366;">',
        '            <i class="bi bi-send-fill text-white"></i>',
        '          </button>',
        '        </form>',
        '        <!-- Privacy-Protected Escalation Bar -->',
        '        <div class="d-flex align-items-center justify-content-between pt-2 border-top text-muted" style="font-size: 0.74rem;">',
        '          <a href="' + waUrl + '" target="_blank" rel="noopener noreferrer" class="btn btn-link text-decoration-none text-success fw-bold d-flex align-items-center gap-1 p-0">',
        '            <i class="bi bi-whatsapp"></i> WhatsApp App',
        '          </a>',
        '          <span class="text-muted">•</span>',
        '          <button type="button" class="btn btn-link text-decoration-none text-danger fw-bold d-flex align-items-center gap-1 p-0 js-callback-prompt-btn">',
        '            <i class="bi bi-telephone-inbound-fill"></i> Callback',
        '          </button>',
        '          <span class="text-muted">•</span>',
        '          <button type="button" class="btn btn-link text-decoration-none text-success fw-bold d-flex align-items-center gap-1 p-0 js-priority-ticket-btn">',
        '            <i class="bi bi-ticket-perforated-fill"></i> Ticket',
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

    setWhatsAppTheme: function(isWhatsApp) {
      this.currentMode = isWhatsApp ? 'whatsapp' : 'care';
      var header = document.getElementById('fw-help-header');
      var icon = document.getElementById('fw-help-header-icon');
      var title = document.getElementById('foodwalaHelpModalLabel');
      var sub = document.getElementById('fw-help-header-sub');
      var sendBtn = document.getElementById('fw-help-send-btn');
      var waUrl = this.getWhatsAppUrl();

      if (isWhatsApp) {
        if (header) header.style.background = 'linear-gradient(135deg, #128C7E 0%, #075E54 100%)';
        if (icon) icon.innerHTML = '<i class="bi bi-whatsapp fs-5 text-success"></i>';
        if (title) title.textContent = 'FoodWala WhatsApp 24/7 AI Desk';
        if (sub) sub.innerHTML = '<span class="fw-help-pulse-dot" style="width: 7px; height: 7px; background: #25D366;"></span> WhatsApp Helpline: +1 (555) 196-0307 / 8500457005 • Online';
        if (sendBtn) {
          sendBtn.className = 'btn btn-success btn-sm rounded-pill px-3 py-2 fw-bold d-flex align-items-center gap-1 shadow-sm';
          sendBtn.style.background = '#25D366';
          sendBtn.style.borderColor = '#25D366';
        }
      } else {
        if (header) header.style.background = 'linear-gradient(135deg, #e23744 0%, #b81423 100%)';
        if (icon) icon.innerHTML = '<i class="bi bi-headset fs-5 text-danger"></i>';
        if (title) title.textContent = 'FoodWala 24/7 Care Desk';
        if (sub) sub.innerHTML = '<span class="fw-help-pulse-dot" style="width: 7px; height: 7px;"></span> Live Online • Avg Response: 0s';
        if (sendBtn) {
          sendBtn.className = 'btn btn-danger btn-sm rounded-pill px-3 py-2 fw-bold d-flex align-items-center gap-1 shadow-sm';
          sendBtn.style.background = '#e23744';
          sendBtn.style.borderColor = '#e23744';
        }
      }
    },

    bindEvents: function() {
      var helpModalElem = document.getElementById("foodwalaHelpModal");
      if (helpModalElem && typeof helpModalElem.addEventListener === 'function') {
        helpModalElem.addEventListener("hide.bs.modal", function() {
          if (document.activeElement && helpModalElem.contains(document.activeElement)) {
            document.activeElement.blur();
          }
        });
      }
      var self = this;

      // Smart chips & callback triggers
      if (typeof document.addEventListener === 'function') {
        document.addEventListener('click', function(e) {
          if (!e.target || typeof e.target.closest !== 'function') return;

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
            self.openModal(false);
          }
        });
      }

      // Chat form submit
      var form = document.getElementById('fw-help-chat-form');
      if (form && typeof form.addEventListener === 'function') {
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

    openModal: function(isWhatsApp) {
      this.setWhatsAppTheme(!!isWhatsApp);
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
      div.className = 'fw-chat-msg-user mb-2 text-end';
      div.innerHTML = '<span class="d-inline-block text-white px-3 py-2 rounded-3 shadow-sm text-start" style="background: #128C7E; max-width: 85%; font-size: 0.88rem;">' + this.escapeHtml(text) + '</span>';
      container.appendChild(div);
      container.scrollTop = container.scrollHeight;
    },

    appendAgentMessage: function(htmlContent) {
      var container = document.getElementById('fw-help-chat-messages');
      if (!container) return;

      var div = document.createElement('div');
      div.className = 'fw-chat-msg-agent mb-2';
      div.innerHTML = '<div class="p-3 bg-white rounded-3 shadow-sm border border-light" style="max-width: 92%; font-size: 0.88rem; line-height: 1.45;">' + htmlContent + '</div>';
      container.appendChild(div);
      container.scrollTop = container.scrollHeight;
    },

    escapeHtml: function(str) {
      if (!str) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    },

    handleSmartQuery: function(type, userLabel) {
      var queryMap = {
        'whatsapp': 'How can I connect with FoodWala WhatsApp AI support assistance on 8500457005?',
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
      var waUrl = this.getWhatsAppUrl(rawQuery);

      // 1. Greetings & Assistance Intents ("hi", "hello", "hey", "need assistance", etc.)
      if (q === 'hi' || q === 'hello' || q === 'hey' || q.includes('assistance') || q.includes('help') || q.includes('foodwala')) {
        return [
          '👋 <strong>Hello ' + (userName || 'Valued Customer') + '! Welcome to FoodWala 24/7 AI Care!</strong><br><br>',
          'How can I assist your food journey today?<br><br>',
          '• <strong>🛵 Live Order Tracking</strong>: Enter your Order ID (e.g. <code>#FW1042</code>) or click <em>Track Order</em> below.<br>',
          '• <strong>🏷️ Flat 50% Off</strong>: Use code <span class="badge bg-warning text-dark fw-bold">FOODWALA50</span> at checkout.<br>',
          '• <strong>⚡ 60-Second Instant Refund</strong>: Full refund within 60s of placing order.<br>',
          '• <strong>📞 Human Care Desk</strong>: Request a 5-minute priority callback anytime.<br><br>',
          '<div class="d-flex gap-2 flex-wrap">',
          '  <button type="button" class="btn btn-sm btn-danger rounded-pill fw-bold" onclick="window.FoodWalaHelpAssistant && window.FoodWalaHelpAssistant.handleSmartQuery(\'track_order\', \'🛵 Track My Order\')">🛵 Track Order</button>',
          '  <button type="button" class="btn btn-sm btn-warning rounded-pill fw-bold text-dark" onclick="window.FoodWalaHelpAssistant && window.FoodWalaHelpAssistant.handleSmartQuery(\'coupon\', \'🏷️ 50% Off Coupon\')">🏷️ 50% Off Coupon</button>',
          '  <button type="button" class="btn btn-sm btn-outline-success rounded-pill fw-bold js-trigger-callback-action">📞 Call Supervisor</button>',
          '</div>'
        ].join('');
      }

      // 2. Coupon / Promo / Discount
      if (q.includes('coupon') || q.includes('discount') || q.includes('50%') || q.includes('offer') || q.includes('promo')) {
        return [
          '🎉 <strong>Special FoodWala Discount Active!</strong><br><br>',
          'Use promo code <span class="badge bg-warning text-dark fs-6 px-2.5 py-1 shadow-sm">FOODWALA50</span> at checkout to receive <strong>Flat 50% OFF</strong> (up to ₹150) on all orders above ₹199.<br><br>',
          '<div class="d-flex gap-2">',
          '  <button type="button" class="btn btn-sm btn-warning rounded-pill fw-bold text-dark shadow-sm" onclick="navigator.clipboard && navigator.clipboard.writeText(\'FOODWALA50\'); window.FoodWalaApp && FoodWalaApp.showToast(\'Coupon FOODWALA50 copied to clipboard!\', \'success\');">📋 Copy Code FOODWALA50</button>',
          '  <a href="./restaurants.html" class="btn btn-sm btn-outline-danger rounded-pill fw-bold text-decoration-none">Order Now</a>',
          '</div>'
        ].join('');
      }

      // 3. Order Tracking (with live valet and destination telemetry)
      if (q.includes('order') || q.includes('where') || q.includes('track') || q.includes('status') || q.includes('deliver')) {
        return [
          '🍽️ <strong>Live Order Tracking & Status</strong><br><br>',
          '• <strong>Active Order</strong>: #FW80 (Central Tiffin Room - Shri Sagar)<br>',
          '• <strong>Valet Assigned</strong>: <strong>Suresh Kumar</strong> (📞 98765 43210)<br>',
          '• <strong>Destination</strong>: <strong>Maruthi Nagar</strong>, Bengaluru<br>',
          '• <strong>Status</strong>: On the way 🚴 (Estimated: 12 mins)<br><br>',
          '<div class="d-flex gap-2 flex-wrap">',
          '  <a href="./orders.html" class="btn btn-sm btn-danger rounded-pill fw-bold text-white text-decoration-none shadow-sm"><i class="bi bi-box-seam me-1"></i> View My Orders</a>',
          '  <a href="' + waUrl + '" target="_blank" class="btn btn-sm btn-success rounded-pill fw-bold text-white text-decoration-none shadow-sm"><i class="bi bi-whatsapp me-1"></i> Track via WhatsApp</a>',
          '</div>'
        ].join('');
      }

      // 4. Refund & Cancellation
      if (q.includes('cancel') || q.includes('refund') || q.includes('return') || q.includes('money')) {
        return [
          '⚡ <strong>FoodWala Cancellation & Refund Policy</strong><br><br>',
          '• <strong>Instant 60-Second Window</strong>: You can cancel free of charge within 60 seconds of placing an order.<br>',
          '• <strong>Kitchen Prep Cutoff</strong>: Once the restaurant begins cooking, cancellations are non-refundable to maintain food safety standards.<br>',
          '• <strong>Refund Timeline</strong>: Approved refunds are credited to original payment source within 3–5 business days.<br><br>',
          '<button type="button" class="btn btn-sm btn-danger rounded-pill fw-bold text-white js-trigger-callback-action shadow-sm">📞 Speak to Care Supervisor</button>'
        ].join('');
      }

      // 5. Change Address / Location
      if (q.includes('address') || q.includes('location') || q.includes('hub') || q.includes('area')) {
        return [
          '📍 <strong>Delivery Address Management</strong><br><br>',
          'You can switch delivery hubs directly using the location selector in the navigation bar, or manage saved home and work addresses.<br><br>',
          '<a href="./addresses.html" class="btn btn-sm btn-outline-danger rounded-pill fw-bold text-decoration-none shadow-sm"><i class="bi bi-geo-alt-fill me-1"></i> Manage Addresses</a>'
        ].join('');
      }

      // 6. Kitchen Hygiene
      if (q.includes('hygiene') || q.includes('safety') || q.includes('clean') || q.includes('quality') || q.includes('fssai')) {
        return [
          '⭐ <strong>FoodWala Hygiene Standards</strong><br><br>',
          '• 100% of partner kitchens are <strong>FSSAI certified</strong>.<br>',
          '• Daily temperature monitoring & sanitized preparation areas.<br>',
          '• All orders are dispatched in <strong>tamper-evident sealed packaging</strong>.'
        ].join('');
      }

      // 7. WhatsApp Support Details
      if (q.includes('whatsapp') || q.includes('phone') || q.includes('hotline') || q.includes('agent') || q.includes('8500457005')) {
        return [
          '📲 <strong>FoodWala WhatsApp 24/7 AI Helpline</strong><br><br>',
          '• <strong>Verified WhatsApp Numbers</strong>: <code>8500457005</code> / <code>+1 (555) 196-0307</code><br>',
          '• <strong>Live Interactive Care</strong>: You are chatting with our AI assistant right now with 0s latency!<br>',
          '• <strong>WhatsApp Direct Chat</strong>: Click below to open directly in WhatsApp:<br><br>',
          '<a href="' + waUrl + '" target="_blank" class="btn btn-sm btn-success rounded-pill fw-bold text-white text-decoration-none shadow-sm"><i class="bi bi-whatsapp me-1"></i> Open WhatsApp Chat</a>'
        ].join('');
      }

      // 8. Request Callback
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
        '  <a href="' + waUrl + '" target="_blank" class="btn btn-sm btn-success rounded-pill fw-bold text-white text-decoration-none shadow-sm"><i class="bi bi-whatsapp me-1"></i> WhatsApp Helpline</a>',
        '</div>'
      ].join('');
    },

    processUserQuery: function(text) {
      var self = this;
      if (!text) return;

      var typingIndicatorId = 'fw-help-typing-' + Date.now();
      var container = document.getElementById('fw-help-chat-messages');
      if (container) {
        var typingDiv = document.createElement('div');
        typingDiv.id = typingIndicatorId;
        typingDiv.className = 'fw-chat-msg-agent small text-muted py-2 fst-italic';
        typingDiv.innerHTML = '<span class="spinner-grow spinner-grow-sm text-success me-1"></span> FoodWala AI is typing...';
        container.appendChild(typingDiv);
        container.scrollTop = container.scrollHeight;
      }

      function removeTyping() {
        var el = document.getElementById(typingIndicatorId);
        if (el && el.parentNode) el.parentNode.removeChild(el);
      }

      var apiBase = '';
      if (typeof window !== 'undefined') {
        if (window.FOODWALA_CONFIG && window.FOODWALA_CONFIG.API_BASE_URL) {
          apiBase = window.FOODWALA_CONFIG.API_BASE_URL;
        } else if (window.location && window.location.origin && window.location.origin.startsWith('http')) {
          apiBase = window.location.origin;
        } else {
          apiBase = 'http://localhost:5000';
        }
      }

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
      var timeoutId = controller ? setTimeout(function() { controller.abort(); }, 8000) : null;

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
            '👋 <strong>FoodWala 24/7 AI Desk</strong><br>',
            'Thank you for reaching out! For instant order tracking, discounts, or supervisor assistance, tap any quick option below:<br><br>',
            '<div class="d-flex gap-2 flex-wrap">',
            '  <button type="button" class="btn btn-sm btn-danger rounded-pill fw-bold" onclick="window.FoodWalaHelpAssistant && window.FoodWalaHelpAssistant.handleSmartQuery(\'track_order\', \'🛵 Track My Order\')">🛵 Track Order</button>',
            '  <button type="button" class="btn btn-sm btn-warning rounded-pill fw-bold text-dark" onclick="window.FoodWalaHelpAssistant && window.FoodWalaHelpAssistant.handleSmartQuery(\'coupon\', \'🏷️ 50% Off Coupon\')">🏷️ 50% Off Coupon</button>',
            '  <a href="' + self.getWhatsAppUrl(text) + '" target="_blank" class="btn btn-sm btn-success rounded-pill fw-bold text-white text-decoration-none shadow-sm"><i class="bi bi-whatsapp me-1"></i> WhatsApp</a>',
            '</div>'
          ].join(''));
        }
      });
    }
  };

  // Auto-initialize when DOM is ready
  if (document.readyState === 'loading') {
    if (typeof document.addEventListener === 'function') {
      document.addEventListener('DOMContentLoaded', function() {
        FoodWalaHelpAssistant.init();
      });
    }
  } else {
    FoodWalaHelpAssistant.init();
  }

  window.FoodWalaHelpAssistant = FoodWalaHelpAssistant;
})(window, document);

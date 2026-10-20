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
        '        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>',
        '      </div>',
        '      <!-- Chat Body -->',
        '      <div class="fw-help-chat-box" id="fw-help-chat-messages">',
        '        <div class="fw-chat-msg-agent">',
        '          👋 <strong>Hello! Welcome to FoodWala 24/7 Support.</strong><br>',
        '          How can we help you today with your order, refund, delivery, or discount queries?',
        '        </div>',
        '      </div>',
        '      <!-- Smart Suggestions Chips -->',
        '      <div class="p-2.5 px-3 bg-white border-top border-bottom d-flex flex-wrap gap-1.5" id="fw-help-chips-container">',
        '        <button type="button" class="fw-smart-chip-btn" data-query="track_order">🛵 Where is my order?</button>',
        '        <button type="button" class="fw-smart-chip-btn" data-query="refund">💰 Refund & Cancel</button>',
        '        <button type="button" class="fw-smart-chip-btn" data-query="coupon">🏷️ 50% Off Coupon</button>',
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
        '        <!-- Direct Escalation Links -->',
        '        <div class="d-flex align-items-center justify-content-between pt-2 border-top text-muted" style="font-size: 0.75rem;">',
        '          <a href="tel:180036639252" class="text-decoration-none text-danger fw-bold d-flex align-items-center gap-1">',
        '            <i class="bi bi-telephone-fill"></i> 1800-FOOD-WALA (Toll-Free)',
        '          </a>',
        '          <a href="https://wa.me/919876543210?text=Hi%20FoodWala%20Support,%20I%20need%20help%20with%20my%20order" target="_blank" rel="noopener noreferrer" class="text-decoration-none text-success fw-bold d-flex align-items-center gap-1">',
        '            <i class="bi bi-whatsapp"></i> WhatsApp',
        '          </a>',
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

      // Smart chips click
      document.addEventListener('click', function(e) {
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
      this.appendUserMessage(userLabel);

      var self = this;
      setTimeout(function() {
        if (type === 'track_order') {
          self.appendAgentMessage([
            '🛵 <strong>Live Telemetry Dispatch</strong><br>',
            'Order <strong>#FW-84920</strong> is currently EN ROUTE!<br>',
            '• <strong>Valet:</strong> Suresh Kumar (Speed: 32 km/h)<br>',
            '• <strong>Destination:</strong> Maruthi Nagar, Bengaluru<br>',
            '• <strong>Estimated Arrival:</strong> 14 minutes<br>',
            '<a href="./orders.html" class="btn btn-danger btn-sm rounded-pill mt-2 fw-bold text-white"><i class="bi bi-geo-alt-fill me-1"></i> View Full Live GPS Map</a>'
          ].join(''));
        } else if (type === 'refund') {
          self.appendAgentMessage([
            '💰 <strong>100% Instant Refund Assurance</strong><br>',
            '• If you cancel within 60 seconds of placing, 100% is refunded immediately.<br>',
            '• In case of delivery delays exceeding 45 minutes, automatic wallet credits apply.<br>',
            '• Need a refund on an existing order? Click below to check your invoice or contact our billing desk directly.<br>',
            '<a href="./orders.html" class="btn btn-outline-danger btn-sm rounded-pill mt-2 fw-bold">View Recent Orders</a>'
          ].join(''));
        } else if (type === 'coupon') {
          self.appendAgentMessage([
            '🎉 <strong>Exclusive 50% Off Code!</strong><br>',
            'Use coupon code: <span class="badge bg-warning text-dark font-monospace fw-bold fs-6">FOODWALA50</span><br>',
            '• Valid across all 105+ Bengaluru partner restaurants.<br>',
            '• Flat 50% discount up to ₹150.<br>',
            '<button type="button" class="btn btn-warning btn-sm rounded-pill mt-2 fw-bold text-dark" onclick="navigator.clipboard && navigator.clipboard.writeText(\'FOODWALA50\'); alert(\'Coupon FOODWALA50 copied to clipboard!\');"><i class="bi bi-copy me-1"></i> Copy Code</button>'
          ].join(''));
        } else if (type === 'location') {
          self.appendAgentMessage([
            '📍 <strong>Delivery Micro-Zone Management</strong><br>',
            'Currently active hub: <strong>Maruthi Nagar, Bengaluru</strong> (14+ hubs available).<br>',
            'You can change or fine-tune your exact street address anytime.<br>',
            '<button type="button" class="btn btn-danger btn-sm rounded-pill mt-2 fw-bold text-white" data-bs-toggle="modal" data-bs-target="#locationModal"><i class="bi bi-geo-alt me-1"></i> Change Location Hub</button>'
          ].join(''));
        } else if (type === 'hygiene') {
          self.appendAgentMessage([
            '⭐ <strong>FSSAI 40-Point Hygiene Standard</strong><br>',
            '• 100% contactless thermal packaging with tamper-proof seals.<br>',
            '• Daily valet sanitization & kitchen staff temperature monitoring.<br>',
            '• Personally inspected Bengaluru heritage eateries and modern kitchens.'
          ].join(''));
        }
      }, 350);
    },

    processUserQuery: function(rawText) {
      var text = rawText.toLowerCase();
      var self = this;

      setTimeout(function() {
        if (text.indexOf('order') !== -1 || text.indexOf('track') !== -1 || text.indexOf('where') !== -1 || text.indexOf('suresh') !== -1 || text.indexOf('valet') !== -1) {
          self.appendAgentMessage([
            '🛵 <strong>Order Status Found:</strong><br>',
            'Your latest order is with valet <strong>Suresh Kumar</strong> heading towards <strong>Maruthi Nagar</strong> (ETA: 14 mins).<br>',
            '<a href="./orders.html" class="btn btn-danger btn-sm rounded-pill mt-2 fw-bold text-white">Track on GPS Map</a>'
          ].join(''));
        } else if (text.indexOf('cancel') !== -1 || text.indexOf('refund') !== -1 || text.indexOf('money') !== -1 || text.indexOf('return') !== -1) {
          self.appendAgentMessage([
            '💰 <strong>Refund & Cancellation Policy:</strong><br>',
            'FoodWala processes instant UPI/card refunds within 15 minutes of cancellation. You can manage cancellations directly from your <a href="./orders.html" class="fw-bold text-danger">Orders Page</a>.'
          ].join(''));
        } else if (text.indexOf('coupon') !== -1 || text.indexOf('offer') !== -1 || text.indexOf('discount') !== -1 || text.indexOf('promo') !== -1 || text.indexOf('50') !== -1) {
          self.appendAgentMessage([
            '🏷️ <strong>Best Available Offer:</strong><br>',
            'Apply coupon code <strong class="text-danger font-monospace">FOODWALA50</strong> during checkout for 50% Flat Off up to ₹150!'
          ].join(''));
        } else if (text.indexOf('location') !== -1 || text.indexOf('address') !== -1 || text.indexOf('maruthi') !== -1 || text.indexOf('koramangala') !== -1) {
          self.appendAgentMessage([
            '📍 <strong>Location Assistance:</strong><br>',
            'We deliver across all 14+ Bengaluru hubs including Maruthi Nagar, Koramangala, Indiranagar, and HSR Layout. Click below to switch your hub.<br>',
            '<button type="button" class="btn btn-outline-danger btn-sm rounded-pill mt-2 fw-bold" data-bs-toggle="modal" data-bs-target="#locationModal">Switch Location</button>'
          ].join(''));
        } else if (text.indexOf('contact') !== -1 || text.indexOf('call') !== -1 || text.indexOf('agent') !== -1 || text.indexOf('human') !== -1 || text.indexOf('phone') !== -1 || text.indexOf('number') !== -1) {
          self.appendAgentMessage([
            '📞 <strong>Direct Human Support:</strong><br>',
            'Call our 24/7 toll-free helpline: <a href="tel:180036639252" class="fw-bold text-danger">1800-FOOD-WALA</a>, or message our direct WhatsApp desk.<br>',
            '<a href="https://wa.me/919876543210?text=Hi%20FoodWala%20Support" target="_blank" class="btn btn-success btn-sm rounded-pill mt-2 fw-bold text-white"><i class="bi bi-whatsapp me-1"></i> Open WhatsApp Chat</a>'
          ].join(''));
        } else {
          self.appendAgentMessage([
            'I understand! Our 24/7 care desk is at your service.<br>',
            'You can choose from the quick action buttons above or call our helpline directly at <a href="tel:180036639252" class="fw-bold text-danger">1800-FOOD-WALA</a> for instant personal assistance.'
          ].join(''));
        }
      }, 400);
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

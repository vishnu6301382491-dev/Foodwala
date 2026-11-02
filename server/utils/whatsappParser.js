/**
 * server/utils/whatsappParser.js
 * 
 * Production-Grade Meta WhatsApp Cloud API Webhook Parser
 * Features:
 * - Safely extracts customer WhatsApp number, message ID, text, type, timestamp
 * - Normalizes phone numbers to standard 10-digit Indian mobile format
 * - Filters out status callbacks (sent, delivered, read) without dispatching AI
 * - Detects bot self-messages to prevent infinite response loops
 */

class WhatsAppParser {
  /**
   * Normalizes an incoming phone number into:
   * - phone10: clean 10-digit mobile number for MySQL database queries (e.g. "9895342253")
   * - waId: international format without '+' for WhatsApp API (e.g. "919895342253")
   */
  normalizePhoneNumber(rawPhone) {
    if (!rawPhone) return { phone10: '', waId: '' };
    const digits = String(rawPhone).replace(/\D/g, '');
    let phone10 = digits;
    let waId = digits;

    if (digits.length === 12 && digits.startsWith('91')) {
      phone10 = digits.substring(2);
      waId = digits;
    } else if (digits.length === 11 && digits.startsWith('0')) {
      phone10 = digits.substring(1);
      waId = '91' + phone10;
    } else if (digits.length === 10) {
      phone10 = digits;
      waId = '91' + digits;
    }

    return { phone10, waId };
  }

  /**
   * Masks a phone number for safe diagnostic logging (e.g. "+9198****53")
   */
  maskPhone(phone) {
    if (!phone) return 'unknown';
    const str = String(phone).replace(/\D/g, '');
    if (str.length <= 4) return '****';
    return '+' + str.substring(0, 4) + '****' + str.slice(-2);
  }

  /**
   * Extracts clean message events from raw Meta Webhook POST payload.
   * Returns array of parsed message objects.
   */
  parseInboundEvent(payload, businessHotline = null) {
    if (!payload || payload.object !== 'whatsapp_business_account') {
      return { isMessage: false, isStatus: false, messages: [], reason: 'NOT_WHATSAPP_ACCOUNT' };
    }

    const entries = payload.entry || [];
    const extractedMessages = [];
    const extractedStatuses = [];

    const knownHotlines = new Set();
    if (businessHotline) {
      if (Array.isArray(businessHotline)) {
        businessHotline.forEach(h => {
          if (h) knownHotlines.add(this.normalizePhoneNumber(h).phone10);
        });
      } else {
        knownHotlines.add(this.normalizePhoneNumber(businessHotline).phone10);
      }
    }
    // Only suppress the bot's own hotline numbers/IDs to prevent bot echo loops.
    // Suppresses messages originating from the business's own account.
    ['8500457005', '918500457005', process.env.WHATSAPP_BUSINESS_NUMBER, process.env.SUPPORT_PHONE_NUMBER].forEach(h => {
      if (h) {
        const norm = this.normalizePhoneNumber(h).phone10;
        if (norm) knownHotlines.add(norm);
        const digits = String(h).replace(/\D/g, '');
        if (digits) knownHotlines.add(digits);
      }
    });
    // Add raw Phone Number ID strictly as an exact ID string (never normalize/slice as 10-digit phone)
    if (process.env.WHATSAPP_PHONE_NUMBER_ID) {
      const idStr = String(process.env.WHATSAPP_PHONE_NUMBER_ID).trim();
      if (idStr) knownHotlines.add(idStr);
    }

    for (const entry of entries) {
      const changes = entry.changes || [];
      for (const change of changes) {
        const value = change.value;
        if (!value) continue;

        // Extract delivery status notifications (sent, delivered, read, failed)
        if (value.statuses && Array.isArray(value.statuses)) {
          for (const stat of value.statuses) {
            extractedStatuses.push({
              messageId: stat.id,
              status: stat.status,
              timestamp: stat.timestamp ? parseInt(stat.timestamp, 10) : Math.floor(Date.now() / 1000),
              recipientId: stat.recipient_id || null,
              errors: stat.errors || null
            });
          }
        }

        const messages = value.messages || [];
        const contacts = value.contacts || [];
        const contactMap = new Map();
        contacts.forEach(c => {
          if (c.wa_id) {
            contactMap.set(c.wa_id, c.profile?.name || 'Customer');
          }
        });

        for (const msg of messages) {
          const rawFrom = msg.from;
          const { phone10, waId } = this.normalizePhoneNumber(rawFrom);

          // Loop Prevention: Ignore messages from the business's own hotline or known numbers
          if (knownHotlines.has(phone10) || knownHotlines.has(waId) || knownHotlines.has(String(rawFrom))) {
            continue;
          }

          let messageText = '';
          const msgType = msg.type || 'text';

          if (msgType === 'text') {
            messageText = msg.text?.body || '';
          } else if (msgType === 'interactive') {
            messageText = msg.interactive?.button_reply?.title ||
                          msg.interactive?.list_reply?.title ||
                          msg.interactive?.button_reply?.id || '';
          } else if (msgType === 'button') {
            messageText = msg.button?.text || '';
          } else if (msgType === 'image') {
            messageText = msg.image?.caption ? `[Image: ${msg.image.caption}]` : '[Image received]';
          } else if (msgType === 'location') {
            const loc = msg.location;
            messageText = loc ? `[Location: ${loc.latitude}, ${loc.longitude}${loc.name ? ' - ' + loc.name : ''}${loc.address ? ', ' + loc.address : ''}]` : '[Location received]';
          } else if (msgType === 'document') {
            messageText = msg.document?.caption ? `[Document: ${msg.document.caption}]` : `[Document: ${msg.document?.filename || 'received'}]`;
          } else if (msgType === 'audio' || msgType === 'voice') {
            messageText = '[Audio message received]';
          } else if (msgType === 'video') {
            messageText = msg.video?.caption ? `[Video: ${msg.video.caption}]` : '[Video received]';
          } else if (msgType === 'contacts') {
            messageText = '[Contact card received]';
          } else {
            messageText = `[Received message of type: ${msgType}]`;
          }

          if (!messageText.trim()) {
            messageText = `[Received ${msgType}]`;
          }

          extractedMessages.push({
            messageId: msg.id,
            fromWaId: waId,
            fromPhone10: phone10,
            customerName: contactMap.get(rawFrom) || contactMap.get(waId) || 'FoodWala Customer',
            messageType: msgType,
            messageText: messageText.trim(),
            rawMessage: msg,
            timestamp: msg.timestamp ? parseInt(msg.timestamp, 10) : Math.floor(Date.now() / 1000),
            phoneNumberId: value.metadata?.phone_number_id || null
          });
        }
      }
    }

    return {
      isMessage: extractedMessages.length > 0,
      isStatus: extractedStatuses.length > 0 && extractedMessages.length === 0,
      statuses: extractedStatuses,
      messages: extractedMessages
    };
  }

  /**
   * Extracts explicit Order ID from message text (e.g. "FW12345", "Order #80", "#FW12345")
   * Disregards bare single digits 1-9 to allow menu choice navigation without false order lookups.
   */
  extractOrderId(text) {
    if (!text) return null;
    const clean = text.trim();
    // Matches #FW12345, FW12345, #80, order #80, order 80
    const fwMatch = clean.match(/(?:#?FW\s*#?|order\s*#?|#)(\d{1,8})\b/i);
    if (fwMatch && fwMatch[1]) {
      return parseInt(fwMatch[1], 10);
    }
    const numOnly = clean.match(/^\s*#?(\d{1,8})\s*$/);
    if (numOnly && numOnly[1]) {
      const val = parseInt(numOnly[1], 10);
      // Standalone numbers 1-9 without # or FW or 'order' are menu choices, NOT order IDs
      if (val >= 10 || clean.includes('#')) {
        return val;
      }
    }
    return null;
  }
}

module.exports = new WhatsAppParser();

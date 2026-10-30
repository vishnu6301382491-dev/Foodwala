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
    let hasStatusOnly = false;

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
    // NEVER suppress customer or admin numbers (e.g. 6301382491 or 8500457005).
    ['15551960307', process.env.SUPPORT_PHONE_NUMBER, process.env.WHATSAPP_PHONE_NUMBER_ID].forEach(h => {
      if (h) {
        const norm = this.normalizePhoneNumber(h).phone10;
        if (norm) knownHotlines.add(norm);
      }
    });

    for (const entry of entries) {
      const changes = entry.changes || [];
      for (const change of changes) {
        const value = change.value;
        if (!value) continue;

        // Check for status-only callbacks (sent, delivered, read)
        if (value.statuses && (!value.messages || value.messages.length === 0)) {
          hasStatusOnly = true;
          continue;
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
          if (knownHotlines.has(phone10) || knownHotlines.has(waId)) {
            continue;
          }

          let messageText = '';
          if (msg.type === 'text') {
            messageText = msg.text?.body || '';
          } else if (msg.type === 'interactive') {
            messageText = msg.interactive?.button_reply?.title ||
                          msg.interactive?.list_reply?.title ||
                          msg.interactive?.button_reply?.id || '';
          } else if (msg.type === 'button') {
            messageText = msg.button?.text || '';
          }

          extractedMessages.push({
            messageId: msg.id,
            fromWaId: waId,
            fromPhone10: phone10,
            customerName: contactMap.get(rawFrom) || contactMap.get(waId) || 'FoodWala Customer',
            messageType: msg.type,
            messageText: messageText.trim(),
            timestamp: msg.timestamp ? parseInt(msg.timestamp, 10) : Math.floor(Date.now() / 1000),
            phoneNumberId: value.metadata?.phone_number_id || null
          });
        }
      }
    }

    return {
      isMessage: extractedMessages.length > 0,
      isStatus: hasStatusOnly,
      messages: extractedMessages
    };
  }

  /**
   * Extracts explicit Order ID from message text (e.g. "FW12345", "Order #80", "#FW12345")
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
      return parseInt(numOnly[1], 10);
    }
    return null;
  }
}

module.exports = new WhatsAppParser();

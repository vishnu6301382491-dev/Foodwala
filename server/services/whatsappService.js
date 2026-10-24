/**
 * server/services/whatsappService.js
 * 
 * FoodWala Meta WhatsApp Cloud API Service
 * Handles:
 * - Meta Graph API messaging (Text, Interactive Buttons, Read Receipts)
 * - HMAC-SHA256 signature verification for inbound webhooks
 * - Phone number normalization for Indian WhatsApp numbers (+91)
 * - Safe fallback / mock dispatcher for local testing without active token
 * - Unified environment variable support (META_ACCESS_TOKEN / WHATSAPP_ACCESS_TOKEN)
 */

const crypto = require('crypto');
const https = require('https');
const db = require('../db');

class WhatsAppService {
  constructor() {
    this.sendWhatsAppMessage = this.sendWhatsAppMessage.bind(this);
    this.sendTextMessage = this.sendTextMessage.bind(this);
    this.normalizeSender = this.normalizeSender.bind(this);
    this.verifySignature = this.verifySignature.bind(this);
    this.checkHealth = this.checkHealth.bind(this);
    this.getOrCreateConversation = this.getOrCreateConversation.bind(this);
    this.logMessage = this.logMessage.bind(this);
    this._postToGraphApi = this._postToGraphApi.bind(this);
  }

  get phoneNumberId() {
    return process.env.WHATSAPP_PHONE_NUMBER_ID || '';
  }

  get accessToken() {
    return process.env.META_ACCESS_TOKEN || process.env.WHATSAPP_ACCESS_TOKEN || '';
  }

  get businessAccountId() {
    return process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || '';
  }

  get apiVersion() {
    return process.env.META_GRAPH_API_VERSION || process.env.WHATSAPP_API_VERSION || 'v21.0';
  }

  get appSecret() {
    return process.env.META_APP_SECRET || process.env.WHATSAPP_APP_SECRET || '';
  }

  get verifyToken() {
    return process.env.WHATSAPP_VERIFY_TOKEN || 'FW_wh_verify_9c8e2a71f6404bf4b7b5a3d1e8c6f204d7a9b61e';
  }

  get hotline() {
    return process.env.SUPPORT_PHONE_NUMBER || '15551960307';
  }

  /**
   * Normalizes incoming WhatsApp sender ID (e.g. "919895342253" or "+91 98953 42253")
   * Returns:
   *   waId: Full international format without '+' (e.g. "919895342253")
   *   phone10: Clean 10-digit mobile number for MySQL database queries (e.g. "9895342253")
   */
  normalizeSender(rawFrom) {
    if (!rawFrom) return { waId: '', phone10: '' };
    const digits = String(rawFrom).replace(/\D/g, '');
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

    return { waId, phone10 };
  }

  /**
   * Checks whether a phone number belongs to the business entity (loop prevention)
   */
  isBusinessNumber(phone) {
    if (!phone) return false;
    const digits = String(phone).replace(/\D/g, '');
    const phone10 = digits.length >= 10 ? digits.slice(-10) : digits;
    const known = ['15551960307', '8500457005', '918500457005', '6301382491'];
    if (process.env.SUPPORT_PHONE_NUMBER) known.push(String(process.env.SUPPORT_PHONE_NUMBER).replace(/\D/g, ''));
    if (process.env.ADMIN_PHONE) known.push(String(process.env.ADMIN_PHONE).replace(/\D/g, ''));
    if (process.env.WHATSAPP_PHONE_NUMBER_ID) known.push(String(process.env.WHATSAPP_PHONE_NUMBER_ID));
    return known.some(k => k && (k === digits || k.slice(-10) === phone10));
  }

  /**
   * Masks a phone number for safe logging (e.g. "+9198****53")
   */
  maskPhone(phone) {
    if (!phone) return 'unknown';
    const str = String(phone).replace(/\D/g, '');
    if (str.length <= 4) return '****';
    return '+' + str.substring(0, 4) + '****' + str.slice(-2);
  }

  /**
   * Verifies Meta X-Hub-Signature-256 header using SHA256 HMAC of exact raw body
   */
  verifySignature(req) {
    const secret = this.appSecret;
    if (!secret) {
      // If APP_SECRET is not configured in local environment, allow for testing with warning
      return true;
    }

    const signature = req.headers['x-hub-signature-256'] || req.headers['X-Hub-Signature-256'];
    if (!signature) {
      console.warn('[WhatsApp Service] Warning: Missing X-Hub-Signature-256 header.');
      return false;
    }

    const rawBody = req.rawBody || (typeof req.body === 'string' ? req.body : JSON.stringify(req.body));
    const expectedSignature = 'sha256=' + crypto.createHmac('sha256', secret).update(rawBody).digest('hex');

    try {
      const sigBuffer = Buffer.from(signature, 'utf8');
      const expectedBuffer = Buffer.from(expectedSignature, 'utf8');
      if (sigBuffer.length !== expectedBuffer.length) {
        return false;
      }
      return crypto.timingSafeEqual(sigBuffer, expectedBuffer);
    } catch (e) {
      return false;
    }
  }

  /**
   * Dispatches outbound HTTP request to Meta Graph API
   */
  async _postToGraphApi(endpoint, payload, customPhoneId = null) {
    const phoneId = customPhoneId || this.phoneNumberId;
    const token = this.accessToken;

    if (!phoneId || !token) {
      if (payload.status === 'read') {
        return { mock: true, success: true };
      }
      const masked = this.maskPhone(payload.to);
      console.log(`📱 [WhatsApp Local Mock Delivery] (Meta credentials unset; running in verified local simulation):`);
      console.log(`   Recipient: ${masked}`);
      console.log(`   Payload type: ${payload.type || 'text'}, chars: ${(payload.text?.body || '').length}`);
      return {
        mock: true,
        success: true,
        messages: [{ id: 'wamid.MOCK_' + Date.now() + '_' + Math.random().toString(36).substring(7) }]
      };
    }

    const url = `https://graph.facebook.com/${this.apiVersion}/${phoneId}/${endpoint}`;
    const bodyStr = JSON.stringify(payload);

    return new Promise((resolve) => {
      const options = {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(bodyStr)
        },
        timeout: 10000
      };

      const req = https.request(url, options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            if (res.statusCode >= 200 && res.statusCode < 300) {
              console.log(`[WhatsApp] Outbound message delivered successfully to Meta (HTTP ${res.statusCode})`);
              resolve({ success: true, live: true, ...parsed });
            } else {
              const errObj = parsed.error || {};
              const errCode = errObj.code;
              const errSubcode = errObj.error_subcode;
              const errMsg = errObj.message || 'Unknown Meta error';

              let diagnostic = `Meta Graph API error ${errCode} (subcode ${errSubcode}): ${errMsg}`;
              if (res.statusCode === 429 || errCode === 4 || errCode === 80007) {
                diagnostic = 'Meta Graph API rate limit reached. Please retry after throttle backoff.';
              } else if (errCode === 190) {
                diagnostic = 'Meta Access Token is expired or invalid. Please refresh WHATSAPP_ACCESS_TOKEN / META_ACCESS_TOKEN.';
              } else if (errCode === 200) {
                diagnostic = 'Meta API access blocked (Error 200). Meta temporary token expired or recipient phone not added to developer sandbox whitelist (WhatsApp > API Setup > To: Manage phone number list).';
              } else if (errCode === 131030) {
                diagnostic = 'Meta sandbox restriction (Error 131030): Recipient phone number is not on the allowed list. Go to Meta Dashboard > WhatsApp > API Setup > To: Manage phone number list to add and OTP-verify this number.';
              } else if (errCode === 131026) {
                diagnostic = 'Message undeliverable: Recipient outside 24-hour customer service window.';
              } else if (errCode === 100) {
                diagnostic = 'Invalid request parameters or WHATSAPP_PHONE_NUMBER_ID mismatch.';
              }

              console.error(`[WhatsApp ERROR] Meta Graph API returned HTTP ${res.statusCode}: ${diagnostic}`);
              resolve({ success: false, live: true, error: diagnostic, metaCode: errCode, statusCode: res.statusCode });
            }
          } catch (e) {
            console.error(`[WhatsApp ERROR] Non-JSON response from Meta API (HTTP ${res.statusCode})`);
            resolve({ success: false, live: true, error: 'Non-JSON response from Meta API', statusCode: res.statusCode });
          }
        });
      });

      req.on('timeout', () => {
        req.destroy();
        console.error('[WhatsApp ERROR] Request to Meta Graph API timed out (10s)');
        resolve({ success: false, live: true, error: 'Meta Graph API request timed out' });
      });

      req.on('error', (err) => {
        console.error('[WhatsApp ERROR] Network error reaching Meta Graph API:', err.message);
        resolve({ success: false, live: true, error: err.message });
      });

      req.write(bodyStr);
      req.end();
    });
  }

  /**
   * Primary Reusable Function: sendWhatsAppMessage(to, message, customPhoneId)
   * Sends text message to customer via Meta WhatsApp Cloud API
   */
  async sendWhatsAppMessage(to, message, customPhoneId = null) {
    const { waId } = this.normalizeSender(to);
    const payload = {
      messaging_product: 'whatsapp',
      to: waId,
      type: 'text',
      text: {
        body: String(message || '').trim()
      }
    };
    return await this._postToGraphApi('messages', payload, customPhoneId);
  }

  /**
   * Backward-compatible alias for sendWhatsAppMessage
   */
  async sendTextMessage(toWaId, textBody) {
    return await this.sendWhatsAppMessage(toWaId, textBody);
  }

  /**
   * Sends interactive action buttons to WhatsApp customer
   */
  async sendInteractiveButtons(toWaId, bodyText, buttons = []) {
    const { waId } = this.normalizeSender(toWaId);
    const validButtons = buttons.slice(0, 3).map((btn, idx) => ({
      type: 'reply',
      reply: {
        id: btn.id || `btn_${idx}`,
        title: btn.title.substring(0, 20)
      }
    }));

    const payload = {
      messaging_product: 'whatsapp',
      to: waId,
      type: 'interactive',
      interactive: {
        type: 'button',
        body: { text: bodyText },
        action: { buttons: validButtons }
      }
    };

    return await this._postToGraphApi('messages', payload);
  }

  /**
   * Marks incoming customer message as read on WhatsApp
   */
  async markMessageAsRead(messageId) {
    if (!messageId) return;
    const payload = {
      messaging_product: 'whatsapp',
      status: 'read',
      message_id: messageId
    };
    return await this._postToGraphApi('messages', payload);
  }

  /**
   * Finds or creates a conversation session in MySQL
   */
  async getOrCreateConversation(waId, phone10, profileName = null) {
    try {
      const safePhone = phone10 || (waId && waId.startsWith('web_') ? 'WEB_GUEST' : 'GUEST');
      const [existing] = await db.query(
        'SELECT conversation_id, wa_id, phone_number, user_id, customer_name, session_status FROM whatsapp_conversations WHERE wa_id = ? OR (phone_number = ? AND ? != "GUEST" AND ? != "WEB_GUEST") LIMIT 1',
        [waId, safePhone, safePhone, safePhone]
      );

      if (existing && existing.length > 0) {
        const conv = existing[0];
        if (!conv.user_id && phone10) {
          const [users] = await db.query('SELECT user_id, username FROM user WHERE phone = ? LIMIT 1', [phone10]);
          if (users && users.length > 0) {
            await db.query(
              'UPDATE whatsapp_conversations SET user_id = ?, customer_name = COALESCE(customer_name, ?) WHERE conversation_id = ?',
              [users[0].user_id, users[0].username, conv.conversation_id]
            );
            conv.user_id = users[0].user_id;
            conv.customer_name = users[0].username;
          }
        }
        return conv;
      }

      let userId = null;
      let userName = profileName || 'Customer';
      if (phone10) {
        const [users] = await db.query('SELECT user_id, username FROM user WHERE phone = ? LIMIT 1', [phone10]);
        if (users && users.length > 0) {
          userId = users[0].user_id;
          userName = users[0].username;
        }
      }

      const [res] = await db.query(
        'INSERT INTO whatsapp_conversations (wa_id, phone_number, user_id, customer_name, session_status) VALUES (?, ?, ?, ?, ?)',
        [waId, safePhone, userId, userName, 'ACTIVE']
      );

      return {
        conversation_id: res.insertId,
        wa_id: waId,
        phone_number: safePhone,
        user_id: userId,
        customer_name: userName,
        session_status: 'ACTIVE'
      };
    } catch (err) {
      console.error('[WhatsApp Service] getOrCreateConversation error:', err.message);
      return {
        conversation_id: 1,
        wa_id: waId,
        phone_number: phone10 || 'GUEST',
        user_id: null,
        customer_name: profileName || 'Customer',
        session_status: 'ACTIVE'
      };
    }
  }

  /**
   * Logs a message into MySQL whatsapp_messages
   */
  async logMessage({ conversationId, waMessageId, direction, senderType, messageText, messageType = 'text', rawPayload = null, deliveryStatus = 'sent' }) {
    try {
      const [res] = await db.query(
        'INSERT INTO whatsapp_messages (conversation_id, wa_message_id, direction, sender_type, message_text, message_type, raw_payload, delivery_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [conversationId, waMessageId || null, direction, senderType, messageText, messageType, rawPayload ? JSON.stringify(rawPayload) : null, deliveryStatus]
      );
      return res.insertId;
    } catch (err) {
      console.error('[WhatsApp Service] logMessage error:', err.message);
      return null;
    }
  }

  /**
   * Health Check: Diagnostics Meta WhatsApp Cloud API credentials
   */
  async checkHealth() {
    const phoneId = this.phoneNumberId;
    const token = this.accessToken;

    if (!phoneId || !token) {
      return {
        configured: false,
        tokenValid: false,
        message: 'WHATSAPP_PHONE_NUMBER_ID or META_ACCESS_TOKEN is not configured in environment variables.'
      };
    }

    return new Promise((resolve) => {
      const url = `https://graph.facebook.com/${this.apiVersion}/${phoneId}?access_token=${token}`;
      https.get(url, { timeout: 6000 }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            if (res.statusCode >= 200 && res.statusCode < 300) {
              resolve({
                configured: true,
                tokenValid: true,
                phoneNumberId: phoneId,
                displayPhoneNumber: parsed.display_phone_number || null,
                verifiedName: parsed.verified_name || null
              });
            } else {
              const code = parsed.error?.code;
              const subcode = parsed.error?.error_subcode;
              const msg = parsed.error?.message || 'Meta API rejected token';
              resolve({
                configured: true,
                tokenValid: false,
                errorCode: code,
                errorSubcode: subcode,
                message: msg
              });
            }
          } catch (e) {
            resolve({ configured: true, tokenValid: false, message: 'Invalid response from Meta' });
          }
        });
      }).on('error', (err) => {
        resolve({ configured: true, tokenValid: false, message: err.message });
      });
    });
  }
}

module.exports = new WhatsAppService();

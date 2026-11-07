/**
 * server/whatsapp/sender.js
 * Meta WhatsApp Cloud API Client with Keep-Alive, Retry & Safety Limits
 */

const https = require('https');
const crypto = require('crypto');
const config = require('./config');

// HTTP Keep-Alive Agent for Meta Graph API calls (<1.5s target)
const keepAliveAgent = new https.Agent({
  keepAlive: true,
  maxSockets: 50,
  maxFreeSockets: 10,
  timeout: 4000
});

class WhatsAppSender {
  constructor() {
    this.agent = keepAliveAgent;
    this.tokenFailureAlerted = false;
  }

  maskPhone(phone) {
    if (!phone) return 'unknown';
    const str = String(phone).replace(/\D/g, '');
    if (str.length <= 4) return '****';
    return '+' + str.substring(0, 4) + '****' + str.slice(-2);
  }

  normalizeToWaId(raw) {
    if (!raw) return '';
    const digits = String(raw).replace(/\D/g, '');
    if (digits.length === 10) return '91' + digits;
    if (digits.length === 11 && digits.startsWith('0')) return '91' + digits.substring(1);
    return digits;
  }

  /**
   * Safe string truncator for Meta character limitations
   */
  truncate(str, maxLen) {
    if (!str) return '';
    const s = String(str).trim();
    if (s.length <= maxLen) return s;
    return s.substring(0, maxLen - 1) + '…';
  }

  /**
   * Internal HTTP POST to Meta Graph API with keep-alive, 3s timeout, and 2 retries on 5xx/429
   */
  async _post(endpoint, payload, attempt = 1) {
    const token = config.accessToken;
    const phoneId = config.phoneNumberId;

    if (!token || !phoneId) {
      // Mock mode for local testing without Meta credentials
      const masked = this.maskPhone(payload.to);
      const isRead = payload.status === 'read';
      if (!isRead) {
        console.log(`📱 [WhatsApp Mock] (${payload.type || 'text'}) -> ${masked}`);
      }
      return {
        mock: true,
        success: true,
        messages: [{ id: 'wamid.MOCK_' + Date.now() + '_' + Math.random().toString(36).substring(7) }]
      };
    }

    const url = `https://graph.facebook.com/${config.graphApiVersion}/${phoneId}/${endpoint}`;
    const bodyStr = JSON.stringify(payload);

    return new Promise((resolve) => {
      const options = {
        method: 'POST',
        agent: this.agent,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(bodyStr)
        },
        timeout: 3500
      };

      const req = https.request(url, options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', async () => {
          let parsed = {};
          try {
            parsed = JSON.parse(data);
          } catch (e) {
            parsed = { error: { message: data } };
          }

          if (res.statusCode >= 200 && res.statusCode < 300) {
            return resolve({ success: true, ...parsed });
          }

          const errCode = parsed.error?.code;
          const errMsg = parsed.error?.message || 'Meta API error';

          // Error 190: Invalid/expired token alert
          if (errCode === 190) {
            if (!this.tokenFailureAlerted) {
              console.error(`🚨 [WHATSAPP CRITICAL ALERT] WhatsApp Access Token is expired or invalid (Meta code 190). Please configure a permanent System User token.`);
              this.tokenFailureAlerted = true;
            }
            return resolve({ success: false, error: 'Token expired', metaCode: 190 });
          }

          // Error 131047 / 131056: 24h window or rate issue
          if (errCode === 131047 || errCode === 131056) {
            console.warn(`⚠️ [WhatsApp Window Alert] User outside 24h customer window or rate issue: ${errMsg}`);
            return resolve({ success: false, error: errMsg, metaCode: errCode });
          }

          // Retry logic on HTTP 429 or 5xx (up to 2 retries)
          if ((res.statusCode === 429 || res.statusCode >= 500) && attempt <= 2) {
            const backoffMs = attempt * 800;
            console.warn(`⏳ [WhatsApp Sender] Meta ${res.statusCode} encountered. Retrying in ${backoffMs}ms (attempt ${attempt}/2)...`);
            await new Promise(r => setTimeout(r, backoffMs));
            const retryRes = await this._post(endpoint, payload, attempt + 1);
            return resolve(retryRes);
          }

          console.warn(`❌ [WhatsApp Sender] Meta API Error ${res.statusCode} (code: ${errCode}): ${errMsg}`);
          resolve({ success: false, error: errMsg, metaCode: errCode, statusCode: res.statusCode });
        });
      });

      req.on('timeout', async () => {
        req.destroy();
        if (attempt <= 2) {
          console.warn(`⏳ [WhatsApp Sender] Timeout on attempt ${attempt}. Retrying...`);
          await new Promise(r => setTimeout(r, 600));
          const retryRes = await this._post(endpoint, payload, attempt + 1);
          return resolve(retryRes);
        }
        resolve({ success: false, error: 'Meta request timeout' });
      });

      req.on('error', (err) => {
        resolve({ success: false, error: err.message });
      });

      req.write(bodyStr);
      req.end();
    });
  }

  /**
   * Mark message as read
   */
  async markAsRead(messageId) {
    if (!messageId) return { success: true };
    // Skip synthetic test message IDs to prevent Meta Error 131009
    if (String(messageId).includes('TEST') || String(messageId).includes('MOCK') || String(messageId).includes('SIG_')) {
      return { success: true };
    }
    return this._post('messages', {
      messaging_product: 'whatsapp',
      status: 'read',
      message_id: messageId
    });
  }

  /**
   * Send typing indicator (Safe no-op for Meta Cloud API)
   */
  async sendTypingIndicator(toWaId) {
    return { success: true };
  }

  /**
   * Send Plain Text Message
   */
  async sendTextMessage(to, text) {
    const waId = this.normalizeToWaId(to);
    const body = String(text || '').trim();
    return this._post('messages', {
      messaging_product: 'whatsapp',
      to: waId,
      type: 'text',
      text: { body }
    });
  }

  /**
   * Send Quick Reply Interactive Buttons (Max 3 buttons, text <= 20 chars)
   */
  async sendInteractiveButtons(to, bodyText, buttons = []) {
    const waId = this.normalizeToWaId(to);
    const safeButtons = buttons.slice(0, 3).map((btn, idx) => ({
      type: 'reply',
      reply: {
        id: btn.id || `btn_${idx}`,
        title: this.truncate(btn.title, 20)
      }
    }));

    if (safeButtons.length === 0) {
      return this.sendTextMessage(to, bodyText);
    }

    return this._post('messages', {
      messaging_product: 'whatsapp',
      to: waId,
      type: 'interactive',
      interactive: {
        type: 'button',
        body: { text: bodyText },
        action: { buttons: safeButtons }
      }
    });
  }

  /**
   * Send Interactive List Message
   * Title <= 24 chars, description <= 72 chars, max 10 rows total, button text <= 20 chars
   */
  async sendInteractiveList(to, headerText, bodyText, buttonText, sections = []) {
    const waId = this.normalizeToWaId(to);

    // Format & truncate sections
    let totalRows = 0;
    const sanitizedSections = [];

    for (const sec of sections) {
      if (totalRows >= 10) break;
      const rows = [];
      for (const row of (sec.rows || [])) {
        if (totalRows >= 10) break;
        rows.push({
          id: row.id,
          title: this.truncate(row.title, 24),
          description: row.description ? this.truncate(row.description, 72) : undefined
        });
        totalRows++;
      }
      if (rows.length > 0) {
        sanitizedSections.push({
          title: this.truncate(sec.title || 'Options', 24),
          rows: rows
        });
      }
    }

    if (sanitizedSections.length === 0) {
      return this.sendTextMessage(to, bodyText);
    }

    const payload = {
      messaging_product: 'whatsapp',
      to: waId,
      type: 'interactive',
      interactive: {
        type: 'list',
        header: headerText ? { type: 'text', text: this.truncate(headerText, 60) } : undefined,
        body: { text: bodyText },
        footer: { text: 'FoodWala' },
        action: {
          button: this.truncate(buttonText || 'View Options', 20),
          sections: sanitizedSections
        }
      }
    };

    return this._post('messages', payload);
  }

  /**
   * Send WhatsApp Approved Template Message (Outside 24h Customer Service Window)
   */
  async sendTemplateMessage(to, templateName, languageCode = 'en', components = []) {
    const waId = this.normalizeToWaId(to);
    return this._post('messages', {
      messaging_product: 'whatsapp',
      to: waId,
      type: 'template',
      template: {
        name: templateName,
        language: { code: languageCode },
        components: components
      }
    });
  }

  /**
   * Startup Health Check (GET https://graph.facebook.com/{version}/{PHONE_NUMBER_ID})
   */
  async verifyHealth() {
    const token = config.accessToken;
    const phoneId = config.phoneNumberId;

    if (!token || !phoneId) {
      return { configured: false, tokenValid: false, message: 'WHATSAPP_ACCESS_TOKEN or WHATSAPP_PHONE_NUMBER_ID unset.' };
    }

    return new Promise((resolve) => {
      const url = `https://graph.facebook.com/${config.graphApiVersion}/${phoneId}?access_token=${token}`;
      https.get(url, { agent: this.agent, timeout: 4000 }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            if (res.statusCode >= 200 && res.statusCode < 300) {
              resolve({
                configured: true,
                tokenValid: true,
                phoneId: phoneId,
                displayPhoneNumber: parsed.display_phone_number,
                verifiedName: parsed.verified_name
              });
            } else {
              const code = parsed.error?.code;
              resolve({
                configured: true,
                tokenValid: false,
                errorCode: code,
                message: parsed.error?.message
              });
            }
          } catch (e) {
            resolve({ configured: true, tokenValid: false, message: 'Invalid Meta response' });
          }
        });
      }).on('error', (err) => {
        resolve({ configured: true, tokenValid: false, message: err.message });
      });
    });
  }
}

module.exports = new WhatsAppSender();

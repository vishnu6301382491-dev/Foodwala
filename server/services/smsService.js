/**
 * FoodWala SMS Service
 * Modular SMS provider isolation supporting Twilio, MSG91, 2Factor, and Console.
 * Credentials loaded securely from environment variables.
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Auto-load sms.properties if present in project root or server folder
function loadSmsProperties() {
  const possiblePaths = [
    path.join(__dirname, '..', '..', 'sms.properties'),
    path.join(__dirname, '..', 'sms.properties'),
    path.join(process.cwd(), 'sms.properties')
  ];
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      try {
        const content = fs.readFileSync(p, 'utf8');
        content.split('\n').forEach(line => {
          const trimmed = line.trim();
          if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
            const idx = trimmed.indexOf('=');
            const key = trimmed.slice(0, idx).trim();
            const val = trimmed.slice(idx + 1).trim();
            if (!process.env[key] && val) {
              process.env[key] = val;
            }
          }
        });
        break;
      } catch (e) {}
    }
  }
}
loadSmsProperties();

class SMSService {
  constructor() {
    this.provider = (process.env.SMS_PROVIDER || (process.env.FAST2SMS_API_KEY ? 'fast2sms' : 'console')).toLowerCase();
    this.isDevMode = process.env.OTP_DEV_MODE === 'true' || process.env.NODE_ENV !== 'production';
  }

  /**
   * Checks whether a real SMS provider is properly configured with credentials
   * @returns {boolean}
   */
  isConfigured() {
    if (this.isDevMode) return true;
    if (this.provider === 'fast2sms' || Boolean(process.env.FAST2SMS_API_KEY)) {
      return Boolean(process.env.FAST2SMS_API_KEY);
    }
    if (this.provider === 'twilio') {
      return Boolean(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER);
    }
    if (this.provider === 'msg91') {
      return Boolean(process.env.MSG91_AUTH_KEY);
    }
    if (this.provider === '2factor') {
      return Boolean(process.env.TWO_FACTOR_API_KEY);
    }
    return false;
  }

  /**
   * Send OTP via configured SMS Provider
   * @param {string} phone - Normalized E.164 phone (+919876543210)
   * @param {string} otp - 6-digit OTP
   * @returns {Promise<{ success: boolean, messageId?: string, provider: string }>}
   */
  async sendOtp(phone, otp) {
    // If Dev Mode is enabled, log to server console only and avoid sending real paid SMS
    if (this.isDevMode) {
      console.log('\n==================================================');
      console.log('[FoodWala SMS Service - DEV/SANDBOX MODE]');
      console.log('Recipient: ' + phone);
      console.log('OTP Code : ' + otp);
      console.log('Message  : Your FoodWala verification code is: ' + otp + '. Valid for 5 minutes.');
      console.log('==================================================\n');

      // If user has Fast2SMS configured, attempt real delivery in background
      if (process.env.FAST2SMS_API_KEY) {
        try {
          await this.sendViaFast2SMS(phone, otp);
          console.log('[Fast2SMS] Real SMS dispatched to recipient phone: ' + phone);
        } catch (fastErr) {
          console.warn('[Fast2SMS Warning]:', fastErr.message);
          console.warn('Note: To receive carrier SMS on mobile, verify website or recharge on fast2sms.com. In testing, code ' + otp + ' is active.');
        }
      }

      return {
        success: true,
        messageId: 'dev_msg_' + Date.now(),
        provider: 'console_dev',
        otp: otp
      };
    }

    if (!this.isConfigured()) {
      throw new Error('SMS gateway is not configured on this server.');
    }

    // Production SMS Delivery
    const prov = (process.env.FAST2SMS_API_KEY && this.provider !== 'twilio') ? 'fast2sms' : this.provider;
    switch (prov) {
      case 'fast2sms':
        return this.sendViaFast2SMS(phone, otp);
      case 'twilio':
        return this.sendViaTwilio(phone, otp);
      case 'msg91':
        return this.sendViaMsg91(phone, otp);
      case '2factor':
        return this.sendVia2Factor(phone, otp);
      default:
        throw new Error("SMS provider '" + this.provider + "' is not configured.");
    }
  }

  async sendViaFast2SMS(phone, otp) {
    const apiKey = process.env.FAST2SMS_API_KEY;
    const cleanPhone = phone.replace(/^\+91/, '').replace(/^\+/, '').replace(/\D/g, '');

    if (!apiKey) {
      throw new Error('Fast2SMS API key missing. Please configure FAST2SMS_API_KEY.');
    }

    const payload = JSON.stringify({
      route: 'otp',
      variables_values: otp,
      numbers: cleanPhone
    });

    return new Promise((resolve, reject) => {
      const req = https.request({
        hostname: 'www.fast2sms.com',
        port: 443,
        path: '/dev/bulkV2',
        method: 'POST',
        headers: {
          'authorization': apiKey,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload)
        }
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            if (parsed && (parsed.return === true || parsed.status_code === 200)) {
              resolve({ success: true, messageId: (parsed.request_id || 'fast2sms_' + Date.now()), provider: 'fast2sms' });
            } else {
              const msg = parsed.message ? (Array.isArray(parsed.message) ? parsed.message.join(', ') : parsed.message) : data;
              reject(new Error(`Fast2SMS delivery error (${parsed.status_code || res.statusCode}): ${msg}`));
            }
          } catch (e) {
            if (res.statusCode >= 200 && res.statusCode < 300) {
              resolve({ success: true, messageId: 'fast2sms_' + Date.now(), provider: 'fast2sms' });
            } else {
              reject(new Error('Fast2SMS failed with status ' + res.statusCode));
            }
          }
        });
      });

      req.on('error', (e) => reject(e));
      req.write(payload);
      req.end();
    });
  }

  async sendViaTwilio(phone, otp) {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromPhone = process.env.TWILIO_PHONE_NUMBER;

    if (!accountSid || !authToken || !fromPhone) {
      throw new Error('Twilio credentials missing. Please configure TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER.');
    }

    const body = 'Your FoodWala verification code is ' + otp + '. Valid for 5 minutes. Do not share this with anyone.';
    const postData = new URLSearchParams({
      To: phone,
      From: fromPhone,
      Body: body
    }).toString();

    const auth = Buffer.from(accountSid + ':' + authToken).toString('base64');

    return new Promise((resolve, reject) => {
      const req = https.request({
        hostname: 'api.twilio.com',
        port: 443,
        path: '/2010-04-01/Accounts/' + accountSid + '/Messages.json',
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + auth,
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(postData)
        }
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            const parsed = JSON.parse(data);
            resolve({ success: true, messageId: parsed.sid, provider: 'twilio' });
          } else {
            console.error('[SMS Service Twilio Error]', data);
            reject(new Error('Twilio SMS delivery failed with status ' + res.statusCode));
          }
        });
      });

      req.on('error', (e) => reject(e));
      req.write(postData);
      req.end();
    });
  }

  async sendViaMsg91(phone, otp) {
    const authKey = process.env.MSG91_AUTH_KEY;
    const templateId = process.env.MSG91_TEMPLATE_ID;
    const cleanPhone = phone.replace(/^\+/, '');

    if (!authKey) {
      throw new Error('MSG91 credentials missing. Please configure MSG91_AUTH_KEY.');
    }

    const payload = JSON.stringify({
      template_id: templateId || 'default',
      mobile: cleanPhone,
      otp: otp
    });

    return new Promise((resolve, reject) => {
      const req = https.request({
        hostname: 'control.msg91.com',
        port: 443,
        path: '/api/v5/otp',
        method: 'POST',
        headers: {
          'authkey': authKey,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload)
        }
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve({ success: true, messageId: 'msg91_' + Date.now(), provider: 'msg91' });
          } else {
            reject(new Error('MSG91 failed with status ' + res.statusCode + ': ' + data));
          }
        });
      });

      req.on('error', (e) => reject(e));
      req.write(payload);
      req.end();
    });
  }

  async sendVia2Factor(phone, otp) {
    const apiKey = process.env.TWO_FACTOR_API_KEY;
    const cleanPhone = phone.replace(/^\+91/, '').replace(/^\+/, '');

    if (!apiKey) {
      throw new Error('2Factor API key missing. Please configure TWO_FACTOR_API_KEY.');
    }

    const path = '/API/V1/' + encodeURIComponent(apiKey) + '/SMS/' + encodeURIComponent(cleanPhone) + '/' + encodeURIComponent(otp) + '/FOODWALA';

    return new Promise((resolve, reject) => {
      const req = https.request({
        hostname: '2factor.in',
        port: 443,
        path: path,
        method: 'GET'
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          if (res.statusCode === 200) {
            resolve({ success: true, messageId: '2factor_' + Date.now(), provider: '2factor' });
          } else {
            reject(new Error('2Factor API failed with status ' + res.statusCode + ': ' + data));
          }
        });
      });

      req.on('error', (e) => reject(e));
      req.end();
    });
  }
}

module.exports = new SMSService();

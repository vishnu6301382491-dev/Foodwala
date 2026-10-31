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
  constructor() {}

  get provider() {
    const prov = (process.env.SMS_PROVIDER || '').toLowerCase();
    if (prov) return prov;
    if (process.env.FAST2SMS_API_KEY) return 'fast2sms';
    if (process.env.TWILIO_ACCOUNT_SID) return 'twilio';
    if (process.env.MSG91_AUTH_KEY) return 'msg91';
    if (process.env.TWO_FACTOR_API_KEY) return '2factor';
    return 'console';
  }

  get isDevMode() {
    if (process.env.OTP_DEV_MODE !== undefined) {
      return process.env.OTP_DEV_MODE === 'true';
    }
    return process.env.NODE_ENV !== 'production';
  }

  /**
   * Checks whether a real SMS provider is properly configured with credentials
   * @returns {boolean}
   */
  isConfigured() {
    if (this.isDevMode) return true;
    const prov = this.provider;
    if (prov === 'fast2sms' || Boolean(process.env.FAST2SMS_API_KEY)) {
      return Boolean(process.env.FAST2SMS_API_KEY);
    }
    if (prov === 'twilio') {
      return Boolean(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER);
    }
    if (prov === 'msg91') {
      return Boolean(process.env.MSG91_AUTH_KEY);
    }
    if (prov === '2factor') {
      return Boolean(process.env.TWO_FACTOR_API_KEY);
    }
    return false;
  }

  /**
   * Send OTP via configured SMS Provider
   * @param {string} phone - Normalized E.164 phone (+919876543210)
   * @param {string} otp - 6-digit OTP
   * @returns {Promise<{ success: boolean, messageId?: string, provider: string, isDevMode?: boolean, otp?: string }>}
   */
  async sendOtp(phone, otp) {
    const devMode = this.isDevMode;
    const prov = this.provider;

    console.log('--------------------------------------------------');
    console.log('[FoodWala OTP] Request received');
    console.log(`[FoodWala OTP] Mobile validated: ${phone}`);
    console.log(`[FoodWala OTP] Active Provider: ${prov}`);
    console.log(`[FoodWala OTP] Mode: ${devMode ? 'DEVELOPMENT (Console Mode)' : 'PRODUCTION (Live SMS Gateway)'}`);

    // If Dev Mode is enabled or provider is console
    if (devMode || prov === 'console') {
      console.log('\n==================================================');
      console.log('[FoodWala SMS Service - DEV/SANDBOX MODE]');
      console.log('Recipient: ' + phone);
      console.log('OTP Code : ' + otp);
      console.log('Message  : Your FoodWala verification code is: ' + otp + '. Valid for 5 minutes.');
      console.log('Notice   : Console mode active (No real carrier SMS sent).');
      console.log('To send real SMS to mobile, configure OTP_DEV_MODE=false and FAST2SMS_API_KEY in sms.properties.');
      console.log('==================================================\n');

      return {
        success: true,
        isDevMode: true,
        messageId: 'dev_msg_' + Date.now(),
        provider: 'console',
        otp: otp
      };
    }

    if (!this.isConfigured()) {
      const err = new Error('SMS gateway is not configured on this server.');
      err.statusCode = 503;
      throw err;
    }

    // Production SMS Delivery
    switch (prov) {
      case 'fast2sms':
        return await this.sendViaFast2SMS(phone, otp);
      case 'twilio':
        return await this.sendViaTwilio(phone, otp);
      case 'msg91':
        return await this.sendViaMsg91(phone, otp);
      case '2factor':
        return await this.sendVia2Factor(phone, otp);
      default: {
        const err = new Error(`SMS provider '${prov}' is not configured.`);
        err.statusCode = 400;
        throw err;
      }
    }
  }

  async sendViaFast2SMS(phone, otp) {
    const apiKey = process.env.FAST2SMS_API_KEY;
    const cleanPhone = phone.replace(/^\+91/, '').replace(/^\+/, '').replace(/\D/g, '');

    if (!apiKey || apiKey.includes('YOUR_FAST2SMS_API_KEY_HERE')) {
      const err = new Error('Fast2SMS API key missing. Please configure FAST2SMS_API_KEY.');
      err.statusCode = 401;
      throw err;
    }

    console.log(`[FoodWala OTP] Calling SMS provider: Fast2SMS (To: ${cleanPhone})`);

    const callFast2SMS = (options, postData) => {
      return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
          let body = '';
          res.on('data', chunk => body += chunk);
          res.on('end', () => {
            let parsed = null;
            try {
              parsed = JSON.parse(body);
            } catch (e) {}
            resolve({ statusCode: res.statusCode, body, parsed });
          });
        });
        req.on('error', err => reject(err));
        req.setTimeout(12000, () => {
          req.destroy(new Error('Fast2SMS request timeout (12s)'));
        });
        if (postData) req.write(postData);
        req.end();
      });
    };

    let lastError = null;
    let otpRouteError = null;

    // Method 0: If FAST2SMS_OTP_ID is configured, use official Smart OTP API (/dev/otp/send)
    const otpId = process.env.FAST2SMS_OTP_ID;
    if (otpId && otpId.trim()) {
      try {
        console.log(`[FoodWala OTP] Trying Fast2SMS Smart OTP /dev/otp/send (otp_id: ${otpId})...`);
        const smartPayload = JSON.stringify({
          mobile: cleanPhone,
          otp_id: otpId.trim(),
          otp: otp
        });
        const res = await callFast2SMS({
          hostname: 'www.fast2sms.com',
          port: 443,
          path: '/dev/otp/send',
          method: 'POST',
          headers: {
            'authorization': apiKey,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'cache-control': 'no-cache',
            'Content-Length': Buffer.byteLength(smartPayload)
          }
        }, smartPayload);

        console.log(`[FoodWala OTP] Fast2SMS Smart OTP status: ${res.statusCode}`);
        console.log(`[FoodWala OTP] Fast2SMS Smart OTP response: ${res.body}`);

        if (res.statusCode >= 200 && res.statusCode < 300 && res.parsed && (res.parsed.return === true || res.parsed.status_code === 200)) {
          const reqId = res.parsed.request_id || 'fast2sms_smart_' + Date.now();
          console.log(`[FoodWala OTP] Fast2SMS Smart OTP accepted. Request ID: ${reqId}`);
          console.log(`[FoodWala OTP] OTP delivery successful -> Real SMS dispatched to mobile!`);
          return { success: true, messageId: reqId, provider: 'fast2sms' };
        }
        if (res.parsed) {
          lastError = res.parsed.message ? (Array.isArray(res.parsed.message) ? res.parsed.message.join(', ') : res.parsed.message) : res.body;
        }
      } catch (e) {
        console.warn('[FoodWala OTP] Fast2SMS Smart OTP attempt error:', e.message);
        lastError = e.message;
      }
    }

    // Method 1: POST to /dev/bulkV2 with header 'authorization' (route=otp)
    try {
      const payload = JSON.stringify({
        route: 'otp',
        variables_values: otp,
        numbers: cleanPhone
      });
      const res = await callFast2SMS({
        hostname: 'www.fast2sms.com',
        port: 443,
        path: '/dev/bulkV2',
        method: 'POST',
        headers: {
          'authorization': apiKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'cache-control': 'no-cache',
          'Content-Length': Buffer.byteLength(payload)
        }
      }, payload);

      console.log(`[FoodWala OTP] Fast2SMS POST route=otp status: ${res.statusCode}`);
      console.log(`[FoodWala OTP] Fast2SMS POST route=otp response: ${res.body}`);

      if (res.statusCode >= 200 && res.statusCode < 300 && res.parsed && (res.parsed.return === true || res.parsed.status_code === 200)) {
        const reqId = res.parsed.request_id || 'fast2sms_' + Date.now();
        console.log(`[FoodWala OTP] Fast2SMS accepted OTP. Request ID: ${reqId}`);
        console.log(`[FoodWala OTP] OTP delivery successful -> Real SMS dispatched to mobile!`);
        return { success: true, messageId: reqId, provider: 'fast2sms' };
      }
      if (res.parsed) {
        otpRouteError = res.parsed.message ? (Array.isArray(res.parsed.message) ? res.parsed.message.join(', ') : res.parsed.message) : res.body;
        lastError = otpRouteError;
      }
    } catch (e) {
      console.warn('[FoodWala OTP] Fast2SMS route=otp attempt error:', e.message);
      lastError = e.message;
    }

    // Method 2: POST to /dev/bulkV2 with header 'authorization' (route=q Quick SMS)
    try {
      console.log('[FoodWala OTP] Trying Fast2SMS route=q POST...');
      const msg = `Your FoodWala verification code is ${otp}. Valid for 5 minutes.`;
      const qPayload = JSON.stringify({
        route: 'q',
        message: msg,
        language: 'english',
        flash: 0,
        numbers: cleanPhone
      });
      const res = await callFast2SMS({
        hostname: 'www.fast2sms.com',
        port: 443,
        path: '/dev/bulkV2',
        method: 'POST',
        headers: {
          'authorization': apiKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'cache-control': 'no-cache',
          'Content-Length': Buffer.byteLength(qPayload)
        }
      }, qPayload);

      console.log(`[FoodWala OTP] Fast2SMS POST route=q status: ${res.statusCode}`);
      console.log(`[FoodWala OTP] Fast2SMS POST route=q response: ${res.body}`);

      if (res.statusCode >= 200 && res.statusCode < 300 && res.parsed && (res.parsed.return === true || res.parsed.status_code === 200)) {
        const reqId = res.parsed.request_id || 'fast2sms_' + Date.now();
        console.log(`[FoodWala OTP] Fast2SMS accepted OTP via route=q. Request ID: ${reqId}`);
        console.log(`[FoodWala OTP] OTP delivery successful -> Real SMS dispatched to mobile!`);
        return { success: true, messageId: reqId, provider: 'fast2sms' };
      }
      if (res.parsed) {
        lastError = res.parsed.message ? (Array.isArray(res.parsed.message) ? res.parsed.message.join(', ') : res.parsed.message) : res.body;
      }
    } catch (e) {
      console.warn('[FoodWala OTP] Fast2SMS route=q attempt error:', e.message);
    }

    // Method 3: GET to /dev/bulkV2 with authorization header
    try {
      console.log('[FoodWala OTP] Trying Fast2SMS GET request with authorization header...');
      const encodedMsg = encodeURIComponent(`Your FoodWala verification code is ${otp}. Valid for 5 minutes.`);
      const res = await callFast2SMS({
        hostname: 'www.fast2sms.com',
        port: 443,
        path: `/dev/bulkV2?route=q&message=${encodedMsg}&numbers=${cleanPhone}`,
        method: 'GET',
        headers: {
          'authorization': apiKey,
          'Accept': 'application/json',
          'cache-control': 'no-cache'
        }
      });

      console.log(`[FoodWala OTP] Fast2SMS GET status: ${res.statusCode}`);
      console.log(`[FoodWala OTP] Fast2SMS GET response: ${res.body}`);

      if (res.statusCode >= 200 && res.statusCode < 300 && res.parsed && (res.parsed.return === true || res.parsed.status_code === 200)) {
        const reqId = res.parsed.request_id || 'fast2sms_' + Date.now();
        console.log(`[FoodWala OTP] Fast2SMS accepted OTP via GET. Request ID: ${reqId}`);
        console.log(`[FoodWala OTP] OTP delivery successful -> Real SMS dispatched to mobile!`);
        return { success: true, messageId: reqId, provider: 'fast2sms' };
      }
      if (res.parsed) {
        lastError = res.parsed.message ? (Array.isArray(res.parsed.message) ? res.parsed.message.join(', ') : res.parsed.message) : res.body;
      }
    } catch (e) {
      console.warn('[FoodWala OTP] Fast2SMS GET attempt error:', e.message);
    }

    // Diagnostic formatting for known Fast2SMS status codes
    let diagnosticAdvice = '';
    if (otpRouteError && otpRouteError.includes('website verification')) {
      diagnosticAdvice = ' (Fast2SMS Code 996: Complete Website & Aadhaar KYC Verification on fast2sms.com to activate automated OTP API)';
    } else if (lastError && lastError.includes('100 INR')) {
      diagnosticAdvice = ' (Fast2SMS Code 999: Account requires a minimum ₹100 transaction on fast2sms.com to enable API route)';
    }

    const fullErr = `Fast2SMS Error: ${lastError || 'Unable to deliver SMS through Fast2SMS'}${diagnosticAdvice}`;
    console.error(`[FoodWala OTP] SMS delivery FAILED. Error: ${fullErr}`);
    const err = new Error(fullErr);
    err.statusCode = 400;
    err.provider = 'fast2sms';
    throw err;
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

  /**
   * Resend last OTP via Fast2SMS Smart OTP Resend API (/dev/otp/resend)
   * Allowed within a 10-minute window and capped at 5 attempts.
   * @param {string} phone - Normalized E.164 phone (+919876543210)
   * @returns {Promise<{ success: boolean, messageId?: string, provider: string }>}
   */
  async resendOtp(phone) {
    if (this.isDevMode) {
      console.log(`[FoodWala OTP] Resend OTP in dev mode for ${phone}`);
      return { success: true, provider: 'console', isDevMode: true };
    }

    const cleanPhone = phone.replace(/^\+91/, '').replace(/^\+/, '').replace(/[^0-9]/g, '');
    const apiKey = process.env.FAST2SMS_API_KEY;
    if (!apiKey) {
      throw new Error('FAST2SMS_API_KEY is not configured for OTP resend.');
    }

    const payload = JSON.stringify({ mobile: cleanPhone });
    return new Promise((resolve, reject) => {
      const req = https.request({
        hostname: 'www.fast2sms.com',
        port: 443,
        path: '/dev/otp/resend',
        method: 'POST',
        headers: {
          'authorization': apiKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'cache-control': 'no-cache',
          'Content-Length': Buffer.byteLength(payload)
        }
      }, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          let parsed = null;
          try {
            parsed = JSON.parse(body);
          } catch (e) {}

          if (res.statusCode >= 200 && res.statusCode < 300 && parsed && (parsed.return === true || parsed.status_code === 200)) {
            const reqId = parsed.request_id || 'fast2sms_resend_' + Date.now();
            console.log(`[FoodWala OTP] Fast2SMS OTP resent successfully. Request ID: ${reqId}`);
            resolve({ success: true, messageId: reqId, provider: 'fast2sms' });
          } else {
            const errMsg = (parsed && parsed.message) || body || `Status ${res.statusCode}`;
            const err = new Error(`Fast2SMS Resend Error: ${errMsg}`);
            err.statusCode = res.statusCode;
            err.provider = 'fast2sms';
            reject(err);
          }
        });
      });

      req.on('error', err => reject(err));
      req.setTimeout(12000, () => req.destroy(new Error('Fast2SMS resend request timeout')));
      req.write(payload);
      req.end();
    });
  }
}

module.exports = new SMSService();

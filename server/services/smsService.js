/**
 * FoodWala SMS Service
 * Modular SMS provider isolation supporting Twilio, MSG91, 2Factor, and Console.
 * Credentials loaded securely from environment variables.
 */

const https = require('https');
const http = require('http');

class SMSService {
  constructor() {
    this.provider = (process.env.SMS_PROVIDER || 'console').toLowerCase();
    this.isDevMode = process.env.OTP_DEV_MODE === 'true' || process.env.NODE_ENV !== 'production';
  }

  /**
   * Send OTP via configured SMS Provider
   * @param {string} phone - Normalized E.164 phone (+919876543210)
   * @param {string} otp - 6-digit OTP
   * @returns {Promise<{ success: boolean, messageId?: string, provider: string }>}
   */
  async sendOtp(phone, otp) {
    // If Dev Mode is enabled, log to server console only and avoid sending real paid SMS
    if (this.isDevMode || this.provider === 'console') {
      console.log('\n==================================================');
      console.log('[FoodWala SMS Service - DEV MODE]');
      console.log('Recipient: ' + phone);
      console.log('OTP Code : ' + otp);
      console.log('Message  : Your FoodWala verification code is: ' + otp + '. Valid for 5 minutes.');
      console.log('==================================================\n');
      return {
        success: true,
        messageId: 'dev_msg_' + Date.now(),
        provider: 'console_dev'
      };
    }

    // Production SMS Delivery
    switch (this.provider) {
      case 'twilio':
        return this.sendViaTwilio(phone, otp);
      case 'msg91':
        return this.sendViaMsg91(phone, otp);
      case '2factor':
        return this.sendVia2Factor(phone, otp);
      default:
        console.warn("[SMS Service] Unknown provider '" + this.provider + "', falling back to console output.");
        return { success: true, messageId: 'console_fallback_' + Date.now(), provider: 'console' };
    }
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

/**
 * FoodWala Secure Authentication & OTP API Server
 */

const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');

if (fs.existsSync(path.join(__dirname, '.env'))) {
  try {
    require('dotenv').config({ path: path.join(__dirname, '.env') });
  } catch (e) {}
}

const smsService = require('./services/smsService');

const app = express();
const PORT = process.env.PORT || 5000;
const HASH_SECRET = process.env.OTP_HASH_SECRET || 'foodwala_otp_secret_key_2026';
const IS_DEV_MODE = process.env.OTP_DEV_MODE === 'true' || process.env.NODE_ENV !== 'production';

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// In-Memory Storage for OTP records: phone -> { hashedOtp, expiresAt, attempts, lastSentAt }
const otpStore = new Map();

// In-Memory User Database
const usersStore = [
  {
    userId: 101,
    name: 'Rahul Sharma',
    email: 'customer@foodwala.com',
    phone: '+919876543210',
    role: 'CUSTOMER',
    memberSince: 'March 2024',
    addresses: []
  },
  {
    userId: 102,
    name: 'Vidyarthi Bhavan Manager',
    email: 'vidyarthi@foodwala.com',
    phone: '+918026677588',
    role: 'RESTAURANT_ADMIN',
    memberSince: 'January 2024',
    addresses: []
  },
  {
    userId: 103,
    name: 'Ramesh Kumar',
    email: 'partner@foodwala.com',
    phone: '+919123456789',
    role: 'DELIVERY_PARTNER',
    memberSince: 'June 2024',
    addresses: []
  }
];

const sessionsStore = new Map();

function normalizePhone(rawPhone) {
  if (!rawPhone || typeof rawPhone !== 'string') return null;
  let digits = rawPhone.replace(/[\s\-\(\)]/g, '');
  if (digits.startsWith('+91')) {
    digits = digits.substring(3);
  } else if (digits.startsWith('91') && digits.length === 12) {
    digits = digits.substring(2);
  } else if (digits.startsWith('0') && digits.length === 11) {
    digits = digits.substring(1);
  }
  if (/^[6-9]\d{9}$/.test(digits)) {
    return '+91' + digits;
  }
  return null;
}

function hashOtp(phone, otp) {
  return crypto.createHmac('sha256', HASH_SECRET).update(phone + ':' + otp).digest('hex');
}

function generateSecureOtp() {
  return crypto.randomInt(100000, 1000000).toString();
}

app.get('/api/auth/health', (req, res) => {
  res.json({
    status: 'ONLINE',
    service: 'FoodWala Auth & OTP API',
    timestamp: new Date().toISOString(),
    devMode: IS_DEV_MODE,
    provider: smsService.provider
  });
});

app.post('/api/auth/send-otp', async (req, res) => {
  try {
    const { phone } = req.body;
    const normalized = normalizePhone(phone);

    if (!normalized) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_PHONE',
        message: 'Please enter a valid 10-digit mobile number.'
      });
    }

    const now = Date.now();
    const existing = otpStore.get(normalized);

    // 30s Cooldown
    if (existing && (now - existing.lastSentAt) < 30000) {
      const waitSec = Math.ceil((30000 - (now - existing.lastSentAt)) / 1000);
      return res.status(429).json({
        success: false,
        error: 'TOO_MANY_REQUESTS',
        message: 'Please wait ' + waitSec + 's before requesting a new OTP.',
        cooldownRemaining: waitSec
      });
    }

    const otp = generateSecureOtp();
    const hashed = hashOtp(normalized, otp);
    const expiresAt = now + (5 * 60 * 1000);

    otpStore.set(normalized, {
      hashedOtp: hashed,
      expiresAt: expiresAt,
      attempts: 0,
      lastSentAt: now
    });

    try {
      await smsService.sendOtp(normalized, otp);
    } catch (smsErr) {
      console.error('[Send OTP Error]', smsErr);
      return res.status(500).json({
        success: false,
        error: 'SMS_SEND_FAILED',
        message: 'Unable to send OTP right now. Please try again.'
      });
    }

    const responsePayload = {
      success: true,
      message: 'OTP sent successfully.',
      phone: normalized,
      expiresIn: 300,
      cooldownSeconds: 30
    };

    if (IS_DEV_MODE) {
      responsePayload.devOtp = otp;
    }

    return res.json(responsePayload);
  } catch (err) {
    console.error('[Send OTP General Error]', err);
    return res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: 'An unexpected error occurred. Please try again.'
    });
  }
});

app.post('/api/auth/verify-otp', async (req, res) => {
  try {
    const { phone, otp } = req.body;
    const normalized = normalizePhone(phone);

    if (!normalized) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_PHONE',
        message: 'Please enter a valid 10-digit mobile number.'
      });
    }

    if (!otp || typeof otp !== 'string' || otp.trim().length !== 6) {
      return res.status(400).json({
        success: false,
        error: 'INVALID_OTP_FORMAT',
        message: 'Please enter the 6-digit verification code.'
      });
    }

    const record = otpStore.get(normalized);
    const cleanOtp = otp.trim();

    if (!record) {
      return res.status(400).json({
        success: false,
        error: 'OTP_EXPIRED',
        message: 'OTP expired. Please request a new OTP.'
      });
    }

    if (Date.now() > record.expiresAt) {
      otpStore.delete(normalized);
      return res.status(400).json({
        success: false,
        error: 'OTP_EXPIRED',
        message: 'OTP expired. Please request a new OTP.'
      });
    }

    if (record.attempts >= 5) {
      otpStore.delete(normalized);
      return res.status(429).json({
        success: false,
        error: 'TOO_MANY_ATTEMPTS',
        message: 'Too many attempts. Please request a new OTP.'
      });
    }

    const computedHash = hashOtp(normalized, cleanOtp);
    const hashBuf1 = Buffer.from(computedHash, 'hex');
    const hashBuf2 = Buffer.from(record.hashedOtp, 'hex');

    const isMatch = hashBuf1.length === hashBuf2.length && crypto.timingSafeEqual(hashBuf1, hashBuf2);

    if (!isMatch) {
      record.attempts += 1;
      const remaining = 5 - record.attempts;
      return res.status(400).json({
        success: false,
        error: 'INCORRECT_OTP',
        message: 'Incorrect OTP. Please check and try again.',
        attemptsRemaining: remaining
      });
    }

    otpStore.delete(normalized);

    let user = usersStore.find(u => u.phone === normalized);

    if (user) {
      const token = 'fw_sess_' + crypto.randomBytes(24).toString('hex');
      sessionsStore.set(token, user.userId);

      return res.json({
        success: true,
        isNewUser: false,
        message: 'Mobile number verified successfully.',
        token: token,
        user: {
          userId: user.userId,
          name: user.name,
          phone: user.phone,
          email: user.email,
          role: user.role,
          memberSince: user.memberSince,
          addresses: user.addresses || []
        }
      });
    } else {
      const tempToken = 'fw_temp_' + crypto.randomBytes(24).toString('hex');
      otpStore.set('temp_' + tempToken, { phone: normalized, createdAt: Date.now() });

      return res.json({
        success: true,
        isNewUser: true,
        phone: normalized,
        tempToken: tempToken,
        message: 'Mobile number verified successfully. Please complete your profile.'
      });
    }
  } catch (err) {
    console.error('[Verify OTP Error]', err);
    return res.status(500).json({
      success: false,
      error: 'SERVER_ERROR',
      message: 'Verification failed. Please try again.'
    });
  }
});

app.post('/api/auth/register-mobile', (req, res) => {
  try {
    const { phone, name, email, address, tempToken } = req.body;
    const normalized = normalizePhone(phone);

    if (!normalized) {
      return res.status(400).json({ success: false, message: 'Invalid phone number.' });
    }

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Full name is required.' });
    }

    let existingUser = usersStore.find(u => u.phone === normalized);
    if (existingUser) {
      const token = 'fw_sess_' + crypto.randomBytes(24).toString('hex');
      sessionsStore.set(token, existingUser.userId);
      return res.json({
        success: true,
        message: 'Account already exists. Logged in successfully.',
        token: token,
        user: existingUser
      });
    }

    if (email && email.trim()) {
      const cleanEmail = email.trim().toLowerCase();
      const emailUser = usersStore.find(u => u.email && u.email.toLowerCase() === cleanEmail);
      if (emailUser) {
        emailUser.phone = normalized;
        if (!emailUser.name || emailUser.name === 'Food Lover') {
          emailUser.name = name.trim();
        }
        const token = 'fw_sess_' + crypto.randomBytes(24).toString('hex');
        sessionsStore.set(token, emailUser.userId);
        return res.json({
          success: true,
          message: 'Phone linked to existing account.',
          token: token,
          user: emailUser
        });
      }
    }

    const newUser = {
      userId: Date.now(),
      name: name.trim(),
      phone: normalized,
      email: (email && email.trim()) ? email.trim().toLowerCase() : null,
      role: 'CUSTOMER',
      memberSince: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      addresses: address ? [
        {
          id: 'addr_' + Date.now(),
          userId: Date.now(),
          label: 'Home',
          type: 'Home',
          fullName: name.trim(),
          phone: normalized,
          houseNo: '',
          street: address,
          area: 'Bengaluru',
          city: 'Bengaluru',
          state: 'Karnataka',
          pincode: '560001',
          latitude: 12.9716,
          longitude: 77.5946,
          addressLine: address + ', Bengaluru, Karnataka - 560001',
          isDefault: true
        }
      ] : []
    };

    usersStore.push(newUser);

    const token = 'fw_sess_' + crypto.randomBytes(24).toString('hex');
    sessionsStore.set(token, newUser.userId);

    return res.json({
      success: true,
      message: 'Account created successfully!',
      token: token,
      user: newUser
    });
  } catch (err) {
    console.error('[Register Mobile Error]', err);
    return res.status(500).json({ success: false, message: 'Registration failed.' });
  }
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !email.trim()) {
    return res.status(400).json({ success: false, message: 'Email is required.' });
  }

  const cleanEmail = email.trim().toLowerCase();
  let user = usersStore.find(u => u.email && u.email.toLowerCase() === cleanEmail);

  if (!user) {
    const namePart = cleanEmail.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    user = {
      userId: Date.now(),
      name: namePart,
      email: cleanEmail,
      phone: null,
      role: 'CUSTOMER',
      memberSince: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      addresses: []
    };
    usersStore.push(user);
  }

  const token = 'fw_sess_' + crypto.randomBytes(24).toString('hex');
  sessionsStore.set(token, user.userId);

  return res.json({
    success: true,
    token: token,
    user: user
  });
});

app.get('/api/auth/me', (req, res) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  const token = authHeader.replace(/^Bearer\s+/i, '');
  const userId = sessionsStore.get(token);

  if (!userId) {
    return res.status(401).json({ success: false, message: 'Session expired' });
  }

  const user = usersStore.find(u => u.userId === userId);
  if (!user) {
    return res.status(401).json({ success: false, message: 'User not found' });
  }

  return res.json({ success: true, user: user });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log('\n======================================================');
    console.log('🚀 FoodWala Auth & OTP API Server Running on port ' + PORT);
    console.log('🌐 Health check: http://localhost:' + PORT + '/api/auth/health');
    console.log('🔒 Dev Mode   : ' + (IS_DEV_MODE ? 'ENABLED (Safe Console Logs)' : 'DISABLED (Real SMS Delivery)'));
    console.log('📱 SMS Provider: ' + smsService.provider.toUpperCase());
    console.log('======================================================\n');
  });
}

module.exports = app;

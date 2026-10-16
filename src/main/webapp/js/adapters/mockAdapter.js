/**
 * FoodWala Mock Data & Authentication Adapter (mockAdapter.js)
 * 
 * Runs 100% in-browser using localStorage and local JSON files.
 * Zero external backend required. Fully compliant with GitHub Pages.
 */

(function (window) {
  'use strict';

  window.FoodWalaAdapters = window.FoodWalaAdapters || {};

  const STORAGE_KEYS = {
    MOCK_USERS: 'foodwala_mock_users',
    CURRENT_USER: 'foodwala_current_user',
    AUTH_TOKEN: 'foodwala_auth_token',
    ACTIVE_OTP: 'foodwala_mock_active_otp',
    LOGIN_HISTORY: 'foodwala_mock_login_history',
    MOCK_ORDERS: 'foodwala_mock_orders',
    MOCK_ADDRESSES: 'foodwala_mock_addresses',
    RESTAURANTS_CACHE: 'foodwala_cache_restaurants_list',
    CATEGORIES_CACHE: 'foodwala_cache_categories_list',
    MENU_CACHE_PREFIX: 'foodwala_cache_menu_rest_'
  };

  // Safe relative path resolver
  function resolveDataPath(relPath) {
    if (typeof window !== 'undefined' && window.location) {
      const cleanRel = relPath.replace(/^\.?\//, '');
      const pathname = window.location.pathname || '';
      const baseDir = pathname.substring(0, pathname.lastIndexOf('/') + 1);
      return `${baseDir}${cleanRel}`;
    }
    return `./${relPath.replace(/^\.?\//, '')}`;
  }

  function getLocal(key, defaultVal) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : defaultVal;
    } catch (e) {
      return defaultVal;
    }
  }

  function setLocal(key, val) {
    try {
      localStorage.setItem(key, JSON.stringify(val));
    } catch (e) {}
  }

  function normalizePhone(rawPhone) {
    if (!rawPhone || typeof rawPhone !== 'string') return null;
    const digits = rawPhone.replace(/\D/g, '');
    if (digits.startsWith('91') && digits.length === 12 && /^[6-9]/.test(digits.substring(2))) {
      return digits.substring(2);
    }
    if (digits.startsWith('0') && digits.length === 11 && /^[6-9]/.test(digits.substring(1))) {
      return digits.substring(1);
    }
    if (digits.length === 10 && /^[6-9]/.test(digits)) {
      return digits;
    }
    return null;
  }

  // Simple deterministic hash for mock password storage (never plain text)
  function mockHash(str) {
    let hash = 0;
    const s = String(str) + '_foodwala_mock_salt_2026';
    for (let i = 0; i < s.length; i++) {
      hash = ((hash << 5) - hash) + s.charCodeAt(i);
      hash |= 0;
    }
    return 'm_hash_' + Math.abs(hash).toString(16) + '_secure';
  }

  // Pre-seed mock users if not present
  function initMockUsers() {
    let users = getLocal(STORAGE_KEYS.MOCK_USERS, null);
    
    const defaultAccounts = [
      {
        userId: 1,
        name: 'Vishnu Vardhan Reddy',
        username: 'VISHNU',
        email: 'vishnuvardhanreddych45@gmail.com',
        phone: '6301382491',
        role: 'customer',
        passwordHash: mockHash('Password@123'),
        address: 'Main Road, Lakshmi Narayana Layout, Bengaluru - 560037',
        memberSince: 'October 2026',
        failedAttempts: 0,
        lockedUntil: 0
      },
      {
        userId: 2,
        name: 'Rahul Sharma',
        username: 'customer',
        email: 'customer@foodwala.com',
        phone: '9876543210',
        role: 'customer',
        passwordHash: mockHash('Password@123'),
        address: 'Indiranagar, 100ft Road, Bengaluru - 560038',
        memberSince: 'March 2026',
        failedAttempts: 0,
        lockedUntil: 0
      },
      {
        userId: 3,
        name: 'FoodWala Administrator',
        username: 'admin',
        email: 'admin@foodwala.com',
        phone: '9876543222',
        role: 'admin',
        passwordHash: mockHash('Admin@123'),
        address: 'FoodWala HQ, MG Road, Bengaluru, Karnataka - 560001',
        memberSince: 'January 2026',
        failedAttempts: 0,
        lockedUntil: 0
      },
      {
        userId: 4,
        name: 'Administrator',
        username: 'admin_example',
        email: 'admin@example.com',
        phone: '9876543229',
        role: 'admin',
        passwordHash: mockHash('password'),
        address: 'FoodWala HQ, MG Road, Bengaluru, Karnataka - 560001',
        memberSince: 'January 2026',
        failedAttempts: 0,
        lockedUntil: 0
      },
      {
        userId: 5,
        name: 'Ramesh Kumar (Delivery Partner)',
        username: 'delivery_partner',
        email: 'delivery@foodwala.com',
        phone: '9876543230',
        role: 'partner',
        passwordHash: mockHash('Partner@123'),
        address: 'Koramangala 5th Block, Bengaluru - 560095',
        memberSince: 'February 2026',
        failedAttempts: 0,
        lockedUntil: 0
      },
      {
        userId: 6,
        name: 'Vidyarthi Bhavan (Restaurant Manager)',
        username: 'restaurant_manager',
        email: 'restaurant@foodwala.com',
        phone: '9876543231',
        role: 'restaurant',
        passwordHash: mockHash('Restaurant@123'),
        address: 'Gandhi Bazaar, Basavanagudi, Bengaluru - 560004',
        memberSince: 'February 2026',
        failedAttempts: 0,
        lockedUntil: 0
      }
    ];

    if (!users || !Array.isArray(users) || users.length === 0) {
      users = [...defaultAccounts];
      setLocal(STORAGE_KEYS.MOCK_USERS, users);
    } else {
      let changed = false;
      for (const def of defaultAccounts) {
        const idx = users.findIndex(u => (u.email || '').toLowerCase() === def.email.toLowerCase());
        if (idx === -1) {
          users.push(def);
          changed = true;
        } else {
          users[idx].passwordHash = def.passwordHash;
          users[idx].phone = def.phone;
          users[idx].role = def.role;
          changed = true;
        }
      }
      if (changed) {
        setLocal(STORAGE_KEYS.MOCK_USERS, users);
      }
    }
    return users;
  }

  function logLoginAttempt(identifier, status, details = '') {
    const history = getLocal(STORAGE_KEYS.LOGIN_HISTORY, []);
    history.unshift({
      timestamp: new Date().toISOString(),
      identifier: identifier,
      status: status, // "SUCCESS" or "FAILED"
      details: details,
      ip: '127.0.0.1 (Browser Mock)'
    });
    setLocal(STORAGE_KEYS.LOGIN_HISTORY, history.slice(0, 100)); // Keep latest 100
  }

  // =======================================================================
  // MOCK ADAPTER IMPLEMENTATION
  // =======================================================================
  const mockAdapter = {
    name: 'mock',

    // 1. Health check (Always healthy in mock mode)
    checkHealth: async function () {
      return {
        status: 'ok',
        db: true,
        mode: 'mock',
        message: 'Mock adapter running locally in browser'
      };
    },

    // 2. Catalog: Restaurants
    getRestaurants: async function () {
      const cacheKey = STORAGE_KEYS.RESTAURANTS_CACHE;
      const cached = getLocal(cacheKey, null);
      if (cached && Array.isArray(cached) && cached.length >= 10) {
        return cached;
      }

      try {
        const res = await fetch(resolveDataPath('data/restaurants.json'));
        if (res.ok) {
          const list = await res.json();
          if (Array.isArray(list) && list.length > 0) {
            setLocal(cacheKey, list);
            return list;
          }
        }
      } catch (e) {}

      if (typeof window !== 'undefined' && window.FOODWALA_RESTAURANTS && window.FOODWALA_RESTAURANTS.length > 0) {
        return window.FOODWALA_RESTAURANTS;
      }
      return [];
    },

    // 3. Catalog: Categories
    getCategories: async function () {
      const cacheKey = STORAGE_KEYS.CATEGORIES_CACHE;
      const cached = getLocal(cacheKey, null);
      if (cached && Array.isArray(cached) && cached.length > 0) {
        return cached;
      }

      try {
        const res = await fetch(resolveDataPath('data/categories.json'));
        if (res.ok) {
          const list = await res.json();
          if (Array.isArray(list) && list.length > 0) {
            setLocal(cacheKey, list);
            return list;
          }
        }
      } catch (e) {}

      return [
        { id: 1, name: 'South Indian' },
        { id: 2, name: 'North Indian' },
        { id: 3, name: 'Biryani' },
        { id: 4, name: 'Burgers & Fast Food' },
        { id: 5, name: 'Desserts & Sweets' },
        { id: 6, name: 'Beverages' }
      ];
    },

    // 4. Catalog: Restaurant Menu
    getRestaurantMenu: async function (restaurantId) {
      const rId = parseInt(restaurantId, 10);
      const cacheKey = `${STORAGE_KEYS.MENU_CACHE_PREFIX}${rId}`;
      const cached = getLocal(cacheKey, null);
      if (cached && Array.isArray(cached) && cached.length > 0) {
        return cached;
      }

      try {
        const res = await fetch(resolveDataPath(`data/menus/${rId}.json`));
        if (res.ok) {
          const items = await res.json();
          if (Array.isArray(items) && items.length > 0) {
            setLocal(cacheKey, items);
            return items;
          }
        }
      } catch (e) {}

      try {
        const res = await fetch(resolveDataPath('data/menu-items.json'));
        if (res.ok) {
          const all = await res.json();
          const matched = all.filter(m => (m.restaurantId === rId || m.restaurant_id === rId));
          if (matched.length > 0) {
            setLocal(cacheKey, matched);
            return matched;
          }
        }
      } catch (e) {}

      return [];
    },

    // 5. Check Phone Availability
    checkPhone: async function (rawPhone) {
      const normalized = normalizePhone(rawPhone);
      if (!normalized) {
        return { available: false, error: 'Please enter a valid 10-digit mobile number.' };
      }
      const users = initMockUsers();
      const exists = users.some(u => normalizePhone(u.phone) === normalized);
      return { available: !exists, phone: normalized };
    },

    // 6. Send Mobile OTP
    sendOtp: async function (rawPhone) {
      const normalized = normalizePhone(rawPhone);
      if (!normalized) {
        return {
          success: false,
          error: 'INVALID_PHONE',
          message: 'Please enter a valid 10-digit mobile number starting with 6, 7, 8, or 9.'
        };
      }

      // Check 30-second resend limit
      const activeOtp = getLocal(STORAGE_KEYS.ACTIVE_OTP, null);
      if (activeOtp && activeOtp.phone === normalized && (Date.now() - activeOtp.sentAt) < 30000) {
        const waitSec = Math.ceil((30000 - (Date.now() - activeOtp.sentAt)) / 1000);
        return {
          success: false,
          error: 'RATE_LIMIT',
          message: `Please wait ${waitSec} seconds before requesting a new OTP.`
        };
      }

      // Generate 6-digit code
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = Date.now() + (5 * 60 * 1000); // 5 minutes validity

      setLocal(STORAGE_KEYS.ACTIVE_OTP, {
        phone: normalized,
        code: otpCode,
        sentAt: Date.now(),
        expiresAt: expiresAt,
        attempts: 0
      });

      // If DEMO_MODE is true, log OTP to console only (never in UI/toast)
      if (window.FOODWALA_CONFIG && window.FOODWALA_CONFIG.DEMO_MODE) {
        console.info(`%c[FoodWala Mock OTP]%c Code for +91 ${normalized}: %c${otpCode}%c (Valid for 5 mins)`,
          'color: #dc3545; font-weight: bold;', 'color: #333;', 'color: #0d6efd; font-weight: bold;', 'color: #333;');
      }

      return {
        success: true,
        message: 'OTP sent successfully to your mobile number.',
        phone: normalized,
        otp: otpCode,
        code: otpCode
      };
    },

    // 7. Verify OTP
    verifyOtp: async function (rawPhone, code) {
      const normalized = normalizePhone(rawPhone);
      const cleanCode = (code || '').trim();

      if (!normalized || cleanCode.length !== 6) {
        return { success: false, error: 'INVALID_CODE', message: 'Please enter a valid 6-digit verification code.' };
      }

      const activeOtp = getLocal(STORAGE_KEYS.ACTIVE_OTP, null);
      const isUniversalTestCode = (cleanCode === '123456');

      if (!isUniversalTestCode) {
        if (!activeOtp || activeOtp.phone !== normalized) {
          return { success: false, error: 'EXPIRED_OTP', message: 'No active OTP request found. Please request a new OTP.' };
        }

        if (Date.now() > activeOtp.expiresAt) {
          localStorage.removeItem(STORAGE_KEYS.ACTIVE_OTP);
          return { success: false, error: 'EXPIRED_OTP', message: 'OTP has expired. Please request a new code.' };
        }

        if (activeOtp.code !== cleanCode) {
          activeOtp.attempts = (activeOtp.attempts || 0) + 1;
          if (activeOtp.attempts >= 5) {
            localStorage.removeItem(STORAGE_KEYS.ACTIVE_OTP);
            return { success: false, error: 'MAX_ATTEMPTS', message: 'Too many incorrect attempts. Please request a new OTP.' };
          }
          setLocal(STORAGE_KEYS.ACTIVE_OTP, activeOtp);
          const rem = 5 - activeOtp.attempts;
          return { success: false, error: 'WRONG_OTP', message: `Incorrect OTP code. ${rem} attempt(s) remaining.` };
        }
      }

      // Successful verification
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_OTP);

      // Check if existing user
      const users = initMockUsers();
      const existing = users.find(u => normalizePhone(u.phone) === normalized);

      if (existing) {
        const token = 'mock_jwt_token_' + Date.now();
        localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
        setLocal(STORAGE_KEYS.CURRENT_USER, existing);
        logLoginAttempt(normalized, 'SUCCESS', 'Mobile OTP Login');
        window.dispatchEvent(new CustomEvent('foodwala:authChanged', { detail: existing }));
        return { success: true, isNewUser: false, user: existing, token: token };
      } else {
        // Return isNewUser = true so the client displays the Name input step
        return { success: true, isNewUser: true, phone: normalized };
      }
    },

    // 8. Register Mobile User (Name step after new phone OTP)
    registerMobile: async function (data) {
      const normalized = normalizePhone(data.phone);
      const cleanName = (data.name || '').replace(/<[^>]*>?/gm, '').trim();

      if (!cleanName || !normalized) {
        return { success: false, message: 'Your name is required to complete profile registration.' };
      }

      const users = initMockUsers();
      const newUser = {
        userId: users.length + 1,
        name: cleanName,
        username: cleanName,
        email: (data.email || '').trim().toLowerCase() || null,
        phone: normalized,
        role: 'customer',
        passwordHash: mockHash('MobileUser_' + Date.now()),
        address: (data.address || '').trim() || 'Bengaluru, Karnataka',
        memberSince: 'March 2026',
        failedAttempts: 0,
        lockedUntil: 0
      };

      users.push(newUser);
      setLocal(STORAGE_KEYS.MOCK_USERS, users);

      const token = 'mock_jwt_token_' + Date.now();
      localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
      setLocal(STORAGE_KEYS.CURRENT_USER, newUser);
      logLoginAttempt(normalized, 'SUCCESS', 'Mobile Profile Created');
      window.dispatchEvent(new CustomEvent('foodwala:authChanged', { detail: newUser }));

      return { success: true, user: newUser, token: token };
    },

    // 9. Standard Signup (register.html)
    signup: async function (data) {
      const cleanName = (data.name || data.username || '').replace(/<[^>]*>?/gm, '').trim();
      const cleanEmail = (data.email || '').trim().toLowerCase();
      const cleanPhone = normalizePhone(data.phone);
      const password = data.password || '';

      if (!cleanName || !cleanEmail || !password) {
        return { success: false, message: 'Name, email, and password are required.' };
      }

      // Password complexity: min 8, letters + numbers
      if (!/^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(password)) {
        return { success: false, message: 'Password must be at least 8 characters with both letters and numbers.' };
      }

      if (data.confirmPassword && password !== data.confirmPassword) {
        return { success: false, message: 'Passwords do not match.' };
      }

      const users = initMockUsers();

      // Check duplicates
      if (cleanPhone && users.some(u => normalizePhone(u.phone) === cleanPhone)) {
        return {
          success: false,
          status: 409,
          code: 'PHONE_EXISTS',
          phone: cleanPhone,
          message: 'This mobile number is already registered. Please login.'
        };
      }

      if (users.some(u => (u.email || '').toLowerCase() === cleanEmail)) {
        return {
          success: false,
          status: 409,
          code: 'EMAIL_EXISTS',
          email: cleanEmail,
          message: 'An account with this email address already exists. Please login.'
        };
      }

      // Create user
      const newUser = {
        userId: users.length + 1,
        name: cleanName,
        username: cleanName,
        email: cleanEmail,
        phone: cleanPhone,
        role: data.role || 'customer',
        passwordHash: mockHash(password),
        address: (data.address || '').trim() || 'Bengaluru, Karnataka',
        memberSince: 'March 2026',
        failedAttempts: 0,
        lockedUntil: 0
      };

      users.push(newUser);
      setLocal(STORAGE_KEYS.MOCK_USERS, users);

      const safeUser = {
        userId: newUser.userId,
        name: newUser.name,
        username: newUser.username,
        email: newUser.email,
        phone: newUser.phone,
        role: newUser.role,
        address: newUser.address,
        addresses: [],
        memberSince: newUser.memberSince
      };

      const token = 'mock_jwt_token_' + Date.now();
      localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
      setLocal(STORAGE_KEYS.CURRENT_USER, safeUser);
      logLoginAttempt(cleanEmail, 'SUCCESS', 'Email Registration');
      window.dispatchEvent(new CustomEvent('foodwala:authChanged', { detail: safeUser }));

      return { success: true, user: safeUser, token: token };
    },

    // 10. Login (Email or Phone + Password)
    login: async function (identifier, password) {
      const cleanId = (identifier || '').trim();
      if (!cleanId || !password) {
        return { success: false, message: 'Please enter your email or mobile number and password.' };
      }

      const isEmail = cleanId.includes('@');
      const cleanEmail = isEmail ? cleanId.toLowerCase() : null;
      const normalizedPhone = !isEmail ? normalizePhone(cleanId) : null;

      const users = initMockUsers();
      const userIndex = users.findIndex(u => {
        if (cleanEmail && (u.email || '').trim().toLowerCase() === cleanEmail) return true;
        if (normalizedPhone && normalizePhone(u.phone) === normalizedPhone) return true;
        return false;
      });

      // User not found -> Generic error to prevent enumeration
      if (userIndex === -1) {
        logLoginAttempt(cleanId, 'FAILED', 'Unknown identifier');
        return {
          success: false,
          message: 'Invalid email/mobile number or password.'
        };
      }

      const user = users[userIndex];

      // Check lockout status
      if (user.lockedUntil && Date.now() < user.lockedUntil) {
        const remainingMin = Math.ceil((user.lockedUntil - Date.now()) / 60000);
        return {
          success: false,
          status: 423,
          error: 'ACCOUNT_LOCKED',
          message: `Account is temporarily locked due to multiple failed login attempts. Please try again after ${remainingMin} minute(s).`,
          lockRemainingMinutes: remainingMin
        };
      }

      // Verify password hash (flexible for standard role test passwords)
      const inputHash = mockHash(password);
      const standardPasswords = ['password', 'Admin@123', 'admin123', 'Password@123', 'Partner@123', 'Restaurant@123', 'Vishnu@123', 'vishnu@123', '12345678'];
      const isPassValid = (user.passwordHash === inputHash) || (user.passwordHash === password) || (user.password === password) || standardPasswords.includes(password);
      if (!isPassValid) {
        user.failedAttempts = (user.failedAttempts || 0) + 1;

        if (user.failedAttempts >= 5) {
          user.lockedUntil = Date.now() + (15 * 60 * 1000); // 15-minute lock
          users[userIndex] = user;
          setLocal(STORAGE_KEYS.MOCK_USERS, users);
          logLoginAttempt(cleanId, 'FAILED', 'Account locked (5 failures)');

          return {
            success: false,
            status: 423,
            error: 'ACCOUNT_LOCKED',
            message: 'Account locked due to 5 consecutive failed login attempts. Please try again in 15 minutes.',
            lockRemainingMinutes: 15
          };
        }

        users[userIndex] = user;
        setLocal(STORAGE_KEYS.MOCK_USERS, users);
        logLoginAttempt(cleanId, 'FAILED', `Incorrect password (Attempt ${user.failedAttempts}/5)`);

        return {
          success: false,
          message: 'Invalid email/mobile number or password.'
        };
      }

      // Password matches -> Reset failures
      user.failedAttempts = 0;
      user.lockedUntil = 0;
      user.lastLogin = new Date().toISOString();
      users[userIndex] = user;
      setLocal(STORAGE_KEYS.MOCK_USERS, users);

      // Return clean user object WITHOUT password / passwordHash
      const safeUser = {
        userId: user.userId,
        name: user.name,
        username: user.username || user.name,
        email: user.email,
        phone: user.phone,
        role: user.role || 'customer',
        address: user.address || '',
        addresses: getLocal(`${STORAGE_KEYS.MOCK_ADDRESSES}_${user.userId}`, []),
        memberSince: user.memberSince || 'March 2026'
      };

      const token = 'mock_jwt_token_' + Date.now();
      localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
      setLocal(STORAGE_KEYS.CURRENT_USER, safeUser);
      logLoginAttempt(cleanId, 'SUCCESS', 'Password Login');
      window.dispatchEvent(new CustomEvent('foodwala:authChanged', { detail: safeUser }));

      return { success: true, user: safeUser, token: token };
    },

    // 11. Change Password
    changePassword: async function (currentPassword, newPassword, confirmPassword) {
      const currentUser = getLocal(STORAGE_KEYS.CURRENT_USER, null);
      if (!currentUser) {
        return { success: false, message: 'Authentication required. Please sign in.' };
      }

      if (newPassword !== confirmPassword) {
        return { success: false, message: 'New passwords do not match.' };
      }

      if (!/^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(newPassword)) {
        return { success: false, message: 'New password must be at least 8 characters with letters and numbers.' };
      }

      const users = initMockUsers();
      const userIndex = users.findIndex(u => u.userId === currentUser.userId);
      if (userIndex === -1) {
        return { success: false, message: 'Account not found.' };
      }

      const user = users[userIndex];
      if (user.passwordHash !== mockHash(currentPassword)) {
        return { success: false, message: 'Current password does not match.' };
      }

      user.passwordHash = mockHash(newPassword);
      users[userIndex] = user;
      setLocal(STORAGE_KEYS.MOCK_USERS, users);

      return { success: true, message: 'Password updated successfully!' };
    },

    // 12. Forgot Password (Always returns generic response)
    forgotPassword: async function (identifier) {
      const cleanId = (identifier || '').trim();
      const isPhone = /^[6-9]\d{9}$/.test(cleanId.replace(/\D/g, '')) || cleanId.startsWith('+91');
      const normalizedPhone = isPhone ? normalizePhone(cleanId) : null;
      const cleanEmail = !isPhone ? cleanId.toLowerCase() : null;

      const users = initMockUsers();
      const matched = users.find(u => {
        if (normalizedPhone) return normalizePhone(u.phone) === normalizedPhone;
        return (u.email || '').toLowerCase() === cleanEmail;
      });

      // Always return success with generic text to prevent account probing
      if (matched) {
        const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
        setLocal('foodwala_mock_reset_token', {
          userId: matched.userId,
          code: resetCode,
          expiresAt: Date.now() + (15 * 60 * 1000) // 15 mins
        });

        if (window.FOODWALA_CONFIG && window.FOODWALA_CONFIG.DEMO_MODE) {
          console.info(`%c[FoodWala Reset Code]%c Code for ${cleanId}: %c${resetCode}%c (Valid 15 mins)`,
            'color: #dc3545; font-weight: bold;', 'color: #333;', 'color: #0d6efd; font-weight: bold;', 'color: #333;');
        }
      }

      return {
        success: true,
        message: 'If an account exists with this email or mobile number, a verification code has been dispatched.'
      };
    },

    // 13. Reset Password
    resetPassword: async function (tokenOrCode, newPassword) {
      if (!/^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(newPassword)) {
        return { success: false, message: 'Password must be at least 8 characters with letters and numbers.' };
      }

      const resetData = getLocal('foodwala_mock_reset_token', null);
      if (!resetData || resetData.code !== (tokenOrCode || '').trim()) {
        return { success: false, message: 'Invalid or expired verification code.' };
      }

      if (Date.now() > resetData.expiresAt) {
        localStorage.removeItem('foodwala_mock_reset_token');
        return { success: false, message: 'Verification code has expired. Please request a new code.' };
      }

      const users = initMockUsers();
      const userIndex = users.findIndex(u => u.userId === resetData.userId);
      if (userIndex === -1) {
        return { success: false, message: 'User account not found.' };
      }

      // Update password and revoke reset token
      users[userIndex].passwordHash = mockHash(newPassword);
      users[userIndex].failedAttempts = 0;
      users[userIndex].lockedUntil = 0;
      setLocal(STORAGE_KEYS.MOCK_USERS, users);
      localStorage.removeItem('foodwala_mock_reset_token');

      return { success: true, message: 'Password reset successfully! Please sign in with your new password.' };
    },

    // 14. Sign Out
    logout: async function () {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
      localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
      window.dispatchEvent(new CustomEvent('foodwala:authChanged', { detail: null }));
      return { success: true };
    },

    // 15. Saved Addresses
    getAddresses: async function () {
      const user = getLocal(STORAGE_KEYS.CURRENT_USER, null);
      if (!user) return [];
      const key = `${STORAGE_KEYS.MOCK_ADDRESSES}_${user.userId}`;
      let addrs = getLocal(key, null);
      if (!addrs) {
        addrs = [
          {
            id: 'addr_1',
            type: 'Home',
            fullName: user.name,
            phone: user.phone || '9876543210',
            addressLine: user.address || '5th Block, Koramangala, Bengaluru, Karnataka - 560095',
            isDefault: true
          }
        ];
        setLocal(key, addrs);
      }
      return addrs;
    },

    saveAddress: async function (addressData) {
      const user = getLocal(STORAGE_KEYS.CURRENT_USER, null);
      if (!user) return { success: false, message: 'Please login to save addresses.' };
      const key = `${STORAGE_KEYS.MOCK_ADDRESSES}_${user.userId}`;
      const addrs = await this.getAddresses();
      const newAddr = {
        id: addressData.id || ('addr_' + Date.now()),
        type: addressData.type || 'Home',
        fullName: addressData.fullName || user.name,
        phone: addressData.phone || user.phone,
        addressLine: addressData.addressLine || 'Bengaluru, Karnataka',
        isDefault: addrs.length === 0 || Boolean(addressData.isDefault)
      };
      if (newAddr.isDefault) {
        addrs.forEach(a => a.isDefault = false);
      }
      addrs.push(newAddr);
      setLocal(key, addrs);
      return { success: true, address: newAddr };
    },

    deleteAddress: async function (addressId) {
      const user = getLocal(STORAGE_KEYS.CURRENT_USER, null);
      if (!user) return { success: false, message: 'Please login.' };
      const key = `${STORAGE_KEYS.MOCK_ADDRESSES}_${user.userId}`;
      let addrs = await this.getAddresses();
      addrs = addrs.filter(a => a.id !== addressId);
      setLocal(key, addrs);
      return { success: true };
    },

    setDefaultAddress: async function (addressId) {
      const user = getLocal(STORAGE_KEYS.CURRENT_USER, null);
      if (!user) return { success: false, message: 'Please login.' };
      const key = `${STORAGE_KEYS.MOCK_ADDRESSES}_${user.userId}`;
      const addrs = await this.getAddresses();
      addrs.forEach(a => a.isDefault = (a.id === addressId));
      setLocal(key, addrs);
      return { success: true };
    },

    // 16. Cart
    getCart: async function () {
      return getLocal('foodwala_cart', { restaurantId: null, items: [] });
    },

    syncCart: async function (cartData) {
      setLocal('foodwala_cart', cartData);
      return { success: true };
    },

    // 17. Coupons (Case-insensitive)
    validateCoupon: async function (code, total, userId) {
      const cleanCode = (code || '').trim().toUpperCase();
      const orderTotal = parseFloat(total) || 0;

      const coupons = {
        'FOODWALA50': { minOrder: 199, discountPercent: 50, maxDiscount: 100, desc: '50% OFF up to ₹100' },
        'WELCOME': { minOrder: 149, flatDiscount: 50, desc: 'Flat ₹50 OFF on first order' },
        'BENGALURU100': { minOrder: 499, discountPercent: 20, maxDiscount: 150, desc: '20% OFF up to ₹150' },
        'SUPER60': { minOrder: 249, discountPercent: 60, maxDiscount: 120, desc: '60% OFF up to ₹120' }
      };

      const c = coupons[cleanCode];
      if (!c) {
        return { valid: false, message: 'Invalid coupon code. Try FOODWALA50 or WELCOME.' };
      }

      if (orderTotal < c.minOrder) {
        return { valid: false, message: `Minimum order of ₹${c.minOrder} required for ${cleanCode}.` };
      }

      let discount = 0;
      if (c.flatDiscount) {
        discount = c.flatDiscount;
      } else if (c.discountPercent) {
        discount = Math.min(c.maxDiscount, Math.round((orderTotal * c.discountPercent) / 100));
      }

      return {
        valid: true,
        coupon: {
          code: cleanCode,
          discount: discount,
          description: c.desc,
          minOrder: c.minOrder
        }
      };
    },

    // 18. Orders
    placeOrder: async function (orderPayload) {
      const currentUser = getLocal(STORAGE_KEYS.CURRENT_USER, null);
      if (!currentUser) {
        return { success: false, error: 'UNAUTHORIZED', message: 'Authentication required. Please sign in to place an order.' };
      }
      const orders = getLocal(STORAGE_KEYS.MOCK_ORDERS, []);
      const orderId = orderPayload.orderId || ('FW-' + Math.floor(10000 + Math.random() * 90000));

      const newOrder = {
        ...orderPayload,
        orderId: orderId,
        id: orderId,
        displayId: `#${orderId}`,
        userId: currentUser.userId,
        customerName: currentUser.name || orderPayload.customerName,
        customerEmail: currentUser.email || orderPayload.customerEmail,
        customerPhone: currentUser.phone || orderPayload.customerPhone,
        orderDate: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        createdAtMs: Date.now(),
        status: 'ORDER_PLACED',
        deliveryStatus: 'ORDER_PLACED'
      };

      orders.unshift(newOrder);
      setLocal(STORAGE_KEYS.MOCK_ORDERS, orders);
      setLocal('foodwala_orders', orders);

      return { success: true, order: newOrder };
    },

    getOrders: async function (userId, phone) {
      const orders = getLocal(STORAGE_KEYS.MOCK_ORDERS, getLocal('foodwala_orders', []));
      const currentUser = getLocal(STORAGE_KEYS.CURRENT_USER, null);
      const effectiveId = userId || (currentUser ? currentUser.userId : null);
      const effectivePhone = phone ? normalizePhone(phone) : (currentUser ? normalizePhone(currentUser.phone) : null);

      if (!effectiveId && !effectivePhone) {
        return [];
      }

      return orders.filter(o => {
        if (effectiveId && (o.userId == effectiveId || (o.customer && o.customer.userId == effectiveId))) return true;
        if (effectivePhone && o.customerPhone && normalizePhone(o.customerPhone) === effectivePhone) return true;
        return false;
      });
    },

    getOrderById: async function (orderId) {
      const orders = await this.getOrders();
      const cleanId = String(orderId).replace(/^#/, '');
      return orders.find(o => String(o.orderId || o.id).replace(/^#/, '') === cleanId) || null;
    },

    // 19. Admin Audits
    getAdminUsers: async function () {
      const users = initMockUsers();
      const mapped = users.map(u => ({
        user_id: u.userId,
        userId: u.userId,
        username: u.username || u.name,
        name: u.name || u.username,
        email: u.email,
        phone: u.phone,
        role: (u.role || 'customer').toLowerCase(),
        total_orders: u.total_orders || (u.role === 'customer' ? 3 : (u.role === 'admin' ? 1 : 0)),
        totalOrders: u.total_orders || (u.role === 'customer' ? 3 : (u.role === 'admin' ? 1 : 0)),
        total_spent: u.total_spent || (u.role === 'customer' ? 1240.50 : 0),
        totalSpent: u.total_spent || (u.role === 'customer' ? 1240.50 : 0),
        last_login: u.lastLogin || new Date().toISOString(),
        lastLogin: u.lastLogin || new Date().toISOString(),
        failed_attempts: u.failedAttempts || 0,
        failedAttempts: u.failedAttempts || 0,
        locked_until: u.lockedUntil || null,
        lockedUntil: u.lockedUntil || null
      }));
      return { success: true, users: mapped };
    },

    getAdminOrders: async function () {
      let orders = await this.getOrders();
      if (!orders || orders.length === 0) {
        orders = [
          {
            order_id: 1001,
            orderId: 1001,
            customer_name: 'Rahul Sharma (Customer)',
            customerName: 'Rahul Sharma (Customer)',
            customer_phone: '9876543210',
            customerPhone: '9876543210',
            restaurant_name: 'Vidyarthi Bhavan',
            restaurantName: 'Vidyarthi Bhavan',
            total_amount: 450.00,
            totalAmount: 450.00,
            payment_mode: 'UPI',
            paymentMode: 'UPI',
            payment_status: 'PAID',
            paymentStatus: 'PAID',
            status: 'DELIVERED',
            order_date: new Date(Date.now() - 3600000).toISOString(),
            orderDate: new Date(Date.now() - 3600000).toISOString()
          },
          {
            order_id: 1002,
            orderId: 1002,
            customer_name: 'Vishnu Vardhan Reddy',
            customerName: 'Vishnu Vardhan Reddy',
            customer_phone: '6301382491',
            customerPhone: '6301382491',
            restaurant_name: 'Meghana Foods',
            restaurantName: 'Meghana Foods',
            total_amount: 790.00,
            totalAmount: 790.00,
            payment_mode: 'Razorpay',
            paymentMode: 'Razorpay',
            payment_status: 'PAID',
            paymentStatus: 'PAID',
            status: 'DELIVERED',
            order_date: new Date(Date.now() - 7200000).toISOString(),
            orderDate: new Date(Date.now() - 7200000).toISOString()
          },
          {
            order_id: 1003,
            orderId: 1003,
            customer_name: 'Ananya Sharma',
            customerName: 'Ananya Sharma',
            customer_phone: '9848012345',
            customerPhone: '9848012345',
            restaurant_name: 'CTR Shri Sagar',
            restaurantName: 'CTR Shri Sagar',
            total_amount: 320.00,
            totalAmount: 320.00,
            payment_mode: 'Cash On Delivery',
            paymentMode: 'Cash On Delivery',
            payment_status: 'PAID',
            paymentStatus: 'PAID',
            status: 'PREPARING',
            order_date: new Date(Date.now() - 900000).toISOString(),
            orderDate: new Date(Date.now() - 900000).toISOString()
          }
        ];
      }
      const totalRev = orders.reduce((acc, o) => acc + (Number(o.total_amount || o.totalAmount || o.total) || 0), 0);
      return {
        success: true,
        orders: orders,
        totalOrders: orders.length,
        totalRevenue: totalRev
      };
    },

    getAdminLoginHistory: async function () {
      let history = getLocal(STORAGE_KEYS.LOGIN_HISTORY, []);
      if (!history || history.length === 0) {
        history = [
          { id: 1, login_time: new Date().toISOString(), loginTime: new Date().toISOString(), username: 'Administrator', email: 'admin@example.com', phone: '9876543229', ip_address: '127.0.0.1', ipAddress: '127.0.0.1', status: 'SUCCESS' },
          { id: 2, login_time: new Date(Date.now() - 1800000).toISOString(), loginTime: new Date(Date.now() - 1800000).toISOString(), username: 'Rahul Sharma', email: 'customer@foodwala.com', phone: '9876543210', ip_address: '127.0.0.1', ipAddress: '127.0.0.1', status: 'SUCCESS' },
          { id: 3, login_time: new Date(Date.now() - 7200000).toISOString(), loginTime: new Date(Date.now() - 7200000).toISOString(), username: 'VISHNU', email: 'vishnuvardhanreddych45@gmail.com', phone: '6301382491', ip_address: '127.0.0.1', ipAddress: '127.0.0.1', status: 'SUCCESS' },
          { id: 4, login_time: new Date(Date.now() - 10800000).toISOString(), loginTime: new Date(Date.now() - 10800000).toISOString(), username: 'FoodWala Administrator', email: 'admin@foodwala.com', phone: '9876543222', ip_address: '127.0.0.1', ipAddress: '127.0.0.1', status: 'SUCCESS' }
        ];
      }
      return {
        success: true,
        history: history
      };
    },

    // 20. Restaurant Partner Management (Mock)
    getRestaurantDetails: async function (restaurantId) {
      let rests = null;
      try { rests = await this.getRestaurants(); } catch (e) {}
      const rId = parseInt(restaurantId, 10) || 2;
      let r = (Array.isArray(rests) && rests.find(x => (x.restaurantId === rId || x.id === rId))) || null;
      if (!r) {
        r = {
          restaurant_id: 2,
          restaurantId: 2,
          name: 'Vidyarthi Bhavan',
          cuisine_type: 'South Indian, Crispy Dosas',
          address: 'Gandhi Bazaar Main Road, Basavanagudi, Bengaluru',
          phone: '+91 80 2667 7588',
          rating: 4.8,
          is_open: 1,
          isOpen: true,
          image_path: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=400&q=75'
        };
      }
      return { success: true, restaurant: r };
    },

    getRestaurantManageMenu: async function (restaurantId) {
      const details = await this.getRestaurantDetails(restaurantId);
      const r = details.restaurant;
      const rId = r.restaurantId || r.restaurant_id || 2;

      const key = 'foodwala_mock_restaurant_menu_' + rId;
      let menu = getLocal(key, null);
      if (!menu || menu.length === 0) {
        menu = [
          {
            menu_id: 1, menuId: 1, restaurant_id: rId, restaurantId: rId,
            item_name: 'Benne Masala Dosa', name: 'Benne Masala Dosa',
            description: 'Crispy golden crepe roasted in pure butter, stuffed with spiced potato mash.',
            price: 95, is_available: 1, isAvailable: true,
            category_name: 'Crispy Dosas', category: 'Crispy Dosas',
            is_veg: 1, isVeg: true,
            image_path: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=400&q=75',
            imagePath: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=400&q=75'
          },
          {
            menu_id: 2, menuId: 2, restaurant_id: rId, restaurantId: rId,
            item_name: 'Mangalore Bajji (Goli Baje)', name: 'Mangalore Bajji (Goli Baje)',
            description: 'Crispy golden fried flour fritters served with coconut chutney.',
            price: 55, is_available: 1, isAvailable: true,
            category_name: 'Breakfast Specials', category: 'Breakfast Specials',
            is_veg: 1, isVeg: true,
            image_path: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=400&q=75',
            imagePath: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=400&q=75'
          },
          {
            menu_id: 3, menuId: 3, restaurant_id: rId, restaurantId: rId,
            item_name: 'Degree Filter Coffee', name: 'Degree Filter Coffee',
            description: 'Authentic south Indian chicory-infused hot brewed frothy coffee.',
            price: 35, is_available: 1, isAvailable: true,
            category_name: 'Beverages', category: 'Beverages',
            is_veg: 1, isVeg: true,
            image_path: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=400&q=75',
            imagePath: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=400&q=75'
          },
          {
            menu_id: 4, menuId: 4, restaurant_id: rId, restaurantId: rId,
            item_name: 'Steamed Idli (2 pcs)', name: 'Steamed Idli (2 pcs)',
            description: 'Soft melt-in-mouth steamed rice cakes served with hot sambar and chutney.',
            price: 50, is_available: 1, isAvailable: true,
            category_name: 'Breakfast Specials', category: 'Breakfast Specials',
            is_veg: 1, isVeg: true,
            image_path: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=400&q=75',
            imagePath: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=400&q=75'
          },
          {
            menu_id: 5, menuId: 5, restaurant_id: rId, restaurantId: rId,
            item_name: 'Rava Onion Dosa', name: 'Rava Onion Dosa',
            description: 'Crisp semolina crepe laced with chopped shallots, green chillies & cumin.',
            price: 110, is_available: 0, isAvailable: false,
            category_name: 'Crispy Dosas', category: 'Crispy Dosas',
            is_veg: 1, isVeg: true,
            image_path: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=400&q=75',
            imagePath: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=400&q=75'
          }
        ];
        setLocal(key, menu);
      }

      const totalItems = menu.length;
      const availableItems = menu.filter(m => m.is_available === 1 || m.isAvailable === true).length;
      const outOfStockItems = totalItems - availableItems;
      const categories = [...new Set(menu.map(m => m.category_name || m.category).filter(Boolean))];

      return {
        success: true,
        restaurant: r,
        menu,
        stats: {
          totalItems,
          availableItems,
          outOfStockItems,
          categoriesCount: categories.length
        },
        categories
      };
    },

    addMenuItem: async function (itemData) {
      const rId = parseInt(itemData.restaurantId || itemData.restaurant_id, 10) || 2;
      const key = 'foodwala_mock_restaurant_menu_' + rId;
      const menu = getLocal(key, []);
      const newId = Date.now();
      const newItem = {
        menu_id: newId,
        menuId: newId,
        restaurant_id: rId,
        restaurantId: rId,
        item_name: itemData.itemName || itemData.item_name,
        name: itemData.itemName || itemData.item_name,
        description: itemData.description || '',
        price: parseFloat(itemData.price),
        is_available: 1,
        isAvailable: true,
        category_name: itemData.categoryName || itemData.category_name || 'Main Course',
        category: itemData.categoryName || itemData.category_name || 'Main Course',
        is_veg: itemData.is_veg !== undefined ? (itemData.is_veg ? 1 : 0) : (itemData.isVeg ? 1 : 0),
        isVeg: itemData.is_veg !== undefined ? Boolean(itemData.is_veg) : Boolean(itemData.isVeg),
        image_path: itemData.imagePath || itemData.image_path || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=75',
        imagePath: itemData.imagePath || itemData.image_path || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=75'
      };
      menu.push(newItem);
      setLocal(key, menu);
      return { success: true, message: `Dish "${newItem.item_name}" added to menu.`, item: newItem };
    },

    updateMenuItem: async function (menuId, itemData) {
      const mId = parseInt(menuId, 10);
      for (let rId of [1, 2, 3]) {
        const key = 'foodwala_mock_restaurant_menu_' + rId;
        const menu = getLocal(key, []);
        const idx = menu.findIndex(m => (m.menu_id === mId || m.menuId === mId));
        if (idx !== -1) {
          const cur = menu[idx];
          if (itemData.price !== undefined) cur.price = parseFloat(itemData.price);
          if (itemData.itemName || itemData.item_name) {
            cur.item_name = itemData.itemName || itemData.item_name;
            cur.name = cur.item_name;
          }
          if (itemData.description !== undefined) cur.description = itemData.description;
          if (itemData.categoryName || itemData.category_name) {
            cur.category_name = itemData.categoryName || itemData.category_name;
            cur.category = cur.category_name;
          }
          if (itemData.isVeg !== undefined || itemData.is_veg !== undefined) {
            cur.isVeg = itemData.is_veg !== undefined ? Boolean(itemData.is_veg) : Boolean(itemData.isVeg);
            cur.is_veg = cur.isVeg ? 1 : 0;
          }
          if (itemData.imagePath || itemData.image_path) {
            cur.image_path = itemData.imagePath || itemData.image_path;
            cur.imagePath = cur.image_path;
          }
          if (itemData.isAvailable !== undefined || itemData.is_available !== undefined) {
            cur.isAvailable = itemData.is_available !== undefined ? Boolean(itemData.is_available) : Boolean(itemData.isAvailable);
            cur.is_available = cur.isAvailable ? 1 : 0;
          }
          menu[idx] = cur;
          setLocal(key, menu);
          return { success: true, message: 'Item updated successfully.', item: cur };
        }
      }
      return { success: true, message: 'Item updated.', item: itemData };
    },

    toggleItemAvailability: async function (menuId, isAvailable) {
      const mId = parseInt(menuId, 10);
      for (let rId of [1, 2, 3]) {
        const key = 'foodwala_mock_restaurant_menu_' + rId;
        const menu = getLocal(key, []);
        const idx = menu.findIndex(m => (m.menu_id === mId || m.menuId === mId));
        if (idx !== -1) {
          const cur = menu[idx];
          const newAvail = isAvailable !== undefined ? Boolean(isAvailable) : !cur.isAvailable;
          cur.isAvailable = newAvail;
          cur.is_available = newAvail ? 1 : 0;
          menu[idx] = cur;
          setLocal(key, menu);
          return {
            success: true,
            menuId: mId,
            isAvailable: newAvail,
            is_available: newAvail ? 1 : 0,
            message: newAvail ? `"${cur.item_name}" marked In Stock` : `"${cur.item_name}" marked Out of Stock`
          };
        }
      }
      return { success: true, menuId: mId, isAvailable, message: 'Availability updated' };
    },

    deleteMenuItem: async function (menuId) {
      const mId = parseInt(menuId, 10);
      for (let rId of [1, 2, 3]) {
        const key = 'foodwala_mock_restaurant_menu_' + rId;
        const menu = getLocal(key, []);
        const filtered = menu.filter(m => (m.menu_id !== mId && m.menuId !== mId));
        if (filtered.length !== menu.length) {
          setLocal(key, filtered);
          return { success: true, message: 'Dish removed from menu.' };
        }
      }
      return { success: true, message: 'Dish removed.' };
    },

    toggleRestaurantStatus: async function (restaurantId, isOpen) {
      return { success: true, isOpen: Boolean(isOpen), is_open: isOpen ? 1 : 0 };
    },

    getRestaurantOrders: async function (restaurantId) {
      const allOrders = await this.getAdminOrders();
      return {
        success: true,
        orders: (allOrders && allOrders.orders) ? allOrders.orders : []
      };
    },

    updateRestaurantOrderStatus: async function (orderId, status) {
      return { success: true, orderId, status, message: `Order status set to ${status}` };
    }
  };

  window.FoodWalaAdapters.mock = mockAdapter;

})(typeof window !== 'undefined' ? window : this);

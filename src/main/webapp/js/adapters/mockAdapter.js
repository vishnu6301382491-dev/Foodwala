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
    if (!users || !Array.isArray(users) || users.length === 0) {
      users = [
        {
          userId: 1,
          name: 'VISHNU',
          username: 'VISHNU',
          email: 'vishnuvardhanreddych45@gmail.com',
          phone: '6301382491',
          role: 'customer',
          passwordHash: mockHash('Password@123'),
          address: 'Bengaluru Central, Karnataka - 560001',
          memberSince: 'March 2026',
          failedAttempts: 0,
          lockedUntil: 0
        },
        {
          userId: 2,
          name: 'FoodWala Admin',
          username: 'FoodWala Admin',
          email: 'admin@foodwala.com',
          phone: '9876543222',
          role: 'admin',
          passwordHash: mockHash('AdminPass123'),
          address: 'FoodWala HQ, MG Road, Bengaluru, Karnataka - 560001',
          memberSince: 'January 2026',
          failedAttempts: 0,
          lockedUntil: 0
        },
        {
          userId: 3,
          name: 'Vidyarthi Bhavan',
          username: 'Vidyarthi Bhavan Manager',
          email: 'vidyarthi@foodwala.com',
          phone: '9876543211',
          role: 'restaurant',
          passwordHash: mockHash('Restaurant123'),
          address: 'Gandhi Bazaar, Basavanagudi, Bengaluru - 560004',
          memberSince: 'February 2026',
          failedAttempts: 0,
          lockedUntil: 0
        },
        {
          userId: 4,
          name: 'Ramesh Kumar',
          username: 'Ramesh Kumar',
          email: 'ramesh@foodwala.com',
          phone: '9876543220',
          role: 'partner',
          passwordHash: mockHash('Partner123'),
          address: 'Jayanagar 4th Block, Bengaluru - 560011',
          memberSince: 'February 2026',
          failedAttempts: 0,
          lockedUntil: 0
        }
      ];
      setLocal(STORAGE_KEYS.MOCK_USERS, users);
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
        phone: normalized
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
      if (!activeOtp || activeOtp.phone !== normalized) {
        return { success: false, error: 'EXPIRED_OTP', message: 'No active OTP request found. Please request a new OTP.' };
      }

      if (Date.now() > activeOtp.expiresAt) {
        localStorage.removeItem(STORAGE_KEYS.ACTIVE_OTP);
        return { success: false, error: 'EXPIRED_OTP', message: 'OTP has expired. Please request a new code.' };
      }

      if (activeOtp.attempts >= 3) {
        localStorage.removeItem(STORAGE_KEYS.ACTIVE_OTP);
        return { success: false, error: 'MAX_ATTEMPTS', message: 'Too many incorrect attempts. Please request a new OTP.' };
      }

      if (activeOtp.code !== cleanCode) {
        activeOtp.attempts += 1;
        if (activeOtp.attempts >= 3) {
          localStorage.removeItem(STORAGE_KEYS.ACTIVE_OTP);
          return { success: false, error: 'MAX_ATTEMPTS', message: 'Too many incorrect attempts. Please request a new OTP.' };
        }
        setLocal(STORAGE_KEYS.ACTIVE_OTP, activeOtp);
        const rem = 3 - activeOtp.attempts;
        return { success: false, error: 'WRONG_OTP', message: `Incorrect OTP code. ${rem} attempt(s) remaining.` };
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
        role: 'customer',
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

      // Verify password hash
      const inputHash = mockHash(password);
      const isPassValid = (user.passwordHash === inputHash) || (user.passwordHash === password) || (user.password === password);
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
      return users.map(u => ({
        userId: u.userId,
        name: u.name,
        email: u.email,
        phone: u.phone,
        role: u.role,
        lastLogin: u.lastLogin || u.memberSince,
        failedAttempts: u.failedAttempts || 0,
        lockedUntil: u.lockedUntil || null
      }));
    },

    getAdminOrders: async function () {
      return await this.getOrders();
    },

    getAdminLoginHistory: async function () {
      return getLocal(STORAGE_KEYS.LOGIN_HISTORY, []);
    }
  };

  window.FoodWalaAdapters.mock = mockAdapter;

})(typeof window !== 'undefined' ? window : this);

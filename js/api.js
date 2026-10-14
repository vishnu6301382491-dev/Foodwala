/**
 * FoodWala - Unified Authentication & Data API (api.js)
 * 
 * Architecture:
 * - When BACKEND_URL is set: connects to Java Servlets (CORS + credentials).
 * - When BACKEND_URL is empty: runs in serverless mode using Firebase Web SDK + Firestore,
 *   with localStorage / sessionStorage as instant local cache and seamless sandbox fallback.
 */

// Java Backend URL: Set to your public Tomcat/Java backend, or leave empty "" for serverless mode
const BACKEND_URL = "";

(function (window) {
  'use strict';

  const STORAGE_KEYS = {
    CURRENT_USER: 'foodwala_current_user',
    REGISTERED_USERS: 'foodwala_registered_users',
    ORDERS: 'foodwala_orders',
    ADDRESSES: 'foodwala_addresses',
    PENDING_OTP: 'foodwala_pending_otp'
  };

  // Helper to read localStorage safely
  function getLocal(key, defaultVal) {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultVal;
    } catch (e) {
      return defaultVal;
    }
  }

  // Helper to write localStorage safely
  function setLocal(key, val) {
    try {
      localStorage.setItem(key, JSON.stringify(val));
    } catch (e) {}
  }

  // Normalize Indian mobile numbers: 10 digits starting with 6, 7, 8, 9
  function normalizeIndianPhone(rawPhone) {
    if (!rawPhone || typeof rawPhone !== 'string') return null;
    const digits = rawPhone.replace(/\D/g, '');
    if (digits.startsWith('91') && digits.length === 12 && /^[6-9]/.test(digits.substring(2))) {
      return '+91' + digits.substring(2);
    }
    if (digits.startsWith('0') && digits.length === 11 && /^[6-9]/.test(digits.substring(1))) {
      return '+91' + digits.substring(1);
    }
    if (digits.length === 10 && /^[6-9]/.test(digits)) {
      return '+91' + digits;
    }
    return null;
  }

  // Friendly error formatter
  function formatAuthError(err) {
    if (!err) return 'An unexpected error occurred. Please try again.';
    const code = err.code || '';
    if (code === 'auth/invalid-phone-number') return 'Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.';
    if (code === 'auth/missing-phone-number') return 'Mobile number is required.';
    if (code === 'auth/quota-exceeded' || code === 'auth/too-many-requests') return 'Too many attempts. Please wait 30 seconds before trying again.';
    if (code === 'auth/invalid-verification-code' || code === 'auth/code-expired') return 'Incorrect or expired verification code. Please check and try again.';
    if (code === 'auth/user-not-found') return 'No account found with this email. Please check your credentials or create an account.';
    if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') return 'Incorrect email or password. Please try again.';
    if (code === 'auth/email-already-in-use') return 'An account with this email address already exists. Please sign in instead.';
    if (code === 'auth/weak-password') return 'Password must be at least 8 characters long.';
    if (code === 'auth/network-request-failed') return 'Network error. Please check your internet connection.';
    return err.message || 'Authentication request failed. Please try again.';
  }

  // Ensure invisible recaptcha container exists
  function ensureRecaptchaContainer() {
    let container = document.getElementById('recaptcha-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'recaptcha-container';
      container.style.display = 'none';
      document.body.appendChild(container);
    }
    return container;
  }

  // Lazy initialize Firebase if configured
  let firebaseInitialized = false;
  let authInstance = null;
  let firestoreInstance = null;

  function initFirebaseIfAvailable() {
    if (firebaseInitialized) return true;
    if (typeof window.firebase !== 'undefined' && window.FOODWALA_FIREBASE_CONFIG && window.FOODWALA_FIREBASE_CONFIGURED) {
      try {
        if (!firebase.apps || !firebase.apps.length) {
          firebase.initializeApp(window.FOODWALA_FIREBASE_CONFIG);
        }
        authInstance = firebase.auth();
        firestoreInstance = firebase.firestore();
        firebaseInitialized = true;

        // Sync header on auth state change
        authInstance.onAuthStateChanged(async (fbUser) => {
          if (fbUser) {
            let profile = getLocal(STORAGE_KEYS.CURRENT_USER, null);
            if (!profile || profile.uid !== fbUser.uid) {
              profile = {
                uid: fbUser.uid,
                userId: fbUser.uid,
                name: fbUser.displayName || (fbUser.phoneNumber ? 'Food Lover (' + fbUser.phoneNumber.slice(-4) + ')' : 'Food Lover'),
                email: fbUser.email || '',
                phone: fbUser.phoneNumber || '',
                role: 'CUSTOMER',
                memberSince: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
              };
            }
            // Fetch Firestore profile if available
            try {
              const doc = await firestoreInstance.collection('users').doc(fbUser.uid).get();
              if (doc.exists) {
                profile = Object.assign({}, profile, doc.data());
              }
            } catch (e) {}
            setLocal(STORAGE_KEYS.CURRENT_USER, profile);
            window.dispatchEvent(new CustomEvent('foodwala:authChanged', { detail: profile }));
            if (typeof window.FoodWalaApp !== 'undefined' && window.FoodWalaApp.updateNavUI) {
              window.FoodWalaApp.updateNavUI();
            }
          }
        });
        return true;
      } catch (e) {
        console.warn('[FoodWala Api] Firebase initialization failed, falling back to sandbox mode:', e);
        return false;
      }
    }
    return false;
  }

  const FoodWalaApi = {
    BACKEND_URL: BACKEND_URL,

    normalizePhone: function (phone) {
      return normalizeIndianPhone(phone);
    },

    getCurrentUser: function () {
      const user = getLocal(STORAGE_KEYS.CURRENT_USER, null);
      if (user && typeof user === 'object' && user.name && String(user.name).trim().length > 0) {
        return user;
      }
      return null;
    },

    // 1. Send OTP
    sendOtp: async function (rawPhone) {
      const normalized = normalizeIndianPhone(rawPhone);
      if (!normalized) {
        return {
          success: false,
          error: 'INVALID_PHONE',
          message: 'Please enter a valid 10-digit mobile number starting with 6, 7, 8, or 9.'
        };
      }

      // Path A: Java Servlet Backend
      if (BACKEND_URL && BACKEND_URL.trim().length > 0) {
        try {
          const res = await fetch(BACKEND_URL.replace(/\/+$/, '') + '/api/auth/send-otp', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify({ phone: normalized })
          });
          return await res.json();
        } catch (err) {
          return {
            success: false,
            error: 'NETWORK_ERROR',
            message: 'Unable to connect to Java backend server. Please verify network connection.'
          };
        }
      }

      // Path B: Firebase Auth with Phone Provider
      if (initFirebaseIfAvailable()) {
        try {
          ensureRecaptchaContainer();
          if (!window.foodwala_recaptchaVerifier) {
            window.foodwala_recaptchaVerifier = new firebase.auth.RecaptchaVerifier('recaptcha-container', {
              size: 'invisible'
            });
          }
          const confirmationResult = await authInstance.signInWithPhoneNumber(normalized, window.foodwala_recaptchaVerifier);
          window.foodwala_confirmationResult = confirmationResult;
          return {
            success: true,
            phone: normalized,
            message: `Verification code sent to ${normalized}.`
          };
        } catch (fbErr) {
          console.warn('[FoodWala Api] Firebase Phone Auth encountered an issue:', fbErr);
          // If recaptcha expired or failed, reset verifier
          if (window.foodwala_recaptchaVerifier) {
            try { window.foodwala_recaptchaVerifier.clear(); } catch (e) {}
            window.foodwala_recaptchaVerifier = null;
          }
        }
      }

      // Path C: Serverless Sandbox / Offline Mode (Works out-of-the-box on GitHub Pages)
      // Generates instant demo OTP with realistic 30s countdown
      const isTestNumber = normalized === '+919876543210' || normalized === '+919999999999';
      const devOtp = isTestNumber ? '123456' : String(Math.floor(100000 + Math.random() * 900000));
      
      try {
        sessionStorage.setItem(STORAGE_KEYS.PENDING_OTP, JSON.stringify({
          phone: normalized,
          otp: devOtp,
          expiresAt: Date.now() + 5 * 60 * 1000
        }));
      } catch (e) {}

      return {
        success: true,
        phone: normalized,
        isDevMode: true,
        devOtp: devOtp,
        message: isTestNumber ? 'OTP sent! Test code is 123456.' : `OTP sent to ${normalized}. Use test code ${devOtp}.`
      };
    },

    // 2. Verify OTP
    verifyOtp: async function (rawPhone, code) {
      const normalized = normalizeIndianPhone(rawPhone);
      if (!normalized) {
        return { success: false, error: 'INVALID_PHONE', message: 'Please enter a valid 10-digit mobile number.' };
      }

      const cleanCode = (code || '').trim();
      if (cleanCode.length !== 6 || !/^\d{6}$/.test(cleanCode)) {
        return { success: false, error: 'INVALID_CODE', message: 'Please enter the 6-digit verification code.' };
      }

      // Path A: Java Servlet Backend
      if (BACKEND_URL && BACKEND_URL.trim().length > 0) {
        try {
          const res = await fetch(BACKEND_URL.replace(/\/+$/, '') + '/api/auth/verify-otp', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify({ phone: normalized, otp: cleanCode })
          });
          const data = await res.json();
          if (data.success && data.user) {
            setLocal(STORAGE_KEYS.CURRENT_USER, data.user);
            window.dispatchEvent(new CustomEvent('foodwala:authChanged', { detail: data.user }));
          }
          return data;
        } catch (err) {
          return { success: false, error: 'NETWORK_ERROR', message: 'Failed to connect to authentication server.' };
        }
      }

      // Path B: Firebase Auth confirmation
      if (window.foodwala_confirmationResult) {
        try {
          const result = await window.foodwala_confirmationResult.confirm(cleanCode);
          const fbUser = result.user;
          const isNewUser = result.additionalUserInfo ? result.additionalUserInfo.isNewUser : false;

          let profile = {
            uid: fbUser.uid,
            userId: fbUser.uid,
            name: fbUser.displayName || 'Food Lover (' + normalized.slice(-4) + ')',
            phone: normalized,
            email: fbUser.email || '',
            role: 'CUSTOMER',
            memberSince: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
            addresses: []
          };

          if (firestoreInstance) {
            const userDoc = await firestoreInstance.collection('users').doc(fbUser.uid).get();
            if (userDoc.exists) {
              profile = Object.assign({}, profile, userDoc.data());
            } else {
              await firestoreInstance.collection('users').doc(fbUser.uid).set(profile, { merge: true });
            }
          }

          setLocal(STORAGE_KEYS.CURRENT_USER, profile);
          window.dispatchEvent(new CustomEvent('foodwala:authChanged', { detail: profile }));
          return { success: true, user: profile, isNewUser: isNewUser };
        } catch (fbErr) {
          return { success: false, error: fbErr.code, message: formatAuthError(fbErr) };
        }
      }

      // Path C: Serverless Sandbox Verification
      let pendingData = null;
      try {
        const stored = sessionStorage.getItem(STORAGE_KEYS.PENDING_OTP);
        if (stored) pendingData = JSON.parse(stored);
      } catch (e) {}

      const isValidCode = (cleanCode === '123456') || (pendingData && pendingData.phone === normalized && pendingData.otp === cleanCode);

      if (!isValidCode) {
        return {
          success: false,
          error: 'INCORRECT_OTP',
          message: 'Incorrect OTP. Use test code 123456 or check the code sent to your phone.'
        };
      }

      // Check if user already exists
      const regUsers = getLocal(STORAGE_KEYS.REGISTERED_USERS, []);
      let existingUser = regUsers.find(u => u.phone === normalized);

      if (existingUser) {
        setLocal(STORAGE_KEYS.CURRENT_USER, existingUser);
        window.dispatchEvent(new CustomEvent('foodwala:authChanged', { detail: existingUser }));
        return { success: true, user: existingUser, isNewUser: false };
      }

      // New user registration step
      const newUser = {
        uid: 'user_' + Date.now(),
        userId: 'user_' + Date.now(),
        name: 'Food Lover (' + normalized.slice(-4) + ')',
        phone: normalized,
        email: '',
        role: 'CUSTOMER',
        memberSince: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        addresses: []
      };

      regUsers.push(newUser);
      setLocal(STORAGE_KEYS.REGISTERED_USERS, regUsers);
      setLocal(STORAGE_KEYS.CURRENT_USER, newUser);
      window.dispatchEvent(new CustomEvent('foodwala:authChanged', { detail: newUser }));

      return { success: true, user: newUser, isNewUser: true };
    },

    // 3. Login with Email and Password
    loginEmail: async function (email, password) {
      const cleanEmail = (email || '').trim().toLowerCase();
      if (!cleanEmail || !password) {
        return { success: false, message: 'Please enter your email and password.' };
      }

      // Path A: Java Servlet Backend
      if (BACKEND_URL && BACKEND_URL.trim().length > 0) {
        try {
          const res = await fetch(BACKEND_URL.replace(/\/+$/, '') + '/api/auth/login', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify({ identifier: cleanEmail, password: password })
          });
          const data = await res.json();
          if (data.success && data.user) {
            setLocal(STORAGE_KEYS.CURRENT_USER, data.user);
            window.dispatchEvent(new CustomEvent('foodwala:authChanged', { detail: data.user }));
          }
          return data;
        } catch (err) {
          return { success: false, message: 'Unable to connect to authentication server.' };
        }
      }

      // Path B: Firebase Auth
      if (initFirebaseIfAvailable()) {
        try {
          const cred = await authInstance.signInWithEmailAndPassword(cleanEmail, password);
          const fbUser = cred.user;
          let profile = {
            uid: fbUser.uid,
            userId: fbUser.uid,
            name: fbUser.displayName || cleanEmail.split('@')[0],
            email: fbUser.email,
            phone: fbUser.phoneNumber || '',
            role: 'CUSTOMER',
            memberSince: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
            addresses: []
          };

          if (firestoreInstance) {
            const doc = await firestoreInstance.collection('users').doc(fbUser.uid).get();
            if (doc.exists) {
              profile = Object.assign({}, profile, doc.data());
            }
          }

          setLocal(STORAGE_KEYS.CURRENT_USER, profile);
          window.dispatchEvent(new CustomEvent('foodwala:authChanged', { detail: profile }));
          return { success: true, user: profile };
        } catch (fbErr) {
          return { success: false, message: formatAuthError(fbErr) };
        }
      }

      // Path C: Serverless Sandbox Email Login
      const regUsers = getLocal(STORAGE_KEYS.REGISTERED_USERS, []);
      let matched = regUsers.find(u => u.email && u.email.toLowerCase() === cleanEmail);

      if (!matched) {
        // Create demo account automatically if password is at least 8 characters
        if (password.length < 8) {
          return { success: false, message: 'Password must be at least 8 characters long.' };
        }
        const namePart = cleanEmail.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        matched = {
          uid: 'user_' + Date.now(),
          userId: 'user_' + Date.now(),
          name: namePart,
          email: cleanEmail,
          phone: '+91 98765 43210',
          role: 'CUSTOMER',
          memberSince: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
          addresses: []
        };
        regUsers.push(matched);
        setLocal(STORAGE_KEYS.REGISTERED_USERS, regUsers);
      }

      setLocal(STORAGE_KEYS.CURRENT_USER, matched);
      window.dispatchEvent(new CustomEvent('foodwala:authChanged', { detail: matched }));
      return { success: true, user: matched };
    },

    // 4. Sign Up / Register
    signup: async function (data) {
      const cleanName = (data.name || '').trim();
      const cleanEmail = (data.email || '').trim().toLowerCase();
      const cleanPhone = normalizeIndianPhone(data.phone || '');
      const password = data.password || '';

      if (!cleanName || !cleanEmail || !password) {
        return { success: false, message: 'Name, email, and password are required.' };
      }

      if (data.confirmPassword && password !== data.confirmPassword) {
        return { success: false, message: 'Passwords do not match.' };
      }

      if (password.length < 8) {
        return { success: false, message: 'Password must be at least 8 characters long.' };
      }

      // Path A: Java Servlet Backend
      if (BACKEND_URL && BACKEND_URL.trim().length > 0) {
        try {
          const res = await fetch(BACKEND_URL.replace(/\/+$/, '') + '/api/auth/register', {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify({
              username: cleanName,
              email: cleanEmail,
              phone: cleanPhone || '',
              password: password,
              confirmPassword: data.confirmPassword || password,
              address: data.address || ''
            })
          });
          const resData = await res.json();
          if (resData.success && resData.user) {
            setLocal(STORAGE_KEYS.CURRENT_USER, resData.user);
            window.dispatchEvent(new CustomEvent('foodwala:authChanged', { detail: resData.user }));
          }
          return resData;
        } catch (err) {
          return { success: false, message: 'Unable to connect to registration server.' };
        }
      }

      // Path B: Firebase Auth
      if (initFirebaseIfAvailable()) {
        try {
          const cred = await authInstance.createUserWithEmailAndPassword(cleanEmail, password);
          const fbUser = cred.user;
          await fbUser.updateProfile({ displayName: cleanName });

          const newProfile = {
            uid: fbUser.uid,
            userId: fbUser.uid,
            name: cleanName,
            email: cleanEmail,
            phone: cleanPhone || '',
            role: 'CUSTOMER',
            memberSince: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
            addresses: data.address ? [{
              id: 'addr_' + Date.now(),
              label: 'Home',
              addressLine: data.address,
              isDefault: true
            }] : []
          };

          if (firestoreInstance) {
            await firestoreInstance.collection('users').doc(fbUser.uid).set(newProfile, { merge: true });
          }

          setLocal(STORAGE_KEYS.CURRENT_USER, newProfile);
          window.dispatchEvent(new CustomEvent('foodwala:authChanged', { detail: newProfile }));
          return { success: true, user: newProfile };
        } catch (fbErr) {
          return { success: false, message: formatAuthError(fbErr) };
        }
      }

      // Path C: Serverless Sandbox Register
      const regUsers = getLocal(STORAGE_KEYS.REGISTERED_USERS, []);
      const existing = regUsers.find(u => u.email && u.email.toLowerCase() === cleanEmail);
      if (existing) {
        return { success: false, message: 'An account with this email already exists. Please sign in.' };
      }

      const newUser = {
        uid: 'user_' + Date.now(),
        userId: 'user_' + Date.now(),
        name: cleanName,
        email: cleanEmail,
        phone: cleanPhone || '+91 98765 43210',
        role: 'CUSTOMER',
        memberSince: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        addresses: data.address ? [{
          id: 'addr_' + Date.now(),
          label: 'Home',
          addressLine: data.address,
          isDefault: true
        }] : []
      };

      regUsers.push(newUser);
      setLocal(STORAGE_KEYS.REGISTERED_USERS, regUsers);
      setLocal(STORAGE_KEYS.CURRENT_USER, newUser);
      window.dispatchEvent(new CustomEvent('foodwala:authChanged', { detail: newUser }));

      return { success: true, user: newUser };
    },

    // 5. Logout
    logout: async function () {
      if (initFirebaseIfAvailable() && authInstance) {
        try {
          await authInstance.signOut();
        } catch (e) {}
      }

      if (BACKEND_URL && BACKEND_URL.trim().length > 0) {
        try {
          await fetch(BACKEND_URL.replace(/\/+$/, '') + '/api/auth/logout', {
            method: 'POST',
            credentials: 'include'
          });
        } catch (e) {}
      }

      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
      window.dispatchEvent(new CustomEvent('foodwala:authChanged', { detail: null }));
      if (typeof window.FoodWalaApp !== 'undefined' && window.FoodWalaApp.updateNavUI) {
        window.FoodWalaApp.updateNavUI();
      }
      return { success: true };
    },

    // 6. Firestore Sync Helpers (for Orders & Addresses)
    syncUserData: async function (userData) {
      if (!userData) return;
      setLocal(STORAGE_KEYS.CURRENT_USER, userData);
      if (initFirebaseIfAvailable() && firestoreInstance && userData.uid) {
        try {
          await firestoreInstance.collection('users').doc(userData.uid).set(userData, { merge: true });
        } catch (e) {
          console.warn('[FoodWala Api] Failed to sync user to Firestore:', e);
        }
      }
    },

    saveOrder: async function (order) {
      if (!order) return order;
      const targetId = String(order.id || order.orderId || '').trim();
      const rawOrders = getLocal(STORAGE_KEYS.ORDERS, []);
      const orders = Array.isArray(rawOrders) ? [...rawOrders] : [];
      if (targetId) {
        const idx = orders.findIndex(o => (o && String(o.id || o.orderId || '').trim() === targetId));
        if (idx > -1) {
          orders[idx] = Object.assign({}, orders[idx], order, { id: targetId, orderId: targetId });
        } else {
          orders.unshift(Object.assign({}, order, { id: targetId, orderId: targetId }));
        }
      } else {
        orders.unshift(order);
      }
      setLocal(STORAGE_KEYS.ORDERS, orders);

      const currentUser = this.getCurrentUser();
      if (currentUser && currentUser.uid && initFirebaseIfAvailable() && firestoreInstance) {
        try {
          await firestoreInstance.collection('users').doc(currentUser.uid).collection('orders').doc(order.id || order.orderId).set(order);
        } catch (e) {
          console.warn('[FoodWala Api] Failed to sync order to Firestore:', e);
        }
      }
      return order;
    }
  };

  window.FoodWalaApi = FoodWalaApi;

})(typeof window !== 'undefined' ? window : this);

/**
 * server/whatsapp/sessionStore.js
 * Session & User State Management (Redis with resilient In-Memory + MySQL fallback)
 */

const db = require('../db');
const config = require('./config');

class SessionStore {
  constructor() {
    this.memorySessions = new Map(); // phoneE164 -> { state, cart, context, expiresAt, updatedAt }
    this.memoryUsers = new Map();    // phoneE164 -> user object
    this.redisClient = null;

    // Periodically sweep expired in-memory sessions every 2 minutes
    setInterval(() => this._cleanupExpiredMemory(), 120000);
  }

  async _cleanupExpiredMemory() {
    const now = Date.now();
    for (const [phone, sess] of this.memorySessions.entries()) {
      if (sess.expiresAt && sess.expiresAt < now) {
        // Abandoned cart recovery: send ONE reminder if non-empty cart and opted-in within 24h
        if (config.features.abandoned_cart_recovery && sess.cart && sess.cart.items && sess.cart.items.length > 0 && !sess.abandonedCartReminded) {
          sess.abandonedCartReminded = true;
          sess.expiresAt = now + 24 * 60 * 60 * 1000;
          try {
            const user = await this.getOrCreateUser(phone);
            if (user && user.opted_in) {
              const sender = require('./sender');
              const itemNames = sess.cart.items.map(i => `${i.qty}x ${i.name}`).join(', ');
              const reminderMsg = `🛒 *You left items in your FoodWala cart!*\n${itemNames} (Total: ₹${sess.cart.total})\n\nWould you like to complete your order while hot & fresh? 🛵`;
              sender.sendInteractiveButtons(phone, reminderMsg, [
                { id: 'CART_CHECKOUT', title: 'Proceed to Pay 💳' },
                { id: 'CART_CLEAR', title: 'Clear Cart 🗑️' }
              ]).catch(() => {});
            }
          } catch (e) {}
          continue;
        }
        this.memorySessions.delete(phone);
      }
    }
  }

  /**
   * Loads or creates customer record in whatsapp_users & links to MySQL user table
   */
  async getOrCreateUser(phoneE164, name = 'Customer') {
    if (!phoneE164) return null;
    const cleanPhone = String(phoneE164).replace(/\D/g, '');
    const phone10 = cleanPhone.length >= 10 ? cleanPhone.slice(-10) : cleanPhone;

    // Check memory cache
    if (this.memoryUsers.has(phoneE164)) {
      return this.memoryUsers.get(phoneE164);
    }

    try {
      // 1. Check existing whatsapp_users
      const [waUsers] = await db.query(
        'SELECT id, phone_e164, user_id, name, language, default_address_id, opted_in, last_seen_at FROM whatsapp_users WHERE phone_e164 = ? LIMIT 1',
        [phoneE164]
      );

      if (waUsers && waUsers.length > 0) {
        const u = waUsers[0];
        // If not linked to main user table yet, attempt lookup by 10-digit phone
        if (!u.user_id && phone10) {
          const [mainUsers] = await db.query('SELECT user_id, username FROM user WHERE phone = ? LIMIT 1', [phone10]);
          if (mainUsers && mainUsers.length > 0) {
            await db.query('UPDATE whatsapp_users SET user_id = ?, name = COALESCE(name, ?) WHERE id = ?', [mainUsers[0].user_id, mainUsers[0].username, u.id]);
            u.user_id = mainUsers[0].user_id;
            u.name = mainUsers[0].username;
          }
        }
        await db.query('UPDATE whatsapp_users SET last_seen_at = NOW() WHERE id = ?', [u.id]);
        this.memoryUsers.set(phoneE164, u);
        return u;
      }

      // 2. Lookup in main user table by 10-digit phone
      let linkedUserId = null;
      let resolvedName = name || 'Customer';
      if (phone10) {
        const [mainUsers] = await db.query('SELECT user_id, username FROM user WHERE phone = ? LIMIT 1', [phone10]);
        if (mainUsers && mainUsers.length > 0) {
          linkedUserId = mainUsers[0].user_id;
          resolvedName = mainUsers[0].username || resolvedName;
        }
      }

      // 3. Insert new whatsapp_user
      const [res] = await db.query(
        'INSERT INTO whatsapp_users (phone_e164, user_id, name, language, opted_in) VALUES (?, ?, ?, "en", 1)',
        [phoneE164, linkedUserId, resolvedName]
      );

      const newUser = {
        id: res.insertId,
        phone_e164: phoneE164,
        user_id: linkedUserId,
        name: resolvedName,
        language: 'en',
        default_address_id: null,
        opted_in: 1,
        last_seen_at: new Date()
      };

      this.memoryUsers.set(phoneE164, newUser);
      return newUser;
    } catch (err) {
      console.warn('[SessionStore] User lookup warning:', err.message);
      return {
        id: 0,
        phone_e164: phoneE164,
        user_id: null,
        name: name || 'Customer',
        language: 'en',
        opted_in: 1,
        last_seen_at: new Date()
      };
    }
  }

  /**
   * Update language preference
   */
  async updateUserLanguage(phoneE164, language) {
    if (!phoneE164 || !language) return;
    try {
      await db.query('UPDATE whatsapp_users SET language = ? WHERE phone_e164 = ?', [language, phoneE164]);
      if (this.memoryUsers.has(phoneE164)) {
        this.memoryUsers.get(phoneE164).language = language;
      }
    } catch (e) {}
  }

  /**
   * Retrieve session state
   */
  async getSession(phoneE164) {
    if (!phoneE164) return this._defaultSession();

    // 1. Check in-memory session
    if (this.memorySessions.has(phoneE164)) {
      const sess = this.memorySessions.get(phoneE164);
      if (!sess.expiresAt || sess.expiresAt > Date.now()) {
        return sess;
      }
      this.memorySessions.delete(phoneE164);
    }

    // 2. Check MySQL whatsapp_sessions
    try {
      const [rows] = await db.query(
        'SELECT state, cart_json, context_json, expires_at, updated_at FROM whatsapp_sessions WHERE phone_e164 = ? LIMIT 1',
        [phoneE164]
      );

      if (rows && rows.length > 0) {
        const row = rows[0];
        const isExpired = row.expires_at && new Date(row.expires_at).getTime() < Date.now();
        const parsedCart = typeof row.cart_json === 'string' ? JSON.parse(row.cart_json) : (row.cart_json || this._defaultCart());
        const hasCartItems = parsedCart && parsedCart.items && parsedCart.items.length > 0;

        // Cart retention: If cart has items, retain cart for up to 24 hours even if prompt state expired
        const isRecent = row.updated_at && (Date.now() - new Date(row.updated_at).getTime() < 24 * 60 * 60 * 1000);
        if (hasCartItems && isRecent) {
          const sess = {
            state: isExpired ? (['ASK_QTY', 'ASK_ADDRESS', 'ASK_COUPON', 'ASK_PAYMENT', 'SWITCH_RESTAURANT_CONFIRM'].includes(row.state) ? 'CART_REVIEW' : (row.state || 'CART_REVIEW')) : (row.state || 'IDLE'),
            cart: parsedCart,
            context: typeof row.context_json === 'string' ? JSON.parse(row.context_json) : (row.context_json || {}),
            expiresAt: Date.now() + config.sessionTtlSec * 1000
          };
          if (sess.context && sess.context.pendingItem) sess.pendingItem = sess.context.pendingItem;
          this.memorySessions.set(phoneE164, sess);
          return sess;
        }

        if (!isExpired) {
          const sess = {
            state: row.state || 'IDLE',
            cart: parsedCart,
            context: typeof row.context_json === 'string' ? JSON.parse(row.context_json) : (row.context_json || {}),
            expiresAt: row.expires_at ? new Date(row.expires_at).getTime() : (Date.now() + config.sessionTtlSec * 1000)
          };
          if (sess.context && sess.context.pendingItem) sess.pendingItem = sess.context.pendingItem;
          this.memorySessions.set(phoneE164, sess);
          return sess;
        }
      }
    } catch (dbErr) {
      console.warn('[SessionStore] Session DB get warning:', dbErr.message);
    }

    return this._defaultSession();
  }

  /**
   * Save session state
   */
  async saveSession(phoneE164, sessionData, ttlSec = config.sessionTtlSec) {
    if (!phoneE164) return;
    const hasItems = sessionData.cart && sessionData.cart.items && sessionData.cart.items.length > 0;
    const effectiveTtl = hasItems ? Math.max(ttlSec, 24 * 60 * 60) : ttlSec;
    const expiresAt = Date.now() + (effectiveTtl * 1000);
    const expiresDate = new Date(expiresAt);

    const safeSession = {
      state: sessionData.state || 'IDLE',
      cart: sessionData.cart || this._defaultCart(),
      context: sessionData.context || {},
      expiresAt: expiresAt
    };

    if (sessionData.pendingItem) {
      safeSession.pendingItem = sessionData.pendingItem;
      safeSession.context.pendingItem = sessionData.pendingItem;
    } else if (safeSession.context && safeSession.context.pendingItem && !sessionData.pendingItem) {
      delete safeSession.context.pendingItem;
    }

    // 1. Update in-memory session
    this.memorySessions.set(phoneE164, safeSession);

    // 2. Persist to MySQL whatsapp_sessions
    try {
      const cartJson = JSON.stringify(safeSession.cart);
      const contextJson = JSON.stringify(safeSession.context);

      await db.query(
        `INSERT INTO whatsapp_sessions (phone_e164, state, cart_json, context_json, expires_at)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE state = VALUES(state), cart_json = VALUES(cart_json), context_json = VALUES(context_json), expires_at = VALUES(expires_at)`,
        [phoneE164, safeSession.state, cartJson, contextJson, expiresDate]
      );
    } catch (err) {
      console.warn('[SessionStore] Session DB save warning:', err.message);
    }
  }

  /**
   * Clear session
   */
  async clearSession(phoneE164) {
    this.memorySessions.delete(phoneE164);
    try {
      await db.query('DELETE FROM whatsapp_sessions WHERE phone_e164 = ?', [phoneE164]);
    } catch (e) {}
  }

  _defaultSession() {
    return {
      state: 'IDLE',
      cart: this._defaultCart(),
      context: {},
      expiresAt: Date.now() + config.sessionTtlSec * 1000
    };
  }

  _defaultCart() {
    return {
      restaurantId: null,
      restaurantName: null,
      items: [], // [{ menuId, name, price, qty, isVeg }]
      itemTotal: 0,
      deliveryFee: 30,
      taxes: 0,
      discount: 0,
      couponCode: null,
      total: 0,
      deliveryAddress: null
    };
  }
}

module.exports = new SessionStore();

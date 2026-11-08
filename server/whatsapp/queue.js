/**
 * server/whatsapp/queue.js
 * Inbound Queue & Worker Processing Pipeline with Deduping, Parallel Lookups & Latency Telemetry
 */

const sessionStore = require('./sessionStore');
const router = require('./router');
const sender = require('./sender');
const observability = require('./observability');
const config = require('./config');
const db = require('../db');

class WhatsAppQueue {
  constructor() {
    this.queue = [];
    this.concurrency = config.workerConcurrency || 12;
    this.activeWorkers = 0;
    this.dedupCache = new Map(); // msgId -> timestamp
    this.DEDUP_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

    setInterval(() => this._cleanupDedup(), 600000);
  }

  _cleanupDedup() {
    const now = Date.now();
    for (const [id, time] of this.dedupCache.entries()) {
      if (now - time > this.DEDUP_TTL_MS) {
        this.dedupCache.delete(id);
      }
    }
  }

  /**
   * Deduplication check using in-memory TTL cache + MySQL lookup
   */
  async isDuplicate(msgId) {
    if (!msgId) return false;
    const now = Date.now();

    if (this.dedupCache.has(msgId)) {
      return true;
    }
    this.dedupCache.set(msgId, now);

    try {
      const [existing] = await db.query(
        'SELECT message_id FROM whatsapp_messages WHERE wa_message_id = ? AND direction = "INBOUND" LIMIT 1',
        [msgId]
      );
      if (existing && existing.length > 0) {
        return true;
      }
    } catch (e) {}

    return false;
  }

  /**
   * Enqueues inbound event for asynchronous worker execution
   */
  enqueue(eventPayload) {
    this.queue.push(eventPayload);
    this._processNext();
  }

  _processNext() {
    if (this.activeWorkers >= this.concurrency || this.queue.length === 0) {
      return;
    }

    const job = this.queue.shift();
    this.activeWorkers++;

    this._executeJob(job)
      .catch(err => console.error('[WhatsApp Worker Error]:', err))
      .finally(() => {
        this.activeWorkers--;
        this._processNext();
      });
  }

  /**
   * Worker Step-by-Step Execution
   */
  async _executeJob(incomingMsg) {
    const startTime = Date.now();
    const { messageId, fromWaId, fromPhone10, customerName, messageText, actionId, timestamp, type, location } = incomingMsg;

    // 0. Ignore messages older than 5 minutes (stale retries from Meta)
    if (timestamp) {
      const msgTimestampMs = parseInt(timestamp, 10) * 1000;
      if (Date.now() - msgTimestampMs > config.staleMessageTtlSec * 1000) {
        console.warn(`⏳ [WhatsApp Worker] Dropping stale message ${messageId} (${Math.round((Date.now() - msgTimestampMs) / 1000)}s old).`);
        return;
      }
    }

    // 1. Mark message as read and show immediate reaction (<1s target)
    sender.markAsRead(messageId).catch(() => {});
    sender.sendTypingIndicator(fromWaId).catch(() => {});

    // 2. Load / create user and session in parallel (<50ms)
    const [user, session] = await Promise.all([
      sessionStore.getOrCreateUser(fromWaId, customerName),
      sessionStore.getSession(fromWaId)
    ]);

    // 3. Log inbound message in MySQL
    let conversationId = 1;
    try {
      const [convRows] = await db.query(
        'SELECT conversation_id FROM whatsapp_conversations WHERE wa_id = ? LIMIT 1',
        [fromWaId]
      );
      if (convRows && convRows.length > 0) {
        conversationId = convRows[0].conversation_id;
      } else {
        const [cRes] = await db.query(
          'INSERT INTO whatsapp_conversations (wa_id, phone_number, user_id, customer_name) VALUES (?, ?, ?, ?)',
          [fromWaId, fromPhone10, user.user_id, user.name]
        );
        conversationId = cRes.insertId;
      }

      await db.query(
        `INSERT INTO whatsapp_messages (conversation_id, wa_message_id, direction, sender_type, message_text, message_type, delivery_status)
         VALUES (?, ?, 'INBOUND', 'USER', ?, ?, 'delivered')`,
        [conversationId, messageId, messageText || `[${type}]`, type || 'text']
      );
    } catch (dbErr) {
      console.warn('[WhatsApp Worker] Inbound DB log warning:', dbErr.message);
    }

    // 4. Intent Router Execution (Rules -> MenuSearch -> FAQ -> LLM Fallback)
    let routeResult = null;
    let latencyMs = 0;
    try {
      routeResult = await router.routeMessage(user, session, incomingMsg);
      latencyMs = Date.now() - startTime;
    } catch (routeErr) {
      console.error('[WhatsApp Worker] Routing error:', routeErr);
      routeResult = {
        replyType: 'text',
        bodyText: "Sorry, I'm having trouble processing your request right now. FoodWala Support will assist you shortly.",
        route: 'rule',
        intent: 'error_fallback'
      };
      latencyMs = Date.now() - startTime;
    }

    // 5. Send reply via Meta Graph API (Buttons, List, or Text)
    let sendResult = null;
    if (routeResult.replyType === 'list') {
      sendResult = await sender.sendInteractiveList(
        fromWaId,
        routeResult.headerText,
        routeResult.bodyText,
        routeResult.buttonText,
        routeResult.sections
      );
    } else if (routeResult.replyType === 'buttons' && routeResult.buttons) {
      sendResult = await sender.sendInteractiveButtons(
        fromWaId,
        routeResult.bodyText,
        routeResult.buttons
      );
    } else {
      sendResult = await sender.sendTextMessage(fromWaId, routeResult.bodyText);
    }

    // 6. Save session & log outbound message + metrics
    await sessionStore.saveSession(fromWaId, session);

    const outMsgId = sendResult?.messages?.[0]?.id || `wamid.OUT_${Date.now()}`;
    const status = sendResult?.success ? 'delivered' : 'failed';

    try {
      await db.query(
        `INSERT INTO whatsapp_messages (conversation_id, wa_message_id, direction, sender_type, message_text, message_type, delivery_status)
         VALUES (?, ?, 'OUTBOUND', 'AI_BOT', ?, ?, ?)`,
        [conversationId, outMsgId, routeResult.bodyText, routeResult.replyType || 'text', status]
      );
    } catch (e) {}

    // 7. Observability logging
    observability.logEvent({
      waMessageId: messageId,
      phone: fromWaId,
      intent: routeResult.intent,
      route: routeResult.route,
      latencyMs: latencyMs,
      error: sendResult?.error || null
    });
  }
}

module.exports = new WhatsAppQueue();

/**
 * server/whatsapp/webhook.js
 * High-Throughput Express Router for Meta Webhook Handshake, Signature Verification & Queue Dispatch
 */

const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const config = require('./config');
const queue = require('./queue');
const sender = require('./sender');
const observability = require('./observability');
const db = require('../db');

/**
 * Validates Meta X-Hub-Signature-256 HMAC-SHA256
 */
function verifySignature(req) {
  const secret = config.appSecret;
  if (!secret) return true; // Local dev mode without APP_SECRET

  const signature = req.headers['x-hub-signature-256'] || req.headers['X-Hub-Signature-256'];
  if (!signature) return false;

  const rawBody = req.rawBody || (typeof req.body === 'string' ? req.body : JSON.stringify(req.body));
  const expected = 'sha256=' + crypto.createHmac('sha256', secret).update(rawBody).digest('hex');

  try {
    const sigBuf = Buffer.from(signature, 'utf8');
    const expBuf = Buffer.from(expected, 'utf8');
    if (sigBuf.length !== expBuf.length) return false;
    return crypto.timingSafeEqual(sigBuf, expBuf);
  } catch (e) {
    return false;
  }
}

/**
 * 1. Meta Challenge Verification Handshake (GET /webhook)
 */
router.get(['/webhook', '/'], (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token && token === config.webhookVerifyToken) {
    console.log('✅ [WhatsApp Webhook] Handshake verified with challenge code.');
    return res.type('text/plain').status(200).send(challenge);
  }

  console.warn('❌ [WhatsApp Webhook] Handshake rejected. Token mismatch or invalid mode.');
  return res.status(403).send('Forbidden');
});

/**
 * 2. Inbound WhatsApp Message Event Receiver (POST /webhook)
 */
router.post(['/webhook', '/'], async (req, res) => {
  // A. Signature Validation
  if (!verifySignature(req)) {
    console.warn('⚠️ [WhatsApp Webhook] Invalid X-Hub-Signature-256 signature. Event rejected with 401.');
    return res.status(401).json({ error: 'Invalid webhook signature' });
  }

  // B. Respond HTTP 200 immediately (<200 ms SLA)
  res.status(200).json({ status: 'EVENT_RECEIVED' });

  // C. Parse & Enqueue
  try {
    const body = req.body;
    if (!body || body.object !== 'whatsapp_business_account') {
      return;
    }

    const entries = body.entry || [];
    for (const entry of entries) {
      const changes = entry.changes || [];
      for (const change of changes) {
        const val = change.value;
        if (!val) continue;

        // D. Handle status-only callbacks (sent, delivered, read) without dispatching worker
        if (val.statuses && (!val.messages || val.messages.length === 0)) {
          for (const st of val.statuses) {
            try {
              await db.query(
                'UPDATE whatsapp_messages SET delivery_status = ? WHERE wa_message_id = ?',
                [st.status, st.id]
              );
            } catch (e) {}
          }
          continue;
        }

        const messages = val.messages;
        if (!messages || messages.length === 0) continue;

        const metadata = val.metadata || {};
        const businessPhoneId = metadata.phone_number_id || config.phoneNumberId;
        const contacts = val.contacts?.[0];
        const profileName = contacts?.profile?.name || 'Customer';

        for (const msg of messages) {
          const rawFrom = msg.from;
          const msgId = msg.id;

          // E. Bot Self-Loop Suppression
          const digits = String(rawFrom).replace(/\D/g, '');
          const phone10 = digits.length >= 10 ? digits.slice(-10) : digits;
          const businessDigits = String(config.businessNumber).replace(/\D/g, '');
          if (digits === businessDigits || phone10 === '8500457005' || rawFrom === businessPhoneId) {
            console.log(`🛡️ [WhatsApp Loop Prevention] Suppressed message from business entity.`);
            continue;
          }

          // F. Deduplication Check
          const duplicate = await queue.isDuplicate(msgId);
          if (duplicate) {
            console.log(`🛡️ [WhatsApp Deduplication] Duplicate message ID ${msgId} suppressed. Exactly one reply guaranteed.`);
            continue;
          }

          // G. Extract message content and interaction
          let messageText = '';
          let actionId = '';

          if (msg.type === 'text') {
            messageText = msg.text?.body || '';
          } else if (msg.type === 'interactive') {
            const inter = msg.interactive;
            if (inter.type === 'button_reply') {
              actionId = inter.button_reply?.id || '';
              messageText = inter.button_reply?.title || '';
            } else if (inter.type === 'list_reply') {
              actionId = inter.list_reply?.id || '';
              messageText = inter.list_reply?.title || '';
            }
          } else if (msg.type === 'location') {
            messageText = `[Location: ${msg.location?.latitude}, ${msg.location?.longitude}]`;
          } else {
            messageText = `[Attachment: ${msg.type}]`;
          }

          const parsedEvent = {
            messageId: msgId,
            fromWaId: digits.length === 10 ? '91' + digits : digits,
            fromPhone10: phone10,
            customerName: profileName,
            text: messageText.trim(),
            messageText: messageText.trim(),
            actionId: actionId,
            type: msg.type,
            location: msg.location || null,
            context: msg.context || null,
            timestamp: msg.timestamp,
            phoneNumberId: businessPhoneId
          };

          // H. Enqueue for asynchronous worker execution
          queue.enqueue(parsedEvent);
        }
      }
    }
  } catch (err) {
    console.error('[WhatsApp Webhook Handler Error]:', err.message);
  }
});

/**
 * 3. Health & Token Diagnostic Check (GET /health)
 */
router.get('/health', async (req, res) => {
  try {
    const health = await sender.verifyHealth();
    return res.status(200).json({
      success: true,
      service: 'FoodWala WhatsApp AI',
      businessNumber: config.businessNumber,
      whatsappConfigured: health.configured,
      tokenValid: health.tokenValid,
      metaError: health.message || null,
      aiConfigured: true,
      aiProvider: config.llmProvider,
      model: config.llmModelName,
      concurrency: config.workerConcurrency,
      timestamp: new Date().toISOString()
    });
  } catch (e) {
    return res.status(500).json({ success: false, error: e.message });
  }
});

/**
 * 4. Observability Metrics Endpoint (GET /metrics)
 */
router.get('/metrics', (req, res) => {
  return res.status(200).json({
    success: true,
    metrics: observability.getMetricsSummary()
  });
});

/**
 * 5. Recent Conversations Admin View (GET /conversations)
 */
router.get('/conversations', async (req, res) => {
  try {
    const list = await observability.getRecentConversations(50);
    return res.status(200).json({ success: true, count: list.length, conversations: list });
  } catch (e) {
    return res.status(500).json({ success: false, error: e.message });
  }
});

/**
 * 6. Website 24/7 Support Chat Widget Bridge (POST /chat)
 */
router.post('/chat', async (req, res) => {
  try {
    const { message, phone, name } = req.body || {};
    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }

    const rawPhone = (req.user ? req.user.phone : phone) || '';
    const digits = String(rawPhone).replace(/\D/g, '');
    const phoneE164 = digits.length === 10 ? '91' + digits : (digits || 'web_guest_' + Date.now());
    const customerName = (req.user ? req.user.username : name) || 'Valued Customer';

    const user = await require('./sessionStore').getOrCreateUser(phoneE164, customerName);
    const session = await require('./sessionStore').getSession(phoneE164);

    const incomingMsg = {
      messageId: 'web_' + Date.now(),
      fromWaId: phoneE164,
      fromPhone10: digits.length >= 10 ? digits.slice(-10) : null,
      customerName: customerName,
      text: message.trim(),
      messageText: message.trim(),
      actionId: '',
      type: 'web_chat'
    };

    const routeResult = await require('./router').routeMessage(user, session, incomingMsg);
    await require('./sessionStore').saveSession(phoneE164, session);

    return res.json({
      success: true,
      reply: routeResult.bodyText,
      customerName: user.name,
      supportDesk: 'FoodWala 24/7 Care Desk'
    });
  } catch (err) {
    console.error('[Web Chat Error]:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Support service momentarily busy.',
      reply: 'Our care desk is momentarily busy. Please try again or request a callback.'
    });
  }
});

module.exports = router;


/**
 * server/routes/whatsappWebhook.js
 * 
 * FoodWala WhatsApp Cloud API Webhook Handler & Web Support Chat Bridge
 * Features:
 * - Meta challenge verification handshake (GET /api/webhook/whatsapp)
 * - Inbound event receiver with Meta signature verification (POST /api/webhook/whatsapp)
 * - Immediate HTTP 200 acknowledgment (< 2s) to prevent Meta retry loops
 * - Message deduplication (in-memory TTL cache + MySQL database check)
 * - Bot self-loop suppression (ignores messages from business's own phone / phone ID)
 * - Status-only callback filtering (sent, delivered, read updates recorded without AI dispatch)
 * - Direct website 24/7 help widget bridge (POST /api/support/chat)
 * - Safe diagnostic logging (no access token or customer PII exposure)
 */

const express = require('express');
const router = express.Router();
const whatsappService = require('../services/whatsappService');
const aiService = require('../services/aiService');
const db = require('../db');

// In-Memory Deduplication Cache (waMessageId -> timestamp) with 15-minute TTL
const processedMessageIds = new Map();
const DEDUP_TTL_MS = 15 * 60 * 1000;

function isDuplicateMessage(msgId) {
  if (!msgId) return false;
  const now = Date.now();

  // Periodically clean stale entries
  if (processedMessageIds.size > 2000) {
    for (const [id, timestamp] of processedMessageIds.entries()) {
      if (now - timestamp > DEDUP_TTL_MS) {
        processedMessageIds.delete(id);
      }
    }
  }

  if (processedMessageIds.has(msgId)) {
    return true;
  }
  processedMessageIds.set(msgId, now);
  return false;
}

/**
 * 1. Meta Webhook Verification Handshake (GET /api/webhook/whatsapp)
 * Query parameters:
 * - hub.mode
 * - hub.verify_token
 * - hub.challenge
 */
router.get('/', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  const expectedToken = process.env.WHATSAPP_VERIFY_TOKEN || whatsappService.verifyToken;

  if (mode === 'subscribe' && token && expectedToken && token === expectedToken) {
    console.log('✅ [WhatsApp Webhook] Verification handshake successful.');
    return res.type('text/plain').status(200).send(challenge);
  }

  console.warn('❌ [WhatsApp Webhook] Verification failed or invalid parameters.');
  return res.status(403).send('Forbidden');
});

/**
 * 2. Inbound WhatsApp Message Event Receiver (POST /api/webhook/whatsapp)
 */
router.post('/', async (req, res) => {
  // A. Validate X-Hub-Signature-256 before safely accepting the event
  const isSignatureValid = whatsappService.verifySignature(req);
  if (!isSignatureValid) {
    console.warn('⚠️ [WhatsApp Webhook] Invalid X-Hub-Signature-256 signature. Event rejected.');
    return res.status(403).json({ error: 'Invalid webhook signature' });
  }

  // B. Return HTTP 200 promptly after safely accepting the event
  res.status(200).json({ status: 'EVENT_RECEIVED' });

  try {
    const body = req.body;
    if (!body || body.object !== 'whatsapp_business_account') {
      return;
    }

    const entries = body.entry || [];
    for (const entry of entries) {
      const changes = entry.changes || [];
      for (const change of changes) {
        const value = change.value;
        if (!value) continue;

        // C. Handle status-only callbacks (sent, delivered, read) without triggering AI
        if (value.statuses && (!value.messages || value.messages.length === 0)) {
          for (const stat of value.statuses) {
            try {
              await db.query(
                'UPDATE whatsapp_messages SET delivery_status = ? WHERE wa_message_id = ?',
                [stat.status, stat.id]
              );
              console.log(`📊 [WhatsApp Status Callback] Message ${stat.id} -> ${stat.status}`);
            } catch (e) {}
          }
          continue;
        }

        const messages = value.messages;
        if (!messages || messages.length === 0) continue;

        const metadata = value.metadata || {};
        const businessPhoneId = metadata.phone_number_id || whatsappService.phoneNumberId;
        const contacts = value.contacts?.[0];
        const profileName = contacts?.profile?.name || null;

        for (const incomingMsg of messages) {
          const rawFrom = incomingMsg.from;
          const waMessageId = incomingMsg.id;

          // D. Bot Self-Loop Prevention: Ignore messages originating from the business's own numbers
          const { waId, phone10 } = whatsappService.normalizeSender(rawFrom);
          if (waId === whatsappService.hotline || waId === businessPhoneId || rawFrom === businessPhoneId) {
            console.log(`🛡️ [WhatsApp Webhook] Loop prevention: Message from business entity (${whatsappService.maskPhone(waId)}) ignored.`);
            continue;
          }

          // E. Deduplication: Check in-memory cache
          if (isDuplicateMessage(waMessageId)) {
            console.log(`🛡️ [WhatsApp Webhook] Duplicate message ${waMessageId} detected in memory; skipping processing.`);
            continue;
          }

          // F. Deduplication: Check MySQL database
          try {
            const [existing] = await db.query(
              'SELECT message_id FROM whatsapp_messages WHERE wa_message_id = ? AND direction = "INBOUND" LIMIT 1',
              [waMessageId]
            );
            if (existing && existing.length > 0) {
              console.log(`🛡️ [WhatsApp Webhook] Duplicate message ${waMessageId} already exists in DB; skipping.`);
              continue;
            }
          } catch (dbErr) {
            console.warn('[WhatsApp Webhook] DB deduplication check warning:', dbErr.message);
          }

          // G. Extract message text
          let messageText = '';
          if (incomingMsg.type === 'text') {
            messageText = incomingMsg.text?.body || '';
          } else if (incomingMsg.type === 'interactive') {
            const interactive = incomingMsg.interactive;
            if (interactive.type === 'button_reply') {
              messageText = interactive.button_reply?.title || '';
            } else if (interactive.type === 'list_reply') {
              messageText = interactive.list_reply?.title || '';
            }
          } else {
            messageText = `[Received attachment: ${incomingMsg.type}]`;
          }

          if (!messageText.trim()) continue;

          console.log(`📩 [WhatsApp Inbound] Received message ${waMessageId} from ${whatsappService.maskPhone(waId)} (type: ${incomingMsg.type}, chars: ${messageText.length})`);

          // H. Mark message as read on Meta
          whatsappService.markMessageAsRead(waMessageId).catch(() => {});

          // I. Get or create conversation record in MySQL
          const conversation = await whatsappService.getOrCreateConversation(waId, phone10, profileName);

          // J. Log inbound message in MySQL
          await whatsappService.logMessage({
            conversationId: conversation.conversation_id,
            waMessageId: waMessageId,
            direction: 'INBOUND',
            senderType: 'USER',
            messageText: messageText,
            messageType: incomingMsg.type,
            rawPayload: incomingMsg,
            deliveryStatus: 'delivered'
          });

          // K. Fetch recent history for conversation context (last 6 messages)
          let recentMessages = [];
          try {
            const [rows] = await db.query(
              'SELECT sender_type, message_text FROM whatsapp_messages WHERE conversation_id = ? ORDER BY message_id DESC LIMIT 6',
              [conversation.conversation_id]
            );
            recentMessages = rows || [];
          } catch (histErr) {
            console.warn('[WhatsApp Webhook] History fetch warning:', histErr.message);
          }

          // L. Generate AI Response
          const startTime = Date.now();
          const aiResponse = await aiService.generateResponse({
            userPhone10: phone10,
            customerName: conversation.customer_name,
            messageText: messageText,
            conversationHistory: recentMessages.reverse(),
            authenticatedUserId: conversation.user_id
          });
          const latency = Date.now() - startTime;

          console.log(`🤖 [WhatsApp AI Dispatch] Generated reply for message ${waMessageId} in ${latency}ms`);

          // M. Dispatch reply back to customer via WhatsApp Cloud API
          const sendResult = await whatsappService.sendTextMessage(waId, aiResponse);

          // N. Log outbound message in MySQL with accurate delivery status
          const outboundMsgId = sendResult?.messages?.[0]?.id || ('wamid.OUT_' + Date.now());
          const deliveryStatus = sendResult && sendResult.success ? 'sent' : 'failed';

          await whatsappService.logMessage({
            conversationId: conversation.conversation_id,
            waMessageId: outboundMsgId,
            direction: 'OUTBOUND',
            senderType: 'AI_BOT',
            messageText: aiResponse,
            messageType: 'text',
            rawPayload: sendResult,
            deliveryStatus: deliveryStatus
          });

          if (!sendResult || !sendResult.success) {
            console.warn(`⚠️ [WhatsApp Outbound Delivery Failed] Message ${outboundMsgId} marked as failed. Error: ${sendResult?.error || 'Unknown error'}`);
          }
        }
      }
    }
  } catch (err) {
    console.error('[WhatsApp Webhook Handler Error]', err.message);
  }
});

/**
 * 3. Direct Website 24/7 Help Widget Bridge (POST /api/support/chat)
 * Allows website visitors to converse with the same grounded AI assistant
 */
router.post('/chat', async (req, res) => {
  try {
    const { message, phone, name } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }

    // Determine authentication and verified identity
    let authenticatedUserId = null;
    let rawPhone = '';
    let customerName = name || 'Guest User';

    if (req.user) {
      authenticatedUserId = req.user.user_id;
      rawPhone = req.user.phone || phone || '';
      customerName = req.user.username || name || 'Valued Customer';
    } else if (phone && typeof phone === 'string' && phone.trim()) {
      rawPhone = phone.trim();
      customerName = name || 'Customer';
    }

    let waId = '';
    let phone10 = null;
    if (rawPhone) {
      const normalized = whatsappService.normalizeSender(rawPhone);
      waId = normalized.waId;
      phone10 = normalized.phone10;
    } else {
      waId = 'web_anon_' + Date.now() + '_' + Math.random().toString(36).substring(7);
      phone10 = null;
    }

    // Get or create conversation in DB
    const conversation = await whatsappService.getOrCreateConversation(waId, phone10, customerName);

    // If authenticated user, ensure conversation links to user_id
    if (authenticatedUserId && !conversation.user_id) {
      try {
        await db.query(
          'UPDATE whatsapp_conversations SET user_id = ? WHERE conversation_id = ?',
          [authenticatedUserId, conversation.conversation_id]
        );
        conversation.user_id = authenticatedUserId;
      } catch (e) {}
    }

    // Log inbound user message
    await whatsappService.logMessage({
      conversationId: conversation.conversation_id,
      waMessageId: 'web_' + Date.now(),
      direction: 'INBOUND',
      senderType: 'USER',
      messageText: message.trim(),
      messageType: 'web_chat',
      deliveryStatus: 'delivered'
    });

    // Fetch context
    let recentMessages = [];
    try {
      const [rows] = await db.query(
        'SELECT sender_type, message_text FROM whatsapp_messages WHERE conversation_id = ? ORDER BY message_id DESC LIMIT 6',
        [conversation.conversation_id]
      );
      recentMessages = rows || [];
    } catch (e) {}

    // Generate response with intent classification and authorization verification
    const reply = await aiService.generateResponse({
      userPhone10: phone10,
      customerName: customerName,
      messageText: message.trim(),
      conversationHistory: recentMessages.reverse(),
      authenticatedUserId: authenticatedUserId
    });

    // Log outbound AI response
    await whatsappService.logMessage({
      conversationId: conversation.conversation_id,
      waMessageId: 'web_ai_' + Date.now(),
      direction: 'OUTBOUND',
      senderType: 'AI_BOT',
      messageText: reply,
      messageType: 'web_chat',
      deliveryStatus: 'sent'
    });

    return res.json({
      success: true,
      reply: reply,
      customerName: customerName,
      supportDesk: 'FoodWala 24/7 Care Desk'
    });
  } catch (err) {
    console.error('[Support Chat Error]', err.message);
    return res.status(500).json({
      success: false,
      message: 'Support service temporarily unavailable.',
      reply: 'Our care desk is momentarily busy. Please use our in-app Request Callback feature or leave a message for our support supervisor.'
    });
  }
});

module.exports = router;

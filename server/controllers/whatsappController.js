/**
 * server/controllers/whatsappController.js
 * 
 * Production Controller for FoodWala WhatsApp Cloud API
 * Features:
 * - GET Webhook Handshake Verification
 * - POST Webhook Inbound Message Receiver
 * - Quick HTTP 200 Acknowledgment (<500ms) to prevent Meta retry loops
 * - Asynchronous AI Response Dispatching
 * - In-Memory Deduplication (TTL Cache)
 * - MySQL Conversation & Message Logging
 * - Health Check & Testing Endpoints
 */

const whatsappService = require('../services/whatsappService');
const whatsappAIService = require('../services/whatsappAIService');
const whatsappParser = require('../utils/whatsappParser');
const db = require('../db');

// In-Memory Deduplication Cache (wamid -> timestamp) with 15-minute TTL
const processedMessageIds = new Map();
const DEDUP_TTL_MS = 15 * 60 * 1000;

function isDuplicate(msgId) {
  if (!msgId) return false;
  const now = Date.now();

  // Periodic cleanup
  if (processedMessageIds.size > 2000) {
    for (const [id, time] of processedMessageIds.entries()) {
      if (now - time > DEDUP_TTL_MS) {
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

class WhatsAppController {
  /**
   * GET /api/whatsapp/webhook
   * Meta Webhook Handshake Verification
   */
  async handleVerification(req, res) {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    const expectedToken = whatsappService.verifyToken;

    if (mode === 'subscribe' && token && expectedToken && token === expectedToken) {
      console.log('✅ [WhatsApp] Webhook verification handshake successful.');
      return res.type('text/plain').status(200).send(challenge);
    }

    console.warn('❌ [WhatsApp] Webhook verification failed. Invalid mode or token mismatch.');
    return res.status(403).send('Forbidden');
  }

  /**
   * POST /api/whatsapp/webhook
   * Meta WhatsApp Cloud API Inbound Webhook Receiver
   */
  async handleWebhook(req, res) {
    // 1. Signature validation
    const isValidSig = whatsappService.verifySignature(req);
    if (!isValidSig) {
      console.warn('⚠️ [WhatsApp] Invalid X-Hub-Signature-256 header. Event rejected.');
      return res.status(403).json({ error: 'Invalid webhook signature' });
    }

    // 2. Acknowledge Meta immediately to prevent retry storms
    res.status(200).json({ status: 'EVENT_RECEIVED' });

    // 3. Process asynchronously
    try {
      const parsed = whatsappParser.parseInboundEvent(req.body, whatsappService.hotline);

      if (parsed.isStatus) {
        // Safe status acknowledgment
        return;
      }

      if (!parsed.isMessage || parsed.messages.length === 0) {
        return;
      }

      for (const msg of parsed.messages) {
        // Check duplicate
        if (isDuplicate(msg.messageId)) {
          console.log(`[WhatsApp] Duplicate message ID ${msg.messageId} ignored.`);
          continue;
        }

        console.log(`[WhatsApp] Incoming webhook`);
        console.log(`[WhatsApp] Message ID: ${msg.messageId}`);
        console.log(`[WhatsApp] From: +91 ${whatsappParser.maskPhone(msg.fromPhone10)}`);
        console.log(`[WhatsApp] Text: ${msg.messageText}`);

        // Process message in background
        this._processSingleMessage(msg).catch(err => {
          console.error(`[WhatsApp ERROR] Asynchronous processing error:`, err.message);
        });
      }
    } catch (err) {
      console.error('[WhatsApp ERROR] Webhook handling error:', err.message);
    }
  }

  /**
   * Asynchronous message pipeline
   */
  async _processSingleMessage(msg) {
    // 1. Record inbound message in database
    let conversationId = null;
    try {
      const conv = await whatsappService.getOrCreateConversation(
        msg.fromWaId,
        msg.fromPhone10,
        msg.customerName
      );
      conversationId = conv.conversation_id;

      await whatsappService.logMessage({
        conversationId: conversationId,
        waMessageId: msg.messageId,
        direction: 'INBOUND',
        senderType: 'USER',
        messageText: msg.messageText,
        messageType: msg.messageType,
        deliveryStatus: 'delivered'
      });
    } catch (dbErr) {
      console.error('[DATABASE ERROR] Failed to record inbound message:', dbErr.message);
    }

    // 2. Generate AI response
    console.log(`[WhatsApp] Generating AI response`);
    let replyText = '';
    try {
      replyText = await whatsappAIService.generateResponse({
        senderPhone10: msg.fromPhone10,
        messageText: msg.messageText,
        customerName: msg.customerName
      });
      console.log(`[WhatsApp] AI response generated`);
    } catch (aiErr) {
      console.error('[AI ERROR] Failed to generate AI reply:', aiErr.message);
      replyText = `Sorry, I'm having trouble processing your request right now. 😔\n\nPlease send your Order ID and briefly describe the problem.\n\nFoodWala Support will help you.`;
    }

    // 3. Send response via Meta Graph API
    console.log(`[WhatsApp] Sending WhatsApp response`);
    const sendResult = await whatsappService.sendWhatsAppMessage(msg.fromWaId, replyText, msg.phoneNumberId);

    // 4. Record outbound message in database
    try {
      const outMsgId = sendResult?.messages?.[0]?.id || `wamid.OUT_${Date.now()}`;
      const status = sendResult?.success ? 'delivered' : 'failed';

      if (conversationId) {
        await whatsappService.logMessage({
          conversationId: conversationId,
          waMessageId: outMsgId,
          direction: 'OUTBOUND',
          senderType: 'AI_BOT',
          messageText: replyText,
          messageType: 'text',
          deliveryStatus: status
        });
      }
    } catch (dbOutErr) {
      console.error('[DATABASE ERROR] Failed to record outbound message:', dbOutErr.message);
    }

    if (sendResult?.success) {
      console.log(`[WhatsApp] Message sent successfully`);
    } else {
      console.error(`[WhatsApp ERROR] Message dispatch failed: ${sendResult?.error || 'Unknown error'}`);
    }
  }

  /**
   * GET /api/whatsapp/health
   */
  async getHealth(req, res) {
    try {
      const waHealth = await whatsappService.checkHealth();
      const hasAiKey = Boolean(process.env.AI_API_KEY);

      return res.status(200).json({
        success: true,
        service: 'FoodWala WhatsApp AI',
        whatsappConfigured: waHealth.configured,
        tokenValid: waHealth.tokenValid,
        metaError: waHealth.message || null,
        aiConfigured: true,
        aiProvider: process.env.AI_PROVIDER || 'gemini',
        model: process.env.AI_MODEL_NAME || 'gemini-3.8-flash',
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        error: err.message
      });
    }
  }

  /**
   * POST /api/whatsapp/test
   * Testing endpoint for developers to simulate incoming queries
   */
  async handleTest(req, res) {
    const { phone, message } = req.body || {};
    if (!message) {
      return res.status(400).json({ success: false, error: 'Field "message" is required' });
    }

    const { phone10, waId } = whatsappParser.normalizePhoneNumber(phone || '9895342253');

    try {
      const reply = await whatsappAIService.generateResponse({
        senderPhone10: phone10,
        messageText: message,
        customerName: 'Test Customer'
      });

      return res.status(200).json({
        success: true,
        phone: phone10,
        query: message,
        reply: reply
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        error: err.message
      });
    }
  }
}

module.exports = new WhatsAppController();

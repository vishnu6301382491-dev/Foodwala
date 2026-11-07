/**
 * server/whatsapp/config.js
 * Centralized Configuration for WhatsApp Assistant
 */

const path = require('path');
const fs = require('fs');

if (fs.existsSync(path.join(__dirname, '../.env'))) {
  try {
    require('dotenv').config({ path: path.join(__dirname, '../.env') });
  } catch (e) {}
}

const config = {
  // Meta Cloud API Credentials
  accessToken: process.env.WHATSAPP_ACCESS_TOKEN || process.env.META_ACCESS_TOKEN || '',
  phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
  businessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || '',
  businessNumber: process.env.WHATSAPP_BUSINESS_NUMBER || '+918500457005',
  supportPhoneOrUrl: process.env.SUPPORT_AGENT_PHONE_OR_URL || process.env.SUPPORT_PHONE_NUMBER || '+918500457005',
  
  // Security & Webhook
  webhookVerifyToken: process.env.WEBHOOK_VERIFY_TOKEN || process.env.WHATSAPP_VERIFY_TOKEN || 'FW_wh_verify_9c8e2a71f6404bf4b7b5a3d1e8c6f204d7a9b61e',
  appSecret: process.env.APP_SECRET || process.env.WHATSAPP_APP_SECRET || process.env.META_APP_SECRET || '',
  graphApiVersion: process.env.GRAPH_API_VERSION || process.env.META_GRAPH_API_VERSION || process.env.WHATSAPP_API_VERSION || 'v21.0',

  // Redis & Queue
  redisUrl: process.env.REDIS_URL || '',
  workerConcurrency: parseInt(process.env.WHATSAPP_WORKER_CONCURRENCY, 10) || 12,
  
  // AI / LLM Configuration
  llmApiKey: process.env.LLM_API_KEY || process.env.AI_API_KEY || '',
  llmProvider: (process.env.AI_PROVIDER || 'gemini').toLowerCase(),
  llmModelName: process.env.AI_MODEL_NAME || 'gemini-2.0-flash',

  // Performance Limits (ms)
  webhookAckTargetMs: 200,
  ruleReplyTargetMs: 1500,
  llmReplyTargetMs: 4000,
  staleMessageTtlSec: 86400, // 24 hours (prevents dropping Meta retries after network or tunnel restarts)
  sessionTtlSec: 1800,      // 30 minutes
  greetingInactivityHours: 6,
  cancellationWindowSec: 60,

  // Feature Flags (Part 2 and enhancements)
  features: {
    repeat_order: process.env.FEATURE_REPEAT_ORDER !== 'false',
    abandoned_cart_recovery: process.env.FEATURE_ABANDONED_CART !== 'false',
    smart_recommendations: process.env.FEATURE_SMART_RECOMMENDATIONS !== 'false',
    multilingual: process.env.FEATURE_MULTILINGUAL !== 'false',
    voice_notes: process.env.FEATURE_VOICE_NOTES === 'true'
  }
};

module.exports = config;

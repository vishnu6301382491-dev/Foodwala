/**
 * server/whatsapp/llmFallback.js
 * Grounded LLM Fallback with Strict JSON Output & 3s Hard Timeout
 */

const https = require('https');
const config = require('./config');

const SYSTEM_PROMPT = `You are FoodWala's WhatsApp AI customer assistant.
FoodWala is a food delivery platform delivering across Bengaluru in 25-35 minutes.
Operating hours: 7:00 AM to 11:30 PM. Delivery fee: ₹30, free above ₹299.
Cancellation: Allowed within 60s of placing before kitchen preparation.
Coupons: Available in system. Refund: UPI 2-4 hrs, cards 3-5 days.

CRITICAL RULES:
1. Never invent prices, offers, delivery times, or order status.
2. Only use facts passed in the prompt.
3. If unsure, return intent "unknown".
4. Reply in the customer's language (English, Hindi, Telugu, Tamil, Kannada, or Hinglish).
5. Maximum 2 short sentences.
6. OUTPUT MUST BE STRICT VALID JSON ONLY, with NO markdown codeblocks or extra text.

JSON FORMAT:
{
  "intent": "order_food|track_order|cancel_order|payment_issue|delivery_issue|coupon|change_address|faq|complaint|human_agent|chitchat|unknown",
  "entities": { "dish": null, "quantity": null, "order_id": null, "address": null },
  "reply": "short answer or null",
  "confidence": 0.0
}`;

class LLMFallbackEngine {
  /**
   * Calls LLM with 3-second hard timeout
   */
  async classifyAndReply({ messageText, customerName = 'Customer', language = 'en' }) {
    const apiKey = config.llmApiKey;
    if (!apiKey) {
      return this._localSemanticFallback(messageText);
    }

    try {
      const result = await Promise.race([
        this._callProvider(apiKey, messageText, customerName, language),
        new Promise((_, reject) => setTimeout(() => reject(new Error('LLM_TIMEOUT')), 3000))
      ]);
      return result;
    } catch (err) {
      console.warn(`[LLM Fallback Warning] ${err.message}. Using safe local fallback.`);
      return this._localSemanticFallback(messageText);
    }
  }

  async _callProvider(apiKey, text, customerName, language) {
    if (config.llmProvider === 'openai') {
      return this._callOpenAI(apiKey, text, customerName, language);
    }
    return this._callGemini(apiKey, text, customerName, language);
  }

  async _callGemini(apiKey, text, customerName, language) {
    const model = config.llmModelName || 'gemini-2.0-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const prompt = `${SYSTEM_PROMPT}\n\nCustomer Name: ${customerName}\nCustomer Language: ${language}\nUser Message: "${text}"`;

    const payload = JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 150,
        responseMimeType: 'application/json'
      }
    });

    return new Promise((resolve, reject) => {
      const req = https.request(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) },
        timeout: 3000
      }, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          if (res.statusCode >= 400) {
            return reject(new Error(`Gemini API HTTP ${res.statusCode}`));
          }
          try {
            const data = JSON.parse(body);
            const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
            const parsed = JSON.parse(rawText.replace(/```json|```/g, '').trim());
            resolve(parsed);
          } catch (e) {
            reject(new Error('Failed to parse Gemini JSON'));
          }
        });
      });

      req.on('error', reject);
      req.on('timeout', () => { req.destroy(); reject(new Error('LLM_TIMEOUT')); });
      req.write(payload);
      req.end();
    });
  }

  async _callOpenAI(apiKey, text, customerName, language) {
    const url = 'https://api.openai.com/v1/chat/completions';
    const payload = JSON.stringify({
      model: config.llmModelName || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `Customer: ${customerName}, Lang: ${language}\nMessage: "${text}"` }
      ],
      response_format: { type: 'json_object' },
      max_tokens: 150,
      temperature: 0.1
    });

    return new Promise((resolve, reject) => {
      const req = https.request(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload)
        },
        timeout: 3000
      }, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          if (res.statusCode >= 400) {
            return reject(new Error(`OpenAI API HTTP ${res.statusCode}`));
          }
          try {
            const data = JSON.parse(body);
            const raw = data.choices?.[0]?.message?.content || '{}';
            resolve(JSON.parse(raw));
          } catch (e) {
            reject(new Error('Failed to parse OpenAI JSON'));
          }
        });
      });

      req.on('error', reject);
      req.on('timeout', () => { req.destroy(); reject(new Error('LLM_TIMEOUT')); });
      req.write(payload);
      req.end();
    });
  }

  _localSemanticFallback(text) {
    const lower = (text || '').toLowerCase().trim();

    // Check support / assistance / human escalation first
    if (/\b(?:agent|support|assist|assistance|help|human|complaint|representative|helpline)\b/i.test(lower) || /need\s+(?:assistance|help)/i.test(lower)) {
      return {
        intent: 'human_agent',
        entities: { dish: null, quantity: null, order_id: null, address: null },
        reply: '👨‍💼 Connecting you with FoodWala Priority Care Desk. A support executive will assist you within 5–10 minutes.',
        confidence: 0.95
      };
    }

    // Payment Methods / COD inquiry (before general checkout)
    if (/\b(?:payment\s*(?:options|methods?|modes?)|how\s*to\s*pay|accept\s*(?:cash|cod|upi|card)|pay\s*with\s*(?:cash|cod|upi|card)|can\s*i\s*pay\s*(?:with|by|using)?\s*(?:cash|cod|upi|card)|is\s*cod\s*available|cash\s*on\s*delivery)\b/i.test(lower)) {
      return {
        intent: 'payment_methods',
        entities: { dish: null, quantity: null, order_id: null, address: null },
        reply: '💳 We accept Cash on Delivery (COD), UPI (GPay, PhonePe, Paytm), and Credit/Debit Cards! Free delivery on orders over ₹299.',
        confidence: 0.95
      };
    }

    // Checkout / Proceed to Pay
    if (/\b(?:checkout|proceed(?:\s*to\s*pay(?:ment)?)?|place\s*order|pay\s*now|make\s*payment|complete\s*payment)\b/i.test(lower) || lower.includes('proceed to pay') || lower === 'pay') {
      return {
        intent: 'checkout',
        entities: { dish: null, quantity: null, order_id: null, address: null },
        reply: '💳 Proceeding to checkout. Please provide your delivery address or confirm payment details.',
        confidence: 0.95
      };
    }

    // Cancellation & Refund Policy
    if (/\b(?:cancel|cancellation|refund\s*policy|how\s*to\s*cancel|can\s*i\s*cancel)\b/i.test(lower)) {
      return {
        intent: 'cancellation_policy',
        entities: { dish: null, quantity: null, order_id: null, address: null },
        reply: '⏱️ FoodWala offers a 60-second instant cancellation window after placing an order before the kitchen starts preparation. UPI refunds are processed within 2-4 hours.',
        confidence: 0.95
      };
    }

    // Delivery Charges
    if (/\b(?:delivery\s*(?:fee|charges?|cost)|shipping|free\s*delivery)\b/i.test(lower)) {
      return {
        intent: 'delivery_charges',
        entities: { dish: null, quantity: null, order_id: null, address: null },
        reply: '🛵 Standard delivery is ₹30 for orders below ₹299. All orders above ₹299 enjoy automatic FREE delivery across Bengaluru!',
        confidence: 0.95
      };
    }

    // Operating Hours
    if (/\b(?:timings?|operating\s*hours?|opening\s*time|closing\s*time|midnight)\b/i.test(lower)) {
      return {
        intent: 'operating_hours',
        entities: { dish: null, quantity: null, order_id: null, address: null },
        reply: '⏰ FoodWala operates daily from 7:00 AM to 11:30 PM across all partner hubs in Bengaluru.',
        confidence: 0.95
      };
    }

    // View Cart
    if (/\b(?:cart|view\s*cart|show\s*cart|my\s*cart)\b/i.test(lower) || lower.includes('cart')) {
      return {
        intent: 'view_cart',
        entities: { dish: null, quantity: null, order_id: null, address: null },
        reply: '🛒 Let me show you what is currently in your FoodWala cart.',
        confidence: 0.95
      };
    }

    // Check greeting / chitchat (only if not an order or support request)
    if (/^(?:hi|hello|hey|namaste|vanakkam|good\s*(?:morning|evening|afternoon)|hola)\b/i.test(lower)) {
      return {
        intent: 'chitchat',
        entities: { dish: null, quantity: null, order_id: null, address: null },
        reply: 'Hello! I am your FoodWala assistant. What delicious food would you like to order today? 🍕',
        confidence: 0.95
      };
    }

    if (/^(?:thanks|thank\s*you|shukriya|dhanyavad|super|great|awesome)\b/i.test(lower)) {
      return {
        intent: 'chitchat',
        entities: { dish: null, quantity: null, order_id: null, address: null },
        reply: "You're most welcome! Enjoy your meal and feel free to reach out anytime. 🍕",
        confidence: 0.95
      };
    }

    // Tracking
    if (/\b(?:track|tracking|where\s*is\s*my\s*order|order\s*status)\b/i.test(lower)) {
      return {
        intent: 'order_tracking',
        entities: { dish: null, quantity: null, order_id: null, address: null },
        reply: '🛵 Please reply with your Order ID (e.g. #FW1020) to check live tracking.',
        confidence: 0.90
      };
    }

    // Coupons
    if (/\b(?:coupon|coupons|offer|offers|discount|promo)\b/i.test(lower)) {
      return {
        intent: 'coupons',
        entities: { dish: null, quantity: null, order_id: null, address: null },
        reply: '🏷️ Use coupon *FOODWALA50* on checkout for Flat 50% OFF (up to ₹150)! Free delivery on orders over ₹299.',
        confidence: 0.90
      };
    }

    // Default unknown
    return {
      intent: 'unknown',
      entities: { dish: null, quantity: null, order_id: null, address: null },
      reply: null,
      confidence: 0.0
    };
  }
}

module.exports = new LLMFallbackEngine();

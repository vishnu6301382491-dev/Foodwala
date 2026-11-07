/**
 * server/whatsapp/observability.js
 * Observability, Metrics Collection & Structured Diagnostic Logging
 */

const db = require('../db');

class ObservabilityManager {
  constructor() {
    this.metrics = {
      totalReceived: 0,
      totalReplies: 0,
      ruleMatches: 0,
      menuSearches: 0,
      faqMatches: 0,
      llmFallbacks: 0,
      unknownIntents: 0,
      ordersCreated: 0,
      latencies: [],
      errors: 0,
      startTime: Date.now()
    };
  }

  logEvent({ waMessageId, phone, intent, route, latencyMs, error = null }) {
    const maskedPhone = this.maskPhone(phone);
    const entry = {
      timestamp: new Date().toISOString(),
      wa_message_id: waMessageId || 'N/A',
      user: maskedPhone,
      intent: intent || 'unknown',
      route: route || 'rule',
      latency_ms: latencyMs || 0,
      error: error ? (error.message || String(error)) : null
    };

    console.log(`📊 [WhatsApp Observability] ${JSON.stringify(entry)}`);

    // Update in-memory metrics
    this.metrics.totalReceived++;
    if (latencyMs) {
      this.metrics.latencies.push(latencyMs);
      if (this.metrics.latencies.length > 1000) {
        this.metrics.latencies.shift();
      }
    }

    if (route === 'rule') this.metrics.ruleMatches++;
    else if (route === 'menu') this.metrics.menuSearches++;
    else if (route === 'faq') this.metrics.faqMatches++;
    else if (route === 'llm') this.metrics.llmFallbacks++;

    if (intent === 'unknown') this.metrics.unknownIntents++;
    if (intent === 'order_created') this.metrics.ordersCreated++;
    if (error) this.metrics.errors++;

    if (latencyMs > 2000) {
      console.warn(`⚠️ [WhatsApp Latency Alert] Message ${waMessageId} took ${latencyMs}ms (> 2000ms threshold)`);
    }
  }

  maskPhone(phone) {
    if (!phone) return 'unknown';
    const str = String(phone).replace(/\D/g, '');
    if (str.length <= 4) return '****';
    return '+' + str.substring(0, 4) + '****' + str.slice(-2);
  }

  getMetricsSummary() {
    const lats = [...this.metrics.latencies].sort((a, b) => a - b);
    const p50 = lats.length > 0 ? lats[Math.floor(lats.length * 0.50)] : 0;
    const p95 = lats.length > 0 ? lats[Math.floor(lats.length * 0.95)] : 0;
    const uptimeMins = Math.max(1, (Date.now() - this.metrics.startTime) / 60000);
    const msgPerMin = (this.metrics.totalReceived / uptimeMins).toFixed(2);
    const llmPct = this.metrics.totalReceived > 0 ? ((this.metrics.llmFallbacks / this.metrics.totalReceived) * 100).toFixed(1) : 0;
    const unknownPct = this.metrics.totalReceived > 0 ? ((this.metrics.unknownIntents / this.metrics.totalReceived) * 100).toFixed(1) : 0;
    const errorRate = this.metrics.totalReceived > 0 ? ((this.metrics.errors / this.metrics.totalReceived) * 100).toFixed(1) : 0;

    return {
      uptimeMinutes: Math.round(uptimeMins),
      messagesPerMin: parseFloat(msgPerMin),
      totalReceived: this.metrics.totalReceived,
      latencyP50Ms: p50,
      latencyP95Ms: p95,
      routeDistribution: {
        rule: this.metrics.ruleMatches,
        menu: this.metrics.menuSearches,
        faq: this.metrics.faqMatches,
        llm: this.metrics.llmFallbacks
      },
      llmHandledPercent: `${llmPct}%`,
      unknownIntentPercent: `${unknownPct}%`,
      errorRatePercent: `${errorRate}%`,
      ordersCreated: this.metrics.ordersCreated
    };
  }

  /**
   * Retrieves last 50 WhatsApp conversations and messages for admin inspection
   */
  async getRecentConversations(limit = 50) {
    try {
      const [rows] = await db.query(
        `SELECT m.message_id, m.conversation_id, m.wa_message_id, m.direction,
                m.sender_type, m.message_text, m.delivery_status, m.latency_ms, m.created_at,
                c.phone_number, c.customer_name
         FROM whatsapp_messages m
         LEFT JOIN whatsapp_conversations c ON m.conversation_id = c.conversation_id
         ORDER BY m.message_id DESC LIMIT ?`,
        [limit]
      );
      return rows.map(r => ({
        ...r,
        phone_number: this.maskPhone(r.phone_number)
      }));
    } catch (e) {
      console.warn('[Observability] Recent conversations query error:', e.message);
      return [];
    }
  }
}

module.exports = new ObservabilityManager();

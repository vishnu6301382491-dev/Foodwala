/**
 * server/whatsapp/faq.js
 * Multi-Language FAQ Store & Semantic Matcher
 */

const db = require('../db');
const normalizer = require('./normalizer');

function calculateWordOverlap(text1, text2) {
  const words1 = new Set(text1.toLowerCase().split(/\s+/).filter(w => w.length > 2));
  const words2 = new Set(text2.toLowerCase().split(/\s+/).filter(w => w.length > 2));
  if (words1.size === 0 || words2.size === 0) return 0;

  let intersection = 0;
  for (const w of words1) {
    if (words2.has(w)) intersection++;
  }
  const union = new Set([...words1, ...words2]).size;
  return union === 0 ? 0 : (intersection / union);
}

class FAQEngine {
  constructor() {
    this.faqs = [];
    this.lastLoaded = 0;
  }

  async loadFaqs() {
    const now = Date.now();
    if (this.faqs.length > 0 && (now - this.lastLoaded < 10 * 60 * 1000)) {
      return this.faqs;
    }

    try {
      const [rows] = await db.query(
        'SELECT intent, question_variants_json, answer_en, answer_hi, answer_te, answer_ta, answer_kn FROM faq WHERE active = 1'
      );
      this.faqs = (rows || []).map(r => {
        const variants = typeof r.question_variants_json === 'string'
          ? JSON.parse(r.question_variants_json)
          : (r.question_variants_json || []);
        if (r.intent === 'payment_methods') {
          variants.push('can i pay with cash', 'pay with cash', 'is cod available', 'do you take cash', 'cash accepted', 'payment modes', 'payment method', 'can i pay cash', 'cash on delivery');
        }
        return {
          ...r,
          variants
        };
      });
      this.lastLoaded = now;
      return this.faqs;
    } catch (e) {
      console.warn('[FAQ] Load warning:', e.message);
      return this.faqs;
    }
  }

  /**
   * Matches query against FAQs with similarity >= 0.75
   */
  async matchFaq(rawQuery, language = 'en') {
    const list = await this.loadFaqs();
    const cleanQuery = normalizer.normalizeText(rawQuery);
    if (!cleanQuery) return null;

    let bestMatch = null;
    let highestScore = 0;

    for (const faq of list) {
      for (const variant of faq.variants) {
        const cleanVariant = normalizer.normalizeText(variant);
        
        // Exact substring match
        if (cleanQuery.includes(cleanVariant) || cleanVariant.includes(cleanQuery)) {
          highestScore = 1.0;
          bestMatch = faq;
          break;
        }

        const score = calculateWordOverlap(cleanQuery, cleanVariant);
        if (score > highestScore) {
          highestScore = score;
          bestMatch = faq;
        }
      }
      if (highestScore >= 1.0) break;
    }

    if (bestMatch && highestScore >= 0.65) {
      const langKey = `answer_${language}`;
      const answer = bestMatch[langKey] || bestMatch.answer_en || '';
      return {
        intent: bestMatch.intent,
        answer: answer,
        score: highestScore
      };
    }

    return null;
  }
}

module.exports = new FAQEngine();

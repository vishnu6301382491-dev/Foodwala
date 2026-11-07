/**
 * server/whatsapp/normalizer.js
 * Text Normalization, Spelling Variants, Language Detection & Entity Extraction
 */

const fs = require('fs');
const path = require('path');

// Load spelling variants dictionary
let spellingVariants = {};
try {
  const dictPath = path.join(__dirname, 'data/spelling_variants.json');
  spellingVariants = JSON.parse(fs.readFileSync(dictPath, 'utf8'));
} catch (e) {
  console.warn('[Normalizer] Warning: Could not load spelling_variants.json, using defaults.');
  spellingVariants = {
    biryani: ['biriyani', 'biryani', 'briyani', 'biriani', 'biryaani'],
    chicken: ['chiken', 'chikken', 'chicken'],
    paneer: ['panir', 'paneer'],
    paratha: ['parotta', 'parota', 'paratha'],
    dosa: ['dosai', 'dosa'],
    idli: ['idly', 'idli']
  };
}

// Inverted lookup map (e.g. "biriyani" -> "biryani")
const variantLookup = new Map();
for (const [canonical, variants] of Object.entries(spellingVariants)) {
  for (const v of variants) {
    variantLookup.set(v.toLowerCase(), canonical.toLowerCase());
  }
}

const WORD_NUMBERS = {
  one: 1, two: 2, three: 3, four: 4, five: 5,
  six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  ek: 1, do: 2, teen: 3, chaar: 4, paanch: 5,
  okati: 1, rendu: 2, moodu: 3, naalgau: 4, aidu: 5,
  ondhu: 1, eradhu: 2, mooru: 3, naalku: 4, aidhu: 5,
  onnu: 1, rendu: 2, moonu: 3, naalu: 4, anju: 5
};

const STOP_WORDS = new Set([
  'i', 'want', 'need', 'please', 'plz', 'one', 'a', 'an', 'the', 'to',
  'order', 'get', 'me', 'send', 'give', 'can', 'wanna', 'craving', 'feed',
  'show', 'recommend', 'suggest', 'find', 'looking', 'for', 'some', 'good',
  'best', 'popular', 'delicious', 'tasty', 'like', 'eat', 'have', 'fast',
  'delivery', 'in', 'at', 'near', 'nearby', 'around', 'here', 'bengaluru', 'bangalore',
  'koramangala', 'indiranagar', 'hsr', 'whitefield', 'jayanagar', 'jp', 'nagar', 'bellandur', 'marathahalli'
]);

class Normalizer {
  /**
   * Cleans text: lowercase, removes punctuation, replaces variants
   */
  normalizeText(rawText) {
    if (!rawText) return '';
    let text = String(rawText).trim().toLowerCase();

    // Replace special punctuation with space, keep alphanumeric and basic scripts
    text = text.replace(/[\.,\/#!$%\^&\*;:{}=\-_`~()?"'’]/g, ' ');

    // Normalize spelling variants word by word
    const tokens = text.split(/\s+/).filter(Boolean);
    const normalizedTokens = tokens.map(token => {
      if (variantLookup.has(token)) {
        return variantLookup.get(token);
      }
      return token;
    });

    return normalizedTokens.join(' ');
  }

  /**
   * Detects language (English, Hindi, Telugu, Tamil, Kannada)
   */
  detectLanguage(rawText) {
    if (!rawText) return 'en';
    const text = String(rawText);

    // 1. Script checks
    if (/[\u0900-\u097F]/.test(text)) return 'hi'; // Devanagari
    if (/[\u0C00-\u0C7F]/.test(text)) return 'te'; // Telugu
    if (/[\u0B80-\u0BFF]/.test(text)) return 'ta'; // Tamil
    if (/[\u0C80-\u0CFF]/.test(text)) return 'kn'; // Kannada

    // 2. Keyword checks for transliterated text
    const lower = text.toLowerCase();
    if (/\b(chahiye|kripya|bhai|batao|kya|hai|namaste|shukriya|mujhe|mera|order\s*kaha\s*hai)\b/.test(lower)) return 'hi';
    if (/\b(kavala|ekkada|cheppandi|enti|namaskaram|undi|naa\s*order)\b/.test(lower)) return 'te';
    if (/\b(vanakkam|enga|venum|epdi|irukku|ennoda\s*order)\b/.test(lower)) return 'ta';
    if (/\b(namaskara|yelli|beku|hege|ide|nanna\s*order)\b/.test(lower)) return 'kn';

    return 'en';
  }

  /**
   * Extracts entities: quantity, budget, veg/non-veg preference, clean dish search query
   */
  extractFoodEntities(rawText) {
    if (!rawText) return { quantity: 1, hasExplicitQuantity: false, budget: null, isVeg: null, dishQuery: '' };
    const normalized = this.normalizeText(rawText);

    let quantity = 1;
    let hasExplicitQty = false;
    let budget = null;
    let isVeg = null;

    // 1. Quantity extraction: "2 biryani", "two plates", "3 chicken"
    const qtyDigitMatch = normalized.match(/\b(\d+)\s*(?:plates?|servings?|portions?|items?|pieces?|box|boxes)?\b/);
    if (qtyDigitMatch) {
      const parsedQty = parseInt(qtyDigitMatch[1], 10);
      if (parsedQty > 0 && parsedQty <= 20) {
        quantity = parsedQty;
        hasExplicitQty = true;
      }
    } else {
      // Check word number
      for (const [w, num] of Object.entries(WORD_NUMBERS)) {
        const regex = new RegExp(`\\b${w}\\s*(?:plates?|servings?|portions?|items?)?\\b`, 'i');
        if (regex.test(normalized)) {
          quantity = num;
          hasExplicitQty = true;
          break;
        }
      }
    }

    // 2. Budget extraction: "under 200", "below 300", "under rs 250", "less than 400"
    const budgetMatch = normalized.match(/(?:under|below|less\s*than|within|max)\s*(?:rs|inr|₹)?\s*(\d+)/i);
    if (budgetMatch) {
      budget = parseFloat(budgetMatch[1]);
    }

    // 3. Veg / Non-Veg preference
    if (/\b(?:pure\s*veg|vegetarian|only\s*veg|veg\s*only)\b/i.test(normalized)) {
      isVeg = true;
    } else if (/\b(?:non\s*veg|nonveg|chicken|mutton|fish|meat|egg)\b/i.test(normalized)) {
      isVeg = false;
    } else if (/\bveg\b/i.test(normalized)) {
      isVeg = true;
    }

    // 4. Strip out quantity, budget, and stop words to get clean dish search term
    let dishWords = normalized
      .replace(/\b\d+\s*(?:plates?|servings?|portions?|items?|pieces?|box|boxes)?\b/g, '')
      .replace(/(?:under|below|less\s*than|within|max)\s*(?:rs|inr|₹)?\s*\d+/g, '')
      .split(/\s+/)
      .filter(w => !STOP_WORDS.has(w) && !WORD_NUMBERS[w] && w.length > 1);

    const dishQuery = dishWords.join(' ').trim();

    return {
      quantity,
      hasExplicitQuantity: hasExplicitQty,
      budget,
      isVeg,
      dishQuery: dishQuery || normalized
    };
  }

  /**
   * Extracts Order ID (e.g. FW70, #80, FW123)
   */
  extractOrderId(rawText) {
    if (!rawText) return null;
    const fwMatch = String(rawText).match(/\bFW(\d+)\b/i);
    if (fwMatch) return parseInt(fwMatch[1], 10);

    const hashMatch = String(rawText).match(/#(?:FW)?(\d+)\b/i);
    if (hashMatch) return parseInt(hashMatch[1], 10);

    const orderIdMatch = String(rawText).match(/(?:order\s*(?:id|#|number|no\.?)?\s*[:#-]?\s*)(\d+)/i);
    if (orderIdMatch) return parseInt(orderIdMatch[1], 10);

    // Bare number if short text
    if (/^\d{1,6}$/.test(rawText.trim())) {
      return parseInt(rawText.trim(), 10);
    }

    return null;
  }
}

module.exports = new Normalizer();

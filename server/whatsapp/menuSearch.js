/**
 * server/whatsapp/menuSearch.js
 * Multi-Tier Fuzzy Menu Search Engine with Live Cache & WhatsApp Interactive Payload Generation
 */

const db = require('../db');
const normalizer = require('./normalizer');

// Levenshtein similarity (0.0 to 1.0)
function calculateSimilarity(str1, str2) {
  if (!str1 || !str2) return 0;
  const s1 = str1.toLowerCase();
  const s2 = str2.toLowerCase();
  if (s1 === s2) return 1.0;
  if (s1.includes(s2) || s2.includes(s1)) return 0.85;

  const track = Array(s2.length + 1).fill(null).map(() =>
    Array(s1.length + 1).fill(null));
  for (let i = 0; i <= s1.length; i += 1) track[0][i] = i;
  for (let j = 0; j <= s2.length; j += 1) track[j][0] = j;

  for (let j = 1; j <= s2.length; j += 1) {
    for (let i = 1; i <= s1.length; i += 1) {
      const indicator = s1[i - 1] === s2[j - 1] ? 0 : 1;
      track[j][i] = Math.min(
        track[j][i - 1] + 1,
        track[j - 1][i] + 1,
        track[j - 1][i - 1] + indicator
      );
    }
  }

  const distance = track[s2.length][s1.length];
  const maxLen = Math.max(s1.length, s2.length);
  return maxLen === 0 ? 1 : 1 - (distance / maxLen);
}

class MenuSearchEngine {
  constructor() {
    this.cache = [];
    this.lastCacheRefresh = 0;
    this.CACHE_TTL_MS = 3 * 60 * 1000; // 3 minutes
  }

  /**
   * Refreshes or retrieves active menu items from cache
   */
  async getCachedMenu() {
    const now = Date.now();
    if (this.cache.length > 0 && (now - this.lastCacheRefresh < this.CACHE_TTL_MS)) {
      return this.cache;
    }

    try {
      const [rows] = await db.query(`
        SELECT m.menu_id, m.restaurant_id, m.item_name, m.description, m.price,
               m.is_available, m.is_veg, m.is_popular, m.rating, m.category_name,
               r.name as restaurant_name, r.cuisine_type, r.area, r.delivery_time,
               r.is_open, r.is_active
        FROM menu m
        JOIN restaurant r ON m.restaurant_id = r.restaurant_id
        WHERE m.is_available = 1 AND (r.is_active = 1 OR r.is_active IS NULL)
        ORDER BY m.rating DESC, m.menu_id ASC
      `);

      this.cache = (rows || []).map(item => ({
        ...item,
        cleanName: normalizer.normalizeText(item.item_name),
        price: parseFloat(item.price) || 0,
        deliveryTime: parseInt(item.delivery_time, 10) || 30,
        isOpen: item.is_open === 1 || item.is_open === null
      }));
      this.lastCacheRefresh = now;
      return this.cache;
    } catch (err) {
      console.warn('[MenuSearch] Cache load warning:', err.message);
      return this.cache;
    }
  }

  /**
   * Main Search Method
   * Search order: exact match -> alias/normalized match -> fuzzy similarity -> category -> cuisine
   */
  async searchMenu(rawQuery, filters = {}) {
    const menu = await this.getCachedMenu();
    const entities = normalizer.extractFoodEntities(rawQuery);
    const searchTarget = entities.dishQuery || normalizer.normalizeText(rawQuery);

    const isVegFilter = filters.isVeg !== undefined ? filters.isVeg : entities.isVeg;
    const budgetFilter = filters.budget !== undefined ? filters.budget : entities.budget;

    // Filter available and open restaurants
    let pool = menu.filter(m => m.isOpen);

    if (isVegFilter !== null && isVegFilter !== undefined) {
      pool = pool.filter(m => Boolean(m.is_veg) === Boolean(isVegFilter));
    }

    if (budgetFilter) {
      pool = pool.filter(m => m.price <= budgetFilter);
    }

    const explicitQty = entities.hasExplicitQuantity ? entities.quantity : null;

    if (!searchTarget || searchTarget === 'menu' || searchTarget === 'food') {
      // General top recommendations
      return {
        query: searchTarget,
        quantity: explicitQty,
        matches: pool.slice(0, 10),
        totalFound: pool.length,
        isPopularFallback: true
      };
    }

    // Tier 1: Exact item name match
    const exactMatches = pool.filter(m => m.cleanName === searchTarget);
    if (exactMatches.length > 0) {
      return { query: searchTarget, quantity: explicitQty, matches: exactMatches, totalFound: exactMatches.length, isPopularFallback: false, isExactDishMatch: true };
    }

    // Tier 2: Substring / Token match across item name, restaurant, area, and cuisine
    const tokenMatches = pool.filter(m => {
      const words = searchTarget.split(/\s+/).filter(w => w.length > 1);
      const combined = `${m.cleanName} ${(m.restaurant_name || '').toLowerCase()} ${(m.area || '').toLowerCase()} ${(m.cuisine_type || '').toLowerCase()}`;
      return words.every(w => combined.includes(w));
    });

    if (tokenMatches.length > 0) {
      return { query: searchTarget, quantity: explicitQty, matches: tokenMatches, totalFound: tokenMatches.length, isPopularFallback: false };
    }

    // Tier 3: Category or Cuisine match (e.g. "Chinese", "Pizza", "Beverages")
    const categoryMatches = pool.filter(m => {
      const cat = (m.category_name || '').toLowerCase();
      const cuis = (m.cuisine_type || '').toLowerCase();
      return cat.includes(searchTarget) || cuis.includes(searchTarget);
    });

    if (categoryMatches.length > 0) {
      return { query: searchTarget, quantity: explicitQty, matches: categoryMatches, totalFound: categoryMatches.length, isPopularFallback: false };
    }

    // Tier 4: Fuzzy similarity (Levenshtein score >= 0.6)
    const scored = pool.map(m => {
      const score = calculateSimilarity(m.cleanName, searchTarget);
      return { ...m, score };
    }).filter(m => m.score >= 0.6);

    scored.sort((a, b) => b.score - a.score);

    if (scored.length > 0) {
      return { query: searchTarget, quantity: explicitQty, matches: scored, totalFound: scored.length, isPopularFallback: false };
    }

    // Tier 5: No direct match -> Top 5 popular items fallback
    const popularPicks = pool.filter(m => m.is_popular || m.rating >= 4.5).slice(0, 5);
    return {
      query: searchTarget,
      quantity: explicitQty,
      matches: popularPicks.length > 0 ? popularPicks : pool.slice(0, 5),
      totalFound: 0,
      isPopularFallback: true
    };
  }

  /**
   * Builds the appropriate WhatsApp message payload according to Phase 5 specs:
   * - 1 match -> Quick reply buttons
   * - 2-10 matches -> Interactive List Message
   * - > 10 matches -> Top 9 + "See more options" (paginate)
   * - 0 matches -> Not found message + popular items list
   */
  formatSearchResults(toWaId, searchResult, offset = 0) {
    const { matches, totalFound, query, quantity, isPopularFallback } = searchResult;
    const defaultQty = quantity || 1;
    const couponCode = 'FOODWALA50';

    // A. 0 Matches: Not Found + Popular Items
    if (isPopularFallback && totalFound === 0) {
      const rows = matches.slice(0, 5).map(m => ({
        id: quantity ? `ADD_ITEM:${m.menu_id}:${quantity}` : `SELECT_ITEM:${m.menu_id}`,
        title: `${m.is_veg ? '🟢' : '🔴'} ${m.item_name}`.substring(0, 24),
        description: `₹${m.price} | ${m.restaurant_name} | ${m.deliveryTime} min`.substring(0, 72)
      }));

      const popularSummary = matches.slice(0, 5).map(m => `${m.is_veg ? '🟢' : '🔴'} *${m.item_name}* - ₹${m.price} (${m.restaurant_name})`).join('\n');

      return {
        type: 'list',
        headerText: 'Popular Dishes on FoodWala',
        bodyText: `Sorry, we couldn't find active dishes matching *"${query}"*.\n\nHere are our customer favorites right now:\n${popularSummary}\n\n*Popular Food Categories:* Biryani, Pizza, Burgers, Desserts, Rolls.\nUse coupon code *${couponCode}* for ₹50 off!`,
        buttonText: 'View Popular Food',
        sections: [{ title: 'Popular Picks', rows }]
      };
    }

    // B. Exactly 1 Match: Buttons
    if (matches.length === 1) {
      const item = matches[0];
      const vegIcon = item.is_veg ? '🟢 Veg' : '🔴 Non-Veg';
      const body = `🍽️ *${item.item_name}*\nFrom: *${item.restaurant_name}*\nPrice: *₹${item.price}* (${vegIcon})\nETA: *${item.deliveryTime} mins* ⭐ ${item.rating || 4.5}\nUse coupon code *${couponCode}* for extra discount!\n\nWould you like to add this to your cart?`;

      return {
        type: 'buttons',
        bodyText: body,
        buttons: [
          { id: quantity ? `ADD_ITEM:${item.menu_id}:${quantity}` : `SELECT_ITEM:${item.menu_id}`, title: `Add to Cart (₹${item.price})` },
          { id: `VIEW_MENU:${item.restaurant_id}`, title: 'View More Items' },
          { id: 'CMD_ORDER', title: 'Browse Other Food' }
        ]
      };
    }

    // C. 2 to 10 Matches (or > 10 Paginated): Interactive List Message
    const remaining = matches.slice(offset);
    const isPaginated = remaining.length > 10;
    const itemsToShow = remaining.slice(0, isPaginated ? 9 : 10);

    const rows = itemsToShow.map(m => ({
      id: quantity ? `ADD_ITEM:${m.menu_id}:${quantity}` : `SELECT_ITEM:${m.menu_id}`,
      title: `${m.is_veg ? '🟢' : '🔴'} ${m.item_name}`.substring(0, 24),
      description: `₹${m.price} | ${m.restaurant_name} | ${m.deliveryTime} min`.substring(0, 72)
    }));

    if (isPaginated) {
      const nextOffset = offset + 9;
      rows.push({
        id: `SEARCH_MORE:${query}:${nextOffset}`,
        title: '➡️ See more options',
        description: `View next page (${matches.length - nextOffset} remaining)`
      });
    }

    const titleCap = (query ? (query.charAt(0).toUpperCase() + query.slice(1)) : 'Food');
    const dishSummary = itemsToShow.slice(0, 5).map(m => `${m.is_veg ? '🟢' : '🔴'} *${m.item_name}* - ₹${m.price} (${m.restaurant_name})`).join('\n');

    return {
      type: 'list',
      headerText: `${titleCap} Options`.substring(0, 60),
      bodyText: `Craving ${titleCap}! Great choice! Here are top *${titleCap}* options from our menu:\n\n${dishSummary}\n\nUse coupon *${couponCode}* for ₹50 off!\nTap *Select Dish* below to choose your item:`,
      buttonText: 'Select Dish',
      sections: [{
        title: `${titleCap} Options`.substring(0, 24),
        rows: rows
      }]
    };
  }
}

module.exports = new MenuSearchEngine();

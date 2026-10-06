/**
 * FoodWala Smart Search Engine
 * Operates across complete Bengaluru restaurant dataset (data/restaurants.json & data/menu-items.json)
 * Supports typo tolerance (Jaro-Winkler), phonetic alias resolution, multi-attribute matching, and dynamic filtering.
 */

(function (window) {
  'use strict';

  const ALIAS_DICTIONARY = {
    // Biryani variations
    'biriyani': 'biryani',
    'briyani': 'biryani',
    'birany': 'biryani',
    'biryani': 'biryani',
    'biryaani': 'biryani',
    'biryan': 'biryani',
    'dumbiriyani': 'dum biryani',
    'dumbiryani': 'dum biryani',
    'dum biriyani': 'dum biryani',
    'chiken biryani': 'chicken biryani',
    'chikn biryani': 'chicken biryani',
    'chickn biryani': 'chicken biryani',
    'chicken biriyani': 'chicken biryani',
    'chiken biriyani': 'chicken biryani',
    'mutton biriyani': 'mutton biryani',
    'muttan biryani': 'mutton biryani',
    'egg biriyani': 'egg biryani',
    'veg biriyani': 'veg biryani',
    'donne biriyani': 'donne biryani',
    'donnebiryani': 'donne biryani',
    'hyderabadi biriyani': 'hyderabadi biryani',
    'ambur biriyani': 'ambur biryani',

    // Dosa variations
    'dhosa': 'dosa',
    'dosai': 'dosa',
    'dose': 'dosa',
    'dosa': 'dosa',
    'masaladosa': 'masala dosa',
    'masala dhosa': 'masala dosa',
    'masala dose': 'masala dosa',
    'bennedosa': 'benne dosa',
    'benne dose': 'benne dosa',
    'butter dosa': 'benne dosa',
    'ravadosa': 'rava dosa',
    'ghee roast': 'ghee roast dosa',

    // Idli & Vada
    'idly': 'idli',
    'iddly': 'idli',
    'thatte idly': 'thatte idli',
    'thatteidli': 'thatte idli',
    'wada': 'vada',
    'medu vada': 'vada',
    'idli vada': 'idli vada',

    // Paneer
    'panner': 'paneer',
    'paner': 'paneer',
    'paneer': 'paneer',
    'panner butter masala': 'paneer butter masala',
    'paneerbuttermasala': 'paneer butter masala',
    'panner tikka': 'paneer tikka',
    'kadai panner': 'kadai paneer',

    // Chicken
    'chiken': 'chicken',
    'chikn': 'chicken',
    'chickn': 'chicken',
    'chikin': 'chicken',
    'chicken': 'chicken',
    'butter chiken': 'butter chicken',
    'butterchicken': 'butter chicken',
    'chiken tikka': 'chicken tikka',
    'chiken kebab': 'chicken kebab',
    'chilli chiken': 'chilli chicken',

    // Fast food & Chinese
    'piza': 'pizza',
    'pizaa': 'pizza',
    'burgur': 'burger',
    'burgr': 'burger',
    'shawarma': 'shawarma',
    'shavarma': 'shawarma',
    'shwarma': 'shawarma',
    'momos': 'momo',
    'dimsum': 'momo',
    'noodles': 'noodles',
    'noddles': 'noodles',
    'nudles': 'noodles',
    'chowmein': 'noodles',
    'friedrice': 'fried rice',

    // Beverages & Sweets
    'coffee': 'filter coffee',
    'kaapi': 'filter coffee',
    'chai': 'tea',
    'icecream': 'ice cream',
    'lassi': 'lassi',
    'falooda': 'falooda',
    'gulab jamun': 'gulab jamun'
  };

  const CANONICAL_NAMES = {
    'biryani': 'Biryani',
    'dum biryani': 'Dum Biryani',
    'chicken biryani': 'Chicken Biryani',
    'mutton biryani': 'Mutton Biryani',
    'donne biryani': 'Donne Biryani',
    'dosa': 'Dosa',
    'masala dosa': 'Masala Dosa',
    'benne dosa': 'Benne Dosa',
    'idli': 'Idli',
    'vada': 'Vada',
    'paneer': 'Paneer',
    'paneer butter masala': 'Paneer Butter Masala',
    'chicken': 'Chicken',
    'butter chicken': 'Butter Chicken',
    'pizza': 'Pizza',
    'burger': 'Burger',
    'shawarma': 'Shawarma',
    'momos': 'Momos',
    'noodles': 'Noodles',
    'filter coffee': 'Filter Coffee',
    'tea': 'Chai / Tea',
    'ice cream': 'Ice Cream'
  };

  function normalize(str) {
    if (!str) return '';
    return String(str).toLowerCase().trim().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ');
  }

  function jaroWinkler(s1, s2) {
    if (!s1 || !s2) return 0.0;
    if (s1 === s2) return 1.0;

    const len1 = s1.length;
    const len2 = s2.length;
    const maxDist = Math.max(Math.floor(Math.max(len1, len2) / 2) - 1, 0);

    const match1 = new Array(len1).fill(false);
    const match2 = new Array(len2).fill(false);

    let matches = 0;
    for (let i = 0; i < len1; i++) {
      const start = Math.max(0, i - maxDist);
      const end = Math.min(i + maxDist + 1, len2);
      for (let j = start; j < end; j++) {
        if (!match2[j] && s1[i] === s2[j]) {
          match1[i] = true;
          match2[j] = true;
          matches++;
          break;
        }
      }
    }

    if (matches === 0) return 0.0;

    let t = 0;
    let point = 0;
    for (let i = 0; i < len1; i++) {
      if (match1[i]) {
        while (!match2[point]) point++;
        if (s1[i] !== s2[point]) t++;
        point++;
      }
    }
    const transpositions = t / 2.0;
    const jaro = (matches / len1 + matches / len2 + (matches - transpositions) / matches) / 3.0;

    let prefix = 0;
    for (let i = 0; i < Math.min(4, Math.min(len1, len2)); i++) {
      if (s1[i] === s2[i]) prefix++;
      else break;
    }

    return jaro + (prefix * 0.1 * (1.0 - jaro));
  }

  function getSearchTokens(query) {
    const tokens = new Set();
    const norm = normalize(query);
    if (!norm) return tokens;

    tokens.add(norm);
    const noSpaces = norm.replace(/\s+/g, '');
    if (noSpaces !== norm) tokens.add(noSpaces);

    // Alias lookups
    if (ALIAS_DICTIONARY[norm]) tokens.add(ALIAS_DICTIONARY[norm]);
    if (ALIAS_DICTIONARY[noSpaces]) tokens.add(ALIAS_DICTIONARY[noSpaces]);

    // Token substitutions
    const parts = norm.split(' ');
    if (parts.length > 1) {
      const replaced = parts.map(p => ALIAS_DICTIONARY[p] || p).join(' ');
      tokens.add(replaced);
    }

    // Phonetic corrections
    if (/biriyani|briyani/i.test(norm)) tokens.add(norm.replace(/biriyani|briyani/g, 'biryani'));
    if (/dhosa|dose/i.test(norm)) tokens.add(norm.replace(/dhosa|dose/g, 'dosa'));
    if (/panner/i.test(norm)) tokens.add(norm.replace(/panner/g, 'paneer'));
    if (/chiken|chikn/i.test(norm)) tokens.add(norm.replace(/chiken|chikn/g, 'chicken'));

    return Array.from(tokens);
  }

  function getDidYouMean(rawQuery) {
    if (!rawQuery || rawQuery.trim().length < 3) return null;
    const norm = normalize(rawQuery);
    const noSpace = norm.replace(/\s+/g, '');

    if (ALIAS_DICTIONARY[norm] && ALIAS_DICTIONARY[norm] !== norm) {
      return CANONICAL_NAMES[ALIAS_DICTIONARY[norm]] || ALIAS_DICTIONARY[norm];
    }
    if (ALIAS_DICTIONARY[noSpace] && ALIAS_DICTIONARY[noSpace] !== norm) {
      return CANONICAL_NAMES[ALIAS_DICTIONARY[noSpace]] || ALIAS_DICTIONARY[noSpace];
    }

    let bestCanonical = null;
    let bestScore = 0.0;
    for (const [key, display] of Object.entries(CANONICAL_NAMES)) {
      const sim = jaroWinkler(norm, key);
      if (sim > bestScore && sim >= 0.78 && key !== norm) {
        bestScore = sim;
        bestCanonical = display;
      }
    }

    return bestCanonical;
  }

  // Master Search Function
  function search(rawQuery, filters = {}, datasetRestaurants = null, datasetMenus = null) {
    const restaurants = datasetRestaurants || (window.FoodWalaApp ? window.FoodWalaApp.getRestaurants() : window.FOODWALA_RESTAURANTS) || [];
    const menus = datasetMenus || (window.FoodWalaApp ? window.FoodWalaApp.getMenuItems() : window.FOODWALA_MENUS) || [];

    const query = (rawQuery || '').trim();
    const tokens = getSearchTokens(query);
    const didYouMean = getDidYouMean(query);
    const correctedTerm = tokens.length > 1 ? tokens[1] : (tokens[0] || query);

    // Group menu items by restaurantId for fast matching
    const menuMap = new Map();
    for (let i = 0; i < menus.length; i++) {
      const m = menus[i];
      const rId = m.restaurantId;
      if (!menuMap.has(rId)) menuMap.set(rId, []);
      menuMap.get(rId).push(m);
    }

    const matchedResults = [];

    for (let i = 0; i < restaurants.length; i++) {
      const r = restaurants[i];
      const rItems = menuMap.get(r.restaurantId || r.id) || [];

      // 1. Text Matching Score
      let score = 0;
      const matchedDishes = [];

      if (tokens.length === 0) {
        // No search query: all restaurants match
        score = 100 + (r.rating || 4.0) * 10;
      } else {
        const rNameNorm = normalize(r.name);
        const rCuisineNorm = normalize(r.cuisineType || '');
        const rAreaNorm = normalize(r.area || '');
        const rAddressNorm = normalize(r.address || '');

        for (const token of tokens) {
          const tNorm = normalize(token);
          if (!tNorm) continue;

          // Match Restaurant Name
          if (rNameNorm === tNorm) {
            score = Math.max(score, 500);
          } else if (rNameNorm.startsWith(tNorm)) {
            score = Math.max(score, 350);
          } else if (rNameNorm.includes(tNorm)) {
            score = Math.max(score, 250);
          } else {
            const jw = jaroWinkler(rNameNorm, tNorm);
            if (jw >= 0.82) score = Math.max(score, Math.round(jw * 200));
          }

          // Match Cuisine
          if (rCuisineNorm.includes(tNorm)) {
            score = Math.max(score, 200);
          } else {
            const jwC = jaroWinkler(rCuisineNorm, tNorm);
            if (jwC >= 0.82) score = Math.max(score, Math.round(jwC * 160));
          }

          // Match Area / Location
          if (rAreaNorm.includes(tNorm) || rAddressNorm.includes(tNorm)) {
            score = Math.max(score, 180);
          }

          // Match Dishes inside Menu
          for (let j = 0; j < rItems.length; j++) {
            const dish = rItems[j];
            const dishNameNorm = normalize(dish.name || dish.itemName || '');
            const dishCatNorm = normalize(dish.category || dish.categoryName || '');

            if (dishNameNorm === tNorm) {
              score = Math.max(score, 320);
              if (!matchedDishes.find(d => d.id === dish.id)) matchedDishes.push(dish);
            } else if (dishNameNorm.startsWith(tNorm)) {
              score = Math.max(score, 260);
              if (!matchedDishes.find(d => d.id === dish.id)) matchedDishes.push(dish);
            } else if (dishNameNorm.includes(tNorm)) {
              score = Math.max(score, 220);
              if (!matchedDishes.find(d => d.id === dish.id)) matchedDishes.push(dish);
            } else if (dishCatNorm.includes(tNorm)) {
              score = Math.max(score, 180);
              if (!matchedDishes.find(d => d.id === dish.id)) matchedDishes.push(dish);
            } else {
              const jwD = jaroWinkler(dishNameNorm, tNorm);
              if (jwD >= 0.82) {
                score = Math.max(score, Math.round(jwD * 190));
                if (!matchedDishes.find(d => d.id === dish.id)) matchedDishes.push(dish);
              }
            }
          }
        }
      }

      if (tokens.length > 0 && score === 0) {
        continue; // Does not match search query
      }

      // 2. Apply Filters
      if (filters.area && filters.area !== 'all') {
        const targetArea = normalize(filters.area);
        const rArea = normalize(r.area || '');
        const rAddr = normalize(r.address || '');
        if (!rArea.includes(targetArea) && !rAddr.includes(targetArea)) {
          continue;
        }
      }

      if (filters.cuisine && filters.cuisine !== 'all') {
        const targetCuisine = normalize(filters.cuisine);
        const rCuisines = normalize(r.cuisineType || '');
        if (!rCuisines.includes(targetCuisine)) {
          continue;
        }
      }

      if (filters.pureVeg && !r.isPureVeg) {
        continue;
      }

      if (filters.topRated && (r.rating || 0) < 4.0) {
        continue;
      }

      if (filters.fastDelivery && (r.deliveryTime || 40) > 30) {
        continue;
      }

      if (filters.openNow && !r.isOpen && !r.isActive) {
        continue;
      }

      // Distance calculation (based on user location or default)
      const userLoc = window.FoodWalaApp ? window.FoodWalaApp.Location.getCurrentLocation() : { lat: 12.9352, lng: 77.6245 };
      const dist = (window.FoodWalaApp && window.FoodWalaApp.Location)
        ? window.FoodWalaApp.Location.calculateDistance(userLoc.lat, userLoc.lng, r.latitude, r.longitude)
        : (r.distance || 3.2);

      if (filters.within5km && dist > 5.0) {
        continue;
      }

      if (filters.within10km && dist > 10.0) {
        continue;
      }

      matchedResults.push({
        ...r,
        distance: dist,
        score: score,
        matchedDishes: matchedDishes
      });
    }

    // 3. Sorting
    const sortBy = filters.sortBy || 'relevance';
    matchedResults.sort((a, b) => {
      if (sortBy === 'rating') {
        return (b.rating || 0) - (a.rating || 0);
      } else if (sortBy === 'deliveryTime') {
        return (a.deliveryTime || 30) - (b.deliveryTime || 30);
      } else if (sortBy === 'distance') {
        return (a.distance || 0) - (b.distance || 0);
      } else if (sortBy === 'cost_asc') {
        return (a.costForTwo || 400) - (b.costForTwo || 400);
      } else if (sortBy === 'cost_desc') {
        return (b.costForTwo || 400) - (a.costForTwo || 400);
      } else {
        // Relevance
        return b.score - a.score || (b.rating || 0) - (a.rating || 0);
      }
    });

    return {
      restaurants: matchedResults,
      totalCount: matchedResults.length,
      didYouMean: didYouMean,
      correctedTerm: correctedTerm,
      query: rawQuery
    };
  }

  // Fast Autocomplete Suggestions across all dishes, cuisines, restaurants, areas
  function getSuggestions(prefix, limit = 6) {
    if (!prefix || prefix.trim().length < 2) return [];
    const norm = normalize(prefix);
    const suggestions = [];
    const seen = new Set();

    const restaurants = (window.FoodWalaApp ? window.FoodWalaApp.getRestaurants() : window.FOODWALA_RESTAURANTS) || [];
    const menus = (window.FoodWalaApp ? window.FoodWalaApp.getMenuItems() : window.FOODWALA_MENUS) || [];

    // 1. Check Canonical food dishes
    for (const [key, display] of Object.entries(CANONICAL_NAMES)) {
      if ((key.startsWith(norm) || key.includes(norm) || jaroWinkler(norm, key) >= 0.78) && !seen.has(display.toLowerCase())) {
        suggestions.push({ text: display, type: 'dish' });
        seen.add(display.toLowerCase());
        if (suggestions.length >= limit) return suggestions;
      }
    }

    // 2. Check Popular Menu items
    for (let i = 0; i < menus.length; i++) {
      const dishName = menus[i].name || menus[i].itemName || '';
      const dNorm = normalize(dishName);
      if ((dNorm.startsWith(norm) || dNorm.includes(norm)) && !seen.has(dNorm)) {
        suggestions.push({ text: dishName, type: 'dish' });
        seen.add(dNorm);
        if (suggestions.length >= limit) return suggestions;
      }
    }

    // 3. Check Restaurant Names
    for (let i = 0; i < restaurants.length; i++) {
      const rName = restaurants[i].name || '';
      const rNorm = normalize(rName);
      if ((rNorm.startsWith(norm) || rNorm.includes(norm)) && !seen.has(rNorm)) {
        suggestions.push({ text: rName, type: 'restaurant' });
        seen.add(rNorm);
        if (suggestions.length >= limit) return suggestions;
      }
    }

    // 4. Check Cuisines
    const cuisines = ['Biryani', 'South Indian', 'North Indian', 'Chinese', 'Italian', 'Burgers', 'Desserts', 'Cafe', 'Street Food'];
    for (const c of cuisines) {
      const cNorm = normalize(c);
      if ((cNorm.startsWith(norm) || cNorm.includes(norm)) && !seen.has(cNorm)) {
        suggestions.push({ text: c, type: 'cuisine' });
        seen.add(cNorm);
        if (suggestions.length >= limit) return suggestions;
      }
    }

    return suggestions;
  }

  window.FoodWalaSearch = {
    search,
    getSuggestions,
    getSearchTokens,
    getDidYouMean,
    jaroWinkler,
    normalize,
    ALIAS_DICTIONARY,
    CANONICAL_NAMES
  };

  // Backward compatibility alias
  window.FoodSearch = window.FoodWalaSearch;

})(window);

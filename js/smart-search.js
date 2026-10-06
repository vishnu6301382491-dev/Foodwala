/**
 * FoodWala Smart Food Search & Typo-Tolerant Engine (Static Demo Port)
 * Ported from com.tap.util.FoodAliasDictionary & com.tap.util.FuzzySearchUtil
 */
(function(window) {
    'use strict';

    const FoodSearch = {};

    // 1. Canonical Food Display Names
    const CANONICAL_DISPLAY = {
        'biryani': 'Biryani',
        'dum biryani': 'Dum Biryani',
        'chicken biryani': 'Chicken Biryani',
        'mutton biryani': 'Mutton Biryani',
        'egg biryani': 'Egg Biryani',
        'veg biryani': 'Veg Biryani',
        'donne biryani': 'Donne Biryani',
        'hyderabadi biryani': 'Hyderabadi Biryani',
        'ambur biryani': 'Ambur Biryani',
        'dosa': 'Dosa',
        'masala dosa': 'Masala Dosa',
        'benne dosa': 'Benne Dosa',
        'set dosa': 'Set Dosa',
        'rava dosa': 'Rava Dosa',
        'ghee roast dosa': 'Ghee Roast Dosa',
        'idli': 'Idli',
        'idli vada': 'Idli Vada',
        'thatte idli': 'Thatte Idli',
        'vada': 'Medu Vada',
        'paneer': 'Paneer',
        'paneer butter masala': 'Paneer Butter Masala',
        'paneer tikka': 'Paneer Tikka',
        'kadai paneer': 'Kadai Paneer',
        'chicken': 'Chicken',
        'butter chicken': 'Butter Chicken',
        'chicken tikka': 'Chicken Tikka',
        'chicken kebab': 'Chicken Kebab',
        'chilli chicken': 'Chilli Chicken',
        'pizza': 'Pizza',
        'margherita pizza': 'Margherita Pizza',
        'burger': 'Burger',
        'chicken burger': 'Chicken Burger',
        'veg burger': 'Veg Burger',
        'shawarma': 'Shawarma',
        'chicken shawarma': 'Chicken Shawarma',
        'momo': 'Momos',
        'steamed momos': 'Steamed Momos',
        'fried momos': 'Fried Momos',
        'pasta': 'Pasta',
        'noodles': 'Noodles',
        'fried rice': 'Fried Rice',
        'sandwich': 'Sandwich',
        'filter coffee': 'Filter Coffee',
        'tea': 'Chai / Tea',
        'lassi': 'Lassi',
        'ice cream': 'Ice Cream',
        'falooda': 'Falooda',
        'south indian': 'South Indian',
        'north indian': 'North Indian',
        'chinese': 'Chinese',
        'thali': 'Meals / Thali'
    };

    // 2. Transliterations, Misspellings & Common Synonyms
    const ALIAS_MAP = {
        // Biryani variations
        'biriyani': 'biryani',
        'briyani': 'biryani',
        'birany': 'biryani',
        'biryani': 'biryani',
        'biryaani': 'biryani',
        'biryan': 'biryani',
        'biryanis': 'biryani',
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
        'muttonbiryani': 'mutton biryani',
        'egg biriyani': 'egg biryani',
        'eggbiryani': 'egg biryani',
        'veg biriyani': 'veg biryani',
        'vegbiryani': 'veg biryani',
        'donne biriyani': 'donne biryani',
        'donnebiryani': 'donne biryani',

        // Dosa variations
        'dhosa': 'dosa',
        'dosai': 'dosa',
        'dose': 'dosa',
        'dosa': 'dosa',
        'masaladosa': 'masala dosa',
        'masala dhosa': 'masala dosa',
        'masala dose': 'masala dosa',
        'masaladhosa': 'masala dosa',
        'bennedosa': 'benne dosa',
        'benne dose': 'benne dosa',
        'butter dosa': 'benne dosa',

        // Idli & Vada variations
        'idly': 'idli',
        'iddly': 'idli',
        'idli': 'idli',
        'idlivada': 'idli vada',
        'idly vada': 'idli vada',
        'thatte idly': 'thatte idli',
        'thatteidli': 'thatte idli',
        'wada': 'vada',
        'vada': 'vada',
        'medu vada': 'vada',
        'meduvada': 'vada',

        // Paneer variations
        'panner': 'paneer',
        'paner': 'paneer',
        'paneer': 'paneer',
        'panner butter masala': 'paneer butter masala',
        'paneerbuttermasala': 'paneer butter masala',
        'panner tikka': 'paneer tikka',
        'paneertikka': 'paneer tikka',

        // Chicken variations
        'chiken': 'chicken',
        'chikn': 'chicken',
        'chickn': 'chicken',
        'chikin': 'chicken',
        'chicken': 'chicken',
        'butter chiken': 'butter chicken',
        'butterchicken': 'butter chicken',
        'chiken tikka': 'chicken tikka',
        'chickentikka': 'chicken tikka',
        'chiken kebab': 'chicken kebab',
        'chickenkebab': 'chicken kebab',

        // Fast foods
        'piza': 'pizza',
        'pizaa': 'pizza',
        'pizza': 'pizza',
        'burgur': 'burger',
        'burgr': 'burger',
        'burger': 'burger',
        'shawarma': 'shawarma',
        'shavarma': 'shawarma',
        'shawrma': 'shawarma',
        'shwarma': 'shawarma',
        'roll': 'shawarma',
        'momos': 'momo',
        'momo': 'momo',
        'dimsum': 'momo',
        'noodles': 'noodles',
        'noddles': 'noodles',
        'nudles': 'noodles',
        'chowmein': 'noodles',
        'friedrice': 'fried rice',

        // Beverages & Desserts
        'coffee': 'filter coffee',
        'kaapi': 'filter coffee',
        'filtercoffee': 'filter coffee',
        'chai': 'tea',
        'tea': 'tea',
        'lassi': 'lassi',
        'icecream': 'ice cream',
        'ice cream': 'ice cream',

        // Cuisines
        'southindian': 'south indian',
        'south indian': 'south indian',
        'northindian': 'north indian',
        'north indian': 'north indian',
        'thali': 'thali',
        'meals': 'thali'
    };

    const POPULAR_SEARCHES = [
        'Biryani', 'Masala Dosa', 'Pizza', 'Burger', 'Paneer Butter Masala',
        'Shawarma', 'Filter Coffee', 'Momos', 'Butter Chicken', 'Ice Cream'
    ];

    FoodSearch.normalize = function(str) {
        if (!str) return '';
        return String(str).toLowerCase().trim().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ');
    };

    FoodSearch.jaroWinkler = function(s1, s2) {
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
    };

    FoodSearch.getSearchTokensAndAliases = function(rawQuery) {
        const result = new Set();
        if (!rawQuery || !rawQuery.trim()) return result;

        const norm = FoodSearch.normalize(rawQuery);
        const noSpace = norm.replace(/\s+/g, '');
        result.add(norm);
        if (noSpace !== norm) result.add(noSpace);

        // 1. Direct alias check
        if (ALIAS_MAP[norm]) result.add(ALIAS_MAP[norm]);
        if (ALIAS_MAP[noSpace]) result.add(ALIAS_MAP[noSpace]);

        // 2. Token level replacement
        const tokens = norm.split(' ');
        if (tokens.length > 1) {
            const replaced = tokens.map(t => ALIAS_MAP[t] || t).join(' ');
            result.add(replaced);
            if (ALIAS_MAP[replaced]) result.add(ALIAS_MAP[replaced]);
        }

        // 3. Known phonetic substitutions
        if (/biriyani|briyani|birany/i.test(norm)) result.add(norm.replace(/biriyani|briyani|birany/g, 'biryani'));
        if (/dhosa|dosai|dose/i.test(norm)) result.add(norm.replace(/dhosa|dosai|dose/g, 'dosa'));
        if (/idly/i.test(norm)) result.add(norm.replace(/idly/g, 'idli'));
        if (/panner/i.test(norm)) result.add(norm.replace(/panner/g, 'paneer'));
        if (/chiken|chikn/i.test(norm)) result.add(norm.replace(/chiken|chikn/g, 'chicken'));

        return result;
    };

    FoodSearch.getClosestCanonical = function(rawQuery) {
        if (!rawQuery || !rawQuery.trim()) return null;
        const norm = FoodSearch.normalize(rawQuery);
        const noSpace = norm.replace(/\s+/g, '');

        if (ALIAS_MAP[norm]) {
            const c = ALIAS_MAP[norm];
            return CANONICAL_DISPLAY[c] || c;
        }
        if (ALIAS_MAP[noSpace]) {
            const c = ALIAS_MAP[noSpace];
            return CANONICAL_DISPLAY[c] || c;
        }

        // Fuzzy match against canonicals
        let bestMatch = null;
        let bestSim = 0.0;
        for (const [key, display] of Object.entries(CANONICAL_DISPLAY)) {
            const sim = FoodSearch.jaroWinkler(norm, key);
            if (sim > bestSim && sim >= 0.78) {
                bestSim = sim;
                bestMatch = display;
            }
        }

        return bestMatch;
    };

    FoodSearch.getFoodSuggestions = function(prefix, limit) {
        limit = limit || 5;
        if (!prefix || !prefix.trim()) return [];
        const norm = FoodSearch.normalize(prefix);
        const suggestions = [];
        const seen = new Set();

        for (const [key, display] of Object.entries(CANONICAL_DISPLAY)) {
            if ((key.startsWith(norm) || key.includes(norm) || FoodSearch.jaroWinkler(norm, key) >= 0.75) && !seen.has(display.toLowerCase())) {
                suggestions.push(display);
                seen.add(display.toLowerCase());
                if (suggestions.length >= limit) break;
            }
        }

        if (suggestions.length < limit) {
            for (const p of POPULAR_SEARCHES) {
                if ((FoodSearch.normalize(p).startsWith(norm) || FoodSearch.normalize(p).includes(norm)) && !seen.has(p.toLowerCase())) {
                    suggestions.push(p);
                    seen.add(p.toLowerCase());
                    if (suggestions.length >= limit) break;
                }
            }
        }

        return suggestions;
    };

    FoodSearch.getPopularSearches = function() {
        return POPULAR_SEARCHES;
    };

    // Calculate Haversine distance in KM
    FoodSearch.calculateDistance = function(lat1, lon1, lat2, lon2) {
        if (!lat1 || !lon1 || !lat2 || !lon2) return 2.5;
        const R = 6371; // Earth radius in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    };

    window.FoodSearch = FoodSearch;
})(window);

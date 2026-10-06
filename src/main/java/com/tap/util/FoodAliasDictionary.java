package com.tap.util;

import java.util.*;

public class FoodAliasDictionary {

    private static final Map<String, String> ALIAS_MAP = new HashMap<>();
    private static final Map<String, String> CANONICAL_DISPLAY_MAP = new HashMap<>();
    private static final List<String> CANONICAL_FOODS = new ArrayList<>();
    private static final List<String> POPULAR_SEARCHES = Arrays.asList(
        "Biryani", "Chicken Biryani", "Masala Dosa", "Pizza", 
        "Paneer Butter Masala", "Burger", "Idli Vada", "Dum Biryani", 
        "Butter Chicken", "Filter Coffee", "Shawarma", "Momos"
    );

    static {
        // --- Biryani & Variants ---
        addAlias("biryani", "Biryani",
            "biryani", "biriyani", "briyani", "birany", "biriani", "biryanis",
            "biryani rice", "biriyani rice", "biriyaani", "beriyani", "biryaani", "biryani box");
        addAlias("dum biryani", "Dum Biryani",
            "dum biryani", "dum biriyani", "dumbiryani", "dumbiriyani", "dumbrani", "dum birani");
        addAlias("chicken biryani", "Chicken Biryani",
            "chicken biryani", "chicken biriyani", "chiken biryani", "chikn biryani",
            "chkn biryani", "chicken briyani", "chickn biriyani", "chkn biriyani");
        addAlias("mutton biryani", "Mutton Biryani",
            "mutton biryani", "mutton biriyani", "muton biryani", "gosht biryani", "mutton briyani");
        addAlias("donne biryani", "Donne Biryani",
            "donne biryani", "donne biriyani", "done biryani", "donne briyani", "military biryani");
        addAlias("hyderabadi biryani", "Hyderabadi Biryani",
            "hyderabadi biryani", "hyderabadi biriyani", "hyd biryani", "hyd biriyani");
        addAlias("veg biryani", "Veg Biryani",
            "veg biryani", "veg biriyani", "vegetable biryani", "vegbiryani", "vegbiriyani");

        // --- Chicken & Meats ---
        addAlias("chicken", "Chicken",
            "chicken", "chiken", "chikn", "chkn", "chickn", "chickin", "murgh", "koli");
        addAlias("mutton", "Mutton",
            "mutton", "muton", "gosht", "lamb");
        addAlias("fish", "Fish",
            "fish", "meen", "machli", "sea food", "seafood", "prawn", "prawns");

        // --- South Indian Dosas, Idlis, Vadas ---
        addAlias("dosa", "Dosa",
            "dosa", "dosai", "dhosa", "dhosai", "dose", "dosas", "dhose");
        addAlias("masala dosa", "Masala Dosa",
            "masala dosa", "masala dosai", "masala dhosa", "masala dhosai",
            "masaladosa", "masaladhosa", "masala dose", "benne masala dosa");
        addAlias("benne dosa", "Benne Dosa",
            "benne dosa", "benne dose", "butter dosa", "davangere benne dosa");
        addAlias("idli", "Idli",
            "idli", "idly", "idlis", "idlys", "thatte idli", "button idli", "rava idli");
        addAlias("vada", "Vada",
            "vada", "vadai", "vadas", "wada", "medu vada", "maddur vada", "ambode");
        addAlias("idli vada", "Idli Vada",
            "idli vada", "idly vada", "idli vadai", "idly wada", "idlivada", "idlyvada");

        // --- Vegetarian Delicacies & Paneer ---
        addAlias("paneer", "Paneer",
            "paneer", "panner", "panir", "paneeer", "cottage cheese");
        addAlias("paneer butter masala", "Paneer Butter Masala",
            "paneer butter masala", "panner butter masala", "paneer makhani",
            "paneerbuttermasala", "pannerbuttermasala", "paneer tikka masala");
        addAlias("dal makhani", "Dal Makhani",
            "dal makhani", "daal makhani", "dal makani", "daal makani", "dal");
        addAlias("butter chicken", "Butter Chicken",
            "butter chicken", "butter chiken", "murgh makhani", "butterchicken", "butterchiken");

        // --- Breads (Parotta, Naan, Roti) ---
        addAlias("parotta", "Parotta",
            "parotta", "paratha", "porotta", "parotha", "kerala parotta",
            "malabar parotta", "laccha paratha", "aloo paratha");
        addAlias("naan", "Naan",
            "naan", "nan", "butter naan", "garlic naan", "roti", "tandoori roti");

        // --- Fast Food & Snacks (Pizza, Burger, Shawarma, Samosa, Momos) ---
        addAlias("pizza", "Pizza",
            "pizza", "pizzas", "piza", "pizaa", "margherita", "farmhouse pizza");
        addAlias("burger", "Burger",
            "burger", "burgers", "burgur", "burgir", "crispy burger", "chicken burger");
        addAlias("shawarma", "Shawarma",
            "shawarma", "shwarma", "shavarma", "shawerma", "shawarma roll", "chicken shawarma");
        addAlias("samosa", "Samosa",
            "samosa", "samoosa", "samusa", "samosas", "samosa chaat");
        addAlias("momos", "Momos",
            "momo", "momos", "dimsum", "dumplings", "fried momos", "steamed momos");
        addAlias("kebab", "Kebab",
            "kebab", "kebabs", "kabab", "kababs", "tikka", "chicken tikka", "seekh kebab");
        addAlias("noodles", "Noodles",
            "noodles", "nudles", "noodle", "chowmein", "chow mein", "hakka noodles");
        addAlias("fried rice", "Fried Rice",
            "fried rice", "friedrice", "schezwan fried rice", "egg fried rice");

        // --- Traditional Rice & Bath Items ---
        addAlias("bisi bele bath", "Bisi Bele Bath",
            "bisi bele bath", "bisibelebath", "bisi bele baath", "bisibele baath");
        addAlias("kesari bath", "Kesari Bath",
            "kesari bath", "kesaribath", "kesari baath", "sheera");
        addAlias("khara bath", "Khara Bath",
            "khara bath", "kharabath", "khara baath", "upma", "uppittu");

        // --- Beverages & Desserts ---
        addAlias("coffee", "Filter Coffee",
            "coffee", "kaapi", "filter coffee", "filter kaapi", "cappuccino", "latte", "cold coffee");
        addAlias("tea", "Masala Chai",
            "tea", "chai", "masala chai", "ginger tea", "chay");
        addAlias("ice cream", "Ice Cream",
            "ice cream", "icecream", "kulfi", "sundae", "death by chocolate", "dbc", "gelato");
        addAlias("falooda", "Falooda",
            "falooda", "faluda", "royal falooda");
    }

    private static void addAlias(String canonicalKey, String displayName, String... variants) {
        if (!CANONICAL_FOODS.contains(canonicalKey)) {
            CANONICAL_FOODS.add(canonicalKey);
            CANONICAL_DISPLAY_MAP.put(canonicalKey, displayName);
        }
        for (String v : variants) {
            String norm = normalize(v);
            ALIAS_MAP.put(norm, canonicalKey);
            String noSpaces = norm.replace(" ", "");
            if (!noSpaces.equals(norm)) {
                ALIAS_MAP.put(noSpaces, canonicalKey);
            }
        }
    }

    public static String normalize(String text) {
        if (text == null) return "";
        return text.toLowerCase()
                   .replaceAll("[^a-z0-9\\s]", " ")
                   .replaceAll("\\s+", " ")
                   .trim();
    }

    public static Set<String> getSearchTokensAndAliases(String rawQuery) {
        Set<String> result = new LinkedHashSet<>();
        if (rawQuery == null || rawQuery.trim().isEmpty()) {
            return result;
        }

        String norm = normalize(rawQuery);
        String noSpace = norm.replace(" ", "");
        result.add(norm);
        if (!noSpace.equals(norm)) {
            result.add(noSpace);
        }

        // 1. Direct alias check on full phrase or no-space phrase
        if (ALIAS_MAP.containsKey(norm)) {
            String canonical = ALIAS_MAP.get(norm);
            result.add(canonical);
            if (CANONICAL_DISPLAY_MAP.containsKey(canonical)) {
                result.add(CANONICAL_DISPLAY_MAP.get(canonical).toLowerCase());
            }
        }
        if (ALIAS_MAP.containsKey(noSpace)) {
            String canonical = ALIAS_MAP.get(noSpace);
            result.add(canonical);
            if (CANONICAL_DISPLAY_MAP.containsKey(canonical)) {
                result.add(CANONICAL_DISPLAY_MAP.get(canonical).toLowerCase());
            }
        }

        // 2. Token-level alias replacement (e.g. "chiken biryani" -> "chicken biryani")
        String[] tokens = norm.split(" ");
        if (tokens.length > 1) {
            List<String> canonicalTokens = new ArrayList<>();
            for (String t : tokens) {
                if (ALIAS_MAP.containsKey(t)) {
                    canonicalTokens.add(ALIAS_MAP.get(t));
                } else {
                    canonicalTokens.add(t);
                }
            }
            String reconstructed = String.join(" ", canonicalTokens);
            result.add(reconstructed);
            if (ALIAS_MAP.containsKey(reconstructed)) {
                result.add(ALIAS_MAP.get(reconstructed));
            }
        }

        // 3. Known phonetic substitutions
        if (norm.contains("biriyani") || norm.contains("briyani") || norm.contains("birany")) {
            result.add(norm.replaceAll("biriyani|briyani|birany", "biryani"));
        } else if (norm.contains("biryani")) {
            result.add(norm.replaceAll("biryani", "biriyani"));
        }

        if (norm.contains("dhosa") || norm.contains("dosai") || norm.contains("dose")) {
            result.add(norm.replaceAll("dhosa|dosai|dose", "dosa"));
        } else if (norm.contains("dosa")) {
            result.add(norm.replaceAll("dosa", "dhosa"));
            result.add(norm.replaceAll("dosa", "dose"));
        }

        if (norm.contains("idly")) {
            result.add(norm.replaceAll("idly", "idli"));
        } else if (norm.contains("idli")) {
            result.add(norm.replaceAll("idli", "idly"));
        }

        if (norm.contains("panner")) {
            result.add(norm.replaceAll("panner", "paneer"));
        } else if (norm.contains("paneer")) {
            result.add(norm.replaceAll("paneer", "panner"));
        }

        if (norm.contains("chiken") || norm.contains("chikn")) {
            result.add(norm.replaceAll("chiken|chikn", "chicken"));
        }

        return result;
    }

    public static String getClosestCanonical(String rawQuery) {
        if (rawQuery == null || rawQuery.trim().isEmpty()) return null;
        String norm = normalize(rawQuery);
        String noSpace = norm.replace(" ", "");

        if (ALIAS_MAP.containsKey(norm)) {
            String c = ALIAS_MAP.get(norm);
            return CANONICAL_DISPLAY_MAP.getOrDefault(c, c);
        }
        if (ALIAS_MAP.containsKey(noSpace)) {
            String c = ALIAS_MAP.get(noSpace);
            return CANONICAL_DISPLAY_MAP.getOrDefault(c, c);
        }

        // Fuzzy match against canonical terms
        String bestMatch = null;
        double bestSim = 0.0;

        for (String cKey : CANONICAL_FOODS) {
            double sim = FuzzySearchUtil.jaroWinklerSimilarity(norm, cKey);
            if (sim > bestSim && sim >= 0.78) {
                bestSim = sim;
                bestMatch = CANONICAL_DISPLAY_MAP.getOrDefault(cKey, cKey);
            }
        }

        return bestMatch;
    }

    public static List<String> getFoodSuggestions(String prefix, int limit) {
        if (prefix == null || prefix.trim().isEmpty()) {
            return Collections.emptyList();
        }
        String norm = normalize(prefix);
        List<String> suggestions = new ArrayList<>();
        Set<String> seen = new HashSet<>();

        // 1. Check canonical display map
        for (Map.Entry<String, String> entry : CANONICAL_DISPLAY_MAP.entrySet()) {
            String key = entry.getKey();
            String display = entry.getValue();
            if ((key.startsWith(norm) || key.contains(norm) || FuzzySearchUtil.jaroWinklerSimilarity(norm, key) >= 0.75) && !seen.contains(display.toLowerCase())) {
                suggestions.add(display);
                seen.add(display.toLowerCase());
                if (suggestions.size() >= limit) break;
            }
        }

        // 2. Check popular searches
        if (suggestions.size() < limit) {
            for (String p : POPULAR_SEARCHES) {
                if ((normalize(p).startsWith(norm) || normalize(p).contains(norm)) && !seen.contains(p.toLowerCase())) {
                    suggestions.add(p);
                    seen.add(p.toLowerCase());
                    if (suggestions.size() >= limit) break;
                }
            }
        }

        return suggestions;
    }

    public static List<String> getPopularSearches() {
        return POPULAR_SEARCHES;
    }

    public static List<String> getAllCanonicalDisplayNames() {
        return new ArrayList<>(CANONICAL_DISPLAY_MAP.values());
    }
}
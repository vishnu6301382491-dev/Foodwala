package com.tap.util;

public class FuzzySearchUtil {

    public static int levenshteinDistance(String s1, String s2) {
        if (s1 == null && s2 == null) return 0;
        if (s1 == null) return s2.length();
        if (s2 == null) return s1.length();

        int[][] dp = new int[s1.length() + 1][s2.length() + 1];

        for (int i = 0; i <= s1.length(); i++) dp[i][0] = i;
        for (int j = 0; j <= s2.length(); j++) dp[0][j] = j;

        for (int i = 1; i <= s1.length(); i++) {
            for (int j = 1; j <= s2.length(); j++) {
                int cost = (s1.charAt(i - 1) == s2.charAt(j - 1)) ? 0 : 1;
                dp[i][j] = Math.min(
                    Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1),
                    dp[i - 1][j - 1] + cost
                );
            }
        }
        return dp[s1.length()][s2.length()];
    }

    public static double jaroWinklerSimilarity(String s1, String s2) {
        if (s1 == null || s2 == null) return 0.0;
        if (s1.equals(s2)) return 1.0;

        int len1 = s1.length();
        int len2 = s2.length();
        if (len1 == 0 || len2 == 0) return 0.0;

        int matchDistance = Math.max(len1, len2) / 2 - 1;
        if (matchDistance < 0) matchDistance = 0;

        boolean[] s1Matches = new boolean[len1];
        boolean[] s2Matches = new boolean[len2];

        int matches = 0;
        for (int i = 0; i < len1; i++) {
            int start = Math.max(0, i - matchDistance);
            int end = Math.min(i + matchDistance + 1, len2);
            for (int j = start; j < end; j++) {
                if (s2Matches[j]) continue;
                if (s1.charAt(i) != s2.charAt(j)) continue;
                s1Matches[i] = true;
                s2Matches[j] = true;
                matches++;
                break;
            }
        }

        if (matches == 0) return 0.0;

        double t = 0;
        int k = 0;
        for (int i = 0; i < len1; i++) {
            if (!s1Matches[i]) continue;
            while (!s2Matches[k]) k++;
            if (s1.charAt(i) != s2.charAt(k)) t++;
            k++;
        }
        t /= 2.0;

        double m = matches;
        double jaro = ((m / len1) + (m / len2) + ((m - t) / m)) / 3.0;

        // Winkler prefix boost
        int prefix = 0;
        for (int i = 0; i < Math.min(4, Math.min(len1, len2)); i++) {
            if (s1.charAt(i) == s2.charAt(i)) prefix++;
            else break;
        }

        return jaro + 0.1 * prefix * (1.0 - jaro);
    }

    public static boolean isFuzzyMatch(String query, String target) {
        if (query == null || target == null) return false;
        String q = FoodAliasDictionary.normalize(query);
        String t = FoodAliasDictionary.normalize(target);

        if (t.contains(q) || q.contains(t)) return true;

        String[] qTokens = q.split(" ");
        String[] tTokens = t.split(" ");

        for (String qt : qTokens) {
            boolean matched = false;
            for (String tt : tTokens) {
                if (qt.equals(tt) || tt.contains(qt) || qt.contains(tt)) {
                    matched = true;
                    break;
                }
                int dist = levenshteinDistance(qt, tt);
                if (qt.length() >= 6 && dist <= 2) {
                    matched = true;
                    break;
                } else if (qt.length() >= 4 && dist <= 1) {
                    matched = true;
                    break;
                }
                double jw = jaroWinklerSimilarity(qt, tt);
                if (jw >= 0.85) {
                    matched = true;
                    break;
                }
            }
            if (matched) return true;
        }

        return false;
    }
}
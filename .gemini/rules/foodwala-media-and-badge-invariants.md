---
description: Universal rules for defensive image fallback handling, image property alias normalization, and delivery badge formatting invariants.
---

# Rule: Media URL Normalization & Unit Invariant Formatting

1. **Defensive Image URL Resolution**:
   - Every utility that transforms or formats image URLs (such as `optimizeImageUrl`) must explicitly guard against `null`, `undefined`, `"undefined"`, or empty strings, immediately returning a reliable placeholder image.
   - Client templates must resolve image URLs using fallback chains across all naming conventions: `r.imagePath || r.image_path || r.image || FALLBACK_IMG`.
   - Every `<img>` rendering dynamic external URLs should include `onerror="this.onerror=null;this.src='<FALLBACK_URL>';"` to prevent broken image iconography if an external CDN drops a connection.

2. **Unit Invariant String Formatting**:
   - When interpolating time, distance, or currency fields that may already contain units (e.g. `"30 mins"`, `"3.2 km"`, `"₹400"`), code must sanitize the string or use a helper function to avoid duplicating unit suffixes (e.g., prevent `"30 mins mins"`).
   - Numeric filters (e.g. `fastDelivery <= 30`) must use `parseInt(value, 10)` to safely handle string numbers.

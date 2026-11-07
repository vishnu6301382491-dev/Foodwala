---
description: Best practices, schema rules, and state machine patterns for FoodWala WhatsApp AI assistant
globs: "server/whatsapp/**"
always_on: true
---

# FoodWala WhatsApp Assistant Architecture Rules

1. **State Independence for Checkout**:
   Never gate checkout commands solely inside `switch (session.state) { case 'CART_REVIEW': ... }`. Always allow checkout whenever `session.cart.items.length > 0`.

2. **Schema Invariants**:
   - `orders`: uses `order_date`, never `created_at`.
   - `restaurant`: uses `cuisine_type`, never `cuisine`.

3. **Session Context Integrity**:
   Always preserve `pendingItem` in `sessionStore.js` when handling quantity or restaurant switch prompts.

4. **Self-Healing Tunnel**:
   Always allow `scripts/tunnel.js` to auto-sync dynamic URLs with Meta Graph API when tunnels reconnect.

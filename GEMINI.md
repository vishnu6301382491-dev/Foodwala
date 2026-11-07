# FoodWala Project Knowledge & Operational Rules

## 1. Architectural Patterns & Flow Routing
- **Global Intent Interception**: E-commerce cart actions (`CART_CHECKOUT`, `CHECKOUT`, `PAY`, `VIEW_CART`, `CART_CLEAR`, `CART_ADD_MORE`) must be evaluated globally in Step 2 of `server/whatsapp/router.js` and in `orderFlow.js`, regardless of conversational state (including `IDLE`, expired, and `CONFIRMED`).
- **Priority Support Precedence**: Customer queries containing keywords like `need assistance`, `help`, `support`, `issue`, or `agent` must take strict precedence over greeting/chitchat regexes, creating priority support desk tickets with active cart buttons.
- **Address Inquiry Protection**: In `orderFlow.js` (`handleAddress`), never assign user input containing `?` or question prefixes (`what`, `where`, `how`, `when`, `why`, `charges`, `fees`) as the delivery street address; always pass to outer FAQ router to answer while preserving address state.

## 2. Session Store & Memory Persistence
- **24-Hour E-Commerce Cart Retention**: Carts with items must be preserved in MySQL `whatsapp_sessions` for 24 hours. Even if the conversational prompt expires (30 min TTL), returning customers retain their active cart and are routed to `CART_REVIEW`.
- **Pending Item Preservation**: When switching restaurants or selecting quantity, `session.pendingItem` must be serialized into `safeSession.context.pendingItem` in `server/whatsapp/sessionStore.js` (`saveSession` & `getSession`) so button clicks like *"Yes, clear & add"* (`CART_SWITCH_CONFIRM`) never encounter undefined references.

## 3. Database Schema Conventions (`fudwala` on MySQL 3306)
- **`orders` table**:
  - Timestamp column is `order_date` (DATETIME) and `updated_at`. There is NO `created_at` column in `orders`.
  - Status values: `PLACED`, `CONFIRMED`, `PREPARING`, `OUT_FOR_DELIVERY`, `DELIVERED`, `CANCELLED`.
- **`restaurant` table**:
  - Cuisine column is `cuisine_type`.
- **`whatsapp_messages` table**:
  - Message body column is `message_text`. Delivery status column is `delivery_status`.

## 4. Cloudflare Tunnel & Meta Webhook Synchronization
- Free Cloudflare tunnels (`trycloudflare.com`) generate dynamic URLs upon reconnection.
- `scripts/tunnel.js` must parse `currentTunnelUrl` dynamically and call `syncMetaWebhookWithRetry` to auto-register the active callback URL (`/api/whatsapp/webhook`) with Meta Graph API (`POST /v21.0/{APP_ID}/subscriptions`).
- Windows Persistent Auto-Start is maintained via `C:\Users\vishn\AppData\Roaming\Microsoft\Windows\Start Menu\Programs\Startup\FoodWala_Services.lnk` pointing to `start_foodwala_services.bat`.

## 5. AI Engine & LLM Fallback Failsafe
- Primary AI Model: `gemini-2.0-flash`.
- Always check `res.statusCode >= 400` in `_callGemini` and `_callOpenAI` in `server/whatsapp/llmFallback.js` to catch quota limits (HTTP 429) immediately and safely fallback to local semantic classification (<5ms) without crashing on JSON parsing.

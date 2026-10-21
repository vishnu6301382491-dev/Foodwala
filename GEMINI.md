# FoodWala Engineering Guardrails & Project Guidelines

This file defines persistent engineering standards, architectural decisions, and guardrails for the FoodWala codebase.

---

## 1. Node.js HTTP/HTTPS Socket & Timeout Management
- In Node.js, specifying `timeout: <ms>` in `http.request()` or `https.request()` only emits a `'timeout'` event on the request object. It does **NOT** automatically destroy the underlying socket.
- **Mandatory Practice**: Whenever creating an `http.request()` or `https.request()`, ALWAYS attach an explicit abort handler:
  ```javascript
  req.on('timeout', () => {
    req.destroy(new Error('Request timed out'));
  });
  ```
- Set conservative timeouts (e.g. 3000ms for AI completions) to prevent upstream latency from starving client abort timers.

---

## 2. Gemini API Model Compatibility & Grounded Local Fallback
- Use `gemini-3.8-flash` for Google Gemini Developer API completions on `v1beta`. Older aliases (`gemini-1.5-flash`, `gemini-2.0-flash`) return `404 NOT_FOUND` on newer project endpoints.
- **Fail-Fast Fallback**: Always pair external LLM calls with FoodWala's built-in intelligent semantic engine (`_generateBuiltinResponse`). On any external latency, 429 quota limit, or network failure, fail fast (<5ms) to the grounded local policy engine so that customer answers are delivered instantly without error cards.

---

## 3. Helmet & Content Security Policy (CSP) in Full-Stack Apps
- The frontend loads external CDN assets (e.g. `images.unsplash.com` restaurant photos, Bootstrap icons, Google Fonts) and uses standard inline script patterns.
- Default Helmet v8 CSP blocks these assets unless configured. In `server/server.js`, maintain:
  ```javascript
  app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" }
  }));
  ```

---

## 4. Customer Privacy & Order Authorization
- Support and tracking endpoints (`/api/support/chat`, `/api/orders/:id/track`) MUST strictly verify customer ownership via JWT authorization or verified 10-digit mobile phone.
- **NEVER** return a default or globally recent order (such as Order #80 / Suresh Kumar) to an unauthenticated or anonymous visitor. Unauthenticated tracking queries must instruct the user to log in or provide their verified order ID.

---

## 5. Meta WhatsApp Cloud API Guidelines
- **Webhook Handshake (GET `/api/webhook/whatsapp`)**: Compare `hub.verify_token` against `WHATSAPP_VERIFY_TOKEN` and return `hub.challenge` as plain text with HTTP 200.
- **Signature Validation (POST `/api/webhook/whatsapp`)**: Compute HMAC-SHA256 of the raw body using `WHATSAPP_APP_SECRET` and perform constant-time comparison against `X-Hub-Signature-256`.
- **Immediate Acknowledgment**: Return HTTP 200 `{ "status": "EVENT_RECEIVED" }` immediately before triggering asynchronous background AI processing to prevent Meta retry loops.
- **Deduplication**: Cache incoming `wamid` message IDs in memory with TTL to suppress duplicate webhook deliveries.
- **Loop Suppression**: Ignore messages originating from the business's own phone ID or hotline number (`SUPPORT_PHONE_NUMBER`).
- **PII & Secret Protection**: Never print `WHATSAPP_ACCESS_TOKEN`, `AI_API_KEY`, or full unmasked customer phone numbers in logs. Always mask phone numbers (e.g. `+9198****53`).

---

## 6. Node.js Class Method Binding for Safe Destructuring
- In modular Node.js architectures where singleton service classes are exported (`module.exports = new Service()`), developers frequently destructure methods:
  ```javascript
  const { sendWhatsAppMessage } = require('./services/whatsappService');
  ```
- **Rule**: ALWAYS bind all public instance methods to `this` inside the constructor:
  ```javascript
  constructor() {
    this.sendWhatsAppMessage = this.sendWhatsAppMessage.bind(this);
    this.normalizeSender = this.normalizeSender.bind(this);
    this.verifySignature = this.verifySignature.bind(this);
    this.checkHealth = this.checkHealth.bind(this);
  }
  ```
- This prevents `TypeError: Cannot read properties of undefined` when methods are called out of context.

---

## 7. Meta WhatsApp Cloud API Development Sandbox Constraints
- **Phone Allowlist Requirement (Error 131030)**: When using a Meta developer test phone number (e.g. `+1 555-196-0307`), Meta Cloud API rejects outbound messages to unverified numbers with code `131030` (`Recipient phone number not in allowed list`).
  - **Rule**: Recipients must be explicitly added to the "Manage phone number list" in the Meta Developer Portal before sending messages in development mode.
- **Token Expiration (Error 190 / 463)**: Temporary developer tokens expire every 24 hours. Production setups must use permanent System User access tokens from Meta Business Manager.

---

## 9. Multi-Tenant Role Isolation: Store Managers vs. Platform Admins
- **Manager Data Scoping**: When a restaurant manager logs in, the backend API (`/api/restaurant/*`) and frontend MUST strictly scope all data queries (orders, menus, inventory, settings) to their assigned entity (`WHERE admin_user_id = user_id`).
- **Dropdown & Parameter Sanitization**:
  - The restaurant selector dropdown (`#restaurant-selector-dropdown`) MUST remain completely hidden (`display: none !important`) for managers.
  - Query parameter tampering (e.g. `?restaurantId=99` or `?id=12`) MUST be sanitized, stripped from the browser address bar via `window.history.replaceState`, and resolved server-side solely from the authenticated manager's session.
- **Platform Admins**: Only authenticated users with `role = 'admin'` (e.g., `adminfoodwala@gmail.com`) are granted cross-store oversight to switch between all restaurants and inspect global platform analytics.

---

## 10. UI Credential Hygiene & Demo Account Suppression
- **No Hardcoded Demo Buttons**: Never expose 1-click demo logins or hardcoded credentials on production or public-facing login portals (`login.html`, `admin.html`, `restaurant-dashboard.html`).
- **Input Placeholders**: Input field placeholders should remain descriptive yet clean (e.g., `adminfoodwala@gmail.com` or `restaurantname@gmail.com`), requiring users and managers to enter authentic credentials.


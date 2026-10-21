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

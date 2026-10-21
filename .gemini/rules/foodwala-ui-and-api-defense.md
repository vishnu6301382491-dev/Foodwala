# FoodWala UI Scope & Hybrid API Invariants

## 1. Scope Variable Declaration Invariants (Temporal Dead Zone Prevention)
- All DOM element references and UI controllers evaluated across multiple branches (`if (!isAdmin) ... else ...`) MUST be declared at the top of the enclosing function scope before any conditional block is reached.
- Never declare a DOM element using `const` inside an `else` block if an earlier `if` branch references it (e.g., `adminBar`).
- Always run AST validation (`node scripts/verify_all_html_scripts.js`) after any JavaScript modification across HTML files.

## 2. Multi-Store Manager Isolation & Identification
- Restaurant manager authentication is strictly 1-to-1 isolated. A manager can only access and view their designated restaurant.
- In `loadRestaurantDashboard()`, defensively resolve the manager's `restaurantId` from:
  1. `currentUser.restaurantId` or `currentUser.restaurant_id`
  2. `resolveManagerDirectly(currentUser.email)` / `findRestaurantManager(currentUser.email)`
  3. URL query parameter `?id=...`
- The restaurant selector dropdown (`#restaurant-selector-dropdown`) and super admin bar (`#super-admin-control-bar`) MUST remain completely hidden (`display: none !important`) for restaurant managers.
- When an admin logs in, populate the dropdown with all 105 stores and display the super admin control bar.

## 3. Hybrid AI Assistance & Resilient Communication
- Never redirect customer support inquiries exclusively to third-party sandbox endpoints (e.g. Meta Graph API WhatsApp sandbox) that may fail or require whitelist verification without providing an in-app fallback.
- The 24/7 AI Assistance widget (`js/help-assistance.js`) must provide a full in-app Live AI Care Chat with immediate 0-second responses for order tracking, 50% discount coupons, cancellation & refund policies, and human agent callback requests.
- Always provide dual communication avenues: Live In-App Chat and WhatsApp Helpline (`+1 (555) 196-0307` / `8500457005`).

## 4. Dual Project Parity (Root and `src/main/webapp/`)
- Every edit to static HTML, client-side JavaScript, CSS, or images in `D:\FoodWala_Eclipse_Project` MUST be mirrored identically in `src/main/webapp/` to ensure full Eclipse dynamic web project deployment compatibility.

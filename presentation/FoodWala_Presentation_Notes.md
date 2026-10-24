# FoodWala Project Presentation — Speaker Notes & Timing Plan

**Total Slides**: 26 Slides  
**Target Duration**: 4 Minutes 30 Seconds (4.5 Minutes)  
**Tone**: Technical, Confident, Full-Stack Architectural Focus  
**Platform**: FoodWala — Bengaluru Food Discovery & Delivery Platform  

---

## Slide-by-Slide Timing & Script

### SECTION 1 — PROJECT INTRODUCTION (Slide 1)
- **Time**: 0:00 – 0:25 (25 Seconds)
- **Visual**: Dark Hero Overview with 1-Line Definition & Core Pillars
- **Speaker Script**:  
  > *"Good morning everyone. Today I'm excited to present **FoodWala**, a full-stack Bengaluru food discovery and delivery platform that allows users to discover restaurants, search menus, place orders, make payments, and track deliveries in real time. We built FoodWala to solve key local challenges: hyper-local search with Indian cuisine typo-tolerance, atomic ACID transactions for payment and order safety, multi-role security isolating restaurant managers, and an omnichannel 24/7 AI support desk integrated with WhatsApp."*

---

### SECTION 2 — TECH STACK (Slide 2)
- **Time**: 0:25 – 0:50 (25 Seconds)
- **Visual**: Categorized Tech Matrix (Frontend, Backend, Database, Security, Payment, DevOps)
- **Speaker Script**:  
  > *"Our architecture is built on a robust full-stack foundation. On the frontend, we use semantic HTML5, custom dark-mode CSS3, Bootstrap 5.3, and modular ES6 JavaScript. The backend runs on Node.js with Express.js REST controllers. For persistence, we use MySQL 9.7 with 22 relational tables and connection pooling. Security is guaranteed through Argon2id password hashing, Helmet headers, and role-based access control. Payments are integrated via Razorpay with cash-on-delivery fallback, and real-time customer communications leverage Meta's WhatsApp Cloud API."*

---

### SECTION 3 — PROJECT STRUCTURE (Slide 3)
- **Time**: 0:50 – 1:10 (20 Seconds)
- **Visual**: VS Code Project Hierarchy (`00_project_structure.png`) & Architectural Layers
- **Speaker Script**:  
  > *"Here you can see our actual project codebase hierarchy. We enforce a strict separation of concerns: frontend views and client services are completely decoupled from the Express backend in `/server`, where controllers, security middleware, and routes reside. Database migration scripts in `/database` define our schema and seed data, while `/scripts` automates our end-to-end testing and Puppeteer verification suites."*

---

### SECTION 4 — DATABASE ER DIAGRAM (Slide 4)
- **Time**: 1:10 – 1:35 (25 Seconds)
- **Visual**: 22-Table Relational Schema (`foodwala-er-diagram.png`) with PK/FK Connectors
- **Speaker Script**:  
  > *"This is our normalized 3NF database schema comprising 22 relational tables. Key relationships include `user` to `orders` and `address`, `restaurant` to `menu` items, and `orders` to `payment` and `order_status_history`. Notice the `whatsapp_conversations` and `whatsapp_messages` tables, which store persistent chat sessions for our AI support desk. All order transactions enforce foreign key constraints with indexed lookup paths for high query efficiency."*

---

### SECTION 5 — PAGE SCREENSHOTS (Slides 5 to 22)
**Rule**: Exactly 1 page per slide. 10 to 12 seconds per slide.  
**Total Section 5 Time**: 1:35 – 3:35 (2 Minutes / 120 Seconds)

#### Slide 5.1 — Home Page
- **Time**: 1:35 – 1:45
- **Script**: *"The home page features an interactive culinary video showcase, dynamic category carousels for Bengaluru specialties like Dosas and Biryanis, an instant search bar, and curated restaurant collections."*

#### Slide 5.2 — Login Screen
- **Time**: 1:45 – 1:52
- **Script**: *"Our login screen authenticates users across three distinct roles: Customers, Restaurant Managers, and Delivery Partners, verified securely using Argon2id."*

#### Slide 5.3 — Registration Screen
- **Time**: 1:52 – 1:58
- **Script**: *"The registration flow provides real-time client-side regex validation for 10-digit Indian mobile numbers and email addresses before hashing passwords on the server."*

#### Slide 5.4 — Restaurant Discovery & Filters
- **Time**: 1:58 – 2:05
- **Script**: *"The discovery page allows multi-criteria filtering by cuisine, 4-star+ ratings, delivery time under 30 minutes, and pure-vegetarian preferences."*

#### Slide 5.5 — Restaurant Menu & Item Customization
- **Time**: 2:05 – 2:12
- **Script**: *"The menu page dynamically renders categorized dishes, live pricing, dish descriptions, dietary badges, and one-click add-to-cart counters."*

#### Slide 5.6 — Food Search & Autocomplete
- **Time**: 2:12 – 2:18
- **Script**: *"The search engine features instant autocomplete suggestions powered by our Jaro-Winkler string similarity algorithm, handling typos in complex dish names."*

#### Slide 5.7 — Cart Management
- **Time**: 2:18 – 2:25
- **Script**: *"The cart provides live item quantity increments, subtotal calculation, 5% GST breakdown, platform fees, and coupon application logic."*

#### Slide 5.8 — Checkout & Delivery Address
- **Time**: 2:25 – 2:32
- **Script**: *"At checkout, users select from their saved address book, input optional delivery instructions for the rider, and review their order total."*

#### Slide 5.9 — Payment Gateway Integration
- **Time**: 2:32 – 2:38
- **Script**: *"Our payment interface integrates Razorpay for UPI, Net Banking, and Cards, alongside an instant Cash on Delivery option with transactional logging."*

#### Slide 5.10 — Order Confirmation
- **Time**: 2:38 – 2:45
- **Script**: *"Upon payment completion, an atomic transaction issues a unique Order ID, generates a printable receipt, and triggers EmailJS delivery notifications."*

#### Slide 5.11 — Live Order Tracking
- **Time**: 2:45 – 2:52
- **Script**: *"Customers monitor their order in real time through a 5-stage visual progress pipeline: Order Placed, Confirmed, Food Prepared, Out for Delivery, and Delivered."*

#### Slide 5.12 — Order History
- **Time**: 2:52 – 2:58
- **Script**: *"The order history archive displays previous orders with status badges, itemized receipts, and instant one-click re-ordering."*

#### Slide 5.13 — User Profile & Settings
- **Time**: 2:58 – 3:05
- **Script**: *"The profile module allows customers to update their personal details, phone numbers, and manage security settings."*

#### Slide 5.14 — Saved Delivery Addresses
- **Time**: 3:05 – 3:12
- **Script**: *"Users can manage multiple delivery locations tagged as Home, Work, or Other, setting a primary address for one-click checkout."*

#### Slide 5.15 — Super Admin Console
- **Time**: 3:12 – 3:18
- **Script**: *"The Super Admin console provides top-level analytics on total platform GMV, pending restaurant onboardings, active users, and system audit logs."*

#### Slide 5.16 — Restaurant Manager Dashboard
- **Time**: 3:18 – 3:25
- **Script**: *"The Manager portal features strict store data isolation: managers only see incoming orders and menu items belonging exclusively to their specific outlet."*

#### Slide 5.17 — Delivery Partner Fleet Portal
- **Time**: 3:25 – 3:30
- **Script**: *"The rider portal enables delivery partners to update their GPS coordinates, accept delivery dispatches, and toggle order completion."*

#### Slide 5.18 — WhatsApp 24/7 AI Assistance Desk
- **Time**: 3:30 – 3:35
- **Script**: *"Our 24/7 AI Desk operates both via Meta WhatsApp Cloud API and an in-browser floating widget, answering questions and tracking orders autonomously."*

---

### SECTION 6 — NEW FEATURES ADDED (Slide 23)
- **Time**: 3:35 – 3:55 (20 Seconds)
- **Visual**: 4 Feature Cards (Smart Search, WhatsApp AI Desk, Store Isolation, Dark Mode)
- **Speaker Script**:  
  > *"Beyond standard delivery platforms, we implemented four major enhancements: first, typo-tolerant search using Jaro-Winkler distance; second, an omnichannel WhatsApp AI desk with a 25-intent classification engine; third, strict multi-role store isolation so restaurant managers never leak cross-store order data; and fourth, an adaptive dark mode theme with an interactive culinary audio/video switcher."*

---

### SECTION 7 — IMPORTANT ALGORITHMS (Slide 24)
- **Time**: 3:55 – 4:10 (15 Seconds)
- **Visual**: 4 Mathematical Formulas & Implementations
- **Speaker Script**:  
  > *"Four core algorithms power FoodWala: the Jaro-Winkler string similarity metric with prefix bonus for typo resilience; our deterministic cart billing formula computing tiered taxes, platform fees, and coupon caps; ACID-compliant MySQL order placement transactions with row-level rollback protection; and our 25-intent regex scoring NLP classifier with slot extraction."*

---

### SECTION 8 — MAJOR CHALLENGE FACED (Slide 25)
- **Time**: 4:10 – 4:20 (10 Seconds)
- **Visual**: Dual-Panel Problem vs. Solution Architecture
- **Speaker Script**:  
  > *"Our biggest technical hurdle was integrating the WhatsApp Cloud API: Meta enforces a strict 24-hour customer messaging window and HMAC SHA-256 webhook signatures, while local tunneling occasionally dropped. We solved this by creating a dual-channel architecture where a shared 25-intent NLP engine powers both the Meta webhook and an instant in-browser AI widget, guaranteeing zero customer downtime."*

---

### SECTION 9 — FUTURE ENHANCEMENTS (Slide 26)
- **Time**: 4:20 – 4:30 (10 Seconds)
- **Visual**: 6 Strategic Roadmap Cards (WebSockets, AI Recommendations, PWA, Multi-Store Cart)
- **Speaker Script**:  
  > *"For future work, our roadmap includes bidirectional WebSocket fleet tracking, collaborative-filtering meal recommendations, offline PWA caching, multi-restaurant cart checkouts, and vernacular Kannada voice ordering. Thank you, and I welcome any questions!"*

---

## Presentation Checklist & Delivery Tips
1. **Pacing**: Speak at ~130–140 words per minute. Do not rush Section 5—let each slide be visible for ~10 seconds.
2. **Emphasis**: Emphasize that all 18 screenshots in Section 5 are from the **live running FoodWala application** on `http://localhost:5000`.
3. **Demo Readiness**: Keep `http://localhost:5000` open in Chrome alongside the PowerPoint presentation in case the audience asks for a live test.

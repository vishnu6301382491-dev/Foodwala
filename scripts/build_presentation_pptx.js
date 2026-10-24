const PptxGenJS = require('pptxgenjs');
const path = require('path');
const fs = require('fs');

const pptx = new PptxGenJS();

// Set 16:9 Widescreen Layout (13.33 x 7.5 inches)
pptx.layout = 'LAYOUT_16x9';
pptx.author = 'FoodWala Engineering Team';
pptx.company = 'FoodWala — Bengaluru Discovery & Delivery';
pptx.title = 'FoodWala Project Presentation';
pptx.subject = 'Comprehensive Project Demonstration & Architecture';

// Design Theme Constants
const COLORS = {
  bgDark: '0B1120',
  cardBg: '1E293B',
  cardBorder: '334155',
  primaryCoral: 'EF4444',
  accentOrange: 'F97316',
  accentAmber: 'F59E0B',
  accentEmerald: '10B981',
  accentCyan: '38BDF8',
  accentPurple: '8B5CF6',
  textWhite: 'F8FAFC',
  textMuted: '94A3B8',
  textDark: '0F172A'
};

const BASE_DIR = path.resolve('D:/FoodWala_Eclipse_Project');
const SCREENSHOTS_DIR = path.join(BASE_DIR, 'presentation/screenshots');
const DIAGRAMS_DIR = path.join(BASE_DIR, 'presentation/diagrams');

// Helper to add standard slide header
function addSlideHeader(slide, sectionNum, sectionTitle, subtitle) {
  slide.background = { color: COLORS.bgDark };

  // Top Section Pill
  slide.addShape(pptx.ShapeType.roundRect, {
    x: 0.8, y: 0.35, w: 2.2, h: 0.32,
    rectRadius: 0.16,
    fill: { color: COLORS.primaryCoral, transparency: 85 },
    line: { color: COLORS.primaryCoral, width: 1 }
  });
  slide.addText(`SECTION ${sectionNum}`, {
    x: 0.8, y: 0.35, w: 2.2, h: 0.32,
    fontSize: 10, bold: true, color: COLORS.primaryCoral,
    align: 'center', valign: 'middle'
  });

  // Slide Title
  slide.addText(sectionTitle, {
    x: 0.8, y: 0.72, w: 11.7, h: 0.5,
    fontSize: 22, bold: true, color: COLORS.textWhite
  });

  // Subtitle / Caption
  if (subtitle) {
    slide.addText(subtitle, {
      x: 0.8, y: 1.22, w: 11.7, h: 0.35,
      fontSize: 12, color: COLORS.textMuted
    });
  }

  // Footer branding
  slide.addText('FoodWala — Bengaluru Food Discovery & Delivery Platform', {
    x: 0.8, y: 7.1, w: 8.0, h: 0.3,
    fontSize: 9, color: COLORS.textMuted
  });
  slide.addText('Confidential • Project Demonstration', {
    x: 8.8, y: 7.1, w: 3.7, h: 0.3,
    fontSize: 9, color: COLORS.textMuted, align: 'right'
  });
}

// ==========================================
// SECTION 1: PROJECT INTRODUCTION (Slide 1)
// ==========================================
console.log('Building Slide 1: Section 1 - Project Introduction...');
const slide1 = pptx.addSlide();
slide1.background = { color: COLORS.bgDark };

// Decorative ambient glow
slide1.addShape(pptx.ShapeType.ellipse, {
  x: 9.5, y: -1.0, w: 4.8, h: 4.8,
  fill: { color: COLORS.primaryCoral, transparency: 92 },
  line: { color: COLORS.primaryCoral, transparency: 100 }
});

// Title & Hero Branding
slide1.addShape(pptx.ShapeType.roundRect, {
  x: 1.0, y: 1.0, w: 2.8, h: 0.38,
  rectRadius: 0.19,
  fill: { color: COLORS.primaryCoral, transparency: 85 },
  line: { color: COLORS.primaryCoral, width: 1 }
});
slide1.addText('PROJECT DEMONSTRATION', {
  x: 1.0, y: 1.0, w: 2.8, h: 0.38,
  fontSize: 11, bold: true, color: COLORS.primaryCoral,
  align: 'center', valign: 'middle'
});

slide1.addText('FoodWala — Bengaluru Food Discovery & Delivery Platform', {
  x: 1.0, y: 1.5, w: 11.3, h: 1.0,
  fontSize: 32, bold: true, color: COLORS.textWhite
});

// Mandatory ONE concise line definition
slide1.addShape(pptx.ShapeType.roundRect, {
  x: 1.0, y: 2.65, w: 11.3, h: 0.85,
  rectRadius: 0.1,
  fill: { color: COLORS.cardBg },
  line: { color: COLORS.primaryCoral, width: 1.5 }
});
slide1.addText(
  '"FoodWala is a full-stack Bengaluru food discovery and delivery platform that allows users to discover restaurants, search menus, place orders, make payments, and track deliveries in real time."',
  {
    x: 1.2, y: 2.75, w: 10.9, h: 0.65,
    fontSize: 15, italic: true, bold: true, color: COLORS.textWhite, valign: 'middle'
  }
);

// 4 Pillar Feature Cards
const pillars = [
  {
    icon: '🔍',
    title: 'Hyperlocal Discovery',
    desc: 'Smart search with typo tolerance (Jaro-Winkler), dynamic category filters, and curated Bengaluru culinary showcases.'
  },
  {
    icon: '⚡',
    title: 'ACID Order Pipeline',
    desc: 'Atomic multi-table MySQL transactions handling cart lifecycle, discounts, Razorpay payments, and live order dispatch.'
  },
  {
    icon: '🛡️',
    title: 'Multi-Role Security',
    desc: 'Argon2id hashing, role-based access control isolating Super Admin, Store Managers, Delivery Riders, and Customers.'
  },
  {
    icon: '🤖',
    title: 'WhatsApp 24/7 AI Desk',
    desc: 'Omnichannel customer support powered by a 25-intent NLP classifier resolving order tracking and menu queries.'
  }
];

pillars.forEach((p, idx) => {
  const colX = 1.0 + idx * 2.92;
  slide1.addShape(pptx.ShapeType.roundRect, {
    x: colX, y: 3.8, w: 2.65, h: 2.7,
    rectRadius: 0.1,
    fill: { color: COLORS.cardBg },
    line: { color: COLORS.cardBorder, width: 1 }
  });

  slide1.addText(p.icon, {
    x: colX + 0.2, y: 4.0, w: 2.25, h: 0.5,
    fontSize: 26
  });
  slide1.addText(p.title, {
    x: colX + 0.2, y: 4.55, w: 2.25, h: 0.45,
    fontSize: 14, bold: true, color: COLORS.textWhite
  });
  slide1.addText(p.desc, {
    x: colX + 0.2, y: 5.05, w: 2.25, h: 1.3,
    fontSize: 11, color: COLORS.textMuted
  });
});

slide1.addText('Bengaluru, Karnataka • Production Ready Architecture', {
  x: 1.0, y: 6.9, w: 11.3, h: 0.35,
  fontSize: 11, color: COLORS.textMuted
});

// ==========================================
// SECTION 2: TECH STACK (Slide 2)
// ==========================================
console.log('Building Slide 2: Section 2 - Tech Stack...');
const slide2 = pptx.addSlide();
addSlideHeader(slide2, '2', 'Tech Stack & System Architecture', 'Comprehensive full-stack technology stack deployed across frontend, backend, database, and integrations');

const techCategories = [
  {
    badge: 'FRONTEND',
    color: COLORS.accentCyan,
    x: 0.8, y: 1.7, w: 3.7, h: 2.4,
    items: [
      { name: 'HTML5 & CSS3', detail: 'Semantic layout, custom dark mode, variables' },
      { name: 'Bootstrap 5.3 & Icons', detail: 'Responsive grid, modals, offcanvas navigation' },
      { name: 'Vanilla JavaScript (ES6+)', detail: 'Modular client state, fetch API, local storage' },
      { name: 'Media & Culinary Audio', detail: 'HTML5 1080p WebM video & Web Audio API' }
    ]
  },
  {
    badge: 'BACKEND & APIS',
    color: COLORS.accentEmerald,
    x: 4.8, y: 1.7, w: 3.7, h: 2.4,
    items: [
      { name: 'Node.js (v24.17 LTS)', detail: 'High performance asynchronous event loop' },
      { name: 'Express.js 4.x', detail: 'RESTful routes, controllers, and middleware' },
      { name: 'Webhook Processor', detail: 'Meta WhatsApp raw body verification' },
      { name: 'NLP Intent Engine', detail: '25-intent regex scoring and slot extraction' }
    ]
  },
  {
    badge: 'DATABASE & STORAGE',
    color: COLORS.accentAmber,
    x: 8.8, y: 1.7, w: 3.7, h: 2.4,
    items: [
      { name: 'MySQL 9.7 Server', detail: '22 relational tables, InnoDB engine, ACID' },
      { name: 'Connection Pool', detail: 'mysql2/promise with connection limits' },
      { name: 'Foreign Key Integrity', detail: 'Cascading updates, constraints, normalized 3NF' },
      { name: 'Audit & Tracking', detail: 'order_status_history, login_history, activity_log' }
    ]
  },
  {
    badge: 'SECURITY & AUTH',
    color: COLORS.primaryCoral,
    x: 0.8, y: 4.4, w: 3.7, h: 2.4,
    items: [
      { name: 'Argon2id Hashing', detail: 'State-of-the-art memory-hard password encryption' },
      { name: 'Role-Based Access (RBAC)', detail: 'Super Admin, Store Manager, Rider, Customer' },
      { name: 'Security Middleware', detail: 'Helmet headers, CORS, express-rate-limit' },
      { name: 'Store Data Isolation', detail: 'Enforced tenant separation on all manager routes' }
    ]
  },
  {
    badge: 'PAYMENT & COMMS',
    color: COLORS.accentPurple,
    x: 4.8, y: 4.4, w: 3.7, h: 2.4,
    items: [
      { name: 'Razorpay API Gateway', detail: 'UPI, Debit/Credit cards, NetBanking, COD' },
      { name: 'WhatsApp Cloud API', detail: 'Graph API v18.0 automated conversational desk' },
      { name: 'EmailJS Receipt Delivery', detail: 'Instant transactional order confirmation emails' },
      { name: 'In-Browser AI Desk', detail: 'Instant floating fallback chat widget' }
    ]
  },
  {
    badge: 'DEVOPS & ENVIRONMENT',
    color: COLORS.accentOrange,
    x: 8.8, y: 4.4, w: 3.7, h: 2.4,
    items: [
      { name: 'Cloudflare Tunnel', detail: 'Zero-trust HTTPS tunnel for webhook intake' },
      { name: 'Puppeteer Core', detail: 'End-to-end automated UI & screenshot testing' },
      { name: 'Git & GitHub Versioning', detail: 'Branching workflow, release version control' },
      { name: 'Dotenv Configuration', detail: 'Secure environment variable management' }
    ]
  }
];

techCategories.forEach(cat => {
  slide2.addShape(pptx.ShapeType.roundRect, {
    x: cat.x, y: cat.y, w: cat.w, h: cat.h,
    rectRadius: 0.08,
    fill: { color: COLORS.cardBg },
    line: { color: COLORS.cardBorder, width: 1 }
  });

  slide2.addShape(pptx.ShapeType.roundRect, {
    x: cat.x + 0.15, y: cat.y + 0.15, w: 1.8, h: 0.28,
    rectRadius: 0.14,
    fill: { color: cat.color, transparency: 85 },
    line: { color: cat.color, width: 1 }
  });
  slide2.addText(cat.badge, {
    x: cat.x + 0.15, y: cat.y + 0.15, w: 1.8, h: 0.28,
    fontSize: 9, bold: true, color: cat.color,
    align: 'center', valign: 'middle'
  });

  let textY = cat.y + 0.52;
  cat.items.forEach(item => {
    slide2.addText(`• ${item.name}`, {
      x: cat.x + 0.15, y: textY, w: cat.w - 0.3, h: 0.22,
      fontSize: 10, bold: true, color: COLORS.textWhite
    });
    slide2.addText(`   ${item.detail}`, {
      x: cat.x + 0.15, y: textY + 0.2, w: cat.w - 0.3, h: 0.22,
      fontSize: 9, color: COLORS.textMuted
    });
    textY += 0.44;
  });
});

// ==========================================
// SECTION 3: PROJECT STRUCTURE (Slide 3)
// ==========================================
console.log('Building Slide 3: Section 3 - Project Structure...');
const slide3 = pptx.addSlide();
addSlideHeader(slide3, '3', 'Project Architecture & Directory Layout', 'Visual codebase hierarchy demonstrating strict separation of frontend assets, backend APIs, and database migrations');

const imgStruct = path.join(SCREENSHOTS_DIR, '00_project_structure.png');
if (fs.existsSync(imgStruct)) {
  slide3.addImage({
    path: imgStruct,
    x: 0.8, y: 1.6, w: 8.5, h: 4.8,
    sizing: { type: 'contain', w: 8.5, h: 4.8 }
  });
}

// Side explanation panel
slide3.addShape(pptx.ShapeType.roundRect, {
  x: 9.5, y: 1.6, w: 3.0, h: 4.8,
  rectRadius: 0.08,
  fill: { color: COLORS.cardBg },
  line: { color: COLORS.cardBorder, width: 1 }
});

slide3.addText('Layered Architecture', {
  x: 9.7, y: 1.8, w: 2.6, h: 0.35,
  fontSize: 14, bold: true, color: COLORS.primaryCoral
});

const structHighlights = [
  { title: 'Frontend Client Layer', desc: 'Modular HTML5 views, responsive Bootstrap 5.3 stylesheets, and dedicated client scripts (app.js, cart.js, search.js).' },
  { title: 'Express Server Core', desc: 'REST controllers, security middleware (rate-limiter, helmet, cors), and unified error handlers in /server.' },
  { title: 'Database Migrations', desc: 'MySQL relational DDL scripts in /database with 22 normalized tables and sample seed catalogs.' },
  { title: 'AI & Automation Scripts', desc: 'WhatsApp intent classifiers, webhook listeners, Puppeteer test runners, and automated tools.' }
];

let hlY = 2.25;
structHighlights.forEach(h => {
  slide3.addText(h.title, {
    x: 9.7, y: hlY, w: 2.6, h: 0.25,
    fontSize: 11, bold: true, color: COLORS.textWhite
  });
  slide3.addText(h.desc, {
    x: 9.7, y: hlY + 0.24, w: 2.6, h: 0.72,
    fontSize: 9.5, color: COLORS.textMuted
  });
  hlY += 1.05;
});

slide3.addText('Caption: Frontend client files are strictly separated from Express REST controllers and MySQL database layer.', {
  x: 0.8, y: 6.6, w: 11.7, h: 0.3,
  fontSize: 10, italic: true, color: COLORS.accentAmber
});

// ==========================================
// SECTION 4: ER DIAGRAM (Slide 4)
// ==========================================
console.log('Building Slide 4: Section 4 - ER Diagram...');
const slide4 = pptx.addSlide();
addSlideHeader(slide4, '4', 'Database Architecture & ER Diagram', 'Normalized relational database schema (MySQL 9.7) featuring 22 tables supporting ACID-compliant order transactions');

const imgER = path.join(DIAGRAMS_DIR, 'foodwala-er-diagram.png');
if (fs.existsSync(imgER)) {
  slide4.addImage({
    path: imgER,
    x: 0.8, y: 1.6, w: 11.7, h: 4.8,
    sizing: { type: 'contain', w: 11.7, h: 4.8 }
  });
}

slide4.addText(
  'Key Relationships: user (1:N) orders • restaurant (1:N) menu • orders (1:N) order_item • orders (1:1) payment • user (1:N) whatsapp_conversations',
  {
    x: 0.8, y: 6.6, w: 11.7, h: 0.3,
    fontSize: 10, bold: true, color: COLORS.accentCyan, align: 'center'
  }
);

// ==========================================
// SECTION 5: PAGE SCREENSHOTS (Slides 5 to 22)
// Strictly 1 Page Screenshot per Slide!
// ==========================================
console.log('Building Section 5: Dedicated Page Screenshots (18 slides)...');

const pageSlides = [
  {
    slideNum: '5.1',
    title: 'Home Page — Bengaluru Discovery & Hero Showcase',
    caption: 'Hero banner with video showcase, dynamic Bengaluru cuisine category carousels, instant search bar, and top-rated restaurants.',
    file: '01_home_page.png'
  },
  {
    slideNum: '5.2',
    title: 'Login Screen — Role-Based Authentication',
    caption: 'Multi-role authentication gateway verifying Customer, Restaurant Manager, and Delivery Partner credentials with Argon2id password verification.',
    file: '02_login_page.png'
  },
  {
    slideNum: '5.3',
    title: 'Registration Screen — Customer Onboarding',
    caption: 'New user onboarding form with dual client/server validation for email, phone format, and password complexity requirements.',
    file: '03_register_page.png'
  },
  {
    slideNum: '5.4',
    title: 'Restaurant Discovery & Advanced Filtering',
    caption: 'Comprehensive listing of Bengaluru eateries with multi-criteria filtering by cuisine, customer rating, delivery ETA, veg/non-veg, and budget.',
    file: '04_restaurants_discovery.png'
  },
  {
    slideNum: '5.5',
    title: 'Restaurant Menu & Item Customization',
    caption: 'Dynamic restaurant catalog showing categorized dishes, prices, ratings, dietary tags, real-time availability badges, and instant cart addition.',
    file: '05_restaurant_menu.png'
  },
  {
    slideNum: '5.6',
    title: 'Food Search & Typo-Tolerant Autocomplete',
    caption: 'Real-time search bar with instant autocomplete suggestions powered by the Jaro-Winkler string similarity algorithm for typo resilience.',
    file: '06_search_feature.png'
  },
  {
    slideNum: '5.7',
    title: 'Cart Management & Live Bill Breakdown',
    caption: 'Interactive shopping cart supporting item increment/decrement, real-time subtotal calculation, delivery fee, GST (5%), platform fee, and coupon application.',
    file: '07_cart_page.png'
  },
  {
    slideNum: '5.8',
    title: 'Checkout & Delivery Address Selection',
    caption: 'Streamlined checkout interface allowing users to choose saved delivery addresses, provide delivery instructions, and review order totals.',
    file: '08_checkout_page.png'
  },
  {
    slideNum: '5.9',
    title: 'Payment Gateway Integration — Razorpay & COD',
    caption: 'Integrated payment processing supporting Razorpay checkout modal (UPI, Debit/Credit cards, Net Banking) alongside Cash on Delivery options.',
    file: '09_payment_screen.png'
  },
  {
    slideNum: '5.10',
    title: 'Order Confirmation & Instant Receipt',
    caption: 'Post-purchase confirmation screen displaying generated Order ID, estimated arrival time, detailed item summary, and live tracking call-to-action.',
    file: '10_order_confirmation.png'
  },
  {
    slideNum: '5.11',
    title: 'Live Order Tracking & 5-Stage Status Pipeline',
    caption: 'Real-time order progress monitor tracking 5 distinct stages: Order Placed -> Confirmed -> Food Prepared -> Out for Delivery -> Delivered.',
    file: '11_order_tracking.png'
  },
  {
    slideNum: '5.12',
    title: 'Order History & Digital Invoices',
    caption: 'Comprehensive log of past orders with timestamps, status tags, itemized costs, one-click re-order functionality, and invoice retrieval.',
    file: '12_orders_history.png'
  },
  {
    slideNum: '5.13',
    title: 'User Profile & Account Management',
    caption: 'Customer management portal showing personal profile details, contact information, password modification tools, and account security preferences.',
    file: '13_profile_page.png'
  },
  {
    slideNum: '5.14',
    title: 'Saved Delivery Addresses & Geolocation',
    caption: 'Address book management allowing users to save multiple locations (Home, Work, Other) with street details, landmarks, and default selections.',
    file: '14_address_management.png'
  },
  {
    slideNum: '5.15',
    title: 'Super Admin Console & Platform Analytics',
    caption: 'Platform management dashboard displaying system-wide gross merchandise volume (GMV), active restaurant approvals, user metrics, and revenue charts.',
    file: '15_admin_dashboard.png'
  },
  {
    slideNum: '5.16',
    title: 'Restaurant Manager Dashboard & Store Isolation',
    caption: 'Store-isolated management portal allowing authorized managers to accept/reject incoming orders, update dish availability, and inspect sales trends.',
    file: '16_restaurant_manager_dashboard.png'
  },
  {
    slideNum: '5.17',
    title: 'Delivery Partner Fleet Portal',
    caption: 'Dedicated driver mobile portal with real-time GPS coordinate reporting, assigned delivery orders list, and order delivery status updates.',
    file: '17_delivery_partner_portal.png'
  },
  {
    slideNum: '5.18',
    title: 'WhatsApp 24/7 AI Assistance Desk',
    caption: 'Dual-channel conversational AI assistant resolving customer queries, order status inquiries, menu suggestions, and escalation tickets.',
    file: '18_whatsapp_ai_assistant.png'
  }
];

pageSlides.forEach(ps => {
  const slide = pptx.addSlide();
  addSlideHeader(slide, ps.slideNum, ps.title, ps.caption);

  const imgPath = path.join(SCREENSHOTS_DIR, ps.file);
  if (fs.existsSync(imgPath)) {
    slide.addImage({
      path: imgPath,
      x: 1.0, y: 1.6, w: 11.33, h: 4.8,
      sizing: { type: 'contain', w: 11.33, h: 4.8 }
    });
  } else {
    slide.addText(`Screenshot file not found: ${ps.file}`, {
      x: 1.0, y: 3.0, w: 11.33, h: 1.0,
      fontSize: 16, color: COLORS.primaryCoral, align: 'center'
    });
  }

  slide.addText(`Real Application Screenshot • 1920×1080 Viewport • http://localhost:5000/${ps.file.replace(/^[0-9]+_/, '').replace('.png', '.html')}`, {
    x: 0.8, y: 6.6, w: 11.7, h: 0.3,
    fontSize: 9, italic: true, color: COLORS.textMuted, align: 'center'
  });
});

// ==========================================
// SECTION 6: NEW FEATURES ADDED (Slide 23)
// ==========================================
console.log('Building Slide 23: Section 6 - New Features Added...');
const slide23 = pptx.addSlide();
addSlideHeader(slide23, '6', 'New Features Added & Innovative Capabilities', 'Visual showcase of production capabilities built beyond base requirement: Typo Search, WhatsApp AI Desk, Store Isolation, Dark Mode');

const imgShowcase = path.join(SCREENSHOTS_DIR, '19_new_features_showcase.png');
if (fs.existsSync(imgShowcase)) {
  slide23.addImage({
    path: imgShowcase,
    x: 0.8, y: 1.6, w: 11.7, h: 4.8,
    sizing: { type: 'contain', w: 11.7, h: 4.8 }
  });
}

slide23.addText('Key Innovations: 1. Jaro-Winkler Typo Search • 2. 25-Intent WhatsApp AI Desk • 3. Store Data Isolation • 4. Adaptive Dark Mode', {
  x: 0.8, y: 6.6, w: 11.7, h: 0.3,
  fontSize: 10, bold: true, color: COLORS.accentCyan, align: 'center'
});

// ==========================================
// SECTION 7: IMPORTANT ALGORITHMS (Slide 24)
// ==========================================
console.log('Building Slide 24: Section 7 - Important Algorithms...');
const slide24 = pptx.addSlide();
addSlideHeader(slide24, '7', 'Important Algorithms & Core Engineering', 'Mathematical and algorithmic logic driving search similarity, cart billing, transactional integrity, and NLP classification');

const algorithms = [
  {
    title: '1. Jaro-Winkler String Distance Algorithm',
    badge: 'FUZZY SEARCH',
    color: COLORS.accentCyan,
    desc: 'Calculates transposition-aware string distance with common prefix bonus $l$ (max 4) and scaling factor $p = 0.1$:',
    formula: 'Sim(s1, s2) = Jaro(s1, s2) + l * p * (1 - Jaro(s1, s2))',
    impl: 'Matches user queries with menu item names and restaurant titles even with character swaps and typos.'
  },
  {
    title: '2. Cart Bill & Discount Computation Engine',
    badge: 'PRICING ENGINE',
    color: COLORS.accentEmerald,
    desc: 'Deterministic multi-factor calculation computing subtotal, dynamic coupon discounts, taxes, and fees:',
    formula: 'Final = Subtotal - Discount(Code, Subtotal) + (Subtotal * 0.05) + FeePlatform + FeeDelivery',
    impl: 'Validates coupon eligibility (min order threshold, max cap, expiration date) in one atomic evaluation.'
  },
  {
    title: '3. ACID-Compliant Order Placement Transaction',
    badge: 'ATOMICITY',
    color: COLORS.primaryCoral,
    desc: 'Multi-query transactional commit locking rows to prevent race conditions during checkout:',
    formula: 'START TRANSACTION -> INSERT order -> INSERT order_items -> DEDUCT coupon -> COMMIT',
    impl: 'Guarantees that if payment or item creation fails, all changes rollback without orphan records.'
  },
  {
    title: '4. 25-Intent Rule-Based NLP Classification',
    badge: 'NLP CLASSIFIER',
    color: COLORS.accentAmber,
    desc: 'Tokenizes user messages, performs regex-weighted pattern matching, and extracts parameter slots:',
    formula: 'Intent = argmax_i (Score(Pattern_i, Message)) with Slot Extraction [OrderID, Phone, Dish]',
    impl: 'Routes message to instant responses (tracking, cancellation, menu) or triggers agent escalation ticket.'
  }
];

algorithms.forEach((algo, idx) => {
  const colX = idx % 2 === 0 ? 0.8 : 6.8;
  const colY = idx < 2 ? 1.65 : 4.25;

  slide24.addShape(pptx.ShapeType.roundRect, {
    x: colX, y: colY, w: 5.7, h: 2.35,
    rectRadius: 0.08,
    fill: { color: COLORS.cardBg },
    line: { color: COLORS.cardBorder, width: 1 }
  });

  slide24.addShape(pptx.ShapeType.roundRect, {
    x: colX + 0.2, y: colY + 0.15, w: 1.6, h: 0.26,
    rectRadius: 0.13,
    fill: { color: algo.color, transparency: 85 },
    line: { color: algo.color, width: 1 }
  });
  slide24.addText(algo.badge, {
    x: colX + 0.2, y: colY + 0.15, w: 1.6, h: 0.26,
    fontSize: 8.5, bold: true, color: algo.color,
    align: 'center', valign: 'middle'
  });

  slide24.addText(algo.title, {
    x: colX + 1.9, y: colY + 0.12, w: 3.6, h: 0.32,
    fontSize: 12, bold: true, color: COLORS.textWhite
  });

  slide24.addText(algo.desc, {
    x: colX + 0.2, y: colY + 0.5, w: 5.3, h: 0.4,
    fontSize: 9.5, color: COLORS.textMuted
  });

  // Formula Card
  slide24.addShape(pptx.ShapeType.roundRect, {
    x: colX + 0.2, y: colY + 0.95, w: 5.3, h: 0.45,
    rectRadius: 0.05,
    fill: { color: '111827' },
    line: { color: COLORS.cardBorder, width: 1 }
  });
  slide24.addText(algo.formula, {
    x: colX + 0.3, y: colY + 0.95, w: 5.1, h: 0.45,
    fontSize: 9.5, bold: true, color: COLORS.accentCyan, valign: 'middle', fontFace: 'Consolas'
  });

  slide24.addText(`Implementation: ${algo.impl}`, {
    x: colX + 0.2, y: colY + 1.5, w: 5.3, h: 0.65,
    fontSize: 9, color: COLORS.textMuted
  });
});

// ==========================================
// SECTION 8: MAJOR CHALLENGE FACED (Slide 25)
// ==========================================
console.log('Building Slide 25: Section 8 - Major Challenge Faced...');
const slide25 = pptx.addSlide();
addSlideHeader(slide25, '8', 'Major Engineering Challenge & Solution', 'Architectural breakdown of WhatsApp Cloud API integration, webhook authentication, and fallback resilience');

// Left Column: The Challenge & Constraints
slide25.addShape(pptx.ShapeType.roundRect, {
  x: 0.8, y: 1.65, w: 5.6, h: 4.8,
  rectRadius: 0.08,
  fill: { color: COLORS.cardBg },
  line: { color: COLORS.primaryCoral, width: 1.5 }
});

slide25.addText('⚠️ The Technical Challenge', {
  x: 1.1, y: 1.85, w: 5.0, h: 0.35,
  fontSize: 16, bold: true, color: COLORS.primaryCoral
});

const challenges = [
  {
    title: 'Meta Cloud API 24-Hour Messaging Window',
    desc: 'WhatsApp Cloud API enforces a strict 24-hour service window. Outbound automated messages cannot reach users unless user-initiated within the timeframe or registered as approved business templates.'
  },
  {
    title: 'SHA-256 HMAC Webhook Verification',
    desc: 'Incoming webhook payloads from Meta require raw cryptographic signature verification (X-Hub-Signature-256). Express body-parser json parsing altered raw bytes, breaking signature validation.'
  },
  {
    title: 'Transient Tunnel Drops During Demos',
    desc: 'Local development tunnels (Cloudflare) occasionally reset connection hostnames, severing the webhook callback endpoint during live evaluative demonstrations.'
  }
];

let chY = 2.3;
challenges.forEach(ch => {
  slide25.addText(ch.title, {
    x: 1.1, y: chY, w: 5.0, h: 0.25,
    fontSize: 11, bold: true, color: COLORS.textWhite
  });
  slide25.addText(ch.desc, {
    x: 1.1, y: chY + 0.25, w: 5.0, h: 0.72,
    fontSize: 9.5, color: COLORS.textMuted
  });
  chY += 1.1;
});

// Right Column: Architectural Solution
slide25.addShape(pptx.ShapeType.roundRect, {
  x: 6.8, y: 1.65, w: 5.7, h: 4.8,
  rectRadius: 0.08,
  fill: { color: COLORS.cardBg },
  line: { color: COLORS.accentEmerald, width: 1.5 }
});

slide25.addText('✅ Architectural Solution & Dual-Channel Resilience', {
  x: 7.1, y: 1.85, w: 5.2, h: 0.35,
  fontSize: 16, bold: true, color: COLORS.accentEmerald
});

const solutions = [
  {
    title: 'Dual-Channel Architecture (WhatsApp + Web AI Widget)',
    desc: 'Decoupled the AI intelligence layer into a shared standalone service. When WhatsApp API token expires or tunnel drops, the in-browser floating AI widget (#foodwalaHelpModal) provides 100% identical response capabilities.'
  },
  {
    title: 'Raw Body Preserving Webhook Middleware',
    desc: 'Configured custom verify middleware in express.json({ verify: (req, res, buf) => req.rawBody = buf }) to maintain exact byte fidelity for flawless crypto.createHmac verification.'
  },
  {
    title: 'Self-Healing Cloudflare Tunnel Scripting',
    desc: 'Automated background watchdog daemon monitoring tunnel health and dynamically updating webhook callback routing without server restarts.'
  }
];

let solY = 2.3;
solutions.forEach(sol => {
  slide25.addText(sol.title, {
    x: 7.1, y: solY, w: 5.2, h: 0.25,
    fontSize: 11, bold: true, color: COLORS.textWhite
  });
  slide25.addText(sol.desc, {
    x: 7.1, y: solY + 0.25, w: 5.2, h: 0.72,
    fontSize: 9.5, color: COLORS.textMuted
  });
  solY += 1.1;
});

slide25.addText('Result: Zero downtime for end users • Instant fallback to browser AI desk if WhatsApp Cloud API is inaccessible.', {
  x: 0.8, y: 6.6, w: 11.7, h: 0.3,
  fontSize: 10, bold: true, color: COLORS.accentEmerald, align: 'center'
});

// ==========================================
// SECTION 9: FUTURE ENHANCEMENTS (Slide 26)
// ==========================================
console.log('Building Slide 26: Section 9 - Future Enhancements...');
const slide26 = pptx.addSlide();
addSlideHeader(slide26, '9', 'Future Enhancements & Platform Roadmap', 'Strategic technical roadmap for high-scale microservices, automated logistics, and smart AI personalization');

const futureItems = [
  {
    num: '01',
    title: 'Bidirectional WebSocket Fleet Tracking',
    desc: 'Upgrade from periodic HTTP polling to real-time Socket.IO / WebSockets for sub-second GPS coordinate streaming between delivery partners and customer tracking screens.'
  },
  {
    num: '02',
    title: 'Collaborative AI Dish Recommendation Engine',
    desc: 'Deploy collaborative filtering and neural matrix factorization analyzing ordering patterns, time of day, weather, and dietary tags to suggest high-conversion meals.'
  },
  {
    num: '03',
    title: 'Progressive Web App (PWA) & Offline Menus',
    desc: 'Implement Service Workers and Cache API to enable instant offline menu browsing and native Web Push notifications for order status transitions.'
  },
  {
    num: '04',
    title: 'Multi-Restaurant Unified Cart Checkout',
    desc: 'Enable customers to combine dishes from multiple nearby restaurants into a single unified cart with intelligent dual-pickup route batching.'
  },
  {
    num: '05',
    title: 'Algorithmic Route Optimization & Dispatch',
    desc: 'Integrate Dijkstra / A* route graph optimization taking Bengaluru traffic congestion data into account to assign nearest optimal delivery riders.'
  },
  {
    num: '06',
    title: 'Multilingual Voice Food Ordering (Kannada / Hindi)',
    desc: 'Integrate speech-to-text NLP allowing Bengaluru users to search menus, customize toppings, and place orders using vernacular voice commands.'
  }
];

futureItems.forEach((fi, idx) => {
  const colX = idx % 2 === 0 ? 0.8 : 6.8;
  const colY = 1.65 + Math.floor(idx / 2) * 1.55;

  slide26.addShape(pptx.ShapeType.roundRect, {
    x: colX, y: colY, w: 5.7, h: 1.4,
    rectRadius: 0.08,
    fill: { color: COLORS.cardBg },
    line: { color: COLORS.cardBorder, width: 1 }
  });

  slide26.addShape(pptx.ShapeType.roundRect, {
    x: colX + 0.15, y: colY + 0.15, w: 0.55, h: 0.35,
    rectRadius: 0.06,
    fill: { color: COLORS.primaryCoral, transparency: 85 },
    line: { color: COLORS.primaryCoral, width: 1 }
  });
  slide26.addText(fi.num, {
    x: colX + 0.15, y: colY + 0.15, w: 0.55, h: 0.35,
    fontSize: 12, bold: true, color: COLORS.primaryCoral,
    align: 'center', valign: 'middle'
  });

  slide26.addText(fi.title, {
    x: colX + 0.85, y: colY + 0.15, w: 4.6, h: 0.32,
    fontSize: 12, bold: true, color: COLORS.textWhite
  });

  slide26.addText(fi.desc, {
    x: colX + 0.85, y: colY + 0.48, w: 4.6, h: 0.8,
    fontSize: 9.5, color: COLORS.textMuted
  });
});

slide26.addText('Roadmap Timeline: Q1 2027 — Q4 2027 • Architectural Evolution from Monolith to Event-Driven Microservices', {
  x: 0.8, y: 6.6, w: 11.7, h: 0.3,
  fontSize: 10, italic: true, color: COLORS.accentCyan, align: 'center'
});

// ==========================================
// WRITE PRESENTATION FILE
// ==========================================
const presentationDir = path.join(BASE_DIR, 'presentation');
const pptxPath = path.join(presentationDir, 'FoodWala_Project_Presentation.pptx');
const rootPptxPath = path.join(BASE_DIR, 'FoodWala_Project_Presentation.pptx');

console.log(`Writing PPTX to ${pptxPath}...`);
pptx.writeFile({ fileName: pptxPath })
  .then(() => {
    console.log('✅ Successfully wrote presentation to:', pptxPath);
    fs.copyFileSync(pptxPath, rootPptxPath);
    console.log('✅ Copied presentation to root:', rootPptxPath);
  })
  .catch(err => {
    console.error('❌ Failed to write presentation PPTX:', err);
    process.exit(1);
  });

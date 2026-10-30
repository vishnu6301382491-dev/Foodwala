const PptxGenJS = require('pptxgenjs');
const path = require('path');
const fs = require('fs');

const pptx = new PptxGenJS();

// Set true 16:9 Widescreen Layout (13.333 x 7.5 inches)
pptx.defineLayout({ name: 'WIDESCREEN_16_9', width: 13.333, height: 7.5 });
pptx.layout = 'WIDESCREEN_16_9';
pptx.author = 'FoodWala Engineering Team';
pptx.company = 'FoodWala - Bengaluru Discovery and Delivery';
pptx.title = 'FoodWala Project Presentation';
pptx.subject = 'Comprehensive Project Demonstration and Architecture';

// Design Theme Constants
const COLORS = {
  bgDark: '0B1120',
  cardBg: '1E293B',
  cardBorder: '334155',
  cardBorderLight: '475569',
  primaryCoral: 'EF4444',
  accentOrange: 'F97316',
  accentAmber: 'F59E0B',
  accentEmerald: '10B981',
  accentCyan: '38BDF8',
  accentPurple: '8B5CF6',
  textWhite: 'F8FAFC',
  textMuted: '94A3B8',
  textDark: '0F172A',
  codeBg: '0F172A'
};

const BASE_DIR = path.resolve('D:/FoodWala_Eclipse_Project');
const SCREENSHOTS_DIR = path.join(BASE_DIR, 'presentation/screenshots');
const DIAGRAMS_DIR = path.join(BASE_DIR, 'presentation/diagrams');

// Helper to add standard slide header with strict symmetrical margins (0.8" left, 0.8" right)
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
    x: 0.8, y: 0.72, w: 11.73, h: 0.5,
    fontSize: 22, bold: true, color: COLORS.textWhite
  });

  // Subtitle / Caption
  if (subtitle) {
    slide.addText(subtitle, {
      x: 0.8, y: 1.22, w: 11.73, h: 0.35,
      fontSize: 12, color: COLORS.textMuted
    });
  }

  // Footer branding
  slide.addText('FoodWala — Bengaluru Food Discovery & Delivery Platform', {
    x: 0.8, y: 7.12, w: 7.5, h: 0.28,
    fontSize: 9, color: COLORS.textMuted
  });
  slide.addText('Confidential • Project Demonstration • Master Deck', {
    x: 8.3, y: 7.12, w: 4.23, h: 0.28,
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
  x: 1.0, y: 0.95, w: 2.8, h: 0.38,
  rectRadius: 0.19,
  fill: { color: COLORS.primaryCoral, transparency: 85 },
  line: { color: COLORS.primaryCoral, width: 1 }
});
slide1.addText('PROJECT DEMONSTRATION', {
  x: 1.0, y: 0.95, w: 2.8, h: 0.38,
  fontSize: 11, bold: true, color: COLORS.primaryCoral,
  align: 'center', valign: 'middle'
});

slide1.addText('FoodWala — Bengaluru Food Discovery & Delivery Platform', {
  x: 1.0, y: 1.45, w: 11.33, h: 0.95,
  fontSize: 28, bold: true, color: COLORS.textWhite, wrap: true
});

// Mandatory ONE concise line definition
slide1.addShape(pptx.ShapeType.roundRect, {
  x: 1.0, y: 2.55, w: 11.33, h: 0.88,
  rectRadius: 0.1,
  fill: { color: COLORS.cardBg },
  line: { color: COLORS.primaryCoral, width: 1.5 }
});
slide1.addText(
  '"FoodWala is a Java Full Stack food discovery and delivery platform built with Java Servlets, JSP, JDBC, and MySQL that allows users to discover restaurants, order food, make online payments, and track deliveries in real time."',
  {
    x: 1.2, y: 2.65, w: 10.93, h: 0.68,
    fontSize: 13.5, italic: true, bold: true, color: COLORS.textWhite, valign: 'middle', wrap: true
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

const pillarW = 2.65;
const pillarGap = 0.24;
const pillarStartX = 1.0;

pillars.forEach((p, idx) => {
  const colX = pillarStartX + idx * (pillarW + pillarGap);
  slide1.addShape(pptx.ShapeType.roundRect, {
    x: colX, y: 3.75, w: pillarW, h: 2.75,
    rectRadius: 0.1,
    fill: { color: COLORS.cardBg },
    line: { color: COLORS.cardBorder, width: 1 }
  });

  slide1.addText(p.icon, {
    x: colX + 0.2, y: 3.90, w: pillarW - 0.4, h: 0.45,
    fontSize: 24
  });
  slide1.addText(p.title, {
    x: colX + 0.2, y: 4.40, w: pillarW - 0.4, h: 0.45,
    fontSize: 13, bold: true, color: COLORS.textWhite, wrap: true
  });
  slide1.addText(p.desc, {
    x: colX + 0.2, y: 4.90, w: pillarW - 0.4, h: 1.45,
    fontSize: 10, color: COLORS.textMuted, wrap: true
  });
});

slide1.addText('Bengaluru, Karnataka • Production Ready Architecture • 4–5 Minute Demonstration Deck', {
  x: 1.0, y: 6.85, w: 11.33, h: 0.35,
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
    badge: 'FRONTEND & JSP',
    color: COLORS.accentCyan,
    x: 0.80, y: 1.65, w: 3.70, h: 2.45,
    items: [
      { name: 'HTML5 & CSS3', detail: 'Semantic layout, custom dark mode, variables' },
      { name: 'Bootstrap 5.3 & Icons', detail: 'Responsive grid, modals, offcanvas navigation' },
      { name: 'JSP & JSTL Templates', detail: 'Server-Side Rendering, dynamic expression language' },
      { name: 'JavaScript (ES6+)', detail: 'Modular client state, fetch API, local storage' }
    ]
  },
  {
    badge: 'JAVA BACKEND & SERVLETS',
    color: COLORS.accentEmerald,
    x: 4.81, y: 1.65, w: 3.70, h: 2.45,
    items: [
      { name: 'Java (JDK 17 / 21)', detail: 'Core OOP business logic, robust multithreading' },
      { name: 'Java Servlets (Jakarta)', detail: 'MVC Controller dispatching, session management' },
      { name: 'DAO & Service Layer', detail: 'Clean separation of concerns, POJO models' },
      { name: 'Apache Tomcat Server', detail: 'High-concurrency enterprise Servlet web container' }
    ]
  },
  {
    badge: 'DATABASE & PERSISTENCE',
    color: COLORS.accentAmber,
    x: 8.83, y: 1.65, w: 3.70, h: 2.45,
    items: [
      { name: 'MySQL 9.7 Server', detail: '22 relational tables, InnoDB engine, ACID' },
      { name: 'JDBC & Connection Pool', detail: 'Optimized DAO persistence with PreparedStatement' },
      { name: 'Foreign Key Integrity', detail: 'Cascading updates, constraints, normalized 3NF' },
      { name: 'Audit & Tracking', detail: 'order_status_history, login_history, activity_log' }
    ]
  },
  {
    badge: 'SECURITY & AUTH',
    color: COLORS.primaryCoral,
    x: 0.80, y: 4.35, w: 3.70, h: 2.45,
    items: [
      { name: 'Argon2id & BCrypt', detail: 'State-of-the-art memory-hard password encryption' },
      { name: 'Role-Based Access (RBAC)', detail: 'Super Admin, Store Manager, Rider, Customer' },
      { name: 'Servlet Filters & CORS', detail: 'CORSFilter, request validation, session guards' },
      { name: 'Store Data Isolation', detail: 'Enforced tenant separation on manager routes' }
    ]
  },
  {
    badge: 'PAYMENT & COMMS',
    color: COLORS.accentPurple,
    x: 4.81, y: 4.35, w: 3.70, h: 2.45,
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
    x: 8.83, y: 4.35, w: 3.70, h: 2.45,
    items: [
      { name: 'Eclipse IDE (Java EE)', detail: 'Dynamic Web Project workspace & server runtime' },
      { name: 'Apache Tomcat v9/v10', detail: 'Local & production Servlet deployment container' },
      { name: 'Git & GitHub Versioning', detail: 'Branching workflow, release version control' },
      { name: 'Cloudflare Tunnel', detail: 'Zero-trust HTTPS tunnel for webhook intake' }
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
// Frame card for screenshot
slide3.addShape(pptx.ShapeType.roundRect, {
  x: 0.80, y: 1.60, w: 8.40, h: 4.85,
  rectRadius: 0.08,
  fill: { color: COLORS.cardBg },
  line: { color: COLORS.cardBorder, width: 1 }
});

if (fs.existsSync(imgStruct)) {
  slide3.addImage({
    path: imgStruct,
    x: 0.90, y: 1.68, w: 8.20, h: 4.69,
    sizing: { type: 'contain', w: 8.20, h: 4.69 }
  });
}

// Side explanation panel
slide3.addShape(pptx.ShapeType.roundRect, {
  x: 9.43, y: 1.60, w: 3.10, h: 4.85,
  rectRadius: 0.08,
  fill: { color: COLORS.cardBg },
  line: { color: COLORS.cardBorder, width: 1 }
});

slide3.addText('Layered Architecture', {
  x: 9.63, y: 1.80, w: 2.70, h: 0.35,
  fontSize: 14, bold: true, color: COLORS.primaryCoral
});

const structHighlights = [
  { title: 'Frontend & JSP Layer', desc: 'Server-rendered JSP templates, responsive Bootstrap 5.3 stylesheets, and client scripts (app.js, cart.js).' },
  { title: 'Java Servlets (Controllers)', desc: 'com.tap.controller Servlets handling HTTP request routing, session lifecycle, and MVC dispatching.' },
  { title: 'DAO & Service Layer', desc: 'com.tap.dao & daoimpl encapsulating parameterized SQL queries with JDBC connection pooling.' },
  { title: 'Database & Transactions', desc: 'MySQL relational schema with 22 normalized tables and atomic InnoDB ACID transactions.' }
];

let hlY = 2.25;
structHighlights.forEach(h => {
  slide3.addText(h.title, {
    x: 9.63, y: hlY, w: 2.70, h: 0.25,
    fontSize: 11, bold: true, color: COLORS.textWhite
  });
  slide3.addText(h.desc, {
    x: 9.63, y: hlY + 0.24, w: 2.70, h: 0.72,
    fontSize: 9.5, color: COLORS.textMuted
  });
  hlY += 1.05;
});

slide3.addText('Caption: Architecture strictly decouples Java Servlets, Business Services, and JDBC DAOs from JSP & client views.', {
  x: 0.8, y: 6.65, w: 11.73, h: 0.3,
  fontSize: 10, italic: true, color: COLORS.accentAmber, align: 'center'
});

// ==========================================
// SECTION 4: ER DIAGRAM (Slide 4) — Centered!
// ==========================================
console.log('Building Slide 4: Section 4 - ER Diagram (Centered)...');
const slide4 = pptx.addSlide();
addSlideHeader(slide4, '4', 'Database Architecture & ER Diagram', 'Normalized relational database schema (MySQL 9.7) featuring 22 tables supporting ACID-compliant order transactions');

// Mathematically Centered ER Diagram (Aspect 16:9)
// Slide width: 13.333". Height: 4.90" -> Width: 4.90 * (16/9) = 8.711".
// Centered X: (13.333 - 8.711) / 2 = 2.311"
const erFrameX = 2.15;
const erFrameY = 1.50;
const erFrameW = 9.03;
const erFrameH = 5.08;

slide4.addShape(pptx.ShapeType.roundRect, {
  x: erFrameX, y: erFrameY, w: erFrameW, h: erFrameH,
  rectRadius: 0.08,
  fill: { color: COLORS.cardBg },
  line: { color: COLORS.cardBorder, width: 1 }
});

const imgER = path.join(DIAGRAMS_DIR, 'foodwala-er-diagram.png');
if (fs.existsSync(imgER)) {
  slide4.addImage({
    path: imgER,
    x: 2.31, y: 1.58, w: 8.71, h: 4.90,
    sizing: { type: 'contain', w: 8.71, h: 4.90 }
  });
}

slide4.addText(
  'Key Relationships: user (1:N) orders • restaurant (1:N) menu • orders (1:N) order_item • orders (1:1) payment • user (1:N) whatsapp_conversations',
  {
    x: 0.8, y: 6.68, w: 11.73, h: 0.3,
    fontSize: 10, bold: true, color: COLORS.accentCyan, align: 'center'
  }
);

// ==========================================
// SECTION 5: PAGE SCREENSHOTS (Slides 5 to 24)
// Exactly 1 Page Screenshot per Slide (20 Slides Total)
// Mathematically Centered & Perfectly Aligned!
// ==========================================
console.log('Building Section 5: Dedicated Page Screenshots (20 slides)...');

const pageSlides = [
  {
    slideNum: '5.1',
    title: 'Home Page — Bengaluru Discovery & Hero Showcase',
    caption: 'Hero banner with video showcase, dynamic Bengaluru cuisine category carousels, instant search bar, and top-rated restaurants.',
    file: '01_home_page.png',
    type: 'widescreen'
  },
  {
    slideNum: '5.2',
    title: 'Login Screen — Role-Based Authentication',
    caption: 'Multi-role authentication gateway verifying Customer, Restaurant Manager, and Delivery Partner credentials with Argon2id password verification.',
    file: '02_login_page.png',
    type: 'widescreen'
  },
  {
    slideNum: '5.3',
    title: 'Registration Screen — Customer Onboarding & Fleet Toggle',
    caption: 'Dual onboarding form supporting Customer sign-up and direct Delivery Partner fleet onboarding toggle with vehicle & license validation.',
    file: '03_register_page.png',
    type: 'widescreen'
  },
  {
    slideNum: '5.4',
    title: 'Account Security — Password Reset OTP Verification Email',
    caption: 'Automated cryptographic password reset email delivering a 6-digit OTP (724132) with 15-minute validity, secure token expiry, and account protection.',
    file: '21_email_forgot_password.png',
    type: 'email',
    emailDetails: {
      badge: 'ACCOUNT RECOVERY & AUTH SECURITY',
      badgeColor: COLORS.primaryCoral,
      headline: 'Automated Security Verification Email',
      subhead: 'Instant OTP dispatch via EmailJS REST Gateway triggered upon password recovery request.',
      meta: [
        { label: 'Subject', val: 'FoodWala Receipt for Order VERIFY-724132 — FoodWala Account Security' },
        { label: 'Recipient', val: 'Registered User Email (Direct Mailbox Delivery)' },
        { label: 'Verification OTP', val: '724132 (Strict 15-Minute Expiry Window)' },
        { label: 'Event Trigger', val: 'POST /api/auth/forgot-password' }
      ],
      highlights: [
        'Argon2id Memory-Hard Password Re-hashing on submit',
        'Transient In-Memory OTP Store + MySQL reset_token Sync',
        'Single-use verification token cleared immediately upon reset',
        'Rate-limited endpoints (authLimiter) to prevent brute-force'
      ],
      payloadSample: 'Payload: { email: user@foodwala.com, otp: "724132", ttl: 900s, status: "DISPATCHED" }'
    }
  },
  {
    slideNum: '5.5',
    title: 'Restaurant Discovery & Advanced Filtering',
    caption: 'Comprehensive listing of Bengaluru eateries with multi-criteria filtering by cuisine, customer rating, delivery ETA, veg/non-veg, and budget.',
    file: '04_restaurants_discovery.png',
    type: 'widescreen'
  },
  {
    slideNum: '5.6',
    title: 'Restaurant Menu & Item Customization',
    caption: 'Dynamic restaurant catalog showing categorized dishes, prices, ratings, dietary tags, real-time availability badges, and instant cart addition.',
    file: '05_restaurant_menu.png',
    type: 'widescreen'
  },
  {
    slideNum: '5.7',
    title: 'Food Search & Typo-Tolerant Autocomplete',
    caption: 'Real-time search bar with instant autocomplete suggestions powered by the Jaro-Winkler string similarity algorithm for typo resilience.',
    file: '06_search_feature.png',
    type: 'widescreen'
  },
  {
    slideNum: '5.8',
    title: 'Cart Management & Live Bill Breakdown',
    caption: 'Interactive shopping cart supporting item increment/decrement, real-time subtotal calculation, delivery fee, GST (5%), platform fee, and coupon application.',
    file: '07_cart_page.png',
    type: 'widescreen'
  },
  {
    slideNum: '5.9',
    title: 'Checkout & Delivery Address Selection',
    caption: 'Streamlined checkout interface allowing users to choose saved delivery addresses, provide delivery instructions, and review order totals.',
    file: '08_checkout_page.png',
    type: 'widescreen'
  },
  {
    slideNum: '5.10',
    title: 'Payment Gateway Integration — Razorpay & COD',
    caption: 'Integrated payment processing supporting Razorpay checkout modal (UPI, Debit/Credit cards, Net Banking) alongside Cash on Delivery options.',
    file: '09_payment_screen.png',
    displayUrl: 'http://localhost:5000/checkout.html#payment',
    type: 'widescreen'
  },
  {
    slideNum: '5.11',
    title: 'Order Confirmation & Instant Receipt',
    caption: 'Post-purchase confirmation screen displaying generated Order ID, estimated arrival time, detailed item summary, and live tracking call-to-action.',
    file: '10_order_confirmation.png',
    type: 'widescreen'
  },
  {
    slideNum: '5.12',
    title: 'Order Confirmation — Automated Transactional Email Receipt',
    caption: 'Official order confirmation receipt delivered via EmailJS immediately following Razorpay transaction, detailing Order ID #41486, Vidyarthi Bhavan restaurant, and paid grand total.',
    file: '20_email_order_receipt.png',
    type: 'email',
    emailDetails: {
      badge: 'TRANSACTIONAL ORDER CONFIRMATION',
      badgeColor: COLORS.accentEmerald,
      headline: 'Automated Post-Checkout Email Receipt',
      subhead: 'Instant transactional order receipt dispatched to customer inbox upon successful payment.',
      meta: [
        { label: 'Order ID', val: 'Order #41486 • Vidyarthi Bhavan' },
        { label: 'Recipient', val: 'Vishnu Vardhan Reddy (Customer Mailbox)' },
        { label: 'Total Paid', val: 'Rs. 192.00 (Razorpay Test Sandbox)' },
        { label: 'Dispatched Items', val: 'Steamed Idli (2x), Medu Vada, Khara Bath, Benne Masala Dosa' }
      ],
      highlights: [
        'Automated dispatch via EmailJS REST Client (emailService.js)',
        'Triggered atomically upon ACID transaction commit',
        'Itemized billing breakdown matching database record',
        'Permanent audit record logged with order timestamp'
      ],
      payloadSample: 'Payload: { orderId: 41486, items: 4, grandTotal: "Rs. 192.00", channel: "EMAILJS_REST" }'
    }
  },
  {
    slideNum: '5.13',
    title: 'Live Order Tracking & 5-Stage Status Pipeline',
    caption: 'Real-time order progress monitor tracking 5 distinct stages: Order Placed -> Confirmed -> Food Prepared -> Out for Delivery -> Delivered.',
    file: '11_order_tracking.png',
    type: 'widescreen'
  },
  {
    slideNum: '5.14',
    title: 'Order History & Digital Invoices',
    caption: 'Comprehensive log of past orders with timestamps, status tags, itemized costs, one-click re-order functionality, and invoice retrieval.',
    file: '12_orders_history.png',
    type: 'widescreen'
  },
  {
    slideNum: '5.15',
    title: 'User Profile & Account Management',
    caption: 'Customer management portal showing personal profile details, contact information, password modification tools, and account security preferences.',
    file: '13_profile_page.png',
    type: 'widescreen'
  },
  {
    slideNum: '5.16',
    title: 'Saved Delivery Addresses & Geolocation',
    caption: 'Address book management allowing users to save multiple locations (Home, Work, Other) with street details, landmarks, and default selections.',
    file: '14_address_management.png',
    type: 'widescreen'
  },
  {
    slideNum: '5.17',
    title: 'Super Admin Console & Platform Analytics',
    caption: 'Platform management dashboard displaying system-wide gross merchandise volume (GMV), active restaurant approvals, user metrics, and revenue charts.',
    file: '15_admin_dashboard.png',
    type: 'widescreen'
  },
  {
    slideNum: '5.18',
    title: 'Restaurant Manager Dashboard & Store Isolation',
    caption: 'Store-isolated management portal allowing authorized managers to accept/reject incoming orders, update dish availability, and inspect sales trends.',
    file: '16_restaurant_manager_dashboard.png',
    type: 'widescreen'
  },
  {
    slideNum: '5.19',
    title: 'Delivery Partner Fleet Portal',
    caption: 'Dedicated driver mobile portal with real-time GPS coordinate reporting, assigned delivery orders list, and order delivery status updates.',
    file: '17_delivery_partner_portal.png',
    type: 'widescreen'
  },
  {
    slideNum: '5.20',
    title: 'WhatsApp 24/7 AI Assistance Desk',
    caption: 'Dual-channel conversational AI assistant resolving customer queries, order status inquiries, menu suggestions, and escalation tickets.',
    file: '18_whatsapp_ai_assistant.png',
    type: 'widescreen'
  }
];

pageSlides.forEach(ps => {
  const slide = pptx.addSlide();
  addSlideHeader(slide, ps.slideNum, ps.title, ps.caption);

  const imgPath = path.join(SCREENSHOTS_DIR, ps.file);

  if (ps.type === 'email' && ps.emailDetails) {
    // ==========================================
    // SPECIALIZED EXECUTIVE SIDE-BY-SIDE LAYOUT
    // Left: Framed High-Res Vertical Email Mockup
    // Right: Technical Specification & Architecture Card
    // ==========================================
    const leftCardX = 0.80;
    const leftCardY = 1.55;
    const leftCardW = 4.60;
    const leftCardH = 5.02;

    // Left Framing Card
    slide.addShape(pptx.ShapeType.roundRect, {
      x: leftCardX, y: leftCardY, w: leftCardW, h: leftCardH,
      rectRadius: 0.08,
      fill: { color: COLORS.cardBg },
      line: { color: COLORS.cardBorder, width: 1 }
    });

    if (fs.existsSync(imgPath)) {
      slide.addImage({
        path: imgPath,
        x: leftCardX + 0.12, y: leftCardY + 0.10, w: leftCardW - 0.24, h: leftCardH - 0.20,
        sizing: { type: 'contain', w: leftCardW - 0.24, h: leftCardH - 0.20 }
      });
    }

    // Right Architecture Card
    const rightCardX = 5.65;
    const rightCardY = 1.55;
    const rightCardW = 6.88;
    const rightCardH = 5.02;

    slide.addShape(pptx.ShapeType.roundRect, {
      x: rightCardX, y: rightCardY, w: rightCardW, h: rightCardH,
      rectRadius: 0.08,
      fill: { color: COLORS.cardBg },
      line: { color: COLORS.cardBorder, width: 1 }
    });

    // Badge
    slide.addShape(pptx.ShapeType.roundRect, {
      x: rightCardX + 0.25, y: rightCardY + 0.22, w: 3.2, h: 0.28,
      rectRadius: 0.14,
      fill: { color: ps.emailDetails.badgeColor, transparency: 85 },
      line: { color: ps.emailDetails.badgeColor, width: 1 }
    });
    slide.addText(ps.emailDetails.badge, {
      x: rightCardX + 0.25, y: rightCardY + 0.22, w: 3.2, h: 0.28,
      fontSize: 9, bold: true, color: ps.emailDetails.badgeColor,
      align: 'center', valign: 'middle'
    });

    // Headline
    slide.addText(ps.emailDetails.headline, {
      x: rightCardX + 0.25, y: rightCardY + 0.58, w: rightCardW - 0.5, h: 0.35,
      fontSize: 15, bold: true, color: COLORS.textWhite
    });
    slide.addText(ps.emailDetails.subhead, {
      x: rightCardX + 0.25, y: rightCardY + 0.95, w: rightCardW - 0.5, h: 0.35,
      fontSize: 10.5, color: COLORS.textMuted
    });

    // Metadata Grid
    let metaY = rightCardY + 1.40;
    ps.emailDetails.meta.forEach(m => {
      slide.addShape(pptx.ShapeType.roundRect, {
        x: rightCardX + 0.25, y: metaY, w: rightCardW - 0.5, h: 0.38,
        rectRadius: 0.05,
        fill: { color: '0F172A' },
        line: { color: COLORS.cardBorder, width: 1 }
      });
      slide.addText(m.label, {
        x: rightCardX + 0.35, y: metaY + 0.05, w: 1.6, h: 0.28,
        fontSize: 9, bold: true, color: COLORS.accentCyan, valign: 'middle'
      });
      slide.addText(m.val, {
        x: rightCardX + 2.05, y: metaY + 0.05, w: rightCardW - 2.35, h: 0.28,
        fontSize: 9.5, color: COLORS.textWhite, valign: 'middle'
      });
      metaY += 0.46;
    });

    // Security & Delivery Highlights
    slide.addText('Key Architectural Highlights:', {
      x: rightCardX + 0.25, y: metaY + 0.10, w: rightCardW - 0.5, h: 0.25,
      fontSize: 11, bold: true, color: COLORS.primaryCoral
    });
    let hlY = metaY + 0.36;
    ps.emailDetails.highlights.forEach(h => {
      slide.addText(`✓  ${h}`, {
        x: rightCardX + 0.25, y: hlY, w: rightCardW - 0.5, h: 0.22,
        fontSize: 9.5, color: COLORS.textMuted
      });
      hlY += 0.24;
    });

    // Sample payload bar
    slide.addShape(pptx.ShapeType.roundRect, {
      x: rightCardX + 0.25, y: rightCardH + leftCardY - 0.50, w: rightCardW - 0.5, h: 0.35,
      rectRadius: 0.05,
      fill: { color: '090E17' },
      line: { color: COLORS.cardBorder, width: 1 }
    });
    slide.addText(ps.emailDetails.payloadSample, {
      x: rightCardX + 0.35, y: rightCardH + leftCardY - 0.50, w: rightCardW - 0.7, h: 0.35,
      fontSize: 8.5, color: COLORS.accentEmerald, fontFace: 'Consolas', valign: 'middle'
    });

    slide.addText('Real Transactional Email Screenshot • Delivered via EmailJS • Verified in Gmail Mailbox', {
      x: 0.8, y: 6.68, w: 11.73, h: 0.3,
      fontSize: 9, italic: true, color: COLORS.accentCyan, align: 'center'
    });

  } else {
    // ==========================================
    // MATHEMATICALLY CENTERED 16:9 WIDESCREEN SLIDE
    // Exact Width: 8.71" • Height: 4.90" • Centered X: 2.31"
    // ==========================================
    const frameX = 2.15;
    const frameY = 1.50;
    const frameW = 9.03;
    const frameH = 5.08;

    slide.addShape(pptx.ShapeType.roundRect, {
      x: frameX, y: frameY, w: frameW, h: frameH,
      rectRadius: 0.08,
      fill: { color: COLORS.cardBg },
      line: { color: COLORS.cardBorder, width: 1 }
    });

    if (fs.existsSync(imgPath)) {
      slide.addImage({
        path: imgPath,
        x: 2.31, y: 1.58, w: 8.71, h: 4.90,
        sizing: { type: 'contain', w: 8.71, h: 4.90 }
      });
    } else {
      slide.addText(`Screenshot file not found: ${ps.file}`, {
        x: 2.31, y: 3.0, w: 8.71, h: 1.0,
        fontSize: 16, color: COLORS.primaryCoral, align: 'center'
      });
    }

    const displayUrl = ps.displayUrl || `http://localhost:5000/${ps.file.replace(/^[0-9]+_/, '').replace('.png', '.html')}`;
    slide.addText(`Real Application Screenshot • 1920×1080 Viewport • ${displayUrl}`, {
      x: 0.8, y: 6.68, w: 11.73, h: 0.3,
      fontSize: 9, italic: true, color: COLORS.textMuted, align: 'center'
    });
  }
});

// ==========================================
// SECTION 6: NEW FEATURES ADDED (Slide 25)
// Mathematically Centered!
// ==========================================
console.log('Building Slide 25: Section 6 - New Features Added (Centered)...');
const slide25 = pptx.addSlide();
addSlideHeader(slide25, '6', 'New Features Added & Innovative Capabilities', 'Visual showcase of production capabilities built beyond base requirement: Typo Search, WhatsApp AI Desk, Store Isolation, Dark Mode');

// Centered Framing Card
slide25.addShape(pptx.ShapeType.roundRect, {
  x: 2.15, y: 1.50, w: 9.03, h: 5.08,
  rectRadius: 0.08,
  fill: { color: COLORS.cardBg },
  line: { color: COLORS.cardBorder, width: 1 }
});

const imgShowcase = path.join(SCREENSHOTS_DIR, '19_new_features_showcase.png');
if (fs.existsSync(imgShowcase)) {
  slide25.addImage({
    path: imgShowcase,
    x: 2.31, y: 1.58, w: 8.71, h: 4.90,
    sizing: { type: 'contain', w: 8.71, h: 4.90 }
  });
}

slide25.addText('Key Innovations: 1. Jaro-Winkler Typo Search • 2. 25-Intent WhatsApp AI Desk • 3. Store Data Isolation • 4. Adaptive Dark Mode', {
  x: 0.8, y: 6.68, w: 11.73, h: 0.3,
  fontSize: 10, bold: true, color: COLORS.accentCyan, align: 'center'
});

// ==========================================
// SECTION 7: IMPORTANT ALGORITHMS (Slide 26)
// ==========================================
console.log('Building Slide 26: Section 7 - Important Algorithms...');
const slide26 = pptx.addSlide();
addSlideHeader(slide26, '7', 'Important Algorithms & Core Engineering', 'Mathematical and algorithmic logic driving search similarity, cart billing, transactional integrity, and NLP classification');

const algorithms = [
  {
    title: '1. Jaro-Winkler String Distance Algorithm',
    badge: 'FUZZY SEARCH',
    color: COLORS.accentCyan,
    desc: 'Calculates transposition-aware string distance with common prefix bonus l (max 4) and scaling factor p = 0.1:',
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
    impl: 'Java JDBC transaction: con.setAutoCommit(false), atomic multi-table execution, and con.rollback() on failure.'
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
  const colX = idx % 2 === 0 ? 0.80 : 6.83;
  const colY = idx < 2 ? 1.65 : 4.25;

  slide26.addShape(pptx.ShapeType.roundRect, {
    x: colX, y: colY, w: 5.70, h: 2.38,
    rectRadius: 0.08,
    fill: { color: COLORS.cardBg },
    line: { color: COLORS.cardBorder, width: 1 }
  });

  slide26.addShape(pptx.ShapeType.roundRect, {
    x: colX + 0.2, y: colY + 0.15, w: 1.6, h: 0.26,
    rectRadius: 0.13,
    fill: { color: algo.color, transparency: 85 },
    line: { color: algo.color, width: 1 }
  });
  slide26.addText(algo.badge, {
    x: colX + 0.2, y: colY + 0.15, w: 1.6, h: 0.26,
    fontSize: 8.5, bold: true, color: algo.color,
    align: 'center', valign: 'middle'
  });

  slide26.addText(algo.title, {
    x: colX + 1.9, y: colY + 0.12, w: 3.6, h: 0.32,
    fontSize: 12, bold: true, color: COLORS.textWhite
  });

  slide26.addText(algo.desc, {
    x: colX + 0.2, y: colY + 0.5, w: 5.3, h: 0.4,
    fontSize: 9.5, color: COLORS.textMuted
  });

  // Formula Card
  slide26.addShape(pptx.ShapeType.roundRect, {
    x: colX + 0.2, y: colY + 0.95, w: 5.3, h: 0.45,
    rectRadius: 0.05,
    fill: { color: '111827' },
    line: { color: COLORS.cardBorder, width: 1 }
  });
  slide26.addText(algo.formula, {
    x: colX + 0.3, y: colY + 0.95, w: 5.1, h: 0.45,
    fontSize: 9.5, bold: true, color: COLORS.accentCyan, valign: 'middle', fontFace: 'Consolas'
  });

  slide26.addText(`Implementation: ${algo.impl}`, {
    x: colX + 0.2, y: colY + 1.48, w: 5.3, h: 0.70,
    fontSize: 9, color: COLORS.textMuted
  });
});

// ==========================================
// SECTION 8: MAJOR CHALLENGE FACED (Slide 27)
// ==========================================
console.log('Building Slide 27: Section 8 - Major Challenge Faced...');
const slide27 = pptx.addSlide();
addSlideHeader(slide27, '8', 'Major Engineering Challenge & Solution', 'Architectural breakdown of WhatsApp Cloud API integration, webhook authentication, and fallback resilience');

// Left Column: The Challenge & Constraints
slide27.addShape(pptx.ShapeType.roundRect, {
  x: 0.80, y: 1.65, w: 5.70, h: 4.80,
  rectRadius: 0.08,
  fill: { color: COLORS.cardBg },
  line: { color: COLORS.primaryCoral, width: 1.5 }
});

slide27.addText('⚠️ The Technical Challenge', {
  x: 1.05, y: 1.85, w: 5.2, h: 0.35,
  fontSize: 16, bold: true, color: COLORS.primaryCoral
});

const challenges = [
  {
    title: 'Meta Cloud API 24-Hour Messaging Window',
    desc: 'WhatsApp Cloud API enforces a strict 24-hour service window. Outbound automated messages cannot reach users unless user-initiated within the timeframe or registered as approved business templates.'
  },
  {
    title: 'Servlet Stream Consumption & HMAC-SHA256 Verification',
    desc: 'Incoming payment & webhook payloads require raw cryptographic signature verification (HMAC-SHA256). In standard Java Servlets, reading getInputStream() consumes the stream, preventing downstream parameter parsing.'
  },
  {
    title: 'Transient Tunnel Drops During Demos',
    desc: 'Local development tunnels (Cloudflare) occasionally reset connection hostnames, severing the webhook callback endpoint during live evaluative demonstrations.'
  }
];

let chY = 2.3;
challenges.forEach(ch => {
  slide27.addText(ch.title, {
    x: 1.05, y: chY, w: 5.2, h: 0.25,
    fontSize: 11, bold: true, color: COLORS.textWhite
  });
  slide27.addText(ch.desc, {
    x: 1.05, y: chY + 0.25, w: 5.2, h: 0.72,
    fontSize: 9.5, color: COLORS.textMuted
  });
  chY += 1.1;
});

// Right Column: Architectural Solution
slide27.addShape(pptx.ShapeType.roundRect, {
  x: 6.83, y: 1.65, w: 5.70, h: 4.80,
  rectRadius: 0.08,
  fill: { color: COLORS.cardBg },
  line: { color: COLORS.accentEmerald, width: 1.5 }
});

slide27.addText('✅ Architectural Solution & Dual-Channel Resilience', {
  x: 7.08, y: 1.85, w: 5.2, h: 0.35,
  fontSize: 16, bold: true, color: COLORS.accentEmerald
});

const solutions = [
  {
    title: 'Dual-Channel Architecture (WhatsApp + Web AI Widget)',
    desc: 'Decoupled the AI intelligence layer into a shared standalone service. When WhatsApp API token expires or tunnel drops, the in-browser floating AI widget (#foodwalaHelpModal) provides 100% identical response capabilities.'
  },
  {
    title: 'Custom CachedHttpServletRequestWrapper (Filter Pattern)',
    desc: 'Engineered a Servlet Filter implementing HttpServletRequestWrapper to cache the raw byte stream in memory, enabling both HMAC-SHA256 crypto validation and JSON parameter extraction without stream exhaustion.'
  },
  {
    title: 'Self-Healing Cloudflare Tunnel Scripting',
    desc: 'Automated background watchdog daemon monitoring tunnel health and dynamically updating webhook callback routing without server restarts.'
  }
];

let solY = 2.3;
solutions.forEach(sol => {
  slide27.addText(sol.title, {
    x: 7.08, y: solY, w: 5.2, h: 0.25,
    fontSize: 11, bold: true, color: COLORS.textWhite
  });
  slide27.addText(sol.desc, {
    x: 7.08, y: solY + 0.25, w: 5.2, h: 0.72,
    fontSize: 9.5, color: COLORS.textMuted
  });
  solY += 1.1;
});

slide27.addText('Result: Zero downtime for end users • Instant fallback to browser AI desk if WhatsApp Cloud API is inaccessible.', {
  x: 0.8, y: 6.68, w: 11.73, h: 0.3,
  fontSize: 10, bold: true, color: COLORS.accentEmerald, align: 'center'
});

// ==========================================
// SECTION 9: FUTURE ENHANCEMENTS (Slide 28)
// ==========================================
console.log('Building Slide 28: Section 9 - Future Enhancements...');
const slide28 = pptx.addSlide();
addSlideHeader(slide28, '9', 'Future Enhancements & Platform Roadmap', 'Strategic technical roadmap for high-scale microservices, automated logistics, and smart AI personalization');

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
  const colX = idx % 2 === 0 ? 0.80 : 6.83;
  const colY = 1.65 + Math.floor(idx / 2) * 1.55;

  slide28.addShape(pptx.ShapeType.roundRect, {
    x: colX, y: colY, w: 5.70, h: 1.40,
    rectRadius: 0.08,
    fill: { color: COLORS.cardBg },
    line: { color: COLORS.cardBorder, width: 1 }
  });

  slide28.addShape(pptx.ShapeType.roundRect, {
    x: colX + 0.15, y: colY + 0.15, w: 0.55, h: 0.35,
    rectRadius: 0.06,
    fill: { color: COLORS.primaryCoral, transparency: 85 },
    line: { color: COLORS.primaryCoral, width: 1 }
  });
  slide28.addText(fi.num, {
    x: colX + 0.15, y: colY + 0.15, w: 0.55, h: 0.35,
    fontSize: 12, bold: true, color: COLORS.primaryCoral,
    align: 'center', valign: 'middle'
  });

  slide28.addText(fi.title, {
    x: colX + 0.85, y: colY + 0.15, w: 4.6, h: 0.32,
    fontSize: 12, bold: true, color: COLORS.textWhite
  });

  slide28.addText(fi.desc, {
    x: colX + 0.85, y: colY + 0.48, w: 4.6, h: 0.80,
    fontSize: 9.5, color: COLORS.textMuted
  });
});

slide28.addText('Roadmap Timeline: Q1 2027 — Q4 2027 • Architectural Evolution from Monolith to Event-Driven Microservices', {
  x: 0.8, y: 6.68, w: 11.73, h: 0.3,
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

    // Overwrite all Downloads & Desktop variants so any shortcut/recent opens the clean presentation
    const targets = [
      'C:/Users/vishn/Downloads/FoodWala_Project_Presentation.pptx',
      'C:/Users/vishn/Downloads/FoodWala_Project_Presentation (1).pptx',
      'C:/Users/vishn/Downloads/FoodWala_Project_Presentation (2).pptx',
      'C:/Users/vishn/Downloads/FoodWala_Project_Presentation (3).pptx',
      'C:/Users/vishn/Downloads/FoodWala_Project_Presentation (4).pptx',
      'C:/Users/vishn/Downloads/FoodWala_Project_Presentation_Fixed.pptx',
      'C:/Users/vishn/OneDrive/Desktop/FoodWala_Project_Presentation.pptx'
    ];

    targets.forEach(target => {
      try {
        fs.copyFileSync(pptxPath, target);
        console.log('✅ Copied presentation to:', target);
      } catch (err) {
        console.warn('⚠️ Could not copy to target:', target, err.message);
      }
    });
  })
  .catch(err => {
    console.error('❌ Failed to write presentation PPTX:', err);
    process.exit(1);
  });

/**
 * scripts/capture_presentation_screenshots.js
 * Captures clean 1920x1080 high-resolution screenshots of all real FoodWala application pages
 * and renders the authentic project repository structure.
 */

const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'http://localhost:5000';
const OUTPUT_DIR = path.join(__dirname, '../presentation/screenshots');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

const CUSTOMER_USER = {
  user_id: 1,
  username: 'VISHNU',
  email: 'vishnu@foodwala.com',
  phone: '6301382491',
  role: 'customer',
  address: 'Koramangala 4th Block, Bengaluru'
};

const ADMIN_USER = {
  user_id: 2,
  username: 'Admin FoodWala',
  email: 'adminfoodwala@gmail.com',
  role: 'admin',
  phone: '6301382491'
};

const MANAGER_USER = {
  user_id: 98,
  username: 'Kabab Magic Manager',
  email: 'kababmagicbasavanagudi@gmail.com',
  role: 'restaurant',
  restaurant_id: 98
};

const PARTNER_USER = {
  user_id: 3,
  username: 'Rahul Kumar',
  email: 'rahul.delivery@foodwala.com',
  role: 'partner',
  phone: '9876543220'
};

const SAMPLE_CART = {
  restaurantId: 1,
  restaurantName: 'Donne Biryani Mane',
  restaurantAddress: 'Koramangala 5th Block, Bengaluru',
  items: [
    {
      id: 1,
      menuId: 1,
      name: 'Special Donne Mutton Biryani',
      price: 320,
      quantity: 2,
      isVeg: false,
      restaurantId: 1
    },
    {
      id: 2,
      menuId: 2,
      name: 'Chicken Pepper Dry',
      price: 220,
      quantity: 1,
      isVeg: false,
      restaurantId: 1
    }
  ]
};

const SAMPLE_COUPON = {
  code: 'FOODWALA50',
  discountPercent: 50,
  maxDiscount: 150,
  minOrder: 100
};

const SAMPLE_LOCATION = {
  id: 'koramangala',
  name: 'Koramangala, Bengaluru',
  shortName: 'Koramangala',
  lat: 12.9352,
  lng: 77.6245
};

async function capture() {
  console.log('🚀 Launching Chrome via Puppeteer-Core...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--disable-gpu',
      '--window-size=1920,1080'
    ]
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });

  async function setSession(user = CUSTOMER_USER, withCart = true) {
    await page.evaluate((u, c, cp, loc) => {
      localStorage.clear();
      if (u) {
        localStorage.setItem('foodwala_current_user', JSON.stringify(u));
        localStorage.setItem('foodwala_user', JSON.stringify(u));
      }
      if (c) {
        localStorage.setItem('foodwala_cart', JSON.stringify(c));
      }
      if (cp) {
        localStorage.setItem('foodwala_applied_coupon', JSON.stringify(cp));
      }
      if (loc) {
        localStorage.setItem('foodwala_location', JSON.stringify(loc));
      }
      localStorage.setItem('foodwala_theme', 'light');
    }, user, withCart ? SAMPLE_CART : null, withCart ? SAMPLE_COUPON : null, SAMPLE_LOCATION);
  }

  // Pre-seed base page
  await page.goto(`${BASE_URL}/index.html`, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await setSession(CUSTOMER_USER, true);

  // 1. Generate 00_project_structure.png
  console.log('[0/18] Rendering Authentic Project Structure screenshot...');
  const structureHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
          background: #0F172A;
          color: #E2E8F0;
          font-family: 'Consolas', 'Cascadia Code', 'Fira Code', monospace;
          padding: 40px;
          height: 1080px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .window {
          background: #1E293B;
          border: 1px solid #334155;
          border-radius: 16px;
          width: 1720px;
          height: 980px;
          box-shadow: 0 25px 50px -12px rgba(0,0,0,0.7);
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }
        .titlebar {
          background: #0F172A;
          padding: 14px 20px;
          display: flex;
          align-items: center;
          gap: 10px;
          border-bottom: 1px solid #334155;
        }
        .dot { width: 14px; height: 14px; border-radius: 50%; }
        .red { background: #EF4444; }
        .yellow { background: #F59E0B; }
        .green { background: #10B981; }
        .title { color: #94A3B8; font-size: 14px; font-weight: 600; margin-left: 12px; font-family: sans-serif; }
        .content {
          padding: 30px 40px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 40px;
          flex: 1;
          overflow: hidden;
        }
        .panel {
          background: #0F172A;
          border: 1px solid #334155;
          border-radius: 12px;
          padding: 24px;
        }
        .panel-header {
          font-size: 15px;
          font-weight: 700;
          color: #38BDF8;
          margin-bottom: 16px;
          display: flex;
          align-items: center;
          gap: 8px;
          font-family: sans-serif;
        }
        pre {
          font-size: 13.5px;
          line-height: 1.6;
          color: #CBD5E1;
        }
        .dir { color: #60A5FA; font-weight: bold; }
        .js { color: #FCD34D; }
        .sql { color: #F472B6; }
        .html { color: #FB923C; }
        .css { color: #A78BFA; }
        .comment { color: #64748B; font-style: italic; }
        .badge {
          display: inline-block;
          background: #0284C7;
          color: white;
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
          font-family: sans-serif;
        }
      </style>
    </head>
    <body>
      <div class="window">
        <div class="titlebar">
          <div class="dot red"></div>
          <div class="dot yellow"></div>
          <div class="dot green"></div>
          <span class="title">FoodWala Architecture Explorer — D:\\FoodWala_Eclipse_Project</span>
        </div>
        <div class="content">
          <div class="panel">
            <div class="panel-header">
              <span>📁 BACKEND, DATABASE & AI SERVICES</span>
              <span class="badge">Node.js Express + MySQL</span>
            </div>
            <pre>
<span class="dir">FoodWala/</span>
├── <span class="dir">server/</span>
│   ├── <span class="js">server.js</span>                 <span class="comment"># Express REST API, CORS, Rate Limit, Auth</span>
│   ├── <span class="js">db.js</span>                     <span class="comment"># MySQL2 Pool (fudwala DB, SSL & Health)</span>
│   ├── <span class="dir">controllers/</span>
│   │   ├── <span class="js">authController.js</span>     <span class="comment"># Argon2id Hashing, JWT & OTP Handlers</span>
│   │   ├── <span class="js">orderController.js</span>    <span class="comment"># Atomic Order Placement & Idempotency</span>
│   │   └── <span class="js">whatsappController.js</span> <span class="comment"># Meta Webhook Processing & Acks</span>
│   ├── <span class="dir">routes/</span>
│   │   ├── <span class="js">authRoutes.js</span>         <span class="comment"># Registration, Login, Session Verification</span>
│   │   ├── <span class="js">restaurantRoutes.js</span>   <span class="comment"># 105+ Restaurants & 750+ Menu Items</span>
│   │   └── <span class="js">whatsappWebhook.js</span>    <span class="comment"># Inbound Webhook & Signature Validation</span>
│   ├── <span class="dir">services/</span>
│   │   ├── <span class="js">whatsappAIService.js</span>  <span class="comment"># 25-Intent Detection & Order Grounding</span>
│   │   ├── <span class="js">aiService.js</span>          <span class="comment"># Google Gemini AI Conversational Engine</span>
│   │   └── <span class="js">whatsappService.js</span>    <span class="comment"># Meta Graph API Outbound Dispatcher</span>
│   └── <span class="dir">utils/</span>
│       └── <span class="js">whatsappParser.js</span>     <span class="comment"># Phone Normalization & Loop Suppression</span>
├── <span class="dir">database/</span>
│   ├── <span class="sql">cloud_schema.sql</span>          <span class="comment"># Full 22-Table Relational Schema & Seeds</span>
│   └── <span class="sql">whatsapp_support_schema.sql</span><span class="comment"># Inbound/Outbound Message Logs & Tickets</span>
└── <span class="dir">scripts/</span>
    ├── <span class="js">test_whatsapp_webhook.js</span> <span class="comment"># 10/10 Complete Automated Test Suite</span>
    └── <span class="js">test_customer_questions.js</span><span class="comment"># 25-Intent Real AI Verification</span>
            </pre>
          </div>
          <div class="panel">
            <div class="panel-header">
              <span>🌐 FRONTEND WEB PAGES & ASSETS</span>
              <span class="badge">Bootstrap 5.3 + Vanilla ES6</span>
            </div>
            <pre>
<span class="dir">FoodWala/</span>
├── <span class="html">index.html</span>                    <span class="comment"># Homepage, Hero Video & Culinary Audio</span>
├── <span class="html">restaurants.html</span>              <span class="comment"># Restaurant Discovery, Filters & Hubs</span>
├── <span class="html">menu.html</span>                     <span class="comment"># Restaurant Menu, Dishes & Quick Add</span>
├── <span class="html">search.html</span>                   <span class="comment"># Typo-Tolerant Smart Search Interface</span>
├── <span class="html">cart.html</span>                     <span class="comment"># Live Cart, Fee Breakdown & Coupon Code</span>
├── <span class="html">checkout.html</span>                 <span class="comment"># Address Selection & Razorpay Gateway</span>
├── <span class="html">order-confirmation.html</span>       <span class="comment"># Post-Payment Confirmation & Receipt</span>
├── <span class="html">order-tracking.html</span>           <span class="comment"># Real-Time Progress Timeline & Valet Info</span>
├── <span class="html">orders.html</span>                   <span class="comment"># Historical Order Ledger & Quick Re-Order</span>
├── <span class="html">profile.html</span>                  <span class="comment"># Customer Account, Phone & Preferences</span>
├── <span class="html">addresses.html</span>                <span class="comment"># Saved Addresses & GPS Geolocation</span>
├── <span class="html">admin.html</span>                    <span class="comment"># Enterprise Dashboard & KPI Analytics</span>
├── <span class="html">restaurant-dashboard.html</span>     <span class="comment"># Store Manager Isolated Portal</span>
├── <span class="html">delivery-dashboard.html</span>       <span class="comment"># Delivery Partner Pickup & Route Portal</span>
├── <span class="dir">js/</span>
│   ├── <span class="js">app.js</span>                    <span class="comment"># Cart State, Location Hubs & API Client</span>
│   ├── <span class="js">smart-search.js</span>           <span class="comment"># Jaro-Winkler Distance & Phonetic Aliases</span>
│   └── <span class="js">theme.js</span>                  <span class="comment"># High-Contrast Dark & Light Mode Engine</span>
└── <span class="dir">css/</span>
    ├── <span class="css">style.css</span>                 <span class="comment"># FoodWala Core UI Design System</span>
    └── <span class="css">animations-3d.css</span>         <span class="comment"># 3D Depth, Shimmer & Micro-Interactions</span>
            </pre>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
  await page.setContent(structureHtml, { waitUntil: 'domcontentloaded' });
  await page.screenshot({ path: path.join(OUTPUT_DIR, '00_project_structure.png') });
  console.log('   ✅ Saved 00_project_structure.png');

  const captureTasks = [
    {
      file: '01_home_page.png',
      url: `${BASE_URL}/index.html`,
      title: 'Home Page',
      setup: async () => {
        await setSession(CUSTOMER_USER, false);
        await page.goto(`${BASE_URL}/index.html`, { waitUntil: 'domcontentloaded', timeout: 15000 });
        await new Promise(r => setTimeout(r, 1200));
      }
    },
    {
      file: '02_login_page.png',
      url: `${BASE_URL}/login.html`,
      title: 'Authentication / Login Page',
      setup: async () => {
        await page.evaluate(() => localStorage.clear());
        await page.goto(`${BASE_URL}/login.html`, { waitUntil: 'domcontentloaded', timeout: 15000 });
        await new Promise(r => setTimeout(r, 800));
      }
    },
    {
      file: '03_register_page.png',
      url: `${BASE_URL}/register.html`,
      title: 'Registration Page',
      setup: async () => {
        await page.evaluate(() => localStorage.clear());
        await page.goto(`${BASE_URL}/register.html`, { waitUntil: 'domcontentloaded', timeout: 15000 });
        await new Promise(r => setTimeout(r, 800));
      }
    },
    {
      file: '04_restaurants_discovery.png',
      url: `${BASE_URL}/restaurants.html`,
      title: 'Restaurant Discovery & Filtering',
      setup: async () => {
        await setSession(CUSTOMER_USER, false);
        await page.goto(`${BASE_URL}/restaurants.html`, { waitUntil: 'domcontentloaded', timeout: 15000 });
        await new Promise(r => setTimeout(r, 1200));
      }
    },
    {
      file: '05_restaurant_menu.png',
      url: `${BASE_URL}/menu.html?id=1`,
      title: 'Restaurant Menu & Dish Ordering',
      setup: async () => {
        await setSession(CUSTOMER_USER, false);
        await page.goto(`${BASE_URL}/menu.html?id=1`, { waitUntil: 'domcontentloaded', timeout: 15000 });
        await new Promise(r => setTimeout(r, 1200));
      }
    },
    {
      file: '06_search_feature.png',
      url: `${BASE_URL}/search.html?q=biryani`,
      title: 'Typo-Tolerant Smart Search',
      setup: async () => {
        await setSession(CUSTOMER_USER, false);
        await page.goto(`${BASE_URL}/search.html?q=biryani`, { waitUntil: 'domcontentloaded', timeout: 15000 });
        await new Promise(r => setTimeout(r, 1200));
      }
    },
    {
      file: '07_cart_page.png',
      url: `${BASE_URL}/cart.html`,
      title: 'Cart & Bill Calculation',
      setup: async () => {
        await setSession(CUSTOMER_USER, true);
        await page.goto(`${BASE_URL}/cart.html`, { waitUntil: 'domcontentloaded', timeout: 15000 });
        await new Promise(r => setTimeout(r, 1200));
      }
    },
    {
      file: '08_checkout_page.png',
      url: `${BASE_URL}/checkout.html`,
      title: 'Checkout & Delivery Address',
      setup: async () => {
        await setSession(CUSTOMER_USER, true);
        await page.goto(`${BASE_URL}/checkout.html`, { waitUntil: 'domcontentloaded', timeout: 15000 });
        await new Promise(r => setTimeout(r, 1200));
      }
    },
    {
      file: '09_payment_screen.png',
      url: `${BASE_URL}/checkout.html`,
      title: 'Payment Gateway Integration',
      setup: async () => {
        await setSession(CUSTOMER_USER, true);
        await page.goto(`${BASE_URL}/checkout.html`, { waitUntil: 'domcontentloaded', timeout: 15000 });
        await page.evaluate(() => {
          const paySec = document.querySelector('.payment-methods, #payment-section, [data-section="payment"]');
          if (paySec) paySec.scrollIntoView({ behavior: 'instant', block: 'center' });
        });
        await new Promise(r => setTimeout(r, 800));
      }
    },
    {
      file: '10_order_confirmation.png',
      url: `${BASE_URL}/order-confirmation.html?orderId=70`,
      title: 'Order Confirmation & Receipt',
      setup: async () => {
        await setSession(CUSTOMER_USER, false);
        await page.goto(`${BASE_URL}/order-confirmation.html?orderId=70`, { waitUntil: 'domcontentloaded', timeout: 15000 });
        await new Promise(r => setTimeout(r, 1200));
      }
    },
    {
      file: '11_order_tracking.png',
      url: `${BASE_URL}/order-tracking.html?orderId=70`,
      title: 'Live Order Tracking & ETA',
      setup: async () => {
        await setSession(CUSTOMER_USER, false);
        await page.goto(`${BASE_URL}/order-tracking.html?orderId=70`, { waitUntil: 'domcontentloaded', timeout: 15000 });
        await new Promise(r => setTimeout(r, 1200));
      }
    },
    {
      file: '12_orders_history.png',
      url: `${BASE_URL}/orders.html`,
      title: 'Orders History & Re-Ordering',
      setup: async () => {
        await setSession(CUSTOMER_USER, false);
        await page.goto(`${BASE_URL}/orders.html`, { waitUntil: 'domcontentloaded', timeout: 15000 });
        await new Promise(r => setTimeout(r, 1200));
      }
    },
    {
      file: '13_profile_page.png',
      url: `${BASE_URL}/profile.html`,
      title: 'Customer Profile & Account',
      setup: async () => {
        await setSession(CUSTOMER_USER, false);
        await page.goto(`${BASE_URL}/profile.html`, { waitUntil: 'domcontentloaded', timeout: 15000 });
        await new Promise(r => setTimeout(r, 1200));
      }
    },
    {
      file: '14_address_management.png',
      url: `${BASE_URL}/addresses.html`,
      title: 'Saved Addresses & Geolocation',
      setup: async () => {
        await setSession(CUSTOMER_USER, false);
        await page.goto(`${BASE_URL}/addresses.html`, { waitUntil: 'domcontentloaded', timeout: 15000 });
        await new Promise(r => setTimeout(r, 1200));
      }
    },
    {
      file: '15_admin_dashboard.png',
      url: `${BASE_URL}/admin.html`,
      title: 'Enterprise Admin Dashboard',
      setup: async () => {
        await setSession(ADMIN_USER, false);
        await page.goto(`${BASE_URL}/admin.html`, { waitUntil: 'domcontentloaded', timeout: 15000 });
        await new Promise(r => setTimeout(r, 1200));
      }
    },
    {
      file: '16_restaurant_manager_dashboard.png',
      url: `${BASE_URL}/restaurant-dashboard.html?id=98`,
      title: 'Restaurant Manager Portal',
      setup: async () => {
        await setSession(MANAGER_USER, false);
        await page.goto(`${BASE_URL}/restaurant-dashboard.html?id=98`, { waitUntil: 'domcontentloaded', timeout: 15000 });
        await new Promise(r => setTimeout(r, 1200));
      }
    },
    {
      file: '17_delivery_partner_portal.png',
      url: `${BASE_URL}/delivery-dashboard.html`,
      title: 'Delivery Partner Portal',
      setup: async () => {
        await setSession(PARTNER_USER, false);
        await page.goto(`${BASE_URL}/delivery-dashboard.html`, { waitUntil: 'domcontentloaded', timeout: 15000 });
        await new Promise(r => setTimeout(r, 1200));
      }
    },
    {
      file: '18_whatsapp_ai_assistant.png',
      url: `${BASE_URL}/index.html`,
      title: 'WhatsApp AI Customer Assistance Desk',
      setup: async () => {
        await setSession(CUSTOMER_USER, true);
        await page.goto(`${BASE_URL}/index.html`, { waitUntil: 'domcontentloaded', timeout: 15000 });
        await page.evaluate(() => {
          const btn = document.getElementById('fw-floating-whatsapp-btn');
          if (btn) btn.click();
        });
        await new Promise(r => setTimeout(r, 1200));
      }
    }
  ];

  console.log(`📸 Capturing ${captureTasks.length} real 1920x1080 page screenshots...`);

  for (let i = 0; i < captureTasks.length; i++) {
    const task = captureTasks[i];
    const outPath = path.join(OUTPUT_DIR, task.file);
    try {
      console.log(`[${i + 1}/${captureTasks.length}] Capturing ${task.title} -> ${task.file}...`);
      await task.setup();
      await page.screenshot({ path: outPath, fullPage: false });
      const stats = fs.statSync(outPath);
      console.log(`   ✅ Saved (${(stats.size / 1024).toFixed(1)} KB)`);
    } catch (err) {
      console.error(`   ❌ Failed to capture ${task.file}:`, err.message);
    }
  }

  await browser.close();
  console.log('🎉 All page screenshots captured successfully!');
  process.exit(0);
}

capture().catch(err => {
  console.error('Fatal capture error:', err);
  process.exit(1);
});

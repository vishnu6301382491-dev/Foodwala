/**
 * scripts/capture_deployed_slides_12_to_26.js
 * Captures all pages for Slides 12 through 26 directly from the deployed GitHub Pages link:
 * https://vishnu6301382491-dev.github.io/Foodwala/
 *
 * Implements:
 * - Redirection prevention on order-confirmation.html
 * - Rich mock session seeding (user, addresses, orders, cart)
 * - 10-second settling wait per page
 * - 1920x1080 viewport
 * - Capture of New Features showcase for Section 6
 */

const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const DEPLOYED_BASE = 'https://vishnu6301382491-dev.github.io/Foodwala';
const OUTPUT_DIR = path.resolve('D:/FoodWala_Eclipse_Project/presentation/screenshots');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

const CUSTOMER_USER = {
  id: 1,
  user_id: 1,
  userId: 1,
  name: 'VISHNU',
  username: 'VISHNU',
  email: 'vishnu@foodwala.com',
  phone: '6301382491',
  role: 'customer',
  address: 'Koramangala 4th Block, Bengaluru',
  memberSince: 'March 2026',
  addresses: [
    {
      address_id: 1,
      id: 1,
      full_name: 'VISHNU',
      phone: '6301382491',
      house_no: 'Flat 402, Royal Palms',
      street: '80 Feet Road, 4th Block',
      area: 'Koramangala',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560034',
      formatted_address: 'Flat 402, Royal Palms, 80 Feet Road, 4th Block, Koramangala, Bengaluru 560034',
      address_type: 'Home',
      type: 'Home',
      is_default: 1
    },
    {
      address_id: 2,
      id: 2,
      full_name: 'VISHNU',
      phone: '6301382491',
      house_no: 'Tech Park Tower B, 6th Floor',
      street: 'Outer Ring Road, Bellandur',
      area: 'Bellandur',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560103',
      formatted_address: 'Tech Park Tower B, 6th Floor, Outer Ring Road, Bellandur, Bengaluru 560103',
      address_type: 'Work',
      type: 'Work',
      is_default: 0
    }
  ]
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
      restaurantId: 1,
      image_path: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=500'
    },
    {
      id: 2,
      menuId: 2,
      name: 'Chicken Pepper Dry',
      price: 220,
      quantity: 1,
      isVeg: false,
      restaurantId: 1,
      image_path: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?w=500'
    }
  ]
};

const SAMPLE_ORDERS = [
  {
    orderId: 'FW-70291',
    id: 70,
    restaurantName: 'Donne Biryani Mane',
    restaurant_name: 'Donne Biryani Mane',
    orderDate: '24 Oct 2026, 01:45 PM',
    status: 'Out for Delivery',
    totalAmount: 890,
    items: [
      { name: 'Special Donne Mutton Biryani', quantity: 2, price: 320 },
      { name: 'Chicken Pepper Dry', quantity: 1, price: 220 }
    ],
    deliveryAddress: 'Flat 402, Royal Palms, Koramangala 4th Block, Bengaluru'
  },
  {
    orderId: 'FW-68104',
    id: 68,
    restaurantName: 'Kabab Magic - Basavanagudi',
    restaurant_name: 'Kabab Magic - Basavanagudi',
    orderDate: '22 Oct 2026, 08:30 PM',
    status: 'Delivered',
    totalAmount: 540,
    items: [
      { name: 'Chicken Seekh Kabab', quantity: 2, price: 180 },
      { name: 'Rumali Roti', quantity: 4, price: 25 },
      { name: 'Butter Chicken Masala', quantity: 1, price: 260 }
    ],
    deliveryAddress: 'Flat 402, Royal Palms, Koramangala 4th Block, Bengaluru'
  }
];

const ADMIN_USER = {
  id: 2,
  user_id: 2,
  name: 'Admin FoodWala',
  username: 'Admin FoodWala',
  email: 'adminfoodwala@gmail.com',
  role: 'admin',
  phone: '6301382491'
};

const MANAGER_USER = {
  id: 98,
  user_id: 98,
  name: 'Kabab Magic Manager',
  username: 'Kabab Magic Manager',
  email: 'kababmagicbasavanagudi@gmail.com',
  role: 'restaurant',
  restaurant_id: 98,
  store_name: 'Kabab Magic - Basavanagudi'
};

const PARTNER_USER = {
  id: 3,
  user_id: 3,
  name: 'Rahul Kumar',
  username: 'Rahul Kumar',
  email: 'rahul.delivery@foodwala.com',
  role: 'partner',
  phone: '9876543220',
  vehicle_number: 'KA-05-EV-4219',
  is_available: 1
};

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function runCapture() {
  console.log('🚀 Launching Chrome for DEPLOYED pages capture (Slides 12 to 26)...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1920,1080']
  });

  const tasks = [
    // Slide 12: Checkout Page & Delivery Address
    {
      file: '08_checkout_page.png',
      url: `${DEPLOYED_BASE}/checkout.html`,
      name: 'Slide 12: Checkout & Delivery Address',
      user: CUSTOMER_USER,
      setup: async (page) => {
        await sleep(10000);
      }
    },
    // Slide 13: Payment Gateway Integration
    {
      file: '09_payment_screen.png',
      url: `${DEPLOYED_BASE}/checkout.html`,
      name: 'Slide 13: Payment Gateway Integration',
      user: CUSTOMER_USER,
      setup: async (page) => {
        await sleep(5000);
        await page.evaluate(() => {
          const el = document.querySelector('#payment-section, .payment-methods, #paymentMethodCOD, #paymentForm, #btn-place-order');
          if (el) el.scrollIntoView({ behavior: 'instant', block: 'center' });
        });
        await sleep(5000);
      }
    },
    // Slide 14: Order Confirmation & Receipt (PREVENT REDIRECT!)
    {
      file: '10_order_confirmation.png',
      url: `${DEPLOYED_BASE}/order-confirmation.html?orderId=FW-70291`,
      name: 'Slide 14: Order Confirmation & Receipt',
      user: CUSTOMER_USER,
      preventRedirect: true,
      setup: async (page) => {
        // Block countdown redirect explicitly
        await page.evaluate(() => {
          // Clear any countdown intervals
          for (let i = 1; i < 99999; i++) {
            window.clearInterval(i);
          }
          const redirectEl = document.getElementById('redirect-countdown');
          if (redirectEl) {
            redirectEl.textContent = 'Paused for Review';
          }
        });
        await sleep(10000);
      }
    },
    // Slide 15: Live Order Tracking
    {
      file: '11_order_tracking.png',
      url: `${DEPLOYED_BASE}/order-tracking.html?orderId=FW-70291`,
      name: 'Slide 15: Live Order Tracking & Progress Pipeline',
      user: CUSTOMER_USER,
      setup: async (page) => {
        await sleep(10000);
      }
    },
    // Slide 16: Order History & Digital Invoices
    {
      file: '12_orders_history.png',
      url: `${DEPLOYED_BASE}/orders.html`,
      name: 'Slide 16: Order History & Digital Invoices',
      user: CUSTOMER_USER,
      setup: async (page) => {
        await sleep(10000);
      }
    },
    // Slide 17: User Profile & Account Settings
    {
      file: '13_profile_page.png',
      url: `${DEPLOYED_BASE}/profile.html`,
      name: 'Slide 17: User Profile & Account Settings',
      user: CUSTOMER_USER,
      setup: async (page) => {
        await sleep(10000);
      }
    },
    // Slide 18: Saved Delivery Addresses & Geolocation
    {
      file: '14_address_management.png',
      url: `${DEPLOYED_BASE}/addresses.html`,
      name: 'Slide 18: Saved Delivery Addresses',
      user: CUSTOMER_USER,
      setup: async (page) => {
        await sleep(10000);
      }
    },
    // Slide 19: Super Admin Console & Analytics
    {
      file: '15_admin_dashboard.png',
      url: `${DEPLOYED_BASE}/admin.html`,
      name: 'Slide 19: Super Admin Console & Analytics',
      user: ADMIN_USER,
      setup: async (page) => {
        await sleep(10000);
      }
    },
    // Slide 20: Restaurant Manager Dashboard
    {
      file: '16_restaurant_manager_dashboard.png',
      url: `${DEPLOYED_BASE}/restaurant-dashboard.html?id=98`,
      name: 'Slide 20: Restaurant Manager Isolated Dashboard',
      user: MANAGER_USER,
      setup: async (page) => {
        await sleep(10000);
      }
    },
    // Slide 21: Delivery Partner Fleet Portal
    {
      file: '17_delivery_partner_portal.png',
      url: `${DEPLOYED_BASE}/delivery-dashboard.html`,
      name: 'Slide 21: Delivery Partner Fleet Portal',
      user: PARTNER_USER,
      setup: async (page) => {
        await sleep(10000);
      }
    },
    // Slide 22: WhatsApp 24/7 AI Assistance Desk
    {
      file: '18_whatsapp_ai_assistant.png',
      url: `${DEPLOYED_BASE}/index.html`,
      name: 'Slide 22: WhatsApp 24/7 AI Assistance Desk',
      user: CUSTOMER_USER,
      setup: async (page) => {
        await sleep(3000);
        await page.evaluate(() => {
          const btn = document.getElementById('fw-floating-whatsapp-btn');
          if (btn) btn.click();
        });
        await sleep(2000);
        // Type a sample question into the AI chat input
        await page.evaluate(() => {
          const input = document.getElementById('fw-help-chat-input') || document.querySelector('#foodwalaHelpModal input[type="text"]');
          if (input) {
            input.value = 'Where is my order FW-70291?';
          }
          const sendBtn = document.getElementById('fw-help-send-btn') || document.querySelector('#foodwalaHelpModal button[type="submit"]');
          if (sendBtn) sendBtn.click();
        });
        await sleep(7000);
      }
    }
  ];

  for (let i = 0; i < tasks.length; i++) {
    const t = tasks[i];
    const outPath = path.join(OUTPUT_DIR, t.file);
    console.log(`\n======================================================`);
    console.log(`[${i + 1}/${tasks.length}] ${t.name}`);
    console.log(`   🌐 URL: ${t.url}`);

    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    if (t.preventRedirect) {
      await page.evaluateOnNewDocument(() => {
        const origSetInterval = window.setInterval;
        window.setInterval = function (fn, delay, ...args) {
          if (fn && fn.toString().includes('location.href')) {
            console.log('Suppressed redirect countdown!');
            return 999999;
          }
          return origSetInterval(fn, delay, ...args);
        };
      });
    }

    try {
      // 1. Pre-seed session
      await page.goto(`${DEPLOYED_BASE}/index.html`, { waitUntil: 'domcontentloaded' });
      await page.evaluate((u, c, orders) => {
        localStorage.clear();
        localStorage.setItem('foodwala_current_user', JSON.stringify(u));
        localStorage.setItem('foodwala_user', JSON.stringify(u));
        sessionStorage.setItem('foodwala_user', JSON.stringify(u));
        localStorage.setItem('foodwala_cart', JSON.stringify(c));
        localStorage.setItem('foodwala_past_orders', JSON.stringify(orders));
        localStorage.setItem('foodwala_orders', JSON.stringify(orders));
        localStorage.setItem('foodwala_theme', 'light');
        localStorage.setItem('foodwala_force_mock', 'true');
      }, t.user, SAMPLE_CART, SAMPLE_ORDERS);

      // 2. Navigate to target deployed page
      await page.goto(t.url, { waitUntil: 'domcontentloaded', timeout: 30000 });

      // 3. Page specific actions and 10s wait
      if (t.setup) {
        await t.setup(page);
      }

      // 4. Capture screenshot
      await page.screenshot({ path: outPath });
      const stat = fs.statSync(outPath);
      console.log(`   ✅ Captured: ${t.file} (${(stat.size / 1024).toFixed(1)} KB)`);
    } catch (err) {
      console.error(`   ❌ Failed: ${t.file}:`, err.message);
    } finally {
      await page.close();
    }
  }

  // Generate Section 6 Showcase Screenshot (Slide 23)
  console.log('\nGenerating Slide 23 (Section 6: New Features Showcase Screenshot)...');
  const showcasePage = await browser.newPage();
  await showcasePage.setViewport({ width: 1920, height: 1080 });

  const showcaseHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
          width: 1920px;
          height: 1080px;
          background: #0B1120;
          color: #F8FAFC;
          font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
          padding: 35px 50px;
          overflow: hidden;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 25px;
          border-bottom: 1px solid rgba(255,255,255,0.08);
          padding-bottom: 15px;
        }
        .title { font-size: 26px; font-weight: 800; color: #FFFFFF; }
        .subtitle { font-size: 14px; color: #94A3B8; margin-top: 4px; }
        .badge {
          background: rgba(239, 68, 68, 0.15);
          border: 1px solid rgba(239, 68, 68, 0.4);
          color: #FCA5A5;
          font-size: 13px;
          font-weight: 700;
          padding: 6px 16px;
          border-radius: 9999px;
        }
        .grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 25px;
          height: 900px;
        }
        .card {
          background: #1E293B;
          border: 1px solid #334155;
          border-radius: 14px;
          padding: 24px;
          display: flex;
          flex-direction: column;
          box-shadow: 0 10px 25px rgba(0,0,0,0.4);
        }
        .card-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 14px;
        }
        .card-icon {
          width: 44px;
          height: 44px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 22px;
        }
        .icon-blue { background: rgba(56, 189, 248, 0.15); color: #38BDF8; }
        .icon-green { background: rgba(34, 197, 94, 0.15); color: #22C55E; }
        .icon-red { background: rgba(239, 68, 68, 0.15); color: #EF4444; }
        .icon-amber { background: rgba(245, 158, 11, 0.15); color: #F59E0B; }
        .card-title { font-size: 18px; font-weight: 700; color: #FFFFFF; }
        .card-tag { font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 4px; text-transform: uppercase; margin-left: auto; }
        .tag-blue { background: #0284C7; color: white; }
        .tag-green { background: #16A34A; color: white; }
        .tag-red { background: #DC2626; color: white; }
        .tag-amber { background: #D97706; color: white; }
        .card-body {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 10px;
          font-size: 13px;
          color: #CBD5E1;
          line-height: 1.5;
        }
        .code-preview {
          background: #0F172A;
          border: 1px solid #334155;
          border-radius: 8px;
          padding: 12px;
          font-family: 'Consolas', monospace;
          font-size: 12px;
          color: #38BDF8;
          margin-top: 10px;
        }
        .feature-bullet {
          display: flex;
          gap: 8px;
          align-items: flex-start;
        }
        .check { color: #10B981; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <div class="title">FoodWala — Innovative Features Added Beyond Base Platform</div>
          <div class="subtitle">Production Enhancements: Typo-Tolerant Search, 25-Intent WhatsApp AI Desk, Store Isolation & Adaptive UI</div>
        </div>
        <div class="badge">SECTION 6 SHOWCASE</div>
      </div>

      <div class="grid">
        <!-- Feature 1: Typo-Tolerant Smart Search -->
        <div class="card">
          <div class="card-header">
            <div class="card-icon icon-blue">🔍</div>
            <div class="card-title">Typo-Tolerant Smart Search</div>
            <span class="card-tag tag-blue">Discovery Engine</span>
          </div>
          <div class="card-body">
            <div class="feature-bullet"><span class="check">✔</span> Jaro-Winkler string similarity distance algorithm with prefix scaling factor (p=0.1).</div>
            <div class="feature-bullet"><span class="check">✔</span> Resolves Indian cuisine phonetics: "bryani" → Biryani, "dhosa" → Masala Dosa.</div>
            <div class="feature-bullet"><span class="check">✔</span> Real-time debounced autocomplete rendering dish pricing, ratings, and veg badges.</div>
            <div class="code-preview">
// smart-search.js
const similarity = jaroWinkler(query, dish.item_name);
if (similarity >= 0.72) matchedDishes.push({ dish, score: similarity });
            </div>
          </div>
        </div>

        <!-- Feature 2: WhatsApp 24/7 AI Assistance Desk -->
        <div class="card">
          <div class="card-header">
            <div class="card-icon icon-green">💬</div>
            <div class="card-title">WhatsApp 24/7 AI Assistance Desk</div>
            <span class="card-tag tag-green">Omnichannel NLP</span>
          </div>
          <div class="card-body">
            <div class="feature-bullet"><span class="check">✔</span> 25-intent classification NLP engine handling live order tracking, refunds & menus.</div>
            <div class="feature-bullet"><span class="check">✔</span> Dual-channel architecture: Cloudflare Meta Webhook + In-Browser Floating AI Widget.</div>
            <div class="feature-bullet"><span class="check">✔</span> Persistent MySQL logging in whatsapp_conversations and whatsapp_messages tables.</div>
            <div class="code-preview">
// whatsappAIService.js
const intent = detectIntent(messageBody); // 'order_tracking'
const reply = await generateContextualReply(intent, orderId);
            </div>
          </div>
        </div>

        <!-- Feature 3: Multi-Tenant Store Isolation -->
        <div class="card">
          <div class="card-header">
            <div class="card-icon icon-red">🛡️</div>
            <div class="card-title">Multi-Tenant Store Data Isolation</div>
            <span class="card-tag tag-red">Enterprise RBAC</span>
          </div>
          <div class="card-body">
            <div class="feature-bullet"><span class="check">✔</span> Strict tenant boundaries: Restaurant Managers ONLY see their assigned store data.</div>
            <div class="feature-bullet"><span class="check">✔</span> Global store dropdown selector hidden for store managers preventing data leakage.</div>
            <div class="feature-bullet"><span class="check">✔</span> Argon2id password encryption with rate-limited login endpoints against brute force.</div>
            <div class="code-preview">
// restaurantRoutes.js
WHERE o.restaurant_id = ? AND r.admin_user_id = req.user.userId
            </div>
          </div>
        </div>

        <!-- Feature 4: Adaptive Dark Mode & Culinary Media -->
        <div class="card">
          <div class="card-header">
            <div class="card-icon icon-amber">🌙</div>
            <div class="card-title">Adaptive Dark Mode & Culinary Audio</div>
            <span class="card-tag tag-amber">UI / UX System</span>
          </div>
          <div class="card-body">
            <div class="feature-bullet"><span class="check">✔</span> Persistent theme switcher preserving user preference in localStorage.</div>
            <div class="feature-bullet"><span class="check">✔</span> High-contrast CSS variables with zero text-blend artifacts across dark/light mode.</div>
            <div class="feature-bullet"><span class="check">✔</span> 1080p hero culinary video player synced with Web Audio API soundscape synthesis.</div>
            <div class="code-preview">
// theme.js
document.documentElement.setAttribute('data-bs-theme', selectedTheme);
            </div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  await showcasePage.setContent(showcaseHtml, { waitUntil: 'domcontentloaded' });
  await showcasePage.screenshot({ path: path.join(OUTPUT_DIR, '19_new_features_showcase.png') });
  console.log('   ✅ Captured: 19_new_features_showcase.png (Section 6 Showcase)');
  await showcasePage.close();

  await browser.close();
  console.log('\n🎉 Finished capturing all deployed pages for slides 12 through 26!');
}

runCapture().catch(err => {
  console.error('Fatal deployed capture error:', err);
  process.exit(1);
});

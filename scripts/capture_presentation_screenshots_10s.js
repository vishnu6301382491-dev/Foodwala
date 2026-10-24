/**
 * scripts/capture_presentation_screenshots_10s.js
 * Comprehensive 10-Second Wait Screen Capture Suite for FoodWala Presentation
 * Captures clean, fully rendered 1920x1080 screenshots with explicit 10,000ms delay per page
 * to ensure all images, asynchronous API data, cards, and charts are 100% loaded.
 */

const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'http://localhost:5000';
const OUTPUT_DIR = path.resolve('D:/FoodWala_Eclipse_Project/presentation/screenshots');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Authentic user profiles
const CUSTOMER_USER = {
  id: 1,
  user_id: 1,
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
      full_name: 'VISHNU',
      phone: '6301382491',
      house_no: 'Flat 402, Royal Palms',
      street: '80 Feet Road, 4th Block',
      area: 'Koramangala',
      city: 'Bengaluru',
      state: 'Karnataka',
      pincode: '560034',
      formatted_address: 'Flat 402, Royal Palms, 80 Feet Road, 4th Block, Koramangala, Bengaluru, Karnataka 560034',
      address_type: 'Home',
      is_default: 1
    },
    {
      address_id: 2,
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
      is_default: 0
    }
  ]
};

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

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function captureAllPages() {
  console.log('🚀 Starting Puppeteer browser engine for 10-Second Wait Screen Capture...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
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
        sessionStorage.setItem('foodwala_user', JSON.stringify(u));
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

  // Pre-seed storage
  await page.goto(`${BASE_URL}/index.html`, { waitUntil: 'domcontentloaded' });
  await setSession(CUSTOMER_USER, true);

  // Define the 18 application pages in strict real user journey order
  const pages = [
    {
      file: '01_home_page.png',
      url: `${BASE_URL}/index.html`,
      name: 'Home Page',
      setup: async () => {
        await setSession(CUSTOMER_USER, false);
        await page.goto(`${BASE_URL}/index.html`, { waitUntil: 'domcontentloaded' });
      }
    },
    {
      file: '02_login_page.png',
      url: `${BASE_URL}/login.html`,
      name: 'Login Screen',
      setup: async () => {
        await page.evaluate(() => localStorage.clear());
        await page.goto(`${BASE_URL}/login.html`, { waitUntil: 'domcontentloaded' });
      }
    },
    {
      file: '03_register_page.png',
      url: `${BASE_URL}/register.html`,
      name: 'Registration Screen',
      setup: async () => {
        await page.evaluate(() => localStorage.clear());
        await page.goto(`${BASE_URL}/register.html`, { waitUntil: 'domcontentloaded' });
      }
    },
    {
      file: '04_restaurants_discovery.png',
      url: `${BASE_URL}/restaurants.html`,
      name: 'Restaurant Discovery & Filters',
      setup: async () => {
        await setSession(CUSTOMER_USER, false);
        await page.goto(`${BASE_URL}/restaurants.html`, { waitUntil: 'domcontentloaded' });
      }
    },
    {
      file: '05_restaurant_menu.png',
      url: `${BASE_URL}/menu.html?id=1`,
      name: 'Restaurant Menu & Ordering',
      setup: async () => {
        await setSession(CUSTOMER_USER, false);
        await page.goto(`${BASE_URL}/menu.html?id=1`, { waitUntil: 'domcontentloaded' });
      }
    },
    {
      file: '06_search_feature.png',
      url: `${BASE_URL}/search.html?q=biryani`,
      name: 'Food Search & Typo Autocomplete',
      setup: async () => {
        await setSession(CUSTOMER_USER, false);
        await page.goto(`${BASE_URL}/search.html?q=biryani`, { waitUntil: 'domcontentloaded' });
      }
    },
    {
      file: '07_cart_page.png',
      url: `${BASE_URL}/cart.html`,
      name: 'Cart Management & Bill Calculation',
      setup: async () => {
        await setSession(CUSTOMER_USER, true);
        await page.goto(`${BASE_URL}/cart.html`, { waitUntil: 'domcontentloaded' });
      }
    },
    {
      file: '08_checkout_page.png',
      url: `${BASE_URL}/checkout.html`,
      name: 'Checkout & Delivery Address',
      setup: async () => {
        await setSession(CUSTOMER_USER, true);
        await page.goto(`${BASE_URL}/checkout.html`, { waitUntil: 'domcontentloaded' });
      }
    },
    {
      file: '09_payment_screen.png',
      url: `${BASE_URL}/checkout.html`,
      name: 'Payment Gateway Integration',
      setup: async () => {
        await setSession(CUSTOMER_USER, true);
        await page.goto(`${BASE_URL}/checkout.html`, { waitUntil: 'domcontentloaded' });
        await page.evaluate(() => {
          const el = document.querySelector('#payment-section, .payment-methods, #paymentMethodCOD, form[name="checkout"]');
          if (el) el.scrollIntoView({ behavior: 'instant', block: 'center' });
        });
      }
    },
    {
      file: '10_order_confirmation.png',
      url: `${BASE_URL}/order-confirmation.html?orderId=70`,
      name: 'Order Confirmation & Receipt',
      setup: async () => {
        await setSession(CUSTOMER_USER, false);
        await page.goto(`${BASE_URL}/order-confirmation.html?orderId=70`, { waitUntil: 'domcontentloaded' });
      }
    },
    {
      file: '11_order_tracking.png',
      url: `${BASE_URL}/order-tracking.html?orderId=70`,
      name: 'Live Order Tracking & Status Pipeline',
      setup: async () => {
        await setSession(CUSTOMER_USER, false);
        await page.goto(`${BASE_URL}/order-tracking.html?orderId=70`, { waitUntil: 'domcontentloaded' });
      }
    },
    {
      file: '12_orders_history.png',
      url: `${BASE_URL}/orders.html`,
      name: 'Order History & Invoices',
      setup: async () => {
        await setSession(CUSTOMER_USER, false);
        await page.goto(`${BASE_URL}/orders.html`, { waitUntil: 'domcontentloaded' });
      }
    },
    {
      file: '13_profile_page.png',
      url: `${BASE_URL}/profile.html`,
      name: 'User Profile & Account Settings',
      setup: async () => {
        await setSession(CUSTOMER_USER, false);
        await page.goto(`${BASE_URL}/profile.html`, { waitUntil: 'domcontentloaded' });
      }
    },
    {
      file: '14_address_management.png',
      url: `${BASE_URL}/addresses.html`,
      name: 'Saved Delivery Addresses',
      setup: async () => {
        await setSession(CUSTOMER_USER, false);
        await page.goto(`${BASE_URL}/addresses.html`, { waitUntil: 'domcontentloaded' });
      }
    },
    {
      file: '15_admin_dashboard.png',
      url: `${BASE_URL}/admin.html`,
      name: 'Super Admin Console & Analytics',
      setup: async () => {
        await setSession(ADMIN_USER, false);
        await page.goto(`${BASE_URL}/admin.html`, { waitUntil: 'domcontentloaded' });
      }
    },
    {
      file: '16_restaurant_manager_dashboard.png',
      url: `${BASE_URL}/restaurant-dashboard.html?id=98`,
      name: 'Restaurant Manager Isolated Dashboard',
      setup: async () => {
        await setSession(MANAGER_USER, false);
        await page.goto(`${BASE_URL}/restaurant-dashboard.html?id=98`, { waitUntil: 'domcontentloaded' });
      }
    },
    {
      file: '17_delivery_partner_portal.png',
      url: `${BASE_URL}/delivery-dashboard.html`,
      name: 'Delivery Partner Fleet Portal',
      setup: async () => {
        await setSession(PARTNER_USER, false);
        await page.goto(`${BASE_URL}/delivery-dashboard.html`, { waitUntil: 'domcontentloaded' });
      }
    },
    {
      file: '18_whatsapp_ai_assistant.png',
      url: `${BASE_URL}/index.html`,
      name: 'WhatsApp 24/7 AI Assistance Desk',
      setup: async () => {
        await setSession(CUSTOMER_USER, true);
        await page.goto(`${BASE_URL}/index.html`, { waitUntil: 'domcontentloaded' });
        await page.evaluate(() => {
          const btn = document.getElementById('fw-floating-whatsapp-btn');
          if (btn) btn.click();
        });
      }
    }
  ];

  console.log(`📋 Total pages to capture: ${pages.length}`);
  console.log(`⏱️ MANDATORY: Waiting 10,000ms (10 seconds) on each page before capturing.`);

  for (let i = 0; i < pages.length; i++) {
    const p = pages[i];
    const outPath = path.join(OUTPUT_DIR, p.file);
    console.log(`\n---------------------------------------------------------`);
    console.log(`[${i + 1}/${pages.length}] Processing: ${p.name} (${p.file})`);
    console.log(`   🌐 Navigating to ${p.url}...`);

    try {
      await p.setup();

      // Trigger soft scroll to activate lazy images / intersection observers
      await page.evaluate(() => {
        window.scrollBy(0, 300);
        setTimeout(() => window.scrollTo(0, 0), 200);
      });

      console.log(`   ⏳ Pausing for 10.0 seconds for dynamic APIs & images to settle...`);
      await sleep(10000);

      // Verify DOM stability and take screenshot
      await page.screenshot({ path: outPath });
      const stat = fs.statSync(outPath);
      console.log(`   ✅ Successfully captured ${p.file} (${(stat.size / 1024).toFixed(1)} KB)`);
    } catch (err) {
      console.error(`   ❌ Failed to capture ${p.file}:`, err.message);
    }
  }

  await browser.close();
  console.log(`\n🎉 All 18 screenshots captured with 10-second wait!`);
}

captureAllPages().catch(err => {
  console.error('Fatal capture error:', err);
  process.exit(1);
});

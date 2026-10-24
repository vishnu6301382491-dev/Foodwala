/**
 * scripts/capture_remaining_10s.js
 * Captures pages 13-18 with 10-second wait using isolated page sessions.
 */

const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'http://localhost:5000';
const OUTPUT_DIR = path.resolve('D:/FoodWala_Eclipse_Project/presentation/screenshots');

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

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function captureRemaining() {
  console.log('🚀 Launching fresh Chrome instance for remaining pages (13 to 18)...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1920,1080']
  });

  const remaining = [
    {
      file: '13_profile_page.png',
      url: `${BASE_URL}/profile.html`,
      name: 'User Profile & Account Settings',
      user: CUSTOMER_USER,
      action: null
    },
    {
      file: '14_address_management.png',
      url: `${BASE_URL}/addresses.html`,
      name: 'Saved Delivery Addresses',
      user: CUSTOMER_USER,
      action: null
    },
    {
      file: '15_admin_dashboard.png',
      url: `${BASE_URL}/admin.html`,
      name: 'Super Admin Console & Analytics',
      user: ADMIN_USER,
      action: null
    },
    {
      file: '16_restaurant_manager_dashboard.png',
      url: `${BASE_URL}/restaurant-dashboard.html?id=98`,
      name: 'Restaurant Manager Isolated Dashboard',
      user: MANAGER_USER,
      action: null
    },
    {
      file: '17_delivery_partner_portal.png',
      url: `${BASE_URL}/delivery-dashboard.html`,
      name: 'Delivery Partner Fleet Portal',
      user: PARTNER_USER,
      action: null
    },
    {
      file: '18_whatsapp_ai_assistant.png',
      url: `${BASE_URL}/index.html`,
      name: 'WhatsApp 24/7 AI Assistance Desk',
      user: CUSTOMER_USER,
      action: async (page) => {
        await page.evaluate(() => {
          const btn = document.getElementById('fw-floating-whatsapp-btn');
          if (btn) btn.click();
        });
        await sleep(1000);
      }
    }
  ];

  for (let i = 0; i < remaining.length; i++) {
    const item = remaining[i];
    const outPath = path.join(OUTPUT_DIR, item.file);
    console.log(`\n[${i + 1}/${remaining.length}] Capturing: ${item.name} (${item.file})`);

    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    try {
      // Seed user session
      await page.goto(`${BASE_URL}/index.html`, { waitUntil: 'domcontentloaded' });
      await page.evaluate((u) => {
        localStorage.clear();
        localStorage.setItem('foodwala_current_user', JSON.stringify(u));
        localStorage.setItem('foodwala_user', JSON.stringify(u));
        sessionStorage.setItem('foodwala_user', JSON.stringify(u));
        localStorage.setItem('foodwala_theme', 'light');
      }, item.user);

      // Navigate to target page
      console.log(`   🌐 Navigating to ${item.url}...`);
      await page.goto(item.url, { waitUntil: 'domcontentloaded' });

      if (item.action) {
        await item.action(page);
      }

      console.log(`   ⏳ Pausing for 10.0 seconds for dynamic APIs & images to settle...`);
      await sleep(10000);

      await page.screenshot({ path: outPath });
      const stat = fs.statSync(outPath);
      console.log(`   ✅ Successfully captured ${item.file} (${(stat.size / 1024).toFixed(1)} KB)`);
    } catch (err) {
      console.error(`   ❌ Failed to capture ${item.file}:`, err.message);
    } finally {
      await page.close();
    }
  }

  await browser.close();
  console.log('\n🎉 Finished capturing remaining pages with 10s wait!');
}

captureRemaining().catch(err => {
  console.error(err);
  process.exit(1);
});

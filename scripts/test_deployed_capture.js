const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const DEPLOYED_BASE = 'https://vishnu6301382491-dev.github.io/Foodwala';

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

async function testOrderConfirmation() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--window-size=1920,1080']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  // Prevent countdown redirection on order-confirmation.html
  await page.evaluateOnNewDocument(() => {
    // Intercept setInterval to block automatic redirect
    const originalSetInterval = window.setInterval;
    window.setInterval = function (fn, delay, ...args) {
      if (fn && fn.toString().includes('location.href')) {
        console.log('Blocked redirection countdown!');
        return 999999;
      }
      return originalSetInterval(fn, delay, ...args);
    };
  });

  // Seed storage
  await page.goto(`${DEPLOYED_BASE}/index.html`, { waitUntil: 'domcontentloaded' });
  await page.evaluate((u, c) => {
    localStorage.setItem('foodwala_current_user', JSON.stringify(u));
    localStorage.setItem('foodwala_user', JSON.stringify(u));
    localStorage.setItem('foodwala_cart', JSON.stringify(c));
    localStorage.setItem('foodwala_theme', 'light');
    localStorage.setItem('foodwala_force_mock', 'true');
  }, CUSTOMER_USER, SAMPLE_CART);

  console.log('Testing deployed order-confirmation.html...');
  await page.goto(`${DEPLOYED_BASE}/order-confirmation.html?orderId=FW-70291`, { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 4000));

  const url = page.url();
  console.log('Current URL after 4 seconds:', url);
  console.log('Title:', await page.title());

  await page.screenshot({ path: path.resolve('D:/FoodWala_Eclipse_Project/presentation/screenshots/test_order_conf.png') });
  console.log('Screenshot saved to test_order_conf.png');

  await browser.close();
}

testOrderConfirmation().catch(err => console.error(err));

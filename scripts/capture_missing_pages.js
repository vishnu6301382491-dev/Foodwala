const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'http://localhost:5000';
const OUTPUT_DIR = path.join(__dirname, '../presentation/screenshots');

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
    }
  ]
};

async function run() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--window-size=1920,1080']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  // 1. Profile Page
  console.log('Capturing 13_profile_page.png...');
  await page.goto(`${BASE_URL}/index.html`, { waitUntil: 'domcontentloaded' });
  await page.evaluate((u) => {
    localStorage.setItem('foodwala_current_user', JSON.stringify(u));
    localStorage.setItem('foodwala_user', JSON.stringify(u));
  }, CUSTOMER_USER);

  await page.goto(`${BASE_URL}/profile.html`, { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 1200));
  await page.screenshot({ path: path.join(OUTPUT_DIR, '13_profile_page.png') });
  console.log('✅ 13_profile_page.png captured.');

  // 2. Addresses Page
  console.log('Capturing 14_address_management.png...');
  await page.goto(`${BASE_URL}/addresses.html`, { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 1200));
  await page.screenshot({ path: path.join(OUTPUT_DIR, '14_address_management.png') });
  console.log('✅ 14_address_management.png captured.');

  await browser.close();
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});

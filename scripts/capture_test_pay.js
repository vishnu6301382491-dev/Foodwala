const http = require('http');
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');

const ROOT = path.resolve('D:/FoodWala_Eclipse_Project');
const PORT = 5005;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml'
};

const server = http.createServer((req, res) => {
  let reqPath = decodeURI(req.url.split('?')[0]);
  if (reqPath === '/' || reqPath === '') reqPath = '/index.html';
  const filePath = path.join(ROOT, reqPath);
  if (!fs.existsSync(filePath)) {
    res.writeHead(404);
    res.end('Not found');
    return;
  }
  const ext = path.extname(filePath).toLowerCase();
  res.writeHead(200, {
    'Content-Type': MIME[ext] || 'application/octet-stream',
    'Access-Control-Allow-Origin': '*'
  });
  fs.createReadStream(filePath).pipe(res);
});

server.listen(PORT, async () => {
  console.log('Static server listening on port', PORT);
  let browser;
  try {
    browser = await puppeteer.launch({
      executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1920,1080']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });

    const CUSTOMER_USER = {
      id: 1,
      user_id: 1,
      name: 'VISHNU',
      username: 'VISHNU',
      email: 'vishnu@foodwala.com',
      phone: '6301382491',
      role: 'customer',
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

    const SAMPLE_COUPON = { code: 'FOODWALA50', discountPercent: 50, maxDiscount: 150, minOrder: 100 };
    const SAMPLE_LOCATION = { id: 'koramangala', name: 'Koramangala, Bengaluru', shortName: 'Koramangala', lat: 12.9352, lng: 77.6245 };

    await page.goto(`http://localhost:${PORT}/index.html`, { waitUntil: 'domcontentloaded' });
    await page.evaluate((u, c, cp, loc) => {
      localStorage.clear();
      localStorage.setItem('foodwala_current_user', JSON.stringify(u));
      localStorage.setItem('foodwala_user', JSON.stringify(u));
      sessionStorage.setItem('foodwala_user', JSON.stringify(u));
      localStorage.setItem('foodwala_cart', JSON.stringify(c));
      localStorage.setItem('foodwala_applied_coupon', JSON.stringify(cp));
      localStorage.setItem('foodwala_location', JSON.stringify(loc));
      localStorage.setItem('foodwala_theme', 'light');
    }, CUSTOMER_USER, SAMPLE_CART, SAMPLE_COUPON, SAMPLE_LOCATION);

    await page.goto(`http://localhost:${PORT}/checkout.html`, { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 2000));

    // Fill in receipt email so place order passes validation
    await page.evaluate(() => {
      const emailInp = document.getElementById('receipt-email');
      if (emailInp) emailInp.value = 'vishnu@foodwala.com';
      const nameInp = document.getElementById('receipt-name');
      if (nameInp) nameInp.value = 'VISHNU';
    });

    // 1. Capture Scrolled View focusing on Payment Method
    await page.evaluate(() => {
      const payCard = document.querySelector('.checkout-card-payment');
      if (payCard) {
        payCard.scrollIntoView({ behavior: 'instant', block: 'center' });
      }
    });
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: path.join(ROOT, 'presentation/screenshots/test_pay_scrolled.png') });
    console.log('✅ Captured test_pay_scrolled.png');

    // 2. Click "Proceed to Pay" button to open Razorpay Modal
    try {
      console.log('Clicking Proceed to Pay button to trigger Razorpay modal...');
      await page.evaluate(() => {
        const btn = document.querySelector('.checkout-card-summary button');
        if (btn) btn.click();
      });

      // Wait 10 seconds for Razorpay modal iframe to fully render
      console.log('Waiting 10 seconds for Razorpay modal iframe...');
      await new Promise(r => setTimeout(r, 10000));

      await page.screenshot({ path: path.join(ROOT, 'presentation/screenshots/test_pay_modal.png') });
      console.log('✅ Captured test_pay_modal.png');
    } catch (e) {
      console.log('Modal trigger error:', e.message);
    }

  } catch (err) {
    console.error('Fatal error:', err);
  } finally {
    if (browser) await browser.close();
    server.close();
    console.log('Server closed. Done.');
    process.exit(0);
  }
});

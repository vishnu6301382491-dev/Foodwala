const http = require('http');
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');

const ROOT = path.resolve('D:/FoodWala_Eclipse_Project');
const PORT = 5008;

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
      role: 'customer'
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

    const SAMPLE_LOCATION = { id: 'koramangala', name: 'Koramangala, Bengaluru', shortName: 'Koramangala', lat: 12.9352, lng: 77.6245 };

    await page.goto(`http://localhost:${PORT}/index.html`, { waitUntil: 'domcontentloaded' });
    await page.evaluate((u, c, loc) => {
      localStorage.clear();
      localStorage.setItem('foodwala_current_user', JSON.stringify(u));
      localStorage.setItem('foodwala_user', JSON.stringify(u));
      sessionStorage.setItem('foodwala_user', JSON.stringify(u));
      localStorage.setItem('foodwala_cart', JSON.stringify(c));
      localStorage.setItem('foodwala_location', JSON.stringify(loc));
      localStorage.setItem('foodwala_theme', 'light');
    }, CUSTOMER_USER, SAMPLE_CART, SAMPLE_LOCATION);

    await page.goto(`http://localhost:${PORT}/checkout.html`, { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 2000));

    // Fill in receipt email so form is complete
    await page.evaluate(() => {
      const emailInp = document.getElementById('receipt-email');
      if (emailInp) emailInp.value = 'vishnu@foodwala.com';
      const nameInp = document.getElementById('receipt-name');
      if (nameInp) nameInp.value = 'VISHNU';
    });

    // Scroll so Payment Method card is centered with maximum clarity
    await page.evaluate(() => {
      const payCard = document.querySelector('.checkout-card-payment');
      if (payCard) {
        payCard.scrollIntoView({ behavior: 'instant', block: 'center' });
      }
    });

    // Wait full 10 seconds as per user instructions
    console.log('Waiting 10 seconds for all images, badges, and fonts to fully render...');
    await new Promise(r => setTimeout(r, 10000));

    const targetPath = path.join(ROOT, 'presentation/screenshots/09_payment_screen.png');
    await page.screenshot({ path: targetPath });
    console.log('✅ Successfully wrote 09_payment_screen.png to:', targetPath);

  } catch (err) {
    console.error('Fatal error:', err);
  } finally {
    if (browser) await browser.close();
    server.close();
    console.log('Server closed. Done.');
    process.exit(0);
  }
});

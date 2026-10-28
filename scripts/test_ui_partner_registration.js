const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const BASE_URL = 'http://localhost:5000';

async function runUITest() {
  console.log('🚀 Starting Delivery Partner Sign-Up UI Automation Test...');

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    defaultViewport: { width: 1280, height: 800 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.toString()));

  try {
    // 1. Test Login page partner portal CTA
    console.log('1️⃣ Visiting login.html?portal=partner...');
    await page.goto(`${BASE_URL}/login.html?portal=partner`, { waitUntil: 'networkidle2' });

    const ctaText = await page.$eval('.card .text-center.small.text-muted', el => el.innerText);
    console.log('CTA text on login page:', ctaText);
    if (!ctaText.includes('Sign Up as Delivery Partner')) {
      throw new Error('Partner signup CTA link missing on login.html?portal=partner');
    }
    console.log('✅ Partner Signup CTA confirmed on login page!');

    // 2. Visit register.html?portal=partner
    console.log('2️⃣ Visiting register.html?portal=partner...');
    await page.goto(`${BASE_URL}/register.html?portal=partner`, { waitUntil: 'networkidle2' });

    // Verify role switcher state
    const title = await page.$eval('#reg-page-title', el => el.innerText);
    console.log('Registration page title:', title);
    if (!title.includes('Delivery Fleet')) {
      throw new Error(`Expected Delivery Fleet title, got: ${title}`);
    }

    const partnerFieldsDisplay = await page.$eval('#partner-fields-container', el => el.style.display);
    console.log('Partner fields container display:', partnerFieldsDisplay);
    if (partnerFieldsDisplay === 'none') {
      throw new Error('Partner fields container is unexpectedly hidden!');
    }
    console.log('✅ Partner fields container is displayed!');

    // Test switching to customer and back
    console.log('3️⃣ Testing role switching pills...');
    await page.click('#reg-role-btn-customer');
    await new Promise(r => setTimeout(r, 400));
    const isCustHidden = await page.$eval('#partner-fields-container', el => el.style.display);
    if (isCustHidden !== 'none') {
      throw new Error('Partner fields did not hide when switching to Customer');
    }

    await page.click('#reg-role-btn-partner');
    await new Promise(r => setTimeout(r, 400));
    const isPartnerShown = await page.$eval('#partner-fields-container', el => el.style.display);
    if (isPartnerShown === 'none') {
      throw new Error('Partner fields did not show when switching back to Partner');
    }
    console.log('✅ Role switching pills toggle successfully!');

    // Capture screenshot of partner registration form
    const screenshotsDir = path.join(__dirname, '..', 'presentation', 'screenshots');
    if (!fs.existsSync(screenshotsDir)) {
      fs.mkdirSync(screenshotsDir, { recursive: true });
    }
    await page.screenshot({ path: path.join(screenshotsDir, 'partner_signup_form.png'), fullPage: false });
    console.log('📸 Saved partner signup form screenshot to presentation/screenshots/partner_signup_form.png');

    // 4. Fill in Partner Registration Form
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const testPhone = '98' + Math.floor(10000000 + Math.random() * 90000000);
    const testEmail = `kiran.hero.${randomSuffix}@foodwala.com`;
    const testVehicle = `KA-03-EV-${randomSuffix}`;

    console.log('4️⃣ Submitting Partner Registration form...');
    console.log(`Phone: ${testPhone}, Email: ${testEmail}, Vehicle: ${testVehicle}`);

    await page.type('#reg-name', 'Kiran Delivery Hero');
    await page.type('#reg-phone', testPhone);
    await page.type('#reg-email', testEmail);
    await page.select('#reg-vehicle-type', 'Electric Scooter');
    await page.type('#reg-vehicle-number', testVehicle);
    await page.select('#reg-delivery-zone', 'Indiranagar & Domlur');
    await page.type('#reg-driving-license', `DL-KA03-202400${randomSuffix}`);
    await page.type('#reg-password', 'HeroPassword123!');
    await page.type('#reg-confirm-password', 'HeroPassword123!');

    // Click submit
    await page.click('#register-submit-btn');

    // Wait for OTP modal to appear
    console.log('Waiting for OTP modal (#regOtpModal)...');
    await page.waitForSelector('#regOtpModal.show', { timeout: 10000 });
    console.log('✅ OTP Modal (#regOtpModal) is visible!');

    // Wait a brief moment for OTP code badge to populate
    await new Promise(r => setTimeout(r, 600));

    // Click autofill OTP button or fill boxes
    const autofillBtn = await page.$('#autofill-reg-otp-btn');
    if (autofillBtn) {
      console.log('Clicking Autofill OTP button...');
      await autofillBtn.click();
    } else {
      console.log('Typing OTP code into boxes...');
      const otpBadge = await page.$eval('#reg-sandbox-otp-badge', el => el.innerText);
      const code = (otpBadge || '123456').trim();
      const boxes = await page.$$('.reg-otp-box');
      for (let i = 0; i < boxes.length; i++) {
        await boxes[i].type(code[i] || '1');
      }
    }

    await new Promise(r => setTimeout(r, 400));
    console.log('Clicking verify OTP button (#reg-verify-otp-btn)...');
    await page.click('#reg-verify-otp-btn');

    // Wait for redirection to delivery-dashboard.html
    console.log('Waiting for redirection to delivery-dashboard.html...');
    await page.waitForFunction(() => {
      return window.location.href.includes('delivery-dashboard');
    }, { timeout: 15000 });

    const currentUrl = page.url();
    console.log('✅ Successfully redirected to:', currentUrl);

    // Verify localStorage has user and role
    const storedUser = await page.evaluate(() => {
      return JSON.parse(localStorage.getItem('foodwala_current_user') || '{}');
    });

    console.log('Stored user in localStorage (foodwala_current_user):', {
      id: storedUser.id || storedUser.userId,
      name: storedUser.name,
      role: storedUser.role,
      partnerId: storedUser.partnerId,
      vehicleNumber: storedUser.vehicleNumber,
      vehicleType: storedUser.vehicleType
    });

    if (storedUser.role !== 'partner' && storedUser.role !== 'delivery_partner') {
      throw new Error(`Expected user role 'partner', got: ${storedUser.role}`);
    }

    // Wait 2 seconds for dashboard to fully render
    await new Promise(r => setTimeout(r, 2000));
    await page.screenshot({ path: path.join(screenshotsDir, 'partner_dashboard_after_signup.png'), fullPage: false });
    console.log('📸 Saved partner dashboard screenshot to presentation/screenshots/partner_dashboard_after_signup.png');

    console.log('🎉🎉🎉 ALL UI AUTOMATION AND REDIRECTION TESTS PASSED! 🎉🎉🎉');
  } catch (err) {
    console.error('❌ UI Test Error:', err);
    await page.screenshot({ path: 'test_failure.png' }).catch(() => {});
    throw err;
  } finally {
    await browser.close();
  }
}

runUITest().then(() => {
  process.exit(0);
}).catch(() => {
  process.exit(1);
});

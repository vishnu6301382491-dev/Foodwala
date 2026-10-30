const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const OUTPUT_DIR = path.resolve('D:/FoodWala_Eclipse_Project/presentation/screenshots');

async function generateJavaProjectStructure() {
  console.log('Rendering Java Full Stack Project Structure screenshot...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1920,1080']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });

  const structureHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
          background: #0B1120;
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
          padding: 26px 36px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 32px;
          flex: 1;
          overflow: hidden;
        }
        .panel {
          background: #0F172A;
          border: 1px solid #334155;
          border-radius: 12px;
          padding: 22px;
        }
        .panel-header {
          font-size: 14.5px;
          font-weight: 700;
          color: #38BDF8;
          margin-bottom: 14px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-family: sans-serif;
        }
        pre {
          font-size: 12.8px;
          line-height: 1.52;
          color: #CBD5E1;
        }
        .dir { color: #60A5FA; font-weight: bold; }
        .java { color: #F59E0B; font-weight: bold; }
        .jsp { color: #EC4899; }
        .sql { color: #F472B6; }
        .html { color: #FB923C; }
        .css { color: #A78BFA; }
        .js { color: #FCD34D; }
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
        .badge-java {
          background: #D97706;
        }
      </style>
    </head>
    <body>
      <div class="window">
        <div class="titlebar">
          <div class="dot red"></div>
          <div class="dot yellow"></div>
          <div class="dot green"></div>
          <span class="title">FoodWala Java Full Stack Explorer — Eclipse Dynamic Web Project</span>
        </div>
        <div class="content">
          <!-- LEFT PANEL: JAVA BACKEND & ENTERPRISE ARCHITECTURE -->
          <div class="panel">
            <div class="panel-header">
              <span>☕ JAVA BACKEND & ENTERPRISE ARCHITECTURE</span>
              <span class="badge badge-java">Java 17 + Servlets + JDBC</span>
            </div>
            <pre>
<span class="dir">FoodWala/</span>
├── <span class="dir">src/main/java/com/tap/</span>
│   ├── <span class="dir">controller/</span>                   <span class="comment"># Java Servlets (HTTP Handlers)</span>
│   │   ├── <span class="java">LoginController.java</span>        <span class="comment"># Argon2id Authentication & Sessions</span>
│   │   ├── <span class="java">RegistrationController.java</span> <span class="comment"># User & Delivery Partner Onboarding</span>
│   │   ├── <span class="java">CheckoutController.java</span>     <span class="comment"># Order Placement & Cart Lock</span>
│   │   ├── <span class="java">PaymentController.java</span>      <span class="comment"># Razorpay Gateway Verification</span>
│   │   ├── <span class="java">OrderTrackingController.java</span><span class="comment"># 5-Stage Live Order Lifecycle</span>
│   │   └── <span class="java">RestaurantDashboardController.java</span> <span class="comment"># Store Manager Isolation</span>
│   ├── <span class="dir">dao/</span>                          <span class="comment"># Data Access Object Interfaces</span>
│   │   ├── <span class="java">UserDAO.java</span>, <span class="java">RestaurantDAO.java</span>, <span class="java">MenuDAO.java</span>
│   │   └── <span class="java">OrderDAO.java</span>, <span class="java">PaymentDAO.java</span>, <span class="java">AddressDAO.java</span>
│   ├── <span class="dir">daoimpl/</span>                      <span class="comment"># Direct JDBC Implementations</span>
│   │   ├── <span class="java">OrderDAOImpl.java</span>        <span class="comment"># ACID Multi-Table Transactions</span>
│   │   └── <span class="java">UserDAOImpl.java</span>         <span class="comment"># Parameterized SQL & RBAC Queries</span>
│   ├── <span class="dir">model/</span>                        <span class="comment"># Entity POJOs (Encapsulation)</span>
│   │   ├── <span class="java">User.java</span>, <span class="java">Restaurant.java</span>, <span class="java">Menu.java</span>, <span class="java">Order.java</span>
│   │   └── <span class="java">Cart.java</span>, <span class="java">Payment.java</span>, <span class="java">DeliveryPartner.java</span>
│   ├── <span class="dir">service/</span>                      <span class="comment"># Enterprise Business Logic</span>
│   │   ├── <span class="java">OrderService.java</span>        <span class="comment"># Bill Calculation & Coupon Engine</span>
│   │   └── <span class="java">RazorpayService.java</span>     <span class="comment"># Payment Verification & Webhook Sync</span>
│   └── <span class="dir">util/</span>                         <span class="comment"># Core Utilities & Security</span>
│       ├── <span class="java">DBConnection.java</span>        <span class="comment"># Connection Pool & Driver Manager</span>
│       ├── <span class="java">PasswordUtil.java</span>        <span class="comment"># Argon2id / BCrypt Hash & Verify</span>
│       └── <span class="java">CORSFilter.java</span>          <span class="comment"># Security Filter & Preflight Headers</span>
├── <span class="dir">database/</span>
│   └── <span class="sql">cloud_schema.sql</span>              <span class="comment"># 22-Table MySQL Relational Schema</span>
            </pre>
          </div>

          <!-- RIGHT PANEL: FRONTEND WEB & JSP LAYER -->
          <div class="panel">
            <div class="panel-header">
              <span>🌐 WEB PAGES, JSP & CLIENT ASSETS</span>
              <span class="badge">JSP + Bootstrap 5.3 + ES6</span>
            </div>
            <pre>
<span class="dir">FoodWala/</span>
├── <span class="dir">src/main/webapp/</span>
│   ├── <span class="dir">WEB-INF/</span>
│   │   └── <span class="html">web.xml</span>                   <span class="comment"># Servlet Mappings, Filters & Security</span>
│   ├── <span class="jsp">paymentGateway.jsp</span>            <span class="comment"># Server-Rendered Payment Sandbox</span>
│   ├── <span class="jsp">checkout.jsp</span>                  <span class="comment"># Dynamic Checkout & Address Binder</span>
│   ├── <span class="html">index.html</span>                    <span class="comment"># Homepage, Hero Video & Discovery</span>
│   ├── <span class="html">restaurants.html</span>              <span class="comment"># Bengaluru Hubs & Advanced Filters</span>
│   ├── <span class="html">menu.html</span>                     <span class="comment"># Dishes Catalog & Real-Time Add</span>
│   ├── <span class="html">search.html</span>                   <span class="comment"># Typo-Tolerant Autocomplete Search</span>
│   ├── <span class="html">cart.html</span>                     <span class="comment"># Live Cart, Bill Summary & Coupons</span>
│   ├── <span class="html">checkout.html</span>                 <span class="comment"># Razorpay Gateway & COD Selection</span>
│   ├── <span class="html">order-confirmation.html</span>       <span class="comment"># Post-Payment Receipt Display</span>
│   ├── <span class="html">order-tracking.html</span>           <span class="comment"># 5-Stage Status Tracking Timeline</span>
│   ├── <span class="html">orders.html</span>                   <span class="comment"># Historical Order Ledger</span>
│   ├── <span class="html">admin.html</span>                    <span class="comment"># Super Admin Analytics & KPI Portal</span>
│   ├── <span class="html">restaurant-dashboard.html</span>     <span class="comment"># Store Manager Isolated Portal</span>
│   ├── <span class="html">delivery-dashboard.html</span>       <span class="comment"># Delivery Partner Route Portal</span>
│   ├── <span class="dir">js/</span>
│   │   ├── <span class="js">app.js</span>                    <span class="comment"># Cart State & REST API Dispatcher</span>
│   │   └── <span class="js">smart-search.js</span>           <span class="comment"># Jaro-Winkler Typo Distance Engine</span>
│   └── <span class="dir">css/</span>
│       └── <span class="css">style.css</span>                 <span class="comment"># FoodWala Core UI & Dark Mode Theme</span>
            </pre>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  await page.setContent(structureHtml, { waitUntil: 'domcontentloaded' });
  const outPath = path.join(OUTPUT_DIR, '00_project_structure.png');
  await page.screenshot({ path: outPath });
  console.log('✅ Successfully saved Java Full Stack project structure to:', outPath);
  await browser.close();
}

generateJavaProjectStructure().catch(err => {
  console.error('Error generating structure image:', err);
  process.exit(1);
});

const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const OUTPUT_PATH = path.resolve('D:/FoodWala_Eclipse_Project/presentation/diagrams/foodwala-er-diagram.png');

const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>FoodWala Entity Relationship Diagram</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      width: 1920px;
      height: 1080px;
      background: #0b1120;
      font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
      color: #f1f5f9;
      position: relative;
      overflow: hidden;
    }
    .header {
      padding: 24px 40px 10px 40px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid rgba(255,255,255,0.08);
    }
    .header h1 {
      font-size: 26px;
      font-weight: 700;
      color: #f8fafc;
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .header h1 span {
      background: linear-gradient(135deg, #ef4444, #f97316);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .badge-pill {
      font-size: 13px;
      font-weight: 600;
      padding: 6px 14px;
      border-radius: 9999px;
      background: rgba(239, 68, 68, 0.15);
      border: 1px solid rgba(239, 68, 68, 0.3);
      color: #fca5a5;
    }
    .meta-info {
      font-size: 13px;
      color: #94a3b8;
    }
    .meta-info strong { color: #e2e8f0; }

    /* Diagram Canvas */
    .canvas {
      position: absolute;
      top: 80px;
      left: 0;
      width: 1920px;
      height: 1000px;
    }

    svg.connections {
      position: absolute;
      top: 0;
      left: 0;
      width: 1920px;
      height: 1000px;
      pointer-events: none;
      z-index: 1;
    }

    /* Table Cards */
    .table-card {
      position: absolute;
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 10px;
      width: 250px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5);
      z-index: 2;
      overflow: hidden;
    }
    .table-header {
      padding: 8px 12px;
      font-size: 13px;
      font-weight: 700;
      display: flex;
      justify-content: space-between;
      align-items: center;
      color: #ffffff;
      border-bottom: 1px solid rgba(255,255,255,0.08);
    }
    .table-header.users { background: linear-gradient(135deg, #3b82f6, #1d4ed8); }
    .table-header.orders { background: linear-gradient(135deg, #ef4444, #b91c1c); }
    .table-header.restaurants { background: linear-gradient(135deg, #10b981, #047857); }
    .table-header.menu { background: linear-gradient(135deg, #f59e0b, #b45309); }
    .table-header.payment { background: linear-gradient(135deg, #8b5cf6, #6d28d9); }
    .table-header.delivery { background: linear-gradient(135deg, #06b6d4, #0e7490); }
    .table-header.cart { background: linear-gradient(135deg, #ec4899, #be185d); }
    .table-header.whatsapp { background: linear-gradient(135deg, #22c55e, #15803d); }
    .table-header.aux { background: #475569; }

    .table-body {
      padding: 6px 10px;
      font-size: 11px;
      background: #111827;
      display: flex;
      flex-direction: column;
      gap: 3px;
    }
    .col-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 2px 0;
      border-bottom: 1px dashed rgba(255,255,255,0.04);
    }
    .col-row:last-child { border-bottom: none; }
    .col-name {
      display: flex;
      align-items: center;
      gap: 6px;
      color: #cbd5e1;
      font-family: 'Consolas', 'Courier New', monospace;
    }
    .col-type {
      color: #64748b;
      font-size: 10px;
      font-family: 'Consolas', monospace;
    }
    .key-badge {
      font-size: 9px;
      font-weight: 700;
      padding: 1px 4px;
      border-radius: 4px;
      text-transform: uppercase;
    }
    .key-pk { background: #ef4444; color: #fff; }
    .key-fk { background: #38bdf8; color: #0f172a; }
    .key-uni { background: #eab308; color: #0f172a; }

    .legend {
      position: absolute;
      bottom: 20px;
      right: 40px;
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 8px;
      padding: 12px 18px;
      display: flex;
      gap: 20px;
      align-items: center;
      z-index: 10;
      font-size: 12px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.4);
    }
    .legend-item { display: flex; align-items: center; gap: 8px; }
    .legend-line { width: 24px; height: 3px; border-radius: 2px; }
  </style>
</head>
<body>

  <div class="header">
    <div>
      <h1><span>FoodWala</span> Relational Database Architecture (MySQL 9.7)</h1>
      <p style="font-size: 13px; color: #94a3b8; margin-top: 2px;">
        High-concurrency schema optimized for real-time food delivery, multi-role authorization, order lifecycle state-machine & 24/7 AI assistance
      </p>
    </div>
    <div style="display: flex; gap: 16px; align-items: center;">
      <span class="badge-pill">22 Relational Tables</span>
      <div class="meta-info">Engine: <strong>InnoDB</strong> | Charset: <strong>utf8mb4</strong></div>
    </div>
  </div>

  <div class="canvas">
    <!-- SVG Connections between entities -->
    <svg class="connections">
      <defs>
        <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#64748b" />
        </marker>
        <marker id="arrow-red" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#ef4444" />
        </marker>
        <marker id="arrow-blue" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#38bdf8" />
        </marker>
        <marker id="arrow-emerald" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#10b981" />
        </marker>
      </defs>

      <!-- user -> orders -->
      <path d="M 285 240 L 450 240" fill="none" stroke="#ef4444" stroke-width="2" stroke-dasharray="4,4" marker-end="url(#arrow-red)" />
      <!-- restaurant -> orders -->
      <path d="M 975 220 L 710 220" fill="none" stroke="#10b981" stroke-width="2" marker-end="url(#arrow-emerald)" />
      <!-- orders -> order_item -->
      <path d="M 580 435 L 580 495" fill="none" stroke="#ef4444" stroke-width="2" marker-end="url(#arrow-red)" />
      <!-- menu -> order_item -->
      <path d="M 1030 460 L 710 550" fill="none" stroke="#f59e0b" stroke-width="2" stroke-dasharray="4,4" marker-end="url(#arrow)" />
      <!-- restaurant -> menu -->
      <path d="M 1100 370 L 1100 420" fill="none" stroke="#10b981" stroke-width="2" marker-end="url(#arrow-emerald)" />
      <!-- orders -> payment -->
      <path d="M 710 290 L 800 290" fill="none" stroke="#8b5cf6" stroke-width="2" marker-end="url(#arrow)" />
      <!-- orders -> order_status_history -->
      <path d="M 500 435 L 500 710 L 420 710" fill="none" stroke="#64748b" stroke-width="2" marker-end="url(#arrow)" />
      <!-- user -> address -->
      <path d="M 160 380 L 160 440" fill="none" stroke="#38bdf8" stroke-width="2" marker-end="url(#arrow-blue)" />
      <!-- user -> cart -->
      <path d="M 210 120 L 210 50 L 760 50 L 760 90" fill="none" stroke="#ec4899" stroke-width="2" stroke-dasharray="4,4" marker-end="url(#arrow)" />
      <!-- cart -> cart_item -->
      <path d="M 885 130 L 975 130" fill="none" stroke="#ec4899" stroke-width="2" marker-end="url(#arrow)" />
      <!-- user -> delivery_partner -->
      <path d="M 160 670 L 160 720" fill="none" stroke="#06b6d4" stroke-width="2" marker-end="url(#arrow)" />
      <!-- user -> whatsapp_conversations -->
      <path d="M 285 300 L 360 300 L 360 840 L 750 840" fill="none" stroke="#22c55e" stroke-width="2" stroke-dasharray="4,4" marker-end="url(#arrow)" />
      <!-- whatsapp_conversations -> whatsapp_messages -->
      <path d="M 1000 840 L 1070 840" fill="none" stroke="#22c55e" stroke-width="2" marker-end="url(#arrow)" />
      <!-- orders -> support_tickets -->
      <path d="M 710 370 L 1260 370 L 1260 760" fill="none" stroke="#ef4444" stroke-width="2" stroke-dasharray="4,4" marker-end="url(#arrow)" />
      <!-- coupons -> coupon_usage -->
      <path d="M 1525 240 L 1525 300" fill="none" stroke="#f59e0b" stroke-width="2" marker-end="url(#arrow)" />
    </svg>

    <!-- TABLE: USER -->
    <div class="table-card" style="top: 120px; left: 35px;">
      <div class="table-header users">
        <span>👤 user</span>
        <span style="font-size: 10px; opacity: 0.8;">Core Identity</span>
      </div>
      <div class="table-body">
        <div class="col-row"><span class="col-name"><span class="key-badge key-pk">PK</span> user_id</span><span class="col-type">INT</span></div>
        <div class="col-row"><span class="col-name">username</span><span class="col-type">VARCHAR(100)</span></div>
        <div class="col-row"><span class="col-name"><span class="key-badge key-uni">UQ</span> email</span><span class="col-type">VARCHAR(150)</span></div>
        <div class="col-row"><span class="col-name"><span class="key-badge key-uni">UQ</span> phone</span><span class="col-type">VARCHAR(20)</span></div>
        <div class="col-row"><span class="col-name">role</span><span class="col-type">VARCHAR(50)</span></div>
        <div class="col-row"><span class="col-name">password_hash</span><span class="col-type">VARCHAR(255)</span></div>
        <div class="col-row"><span class="col-name">last_login</span><span class="col-type">DATETIME</span></div>
        <div class="col-row"><span class="col-name">locked_until</span><span class="col-type">DATETIME</span></div>
      </div>
    </div>

    <!-- TABLE: ADDRESS -->
    <div class="table-card" style="top: 440px; left: 35px;">
      <div class="table-header users">
        <span>📍 address</span>
        <span style="font-size: 10px; opacity: 0.8;">User Addresses</span>
      </div>
      <div class="table-body">
        <div class="col-row"><span class="col-name"><span class="key-badge key-pk">PK</span> address_id</span><span class="col-type">INT</span></div>
        <div class="col-row"><span class="col-name"><span class="key-badge key-fk">FK</span> user_id</span><span class="col-type">INT</span></div>
        <div class="col-row"><span class="col-name">house_no</span><span class="col-type">VARCHAR(100)</span></div>
        <div class="col-row"><span class="col-name">street</span><span class="col-type">VARCHAR(150)</span></div>
        <div class="col-row"><span class="col-name">area, city</span><span class="col-type">VARCHAR(150)</span></div>
        <div class="col-row"><span class="col-name">pincode</span><span class="col-type">VARCHAR(20)</span></div>
      </div>
    </div>

    <!-- TABLE: DELIVERY_PARTNER -->
    <div class="table-card" style="top: 720px; left: 35px;">
      <div class="table-header delivery">
        <span>🛵 delivery_partner</span>
        <span style="font-size: 10px; opacity: 0.8;">Fleet GPS</span>
      </div>
      <div class="table-body">
        <div class="col-row"><span class="col-name"><span class="key-badge key-pk">PK</span> partner_id</span><span class="col-type">INT</span></div>
        <div class="col-row"><span class="col-name"><span class="key-badge key-fk">FK</span> user_id</span><span class="col-type">INT (UQ)</span></div>
        <div class="col-row"><span class="col-name">name, phone</span><span class="col-type">VARCHAR</span></div>
        <div class="col-row"><span class="col-name">vehicle_number</span><span class="col-type">VARCHAR(50)</span></div>
        <div class="col-row"><span class="col-name">current_lat, lng</span><span class="col-type">DOUBLE</span></div>
        <div class="col-row"><span class="col-name">is_available</span><span class="col-type">TINYINT(1)</span></div>
      </div>
    </div>

    <!-- TABLE: ORDERS -->
    <div class="table-card" style="top: 130px; left: 450px; width: 260px;">
      <div class="table-header orders">
        <span>📦 orders</span>
        <span style="font-size: 10px; opacity: 0.8;">Order Lifecycle</span>
      </div>
      <div class="table-body">
        <div class="col-row"><span class="col-name"><span class="key-badge key-pk">PK</span> order_id</span><span class="col-type">INT</span></div>
        <div class="col-row"><span class="col-name"><span class="key-badge key-fk">FK</span> user_id</span><span class="col-type">INT</span></div>
        <div class="col-row"><span class="col-name"><span class="key-badge key-fk">FK</span> restaurant_id</span><span class="col-type">INT</span></div>
        <div class="col-row"><span class="col-name">total_amount</span><span class="col-type">DOUBLE</span></div>
        <div class="col-row"><span class="col-name">status</span><span class="col-type">VARCHAR(50)</span></div>
        <div class="col-row"><span class="col-name">payment_mode</span><span class="col-type">VARCHAR(50)</span></div>
        <div class="col-row"><span class="col-name">order_date</span><span class="col-type">TIMESTAMP</span></div>
        <div class="col-row"><span class="col-name">customer_name, phone</span><span class="col-type">VARCHAR</span></div>
        <div class="col-row"><span class="col-name">delivery_address</span><span class="col-type">TEXT</span></div>
      </div>
    </div>

    <!-- TABLE: ORDER_ITEM -->
    <div class="table-card" style="top: 495px; left: 450px; width: 260px;">
      <div class="table-header orders">
        <span>🍔 order_item</span>
        <span style="font-size: 10px; opacity: 0.8;">Line Items</span>
      </div>
      <div class="table-body">
        <div class="col-row"><span class="col-name"><span class="key-badge key-pk">PK</span> order_item_id</span><span class="col-type">INT</span></div>
        <div class="col-row"><span class="col-name"><span class="key-badge key-fk">FK</span> order_id</span><span class="col-type">INT</span></div>
        <div class="col-row"><span class="col-name"><span class="key-badge key-fk">FK</span> menu_id</span><span class="col-type">INT</span></div>
        <div class="col-row"><span class="col-name">item_name</span><span class="col-type">VARCHAR(150)</span></div>
        <div class="col-row"><span class="col-name">quantity</span><span class="col-type">INT</span></div>
        <div class="col-row"><span class="col-name">price_at_order</span><span class="col-type">DOUBLE</span></div>
        <div class="col-row"><span class="col-name">item_total</span><span class="col-type">DOUBLE</span></div>
      </div>
    </div>

    <!-- TABLE: ORDER_STATUS_HISTORY -->
    <div class="table-card" style="top: 650px; left: 170px; width: 250px;">
      <div class="table-header aux">
        <span>⏱️ order_status_history</span>
        <span style="font-size: 10px; opacity: 0.8;">Audit Trail</span>
      </div>
      <div class="table-body">
        <div class="col-row"><span class="col-name"><span class="key-badge key-pk">PK</span> history_id</span><span class="col-type">INT</span></div>
        <div class="col-row"><span class="col-name"><span class="key-badge key-fk">FK</span> order_id</span><span class="col-type">INT</span></div>
        <div class="col-row"><span class="col-name">status</span><span class="col-type">VARCHAR(50)</span></div>
        <div class="col-row"><span class="col-name">changed_by</span><span class="col-type">VARCHAR(100)</span></div>
        <div class="col-row"><span class="col-name">timestamp</span><span class="col-type">TIMESTAMP</span></div>
      </div>
    </div>

    <!-- TABLE: PAYMENT -->
    <div class="table-card" style="top: 220px; left: 800px; width: 250px;">
      <div class="table-header payment">
        <span>💳 payment</span>
        <span style="font-size: 10px; opacity: 0.8;">Razorpay Engine</span>
      </div>
      <div class="table-body">
        <div class="col-row"><span class="col-name"><span class="key-badge key-pk">PK</span> payment_id</span><span class="col-type">INT</span></div>
        <div class="col-row"><span class="col-name"><span class="key-badge key-fk">FK</span> order_id</span><span class="col-type">INT</span></div>
        <div class="col-row"><span class="col-name"><span class="key-badge key-uni">UQ</span> transaction_id</span><span class="col-type">VARCHAR(100)</span></div>
        <div class="col-row"><span class="col-name">amount</span><span class="col-type">DOUBLE</span></div>
        <div class="col-row"><span class="col-name">payment_method</span><span class="col-type">VARCHAR(50)</span></div>
        <div class="col-row"><span class="col-name">payment_status</span><span class="col-type">VARCHAR(50)</span></div>
        <div class="col-row"><span class="col-name">razorpay_order_id</span><span class="col-type">VARCHAR(100)</span></div>
      </div>
    </div>

    <!-- TABLE: RESTAURANT -->
    <div class="table-card" style="top: 130px; left: 975px; width: 260px;">
      <div class="table-header restaurants">
        <span>🏪 restaurant</span>
        <span style="font-size: 10px; opacity: 0.8;">Merchant Store</span>
      </div>
      <div class="table-body">
        <div class="col-row"><span class="col-name"><span class="key-badge key-pk">PK</span> restaurant_id</span><span class="col-type">INT</span></div>
        <div class="col-row"><span class="col-name">name</span><span class="col-type">VARCHAR(150)</span></div>
        <div class="col-row"><span class="col-name"><span class="key-badge key-fk">FK</span> admin_user_id</span><span class="col-type">INT</span></div>
        <div class="col-row"><span class="col-name">cuisine_type</span><span class="col-type">VARCHAR(100)</span></div>
        <div class="col-row"><span class="col-name">delivery_time</span><span class="col-type">INT</span></div>
        <div class="col-row"><span class="col-name">rating</span><span class="col-type">DOUBLE</span></div>
        <div class="col-row"><span class="col-name">latitude, longitude</span><span class="col-type">DOUBLE</span></div>
        <div class="col-row"><span class="col-name">is_active</span><span class="col-type">TINYINT(1)</span></div>
      </div>
    </div>

    <!-- TABLE: MENU -->
    <div class="table-card" style="top: 420px; left: 975px; width: 260px;">
      <div class="table-header menu">
        <span>🍲 menu</span>
        <span style="font-size: 10px; opacity: 0.8;">Dishes & Catalog</span>
      </div>
      <div class="table-body">
        <div class="col-row"><span class="col-name"><span class="key-badge key-pk">PK</span> menu_id</span><span class="col-type">INT</span></div>
        <div class="col-row"><span class="col-name"><span class="key-badge key-fk">FK</span> restaurant_id</span><span class="col-type">INT</span></div>
        <div class="col-row"><span class="col-name">item_name</span><span class="col-type">VARCHAR(150)</span></div>
        <div class="col-row"><span class="col-name">category_name</span><span class="col-type">VARCHAR(100)</span></div>
        <div class="col-row"><span class="col-name">price</span><span class="col-type">DOUBLE</span></div>
        <div class="col-row"><span class="col-name">rating</span><span class="col-type">DECIMAL(2,1)</span></div>
        <div class="col-row"><span class="col-name">is_available</span><span class="col-type">TINYINT(1)</span></div>
      </div>
    </div>

    <!-- TABLE: CART & CART_ITEM -->
    <div class="table-card" style="top: 20px; left: 740px; width: 190px;">
      <div class="table-header cart">
        <span>🛒 cart</span>
        <span style="font-size: 10px; opacity: 0.8;">Active</span>
      </div>
      <div class="table-body">
        <div class="col-row"><span class="col-name"><span class="key-badge key-pk">PK</span> cart_id</span><span class="col-type">INT</span></div>
        <div class="col-row"><span class="col-name"><span class="key-badge key-fk">FK</span> user_id</span><span class="col-type">INT</span></div>
        <div class="col-row"><span class="col-name"><span class="key-badge key-fk">FK</span> restaurant_id</span><span class="col-type">INT</span></div>
      </div>
    </div>

    <div class="table-card" style="top: 20px; left: 975px; width: 190px;">
      <div class="table-header cart">
        <span>📋 cart_item</span>
        <span style="font-size: 10px; opacity: 0.8;">Items</span>
      </div>
      <div class="table-body">
        <div class="col-row"><span class="col-name"><span class="key-badge key-pk">PK</span> cart_item_id</span><span class="col-type">INT</span></div>
        <div class="col-row"><span class="col-name"><span class="key-badge key-fk">FK</span> cart_id</span><span class="col-type">INT</span></div>
        <div class="col-row"><span class="col-name"><span class="key-badge key-fk">FK</span> menu_id</span><span class="col-type">INT</span></div>
        <div class="col-row"><span class="col-name">quantity</span><span class="col-type">INT</span></div>
      </div>
    </div>

    <!-- TABLE: COUPONS & USAGE -->
    <div class="table-card" style="top: 70px; left: 1400px; width: 250px;">
      <div class="table-header aux">
        <span>🏷️ coupons</span>
        <span style="font-size: 10px; opacity: 0.8;">Promo Rules</span>
      </div>
      <div class="table-body">
        <div class="col-row"><span class="col-name"><span class="key-badge key-pk">PK</span> coupon_id</span><span class="col-type">INT</span></div>
        <div class="col-row"><span class="col-name"><span class="key-badge key-uni">UQ</span> code</span><span class="col-type">VARCHAR(50)</span></div>
        <div class="col-row"><span class="col-name">discount_type</span><span class="col-type">ENUM</span></div>
        <div class="col-row"><span class="col-name">discount_value</span><span class="col-type">DOUBLE</span></div>
        <div class="col-row"><span class="col-name">min_order_amount</span><span class="col-type">DOUBLE</span></div>
        <div class="col-row"><span class="col-name">expires_at</span><span class="col-type">DATETIME</span></div>
      </div>
    </div>

    <div class="table-card" style="top: 300px; left: 1400px; width: 250px;">
      <div class="table-header aux">
        <span>📊 coupon_usage</span>
        <span style="font-size: 10px; opacity: 0.8;">Redemptions</span>
      </div>
      <div class="table-body">
        <div class="col-row"><span class="col-name"><span class="key-badge key-pk">PK</span> usage_id</span><span class="col-type">INT</span></div>
        <div class="col-row"><span class="col-name"><span class="key-badge key-fk">FK</span> coupon_id</span><span class="col-type">INT</span></div>
        <div class="col-row"><span class="col-name"><span class="key-badge key-fk">FK</span> user_id</span><span class="col-type">INT</span></div>
        <div class="col-row"><span class="col-name">used_at</span><span class="col-type">TIMESTAMP</span></div>
      </div>
    </div>

    <!-- TABLE: WHATSAPP_CONVERSATIONS -->
    <div class="table-card" style="top: 740px; left: 750px; width: 250px;">
      <div class="table-header whatsapp">
        <span>💬 whatsapp_conversations</span>
        <span style="font-size: 10px; opacity: 0.8;">AI Chat Session</span>
      </div>
      <div class="table-body">
        <div class="col-row"><span class="col-name"><span class="key-badge key-pk">PK</span> conversation_id</span><span class="col-type">INT</span></div>
        <div class="col-row"><span class="col-name"><span class="key-badge key-uni">UQ</span> wa_id</span><span class="col-type">VARCHAR(50)</span></div>
        <div class="col-row"><span class="col-name">phone_number</span><span class="col-type">VARCHAR(20)</span></div>
        <div class="col-row"><span class="col-name"><span class="key-badge key-fk">FK</span> user_id</span><span class="col-type">INT</span></div>
        <div class="col-row"><span class="col-name">session_status</span><span class="col-type">VARCHAR(50)</span></div>
        <div class="col-row"><span class="col-name">last_message_at</span><span class="col-type">TIMESTAMP</span></div>
      </div>
    </div>

    <!-- TABLE: WHATSAPP_MESSAGES -->
    <div class="table-card" style="top: 740px; left: 1070px; width: 250px;">
      <div class="table-header whatsapp">
        <span>📩 whatsapp_messages</span>
        <span style="font-size: 10px; opacity: 0.8;">Transcript & AI</span>
      </div>
      <div class="table-body">
        <div class="col-row"><span class="col-name"><span class="key-badge key-pk">PK</span> message_id</span><span class="col-type">INT</span></div>
        <div class="col-row"><span class="col-name"><span class="key-badge key-fk">FK</span> conversation_id</span><span class="col-type">INT</span></div>
        <div class="col-row"><span class="col-name">direction</span><span class="col-type">ENUM(IN/OUT)</span></div>
        <div class="col-row"><span class="col-name">message_body</span><span class="col-type">TEXT</span></div>
        <div class="col-row"><span class="col-name">intent_detected</span><span class="col-type">VARCHAR(50)</span></div>
        <div class="col-row"><span class="col-name">timestamp</span><span class="col-type">TIMESTAMP</span></div>
      </div>
    </div>

    <!-- TABLE: SUPPORT_TICKETS -->
    <div class="table-card" style="top: 540px; left: 1400px; width: 250px;">
      <div class="table-header aux">
        <span>🎫 support_tickets</span>
        <span style="font-size: 10px; opacity: 0.8;">Escalation Desk</span>
      </div>
      <div class="table-body">
        <div class="col-row"><span class="col-name"><span class="key-badge key-pk">PK</span> ticket_id</span><span class="col-type">INT</span></div>
        <div class="col-row"><span class="col-name"><span class="key-badge key-fk">FK</span> order_id</span><span class="col-type">INT</span></div>
        <div class="col-row"><span class="col-name"><span class="key-badge key-fk">FK</span> user_id</span><span class="col-type">INT</span></div>
        <div class="col-row"><span class="col-name"><span class="key-badge key-fk">FK</span> conversation_id</span><span class="col-type">INT</span></div>
        <div class="col-row"><span class="col-name">status</span><span class="col-type">VARCHAR(50)</span></div>
        <div class="col-row"><span class="col-name">subject, description</span><span class="col-type">TEXT</span></div>
      </div>
    </div>

    <!-- Legend -->
    <div class="legend">
      <div class="legend-item"><span class="key-badge key-pk">PK</span> Primary Key</div>
      <div class="legend-item"><span class="key-badge key-fk">FK</span> Foreign Key</div>
      <div class="legend-item"><span class="key-badge key-uni">UQ</span> Unique Key</div>
      <div class="legend-item"><div class="legend-line" style="background: #ef4444;"></div> Order Transaction Flow</div>
      <div class="legend-item"><div class="legend-line" style="background: #10b981;"></div> Merchant & Catalog</div>
      <div class="legend-item"><div class="legend-line" style="background: #22c55e;"></div> WhatsApp AI Engine</div>
    </div>
  </div>

</body>
</html>
`;

async function renderERDiagram() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 2 });
  await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

  await page.screenshot({
    path: OUTPUT_PATH,
    clip: { x: 0, y: 0, width: 1920, height: 1080 }
  });

  console.log('✅ ER Diagram successfully generated at:', OUTPUT_PATH);
  await browser.close();
}

renderERDiagram().catch(err => {
  console.error('Failed to generate ER Diagram:', err);
  process.exit(1);
});

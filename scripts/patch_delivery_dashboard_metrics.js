const fs = require('fs');

const files = [
  'D:/FoodWala_Eclipse_Project/delivery-dashboard.html',
  'D:/FoodWala_Eclipse_Project/src/main/webapp/delivery-dashboard.html'
];

files.forEach(filePath => {
  if (!fs.existsSync(filePath)) {
    console.log('Skipping missing:', filePath);
    return;
  }
  let content = fs.readFileSync(filePath, 'utf8');

  // 1. Give IDs and clean defaults to Header Quick Stats Row
  content = content.replace(
    `<div class="small text-contrast-muted fw-bold text-uppercase">Today's Trips</div>
                  <div class="fs-4 fw-black text-contrast-dark" id="header-trips-count">9 Trips</div>
                  <span class="text-success small fw-bold"><i class="bi bi-check-circle-fill"></i> 100% Completed</span>`,
    `<div class="small text-contrast-muted fw-bold text-uppercase">Today's Trips</div>
                  <div class="fs-4 fw-black text-contrast-dark" id="header-trips-count">0 Trips</div>
                  <span class="text-success small fw-bold" id="header-trips-badge"><i class="bi bi-check-circle-fill"></i> Ready for Duty</span>`
  );

  content = content.replace(
    `<div class="small text-contrast-muted fw-bold text-uppercase">Today's Earnings</div>
                  <div class="fs-4 fw-black text-success" id="header-earnings-val">₹840.00</div>
                  <span class="text-contrast-medium small fw-bold">+₹180 Surge</span>`,
    `<div class="small text-contrast-muted fw-bold text-uppercase">Today's Earnings</div>
                  <div class="fs-4 fw-black text-success" id="header-earnings-val">₹0.00</div>
                  <span class="text-contrast-medium small fw-bold" id="header-surge-badge">+₹0 Surge</span>`
  );

  content = content.replace(
    `<div class="small text-contrast-muted fw-bold text-uppercase">Rider Rating</div>
                  <div class="fs-4 fw-black text-warning"><i class="bi bi-star-fill me-1"></i>4.89</div>
                  <span class="text-contrast-medium small fw-bold">340 Reviews</span>`,
    `<div class="small text-contrast-muted fw-bold text-uppercase">Rider Rating</div>
                  <div class="fs-4 fw-black text-warning"><i class="bi bi-star-fill me-1"></i><span id="header-rating-val">5.0</span></div>
                  <span class="text-contrast-medium small fw-bold" id="header-reviews-count">New Hero (0 Reviews)</span>`
  );

  // 2. Nav Pocket Balance default
  content = content.replace(
    `<span id="nav-pocket-balance" class="fw-black text-success fs-6">₹840.00</span>`,
    `<span id="nav-pocket-balance" class="fw-black text-success fs-6">₹0.00</span>`
  );

  // 3. Tab 2 Wallet Breakdown
  content = content.replace(
    `<span class="text-white-50 text-uppercase small fw-bold">FoodWala Rider Wallet</span>
                <div class="display-4 fw-black text-white mt-1 mb-3">₹840.00</div>`,
    `<span class="text-white-50 text-uppercase small fw-bold">FoodWala Rider Wallet</span>
                <div class="display-4 fw-black text-white mt-1 mb-3" id="wallet-big-balance">₹0.00</div>`
  );

  content = content.replace(
    `<span>Base Delivery Pay:</span>
                    <span class="text-white fw-bold">₹450.00</span>`,
    `<span>Base Delivery Pay:</span>
                    <span class="text-white fw-bold" id="wallet-base-pay">₹0.00</span>`
  );

  content = content.replace(
    `<span>Distance Allowance:</span>
                    <span class="text-white fw-bold">₹180.00</span>`,
    `<span>Distance Allowance:</span>
                    <span class="text-white fw-bold" id="wallet-dist-pay">₹0.00</span>`
  );

  content = content.replace(
    `<span>Surge & Peak Incentives:</span>
                    <span class="text-warning fw-bold">+₹130.00</span>`,
    `<span>Surge & Peak Incentives:</span>
                    <span class="text-warning fw-bold" id="wallet-surge-pay">+₹0.00</span>`
  );

  content = content.replace(
    `<span>Customer Tips:</span>
                    <span class="text-success fw-bold">+₹80.00</span>`,
    `<span>Customer Tips:</span>
                    <span class="text-success fw-bold" id="wallet-tips-pay">+₹0.00</span>`
  );

  content = content.replace(
    `<h5 class="fw-black text-contrast-dark mb-0">Completed Trips Today (9 Orders)</h5>`,
    `<h5 class="fw-black text-contrast-dark mb-0" id="completed-trips-heading">Completed Trips Today (0 Orders)</h5>`
  );

  // Give ID to completed trips list group
  content = content.replace(
    `<div class="list-group list-group-flush border rounded-3 overflow-hidden">`,
    `<div class="list-group list-group-flush border rounded-3 overflow-hidden" id="completed-trips-list">`
  );

  // 4. Withdraw Modal
  content = content.replace(
    `<span class="text-contrast-muted small fw-bold">Available Balance</span>
            <div class="display-5 fw-black text-success">₹840.00</div>`,
    `<span class="text-contrast-muted small fw-bold">Available Balance</span>
            <div class="display-5 fw-black text-success" id="withdraw-available-bal">₹0.00</div>`
  );

  content = content.replace(
    `<input type="number" class="form-control rounded-pill px-3 py-2 fw-bold text-dark" value="840" id="withdraw-amount-input">`,
    `<input type="number" class="form-control rounded-pill px-3 py-2 fw-bold text-dark" value="0" id="withdraw-amount-input">`
  );

  // 5. Inject partner metrics management in JS
  const targetScriptSpot = `// Populate partner profile
      const partnerName = currentUser.name || currentUser.username || 'Kiran Kumar';`;

  const newScriptBlock = `// --- DYNAMIC PARTNER METRICS INITIALIZER (Solves New User 9-Trip & ₹840 Bug) ---
      function getPartnerStorageKey(user) {
        const identifier = (user && (user.userId || user.id || user.phone || user.email)) || 'default';
        return 'foodwala_partner_metrics_' + identifier;
      }

      function initPartnerMetrics(user) {
        const storageKey = getPartnerStorageKey(user);
        const email = ((user && user.email) || '').toLowerCase();
        const isSeedDemoPartner = email === 'deliveryfoodwala@gmail.com' || email.includes('demo');

        let metrics = null;
        try {
          const raw = localStorage.getItem(storageKey);
          if (raw) metrics = JSON.parse(raw);
        } catch(e) {}

        if (!metrics) {
          if (isSeedDemoPartner) {
            // Seed Demo Hero (deliveryfoodwala@gmail.com)
            metrics = {
              tripsCount: 9,
              todayEarnings: 840,
              basePay: 450,
              distPay: 180,
              surgePay: 130,
              tipsPay: 80,
              rating: 4.89,
              reviewsCount: 340,
              trips: [
                { tripId: 'TRIP-908', store: 'Meghana Foods', amount: 85, time: '15 mins ago', route: 'Koramangala to Bellandur • 3.4 km' },
                { tripId: 'TRIP-907', store: 'Vidyarthi Bhavan', amount: 95, time: '1 hr ago', route: 'Basavanagudi to Jayanagar • 4.1 km' },
                { tripId: 'TRIP-906', store: 'Truffles', amount: 75, time: '2 hrs ago', route: 'St. Marks Rd to Indiranagar • 2.8 km' },
                { tripId: 'TRIP-905', store: 'Empire Restaurant', amount: 110, time: '3 hrs ago', route: 'Indiranagar to Domlur • 4.5 km' }
              ]
            };
          } else {
            // NEW DELIVERY HERO: Clean Zero-State Starting Metrics!
            metrics = {
              tripsCount: 0,
              todayEarnings: 0,
              basePay: 0,
              distPay: 0,
              surgePay: 0,
              tipsPay: 0,
              rating: 5.0,
              reviewsCount: 0,
              trips: []
            };
          }
          try {
            localStorage.setItem(storageKey, JSON.stringify(metrics));
          } catch(e) {}
        }
        return metrics;
      }

      function renderPartnerMetrics(metrics, user) {
        const tripsCount = Number(metrics.tripsCount || 0);
        const earnings = Number(metrics.todayEarnings || 0).toFixed(2);
        const basePay = Number(metrics.basePay || 0).toFixed(2);
        const distPay = Number(metrics.distPay || 0).toFixed(2);
        const surgePay = Number(metrics.surgePay || 0).toFixed(2);
        const tipsPay = Number(metrics.tipsPay || 0).toFixed(2);
        const rating = Number(metrics.rating || 5.0).toFixed(1);
        const reviewsCount = Number(metrics.reviewsCount || 0);

        const hTrips = document.getElementById('header-trips-count');
        if (hTrips) hTrips.textContent = tripsCount + ' Trips';

        const hBadge = document.getElementById('header-trips-badge');
        if (hBadge) {
          hBadge.innerHTML = tripsCount > 0 ? '<i class="bi bi-check-circle-fill"></i> 100% Completed' : '<i class="bi bi-check-circle-fill"></i> Ready for Duty';
        }

        const hEarn = document.getElementById('header-earnings-val');
        if (hEarn) hEarn.textContent = '₹' + earnings;

        const hSurge = document.getElementById('header-surge-badge');
        if (hSurge) hSurge.textContent = '+₹' + surgePay + ' Surge';

        const navPocket = document.getElementById('nav-pocket-balance');
        if (navPocket) navPocket.textContent = '₹' + earnings;

        const hRating = document.getElementById('header-rating-val');
        if (hRating) hRating.textContent = rating;

        const hReviews = document.getElementById('header-reviews-count');
        if (hReviews) {
          hReviews.textContent = reviewsCount > 0 ? reviewsCount + ' Reviews' : 'New Hero (0 Reviews)';
        }

        const wBal = document.getElementById('wallet-big-balance');
        if (wBal) wBal.textContent = '₹' + earnings;

        const wBase = document.getElementById('wallet-base-pay');
        if (wBase) wBase.textContent = '₹' + basePay;

        const wDist = document.getElementById('wallet-dist-pay');
        if (wDist) wDist.textContent = '₹' + distPay;

        const wSurge = document.getElementById('wallet-surge-pay');
        if (wSurge) wSurge.textContent = '+₹' + surgePay;

        const wTips = document.getElementById('wallet-tips-pay');
        if (wTips) wTips.textContent = '+₹' + tipsPay;

        const tripHead = document.getElementById('completed-trips-heading');
        if (tripHead) tripHead.textContent = 'Completed Trips Today (' + tripsCount + ' Orders)';

        const tripList = document.getElementById('completed-trips-list');
        if (tripList) {
          if (!metrics.trips || metrics.trips.length === 0) {
            tripList.innerHTML = '<div class="text-center py-5 px-3 bg-white">' +
              '<div class="fs-1 mb-2">🛵</div>' +
              '<h6 class="fw-black text-contrast-dark mb-1">No trips completed yet today</h6>' +
              '<p class="text-muted small mb-3">Welcome to the FoodWala Delivery Fleet! Stay online to receive nearby delivery dispatches.</p>' +
              '<span class="badge bg-success bg-opacity-10 text-success border border-success rounded-pill px-3 py-1.5 fw-bold">' +
              '<i class="bi bi-broadcast me-1"></i> Radar Active & Searching Orders' +
              '</span>' +
              '</div>';
          } else {
            tripList.innerHTML = metrics.trips.map(t => '<div class="list-group-item d-flex justify-content-between align-items-center py-3 bg-white">' +
              '<div class="d-flex align-items-center gap-3">' +
              '<span class="fs-3">🏪</span>' +
              '<div>' +
              '<div class="fw-black text-contrast-dark">' + t.store + ' (' + t.tripId + ')</div>' +
              '<small class="text-contrast-medium fw-semibold">' + (t.route || 'Bengaluru Route') + ' • ' + (t.time || 'Today') + '</small>' +
              '</div>' +
              '</div>' +
              '<div class="text-end">' +
              '<div class="fw-black text-success fs-5">+₹' + Number(t.amount).toFixed(2) + '</div>' +
              '<span class="badge bg-success text-white small">Paid</span>' +
              '</div>' +
              '</div>').join('');
          }
        }

        const wAvail = document.getElementById('withdraw-available-bal');
        if (wAvail) wAvail.textContent = '₹' + earnings;

        const wInput = document.getElementById('withdraw-amount-input');
        if (wInput) wInput.value = Math.max(0, Math.floor(Number(earnings)));

        const upiInput = document.getElementById('withdraw-upi-input');
        if (upiInput && user && user.phone) {
          upiInput.value = user.phone + '@upi';
        }
      }

      let currentPartnerMetrics = initPartnerMetrics(currentUser);
      renderPartnerMetrics(currentPartnerMetrics, currentUser);

      // Populate partner profile
      const partnerName = currentUser.name || currentUser.username || 'Kiran Kumar';`;

  content = content.replace(targetScriptSpot, newScriptBlock);

  // Update OTP submission to increment dynamic metrics
  const oldSubmitOtp = `// Update Wallet Balance
        const pocket = document.getElementById('nav-pocket-balance');
        const headerEarn = document.getElementById('header-earnings-val');
        pocket.textContent = '₹925.00';
        headerEarn.textContent = '₹925.00';`;

  const newSubmitOtp = `// Update dynamic partner metrics
        currentPartnerMetrics.tripsCount = (currentPartnerMetrics.tripsCount || 0) + 1;
        currentPartnerMetrics.todayEarnings = (currentPartnerMetrics.todayEarnings || 0) + 85.00;
        currentPartnerMetrics.basePay = (currentPartnerMetrics.basePay || 0) + 65.00;
        currentPartnerMetrics.surgePay = (currentPartnerMetrics.surgePay || 0) + 20.00;
        if (!Array.isArray(currentPartnerMetrics.trips)) currentPartnerMetrics.trips = [];
        currentPartnerMetrics.trips.unshift({
          tripId: 'TRIP-' + Math.floor(100 + Math.random() * 900),
          store: 'Meghana Foods',
          amount: 85.00,
          time: 'Just now',
          route: 'Koramangala to Bellandur • 3.4 km'
        });
        try {
          localStorage.setItem(getPartnerStorageKey(currentUser), JSON.stringify(currentPartnerMetrics));
        } catch(e) {}
        renderPartnerMetrics(currentPartnerMetrics, currentUser);`;

  content = content.replace(oldSubmitOtp, newSubmitOtp);

  // Update Withdraw to zero out dynamic earnings
  const oldWithdraw = `document.getElementById("nav-pocket-balance").textContent = '₹0.00';
        document.getElementById('header-earnings-val').textContent = '₹0.00';`;

  const newWithdraw = `currentPartnerMetrics.todayEarnings = 0;
        try {
          localStorage.setItem(getPartnerStorageKey(currentUser), JSON.stringify(currentPartnerMetrics));
        } catch(e) {}
        renderPartnerMetrics(currentPartnerMetrics, currentUser);`;

  content = content.replace(oldWithdraw, newWithdraw);

  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Successfully patched partner metrics in:', filePath);
});

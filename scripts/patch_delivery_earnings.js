const fs = require('fs');
const path = require('path');

const serverFile = 'D:/FoodWala_Eclipse_Project/server/server.js';
let content = fs.readFileSync(serverFile, 'utf8');

const regex = /app\.get\('\/api\/delivery\/earnings'[\s\S]*?res\.json\(\{[\s\S]*?wallet: \{[\s\S]*?todayEarnings: 840\.00[\s\S]*?\}\);\s*\}\s*catch\s*\(err\)\s*\{[\s\S]*?\}\s*\}\);/;

const replacement = `app.get('/api/delivery/earnings', requireDeliveryPartner, async (req, res) => {
  try {
    const isSeedDemoPartner = req.user && (req.user.email === 'deliveryfoodwala@gmail.com' || (req.user.email || '').includes('demo'));

    if (isSeedDemoPartner) {
      return res.json({
        success: true,
        wallet: {
          todayEarnings: 840.00,
          todayTrips: 9,
          basePay: 450.00,
          distancePay: 180.00,
          surgeBonus: 130.00,
          tips: 80.00,
          weeklyTotal: 5620.00,
          weeklyTrips: 64,
          onTimeRate: 98.4,
          acceptanceRate: 96.0,
          rating: 4.89,
          recentTrips: [
            { tripId: 'TRIP-908', store: 'Meghana Foods', amount: 85, time: '15 mins ago', status: 'COMPLETED' },
            { tripId: 'TRIP-907', store: 'Vidyarthi Bhavan', amount: 95, time: '1 hr ago', status: 'COMPLETED' },
            { tripId: 'TRIP-906', store: 'Truffles', amount: 75, time: '2 hrs ago', status: 'COMPLETED' },
            { tripId: 'TRIP-905', store: 'Empire Restaurant', amount: 110, time: '3 hrs ago', status: 'COMPLETED' }
          ]
        }
      });
    }

    // Default for newly registered delivery partner accounts
    res.json({
      success: true,
      wallet: {
        todayEarnings: 0.00,
        todayTrips: 0,
        basePay: 0.00,
        distancePay: 0.00,
        surgeBonus: 0.00,
        tips: 0.00,
        weeklyTotal: 0.00,
        weeklyTrips: 0,
        onTimeRate: 100.0,
        acceptanceRate: 100.0,
        rating: 5.0,
        recentTrips: []
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});`;

if (regex.test(content)) {
  content = content.replace(regex, replacement);
  fs.writeFileSync(serverFile, content, 'utf8');
  console.log('Successfully patched server.js /api/delivery/earnings route!');
} else {
  console.error('Regex pattern not matched in server.js');
}

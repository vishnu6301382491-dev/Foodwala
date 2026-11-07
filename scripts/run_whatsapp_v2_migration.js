/**
 * scripts/run_whatsapp_v2_migration.js
 * Applies WhatsApp V2 Schema Additions & FAQ Seeds
 */

const fs = require('fs');
const path = require('path');
const db = require('../server/db');

async function runMigration() {
  console.log('🔄 Running WhatsApp V2 Migration...');
  const sqlPath = path.resolve(__dirname, '../database/whatsapp_v2_migration.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');

  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  for (const statement of statements) {
    console.log('  Executing:', statement.substring(0, 50).replace(/\s+/g, ' ') + '...');
    await db.query(statement);
  }

  // Check columns on whatsapp_messages
  const [cols] = await db.query('DESCRIBE whatsapp_messages');
  const colNames = cols.map(c => c.Field);

  if (!colNames.includes('latency_ms')) {
    console.log('  Adding latency_ms to whatsapp_messages...');
    await db.query('ALTER TABLE whatsapp_messages ADD COLUMN latency_ms INT DEFAULT 0 AFTER delivery_status');
  }

  if (!colNames.includes('user_id')) {
    console.log('  Adding user_id to whatsapp_messages...');
    await db.query('ALTER TABLE whatsapp_messages ADD COLUMN user_id INT DEFAULT NULL AFTER conversation_id');
  }

  // Ensure index on orders(customer_phone, order_date)
  try {
    const [indexes] = await db.query('SHOW INDEX FROM orders WHERE Key_name = "idx_orders_phone_date"');
    if (indexes.length === 0) {
      console.log('  Adding idx_orders_phone_date to orders...');
      await db.query('CREATE INDEX idx_orders_phone_date ON orders (customer_phone, order_date)');
    }
  } catch (e) {
    console.warn('  Index check warning on orders:', e.message);
  }

  // Seed standard FAQs if empty
  const [existingFaq] = await db.query('SELECT COUNT(*) as count FROM faq');
  if (existingFaq[0].count === 0) {
    console.log('  Seeding FAQs into faq table...');
    const faqs = [
      {
        intent: 'cancellation_policy',
        variants: JSON.stringify(['cancel order', 'cancellation policy', 'can i cancel', 'how to cancel', 'order cancellation']),
        answer_en: '📋 *FoodWala Cancellation Policy (Instant Cancellation):*\n\nOrders can be cancelled free of charge within *60 seconds* of placement for a *100% instant refund* before the restaurant begins preparation. Once confirmed and in preparation, cancellations cannot be accepted to prevent food wastage.',
        answer_hi: 'ऑर्डर देने के 60 सेकंड के भीतर किचन द्वारा तैयारी शुरू करने से पहले आप ऑर्डर मुफ्त में रद्द कर सकते हैं।',
        answer_te: 'కిచెన్ తయారీ ప్రారంభించడానికి ముందు 60 సెకన్లలోపు ఆర్డర్‌ను ఉచితంగా రద్దు చేసుకోవచ్చు.',
        answer_ta: 'சமையலறை தயாரிப்பை தொடங்குவதற்கு முன் 60 வினாடிகளுக்குள் ஆர்டரை இலவசமாக ரத்து செய்யலாம்.',
        answer_kn: 'ಕಿಚನ್ ಸಿದ್ಧತೆ ಪ್ರಾರಂಭಿಸುವ ಮೊದಲು 60 ಸೆಕೆಂಡುಗಳಲ್ಲಿ ಆರ್ಡರ್ ಅನ್ನು ಉಚಿತವಾಗಿ ರದ್ದುಗೊಳಿಸಬಹುದು.'
      },
      {
        intent: 'refund_policy',
        variants: JSON.stringify(['refund', 'refund policy', 'money back', 'how long for refund', 'refund timeline']),
        answer_en: 'Approved refunds are automatically processed back to your original payment method: UPI refunds reflect within 2 to 4 hours, and Card/NetBanking refunds take 3 to 5 business days.',
        answer_hi: 'स्वीकृत रिफंड स्वतः आपके मूल भुगतान खाते में भेजे जाते हैं: यूपीआई 2-4 घंटे और कार्ड/नेटबैंकिंग 3-5 कार्यदिवस।',
        answer_te: 'ఆమోదించబడిన రీఫండ్‌లు మీ ఒరిజినల్ పేమెంట్ పద్ధతికి క్రెడిట్ అవుతాయి: UPI 2-4 గంటలు, కార్డ్ 3-5 పనిదినాలు.',
        answer_ta: 'அங்கீகரிக்கப்பட்ட ரீஃபண்டுகள் உங்கள் அசல் கட்டண கணக்கிற்கு திருப்பி அனுப்பப்படும்: UPI 2-4 மணிநேரம், கார்டு 3-5 வணிக நாட்கள்.',
        answer_kn: 'ಅನುಮೋದಿತ ಮರುಪಾವತಿಗಳು ನಿಮ್ಮ ಮೂಲ ಖಾತೆಗೆ ಕ್ರೆಡಿಟ್ ಆಗುತ್ತವೆ: UPI 2-4 ಗಂಟೆಗಳು, ಕಾರ್ಡ್ 3-5 ವ್ಯವಹಾರ ದಿನಗಳು.'
      },
      {
        intent: 'delivery_charges',
        variants: JSON.stringify(['delivery fee', 'delivery charges', 'shipping cost', 'free delivery', 'minimum order']),
        answer_en: 'Standard delivery is ₹30 for orders below ₹299. All orders above ₹299 enjoy automatic FREE delivery across Bengaluru!',
        answer_hi: '₹299 से कम के ऑर्डर पर ₹30 डिलीवरी शुल्क है। ₹299 से अधिक के सभी ऑर्डर पर पूरे बेंगलुरु में मुफ़्त डिलीवरी उपलब्ध है!',
        answer_te: '₹299 లోపు ఆర్డర్లకు డెలివరీ ఛార్జీ ₹30. ₹299 పైన ఉన్న అన్ని ఆర్డర్లకు బెంగళూరు అంతటా ఉచిత డెలివరీ లభిస్తుంది!',
        answer_ta: '₹299க்கு குறைவான ஆர்டர்களுக்கு டெலிவரி கட்டணம் ₹30. ₹299க்கு மேற்பட்ட ஆர்டர்களுக்கு இலவச டெலிவரி!',
        answer_kn: '₹299 ಕ್ಕಿಂತ ಕಡಿಮೆ ಆರ್ಡರ್‌ಗಳಿಗೆ ಡೆಲಿವರಿ ಶುಲ್ಕ ₹30. ₹299 ಕ್ಕಿಂತ ಹೆಚ್ಚಿನ ಎಲ್ಲಾ ಆರ್ಡರ್‌ಗಳಿಗೆ ಉಚಿತ ಡೆಲಿವರಿ!'
      },
      {
        intent: 'operating_hours',
        variants: JSON.stringify(['timings', 'opening time', 'closing time', 'are you open', 'operating hours', 'midnight delivery']),
        answer_en: 'FoodWala partner restaurants are open daily from 7:00 AM to 11:30 PM. Select cloud kitchens operate late night until 2:00 AM in Koramangala and Indiranagar.',
        answer_hi: 'फूडवाला पार्टनर रेस्टोरेंट प्रतिदिन सुबह 7:00 बजे से रात 11:30 बजे तक खुले रहते हैं।',
        answer_te: 'ఫుడ్‌వాలా రెస్టారెంట్లు ప్రతిరోజూ ఉదయం 7:00 నుండి రాత్రి 11:30 వరకు తెరిచి ఉంటాయి.',
        answer_ta: 'ஃபுட்வாலா உணவகங்கள் தினமும் காலை 7:00 முதல் இரவு 11:30 வரை திறந்திருக்கும்.',
        answer_kn: 'ಫುಡ್‌ವಾಲಾ ರೆಸ್ಟೋರೆಂಟ್‌ಗಳು ಪ್ರತಿದಿನ ಬೆಳಗ್ಗೆ 7:00 ರಿಂದ ರಾತ್ರಿ 11:30 ರವರೆಗೆ ತೆರೆದಿರುತ್ತವೆ.'
      },
      {
        intent: 'hygiene_safety',
        variants: JSON.stringify(['hygiene', 'safety', 'cleanliness', 'fssai', 'food quality']),
        answer_en: 'All FoodWala partner restaurants are 100% FSSAI-certified, follow strict sanitization protocols, and use tamper-evident packaging for fresh and hygienic delivery.',
        answer_hi: 'सभी फूडवाला पार्टनर रेस्टोरेंट 100% FSSAI प्रमाणित हैं और स्वच्छता के कड़े नियमों का पालन करते हैं।',
        answer_te: 'అన్ని ఫుడ్‌వాలా రెస్టారెంట్లు 100% FSSAI సర్టిఫైడ్ చేయబడినవి మరియు పరిశుభ్రమైన ప్యాకింగ్ ఉపయోగిస్తాయి.',
        answer_ta: 'அனைத்து ஃபுட்வாலா உணவகங்களும் 100% FSSAI சான்றிதழ் பெற்றவை.',
        answer_kn: 'ಎಲ್ಲಾ ಫುಡ್‌ವಾಲಾ ರೆಸ್ಟೋರೆಂಟ್‌ಗಳು 100% FSSAI ಪ್ರಮಾಣೀಕೃತವಾಗಿವೆ.'
      },
      {
        intent: 'payment_methods',
        variants: JSON.stringify(['payment options', 'how to pay', 'cod', 'cash on delivery', 'upi payment', 'credit card']),
        answer_en: 'We accept Cash on Delivery (COD), UPI (GPay, PhonePe, Paytm), Credit/Debit Cards, and Net Banking via secure Razorpay checkout.',
        answer_hi: 'हम कैश ऑन डिलीवरी (COD), UPI (GPay, PhonePe), क्रेडिट/डेबिट कार्ड और नेट बैंकिंग स्वीकार करते हैं।',
        answer_te: 'మేము క్యాష్ ఆన్ డెలివరీ (COD), UPI, క్రెడిట్/డెబిట్ కార్డులను అంగీకరిస్తాము.',
        answer_ta: 'நாங்கள் கேஷ் ஆன் டெலிவரி (COD), UPI மற்றும் கார்டு கட்டணங்களை ஏற்றுக்கொள்கிறோம்.',
        answer_kn: 'ನಾವು ಕ್ಯಾಶ್ ಆನ್ ಡೆಲಿವರಿ (COD), UPI ಮತ್ತು ಕಾರ್ಡ್‌ಗಳನ್ನು ಸ್ವೀಕರಿಸುತ್ತೇವೆ.'
      }
    ];

    for (const f of faqs) {
      await db.query(
        'INSERT INTO faq (intent, question_variants_json, answer_en, answer_hi, answer_te, answer_ta, answer_kn, active) VALUES (?, ?, ?, ?, ?, ?, ?, 1)',
        [f.intent, f.variants, f.answer_en, f.answer_hi, f.answer_te, f.answer_ta, f.answer_kn]
      );
    }
    console.log(`  Inserted ${faqs.length} FAQ entries.`);
  }

  console.log('✅ WhatsApp V2 Migration completed successfully!');
  process.exit(0);
}

runMigration().catch(err => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});

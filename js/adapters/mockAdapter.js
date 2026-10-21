/**
 * FoodWala Mock Data & Authentication Adapter (mockAdapter.js)
 * 
 * Runs 100% in-browser using localStorage and local JSON files.
 * Zero external backend required. Fully compliant with GitHub Pages.
 */

(function (window) {
  'use strict';

  window.FoodWalaAdapters = window.FoodWalaAdapters || {};

  const STORAGE_KEYS = {
    MOCK_USERS: 'foodwala_mock_users',
    CURRENT_USER: 'foodwala_current_user',
    AUTH_TOKEN: 'foodwala_auth_token',
    ACTIVE_OTP: 'foodwala_mock_active_otp',
    LOGIN_HISTORY: 'foodwala_mock_login_history',
    MOCK_ORDERS: 'foodwala_mock_orders',
    MOCK_ADDRESSES: 'foodwala_mock_addresses',
    RESTAURANTS_CACHE: 'foodwala_cache_restaurants_list',
    CATEGORIES_CACHE: 'foodwala_cache_categories_list',
    MENU_CACHE_PREFIX: 'foodwala_cache_menu_rest_'
  };

  // Safe relative path resolver
  function resolveDataPath(relPath) {
    if (typeof window !== 'undefined' && window.location) {
      const cleanRel = relPath.replace(/^\.?\//, '');
      const pathname = window.location.pathname || '';
      const baseDir = pathname.substring(0, pathname.lastIndexOf('/') + 1);
      return `${baseDir}${cleanRel}`;
    }
    return `./${relPath.replace(/^\.?\//, '')}`;
  }

  function getLocal(key, defaultVal) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : defaultVal;
    } catch (e) {
      return defaultVal;
    }
  }

  function setLocal(key, val) {
    try {
      localStorage.setItem(key, JSON.stringify(val));
    } catch (e) {}
  }

  function normalizePhone(rawPhone) {
    if (!rawPhone || typeof rawPhone !== 'string') return null;
    const digits = rawPhone.replace(/\D/g, '');
    if (digits.startsWith('91') && digits.length === 12 && /^[6-9]/.test(digits.substring(2))) {
      return digits.substring(2);
    }
    if (digits.startsWith('0') && digits.length === 11 && /^[6-9]/.test(digits.substring(1))) {
      return digits.substring(1);
    }
    if (digits.length === 10 && /^[6-9]/.test(digits)) {
      return digits;
    }
    return null;
  }

  // Simple deterministic hash for mock password storage (never plain text)
  function mockHash(str) {
    let hash = 0;
    const s = String(str) + '_foodwala_mock_salt_2026';
    for (let i = 0; i < s.length; i++) {
      hash = ((hash << 5) - hash) + s.charCodeAt(i);
      hash |= 0;
    }
    return 'm_hash_' + Math.abs(hash).toString(16) + '_secure';
  }

  // FoodWala Enterprise: Registry of all 105 Restaurant Managers
  const ALL_RESTAURANT_MANAGERS = [{"id":1,"name":"Central Tiffin Room (CTR) - Shri Sagar","email":"centraltiffinroomshrisagar@gmail.com","area":"Malleshwaram","phone":"8023344838"},{"id":2,"name":"Vidyarthi Bhavan","email":"vidyarthibhavan@gmail.com","area":"Basavanagudi","phone":"8026677588"},{"id":3,"name":"Mavalli Tiffin Room (MTR)","email":"mavallitiffinroom@gmail.com","area":"Lalbagh","phone":"8022220022"},{"id":4,"name":"Corner House Ice Cream","email":"cornerhouseicecream@gmail.com","area":"Jayanagar","phone":"8026633456"},{"id":5,"name":"Shivaji Military Hotel","email":"shivajimilitaryhotel@gmail.com","area":"Jayanagar","phone":"9986356789"},{"id":6,"name":"Brahmin's Coffee Bar","email":"brahminscoffeebar@gmail.com","area":"Basavanagudi","phone":"8026601234"},{"id":7,"name":"Meghana Foods","email":"meghanafood@gmail.com","area":"Koramangala","phone":"8041105555"},{"id":8,"name":"Truffles","email":"truffles@gmail.com","area":"Koramangala","phone":"8041466565"},{"id":9,"name":"Veena Stores","email":"veenastores@gmail.com","area":"Malleshwaram","phone":"8023344839"},{"id":10,"name":"Halli Mane","email":"hallimane@gmail.com","area":"Malleshwaram","phone":"8041125678"},{"id":11,"name":"Janata Hotel","email":"janatahotel@gmail.com","area":"Malleshwaram","phone":"8023341122"},{"id":12,"name":"Sri Raghavendra Stores","email":"sriraghavendrastores@gmail.com","area":"Malleshwaram","phone":"8023447890"},{"id":13,"name":"Nalapaka","email":"nalapaka@gmail.com","area":"Rajajinagar","phone":"8023154567"},{"id":14,"name":"Paakashala","email":"paakashala@gmail.com","area":"Rajajinagar","phone":"8023129988"},{"id":15,"name":"Taaza Thindi","email":"taazathindi@gmail.com","area":"Jayanagar","phone":"8040992233"},{"id":16,"name":"Maiyas","email":"maiyas@gmail.com","area":"Jayanagar","phone":"8026564455"},{"id":17,"name":"Kamat Bugle Rock","email":"kamatbuglerock@gmail.com","area":"Basavanagudi","phone":"8026607788"},{"id":18,"name":"SLV Corner Restaurant","email":"slvcornerrestaurant@gmail.com","area":"Basavanagudi","phone":"8026673344"},{"id":19,"name":"VB Bakery","email":"vbbakery@gmail.com","area":"Basavanagudi","phone":"8026678899"},{"id":20,"name":"VV Puram Food Street","email":"vvpuramfoodstreet@gmail.com","area":"Basavanagudi","phone":"8026670011"},{"id":21,"name":"Chinita Real Mexican Food","email":"chinitarealmexicanfood@gmail.com","area":"Koramangala","phone":"8041103456"},{"id":22,"name":"The Hole in the Wall Cafe","email":"holeinwallcafe@gmail.com","area":"Koramangala","phone":"8040949494"},{"id":23,"name":"Nagarjuna - Koramangala","email":"nagarjunakoramangala@gmail.com","area":"Koramangala","phone":"8041100000"},{"id":24,"name":"Anjappar Chettinad Restaurant","email":"anjapparchettinadrestaurant@gmail.com","area":"Koramangala","phone":"8041218877"},{"id":25,"name":"Onesta - Koramangala","email":"onestakoramangala@gmail.com","area":"Koramangala","phone":"8040906060"},{"id":26,"name":"Empire Restaurant - Koramangala","email":"empirerestaurantkoramangala@gmail.com","area":"Koramangala","phone":"8040414041"},{"id":27,"name":"Smoor Chocolates & Cafe","email":"smoorchocolatescafe@gmail.com","area":"Indiranagar","phone":"8049652929"},{"id":28,"name":"Toit Brewpub & Kitchen","email":"toitbrewpubkitchen@gmail.com","area":"Indiranagar","phone":"9019713388"},{"id":29,"name":"Glen's Bakehouse - Indiranagar","email":"glensbakehouseindiranagar@gmail.com","area":"Indiranagar","phone":"8041228989"},{"id":30,"name":"Daddy - Casual Dining","email":"daddycasualdining@gmail.com","area":"Indiranagar","phone":"9591499990"},{"id":31,"name":"Smoke House Deli - Indiranagar","email":"smokehousedeliindiranagar@gmail.com","area":"Indiranagar","phone":"8025200087"},{"id":32,"name":"Phobidden Fruit","email":"phobiddenfruit@gmail.com","area":"Indiranagar","phone":"8041255175"},{"id":33,"name":"Milano Ice Cream","email":"milanoicecream@gmail.com","area":"Indiranagar","phone":"8041485566"},{"id":34,"name":"Indiranagar Club Kitchen","email":"indiranagarclubkitchen@gmail.com","area":"Indiranagar","phone":"8025282233"},{"id":35,"name":"Broadway - The Gourmet Theatre","email":"broadwaygourmettheatre@gmail.com","area":"HSR Layout","phone":"8049653030"},{"id":36,"name":"Vasudev Adigas - HSR","email":"vasudevadigashsr@gmail.com","area":"HSR Layout","phone":"8025724455"},{"id":37,"name":"Third Wave Coffee - HSR","email":"thirdwavecoffeehsr@gmail.com","area":"HSR Layout","phone":"8043707070"},{"id":38,"name":"Mishmash Cafe","email":"mishmashcafe@gmail.com","area":"HSR Layout","phone":"8041148877"},{"id":39,"name":"Kritunga Restaurant - HSR","email":"kritungarestauranthsr@gmail.com","area":"HSR Layout","phone":"8042001122"},{"id":40,"name":"Gufha Restaurant","email":"gufharestaurant@gmail.com","area":"Jayanagar","phone":"8041808080"},{"id":41,"name":"The Yellow Submarine","email":"yellowsubmarine@gmail.com","area":"JP Nagar","phone":"8049652525"},{"id":42,"name":"Brahmin Tiffin Centre","email":"brahmintiffincentre@gmail.com","area":"JP Nagar","phone":"8026589988"},{"id":43,"name":"Udupi Grand - Banashankari","email":"udupigrandbanashankari@gmail.com","area":"Banashankari","phone":"8026712233"},{"id":44,"name":"Donne Biryani Mane","email":"donnebiryanimane@gmail.com","area":"Banashankari","phone":"8026795566"},{"id":45,"name":"Sri Krishna Sagar - JP Nagar","email":"srikrishnasagarjpnagar@gmail.com","area":"JP Nagar","phone":"8026591100"},{"id":46,"name":"Mani's Dum Biryani","email":"manisdumbiryani@gmail.com","area":"BTM Layout","phone":"8041109988"},{"id":47,"name":"Al Daaz","email":"aldaaz@gmail.com","area":"BTM Layout","phone":"8041517766"},{"id":48,"name":"Biryani Zone - BTM","email":"biryanizonebtm@gmail.com","area":"BTM Layout","phone":"8041403344"},{"id":49,"name":"Anand Sweets and Savouries","email":"anandsweetsandsavouries@gmail.com","area":"JP Nagar","phone":"8041207788"},{"id":50,"name":"Thalassery Restaurant","email":"thalasseryrestaurant@gmail.com","area":"Electronic City","phone":"8041108899"},{"id":51,"name":"Nandhana Palace - E-City","email":"nandhanapalaceecity@gmail.com","area":"Electronic City","phone":"8041237766"},{"id":52,"name":"Republic of Noodles","email":"republicofnoodles@gmail.com","area":"Electronic City","phone":"8044232323"},{"id":53,"name":"Silicon Dhaba","email":"silicondhaba@gmail.com","area":"Electronic City","phone":"8041123344"},{"id":54,"name":"Windmills Craftworks","email":"windmillscraftworks@gmail.com","area":"Whitefield","phone":"8880233322"},{"id":55,"name":"Herbs & Spices","email":"herbsspices@gmail.com","area":"Whitefield","phone":"8028451818"},{"id":56,"name":"The Bier Library","email":"bierlibrary@gmail.com","area":"Koramangala","phone":"9108180000"},{"id":57,"name":"Mainland China - Whitefield","email":"mainlandchinawhitefield@gmail.com","area":"Whitefield","phone":"8041155555"},{"id":58,"name":"California Burrito - Marathahalli","email":"californiaburritomarathahalli@gmail.com","area":"Marathahalli","phone":"8049652211"},{"id":59,"name":"The Fisherman's Wharf","email":"fishermanswharf@gmail.com","area":"Sarjapur Road","phone":"8049652828"},{"id":60,"name":"Byg Brewski Brewing Company","email":"bygbrewskibrewingcompany@gmail.com","area":"Sarjapur Road","phone":"8046809797"},{"id":61,"name":"Zoey's Pizzeria & Cafe","email":"zoeyspizzeriacafe@gmail.com","area":"Sarjapur Road","phone":"8041221100"},{"id":62,"name":"Chai Point - Bellandur","email":"chaipointbellandur@gmail.com","area":"Bellandur","phone":"8040998877"},{"id":63,"name":"Koshy's Restaurant","email":"koshysrestaurant@gmail.com","area":"MG Road","phone":"8022213793"},{"id":64,"name":"Nagarjuna - Residency Road","email":"nagarjunaresidencyroad@gmail.com","area":"Residency Road","phone":"8025559848"},{"id":65,"name":"The Only Place","email":"onlyplace@gmail.com","area":"Church Street","phone":"8025588676"},{"id":66,"name":"Matteo Coffea","email":"matteocoffea@gmail.com","area":"Church Street","phone":"8043336000"},{"id":67,"name":"Plan B - Castle Street","email":"planbcastlestreet@gmail.com","area":"Richmond Road","phone":"8880022005"},{"id":68,"name":"Ebony - Fine Dining","email":"ebonyfinedining@gmail.com","area":"MG Road","phone":"8041783344"},{"id":69,"name":"Albert Bakery","email":"albertbakery@gmail.com","area":"Frazer Town","phone":"9886165349"},{"id":70,"name":"Karama Restaurant","email":"karamarestaurant@gmail.com","area":"Frazer Town","phone":"8041109900"},{"id":71,"name":"Thom's Bakery","email":"thomsbakery@gmail.com","area":"Frazer Town","phone":"8025484455"},{"id":72,"name":"Nandi Upachar","email":"nandiupachar@gmail.com","area":"Hebbal","phone":"8023634455"},{"id":73,"name":"Arirang Korean Restaurant","email":"arirangkoreanrestaurant@gmail.com","area":"Kalyan Nagar","phone":"8041732581"},{"id":74,"name":"Once Upon a Flame","email":"onceuponaflame@gmail.com","area":"Kalyan Nagar","phone":"8041257788"},{"id":75,"name":"Chetty's Corner","email":"chettyscorner@gmail.com","area":"Vasanth Nagar","phone":"8023340011"},{"id":76,"name":"The Fatty Bao - Indiranagar","email":"fattybaoindiranagar@gmail.com","area":"Indiranagar","phone":"8044114499"},{"id":77,"name":"Sukh Sagar","email":"sukhsagar@gmail.com","area":"Majestic","phone":"8022262626"},{"id":78,"name":"Kamath Hotel - Majestic","email":"kamathhotelmajestic@gmail.com","area":"Majestic","phone":"8022874455"},{"id":79,"name":"SGS Non-Veg Gundu Pulav","email":"sgsnonveggundupulav@gmail.com","area":"Majestic","phone":"9845011223"},{"id":80,"name":"Sankey's Cafe","email":"sankeyscafe@gmail.com","area":"Sadashivanagar","phone":"8023617788"},{"id":81,"name":"Pavithra Paradise","email":"pavithraparadise@gmail.com","area":"Vijayanagar","phone":"8023301122"},{"id":82,"name":"Adyar Ananda Bhavan (A2B) - Vijayanagar","email":"adyaranandabhavanvijayanagar@gmail.com","area":"Vijayanagar","phone":"8023389988"},{"id":83,"name":"Hotel Janatha - Vijayanagar","email":"hoteljanathavijayanagar@gmail.com","area":"Vijayanagar","phone":"8023354433"},{"id":84,"name":"Navayuga Family Restaurant","email":"navayugafamilyrestaurant@gmail.com","area":"Majestic","phone":"8022254488"},{"id":85,"name":"Beijing Bites - Malleshwaram","email":"beijingbitesmalleshwaram@gmail.com","area":"Malleshwaram","phone":"8023468877"},{"id":86,"name":"Windsor Pub - Vasanth Nagar","email":"windsorpubvasanthnagar@gmail.com","area":"Vasanth Nagar","phone":"8041149223"},{"id":87,"name":"Savoury Restaurant - Frazer Town","email":"savouryrestaurantfrazertown@gmail.com","area":"Frazer Town","phone":"8025488899"},{"id":88,"name":"The Pizza Bakery - Indiranagar","email":"pizzabakeryindiranagar@gmail.com","area":"Indiranagar","phone":"8043748877"},{"id":89,"name":"Chulha Chauki Da Dhaba","email":"chulhachaukidadhaba@gmail.com","area":"Mahadevapura","phone":"8041203344"},{"id":90,"name":"Absolute Barbecues (AB's) - Marathahalli","email":"absolutebarbecuesmarathahalli@gmail.com","area":"Marathahalli","phone":"8049652580"},{"id":91,"name":"Pasta Street - Whitefield","email":"pastastreetwhitefield@gmail.com","area":"Whitefield","phone":"8040997788"},{"id":92,"name":"Zoey's Desserts & Bakes","email":"zoeysdessertsbakes@gmail.com","area":"Brookefield","phone":"8041128899"},{"id":93,"name":"Royal Andhra Spice - Yelahanka","email":"royalandhraspiceyelahanka@gmail.com","area":"Yelahanka","phone":"8028563344"},{"id":94,"name":"Arogya Aahaara","email":"arogyaaahaara@gmail.com","area":"Indiranagar","phone":"8041152233"},{"id":95,"name":"Cheesecakes by Smoor","email":"cheesecakesbysmoor@gmail.com","area":"Koramangala","phone":"8041205544"},{"id":96,"name":"Urban Solace - Cafe for the Soul","email":"urbansolacecafeforsoul@gmail.com","area":"Ulsoor","phone":"9845015518"},{"id":97,"name":"Domlur Club Kitchen","email":"domlurclubkitchen@gmail.com","area":"Domlur","phone":"8025353344"},{"id":98,"name":"Kabab Magic - Basavanagudi","email":"kababmagicbasavanagudi@gmail.com","area":"Basavanagudi","phone":"8026612233"},{"id":99,"name":"Goli Vada Pav No. 1","email":"golivadapavno1@gmail.com","area":"Shivajinagar","phone":"8025591122"},{"id":100,"name":"Hotel Fanoos - Johnson Market","email":"hotelfanoosjohnsonmarket@gmail.com","area":"Richmond Road","phone":"8022211445"},{"id":101,"name":"Suryawanshi - Maharashtrian","email":"suryawanshimaharashtrian@gmail.com","area":"Whitefield","phone":"8041103300"},{"id":102,"name":"Mezzeh Mediterranean Kitchen","email":"mezzehmediterraneankitchen@gmail.com","area":"Indiranagar","phone":"8041557788"},{"id":103,"name":"Madurai Idly Shop - Indiranagar","email":"maduraiidlyshopindiranagar@gmail.com","area":"Indiranagar","phone":"8041256677"},{"id":104,"name":"Leon's Burgers & Wings","email":"leonsburgerswings@gmail.com","area":"Koramangala","phone":"8041239900"},{"id":105,"name":"The Filter Coffee - Koramangala","email":"filtercoffeekoramangala@gmail.com","area":"Koramangala","phone":"8040993322"}];

  if (typeof window !== "undefined") {
    window.ALL_RESTAURANT_MANAGERS = ALL_RESTAURANT_MANAGERS;
  }

  function findRestaurantManager(identifier) {
    if (!identifier) return null;
    const clean = String(identifier).trim().toLowerCase();
    const isEmail = clean.includes('@');
    if (isEmail) {
      const exact = ALL_RESTAURANT_MANAGERS.find(m => m.email.toLowerCase() === clean);
      if (exact) return exact;
      const userPart = clean.split('@')[0].replace(/\bfoods\b/g, 'food').replace(/[^a-z0-9]/g, '');
      return ALL_RESTAURANT_MANAGERS.find(m => {
        const mgrPart = m.email.split('@')[0].replace(/\bfoods\b/g, 'food').replace(/[^a-z0-9]/g, '');
        return mgrPart === userPart || mgrPart.includes(userPart) || userPart.includes(mgrPart);
      });
    } else {
      const phoneDigits = clean.replace(/[^0-9]/g, '').slice(-10);
      if (phoneDigits) {
        return ALL_RESTAURANT_MANAGERS.find(m => {
          const mPhone = (m.phone || '').replace(/[^0-9]/g, '').slice(-10);
          return mPhone === phoneDigits || ('99' + String(m.id).padStart(8, '0')) === phoneDigits;
        });
      }
    }
    return null;
  }

  if (typeof window !== "undefined") {
    window.findRestaurantManager = findRestaurantManager;
  }

  // Pre-seed mock users if not present
  function initMockUsers() {
    let users = getLocal(STORAGE_KEYS.MOCK_USERS, null);
    
    const defaultAccounts = [
      {
        userId: 1,
        name: 'Vishnu Vardhan Reddy',
        username: 'VISHNU',
        email: 'vishnuvardhanreddych45@gmail.com',
        phone: '6301382491',
        role: 'customer',
        passwordHash: mockHash('Password@123'),
        address: 'Main Road, Lakshmi Narayana Layout, Bengaluru - 560037',
        memberSince: 'October 2026',
        failedAttempts: 0,
        lockedUntil: 0
      },
      {
        userId: 2,
        name: 'Rahul Sharma',
        username: 'customer',
        email: 'customer@foodwala.com',
        phone: '9876543210',
        role: 'customer',
        passwordHash: mockHash('Password@123'),
        address: 'Indiranagar, 100ft Road, Bengaluru - 560038',
        memberSince: 'March 2026',
        failedAttempts: 0,
        lockedUntil: 0
      },
      {
        userId: 3,
        name: 'FoodWala Administrator',
        username: 'admin',
        email: 'admin@foodwala.com',
        phone: '9876543222',
        role: 'admin',
        passwordHash: mockHash('Admin@123'),
        address: 'FoodWala HQ, MG Road, Bengaluru, Karnataka - 560001',
        memberSince: 'January 2026',
        failedAttempts: 0,
        lockedUntil: 0
      },
      {
        userId: 4,
        name: 'Administrator',
        username: 'admin_example',
        email: 'admin@example.com',
        phone: '9876543229',
        role: 'admin',
        passwordHash: mockHash('password'),
        address: 'FoodWala HQ, MG Road, Bengaluru, Karnataka - 560001',
        memberSince: 'January 2026',
        failedAttempts: 0,
        lockedUntil: 0
      },
      {
        userId: 5,
        name: 'Kiran Kumar (Delivery Hero)',
        username: 'delivery_hero',
        email: 'deliveryfoodwala@gmail.com',
        phone: '9900000201',
        role: 'partner',
        passwordHash: mockHash('Vishnu@143'),
        address: 'Koramangala, Bengaluru',
        memberSince: 'March 2026',
        failedAttempts: 0,
        lockedUntil: 0
      },
      {
        userId: 102,
        name: 'FoodWala Super Admin',
        username: 'super_admin',
        email: 'adminfoodwala@gmail.com',
        phone: '9876543222',
        role: 'admin',
        passwordHash: mockHash('Vishnu@143'),
        address: 'FoodWala HQ, Bengaluru',
        memberSince: 'January 2026',
        failedAttempts: 0,
        lockedUntil: 0
      },
      {
        userId: 5,
        name: 'Ramesh Kumar (Delivery Partner)',
        username: 'delivery_partner',
        email: 'delivery@foodwala.com',
        phone: '9876543230',
        role: 'partner',
        passwordHash: mockHash('Partner@123'),
        address: 'Koramangala 5th Block, Bengaluru - 560095',
        memberSince: 'February 2026',
        failedAttempts: 0,
        lockedUntil: 0
      },
      {
        userId: 6,
        name: 'Vidyarthi Bhavan (Restaurant Manager)',
        username: 'restaurant_manager',
        email: 'restaurant@foodwala.com',
        phone: '9876543231',
        role: 'restaurant',
        passwordHash: mockHash('Restaurant@123'),
        address: 'Gandhi Bazaar, Basavanagudi, Bengaluru - 560004',
        memberSince: 'February 2026',
        failedAttempts: 0,
        lockedUntil: 0
      }
    ];


    // Auto-seed all 105 restaurant managers into mock directory
    if (typeof ALL_RESTAURANT_MANAGERS !== 'undefined' && Array.isArray(ALL_RESTAURANT_MANAGERS)) {
      for (const mgr of ALL_RESTAURANT_MANAGERS) {
        defaultAccounts.push({
          userId: 1000 + mgr.id,
          name: mgr.name + ' Manager',
          username: mgr.name + ' Manager',
          email: mgr.email.toLowerCase(),
          phone: mgr.phone ? mgr.phone.replace(/[^0-9]/g, '').slice(-10) : ('99' + String(mgr.id).padStart(8, '0')),
          role: 'restaurant',
          restaurantId: mgr.id,
          restaurant_id: mgr.id,
          restaurantName: mgr.name,
          passwordHash: mockHash('Vishnu@143'),
          address: mgr.area + ', Bengaluru',
          memberSince: 'October 2026',
          failedAttempts: 0,
          lockedUntil: 0
        });
      }
    }
    if (!users || !Array.isArray(users) || users.length === 0) {
      users = [...defaultAccounts];
      setLocal(STORAGE_KEYS.MOCK_USERS, users);
    } else {
      let changed = false;
      for (const def of defaultAccounts) {
        const idx = users.findIndex(u => (u.email || '').toLowerCase() === def.email.toLowerCase());
        if (idx === -1) {
          users.push(def);
          changed = true;
        } else {
          users[idx].passwordHash = def.passwordHash;
          users[idx].phone = def.phone;
          users[idx].role = def.role;
          users[idx].restaurantId = def.restaurantId || users[idx].restaurantId;
          users[idx].restaurant_id = def.restaurant_id || users[idx].restaurant_id;
          users[idx].restaurantName = def.restaurantName || users[idx].restaurantName;
          changed = true;
        }
      }
      if (changed) {
        setLocal(STORAGE_KEYS.MOCK_USERS, users);
      }
    }
    return users;
  }

  function logLoginAttempt(identifier, status, details = '') {
    const history = getLocal(STORAGE_KEYS.LOGIN_HISTORY, []);
    history.unshift({
      timestamp: new Date().toISOString(),
      identifier: identifier,
      status: status, // "SUCCESS" or "FAILED"
      details: details,
      ip: '127.0.0.1 (Browser Mock)'
    });
    setLocal(STORAGE_KEYS.LOGIN_HISTORY, history.slice(0, 100)); // Keep latest 100
  }

  // =======================================================================
  // MOCK ADAPTER IMPLEMENTATION
  // =======================================================================
  const mockAdapter = {
    name: 'mock',

    // 1. Health check (Always healthy in mock mode)
    checkHealth: async function () {
      return {
        status: 'ok',
        db: true,
        mode: 'mock',
        message: 'Mock adapter running locally in browser'
      };
    },

    // 2. Catalog: Restaurants
    getRestaurants: async function () {
      const cacheKey = STORAGE_KEYS.RESTAURANTS_CACHE;
      const cached = getLocal(cacheKey, null);
      if (cached && Array.isArray(cached) && cached.length >= 10) {
        return cached;
      }

      try {
        const res = await fetch(resolveDataPath('data/restaurants.json'));
        if (res.ok) {
          const list = await res.json();
          if (Array.isArray(list) && list.length > 0) {
            setLocal(cacheKey, list);
            return list;
          }
        }
      } catch (e) {}

      if (typeof window !== 'undefined' && window.FOODWALA_RESTAURANTS && window.FOODWALA_RESTAURANTS.length > 0) {
        return window.FOODWALA_RESTAURANTS;
      }
      return [];
    },

    // 3. Catalog: Categories
    getCategories: async function () {
      const cacheKey = STORAGE_KEYS.CATEGORIES_CACHE;
      const cached = getLocal(cacheKey, null);
      if (cached && Array.isArray(cached) && cached.length > 0) {
        return cached;
      }

      try {
        const res = await fetch(resolveDataPath('data/categories.json'));
        if (res.ok) {
          const list = await res.json();
          if (Array.isArray(list) && list.length > 0) {
            setLocal(cacheKey, list);
            return list;
          }
        }
      } catch (e) {}

      return [
        { id: 1, name: 'South Indian' },
        { id: 2, name: 'North Indian' },
        { id: 3, name: 'Biryani' },
        { id: 4, name: 'Burgers & Fast Food' },
        { id: 5, name: 'Desserts & Sweets' },
        { id: 6, name: 'Beverages' }
      ];
    },

    // 4. Catalog: Restaurant Menu
    getRestaurantMenu: async function (restaurantId) {
      const rId = parseInt(restaurantId, 10);

      // 1. Check if the manager customized this restaurant's menu
      const managerKey = 'foodwala_mock_restaurant_menu_' + rId;
      const managerMenu = getLocal(managerKey, null);
      if (managerMenu && Array.isArray(managerMenu) && managerMenu.length > 0) {
        return managerMenu;
      }

      const cacheKey = `${STORAGE_KEYS.MENU_CACHE_PREFIX}${rId}`;
      const cached = getLocal(cacheKey, null);
      if (cached && Array.isArray(cached) && cached.length > 0) {
        return cached;
      }

      let items = [];
      try {
        const res = await fetch(resolveDataPath(`data/menus/${rId}.json`));
        if (res.ok) {
          items = await res.json();
        }
      } catch (e) {}

      if (!items || items.length === 0) {
        try {
          const res = await fetch(resolveDataPath('data/menu-items.json'));
          if (res.ok) {
            const all = await res.json();
            items = all.filter(m => (m.restaurantId === rId || m.restaurant_id === rId));
          }
        } catch (e) {}
      }

      if (items && Array.isArray(items) && items.length > 0) {
        // Normalize fields for consistency across manager and customer views
        const normalized = items.map(it => ({
          ...it,
          id: it.id || it.menuId || it.menu_id,
          menuId: it.menuId || it.id || it.menu_id,
          menu_id: it.menu_id || it.menuId || it.id,
          restaurantId: rId,
          restaurant_id: rId,
          name: it.name || it.itemName || it.item_name,
          itemName: it.itemName || it.name || it.item_name,
          item_name: it.item_name || it.itemName || it.name,
          price: parseFloat(it.price) || 0,
          category: it.category || it.categoryName || it.category_name || 'Specialties',
          categoryName: it.categoryName || it.category || it.category_name || 'Specialties',
          category_name: it.category_name || it.categoryName || it.category || 'Specialties',
          isVeg: it.isVeg !== undefined ? Boolean(it.isVeg) : (it.is_veg !== undefined ? Boolean(it.is_veg) : true),
          is_veg: (it.isVeg !== undefined ? (it.isVeg ? 1 : 0) : (it.is_veg !== undefined ? (it.is_veg ? 1 : 0) : 1)),
          isAvailable: it.isAvailable !== undefined ? Boolean(it.isAvailable) : (it.is_available !== undefined ? Boolean(it.is_available) : true),
          is_available: (it.isAvailable !== undefined ? (it.isAvailable ? 1 : 0) : (it.is_available !== undefined ? (it.is_available ? 1 : 0) : 1)),
          imagePath: it.imagePath || it.image_path || it.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=300&q=75',
          image_path: it.image_path || it.imagePath || it.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=300&q=75'
        }));
        setLocal(cacheKey, normalized);
        setLocal(managerKey, normalized);
        return normalized;
      }

      return [];
    },

    // 5. Check Phone Availability
    checkPhone: async function (rawPhone) {
      const normalized = normalizePhone(rawPhone);
      if (!normalized) {
        return { available: false, error: 'Please enter a valid 10-digit mobile number.' };
      }
      const users = initMockUsers();
      const exists = users.some(u => normalizePhone(u.phone) === normalized);
      return { available: !exists, phone: normalized };
    },

    // 6. Send Mobile OTP
    sendOtp: async function (rawPhone) {
      const normalized = normalizePhone(rawPhone);
      if (!normalized) {
        return {
          success: false,
          error: 'INVALID_PHONE',
          message: 'Please enter a valid 10-digit mobile number starting with 6, 7, 8, or 9.'
        };
      }

      // Check 30-second resend limit
      const activeOtp = getLocal(STORAGE_KEYS.ACTIVE_OTP, null);
      if (activeOtp && activeOtp.phone === normalized && (Date.now() - activeOtp.sentAt) < 30000) {
        const waitSec = Math.ceil((30000 - (Date.now() - activeOtp.sentAt)) / 1000);
        return {
          success: false,
          error: 'RATE_LIMIT',
          message: `Please wait ${waitSec} seconds before requesting a new OTP.`
        };
      }

      // Generate 6-digit code
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = Date.now() + (5 * 60 * 1000); // 5 minutes validity

      setLocal(STORAGE_KEYS.ACTIVE_OTP, {
        phone: normalized,
        code: otpCode,
        sentAt: Date.now(),
        expiresAt: expiresAt,
        attempts: 0
      });

      // If DEMO_MODE is true, log OTP to console only (never in UI/toast)
      if (window.FOODWALA_CONFIG && window.FOODWALA_CONFIG.DEMO_MODE) {
        console.info(`%c[FoodWala Mock OTP]%c Code for +91 ${normalized}: %c${otpCode}%c (Valid for 5 mins)`,
          'color: #dc3545; font-weight: bold;', 'color: #333;', 'color: #0d6efd; font-weight: bold;', 'color: #333;');
      }

      return {
        success: true,
        message: 'OTP sent successfully to your mobile number.',
        phone: normalized,
        otp: otpCode,
        code: otpCode
      };
    },

    // 7. Verify OTP
    verifyOtp: async function (rawPhone, code) {
      const normalized = normalizePhone(rawPhone);
      const cleanCode = (code || '').trim();

      if (!normalized || cleanCode.length !== 6) {
        return { success: false, error: 'INVALID_CODE', message: 'Please enter a valid 6-digit verification code.' };
      }

      const activeOtp = getLocal(STORAGE_KEYS.ACTIVE_OTP, null);
      const isUniversalTestCode = (cleanCode === '123456');

      if (!isUniversalTestCode) {
        if (!activeOtp || activeOtp.phone !== normalized) {
          return { success: false, error: 'EXPIRED_OTP', message: 'No active OTP request found. Please request a new OTP.' };
        }

        if (Date.now() > activeOtp.expiresAt) {
          localStorage.removeItem(STORAGE_KEYS.ACTIVE_OTP);
          return { success: false, error: 'EXPIRED_OTP', message: 'OTP has expired. Please request a new code.' };
        }

        if (activeOtp.code !== cleanCode) {
          activeOtp.attempts = (activeOtp.attempts || 0) + 1;
          if (activeOtp.attempts >= 5) {
            localStorage.removeItem(STORAGE_KEYS.ACTIVE_OTP);
            return { success: false, error: 'MAX_ATTEMPTS', message: 'Too many incorrect attempts. Please request a new OTP.' };
          }
          setLocal(STORAGE_KEYS.ACTIVE_OTP, activeOtp);
          const rem = 5 - activeOtp.attempts;
          return { success: false, error: 'WRONG_OTP', message: `Incorrect OTP code. ${rem} attempt(s) remaining.` };
        }
      }

      // Successful verification
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_OTP);

      // Check if existing user
      const users = initMockUsers();
      const existing = users.find(u => normalizePhone(u.phone) === normalized);

      if (existing) {
        const token = 'mock_jwt_token_' + Date.now();
        localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
        setLocal(STORAGE_KEYS.CURRENT_USER, existing);
        logLoginAttempt(normalized, 'SUCCESS', 'Mobile OTP Login');
        window.dispatchEvent(new CustomEvent('foodwala:authChanged', { detail: existing }));
        return { success: true, isNewUser: false, user: existing, token: token };
      } else {
        // Return isNewUser = true so the client displays the Name input step
        return { success: true, isNewUser: true, phone: normalized };
      }
    },

    // 8. Register Mobile User (Name step after new phone OTP)
    registerMobile: async function (data) {
      const normalized = normalizePhone(data.phone);
      const cleanName = (data.name || '').replace(/<[^>]*>?/gm, '').trim();

      if (!cleanName || !normalized) {
        return { success: false, message: 'Your name is required to complete profile registration.' };
      }

      const users = initMockUsers();
      const newUser = {
        userId: users.length + 1,
        name: cleanName,
        username: cleanName,
        email: (data.email || '').trim().toLowerCase() || null,
        phone: normalized,
        role: 'customer',
        passwordHash: mockHash('MobileUser_' + Date.now()),
        address: (data.address || '').trim() || 'Bengaluru, Karnataka',
        memberSince: 'March 2026',
        failedAttempts: 0,
        lockedUntil: 0
      };

      users.push(newUser);
      setLocal(STORAGE_KEYS.MOCK_USERS, users);

      const token = 'mock_jwt_token_' + Date.now();
      localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
      setLocal(STORAGE_KEYS.CURRENT_USER, newUser);
      logLoginAttempt(normalized, 'SUCCESS', 'Mobile Profile Created');
      window.dispatchEvent(new CustomEvent('foodwala:authChanged', { detail: newUser }));

      return { success: true, user: newUser, token: token };
    },

    // 9. Standard Signup (register.html)
    signup: async function (data) {
      const cleanName = (data.name || data.username || '').replace(/<[^>]*>?/gm, '').trim();
      const cleanEmail = (data.email || '').trim().toLowerCase();
      const cleanPhone = normalizePhone(data.phone);
      const password = data.password || '';

      if (!cleanName || !cleanEmail || !password) {
        return { success: false, message: 'Name, email, and password are required.' };
      }

      // Password complexity: min 8, letters + numbers
      if (!/^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(password)) {
        return { success: false, message: 'Password must be at least 8 characters with both letters and numbers.' };
      }

      if (data.confirmPassword && password !== data.confirmPassword) {
        return { success: false, message: 'Passwords do not match.' };
      }

      const users = initMockUsers();

      // Check duplicates
      if (cleanPhone && users.some(u => normalizePhone(u.phone) === cleanPhone)) {
        return {
          success: false,
          status: 409,
          code: 'PHONE_EXISTS',
          phone: cleanPhone,
          message: 'This mobile number is already registered. Please login.'
        };
      }

      if (users.some(u => (u.email || '').toLowerCase() === cleanEmail)) {
        return {
          success: false,
          status: 409,
          code: 'EMAIL_EXISTS',
          email: cleanEmail,
          message: 'An account with this email address already exists. Please login.'
        };
      }

      // Create user
      const newUser = {
        userId: users.length + 1,
        name: cleanName,
        username: cleanName,
        email: cleanEmail,
        phone: cleanPhone,
        role: data.role || 'customer',
        passwordHash: mockHash(password),
        address: (data.address || '').trim() || 'Bengaluru, Karnataka',
        memberSince: 'March 2026',
        failedAttempts: 0,
        lockedUntil: 0
      };

      users.push(newUser);
      setLocal(STORAGE_KEYS.MOCK_USERS, users);

      const safeUser = {
        userId: newUser.userId,
        name: newUser.name,
        username: newUser.username,
        email: newUser.email,
        phone: newUser.phone,
        role: newUser.role,
        address: newUser.address,
        addresses: [],
        memberSince: newUser.memberSince
      };

      const token = 'mock_jwt_token_' + Date.now();
      localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
      setLocal(STORAGE_KEYS.CURRENT_USER, safeUser);
      logLoginAttempt(cleanEmail, 'SUCCESS', 'Email Registration');
      window.dispatchEvent(new CustomEvent('foodwala:authChanged', { detail: safeUser }));

      return { success: true, user: safeUser, token: token };
    },

    // 10. Login (Email or Phone + Password)
    login: async function (identifier, password) {
      const cleanId = (identifier || '').trim();
      if (!cleanId || !password) {
        return { success: false, message: 'Please enter your email or mobile number and password.' };
      }

      const isEmail = cleanId.includes('@');
      const cleanEmail = isEmail ? cleanId.toLowerCase() : null;
      const normalizedPhone = !isEmail ? normalizePhone(cleanId) : null;

      const users = initMockUsers();
      let userIndex = users.findIndex(u => {
        if (cleanEmail && (u.email || '').trim().toLowerCase() === cleanEmail) return true;
        if (normalizedPhone && normalizePhone(u.phone) === normalizedPhone) return true;
        return false;
      });


      // Dynamic fallback for any of the 105 restaurant managers
      if (userIndex === -1 && (cleanEmail || normalizedPhone) && typeof findRestaurantManager === 'function') {
        const mgr = findRestaurantManager(cleanEmail || normalizedPhone);
        if (mgr) {
          const newMgrUser = {
            userId: 1000 + mgr.id,
            name: mgr.name + ' Manager',
            username: mgr.name + ' Manager',
            email: mgr.email.toLowerCase(),
            phone: mgr.phone ? mgr.phone.replace(/[^0-9]/g, '').slice(-10) : ('99' + String(mgr.id).padStart(8, '0')),
            role: 'restaurant',
            restaurantId: mgr.id,
            restaurant_id: mgr.id,
            restaurantName: mgr.name,
            passwordHash: mockHash('Vishnu@143'),
            address: mgr.area + ', Bengaluru',
            memberSince: 'October 2026',
            failedAttempts: 0,
            lockedUntil: 0
          };
          users.push(newMgrUser);
          userIndex = users.length - 1;
          setLocal(STORAGE_KEYS.MOCK_USERS, users);
        }
      }
      // User not found -> Generic error to prevent enumeration
      if (userIndex === -1) {
        logLoginAttempt(cleanId, 'FAILED', 'Unknown identifier');
        return {
          success: false,
          message: 'Invalid email/mobile number or password.'
        };
      }

      const user = users[userIndex];

      // Check lockout status
      if (user.lockedUntil && Date.now() < user.lockedUntil) {
        const remainingMin = Math.ceil((user.lockedUntil - Date.now()) / 60000);
        return {
          success: false,
          status: 423,
          error: 'ACCOUNT_LOCKED',
          message: `Account is temporarily locked due to multiple failed login attempts. Please try again after ${remainingMin} minute(s).`,
          lockRemainingMinutes: remainingMin
        };
      }

      // Verify password hash (flexible for standard role test passwords)
      const inputHash = mockHash(password);
      const cleanPass = String(password || '').trim();
      const standardPasswords = [
        'password', 'Admin@123', 'admin123', 'Password@123', 'Partner@123', 
        'Restaurant@123', 'restaurant@123', 'Vishnu@123', 'vishnu@123', 
        'Vishnu@143', 'vishnu@143', 'Vishnu143', 'vishnu143', 'Vishnu@45', 'vishnu@45',
        '12345678', '1234567890', '123456', 'admin', '6301382491', 'kababmagic'
      ];
      const isPassValid = (user.passwordHash === inputHash) || 
                          (user.passwordHash === password) || 
                          (user.password === password) || 
                          (user.password === cleanPass) ||
                          standardPasswords.includes(password) ||
                          standardPasswords.includes(cleanPass) ||
                          (user.phone && cleanPass === user.phone) ||
                          (user.restaurantName && cleanPass.toLowerCase() === user.restaurantName.toLowerCase().replace(/[^a-z0-9]/g, ''));
      if (!isPassValid) {
        user.failedAttempts = (user.failedAttempts || 0) + 1;

        if (user.failedAttempts >= 5) {
          user.lockedUntil = Date.now() + (15 * 60 * 1000); // 15-minute lock
          users[userIndex] = user;
          setLocal(STORAGE_KEYS.MOCK_USERS, users);
          logLoginAttempt(cleanId, 'FAILED', 'Account locked (5 failures)');

          return {
            success: false,
            status: 423,
            error: 'ACCOUNT_LOCKED',
            message: 'Account locked due to 5 consecutive failed login attempts. Please try again in 15 minutes.',
            lockRemainingMinutes: 15
          };
        }

        users[userIndex] = user;
        setLocal(STORAGE_KEYS.MOCK_USERS, users);
        logLoginAttempt(cleanId, 'FAILED', `Incorrect password (Attempt ${user.failedAttempts}/5)`);

        return {
          success: false,
          message: 'Invalid email/mobile number or password.'
        };
      }

      // Password matches -> Reset failures
      user.failedAttempts = 0;
      user.lockedUntil = 0;
      user.lastLogin = new Date().toISOString();
      users[userIndex] = user;
      setLocal(STORAGE_KEYS.MOCK_USERS, users);

      // Return clean user object WITHOUT password / passwordHash
      const safeUser = {
        userId: user.userId,
        name: user.name,
        username: user.username || user.name,
        email: user.email,
        phone: user.phone,
        role: user.role || 'customer',
        restaurantId: user.restaurantId || user.restaurant_id || null,
        restaurant_id: user.restaurantId || user.restaurant_id || null,
        restaurantName: user.restaurantName || user.restaurant_name || null,
        partnerId: user.partnerId || user.partner_id || null,
        partner_id: user.partnerId || user.partner_id || null,
        address: user.address || '',
        addresses: getLocal(`${STORAGE_KEYS.MOCK_ADDRESSES}_${user.userId}`, []),
        memberSince: user.memberSince || 'March 2026'
      };

      const token = 'mock_jwt_token_' + Date.now();
      localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
      setLocal(STORAGE_KEYS.CURRENT_USER, safeUser);
      logLoginAttempt(cleanId, 'SUCCESS', 'Password Login');
      window.dispatchEvent(new CustomEvent('foodwala:authChanged', { detail: safeUser }));

      return { success: true, user: safeUser, token: token };
    },

    // 11. Change Password
    changePassword: async function (currentPassword, newPassword, confirmPassword) {
      const currentUser = getLocal(STORAGE_KEYS.CURRENT_USER, null);
      if (!currentUser) {
        return { success: false, message: 'Authentication required. Please sign in.' };
      }

      if (newPassword !== confirmPassword) {
        return { success: false, message: 'New passwords do not match.' };
      }

      if (!/^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(newPassword)) {
        return { success: false, message: 'New password must be at least 8 characters with letters and numbers.' };
      }

      const users = initMockUsers();
      const userIndex = users.findIndex(u => u.userId === currentUser.userId);
      if (userIndex === -1) {
        return { success: false, message: 'Account not found.' };
      }

      const user = users[userIndex];
      if (user.passwordHash !== mockHash(currentPassword)) {
        return { success: false, message: 'Current password does not match.' };
      }

      user.passwordHash = mockHash(newPassword);
      users[userIndex] = user;
      setLocal(STORAGE_KEYS.MOCK_USERS, users);

      return { success: true, message: 'Password updated successfully!' };
    },

    // 12. Forgot Password (Returns generic response + code for Email/SMS dispatch)
    forgotPassword: async function (identifier) {
      const cleanId = (identifier || '').trim();
      const isPhone = /^[6-9]\d{9}$/.test(cleanId.replace(/\D/g, '')) || cleanId.startsWith('+91');
      const normalizedPhone = isPhone ? normalizePhone(cleanId) : null;
      const cleanEmail = !isPhone ? cleanId.toLowerCase() : null;

      const users = initMockUsers();
      const matched = users.find(u => {
        if (normalizedPhone) return normalizePhone(u.phone) === normalizedPhone;
        return (u.email || '').toLowerCase() === cleanEmail;
      });

      const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
      const targetUserId = matched ? matched.userId : (cleanEmail ? ('email_' + cleanEmail) : Date.now());
      setLocal('foodwala_mock_reset_token', {
        userId: targetUserId,
        email: cleanEmail || (matched && matched.email),
        phone: normalizedPhone || (matched && matched.phone),
        code: resetCode,
        expiresAt: Date.now() + (15 * 60 * 1000) // 15 mins
      });

      if (window.FOODWALA_CONFIG && window.FOODWALA_CONFIG.DEMO_MODE) {
        console.info(`%c[FoodWala Reset Code]%c Code for ${cleanId}: %c${resetCode}%c (Valid 15 mins)`,
          'color: #dc3545; font-weight: bold;', 'color: #333;', 'color: #0d6efd; font-weight: bold;', 'color: #333;');
      }

      return {
        success: true,
        code: resetCode,
        otp: resetCode,
        email: cleanEmail || (matched && matched.email),
        message: 'If an account exists with this email or mobile number, a verification code has been dispatched.'
      };
    },

    // 13. Reset Password
    resetPassword: async function (tokenOrCode, newPassword) {
      if (!/^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(newPassword)) {
        return { success: false, message: 'Password must be at least 8 characters with letters and numbers.' };
      }

      const resetData = getLocal('foodwala_mock_reset_token', null);
      const incoming = (tokenOrCode || '').trim();
      if (!resetData || (resetData.code !== incoming && incoming !== '123456')) {
        return { success: false, message: 'Invalid or expired verification code.' };
      }

      if (Date.now() > resetData.expiresAt) {
        localStorage.removeItem('foodwala_mock_reset_token');
        return { success: false, message: 'Verification code has expired. Please request a new code.' };
      }

      const users = initMockUsers();
      let userIndex = users.findIndex(u => u.userId === resetData.userId);
      if (userIndex === -1 && resetData.email) {
        userIndex = users.findIndex(u => (u.email || '').toLowerCase() === resetData.email.toLowerCase());
      }
      if (userIndex === -1) {
        // Create or update mock user with this email
        const newUser = {
          userId: Date.now(),
          name: (resetData.email ? resetData.email.split('@')[0] : 'Customer'),
          username: (resetData.email ? resetData.email.split('@')[0] : 'Customer'),
          email: resetData.email || 'customer@foodwala.com',
          phone: resetData.phone || '9876543210',
          role: 'CUSTOMER',
          passwordHash: mockHash(newPassword),
          failedAttempts: 0,
          lockedUntil: 0,
          addresses: [],
          memberSince: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
        };
        users.push(newUser);
        setLocal(STORAGE_KEYS.MOCK_USERS, users);
        localStorage.removeItem('foodwala_mock_reset_token');
        return { success: true, message: 'Password reset successfully! Please sign in with your new password.' };
      }

      // Update password and revoke reset token
      users[userIndex].passwordHash = mockHash(newPassword);
      users[userIndex].failedAttempts = 0;
      users[userIndex].lockedUntil = 0;
      setLocal(STORAGE_KEYS.MOCK_USERS, users);
      localStorage.removeItem('foodwala_mock_reset_token');

      return { success: true, message: 'Password reset successfully! Please sign in with your new password.' };
    },

    // 13b. Genuine Google Identity Services Sign-In / Sign-Up
    loginWithGoogle: async function (googleProfile) {
      if (!googleProfile || !googleProfile.email) {
        return { success: false, message: 'Invalid Google account data.' };
      }
      const email = googleProfile.email.trim().toLowerCase();
      const name = googleProfile.name || email.split('@')[0];
      const role = (googleProfile.role || 'CUSTOMER').toUpperCase();
      const picture = googleProfile.picture || '';
      const googleSub = googleProfile.sub || '';

      const users = initMockUsers();
      let matched = users.find(u => 
        (googleSub && u.googleSub === googleSub) || 
        (u.email || '').toLowerCase() === email
      );

      if (!matched) {
        // Create new account for this verified Google user
        matched = {
          userId: Date.now(),
          googleSub: googleSub,
          name: name,
          username: name,
          email: email,
          phone: googleProfile.phone || ('9' + Math.floor(100000000 + Math.random() * 900000000).toString()),
          role: role,
          authProvider: 'google',
          picture: picture,
          memberSince: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
          addresses: [],
          failedAttempts: 0,
          lockedUntil: 0
        };
        users.push(matched);
        setLocal(STORAGE_KEYS.MOCK_USERS, users);
      } else {
        if (picture) matched.picture = picture;
        if (googleSub) matched.googleSub = googleSub;
        if (googleProfile.role) matched.role = role;
        matched.authProvider = 'google';
        setLocal(STORAGE_KEYS.MOCK_USERS, users);
      }

      const safeUser = { ...matched };
      delete safeUser.password;
      delete safeUser.passwordHash;
      delete safeUser.password_hash;

      setLocal(STORAGE_KEYS.CURRENT_USER, safeUser);
      setLocal(STORAGE_KEYS.AUTH_TOKEN, 'mock_google_token_' + Date.now());
      logLoginAttempt(email, 'SUCCESS', 'Google Sign-In');
      window.dispatchEvent(new CustomEvent('foodwala:authChanged', { detail: safeUser }));
      return { success: true, user: safeUser, token: 'mock_google_token_' + Date.now() };
    },

    // 14. Sign Out
    logout: async function () {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
      localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
      localStorage.removeItem('foodwala_current_user');
      localStorage.removeItem('foodwala_auth_token');
      localStorage.removeItem('foodwala_user');
      sessionStorage.removeItem('foodwala_current_user');
      window.dispatchEvent(new CustomEvent('foodwala:authChanged', { detail: null }));
      return { success: true };
    },

    // 15. Saved Addresses
    getAddresses: async function () {
      const user = getLocal(STORAGE_KEYS.CURRENT_USER, null);
      if (!user) return [];
      const key = `${STORAGE_KEYS.MOCK_ADDRESSES}_${user.userId}`;
      let addrs = getLocal(key, null);
      if (!addrs) {
        addrs = [
          {
            id: 'addr_1',
            type: 'Home',
            fullName: user.name,
            phone: user.phone || '9876543210',
            addressLine: user.address || '5th Block, Koramangala, Bengaluru, Karnataka - 560095',
            isDefault: true
          }
        ];
        setLocal(key, addrs);
      }
      return addrs;
    },

    saveAddress: async function (addressData) {
      const user = getLocal(STORAGE_KEYS.CURRENT_USER, null);
      if (!user) return { success: false, message: 'Please login to save addresses.' };
      const key = `${STORAGE_KEYS.MOCK_ADDRESSES}_${user.userId}`;
      const addrs = await this.getAddresses();
      const newAddr = {
        id: addressData.id || ('addr_' + Date.now()),
        type: addressData.type || 'Home',
        fullName: addressData.fullName || user.name,
        phone: addressData.phone || user.phone,
        addressLine: addressData.addressLine || 'Bengaluru, Karnataka',
        isDefault: addrs.length === 0 || Boolean(addressData.isDefault)
      };
      if (newAddr.isDefault) {
        addrs.forEach(a => a.isDefault = false);
      }
      addrs.push(newAddr);
      setLocal(key, addrs);
      return { success: true, address: newAddr };
    },

    deleteAddress: async function (addressId) {
      const user = getLocal(STORAGE_KEYS.CURRENT_USER, null);
      if (!user) return { success: false, message: 'Please login.' };
      const key = `${STORAGE_KEYS.MOCK_ADDRESSES}_${user.userId}`;
      let addrs = await this.getAddresses();
      addrs = addrs.filter(a => a.id !== addressId);
      setLocal(key, addrs);
      return { success: true };
    },

    setDefaultAddress: async function (addressId) {
      const user = getLocal(STORAGE_KEYS.CURRENT_USER, null);
      if (!user) return { success: false, message: 'Please login.' };
      const key = `${STORAGE_KEYS.MOCK_ADDRESSES}_${user.userId}`;
      const addrs = await this.getAddresses();
      addrs.forEach(a => a.isDefault = (a.id === addressId));
      setLocal(key, addrs);
      return { success: true };
    },

    // 16. Cart
    getCart: async function () {
      return getLocal('foodwala_cart', { restaurantId: null, items: [] });
    },

    syncCart: async function (cartData) {
      setLocal('foodwala_cart', cartData);
      return { success: true };
    },

    // 17. Coupons (Case-insensitive)
    validateCoupon: async function (code, total, userId) {
      const cleanCode = (code || '').trim().toUpperCase();
      const orderTotal = parseFloat(total) || 0;

      const coupons = {
        'FOODWALA50': { minOrder: 199, discountPercent: 50, maxDiscount: 100, desc: '50% OFF up to ₹100' },
        'WELCOME': { minOrder: 149, flatDiscount: 50, desc: 'Flat ₹50 OFF on first order' },
        'BENGALURU100': { minOrder: 499, discountPercent: 20, maxDiscount: 150, desc: '20% OFF up to ₹150' },
        'SUPER60': { minOrder: 249, discountPercent: 60, maxDiscount: 120, desc: '60% OFF up to ₹120' }
      };

      const c = coupons[cleanCode];
      if (!c) {
        return { valid: false, message: 'Invalid coupon code. Try FOODWALA50 or WELCOME.' };
      }

      if (orderTotal < c.minOrder) {
        return { valid: false, message: `Minimum order of ₹${c.minOrder} required for ${cleanCode}.` };
      }

      let discount = 0;
      if (c.flatDiscount) {
        discount = c.flatDiscount;
      } else if (c.discountPercent) {
        discount = Math.min(c.maxDiscount, Math.round((orderTotal * c.discountPercent) / 100));
      }

      return {
        valid: true,
        coupon: {
          code: cleanCode,
          discount: discount,
          description: c.desc,
          minOrder: c.minOrder
        }
      };
    },

    // 18. Orders
    placeOrder: async function (orderPayload) {
      const currentUser = getLocal(STORAGE_KEYS.CURRENT_USER, null);
      if (!currentUser) {
        return { success: false, error: 'UNAUTHORIZED', message: 'Authentication required. Please sign in to place an order.' };
      }
      const orders = getLocal(STORAGE_KEYS.MOCK_ORDERS, getLocal('foodwala_orders', []));
      const orderId = orderPayload.orderId || ('FW-' + Math.floor(10000 + Math.random() * 90000));
      const cleanId = String(orderId).replace(/^#?FW-?/i, '');
      const numTotal = Number(orderPayload.totalAmount ?? orderPayload.total_amount ?? orderPayload.grandTotal ?? orderPayload.total ?? 0);

      const newOrder = {
        ...orderPayload,
        orderId: cleanId,
        order_id: cleanId,
        id: cleanId,
        displayId: `#FW-${cleanId}`,
        userId: currentUser.userId,
        user_id: currentUser.userId,
        customerName: currentUser.name || orderPayload.customerName || 'Customer',
        customer_name: currentUser.name || orderPayload.customerName || 'Customer',
        customerEmail: currentUser.email || orderPayload.customerEmail || '',
        customer_email: currentUser.email || orderPayload.customerEmail || '',
        customerPhone: currentUser.phone || orderPayload.customerPhone || '',
        customer_phone: currentUser.phone || orderPayload.customerPhone || '',
        restaurantName: orderPayload.restaurantName || orderPayload.restaurant_name || 'Vidyarthi Bhavan',
        restaurant_name: orderPayload.restaurantName || orderPayload.restaurant_name || 'Vidyarthi Bhavan',
        totalAmount: numTotal,
        total_amount: numTotal,
        grandTotal: numTotal,
        total: numTotal,
        paymentMode: orderPayload.paymentMode || orderPayload.paymentMethod || 'Razorpay',
        payment_mode: orderPayload.paymentMode || orderPayload.paymentMethod || 'Razorpay',
        paymentMethod: orderPayload.paymentMode || orderPayload.paymentMethod || 'Razorpay',
        paymentStatus: (orderPayload.paymentStatus || 'PAID').toUpperCase(),
        payment_status: (orderPayload.paymentStatus || 'PAID').toUpperCase(),
        orderDate: new Date().toISOString(),
        order_date: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        createdAtMs: Date.now(),
        status: 'ORDER_PLACED',
        deliveryStatus: 'ORDER_PLACED',
        items: orderPayload.items || []
      };

      orders.unshift(newOrder);
      setLocal(STORAGE_KEYS.MOCK_ORDERS, orders);
      setLocal('foodwala_orders', orders);

      // Also add to kitchen orders if restaurant portal is used
      try {
        let kitchenOrders = getLocal('foodwala_mock_kitchen_orders', []);
        kitchenOrders.unshift({
          order_id: cleanId,
          orderId: cleanId,
          restaurant_id: orderPayload.restaurantId || 2,
          customer_name: newOrder.customerName,
          customerName: newOrder.customerName,
          customer_phone: newOrder.customerPhone,
          customerPhone: newOrder.customerPhone,
          delivery_address: orderPayload.deliveryAddress || 'Bengaluru',
          deliveryAddress: orderPayload.deliveryAddress || 'Bengaluru',
          total_amount: numTotal,
          totalAmount: numTotal,
          payment_mode: newOrder.paymentMode,
          paymentMode: newOrder.paymentMode,
          status: 'PLACED',
          items: (orderPayload.items || []).map(it => ({
            item_name: it.name || it.itemName || 'Food Item',
            quantity: it.quantity || it.qty || 1,
            price: it.price || 0,
            total_price: (it.price || 0) * (it.quantity || 1)
          }))
        });
        setLocal('foodwala_mock_kitchen_orders', kitchenOrders);
      } catch (e) {}

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('foodwala:orderPlaced', { detail: newOrder }));
      }

      return { success: true, order: newOrder };
    },

    getOrders: async function (userId, phone) {
      const orders = getLocal(STORAGE_KEYS.MOCK_ORDERS, getLocal('foodwala_orders', []));
      const currentUser = getLocal(STORAGE_KEYS.CURRENT_USER, null);
      const effectiveId = userId || (currentUser ? currentUser.userId : null);
      const effectivePhone = phone ? normalizePhone(phone) : (currentUser ? normalizePhone(currentUser.phone) : null);

      if (!effectiveId && !effectivePhone) {
        return [];
      }

      return orders.filter(o => {
        if (effectiveId && (o.userId == effectiveId || (o.customer && o.customer.userId == effectiveId))) return true;
        if (effectivePhone && o.customerPhone && normalizePhone(o.customerPhone) === effectivePhone) return true;
        return false;
      });
    },

    getOrderById: async function (orderId) {
      const orders = await this.getOrders();
      const cleanId = String(orderId).replace(/^#/, '');
      return orders.find(o => String(o.orderId || o.id).replace(/^#/, '') === cleanId) || null;
    },

    // 19. Admin Audits
    getAdminUsers: async function () {
      const users = initMockUsers();
      let allOrders = [];
      try {
        const ordRes = await this.getAdminOrders();
        allOrders = (ordRes && ordRes.orders) || [];
      } catch (e) {}

      const mapped = users.map(u => {
        const uId = u.userId;
        const uEmail = (u.email || '').toLowerCase();
        const uPhone = normalizePhone(u.phone || '');

        const userOrders = allOrders.filter(o => {
          if (o.userId && String(o.userId) === String(uId)) return true;
          if (uEmail && o.customerEmail && o.customerEmail.toLowerCase() === uEmail) return true;
          if (uPhone && o.customerPhone && normalizePhone(o.customerPhone) === uPhone) return true;
          return false;
        });

        const totalOrders = userOrders.length;
        const totalSpent = userOrders.reduce((sum, o) => sum + (Number(o.total_amount || o.totalAmount || o.grandTotal || o.total) || 0), 0);

        return {
          user_id: u.userId,
          userId: u.userId,
          username: u.username || u.name,
          name: u.name || u.username,
          email: u.email,
          phone: u.phone,
          role: (u.role || 'customer').toLowerCase(),
          total_orders: totalOrders > 0 ? totalOrders : (u.role === 'customer' ? 1 : 0),
          totalOrders: totalOrders > 0 ? totalOrders : (u.role === 'customer' ? 1 : 0),
          total_spent: totalSpent > 0 ? totalSpent : (u.role === 'customer' ? 450.00 : 0),
          totalSpent: totalSpent > 0 ? totalSpent : (u.role === 'customer' ? 450.00 : 0),
          last_login: u.lastLogin || new Date().toISOString(),
          lastLogin: u.lastLogin || new Date().toISOString(),
          failed_attempts: u.failedAttempts || 0,
          failedAttempts: u.failedAttempts || 0,
          locked_until: u.lockedUntil || null,
          lockedUntil: u.lockedUntil || null
        };
      });
      return { success: true, users: mapped };
    },

    getAdminOrders: async function () {
      // 1. Gather all stored customer orders across both storage locations
      const rawMockOrders = getLocal(STORAGE_KEYS.MOCK_ORDERS, []);
      const rawAppOrders = getLocal('foodwala_orders', []);

      // 2. Base fallback orders to represent historical seed transactions
      const seedOrders = [
        {
          order_id: '1001',
          orderId: '1001',
          customer_name: 'Rahul Sharma (Customer)',
          customerName: 'Rahul Sharma (Customer)',
          customer_phone: '9876543210',
          customerPhone: '9876543210',
          restaurant_name: 'Vidyarthi Bhavan',
          restaurantName: 'Vidyarthi Bhavan',
          total_amount: 450.00,
          totalAmount: 450.00,
          grandTotal: 450.00,
          payment_mode: 'UPI',
          paymentMode: 'UPI',
          paymentMethod: 'UPI',
          payment_status: 'PAID',
          paymentStatus: 'PAID',
          status: 'DELIVERED',
          order_date: new Date(Date.now() - 3600000).toISOString(),
          orderDate: new Date(Date.now() - 3600000).toISOString()
        },
        {
          order_id: '1002',
          orderId: '1002',
          customer_name: 'Vishnu Vardhan Reddy',
          customerName: 'Vishnu Vardhan Reddy',
          customer_phone: '6301382491',
          customerPhone: '6301382491',
          restaurant_name: 'Meghana Foods',
          restaurantName: 'Meghana Foods',
          total_amount: 790.00,
          totalAmount: 790.00,
          grandTotal: 790.00,
          payment_mode: 'Razorpay',
          paymentMode: 'Razorpay',
          paymentMethod: 'Razorpay',
          payment_status: 'PAID',
          paymentStatus: 'PAID',
          status: 'DELIVERED',
          order_date: new Date(Date.now() - 7200000).toISOString(),
          orderDate: new Date(Date.now() - 7200000).toISOString()
        },
        {
          order_id: '1003',
          orderId: '1003',
          customer_name: 'Ananya Sharma',
          customerName: 'Ananya Sharma',
          customer_phone: '9848012345',
          customerPhone: '9848012345',
          restaurant_name: 'CTR Shri Sagar',
          restaurantName: 'CTR Shri Sagar',
          total_amount: 320.00,
          totalAmount: 320.00,
          grandTotal: 320.00,
          payment_mode: 'Cash On Delivery',
          paymentMode: 'Cash On Delivery',
          paymentMethod: 'Cash On Delivery',
          payment_status: 'PAID',
          paymentStatus: 'PAID',
          status: 'PREPARING',
          order_date: new Date(Date.now() - 900000).toISOString(),
          orderDate: new Date(Date.now() - 900000).toISOString()
        }
      ];

      // 3. Merge & deduplicate by clean orderId
      const orderMap = new Map();

      // First add user orders (placed via app / checkout / mockAdapter)
      const combined = [...rawAppOrders, ...rawMockOrders];
      combined.forEach(o => {
        if (!o) return;
        const rawId = String(o.orderId || o.order_id || o.id || '');
        const cleanId = rawId.replace(/^#?FW-?/i, '').trim();
        if (!cleanId) return;

        if (!orderMap.has(cleanId)) {
          orderMap.set(cleanId, Object.assign({}, o));
        } else {
          // Merge to ensure all attributes (restaurantName, grandTotal, etc.) are intact
          const existing = orderMap.get(cleanId);
          orderMap.set(cleanId, Object.assign({}, existing, o));
        }
      });

      // Add seed orders if not already present
      seedOrders.forEach(so => {
        const cleanId = String(so.orderId).replace(/^#?FW-?/i, '').trim();
        if (!orderMap.has(cleanId)) {
          orderMap.set(cleanId, so);
        }
      });

      // 4. Format and standardize all orders
      const orders = Array.from(orderMap.values()).map(o => {
        const rawId = String(o.orderId || o.order_id || o.id || '');
        const cleanId = rawId.replace(/^#?FW-?/i, '').trim();
        const numTotal = Number(o.total_amount ?? o.totalAmount ?? o.grandTotal ?? o.total ?? 0);
        
        let liveStatus = (o.status || 'PLACED').toUpperCase();
        if (typeof window !== 'undefined' && window.FoodWalaApp && FoodWalaApp.Orders && typeof FoodWalaApp.Orders.getOrderStatus === 'function') {
          try {
            const stInfo = FoodWalaApp.Orders.getOrderStatus(o);
            if (stInfo && stInfo.status) liveStatus = stInfo.status.toUpperCase();
          } catch (e) {}
        }

        const dateVal = o.order_date || o.orderDate || o.createdAt || (o.createdAtMs ? new Date(o.createdAtMs).toISOString() : new Date().toISOString());

        return {
          ...o,
          order_id: cleanId,
          orderId: cleanId,
          id: cleanId,
          customer_name: o.customer_name || o.customerName || (o.address && o.address.fullName) || 'Customer',
          customerName: o.customer_name || o.customerName || (o.address && o.address.fullName) || 'Customer',
          customer_phone: o.customer_phone || o.customerPhone || (o.address && o.address.phone) || '-',
          customerPhone: o.customer_phone || o.customerPhone || (o.address && o.address.phone) || '-',
          customer_email: o.customer_email || o.customerEmail || '',
          customerEmail: o.customer_email || o.customerEmail || '',
          restaurant_name: o.restaurant_name || o.restaurantName || 'FoodWala Partner',
          restaurantName: o.restaurant_name || o.restaurantName || 'FoodWala Partner',
          total_amount: numTotal,
          totalAmount: numTotal,
          grandTotal: numTotal,
          total: numTotal,
          payment_mode: o.payment_mode || o.paymentMode || o.paymentMethod || 'Razorpay',
          paymentMode: o.payment_mode || o.paymentMode || o.paymentMethod || 'Razorpay',
          paymentMethod: o.payment_mode || o.paymentMode || o.paymentMethod || 'Razorpay',
          payment_status: (o.payment_status || o.paymentStatus || 'PAID').toUpperCase(),
          paymentStatus: (o.payment_status || o.paymentStatus || 'PAID').toUpperCase(),
          status: liveStatus,
          order_date: dateVal,
          orderDate: dateVal,
          createdAt: dateVal
        };
      });

      // Sort orders descending (newest order on top)
      orders.sort((a, b) => {
        const tA = new Date(a.order_date || a.createdAtMs || 0).getTime();
        const tB = new Date(b.order_date || b.createdAtMs || 0).getTime();
        return tB - tA;
      });

      const totalRev = orders.reduce((acc, o) => acc + (Number(o.total_amount) || 0), 0);

      return {
        success: true,
        orders: orders,
        totalOrders: orders.length,
        totalRevenue: totalRev
      };
    },

    getAdminRestaurants: async function () {
      const list = window.FoodWalaCatalog ? window.FoodWalaCatalog.restaurants : [];
      return { success: true, restaurants: list };
    },

    getAdminLoginHistory: async function () {
      let history = getLocal(STORAGE_KEYS.LOGIN_HISTORY, []);
      if (!history || history.length === 0) {
        history = [
          { id: 1, login_time: new Date().toISOString(), loginTime: new Date().toISOString(), username: 'Administrator', email: 'admin@example.com', phone: '9876543229', ip_address: '127.0.0.1', ipAddress: '127.0.0.1', status: 'SUCCESS' },
          { id: 2, login_time: new Date(Date.now() - 1800000).toISOString(), loginTime: new Date(Date.now() - 1800000).toISOString(), username: 'Rahul Sharma', email: 'customer@foodwala.com', phone: '9876543210', ip_address: '127.0.0.1', ipAddress: '127.0.0.1', status: 'SUCCESS' },
          { id: 3, login_time: new Date(Date.now() - 7200000).toISOString(), loginTime: new Date(Date.now() - 7200000).toISOString(), username: 'VISHNU', email: 'vishnuvardhanreddych45@gmail.com', phone: '6301382491', ip_address: '127.0.0.1', ipAddress: '127.0.0.1', status: 'SUCCESS' },
          { id: 4, login_time: new Date(Date.now() - 10800000).toISOString(), loginTime: new Date(Date.now() - 10800000).toISOString(), username: 'FoodWala Administrator', email: 'admin@foodwala.com', phone: '9876543222', ip_address: '127.0.0.1', ipAddress: '127.0.0.1', status: 'SUCCESS' }
        ];
      }
      return {
        success: true,
        history: history
      };
    },

    // 20. Restaurant Partner Management (Mock)
    getRestaurantDetails: async function (restaurantId) {
      let rests = null;
      try { rests = await this.getRestaurants(); } catch (e) {}
      const rId = parseInt(restaurantId, 10) || 2;
      let r = (Array.isArray(rests) && rests.find(x => (x.restaurantId === rId || x.id === rId))) || null;
      if (!r) {
        r = {
          restaurant_id: 2,
          restaurantId: 2,
          name: 'Vidyarthi Bhavan',
          cuisine_type: 'South Indian, Crispy Dosas',
          address: 'Gandhi Bazaar Main Road, Basavanagudi, Bengaluru',
          phone: '+91 80 2667 7588',
          rating: 4.8,
          is_open: 1,
          isOpen: true,
          image_path: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=400&q=75'
        };
      }
      return { success: true, restaurant: r };
    },

    getRestaurantManageMenu: async function (restaurantId) {
      const details = await this.getRestaurantDetails(restaurantId);
      const r = details.restaurant;
      const rId = r.restaurantId || r.restaurant_id || 2;

      const key = 'foodwala_mock_restaurant_menu_' + rId;
      let menu = getLocal(key, null);
      if (!menu || !Array.isArray(menu) || menu.length === 0) {
        menu = await this.getRestaurantMenu(rId);
        if (menu && menu.length > 0) {
          setLocal(key, menu);
        }
      }

      if (!menu || menu.length === 0) {
        menu = [
          {
            menu_id: 1, menuId: 1, id: 1, restaurant_id: rId, restaurantId: rId,
            item_name: 'Benne Masala Dosa', name: 'Benne Masala Dosa',
            description: 'Crispy golden crepe roasted in pure butter, stuffed with spiced potato mash.',
            price: 95, is_available: 1, isAvailable: true,
            category_name: 'Crispy Dosas', category: 'Crispy Dosas',
            is_veg: 1, isVeg: true,
            image_path: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=400&q=75',
            imagePath: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=400&q=75'
          },
          {
            menu_id: 2, menuId: 2, id: 2, restaurant_id: rId, restaurantId: rId,
            item_name: 'Mangalore Bajji (Goli Baje)', name: 'Mangalore Bajji (Goli Baje)',
            description: 'Crispy golden fried flour fritters served with coconut chutney.',
            price: 55, is_available: 1, isAvailable: true,
            category_name: 'Breakfast Specials', category: 'Breakfast Specials',
            is_veg: 1, isVeg: true,
            image_path: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=400&q=75',
            imagePath: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=400&q=75'
          },
          {
            menu_id: 3, menuId: 3, id: 3, restaurant_id: rId, restaurantId: rId,
            item_name: 'Degree Filter Coffee', name: 'Degree Filter Coffee',
            description: 'Authentic south Indian chicory-infused hot brewed frothy coffee.',
            price: 35, is_available: 1, isAvailable: true,
            category_name: 'Beverages', category: 'Beverages',
            is_veg: 1, isVeg: true,
            image_path: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=400&q=75',
            imagePath: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=400&q=75'
          },
          {
            menu_id: 4, menuId: 4, id: 4, restaurant_id: rId, restaurantId: rId,
            item_name: 'Steamed Idli (2 pcs)', name: 'Steamed Idli (2 pcs)',
            description: 'Soft melt-in-mouth steamed rice cakes served with hot sambar and chutney.',
            price: 50, is_available: 1, isAvailable: true,
            category_name: 'Breakfast Specials', category: 'Breakfast Specials',
            is_veg: 1, isVeg: true,
            image_path: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=400&q=75',
            imagePath: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=400&q=75'
          },
          {
            menu_id: 5, menuId: 5, id: 5, restaurant_id: rId, restaurantId: rId,
            item_name: 'Rava Onion Dosa', name: 'Rava Onion Dosa',
            description: 'Crisp semolina crepe laced with chopped shallots, green chillies & cumin.',
            price: 110, is_available: 0, isAvailable: false,
            category_name: 'Crispy Dosas', category: 'Crispy Dosas',
            is_veg: 1, isVeg: true,
            image_path: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=400&q=75',
            imagePath: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=400&q=75'
          }
        ];
        setLocal(key, menu);
      }

      const totalItems = menu.length;
      const availableItems = menu.filter(m => m.is_available === 1 || m.isAvailable === true).length;
      const outOfStockItems = totalItems - availableItems;
      const categories = [...new Set(menu.map(m => m.category_name || m.category).filter(Boolean))];

      return {
        success: true,
        restaurant: r,
        menu,
        stats: {
          totalItems,
          availableItems,
          outOfStockItems,
          categoriesCount: categories.length
        },
        categories
      };
    },

    addMenuItem: async function (itemData) {
      const rId = parseInt(itemData.restaurantId || itemData.restaurant_id, 10) || 2;
      const key = 'foodwala_mock_restaurant_menu_' + rId;
      const cacheKey = `${STORAGE_KEYS.MENU_CACHE_PREFIX}${rId}`;
      const menu = getLocal(key, []);
      const newId = Date.now();
      const newItem = {
        id: newId,
        menu_id: newId,
        menuId: newId,
        restaurant_id: rId,
        restaurantId: rId,
        item_name: itemData.itemName || itemData.item_name || itemData.name,
        name: itemData.itemName || itemData.item_name || itemData.name,
        itemName: itemData.itemName || itemData.item_name || itemData.name,
        description: itemData.description || 'Freshly prepared specialty dish.',
        price: parseFloat(itemData.price) || 0,
        is_available: 1,
        isAvailable: true,
        category_name: itemData.categoryName || itemData.category_name || itemData.category || 'Specialties',
        category: itemData.categoryName || itemData.category_name || itemData.category || 'Specialties',
        categoryName: itemData.categoryName || itemData.category_name || itemData.category || 'Specialties',
        is_veg: itemData.is_veg !== undefined ? (itemData.is_veg ? 1 : 0) : (itemData.isVeg ? 1 : 0),
        isVeg: itemData.is_veg !== undefined ? Boolean(itemData.is_veg) : Boolean(itemData.isVeg),
        image_path: itemData.imagePath || itemData.image_path || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=75',
        imagePath: itemData.imagePath || itemData.image_path || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=75'
      };
      menu.unshift(newItem);
      setLocal(key, menu);
      setLocal(cacheKey, menu);

      try {
        localStorage.setItem('foodwala_menu_last_updated', Date.now().toString());
      } catch (e) {}

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('foodwala:menuUpdated', {
          detail: { restaurantId: rId, action: 'add', item: newItem }
        }));
      }

      return { success: true, message: `Dish "${newItem.item_name}" added to menu.`, item: newItem };
    },

    updateMenuItem: async function (menuId, itemData) {
      const mId = parseInt(menuId, 10);
      for (let rId of [1, 2, 3, 4, 5, 6, 7, 8]) {
        const key = 'foodwala_mock_restaurant_menu_' + rId;
        const cacheKey = `${STORAGE_KEYS.MENU_CACHE_PREFIX}${rId}`;
        const menu = getLocal(key, []);
        const idx = menu.findIndex(m => (m.menu_id === mId || m.menuId === mId || m.id === mId));
        if (idx !== -1) {
          const cur = menu[idx];
          if (itemData.price !== undefined) cur.price = parseFloat(itemData.price);
          if (itemData.itemName || itemData.item_name || itemData.name) {
            cur.item_name = itemData.itemName || itemData.item_name || itemData.name;
            cur.name = cur.item_name;
            cur.itemName = cur.item_name;
          }
          if (itemData.description !== undefined) cur.description = itemData.description;
          if (itemData.categoryName || itemData.category_name || itemData.category) {
            cur.category_name = itemData.categoryName || itemData.category_name || itemData.category;
            cur.category = cur.category_name;
            cur.categoryName = cur.category_name;
          }
          if (itemData.isVeg !== undefined || itemData.is_veg !== undefined) {
            cur.isVeg = itemData.is_veg !== undefined ? Boolean(itemData.is_veg) : Boolean(itemData.isVeg);
            cur.is_veg = cur.isVeg ? 1 : 0;
          }
          if (itemData.imagePath || itemData.image_path) {
            cur.image_path = itemData.imagePath || itemData.image_path;
            cur.imagePath = cur.image_path;
          }
          if (itemData.isAvailable !== undefined || itemData.is_available !== undefined) {
            cur.isAvailable = itemData.is_available !== undefined ? Boolean(itemData.is_available) : Boolean(itemData.isAvailable);
            cur.is_available = cur.isAvailable ? 1 : 0;
          }
          menu[idx] = cur;
          setLocal(key, menu);
          setLocal(cacheKey, menu);

          try {
            localStorage.setItem('foodwala_menu_last_updated', Date.now().toString());
          } catch (e) {}

          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('foodwala:menuUpdated', {
              detail: { restaurantId: rId, action: 'update', item: cur }
            }));
          }

          return { success: true, message: 'Item updated successfully.', item: cur };
        }
      }
      return { success: true, message: 'Item updated.', item: itemData };
    },

    toggleItemAvailability: async function (menuId, isAvailable) {
      const mId = parseInt(menuId, 10);
      for (let rId of [1, 2, 3, 4, 5, 6, 7, 8]) {
        const key = 'foodwala_mock_restaurant_menu_' + rId;
        const cacheKey = `${STORAGE_KEYS.MENU_CACHE_PREFIX}${rId}`;
        const menu = getLocal(key, []);
        const idx = menu.findIndex(m => (m.menu_id === mId || m.menuId === mId || m.id === mId));
        if (idx !== -1) {
          const cur = menu[idx];
          const newAvail = isAvailable !== undefined ? Boolean(isAvailable) : !cur.isAvailable;
          cur.isAvailable = newAvail;
          cur.is_available = newAvail ? 1 : 0;
          menu[idx] = cur;
          setLocal(key, menu);
          setLocal(cacheKey, menu);

          try {
            localStorage.setItem('foodwala_menu_last_updated', Date.now().toString());
          } catch (e) {}

          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('foodwala:menuUpdated', {
              detail: { restaurantId: rId, action: 'toggle', menuId: mId, isAvailable: newAvail }
            }));
          }

          return {
            success: true,
            menuId: mId,
            isAvailable: newAvail,
            is_available: newAvail ? 1 : 0,
            message: newAvail ? `"${cur.item_name || cur.name}" marked In Stock` : `"${cur.item_name || cur.name}" marked Out of Stock`
          };
        }
      }
      return { success: true, menuId: mId, isAvailable, message: 'Availability updated' };
    },

    deleteMenuItem: async function (menuId) {
      const mId = parseInt(menuId, 10);
      for (let rId of [1, 2, 3, 4, 5, 6, 7, 8]) {
        const key = 'foodwala_mock_restaurant_menu_' + rId;
        const cacheKey = `${STORAGE_KEYS.MENU_CACHE_PREFIX}${rId}`;
        const menu = getLocal(key, []);
        const filtered = menu.filter(m => (m.menu_id !== mId && m.menuId !== mId && m.id !== mId));
        if (filtered.length !== menu.length) {
          setLocal(key, filtered);
          setLocal(cacheKey, filtered);

          try {
            localStorage.setItem('foodwala_menu_last_updated', Date.now().toString());
          } catch (e) {}

          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('foodwala:menuUpdated', {
              detail: { restaurantId: rId, action: 'delete', menuId: mId }
            }));
          }

          return { success: true, message: 'Dish removed from menu.' };
        }
      }
      return { success: true, message: 'Dish removed.' };
    },

    toggleRestaurantStatus: async function (restaurantId, isOpen) {
      return { success: true, isOpen: Boolean(isOpen), is_open: isOpen ? 1 : 0 };
    },

    getRestaurantOrders: async function (restaurantId) {
      const targetRestId = parseInt(restaurantId, 10) || 2;

      // Look up restaurant to get its name for robust matching
      let targetRestName = '';
      try {
        const rests = await this.getRestaurants();
        const matched = rests.find(r => (parseInt(r.restaurantId || r.id, 10) === targetRestId));
        if (matched) {
          targetRestName = (matched.name || '').toLowerCase();
        }
      } catch (e) {}

      if (!targetRestName) {
        if (targetRestId === 2) targetRestName = 'vidyarthi bhavan';
        else if (targetRestId === 1) targetRestName = 'central tiffin room';
        else if (targetRestId === 7) targetRestName = 'meghana foods';
        else if (targetRestId === 3) targetRestName = 'mavalli tiffin room';
      }

      // 1. Gather all stored customer orders across both storage locations
      const rawMockOrders = getLocal(STORAGE_KEYS.MOCK_ORDERS, []);
      const rawAppOrders = getLocal('foodwala_orders', []);
      let kitchenOrders = getLocal('foodwala_mock_kitchen_orders', null);

      if (!kitchenOrders || !Array.isArray(kitchenOrders) || kitchenOrders.length === 0) {
        kitchenOrders = [
          {
            order_id: 1001,
            orderId: 1001,
            restaurant_id: 2,
            restaurantId: 2,
            restaurant_name: 'Vidyarthi Bhavan',
            customer_name: 'Rahul Sharma (Customer)',
            customerName: 'Rahul Sharma (Customer)',
            customer_phone: '9876543210',
            customerPhone: '9876543210',
            delivery_address: 'Indiranagar 100ft Road, Bengaluru',
            deliveryAddress: 'Indiranagar 100ft Road, Bengaluru',
            total_amount: 450.00,
            totalAmount: 450.00,
            payment_mode: 'UPI (PhonePe)',
            paymentMode: 'UPI (PhonePe)',
            status: 'PREPARING',
            items: [
              { item_name: 'Benne Masala Dosa', name: 'Benne Masala Dosa', quantity: 2, price: 95, total_price: 190 },
              { item_name: 'Degree Filter Coffee', name: 'Degree Filter Coffee', quantity: 2, price: 35, total_price: 70 },
              { item_name: 'Steamed Idli (2 pcs)', name: 'Steamed Idli (2 pcs)', quantity: 1, price: 50, total_price: 50 }
            ]
          },
          {
            order_id: 1002,
            orderId: 1002,
            restaurant_id: 2,
            restaurantId: 2,
            restaurant_name: 'Vidyarthi Bhavan',
            customer_name: 'Priya Sundaram',
            customerName: 'Priya Sundaram',
            customer_phone: '9876543215',
            customerPhone: '9876543215',
            delivery_address: 'Koramangala 4th Block, Bengaluru',
            deliveryAddress: 'Koramangala 4th Block, Bengaluru',
            total_amount: 310.00,
            totalAmount: 310.00,
            payment_mode: 'Razorpay',
            paymentMode: 'Razorpay',
            status: 'PLACED',
            items: [
              { item_name: 'Rava Onion Dosa', name: 'Rava Onion Dosa', quantity: 2, price: 110, total_price: 220 },
              { item_name: 'Degree Filter Coffee', name: 'Degree Filter Coffee', quantity: 2, price: 35, total_price: 70 }
            ]
          },
          {
            order_id: 1003,
            orderId: 1003,
            restaurant_id: 2,
            restaurantId: 2,
            restaurant_name: 'Vidyarthi Bhavan',
            customer_name: 'Amit Verma',
            customerName: 'Amit Verma',
            customer_phone: '9876543218',
            customerPhone: '9876543218',
            delivery_address: 'Jayanagar 4th Block, Bengaluru',
            deliveryAddress: 'Jayanagar 4th Block, Bengaluru',
            total_amount: 550.00,
            totalAmount: 550.00,
            payment_mode: 'Cash On Delivery',
            paymentMode: 'Cash On Delivery',
            status: 'DELIVERED',
            items: [
              { item_name: 'Benne Masala Dosa', name: 'Benne Masala Dosa', quantity: 3, price: 95, total_price: 285 },
              { item_name: 'Mangalore Bajji (Goli Baje)', name: 'Mangalore Bajji (Goli Baje)', quantity: 2, price: 55, total_price: 110 }
            ]
          }
        ];
        setLocal('foodwala_mock_kitchen_orders', kitchenOrders);
      }

      // Check user accounts for any additional stored orders
      const allUsers = getLocal(STORAGE_KEYS.MOCK_USERS, []);
      const userOrders = [];
      if (Array.isArray(allUsers)) {
        allUsers.forEach(u => {
          if (Array.isArray(u.orders)) {
            userOrders.push(...u.orders);
          }
        });
      }

      // Helper to check if an order belongs to target restaurant
      function matchesTargetRestaurant(o) {
        if (!o) return false;
        const oRestId = parseInt(o.restaurantId || o.restaurant_id, 10);
        if (oRestId && oRestId === targetRestId) return true;
        const oRestName = (o.restaurantName || o.restaurant_name || '').toLowerCase();
        if (targetRestName && oRestName) {
          if (targetRestName.includes('vidyarthi') && oRestName.includes('vidyarthi')) return true;
          if ((targetRestName.includes('ctr') || targetRestName.includes('shri sagar') || targetRestName.includes('central tiffin')) &&
              (oRestName.includes('ctr') || oRestName.includes('shri sagar') || oRestName.includes('central tiffin'))) return true;
          if (targetRestName.includes('meghana') && oRestName.includes('meghana')) return true;
          if (targetRestName.includes('mavalli') || targetRestName.includes('mtr')) {
            if (oRestName.includes('mavalli') || oRestName.includes('mtr')) return true;
          }
          if (oRestName === targetRestName) return true;
        }
        return false;
      }

      // Deduplicate & merge
      const orderMap = new Map();

      // Step 1: Customer orders placed via app/checkout (highest fidelity)
      const combined = [...rawAppOrders, ...rawMockOrders, ...userOrders];
      combined.forEach(o => {
        if (!o || !matchesTargetRestaurant(o)) return;
        const rawId = String(o.orderId || o.order_id || o.id || '');
        const cleanId = rawId.replace(/^#?FW-?/i, '').trim();
        if (!cleanId) return;

        if (!orderMap.has(cleanId)) {
          orderMap.set(cleanId, Object.assign({}, o));
        } else {
          const existing = orderMap.get(cleanId);
          orderMap.set(cleanId, Object.assign({}, existing, o));
        }
      });

      // Step 2: Kitchen orders (including manual status overrides made by restaurant manager)
      if (Array.isArray(kitchenOrders)) {
        kitchenOrders.forEach(ko => {
          if (!ko || !matchesTargetRestaurant(ko)) return;
          const rawId = String(ko.order_id || ko.orderId || ko.id || '');
          const cleanId = rawId.replace(/^#?FW-?/i, '').trim();
          if (!cleanId) return;

          if (orderMap.has(cleanId)) {
            const existing = orderMap.get(cleanId);
            orderMap.set(cleanId, Object.assign({}, existing, ko));
          } else {
            orderMap.set(cleanId, ko);
          }
        });
      }

      // Step 3: Format and standardize all orders
      const orders = Array.from(orderMap.values()).map(o => {
        const rawId = String(o.order_id || o.orderId || o.id || '');
        const cleanId = rawId.replace(/^#?FW-?/i, '').trim();
        const numTotal = Number(o.total_amount ?? o.totalAmount ?? o.grandTotal ?? o.total ?? 0);

        let liveStatus = (o.status || 'PLACED').toUpperCase();
        if (typeof window !== 'undefined' && window.FoodWalaApp && FoodWalaApp.Orders && typeof FoodWalaApp.Orders.getOrderStatus === 'function') {
          try {
            const stInfo = FoodWalaApp.Orders.getOrderStatus(o);
            if (stInfo && stInfo.status) liveStatus = stInfo.status.toUpperCase();
          } catch (e) {}
        }

        // Standardize items array
        const rawItems = o.items || [];
        const items = Array.isArray(rawItems) ? rawItems.map(it => {
          const itemName = it.item_name || it.name || it.itemName || 'Dish';
          const qty = Number(it.quantity || it.qty || 1);
          const price = Number(it.price || 0);
          const totalPrice = Number(it.total_price || it.totalPrice || it.item_total || (price * qty));
          return {
            item_name: itemName,
            name: itemName,
            quantity: qty,
            price: price,
            total_price: totalPrice
          };
        }) : [];

        const dateVal = o.order_date || o.orderDate || o.createdAt || (o.createdAtMs ? new Date(o.createdAtMs).toISOString() : new Date().toISOString());

        return {
          ...o,
          order_id: cleanId,
          orderId: cleanId,
          id: cleanId,
          restaurant_id: targetRestId,
          restaurantId: targetRestId,
          customer_name: o.customer_name || o.customerName || (o.address && o.address.fullName) || 'Customer',
          customerName: o.customer_name || o.customerName || (o.address && o.address.fullName) || 'Customer',
          customer_phone: o.customer_phone || o.customerPhone || (o.address && o.address.phone) || '-',
          customerPhone: o.customer_phone || o.customerPhone || (o.address && o.address.phone) || '-',
          delivery_address: o.delivery_address || o.deliveryAddress || (o.address && o.address.street) || 'Bengaluru',
          deliveryAddress: o.delivery_address || o.deliveryAddress || (o.address && o.address.street) || 'Bengaluru',
          total_amount: numTotal,
          totalAmount: numTotal,
          payment_mode: o.payment_mode || o.paymentMode || o.paymentMethod || 'Razorpay',
          paymentMode: o.payment_mode || o.paymentMode || o.paymentMethod || 'Razorpay',
          status: liveStatus,
          order_date: dateVal,
          orderDate: dateVal,
          createdAt: dateVal,
          items: items
        };
      });

      // Sort newest first
      orders.sort((a, b) => {
        const timeA = new Date(a.order_date || a.orderDate || a.createdAt || 0).getTime() || 0;
        const timeB = new Date(b.order_date || b.orderDate || b.createdAt || 0).getTime() || 0;
        return timeB - timeA;
      });

      return {
        success: true,
        orders: orders
      };
    },

    updateRestaurantOrderStatus: async function (orderId, status) {
      const cleanId = String(orderId).replace(/^#?FW-?/i, '').trim();
      const numId = parseInt(cleanId, 10);
      const newStatus = (status || '').toUpperCase();

      // 1. Update kitchen orders
      let kitchenOrders = getLocal('foodwala_mock_kitchen_orders', []);
      let kFound = false;
      kitchenOrders = kitchenOrders.map(o => {
        const oId = String(o.order_id || o.orderId || o.id || '').replace(/^#?FW-?/i, '').trim();
        if (oId === cleanId || (numId && parseInt(oId, 10) === numId)) {
          o.status = newStatus;
          o.orderStatus = newStatus;
          if (newStatus === 'DELIVERED') o.deliveredAt = new Date().toISOString();
          kFound = true;
        }
        return o;
      });
      if (!kFound) {
        kitchenOrders.unshift({
          order_id: cleanId,
          orderId: cleanId,
          id: cleanId,
          status: newStatus,
          orderStatus: newStatus,
          deliveredAt: newStatus === 'DELIVERED' ? new Date().toISOString() : undefined
        });
      }
      setLocal('foodwala_mock_kitchen_orders', kitchenOrders);

      // 2. Update foodwala_orders
      let appOrders = getLocal('foodwala_orders', []);
      if (Array.isArray(appOrders)) {
        appOrders = appOrders.map(o => {
          const oId = String(o.orderId || o.order_id || o.id || '').replace(/^#?FW-?/i, '').trim();
          if (oId === cleanId || (numId && parseInt(oId, 10) === numId)) {
            o.status = newStatus;
            o.deliveryStatus = newStatus;
            o.orderStatus = newStatus;
            if (newStatus === 'DELIVERED') o.deliveredAt = new Date().toISOString();
          }
          return o;
        });
        setLocal('foodwala_orders', appOrders);
      }

      // 3. Update foodwala_mock_orders
      let mockOrders = getLocal(STORAGE_KEYS.MOCK_ORDERS, []);
      if (Array.isArray(mockOrders)) {
        mockOrders = mockOrders.map(o => {
          const oId = String(o.orderId || o.order_id || o.id || '').replace(/^#?FW-?/i, '').trim();
          if (oId === cleanId || (numId && parseInt(oId, 10) === numId)) {
            o.status = newStatus;
            o.deliveryStatus = newStatus;
            o.orderStatus = newStatus;
            if (newStatus === 'DELIVERED') o.deliveredAt = new Date().toISOString();
          }
          return o;
        });
        setLocal(STORAGE_KEYS.MOCK_ORDERS, mockOrders);
      }

      // 4. Update inside mock users
      let users = getLocal(STORAGE_KEYS.MOCK_USERS, []);
      if (Array.isArray(users)) {
        let userChanged = false;
        users.forEach(u => {
          if (Array.isArray(u.orders)) {
            u.orders.forEach(o => {
              const oId = String(o.orderId || o.order_id || o.id || '').replace(/^#?FW-?/i, '').trim();
              if (oId === cleanId || (numId && parseInt(oId, 10) === numId)) {
                o.status = newStatus;
                o.deliveryStatus = newStatus;
                o.orderStatus = newStatus;
                if (newStatus === 'DELIVERED') o.deliveredAt = new Date().toISOString();
                userChanged = true;
              }
            });
          }
        });
        if (userChanged) {
          setLocal(STORAGE_KEYS.MOCK_USERS, users);
        }
      }

      // 5. Dispatch global order status changed event
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('foodwala:orderStatusChanged', {
          detail: { orderId: cleanId, status: newStatus }
        }));
      }

      return {
        success: true,
        orderId: cleanId,
        status: newStatus,
        message: `Order #FW-${cleanId} status updated to ${newStatus}`
      };
    }
  };

  window.FoodWalaAdapters.mock = mockAdapter;

})(typeof window !== 'undefined' ? window : this);

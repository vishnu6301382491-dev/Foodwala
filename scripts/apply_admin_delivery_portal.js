const fs = require('fs');
const path = require('path');

const root = 'D:\\FoodWala_Eclipse_Project';

// ==========================================
// 1. UPDATE mockAdapter.js
// ==========================================
const mockAdapterPath = path.join(root, 'js', 'adapters', 'mockAdapter.js');
let mockContent = fs.readFileSync(mockAdapterPath, 'utf8');

// Ensure STORAGE_KEYS includes DELIVERY_PARTNERS
if (!mockContent.includes("DELIVERY_PARTNERS:")) {
  mockContent = mockContent.replace(
    /LOGIN_HISTORY:\s*'foodwala_mock_login_history',/,
    "LOGIN_HISTORY: 'foodwala_mock_login_history',\n    DELIVERY_PARTNERS: 'foodwala_mock_delivery_partners',"
  );
}

// Add initMockDeliveryPartners helper if not present
if (!mockContent.includes("function initMockDeliveryPartners()")) {
  const initDeliveryPartnersCode = `
  function initMockDeliveryPartners() {
    let partners = getLocal(STORAGE_KEYS.DELIVERY_PARTNERS, null);
    if (!partners || !Array.isArray(partners) || partners.length === 0) {
      partners = [
        {
          partnerId: 101,
          id: 101,
          name: 'Kiran Kumar',
          email: 'deliveryfoodwala@gmail.com',
          phone: '9900000201',
          vehicleType: 'Electric Scooter',
          vehicleNumber: 'KA-05-EV-4219',
          deliveryZone: 'Koramangala & HSR',
          dutyStatus: 'ONLINE',
          isAvailable: 1,
          rating: 4.9,
          totalDeliveries: 142,
          todayDeliveries: 8,
          walletBalance: 12450.00,
          currentOrderId: '#FW-89102',
          joinedDate: '2026-01-15',
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'
        },
        {
          partnerId: 102,
          id: 102,
          name: 'Ramesh Kumar',
          email: 'delivery@foodwala.com',
          phone: '9876543230',
          vehicleType: 'Hero Splendor',
          vehicleNumber: 'KA-01-AB-1234',
          deliveryZone: 'Indiranagar & Domlur',
          dutyStatus: 'ONLINE',
          isAvailable: 1,
          rating: 4.8,
          totalDeliveries: 218,
          todayDeliveries: 12,
          walletBalance: 18920.50,
          currentOrderId: null,
          joinedDate: '2026-02-01',
          avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80'
        },
        {
          partnerId: 103,
          id: 103,
          name: 'Suresh Kumar',
          email: 'suresh.hero@foodwala.com',
          phone: '9123456789',
          vehicleType: 'TVS Jupiter',
          vehicleNumber: 'KA-04-EF-5678',
          deliveryZone: 'Jayanagar & JP Nagar',
          dutyStatus: 'ON_DELIVERY',
          isAvailable: 0,
          rating: 4.9,
          totalDeliveries: 305,
          todayDeliveries: 14,
          walletBalance: 24600.00,
          currentOrderId: '#FW-99432',
          joinedDate: '2025-11-20',
          avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80'
        },
        {
          partnerId: 104,
          id: 104,
          name: 'Rajesh V',
          email: 'rajesh.delivery@foodwala.com',
          phone: '9845012345',
          vehicleType: 'Ather 450X',
          vehicleNumber: 'KA-03-EV-9988',
          deliveryZone: 'Whitefield & Marathahalli',
          dutyStatus: 'ONLINE',
          isAvailable: 1,
          rating: 5.0,
          totalDeliveries: 89,
          todayDeliveries: 6,
          walletBalance: 7800.00,
          currentOrderId: null,
          joinedDate: '2026-03-10',
          avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=150&q=80'
        },
        {
          partnerId: 105,
          id: 105,
          name: 'Vikram Reddy',
          email: 'vikram.hero@foodwala.com',
          phone: '9731234567',
          vehicleType: 'Bajaj Pulsar',
          vehicleNumber: 'KA-51-CD-3456',
          deliveryZone: 'BTM Layout & Madiwala',
          dutyStatus: 'OFFLINE',
          isAvailable: 0,
          rating: 4.7,
          totalDeliveries: 176,
          todayDeliveries: 0,
          walletBalance: 15100.00,
          currentOrderId: null,
          joinedDate: '2026-02-18',
          avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=150&q=80'
        },
        {
          partnerId: 106,
          id: 106,
          name: 'Sneha Patil',
          email: 'sneha.delivery@foodwala.com',
          phone: '9620123456',
          vehicleType: 'Honda Activa 6G',
          vehicleNumber: 'KA-02-GH-7890',
          deliveryZone: 'Malleshwaram & Rajajinagar',
          dutyStatus: 'ONLINE',
          isAvailable: 1,
          rating: 4.9,
          totalDeliveries: 114,
          todayDeliveries: 9,
          walletBalance: 9950.00,
          currentOrderId: null,
          joinedDate: '2026-01-28',
          avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80'
        }
      ];
      setLocal(STORAGE_KEYS.DELIVERY_PARTNERS, partners);
    }
    return partners;
  }
`;
  mockContent = mockContent.replace(/function initMockUsers\(\)/, initDeliveryPartnersCode + '\n  function initMockUsers()');
}

// Add getAdminDeliveryPartners & updateDeliveryPartnerStatus
if (!mockContent.includes("getAdminDeliveryPartners:")) {
  const adminPartnerMethods = `
    getAdminDeliveryPartners: async function () {
      const partners = initMockDeliveryPartners();
      try {
        const allUsers = initMockUsers();
        allUsers.forEach(u => {
          const role = (u.role || '').toLowerCase();
          if ((role === 'partner' || role === 'delivery_partner') && !partners.some(p => p.email === u.email || p.id === u.userId)) {
            partners.push({
              partnerId: u.userId,
              id: u.userId,
              name: u.name || u.username,
              email: u.email,
              phone: u.phone,
              vehicleType: u.vehicleType || 'Motorcycle',
              vehicleNumber: u.vehicleNumber || 'KA-05-MN-7890',
              deliveryZone: u.deliveryZone || 'Bengaluru Central',
              dutyStatus: u.isAvailable ? 'ONLINE' : 'OFFLINE',
              isAvailable: u.isAvailable || 0,
              rating: u.rating || 4.9,
              totalDeliveries: u.totalDeliveries || 10,
              todayDeliveries: 2,
              walletBalance: 1200.00,
              currentOrderId: null,
              joinedDate: u.memberSince || '2026-03-01',
              avatar: u.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'
            });
          }
        });
      } catch (e) {}
      return {
        success: true,
        partners: partners,
        totalPartners: partners.length,
        onlineCount: partners.filter(p => p.dutyStatus === 'ONLINE' || p.dutyStatus === 'ON_DELIVERY').length
      };
    },

    updateDeliveryPartnerStatus: async function (partnerId, status) {
      const partners = initMockDeliveryPartners();
      const pId = parseInt(partnerId, 10);
      const found = partners.find(p => p.partnerId === pId || p.id === pId);
      if (found) {
        found.dutyStatus = status;
        found.isAvailable = (status === 'ONLINE' || status === 'ON_DELIVERY' ? 1 : 0);
        setLocal(STORAGE_KEYS.DELIVERY_PARTNERS, partners);
        return { success: true, partner: found };
      }
      return { success: false, message: 'Partner not found' };
    },
`;
  mockContent = mockContent.replace(/getAdminLoginHistory:\s*async function\s*\(\)\s*\{/, adminPartnerMethods + '\n    getAdminLoginHistory: async function () {');
}

fs.writeFileSync(mockAdapterPath, mockContent, 'utf8');
console.log('Updated mockAdapter.js');

// ==========================================
// 2. UPDATE liveAdapter.js
// ==========================================
const liveAdapterPath = path.join(root, 'js', 'adapters', 'liveAdapter.js');
let liveContent = fs.readFileSync(liveAdapterPath, 'utf8');

if (!liveContent.includes("getAdminDeliveryPartners:")) {
  const liveAdminPartnerMethods = `
    getAdminDeliveryPartners: async function () {
      if (unavailableEndpoints.has('admin/delivery-partners')) {
        if (window.FoodWalaAdapters && window.FoodWalaAdapters.mock) {
          return await window.FoodWalaAdapters.mock.getAdminDeliveryPartners();
        }
      }
      try {
        const res = await liveFetch('/api/admin/delivery-partners', { headers: getAuthHeader() });
        if (res.ok) return await res.json();
        unavailableEndpoints.add('admin/delivery-partners');
        if (window.FoodWalaAdapters && window.FoodWalaAdapters.mock) {
          return await window.FoodWalaAdapters.mock.getAdminDeliveryPartners();
        }
        return { success: false, partners: [] };
      } catch (err) {
        unavailableEndpoints.add('admin/delivery-partners');
        if (window.FoodWalaAdapters && window.FoodWalaAdapters.mock) {
          return await window.FoodWalaAdapters.mock.getAdminDeliveryPartners();
        }
        return { success: false, partners: [] };
      }
    },

    updateDeliveryPartnerStatus: async function (partnerId, status) {
      try {
        const res = await liveFetch(\`/api/admin/delivery-partners/\${partnerId}/status\`, {
          method: 'PATCH',
          headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
          body: JSON.stringify({ status })
        });
        if (res.ok) return await res.json();
      } catch (e) {}
      if (window.FoodWalaAdapters && window.FoodWalaAdapters.mock) {
        return await window.FoodWalaAdapters.mock.updateDeliveryPartnerStatus(partnerId, status);
      }
      return { success: false };
    },
`;
  liveContent = liveContent.replace(/getAdminLoginHistory:\s*async function\s*\(\)\s*\{/, liveAdminPartnerMethods + '\n    getAdminLoginHistory: async function () {');
  fs.writeFileSync(liveAdapterPath, liveContent, 'utf8');
  console.log('Updated liveAdapter.js');
}

// ==========================================
// 3. UPDATE api.js
// ==========================================
const apiPath = path.join(root, 'js', 'api.js');
let apiContent = fs.readFileSync(apiPath, 'utf8');

if (!apiContent.includes("getAdminDeliveryPartners:")) {
  const apiAdminPartnerMethods = `
    getAdminDeliveryPartners: async function () {
      return await getAdapter().getAdminDeliveryPartners();
    },

    updateDeliveryPartnerStatus: async function (partnerId, status) {
      return await getAdapter().updateDeliveryPartnerStatus(partnerId, status);
    },
`;
  apiContent = apiContent.replace(/getAdminLoginHistory:\s*async function\s*\(\)\s*\{/, apiAdminPartnerMethods + '\n    getAdminLoginHistory: async function () {');
  fs.writeFileSync(apiPath, apiContent, 'utf8');
  console.log('Updated api.js');
}

console.log('Adapter and API updates applied.');

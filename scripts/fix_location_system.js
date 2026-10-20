const fs = require('fs');
const path = require('path');

function updateFile(filePath, search, replace) {
  const full = path.resolve(__dirname, '..', filePath);
  let content = fs.readFileSync(full, 'utf8');
  const usesCrlf = content.includes('\r\n');
  const normalized = content.replace(/\r\n/g, '\n');
  const normSearch = search.replace(/\r\n/g, '\n');
  const normReplace = replace.replace(/\r\n/g, '\n');

  if (!normalized.includes(normSearch)) {
    console.error(`[FAIL] String match not found in ${filePath}`);
    process.exit(1);
  }

  let updated = normalized.replace(normSearch, normReplace);
  if (usesCrlf) {
    updated = updated.replace(/\n/g, '\r\n');
  }
  fs.writeFileSync(full, updated, 'utf8');
  console.log(`[PASS] Updated ${filePath}`);
}

// -------------------------------------------------------------
// 1. UPDATE BENGALURU_LOCATIONS & REVERSE GEOCODING IN js/app.js
// -------------------------------------------------------------
const oldLocations = `  // 14 Bengaluru Delivery Hubs (Used for manual location selection & landmark geocoding)
  const BENGALURU_LOCATIONS = [
    { id: 'koramangala', name: 'Koramangala, Bengaluru', shortName: 'Koramangala', lat: 12.9352, lng: 77.6245, landmark: '5th Block, near Sony World Signal' },
    { id: 'indiranagar', name: 'Indiranagar, Bengaluru', shortName: 'Indiranagar', lat: 12.9784, lng: 77.6408, landmark: '100ft Road, near Metro Station' },
    { id: 'whitefield', name: 'Whitefield, Bengaluru', shortName: 'Whitefield', lat: 12.9698, lng: 77.7500, landmark: 'ITPL Main Road' },
    { id: 'mg_road', name: 'MG Road, Bengaluru', shortName: 'MG Road', lat: 12.9756, lng: 77.6066, landmark: 'Brigade Road Junction' },
    { id: 'hsr_layout', name: 'HSR Layout, Bengaluru', shortName: 'HSR Layout', lat: 12.9121, lng: 77.6446, landmark: 'Sector 3, 27th Main' },
    { id: 'malleshwaram', name: 'Malleshwaram, Bengaluru', shortName: 'Malleshwaram', lat: 13.0031, lng: 77.5643, landmark: '8th Cross, Sampige Road' },
    { id: 'jayanagar', name: 'Jayanagar, Bengaluru', shortName: 'Jayanagar', lat: 12.9308, lng: 77.5838, landmark: '4th Block Shopping Complex' },
    { id: 'electronic_city', name: 'Electronic City, Bengaluru', shortName: 'Electronic City', lat: 12.8399, lng: 77.6770, landmark: 'Phase 1, Velankani Drive' },
    { id: 'jp_nagar', name: 'JP Nagar, Bengaluru', shortName: 'JP Nagar', lat: 12.9063, lng: 77.5857, landmark: '2nd Phase, 15th Cross' },
    { id: 'bellandur', name: 'Bellandur, Bengaluru', shortName: 'Bellandur', lat: 12.9304, lng: 77.6784, landmark: 'Outer Ring Road, EcoSpace' },
    { id: 'marathahalli', name: 'Marathahalli, Bengaluru', shortName: 'Marathahalli', lat: 12.9591, lng: 77.6974, landmark: 'Innovative Multiplex Junction' },
    { id: 'hebbal', name: 'Hebbal, Bengaluru', shortName: 'Hebbal', lat: 13.0358, lng: 77.5970, landmark: 'Hebbal Flyover, Esteem Mall' },
    { id: 'basavanagudi', name: 'Basavanagudi, Bengaluru', shortName: 'Basavanagudi', lat: 12.9421, lng: 77.5754, landmark: 'Gandhi Bazaar Main Road' },
    { id: 'rajajinagar', name: 'Rajajinagar, Bengaluru', shortName: 'Rajajinagar', lat: 12.9915, lng: 77.5526, landmark: '1st Block, Dr. Rajkumar Road' }
  ];`;

const newLocations = `  // Comprehensive Bengaluru Delivery Hubs (Used for manual selection, GPS matching & reverse geocoding)
  const BENGALURU_LOCATIONS = [
    { id: 'maruthi_nagar', name: 'Maruthi Nagar, Bengaluru', shortName: 'Maruthi Nagar', lat: 12.9238, lng: 77.6186, landmark: 'Near Madiwala / Christ University / Tavarekere' },
    { id: 'koramangala', name: 'Koramangala, Bengaluru', shortName: 'Koramangala', lat: 12.9352, lng: 77.6245, landmark: '5th Block, near Sony World Signal' },
    { id: 'btm_layout', name: 'BTM Layout, Bengaluru', shortName: 'BTM Layout', lat: 12.9166, lng: 77.6101, landmark: 'Near Udupi Garden / Outer Ring Rd' },
    { id: 'madiwala', name: 'Madiwala, Bengaluru', shortName: 'Madiwala', lat: 12.9226, lng: 77.6200, landmark: 'Near Total Mall / Market' },
    { id: 'indiranagar', name: 'Indiranagar, Bengaluru', shortName: 'Indiranagar', lat: 12.9784, lng: 77.6408, landmark: '100ft Road, near Metro Station' },
    { id: 'whitefield', name: 'Whitefield, Bengaluru', shortName: 'Whitefield', lat: 12.9698, lng: 77.7500, landmark: 'ITPL Main Road' },
    { id: 'mg_road', name: 'MG Road, Bengaluru', shortName: 'MG Road', lat: 12.9756, lng: 77.6066, landmark: 'Brigade Road Junction' },
    { id: 'hsr_layout', name: 'HSR Layout, Bengaluru', shortName: 'HSR Layout', lat: 12.9121, lng: 77.6446, landmark: 'Sector 3, 27th Main' },
    { id: 'malleshwaram', name: 'Malleshwaram, Bengaluru', shortName: 'Malleshwaram', lat: 13.0031, lng: 77.5643, landmark: '8th Cross, Sampige Road' },
    { id: 'jayanagar', name: 'Jayanagar, Bengaluru', shortName: 'Jayanagar', lat: 12.9308, lng: 77.5838, landmark: '4th Block Shopping Complex' },
    { id: 'electronic_city', name: 'Electronic City, Bengaluru', shortName: 'Electronic City', lat: 12.8399, lng: 77.6770, landmark: 'Phase 1, Velankani Drive' },
    { id: 'jp_nagar', name: 'JP Nagar, Bengaluru', shortName: 'JP Nagar', lat: 12.9063, lng: 77.5857, landmark: '2nd Phase, 15th Cross' },
    { id: 'bellandur', name: 'Bellandur, Bengaluru', shortName: 'Bellandur', lat: 12.9304, lng: 77.6784, landmark: 'Outer Ring Road, EcoSpace' },
    { id: 'marathahalli', name: 'Marathahalli, Bengaluru', shortName: 'Marathahalli', lat: 12.9591, lng: 77.6974, landmark: 'Innovative Multiplex Junction' },
    { id: 'hebbal', name: 'Hebbal, Bengaluru', shortName: 'Hebbal', lat: 13.0358, lng: 77.5970, landmark: 'Hebbal Flyover, Esteem Mall' },
    { id: 'basavanagudi', name: 'Basavanagudi, Bengaluru', shortName: 'Basavanagudi', lat: 12.9421, lng: 77.5754, landmark: 'Gandhi Bazaar Main Road' },
    { id: 'rajajinagar', name: 'Rajajinagar, Bengaluru', shortName: 'Rajajinagar', lat: 12.9915, lng: 77.5526, landmark: '1st Block, Dr. Rajkumar Road' },
    { id: 'kalyan_nagar', name: 'Kalyan Nagar, Bengaluru', shortName: 'Kalyan Nagar', lat: 13.0280, lng: 77.6400, landmark: 'HRBR Layout, CMR Road' },
    { id: 'banashankari', name: 'Banashankari, Bengaluru', shortName: 'Banashankari', lat: 12.9255, lng: 77.5468, landmark: 'Near BDA Complex' },
    { id: 'sarjapur_road', name: 'Sarjapur Road, Bengaluru', shortName: 'Sarjapur Road', lat: 12.9110, lng: 77.6850, landmark: 'Near Wipro Corporate Office' }
  ];`;

const oldCleanLocation = `      // Clean obsolete fake default location if it has the old dummy format
      const locStr = localStorage.getItem(STORAGE_KEYS.LOCATION);
      if (locStr) {
        try {
          const loc = JSON.parse(locStr);
          if (loc && ((loc.id === 'koramangala' && !loc.source) || (loc.landmark && loc.landmark.includes('GPS Accuracy ~83m')))) {
            localStorage.removeItem(STORAGE_KEYS.LOCATION);
          }
        } catch(e) {}
      }`;

const newCleanLocation = `      // Clean obsolete fake default location or fix cached Koramangala false-positives for Maruthi Nagar
      const locStr = localStorage.getItem(STORAGE_KEYS.LOCATION);
      if (locStr) {
        try {
          const loc = JSON.parse(locStr);
          if (loc && ((loc.id === 'koramangala' && !loc.source) || (loc.landmark && loc.landmark.includes('GPS Accuracy ~83m')))) {
            localStorage.removeItem(STORAGE_KEYS.LOCATION);
          } else if (loc && loc.shortName === 'Koramangala' && loc.latitude >= 12.9180 && loc.latitude <= 12.9280 && loc.longitude >= 77.6110 && loc.longitude <= 77.6225) {
            loc.shortName = 'Maruthi Nagar';
            loc.address = 'Maruthi Nagar, Bengaluru (Near Madiwala / Christ University)';
            localStorage.setItem(STORAGE_KEYS.LOCATION, JSON.stringify(loc));
          }
        } catch(e) {}
      }`;

const oldGpsDetection = `          // Instantly match to closest Bengaluru Hub to avoid slow/failing external reverse-geocoders
          let shortName = "Current Location";
          let fullAddress = \`Live GPS Location (\${lat.toFixed(4)}, \${lng.toFixed(4)})\`;

          let closestHub = null;
          let minDistance = Infinity;
          for (const hub of BENGALURU_LOCATIONS) {
            const dist = Math.hypot(hub.lat - lat, hub.lng - lng);
            if (dist < minDistance) {
              minDistance = dist;
              closestHub = hub;
            }
          }

          if (closestHub && minDistance < 0.15) {
            shortName = closestHub.shortName;
            fullAddress = \`\${closestHub.name} (Near \${closestHub.landmark})\`;
          }`;

const newGpsDetection = `          let shortName = null;
          let fullAddress = null;

          // 1. High-Precision Micro-zone check: Maruthi Nagar (Madiwala / BTM 1st / Tavarekere boundary)
          if (lat >= 12.9180 && lat <= 12.9280 && lng >= 77.6110 && lng <= 77.6225) {
            shortName = "Maruthi Nagar";
            fullAddress = "Maruthi Nagar, Bengaluru (Near Madiwala / Christ University)";
          }

          // 2. Real reverse-geocoding via OpenStreetMap Nominatim with fast timeout
          if (!shortName) {
            try {
              const controller = new AbortController();
              const timeoutId = setTimeout(() => controller.abort(), 2500);
              const url = \`https://nominatim.openstreetmap.org/reverse?format=json&lat=\${lat}&lon=\${lng}&zoom=18&addressdetails=1\`;
              const res = await fetch(url, { signal: controller.signal, headers: { 'Accept': 'application/json' } });
              clearTimeout(timeoutId);
              if (res.ok) {
                const data = await res.json();
                if (data && data.address) {
                  const addr = data.address;
                  const allStr = JSON.stringify(addr).toLowerCase();
                  if (allStr.includes('maruthi nagar') || allStr.includes('maruthi nagara')) {
                    shortName = 'Maruthi Nagar';
                    fullAddress = \`Maruthi Nagar, \${addr.suburb || addr.quarter || 'Bengaluru'}\`;
                  } else {
                    let area = addr.neighbourhood || addr.suburb || addr.quarter || addr.residential || addr.road;
                    if (area) {
                      area = area.replace(/ Nagara$/i, ' Nagar').replace(/ East| West| North| South/gi, '');
                      shortName = area;
                      fullAddress = \`\${addr.road ? addr.road + ', ' : ''}\${area}, \${addr.city || 'Bengaluru'}\`;
                    }
                  }
                }
              }
            } catch (revErr) {
              console.warn('[FoodWala] Reverse geocode network notice:', revErr);
            }
          }

          // 3. Fallback to closest Bengaluru Hub in BENGALURU_LOCATIONS
          if (!shortName) {
            let closestHub = null;
            let minDistance = Infinity;
            for (const hub of BENGALURU_LOCATIONS) {
              const dist = Math.hypot(hub.lat - lat, hub.lng - lng);
              if (dist < minDistance) {
                minDistance = dist;
                closestHub = hub;
              }
            }

            if (closestHub && minDistance < 0.15) {
              shortName = closestHub.shortName;
              fullAddress = \`\${closestHub.name} (Near \${closestHub.landmark})\`;
            } else {
              shortName = "Current Location";
              fullAddress = \`Live GPS Location (\${lat.toFixed(4)}, \${lng.toFixed(4)})\`;
            }
          }`;

// Update both js/app.js and js/app.min.js
['js/app.js', 'js/app.min.js'].forEach(file => {
  updateFile(file, oldLocations, newLocations);
  updateFile(file, oldCleanLocation, newCleanLocation);
  updateFile(file, oldGpsDetection, newGpsDetection);
});

// -------------------------------------------------------------
// 2. ADD MARUTHI NAGAR TO js/areas.js
// -------------------------------------------------------------
updateFile(
  'js/areas.js',
  `    { name: 'Marathahalli', pincode: '560037', zone: 'East' },\n    { name: 'Marenahalli', pincode: '560040', zone: 'South' },`,
  `    { name: 'Marathahalli', pincode: '560037', zone: 'East' },\n    { name: 'Marenahalli', pincode: '560040', zone: 'South' },\n    { name: 'Maruthi Nagar', pincode: '560068', zone: 'South' },`
);

// -------------------------------------------------------------
// 3. BUMP SCRIPT CACHE VERSIONS FROM 20261020_02 TO 20261020_03
// -------------------------------------------------------------
const htmlFiles = ['index.html', 'home.html', 'login.html', 'register.html'];
for (const hf of htmlFiles) {
  const full = path.resolve(__dirname, '..', hf);
  let c = fs.readFileSync(full, 'utf8');
  if (c.includes('20261020_02')) {
    c = c.replace(/20261020_02/g, '20261020_03');
    fs.writeFileSync(full, c, 'utf8');
    console.log(`[PASS] Bumped cache version in ${hf} to 20261020_03`);
  }
}

// -------------------------------------------------------------
// 4. MIRROR ALL FILES TO src/main/webapp/
// -------------------------------------------------------------
const filesToMirror = [
  'js/app.js',
  'js/app.min.js',
  'js/areas.js',
  'index.html',
  'home.html',
  'login.html',
  'register.html'
];

for (const rel of filesToMirror) {
  const src = path.resolve(__dirname, '..', rel);
  const dst = path.resolve(__dirname, '..', 'src/main/webapp', rel);
  fs.copyFileSync(src, dst);
  console.log(`[PASS] Mirrored ${rel} -> src/main/webapp/${rel}`);
}

console.log('[ALL COMPLETED] Location detection system updated and mirrored.');

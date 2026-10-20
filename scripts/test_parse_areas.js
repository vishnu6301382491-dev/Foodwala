async function testParse() {
  const coordsList = [
    { lat: 12.92158, lon: 77.61370, label: 'Maruthi Nagar Main Rd / BTM 1st' },
    { lat: 12.9238, lon: 77.6186, label: 'Maruthi Nagar near Madiwala underpass' },
    { lat: 12.92569, lon: 77.61536, label: 'Maruthi Nagar Jai Bheema Nagar' },
    { lat: 12.9352, lon: 77.6245, label: 'Koramangala 5th Block' },
    { lat: 12.9121, lon: 77.6446, label: 'HSR Layout Sector 3' }
  ];

  for (const c of coordsList) {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${c.lat}&lon=${c.lon}&zoom=18&addressdetails=1`;
      const res = await fetch(url, { headers: { 'User-Agent': 'FoodWala-BengaluruApp/1.0' } });
      const data = await res.json();
      const addr = data.address || {};
      
      let candidate = addr.neighbourhood || addr.suburb || addr.quarter || addr.residential || addr.road || addr.city_district || 'Bengaluru';
      if (candidate.toLowerCase() === 'maruthi nagara') candidate = 'Maruthi Nagar';
      if (addr.road && addr.road.toLowerCase().includes('maruthi nagar')) candidate = 'Maruthi Nagar';

      console.log(`[${c.label}]:`);
      console.log(`   Detected Name: "${candidate}"`);
      console.log(`   Road: "${addr.road}", Suburb: "${addr.suburb}", Neighbourhood: "${addr.neighbourhood}", Quarter: "${addr.quarter}"`);
    } catch (e) {
      console.error(`Error for ${c.label}:`, e.message);
    }
  }
}
testParse();

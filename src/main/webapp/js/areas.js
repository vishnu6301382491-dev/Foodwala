/**
 * FoodWala - Comprehensive Bengaluru Areas & Searchable Combobox Component (areas.js)
 * Contains 270+ alphabetically sorted Bengaluru localities across North, South, East, West, Central, and Outskirts.
 */

(function (window) {
  'use strict';

  const BENGALURU_AREAS = [
    { name: 'Adugodi', pincode: '560030', zone: 'South' },
    { name: 'Agara', pincode: '560102', zone: 'South' },
    { name: 'Akshayanagar', pincode: '560068', zone: 'South' },
    { name: 'Ambalipura', pincode: '560102', zone: 'South' },
    { name: 'Amruthahalli', pincode: '560092', zone: 'North' },
    { name: 'Anand Nagar', pincode: '560024', zone: 'North' },
    { name: 'Ananthnagar', pincode: '560100', zone: 'South' },
    { name: 'Anekal', pincode: '562106', zone: 'Outskirts' },
    { name: 'Anjanapura', pincode: '560062', zone: 'South' },
    { name: 'Arekere', pincode: '560076', zone: 'South' },
    { name: 'Ashok Nagar', pincode: '560025', zone: 'Central' },
    { name: 'Attibele', pincode: '562107', zone: 'Outskirts' },
    { name: 'Attiguppe', pincode: '560040', zone: 'West' },
    { name: 'Austin Town', pincode: '560047', zone: 'Central' },
    { name: 'Babusa Palya', pincode: '560043', zone: 'East' },
    { name: 'Bagalgunte', pincode: '560073', zone: 'West' },
    { name: 'Bagalur', pincode: '562149', zone: 'North' },
    { name: 'Baiyappanahalli', pincode: '560038', zone: 'East' },
    { name: 'Balagere', pincode: '560087', zone: 'East' },
    { name: 'Banashankari Stage 1', pincode: '560050', zone: 'South' },
    { name: 'Banashankari Stage 2', pincode: '560070', zone: 'South' },
    { name: 'Banashankari Stage 3', pincode: '560085', zone: 'South' },
    { name: 'Banashankari Stage 5', pincode: '560078', zone: 'South' },
    { name: 'Banashankari Stage 6', pincode: '560061', zone: 'South' },
    { name: 'Banaswadi', pincode: '560043', zone: 'East' },
    { name: 'Bannerghatta Road', pincode: '560076', zone: 'South' },
    { name: 'Basavanagudi', pincode: '560004', zone: 'South' },
    { name: 'Basaveshwara Nagar', pincode: '560079', zone: 'West' },
    { name: 'Battarahalli', pincode: '560049', zone: 'East' },
    { name: 'Begur', pincode: '560068', zone: 'South' },
    { name: 'Belathur', pincode: '560067', zone: 'East' },
    { name: 'Bellandur', pincode: '560103', zone: 'East' },
    { name: 'Bennigana Halli', pincode: '560033', zone: 'East' },
    { name: 'Benson Town', pincode: '560046', zone: 'Central' },
    { name: 'Bhoganhalli', pincode: '560103', zone: 'East' },
    { name: 'Bhuvaneshwari Nagar', pincode: '560024', zone: 'North' },
    { name: 'Bidadi', pincode: '562109', zone: 'Outskirts' },
    { name: 'Bidrahalli', pincode: '560049', zone: 'East' },
    { name: 'Bikkanahalli', pincode: '562125', zone: 'East' },
    { name: 'Bilekahalli', pincode: '560076', zone: 'South' },
    { name: 'Binnypet', pincode: '560023', zone: 'Central' },
    { name: 'Bommanahalli', pincode: '560068', zone: 'South' },
    { name: 'Bommasandra', pincode: '560099', zone: 'South' },
    { name: 'Brigade Road', pincode: '560001', zone: 'Central' },
    { name: 'Brookefield', pincode: '560037', zone: 'East' },
    { name: 'BTM Layout 1st Stage', pincode: '560029', zone: 'South' },
    { name: 'BTM Layout 2nd Stage', pincode: '560076', zone: 'South' },
    { name: 'Budigere Cross', pincode: '562129', zone: 'East' },
    { name: 'Byatarayanapura', pincode: '560092', zone: 'North' },
    { name: 'Cambridge Layout', pincode: '560008', zone: 'Central' },
    { name: 'Carmelaram', pincode: '560035', zone: 'East' },
    { name: 'Castro Town', pincode: '560084', zone: 'Central' },
    { name: 'Chamrajpet', pincode: '560018', zone: 'Central' },
    { name: 'Chandapura', pincode: '560099', zone: 'South' },
    { name: 'Chandra Layout', pincode: '560040', zone: 'West' },
    { name: 'Channasandra', pincode: '560067', zone: 'East' },
    { name: 'Chelekere', pincode: '560043', zone: 'East' },
    { name: 'Chikkabanavara', pincode: '560090', zone: 'North' },
    { name: 'Chikkaballapur Road', pincode: '562110', zone: 'Outskirts' },
    { name: 'Chikkajala', pincode: '562157', zone: 'North' },
    { name: 'Chikkalasandra', pincode: '560061', zone: 'South' },
    { name: 'Choodasandra', pincode: '560099', zone: 'South' },
    { name: 'Commercial Street', pincode: '560001', zone: 'Central' },
    { name: 'Cooke Town', pincode: '560005', zone: 'Central' },
    { name: 'Cottonpet', pincode: '560053', zone: 'Central' },
    { name: 'Cox Town', pincode: '560005', zone: 'Central' },
    { name: 'Cubbon Park', pincode: '560001', zone: 'Central' },
    { name: 'Cunningham Road', pincode: '560052', zone: 'Central' },
    { name: 'Dasarahalli', pincode: '560057', zone: 'West' },
    { name: 'Dayananda Nagar', pincode: '560021', zone: 'Central' },
    { name: 'Deepanjali Nagar', pincode: '560026', zone: 'West' },
    { name: 'Devanahalli', pincode: '562110', zone: 'North' },
    { name: 'Devarachikkanahalli', pincode: '560076', zone: 'South' },
    { name: 'Doddaballapur Road', pincode: '561203', zone: 'North' },
    { name: 'Doddabanahalli', pincode: '560067', zone: 'East' },
    { name: 'Doddakallasandra', pincode: '560062', zone: 'South' },
    { name: 'Doddakannelli', pincode: '560035', zone: 'East' },
    { name: 'Doddaneekundi', pincode: '560037', zone: 'East' },
    { name: 'Doddanekundi Extension', pincode: '560037', zone: 'East' },
    { name: 'Doddathoguru', pincode: '560100', zone: 'South' },
    { name: 'Domlur', pincode: '560071', zone: 'East' },
    { name: 'Dommasandra', pincode: '562125', zone: 'East' },
    { name: 'Dooravani Nagar', pincode: '560016', zone: 'East' },
    { name: 'Ejipura', pincode: '560047', zone: 'South' },
    { name: 'Electronic City Phase 1', pincode: '560100', zone: 'South' },
    { name: 'Electronic City Phase 2', pincode: '560100', zone: 'South' },
    { name: 'Frazer Town', pincode: '560005', zone: 'Central' },
    { name: 'Ganga Nagar', pincode: '560032', zone: 'North' },
    { name: 'Garudacharpalya', pincode: '560048', zone: 'East' },
    { name: 'Gattahalli', pincode: '560099', zone: 'South' },
    { name: 'Girinagar', pincode: '560085', zone: 'South' },
    { name: 'Gottigere', pincode: '560083', zone: 'South' },
    { name: 'Gunjur', pincode: '560087', zone: 'East' },
    { name: 'HAL 2nd Stage', pincode: '560008', zone: 'East' },
    { name: 'HAL 3rd Stage', pincode: '560075', zone: 'East' },
    { name: 'Haralur', pincode: '560102', zone: 'South' },
    { name: 'Harlur Road', pincode: '560102', zone: 'South' },
    { name: 'Hebbal', pincode: '560024', zone: 'North' },
    { name: 'Hebbal Kempapura', pincode: '560024', zone: 'North' },
    { name: 'Hegde Nagar', pincode: '560077', zone: 'North' },
    { name: 'Hennur', pincode: '560043', zone: 'North' },
    { name: 'Hennur Bande', pincode: '560043', zone: 'North' },
    { name: 'Hennur Gardens', pincode: '560043', zone: 'North' },
    { name: 'Hessarghatta', pincode: '560088', zone: 'North' },
    { name: 'Hombegowda Nagar', pincode: '560027', zone: 'South' },
    { name: 'Hongasandra', pincode: '560068', zone: 'South' },
    { name: 'Hoodi', pincode: '560048', zone: 'East' },
    { name: 'Horamavu', pincode: '560043', zone: 'East' },
    { name: 'Horamavu Agara', pincode: '560043', zone: 'East' },
    { name: 'Hosakerehalli', pincode: '560085', zone: 'South' },
    { name: 'Hosa Road', pincode: '560100', zone: 'South' },
    { name: 'Hoskote', pincode: '562114', zone: 'Outskirts' },
    { name: 'Hosur Road', pincode: '560068', zone: 'South' },
    { name: 'HSR Layout Sector 1', pincode: '560102', zone: 'South' },
    { name: 'HSR Layout Sector 2', pincode: '560102', zone: 'South' },
    { name: 'HSR Layout Sector 3', pincode: '560102', zone: 'South' },
    { name: 'HSR Layout Sector 4', pincode: '560102', zone: 'South' },
    { name: 'HSR Layout Sector 5', pincode: '560102', zone: 'South' },
    { name: 'HSR Layout Sector 6', pincode: '560102', zone: 'South' },
    { name: 'HSR Layout Sector 7', pincode: '560102', zone: 'South' },
    { name: 'Hulimavu', pincode: '560076', zone: 'South' },
    { name: 'Hunasamaranahalli', pincode: '562157', zone: 'North' },
    { name: 'Indiranagar 1st Stage', pincode: '560038', zone: 'East' },
    { name: 'Indiranagar 2nd Stage', pincode: '560038', zone: 'East' },
    { name: 'Infantry Road', pincode: '560001', zone: 'Central' },
    { name: 'ISRO Layout', pincode: '560078', zone: 'South' },
    { name: 'ITPL', pincode: '560066', zone: 'East' },
    { name: 'Jakkur', pincode: '560064', zone: 'North' },
    { name: 'Jalahalli East', pincode: '560013', zone: 'North' },
    { name: 'Jalahalli West', pincode: '560015', zone: 'North' },
    { name: 'Jaya Chamarajendra Nagar', pincode: '560006', zone: 'Central' },
    { name: 'Jayanagar 1st Block', pincode: '560011', zone: 'South' },
    { name: 'Jayanagar 2nd Block', pincode: '560011', zone: 'South' },
    { name: 'Jayanagar 3rd Block', pincode: '560011', zone: 'South' },
    { name: 'Jayanagar 4th Block', pincode: '560041', zone: 'South' },
    { name: 'Jayanagar 5th Block', pincode: '560041', zone: 'South' },
    { name: 'Jayanagar 7th Block', pincode: '560070', zone: 'South' },
    { name: 'Jayanagar 9th Block', pincode: '560069', zone: 'South' },
    { name: 'Jaymahal', pincode: '560046', zone: 'Central' },
    { name: 'Jeevanbheemanagar', pincode: '560075', zone: 'East' },
    { name: 'Jigani', pincode: '560105', zone: 'South' },
    { name: 'JP Nagar Phase 1', pincode: '560078', zone: 'South' },
    { name: 'JP Nagar Phase 2', pincode: '560078', zone: 'South' },
    { name: 'JP Nagar Phase 3', pincode: '560078', zone: 'South' },
    { name: 'JP Nagar Phase 5', pincode: '560078', zone: 'South' },
    { name: 'JP Nagar Phase 6', pincode: '560078', zone: 'South' },
    { name: 'JP Nagar Phase 7', pincode: '560078', zone: 'South' },
    { name: 'JP Nagar Phase 8', pincode: '560076', zone: 'South' },
    { name: 'Kadubeesanahalli', pincode: '560103', zone: 'East' },
    { name: 'Kadugodi', pincode: '560067', zone: 'East' },
    { name: 'Kaggadasapura', pincode: '560093', zone: 'East' },
    { name: 'Kalasipalyam', pincode: '560002', zone: 'Central' },
    { name: 'Kalkere', pincode: '560043', zone: 'East' },
    { name: 'Kalyan Nagar', pincode: '560043', zone: 'North' },
    { name: 'Kammanahalli', pincode: '560084', zone: 'North' },
    { name: 'Kammasandra', pincode: '560100', zone: 'South' },
    { name: 'Kanakapura Road', pincode: '560062', zone: 'South' },
    { name: 'Kasavanahalli', pincode: '560035', zone: 'South' },
    { name: 'Kasturi Nagar', pincode: '560043', zone: 'East' },
    { name: 'Kathriguppe', pincode: '560085', zone: 'South' },
    { name: 'Kaval Byrasandra', pincode: '560032', zone: 'North' },
    { name: 'Kempapura', pincode: '560024', zone: 'North' },
    { name: 'Kengeri', pincode: '560060', zone: 'West' },
    { name: 'Kengeri Satellite Town', pincode: '560060', zone: 'West' },
    { name: 'Kodichikkanahalli', pincode: '560076', zone: 'South' },
    { name: 'Kodigehalli', pincode: '560092', zone: 'North' },
    { name: 'Kodihalli', pincode: '560008', zone: 'East' },
    { name: 'Konanakunte', pincode: '560062', zone: 'South' },
    { name: 'Koramangala 1st Block', pincode: '560034', zone: 'South' },
    { name: 'Koramangala 3rd Block', pincode: '560034', zone: 'South' },
    { name: 'Koramangala 4th Block', pincode: '560034', zone: 'South' },
    { name: 'Koramangala 5th Block', pincode: '560095', zone: 'South' },
    { name: 'Koramangala 6th Block', pincode: '560095', zone: 'South' },
    { name: 'Koramangala 7th Block', pincode: '560095', zone: 'South' },
    { name: 'Kothanur', pincode: '560077', zone: 'North' },
    { name: 'Kottigepalya', pincode: '560091', zone: 'West' },
    { name: 'KR Market', pincode: '560002', zone: 'Central' },
    { name: 'KR Puram', pincode: '560036', zone: 'East' },
    { name: 'Kudlu', pincode: '560068', zone: 'South' },
    { name: 'Kudlu Gate', pincode: '560068', zone: 'South' },
    { name: 'Kumaraswamy Layout', pincode: '560078', zone: 'South' },
    { name: 'Kundalahalli', pincode: '560037', zone: 'East' },
    { name: 'Kurubarahalli', pincode: '560086', zone: 'West' },
    { name: 'Lavelle Road', pincode: '560001', zone: 'Central' },
    { name: 'Lingarajapuram', pincode: '560084', zone: 'North' },
    { name: 'Madavara', pincode: '562123', zone: 'North' },
    { name: 'Madiwala', pincode: '560068', zone: 'South' },
    { name: 'Magadi Road', pincode: '560023', zone: 'West' },
    { name: 'Mahadevapura', pincode: '560048', zone: 'East' },
    { name: 'Mahalakshmi Layout', pincode: '560086', zone: 'West' },
    { name: 'Majestic', pincode: '560009', zone: 'Central' },
    { name: 'Malleshpalya', pincode: '560075', zone: 'East' },
    { name: 'Malleshwaram', pincode: '560003', zone: 'North' },
    { name: 'Marathahalli', pincode: '560037', zone: 'East' },
    { name: 'Marenahalli', pincode: '560040', zone: 'South' },
    { name: 'Mathikere', pincode: '560054', zone: 'North' },
    { name: 'Medahalli', pincode: '560049', zone: 'East' },
    { name: 'Meenakshi Layout', pincode: '560076', zone: 'South' },
    { name: 'MG Road', pincode: '560001', zone: 'Central' },
    { name: 'Millers Road', pincode: '560052', zone: 'Central' },
    { name: 'Munnekollal', pincode: '560037', zone: 'East' },
    { name: 'Murugeshpalya', pincode: '560017', zone: 'East' },
    { name: 'Muthyala Nagar', pincode: '560054', zone: 'North' },
    { name: 'Mysore Road', pincode: '560026', zone: 'West' },
    { name: 'Nagarbhavi 1st Stage', pincode: '560072', zone: 'West' },
    { name: 'Nagarbhavi 2nd Stage', pincode: '560072', zone: 'West' },
    { name: 'Nagasandra', pincode: '560073', zone: 'West' },
    { name: 'Nagavara', pincode: '560045', zone: 'North' },
    { name: 'Nagawara Junction', pincode: '560045', zone: 'North' },
    { name: 'Nallurhalli', pincode: '560066', zone: 'East' },
    { name: 'Nandini Layout', pincode: '560096', zone: 'West' },
    { name: 'Neelasandra', pincode: '560047', zone: 'Central' },
    { name: 'Nelamangala', pincode: '562123', zone: 'Outskirts' },
    { name: 'New BEL Road', pincode: '560054', zone: 'North' },
    { name: 'New Thippasandra', pincode: '560075', zone: 'East' },
    { name: 'Old Airport Road', pincode: '560008', zone: 'East' },
    { name: 'Old Madras Road', pincode: '560008', zone: 'East' },
    { name: 'Padmanabhanagar', pincode: '560070', zone: 'South' },
    { name: 'Palace Guttahalli', pincode: '560003', zone: 'Central' },
    { name: 'Panathur', pincode: '560103', zone: 'East' },
    { name: 'Peenya 1st Stage', pincode: '560058', zone: 'West' },
    { name: 'Peenya 2nd Stage', pincode: '560058', zone: 'West' },
    { name: 'Peenya Industrial Area', pincode: '560058', zone: 'West' },
    { name: 'Prashanth Nagar', pincode: '560079', zone: 'West' },
    { name: 'Race Course Road', pincode: '560001', zone: 'Central' },
    { name: 'Rachenahalli', pincode: '560077', zone: 'North' },
    { name: 'Rajajinagar 1st Block', pincode: '560010', zone: 'West' },
    { name: 'Rajajinagar 2nd Block', pincode: '560010', zone: 'West' },
    { name: 'Rajajinagar 3rd Block', pincode: '560010', zone: 'West' },
    { name: 'Rajajinagar 4th Block', pincode: '560010', zone: 'West' },
    { name: 'Rajarajeshwari Nagar', pincode: '560098', zone: 'West' },
    { name: 'Ramamurthy Nagar', pincode: '560016', zone: 'East' },
    { name: 'Richmond Town', pincode: '560025', zone: 'Central' },
    { name: 'RMV 2nd Stage', pincode: '560094', zone: 'North' },
    { name: 'RMV Extension', pincode: '560080', zone: 'North' },
    { name: 'RT Nagar', pincode: '560032', zone: 'North' },
    { name: 'Sadashivanagar', pincode: '560080', zone: 'North' },
    { name: 'Sahakara Nagar', pincode: '560092', zone: 'North' },
    { name: 'Sampangi Rama Nagar', pincode: '560027', zone: 'Central' },
    { name: 'Sanjay Nagar', pincode: '560094', zone: 'North' },
    { name: 'Sanjaynagar CPWD Quarters', pincode: '560094', zone: 'North' },
    { name: 'Sarjapur Road', pincode: '560035', zone: 'South' },
    { name: 'Sarjapur Town', pincode: '562125', zone: 'Outskirts' },
    { name: 'Seshadripuram', pincode: '560020', zone: 'Central' },
    { name: 'Shanthi Nagar', pincode: '560027', zone: 'Central' },
    { name: 'Shivajinagar', pincode: '560051', zone: 'Central' },
    { name: 'Singasandra', pincode: '560068', zone: 'South' },
    { name: 'Srirampuram', pincode: '560021', zone: 'Central' },
    { name: 'Subramanyapura', pincode: '560061', zone: 'South' },
    { name: 'Sulikere', pincode: '560060', zone: 'West' },
    { name: 'T Dasarahalli', pincode: '560057', zone: 'West' },
    { name: 'TC Palya', pincode: '560036', zone: 'East' },
    { name: 'Thanisandra', pincode: '560077', zone: 'North' },
    { name: 'Thippasandra', pincode: '560075', zone: 'East' },
    { name: 'Thubarahalli', pincode: '560066', zone: 'East' },
    { name: 'Ulsoor', pincode: '560008', zone: 'Central' },
    { name: 'Uttarahalli', pincode: '560061', zone: 'South' },
    { name: 'Varthur', pincode: '560087', zone: 'East' },
    { name: 'Vasanth Nagar', pincode: '560052', zone: 'Central' },
    { name: 'Victoria Layout', pincode: '560047', zone: 'Central' },
    { name: 'Vidyaranyapura', pincode: '560097', zone: 'North' },
    { name: 'Vijayanagar', pincode: '560040', zone: 'West' },
    { name: 'Vimanapura', pincode: '560017', zone: 'East' },
    { name: 'Vinayaka Nagar', pincode: '560030', zone: 'South' },
    { name: 'Viveka Nagar', pincode: '560047', zone: 'Central' },
    { name: 'Whitefield', pincode: '560066', zone: 'East' },
    { name: 'Wilson Garden', pincode: '560027', zone: 'Central' },
    { name: 'Wind Tunnel Road', pincode: '560017', zone: 'East' },
    { name: 'Yelachenahalli', pincode: '560078', zone: 'South' },
    { name: 'Yelahanka New Town', pincode: '560064', zone: 'North' },
    { name: 'Yelahanka Old Town', pincode: '560064', zone: 'North' },
    { name: 'Yemalur', pincode: '560037', zone: 'East' },
    { name: 'Yeshwanthpur', pincode: '560022', zone: 'North' }
  ];

  // Alphabetically sort areas
  BENGALURU_AREAS.sort((a, b) => a.name.localeCompare(b.name));

  // Search filter helper: case-insensitive contains with word-start matches prioritized
  function searchAreas(query) {
    if (!query || !query.trim()) return BENGALURU_AREAS.slice(0, 30);
    const clean = query.trim().toLowerCase();

    const wordStartMatches = [];
    const containsMatches = [];

    for (let i = 0; i < BENGALURU_AREAS.length; i++) {
      const area = BENGALURU_AREAS[i];
      const lower = area.name.toLowerCase();
      const pin = area.pincode;

      if (lower.startsWith(clean) || lower.split(/\s+/).some(w => w.startsWith(clean))) {
        wordStartMatches.push(area);
      } else if (lower.includes(clean) || pin.includes(clean)) {
        containsMatches.push(area);
      }
    }

    return [...wordStartMatches, ...containsMatches];
  }

  // Highlight matched portion in text
  function highlightMatch(text, query) {
    if (!query || !query.trim()) return text;
    const clean = query.trim();
    const regex = new RegExp(`(${clean.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<strong class="text-danger">$1</strong>');
  }

  /**
   * Initialize a Searchable Combobox for Area Selection
   * @param {Object} options
   *   - inputEl: HTMLInputElement
   *   - dropdownEl: HTMLElement (container for results)
   *   - pincodeInputEl: (Optional) HTMLInputElement to auto-populate pincode
   *   - onSelect: (Optional) Callback function(selectedArea)
   */
  function initCombobox(options) {
    const input = typeof options.input === 'string' ? document.getElementById(options.input) : options.input;
    const dropdown = typeof options.dropdown === 'string' ? document.getElementById(options.dropdown) : options.dropdown;
    const pincodeInput = options.pincodeInput ? (typeof options.pincodeInput === 'string' ? document.getElementById(options.pincodeInput) : options.pincodeInput) : null;
    const onSelect = options.onSelect || function () {};

    if (!input || !dropdown) return null;

    let debounceTimer = null;
    let activeIndex = -1;
    let currentResults = [];

    // Ensure styling on dropdown container
    dropdown.style.maxHeight = '280px';
    dropdown.style.overflowY = 'auto';
    dropdown.style.position = 'absolute';
    dropdown.style.zIndex = '1060';
    dropdown.style.width = '100%';
    dropdown.style.top = '100%';
    dropdown.style.left = '0';
    dropdown.style.display = 'none';
    dropdown.className = 'dropdown-menu shadow-lg border rounded-3 p-1 w-100';

    // Position wrapper relative
    if (input.parentElement) {
      input.parentElement.style.position = 'relative';
    }

    function renderDropdown(items, query) {
      currentResults = items;
      activeIndex = -1;

      if (!items || items.length === 0) {
        dropdown.innerHTML = `
          <div class="p-3 text-center">
            <div class="text-muted small mb-2"><i class="bi bi-geo-alt"></i> No area found matching "<b>${query}</b>"</div>
            <button type="button" class="btn btn-outline-danger btn-sm rounded-pill w-100 fw-bold js-use-custom-area">
              Use "<b>${query}</b>" as my area
            </button>
          </div>
        `;
        dropdown.style.display = 'block';

        const customBtn = dropdown.querySelector('.js-use-custom-area');
        if (customBtn) {
          customBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            selectArea({ name: query, pincode: '560001', zone: 'Bengaluru' });
          });
        }
        return;
      }

      dropdown.innerHTML = items.map((item, idx) => `
        <a href="#" class="dropdown-item py-2 px-3 rounded-2 d-flex align-items-center justify-content-between area-option-item" data-index="${idx}">
          <div>
            <i class="bi bi-geo-alt text-danger me-2"></i>
            <span class="fw-semibold text-dark">${highlightMatch(item.name, query)}</span>
            <small class="text-muted ms-2">(${item.pincode})</small>
          </div>
          <span class="badge bg-light text-muted border small">${item.zone}</span>
        </a>
      `).join('');

      dropdown.style.display = 'block';

      dropdown.querySelectorAll('.area-option-item').forEach(el => {
        el.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          const idx = parseInt(el.getAttribute('data-index'), 10);
          if (currentResults[idx]) {
            selectArea(currentResults[idx]);
          }
        });
      });
    }

    function selectArea(area) {
      input.value = area.name;
      if (pincodeInput && area.pincode) {
        pincodeInput.value = area.pincode;
      }
      dropdown.style.display = 'none';
      input.classList.remove('is-invalid');
      onSelect(area);
    }

    function updateActiveItem() {
      const items = dropdown.querySelectorAll('.area-option-item');
      items.forEach((item, idx) => {
        if (idx === activeIndex) {
          item.classList.add('active', 'bg-danger', 'text-white');
          item.scrollIntoView({ block: 'nearest' });
        } else {
          item.classList.remove('active', 'bg-danger', 'text-white');
        }
      });
    }

    // Input event with 150ms debounce
    input.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        const query = input.value.trim();
        const results = searchAreas(query);
        renderDropdown(results, query);
      }, 150);
    });

    // Focus shows initial list
    input.addEventListener('focus', () => {
      const query = input.value.trim();
      const results = searchAreas(query);
      renderDropdown(results, query);
    });

    // Keyboard navigation (Up, Down, Enter, Esc)
    input.addEventListener('keydown', (e) => {
      if (dropdown.style.display === 'none') {
        if (e.key === 'ArrowDown') {
          renderDropdown(searchAreas(input.value.trim()), input.value.trim());
        }
        return;
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (currentResults.length > 0) {
          activeIndex = (activeIndex + 1) % currentResults.length;
          updateActiveItem();
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (currentResults.length > 0) {
          activeIndex = (activeIndex - 1 + currentResults.length) % currentResults.length;
          updateActiveItem();
        }
      } else if (e.key === 'Enter') {
        if (activeIndex >= 0 && currentResults[activeIndex]) {
          e.preventDefault();
          selectArea(currentResults[activeIndex]);
        }
      } else if (e.key === 'Escape') {
        dropdown.style.display = 'none';
      }
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
      if (!input.contains(e.target) && !dropdown.contains(e.target)) {
        dropdown.style.display = 'none';
      }
    });

    return {
      selectArea: selectArea,
      close: () => { dropdown.style.display = 'none'; }
    };
  }

  // Populate Location Modal for header across all pages
  function populateLocationModal(containerId) {
    const container = document.getElementById(containerId || 'location-options-list');
    if (!container) return;

    container.innerHTML = `
      <div class="p-3 border-bottom bg-light">
        <div class="input-group">
          <span class="input-group-text bg-white border-end-0"><i class="bi bi-search text-danger"></i></span>
          <input type="text" id="modal-area-search" class="form-control border-start-0" placeholder="Search 270+ Bengaluru localities..." autocomplete="off">
        </div>
      </div>
      <div class="p-2" id="modal-area-results" style="max-height: 380px; overflow-y: auto;">
        <!-- Area items rendered here -->
      </div>
    `;

    const searchInput = document.getElementById('modal-area-search');
    const resultsContainer = document.getElementById('modal-area-results');

    function renderModalAreas(list, query) {
      if (!list || list.length === 0) {
        resultsContainer.innerHTML = `
          <div class="p-4 text-center text-muted">
            <i class="bi bi-geo-alt fs-3 d-block mb-2 text-danger"></i>
            <div>No locality found matching "<b>${query}</b>"</div>
          </div>
        `;
        return;
      }

      resultsContainer.innerHTML = list.map(item => `
        <button type="button" class="dropdown-item py-2 px-3 rounded-3 d-flex align-items-center justify-content-between mb-1 js-header-area-pick" data-name="${item.name}" data-pincode="${item.pincode}" data-zone="${item.zone}">
          <div class="d-flex align-items-center">
            <div class="bg-danger-subtle text-danger rounded-circle p-2 me-3 d-flex align-items-center justify-content-center" style="width: 32px; height: 32px;">
              <i class="bi bi-geo-alt-fill" style="font-size: 14px;"></i>
            </div>
            <div>
              <div class="fw-bold text-dark">${highlightMatch(item.name, query)}</div>
              <small class="text-muted">${item.zone} Bengaluru &bull; ${item.pincode}</small>
            </div>
          </div>
          <i class="bi bi-chevron-right text-muted small"></i>
        </button>
      `).join('');

      resultsContainer.querySelectorAll('.js-header-area-pick').forEach(btn => {
        btn.addEventListener('click', () => {
          const areaName = btn.getAttribute('data-name');
          const pincode = btn.getAttribute('data-pincode');
          if (window.FoodWalaApp && FoodWalaApp.Location) {
            FoodWalaApp.Location.setCurrentLocation({
              name: areaName,
              area: areaName,
              address: `${areaName}, Bengaluru, Karnataka - ${pincode}`,
              pincode: pincode,
              latitude: 12.9716,
              longitude: 77.5946
            });
          }
          const modalEl = document.getElementById('locationModal');
          if (modalEl && window.bootstrap) {
            const bsModal = bootstrap.Modal.getInstance(modalEl);
            if (bsModal) bsModal.hide();
          }
        });
      });
    }

    renderModalAreas(BENGALURU_AREAS.slice(0, 40), '');

    let timer = null;
    searchInput.addEventListener('input', () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        const q = searchInput.value.trim();
        renderModalAreas(searchAreas(q), q);
      }, 150);
    });
  }

  window.BENGALURU_AREAS = BENGALURU_AREAS;
  window.FoodWalaAreaPicker = {
    areas: BENGALURU_AREAS,
    search: searchAreas,
    initCombobox: initCombobox,
    populateLocationModal: populateLocationModal
  };

})(typeof window !== 'undefined' ? window : this);

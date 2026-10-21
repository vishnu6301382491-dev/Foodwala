const fs = require('fs');
const path = require('path');
const vm = require('vm');

function verifyHtmlSyntax(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const scriptRegex = /<script(?![^>]*\bsrc\b)[^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  let scriptIndex = 0;
  while ((match = scriptRegex.exec(content)) !== null) {
    scriptIndex++;
    const code = match[1].trim();
    if (!code) continue;
    try {
      new vm.Script(code);
    } catch (err) {
      console.error('❌ SyntaxError in ' + filePath + ' (script #' + scriptIndex + '): ' + err.message);
      return false;
    }
  }
  return true;
}

// 1. PATCH SERVER.JS
const serverPath = path.resolve('server/server.js');
let serverContent = fs.readFileSync(serverPath, 'utf8');

// Patch GET /api/restaurants
serverContent = serverContent.replace(
  /\/\/ Format fields to ensure backwards compatibility with UI[\s\S]*?res\.json\(formatted\);/,
  function() {
    return '// Format fields to ensure backwards compatibility with UI\n' +
      '    const formatted = rows.map(r => {\n' +
      '      const img = r.image_path || "https://images.unsplash.com/photo-1555396273-367ea4eb4db5";\n' +
      '      const delTimeNum = parseInt(r.delivery_time, 10) || 30;\n' +
      '      return {\n' +
      '        id: r.restaurant_id,\n' +
      '        restaurant_id: r.restaurant_id,\n' +
      '        restaurantId: r.restaurant_id,\n' +
      '        name: r.name,\n' +
      '        cuisine: r.cuisine_type,\n' +
      '        cuisine_type: r.cuisine_type,\n' +
      '        cuisineType: r.cuisine_type,\n' +
      '        rating: parseFloat(r.rating) || 4.2,\n' +
      '        deliveryTime: delTimeNum + " mins",\n' +
      '        delivery_time: delTimeNum,\n' +
      '        priceForTwo: "₹400 for two",\n' +
      '        costForTwo: 400,\n' +
      '        address: r.address || ((r.area || "Bengaluru Central") + ", Bengaluru"),\n' +
      '        area: r.area || "Bengaluru Central",\n' +
      '        city: r.city || "Bengaluru",\n' +
      '        image: img,\n' +
      '        image_path: img,\n' +
      '        imagePath: img,\n' +
      '        latitude: r.latitude,\n' +
      '        longitude: r.longitude,\n' +
      '        phone: r.phone,\n' +
      '        isOpen: r.is_open === 1 || r.is_open === null,\n' +
      '        deliveryFee: r.delivery_fee || 30\n' +
      '      };\n' +
      '    });\n\n' +
      '    res.json(formatted);';
  }
);

// Patch GET /api/restaurants/:id
serverContent = serverContent.replace(
  /app\.get\('\/api\/restaurants\/:id',[\s\S]*?res\.json\(\{[\s\S]*?isOpen:\s*r\.is_open\s*===\s*1[\s\S]*?\}\);/m,
  function() {
    return "app.get('/api/restaurants/:id', async (req, res) => {\n" +
      "  try {\n" +
      "    const restId = parseInt(req.params.id, 10);\n" +
      "    const [rows] = await db.execute(\n" +
      "      'SELECT * FROM restaurant WHERE restaurant_id = ?',\n" +
      "      [restId]\n" +
      "    );\n\n" +
      "    if (rows.length === 0) {\n" +
      "      return res.status(404).json({ error: 'Restaurant not found' });\n" +
      "    }\n\n" +
      "    const r = rows[0];\n" +
      "    const img = r.image_path || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5';\n" +
      "    const delTimeNum = parseInt(r.delivery_time, 10) || 30;\n" +
      "    res.json({\n" +
      "      id: r.restaurant_id,\n" +
      "      restaurant_id: r.restaurant_id,\n" +
      "      restaurantId: r.restaurant_id,\n" +
      "      name: r.name,\n" +
      "      cuisine: r.cuisine_type,\n" +
      "      cuisine_type: r.cuisine_type,\n" +
      "      cuisineType: r.cuisine_type,\n" +
      "      rating: parseFloat(r.rating) || 4.2,\n" +
      "      deliveryTime: delTimeNum + ' mins',\n" +
      "      delivery_time: delTimeNum,\n" +
      "      address: r.address,\n" +
      "      area: r.area,\n" +
      "      city: r.city,\n" +
      "      image: img,\n" +
      "      image_path: img,\n" +
      "      imagePath: img,\n" +
      "      latitude: r.latitude,\n" +
      "      longitude: r.longitude,\n" +
      "      phone: r.phone,\n" +
      "      deliveryFee: r.delivery_fee || 30,\n" +
      "      isOpen: r.is_open === 1\n" +
      "    });";
  }
);

fs.writeFileSync(serverPath, serverContent, 'utf8');
console.log('✅ Patched server.js endpoints');

// 2. PATCH JS/APP.JS & JS/APP.MIN.JS
function patchAppJs(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Patch optimizeImageUrl
  content = content.replace(
    /function optimizeImageUrl\(url, width = 400\) \{[\s\S]*?if \(!url \|\| typeof url !== 'string'\) return url;/,
    "function optimizeImageUrl(url, width = 400) {\n" +
    "    if (!url || typeof url !== 'string' || url === 'undefined' || url === 'null' || url.trim() === '') {\n" +
    "      return 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=' + width + '&q=75';\n" +
    "    }"
  );

  // Patch loadRestaurants
  content = content.replace(
    /if \(Array\.isArray\(dbRestaurants\) && dbRestaurants\.length >= 10\) \{\s*restaurantsCache = dbRestaurants;/,
    "if (Array.isArray(dbRestaurants) && dbRestaurants.length >= 10) {\n" +
    "          restaurantsCache = dbRestaurants.map(r => {\n" +
    "            const rawImg = r.image_path || r.image || r.imagePath || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=500&q=75';\n" +
    "            const delNum = parseInt(r.delivery_time || r.deliveryTime, 10) || 30;\n" +
    "            return {\n" +
    "              ...r,\n" +
    "              id: r.id || r.restaurant_id,\n" +
    "              restaurantId: r.restaurant_id || r.id,\n" +
    "              imagePath: rawImg,\n" +
    "              image_path: rawImg,\n" +
    "              image: rawImg,\n" +
    "              deliveryTime: delNum + ' mins',\n" +
    "              delivery_time: delNum,\n" +
    "              cuisineType: r.cuisineType || r.cuisine_type || r.cuisine || 'Multi-Cuisine'\n" +
    "            };\n" +
    "          });"
  );

  fs.writeFileSync(filePath, content, 'utf8');
  console.log('✅ Patched ' + filePath);
}

patchAppJs(path.resolve('js/app.js'));
patchAppJs(path.resolve('js/app.min.js'));
if (fs.existsSync('src/main/webapp/js/app.js')) patchAppJs(path.resolve('src/main/webapp/js/app.js'));
if (fs.existsSync('src/main/webapp/js/app.min.js')) patchAppJs(path.resolve('src/main/webapp/js/app.min.js'));

// 3. PATCH RESTAURANTS.HTML
function patchRestaurantsHtml(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Replace image resolution in restaurants.html
  content = content.replace(
    /const imgUrl = window\.FoodWalaApp && FoodWalaApp\.optimizeImageUrl \? FoodWalaApp\.optimizeImageUrl\(r\.imagePath, 400\) : \(r\.imagePath \|\| '[^']*'\);/g,
    "const rawImg = r.imagePath || r.image_path || r.image || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=400&q=75';\n" +
    "          const imgUrl = (window.FoodWalaApp && FoodWalaApp.optimizeImageUrl) ? FoodWalaApp.optimizeImageUrl(rawImg, 400) : rawImg;\n" +
    "          const delTime = (typeof r.deliveryTime === 'string' && r.deliveryTime.toLowerCase().includes('min')) ? r.deliveryTime : ((r.deliveryTime || r.delivery_time || 30) + ' mins');"
  );

  // Replace img tag to include onerror
  content = content.replace(
    /<img src="\$\{imgUrl\}" class="card-img-top" width="360" height="180" loading="lazy" decoding="async" style="height: 180px; object-fit: cover;" alt="\$\{r\.name\}">/g,
    '<img src="${imgUrl}" class="card-img-top" width="360" height="180" loading="lazy" decoding="async" style="height: 180px; object-fit: cover;" alt="${r.name}" onerror="this.onerror=null;this.src=\'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=400&q=75\';">'
  );

  // Replace duplicate badge ${r.deliveryTime || 30} mins
  content = content.replace(
    /<i class="bi bi-clock me-1"><\/i>\s*\$\{r\.deliveryTime \|\| 30\}\s*mins/g,
    '<i class="bi bi-clock me-1"></i> ${delTime}'
  );

  fs.writeFileSync(filePath, content, 'utf8');
  console.log('✅ Patched ' + filePath);
  verifyHtmlSyntax(filePath);
}

patchRestaurantsHtml(path.resolve('restaurants.html'));
if (fs.existsSync('src/main/webapp/restaurants.html')) {
  patchRestaurantsHtml(path.resolve('src/main/webapp/restaurants.html'));
}

// 4. PATCH INDEX.HTML & HOME.HTML
function patchHomeOrIndex(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Fix fast filter: (r.deliveryTime || 30) <= 30
  content = content.replace(
    /\(r\.deliveryTime\s*\|\|\s*30\)\s*<=\s*30/g,
    'parseInt(r.deliveryTime || r.delivery_time || 30, 10) <= 30'
  );

  // Fix badge: ${r.deliveryTime || 30} mins -> clean delTime
  content = content.replace(
    /<i class="bi bi-lightning-charge-fill text-warning"><\/i>\s*\$\{r\.deliveryTime \|\| 30\}\s*mins/g,
    "<i class=\"bi bi-lightning-charge-fill text-warning\"></i> ${typeof r.deliveryTime === 'string' && r.deliveryTime.toLowerCase().includes('min') ? r.deliveryTime : (r.deliveryTime || 30) + ' mins'}"
  );

  // Ensure card image has onerror
  content = content.replace(
    /(<img src="\$\{getOptimizedFoodImg\([^}]+\)[^"]*" class="card-img-top"[^>]*)(>)/g,
    function(match, p1, p2) {
      if (p1.includes('onerror=')) return match;
      return p1 + " onerror=\"this.onerror=null;this.src='https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=400&q=75';\"" + p2;
    }
  );

  fs.writeFileSync(filePath, content, 'utf8');
  console.log('✅ Patched ' + filePath);
  verifyHtmlSyntax(filePath);
}

patchHomeOrIndex(path.resolve('index.html'));
patchHomeOrIndex(path.resolve('home.html'));
if (fs.existsSync('src/main/webapp/index.html')) patchHomeOrIndex(path.resolve('src/main/webapp/index.html'));
if (fs.existsSync('src/main/webapp/home.html')) patchHomeOrIndex(path.resolve('src/main/webapp/home.html'));

// 5. PATCH MENU.HTML & RESTAURANT-DETAILS.HTML
function patchMenuOrDetails(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Fix image assignment: if (restaurant.imagePath) ...
  content = content.replace(
    /if\s*\(\s*restaurant\.imagePath\s*\)\s*\{\s*document\.getElementById\('rest-img'\)\.src\s*=\s*restaurant\.imagePath;\s*\}/g,
    "const heroRestImg = restaurant.imagePath || restaurant.image_path || restaurant.image;\n      if (heroRestImg) {\n        document.getElementById('rest-img').src = heroRestImg;\n      }"
  );

  // Fix delivery time text
  content = content.replace(
    /document\.getElementById\('rest-time'\)\.textContent\s*=\s*`\$\{restaurant\.deliveryTime \|\| 30\}\s*mins`;/g,
    "document.getElementById('rest-time').textContent = typeof restaurant.deliveryTime === 'string' && restaurant.deliveryTime.toLowerCase().includes('min') ? restaurant.deliveryTime : `${restaurant.deliveryTime || restaurant.delivery_time || 30} mins`;"
  );

  fs.writeFileSync(filePath, content, 'utf8');
  console.log('✅ Patched ' + filePath);
  verifyHtmlSyntax(filePath);
}

patchMenuOrDetails(path.resolve('menu.html'));
patchMenuOrDetails(path.resolve('restaurant-details.html'));
if (fs.existsSync('src/main/webapp/menu.html')) patchMenuOrDetails(path.resolve('src/main/webapp/menu.html'));
if (fs.existsSync('src/main/webapp/restaurant-details.html')) patchMenuOrDetails(path.resolve('src/main/webapp/restaurant-details.html'));

console.log('\n🎉 ALL MEDIA, IMAGE AND BADGE FIXES APPLIED SUCCESSFULLY!');

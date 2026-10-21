const fs = require('fs');

const files = [
  'D:/FoodWala_Eclipse_Project/login.html',
  'D:/FoodWala_Eclipse_Project/src/main/webapp/login.html'
];

files.forEach(filePath => {
  if (!fs.existsSync(filePath)) {
    console.log('Skipping missing file:', filePath);
    return;
  }
  let content = fs.readFileSync(filePath, 'utf8');

  const oldTarget = `} else if (role === "restaurant" || role === "restaurant_admin") {
            window.location.href = "./restaurant-dashboard.html";
          }`;

  const newTarget = `} else if (role === "restaurant" || role === "restaurant_admin" || role === "manager" || selectedRole === "restaurant") {
            let restId = (loggedInUser && (loggedInUser.restaurantId || loggedInUser.restaurant_id)) || null;
            if (!restId && email) {
              const mgr = typeof findRestaurantManager === 'function' ? findRestaurantManager(email) : null;
              if (mgr) {
                restId = mgr.id;
                if (loggedInUser) {
                  loggedInUser.restaurantId = mgr.id;
                  loggedInUser.restaurant_id = mgr.id;
                  loggedInUser.restaurantName = mgr.name;
                  try {
                    localStorage.setItem("foodwala_current_user", JSON.stringify(loggedInUser));
                    localStorage.setItem("foodwala_user", JSON.stringify(loggedInUser));
                  } catch (e) {}
                }
              }
            }
            if (restId) {
              window.location.href = \`./restaurant-dashboard.html?id=\${restId}\`;
            } else {
              window.location.href = "./restaurant-dashboard.html";
            }
          }`;

  // Handle both CRLF and LF
  const normalizedContent = content.replace(/\r\n/g, '\n');
  if (normalizedContent.includes(oldTarget.replace(/\r\n/g, '\n'))) {
    content = normalizedContent.replace(oldTarget.replace(/\r\n/g, '\n'), newTarget);
    // Restore CRLF
    content = content.replace(/\n/g, '\r\n');
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Successfully updated login routing in:', filePath);
  } else {
    console.warn('Could not find oldTarget in:', filePath);
  }
});

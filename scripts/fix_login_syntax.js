const fs = require('fs');
const vm = require('vm');

function fixLoginFile(filePath) {
  console.log(`Checking ${filePath}...`);
  let content = fs.readFileSync(filePath, 'utf8');

  // 1. Remove redundant }); under "// Demo logins permanently disabled"
  const badPattern = /\/\/ Demo logins permanently disabled\r?\n\s*\}\);\r?\n/;
  if (badPattern.test(content)) {
    content = content.replace(badPattern, '// Demo logins permanently disabled\r\n');
    console.log(`  -> Removed redundant }); after demo logins comment.`);
  }

  // 2. Redirect delivery partners to ./delivery-dashboard.html
  const rolePattern = /(role === 'partner' \|\| role === 'delivery_partner'\)\s*\{\r?\n\s*window\.location\.href = )'\.\/orders\.html';/g;
  if (rolePattern.test(content)) {
    content = content.replace(rolePattern, `$1'./delivery-dashboard.html';`);
    console.log(`  -> Updated delivery partner redirect to ./delivery-dashboard.html.`);
  }

  fs.writeFileSync(filePath, content, 'utf8');

  // Verify syntax
  const scriptMatch = content.match(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/i);
  if (scriptMatch) {
    try {
      new vm.Script(scriptMatch[1], { filename: filePath });
      console.log(`  ✅ SYNTAX CHECK PASSED for ${filePath}`);
    } catch (err) {
      console.error(`  ❌ SYNTAX ERROR in ${filePath}:`, err.message);
      process.exit(1);
    }
  }
}

fixLoginFile('D:/FoodWala_Eclipse_Project/login.html');
fixLoginFile('D:/FoodWala_Eclipse_Project/src/main/webapp/login.html');

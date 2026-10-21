const fs = require('fs');
const path = require('path');
const vm = require('vm');

const rootDir = 'D:/FoodWala_Eclipse_Project';
const htmlFiles = fs.readdirSync(rootDir).filter(f => f.endsWith('.html'));

console.log('============================================================');
console.log(`🔍 AST SYNTAX VALIDATION ACROSS ${htmlFiles.length} HTML FILES`);
console.log('============================================================');

let hasError = false;

for (const file of htmlFiles) {
  const fullPath = path.join(rootDir, file);
  const content = fs.readFileSync(fullPath, 'utf8');
  const scriptMatches = [...content.matchAll(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/gi)];

  if (scriptMatches.length === 0) continue;

  scriptMatches.forEach((m, idx) => {
    try {
      new vm.Script(m[1], { filename: `${file}:script[${idx}]` });
      console.log(`✅ PASS: ${file} (script #${idx + 1}) syntax valid`);
    } catch (err) {
      console.error(`❌ FAIL: ${file} (script #${idx + 1}) SYNTAX ERROR:`, err.message);
      hasError = true;
    }
  });
}

if (hasError) {
  console.error('\n❌ ONE OR MORE FILES FAILED SYNTAX VALIDATION!');
  process.exit(1);
} else {
  console.log('\n🎉 ALL CLIENT-SIDE SCRIPTS PASSED SYNTAX VALIDATION 100%!');
}

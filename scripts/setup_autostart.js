/**
 * scripts/setup_autostart.js
 * Configures persistent auto-start for FoodWala API Server and Cloudflare Tunnel
 * Creates a minimized Windows Startup Shortcut in the user's Startup directory.
 */

const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

const projectRoot = path.resolve(__dirname, '..');
const batPath = path.join(projectRoot, 'start_foodwala_services.bat');
const appData = process.env.APPDATA || path.join(process.env.USERPROFILE, 'AppData', 'Roaming');
const startupFolder = path.join(appData, 'Microsoft', 'Windows', 'Start Menu', 'Programs', 'Startup');
const shortcutPath = path.join(startupFolder, 'FoodWala_Services.lnk');

const isDisable = process.argv.includes('--disable') || process.argv.includes('-d');

console.log('================================================================');
console.log('       FoodWala Windows Persistent Auto-Start Manager');
console.log('================================================================\n');

if (isDisable) {
  console.log('[*] Disabling persistent auto-start...');

  if (fs.existsSync(shortcutPath)) {
    try {
      fs.unlinkSync(shortcutPath);
      console.log('   [OK] Removed Windows Startup shortcut:');
      console.log('        ' + shortcutPath);
    } catch (err) {
      console.warn('   [-] Could not delete shortcut:', err.message);
    }
  } else {
    console.log('   [-] Startup shortcut does not exist.');
  }

  console.log('\n================================================================');
  console.log('   Persistent auto-start has been DISABLED.');
  console.log('================================================================\n');
  process.exit(0);
}

// ENABLE AUTOSTART
console.log('[*] Target Project Root :', projectRoot);
console.log('[*] Target Launch Batch :', batPath);
console.log('[*] Startup Folder      :', startupFolder);

if (!fs.existsSync(batPath)) {
  console.error('[ERROR] start_foodwala_services.bat not found at', batPath);
  process.exit(1);
}

if (!fs.existsSync(startupFolder)) {
  fs.mkdirSync(startupFolder, { recursive: true });
}

// Create Minimized Windows Startup Shortcut (.lnk)
console.log('\n[*] Creating minimized Windows Startup Shortcut...');
const psCommand = [
  `$WshShell = New-Object -ComObject WScript.Shell;`,
  `$Shortcut = $WshShell.CreateShortcut('${shortcutPath.replace(/'/g, "''")}');`,
  `$Shortcut.TargetPath = '${batPath.replace(/'/g, "''")}';`,
  `$Shortcut.WorkingDirectory = '${projectRoot.replace(/'/g, "''")}';`,
  `$Shortcut.WindowStyle = 7;`,
  `$Shortcut.Description = 'FoodWala WhatsApp AI and Backend Services';`,
  `$Shortcut.Save();`
].join(' ');

try {
  execSync(`powershell -NoProfile -ExecutionPolicy Bypass -Command "${psCommand}"`, {
    stdio: 'inherit'
  });
  if (fs.existsSync(shortcutPath)) {
    console.log('   [OK] Created Windows Startup Shortcut successfully:');
    console.log('        ' + shortcutPath);
  } else {
    throw new Error('Shortcut file was not found after execution.');
  }
} catch (err) {
  console.error('   [-] Error creating shortcut:', err.message);
  process.exit(1);
}

console.log('\n================================================================');
console.log('   Persistent auto-start has been successfully ENABLED!');
console.log('   - FoodWala will automatically launch whenever Windows boots up.');
console.log('   - Both API Server (port 5000) and Cloudflare Tunnel will start.');
console.log('   - Double-click "stop_foodwala_services.bat" anytime to stop services.');
console.log('   - Run "npm run autostart:disable" to remove from Windows startup.');
console.log('================================================================\n');

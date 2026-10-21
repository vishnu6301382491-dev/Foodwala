const fs = require('fs');
const path = require('path');

const mockFiles = [
  path.resolve('js/adapters/mockAdapter.js'),
  path.resolve('src/main/webapp/js/adapters/mockAdapter.js')
];

for (const mockPath of mockFiles) {
  let content = fs.readFileSync(mockPath, 'utf8');

  const oldTarget = `const cleanPass = String(password || '').trim();
      const standardPasswords = ['password', 'Admin@123', 'admin123', 'Password@123', 'Partner@123', 'Restaurant@123', 'Vishnu@123', 'vishnu@123', 'Vishnu@143', 'vishnu@143', '12345678', '1234567890', '123456', 'admin', '6301382491', 'Vishnu143', 'vishnu143', 'Vishnu@45', 'vishnu@45', 'kababmagic'];
      const isPassValid = (user.passwordHash === inputHash) || 
                          (user.passwordHash === password) || 
                          (user.password === password) || 
                          (user.password === cleanPass) ||
                          standardPasswords.includes(password) ||
                          standardPasswords.includes(cleanPass) ||
                          (user.role === 'restaurant' && cleanPass.length >= 4);`;

  const newTarget = `const cleanPass = String(password || '').trim();
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
                          (user.restaurantName && cleanPass.toLowerCase() === user.restaurantName.toLowerCase().replace(/[^a-z0-9]/g, ''));`;

  content = content.replace(oldTarget, newTarget);
  fs.writeFileSync(mockPath, content, 'utf8');
  console.log('Updated passwords in', mockPath);
}

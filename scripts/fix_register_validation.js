const fs = require('fs');
const vm = require('vm');

function fixRegisterFile(filePath) {
  console.log(`Checking ${filePath}...`);
  let content = fs.readFileSync(filePath, 'utf8');

  const oldCode = `        // Validation: required fields
        if (!name || !email || !password) {
          regErrorMsg.textContent = 'Name, email and password are required.';
          regErrorMsg.style.display = 'block';
          return;
        }

        // Sanitize name against XSS
        const cleanName = name.replace(/<[^>]*>?/gm, '').trim();

        // Validation: email format
        if (!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email)) {
          regErrorMsg.textContent = 'Please enter a valid email address.';
          regErrorMsg.style.display = 'block';
          return;
        }

        // Validation: phone normalization
        const digits = phone.replace(/\\D/g, '');
        const normalizedPhone = (digits.length === 12 && digits.startsWith('91')) ? digits.substring(2) : (digits.length === 11 && digits.startsWith('0')) ? digits.substring(1) : digits;

        if (!/^[6-9]\\d{9}$/.test(normalizedPhone)) {
          regErrorMsg.textContent = 'Please enter a valid 10-digit mobile number starting with 6, 7, 8, or 9.';
          regErrorMsg.style.display = 'block';
          return;
        }

        // Validation: password confirmation
        if (password !== confirmPassword) {
          regErrorMsg.textContent = 'Passwords do not match. Please verify your confirm password.';
          regErrorMsg.style.display = 'block';
          return;
        }

        // Validation: password policy (8-128 chars, at least one letter and one number)
        if (password.length < 8 || password.length > 128) {
          regErrorMsg.textContent = 'Password must be between 8 and 128 characters long.';
          regErrorMsg.style.display = 'block';
          return;
        }
        if (!/[A-Za-z]/.test(password) || !/\\d/.test(password)) {
          regErrorMsg.textContent = 'Password must contain at least one letter and at least one number.';
          regErrorMsg.style.display = 'block';
          return;
        }

        // Pre-check duplicate phone
        if (window.FoodWalaApi && typeof window.FoodWalaApi.checkPhone === 'function') {
          try {
            const check = await window.FoodWalaApi.checkPhone(normalizedPhone);
            if (check && check.available === false && (check.exists === true || check.alreadyRegistered === true)) {
              showDuplicatePhoneModal(normalizedPhone);
              return;
            }
          } catch (e) {}
        }`;

  const newCode = `        function resetSubmitBtn(errMsg) {
          regSubmitBtn.disabled = false;
          regSubmitBtn.innerHTML = 'Create Account';
          if (errMsg) {
            regErrorMsg.textContent = errMsg;
            regErrorMsg.style.display = 'block';
          }
        }

        // Validation: required fields
        if (!name || !email || !password) {
          resetSubmitBtn('Name, email and password are required.');
          return;
        }

        // Sanitize name against XSS
        const cleanName = name.replace(/<[^>]*>?/gm, '').trim();

        // Validation: email format
        if (!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email)) {
          resetSubmitBtn('Please enter a valid email address.');
          return;
        }

        // Validation: phone normalization
        const digits = phone.replace(/\\D/g, '');
        const normalizedPhone = (digits.length === 12 && digits.startsWith('91')) ? digits.substring(2) : (digits.length === 11 && digits.startsWith('0')) ? digits.substring(1) : digits;

        if (!/^[6-9]\\d{9}$/.test(normalizedPhone)) {
          resetSubmitBtn('Please enter a valid 10-digit mobile number starting with 6, 7, 8, or 9.');
          return;
        }

        // Validation: password confirmation
        if (password !== confirmPassword) {
          resetSubmitBtn('Passwords do not match. Please verify your confirm password.');
          return;
        }

        // Validation: password policy (8-128 chars, at least one letter and one number)
        if (password.length < 8 || password.length > 128) {
          resetSubmitBtn('Password must be between 8 and 128 characters long.');
          return;
        }
        if (!/[A-Za-z]/.test(password) || !/\\d/.test(password)) {
          resetSubmitBtn('Password must contain at least one letter and at least one number.');
          return;
        }

        // Pre-check duplicate phone
        if (window.FoodWalaApi && typeof window.FoodWalaApi.checkPhone === 'function') {
          try {
            const check = await window.FoodWalaApi.checkPhone(normalizedPhone);
            if (check && check.available === false && (check.exists === true || check.alreadyRegistered === true)) {
              resetSubmitBtn();
              showDuplicatePhoneModal(normalizedPhone);
              return;
            }
          } catch (e) {}
        }`;

  content = content.split('\r\n').join('\n');
  if (content.includes(oldCode)) {
    content = content.replace(oldCode, newCode);
    console.log(`  -> Successfully replaced validation logic in ${filePath}`);
  } else {
    console.error(`  ❌ Mismatch in oldCode for ${filePath}`);
  }

  content = content.replace(/registeredRole === 'partner' \|\| registeredRole === 'delivery_partner'\)\s*\{\s*window\.location\.href = '\.\/orders\.html';/g,
    `registeredRole === 'partner' || registeredRole === 'delivery_partner') {\n                window.location.href = './delivery-dashboard.html';`);

  content = content.split('\n').join('\r\n');
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

fixRegisterFile('D:/FoodWala_Eclipse_Project/register.html');
fixRegisterFile('D:/FoodWala_Eclipse_Project/src/main/webapp/register.html');

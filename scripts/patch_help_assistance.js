const fs = require('fs');

function updateHelp(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  if (!content.includes('hide.bs.modal')) {
    const target = 'bindEvents: function() {';
    const addition = `
      // Prevent aria-hidden accessibility violation when modal hides while focus is retained
      var helpModalElem = document.getElementById("foodwalaHelpModal");
      if (helpModalElem) {
        helpModalElem.addEventListener("hide.bs.modal", function() {
          if (document.activeElement && helpModalElem.contains(document.activeElement)) {
            document.activeElement.blur();
          }
        });
      }`;

    const idx = content.indexOf(target);
    if (idx !== -1) {
      content = content.substring(0, idx + target.length) + addition + content.substring(idx + target.length);
      fs.writeFileSync(filePath, content, 'utf8');
      console.log('Successfully updated', filePath);
    } else {
      console.error('Target not found in', filePath);
    }
  } else {
    console.log('Already contains hide.bs.modal', filePath);
  }
}

updateHelp('D:/FoodWala_Eclipse_Project/js/help-assistance.js');
updateHelp('D:/FoodWala_Eclipse_Project/src/main/webapp/js/help-assistance.js');

const fs = require('fs');
const path = require('path');

const cssRules = `
    /* ==========================================================================
       Add More Items Card & Quick Suggestions (Light & Dark Mode Support)
       ========================================================================== */
    .add-more-items-card {
      transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
      border: 1.5px dashed #dc3545 !important;
      background-color: #fff9f9 !important;
      cursor: pointer;
    }
    .add-more-items-card:hover {
      background-color: #fee2e2 !important;
      border-color: #b91c1c !important;
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(220, 53, 69, 0.18) !important;
    }
    .add-more-items-card .add-more-title {
      color: #202124 !important;
    }
    .add-more-items-card .add-more-sub {
      color: #5F6368 !important;
    }
    .add-more-items-card .add-more-rest,
    .add-more-items-card #add-more-rest-name {
      color: #dc3545 !important;
    }

    /* Dark Mode: High-contrast Dark Surface with Luminous Coral Dashed Border */
    [data-bs-theme="dark"] .add-more-items-card,
    html[data-bs-theme="dark"] .add-more-items-card,
    html.dark .add-more-items-card {
      background-color: #242D35 !important;
      border: 1.5px dashed #FF705D !important;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.35) !important;
    }
    [data-bs-theme="dark"] .add-more-items-card:hover,
    html[data-bs-theme="dark"] .add-more-items-card:hover,
    html.dark .add-more-items-card:hover {
      background-color: #2D3842 !important;
      border-color: #FFB454 !important;
      transform: translateY(-2px);
      box-shadow: 0 6px 22px rgba(255, 112, 93, 0.28) !important;
    }
    [data-bs-theme="dark"] .add-more-items-card .text-dark,
    [data-bs-theme="dark"] .add-more-items-card .add-more-title,
    [data-bs-theme="dark"] .add-more-items-card span.fw-bold,
    html[data-bs-theme="dark"] .add-more-items-card .text-dark,
    html[data-bs-theme="dark"] .add-more-items-card .add-more-title,
    html[data-bs-theme="dark"] .add-more-items-card span.fw-bold,
    html.dark .add-more-items-card .text-dark,
    html.dark .add-more-items-card .add-more-title,
    html.dark .add-more-items-card span.fw-bold {
      color: #F5F7FA !important;
      font-weight: 700 !important;
    }
    [data-bs-theme="dark"] .add-more-items-card i.bi-plus-circle,
    html[data-bs-theme="dark"] .add-more-items-card i.bi-plus-circle,
    html.dark .add-more-items-card i.bi-plus-circle {
      color: #FF705D !important;
    }
    [data-bs-theme="dark"] .add-more-items-card .text-muted,
    [data-bs-theme="dark"] .add-more-items-card .add-more-sub,
    [data-bs-theme="dark"] .add-more-items-card small,
    html[data-bs-theme="dark"] .add-more-items-card .text-muted,
    html[data-bs-theme="dark"] .add-more-items-card .add-more-sub,
    html[data-bs-theme="dark"] .add-more-items-card small,
    html.dark .add-more-items-card .text-muted,
    html.dark .add-more-items-card .add-more-sub,
    html.dark .add-more-items-card small {
      color: #AAB4BE !important;
    }
    [data-bs-theme="dark"] .add-more-items-card #add-more-rest-name,
    [data-bs-theme="dark"] .add-more-items-card .add-more-rest,
    html[data-bs-theme="dark"] .add-more-items-card #add-more-rest-name,
    html[data-bs-theme="dark"] .add-more-items-card .add-more-rest,
    html.dark .add-more-items-card #add-more-rest-name,
    html.dark .add-more-items-card .add-more-rest {
      color: #FFB454 !important;
      font-weight: 700 !important;
    }
    [data-bs-theme="dark"] .add-more-items-card .btn-danger,
    html[data-bs-theme="dark"] .add-more-items-card .btn-danger,
    html.dark .add-more-items-card .btn-danger {
      background: linear-gradient(135deg, #FF705D 0%, #e23744 100%) !important;
      border: none !important;
      color: #ffffff !important;
      box-shadow: 0 4px 12px rgba(255, 112, 93, 0.4) !important;
    }

    /* Quick Suggestions Dish Cards (Light & Dark Mode) */
    .quick-add-card {
      transition: all 0.2s ease;
      background-color: #FAF4EE !important;
      border: 1px solid #E9E2DA !important;
    }
    .quick-add-card:hover {
      border-color: #FF705D !important;
      transform: translateY(-1px);
    }
    [data-bs-theme="dark"] .quick-add-card,
    html[data-bs-theme="dark"] .quick-add-card,
    html.dark .quick-add-card {
      background-color: #242D35 !important;
      border: 1px solid #34404A !important;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25) !important;
    }
    [data-bs-theme="dark"] .quick-add-card:hover,
    html[data-bs-theme="dark"] .quick-add-card:hover,
    html.dark .quick-add-card:hover {
      background-color: #2D3842 !important;
      border-color: #FF705D !important;
    }
    [data-bs-theme="dark"] .quick-add-card .text-dark,
    html[data-bs-theme="dark"] .quick-add-card .text-dark,
    html.dark .quick-add-card .text-dark {
      color: #F5F7FA !important;
    }
    [data-bs-theme="dark"] .quick-add-card .text-muted,
    html[data-bs-theme="dark"] .quick-add-card .text-muted,
    html.dark .quick-add-card .text-muted {
      color: #AAB4BE !important;
    }
    [data-bs-theme="dark"] .quick-add-card .btn-outline-danger,
    html[data-bs-theme="dark"] .quick-add-card .btn-outline-danger,
    html.dark .quick-add-card .btn-outline-danger {
      border-color: #FF705D !important;
      color: #FF705D !important;
      background-color: transparent !important;
    }
    [data-bs-theme="dark"] .quick-add-card .btn-outline-danger:hover,
    html[data-bs-theme="dark"] .quick-add-card .btn-outline-danger:hover,
    html.dark .quick-add-card .btn-outline-danger:hover {
      background: #FF705D !important;
      color: #ffffff !important;
      box-shadow: 0 2px 10px rgba(255, 112, 93, 0.4) !important;
    }
    [data-bs-theme="dark"] #quick-add-suggestions small.text-muted,
    html[data-bs-theme="dark"] #quick-add-suggestions small.text-muted,
    html.dark #quick-add-suggestions small.text-muted {
      color: #AAB4BE !important;
    }
`;

const cartFiles = [
  'D:/FoodWala_Eclipse_Project/cart.html',
  'D:/FoodWala_Eclipse_Project/src/main/webapp/cart.html'
];

cartFiles.forEach(file => {
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, 'utf8');

  // Replace style block in head
  const oldStyleRegex = /<style>[\s\S]*?\.add-more-items-card[\s\S]*?<\/style>/i;
  if (oldStyleRegex.test(content)) {
    content = content.replace(oldStyleRegex, `<style>${cssRules}  </style>`);
    console.log(`Updated <style> in ${file}`);
  } else {
    content = content.replace('</head>', `  <style>${cssRules}  </style>\n</head>`);
    console.log(`Injected <style> into ${file}`);
  }

  // Add semantic helper classes in HTML
  content = content.replace(
    '<span class="fw-bold text-dark d-block fs-6"><i class="bi bi-plus-circle me-1 text-danger"></i>Add more items</span>',
    '<span class="fw-bold text-dark d-block fs-6 add-more-title"><i class="bi bi-plus-circle me-1 text-danger"></i>Add more items</span>'
  );
  content = content.replace(
    '<small class="text-muted">Browse full menu from <span id="add-more-rest-name" class="fw-semibold text-danger">this restaurant</span></small>',
    '<small class="text-muted add-more-sub">Browse full menu from <span id="add-more-rest-name" class="fw-semibold text-danger add-more-rest">this restaurant</span></small>'
  );

  // In quick suggestions JS template, add .quick-add-card
  content = content.replace(
    'class="d-flex align-items-center justify-content-between p-2 px-3 bg-light border border-light-subtle rounded-3 shadow-none flex-grow-1"',
    'class="d-flex align-items-center justify-content-between p-2 px-3 bg-light border border-light-subtle rounded-3 shadow-none flex-grow-1 quick-add-card"'
  );

  fs.writeFileSync(file, content, 'utf8');
  console.log(`Saved ${file}`);
});

// Also add to animations-3d.css
const cssFiles = [
  'D:/FoodWala_Eclipse_Project/css/animations-3d.css',
  'D:/FoodWala_Eclipse_Project/src/main/webapp/css/animations-3d.css'
];

cssFiles.forEach(file => {
  if (!fs.existsSync(file)) return;
  let css = fs.readFileSync(file, 'utf8');
  if (!css.includes('.add-more-items-card')) {
    css += '\n' + cssRules + '\n';
    fs.writeFileSync(file, css, 'utf8');
    console.log(`Appended cart dark mode rules to ${file}`);
  } else {
    console.log(`CSS already contains .add-more-items-card in ${file}`);
  }
});

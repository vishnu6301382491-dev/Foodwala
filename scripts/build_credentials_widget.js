const fs = require('fs');
const path = require('path');
const list = require('./all_credentials_dump.json');

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>FoodWala Master Credentials Directory</title>
  <script src="https://www.gstatic.com/antigravity/web/dev/tailwindcss.min.js"></script>
  <style>
    /* Custom scrollbar */
    ::-webkit-scrollbar { width: 6px; height: 6px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: rgba(148, 163, 184, 0.4); border-radius: 9999px; }
    ::-webkit-scrollbar-thumb:hover { background: rgba(148, 163, 184, 0.7); }
  </style>
</head>
<body class="bg-transparent text-[var(--foreground)] antialiased p-3 sm:p-5">
  <div class="bg-[var(--card)] text-[var(--foreground)] border border-[var(--border)] rounded-2xl p-5 shadow-lg max-w-5xl mx-auto">
    
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[var(--border)] gap-3">
      <div>
        <div class="flex items-center gap-2">
          <span class="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-red-500 text-white font-black text-sm">FW</span>
          <h1 class="text-xl font-bold tracking-tight text-[var(--foreground)]">FoodWala Universal Credentials Directory</h1>
        </div>
        <p class="text-xs text-[var(--muted-foreground)] mt-1">
          Master access matrix for Super Admin, Delivery Heroes, and all 105 Bengaluru Restaurant Managers.
        </p>
      </div>
      <div class="flex items-center gap-2">
        <span class="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
          ● 105 Stores Active
        </span>
        <span class="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
          Password: Vishnu@143
        </span>
      </div>
    </div>

    <!-- Quick Access High-Priority Accounts -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-3 my-4">
      <!-- Admin Card -->
      <div class="p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 flex flex-col justify-between">
        <div class="flex items-start justify-between">
          <div>
            <div class="flex items-center gap-2">
              <span class="text-base">👑</span>
              <span class="font-bold text-sm text-[var(--foreground)]">Super Administrator</span>
              <span class="text-[11px] font-bold px-2 py-0.5 rounded bg-amber-500 text-white uppercase tracking-wider">Omnipotent</span>
            </div>
            <div class="text-xs text-[var(--muted-foreground)] mt-1">Full control over 105 stores, analytics, customers, riders</div>
          </div>
          <a href="http://localhost:5000/admin.html" target="_blank" class="text-xs font-semibold px-2.5 py-1 rounded-lg bg-amber-500 text-white hover:bg-amber-600 transition">
            Launch Admin &rarr;
          </a>
        </div>
        <div class="mt-3 flex flex-wrap items-center gap-2 pt-2 border-t border-amber-500/20 text-xs">
          <span class="text-[var(--muted-foreground)]">Email:</span>
          <code class="px-2 py-0.5 rounded bg-black/10 dark:bg-white/10 font-mono text-[var(--foreground)] font-semibold select-all">adminfoodwala@gmail.com</code>
          <button onclick="copyText('adminfoodwala@gmail.com', this)" class="text-[11px] px-2 py-0.5 rounded bg-[var(--border)] hover:bg-[var(--foreground)] hover:text-[var(--background)] transition">Copy</button>
          <span class="text-[var(--muted-foreground)] ml-2">Pass:</span>
          <code class="px-2 py-0.5 rounded bg-black/10 dark:bg-white/10 font-mono text-[var(--foreground)] font-semibold select-all">Vishnu@143</code>
          <button onclick="copyText('Vishnu@143', this)" class="text-[11px] px-2 py-0.5 rounded bg-[var(--border)] hover:bg-[var(--foreground)] hover:text-[var(--background)] transition">Copy</button>
        </div>
      </div>

      <!-- Delivery Hero Card -->
      <div class="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 flex flex-col justify-between">
        <div class="flex items-start justify-between">
          <div>
            <div class="flex items-center gap-2">
              <span class="text-base">🛵</span>
              <span class="font-bold text-sm text-[var(--foreground)]">Delivery Hero (Rider)</span>
              <span class="text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-500 text-white uppercase tracking-wider">Swiggy Radar</span>
            </div>
            <div class="text-xs text-[var(--muted-foreground)] mt-1">Order Radar, Duty toggle, live GPS simulation, Wallet & SOS</div>
          </div>
          <a href="http://localhost:5000/delivery-dashboard.html" target="_blank" class="text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition">
            Launch Radar &rarr;
          </a>
        </div>
        <div class="mt-3 flex flex-wrap items-center gap-2 pt-2 border-t border-emerald-500/20 text-xs">
          <span class="text-[var(--muted-foreground)]">Email:</span>
          <code class="px-2 py-0.5 rounded bg-black/10 dark:bg-white/10 font-mono text-[var(--foreground)] font-semibold select-all">deliveryfoodwala@gmail.com</code>
          <button onclick="copyText('deliveryfoodwala@gmail.com', this)" class="text-[11px] px-2 py-0.5 rounded bg-[var(--border)] hover:bg-[var(--foreground)] hover:text-[var(--background)] transition">Copy</button>
          <span class="text-[var(--muted-foreground)] ml-2">Pass:</span>
          <code class="px-2 py-0.5 rounded bg-black/10 dark:bg-white/10 font-mono text-[var(--foreground)] font-semibold select-all">Vishnu@143</code>
          <button onclick="copyText('Vishnu@143', this)" class="text-[11px] px-2 py-0.5 rounded bg-[var(--border)] hover:bg-[var(--foreground)] hover:text-[var(--background)] transition">Copy</button>
        </div>
      </div>
    </div>

    <!-- Search & Filter Controls -->
    <div class="my-4 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
      <div class="relative flex-1">
        <input 
          type="text" 
          id="search-input" 
          placeholder="Search by restaurant name, email, area or cuisine (e.g. Meghana, Koramangala, Biryani)..." 
          class="w-full px-3 py-2 pl-9 text-xs rounded-xl border border-[var(--border)] bg-[var(--content)] text-[var(--foreground)] placeholder-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-red-500/40"
        />
        <svg class="w-4 h-4 text-[var(--muted-foreground)] absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
        </svg>
      </div>
      <div class="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs">
        <button onclick="filterBy('all', this)" class="filter-btn active px-3 py-1.5 rounded-lg font-medium border border-transparent bg-red-500 text-white transition">All (105)</button>
        <button onclick="filterBy('Biryani', this)" class="filter-btn px-3 py-1.5 rounded-lg font-medium border border-[var(--border)] bg-[var(--content)] hover:border-red-500 text-[var(--foreground)] transition">Biryani</button>
        <button onclick="filterBy('South Indian', this)" class="filter-btn px-3 py-1.5 rounded-lg font-medium border border-[var(--border)] bg-[var(--content)] hover:border-red-500 text-[var(--foreground)] transition">South Indian</button>
        <button onclick="filterBy('Koramangala', this)" class="filter-btn px-3 py-1.5 rounded-lg font-medium border border-[var(--border)] bg-[var(--content)] hover:border-red-500 text-[var(--foreground)] transition">Koramangala</button>
        <button onclick="filterBy('Indiranagar', this)" class="filter-btn px-3 py-1.5 rounded-lg font-medium border border-[var(--border)] bg-[var(--content)] hover:border-red-500 text-[var(--foreground)] transition">Indiranagar</button>
      </div>
    </div>

    <!-- Results Table -->
    <div class="border border-[var(--border)] rounded-xl overflow-hidden mt-2">
      <div class="overflow-x-auto max-h-[460px]">
        <table class="w-full text-left text-xs border-collapse">
          <thead class="sticky top-0 bg-[var(--card)] border-b border-[var(--border)] text-[var(--muted-foreground)] uppercase text-[11px] font-semibold tracking-wider">
            <tr>
              <th class="py-2.5 px-3 w-12 text-center">ID</th>
              <th class="py-2.5 px-3">Restaurant & Area</th>
              <th class="py-2.5 px-3">Cuisine</th>
              <th class="py-2.5 px-3">Manager Login Email</th>
              <th class="py-2.5 px-3">Password</th>
              <th class="py-2.5 px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody id="restaurants-tbody" class="divide-y divide-[var(--border)] text-[var(--foreground)]">
            <!-- Rendered by JS -->
          </tbody>
        </table>
      </div>
    </div>

    <!-- Table Footer / Count -->
    <div class="mt-3 flex items-center justify-between text-xs text-[var(--muted-foreground)]">
      <span id="match-counter">Showing 105 of 105 restaurants</span>
      <span class="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
        Ready to authenticate on /login.html
      </span>
    </div>

  </div>

  <!-- Toast Notification -->
  <div id="toast" class="fixed bottom-5 right-5 bg-black/90 dark:bg-white/95 text-white dark:text-black text-xs font-semibold px-4 py-2 rounded-xl shadow-xl transition-all duration-300 opacity-0 pointer-events-none translate-y-2">
    Copied to clipboard!
  </div>

  <script>
    const restaurantsData = ${JSON.stringify(list)};
    let activeFilterTag = 'all';

    function renderTable(items) {
      const tbody = document.getElementById('restaurants-tbody');
      const counter = document.getElementById('match-counter');
      counter.textContent = \`Showing \${items.length} of \${restaurantsData.length} restaurants\`;

      if (items.length === 0) {
        tbody.innerHTML = \`
          <tr>
            <td colspan="6" class="text-center py-8 text-[var(--muted-foreground)]">
              No restaurants matching search query. Try another term.
            </td>
          </tr>
        \`;
        return;
      }

      tbody.innerHTML = items.map(r => \`
        <tr class="hover:bg-[var(--content)]/60 transition-colors">
          <td class="py-2.5 px-3 text-center font-bold text-[var(--muted-foreground)]">\${r.restaurant_id}</td>
          <td class="py-2.5 px-3">
            <div class="font-semibold text-[var(--foreground)]">\${r.name}</div>
            <div class="text-[11px] text-[var(--muted-foreground)]">\${r.area || 'Bengaluru'} &bull; ⭐ \${r.rating || 4.2}</div>
          </td>
          <td class="py-2.5 px-3 text-[var(--muted-foreground)] max-w-[160px] truncate">\${r.cuisine_type || 'Multi-Cuisine'}</td>
          <td class="py-2.5 px-3 font-mono">
            <span class="select-all font-medium">\${r.manager_email}</span>
          </td>
          <td class="py-2.5 px-3 font-mono">
            <span class="select-all text-emerald-600 dark:text-emerald-400 font-semibold">Vishnu@143</span>
          </td>
          <td class="py-2.5 px-3 text-right">
            <div class="flex items-center justify-end gap-1.5">
              <button onclick="copyText('\${r.manager_email}', this)" class="px-2 py-1 rounded bg-[var(--border)] hover:bg-[var(--foreground)] hover:text-[var(--background)] transition text-[11px] font-medium" title="Copy Email">
                Copy Email
              </button>
              <a href="http://localhost:5000/restaurant-dashboard.html?id=\${r.restaurant_id}" target="_blank" class="px-2 py-1 rounded bg-red-500/10 hover:bg-red-500 hover:text-white text-red-600 dark:text-red-400 transition text-[11px] font-medium" title="Open Manager Dashboard">
                Open &rarr;
              </a>
            </div>
          </td>
        </tr>
      \`).join('');
    }

    function copyText(text, btn) {
      navigator.clipboard.writeText(text).then(() => {
        showToast('Copied: ' + text);
        if (btn) {
          const original = btn.textContent;
          btn.textContent = 'Copied!';
          setTimeout(() => { btn.textContent = original; }, 1500);
        }
      });
    }

    function showToast(msg) {
      const toast = document.getElementById('toast');
      toast.textContent = msg;
      toast.classList.remove('opacity-0', 'translate-y-2', 'pointer-events-none');
      toast.classList.add('opacity-100', 'translate-y-0');
      setTimeout(() => {
        toast.classList.add('opacity-0', 'translate-y-2', 'pointer-events-none');
        toast.classList.remove('opacity-100', 'translate-y-0');
      }, 2000);
    }

    function applySearch() {
      const query = document.getElementById('search-input').value.toLowerCase().trim();
      let filtered = restaurantsData;

      if (activeFilterTag !== 'all') {
        const tag = activeFilterTag.toLowerCase();
        filtered = filtered.filter(r => 
          (r.cuisine_type && r.cuisine_type.toLowerCase().includes(tag)) ||
          (r.area && r.area.toLowerCase().includes(tag)) ||
          (r.name && r.name.toLowerCase().includes(tag))
        );
      }

      if (query) {
        filtered = filtered.filter(r => 
          (r.name && r.name.toLowerCase().includes(query)) ||
          (r.manager_email && r.manager_email.toLowerCase().includes(query)) ||
          (r.area && r.area.toLowerCase().includes(query)) ||
          (r.cuisine_type && r.cuisine_type.toLowerCase().includes(query)) ||
          String(r.restaurant_id).includes(query)
        );
      }

      renderTable(filtered);
    }

    function filterBy(tag, btn) {
      activeFilterTag = tag;
      document.querySelectorAll('.filter-btn').forEach(b => {
        b.classList.remove('bg-red-500', 'text-white');
        b.classList.add('bg-[var(--content)]', 'text-[var(--foreground)]');
      });
      if (btn) {
        btn.classList.remove('bg-[var(--content)]', 'text-[var(--foreground)]');
        btn.classList.add('bg-red-500', 'text-white');
      }
      applySearch();
    }

    document.getElementById('search-input').addEventListener('input', applySearch);

    // Initial render
    renderTable(restaurantsData);
  </script>
</body>
</html>
`;

const targetPath = path.resolve('C:/Users/vishn/.gemini/antigravity/brain/23d574b2-87bf-4ea8-af5d-9ecfa359190a/credentials_directory_widget.html');
fs.writeFileSync(targetPath, html);
console.log('Successfully written credentials_directory_widget.html to', targetPath);

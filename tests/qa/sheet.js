// Contact sheet of phone (or desktop) states: node sheet.js <phone|desktop> <outDir>
const { chromium, devices } = require('playwright');
const fs = require('fs');
const dev = process.argv[2] || 'phone'; const out = process.argv[3] || 'shots'; fs.mkdirSync(out, { recursive: true });
const BASE = process.env.BASE || 'http://127.0.0.1:8766';
(async () => {
  const b = await chromium.launch();
  const c = await b.newContext(dev === 'phone' ? { ...devices['iPhone 13'], deviceScaleFactor: 1 } : { viewport: { width: 1440, height: 900 } });
  const p = await c.newPage(); let n = 0;
  const shot = async (label) => { await p.screenshot({ path: `${out}/${String(++n).padStart(2, '0')}-${label}.png` }); };
  const go = async (name) => { await p.goto(`${BASE}/${name}.html`, { waitUntil: 'load' }); await p.waitForTimeout(2600); };
  const down = async (f) => { await p.evaluate((f) => window.scrollTo({ top: (document.documentElement.scrollHeight - innerHeight) * f, behavior: 'instant' }), f); await p.waitForTimeout(2400); };
  const modal = async (id, label) => { await p.evaluate((id) => document.getElementById(id).showModal(), id); await p.waitForTimeout(1700); await shot(label); await p.evaluate((id) => document.getElementById(id).close(), id); await p.waitForTimeout(900); };
  await go('index'); await shot('home-top');
  for (const [f, l] of [[0.2, 'home-2'], [0.42, 'home-3'], [0.62, 'home-4'], [0.86, 'home-5'], [1, 'home-footer']]) { await down(f); await shot(l); }
  await go('collection'); await shot('collection'); await modal('site-menu', 'menu'); await modal('predictive-search', 'search-sheet'); await modal('cart-drawer', 'bag-empty');
  if (await p.$('#collection-filter-drawer')) await modal('collection-filter-drawer', 'filters');
  await go('product'); await shot('product-top'); await down(0.35); await shot('product-form'); await down(0.7); await shot('product-lower');
  if (await p.$('#product-details-drawer')) await modal('product-details-drawer', 'product-details');
  await go('product-coming-soon'); await down(0.4); await shot('coming-soon');
  await go('cart'); await shot('cart-page'); await go('search'); await shot('search-page'); await go('collection-empty'); await shot('collection-empty');
  await go('page'); await shot('page'); await go('404'); await shot('404'); await go('list-collections'); await shot('all-collections');
  await b.close();
})();

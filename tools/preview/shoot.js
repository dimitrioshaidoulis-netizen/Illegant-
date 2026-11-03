// Screenshot rendered preview pages: node shoot.js <label> [pages] -> shots/<label>/<page>-<device>.png
const { chromium, devices } = require('playwright');
const fs = require('fs');
const label = process.argv[2] || 'run'; const pages = (process.argv[3] || 'index,collection,product,product-coming-soon,collection-empty,search,cart,404,page,list-collections').split(',');
const full = process.env.FULL !== '0';
(async () => {
  const b = await chromium.launch(); fs.mkdirSync(`shots/${label}`, { recursive: true });
  for (const [dev, opts] of [['phone', { ...devices['iPhone 13'], deviceScaleFactor: 1 }], ['desktop', { viewport: { width: 1440, height: 900 } }]]) {
    const c = await b.newContext(opts);
    for (const p of pages) {
      const pg = await c.newPage(); const errs = [];
      pg.on('pageerror', (e) => errs.push(e.message)); pg.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
      await pg.goto(`http://127.0.0.1:8766/${p}.html`, { waitUntil: 'load' }); await pg.waitForTimeout(2600);
      // Walk the page so arrival effects fire, then return to top.
      if (full) { const h = await pg.evaluate(() => document.documentElement.scrollHeight); for (let y = 0; y < h; y += 500) { await pg.evaluate((y) => window.scrollTo(0, y), y); await pg.waitForTimeout(120); } await pg.waitForTimeout(2200); await pg.evaluate(() => window.scrollTo(0, 0)); await pg.waitForTimeout(600); }
      await pg.screenshot({ path: `shots/${label}/${p}-${dev}.png`, fullPage: full });
      const metrics = await pg.evaluate(() => ({ overflowX: document.documentElement.scrollWidth - innerWidth, h: document.documentElement.scrollHeight, missing: (document.body.innerText.match(/\[missing: [^\]]+\]/g) || []).slice(0, 5) }));
      console.log(dev, p, JSON.stringify(metrics), errs.filter((e) => !/Failed to load resource|Shopify|net::/.test(e)).slice(0, 3).join(' | '));
      await pg.close();
    }
    await c.close();
  }
  await b.close();
})();

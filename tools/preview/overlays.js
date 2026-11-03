const { chromium, devices } = require('playwright');
const label = process.argv[2] || 'before';
(async () => { const b = await chromium.launch();
 for (const [dev, o] of [['phone', { ...devices['iPhone 13'], deviceScaleFactor: 1 }], ['desktop', { viewport: { width: 1440, height: 900 } }]]) {
  const c = await b.newContext(o); const p = await c.newPage(); await p.goto('http://127.0.0.1:8766/collection.html'); await p.waitForTimeout(1500);
  for (const id of ['site-menu', 'predictive-search', 'cart-drawer']) {
    await p.evaluate((id) => document.getElementById(id).showModal(), id); await p.waitForTimeout(1600);
    await p.screenshot({ path: `shots/${label}-fold/overlay-${id}-${dev}.png` });
    await p.evaluate((id) => document.getElementById(id).close(), id); await p.waitForTimeout(1200);
  }
  await p.evaluate(() => document.querySelector('footer').scrollIntoView()); await p.waitForTimeout(2500);
  await p.screenshot({ path: `shots/${label}-fold/footer-${dev}.png` });
  await c.close(); }
 await b.close(); })();

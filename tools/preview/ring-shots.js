const { chromium, devices } = require('playwright');
const label = process.argv[2];
(async () => { const b = await chromium.launch();
 for (const [n, o] of [['320', { viewport: { width: 320, height: 568 }, isMobile: true, hasTouch: true }], ['375', { viewport: { width: 375, height: 667 }, isMobile: true, hasTouch: true }], ['390', devices['iPhone 13']], ['430', { viewport: { width: 430, height: 932 }, isMobile: true, hasTouch: true }], ['desktop', { viewport: { width: 1440, height: 900 } }]]) {
  const c = await b.newContext({ ...o, deviceScaleFactor: 1 }); const p = await c.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.goto('http://127.0.0.1:8766/index.html'); await p.waitForTimeout(4000);
  await p.screenshot({ path: `shots/${label}-ring-${n}.png` });
  const m = await p.evaluate(() => { const s = document.querySelector('s-ring'); const r = s.getBoundingClientRect(); const sec = s.closest('section').getBoundingClientRect(); const h2 = document.getElementById('home-hero-heading').getBoundingClientRect(); return { section: [sec.top | 0, sec.height | 0], ring: [r.top | 0, r.height | 0], heading: h2.top | 0, vw: innerWidth, vh: innerHeight, ox: document.documentElement.scrollWidth - innerWidth }; });
  console.log(n, JSON.stringify(m), errs.join('|')); await c.close(); }
 await b.close(); })();

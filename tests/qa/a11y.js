// axe-core pass over the locally rendered pages (phone width). Lists violations by impact.
const { chromium, devices } = require('playwright');
const fs = require('fs');
const axe = fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
const BASE = process.env.BASE || 'http://127.0.0.1:8766';
(async () => {
  const b = await chromium.launch(); const c = await b.newContext({ ...devices['iPhone 13'], deviceScaleFactor: 1 });
  for (const name of (process.argv[2] || 'index,collection,product,cart,search,page,404,list-collections,collection-empty,product-coming-soon').split(',')) {
    const p = await c.newPage(); await p.goto(`${BASE}/${name}.html`, { waitUntil: 'load' }); await p.waitForTimeout(1500);
    // Let arrival effects finish so contrast is measured on the final state.
    const h = await p.evaluate(() => document.documentElement.scrollHeight); for (let y = 0; y < h; y += 500) { await p.evaluate((y) => window.scrollTo(0, y), y); await p.waitForTimeout(80); } await p.waitForTimeout(2500);
    await p.evaluate(axe);
    const r = await p.evaluate(() => axe.run(document, { resultTypes: ['violations'] }));
    console.log(`\n${name}: ${r.violations.length} rule(s) violated`);
    for (const v of r.violations) console.log(`  [${v.impact}] ${v.id} x${v.nodes.length}: ${v.help}\n      ${v.nodes.slice(0, 3).map((n) => n.target.join(' ').slice(0, 110)).join('\n      ')}`);
    await p.close();
  }
  await b.close();
})();

// Frame-by-frame profile of a panel while it opens and closes: how far it has travelled and how visible it is.
const { chromium, devices } = require('playwright');
const dev = process.argv[2] || 'phone'; const ids = (process.argv[3] || 'predictive-search,cart-drawer,site-menu').split(','); const pageName = process.argv[4] || 'collection';
(async () => {
  const b = await chromium.launch();
  const c = await b.newContext(dev === 'phone' ? { ...devices['iPhone 13'], deviceScaleFactor: 1 } : { viewport: { width: 1440, height: 900 } });
  const p = await c.newPage();
  await p.goto(`http://127.0.0.1:8766/${pageName}.html`, { waitUntil: 'load' }); await p.waitForTimeout(1200);
  await p.evaluate(() => window.scrollTo({ top: 600, behavior: 'instant' })); await p.waitForTimeout(500);
  for (const id of ids) {
    for (const phase of ['open', 'close']) {
      const rows = await p.evaluate(async ({ id, phase }) => {
        const d = document.getElementById(id); const rows = []; const t0 = performance.now();
        const sample = () => { const r = d.getBoundingClientRect(); const cs = getComputedStyle(d); rows.push({ t: Math.round(performance.now() - t0), x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height), o: Number(cs.opacity).toFixed(2), clip: cs.clipPath, disp: cs.display, open: d.open, sy: Math.round(scrollY) }); };
        if (phase === 'open') d.showModal(); else d.close();
        await new Promise((res) => { const f = () => { sample(); if (performance.now() - t0 < 1300) requestAnimationFrame(f); else res(); }; requestAnimationFrame(f); });
        return rows;
      }, { id, phase });
      const pick = [0, 50, 100, 150, 200, 250, 300, 400, 500, 600, 700, 800, 1000, 1200].map((t) => rows.find((r) => r.t >= t)).filter(Boolean);
      console.log(`\n${dev} ${id} ${phase}`);
      for (const r of pick) console.log(`  ${String(r.t).padStart(4)}ms  x ${String(r.x).padStart(5)} y ${String(r.y).padStart(5)}  opacity ${r.o}  ${r.clip !== 'none' ? 'clip ' + r.clip.replace(/\s+/g, ' ') : ''} display ${r.disp} open ${r.open} scrollY ${r.sy}`);
      await p.waitForTimeout(300);
    }
  }
  await b.close();
})();

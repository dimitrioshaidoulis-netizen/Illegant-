const { chromium, devices } = require('playwright');
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext(devices['iPhone 13']); const page = await ctx.newPage();
  await page.goto('http://127.0.0.1:8765/page.html'); await page.waitForFunction(() => customElements.get('s-dialog'));
  await page.evaluate(() => document.getElementById('open-bag').click()); await page.waitForTimeout(1200);
  const prof = await page.evaluate(async () => { const d = document.getElementById('cart-drawer'); const out = []; const t0 = performance.now();
    document.getElementById('close-bag').click();
    await new Promise((res) => { const f = () => { const rc = d.getBoundingClientRect(); const vis = d.open ? Math.max(0, Math.min(innerWidth, rc.right) - Math.max(0, rc.left)) / rc.width : 0;
      out.push([Math.round(performance.now() - t0), +vis.toFixed(2), +(+getComputedStyle(d).opacity).toFixed(2)]); if (d.open) requestAnimationFrame(f); else res(); }; requestAnimationFrame(f); });
    return out.filter((_, i) => i % 4 === 0 || !_[1]); });
  console.log(process.argv[2], JSON.stringify(prof)); await b.close();
})();

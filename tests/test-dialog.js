const { chromium, devices } = require('playwright');
const base = process.argv[2] || 'http://127.0.0.1:8765/page.html';
(async () => {
  const browser = await chromium.launch();
  const results = {};
  for (const [label, ctxOpts] of [['desktop', { viewport: { width: 1280, height: 800 } }], ['iphone13', devices['iPhone 13']]]) {
    const ctx = await browser.newContext(ctxOpts); const page = await ctx.newPage();
    const errors = []; page.on('pageerror', e => errors.push(e.message)); page.on('console', m => m.type() === 'error' && errors.push(m.text()));
    await page.goto(base); await page.waitForFunction(() => customElements.get('s-dialog'));
    const r = {};
    const click = async (sel) => page.evaluate((s) => document.querySelector(s).click(), sel);
    const waitClosed = (id) => page.waitForFunction((i) => !document.getElementById(i).open && !document.getElementById(i).hasAttribute('data-closing'), id, { timeout: 5000 });
    // A: 20 plain open/close cycles of the bag
    await page.evaluate(() => window.scrollTo(0, 1500));
    let drift = [];
    for (let i = 0; i < 20; i++) {
      await click('#open-bag'); await page.waitForTimeout(150); await click('#close-bag'); await waitClosed('cart-drawer'); await page.waitForTimeout(50);
      drift.push(await page.evaluate(() => window.scrollY));
    }
    r.A_plainCycles_scrollY = [...new Set(drift)];
    // B: something moves the document while the search sheet is open (what iOS does for the keyboard), then close via button
    await page.evaluate(() => window.scrollTo(0, 1500));
    await click('#open-search'); await page.waitForTimeout(200);
    await page.evaluate(() => { document.documentElement.scrollTop += 120; });
    await click('#close-search'); await waitClosed('predictive-search'); await page.waitForTimeout(100);
    r.B_shiftWhileOpen_scrollY = await page.evaluate(() => window.scrollY);
    // C: native close path (bypasses the wrapper: Escape without cancel, method=dialog forms)
    await page.evaluate(() => window.scrollTo(0, 1500));
    await click('#open-bag'); await page.waitForTimeout(200);
    await page.evaluate(() => { document.documentElement.scrollTop += 120; HTMLDialogElement.prototype.close.call(document.getElementById('cart-drawer')); });
    await page.waitForTimeout(300);
    r.C_nativeClose_scrollY = await page.evaluate(() => window.scrollY);
    // D: Escape key close
    await page.evaluate(() => window.scrollTo(0, 1500));
    await click('#open-bag'); await page.waitForTimeout(300); await page.keyboard.press('Escape'); await waitClosed('cart-drawer'); await page.waitForTimeout(100);
    r.D_escape_scrollY = await page.evaluate(() => window.scrollY);
    // E: close motion profile for the bag: sample visible share + opacity each frame
    await click('#open-bag'); await page.waitForTimeout(1200);
    r.E_closeProfile = await page.evaluate(async () => {
      const d = document.getElementById('cart-drawer'); const vw = innerWidth; const out = []; const t0 = performance.now();
      document.getElementById('close-bag').click();
      await new Promise((res) => { const f = () => { const rc = d.getBoundingClientRect(); const vis = d.open ? Math.max(0, Math.min(vw, rc.right) - Math.max(0, rc.left)) / rc.width : 0;
        out.push([Math.round(performance.now() - t0), +vis.toFixed(2), +(+getComputedStyle(d).opacity).toFixed(2)]); if (d.open && performance.now() - t0 < 2000) requestAnimationFrame(f); else res(); }; requestAnimationFrame(f); });
      return out.filter((_, i) => i % 4 === 0 || !_[1]);
    });
    r.errors = errors; results[label] = r; await ctx.close();
  }
  console.log(JSON.stringify(results, null, 1).replace(/\[\n\s+(\d+),\n\s+([\d.]+),\n\s+([\d.]+)\n\s+\]/g, '[$1,$2,$3]'));
  await browser.close();
})();

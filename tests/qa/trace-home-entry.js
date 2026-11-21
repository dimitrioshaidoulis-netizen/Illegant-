// Frame-by-frame trace of the homepage opening on a phone: where each ring photograph sits from first paint on.
// Usage: node trace-home-entry.js [delayMsForRingScript] [delayMsForImages]
const { chromium, devices } = require('playwright');
const BASE = process.env.BASE || 'http://127.0.0.1:8766';
const jsDelay = Number(process.argv[2] || 0), imgDelay = Number(process.argv[3] || 0);
(async () => {
  const b = await chromium.launch();
  const c = await b.newContext({ ...devices['iPhone 13'], deviceScaleFactor: 1 });
  const p = await c.newPage();
  if (jsDelay) await p.route('**/s-ring.js', async (r) => { await new Promise((x) => setTimeout(x, jsDelay)); r.continue(); });
  if (imgDelay) await p.route('**/img/**', async (r) => { await new Promise((x) => setTimeout(x, imgDelay)); r.continue(); });
  await p.addInitScript(() => {
    window.__trace = []; window.__cls = 0;
    try { new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; }).observe({ type: 'layout-shift', buffered: true }); } catch {}
    const t0 = performance.now();
    const tick = () => {
      const ring = document.querySelector('s-ring');
      if (ring) {
        const cards = [...ring.querySelectorAll('[data-ring-card]')];
        const track = ring.querySelector('[data-ring-track]');
        const row = { t: Math.round(performance.now() - t0), defined: !!customElements.get('s-ring'), spread: track ? getComputedStyle(track).getPropertyValue('--ring-spread').trim() : '', y: window.scrollY };
        row.cards = cards.slice(0, 3).map((el) => { const r = el.getBoundingClientRect(); return [Math.round(r.left), Math.round(r.top), Math.round(r.width), Number(getComputedStyle(el).opacity).toFixed(2)]; });
        window.__trace.push(row);
      }
      if (performance.now() - t0 < 5000) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
  await p.goto(`${BASE}/index.html`, { waitUntil: 'load' });
  await p.waitForTimeout(5200);
  const { trace, cls } = await p.evaluate(() => ({ trace: window.__trace, cls: window.__cls }));
  let last = '';
  for (const r of trace) {
    const key = JSON.stringify([r.defined, r.spread, r.cards]);
    if (key === last) continue; last = key;
    if (r.t % 1 === 0) console.log(String(r.t).padStart(5), r.defined ? 'def' : '---', 'spread', (r.spread || 'unset').padEnd(7), r.cards.map((c) => c.join(',')).join('  |  '));
  }
  console.log('CLS', cls.toFixed(4), 'frames', trace.length);
  await b.close();
})();

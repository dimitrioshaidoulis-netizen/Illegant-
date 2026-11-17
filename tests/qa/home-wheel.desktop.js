// Desktop regression probe for the homepage: where the page rests after mouse-wheel gestures, plus keyboard and
// scrollbar-style scrolling. Prints one line per step so two runs can be compared with diff.
const { chromium } = require('playwright');
const BASE = process.env.BASE || 'http://127.0.0.1:8766';
(async () => {
  const b = await chromium.launch(); const c = await b.newContext({ viewport: { width: 1440, height: 900 } }); const p = await c.newPage();
  const errors = []; p.on('pageerror', (e) => errors.push(e.message));
  await p.goto(`${BASE}/index.html`, { waitUntil: 'load' }); await p.waitForTimeout(2600);
  const y = () => p.evaluate(() => Math.round(scrollY));
  console.log('snap-type', await p.evaluate(() => getComputedStyle(document.documentElement).scrollSnapType), 'tops', JSON.stringify(await p.evaluate(() => [...document.querySelectorAll('s-screen-lock > .screen')].map((e) => Math.round(e.getBoundingClientRect().top + scrollY - 80)))));
  await p.mouse.move(720, 500);
  const wheel = async (label, deltas, gap = 16) => { for (const d of deltas) { await p.mouse.wheel(0, d); await p.waitForTimeout(gap); } await p.waitForTimeout(1500); console.log(label.padEnd(46), await y()); };
  await wheel('one notch down (100)', [100]);
  await wheel('three notches down', [100, 100, 100]);
  await wheel('hard trackpad flick down (30 x 120)', Array(30).fill(120), 12);
  await wheel('second flick down', Array(30).fill(120), 12);
  await wheel('small move up (-60)', [-60]);
  await wheel('flick up', Array(30).fill(-120), 12);
  await wheel('flick down x3 (gesture 1)', Array(30).fill(120), 12);
  await wheel('flick down x3 (gesture 2)', Array(30).fill(120), 12);
  await wheel('flick down x3 (gesture 3)', Array(30).fill(120), 12);
  await wheel('inside The edit: notch down', [100]);
  await p.keyboard.press('End'); await p.waitForTimeout(1200); console.log('keyboard End'.padEnd(46), await y());
  await p.keyboard.press('Home'); await p.waitForTimeout(1200); console.log('keyboard Home'.padEnd(46), await y());
  await p.keyboard.press('PageDown'); await p.waitForTimeout(1200); console.log('keyboard PageDown'.padEnd(46), await y());
  await p.evaluate(() => window.scrollTo({ top: 1234, behavior: 'instant' })); await p.waitForTimeout(900); console.log('scrollbar drag to 1234'.padEnd(46), await y());
  console.log('script errors', errors.filter((e) => !/createPromise/.test(e)).length);
  await b.close();
})();

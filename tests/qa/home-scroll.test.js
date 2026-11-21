// Homepage scrolling on a phone, with real touch gestures (Chromium's own gesture pipeline through DevTools:
// finger down, drag, lift, optional fling), not programmatic scrolls. The page offset is sampled every frame
// during each gesture and for a second after the finger lifts.
//
// Scenarios (A to F from the bug report):
//   A short swipe   B long swipe (fling)   C slow swipe that stops mid-section   D reverse swipe
//   E repeated swipes   F stopping just past a section boundary
// Usage: node home-scroll.test.js          Exit code 1 on any failure.  REPORT=1 prints the numbers only.
const { chromium, devices } = require('playwright');
const BASE = process.env.BASE || 'http://127.0.0.1:8766';
const reportOnly = process.env.REPORT === '1';
let failures = 0;
const check = (label, ok, detail = '') => { if (!ok && !reportOnly) failures++; console.log(`${reportOnly ? '    ' : ok ? 'ok  ' : 'FAIL'} ${label}${detail ? '  ' + detail : ''}`); };

(async () => {
  const browser = await chromium.launch();
  const only = process.env.DEVICE;
  for (const [name, device] of [['iPhone 13 (390x664)', devices['iPhone 13']], ['Pixel 7 (412x839)', devices['Pixel 7']], ['small phone (320x568)', { ...devices['iPhone SE'], viewport: { width: 320, height: 568 } }], ['tablet, touch (810x1080)', devices['iPad (gen 7)']]]) {
    if (only && !name.includes(only)) continue;
    const context = await browser.newContext({ ...device, deviceScaleFactor: 1 });
    const page = await context.newPage();
    const errors = []; page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(`${BASE}/index.html`, { waitUntil: 'load' }); await page.waitForTimeout(2600);
    const cdp = await context.newCDPSession(page);
    const y = () => page.evaluate(() => Math.round(scrollY));
    const info = await page.evaluate(() => ({ snap: getComputedStyle(document.documentElement).scrollSnapType, overflow: getComputedStyle(document.documentElement).overflowY, inner: innerHeight, width: innerWidth,
      tops: [...new Set([...document.querySelectorAll('s-screen-lock > .screen:not(.rooms), s-screen-lock > .rooms > .room')].map((e) => Math.round(e.getBoundingClientRect().top + scrollY - parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop || 0))))] }));
    console.log(`\n${name}: html scroll-snap-type "${info.snap}", section tops ${JSON.stringify(info.tops)}`);
    const place = async (top) => { await page.evaluate((t) => window.scrollTo({ top: t, behavior: 'instant' }), top); await page.waitForTimeout(900); return y(); };
    // One finger gesture as raw touch events (finger down, moves with real timestamps, lift), so the browser's own
    // gesture recognition, momentum and scroll-snap logic run exactly as for a finger. distance > 0 scrolls the page
    // down (the finger moves up). fling=false rests the finger before lifting (no momentum); fling=true flicks.
    // (Input.synthesizeScrollGesture was tried first: in this headless build it sends no moves and scrolls nothing.)
    // Keep the moves about 12ms apart. With 20ms spacing this headless build under-scrolls slow drags on every page,
    // including pages that never had snapping (checked on the collection page), so it says nothing about the theme.
    const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    const swipe = async (distance, { speed = 500, fling = false } = {}) => {
      await page.evaluate(() => { window.__ys = []; window.__run = true; const f = () => { window.__ys.push(Math.round(scrollY)); if (window.__run) requestAnimationFrame(f); }; requestAnimationFrame(f); });
      const before = await y();
      const x = Math.round(info.width / 2);
      // The first ~15px of travel are the browser's touch slop (it decides tap or scroll): add them to the finger's path.
      const travel = distance + Math.sign(distance) * 15;
      const y0 = Math.round(distance > 0 ? Math.min(info.inner - 30, info.inner * 0.5 + travel / 2) : Math.max(90, info.inner * 0.5 + travel / 2));
      let t = Date.now() / 1000;
      const send = (type, py) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: py === null ? [] : [{ x, y: py, id: 1 }], timestamp: t });
      const duration = Math.max(90, Math.abs(travel) / speed * 1000);
      const steps = Math.max(8, Math.round(duration / 12));
      await send('touchStart', y0);
      for (let i = 1; i <= steps; i++) { t += duration / steps / 1000; await send('touchMove', y0 - travel * i / steps); await sleep(duration / steps); }
      if (!fling) for (let i = 0; i < 8; i++) { t += 0.03; await send('touchMove', y0 - travel); await sleep(30); }
      t += 0.004; await send('touchEnd', null);
      const lifted = await y();
      await page.waitForTimeout(fling ? 2600 : 1300);
      const settled = await y();
      const ys = await page.evaluate(() => { window.__run = false; return window.__ys; });
      // Largest move against the direction of the swipe at any frame (a pull-back).
      let back = 0; for (let i = 1; i < ys.length; i++) back = Math.max(back, distance > 0 ? ys[i - 1] - ys[i] : ys[i] - ys[i - 1]);
      // Furthest the page travelled from its start while the gesture ran (how far it followed the finger).
      const peak = ys.reduce((m, v) => Math.max(m, Math.abs(v - before)), 0);
      return { before, lifted, settled, moved: settled - before, afterLift: settled - lifted, back, peak };
    };
    const near = (a, b, tol) => Math.abs(a - b) <= tol;
    const sectionH = info.tops[1] - info.tops[0];

    // A. Short swipe: a small distance, finger lifted at rest.
    await place(0);
    let r = await swipe(120);
    check('A short swipe (120px) moves that far and stays', near(r.moved, 120, 30) && Math.abs(r.afterLift) <= 2, `followed the finger ${r.peak}px, rests ${r.moved}px from the start, largest pull-back ${r.back}`);

    // C. Slow swipe that stops half-way through a section.
    await place(0);
    r = await swipe(Math.round(sectionH / 2), { speed: 320 });
    check(`C slow swipe to mid-section (${Math.round(sectionH / 2)}px) rests there, not pulled back or forward`, near(r.moved, sectionH / 2, 40) && Math.abs(r.afterLift) <= 2 && r.back <= 2, `followed the finger ${r.peak}px, rests ${r.moved}px from the start, largest pull-back ${r.back}`);

    // B. Long swipe with a fling: momentum carries the page on, through more than one section.
    await place(0);
    r = await swipe(Math.round(info.inner * 0.6), { speed: 3200, fling: true });
    const crossed = info.tops.filter((t) => t > r.before && t <= r.settled).length;
    check('B long swipe with momentum travels on past the next section', r.moved > sectionH * 1.25 && r.back <= 2, `moved ${r.moved} (${(r.moved / sectionH).toFixed(2)} sections, ${crossed} boundaries crossed), largest pull-back ${r.back}`);
    check('B the fling does not come to rest exactly on a section top', !info.tops.some((t) => Math.abs(t - r.settled) <= 1) || reportOnly, `rests at ${r.settled}`);

    // Arrival effects still play under free scrolling: walk the page with flicks, then every watched element
    // that has been on screen carries data-arrived.
    for (let i = 0; i < 7; i++) await swipe(Math.round(info.inner * 0.6), { speed: 2600, fling: true });
    const arrivals = await page.evaluate(() => { const watched = [...document.querySelectorAll('.curtain, .manifesto, .wipe-up, .stagger, .dusk, .lines, .letters')]; const seen = watched.filter((e) => e.getBoundingClientRect().top < innerHeight); return { seen: seen.length, arrived: seen.filter((e) => e.hasAttribute('data-arrived')).length, bottom: Math.round(scrollY + innerHeight) >= document.documentElement.scrollHeight - 2 }; });
    check('arrival effects have played on every section scrolled past; the page reaches its end', arrivals.seen > 0 && arrivals.arrived === arrivals.seen && arrivals.bottom, JSON.stringify(arrivals));

    // D. Reverse swipe from the middle of the page.
    const start = await place(Math.round(sectionH * 2.5));
    r = await swipe(-200);
    check('D reverse swipe (200px up) moves that far and stays', near(r.moved, -200, 30) && Math.abs(r.afterLift) <= 2 && r.back <= 2, `from ${start}: followed the finger ${r.peak}px, rests ${r.moved}px from the start, largest pull-back ${r.back}`);

    // E. Repeated swipes: each adds to the last; nothing jumps or locks.
    await place(0);
    const steps = []; let worstBack = 0, worstAfter = 0;
    for (let i = 0; i < 8; i++) { r = await swipe(150, { speed: 700 }); steps.push(r.moved); worstBack = Math.max(worstBack, r.back); worstAfter = Math.max(worstAfter, Math.abs(r.afterLift)); }
    check('E eight swipes of 150px each move about 150px, none jumps, locks or is pulled back', steps.every((s) => near(s, 150, 35)) && worstBack <= 2 && worstAfter <= 2, `steps ${JSON.stringify(steps)}, total ${await y()}, largest pull-back ${worstBack}`);

    // F. Section boundaries: stop a little before one, and a little past one.
    for (const [label, offset] of [['just before', -60], ['just past', 70]]) {
      const from = await place(info.tops[1] - 200);
      const want = info.tops[1] + offset - from;
      r = await swipe(want, { speed: 300 });
      check(`F stopping ${label} a section top (${offset > 0 ? '+' : ''}${offset}px) rests there`, near(r.settled, info.tops[1] + offset, 35) && Math.abs(r.afterLift) <= 2 && r.back <= 2, `section top ${info.tops[1]}, rests at ${r.settled}, after lift ${r.afterLift}`);
    }
    // Nothing locks the document.
    const state = await page.evaluate(() => ({ overflow: getComputedStyle(document.documentElement).overflowY, hold: document.documentElement.classList.contains('touch-hold') }));
    check('the document is never locked after scrolling', state.overflow !== 'hidden' && !state.hold, JSON.stringify(state));
    check('no script errors', errors.filter((e) => !/createPromise/.test(e)).length === 0, errors.slice(0, 2).join(' | '));
    await context.close();
  }
  await browser.close();
  if (!reportOnly) console.log(failures ? `\n${failures} FAILED` : '\nALL PASSED');
  process.exit(failures && !reportOnly ? 1 : 0);
})();

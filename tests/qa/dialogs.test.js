// Regression test for Search / Bag panels on the locally rendered theme (tools/preview, port 8766).
// Checks the page offset around every way of opening and closing, including what phones do to the page
// (moving it while the keyboard is up, and again while the keyboard folds away after the close).
// Usage: node dialogs.test.js            Exit code 1 on any failure.
const { chromium, devices } = require('playwright');
const BASE = process.env.BASE || 'http://127.0.0.1:8766';
const PANELS = { search: 'predictive-search', bag: 'cart-drawer' };
let failures = 0;
const check = (label, ok, detail = '') => { if (!ok) failures++; console.log(`${ok ? 'ok  ' : 'FAIL'} ${label}${detail ? '  ' + detail : ''}`); };

(async () => {
  const browser = await chromium.launch();
  for (const [device, options] of [['phone', { ...devices['iPhone 13'], deviceScaleFactor: 1 }], ['desktop', { viewport: { width: 1440, height: 900 } }]]) {
    const context = await browser.newContext(options);
    for (const name of ['index', 'collection', 'product']) {
      const page = await context.newPage();
      const errors = []; page.on('pageerror', (e) => errors.push(e.message));
      await page.goto(`${BASE}/${name}.html`, { waitUntil: 'load' });
      await page.waitForFunction(() => customElements.get('s-dialog'));
      await page.waitForTimeout(900);
      const y = () => page.evaluate(() => Math.round(scrollY));
      const rest = async (fraction) => { await page.evaluate((f) => window.scrollTo({ top: (document.documentElement.scrollHeight - innerHeight) * f, behavior: 'instant' }), fraction); await page.waitForTimeout(650); return y(); };
      // DOM clicks go through the same command path as a tap, without the test tool scrolling the page first.
      const open = (id) => page.evaluate((id) => [...document.querySelectorAll(`button[commandfor="${id}"][command="show-modal"]`)][0].click(), id);
      const close = (id) => page.evaluate((id) => document.querySelector(`#${id} button[command="close"]`).click(), id);
      const closed = (id) => page.waitForFunction((id) => { const d = document.getElementById(id); return !d.open && !d.hasAttribute('data-closing'); }, id, { timeout: 5000 });
      const tag = (s) => `${device} ${name}: ${s}`;

      for (const [word, id] of Object.entries(PANELS)) {
        // 1. Ten plain cycles from a resting place two thirds down the page.
        let start = await rest(0.66);
        const seen = new Set();
        for (let i = 0; i < 10; i++) { await open(id); await page.waitForTimeout(160); await close(id); await closed(id); await page.waitForTimeout(60); seen.add(await y()); }
        check(tag(`${word} 10 open/close cycles stay at ${start}`), seen.size === 1 && seen.has(start), JSON.stringify([...seen]));

        // 2. The page is moved while the panel is open (phone keyboard), then closed with the button.
        await open(id); await page.waitForTimeout(250);
        await page.evaluate(() => { document.documentElement.scrollTop += 140; });
        await close(id); await closed(id); await page.waitForTimeout(120);
        check(tag(`${word} moved while open, lands on ${start}`), (await y()) === start, `got ${await y()}`);

        // 3. The page is moved again shortly AFTER the close (keyboard folding away, browser bars returning).
        await open(id); await page.waitForTimeout(250); await close(id); await closed(id);
        await page.waitForTimeout(120);
        await page.evaluate(() => { document.documentElement.scrollTop -= 180; });
        await page.waitForTimeout(250);
        check(tag(`${word} moved after the close, put back on ${start}`), (await y()) === start, `got ${await y()}`);
        await page.waitForTimeout(800);

        // 4. Once the visitor scrolls, the page is theirs: no pulling back.
        await open(id); await page.waitForTimeout(250); await close(id); await closed(id);
        await page.waitForTimeout(80);
        // The start of a gesture (synthetic, so no link is activated and nothing navigates).
        await page.evaluate((type) => window.dispatchEvent(new Event(type, { bubbles: true })), device === 'phone' ? 'touchstart' : 'wheel');
        const target = await page.evaluate(() => { const to = Math.max(0, Math.round(scrollY) - 420); document.documentElement.scrollTop = to; return to; });
        await page.waitForTimeout(500);
        const landed = await y();
        // The homepage on touch screens snaps to its sections, so only require that the page was not pulled back.
        check(tag(`${word} visitor scroll after the close is respected`), landed !== start || target === start, `start ${start} asked ${target} got ${landed}`);
        // Come back to rest; the resting offset can differ slightly (the header may be tucked away or not).
        start = await rest(0.66);

        // 5. Escape, and the native close path that bypasses the wrapper. Each step compares with the offset
        //    measured just before opening (the page length can change between steps).
        let before = await y();
        await open(id); await page.waitForTimeout(250); await page.keyboard.press('Escape'); await closed(id); await page.waitForTimeout(100);
        check(tag(`${word} Escape lands on ${before}`), (await y()) === before, `got ${await y()}`);
        before = await y();
        await open(id); await page.waitForTimeout(250);
        await page.evaluate((id) => { document.documentElement.scrollTop += 140; HTMLDialogElement.prototype.close.call(document.getElementById(id)); }, id);
        await page.waitForTimeout(300);
        check(tag(`${word} native close lands on ${before}`), (await y()) === before, `got ${await y()}`);

        // 6. Reopen while the exit is running, then close: still one panel, same place, nothing left open.
        before = await y();
        await open(id); await page.waitForTimeout(250); await close(id); await page.waitForTimeout(150); await open(id); await page.waitForTimeout(300);
        const reopened = await page.evaluate((id) => document.getElementById(id).open, id);
        await close(id); await close(id); await closed(id); await page.waitForTimeout(120);
        check(tag(`${word} reopen during exit, double close`), reopened && (await y()) === before && !(await page.evaluate((id) => document.getElementById(id).open, id)), `reopened ${reopened} got ${await y()}`);
      }

      // 7. Search keeps focus management: the field is focused when open, the trigger after the close.
      await rest(0.3);
      await open('predictive-search'); await page.waitForTimeout(400);
      const focusedOpen = await page.evaluate(() => document.activeElement?.id);
      await close('predictive-search'); await page.waitForTimeout(100);
      const focusedDuringExit = await page.evaluate(() => document.activeElement?.id || document.activeElement?.tagName);
      await closed('predictive-search');
      check(tag('search field focused on open, released as the exit starts'), focusedOpen === 'predictive-search-input' && focusedDuringExit !== 'predictive-search-input', `${focusedOpen} -> ${focusedDuringExit}`);

      const real = errors.filter((e) => !/createPromise/.test(e));
      check(tag('no script errors'), real.length === 0, real.slice(0, 2).join(' | '));
      await page.close();
    }
    await context.close();
  }
  await browser.close();
  console.log(failures ? `\n${failures} FAILED` : '\nALL PASSED');
  process.exit(failures ? 1 : 0);
})();

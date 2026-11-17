// Homepage structure and full-screen fit on phones (and a desktop check).
// For every homepage screen it aligns the section top under the sticky header, lets the arrival effects finish,
// and measures: section height against the visible screen (viewport minus header), text and controls cut off by the
// section or by the screen, sideways overflow. Screenshots go to shots/layout/<device>/.
// Usage: node home-layout.test.js [pageFile]     REPORT=1 prints numbers without pass/fail.   Exit 1 on failure.
const { chromium, devices } = require('playwright');
const fs = require('fs');
const BASE = process.env.BASE || 'http://127.0.0.1:8766';
const FILE = process.argv[2] || 'index';
const reportOnly = process.env.REPORT === '1';
const shots = process.env.SHOTS !== '0';
let failures = 0;
const check = (label, ok, detail = '') => { if (!ok && !reportOnly) failures++; console.log(`${reportOnly ? '    ' : ok ? 'ok  ' : 'FAIL'} ${label}${detail ? '  ' + detail : ''}`); };
const EXPECTED = ['ring', 'rooms', 'edit', 'manifesto', 'access'];
const PHONES = [
  ['iPhone SE 1st (320x568)', devices['iPhone SE']], ['iPhone 13 Mini (375x629)', devices['iPhone 13 Mini']],
  ['iPhone 16e (390x651)', devices['iPhone 16e']], ['iPhone 14 (390x664)', devices['iPhone 14']], ['iPhone 15 (393x659)', devices['iPhone 15']],
  ['iPhone 16 Pro (402x681)', devices['iPhone 16 Pro']], ['iPhone SE 3rd (375x667)', devices['iPhone SE (3rd gen)']],
  ['iPhone 15 Pro Max (430x739)', devices['iPhone 15 Pro Max']], ['iPhone 16 Pro Max (440x763)', devices['iPhone 16 Pro Max']],
  ['Galaxy S8 (360x740)', devices['Galaxy S8']], ['Galaxy S24 (360x780)', devices['Galaxy S24']], ['Pixel 7 (412x839)', devices['Pixel 7']],
  ['tall narrow, fold cover (344x882)', { ...devices['Galaxy S8'], viewport: { width: 344, height: 882 } }]
];
const DESKTOP = [['desktop (1440x900)', { viewport: { width: 1440, height: 900 } }], ['laptop (1280x720)', { viewport: { width: 1280, height: 720 } }]];
const only = process.env.DEVICE;

(async () => {
  const browser = await chromium.launch();
  for (const [name, options] of [...PHONES, ...DESKTOP]) {
    if (only && !name.includes(only)) continue;
    const phone = !!options.isMobile;
    const context = await browser.newContext({ ...options, deviceScaleFactor: 1 });
    const page = await context.newPage();
    const errors = []; page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(`${BASE}/${FILE}.html`, { waitUntil: 'load' }); await page.waitForTimeout(1500);
    const dir = `shots/layout/${name.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}`; if (shots) fs.mkdirSync(dir, { recursive: true });

    // Identify the homepage screens in document order.
    const order = await page.evaluate(() => [...document.querySelectorAll('s-screen-lock > .screen')].map((s) =>
      s.querySelector('s-ring') ? 'ring' : s.classList.contains('campaign') ? 'campaign' : s.classList.contains('rooms') ? 'rooms'
        : s.querySelector('.manifesto') ? 'manifesto' : s.classList.contains('access') ? 'access' : s.querySelector('.wipe-up') ? 'edit' : 'unknown'));
    console.log(`\n${name}: order ${order.join(' > ')}`);
    check('section order is Ring > Women/Men > The edit > Letters (manifesto) > Email signup, each once', JSON.stringify(order) === JSON.stringify(EXPECTED), order.join(','));
    const lastIsAccess = await page.evaluate(() => { const l = [...document.querySelectorAll('s-screen-lock > *')].filter((e) => e.tagName !== 'SCRIPT').pop(); return l?.classList.contains('access'); });
    check('email signup is the last homepage section', lastIsAccess);

    // Units that should fill one screen: ring, each room on phones (the pair on wider screens), the edit's opening
    // screen on phones, manifesto, access.
    const units = await page.evaluate((phone) => {
      const list = [];
      for (const s of document.querySelectorAll('s-screen-lock > .screen')) {
        if (s.classList.contains('rooms')) {
          if (phone) s.querySelectorAll(':scope > .room').forEach((r, i) => list.push({ id: `room-${i + 1}`, sel: `s-screen-lock > .rooms > .room:nth-child(${i + 1})` }));
          else list.push({ id: 'rooms', sel: 's-screen-lock > .rooms' });
        } else if (s.querySelector('.wipe-up')) {
          list.push({ id: 'edit (opening screen)', sel: '.edit-cover', fallback: 's-screen-lock > .screen:has(.wipe-up)', whole: 's-screen-lock > .screen:has(.wipe-up)' });
        } else {
          const id = s.querySelector('s-ring') ? 'ring' : s.querySelector('.manifesto') ? 'manifesto' : s.classList.contains('access') ? 'access' : 'campaign';
          list.push({ id, sel: id === 'manifesto' ? 's-screen-lock > .screen:has(.manifesto)' : id === 'ring' ? 's-screen-lock > .screen:has(s-ring)' : id === 'access' ? 's-screen-lock > .access' : 's-screen-lock > .campaign' });
        }
      }
      return list;
    }, phone);

    for (const unit of units) {
      // Align the screen's section top under the header.
      const target = await page.evaluate(({ sel, fallback, whole }) => {
        const el = document.querySelector(sel) || document.querySelector(fallback);
        const sect = whole ? document.querySelector(whole) : el;
        const header = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || document.querySelector('header').getBoundingClientRect().height;
        return Math.round(sect.getBoundingClientRect().top + scrollY - header);
      }, unit);
      await page.evaluate((t) => window.scrollTo({ top: t, behavior: 'instant' }), target);
      await page.waitForTimeout(2700);
      const m = await page.evaluate(({ sel, fallback, whole, id }) => {
        const el = document.querySelector(sel) || document.querySelector(fallback);
        const sect = whole ? document.querySelector(whole) : el;
        const headerH = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || document.querySelector('header').getBoundingClientRect().height;
        const screen = innerHeight - headerH;
        const sr = sect.getBoundingClientRect();
        // The opening screen of The edit is its cover plus the section's top padding.
        const unitBottom = el === sect ? sr.bottom : el.getBoundingClientRect().bottom;
        const unitH = unitBottom - sr.top;
        const visible = (n) => { const cs = getComputedStyle(n); return cs.visibility !== 'hidden' && cs.display !== 'none' && n.getClientRects().length; };
        const cut = [];
        const nodes = [...sect.querySelectorAll('h1,h2,h3,p,a,button,input,label,span,dt,dd,li')]
          .filter((n) => visible(n) && !n.closest('[aria-hidden="true"]') && (n.matches('a,button,input') || (n.childElementCount === 0 && n.textContent.trim())));
        for (const n of nodes) {
          const r = n.getBoundingClientRect(); if (!r.width || !r.height) continue;
          // Only what belongs to this unit (The edit: its opening screen, not the products below).
          if (r.top >= unitBottom - 1) continue;
          if (r.bottom > Math.min(unitBottom, innerHeight) + 1 || r.top < headerH - 1) cut.push(`${n.tagName.toLowerCase()} "${(n.textContent || n.value || n.placeholder || '').trim().slice(0, 24)}" ${Math.round(r.top)}-${Math.round(r.bottom)}`);
          else if (r.left < -1 || r.right > innerWidth + 1) cut.push(`${n.tagName.toLowerCase()} "${n.textContent.trim().slice(0, 24)}" x ${Math.round(r.left)}..${Math.round(r.right)}`);
        }
        return { id, screen: Math.round(screen), unitH: Math.round(unitH), sectionH: Math.round(sr.height), top: Math.round(sr.top), cut, overflowX: document.documentElement.scrollWidth - innerWidth };
      }, unit);
      const delta = m.unitH - m.screen;
      if (!phone && unit.whole) {
        // Wider screens: The edit is a two-column spread (pinned photograph beside the pieces), not a one-screen
        // section, and its sizing was not changed. Report only.
        console.log(`info ${unit.id} on a wide screen: cover ${m.unitH}px, screen ${m.screen}px; below the screen: ${m.cut.filter((c) => !/^a ""/.test(c)).slice(0, 3).join(' | ') || 'nothing'}`);
      } else {
        check(`${unit.id}: fills the visible screen (${m.screen}px)`, Math.abs(delta) <= 1, `height ${m.unitH}${unit.whole ? ` (whole section ${m.sectionH})` : ''}, ${delta >= 0 ? '+' : ''}${delta}px`);
        check(`${unit.id}: no text or control cut off`, m.cut.length === 0, m.cut.slice(0, 3).join(' | '));
      }
      if (m.overflowX > 0) check(`${unit.id}: no sideways scroll`, false, `${m.overflowX}px`);
      if (shots) await page.screenshot({ path: `${dir}/${String(units.indexOf(unit) + 1).padStart(2, '0')}-${unit.id.replace(/[^a-z0-9]+/gi, '-')}.png` });
    }
    const snap = await page.evaluate(() => ({ snap: getComputedStyle(document.documentElement).scrollSnapType, overflow: getComputedStyle(document.documentElement).overflowY }));
    if (phone) check('touch: no scroll snapping and no locked document', snap.snap === 'none' && snap.overflow !== 'hidden', JSON.stringify(snap));
    check('no script errors', errors.filter((e) => !/createPromise/.test(e)).length === 0, errors.slice(0, 2).join(' | '));
    await context.close();
  }
  await browser.close();
  if (!reportOnly) console.log(failures ? `\n${failures} FAILED` : '\nALL PASSED');
  process.exit(failures && !reportOnly ? 1 : 0);
})();

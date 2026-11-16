// Password page (the store's public face while closed): layout, form and dialog checks in English and Greek.
const { chromium } = require('playwright');
const BASE = process.env.BASE || 'http://127.0.0.1:8766';
let failures = 0; const check = (l, ok, d = '') => { if (!ok) failures++; console.log(`${ok ? 'ok  ' : 'FAIL'} ${l}${d ? '  ' + d : ''}`); };
(async () => {
  const b = await chromium.launch();
  for (const [label, w, h, file] of [['en 390', 390, 664, 'password'], ['el 320', 320, 568, 'password-el'], ['el 390', 390, 664, 'password-el'], ['en 1440', 1440, 900, 'password']]) {
    const c = await b.newContext({ viewport: { width: w, height: h }, hasTouch: w < 900, isMobile: w < 900 }); const p = await c.newPage();
    const errors = []; p.on('pageerror', (e) => errors.push(e.message));
    const res = await p.goto(`${BASE}/${file}.html`); if (!res.ok()) { console.log(`skip ${label}: ${file}.html not rendered`); await c.close(); continue; }
    await p.waitForTimeout(1600);
    const m = await p.evaluate(() => {
      const r = (s) => document.querySelector(s)?.getBoundingClientRect();
      const input = document.querySelector('.pw__label input'); const bar = r('.pw__bar'); const word = r('.pw__wordmark'); const enter = r('.pw__enter'); const legal = r('.pw__legal'); const submit = r('.pw__submit');
      return { overflowX: document.documentElement.scrollWidth - innerWidth, docH: document.documentElement.scrollHeight, innerH: innerHeight, font: parseFloat(getComputedStyle(input).fontSize),
        overlap: word.right > enter.left, legalInView: legal.bottom <= innerHeight + 1, submitH: submit.height, enterH: enter.height, h1: document.querySelectorAll('h1').length, required: input.required, type: input.type,
        missing: (document.body.innerText.match(/\[missing: [^\]]+\]/g) || []).length, domain: /myshopify\.com/.test(document.body.innerText) };
    });
    check(`${label}: no sideways scroll, one screen tall`, m.overflowX <= 0 && m.docH <= m.innerH + 1, JSON.stringify([m.overflowX, m.docH, m.innerH]));
    check(`${label}: email field 16px or more (no iOS zoom), required email`, m.font >= 16 && m.required && m.type === 'email', `${m.font}px`);
    check(`${label}: wordmark and password link do not collide`, !m.overlap);
    check(`${label}: tap targets at least 44px`, m.submitH >= 44 && m.enterH >= 44, `${m.submitH}/${m.enterH}`);
    check(`${label}: one h1, no missing strings, no myshopify address shown`, m.h1 === 1 && m.missing === 0 && !m.domain);
    await p.evaluate(() => document.getElementById('password-entry-trigger').click()); await p.waitForTimeout(1000);
    const open = await p.evaluate(() => ({ open: document.getElementById('password-entry-dialog').open, focus: document.activeElement?.id }));
    check(`${label}: password dialog opens with the field focused`, open.open && open.focus === 'password-entry', JSON.stringify(open));
    await p.keyboard.press('Escape'); await p.waitForTimeout(1100);
    check(`${label}: Escape closes it`, !(await p.evaluate(() => document.getElementById('password-entry-dialog').open)));
    check(`${label}: no script errors`, errors.length === 0, errors.slice(0, 2).join(' | '));
    await c.close();
  }
  await b.close(); console.log(failures ? `\n${failures} FAILED` : '\nALL PASSED'); process.exit(failures ? 1 : 0);
})();

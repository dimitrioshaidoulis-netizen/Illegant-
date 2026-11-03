const { chromium, devices } = require('playwright');
(async () => { const b = await chromium.launch(); const c = await b.newContext(devices['iPhone 13']); const p = await c.newPage();
 const errs=[]; p.on('pageerror',e=>errs.push(e.message));
 await p.goto('http://127.0.0.1:8765/page.html'); await p.waitForFunction(() => customElements.get('s-dialog'));
 await p.evaluate(() => scrollTo(0, 900));
 const r = {};
 // reopen during exit
 await p.evaluate(() => document.getElementById('open-bag').click()); await p.waitForTimeout(800);
 await p.evaluate(() => document.getElementById('close-bag').click()); await p.waitForTimeout(120);
 await p.evaluate(() => document.getElementById('cart-drawer').showModal()); await p.waitForTimeout(700);
 r.reopen = await p.evaluate(() => ({ open: document.getElementById('cart-drawer').open, closing: document.getElementById('cart-drawer').hasAttribute('data-closing'), opacity: getComputedStyle(document.getElementById('cart-drawer')).opacity }));
 // double close
 await p.evaluate(() => { const d = document.getElementById('cart-drawer'); d.close(); d.close(); });
 await p.waitForFunction(() => !document.getElementById('cart-drawer').open); await p.waitForTimeout(150);
 r.afterDoubleClose = await p.evaluate(() => ({ y: scrollY, focus: document.activeElement.id }));
 // focus restore via real trigger
 await p.focus('#open-search'); await p.keyboard.press('Enter'); await p.waitForTimeout(800);
 r.searchFocus = await p.evaluate(() => document.activeElement.id);
 await p.keyboard.press('Escape'); await p.waitForFunction(() => !document.getElementById('predictive-search').open); await p.waitForTimeout(150);
 r.afterEscape = await p.evaluate(() => ({ y: scrollY, focus: document.activeElement.id }));
 r.errors = errs; console.log(JSON.stringify(r)); await b.close(); })();

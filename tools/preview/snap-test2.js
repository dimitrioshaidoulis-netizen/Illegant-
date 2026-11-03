const { chromium, devices } = require('playwright');
(async () => { const b = await chromium.launch(); const c = await b.newContext(devices['iPhone 13']); const p = await c.newPage();
 const errs = []; p.on('pageerror', (e) => errs.push(e.message));
 await p.goto('http://127.0.0.1:8766/index.html'); await p.waitForTimeout(2500);
 await p.mouse.move(100, 620);
 const out = [];
 for (let i = 0; i < 14; i++) { await p.mouse.wheel(0, 250); await p.waitForTimeout(900); out.push(await p.evaluate(() => Math.round(scrollY))); }
 console.log('down x14 (250px each):', out.join(' '));
 const up = [];
 for (let i = 0; i < 4; i++) { await p.mouse.wheel(0, -250); await p.waitForTimeout(900); up.push(await p.evaluate(() => Math.round(scrollY))); }
 console.log('up x4:', up.join(' '), '| max', await p.evaluate(() => document.documentElement.scrollHeight - innerHeight));
 // dialog round trip keeps the locked position
 await p.evaluate(() => scrollTo({ top: 1201, behavior: 'instant' })); await p.waitForTimeout(500);
 await p.evaluate(() => document.getElementById('cart-drawer').showModal()); await p.waitForTimeout(900);
 await p.evaluate(() => document.getElementById('cart-drawer').close()); await p.waitForTimeout(1200);
 console.log('after bag open/close at 1201 ->', await p.evaluate(() => Math.round(scrollY)), 'errors', errs.length);
 await b.close(); })();

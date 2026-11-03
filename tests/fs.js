const { chromium, devices } = require('playwright');
(async () => { const b = await chromium.launch();
 for (const [n,o] of [['iphone13',devices['iPhone 13']],['desktop',{viewport:{width:1280,height:800}}]]) { const c = await b.newContext(o); const p = await c.newPage(); await p.goto('http://127.0.0.1:8765/page.html');
  console.log(n, await p.evaluate(() => ['email','qty','predictive-search-input'].map(i => i + '=' + getComputedStyle(document.getElementById(i)).fontSize).join(' '))); await c.close(); }
 await b.close(); })();

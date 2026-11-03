const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
 await p.goto('http://127.0.0.1:8766/collection.html'); await p.waitForTimeout(1500);
 console.log(await p.evaluate(() => { const r = (s) => { const e = document.querySelector(s); if (!e) return s + ' none'; const b = e.getBoundingClientRect(); const cs = getComputedStyle(e); return `${s} top=${b.top|0} h=${b.height|0} pos=${cs.position} display=${cs.display}`; }; return [r('#product-grid'), r('#product-grid > li'), r('#product-grid article'), r('#product-grid s-card-gallery'), r('#product-grid img'), r('footer'), r('main'), r('s-live-form')].join('\n'); }));
 await p.goto('http://127.0.0.1:8766/product.html'); await p.waitForTimeout(1500);
 console.log(await p.evaluate(() => { const fs = document.querySelector('s-variant-picker fieldset'); return fs ? fs.outerHTML.slice(0, 1500) : document.querySelector('s-variant-picker')?.outerHTML.slice(0, 1500); }));
 await b.close(); })();

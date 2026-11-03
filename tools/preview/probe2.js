const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
 for (const page of ['index','product']) { await p.goto(`http://127.0.0.1:8766/${page}.html`); await p.waitForTimeout(2500);
 console.log(page, await p.evaluate(() => { const els = document.elementsFromPoint(2, 2).slice(0, 4).map((e) => e.tagName + '.' + (e.className && e.className.baseVal === undefined ? e.className : '').toString().slice(0, 50)); const c = document.querySelector('s-cursor'); return JSON.stringify({ els, cursor: c && [...c.attributes].map((a) => a.name + '=' + a.value).join(' '), disc: c && getComputedStyle(c.querySelector('.cursor-disc')).opacity }); })); }
 await b.close(); })();

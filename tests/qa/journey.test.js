// The pre-launch visitor journey on the local preview (tools/preview, port 8766): a visitor from Instagram lands on the
// homepage while nothing is published, understands what is coming and can leave an email; no button leads to a dead end.
//
// Covers: the opening's call to action (empty store -> private-access sign-up, stocked store -> the edit), empty rooms
// (no count, filters, sort or view switch; a sign-up tagged for the room; FAQ), links to empty rooms hidden in the menu
// and the homepage, About/FAQ/Contact in the menu, one h1 per page, the menu and account panels (open, Escape, focus
// return, page offset), sign-up and contact forms (validation, busy state, one request on a double tap, campaign tag),
// Greek strings, and sideways overflow at 375, 390 and 1280 px.
//
// Form posts are intercepted by the test (the preview has no Shopify behind it): this proves what the theme sends,
// once, and when; it does not prove what Shopify answers. Chromium only (no WebKit in this environment).
// Usage: node journey.test.js     Exit code 1 on any failure.
const { chromium, devices } = require('playwright');
const BASE = process.env.BASE || 'http://127.0.0.1:8766';
let failures = 0;
const check = (label, ok, detail = '') => { if (!ok) failures++; console.log(`${ok ? 'ok  ' : 'FAIL'} ${label}${detail ? '  ' + detail : ''}`); };
const PHONE = { ...devices['iPhone 13'], deviceScaleFactor: 1 };

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext(PHONE);
  const page = await context.newPage();
  const errors = []; page.on('pageerror', (e) => errors.push(e.message));
  const go = async (file) => { await page.goto(`${BASE}/${file}`, { waitUntil: 'load' }); await page.waitForTimeout(500); };

  // 1. The opening's call to action.
  await go('index-empty.html');
  const cta = await page.$$eval('a[href="#private-access"]', (as) => as.map((a) => a.textContent.trim()));
  check('empty store: opening CTA leads to the private-access sign-up', cta.length >= 1 && /early access/i.test(cta[0]), JSON.stringify(cta));
  check('empty store: no link from the page body into the empty edit (menus excepted: they lead to its sign-up)', !(await page.$('main a[href="/collections/new-arrivals"]:not(nav a):not(dialog a)')));
  await page.locator('a[href="#private-access"]').first().click();
  await page.waitForTimeout(800);
  const landed = await page.evaluate(() => {
    const header = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) * 16 || 64;
    const r = document.getElementById('private-access').getBoundingClientRect();
    const field = document.querySelector('#private-access-form input[type=email]').getBoundingClientRect();
    return { top: Math.round(r.top), header: Math.round(header), fieldVisible: field.bottom <= innerHeight && field.top >= 0 };
  });
  check('empty store: CTA lands on the whole sign-up frame below the header, email field on screen', Math.abs(landed.top - landed.header) <= 2 && landed.fieldVisible, JSON.stringify(landed));
  await go('index.html');
  check('stocked store: opening CTA leads to the edit', (await page.$$eval('main a[href="/collections/new-arrivals"]', (as) => as.some((a) => /discover/i.test(a.textContent)))));

  // 2. Empty room.
  await go('collection-empty-store.html');
  const room = await page.evaluate(() => ({
    count: /\b0 pieces\b/i.test(document.querySelector('main').innerText),
    filters: !!document.getElementById('collection-filter-drawer'),
    view: !!document.querySelector('[data-view-option]'),
    tabs: [...document.querySelectorAll('main nav a')].map((a) => a.getAttribute('href')),
    form: !!document.querySelector('s-submit-once form input[name="contact[email]"][required]'),
    tags: document.querySelector('s-submit-once input[name="contact[tags]"]')?.value,
    label: document.querySelector('s-submit-once label')?.textContent.trim(),
    faq: !!document.querySelector('main a[href="/pages/faq"]'),
    privacy: !!document.querySelector('s-submit-once a[href*="privacy"]'),
    describedBy: !!document.getElementById(document.querySelector('s-submit-once input[type=email]')?.getAttribute('aria-describedby') || 'x')
  }));
  check('empty room: no "0 pieces", filters, sort or view switch', !room.count && !room.filters && !room.view, JSON.stringify(room));
  check('empty room: no tabs into empty rooms', room.tabs.length === 0, JSON.stringify(room.tabs));
  check('empty room: labelled email sign-up tagged for this room, consent + privacy link, FAQ', room.form && /interest-women/.test(room.tags) && /private-access/.test(room.tags) && /email/i.test(room.label) && room.privacy && room.faq && room.describedBy, JSON.stringify(room));
  await go('collection.html');
  check('stocked room keeps count, filters and view switch', await page.evaluate(() => !!document.getElementById('collection-filter-drawer') && !!document.querySelector('[data-view-option]') && /\d+ pieces/i.test(document.querySelector('main').innerText)));
  await go('collection-empty.html');
  const tabs = await page.$$eval('main nav a', (as) => as.map((a) => a.getAttribute('href')));
  check('room tabs show only rooms with pieces', tabs.length > 1 && !tabs.some((h) => /t-shirts|trousers/.test(h)), JSON.stringify(tabs));

  // 3. Menus and homepage rooms: no links into empty rooms, no "0 pieces"; About, FAQ, Contact in the menu.
  await go('index-empty.html');
  const links = await page.evaluate(() => ({
    roomSubs: [...document.querySelectorAll('.room a.pointer-events-auto')].map((a) => a.getAttribute('href')),
    menuSubs: [...document.querySelectorAll('#site-menu .site-menu__sub a')].map((a) => a.getAttribute('href')),
    emptyLists: document.querySelectorAll('#site-menu .site-menu__sub:empty, #site-menu ul.site-menu__sub:not(:has(li))').length,
    zero: /\b0 pieces\b/i.test(document.body.innerText + [...document.querySelectorAll('[data-menu-photo]')].map((n) => n.textContent).join(' ')),
    help: [...document.querySelectorAll('#site-menu nav a[href^="/pages/"]')].map((a) => a.textContent.trim())
  }));
  check('empty store: homepage rooms and menu show no links into empty rooms', links.roomSubs.length === 0 && links.menuSubs.length === 0 && links.emptyLists === 0, JSON.stringify(links));
  check('empty store: no "0 pieces" anywhere (menu photos included)', !links.zero);
  check('menu holds About, FAQ and Contact', ['About', 'FAQ', 'Contact'].every((w) => links.help.some((t) => t.includes(w))), JSON.stringify(links.help));

  // 4. One h1 per page; a heading typed as h1 in page text becomes h2 and is kept.
  for (const file of ['index.html', 'index-empty.html', 'collection.html', 'collection-empty-store.html', 'product.html', 'search.html', 'cart.html', 'list-collections.html', 'page.html', 'page-faq.html', 'contact.html', '404.html', 'password.html', 'withdrawal.html']) {
    await go(file);
    const h1 = await page.$$eval('h1', (hs) => hs.length);
    check(`${file}: exactly one h1`, h1 === 1, String(h1));
  }
  await go('page-faq.html');
  check('FAQ: page text heading kept as h2', await page.evaluate(() => [...document.querySelectorAll('.richtext h2')].some((h) => /Frequently asked/.test(h.textContent))));
  await go('contact.html');
  check('Contact: page text heading kept as h2', await page.evaluate(() => [...document.querySelectorAll('.richtext h2')].some((h) => /hear from you/.test(h.textContent))));

  // 5. Menu and account panels: open, Escape, focus back on the opener, page offset kept, page behind does not scroll.
  // A tap focuses without scrolling (focus({ preventScroll })). The header's Account button shows from md up; on phones
  // the account panel opens from the menu, so it is checked at desktop width.
  for (const [word, id, viewport] of [['menu (phone)', 'site-menu', null], ['account (desktop)', 'account-panel', { width: 1280, height: 800 }]]) {
    if (viewport) await page.setViewportSize(viewport);
    await go('collection.html');
    await page.evaluate(() => window.scrollTo({ top: 600, behavior: 'instant' }));
    await page.waitForTimeout(300);
    const before = await page.evaluate(() => Math.round(scrollY));
    const opened = await page.evaluate((id) => { const b = [...document.querySelectorAll(`button[commandfor="${id}"][command="show-modal"]`)].find((el) => !el.closest('dialog') && el.getClientRects().length > 0); if (!b) return false; b.focus({ preventScroll: true }); b.click(); return true; }, id);
    if (!opened) { check(`${word}: opener exists`, false); continue; }
    await page.waitForFunction((id) => document.getElementById(id)?.open, id, { timeout: 4000 }).catch(() => {});
    await page.waitForTimeout(700);
    const state = await page.evaluate((id) => ({ open: document.getElementById(id).open, focusInside: document.getElementById(id).contains(document.activeElement) }), id);
    await page.mouse.wheel(0, 400); await page.waitForTimeout(300);
    const during = await page.evaluate(() => Math.round(scrollY));
    await page.keyboard.press('Escape');
    await page.waitForFunction((id) => { const d = document.getElementById(id); return !d.open && !d.hasAttribute('data-closing'); }, id, { timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(900);
    const after = await page.evaluate((id) => ({ y: Math.round(scrollY), focus: document.activeElement?.getAttribute('commandfor'), open: document.getElementById(id).open }), id);
    check(`${word}: opens with focus inside`, state.open && state.focusInside, JSON.stringify(state));
    check(`${word}: page behind does not move while open`, during === before, `${before} -> ${during}`);
    check(`${word}: Escape closes, focus back on the opener, offset kept`, !after.open && after.focus === id && after.y === before, JSON.stringify({ before, ...after }));
  }
  await page.setViewportSize(PHONE.viewport);

  // 6. Forms: validation, busy state, one request on a double tap, campaign tag from the address.
  const posts = [];
  await page.route('**/*', async (route) => {
    const req = route.request();
    if (req.method() !== 'POST') return route.continue();
    posts.push({ url: req.url(), body: decodeURIComponent((req.postData() || '').replace(/\+/g, ' ')) });
    await new Promise((r) => setTimeout(r, 1500));
    return route.fulfill({ status: 200, contentType: 'text/html', body: '<!doctype html><title>posted</title>' });
  });
  await go('collection-empty-store.html');
  await page.locator('s-submit-once button[type=submit]').click();
  await page.waitForTimeout(300);
  const invalid = await page.evaluate(() => document.querySelector('s-submit-once input[type=email]').matches(':invalid'));
  check('sign-up: empty email is refused by the browser, nothing sent', invalid && posts.length === 0, `posts ${posts.length}`);
  await page.fill('s-submit-once input[type=email]', 'not-an-email');
  await page.locator('s-submit-once button[type=submit]').click();
  await page.waitForTimeout(300);
  check('sign-up: malformed email is refused, nothing sent', posts.length === 0, `posts ${posts.length}`);

  await page.goto(`${BASE}/collection-empty-store.html?utm_source=Instagram&utm_medium=social`, { waitUntil: 'load' });
  await page.waitForTimeout(400);
  await page.fill('s-submit-once input[type=email]', 'test@example.com');
  const busy = await page.evaluate(() => {
    const button = document.querySelector('s-submit-once button[type=submit]');
    const form = button.form;
    form.requestSubmit(button); form.requestSubmit(button); button.click();
    return { aria: button.getAttribute('aria-busy'), text: button.textContent.trim() };
  });
  await page.waitForTimeout(2200);
  check('sign-up: busy state shown while sending', busy.aria === 'true' && /Sending/.test(busy.text), JSON.stringify(busy));
  check('sign-up: three fast submits send one request', posts.length === 1, `posts ${posts.length}`);
  check('sign-up: request carries the room tag and the campaign source', /contact\[tags\]=newsletter, private-access, interest-women, src-instagram/.test(posts[0]?.body || ''), posts[0]?.body);
  posts.length = 0;

  await go('contact.html');
  await page.fill('#contact-name', 'Test');
  await page.fill('#contact-email', 'test@example.com');
  await page.fill('textarea[name="contact[body]"]', 'Hello');
  await page.evaluate(() => { const b = document.querySelector('s-submit-once button[type=submit]'); b.form.requestSubmit(b); b.form.requestSubmit(b); });
  await page.waitForTimeout(2200);
  check('contact: double submit sends one request, no campaign tag added', posts.length === 1 && !/src-/.test(posts[0]?.body || ''), `posts ${posts.length}`);
  posts.length = 0;
  await page.unroute('**/*');

  // 6b. Withdrawal page (template only; the page stays a draft until the owner publishes it).
  await go('withdrawal-el.html');
  const wd = await page.evaluate(() => ({
    h1: document.querySelectorAll('h1').length,
    cta: [...document.querySelectorAll('a[href="#withdrawal-form"]')].map((a) => a.textContent.trim()),
    confirm: document.querySelector('#withdrawal-form button[type=submit]')?.textContent.trim(),
    required: [...document.querySelectorAll('#withdrawal-form [required]')].map((el) => el.name),
    labelled: [...document.querySelectorAll('#withdrawal-form input:not([type=hidden]), #withdrawal-form textarea')].every((el) => document.querySelector(`label[for="${el.id}"]`)),
    request: document.querySelector('#withdrawal-form input[type=hidden][name^="contact["]')?.value
  }));
  check('withdrawal: step 1 "withdraw from contract here" entry, step 2 separate confirm button (Greek)', /Υπαναχώρηση από τη σύμβαση εδώ/.test(wd.cta.join(' ')) && /Επιβεβαίωση υπαναχώρησης/.test(wd.confirm || ''), JSON.stringify(wd));
  check('withdrawal: one h1, every field labelled, name/email/order required, request marked as withdrawal', wd.h1 === 1 && wd.labelled && wd.required.length === 3 && /Υπαναχώρηση/.test(wd.request || ''), JSON.stringify(wd));

  // 7. Greek.
  for (const file of ['index-el-empty.html', 'collection-el-empty.html', 'password-el.html', 'cart-el.html', 'product-knit-soldout-el.html']) {
    await go(file);
    const text = await page.evaluate(() => document.body.textContent.replace(/\s+/g, ' '));
    check(`${file}: no missing translations`, !/\[missing:/.test(await page.content()));
    if (file === 'index-el-empty.html') check('Greek: opening CTA', /Ζητήστε πρώτη πρόσβαση/.test(text));
    if (file === 'collection-el-empty.html') check('Greek: empty room message and sign-up', /Η πρώτη επιλογή παίρνει μορφή/.test(text) && /Αφήστε το email σας/.test(text), text.slice(0, 120));
  }

  // 8. Sideways overflow.
  for (const [label, viewport] of [['375', { width: 375, height: 667 }], ['390', { width: 390, height: 844 }], ['1280', { width: 1280, height: 800 }]]) {
    await page.setViewportSize(viewport);
    for (const file of ['index-empty.html', 'collection-empty-store.html', 'contact.html', 'page-faq.html', 'search-empty.html']) {
      await go(file);
      const over = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
      check(`${label}px ${file}: no sideways overflow`, over <= 0, String(over));
    }
  }

  // View transitions abort when the test navigates faster than they can finish; that is the test, not the page.
  const real = errors.filter((e) => !/ViewTransition|Transition was aborted/.test(e));
  check('no script errors', real.length === 0, real.slice(0, 3).join(' | '));
  await browser.close();
  console.log(failures ? `\n${failures} failure(s)` : '\nall passed');
  process.exit(failures ? 1 : 0);
})();

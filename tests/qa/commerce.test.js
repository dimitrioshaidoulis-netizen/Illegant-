// Commerce behaviour of the theme on the local preview (tools/preview, port 8766): variant selection, Add to bag,
// quick add, sold-out and Notify me, prices, the bag drawer and bag page, empty-store homepage.
//
// Shopify platform pieces are simulated, not real: window.Shopify.actions (Standard Actions) is a recording mock and
// partial rendering is a stub that records requests. This proves what the theme's own code does and sends; it does not
// prove what Shopify answers. Real-store checks are listed in docs (Commerce Sprint 01).
//
// Usage: node commerce.test.js        Exit code 1 on any failure.
const { chromium, devices } = require('playwright');
const BASE = process.env.BASE || 'http://127.0.0.1:8766';
let failures = 0;
const check = (label, ok, detail = '') => { if (!ok) failures++; console.log(`${ok ? 'ok  ' : 'FAIL'} ${label}${detail ? '  ' + detail : ''}`); };

// Recording mock of Shopify Standard Actions. MOCK_MODE: 'ok' | 'error' | 'slow'.
const mockActions = (mode) => `
  window.__calls = [];
  window.__opened = 0;
  const configure = () => {};
  window.Shopify = { actions: {
    updateCart: Object.assign(async (payload, options) => {
      window.__calls.push(JSON.parse(JSON.stringify(payload)));
      if ('${mode}' === 'slow') await new Promise((r) => setTimeout(r, 600));
      if ('${mode}' === 'error') return { userErrors: [{ message: 'Only 1 left in stock.' }] };
      return { cart: { id: 'gid://shopify/Cart/1' }, userErrors: [] };
    }, { configure }),
    openCart: Object.assign(async () => { window.__opened++; }, { configure })
  } };`;

(async () => {
  const browser = await chromium.launch();
  const phone = { ...devices['iPhone 13'], deviceScaleFactor: 1 };
  const desktop = { viewport: { width: 1440, height: 900 } };
  const open = async (opts, file, mode = 'ok') => {
    const context = await browser.newContext(opts);
    await context.addInitScript(mockActions(mode));
    const page = await context.newPage();
    const errors = []; page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(`${BASE}/${file}.html`, { waitUntil: 'load' });
    await page.waitForTimeout(900);
    return { context, page, errors };
  };

  // 1. Variant picker: sold-out sizes are selectable; only missing combinations are disabled.
  {
    const { context, page, errors } = await open(phone, 'product-knit');
    const sizes = await page.evaluate(() => [...document.querySelectorAll('fieldset')].find((f) => /Size/.test(f.querySelector('legend')?.textContent || ''))
      .querySelectorAll('label').length);
    const state = await page.evaluate(() => {
      const fs = [...document.querySelectorAll('fieldset')].find((f) => /Size/.test(f.querySelector('legend').textContent));
      return [...fs.querySelectorAll('label')].map((l) => { const i = l.querySelector('input'); const span = l.querySelector('span.inline-flex');
        return { v: i.value, disabled: i.disabled, unavailable: l.hasAttribute('data-unavailable'), pe: getComputedStyle(l).pointerEvents, strike: getComputedStyle(span).textDecorationLine }; });
    });
    const soldOut = state.filter((s) => s.unavailable);
    check('product: sold-out sizes are marked and still selectable', soldOut.length === 2 && soldOut.every((s) => !s.disabled && s.pe !== 'none'), JSON.stringify(state));
    check('product: sold-out sizes read struck-through', soldOut.every((s) => s.strike.includes('line-through')));
    check('product: available sizes are plain', state.filter((s) => !s.unavailable).every((s) => !s.strike.includes('line-through')));
    // Choose sold-out S: the form's variant source of truth and the server request follow it.
    const soldId = await page.evaluate(() => document.querySelector('input[type="radio"][value="S"]').dataset.variantId);
    await page.locator('label[for$="-size-s"]').tap();
    await page.waitForTimeout(500);
    const after = await page.evaluate(() => ({ id: document.querySelector('form input[name="id"]').value, checked: document.querySelector('input[type="radio"][value="S"]').checked, fetches: window.__partialFetches || [] }));
    check('product: tapping a sold-out size selects it and sets input[name=id]', after.checked && after.id === soldId, JSON.stringify({ ...after, fetches: undefined }));
    check('product: the variant change asks the server for product-form + product-title for that variant', after.fetches.some((f) => f.names.includes('product-form') && f.url.includes(`variant=${soldId}`)), JSON.stringify(after.fetches));
    check('product: sizes count', sizes === 4, String(sizes));
    check('product: no script errors', errors.length === 0, errors.slice(0, 2).join(' | '));
    await context.close();
  }
  {
    const { context, page } = await open(phone, 'product-knit-ecru');
    const xl = await page.evaluate(() => { const i = document.querySelector('input[type="radio"][value="XL"]'); return { disabled: i.disabled, pe: getComputedStyle(i.closest('label')).pointerEvents }; });
    check('product: a combination that does not exist (Ecru / XL) stays disabled', xl.disabled && xl.pe === 'none', JSON.stringify(xl));
    await context.close();
  }

  // 2. Sold-out variant selected: no add button, sold-out states, Notify me records the variant.
  for (const [opts, name] of [[phone, 'phone'], [desktop, 'desktop']]) {
    const { context, page } = await open(opts, 'product-knit-soldout');
    const s = await page.evaluate(() => ({
      add: document.querySelectorAll('button[name="add"]').length,
      soldButtons: [...document.querySelectorAll('[data-product-form] button[aria-disabled="true"]')].map((b) => b.textContent.trim()),
      tags: document.querySelector('form input[name="contact[tags]"]')?.value || '',
      email: document.querySelector('form input[name="contact[email]"]')?.required,
      formType: document.querySelector('form input[name="contact[tags]"]')?.closest('form')?.getAttribute('action')
    }));
    check(`sold out (${name}): no Add to bag submit button`, s.add === 0, String(s.add));
    check(`sold out (${name}): main and buy-bar buttons say Sold out`, s.soldButtons.filter((t) => /sold out/i.test(t)).length >= 1, JSON.stringify(s.soldButtons));
    check(`sold out (${name}): Notify me tags record the piece and the exact variant`, s.tags === 'notify-me, interest-two-tone-knit, interest-two-tone-knit-black-l', s.tags);
    check(`sold out (${name}): Notify me is a native customer form with a required email`, s.email === true && /customer/.test(s.formType || ''), String(s.formType));
    await context.close();
  }

  // 3. Add to bag through Standard Actions: payload, busy state, opening the bag, double tap, error.
  for (const [opts, name, selector] of [[desktop, 'desktop', 'form button[name="add"]:not([data-mobile-buy-bar] *)'], [phone, 'phone buy bar', '[data-mobile-buy-bar] button[name="add"]']]) {
    const { context, page, errors } = await open(opts, 'product-knit', 'slow');
    const expectId = await page.evaluate(() => document.querySelector('form input[name="id"]').value);
    const btn = page.locator(selector).first();
    await btn.click();
    await page.waitForTimeout(80);
    const busy = await page.evaluate(() => document.querySelector('s-product-form').getAttribute('aria-busy'));
    await btn.click({ force: true }); // second tap while busy
    await page.waitForTimeout(900);
    const r = await page.evaluate(() => ({ calls: window.__calls, opened: window.__opened, busy: document.querySelector('s-product-form').getAttribute('aria-busy'), aria: document.querySelector('button[name="add"]').getAttribute('aria-disabled') }));
    check(`add to bag (${name}): one updateCart call with the selected variant and quantity 1`, r.calls.length === 1 && r.calls[0].lines[0].merchandiseId === expectId && r.calls[0].lines[0].quantity === 1, JSON.stringify(r.calls));
    check(`add to bag (${name}): busy while adding, double tap ignored, bag opens after`, busy === 'true' && r.opened === 1 && r.busy === null && r.aria === null, JSON.stringify({ busy, ...r, calls: undefined }));
    check(`add to bag (${name}): no script errors`, errors.length === 0, errors.slice(0, 2).join(' | '));
    await context.close();
  }
  {
    const { context, page } = await open(desktop, 'product-knit', 'error');
    await page.locator('form button[name="add"]').first().click();
    await page.waitForTimeout(500);
    const r = await page.evaluate(() => ({ opened: window.__opened, msg: document.querySelector('[data-add-to-cart-error]')?.textContent, hidden: document.querySelector('[data-add-to-cart-error]')?.hidden, role: document.querySelector('[data-add-to-cart-error]')?.getAttribute('role') }));
    check('add to bag: a refused add shows the platform message inline (role=alert) and keeps the bag closed', r.opened === 0 && r.msg === 'Only 1 left in stock.' && r.hidden === false && r.role === 'alert', JSON.stringify(r));
    await context.close();
  }

  // 4. Quick add on collection cards (mouse only): one press adds that size; refusal falls back to the product page.
  {
    const { context, page } = await open(desktop, 'collection');
    const card = page.locator('s-quick-add').first();
    await card.evaluate((el) => el.closest('.group\\/card, [class*="group/card"]')?.dispatchEvent(new MouseEvent('mouseover', { bubbles: true })));
    const first = await card.evaluate((el) => { const b = [...el.querySelectorAll('button[data-variant-id]')].find((x) => x.getAttribute('aria-disabled') !== 'true'); return b.dataset.variantId; });
    await card.evaluate((el, id) => el.querySelector(`button[data-variant-id="${id}"]`).click(), first);
    await page.waitForTimeout(400);
    const r = await page.evaluate(() => ({ calls: window.__calls, opened: window.__opened }));
    check('quick add: one press adds that size (quantity 1) and opens the bag', r.calls.length === 1 && String(r.calls[0].lines[0].merchandiseId) === first && r.calls[0].lines[0].quantity === 1 && r.opened === 1, JSON.stringify(r));
    const disabled = await card.evaluate((el) => { const b = el.querySelector('button[aria-disabled="true"]'); if (!b) return 'none'; b.click(); return 'clicked'; });
    await page.waitForTimeout(300);
    const r2 = await page.evaluate(() => window.__calls.length);
    check('quick add: a sold-out size does nothing', disabled === 'none' || r2 === 1, `${disabled}, calls ${r2}`);
    await context.close();
  }
  {
    const { context, page } = await open(desktop, 'collection', 'error');
    let navigated = '';
    await page.route('**/products/**', (route) => { navigated = route.request().url(); route.fulfill({ status: 200, body: 'product' }); });
    const card = page.locator('s-quick-add').first();
    const id = await card.evaluate((el) => [...el.querySelectorAll('button[data-variant-id]')].find((x) => x.getAttribute('aria-disabled') !== 'true').dataset.variantId);
    await card.evaluate((el, i) => el.querySelector(`button[data-variant-id="${i}"]`).click(), id);
    await page.waitForTimeout(800);
    check('quick add: when the platform refuses, the shopper lands on the product page with that size selected', navigated.includes('/products/') && navigated.includes(`variant=${id}`), navigated);
    await context.close();
  }

  // 5. Prices: a compare-at price shows the real saving; a regular price shows no sale markup.
  {
    const { context, page } = await open(phone, 'product-sale');
    const s = await page.evaluate(() => { const block = document.querySelector('[data-product-price]'); return { struck: block.querySelector('s')?.textContent.replace(/\s+/g, ' ').trim(), text: block.textContent.replace(/\s+/g, ' ').trim() }; });
    check('price: compare-at price is struck through, with its saving', /79/.test(s.struck || '') && /-25%/.test(s.text) && /59/.test(s.text), JSON.stringify(s));
    await context.close();
    const k = await open(phone, 'product-knit');
    const plain = await k.page.evaluate(() => document.querySelector('[data-product-price] s') === null);
    check('price: a regular price shows no sale markup', plain);
    await k.context.close();
  }

  // 6. Bag with items: drawer and page.
  for (const [opts, name] of [[phone, 'phone'], [desktop, 'desktop']]) {
    const { context, page, errors } = await open(opts, 'collection-cart');
    await page.evaluate(() => document.getElementById('cart-drawer').showModal());
    await page.waitForTimeout(1200);
    const d = await page.evaluate(() => {
      const drawer = document.getElementById('cart-drawer');
      const qty = [...drawer.querySelectorAll('button[command="--update-quantity"]')].map((b) => { const r = b.getBoundingClientRect(); return [Math.round(r.width), Math.round(r.height)]; });
      const checkout = drawer.querySelector('form button[type="submit"][name="checkout"]');
      const opts = [...drawer.querySelectorAll('.bag-line dl')].map((dl) => dl.textContent.replace(/\s+/g, ' ').trim());
      return { lines: drawer.querySelectorAll('.bag-line').length, qty, checkout: !!checkout, checkoutForm: checkout?.closest('form')?.getAttribute('action'), opts, overflowX: drawer.scrollWidth - drawer.clientWidth };
    });
    const minTouch = Math.min(...d.qty.map(([w, h]) => Math.min(w, h)));
    check(`bag drawer (${name}): two lines with their options`, d.lines === 2 && d.opts.some((o) => /Colour: Black/.test(o) && /Size: M/.test(o)), JSON.stringify(d.opts));
    check(`bag drawer (${name}): checkout is a native cart-form submit named "checkout"`, d.checkout && /cart/.test(d.checkoutForm || ''), String(d.checkoutForm));
    if (name === 'phone') check('bag drawer (phone): quantity buttons are at least 44px to the touch', minTouch >= 44, JSON.stringify(d.qty));
    check(`bag drawer (${name}): no sideways overflow`, d.overflowX <= 0, String(d.overflowX));
    check(`bag drawer (${name}): no script errors`, errors.length === 0, errors.slice(0, 2).join(' | '));
    await context.close();
  }
  // 6b. Bag drawer controls (phone): +, two fast + taps, remove, and a refused change. Standard Actions are mocked, so
  // this proves what the theme sends; Shopify's real answer (stock limits, totals) is checked on the store.
  for (const mode of ['ok', 'error']) {
    const { context, page, errors } = await open(phone, 'collection-cart', mode);
    await page.evaluate(() => document.getElementById('cart-drawer').showModal());
    await page.waitForTimeout(1000);
    const first = await page.evaluate(() => {
      const plus = document.querySelector('#cart-drawer button[command="--update-quantity"]:not([data-delta^="-"])');
      return { key: plus.dataset.lineKey, qty: Number(document.querySelector(`#cart-drawer [data-quantity-display][data-line-key="${plus.dataset.lineKey}"]`).value) };
    });
    const tapPlus = () => page.evaluate((key) => document.querySelector(`#cart-drawer button[command="--update-quantity"][data-line-key="${key}"]:not([data-delta^="-"])`).click(), first.key);
    await tapPlus();
    await page.waitForTimeout(700);
    const afterOne = await page.evaluate(() => window.__calls.slice());
    if (mode === 'ok') {
      check('bag + (phone): one updateCart for that line with quantity +1', afterOne.length === 1 && afterOne[0].lines[0].id === first.key && afterOne[0].lines[0].quantity === first.qty + 1, JSON.stringify(afterOne));
      await page.evaluate(() => { window.__calls.length = 0; });
      await tapPlus(); await tapPlus();
      await page.waitForTimeout(800);
      const twice = await page.evaluate(() => window.__calls.slice());
      check('bag + + (phone): two fast taps send one change with the final quantity', twice.length === 1 && twice[0].lines[0].quantity >= first.qty + 2, JSON.stringify(twice));
      await page.evaluate(() => { window.__calls.length = 0; });
      await page.evaluate((key) => document.querySelector(`#cart-drawer button[command="--remove"][data-line-key="${key}"]`).click(), first.key);
      await page.waitForTimeout(600);
      const removed = await page.evaluate(() => window.__calls.slice());
      check('bag remove (phone): sets that line to quantity 0', removed.length === 1 && removed[0].lines[0].id === first.key && removed[0].lines[0].quantity === 0, JSON.stringify(removed));
    } else {
      const shown = await page.evaluate((key) => ({
        qty: Number(document.querySelector(`#cart-drawer [data-quantity-display][data-line-key="${key}"]`)?.value),
        alert: [...document.querySelectorAll('[role=alert], #sr-announcer, s-notification')].map((n) => n.textContent.trim()).join(' | ')
      }), first.key);
      check('bag + refused (phone): quantity goes back to what the bag holds', shown.qty === first.qty, JSON.stringify(shown));
      // The refusal message is announced by the Standard Actions override (standard-actions-override.js, wired through
      // Shopify's configure hook), which this mock replaces: it can only be seen on the real store.
      console.log('note bag + refused: message toast not testable with the mock; check on the store (pending)');
    }
    check(`bag controls (${mode}): no script errors`, errors.length === 0, errors.slice(0, 2).join(' | '));
    await context.close();
  }
  {
    const { context, page } = await open(phone, 'cart-cart');
    const c = await page.evaluate(() => ({ checkout: !!document.querySelector('main form button[name="checkout"]'), lines: document.querySelectorAll('main [data-line-key]').length > 0, overflowX: document.documentElement.scrollWidth - innerWidth,
      qty: Math.min(...[...document.querySelectorAll('main button[command="--update-quantity"]')].map((b) => Math.min(b.getBoundingClientRect().width, b.getBoundingClientRect().height))) }));
    check('bag page (phone): lines, a checkout submit named "checkout", 44px quantity buttons, no sideways scroll', c.checkout && c.lines && c.qty >= 44 && c.overflowX <= 0, JSON.stringify(c));
    await context.close();
  }

  // 7. Homepage with an empty catalogue: no invented pieces for visitors; placeholders only in the theme editor.
  {
    const { context, page } = await open(phone, 'index-empty');
    const s = await page.evaluate(() => ({ placeholder: /Product title/.test(document.body.innerText), honest: /first edit is taking shape/i.test(document.body.innerText) }));
    check('homepage, empty catalogue: no placeholder "Product title" cards; says the edit is taking shape', !s.placeholder && s.honest, JSON.stringify(s));
    await context.close();
    const d = await open(phone, 'index-design');
    const p = await d.page.evaluate(() => /Product title/.test(document.body.innerText));
    check('homepage in the theme editor: placeholder cards still available to the merchant', p);
    await d.context.close();
  }

  // 8. Layout: no sideways scroll on commerce pages at small widths.
  for (const width of [320, 390]) {
    const context = await browser.newContext({ ...devices['iPhone 13'], viewport: { width, height: 700 }, deviceScaleFactor: 1 });
    await context.addInitScript(mockActions('ok'));
    const page = await context.newPage();
    const out = [];
    for (const f of ['product-knit', 'product-knit-soldout', 'product-sale', 'collection', 'cart-cart']) {
      await page.goto(`${BASE}/${f}.html`, { waitUntil: 'load' }); await page.waitForTimeout(400);
      out.push([f, await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)]);
    }
    check(`layout ${width}px: no sideways scroll on product, sold-out, sale, collection, bag pages`, out.every(([, o]) => o <= 0), JSON.stringify(out));
    await context.close();
  }

  await browser.close();
  console.log(failures ? `\n${failures} FAILED` : '\nALL PASSED');
  process.exit(failures ? 1 : 0);
})();

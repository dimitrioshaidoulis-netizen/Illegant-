// Local preview renderer for the ILLEGANT theme (no Shopify connection needed).
// Renders real templates + layout with LiquidJS, Shopify-dialect tags and mock store data, to static HTML for
// screenshots and interaction tests. It approximates Shopify; it is not Shopify. See tools/preview/README.md.
const fs = require('fs');
const path = require('path');
const { Liquid, Tag, Hash, Value, TokenKind } = require('liquidjs');

const THEME = path.resolve(process.argv[2] || path.join(__dirname, '../../theme'));
const OUT = path.resolve(process.argv[3] || path.join(__dirname, 'out'));
const LOCALE = process.argv[4] || 'en';
fs.mkdirSync(OUT, { recursive: true });

const stripHeader = (s) => s.replace(/^\s*\/\*[\s\S]*?\*\/\s*/, '');
const readJSON = (f) => JSON.parse(stripHeader(fs.readFileSync(f, 'utf8')));
const localeFile = LOCALE === 'en' ? 'en.default.json' : `${LOCALE}.json`;
const strings = readJSON(path.join(THEME, 'locales', localeFile));
const fallback = readJSON(path.join(THEME, 'locales', 'en.default.json'));
const settings = readJSON(path.join(THEME, 'config/settings_data.json')).current;

const engine = new Liquid({
  root: [path.join(THEME, 'snippets')], extname: '.liquid', strictFilters: false, strictVariables: false,
  jsTruthy: false, ownPropertyOnly: false
});

// ---------- filters ----------
const lookup = (obj, key) => key.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);
engine.registerFilter('t', function (key, ...args) {
  const opts = {}; for (const a of args) if (Array.isArray(a)) opts[a[0]] = a[1];
  let v = lookup(strings, key); if (v === undefined) v = lookup(fallback, key);
  if (v === undefined) return `[missing: ${key}]`;
  if (typeof v === 'object') v = (opts.count == 1 ? v.one : v.other) ?? v.other;
  return String(v).replace(/\{\{\s*(\w+)\s*\}\}/g, (_, k) => (opts[k] ?? ''));
});
const imgSrc = (img, w) => { if (!img) return ''; const src = typeof img === 'string' ? img : (img.src || img.preview_image?.src || ''); return src + (w ? `?width=${w}` : ''); };
engine.registerFilter('image_url', (img, ...args) => { let w = 0; for (const a of args) if (Array.isArray(a) && a[0] === 'width') w = a[1]; return imgSrc(img, w); });
engine.registerFilter('asset_url', (f) => `/assets/${f}`);
engine.registerFilter('inline_asset_content', (f) => { try { return fs.readFileSync(path.join(THEME, 'assets', f), 'utf8'); } catch { return ''; } });
engine.registerFilter('stylesheet_tag', (url) => `<link rel="stylesheet" href="${url}">`);
engine.registerFilter('money', (c) => `€${(Number(c || 0) / 100).toFixed(2).replace('.', ',')}`);
engine.registerFilter('money_with_currency', (c) => `€${(Number(c || 0) / 100).toFixed(2).replace('.', ',')} EUR`);
engine.registerFilter('color_brightness', (hex) => { const m = String(hex).replace('#', ''); const n = parseInt(m.length === 3 ? m.split('').map((x) => x + x).join('') : m, 16); const r = n >> 16, g = (n >> 8) & 255, b = n & 255; return (r * 299 + g * 587 + b * 114) / 1000; });
engine.registerFilter('font_face', () => '');
engine.registerFilter('font_modify', (f) => f);
engine.registerFilter('standard_event_data', () => '{}');
engine.registerFilter('structured_data', () => '{}');
engine.registerFilter('payment_button', () => '');
engine.registerFilter('default_errors', () => 'Error');
engine.registerFilter('placeholder_svg_tag', () => '<svg></svg>');

// ---------- tags ----------
const IGNORE_BODY = ['doc', 'schema'];
for (const name of IGNORE_BODY) {
  engine.registerTag(name, class extends Tag {
    constructor(token, remain, liquid) { super(token, remain, liquid); while (remain.length) { const t = remain.shift(); if (t.kind === TokenKind.Tag && t.name === 'end' + name) return; } }
    * render() { return ''; }
  });
}
// Body passthrough tags (partial, endpartial-style regions).
function passthrough(name, wrap) {
  engine.registerTag(name, class extends Tag {
    constructor(token, remain, liquid) {
      super(token, remain, liquid); this.args = token.args; this.tpls = [];
      const stream = this.liquid.parser.parseStream(remain).on('tag:end' + name, () => stream.stop()).on('template', (t) => this.tpls.push(t)).on('end', () => { throw new Error(`tag ${name} not closed`); });
      stream.start();
    }
    * render(ctx, emitter) { const html = yield this.liquid.renderer.renderTemplates(this.tpls, ctx); emitter.write(wrap ? wrap(html, this, ctx) : html); }
  });
}
passthrough('partial');
passthrough('style', (h) => `<style>${h}</style>`);
passthrough('javascript', (h) => `<script>${h}</script>`);
passthrough('stylesheet', (h) => `<style>${h}</style>`);

engine.registerTag('form', class extends Tag {
  constructor(token, remain, liquid) {
    super(token, remain, liquid); this.args = token.args; this.tpls = [];
    const stream = this.liquid.parser.parseStream(remain).on('tag:endform', () => stream.stop()).on('template', (t) => this.tpls.push(t));
    stream.start();
    const m = this.args.match(/^\s*'([^']+)'/); this.kind = m ? m[1] : 'form';
    const rest = this.args.replace(/^\s*'[^']+'\s*,?\s*(product\s*,?)?/, '');
    this.hash = new Hash(rest);
  }
  * render(ctx, emitter) {
    const h = yield this.hash.render(ctx);
    ctx.push({ form: { posted_successfully: false, errors: null } });
    const html = yield this.liquid.renderer.renderTemplates(this.tpls, ctx); ctx.pop();
    emitter.write(`<form method="post" action="/${this.kind}"${h.id ? ` id="${h.id}"` : ''}${h.class ? ` class="${h.class}"` : ''}>${html}</form>`);
  }
});
engine.registerTag('paginate', class extends Tag {
  constructor(token, remain, liquid) {
    super(token, remain, liquid); this.tpls = [];
    const stream = this.liquid.parser.parseStream(remain).on('tag:endpaginate', () => stream.stop()).on('template', (t) => this.tpls.push(t));
    stream.start();
  }
  * render(ctx, emitter) { ctx.push({ paginate: { current_offset: 0, current_page: 1, pages: 1, parts: [] } }); emitter.write(yield this.liquid.renderer.renderTemplates(this.tpls, ctx)); ctx.pop(); }
});

const blockCache = {};
function loadBlock(name) {
  if (blockCache[name]) return blockCache[name];
  const src = fs.readFileSync(path.join(THEME, 'blocks', name + '.liquid'), 'utf8');
  const defaults = {};
  const sm = src.match(/\{%-?\s*schema\s*-?%\}([\s\S]*?)\{%-?\s*endschema\s*-?%\}/);
  if (sm) { try { for (const s of JSON.parse(sm[1]).settings || []) if (s.id && s.default !== undefined) defaults[s.id] = s.type === 'link_list' ? linklists[s.default] : s.default; } catch {} }
  return (blockCache[name] = { tpl: engine.parse(src), defaults });
}
engine.registerTag('block', class extends Tag {
  constructor(token, remain, liquid) {
    super(token, remain, liquid);
    const m = token.args.match(/^\s*'([^']+)'\s*,?/); this.name = m[1];
    this.hash = new Hash(token.args.slice(m[0].length).replace(/block\.name\s*:/, 'block_name:'));
    this.tpls = [];
    const stream = this.liquid.parser.parseStream(remain).on('tag:endblock', () => stream.stop()).on('template', (t) => this.tpls.push(t));
    stream.start();
  }
  * render(ctx, emitter) {
    const args = yield this.hash.render(ctx);
    const content = yield this.liquid.renderer.renderTemplates(this.tpls, ctx);
    const b = loadBlock(this.name);
    const scope = { ...b.defaults, ...args, content, block: { id: 'b' + Math.random().toString(36).slice(2, 8), settings: { ...b.defaults, ...args } } };
    // Shopify isolates blocks: they see their arguments, schema defaults and globals only, never the caller's locals.
    const child = ctx.spawn(scope);
    emitter.write(yield this.liquid.renderer.renderTemplates(b.tpl, child));
  }
});

// ---------- mock data ----------
const img = (name, w = 1800, h = 2400, alt = '') => ({ src: `/img/${name}`, width: w, height: h, alt, aspect_ratio: w / h });
const imageNames = new Set();
for (const f of ['templates', 'layout', 'snippets', 'blocks'].flatMap((d) => fs.readdirSync(path.join(THEME, d)).map((x) => path.join(THEME, d, x)))) {
  for (const m of fs.readFileSync(f, 'utf8').matchAll(/illegant-[a-z0-9-]+\.(?:jpg|png)/g)) imageNames.add(m[0]);
}
const images = {}; for (const n of imageNames) images[n] = img(n);
fs.writeFileSync(path.join(OUT, 'image-names.json'), JSON.stringify([...imageNames]));

const sizes = ['XS', 'S', 'M', 'L'];
class OptionValue { constructor(name, variant, selected) { this.name = name; this.variant = variant; this.available = variant.available; this.selected = selected; this.swatch = null; this.id = variant.id; }
  toString() { return this.name; } valueOf() { return this.name; } }
function mkProduct(i, title, price, type, handle, opts = {}) {
  const imgs = opts.noImages ? [] : [img(`product-${(i % 6) + 1}a.jpg`, 1500, 2000, title), img(`product-${(i % 6) + 1}b.jpg`, 1500, 2000, title)];
  const variants = sizes.map((s, k) => ({ id: 1000 * i + k, title: s, option1: s, price: price * 100, compare_at_price: null, available: !opts.unavailable && k !== 3, sku: `ILG-${i}${k}`, quantity_rule: { min: 1 } }));
  return {
    id: i, title, handle, url: `/products/${handle}`, type, vendor: 'ILLEGANT', tags: opts.tags || [], available: !opts.unavailable,
    price: price * 100, price_min: price * 100, price_max: price * 100, created_at: new Date().toISOString(),
    description: '<p>Description placeholder for the local preview.</p>', featured_image: imgs[0] || null, images: imgs,
    media: imgs.map((m, k) => ({ ...m, id: 50 * i + k, media_type: 'image', preview_image: m })), featured_media: imgs[0] ? { preview_image: imgs[0] } : null,
    variants, selected_or_first_available_variant: variants.find((v) => v.available) || variants[0], has_only_default_variant: false,
    options: ['Size'], collections: [],
    options_with_values: [{ name: 'Size', position: 1, selected_value: (variants.find((v) => v.available) || variants[0]).option1,
      values: variants.map((v) => new OptionValue(v.option1, v, v === (variants.find((x) => x.available) || variants[0]))) }]
  };
}
const products = [
  mkProduct(1, 'The Essential Tee — Chalk', 39, 'T-Shirt', 'the-essential-tee-chalk'),
  mkProduct(2, 'The Tailored Trouser — Mink', 89, 'Trousers', 'the-tailored-trouser-mink'),
  mkProduct(3, 'The Everyday Knit — Mist', 79, 'Knitwear', 'the-everyday-knit-mist'),
  mkProduct(4, 'The Wool-Look Trouser — Mocha', 99, 'Trousers', 'the-wool-look-trouser-mocha'),
  mkProduct(5, 'Fine-knit Jumper', 79, 'Knitwear', 'fine-knit-jumper'),
  mkProduct(6, 'Overshirt', 119, 'Shirts', 'overshirt'),
  mkProduct(7, 'Fitted Top', 49, 'Tops', 'fitted-top'),
  mkProduct(8, 'Midi Dress', 119, 'Dresses', 'midi-dress', { unavailable: true, tags: ['coming-soon'] })
];
function mkCollection(handle, title, prods) { return { id: handle.length, handle, title, url: `/collections/${handle}`, products: prods, products_count: prods.length, all_products_count: prods.length, description: '', image: null, filters: [], sort_options: [], sort_by: '', default_sort_by: '' }; }
const EMPTY = process.env.EMPTY_STORE === '1';
const P = EMPTY ? [] : products;
const collections = {
  women: mkCollection('women', 'Women', P.slice(1, 8)), men: mkCollection('men', 'Men', P.slice(0, 6)),
  'new-arrivals': mkCollection('new-arrivals', 'New Arrivals', P), all: mkCollection('all', 'All', P),
  'women-s-tops': mkCollection('women-s-tops', 'Women’s Tops', P.slice(6, 8)), 'men-s-knitwear': mkCollection('men-s-knitwear', 'Men’s Knitwear', P.slice(2, 4))
};
for (const p of products) p.collections = [collections.women];
const link = (title, url, links = []) => ({ title, url, handle: title.toLowerCase().replace(/[^a-z]+/g, '-'), links, active: false, current: false, object: null });
const linklists = {
  'main-menu': { links: [link('New Arrivals', '/collections/new-arrivals'), link('Men', '/collections/men', [link('All menswear', '/collections/men'), link('T-shirts', '/collections/men-s-t-shirts'), link('Knitwear', '/collections/men-s-knitwear'), link('Trousers', '/collections/men-s-trousers')]), link('Women', '/collections/women', [link('All womenswear', '/collections/women'), link('Tops', '/collections/women-s-tops'), link('Knitwear', '/collections/women-s-knitwear'), link('Trousers', '/collections/women-s-trousers')])] },
  footer: { links: [link('About ILLEGANT', '/pages/about-illegant'), link('FAQ', '/pages/faq'), link('Contact', '/pages/contact'), link('Search', '/search')] }
};
const routes = { root_url: '/', cart_url: '/cart', cart_add_url: '/cart/add', cart_change_url: '/cart/change', cart_update_url: '/cart/update', search_url: '/search', predictive_search_url: '/search/suggest', all_products_collection_url: '/collections/all', collections_url: '/collections', account_url: '/account', account_login_url: '/account/login', product_recommendations_url: '/recommendations/products' };
const fontObj = (family) => ({ family, fallback_families: 'sans-serif', weight: 400, style: 'normal' });
const globals = {
  settings: { ...settings, type_primary_font: fontObj('Inter'), type_heading_font: fontObj('Inter') },
  shop: { name: 'ILLEGANT', url: 'http://localhost', description: '', customer_accounts_enabled: true, privacy_policy: { url: '/policies/privacy-policy', title: 'Privacy policy' }, brand: {}, enabled_locales: [{ iso_code: 'en', primary: true }, { iso_code: 'el' }], published_locales: [], currency: 'EUR', money_format: '€{{amount}}' },
  request: { locale: { iso_code: LOCALE, direction: 'ltr', primary: LOCALE === 'en' }, design_mode: false, origin: 'http://localhost', path: '/', host: 'localhost', page_type: '' },
  routes, collections, linklists, images, all_products: Object.fromEntries(products.map((p) => [p.handle, p])),
  pages: { faq: { url: '/pages/faq', title: 'FAQ' }, 'size-guide': process.env.SIZE_GUIDE === '1' ? { url: '/pages/size-guide', title: 'Size guide' } : null }, cart: { item_count: 0, items: [], total_price: 0, items_subtotal_price: 0, note: '', cart_level_discount_applications: [], requires_shipping: true },
  localization: { available_languages: [], available_countries: [], language: { iso_code: 'en' }, country: { iso_code: 'GR' } },
  customer: null, content_for_header: '', canonical_url: 'http://localhost/', current_page: 1, page_description: '', powered_by_link: ''
};

// The Liquid `form.posted_successfully?` property name is not valid in LiquidJS: rewrite it for the preview only.
const fix = (s) => s.replace(/posted_successfully\?/g, 'posted_successfully');
const origParse = engine.parse.bind(engine);
engine.parse = (src, file) => origParse(fix(src), file);
const origGet = engine.options.fs.readFileSync; engine.options.fs.readFileSync = (f) => fix(origGet(f));
const origGetAsync = engine.options.fs.readFile; engine.options.fs.readFile = async (f) => fix(await origGetAsync(f));

async function page(out, template, extra) {
  const tpl = fs.readFileSync(path.join(THEME, 'templates', template + '.liquid'), 'utf8');
  const ctx = { ...globals, template: template.split('.')[0], ...extra };
  ctx.request = { ...ctx.request, page_type: ctx.template };
  const content = await engine.parseAndRender(fix(tpl), ctx, { globals: ctx });
  const layout = fs.readFileSync(path.join(THEME, 'layout/theme.liquid'), 'utf8');
  const lctx = { ...ctx, content_for_layout: content, page_title: extra.page_title || 'ILLEGANT' };
  const html = await engine.parseAndRender(fix(layout), lctx, { globals: lctx });
  const shimmed = html.replace('"imports": {', '"imports": {\n    "@shopify/partial-rendering": "/stub/partial-rendering.js",').replace('https://cdn.shopify.com/storefront/standard-events.js', '/stub/standard-events.js');
  fs.writeFileSync(path.join(OUT, out + '.html'), shimmed);
  console.log('rendered', out, html.length);
}

(async () => {
  const only = process.env.ONLY ? process.env.ONLY.split(',') : null;
  const jobs = {
    index: () => page('index', 'index', {}),
    collection: () => page('collection', 'collection', { collection: collections.women, page_title: 'Women' }),
    'collection-empty': () => page('collection-empty', 'collection', { collection: mkCollection('women', 'Women', []), page_title: 'Women' }),
    product: () => page('product', 'product', { product: products[1], page_title: products[1].title }),
    'product-coming-soon': () => page('product-coming-soon', 'product', { product: products[7], page_title: products[7].title }),
    search: () => page('search', 'search', { search: { performed: false, terms: '', results: [], results_count: 0 } }),
    cart: () => page('cart', 'cart', {}),
    'list-collections': () => page('list-collections', 'list-collections', {}),
    page: () => page('page', 'page', { page: { title: 'About ILLEGANT', content: '<p>Our point of view. Less, but better.</p>', handle: 'about-illegant' } }),
    404: () => page('404', '404', {})
  };
  for (const [k, fn] of Object.entries(jobs)) { if (only && !only.includes(k)) continue; try { await fn(); } catch (e) { console.error('FAILED', k, e.message.split('\n')[0]); } }
})();

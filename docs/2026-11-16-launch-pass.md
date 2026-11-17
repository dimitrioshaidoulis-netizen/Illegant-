# ILLEGANT — launch-readiness pass (16 November 2026)

All code changes are on the git branch `claude/global-business-discovery-43fi2p` and on the **unpublished** Shopify theme
**ILLEGANT — Launch pass 16 Nov (unpublished)** (`191313772924`). The published theme was not modified. Nothing was
published, bought, installed or deleted. No products, prices, inventory, shipping, payment or domain settings were changed.

Rollback: git tag `rollback/2026-11-16-before-launch-pass` (commit `c604087`, also the tip of
`claude/illegant-shopify-audit-gtqqum`). On Shopify, simply do not publish the new copy, or delete it.

## 1. State found

| Item | Finding |
|---|---|
| Published theme | **ILLEGANT — Monochrome WORK 3 Nov** (`190832673148`). It was the unpublished working copy on 3 Nov and has been published since (4 Nov). `README.md` still described it as unpublished; corrected. |
| Git vs Shopify | Byte-identical before this pass (MD5 of every text file; only a trailing newline differed in `settings_data.json`). Git was a faithful mirror of the published theme. |
| Storefront | Password protection **on**. The only page the public can see is the password page. |
| Catalog | **0 active products.** 4 archived concept samples (AI concept images, "Development sample only"), 8 drafts named "Sample · …" without images. |
| Languages | Only **English** is published. The theme's full Greek translation cannot be reached by visitors. |
| Policies | Privacy policy only (Shopify template, contact is a personal Gmail address). No refund, shipping, terms or contact-information policy. Draft pages for withdrawal, shipping & returns and size guide are unpublished. |
| Shipping | Greece: Standard €5, free from €50, Express €13, no delivery estimates. An International zone (28 countries, €17) exists although the only market is Greece. Dispatch location has no address. |
| Payments | Not readable with this connection. |
| Cookie consent | Consent is required for Greece in the store's consent policy. The banner itself could not be seen (storefront unreachable from this environment). |
| Repository | **Public** on GitHub. It contains the business roadmap, supplier and unit-economics research. |

### What could not be tested
- **The real storefront.** This environment's network policy blocks `*.myshopify.com` and Shopify's CDN, and the store is
  password-protected. Shopify's theme-preview tools returned "requires additional permissions". Everything below was
  tested in a local renderer (`tools/preview`) that runs the real templates, CSS and JavaScript in Chromium with mock
  data and stand-in photographs.
- **Safari / iOS.** Only Chromium is available here. Phone results are Chromium with iPhone 13 emulation (touch, 390×664).
- **Checkout, add-to-bag against a real cart, predictive search results, filters:** these need Shopify's platform.
- **Core Web Vitals:** no field or lab measurement of the real site was possible. No scores are claimed.

## 2. The two reported problems

### A. Homepage photographs move on entering the site — two causes, both fixed
Measured frame by frame (`tests/qa/trace-home-entry.js`, phone emulation):

1. **Intended rise.** The ring's entrance animation slid every card up by 8% of its height while fading in
   (first card: top 213px → 193px over about one second).
2. **Unintended jump (bug).** CSS held the "starting ring" only while `<s-ring>` was undefined. Once the script defined the
   element, nothing held that value until the first animation frame, which waits for the lead photograph to decode. With
   photographs arriving 900ms late (normal on mobile data), the cards sprang out to the open ring and back:
   second card x 287 → 329 → 293, then the real entrance started.
3. **1px settle.** The header is 65px tall (64px + border) but the homepage's snap offset assumed 64px, so on touch
   screens the page came to rest at scrollY 1 on arrival.

Fix: cards fade in where they hang; the starting ring is held from the first frame by CSS and by the script; the header
border no longer adds height. After: in all three load conditions (fast, slow images, slow script) the first card stays
at 94,191 until the ring opens outward, once; scrollY on arrival is 0. The ring, its slow turn and drag are unchanged.

### B. Search and bag close too abruptly; page jumps
**Abrupt close — confirmed and fixed.** Measured (`tests/qa/profile-close.js`): the full-screen search sheet covered 54% of
its travel in the first 150ms, was fading from 200ms and gone by 300ms. It takes 750ms to open. The exit is now 620ms on
`cubic-bezier(0.5, 0, 0.2, 1)` and stays opaque until 80% of the travel: 5% at 100ms, 31% at 200ms, 72% at 300ms, 90% at
400ms. The backdrop and the menu curtain use the same time.

**Jump to top — not reproducible in Chromium; hardened.** With real mouse and touch input the page offset never changed
on the published code (homepage, collection, product; phone and desktop). The most likely real-device mechanism is the
phone keyboard: the search field kept focus until the panel had gone, so the keyboard folded away after the page offset
was restored, and the browser then moved the page again. Changes:
- the focused field is released when the exit starts, so the keyboard folds away during the exit;
- for 700ms after a close the restored offset is put back if the visual viewport or scroll offset changes, and released
  at the first touch, wheel or key press;
- no scroll call is made when the page has not moved (on the homepage a no-op scroll makes the browser re-evaluate CSS
  scroll snap).

`tests/qa/dialogs.test.js`: 96 checks pass (10 open/close cycles, page moved while open, page moved after the close,
visitor scroll respected, Escape, native close, reopen during exit, focus), on homepage, collection and product, phone
and desktop. **This still needs a real iPhone and Android check** (section 6).

## 3. Other changes in this pass

| Change | Why | Files | Tested |
|---|---|---|---|
| **Password page rebuilt in the house style** | It is the only public page. It was the base theme's stock page: large light type, rounded dialogs, sign-up hidden behind a secondary link, the `myshopify.com` address printed in the footer. Now: one photograph, the invitation in its shadow, email sign-up on the page (native form, tags `newsletter`, `opening-list`), consent line, "Enter with password" as a word. | `templates/password.liquid`, `assets/illegant-flagship.css` §11 | `tests/qa/password.test.js`, 32 checks, English and Greek, 320–1440px; axe-core: 0 violations |
| Greek fallback SEO text | The fallback page title and meta description were hard-coded English. | `snippets/meta-tags.liquid`, `locales/en.default.json`, `locales/el.json` | Rendered title checked |
| Distinct region names on the homepage | Two landmarks were both named "ILLEGANT". | `templates/index.liquid` | axe-core |

Checks run on the whole theme: Shopify Theme Check, 0 code errors (only missing keys in ~50 unused locale files);
axe-core on 11 page types at phone width, no contrast failures; Greek locale has all 267 keys of the English one;
no horizontal overflow on any page type at 390px and 1440px.

## 4. Problems found, by priority

**Critical (block a launch)**
1. No real products, photographs, descriptions, sizes or stock.
2. No refund/returns, shipping or terms policy; no legal business details (name, VAT number, GEMI, address, phone).
3. Payments not confirmed as configured.
4. Greek is not published, in a store whose primary market is Greece.

**High**
5. Brand photography is stock photography (Pexels) of garments ILLEGANT does not sell. Fine as a placeholder; at launch
   it shows clothes that cannot be bought.
6. Contact and privacy-policy email is a personal Gmail address; no custom domain.
7. No delivery estimates on shipping rates; dispatch location has no address.
8. The repository is public and contains business plans.
9. Panel behaviour on real phones is unverified (section 6).

**Medium**
10. Free shipping from €50 against €39–139 prices: check margins.
11. International shipping zone is unreachable (market is Greece only): remove or open the markets deliberately.
12. Homepage ring loads six photographs eagerly on phones; measure LCP on a real phone.
13. On phones the ring covers most of the wordmark behind it (the header logo still names the brand).
14. Filter drawer heading and button do not follow the house type scale (larger, sentence case).
15. Product page: no delivery, returns or size information near "Add to bag" until policies and the size-guide page are published (the theme shows them automatically once they exist).
16. Store description is empty (used for search-engine descriptions).

**Low**
17. ~50 unused locale files are out of date.
18. "More from" uses a collection slice, not Shopify recommendations.
19. About 40 unused AI concept images remain in Files.
20. `assets/illegant-flagship.css` should be folded into `config/styles.css` at the next rebuild in Shopify's editor.

## 5. Readiness scores (1–10)

| Category | Score | Reason |
|---|---|---|
| Brand identity | 6 | Coherent monochrome system and voice; no own photography or logo mark yet. |
| Design | 7 | Consistent, restrained, credible. Depends on placeholder photographs. |
| Mobile experience | 6 | Layouts hold from 320px; motion fixed here; real-device behaviour unverified. |
| User experience | 6 | Clear paths; search, filters, bag and checkout untested against the platform. |
| Product presentation | 2 | Templates are ready; there are no products. |
| Conversion readiness | 2 | Nothing to buy, no policies, no trust information. Email capture works in the theme. |
| Technical quality | 7 | Clean linter, tidy architecture, tests. CSS build cannot be rerun outside Shopify's editor. |
| Performance | 5 | Not measurable here. Sound image markup; six eager hero images are a risk. |
| SEO | 5 | Canonical, hreflang, structured data and noindex rules in place; no content, description or domain. |
| Operational readiness | 2 | Payments, policies, shipping details, language and legal identity are open. |

Overall: the storefront design and code are close to launch quality; the business is not ready to open. The remaining
work is mostly outside the theme.

## 6. Real-device check (10 minutes)

Preview: Shopify admin → Online Store → Themes → **ILLEGANT — Launch pass 16 Nov (unpublished)** → ⋯ → Preview; open the
preview link on the phone. For the password page add `/password` to the preview address.

1. Load the homepage five times (pull to refresh). Do the ring photographs appear in place and open outward once?
2. Scroll halfway down a collection, open Search, type a word, close. Repeat five times. Does the page stay put?
3. Same with Bag: close with "Close", by tapping the dark area, and with the Android back gesture.
4. Does the close feel calm rather than abrupt or sluggish? If it should be faster or slower, it is one number
   (`EXIT_MS` in `assets/s-dialog.js`, mirrored in `assets/illegant-flagship.css` §9).
5. Homepage, mid-way through "The edit": open and close Bag. No jump to the top of the section?
6. Password page: tap the email field. The page must not zoom. Submit a test address and look for it in Customers
   with the tag `opening-list`.

## 7. Next steps, in order

1. Run the device check above. If it passes, publish the new theme copy (owner action).
2. Add and publish Greek (Settings → Languages) and decide the default language.
3. Provide business details; have a lawyer or accountant review returns, shipping, terms and VAT treatment; publish policies.
4. Configure payments; add the dispatch address and delivery estimates; decide on the International zone.
5. Load the first real products with verified photographs, composition, sizes and stock.
6. Replace placeholder photography with ILLEGANT's own, or with supplier imagery you are licensed to use.
7. Buy and connect a domain; set up a brand mailbox; write the store description in Greek and English.
8. Make the GitHub repository private.
9. Measure Core Web Vitals on the real storefront, then remove the password.

## 8. Addendum, 17 November 2026: homepage scrolling on phones

**Reported.** On phones the homepage did not scroll naturally: a swipe was forced toward the next section, a slow swipe
that stopped before the next section jumped back, and the page could not rest half-way through a section.

**Root cause.** CSS only, in `assets/illegant-flagship.css` section 7, applied to touch screens on the homepage:
`html:has(s-screen-lock) { scroll-snap-type: y mandatory }`, with `scroll-snap-align: start` and
`scroll-snap-stop: always` on every homepage screen and each room, and `scroll-snap-align: end` on the footer.
"Mandatory" means the page may only rest on a section top; "always" means one swipe can never pass the next section.
No JavaScript was involved on touch screens: `s-screen-lock.js` returns before adding any listener unless the device
has a mouse, and its old touch code is never called. The rules were added on 3 November as a deliberate "lock per
section"; the behaviour reported is exactly what they do.

**Change.** Those rules are removed and nothing replaces them. `html:has(s-screen-lock)` now states
`scroll-snap-type: none`. Section sizes, photographs and arrival effects are unchanged. In `assets/s-screen-lock.js` only
comments changed. No other page is affected (the selector matches the homepage only).

**Measured with real touch events** (finger down, moves, lift; `tests/qa/home-scroll.test.js`), iPhone 13 emulation:

| Scenario | Before | After |
|---|---|---|
| A. Short swipe, 120px | followed the finger 123px, then pulled back to the start | rests 123px down |
| B. Flick | stopped exactly on the next section top (600px) | travels on 2,352px (3.9 sections) and rests mid-section |
| C. Slow swipe stopped half-way (300 of 600px) | carried on to the next section | rests at 302px |
| D. Reverse swipe, 200px up | pulled back to the start | rests 203px up |
| E. Eight swipes of 150px | 0px moved in total | 154px each, 1,233px in total |
| F. Stop 60px before / 70px past a section top | forced onto the section top | rests where it stopped (542 / 672) |

After the change all 44 checks pass on four touch devices: iPhone 13 (390×664), Pixel 7 (412×839), a 320×568 phone and
an 810×1080 tablet. Arrival effects still play on every section scrolled past, and the document is never locked.

**Desktop.** `tests/qa/home-wheel.desktop.js` (1440×900: wheel notches, trackpad flicks, keyboard, scrollbar) gives
identical resting positions before and after. The panel test (96 checks) and the ring-entrance trace still pass.

**Limits.**
- Tested in Chromium with touch emulation, not on a physical phone and not in Safari. The removed rules were plain CSS
  that every browser honours, so the change itself is engine-independent; iOS rubber-banding and toolbar behaviour
  were not observed.
- With a mouse or trackpad the homepage still limits one wheel gesture to the next section (small wheel moves rest
  freely; a hard flick stops at the next section top). That is the existing desktop behaviour and was left alone
  because the report concerns phones. Removing it is a one-line change if wanted.
- The fix is on the unpublished theme copy. The published theme still snaps until that copy is published.

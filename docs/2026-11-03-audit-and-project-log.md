# ILLEGANT — audit, fixes and launch log (3 November 2026)

## 1. Access and baseline

| Item | Finding |
|---|---|
| Store | ILLEGANT · `wzghvi-w0.myshopify.com` · Basic plan · EUR · Greece · timezone EET. Access confirmed via the Shopify Admin API. |
| Live theme | **ILLEGANT — Monochrome** (`190487953788`, role MAIN, last edited 28 Oct). **Not modified.** |
| Backups already present | `ILLEGANT — Monochrome Backup 27 Oct` · `ILLEGANT — Monochrome Backup 28 Oct (before eff…)` · `New Theme` (unused, 24 Oct). None deleted. |
| Working copy created | **ILLEGANT — Monochrome WORK 3 Nov** (`190832673148`, unpublished). All changes below live only here. |
| Source baseline | Exact text copy of the live theme committed to git (first commit). MD5 checksums match Shopify's. |
| Password protection | **On.** Left on. |

### What I could not access or test
- **Storefront in a browser:** this environment's network policy blocks `*.myshopify.com`, so I could not load the real store. Behaviour was tested in a local Chromium harness that uses the theme's real compiled CSS and the real `s-dialog.js`, at desktop and iPhone 13 emulation. **No physical-device testing was done.**
- **Payments:** the connection lacks the `read_shopify_payments` permission. No digital wallets are reported, which suggests no payment provider is active yet.
- **Theme preview/screenshots of the working theme:** they need a logged-in admin session.
- **Core Web Vitals:** no real measurements are possible without storefront access. No scores are claimed.

### Theme architecture (important for anyone editing it)
- The theme was built with Shopify's AI theme editor ("Canvas/Sidekick"). It has no `sections/` and no JSON templates; templates are `.liquid` and compose blocks.
- `config/styles.css` is a Tailwind v4 source compiled into `assets/styles.min.css`. **Only the Shopify editor runs that compiler.** API or "Edit code" changes to `config/styles.css` do nothing until the next editor rebuild. An exact local rebuild was not reproducible (Shopify scans sources differently), so the compiled CSS was **not** touched. New CSS is plain CSS in `snippets/theme-styles.liquid`, the same place the 28 Oct fixes went.
- `AGENTS.md` and `DESIGN.md` at the theme root hold the design history and conventions. Read them first.

## 2. Issue register

Severity: Critical / High / Medium / Low. Status: Open / Fixed (on WORK theme) / Tested (automated test passed).

### Reported symptoms

| # | Issue | Evidence | Class | Sev | Fix | Status / verification |
|---|---|---|---|---|---|---|
| 1 | **Page jumps up after closing Search/Bag.** On close, `s-dialog.js` restored the scroll position captured *at close time*. Anything that moved the locked page while the panel was open became permanent. iOS Safari does this when the keyboard opens for the autofocused search field. | `assets/s-dialog.js` close wrapper (`position = {scrollX, scrollY}` at close). Reproduced: page moved 120px while open and stayed 120px off after close (desktop + iPhone emulation). | CONFIRMED BUG | High | Record the offset before opening; always restore that. | **Tested.** Lands exactly on the original position. Real iPhone keyboard still to be confirmed (checklist §5). |
| 2 | **Same jump on native close paths** (Chrome's repeated-Escape rule, `method="dialog"` forms): no position restored at all. | Same file, `close` handler only used `#closePosition`. Reproduced (120px off). | CONFIRMED BUG | Medium | Close handler falls back to the open offset; a non-cancelable `cancel` lets the native close run. | **Tested** |
| 3 | **Panels close abruptly.** Measured close profile: ~150ms of almost no movement after tapping Close (feels unresponsive), then ~70% of the travel in ~200ms while fading. The panel was invisible for the last ~150ms but still blocked taps. | Frame-by-frame sampling in harness (before: 1% moved at 55ms, done at 607ms). | CONFIRMED UX PROBLEM | Medium | Exit starts on the first frame, glides on CSS `ease` over 480ms, fades only in the last third; backdrop in step. Opening (750ms) unchanged. | **Tested** (after: 14% moved at 55ms, done at ~470ms). Feel needs owner judgement on a phone. |
| 4 | **Homepage photos slide upward.** Two intentional effects cause this. (a) The Edit photo drifts up 6% over ~2s as it is uncovered. (b) Hero/Rooms/Manifesto use scroll-linked parallax (`.recede`); on phones, the browser bars resizing the viewport can make those photos jump. | `config/styles.css` `.wipe-up img { … translateY(6%) }`, `.recede` view-timeline rules. | (a) CONFIRMED UX PROBLEM · (b) POTENTIAL RISK (real device) | Medium | (a) Photo settles in place (scale only). (b) No scroll-linked parallax on touch screens; desktop keeps it. **Reversible**: delete the marked block in `snippets/theme-styles.liquid`. | **Tested** (computed styles per device). Owner to confirm on a phone. |
| 5 | Motion too slow/abrupt in general | Many timings already tuned 26–28 Oct (DESIGN.md). | — | — | Not changed blindly; only the exit curve above. | — |

### Other findings

| # | Issue | Evidence | Class | Sev | Fix | Status |
|---|---|---|---|---|---|---|
| 6 | **iOS zooms the page when a form field is tapped.** Base field size is 14px (`font-size: var(--text-sm)`). Affects Private access, contact, password page, bag quantities, discount code. | `config/styles.css` FORM FIELD BASE STYLES. | CONFIRMED BUG | High (mobile, conversion) | Fields ≥16px on phones (search lines are already ≥18px). Desktop unchanged. | **Tested** (16px on iPhone emulation, 14/12px on desktop) |
| 7 | **Collection pages are English-only when empty.** The empty state text is hard-coded English. Every collection is empty today, so Greek visitors see English everywhere. | `templates/collection.liquid` lines 245–248 (baseline). | CONFIRMED BUG | High | Moved to translations (en + el); FAQ link only renders if the FAQ page exists. | Fixed |
| 8 | **First product images loaded at low priority.** `fetchpriority="low"` on the first 3 cards, i.e. the on-screen ones. | `templates/collection.liquid` lines 105–109 (baseline). | CONFIRMED PERFORMANCE PROBLEM | Medium | First card `high`, rest `auto`. | Fixed (not measurable without storefront) |
| 9 | Greek strings still in English: filter "Unavailable", screen-reader live search announcements, region/language form labels. | `locales/el.json`. Theme Check cannot detect this (keys exist). | CONFIRMED BUG (a11y/localisation) | Medium | Translated. | Fixed |
| 10 | **No way to register interest** on unavailable products. Sold-out showed a dead button. | `templates/product.liquid` | IMPROVEMENT (validation) | High for validation | Native "Notify me" form (no app) for unavailable variants. Creates an email subscriber tagged `notify-me` + `interest-<product-handle>`. | Fixed (needs a real submission test) |
| 11 | "Sold out" would be **false scarcity** for pieces never released. | same | IMPROVEMENT | Medium | Products tagged `coming-soon` show "Coming soon / Σύντομα διαθέσιμο" on the page and cards. | Fixed |
| 12 | Theme Check (Shopify's linter) | `@shopify/theme-check-node` | — | — | 0 code errors before and after. Only missing translations in ~50 unused locale files. | Tested |
| 13 | ~50 unused locale files (ar, ja, th, …) are out of date. | Theme Check: 85 missing keys each. | IMPROVEMENT | Low | Ignore unless those languages are enabled. | Open |
| 14 | "More from" related products use a collection slice, not Shopify recommendations. | `templates/product.liquid` line ~360 | IMPROVEMENT | Low | Switch to `recommendations` once there are real products. | Open |
| 15 | No meta description for the store: the theme falls back to a hard-coded **English** brand sentence for every page's description and social card. | `snippets/meta-tags.liquid` line 23; `shop.description` is empty. | CONFIRMED SEO PROBLEM | Medium | Owner writes a store description (Settings → Preferences), ideally in Greek and English. | Open — owner |
| 16 | ~40 old images in Files (AI concept `illegant-ed-*`, `illegant-film-*`, `illegant-gallery-*`) are no longer used by the theme. | Files query vs theme references. | IMPROVEMENT | Low | Delete after owner confirmation. | Open — needs approval |
| 17 | Hero ring loads 6 large photos eagerly (by design, to avoid a jumpy entrance). | `templates/index.liquid` | POTENTIAL PERFORMANCE RISK | Low | Measure LCP on a real phone before changing. | Open |
| 18 | Copy says "Made for Greece and Europe". Fine as positioning, but the store only sells to Greece. | `locales/*` footer.signoff, home.manifesto | Content | Low | Owner decision. | Open |

**Checked and fine:** all 20 referenced photographs exist in Files. Image `srcset`/`sizes` and the homepage LCP preload match. Canonical, Open Graph, product/collection structured data, hreflang and `noindex` on search/cart/404 are in place. The product page shows no invented materials or claims, and Delivery & returns only appears once real policies exist. Reduced-motion is respected throughout. Dialogs restore focus to their trigger.

## 3. Store configuration review (read-only; nothing changed)

| Area | Current state | Action needed | Who |
|---|---|---|---|
| **Products** | 0 active. 4 archived (Essential Tee, Tailored Trouser, Everyday Knit, Wool-Look Trouser; 2 images each), 8 drafts "Sample · …" without images. | Decide the first real pieces; add verified photos, materials, sizes. For validation without selling: publish them tagged `coming-soon` with inventory tracked at 0 and "continue selling" off. Visitors then see "Coming soon" + Notify me. | Owner |
| **Collections** | Men, Women, New Arrivals, Sale (0), Home page, plus 6 sub-collections (Men's/Women's T-shirts, Knitwear, Trousers, Tops). All empty for visitors. | Keep the main menu to collections that will have products at launch; hide "Sale" (no fake discounts). | Owner |
| **Languages** | **Only English is published.** The theme has a full Greek translation that customers cannot reach. | Settings → Languages → add **Greek**, then publish it (and decide the default). | **Owner approval** |
| **Markets** | One active market: Greece (EUR). | OK. | — |
| **Shipping** | Greece: Standard €5; Standard free from €50; Express €13. No delivery-time descriptions. An "International" zone (28 countries, €17) is unreachable because the market is Greece only. | Add delivery estimates once the courier is chosen. Remove the International zone. Check free-over-€50 against margins (prices €30–120). | **Owner approval** (shipping prices) |
| **Location** | "Shop location", Greece, **no address**. | Add the dispatch address. | Owner |
| **Taxes** | Prices include tax; shipping not taxed. | **Confirm with a Greek accountant**: VAT registration, rate (24% standard), whether shipping must carry VAT, OSS for EU sales later. | Accountant |
| **Payments** | Not readable (missing permission). | Settings → Payments: check Shopify Payments eligibility for Greece, or another provider. Keep checkout closed until launch. | **Owner approval** |
| **Policies** | Only the Privacy policy (Shopify template, contact = personal Gmail). **No** Refund/returns, Shipping, Terms, Contact information. Draft pages exist but are unpublished: "Υπαναχώρηση" (14-day withdrawal), "Shipping & Returns", "Size Guide". | Owner provides business details (below); a lawyer/accountant reviews; then publish policies. **Nothing was published or invented.** | Owner + legal |
| **Customer privacy / cookies** | Not readable via this connection. | Settings → Customer privacy: enable the cookie banner for the EU. | Owner |
| **Domain** | Only `wzghvi-w0.myshopify.com`. | Buy/connect a domain before launch (costs money; needs approval). | **Owner approval** |
| **Store description / contact email** | Description empty; contact = personal Gmail. | Write the description; consider a brand mailbox. | Owner |

### Information only the owner can provide (never invented)
Legal name · form of business · VAT number (ΑΦΜ) · GEMI number · registered address · return address · public phone · customer-service email · courier and delivery times · return window and who pays return shipping · VAT status.

## 4. Changes made (WORK theme only)

| File | Change |
|---|---|
| `assets/s-dialog.js` | Scroll restore uses the pre-open offset (incl. native close paths); new exit motion. |
| `snippets/theme-styles.liquid` | Backdrop exit timing; 16px phone fields; no touch parallax; Edit photo without upward drift. |
| `templates/product.liquid` | Notify-me form; "Coming soon" label via `coming-soon` tag. |
| `templates/collection.liquid` | Translated empty state; image priority fix; "Coming soon" badge. |
| `locales/en.default.json`, `locales/el.json` | New strings; leftover English in Greek translated. |

All six files verified on Shopify by MD5 checksum against the git copy.

**Not changed:** live theme, products, collections, prices, shipping, taxes, payments, policies, apps, password.

## 5. Manual phone test (please run on a real iPhone and Android)

Preview: Online Store → Themes → *ILLEGANT — Monochrome WORK 3 Nov* → ⋯ → Preview → share the preview link to the phone.

1. Homepage: scroll top → footer → top. Do any photos slide or jump on their own? (Compare with the live theme.)
2. Scroll halfway, open **Search**, type a word (keyboard opens), close. The page must stay where it was. Repeat 5×.
3. Same with **Bag**: open → close with "Close", with a tap on the dark area, and (Android) the back gesture. No jump.
4. Does the closing motion feel natural, neither abrupt nor sluggish?
5. Tap the Private access email field: the page must **not** zoom in.
6. Open a product (once one is active and unavailable): the Notify me form appears; submit a test email; check Customers for tags `notify-me`, `interest-…`.
7. Collection page in Greek (after adding Greek): the empty message is in Greek.
8. Widths 320/360/375/390/430: no sideways scroll; header words don't overlap.
9. Settings → Accessibility → Reduce Motion ON: pages show without animations.

## 6. Actions requiring your approval
1. Publish the WORK theme (after the phone test). Rollback = republish the current theme.
2. Add and publish Greek as a store language.
3. Remove the International shipping zone; add delivery times.
4. Publish legal policies (after you provide the details and a professional reviews them).
5. Delete unused AI images from Files.
6. Any payment-provider setup, domain purchase, or removing the password.

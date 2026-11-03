# ILLEGANT — flagship design pass (3 November 2026)

All changes are on the unpublished theme **ILLEGANT — Monochrome WORK 3 Nov** (`190832673148`).
The live theme was not touched (last modified 28 Oct). Nothing has been published.

## 1. What could and could not be researched (honest status)

| Source | Result |
|---|---|
| prada.com, gucci.com, ysl.com, bottegaveneta.com, loewe.com, celine.com, chanel.com, hermes.com, therow.com, khaite.com | **Not reachable from this session.** Most hosts do not resolve (network allow-list); the fetch tool refuses gucci, ysl and bottegaveneta. No live page, CSS or timing was read. |
| baymard.com/research/luxury-goods, nngroup.com luxury principles | **Not reachable** (DNS). |
| Earlier live research recorded in the theme's `DESIGN.md` (26–27 Oct, prada.com HTML/CSS fetched as iPhone) | Used: GT America at 400/500, small headlines (~20px), 12–14px text, words instead of icons in the header, PDP order name → price → add to bag → size → details, 4:5 cards with swipe dots, side drawers. |
| General professional knowledge of these houses | Used as **principles only**, not as verified observations: a single full-bleed campaign image with very little text and an underlined text CTA; one consistent wordmark; square, text-led selectors; product visible early on listing pages; restrained, purposeful motion. |

To run a real study, add the brand domains to this environment's network allow-list, or send screenshots or saved pages.

## 2. How the theme was tested without the storefront

The storefront and Shopify's image CDN are blocked here. I built `tools/preview/`, a local renderer that runs the **real** templates, blocks, snippets, layout, compiled CSS and JavaScript with LiquidJS, Shopify-style tags (`block`, `partial`, `form`, `paginate`, `render`) and mock data. Photos are generated stand-ins labelled with the real filename. Screenshots were taken with Chromium at iPhone 13 and 1440×900.

Limits: Shopify platform scripts are stubbed, so filters, predictive results, add-to-bag and checkout are **not** exercised. Real photography, real font rendering on iOS and real touch gestures are **not** verified.

## 3. Design direction adopted

1. **One strong image at the opening, not a gadget.** Full-bleed campaign photography, a short line, an underlined text CTA, the wordmark set into the image.
2. **One identity.** The header logo now matches the bold, tight wordmark; the UI says "Bag / Τσάντα" everywhere (it mixed Bag, Cart and Καλάθι).
3. **Quiet controls.** Square size boxes, struck-through unavailable sizes, filter and sort as words with a hairline. No rounded pills.
4. **Products early.** Collection pages show product higher on phones; no duplicate count.
5. **Image ↔ word rhythm on the homepage.** Opening photograph → manifesto → rooms → the edit → private access.
6. **Motion on arrival or response only.** CSS-only; the LCP photograph is never hidden; all motion is off with Reduce Motion.

## 4. Changes (WORK theme)

| File | Change |
|---|---|
| `assets/illegant-flagship.css` (new) | Campaign opening layout + motion; logo weight/tracking; size selector; collection header/toolbar density; phones always show the grid. Plain CSS (see §6). |
| `snippets/theme-styles.liquid` | Loads the new stylesheet (cached file, after the compiled bundle). |
| `templates/index.liquid` | New **Campaign** opening (phone: one photograph; tablet/desktop: triptych). The 3D ring is kept intact behind a setting. Manifesto moved after the opening. |
| `config/settings_schema.json`, `config/settings_data.json`, `locales/en.default.schema.json` | New theme setting **Homepage → Opening: Campaign photographs / 3D ring of photographs** (WORK theme set to Campaign). |
| `snippets/lcp-preload.liquid` | Preload `sizes` follow the chosen opening (no double download). |
| `templates/product.liquid` | **Size guide** row, shown only once a page with handle `size-guide` is published (your draft exists, unpublished). |
| `locales/en.default.json`, `locales/el.json` | Bag/Τσάντα wording throughout (button, menu, cart page, screen-reader messages); hero CTA "Discover the collection / Ανακαλύψτε τη συλλογή". |

Before/after (local preview, stand-in photographs): `docs/screens/before-after-*.jpg`.

## 5. Bugs and problems found in this pass

| Problem | Evidence | Status |
|---|---|---|
| Hero: ring cards hid the wordmark ("ILLE…NT"); ~⅓ of the phone's first screen empty | Before screenshots | Addressed by the Campaign opening (ring still selectable) |
| Header logo light weight vs heavy wordmark: two identities | Screenshots | Fixed |
| "Add to cart" / menu "Cart (0)" vs header "Bag" (en and el) | `locales`, `site-menu.liquid` uses `cart.title` | Fixed |
| Collection phone: first product below half the screen; count shown twice | Before screenshot (first product at y≈374px of 664) | Fixed (y≈262px) |
| Collection phone: Grid/Index switch collided with room tabs | After-1 screenshot | Fixed (switch hidden on phones) |
| Size picker: generic rounded pills; unavailable shown with a diagonal line | Screenshot | Fixed |
| Selected-but-unavailable size: dark text on black, unreadable | Screenshot | Fixed (outlined) |
| Homepage phone: three near-identical photo screens in a row | Full-page screenshot | Fixed (manifesto moved) |

## 6. Technical notes and risks

- **CSS compiler.** `assets/styles.min.css` is generated by Shopify's AI editor from `config/styles.css`; API edits do not run it, and an exact local rebuild was not reproducible. New CSS therefore lives in `assets/illegant-flagship.css` (unlayered, after the bundle). If the theme is later edited in the Shopify AI editor, this file is unaffected. Moving it into `config/styles.css` is optional future tidy-up.
- **Theme editor.** The new opening uses the existing `container`, `image`, `text`, `link` blocks, so copy stays editable; the photographs are the same Files images as before (`illegant-real-shadow`, `-black-dress`, `-man-dark`).
- **Performance.** Opening: 1 eager image on phones (2 more lazy on md+, not downloaded on phones), versus 6 eager images for the ring. Preload matches the rendered `sizes`. No new JavaScript. No external dependencies (GSAP was considered and not needed: everything is CSS).
- **Accessibility.** No change to focus handling; the wordmark and photos are `aria-hidden`; headline remains `h2` under the sr-only `h1`; all new motion is disabled under Reduce Motion; text on the photos sits over a dark gradient (verify contrast with real photographs).
- **Regression.** Theme Check: 0 code errors. Dialog scroll/focus tests: all pass (1500/1500/1500/1500; reopen, double close, Escape). Preview: no JavaScript errors and no horizontal overflow on 10 page types at phone and desktop width.

## 7. Not done / recommended next

1. **Real-device check** of the new opening with the real photographs (crop of `illegant-real-shadow.jpg` at `object-position: 50% 22%`; legibility of white text).
2. Allow selecting a **sold-out size** so "Notify me" can be requested per size (commerce-critical picker; needs a live store test).
3. Product cards: use Shopify **recommendations** for "More from".
4. Bag drawer empty state: smaller photograph, clearer links.
5. Move `illegant-flagship.css` and the QA block into `config/styles.css` next time the theme is rebuilt in the Shopify editor.
6. Update `DESIGN.md` in the theme with this pass once you approve the direction.

## 8. How to review

Online Store → Themes → *ILLEGANT — Monochrome WORK 3 Nov* → ⋯ → Preview.
To compare openings: Customize → Theme settings → Homepage → Opening.

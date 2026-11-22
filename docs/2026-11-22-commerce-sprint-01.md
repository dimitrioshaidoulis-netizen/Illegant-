# Commerce Sprint 01 (22 November 2026)

Branch `claude/commerce-sprint-01` (from `claude/global-business-discovery-43fi2p` @ `b4259f7`).
Shopify development theme: **ILLEGANT — Development (unpublished)** (`191499600252`; created as "Commerce Sprint 01", renamed 22 Nov), duplicated from the live theme.
The live theme (**ILLEGANT — Launch pass 16 Nov**, `191313772924`) was verified identical to git before work started
(every file's MD5; `config/settings_data.json` differs only by a trailing newline) and was **not** edited.

## Fixed (theme)
| Defect (evidence) | Fix | Files |
|---|---|---|
| Sold-out sizes were `disabled` with pointer events off: a shopper could not select their size of a sold-out or coming-soon piece, so Notify me only ever registered the pre-selected variant | Sold-out values stay selectable (marked `data-unavailable`, still struck through); only combinations with no variant are disabled. Selecting one loads that variant's sold-out button and Notify me form (existing partial flow) | `blocks/variant-picker.liquid`, `assets/illegant-flagship.css` §3 |
| Notify me recorded the piece only | Tags add `interest-<handle>-<variant>` for pieces with variants | `templates/product.liquid` |
| Homepage "The edit" showed four invented "Product title" cards to visitors whenever New Arrivals had no published products (the case today) | Placeholders only in the theme editor; visitors see the existing empty-collection wording | `templates/index.liquid` |
| Bag drawer quantity −/+ were 32px | 44px hit area on touch screens, same visible row | `assets/illegant-flagship.css` §13 |
| Header bag button: visible "BAG 00", accessible name "Bag (0 items)" (voice control could not reach it) | Name starts with the visible words: "Bag 00, 0 items in your bag" | `layout/theme.liquid` |

## Verified without change
- Add to bag uses Shopify Standard Actions (`Shopify.actions.updateCart` with the selected `input[name=id]`), shows a busy
  state, ignores a double tap, opens the bag after success, and shows the platform's message inline when refused.
- Quick add on collection cards (mouse only) adds one unit of that size; on refusal it opens the product page with that size.
- Checkout buttons in the drawer and bag page are native `{% form 'cart' %}` submits named `checkout` (Shopify Checkout).
- Prices use Shopify money filters; a sale shows only when a compare-at price exists.
- All 11 collections are rule-based: supplier products with the same tags as the current samples (`men`, `women`,
  `new-arrival`, `knitwear`, `trousers`, `t-shirt`, `tops`) join Men / Women / sub-collections without theme changes
  (inferred from the samples' memberships; the API does not expose the rules).

## Tests (local renderer + Chromium; Shopify platform simulated)
| Suite | Result |
|---|---|
| `tests/qa/commerce.test.js` (new) | 42/42 (fails on the pre-fix theme) |
| `tests/qa/dialogs.test.js` | 96/96 |
| `tests/qa/home-scroll.test.js` | 44/44 |
| `tests/qa/home-layout.test.js` | 230/230 |
| `tests/qa/password.test.js` | 32/32 |
| Theme Check | 0 code errors (missing keys only in ~50 unused locale files, unchanged) |
| axe-core | 0 violations on product, sold-out, sale, bag, empty home after the header fix; collection cards keep two older findings (below) |

Simulated, not verified on Shopify: Standard Actions (recording mock), partial rendering (stub), customer form submission.

## Still open
- **Launch blockers (unchanged, not theme work):** no sellable products or supplier, no payment provider, no returns,
  shipping or terms policy, no registered business. See `docs/2026-11-21-revenue-readiness.md`.
- Collection cards: link names are the title only (visible text also has the price), and the phone swipe strip is not
  keyboard-scrollable (axe). Low impact; not changed.
- "More from" uses a collection slice instead of Shopify recommendations (AGENTS.md contract). Fine for 6–12 pieces; switch later.
- The bag drawer's pinned summary takes about half of a phone screen; consider dropping "View shopping bag" on phones.

## Owner checks (real store, not possible from here)
1. Preview the development theme (Online Store → Themes → *ILLEGANT — Development* → Preview) on a phone.
2. Make one sample product temporarily **Active with 0 stock** (or use a real product later), open it, pick a sold-out
   size, submit Notify me with your own email. In Customers, check tags `notify-me`, `interest-<handle>`,
   `interest-<handle>-<size>`. Return the product to Draft.
3. With a sellable product and payments in test mode: Add to bag → bag opens → change quantity → Checkout reaches
   Shopify Checkout. Not possible today (no payment provider, no product).
4. When satisfied, publish the dev theme (your approval).

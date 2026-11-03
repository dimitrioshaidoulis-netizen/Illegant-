# ILLEGANT — Design system: "Fashion gallery"

## Direction
A quiet museum for clothes. Stone-white walls, graphite type, works hung in white mats with soft gallery shadows, and small wall labels instead of shop UI. Restraint first; motion only where it feels like walking through a room.

## Palette (theme settings)
- surface #FAFAF8 (near-white gallery wall) · surface_2 #F1F0EC (pale stone) · on_surface #1F1E1C (graphite)
- accent #8A3324 (oxblood, used only for label meta lines) · interactive #1F1E1C (graphite buttons, light text via bridge)
- Private tokens in config/styles.css tuned for light: on-surface-secondary #5c5a55, border #e2dfd8, button-secondary #efede8, sale #a3392b, compare #6f6c66.

## Type
Bodoni Moda headings (display sizes via clamp, tight tracking), Jost body. Overlines tracked 0.15–0.2em for labels and CTAs. Corners sharp everywhere.

## Signature components
- Mat frame: `bg-surface p-4 md:p-8 border border-border` + soft long shadow `shadow-[0_40px_80px_-50px_rgb(31_30_28/0.5)]`.
- Wall label: `border-s border-on-surface ps-3/5` column with accent overline, Bodoni title, secondary body, underlined overline link.
- Hero 3D wall (`<s-gallery-tilt>`, assets/s-gallery-tilt.js): perspective stage rotated by --tilt-x/--tilt-y; frames at different translateZ for parallax; radial wall light follows --px/--py. Fine pointer + motion allowed only; flat otherwise.
- Torch reveal (`<s-spotlight>`, assets/s-spotlight.js): grayscale print under a colour print masked to a circle at --mx/--my. Touch/reduced motion show colour in full.
- Salon hang for products: 4-column grid with stepped offsets (`lg:mt-8/20/28`), mats lift 4px on hover.

## Homepage order
3D wall hero → Women room (work left, label right) → Men room (mirrored) → "Look closer" torch → "On the wall" new arrivals → finale over the white-room image.

## Images
Files: illegant-gallery-{women,man,blouse,salon,visitor}.png, illegant-film-monument.png (hero LCP, preloaded), knit product still. Replace with real campaign photography when available.

## Inner rooms
- Collection = "Exhibition room": giant title + piece count over a graphite rule; `<s-view-switch>` (assets/s-view-switch.js) toggles Wall (3-col salon hang, numbered "No. 01" labels) and Index (printed catalogue rows; `<s-index-preview>` floats a framed preview at the cursor). Choice persists in localStorage.
- Product = "The exhibit": back-to-room overline, matted plates stacked with "Plate 01" captions (mobile keeps swipe), sticky catalogue card with provenance list (maker, category, SKU only when present). Grid 7fr/5fr.
- Cart = "Ledger + ticket": numbered entries; summary is an admission ticket with a perforated tear line. Empty state is a vacant dashed frame with links to the rooms.
- Search = "The archive": the input is display-size type on a single rule; without results it lists the rooms as a printed index.

## Mobile (below 768px)
- Hero: frames sit in an in-flow stage (h ≈ 124vw, no perspective/tilt) as a five-frame collage with z-order set per frame; headline, copy and CTA flow below instead of overlaying.
- "On the wall": horizontal snap carousel (72% cards) instead of a stacked column.
- Collection wall: 2 columns, plaque stacks (number above title).
- Product: 4:5 swipe gallery; pinned buy bar (title, price, add to cart) inside the product form; body reserves space for it.
- Mobile nav and cart drawer use Bodoni headings and tracked overlines; footer menu is a 2-column grid.

## Editorial "desire" direction (2026-10-25) — supersedes the gallery frames
- Frames, mats, plaques and the tilt/spotlight hero are retired (s-gallery-tilt.js, s-spotlight.js deleted). Image first: full-bleed, frameless photography; product imagery sits on surface-secondary with no borders or shadows.
- Home: 100svh cover (illegant-ed-corridor.png, LCP) with headline + underlined CTA and the wordmark at 19.5vw cropped by the bottom edge; poster-scale manifesto; edge-to-edge Women/Men diptych (whole tile links, slow 1.04 hover zoom); frameless "The edit" swipe row; full-bleed "Stillness" photograph opened by <s-reveal> (clip-path curtain + scale settle, reduced-motion = open); asymmetric story spread (7/4 columns, detail image dropped low).
- <s-reveal> (assets/s-reveal.js): sets data-armed on connect and data-revealed at 15% visibility; styling via data-[armed]:not-data-[revealed]: and group-data-[revealed]/reveal:.
- Collection: 72svh campaign cover (collection.image, else room-matched editorial photo; mirrored in lcp-preload) with the title huge in white; Grid view = 3 columns (2 on mobile), 3/4 frameless cards, title overline + price; one campaign photograph spans 2 columns after the third piece on page 1 (grid-flow-row-dense). Index view keeps the catalogue list with cursor preview.
- Product: frameless gallery on surface-secondary, details column without a card; mobile buy bar kept.
- Editorial images: illegant-ed-{corridor,arch,walk,duo,window}.png in Files.

## Bold identity + 3D + real photography (2026-10-25, current)
- Heading font Inter (inter_n4, bold face loaded in snippets/theme-styles.liquid); all display headings uppercase, font-bold, tight negative tracking. Body Jost.
- Photography: real Pexels photos (free commercial licence) in Files as illegant-real-{white-suit,shadow,man-suit,man-sea,white-duo,knit-duo,black-dress,man-chair}.jpg. AI illegant-ed-* images no longer used.
- Home: 3D ring of 6 photos threaded through the giant wordmark (<s-ring>, slow 0.022deg/frame, slows to 20% on mouse hover, drag to spin); sticky full-screen chapters (Desire/Women/Men/Presence) with .scroll-tilt-in + grayscale→colour reveal; The edit; "Not for everyone" private-access customer form.
- Mobile nav: full-width drawer with huge bold uppercase links.
- Collection: real-photo campaign cover per room + real interlude (absolute-fill, row-height). Product: bold uppercase title + closing full-bleed brand band (s-reveal). Cart empty state uses a real photo. Search labels "Illegant"/"Collections".

## Site menu, companion cursor, page transitions (2026-10-26)
- Header: "MENU" button (icon + label on md+) opens the full-screen <dialog id="site-menu"> (snippets/site-menu.liquid) on every breakpoint; the inline desktop nav is hidden (main-menu block still renders the legacy mobile drawer, now unused).
- Site menu motion (config/styles.css "Site menu"): curtain clip-path open with @starting-style + allow-discrete close; words rise from masks with an 80ms stagger (--i); sub-links fade after; <s-menu-stage> dims non-hovered words and uncovers the matching photograph (clip-path + scale). Bottom row: search, account, cart count, private access, sign-off.
- <s-cursor> (assets/s-cursor.js, layout): fine-pointer companion dot, mix-blend-difference; grows on links, becomes a labelled disc over [data-cursor] (product cards/chapter links "View/Δες", ring "Drag/Σύρε"). Native cursor kept.
- Cross-document view transitions (@view-transition navigation:auto): old page fades, new page rises 24px. Reduced motion disables all of the above.
- Scan fixes: el footer keys, gender-matched covers for subcollections (handle contains women/men), list-collections mood fallbacks + bold titles, 404 real photo, contact title size.

## Commerce signatures (2026-10-26)
- Size strip (<s-quick-add>, assets/s-quick-add.js): collection cards of single-option products reveal real sizes on hover/focus (fine pointers); one press adds via Shopify.actions.updateCart then opens cart; fallback to product page ?variant=. Sold-out sizes struck through, aria-disabled.
- Continuum: each collection ends with a full-bleed link to the next room (women → men → new-arrivals → women).
- PDP details as native <details>: description open; "Delivery & returns" only renders when shop policies exist.
- el.json: product.view_image / image_zoom translated.

## Viewport-safe heights (2026-10-26)
- Never use raw svh/vh for section heights. Use calc(var(--vh) * N): --vh = min(1svh, 2.3vw) / md 1.4vw / lg 0.72vw (config/styles.css, next to --header-h). Keeps proportions in fullscreen, ultra-wide and editor viewports.
- NOTE: a new :root rule appended at the very end of config/styles.css was dropped from the build once; keep root vars in the existing :root line.
- Homepage chapters: no scroll-tilt / greyscale reveal (merchant: photos looked different sizes). Footer wordmark capped at 16.5rem so it fits the 80rem page width.

## Homepage rooms + curtain (2026-10-26)
- Order: opening ring → Rooms (Women | Men side by side on md+, stacked on mobile) → Desire → Presence → The Edit → Private access.
- Rooms: hovered room flex-grows to 1.4, other dims (brightness .72); stretched link per room + separate sub-links from main-menu children; real products_count via home.pieces (one/other). Cursor label = collection title.
- Curtain: .curtain clip-path inset(10% 7%) → 0 and img scale 1.14 → 1, .rise titles translate/opacity, all on view() timelines; no height changes. s-reveal no longer used on the homepage.
- .scroll-progress hairline under the sticky header (scroll(root) timeline).

## Homepage lower half (2026-10-26)
- Manifesto (home.manifesto): words split into .fill-word spans that ink in on view() timelines.
- The Edit: magazine spread, sticky 4/5 mood photo + title on start (md col 5), staggered 2-col product grid (every 2nd item md:translate-y-20). Products without images render typographic cards (wordmark + title), hover inverts.
- Private access: 2-col invitation, curtain photo (man-chair) + form.
- Footer: wordmark uses .curtain; legal row has <s-clock> (Athens HH:MM, assets/s-clock.js) and Back to top (#main-content).

## Inner pages pass (2026-10-26, Prada-inspired restraint, not copied)
- snippets/type-card.liquid: typographic stand-in (wordmark + big title) for products without photos; used in collection grid, product gallery (no media), more-from, search results, homepage edit. Cart lines without image show a small wordmark tile.
- Collection: cover uses .curtain + .rise (no greyscale), room tabs from main-menu parent children under the cover (aria-current underline).
- Product: gallery figures after the first use .curtain; closing band is .curtain (men detection = handle contains men, not women).
- List-collections: Women|Men .rooms, then a printed index of the other collections (frontpage skipped) with frameless s-index-preview photo; LCP preload = women image.
- Page: band is .curtain. Search result cards frameless (frames were rejected). s-reveal.js is no longer referenced.

## Locked homepage + smaller type (2026-10-26)
- <s-screen-lock> wraps the homepage: .screen stops (hero, rooms, 2 chapters, manifesto, edit, access) + footer. One wheel gesture = one stop; input swallowed during the glide and trackpad inertia; tall stops (edit) scroll natively to their edge. Touch: CSS mandatory snap + snap-stop always.
- Arrival effects are now time-based (<s-arrivals> in layout, IntersectionObserver -> [data-arrived]) instead of view() timelines: they finish fully on arrival and work in Safari/Firefox. Before-states gated by html.arrivals-ready (inline head script, 4s fallback).
- Merchant found the huge type too much: all display sizes reduced roughly 40-60% (hero wordmark 16vw, chapters max 5.5rem, page titles max 4.5rem, footer max 10rem).

## Distinct inner pages, round 1 (2026-10-26)
- Merchant: inner pages felt identical ('big photo + big title everywhere'). Each page now gets its own signature:
  - Collection: no campaign cover; opens on the pieces with a small title on a hairline + count; campaign photo only inside the grid. LCP = first product image.
  - Page (About/FAQ): a letter: sticky 4/5 portrait on the start side, small title + narrow reading column beside it.
  - All collections keeps rooms + printed index.

## Homepage: chapters removed, one arrival per screen (2026-10-26)
- Merchant: Desire/Presence chapters were filler, and the same curtain everywhere felt monotonous. Chapters removed.
- Order: hero ring -> Rooms (curtain) -> Manifesto (words ink in) -> Edit (.wipe-up photo + .stagger pieces) -> Private access (.wipe-side photo + .lines) -> footer (.letters wordmark rise). All in config/styles.css, triggered by s-arrivals.

## Header words + richer menu (2026-10-26)
- Research (public): Prada's menu shows category photos and its header uses words (Search, Contact us); The Row is near-all-white with shop-by-look.
- Header right side is words, not icons: SEARCH (predictive search, md+) · ACCOUNT (link to routes.account_url, md+; shopify-account element removed) · BAG 00 (cart drawer; two-digit count rolls up on every cart-count partial swap, accent when >0). .nav-word draws a hairline underline on hover. Mobile: menu icon · logo · BAG 00 (search/account in menu footer).
- Site menu: words 6 cols · captioned photo 3 cols (title + piece count) · New in 3 cols (3 newest from new-arrivals, typographic tile if no photo, View all) · Athens clock in the menu footer. New keys header.search/account/bag, site_menu.new_in/view_all/athens.
- s-arrivals now also watches elements added later (MutationObserver), so editor re-renders never leave photos hidden.

## More real photography, fewer repeats (2026-10-26)
- 12 new Pexels photos (free licence) in Shopify Files as illegant-real-*.jpg: turtleneck 3850989, man-dark 17246721, coat-shadow 18512526, trench-lean 7682076, blazer-bob 9514675, man-mono 17726564 (homepage ring); colonnade 30056441, man-arches 36395697, duo-hills 9903797, window-duo 33522330 (site menu women/men/new/fallback); trench-door 28838792, man-ochre 11431180 (all-collections rooms).
- Homepage now shows every photograph once: ring (6 new) · rooms white-suit/man-suit · edit knit-duo · access man-chair.

## Fix + mobile parity (2026-10-26)
- Bug: .wipe-up / .wipe-side clipped the watched element itself to zero area, so IntersectionObserver never fired and the Edit / Private access photos stayed hidden. The clip now sits on their children.
- Mobile = desktop rhythm: each room is a full screen and its own touch snap stop (.snap-stop); Private access splits into a full-screen photo and a full-screen invitation on mobile; hero ring cards 38vw and wordmark 21vw on mobile so the opening fills the phone.

- Scroll lock glide (2026-10-26): merchant found the jump abrupt. s-screen-lock drives its own glide (rAF). 1400ms ease-in-out felt far too delayed; now 850ms ease-out quart (moves instantly, soft brake) + 80ms settle. Tune GLIDE_MS / SETTLE_MS at the top of assets/s-screen-lock.js.

## QA fixes (2026-10-27)
- `blocks/link`: base omits underline / min-h-touch-target when the caller passes no-underline / min-h-* (Tailwind v4 sorts utilities, callers could not win).
- Cards: hover styles use `group-hover/card:` because the stretched card link covers content; quick-add sits at z-20; `s-cursor` reads `[data-cursor]` from the card when the pointer is on the stretched link.
- Handles match whole words (`handle | split: "-"`), so garment-care is not "men".
- Site menu body scrolls at every size (overscroll-contain); same-page links close it; phone language/currency picker in the menu footer (renders only with 2+ options).
- Variant dropdown: options with no variant are disabled; a change without a variant restores the committed selection.

## Homepage hand-over (2026-10-27)
- Wheel (assets/s-screen-lock.js, rewritten 2026-10-27): continuous smooth follow (EASE 0.085 ≈ 850ms per screen), each gesture capped at the next resting point (next section top, or last screen of a tall section); quiet between sections completes the move (≥40px or 10%%) or eases back; free rest inside tall sections; inertia cannot skip.
- `.recede` on hero, rooms and manifesto: as the screen leaves, its children stay behind at ~half speed (translate 45vh) and fade to 0.2, so the next screen slides over it. Scroll-driven (view timeline, inset by --header-h), so it follows the wheel glide and the finger; reduced motion and browsers without view timelines keep plain scroll. Phones: each room hands over on its own. Rooms fade into black (on-surface background).
- Edit, Private access and footer keep their own arrival effects; do not add .recede there (no repeated effect).

- Arrival timing (2026-10-27): merchant found effects too fast. All arrivals use --ease-arrive (cubic-bezier(.33,0,.15,1), soft start) and ~1.4-1.5x longer durations (curtain 2000ms, wipes 2100-2200ms, rises 1200-1500ms, staggers 170ms/item, manifesto 110ms/word). Hover/UI keep --ease-ui.

## Prada-scale typography (2026-10-27)
Researched prada.com CSS: GT America at 400/500 only, h1 20px, most text 12-14px, letter-spacing ~0.2px, photos carry the emotion. Applied: all display titles 20-28px (clamp(1.25rem,1.6vw,1.75rem)), sections 18-24px, cards 16-20px, font-medium, sentence case (no uppercase), tracking -0.01em, leading 1.15. Overlines 12px, tracking 0.03-0.04em (was 0.2-0.35em). Footer wordmark clamp(2rem,6vw,4.5rem). Hero ring wordmark unchanged (brand mark). Merchant dislikes very large plain type.
- Update: merchant prefers BOLD + small. Titles font-bold at the small Prada sizes; overlines weight 700. One family everywhere: body font set to Inter (was Jost) and real bold loaded for body via font_modify.

## Collection & product, gallery-wall pass (2026-10-27)
- Collection grid runs edge to edge: 2 / 3 / 4 columns (md / xl), 2px gaps, photo on stone ground above a white label (12px bold name, 12px price, no uppercase).
- Phones: each card is a swipeable strip of up to four photographs (`s-card-gallery`, CSS snap, dots). Mouse: hover cross-fade to the second photograph.
- Vertical edge label (10px bold, top end corner) shows only store facts: Sold out, or New (created in the last 30 days). Wrapper uses logical `end-*`; only the inner text is vertical.
- Product page: no top bar or eyebrow. Column = title (bold small), price (14px), options, add to bag, express checkout, then quiet rows that open side drawers: Product details (description + maker / category / ref., inside the product-title partial so the ref. follows the variant) and Delivery & returns (only when policies exist). Breadcrumb Home / Room / Piece closes the column.
- No quantity stepper on the product page; hidden quantity honours the variant minimum. Quantity changes live in the bag.
- Drawer titles use the 12px bold overline.

## Responsive QA pass (2026-10-27)
- Page width raised to 112rem: on 1920px+ the header, text and footer line up with the full-bleed photographs instead of a 1280px column.
- Search: bold-small title; results use the collection's edge-to-edge 2/3/4 grid and card label.
- Home "The edit" cards use the same stacked bold-small label (no truncated names on tablet).
- Rich text headings (pages: contact, about, FAQ) follow the house scale, bold and small.
- body has overflow-x: clip as a guard against sideways scrolling on phones.

## Hero ring, header and panels pass (2026-10-27)
- Ring (s-ring): cards fan out from the centre on arrival (2.6s, spin settles from quick to slow); cards turning away dim slightly (cos-based overlay); a soft floor shadow grounds the ring; with a mouse the ring leans toward the pointer (±4deg). Reduced motion: static, drag only.
- Header: edge to edge (menu at the start edge, Search / Account / Bag at the end edge, logo centred on all sizes). Clear at the top, frosted glass + hairline once scrolled, logo condenses to 0.88; on inner pages it slides away while reading down and returns on scroll up (s-header-scroll). The homepage never hides it (screens are sized under it). Menu mark = two hairlines that trade lengths on hover.
- Search: a white sheet that drops from the top edge (800ms), one large bold typing line that inks in on focus, "Close"/"Clear" as words. Before typing: real sub-collections from the main menu as quick words + three campaign photographs opening New Arrivals / Women / Men. Results: edge-to-edge 2/4 grid with the house card label.
- Account: ACCOUNT opens the house's own panel (photograph on top, settles from zoom; copy rises). Guests: welcome + one sign-in button to customer accounts. Signed in: greeting by first name, Orders and details, Sign out.
- Bag: 520px drawer, slower slide, "BAG (02)" header with a Close word, 96px 3:4 photographs, bold-small names, underline-only quantity, "Remove" as a word, bold total + taxes note, tall checkout button. Empty bag: campaign photograph + one line + Women / Men.

## Ring entrance fix + fashion-house bag (2026-10-27)
- Ring: all six photographs load eagerly; before the script runs CSS already holds the starting ring (spread 0.55), so the first frame never jumps; cards fade and rise in one by one (140ms apart) while the ring opens to full size. Never gathered to the centre (coplanar cards flickered).
- Bag drawer, inspired by the big houses: 600px, "Shopping bag (02)" + Close; 112–128px 3:4 photographs; name bold, price under it, each option on its own labelled line (Size: M), quantity as a quiet "− 1 +", Remove as a word. Summary list: Subtotal, Shipping "Calculated at checkout", Total in bold. Two buttons: Checkout (black) and View shopping bag (outline).

## Precision polish pass (2026-10-27)
- Phones: header shows SEARCH + BAG (Search hides below 360px); the menu's Search / Account / Bag now open the house's own sheet, panel and bag (data-menu-handoff makes the menu step aside, s-menu-stage) instead of plain pages; all four menu-footer words are 44px tap targets.
- Private access sign-up: EU consent line under the form; privacy-policy link appears automatically once a privacy policy exists.

## Touch scrolling (2026-10-27)
- Merchant disliked screen-by-screen snapping on phones ("like flipping photos"). Touch now scrolls freely with natural momentum; no CSS scroll-snap on coarse pointers. Mouse/trackpad keep s-screen-lock.
- Update: merchant wants scroll + lock without the "changing slides" feel → touch uses scroll-snap-type: y proximity with scroll-snap-stop: normal (free momentum, gentle settle near a screen top).

## Touch detent + reference research (2026-10-27)
- Proximity snap pulled the page back on small moves (merchant). Replaced by s-screen-lock touch mode: native free scroll and momentum; a gesture that reaches the end of a section (.screen or .snap-stop, incl. each room on phones) stops exactly there (html.touch-hold for ~180ms after the finger lifts), next gesture free. No CSS snap on touch.
- Research (fetched as iPhone, HTML only): prada.com home, PLP (women ready-to-wear) and PDP were readable; apple.com/gr home readable; aesop.com partial; dior, ysl, louisvuitton, cos = 403; zara, massimodutti = empty JS shells; gucci timed out. Prada patterns already in ILLEGANT: 4:5 cards with swipe + dots, sub-category tabs + count + filters/sort, PDP name > price > add to bag > size > details > breadcrumb, side drawers 500px on desktop. Prada phones open drawers as bottom-up full sheets (possible next step).

## Approved transfer to MAIN, 28 October 2026
Merchant explicitly requested the draft motion fixes on MAIN. Transferred arrivals fallback guard, opacity-only page transition, restored original slower motion timings, reduced-motion overlay override and boundary scroll controller (short desktop gestures rest in place). Ring entrance 2200ms with 0.04 boost, preserving MAIN's newer frame-rate-independent animation code. Local source backup saved before edits. Theme check passed; 390px screenshot inspected. Real-device gestures unverified. Canvas MAIN edits require merchant Update to reach published storefront.

## Panel motion correction, 28 October 2026
Merchant still found opens/closes abrupt. Shared overlay transitions now 1100ms opening / 750ms closing, including display/overlay discrete transitions and backdrop. Introduced --ease-panel (0.4,0,0.2,1): smooth acceleration instead of a front-loaded deceleration that completes most movement early. Search/account/bag ID durations match these values. Menu uses matching timing, photo wipe 1200ms and image settle 1800ms. Reduced motion remains zero. Timing-only changes; no claim of device interaction verification.

## Dialog scroll displacement fix, 28 October 2026
Merchant reports repeated Search/Bag open-close shifts page upward. Targeted functional fix, not more timing adjustments: show-modal/close commands routed through shared SDialog wrappers; preserve window offset around native focus changes; custom return focus uses preventScroll; skip stale close event after reopen and do not focus an underlying trigger while another modal is open. Escape and backdrop use same close path. s-dialog:opening cancels homepage animation frame/timers/touch hold before autofocus. Wheel/RAF/touch controllers stop interfering with modal document state. Verified 20 simulated cycles + Escape/backdrop/programmatic close and controller suspension in deterministic tests. Theme Check clean. No real iOS/Android keyboard/viewport or rendered animation test; publication remains merchant-controlled. Pre-change source backup /tmp/exports/ILLEGANT-before-dialog-fix-20261028-2021-f39c.zip.

## Close lifecycle correction, 28 October 2026
Merchant confirms opening good; closing still abrupt and shifts page up. Opening CSS untouched. Overlay close now explicitly animates the visible panel to its closed transform/opacity for 750ms via WAAPI while retaining native [open], modality, and root scroll lock. Backdrop fades in tandem. Native close occurs only after exit finishes; preserve offset immediately and after close/focus + one animation frame. Reopening cancels stale exit; repeated close is idempotent. Reduced motion skips animation. Eight deterministic lifecycle checks passed including 20 delayed close cycles, double close and reopen cancellation. No actual mobile browser/keyboard viewport testing available. Changes scoped to SDialog overlay panels, not the standalone site-menu dialog.

## Flagship pass + theme close-out (3 November 2026, WORK 3 Nov theme)
Merchant approved the direction ("καταπληκτικό"). Recorded so later edits keep it.
- **Plain-CSS layer:** `assets/illegant-flagship.css`, loaded last from `snippets/theme-styles.liquid` (after the 3 Nov QA block). Admin API edits cannot run the Canvas compiler, so these rules are plain CSS; fold them into `config/styles.css` at the next editor rebuild.
- **Opening:** Theme settings → Homepage → Opening. Merchant's choice: **3D ring** (`ring`). The alternative **Campaign** (full-bleed photograph / triptych with wordmark) stays selectable. `snippets/lcp-preload.liquid` follows the setting.
- **Ring on phones (<768px):** cards `clamp(8.5rem, min(47vw, vh*28), 15rem)` on a tighter ring (radius 1.06 × card) so three cards are visible; the ring fills the space above the line; wordmark 18.5vw; line and CTA stacked. Desktop ring unchanged.
- **Section lock:** mouse/trackpad = scripted one-gesture-per-section glide (`s-screen-lock.js`). Touch = native CSS scroll snap, `mandatory` + `snap-stop: always` on every homepage section and each room on phones; The Edit (taller than the screen) locks at its top then scrolls freely; footer snaps to the end. The old scripted touch detent is disarmed (code kept). Merchant asked for a clear lock per section (supersedes the 27 Oct "free touch scroll" note).
- **Homepage order:** opening → manifesto → rooms → the edit → private access (image / word rhythm).
- **One identity:** header logo bold with tight tracking like the wordmark. Wording is **Bag / Τσάντα** everywhere (button, menu, cart page, announcements).
- **Product:** square size boxes (no radius), struck-through unavailable sizes, a selected unavailable size is outlined (never filled). "Size guide" row appears when a page `size-guide` is published. Products tagged `coming-soon` say Coming soon / Σύντομα διαθέσιμο, with the Notify me form (customer tags `notify-me`, `interest-<handle>`).
- **Collections:** duplicate count hidden; room tabs and Grid/Index on one row; phones always show the grid (Index is a pointer pattern); Filter/Sort as words with a hairline.
- **Dialogs (3 Nov QA):** close restores the scroll offset recorded before opening; exit 480ms ease, fades in its last third; form fields ≥16px on phones (no iOS zoom).

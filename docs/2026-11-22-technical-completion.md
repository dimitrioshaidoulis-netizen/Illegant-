# Technical completion (22 November 2026)

Branch `claude/commerce-sprint-01` (continues Commerce Sprint 01, audited at `cf7afec`).
Shopify development theme **ILLEGANT — Development (unpublished)** `191499600252` (the only theme edited).
Live theme `191313772924` (*ILLEGANT — Launch pass 16 Nov*, role MAIN) not touched. Nothing published; no store-wide
setting, product, page, menu, policy, language, shipping or payment was changed.

Preview on a phone: `https://wzghvi-w0.myshopify.com/?preview_theme_id=191499600252`
(the storefront password is on; enter it first, or preview from Admin → Online Store → Themes → … → Preview).

## Changes (theme, development only)
| Finding | Change | Files |
|---|---|---|
| Opening "Discover the collection" led into New Arrivals with 0 pieces | While New Arrivals is empty the button reads **Request early access** and lands on the private-access sign-up (`#private-access`); with pieces it goes back to the collection, automatically | `templates/index.liquid` |
| The edit's "View all" also led into the empty room | Shown only when the edit has pieces | `templates/index.liquid` |
| Empty rooms showed "0 pieces", Grid/Index switch, Filter/Sort, tabs into other empty rooms | All hidden while the room has no published piece (`all_products_count`, so a filter that narrows a stocked room to nothing keeps its tools). Tabs, homepage sub-links and menu sub-links skip empty collections; menu photo captions and search rooms drop "0 pieces". All of it comes back as soon as pieces are published | `templates/collection.liquid`, `templates/index.liquid`, `snippets/site-menu.liquid`, `templates/search.liquid` |
| Empty room had a message and a FAQ link but no way to register interest | Message + **email sign-up for that room** (tags `newsletter, private-access, interest-<collection>`; consent line + privacy link) + FAQ | `snippets/interest-form.liquid` (new), `templates/collection.liquid` |
| About / FAQ / Contact only in the footer on phones | Added to the menu (footer menu links, Search left out: it has its own button) | `snippets/site-menu.liquid` |
| Two h1 on FAQ, Contact, About (page title + h1 typed in the page text) | Page text h1 rendered as h2 (text kept, nothing deleted in Admin) | `templates/page.liquid`, `templates/page.contact.liquid` |
| Forms had no busy state or double-submit guard | `<s-submit-once>`: one request per submit, button `aria-busy` + "Sending…", restored on back/forward cache. On private access, room sign-ups, password page, Notify me and Contact | `assets/s-submit-once.js` (new) + the five templates |
| Sign-ups could not be tied to a campaign | Sign-up forms add `src-<utm_source>` (e.g. `src-instagram`) from the current address only; nothing stored in the browser | `assets/s-submit-once.js` |
| Bag drawer: pinned totals took 315 of 667 px on an iPhone SE-size screen (one piece visible) | Same content, tighter rhythm below 760 px height: 243 px, list area 288 → 360 px. Checkout area clears the home indicator (safe-area) on every iPhone | `assets/illegant-flagship.css` §15 |
| No electronic withdrawal function (EU Directive 2023/2673, art. 11a CRD, applies from 19 June 2026) | Template `page.withdrawal`: "Withdraw from contract here" entry, then the details form, then a separate **Confirm withdrawal** button (native contact form). Not assigned to any page | `templates/page.withdrawal.liquid` (new) |
| Strings | 4 + 9 new keys, English and Greek; Greek covers every key (290/290) | `locales/en.default.json`, `locales/el.json` |

## Margin calculator (`tools/commerce/dropship_margin.py`)
- Bug confirmed on the old code: one valid row (€89 retail / €40 cost) + one incomplete row → average €4.95 and
  "about 26 orders"; correct is €9.90 and 13.
- Now: averages over used rows only; prints rows used / skipped (with reason, including non-numeric and zero prices);
  break-even orders rounded **up**; "never breaks even" when the contribution is ≤ 0 (no division); accepts `40,00`.
- Every run lists inputs as **confirmed** (published by the source) or **assumption** (replace with real figures).
- CSV columns unchanged. Tests: `python3 -m unittest tools/commerce/test_dropship_margin.py` (11 tests).

## Tests
See the final report for numbers. Local renderer (`tools/preview`, LiquidJS) + Chromium; iPhone 13 emulation and
375/390/1280 px viewports. **No WebKit/real Safari here.** Shopify Standard Actions are a recording mock; form posts are
intercepted; partial rendering is a stub. Proven: what the theme renders and sends. Not proven: what Shopify answers.

## Store-wide settings (owner decision; not changed)
| Setting | Today | Proposed | Impact | Admin path |
|---|---|---|---|---|
| Greek language | Only English is enabled (`en`, published). The Greek strings in the theme never show | Add Greek; preview; publish (and consider Greek as default for a Greek audience) | Visitors get Greek menus, buttons, messages. Checkout/emails follow Shopify's own Greek | Settings → Languages → Add language → Greek → Publish |
| Domestic shipping overlap | "Τυπική €5" (no condition) and "Τυπική €0" (≥ €50) both show at €50+ | Add condition to the €5 rate: order price maximum €49.99 | At €50+ only free standard + express €13; at €49.99 and below: €5 + €13 | Settings → Shipping and delivery → General profile → Domestic → Τυπική €5 → Add conditions → Based on order price → Max 49.99 |
| Islands | No separate rate (same as mainland) | Decide with the carrier (often a surcharge) | Price promise in FAQ/shipping page must match | Same zone, add rate per postcode via carrier/app if needed |
| International zone | 28 countries, €17, but Markets sells to Greece only | Remove the zone or open markets deliberately | No effect today; avoids a wrong rate later | Settings → Shipping and delivery → General profile |
| Withdrawal page | Draft "ypanachorisi" with placeholder `[EMAIL ΕΠΙΚΟΙΝΩΝΙΑΣ]` | Fill business details, assign template `page.withdrawal`, publish with the live theme | Legal requirement once selling | Online Store → Pages → Υπαναχώρηση → Theme template |
| Withdrawal acknowledgement | The form emails the store only | Reply on a durable medium (email) without delay; manual or automated | Required by art. 11a | Settings → Notifications / Shopify Flow |
| Policies, shipping & returns, size guide pages | Drafts / empty | Fill with business name, address, VAT number, returns terms, then publish | Required before sales | Settings → Policies; Online Store → Pages |
| Payments, taxes, merchant details, domain, email sender | Not set up | Owner | Required before sales | Settings → Payments / Taxes / Store details |
| Publish theme, storefront password, products Active | Unpublished / on / draft | Owner | Go-live | Online Store → Themes; Preferences; Products |

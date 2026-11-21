# ILLEGANT — revenue readiness: operational audit and supplier discovery (21 November 2026)

Labels: **[V]** verified live in the store today · **[S]** stated by the cited source (not independently audited) · **[E]** my
estimate or assumption · **[?]** sources conflict or unverified.

Nothing was purchased, no supplier account was opened, no app was installed, and no Shopify setting, product or theme was
changed in this pass. Supplier websites cannot be opened from this environment (their hosts are not on the network
allow-list); supplier facts come from web-search extracts of the suppliers' own pages, marked [S], and from reviews.

---

## A. Verified store status

### What the 30-day numbers really say
| Metric (last 30 days) [V] | Value |
|---|---|
| Sessions / visitors | 459 / 433 |
| … of which "direct, United States, desktop" | **428** (93%): crawlers and Shopify's own tooling, not customers [E] |
| … from Greece | 31 (19 mobile, 12 desktop), most likely the owner [E] |
| Sessions with add to cart / checkout / purchase | 0 / 0 / 0 |
| Customers / orders / draft orders | 0 / 0 / 0 |

The store is password-protected [V] and has nothing for sale, so 0 add-to-cart is the expected result, not a conversion
problem. **There is no customer demand data yet**, positive or negative.

### Store configuration [V]
| Area | State |
|---|---|
| Plan, currency, market | Basic · EUR · one market, Greece |
| Published theme | **ILLEGANT — Launch pass 16 Nov** (published 21 Nov, 20:33). Further theme work needs a new unpublished copy. |
| Products | 12, none sellable: 4 archived concept samples (AI images, "sample-only"), 8 drafts "Sample · …" without images, all 0 stock |
| Collections | 11 (Men, Women, New Arrivals, Sale, 6 sub-collections, Home page); empty for customers |
| Apps | Shopify Messaging, Digital Products, two AI connectors. **No supplier, sync, reviews or consent app.** |
| Payments | Not readable with this connection (needs `read_shopify_payments`). **No digital wallets enabled**, which suggests no payment provider is active. |
| Taxes | Prices include tax; shipping not taxed. No VAT number visible to the API. |
| Shipping | Greece: Standard €5, free from €50, Express €13, no delivery estimates. "International" zone (28 countries, €17), unreachable because the only market is Greece. |
| Location | "Shop location", Greece, **no address**. |
| Policies | Privacy policy only (Shopify template, personal Gmail as contact). **No** refund, shipping, terms or contact-information policy. |
| Pages | Published: Contact, About, FAQ. Unpublished drafts: Υπαναχώρηση (withdrawal), Shipping & Returns, Size Guide. |
| Languages | English only published; the theme's Greek translation is unreachable for visitors. |
| Domain / email | `wzghvi-w0.myshopify.com` only; store and contact email are a personal Gmail address. |
| Customer accounts | New customer accounts; login not required at checkout. |

### Customer journey
| Step | Status | Evidence |
|---|---|---|
| Home | Works (theme) | Theme tests 16–17 Nov (local renderer). Locked by password. |
| Collection | **Empty** | All products draft/archived [V] |
| Product page | **Nothing to show** | No active product [V] |
| Cart | Unverified with a real product | Theme cart tested locally only |
| Checkout | **Unverified** | No product to buy; Basic plan has no checkout API [V] |
| Payment | **Missing (most likely)** | No wallets [V]; provider unreadable |
| Order confirmation | Unverified | Default Shopify notifications; not readable via API |
| Fulfilment | **Missing** | No supplier, no app, no address [V] |
| Delivery | Partly configured | Rates exist, not aligned with any supplier [V] |
| Returns | **Missing** | No refund policy; withdrawal draft unpublished [V] |

### What prevents sales, most critical first
1. **No legal business** (owner, 3 Nov). Selling, invoicing (myDATA), VAT and Shopify Payments onboarding all depend on it.
2. **No product source.** No supplier account, no real products, no stock or sync.
3. **The cheapest branded-fashion supplier costs about twice the whole budget per month** (section B).
4. **No payment provider active** (most likely).
5. **No returns, shipping or terms policy**, no legal identity on the site; these are mandatory for distance selling in the EU.
6. High, not blocking alone: Greek not published; shipping not aligned with a supplier; no domain or brand email; cookie
   banner unverified; location address empty.

---

## B. Suppliers and product strategy

### The constraint first
Every supplier of authentic branded fashion found charges a monthly plan of **€90–279 before VAT**, and all expect a
business customer. With €0–50 available, **none can be started compliantly today.** A legal operation also carries about
€300/month of business running costs [E] (social-security minimum and accountant; phase A research, unconfirmed).

### Comparison (official pages via search extracts unless noted)
| | **Brandsdistribution** (IDT S.p.A., Turin) | **Griffati** (Italy) | **BrandsGateway** | Syncee | Greek wholesalers |
|---|---|---|---|---|---|
| Plan | €99 + VAT/month, or €990 + VAT/year, unlimited products [S]; older pages say €69 for 100 products [?] | €90 + VAT/month + €90–250/year membership; Shopify app tiers $90 / $190 per month; **€1 per order** [S][?] (pages conflict) | €147–279/month (own pages, dated); from €180/month; Shopify listing from $209 [S][?] | Free plan: 100 products, 1 supplier [S] | not published |
| Registration | Free; shows wholesale prices and stock after sign-up [S] | Not found | Not found | Free | Contact |
| Business required | Reviews say business licence and tax ID [S][?] | Not found | Not found | — | B2B |
| Shopify | BrandsSync app, included with the plan [S]; reviews mention manual order steps [?] | Sync2Fashion; reviews: missing images and size charts [S] | Official app | App | — |
| Blind shipping | Yes: no Brandsdistribution reference on parcels; no custom packaging or own logo [S] | Not found | Not found | Depends on supplier | Ask |
| Shipping to customer | €7.30 for 0–5 kg to "many EU countries", 4–8 working days by post [S]; **Greece not explicitly confirmed** | Calculated per order; EU tables not found | 3–5 days economy within Europe [S] | Varies | Domestic |
| Returns | 20 days from receipt [S]; change of mind: **€15 return fee** per return in the EU [S] | Not found (old page: handled by Griffati) | 14 days from delivery; UPS/DHL/FedEx only [S] | Varies | Ask |
| Minimum order | None for dropshipping (wholesale: €1,000 EU) [S] | None for dropshipping (wholesale €700) [S] | — | — | Ask |
| Reputation | Mixed: thin margins, shipping cost increases, slow support (reviews 2019–2023) [S] | 2.4 on Trustpilot per one review site; integration complaints [S][?] | Complaints about stock-outs and return-fee disputes [S] | Inactive suppliers, unsynced stock (2026 reviews) [S] | Unknown |
| Verdict | **Strongest candidate, conditional** | Second option; verify pricing in writing | Too expensive | No branded-fashion focus shown | Worth a call; authenticity unverified |

### Recommendation: Brandsdistribution, only after a free price check
- **Why it is the strongest:** it is the cheapest unlimited plan among authentic-brand specialists, registration is free
  and shows real wholesale prices before you pay anything, parcels are blind-shipped, and the Shopify app is included.
  Its 20-day supplier return window covers the customer's 14-day withdrawal right.
- **Before paying, confirm:**
  - delivery to Greece and its exact fee;
  - whether a VAT number is needed to subscribe;
  - whether orders reach the supplier automatically or must be placed by hand;
  - written assurance that goods were first placed on the EEA market by the brand owner;
  - permission to use their photos.

### What the economics require (tools/commerce/dropship_margin.py)
Assumptions:
- Supplier shipping €7.30 [S], return fee €15 [S], 25% of orders returned [E], card fees 2.9% + €0.30 [E].
- VAT-registered business, supplier invoices without VAT [E].
- Fixed costs: €128 platform (Brandsdistribution plan plus Shopify Basic), or about €428 including business running costs.

| Retail price incl. VAT | Supplier cost as share of the net price | Expected contribution per order | Orders/month to cover €128 | to cover ~€428 |
|---|---|---|---|---|
| €59 | 50% | €4.78 | 27 | 90 |
| €59 | 70% | −€2.36 | never | never |
| €89 | 50% | €12.98 | 10 | 33 |
| €89 | 60% | €7.60 | 17 | 56 |
| €129 | 50% | €23.92 | 5 | 18 |
| €129 | 60% | €16.12 | 8 | 27 |
| €189 | 50% | €40.33 | 3 | 11 |

**Reading:**
- Branded dropshipping only works with retail prices of about **€89 or more** and a supplier cost **at or below 50–60% of the
  net price**.
- Below €60 it barely covers itself even before business costs.
- Reviews say Brandsdistribution margins are thin, so the free price check decides whether this model works at all.
- Paid ads are not in these numbers. The 6 Nov research found cold Meta ads lose money on a first order at these margins.

### Product recommendations
**No specific products are proposed.** Supplier prices and stock are only visible after registration, and I will not
invent SKUs or costs. A curated 6–12 piece launch should meet all of these:
- **Price:** retail €89–189, supplier cost ≤ 50–60% of the net price (run each candidate through the model).
- **Low return risk:** accessories (bags, belts, small leather goods, scarves, caps) and relaxed knitwear and sweatshirts.
  Avoid footwear and fitted tailoring at launch: size returns cost €22+ each.
- **Depth:** stock in at least three core sizes; a size chart from the supplier.
- **Price check:** cheaper or equal against Greek retail (Skroutz, brand sites) at the same moment; otherwise there is no reason to buy from ILLEGANT.
- **Brand fit:** quiet, logo-light brands that suit the monochrome identity; men 4–5, women 4–5, 2 unisex accessories.
- **Records:** every candidate goes into `tools/commerce/launch-catalog-template.csv` with supplier, SKU, URL, cost, price, margin and verification status.

### Legal points to verify with a professional (not legal advice)
- **Reselling genuine goods.** Trade-mark rights are exhausted for goods first placed on the EEA market by the owner or
  with consent [S]. The reseller may have to prove it [S]. Luxury brands may object to presentations that damage their
  image, and may restrict authorised distributors through selective-distribution networks (Coty C-230/16) [S].
  - Keep supplier invoices and an origin assurance.
  - Do not describe ILLEGANT as an "authorised retailer".
  - Do not use brand logos as ILLEGANT branding.
- **GPSR (EU 2023/988)** applies to clothing [S]. As a distributor, ILLEGANT must check that the manufacturer and
  responsible-person information exists and show it on listings [S].
- **Greece:**
  - Business registration with a suitable activity code (the e-commerce activity codes were reorganised from
    1 March 2026 [S]).
  - VAT 24%.
  - myDATA and e-invoicing obligations.
  - Distance-selling information duties and the 14-day withdrawal right.
  - Intra-EU purchases from an Italian supplier (reverse charge).

  All of this is for the accountant.
- **Shopify Payments Greece** accepts sole proprietors resident in Greece. A VAT number is required "if applicable" [S].

---

## C. Implementation roadmap

| Stage | Action | Cost | Who | Gate |
|---|---|---|---|---|
| **0 · now** | Register free at Brandsdistribution; collect real wholesale price, stock and sizes for 20–30 candidates | €0 | **You** (it needs your identity) | — |
| 0 | I run every candidate through the model and shortlist 6–12 | €0 | Me | Real prices |
| 0 | Ask Brandsdistribution in writing: Greece delivery fee, VAT-number requirement, order automation, origin assurance, image rights | €0 | You (I can draft the email) | — |
| 0 | Accountant meeting: business form, activity code, VAT, myDATA, intra-EU purchases, real monthly cost | fee | You | — |
| **1 · decide** | Go or no-go: is the expected contribution × realistic orders above ~€430/month? | — | You | Stage 0 results |
| 2 | Register the business; brand email; domain | ~€10–15/year domain [?] + registration | You | Approval |
| 2 | Subscribe (monthly first), install BrandsSync, import the 6–12 products **as Drafts** | €99 + VAT/month | Me after approval | Approval + funds |
| 2 | Listings: truthful premium copy, sizes, materials, care, GPSR information, SEO; collections Men / Women / Accessories; remove sample products from the journey | €0 | Me | Real data |
| 3 | Shipping aligned to the supplier (Greece, real fee and time); remove the International zone; dispatch/return address | €0 | Me after approval | Supplier answers |
| 3 | Policies: returns (14-day withdrawal, who pays return shipping), shipping, terms, contact; reviewed by a professional | review fee | You + professional | Business details |
| 3 | Shopify Payments onboarding, test mode, end-to-end test order (cart → checkout → email → supplier order → refund) | €0 | You (identity) + me | Business registered |
| 3 | Greek published; cookie banner; delivery and returns information on product pages | €0 | Me after approval | — |
| **4 · launch** | Remove password; organic plan: 3 Reels per week (styling, unboxing, price-to-quality), Greek SEO landing pages per brand and category, Instagram shop | €0 | You + me | Approval |

### KPIs from day one of a real launch
| KPI | Measure | First target [E] |
|---|---|---|
| Qualified traffic | Sessions from Greece, excluding direct US desktop | baseline in 30 days |
| Product views | Product views per session | baseline |
| Add-to-cart rate | Sessions with cart additions / sessions | baseline, then improve |
| Checkout initiation | Sessions reaching checkout / sessions with cart | baseline |
| Conversion rate | Orders / sessions | baseline |
| Contribution margin | Per order, from the model, with real fees and returns | ≥ €20 |
| CAC | Organic for now; any ad spend divided by new customers | < contribution per order |
| Returns | Returned orders / orders | ≤ 25% |
| Fulfilment | Order to delivery | ≤ 8 working days (supplier states 4–8) |

---

## D. Execution log (21 Nov)
- **Read only in Shopify:** analytics (sessions, landing pages, referrers), shop settings, products, collections, themes,
  apps, markets, locations, policies, pages, shipping. **Nothing changed.**
- **Created in the repository:**
  - `tools/commerce/dropship_margin.py`: break-even and per-product model, with sources noted next to each input.
  - `tools/commerce/launch-catalog-template.csv`: the empty catalog record; every proposed product must be filled in
    with verified data.
  - This report.
- **Noticed:** the "Launch pass 16 Nov" theme was published by the owner today.

## E. Blockers
| Blocker | Type | Needed from you |
|---|---|---|
| No registered business | Legal | Accountant; your decision |
| Budget: plan €99 + VAT/month plus ~€300/month business costs [E] vs €0–50 | Funding | Decide whether to fund after the free price check |
| Supplier registration | Identity | Register (free) or allow me to draft the request |
| Payment provider | Identity/legal | Shopify Payments onboarding after registration |
| Policies and legal identity | Information + professional review | Business details |
| Supplier sites unreadable here | Environment | Optional: allow `brandsdistribution.com`, `griffati.com`, `brandsgateway.com`, `apps.shopify.com` in the environment's network settings so I can read terms directly |
| Payments not readable by me | Connector scope | Optional: reconnect Shopify with payments read access |

## F. Next action
**Create a free Brandsdistribution account and send me the wholesale price, stock and sizes of 20–30 items you like**
(screenshots or an export). It costs nothing, needs no subscription, and turns the model into a yes/no decision on
real numbers before any money or registration is committed.

---

## Sources
- Brandsdistribution: [dropshipping terms](https://www.brandsdistribution.com/en/cms/dropshipping-terms) ·
  [pricing](https://www.brandsdistribution.com/en/cms/fashion-dropshipping-pricing) ·
  [shipping fees](https://www.brandsdistribution.com/en/cms/shipping-fee) ·
  [how it works](https://www.brandsdistribution.com/en/cms/fashion-dropshipping-how-it-works) ·
  [terms PDF](https://www.brandsdistribution.com/ftp/landings/dropshipment/drop_conditions_B-EN.pdf) ·
  [free registration](https://support.brandsdistribution.com/en-us/article/42-how-much-does-it-cost-to-register-with-brandsdistribution) ·
  [minimum order](https://support.brandsdistribution.com/en-us/article/22-is-there-a-minimum-order-on-brandsdistribution) ·
  [BDroppy Shopify app](https://apps.shopify.com/bdroppy-fashion-dropshipping) ·
  [BrandsSync reviews](https://apps.shopify.com/brandssync/reviews?rating=2) ·
  [European Purpose](https://europeanpurpose.com/tool/brandsdistribution) ·
  [Zero11 app listing](https://shop.zero11.it/shop/shopify-extension/brands-sync-extension-2/shopify/) ·
  [ECOMPOSER](https://ecomposer.io/blogs/dropshipping/luxury-dropshipping-suppliers)
- Griffati: [dropshipping](https://www.griffati.com/en/dropshipping.html) ·
  [plans](https://www.griffati.com/en/dropship-prices-plan) ·
  [contract](https://www.griffati.com/en/dropshipping-contract) ·
  [conditions](https://www.griffati.com/en/conditions) · [shipping](https://www.griffati.com/en/shipping) ·
  [review](https://dropshippinghelps.com/griffati-dropshipping-designer-clothing-review/)
- BrandsGateway: [subscription plans](https://brandsgateway.com/content-hubs/dropshipping-partner/subscription-plans/) ·
  [dropshipping](https://brandsgateway.com/dropshipping/) · [Shopify app](https://apps.shopify.com/brandsgateway-app) ·
  [review](https://alidropship.com/is-brandsgateway-legit/)
- Syncee: [pricing](https://syncee.com/pricing?fpr=dodropshipping2) · [Shopify app](https://apps.shopify.com/Syncee-1)
- Greek wholesalers: [wholesalefashion.gr](https://wholesalefashion.gr/________k-120.htm) ·
  [Unfrosen list](https://www.unfrosen.gr/blogs/greek-blog/top-10-wholesale-clothing-vendors-greece)
- Law: [Lewis Silkin on Coty](https://lewissilkin.com/Insights/Coty-Keeping-up-appearances) ·
  [Bird & Bird on parallel trade](https://brandwrites.twobirds.com/post/102kdb7/parallel-trade-who-bears-the-burden-of-proof) ·
  [Mishcon on exhaustion](https://www.mishcon.com/news/is-your-beauty-brand-exhausted-how-parallel-imports-exhaustion-and-selective-distribution-criteria-work-in-the-eea-and-uk) ·
  [Commission GPSR guidance](https://eur-lex.europa.eu/eli/C/2025/6233/oj/eng) ·
  [ComplianceGate on GPSR distributors](https://www.compliancegate.com/gpsr-distributors/) ·
  [AADE e-invoicing](https://aade.gr/node/15728) ·
  [new activity codes (Forin)](https://www.forin.gr/articles/article/90145/aade-pshfiakh-bebaiwsh-drasthriothtwn-gia-th-metabash-stous-neous-kad)
- Shopify Payments Greece: [requirements](https://help.shopify.com/en/manual/payments/shopify-payments/supported-countries/greece/requirements) ·
  [terms](https://shopify.com/legal/terms-payments/gr)
- Earlier research in this repository: `docs/research/` (6 Nov), whose finding that fashion has the weakest economics
  (returns ~30%) still applies.

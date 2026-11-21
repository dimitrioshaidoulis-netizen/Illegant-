"""Branded-fashion dropshipping economics for ILLEGANT (Greece, Shopify Basic).

Two uses:
  python3 dropship_margin.py                 # sensitivity grid: price x supplier cost share, break-even orders/month
  python3 dropship_margin.py candidates.csv  # per product, from real supplier prices (columns as in launch-catalog-template.csv)

Every input below is either published by the source named next to it [S], or an assumption [E] to replace with
real figures (supplier dashboard, Shopify Payments rates in the admin, your accountant). Nothing here is a forecast.
"""
import csv
import sys

VAT_GR = 0.24              # [S] Greek standard VAT rate on clothing
PAY_PCT = 0.029            # [E] card fee; replace with the rate shown in Settings > Payments
PAY_FIXED = 0.30           # [E]
SHIP_TO_CUSTOMER = 7.30    # [S] Brandsdistribution shipping-fee page, 0-5 kg, "many EU countries"; Greece not confirmed
RETURN_FEE = 15.00         # [S] Brandsdistribution dropshipping terms: return fee, EU excl. Italy (change of mind)
RETURN_RATE = 0.25         # [E] share of orders returned (EU fashion benchmarks ~30% [S][?])
FREE_SHIPPING_FROM = 50.0  # store setting today: free standard shipping from EUR 50, else customer pays EUR 5
CUSTOMER_SHIPPING = 5.0
FIXED_MONTHLY = {
    "supplier plan (Brandsdistribution, ex VAT)": 99.0,   # [S] dropshipping terms: EUR 99 + VAT / month
    "Shopify Basic": 29.0,                                # [?] blogs; check Settings > Plan
}
# Running a registered business in Greece [E, from docs/research phase A: EFKA minimum category ~EUR 220-250/month,
# accountant ~EUR 40-80/month; sources conflict, confirm with an accountant].
BUSINESS_MONTHLY = 300.0


def per_order(price_incl_vat, cost_ex_vat, ship=SHIP_TO_CUSTOMER, ret_rate=RETURN_RATE):
    """Expected contribution of one order before fixed costs and ads, for a VAT-registered Greek business
    (supplier invoices ex VAT under intra-EU reverse charge [E: confirm with accountant])."""
    customer_shipping = 0.0 if price_incl_vat >= FREE_SHIPPING_FROM else CUSTOMER_SHIPPING
    revenue_ex_vat = (price_incl_vat + customer_shipping) / (1 + VAT_GR)
    fee = (price_incl_vat + customer_shipping) * PAY_PCT + PAY_FIXED      # card fees are not refunded on returns [E]
    kept = revenue_ex_vat - cost_ex_vat - ship - fee
    returned = -(ship + RETURN_FEE + fee)    # refund to customer; supplier credits the goods, keeps its fees [E]
    expected = (1 - ret_rate) * kept + ret_rate * returned
    return kept, expected


def grid():
    fixed = sum(FIXED_MONTHLY.values())
    print(f"Fixed per month: EUR {fixed:.0f} ({', '.join(f'{k} {v:.0f}' for k, v in FIXED_MONTHLY.items())})")
    print(f"Per order: shipping {SHIP_TO_CUSTOMER:.2f}, return fee {RETURN_FEE:.2f}, returns {RETURN_RATE:.0%}, "
          f"card {PAY_PCT:.1%} + {PAY_FIXED:.2f}\n")
    print(f"Plus running a registered business: about EUR {BUSINESS_MONTHLY:.0f}/month [E]\n")
    print("price incl. VAT | supplier cost (% of price ex VAT) | margin if kept | expected per order | orders/month: platform only | incl. business costs")
    for price in (59, 89, 129, 189):
        for share in (0.40, 0.50, 0.60, 0.70):
            cost = price / (1 + VAT_GR) * share
            kept, exp = per_order(price, cost)
            be = f"{fixed / exp:.0f}" if exp > 0 else "never"
            be2 = f"{(fixed + BUSINESS_MONTHLY) / exp:.0f}" if exp > 0 else "never"
            print(f"EUR {price:>4} | {share:.0%} (EUR {cost:6.2f}) | EUR {kept:6.2f} | EUR {exp:6.2f} | {be} | {be2}")
        print()


def from_csv(path):
    fixed = sum(FIXED_MONTHLY.values())
    rows = list(csv.DictReader(open(path, newline="", encoding="utf-8")))
    total = 0.0
    for r in rows:
        if not (r.get("cost_ex_vat_eur") and r.get("retail_incl_vat_eur")):
            print(f"skip (no verified cost or price yet): {r.get('product') or '?'}")
            continue
        kept, exp = per_order(float(r["retail_incl_vat_eur"]), float(r["cost_ex_vat_eur"]))
        margin = kept / (float(r["retail_incl_vat_eur"]) / (1 + VAT_GR))
        total += exp
        print(f"{r['product'][:40]:40} | kept EUR {kept:6.2f} ({margin:.0%} of net price) | expected EUR {exp:6.2f} | {r.get('verification_status', '')}")
    if total > 0:
        print(f"\nAverage expected per order over listed products: EUR {total / max(1, len(rows)):.2f}; "
              f"fixed EUR {fixed:.0f}/month needs about {fixed / (total / max(1, len(rows))):.0f} orders/month")


if __name__ == "__main__":
    from_csv(sys.argv[1]) if len(sys.argv) > 1 else grid()

"""Branded-fashion dropshipping economics for ILLEGANT (Greece, Shopify Basic).

Two uses:
  python3 dropship_margin.py                 # sensitivity grid: price x supplier cost share, break-even orders/month
  python3 dropship_margin.py candidates.csv  # per product, from real supplier prices (columns as in launch-catalog-template.csv)

Every input below is either published by the source named next to it [S], or an assumption [E] to replace with
real figures (supplier dashboard, Shopify Payments rates in the admin, your accountant). Nothing here is a forecast.
"""
import csv
import math
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
# Which inputs are confirmed and which are assumptions, printed with every result so the two are never mixed up.
# "confirmed" = published by the named source (still re-check before launch); "assumption" = replace with real figures.
INPUTS = [
    ("Greek VAT on clothing", f"{VAT_GR:.0%}", "confirmed", "Greek standard VAT rate"),
    ("Supplier shipping to customer", f"EUR {SHIP_TO_CUSTOMER:.2f}", "confirmed",
     "Brandsdistribution shipping-fee page, 0-5 kg, 'many EU countries' (Greece itself not confirmed)"),
    ("Supplier return fee", f"EUR {RETURN_FEE:.2f}", "confirmed", "Brandsdistribution dropshipping terms, EU excl. Italy"),
    ("Supplier plan", "EUR 99/month ex VAT", "confirmed", "Brandsdistribution dropshipping terms"),
    ("Customer shipping", f"EUR {CUSTOMER_SHIPPING:.0f}, free from EUR {FREE_SHIPPING_FROM:.0f}", "confirmed",
     "this store's shipping settings (Shopify admin)"),
    ("Shopify plan", "EUR 29/month", "assumption", "check Settings > Plan"),
    ("Card fee", f"{PAY_PCT:.1%} + EUR {PAY_FIXED:.2f}", "assumption", "replace with the rate in Settings > Payments"),
    ("Return rate", f"{RETURN_RATE:.0%}", "assumption", "EU fashion benchmarks; replace with real returns"),
    ("Card fee kept by processor on returns", "yes", "assumption", "check the payment provider's terms"),
    ("Supplier invoices ex VAT (reverse charge)", "yes", "assumption", "confirm with an accountant"),
]

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


def break_even_orders(fixed, expected_per_order):
    """Whole orders per month needed to cover `fixed`, rounded UP (a part order does not exist);
    None when an order does not contribute anything (the plan never breaks even)."""
    if expected_per_order <= 0:
        return None
    return math.ceil(round(fixed / expected_per_order, 9))


def print_inputs():
    print("Inputs (confirmed = published by the source; assumption = replace with real figures):")
    for name, value, status, source in INPUTS:
        print(f"  [{status:10}] {name}: {value}  ({source})")
    print()


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
            be = break_even_orders(fixed, exp) or "never"
            be2 = break_even_orders(fixed + BUSINESS_MONTHLY, exp) or "never"
            print(f"EUR {price:>4} | {share:.0%} (EUR {cost:6.2f}) | EUR {kept:6.2f} | EUR {exp:6.2f} | {be} | {be2}")
        print()


def _number(value):
    try:
        return float(str(value).strip().replace(",", "."))
    except (TypeError, ValueError):
        return None


def summarize_csv(path):
    """Read a catalogue CSV (columns as in launch-catalog-template.csv) and return a summary dict.

    Only rows with a positive cost and retail price are used. Rows without them are skipped AND left out of the
    average, so an unfinished row never dilutes the result. Keys: rows (per-product dicts), used, skipped
    (list of (product, reason)), average_expected (None if nothing used), fixed_monthly, break_even_orders
    (None if nothing used or the average contribution is not positive)."""
    fixed = sum(FIXED_MONTHLY.values())
    with open(path, newline="", encoding="utf-8") as handle:
        reader = list(csv.DictReader(handle))
    rows, skipped = [], []
    for r in reader:
        name = (r.get("product") or "").strip() or "?"
        price, cost = _number(r.get("retail_incl_vat_eur")), _number(r.get("cost_ex_vat_eur"))
        if price is None or cost is None:
            skipped.append((name, "no verified cost or price yet"))
            continue
        if price <= 0 or cost < 0:
            skipped.append((name, "price must be above 0 and cost not negative"))
            continue
        kept, exp = per_order(price, cost)
        rows.append({
            "product": name,
            "kept": kept,
            "margin": kept / (price / (1 + VAT_GR)),
            "expected": exp,
            "status": (r.get("verification_status") or "").strip(),
        })
    average = sum(row["expected"] for row in rows) / len(rows) if rows else None
    return {
        "rows": rows,
        "used": len(rows),
        "skipped": skipped,
        "average_expected": average,
        "fixed_monthly": fixed,
        "break_even_orders": break_even_orders(fixed, average) if average is not None else None,
    }


def from_csv(path):
    summary = summarize_csv(path)
    print_inputs()
    for name, reason in summary["skipped"]:
        print(f"skip ({reason}): {name}")
    for row in summary["rows"]:
        print(f"{row['product'][:40]:40} | kept EUR {row['kept']:6.2f} ({row['margin']:.0%} of net price) | "
              f"expected EUR {row['expected']:6.2f} | {row['status']}")
    print(f"\nRows used: {summary['used']}; skipped: {len(summary['skipped'])}")
    average = summary["average_expected"]
    if average is None:
        print("No row has both a cost and a retail price yet: nothing to average.")
    elif summary["break_even_orders"] is None:
        print(f"Average expected per order over the {summary['used']} used row(s): EUR {average:.2f}; "
              f"this does not cover fixed EUR {summary['fixed_monthly']:.0f}/month at any volume (never breaks even)")
    else:
        print(f"Average expected per order over the {summary['used']} used row(s): EUR {average:.2f}; "
              f"fixed EUR {summary['fixed_monthly']:.0f}/month needs at least {summary['break_even_orders']} orders/month "
              f"(rounded up)")
    return summary


if __name__ == "__main__":
    if len(sys.argv) > 1:
        from_csv(sys.argv[1])
    else:
        print_inputs()
        grid()

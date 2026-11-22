"""Tests for dropship_margin.py. Run: python3 -m unittest tools/commerce/test_dropship_margin.py (from the repo root)."""
import contextlib
import csv
import io
import math
import os
import sys
import tempfile
import unittest

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import dropship_margin as dm  # noqa: E402

HEADER = ("product,brand,category,gender,supplier,supplier_sku,source_url,cost_ex_vat_eur,retail_incl_vat_eur,"
          "suggested_retail_eur,sizes_in_stock,material,origin_country,images_licensed,verification_status,notes").split(",")


def write_csv(rows):
    handle = tempfile.NamedTemporaryFile("w", suffix=".csv", delete=False, newline="", encoding="utf-8")
    with handle:
        writer = csv.DictWriter(handle, fieldnames=HEADER)
        writer.writeheader()
        for row in rows:
            writer.writerow({key: row.get(key, "") for key in HEADER})
    return handle.name


def quiet(fn, *args):
    with contextlib.redirect_stdout(io.StringIO()) as out:
        result = fn(*args)
    return result, out.getvalue()


class PerOrder(unittest.TestCase):
    def test_reference_example_89_retail_40_cost_25pct_returns(self):
        kept, expected = dm.per_order(89, 40, ret_rate=0.25)
        self.assertAlmostEqual(kept, 21.59, places=2)
        self.assertAlmostEqual(expected, 9.90, places=2)


class FromCsv(unittest.TestCase):
    def tearDown(self):
        for path in getattr(self, "paths", []):
            os.unlink(path)

    def csv(self, rows):
        path = write_csv(rows)
        self.paths = getattr(self, "paths", []) + [path]
        return path

    def test_one_valid_row(self):
        summary = dm.summarize_csv(self.csv([{"product": "Wool coat", "cost_ex_vat_eur": "40", "retail_incl_vat_eur": "89"}]))
        self.assertEqual(summary["used"], 1)
        self.assertEqual(summary["skipped"], [])
        self.assertAlmostEqual(summary["average_expected"], 9.90, places=2)

    def test_incomplete_row_is_skipped_and_not_averaged(self):
        """The bug: an incomplete row halved the average (EUR 9.90 -> 4.95)."""
        summary = dm.summarize_csv(self.csv([
            {"product": "Wool coat", "cost_ex_vat_eur": "40", "retail_incl_vat_eur": "89"},
            {"product": "Unpriced knit", "cost_ex_vat_eur": "", "retail_incl_vat_eur": ""},
        ]))
        self.assertEqual(summary["used"], 1)
        self.assertEqual(len(summary["skipped"]), 1)
        self.assertEqual(summary["skipped"][0][0], "Unpriced knit")
        self.assertAlmostEqual(summary["average_expected"], 9.90, places=2)

    def test_break_even_is_rounded_up(self):
        summary = dm.summarize_csv(self.csv([{"product": "Wool coat", "cost_ex_vat_eur": "40", "retail_incl_vat_eur": "89"}]))
        fixed = sum(dm.FIXED_MONTHLY.values())
        exact = fixed / summary["average_expected"]
        self.assertEqual(summary["break_even_orders"], math.ceil(exact))
        self.assertGreaterEqual(summary["break_even_orders"], exact)
        self.assertEqual(summary["break_even_orders"], 13)  # 128 / 9.90 = 12.93 -> 13, not 12

    def test_empty_file(self):
        path = self.csv([])
        summary, output = quiet(dm.from_csv, path)
        self.assertEqual(summary["used"], 0)
        self.assertEqual(summary["skipped"], [])
        self.assertIsNone(summary["average_expected"])
        self.assertIsNone(summary["break_even_orders"])
        self.assertIn("Rows used: 0; skipped: 0", output)

    def test_only_incomplete_rows(self):
        summary, output = quiet(dm.from_csv, self.csv([{"product": "A"}, {"product": "B", "cost_ex_vat_eur": "20"}]))
        self.assertEqual((summary["used"], len(summary["skipped"])), (0, 2))
        self.assertIsNone(summary["average_expected"])
        self.assertIn("nothing to average", output)

    def test_non_positive_contribution_never_breaks_even(self):
        # Cost above the net price: every order loses money, so there is no break-even volume (and no division).
        summary, output = quiet(dm.from_csv, self.csv([{"product": "Loss leader", "cost_ex_vat_eur": "80", "retail_incl_vat_eur": "59"}]))
        self.assertLessEqual(summary["average_expected"], 0)
        self.assertIsNone(summary["break_even_orders"])
        self.assertIn("never breaks even", output)

    def test_break_even_helper_zero_contribution(self):
        self.assertIsNone(dm.break_even_orders(128, 0))
        self.assertIsNone(dm.break_even_orders(128, -3))
        self.assertEqual(dm.break_even_orders(128, 64), 2)  # exact division stays exact

    def test_invalid_numbers_are_skipped_with_reason(self):
        summary = dm.summarize_csv(self.csv([
            {"product": "Typo", "cost_ex_vat_eur": "forty", "retail_incl_vat_eur": "89"},
            {"product": "Zero price", "cost_ex_vat_eur": "10", "retail_incl_vat_eur": "0"},
            {"product": "Comma decimal", "cost_ex_vat_eur": "40,00", "retail_incl_vat_eur": "89,00"},
        ]))
        self.assertEqual(summary["used"], 1)
        self.assertEqual([name for name, _ in summary["skipped"]], ["Typo", "Zero price"])
        self.assertAlmostEqual(summary["average_expected"], 9.90, places=2)

    @staticmethod
    def count_rows(path):
        with open(path, newline="", encoding="utf-8") as handle:
            return sum(1 for _ in csv.DictReader(handle))

    def test_template_csv_still_reads(self):
        template = os.path.join(os.path.dirname(os.path.abspath(__file__)), "launch-catalog-template.csv")
        summary = dm.summarize_csv(template)
        self.assertEqual(summary["used"] + len(summary["skipped"]), self.count_rows(template))

    def test_output_separates_assumptions_from_confirmed(self):
        _, output = quiet(dm.from_csv, self.csv([{"product": "Wool coat", "cost_ex_vat_eur": "40", "retail_incl_vat_eur": "89"}]))
        self.assertIn("[confirmed ]", output)
        self.assertIn("[assumption]", output)
        self.assertIn("at least 13 orders/month", output)


if __name__ == "__main__":
    unittest.main()

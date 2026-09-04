import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BACKEND = ROOT / "backend"
if str(BACKEND) not in sys.path:
    sys.path.insert(0, str(BACKEND))

from app.api.routes import _normalize_category


class ExpenseApiHelperTests(unittest.TestCase):
    def test_normalize_category_trims_and_titles(self):
        self.assertEqual(_normalize_category(" food & dining "), "Food & Dining")
        self.assertEqual(_normalize_category("travel"), "Travel")


if __name__ == "__main__":
    unittest.main()

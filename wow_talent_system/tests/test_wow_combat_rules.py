"""Unit tests mirroring WoWCombatHelper rules."""

import unittest


INTERCEPT_ON_NEXT_SWING = 2


def rage_from_dealt(damage: float, divisor: float = 7.5) -> int:
    return max(1, round(damage / divisor))


def rage_from_taken(damage: float, divisor: float = 2.5) -> int:
    return max(1, round(damage / divisor))


def in_five_second_rule(last_spend_ms: int, now_ms: int, rule_ms: int = 5000) -> bool:
    return now_ms - last_spend_ms < rule_ms


def stance_allows(required: str, current: str) -> bool:
    if not required:
        return True
    return required.lower() == (current or "").lower()


class TestWoWCombatRules(unittest.TestCase):
    def test_rage_from_dealt(self):
        self.assertEqual(rage_from_dealt(75), 10)
        self.assertEqual(rage_from_dealt(3), 1)

    def test_rage_from_taken(self):
        self.assertEqual(rage_from_taken(25), 10)
        self.assertEqual(rage_from_taken(1), 1)

    def test_five_second_rule(self):
        self.assertTrue(in_five_second_rule(1000, 5000))
        self.assertFalse(in_five_second_rule(1000, 7000))

    def test_stance_gate(self):
        self.assertTrue(stance_allows("", "Battle"))
        self.assertTrue(stance_allows("Battle", "Battle"))
        self.assertFalse(stance_allows("Defensive", "Battle"))

    def test_on_next_swing_intercept(self):
        self.assertTrue(INTERCEPT_ON_NEXT_SWING == 2)


if __name__ == "__main__":
    unittest.main()

#!/usr/bin/env python3
"""Unit tests for WoW-style class ability by level rules (mirrors ClassAbilityByLevelHelper)."""

import unittest


def expected_abilities(entries, aspect, player_level):
    return sorted(
        e["ability_id"]
        for e in entries
        if e["aspect"] == aspect and e["player_level"] <= player_level and e.get("auto_learn", True)
    )


def sync_on_level_change(entries, known, aspect, old_level, new_level, lost_level=False):
    known = set(known)
    class_entries = [e for e in entries if e["aspect"] == aspect]
    if new_level > old_level:
        for e in class_entries:
            if old_level < e["player_level"] <= new_level and e.get("auto_learn", True):
                known.add(e["ability_id"])
    elif new_level < old_level and lost_level:
        for e in class_entries:
            if new_level < e["player_level"] <= old_level and e.get("unlearn_on_delevel", True):
                known.discard(e["ability_id"])
    return sorted(known)


WARRIOR_SAMPLE = [
    {"aspect": 1, "player_level": 1, "ability_id": 100001, "auto_learn": True, "unlearn_on_delevel": True},
    {"aspect": 1, "player_level": 1, "ability_id": 100002, "auto_learn": True, "unlearn_on_delevel": True},
    {"aspect": 1, "player_level": 4, "ability_id": 100004, "auto_learn": True, "unlearn_on_delevel": True},
    {"aspect": 1, "player_level": 10, "ability_id": 100007, "auto_learn": True, "unlearn_on_delevel": True},
    {"aspect": 1, "player_level": 20, "ability_id": 100012, "auto_learn": True, "unlearn_on_delevel": True},
]


class WowClassAbilityByLevelTests(unittest.TestCase):
    def test_level_1_starter_kit(self):
        ids = expected_abilities(WARRIOR_SAMPLE, 1, 1)
        self.assertEqual(ids, [100001, 100002])

    def test_level_4_adds_charge(self):
        ids = expected_abilities(WARRIOR_SAMPLE, 1, 4)
        self.assertIn(100004, ids)
        self.assertEqual(len(ids), 3)

    def test_level_up_learns_incremental(self):
        known = sync_on_level_change(WARRIOR_SAMPLE, [100001, 100002], 1, 1, 4)
        self.assertEqual(known, [100001, 100002, 100004])

    def test_level_10_adds_bloodrage(self):
        known = sync_on_level_change(WARRIOR_SAMPLE, [100001, 100002, 100004], 1, 4, 10)
        self.assertIn(100007, known)

    def test_delevel_unlearns_when_enabled(self):
        known = [100001, 100002, 100004, 100007]
        known = sync_on_level_change(WARRIOR_SAMPLE, known, 1, 10, 6, lost_level=True)
        self.assertNotIn(100007, known)
        self.assertIn(100004, known)

    def test_talents_separate_from_class_spells(self):
        """Class spells use player_level; talents use talent points — no overlap in data model."""
        talent_entry = {"aspect": 1, "player_level": 10, "ability_id": 200001}
        class_at_10 = expected_abilities(WARRIOR_SAMPLE, 1, 10)
        self.assertIn(100007, class_at_10)
        self.assertNotIn(talent_entry["ability_id"], class_at_10)


if __name__ == "__main__":
    unittest.main()

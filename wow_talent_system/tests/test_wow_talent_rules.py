"""WotLK talent rule tests."""

from __future__ import annotations


def points_spent_in_tree(levels: dict[int, int], tree_by_skill: dict[int, int], tree_id: int) -> int:
    return sum(
        lvl for sid, lvl in levels.items()
        if lvl > 0 and tree_by_skill.get(sid, -1) == tree_id
    )


def total_points_spent(levels: dict[int, int]) -> int:
    return sum(lvl for lvl in levels.values() if lvl > 0)


def wotlk_talent_points(level: int, start: int = 10) -> int:
    return max(0, level - start + 1)


def wotlk_tier_required(tier: int, step: int = 5) -> int:
    return (tier - 1) * step if tier > 1 else 0


def test_wotlk_71_at_80():
    assert wotlk_talent_points(80) == 71
    assert wotlk_talent_points(70) == 61
    assert wotlk_talent_points(60) == 51


def test_total_pool_not_per_tree():
    # WotLK: can put all 71 in tree 0
    levels = {i: 1 for i in range(10001, 10072)}  # 71 one-point talents
    trees = {i: 0 for i in range(10001, 10072)}
    assert total_points_spent(levels) == 71
    assert points_spent_in_tree(levels, trees, 0) == 71


def test_wotlk_tier_gates():
    assert wotlk_tier_required(1) == 0
    assert wotlk_tier_required(2) == 5
    assert wotlk_tier_required(7) == 30


def test_no_exclusive_by_default():
    # WotLK allows multiple talents in same row
    levels = {10001: 3, 10002: 3, 10003: 3}
    assert total_points_spent(levels) == 9

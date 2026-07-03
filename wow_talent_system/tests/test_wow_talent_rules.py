"""Mirror tests for WoW talent tree point / exclusive group rules."""

from __future__ import annotations


def points_spent_in_tree(levels: dict[int, int], tree_by_skill: dict[int, int], cost_by_skill: dict[int, int], tree_id: int) -> int:
    spent = 0
    for skill_id, level in levels.items():
        if level <= 0:
            continue
        if tree_by_skill.get(skill_id, -1) != tree_id:
            continue
        spent += level * max(1, cost_by_skill.get(skill_id, 1))
    return spent


def find_exclusive_conflict(
    skill_id: int,
    levels: dict[int, int],
    exclusive_group: dict[int, int],
    tree_by_skill: dict[int, int],
) -> int | None:
    group = exclusive_group.get(skill_id, 0)
    if group <= 0:
        return None
    tree = tree_by_skill.get(skill_id, -1)
    for other_id, lvl in levels.items():
        if other_id == skill_id or lvl <= 0:
            continue
        if exclusive_group.get(other_id, 0) == group and tree_by_skill.get(other_id, -1) == tree:
            return other_id
    return None


def wow_talent_points_for_level(level: int, start: int = 10, per_level: int = 1) -> int:
    return max(0, level - start + 1) * per_level


def test_tree_points_spent():
    levels = {10001: 3, 10002: 2, 20001: 5}
    trees = {10001: 0, 10002: 0, 20001: 1}
    costs = {10001: 1, 10002: 1, 20001: 1}
    assert points_spent_in_tree(levels, trees, costs, 0) == 5
    assert points_spent_in_tree(levels, trees, costs, 1) == 5


def test_exclusive_branch_blocks_sibling():
    levels = {10001: 2}
    groups = {10001: 301, 10002: 301, 10003: 301}
    trees = {10001: 0, 10002: 0, 10003: 0}
    assert find_exclusive_conflict(10002, levels, groups, trees) == 10001
    assert find_exclusive_conflict(10001, levels, groups, trees) is None


def test_wow_points_from_level_10():
    assert wow_talent_points_for_level(9) == 0
    assert wow_talent_points_for_level(10) == 1
    assert wow_talent_points_for_level(60) == 51

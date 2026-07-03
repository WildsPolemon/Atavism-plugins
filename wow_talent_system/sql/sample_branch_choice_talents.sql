-- Example: Arms warrior tier-3 branch choice (pick ONE of three talents in the same row).
-- Replace skill IDs / aspect / abilities with your project data.
-- exclusive_group: talents sharing the same positive ID in one tree are mutually exclusive.

-- Tree 0 = Arms, aspect = your warrior class id (example: 1)
-- Tier 3 row, 5 points required in tree (Classic WoW tier gate)

-- UPDATE `skills` SET
--   talent = 1, tree_id = 0, tier = 3, `column` = 1,
--   tree_points_required = 5, exclusive_group = 301,
--   maxLevel = 5, skillPointCost = 1, playerLevelReq = 10, aspect = 1, mainAspectOnly = 1
-- WHERE id = 10001; -- Improved Heroic Strike

-- UPDATE `skills` SET
--   talent = 1, tree_id = 0, tier = 3, `column` = 2,
--   tree_points_required = 5, exclusive_group = 301,
--   maxLevel = 3, skillPointCost = 1, playerLevelReq = 10, aspect = 1, mainAspectOnly = 1
-- WHERE id = 10002; -- Deflection (branch B)

-- UPDATE `skills` SET
--   talent = 1, tree_id = 0, tier = 3, `column` = 3,
--   tree_points_required = 5, exclusive_group = 301,
--   maxLevel = 2, skillPointCost = 1, playerLevelReq = 10, aspect = 1, mainAspectOnly = 1
-- WHERE id = 10003; -- Improved Rend (branch C)

-- WoW Classic tier point gates (set tree_points_required on each tier row):
-- Tier 2: 5, Tier 3: 10, Tier 4: 15, Tier 5: 20, Tier 6: 25, Tier 7: 30, Tier 8: 35, Tier 9: 40, Tier 10: 45

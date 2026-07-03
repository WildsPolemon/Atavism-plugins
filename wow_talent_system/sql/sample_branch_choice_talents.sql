-- WotLK example: Arms warrior tier row (NO exclusive_group — all 3 can be taken if you have points).
-- Set tree_points_required=0 to use auto formula (tier-1)*5.

-- Tier 1 (0 points in tree): column talents
-- UPDATE skills SET talent=1, tree_id=0, tier=1, `column`=2, tree_points_required=0,
--   exclusive_group=0, maxLevel=5, skillPointCost=1, playerLevelReq=10, aspect=1, mainAspectOnly=1
-- WHERE id=10001;

-- Tier 2 (5 points in tree)
-- UPDATE skills SET tier=2, tree_points_required=0 WHERE id IN (10010,10011,10012);

-- Vertical prereq: child.parentSkill = talent directly above in same column
-- UPDATE skills SET parentSkill=10001, parentSkillLevelReq=1 WHERE id=10010;

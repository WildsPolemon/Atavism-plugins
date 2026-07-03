-- WotLK talent progression defaults (3.3.5: 1 point/level from 10, 71 total at level 80).

INSERT INTO `game_setting` (`name`, `value`, `isactive`)
VALUES
  ('TALENT_POINTS_START_LEVEL', '10', 1),
  ('TALENT_POINTS_PER_LEVEL', '1', 1),
  ('TALENT_TIER_POINT_STEP', '5', 1),
  ('TALENT_TREE_MAX_POINTS', '0', 1),
  ('TALENT_EXCLUSIVE_GROUPS_ENABLED', '0', 1),
  ('TALENT_SWITCH_REQUIRES_OUT_OF_COMBAT', '1', 1),
  ('TALENT_RESET_REQUIRES_OUT_OF_COMBAT', '1', 1),
  ('TALENT_LOADOUT_COUNT', '2', 1),
  ('TALENT_RESET_CURRENCY_ID', '-1', 1),
  ('TALENT_RESET_CURRENCY_COST', '0', 1),
  ('TALENT_POINTS_GIVEN_PER_LEVEL', '0', 1)
ON DUPLICATE KEY UPDATE `value` = VALUES(`value`);

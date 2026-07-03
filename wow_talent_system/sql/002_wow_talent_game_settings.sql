-- WoW-style talent progression defaults (Classic: 1 point/level from level 10, 51 per tree max).

INSERT INTO `game_setting` (`name`, `value`, `isactive`)
VALUES
  ('TALENT_POINTS_START_LEVEL', '10', 1),
  ('TALENT_POINTS_PER_LEVEL', '1', 1),
  ('TALENT_TREE_MAX_POINTS', '51', 1),
  ('TALENT_LOADOUT_COUNT', '2', 1),
  ('TALENT_RESET_CURRENCY_ID', '-1', 1),
  ('TALENT_RESET_CURRENCY_COST', '0', 1),
  ('TALENT_POINTS_GIVEN_PER_LEVEL', '0', 1)
ON DUPLICATE KEY UPDATE `value` = VALUES(`value`);

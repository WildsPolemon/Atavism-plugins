-- WoW-style class abilities learned at character level (separate from talent points).
-- Map `aspect` to your class ID (same as skills.aspect / CharacterTemplate aspect).
-- Replace `ability_id` with real IDs from your `abilities` table.

CREATE TABLE IF NOT EXISTS `class_ability_by_level` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `aspect` INT NOT NULL COMMENT 'Class aspect ID (e.g. 1=Warrior)',
  `player_level` INT NOT NULL COMMENT 'Character level when spell is learned',
  `ability_id` INT NOT NULL COMMENT 'abilities.id',
  `auto_learn` TINYINT(1) NOT NULL DEFAULT 1,
  `unlearn_on_delevel` TINYINT(1) NOT NULL DEFAULT 1,
  `sort_order` INT NOT NULL DEFAULT 0,
  `isactive` TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  KEY `idx_aspect_level` (`aspect`, `player_level`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO `game_settings` (`setting_key`, `setting_value`, `description`)
VALUES ('CLASS_ABILITIES_BY_LEVEL_ENABLED', 'true', 'Auto-learn class spells from class_ability_by_level on level-up')
ON DUPLICATE KEY UPDATE `setting_value` = VALUES(`setting_value`);

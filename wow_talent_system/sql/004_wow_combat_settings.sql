-- WotLK-style combat layer for AGIS (WoWCombatHelper).
-- Requires a `rage` vitality stat (and optionally `mana`) configured in your stats profile.

INSERT INTO `game_settings` (`setting_key`, `setting_value`, `description`) VALUES
  ('WOW_COMBAT_ENABLED', 'true', 'Enable WotLK-inspired combat rules (stances, rage, on-next-swing, 5SR)'),
  ('WOW_RAGE_STAT', 'rage', 'Vitality stat name used for warrior-style rage'),
  ('WOW_MANA_STAT', 'mana', 'Vitality stat name for 5-second rule mana regen gate'),
  ('WOW_RAGE_GEN_DEALT_DIVISOR', '7.5', 'Rage gained per damage dealt = damage / divisor'),
  ('WOW_RAGE_GEN_TAKEN_DIVISOR', '2.5', 'Rage gained per damage taken = damage / divisor'),
  ('WOW_RAGE_OOC_DECAY', '1', 'Rage lost per regen tick while out of combat'),
  ('WOW_MANA_FIVE_SECOND_RULE_MS', '5000', 'Milliseconds after mana spend before spirit-style regen resumes'),
  ('WOW_GLOBAL_COOLDOWN', '1.5', 'Global cooldown seconds when WoW combat mode is enabled'),
  ('GLOBAL_COOLDOWN', '1.5', 'Override default GCD to WotLK 1.5s')
ON DUPLICATE KEY UPDATE `setting_value` = VALUES(`setting_value`);

-- Optional: stance requirement on abilities (Battle/Defensive/Berserker via CombatInfo.state).
-- ALTER TABLE `abilities` ADD COLUMN `stanceReq` VARCHAR(64) NOT NULL DEFAULT '' AFTER `interceptType`;

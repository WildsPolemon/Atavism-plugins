CREATE TABLE `world_content`.`item_audio_profile` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(68) NOT NULL DEFAULT '',
  `use_event` VARCHAR(256) NOT NULL DEFAULT '',
  `drag_begin_event` VARCHAR(256) NOT NULL DEFAULT '',
  `drag_end_event` VARCHAR(256) NOT NULL DEFAULT '',
  `delete_event` VARCHAR(256) NOT NULL DEFAULT '',
  `broke_event` VARCHAR(256) NOT NULL DEFAULT '',
  `pick_up_event` VARCHAR(256) NOT NULL DEFAULT '',
  `fall_event` VARCHAR(256) NOT NULL DEFAULT '',
  `drop_event` VARCHAR(256) NOT NULL DEFAULT '',
  `isactive` TINYINT(1) NULL DEFAULT '1',
  `creationtimestamp` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
  `updatetimestamp` DATETIME NULL DEFAULT '2000-01-01 00:00:00',
  PRIMARY KEY (`id`));

ALTER TABLE `world_content`.`item_templates`
ADD COLUMN `ground_prefab` VARCHAR(128) NOT NULL DEFAULT '' AFTER `repairable`,
ADD COLUMN `audio_profile_id` INT NOT NULL DEFAULT -1 AFTER `ground_prefab`;



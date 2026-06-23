CREATE TABLE `world_content`.`stat_profile` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(64) NOT NULL,
  `isactive` tinyint(1) DEFAULT '1',
  `creationtimestamp` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updatetimestamp` datetime DEFAULT '2000-01-01 00:00:00',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE `world_content`.`stat_profile_stats` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `profile_id` int(11) NOT NULL,
  `stat_id` int(11) NOT NULL,
  `value` int(11) NOT NULL DEFAULT '0',
  `level_increase`  float NOT NULL DEFAULT '0',
  `level_percent_increase`  float NOT NULL DEFAULT '0',
  `send_to_client` tinyint(1) DEFAULT '1',
  `creationtimestamp` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updatetimestamp` datetime DEFAULT '2000-01-01 00:00:00',
  PRIMARY KEY (`id`),
  KEY `profile_id` (`profile_id`),
  KEY `profile_id2` (`profile_id`, `send_to_client`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

ALTER TABLE `world_content`.`mob_templates`
ADD COLUMN `stat_profile_id` INT(11) NULL DEFAULT '-1' AFTER `behavior_profile_id`;

ALTER TABLE `world_content`.`character_create_template`
ADD COLUMN `stat_profile_id` INT(11) NULL DEFAULT '-1' AFTER `dodge`;

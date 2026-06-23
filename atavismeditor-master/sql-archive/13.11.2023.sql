CREATE TABLE `weapon_templates_profile` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(86) DEFAULT NULL,
  `isactive` tinyint(1) DEFAULT '1',
  `creationtimestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatetimestamp` datetime NOT NULL DEFAULT '2000-01-01 00:00:00',
  PRIMARY KEY (`id`)
)  ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8;

CREATE TABLE `weapon_action_settings` (
  `id` int NOT NULL AUTO_INCREMENT ,
  `profile_id` int NOT NULL DEFAULT '1',
  `action_id` int DEFAULT NULL,
  `slot` varchar(256) DEFAULT '',
  `ability_id` int DEFAULT '-1',
  `zoom` tinyint(1) DEFAULT '1',
  `coordeffect` varchar(256) DEFAULT NULL,
  `isactive` tinyint(1) DEFAULT '1',
  `creationtimestamp` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updatetimestamp` datetime DEFAULT '2000-01-01 00:00:00',
  PRIMARY KEY (`id`,`profile_id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8;

INSERT INTO `editor_option` (`id`, `optionType`, `deletable`, `isactive`, `creationtimestamp`, `updatetimestamp`) VALUES (NULL, 'Weapon Actions', '0', '1', CURRENT_TIMESTAMP, '2000-01-01 00:00:00.000000');

ALTER TABLE `item_templates`
ADD COLUMN `weapon_profile_id` INT NOT NULL DEFAULT '-1' AFTER `enchant_profile_id`;


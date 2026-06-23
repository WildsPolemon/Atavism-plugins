alter table damage_type add column power_stat varchar(256) NOT NULL after resistance_stat;
alter table damage_type add column accuracy_stat varchar(256) NOT NULL after power_stat;
alter table damage_type add column evasion_stat varchar(256) NOT NULL after accuracy_stat;
alter table damage_type add column critic_chance_stat varchar(256) NOT NULL after evasion_stat;
alter table damage_type add column critic_power_stat varchar(64) NOT NULL after critic_chance_stat;

alter table character_create_template add column `race_icon` varchar(256) NOT NULL DEFAULT '' after autoAttack;
alter table character_create_template add column `race_icon2` mediumtext NOT NULL after race_icon;
alter table character_create_template add column `class_icon` varchar(256) NOT NULL DEFAULT '' after race_icon2;
alter table character_create_template add column `class_icon2` mediumtext NOT NULL after class_icon;
alter table character_create_template add column `race_description` varchar(2048) NOT NULL DEFAULT '' after class_icon2;
alter table character_create_template add column `class_description` varchar(2048) NOT NULL DEFAULT '' after race_description;

CREATE TABLE `character_create_gender` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `character_create_id` int(11) NOT NULL,
  `gender` int(11) NOT NULL,
  `model` varchar(256) NOT NULL DEFAULT '',
  `icon` varchar(512) NOT NULL DEFAULT '',
  `icon2` mediumtext NOT NULL,
  `isactive` tinyint(1) DEFAULT '1',
  `creationtimestamp` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updatetimestamp` datetime DEFAULT '2000-01-01 00:00:00',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8 AVG_ROW_LENGTH=442;


UPDATE `abilities` SET `weaponRequired` = '' WHERE `weaponRequired` = '~ none ~';
UPDATE `abilities` SET `weaponRequired` = '9' WHERE `weaponRequired` = 'Bow';
UPDATE `abilities` SET `weaponRequired` = '8' WHERE `weaponRequired` = 'Staff';
UPDATE `abilities` SET `weaponRequired` = '98' WHERE `weaponRequired` = 'Greatsword';

ALTER table abilities ADD column `damageType` varchar(256) NOT NULL DEFAULT '' after attack_building;

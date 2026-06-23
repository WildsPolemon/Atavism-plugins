
ALTER TABLE `abilities` ADD `checkBusy` tinyint(1) NOT NULL DEFAULT '1' AFTER `combatState`;
ALTER TABLE `abilities` ADD `weaponMustBeDrawn` tinyint(1) NOT NULL DEFAULT '0' AFTER `checkBusy`;
ALTER TABLE `abilities` ADD `makeBusy` tinyint(1) NOT NULL DEFAULT '1' AFTER `combatState`;
ALTER TABLE `abilities` ADD `drawnWeaponBefore` tinyint(1) NOT NULL DEFAULT '0' AFTER `weaponMustBeDrawn`;

ALTER TABLE `item_templates` ADD `drawWeaponEffect` VARCHAR(256) NOT NULL DEFAULT '' AFTER `display`;
ALTER TABLE `item_templates` ADD `drawWeaponTime` INT NOT NULL DEFAULT '1' AFTER `drawWeaponEffect`;
ALTER TABLE `item_templates` ADD `holsteringWeaponEffect` VARCHAR(256) NOT NULL DEFAULT '' AFTER `drawWeaponTime`;
ALTER TABLE `item_templates` ADD `holsteringWeaponTime` INT NOT NULL DEFAULT '1' AFTER `holsteringWeaponEffect`;


INSERT INTO `editor_option` (`id`, `optionType`, `deletable`, `isactive`, `creationtimestamp`, `updatetimestamp`) VALUES (NULL, 'Slots Sets', '0', '1', CURRENT_TIMESTAMP, '2000-01-01 00:00:00.000000');


CREATE TABLE `item_slots_sets` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `slot_id` int(11) DEFAULT NULL,
  `set_id` int(11) DEFAULT NULL,
  `race` int(11) DEFAULT NULL,
  `class` int(11) DEFAULT NULL,
  `creationtimestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatetimestamp` datetime NOT NULL DEFAULT '2000-01-01 00:00:00',
  PRIMARY KEY (`id`),
  INDEX(`slot_id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8;

ALTER TABLE `abilities` ADD `enemyTargetChangeToSelf` tinyint(1) NOT NULL DEFAULT '0' AFTER `drawnWeaponBefore`;


ALTER TABLE `skills` ADD `primaryStatValue` int(11) NOT NULL DEFAULT '0' AFTER `primaryStat`,
 ADD `primaryStatInterval` int(11) NOT NULL DEFAULT '0' AFTER `primaryStatValue`,
 ADD `secondaryStatValue` int(11) NOT NULL DEFAULT '0' AFTER `secondaryStat`,
 ADD `secondaryStatInterval` int(11) NOT NULL DEFAULT '0' AFTER `secondaryStatValue`,
 ADD `thirdStatValue` int(11) NOT NULL DEFAULT '0' AFTER `thirdStat`,
 ADD `thirdStatInterval` int(11) NOT NULL DEFAULT '0' AFTER `thirdStatValue`,
 ADD `fourthStatValue` int(11) NOT NULL DEFAULT '0' AFTER `fourthStat`,
 ADD `fourthStatInterval` int(11) NOT NULL DEFAULT '0' AFTER `fourthStatValue`;

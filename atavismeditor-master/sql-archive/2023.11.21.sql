CREATE TABLE `abilities_powerup_settings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `ability_id` int(11) DEFAULT NULL,
  `thresholdMaxTime` FLOAT NOT NULL ,
  PRIMARY KEY (`id`),
  INDEX(`ability_id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8;


CREATE TABLE `abilities_coordeffects` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `abilityPowerId` int(11) DEFAULT NULL,
  `coordEffectEvent` VARCHAR(64) NOT NULL DEFAULT '',
  `coordEffect` VARCHAR(128) NOT NULL DEFAULT '',
  PRIMARY KEY (`id`),
  INDEX(`abilityPowerId`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8;


ALTER TABLE `abilities` ADD `powerUpCoordEffect` VARCHAR(128) NOT NULL DEFAULT '' AFTER `combatState`;

ALTER TABLE `world_content`.`item_templates`
CHANGE COLUMN `drawWeaponEffect` `drawWeaponEffect1` VARCHAR(256) NOT NULL DEFAULT '' ,
CHANGE COLUMN `drawWeaponTime` `drawWeaponTime1` INT NOT NULL DEFAULT '1' ,
CHANGE COLUMN `holsteringWeaponEffect` `holsteringWeaponEffect1` VARCHAR(256) NOT NULL DEFAULT '' ,
CHANGE COLUMN `holsteringWeaponTime` `holsteringWeaponTime1` INT NOT NULL DEFAULT '1' ;

ALTER TABLE `item_templates` ADD `drawWeaponEffect2` VARCHAR(256) NOT NULL DEFAULT '' AFTER `holsteringWeaponTime1`;
ALTER TABLE `item_templates` ADD `drawWeaponTime2` INT NOT NULL DEFAULT '1' AFTER `drawWeaponEffect2`;
ALTER TABLE `item_templates` ADD `holsteringWeaponEffect2` VARCHAR(256) NOT NULL DEFAULT '' AFTER `drawWeaponTime2`;
ALTER TABLE `item_templates` ADD `holsteringWeaponTime2` INT NOT NULL DEFAULT '1' AFTER `holsteringWeaponEffect2`;
ALTER TABLE `item_templates` ADD `drawWeaponEffect3` VARCHAR(256) NOT NULL DEFAULT '' AFTER `holsteringWeaponTime2`;
ALTER TABLE `item_templates` ADD `drawWeaponTime3` INT NOT NULL DEFAULT '1' AFTER `drawWeaponEffect3`;
ALTER TABLE `item_templates` ADD `holsteringWeaponEffect3` VARCHAR(256) NOT NULL DEFAULT '' AFTER `drawWeaponTime3`;
ALTER TABLE `item_templates` ADD `holsteringWeaponTime3` INT NOT NULL DEFAULT '1' AFTER `holsteringWeaponEffect3`;
ALTER TABLE `item_templates` ADD `drawWeaponEffect4` VARCHAR(256) NOT NULL DEFAULT '' AFTER `holsteringWeaponTime3`;
ALTER TABLE `item_templates` ADD `drawWeaponTime4` INT NOT NULL DEFAULT '1' AFTER `drawWeaponEffect4`;
ALTER TABLE `item_templates` ADD `holsteringWeaponEffect4` VARCHAR(256) NOT NULL DEFAULT '' AFTER `drawWeaponTime4`;
ALTER TABLE `item_templates` ADD `holsteringWeaponTime4` INT NOT NULL DEFAULT '1' AFTER `holsteringWeaponEffect4`;
ALTER TABLE `item_templates` ADD `drawWeaponEffect5` VARCHAR(256) NOT NULL DEFAULT '' AFTER `holsteringWeaponTime4`;
ALTER TABLE `item_templates` ADD `drawWeaponTime5` INT NOT NULL DEFAULT '1' AFTER `drawWeaponEffect5`;
ALTER TABLE `item_templates` ADD `holsteringWeaponEffect5` VARCHAR(256) NOT NULL DEFAULT '' AFTER `drawWeaponTime5`;
ALTER TABLE `item_templates` ADD `holsteringWeaponTime5` INT NOT NULL DEFAULT '1' AFTER `holsteringWeaponEffect5`;
ALTER TABLE `item_templates` ADD `drawWeaponEffect6` VARCHAR(256) NOT NULL DEFAULT '' AFTER `holsteringWeaponTime5`;
ALTER TABLE `item_templates` ADD `drawWeaponTime6` INT NOT NULL DEFAULT '1' AFTER `drawWeaponEffect6`;
ALTER TABLE `item_templates` ADD `holsteringWeaponEffect6` VARCHAR(256) NOT NULL DEFAULT '' AFTER `drawWeaponTime6`;
ALTER TABLE `item_templates` ADD `holsteringWeaponTime6` INT NOT NULL DEFAULT '1' AFTER `holsteringWeaponEffect6`;
ALTER TABLE `item_templates` ADD `drawWeaponEffect7` VARCHAR(256) NOT NULL DEFAULT '' AFTER `holsteringWeaponTime6`;
ALTER TABLE `item_templates` ADD `drawWeaponTime7` INT NOT NULL DEFAULT '1' AFTER `drawWeaponEffect7`;
ALTER TABLE `item_templates` ADD `holsteringWeaponEffect7` VARCHAR(256) NOT NULL DEFAULT '' AFTER `drawWeaponTime7`;
ALTER TABLE `item_templates` ADD `holsteringWeaponTime7` INT NOT NULL DEFAULT '1' AFTER `holsteringWeaponEffect7`;
ALTER TABLE `item_templates` ADD `drawWeaponEffect8` VARCHAR(256) NOT NULL DEFAULT '' AFTER `holsteringWeaponTime7`;
ALTER TABLE `item_templates` ADD `drawWeaponTime8` INT NOT NULL DEFAULT '1' AFTER `drawWeaponEffect8`;
ALTER TABLE `item_templates` ADD `holsteringWeaponEffect8` VARCHAR(256) NOT NULL DEFAULT '' AFTER `drawWeaponTime8`;
ALTER TABLE `item_templates` ADD `holsteringWeaponTime8` INT NOT NULL DEFAULT '1' AFTER `holsteringWeaponEffect8`;
ALTER TABLE `item_templates` ADD `drawWeaponEffect9` VARCHAR(256) NOT NULL DEFAULT '' AFTER `holsteringWeaponTime8`;
ALTER TABLE `item_templates` ADD `drawWeaponTime9` INT NOT NULL DEFAULT '1' AFTER `drawWeaponEffect9`;
ALTER TABLE `item_templates` ADD `holsteringWeaponEffect9` VARCHAR(256) NOT NULL DEFAULT '' AFTER `drawWeaponTime9`;
ALTER TABLE `item_templates` ADD `holsteringWeaponTime9` INT NOT NULL DEFAULT '1' AFTER `holsteringWeaponEffect9`;
ALTER TABLE `item_templates` ADD `drawWeaponEffect10` VARCHAR(256) NOT NULL DEFAULT '' AFTER `holsteringWeaponTime9`;
ALTER TABLE `item_templates` ADD `drawWeaponTime10` INT NOT NULL DEFAULT '1' AFTER `drawWeaponEffect10`;
ALTER TABLE `item_templates` ADD `holsteringWeaponEffect10` VARCHAR(256) NOT NULL DEFAULT '' AFTER `drawWeaponTime10`;
ALTER TABLE `item_templates` ADD `holsteringWeaponTime10` INT NOT NULL DEFAULT '1' AFTER `holsteringWeaponEffect10`;

ALTER TABLE `item_templates` ADD `slot1` VARCHAR(86) NOT NULL DEFAULT '' AFTER `display`;
ALTER TABLE `item_templates` ADD `slot2` VARCHAR(86) NOT NULL DEFAULT '' AFTER `holsteringWeaponTime1`;
ALTER TABLE `item_templates` ADD `slot3` VARCHAR(86) NOT NULL DEFAULT '' AFTER `holsteringWeaponTime2`;
ALTER TABLE `item_templates` ADD `slot4` VARCHAR(86) NOT NULL DEFAULT '' AFTER `holsteringWeaponTime3`;
ALTER TABLE `item_templates` ADD `slot5` VARCHAR(86) NOT NULL DEFAULT '' AFTER `holsteringWeaponTime4`;
ALTER TABLE `item_templates` ADD `slot6` VARCHAR(86) NOT NULL DEFAULT '' AFTER `holsteringWeaponTime5`;
ALTER TABLE `item_templates` ADD `slot7` VARCHAR(86) NOT NULL DEFAULT '' AFTER `holsteringWeaponTime6`;
ALTER TABLE `item_templates` ADD `slot8` VARCHAR(86) NOT NULL DEFAULT '' AFTER `holsteringWeaponTime7`;
ALTER TABLE `item_templates` ADD `slot9` VARCHAR(86) NOT NULL DEFAULT '' AFTER `holsteringWeaponTime8`;
ALTER TABLE `item_templates` ADD `slot10` VARCHAR(86) NOT NULL DEFAULT '' AFTER `holsteringWeaponTime9`;

ALTER TABLE `world_content`.`abilities`
ADD COLUMN `attack_time` FLOAT NOT NULL DEFAULT '0' AFTER `activationLength`;

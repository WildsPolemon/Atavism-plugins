-- interactive objects profile
ALTER TABLE `world_content`.`interactive_object`
ADD COLUMN `profileId` INT NOT NULL DEFAULT '-1' AFTER `respawnTime`
ADD COLUMN `despawnDelay` FLOAT NULL DEFAULT '0' AFTER `profileId`,
ADD COLUMN `despawnTime` FLOAT NULL DEFAULT '0' AFTER `despawnDelay`,
ADD COLUMN `makeBusy` TINYINT NULL DEFAULT '1' AFTER `despawnTime`,
ADD COLUMN `useLimit` INT NULL DEFAULT '-1' AFTER `makeBusy`
ADD COLUMN `minLevel` INT NULL DEFAULT '1' AFTER `useLimit`,
ADD COLUMN `maxLevel` INT NULL DEFAULT '99' AFTER `minLevel`,
ADD COLUMN `itemReq` INT NULL DEFAULT '-1' AFTER `maxLevel`,
ADD COLUMN `itemCountReq` INT NULL DEFAULT '1' AFTER `itemReq`,
ADD COLUMN `currencyReq` INT NULL DEFAULT '-1' AFTER `itemCountReq`,
ADD COLUMN `currencyCountReq` INT NULL DEFAULT '1' AFTER `currencyReq`,
ADD COLUMN `icon` VARCHAR(256) NULL DEFAULT '' AFTER `maxLevel`,
ADD COLUMN `interactDistance` FLOAT NULL DEFAULT '9' AFTER `interactTimeReq`,
ADD COLUMN `icon2` MEDIUMTEXT NOT NULL AFTER `icon`,
ADD COLUMN `itemReqGet` TINYINT NULL DEFAULT '1' AFTER `itemCountReq`,
ADD COLUMN `currencyReqGet` TINYINT NULL DEFAULT '1' AFTER `currencyCountReq`;


CREATE TABLE `world_content`.`interactive_object_coordeffects` (
                                                                 `id` INT NOT NULL AUTO_INCREMENT,
                                                                 `objId` INT NOT NULL,
                                                                 `coordEffect` VARCHAR(256) NULL DEFAULT '',
                                                                 `order` INT NOT NULL,
                                                                 PRIMARY KEY (`id`));



-- Pets
CREATE TABLE `world_content`.`pet_profile` (
                                             `id` INT NOT NULL AUTO_INCREMENT,
                                             `name` VARCHAR(84) NOT NULL DEFAULT '',
                                             `isactive` TINYINT(1) NULL DEFAULT '1',
                                             `creationtimestamp` TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
                                             `updatetimestamp` DATETIME NULL DEFAULT '2000-01-01 00:00:00',
                                             PRIMARY KEY (`id`));

CREATE TABLE `world_content`.`pet_profile_level` (
                                                   `id` INT NOT NULL AUTO_INCREMENT,
                                                   `profile_id` INT NOT NULL,
                                                   `level` INT NOT NULL DEFAULT '1',
                                                   `exp` INT NOT NULL DEFAULT '1',
                                                   `template_id` INT NOT NULL DEFAULT '-1',
                                                   `coordEffect` VARCHAR(256) NULL DEFAULT '',
                                                   PRIMARY KEY (`id`));

ALTER TABLE `pet_profile_level` ADD INDEX(`pet_profile_id`);

CREATE TABLE `admin`.`player_pets` (
                                     `world_name` VARCHAR(64) NOT NULL,
                                     `player_oid` BIGINT NOT NULL,
                                     `pet_profile` INT NOT NULL,
                                     `level` INT NOT NULL DEFAULT '1',
                                     `exp` BIGINT NOT NULL DEFAULT '0',
                                     `equip_bag_oid` BIGINT NOT NULL DEFAULT '0');

ALTER TABLE `player_pets` ADD INDEX(`player_oid`, `pet_profile`, `world_name`);

ALTER TABLE `world_content`.`mob_templates`
  ADD COLUMN `pet_count_stat` INT NULL DEFAULT '-1' AFTER `addExplev`;


CREATE TABLE `world_content`.`slots_profile` (
                                               `id` int NOT NULL AUTO_INCREMENT,
                                               `name` varchar(32) NOT NULL,
                                               `isactive` tinyint(1) DEFAULT '1',
                                               `creationtimestamp` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
                                               `updatetimestamp` datetime DEFAULT '2000-01-01 00:00:00',
                                               PRIMARY KEY (`id`));


CREATE TABLE `slots_in_profile` (
                                  `id` int NOT NULL AUTO_INCREMENT,
                                  `slot_profile_id` int NOT NULL,
                                  `slot_id` int NOT NULL,
                                  PRIMARY KEY (`id`));

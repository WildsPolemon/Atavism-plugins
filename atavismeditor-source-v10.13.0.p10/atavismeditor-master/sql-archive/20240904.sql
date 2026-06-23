ALTER TABLE `world_content`.`stat`
ADD COLUMN `id` INT NOT NULL AUTO_INCREMENT FIRST,
ADD COLUMN `max` BIGINT(64) NULL DEFAULT '-1' AFTER `min`,
ADD COLUMN `stat_precision` INT NULL DEFAULT '1' AFTER `shiftModStat`,
DROP PRIMARY KEY,
ADD PRIMARY KEY (`id`);

INSERT INTO `world_content`.`stat` (`id`, `name`, `type`, `stat_function`, `mob_base`, `mob_level_increase`, `mob_level_percent_increase`, `min`, `maxstat`, `canExceedMax`, `sharedWithGroup`, `shiftTarget`, `shiftValue`, `shiftReverseValue`, `shiftInterval`, `isShiftPercent`, `onMaxHit`, `onMinHit`, `shiftReq1`, `shiftReq1State`, `shiftReq1SetReverse`, `shiftReq2`, `shiftReq2State`, `shiftReq2SetReverse`, `shiftReq3`, `shiftReq3State`, `shiftReq3SetReverse`, `startPercent`, `deathResetPercent`, `releaseResetPercent`, `sendToClient`, `threshold`, `threshold2`, `threshold3`, `threshold4`, `shiftModStat`, `stat_precision`, `isactive`, `creationtimestamp`, `updatetimestamp`) VALUES (NULL, 'experience-max', '0', '~ none ~', '0', '0', '0', '0', '', '0', '0', '0', '0', '0', '0', '0', '~ none ~', '~ none ~', '~ none ~', '0', '0', '~ none ~', '0', '0', '~ none ~', '0', '0', '50', '-1', '-1', '1', '-1', '-1', '-1', '-1', '', '1', '1', '1999-12-31 18:00:00', '2020-09-16 13:46:21');
INSERT INTO `world_content`.`stat` (`name`, `type`, `stat_function`, `mob_base`, `mob_level_increase`, `mob_level_percent_increase`, `min`, `max`, `maxstat`) VALUES ('experience', '3', '', '0', '0', '0', '0', '-1', 'experience-max');
INSERT INTO `world_content`.`stat` (`name`, `type`, `min`, `max`) VALUES ('dmg-base', '4', '0', '2000');
INSERT INTO `world_content`.`stat` (`name`, `type`, `min`, `max`) VALUES ('dmg-max', '4', '0', '2000');
INSERT INTO `world_content`.`stat` (`name`, `type`, `min`, `max`) VALUES ('dmg-dealt-mod', '4', '-100', '100');
INSERT INTO `world_content`.`stat` (`name`, `type`, `min`, `max`) VALUES ('dmg-taken-mod', '4', '-100', '100');
INSERT INTO `world_content`.`stat` (`name`, `type`, `min`, `max`) VALUES ('gearScore', '4', '0', '1000000000');
INSERT INTO `world_content`.`stat` (`name`, `type`, `min`, `max`) VALUES ('level', '4', '0', '10000');


ALTER TABLE `world_content`.`stat_profile_stats` CHANGE `stat_id` `stat_id` INT(11) NOT NULL;

ALTER TABLE `world_content`.`stat_link` ADD `stat_id` INT(11) NOT NULL AFTER `id`;

UPDATE `world_content`.`stat_link`
INNER JOIN `world_content`.`stat` ON `stat`.`name` = `stat_link`.`stat`
SET `stat_link`.`stat_id` = IF(`stat`.id > 0, `stat`.id, `stat_link`.stat_id)
WHERE `stat`.id > 0;





ALTER TABLE `world_content`.`stat_link`
ADD COLUMN `pointsForChange` INT NULL DEFAULT '1' AFTER `statTo`;

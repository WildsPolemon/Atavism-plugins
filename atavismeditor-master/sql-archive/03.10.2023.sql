INSERT INTO `editor_option` (`id`, `optionType`, `deletable`, `isactive`, `creationtimestamp`, `updatetimestamp`) VALUES (NULL, 'Target Sub Type', '0', '1', CURRENT_TIMESTAMP, '2000-01-01 00:00:00.000000');
UPDATE `editor_option_choice` SET `updatetimestamp` = CURRENT_TIMESTAMP, `optionTypeID` = (SELECT id FROM `editor_option` where `optionType` = 'Target Sub Type') Where `choice` = "Self";
UPDATE `editor_option_choice` SET `updatetimestamp` = CURRENT_TIMESTAMP, `optionTypeID` = (SELECT id FROM `editor_option` where `optionType` = 'Target Sub Type') Where `choice` = "Friendly";
UPDATE `editor_option_choice` SET `updatetimestamp` = CURRENT_TIMESTAMP, `optionTypeID` = (SELECT id FROM `editor_option` where `optionType` = 'Target Sub Type') Where `choice` = "Friend Not Self";
UPDATE `editor_option_choice` SET `updatetimestamp` = CURRENT_TIMESTAMP, `optionTypeID` = (SELECT id FROM `editor_option` where `optionType` = 'Target Sub Type') Where `choice` = "Enemy";

UPDATE `editor_option_choice` SET `updatetimestamp` = CURRENT_TIMESTAMP, `choice` = 'Single Target' Where `choice` = "AoE Enemy";
UPDATE `editor_option_choice` SET `updatetimestamp` = CURRENT_TIMESTAMP, `choice` = 'AoE' Where `choice` = "AoE Friendly";
UPDATE `editor_option_choice` SET `updatetimestamp` = CURRENT_TIMESTAMP, `choice` = 'Location(Trap)' Where `choice` = "Self Location";

INSERT INTO `editor_option_choice`(`id`, `optionTypeID`, `choice`, `deletable`, `isactive`, `creationtimestamp`, `updatetimestamp`) VALUES
(null, (SELECT id FROM `editor_option` where `optionType` = 'Target Sub Type'), 'Friendly or Enemy', 0, 1, CURRENT_TIMESTAMP, '2000-01-01 00:00:00.000000');

ALTER TABLE `abilities` ADD `targetSubType` VARCHAR(64) NOT NULL DEFAULT '' AFTER `targetType`;

UPDATE `abilities` SET `updatetimestamp` = CURRENT_TIMESTAMP, `targetSubType` = 'Friend Not Self' Where `targetType` = 'Friend Not Self';
UPDATE `abilities` SET `updatetimestamp` = CURRENT_TIMESTAMP, `targetSubType` = 'Self' Where `targetType` = 'Self' or `targetType` = "Self Location";
UPDATE `abilities` SET `updatetimestamp` = CURRENT_TIMESTAMP, `targetSubType` = 'Friendly' Where `targetType` = 'Group';
UPDATE `abilities` SET `updatetimestamp` = CURRENT_TIMESTAMP, `targetSubType` = 'Enemy' Where `targetType` = 'Enemy';
UPDATE `abilities` SET `updatetimestamp` = CURRENT_TIMESTAMP, `targetSubType` = 'Enemy' Where `targetType` = 'AoE Enemy';
UPDATE `abilities` SET `updatetimestamp` = CURRENT_TIMESTAMP, `targetSubType` = 'Friendly' Where `targetType` = 'Friendly';
UPDATE `abilities` SET `updatetimestamp` = CURRENT_TIMESTAMP, `targetSubType` = 'Friendly' Where `targetType` = 'AoE Friendly';

UPDATE `abilities` SET `updatetimestamp` = CURRENT_TIMESTAMP, `targetType` = 'AoE' Where `targetType` = 'AoE Friendly' or `targetType` = 'AoE Enemy';
UPDATE `abilities` SET `updatetimestamp` = CURRENT_TIMESTAMP, `targetType` = 'Single Target' Where `targetType` = 'Enemy' or `targetType` = 'Friendly' or `targetType` = 'Self' or `targetType` = 'Friend Not Self' ;
UPDATE `abilities` SET `updatetimestamp` = CURRENT_TIMESTAMP, `targetType` = 'Location(Trap)' Where `targetType` = 'Self Location';

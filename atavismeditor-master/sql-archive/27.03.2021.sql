alter table dialogue add column `audioClip` varchar(256) NOT NULL;

CREATE TABLE `dialogue_actions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `dialogueID` int(11) NOT NULL,
  `actionOrder` int(11) NOT NULL,
  `reqOpenedQuest` int(11) NOT NULL DEFAULT '-1',
  `reqCompletedQuest` int(11) NOT NULL DEFAULT '-1',
  `excludingQuest` int(11) NOT NULL DEFAULT '-1',
  `audioClip` varchar(256) DEFAULT '',
  `text` varchar(256) DEFAULT NULL,
  `action` varchar(45) DEFAULT NULL,
  `actionID` int(11) DEFAULT NULL,
  `itemReq` int(11) NOT NULL DEFAULT '-1',
  `itemReqConsume` tinyint(1) NOT NULL DEFAULT '0',
  `currency` int(11) NOT NULL DEFAULT '-1',
  `currencyAmount` int(11) NOT NULL DEFAULT '0',
  `isactive` tinyint(1) DEFAULT '1',
  `creationtimestamp` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updatetimestamp` datetime DEFAULT '2000-01-01 00:00:00',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE `dialogue_actions_requirement` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `dialogue_action_id` int(11) NOT NULL,
  `editor_option_type_id` int(11) NOT NULL,
  `editor_option_choice_type_id` varchar(45) NOT NULL,
  `required_value` int(11) NOT NULL DEFAULT '1',
  `isactive` tinyint(1) NOT NULL DEFAULT '1',
  `creationtimestamp` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updatetimestamp` timestamp NULL DEFAULT '2000-01-01 00:00:00',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

ALTER TABLE editor_option_choice ADD COLUMN `deletable` tinyint(1) DEFAULT '1' AFTER `isactive`;

CREATE TABLE `guild_level_settings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `level` int(11) NOT NULL,
  `members_num` int(11) NOT NULL DEFAULT '-1',
  `merchant_table` int(11) NOT NULL DEFAULT '1',
  `warehouse_num_slots` int(11) NOT NULL DEFAULT '0',
  `isactive` tinyint(1) NOT NULL DEFAULT '1',
  `creationtimestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatetimestamp` datetime NOT NULL DEFAULT '2000-01-01 00:00:00',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE `guild_level_requirements` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `level` int(11) NOT NULL,
  `item_id` int(11) NOT NULL,
  `count` int(11) NOT NULL,
  `isactive` tinyint(1) NOT NULL DEFAULT '1',
  `creationtimestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatetimestamp` datetime NOT NULL DEFAULT '2000-01-01 00:00:00',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

ALTER TABLE item_templates ADD COLUMN `shopSlots` int(11) NOT NULL DEFAULT '0';
ALTER TABLE item_templates ADD COLUMN `shopTag` varchar(256) NOT NULL DEFAULT '';
ALTER TABLE item_templates ADD COLUMN `numShops` int(11) NOT NULL DEFAULT '1';
ALTER TABLE item_templates ADD COLUMN `shopDestroyOnLogOut` tinyint(1) NOT NULL DEFAULT '1';
ALTER TABLE item_templates ADD COLUMN `shopMobTemplate` int(11) NOT NULL DEFAULT '-1';
ALTER TABLE item_templates ADD COLUMN `shopTimeOut` int(11) NOT NULL DEFAULT '0';

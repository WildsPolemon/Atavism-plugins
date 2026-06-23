CREATE TABLE world_content.claim_profile (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(256) NOT NULL,
  `isactive` tinyint(1) NOT NULL,
  `creationtimestamp` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updatetimestamp` datetime DEFAULT '2000-01-01 00:00:00',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE world_content.build_object_limits (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `profile_id` int(11) NOT NULL,
  `object_category` int(11) NOT NULL,
  `count` int(11) NOT NULL,
  `isactive` int(11) NOT NULL DEFAULT '1',
  `creationtimestamp` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updatetimestamp` datetime DEFAULT '2000-01-01 00:00:00',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

ALTER TABLE admin.claim MODIFY `claimType` int(11) NOT NULL DEFAULT '0';
ALTER TABLE admin.claim ADD COLUMN `object_limit_profile` int(11) NOT NULL DEFAULT '-1';
ALTER TABLE admin.claim ADD COLUMN `taxCurrency` int(11) NOT NULL;

CREATE TABLE admin.claim_upgrade (
  `id` int(11) NOT NULL,
  `claimID` int(11) NOT NULL,
  `locX` float NOT NULL,
  `locY` float NOT NULL,
  `locZ` float NOT NULL,
  `sizeX` int(11) DEFAULT '30',
  `sizeZ` int(11) DEFAULT '30',
  `sizeY` int(11) DEFAULT '30',
  `cost` bigint(20) DEFAULT '0',
  `currency` int(11) DEFAULT '1',
  `purchaseItemReq` varchar(45) DEFAULT '',
  `object_limit_profile` int(11) NOT NULL,
  `taxCurrency` int(11) NOT NULL,
  `taxAmount` bigint(20) NOT NULL,
  `taxInterval` bigint(20) NOT NULL,
  `taxPeriodPay` bigint(20) NOT NULL,
  `taxPeriodSell` bigint(20) NOT NULL,
  `isactive` tinyint(1) DEFAULT '1',
  `creationtimestamp` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updatetimestamp` datetime DEFAULT '2000-01-01 00:00:00'
) ENGINE=InnoDB AVG_ROW_LENGTH=16384 DEFAULT CHARSET=utf8;
ALTER TABLE `admin.claim_upgrade` ADD PRIMARY KEY (`id`);
ALTER TABLE `admin.claim_upgrade` MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE world_content.abilities ADD COLUMN `attack_building` tinyint(1) NOT NULL DEFAULT '0';

ALTER TABLE world_content.build_object_template ADD COLUMN `buildSolo` tinyint(1) NOT NULL DEFAULT '0';
ALTER TABLE world_content.build_object_template ADD COLUMN `fixedTime` tinyint(1) NOT NULL DEFAULT '0';
ALTER TABLE world_content.build_object_template MODIFY `validClaimType` varchar(2000) NOT NULL DEFAULT '';
ALTER TABLE world_content.build_object_template ADD COLUMN `claim_object_category` int(11) NOT NULL DEFAULT '-1';
ALTER TABLE world_content.build_object_template ADD COLUMN `attackable` tinyint(1) NOT NULL DEFAULT '0';
ALTER TABLE world_content.build_object_template ADD COLUMN `repairable` tinyint(1) NOT NULL DEFAULT '0';

ALTER TABLE world_content.build_object_template DROP COLUMN `interactionType`;
ALTER TABLE world_content.build_object_template DROP COLUMN `interactionID`;
ALTER TABLE world_content.build_object_template DROP COLUMN `interactionData1`;

ALTER TABLE world_content.build_object_stage ADD COLUMN `repairTimeReq` float NOT NULL DEFAULT 0;
ALTER TABLE world_content.build_object_stage ADD COLUMN `interactionType` varchar(256) NOT NULL;
ALTER TABLE world_content.build_object_stage ADD COLUMN `interactionID` int(11) NOT NULL;
ALTER TABLE world_content.build_object_stage ADD COLUMN `interactionData1` varchar(256) NOT NULL;
ALTER TABLE world_content.build_object_stage ADD COLUMN `health` int(11) NOT NULL DEFAULT 0;
ALTER TABLE world_content.build_object_stage ADD COLUMN `lootTable` int(11) NOT NULL;
ALTER TABLE world_content.build_object_stage ADD COLUMN `lootMinPercentage` float NOT NULL;
ALTER TABLE world_content.build_object_stage ADD COLUMN `lootMaxPercentage` float NOT NULL;

CREATE TABLE world_content.build_object_stage_items (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `stage_id` int(11) NOT NULL,
  `item` int(11) NOT NULL,
  `count` int(11) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE world_content.build_object_stage_progress (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `stage_id` int(11) NOT NULL,
  `progress` smallint(6) NOT NULL,
  `prefab` varchar(1000) NOT NULL,
  `trimesh` longblob,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE world_content.build_object_stage_damaged (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `stage_id` int(11) NOT NULL,
  `progress` smallint(6) NOT NULL,
  `prefab` varchar(1000) NOT NULL ,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

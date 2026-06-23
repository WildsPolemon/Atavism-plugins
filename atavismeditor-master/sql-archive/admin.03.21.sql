-- MySQL dump 10.13  Distrib 8.0.23, for Linux (x86_64)
--
-- Host: 127.0.0.1    Database: admin
-- ------------------------------------------------------
-- Server version	8.0.23-0ubuntu0.20.04.1

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `account`
--

DROP TABLE IF EXISTS `account`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `account` (
  `id` bigint NOT NULL,
  `username` varchar(32) DEFAULT NULL,
  `status` int NOT NULL,
  `created` timestamp NOT NULL DEFAULT '1999-12-31 23:00:00',
  `last_login` timestamp NOT NULL DEFAULT '1999-12-31 23:00:00',
  `character_slots` int NOT NULL DEFAULT '10',
  `coin_current` int NOT NULL,
  `coin_total` int DEFAULT NULL,
  `coin_used` int NOT NULL DEFAULT '0',
  `islands_available` int NOT NULL DEFAULT '1',
  `last_logout` timestamp NOT NULL DEFAULT '2013-12-31 23:00:00',
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `account`
--

LOCK TABLES `account` WRITE;
/*!40000 ALTER TABLE `account` DISABLE KEYS */;
/*!40000 ALTER TABLE `account` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `account_character`
--

DROP TABLE IF EXISTS `account_character`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `account_character` (
  `characterId` bigint NOT NULL,
  `characterName` varchar(45) NOT NULL,
  `accountId` bigint NOT NULL,
  PRIMARY KEY (`characterId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `account_character`
--

LOCK TABLES `account_character` WRITE;
/*!40000 ALTER TABLE `account_character` DISABLE KEYS */;
/*!40000 ALTER TABLE `account_character` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `account_purchases`
--

DROP TABLE IF EXISTS `account_purchases`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `account_purchases` (
  `id` int NOT NULL AUTO_INCREMENT,
  `account_id` bigint NOT NULL,
  `itemID` int DEFAULT NULL,
  `itemPurchaseDate` timestamp NOT NULL DEFAULT '1999-12-31 23:00:00',
  `itemClaims` text,
  `used` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `account_purchases`
--

LOCK TABLES `account_purchases` WRITE;
/*!40000 ALTER TABLE `account_purchases` DISABLE KEYS */;
/*!40000 ALTER TABLE `account_purchases` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `achivement_data`
--

DROP TABLE IF EXISTS `achivement_data`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `achivement_data` (
  `id` int NOT NULL AUTO_INCREMENT,
  `playerOid` bigint NOT NULL,
  `type` int NOT NULL,
  `obj` varchar(200) NOT NULL,
  `rankingId` int NOT NULL,
  `achievementId` int NOT NULL,
  `acquired` tinyint(1) NOT NULL,
  `value` int NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `achivement_data`
--

LOCK TABLES `achivement_data` WRITE;
/*!40000 ALTER TABLE `achivement_data` DISABLE KEYS */;
/*!40000 ALTER TABLE `achivement_data` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `auction_house`
--

DROP TABLE IF EXISTS `auction_house`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `auction_house` (
  `id` int NOT NULL AUTO_INCREMENT,
  `startbid` int NOT NULL,
  `currency_id` int NOT NULL,
  `expire_date` datetime NOT NULL,
  `auctioneer_oid` bigint NOT NULL,
  `owner_oid` bigint NOT NULL,
  `bidder_oid` bigint NOT NULL,
  `race_group_id` int NOT NULL,
  `bid` int NOT NULL,
  `buyout` bigint NOT NULL,
  `status` int NOT NULL,
  `mode` int NOT NULL,
  `item_oid` bigint NOT NULL,
  `item_count` int NOT NULL,
  `item_template_id` int NOT NULL,
  `item_enchant_level` int NOT NULL,
  `item_sockets_info` text NOT NULL,
  `world_name` varchar(64) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `expire_date` (`expire_date`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `auction_house`
--

LOCK TABLES `auction_house` WRITE;
/*!40000 ALTER TABLE `auction_house` DISABLE KEYS */;
/*!40000 ALTER TABLE `auction_house` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `auction_house_ended`
--

DROP TABLE IF EXISTS `auction_house_ended`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `auction_house_ended` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `startbid` int NOT NULL,
  `currency_id` int NOT NULL,
  `expire_date` datetime NOT NULL,
  `auctioneer_oid` bigint NOT NULL,
  `owner_oid` bigint NOT NULL,
  `bidder_oid` bigint NOT NULL,
  `race_group_id` int NOT NULL,
  `bid` int NOT NULL,
  `buyout` bigint NOT NULL,
  `status` int NOT NULL,
  `mode` int NOT NULL,
  `item_oid` bigint NOT NULL,
  `item_count` int NOT NULL,
  `item_template_id` int NOT NULL,
  `item_enchant_level` int NOT NULL,
  `item_sockets_info` text NOT NULL,
  `world_name` varchar(64) NOT NULL,
  `creationtimestamp` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updatetimestamp` datetime DEFAULT '2000-01-01 00:00:00',
  PRIMARY KEY (`id`),
  KEY `expire_date` (`expire_date`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `auction_house_ended`
--

LOCK TABLES `auction_house_ended` WRITE;
/*!40000 ALTER TABLE `auction_house_ended` DISABLE KEYS */;
/*!40000 ALTER TABLE `auction_house_ended` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `character_block_list`
--

DROP TABLE IF EXISTS `character_block_list`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `character_block_list` (
  `id` int NOT NULL AUTO_INCREMENT,
  `character_id` bigint NOT NULL,
  `block_player_id` bigint NOT NULL,
  `friend_name` varchar(32) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `block_player_id` (`block_player_id`),
  KEY `character_id` (`character_id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `character_block_list`
--

LOCK TABLES `character_block_list` WRITE;
/*!40000 ALTER TABLE `character_block_list` DISABLE KEYS */;
/*!40000 ALTER TABLE `character_block_list` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `character_friends`
--

DROP TABLE IF EXISTS `character_friends`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `character_friends` (
  `id` int NOT NULL AUTO_INCREMENT,
  `character_id` bigint NOT NULL,
  `friend_id` bigint NOT NULL,
  `friend_name` varchar(32) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `character_id` (`character_id`),
  KEY `friend_id` (`friend_id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `character_friends`
--

LOCK TABLES `character_friends` WRITE;
/*!40000 ALTER TABLE `character_friends` DISABLE KEYS */;
/*!40000 ALTER TABLE `character_friends` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `character_mail`
--

DROP TABLE IF EXISTS `character_mail`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `character_mail` (
  `mailId` int NOT NULL AUTO_INCREMENT,
  `mailArchive` tinyint(1) NOT NULL,
  `isAccountMail` tinyint(1) NOT NULL DEFAULT '0',
  `recipientId` bigint NOT NULL,
  `recipientName` varchar(255) DEFAULT NULL,
  `senderId` bigint NOT NULL,
  `senderName` varchar(255) DEFAULT NULL,
  `mailRead` tinyint(1) NOT NULL,
  `mailSubject` varchar(255) NOT NULL,
  `mailMessage` text NOT NULL,
  `currencyType` int DEFAULT NULL,
  `currencyAmount` int DEFAULT NULL,
  `currencyTaken` tinyint(1) DEFAULT '0',
  `CoD` tinyint(1) NOT NULL DEFAULT '0',
  `mailAttachmentItemId1Taken` tinyint(1) DEFAULT NULL,
  `mailAttachmentItemId1` bigint DEFAULT NULL,
  `mailAttachmentItemId2Taken` tinyint(1) DEFAULT NULL,
  `mailAttachmentItemId2` bigint DEFAULT NULL,
  `mailAttachmentItemId3Taken` tinyint(1) DEFAULT NULL,
  `mailAttachmentItemId3` bigint DEFAULT NULL,
  `mailAttachmentItemId4Taken` tinyint(1) DEFAULT NULL,
  `mailAttachmentItemId4` bigint DEFAULT NULL,
  `mailAttachmentItemId5Taken` tinyint(1) DEFAULT NULL,
  `mailAttachmentItemId5` bigint DEFAULT NULL,
  `mailAttachmentItemId6Taken` tinyint(1) DEFAULT NULL,
  `mailAttachmentItemId6` bigint DEFAULT NULL,
  `mailAttachmentItemId7Taken` tinyint(1) DEFAULT NULL,
  `mailAttachmentItemId7` bigint DEFAULT NULL,
  `mailAttachmentItemId8Taken` tinyint(1) DEFAULT NULL,
  `mailAttachmentItemId8` bigint DEFAULT NULL,
  `mailAttachmentItemId9Taken` tinyint(1) DEFAULT NULL,
  `mailAttachmentItemId9` bigint DEFAULT NULL,
  `mailAttachmentItemId10Taken` tinyint(1) DEFAULT NULL,
  `mailAttachmentItemId10` bigint DEFAULT NULL,
  `expiry` datetime DEFAULT NULL,
  `dateCreated` timestamp NOT NULL DEFAULT '1999-12-31 23:00:00',
  `dateUpdated` timestamp NOT NULL DEFAULT '1999-12-31 23:00:00' ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`mailId`),
  KEY `expiry` (`expiry`),
  KEY `isAccountMail` (`isAccountMail`),
  KEY `isAccountMail_recipientId_mailArchive` (`isAccountMail`,`recipientId`,`mailArchive`),
  KEY `mailArchive` (`mailArchive`),
  KEY `recipientId` (`recipientId`),
  KEY `recipientId_mailArchive_expiry` (`recipientId`,`mailArchive`,`expiry`),
  KEY `senderId` (`senderId`),
  KEY `senderId_mailArchive_expiry` (`senderId`,`mailArchive`,`expiry`)
) ENGINE=InnoDB AUTO_INCREMENT=177 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `character_mail`
--

LOCK TABLES `character_mail` WRITE;
/*!40000 ALTER TABLE `character_mail` DISABLE KEYS */;
/*!40000 ALTER TABLE `character_mail` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `character_purchases`
--

DROP TABLE IF EXISTS `character_purchases`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `character_purchases` (
  `character_id` bigint NOT NULL,
  `itemID` int DEFAULT NULL,
  `itemPurchaseDate` timestamp NOT NULL DEFAULT '1999-12-31 23:00:00',
  `id` int NOT NULL AUTO_INCREMENT,
  `used` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `character_purchases`
--

LOCK TABLES `character_purchases` WRITE;
/*!40000 ALTER TABLE `character_purchases` DISABLE KEYS */;
/*!40000 ALTER TABLE `character_purchases` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `chat_logs`
--

DROP TABLE IF EXISTS `chat_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `chat_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `world` varchar(50) NOT NULL,
  `date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `message` varchar(1024) NOT NULL,
  `source` bigint NOT NULL,
  `target` bigint NOT NULL,
  `channel` int NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=671 DEFAULT CHARSET=utf8 AVG_ROW_LENGTH=124;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `chat_logs`
--

LOCK TABLES `chat_logs` WRITE;
/*!40000 ALTER TABLE `chat_logs` DISABLE KEYS */;
/*!40000 ALTER TABLE `chat_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `claim`
--

DROP TABLE IF EXISTS `claim`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `claim` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(45) DEFAULT NULL,
  `instance` int NOT NULL DEFAULT '-1',
  `instanceOwner` bigint NOT NULL DEFAULT '0',
  `instanceGuild` bigint NOT NULL DEFAULT '-1',
  `locX` float NOT NULL,
  `locY` float NOT NULL,
  `locZ` float NOT NULL,
  `claimType` int NOT NULL DEFAULT '0',
  `owner` bigint DEFAULT NULL,
  `size` int DEFAULT '30',
  `sizeZ` int DEFAULT '30',
  `forSale` tinyint(1) DEFAULT '0',
  `sellerName` varchar(45) DEFAULT NULL,
  `cost` int DEFAULT '0',
  `currency` int DEFAULT '1',
  `purchaseItemReq` varchar(45) DEFAULT '',
  `taxPaidUntil` timestamp NULL DEFAULT NULL,
  `claimItemTemplate` int DEFAULT '-1',
  `bondItemTemplate` int DEFAULT '-1',
  `bondPaidUntil` timestamp NULL DEFAULT NULL,
  `priority` int NOT NULL DEFAULT '1',
  `isactive` tinyint(1) DEFAULT '1',
  `creationtimestamp` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updatetimestamp` datetime DEFAULT '2000-01-01 00:00:00',
  `parent` int NOT NULL DEFAULT '-1',
  `permanent` tinyint(1) NOT NULL DEFAULT '0',
  `org_cost` int NOT NULL,
  `org_currency` int NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=28 DEFAULT CHARSET=utf8 AVG_ROW_LENGTH=16384;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `claim`
--

LOCK TABLES `claim` WRITE;
/*!40000 ALTER TABLE `claim` DISABLE KEYS */;
/*!40000 ALTER TABLE `claim` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `claim_action`
--

DROP TABLE IF EXISTS `claim_action`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `claim_action` (
  `id` int NOT NULL AUTO_INCREMENT,
  `claimID` int DEFAULT NULL,
  `action` varchar(45) DEFAULT NULL,
  `brushType` varchar(45) NOT NULL,
  `locX` float NOT NULL,
  `locY` float NOT NULL,
  `locZ` float NOT NULL,
  `material` smallint NOT NULL,
  `normalX` float NOT NULL,
  `normalY` float NOT NULL,
  `normalZ` float NOT NULL,
  `sizeX` float NOT NULL,
  `sizeY` float NOT NULL,
  `sizeZ` float NOT NULL,
  `isactive` tinyint(1) DEFAULT '1',
  `creationtimestamp` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updatetimestamp` datetime DEFAULT '2000-01-01 00:00:00',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `claim_action`
--

LOCK TABLES `claim_action` WRITE;
/*!40000 ALTER TABLE `claim_action` DISABLE KEYS */;
/*!40000 ALTER TABLE `claim_action` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `claim_object`
--

DROP TABLE IF EXISTS `claim_object`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `claim_object` (
  `id` int NOT NULL AUTO_INCREMENT,
  `claimID` int DEFAULT NULL,
  `template` int DEFAULT NULL,
  `stage` int NOT NULL DEFAULT '0',
  `complete` tinyint(1) NOT NULL DEFAULT '0',
  `parent` int DEFAULT '-1',
  `gameObject` varchar(256) DEFAULT NULL,
  `locX` float DEFAULT NULL,
  `locY` float DEFAULT NULL,
  `locZ` float DEFAULT NULL,
  `orientX` float DEFAULT NULL,
  `orientY` float DEFAULT NULL,
  `orientZ` float DEFAULT NULL,
  `orientW` float DEFAULT NULL,
  `itemID` int DEFAULT NULL,
  `objectState` varchar(64) DEFAULT NULL,
  `health` int DEFAULT '1',
  `maxHealth` int DEFAULT '1',
  `item1` int DEFAULT '-1',
  `item1Count` int DEFAULT '0',
  `item2` int DEFAULT '-1',
  `item2Count` int DEFAULT '0',
  `item3` int DEFAULT '-1',
  `item3Count` int DEFAULT '0',
  `item4` int DEFAULT '-1',
  `item4Count` int DEFAULT '0',
  `item5` int DEFAULT '-1',
  `item5Count` int DEFAULT '0',
  `item6` int DEFAULT '-1',
  `item6Count` int DEFAULT '0',
  `lockTemplateID` int DEFAULT '-1',
  `lockDurability` int DEFAULT '0',
  `isactive` tinyint(1) DEFAULT '1',
  `creationtimestamp` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updatetimestamp` datetime DEFAULT '2000-01-01 00:00:00',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `claim_object`
--

LOCK TABLES `claim_object` WRITE;
/*!40000 ALTER TABLE `claim_object` DISABLE KEYS */;
/*!40000 ALTER TABLE `claim_object` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `claim_permission`
--

DROP TABLE IF EXISTS `claim_permission`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `claim_permission` (
  `id` int NOT NULL AUTO_INCREMENT,
  `claimID` int NOT NULL,
  `playerOid` bigint DEFAULT NULL,
  `playerName` varchar(45) DEFAULT NULL,
  `permissionLevel` int DEFAULT NULL,
  `dateGiven` datetime DEFAULT NULL,
  `isactive` tinyint(1) DEFAULT '1',
  `creationtimestamp` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updatetimestamp` datetime DEFAULT '2000-01-01 00:00:00',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `claim_permission`
--

LOCK TABLES `claim_permission` WRITE;
/*!40000 ALTER TABLE `claim_permission` DISABLE KEYS */;
/*!40000 ALTER TABLE `claim_permission` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `claim_resource`
--

DROP TABLE IF EXISTS `claim_resource`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `claim_resource` (
  `id` int NOT NULL AUTO_INCREMENT,
  `claimID` int NOT NULL,
  `itemID` int NOT NULL,
  `count` int NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `claim_resource`
--

LOCK TABLES `claim_resource` WRITE;
/*!40000 ALTER TABLE `claim_resource` DISABLE KEYS */;
/*!40000 ALTER TABLE `claim_resource` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cooldowns`
--

DROP TABLE IF EXISTS `cooldowns`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cooldowns` (
  `id` int NOT NULL AUTO_INCREMENT,
  `cid` varchar(100) NOT NULL,
  `duration` int NOT NULL,
  `startTime` bigint NOT NULL,
  `obj_oid` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `obj_oid` (`obj_oid`)
) ENGINE=InnoDB AUTO_INCREMENT=55981 DEFAULT CHARSET=utf8 AVG_ROW_LENGTH=5461;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cooldowns`
--

LOCK TABLES `cooldowns` WRITE;
/*!40000 ALTER TABLE `cooldowns` DISABLE KEYS */;
/*!40000 ALTER TABLE `cooldowns` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `data_logs`
--

DROP TABLE IF EXISTS `data_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `data_logs` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `world_name` varchar(64) NOT NULL,
  `data_name` varchar(64) NOT NULL,
  `data_timestamp` timestamp NOT NULL DEFAULT '1999-12-31 23:00:00',
  `source_oid` bigint NOT NULL,
  `target_oid` bigint NOT NULL DEFAULT '0',
  `account_id` bigint NOT NULL DEFAULT '0',
  `additional_data` text,
  `process_timestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1553 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `data_logs`
--

LOCK TABLES `data_logs` WRITE;
/*!40000 ALTER TABLE `data_logs` DISABLE KEYS */;
/*!40000 ALTER TABLE `data_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `guild`
--

DROP TABLE IF EXISTS `guild`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `guild` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(45) NOT NULL,
  `faction` int NOT NULL,
  `motd` varchar(256) NOT NULL,
  `omotd` varchar(256) NOT NULL,
  `isactive` tinyint(1) DEFAULT '1',
  `creationtimestamp` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `guild`
--

LOCK TABLES `guild` WRITE;
/*!40000 ALTER TABLE `guild` DISABLE KEYS */;
/*!40000 ALTER TABLE `guild` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `guild_member`
--

DROP TABLE IF EXISTS `guild_member`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `guild_member` (
  `id` int NOT NULL AUTO_INCREMENT,
  `guildID` int NOT NULL,
  `memberOid` bigint NOT NULL,
  `name` varchar(32) DEFAULT NULL,
  `rank` int DEFAULT NULL,
  `level` int DEFAULT NULL,
  `note` varchar(128) DEFAULT NULL,
  `creationtimestamp` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=23 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `guild_member`
--

LOCK TABLES `guild_member` WRITE;
/*!40000 ALTER TABLE `guild_member` DISABLE KEYS */;
/*!40000 ALTER TABLE `guild_member` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `guild_rank`
--

DROP TABLE IF EXISTS `guild_rank`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `guild_rank` (
  `id` int NOT NULL AUTO_INCREMENT,
  `guildID` int NOT NULL,
  `rank` int NOT NULL,
  `name` varchar(45) NOT NULL,
  `permissions` varchar(256) NOT NULL,
  `creationtimestamp` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=68 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `guild_rank`
--

LOCK TABLES `guild_rank` WRITE;
/*!40000 ALTER TABLE `guild_rank` DISABLE KEYS */;
/*!40000 ALTER TABLE `guild_rank` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `history_auction_house_ended`
--

DROP TABLE IF EXISTS `history_auction_house_ended`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `history_auction_house_ended` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `auction_id` bigint NOT NULL,
  `startbid` int NOT NULL,
  `currency_id` int NOT NULL,
  `expire_date` datetime NOT NULL,
  `auctioneer_oid` bigint NOT NULL,
  `owner_oid` bigint NOT NULL,
  `bidder_oid` bigint NOT NULL,
  `race_group_id` int NOT NULL,
  `bid` int NOT NULL,
  `buyout` int NOT NULL,
  `status` int NOT NULL,
  `mode` int NOT NULL,
  `item_oid` bigint NOT NULL,
  `item_count` int NOT NULL,
  `item_template_id` int NOT NULL,
  `item_enchant_level` int NOT NULL,
  `item_sockets_info` text NOT NULL,
  `world_name` varchar(64) NOT NULL,
  `creationtimestamp` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updatetimestamp` datetime DEFAULT '2000-01-01 00:00:00',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `history_auction_house_ended`
--

LOCK TABLES `history_auction_house_ended` WRITE;
/*!40000 ALTER TABLE `history_auction_house_ended` DISABLE KEYS */;
/*!40000 ALTER TABLE `history_auction_house_ended` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `history_character_mail`
--

DROP TABLE IF EXISTS `history_character_mail`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `history_character_mail` (
  `id` int NOT NULL AUTO_INCREMENT,
  `mailId` int NOT NULL,
  `mailArchive` tinyint(1) NOT NULL,
  `isAccountMail` tinyint(1) NOT NULL DEFAULT '0',
  `recipientId` bigint NOT NULL,
  `recipientName` varchar(255) DEFAULT NULL,
  `senderId` bigint NOT NULL,
  `senderName` varchar(255) DEFAULT NULL,
  `mailRead` tinyint(1) NOT NULL,
  `mailSubject` varchar(255) NOT NULL,
  `mailMessage` text NOT NULL,
  `currencyType` int DEFAULT NULL,
  `currencyAmount` int DEFAULT NULL,
  `currencyTaken` tinyint(1) DEFAULT '0',
  `CoD` tinyint(1) NOT NULL DEFAULT '0',
  `mailAttachmentItemId1Taken` tinyint(1) DEFAULT NULL,
  `mailAttachmentItemId1` bigint DEFAULT NULL,
  `mailAttachmentItemId2Taken` tinyint(1) DEFAULT NULL,
  `mailAttachmentItemId2` bigint DEFAULT NULL,
  `mailAttachmentItemId3Taken` tinyint(1) DEFAULT NULL,
  `mailAttachmentItemId3` bigint DEFAULT NULL,
  `mailAttachmentItemId4Taken` tinyint(1) DEFAULT NULL,
  `mailAttachmentItemId4` bigint DEFAULT NULL,
  `mailAttachmentItemId5Taken` tinyint(1) DEFAULT NULL,
  `mailAttachmentItemId5` bigint DEFAULT NULL,
  `mailAttachmentItemId6Taken` tinyint(1) DEFAULT NULL,
  `mailAttachmentItemId6` bigint DEFAULT NULL,
  `mailAttachmentItemId7Taken` tinyint(1) DEFAULT NULL,
  `mailAttachmentItemId7` bigint DEFAULT NULL,
  `mailAttachmentItemId8Taken` tinyint(1) DEFAULT NULL,
  `mailAttachmentItemId8` bigint DEFAULT NULL,
  `mailAttachmentItemId9Taken` tinyint(1) DEFAULT NULL,
  `mailAttachmentItemId9` bigint DEFAULT NULL,
  `mailAttachmentItemId10Taken` tinyint(1) DEFAULT NULL,
  `mailAttachmentItemId10` bigint DEFAULT NULL,
  `expiry` datetime DEFAULT NULL,
  `dateCreated` timestamp NOT NULL DEFAULT '2000-01-01 05:00:00',
  `dateUpdated` timestamp NOT NULL DEFAULT '2000-01-01 05:00:00',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `history_character_mail`
--

LOCK TABLES `history_character_mail` WRITE;
/*!40000 ALTER TABLE `history_character_mail` DISABLE KEYS */;
/*!40000 ALTER TABLE `history_character_mail` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `instance_template`
--

DROP TABLE IF EXISTS `instance_template`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `instance_template` (
  `id` int NOT NULL AUTO_INCREMENT,
  `island_name` varchar(64) NOT NULL,
  `template` varchar(64) NOT NULL,
  `administrator` int NOT NULL,
  `category` int NOT NULL,
  `status` varchar(32) NOT NULL,
  `subscription` datetime DEFAULT NULL,
  `public` tinyint(1) NOT NULL DEFAULT '0',
  `password` varchar(64) NOT NULL,
  `rating` int NOT NULL DEFAULT '0',
  `islandType` int NOT NULL DEFAULT '0',
  `globalWaterHeight` float NOT NULL DEFAULT '0',
  `createOnStartup` tinyint(1) NOT NULL DEFAULT '0',
  `style` varchar(64) NOT NULL,
  `recommendedLevel` int NOT NULL,
  `description` text NOT NULL,
  `size` int NOT NULL,
  `populationLimit` int NOT NULL DEFAULT '-1',
  `lastUpdate` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `dateCreated` timestamp NOT NULL DEFAULT '1999-12-31 23:00:00',
  PRIMARY KEY (`id`),
  UNIQUE KEY `island_name` (`island_name`)
) ENGINE=InnoDB AUTO_INCREMENT=65 DEFAULT CHARSET=utf8 AVG_ROW_LENGTH=2340;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `instance_template`
--

LOCK TABLES `instance_template` WRITE;
/*!40000 ALTER TABLE `instance_template` DISABLE KEYS */;
INSERT INTO `instance_template` VALUES (29,'MainWorld','',1,1,'Active',NULL,1,'',0,0,-200,1,'',0,'',-1,-1,'2016-07-11 09:03:22','1999-12-31 23:00:00'),(39,'InstanceSinglePlayer','',1,1,'Active',NULL,1,'',0,1,-200,1,'',0,'',-1,1,'2018-01-12 13:51:34','1999-12-31 23:00:00'),(40,'InstanceGroup','',1,1,'Active',NULL,1,'',0,2,-200,1,'',0,'',-1,4,'2018-01-12 13:51:59','1999-12-31 23:00:00'),(41,'Arena1v1','',1,1,'Active',NULL,1,'',0,4,-200,1,'',0,'',-1,-1,'2020-09-24 18:49:25','1999-12-31 23:00:00'),(42,'Arena2v2','',1,1,'Active',NULL,1,'',0,4,-200,1,'',0,'',-1,-1,'2018-01-12 13:53:30','1999-12-31 23:00:00'),(43,'SinglePlayerPrivate','',0,1,'Active',NULL,1,'',0,3,-200,1,'',0,'',-1,-1,'2018-03-19 23:14:05','1999-12-31 23:00:00'),(44,'GuildPrivate','',0,1,'Active',NULL,1,'',0,5,-200,0,'',0,'',-1,-1,'2018-03-20 14:13:03','1999-12-31 23:00:00'),(56,'asd','',0,1,'Active',NULL,1,'',0,2,123,1,'',0,'',-1,123,'2020-04-03 15:36:43','1999-12-31 23:00:00'),(57,'qwe','',0,1,'Active',NULL,1,'',0,2,1123,0,'',0,'',-1,123,'2020-04-03 15:38:58','1999-12-31 23:00:00'),(58,'qweqw','',0,1,'Active',NULL,1,'',0,1,2,0,'',0,'',-1,2,'2020-04-03 15:40:23','1999-12-31 23:00:00'),(59,'asdasd','',0,1,'Active',NULL,1,'',0,3,444,0,'',0,'',-1,444,'2020-04-03 15:45:46','1999-12-31 23:00:00'),(60,'sad','',0,1,'Active',NULL,1,'',0,1,2,0,'',0,'',-1,2,'2020-04-03 16:20:39','1999-12-31 23:00:00'),(61,'sadsdas','',0,1,'Active',NULL,1,'',0,1,22,0,'',0,'',-1,2,'2020-04-03 16:32:22','1999-12-31 23:00:00'),(62,'asd (1)','',0,1,'Active',NULL,1,'',0,2,123,1,'',0,'',-1,123,'2020-04-03 15:36:43','1999-12-31 23:00:00'),(63,'Arena1v1 (1)','',1,1,'Active',NULL,1,'',0,4,-200,1,'',0,'',-1,-1,'2020-06-15 18:28:09','2020-06-15 18:28:09'),(64,'dfgdfg','',0,1,'Active',NULL,1,'',0,2,2234.23,0,'',0,'',-1,234234,'2020-07-04 10:16:04','2020-07-04 10:15:05');
/*!40000 ALTER TABLE `instance_template` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `island_developers`
--

DROP TABLE IF EXISTS `island_developers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `island_developers` (
  `id` int NOT NULL AUTO_INCREMENT,
  `island` int NOT NULL,
  `developer` int NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `island_developers`
--

LOCK TABLES `island_developers` WRITE;
/*!40000 ALTER TABLE `island_developers` DISABLE KEYS */;
/*!40000 ALTER TABLE `island_developers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `island_friends`
--

DROP TABLE IF EXISTS `island_friends`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `island_friends` (
  `id` int NOT NULL AUTO_INCREMENT,
  `island` int NOT NULL,
  `user` int NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `island_friends`
--

LOCK TABLES `island_friends` WRITE;
/*!40000 ALTER TABLE `island_friends` DISABLE KEYS */;
/*!40000 ALTER TABLE `island_friends` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `island_portals`
--

DROP TABLE IF EXISTS `island_portals`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `island_portals` (
  `id` int NOT NULL AUTO_INCREMENT,
  `island` int NOT NULL,
  `portalType` int NOT NULL,
  `faction` int NOT NULL,
  `locX` decimal(65,2) NOT NULL,
  `locY` decimal(65,2) NOT NULL,
  `locZ` decimal(65,2) NOT NULL,
  `orientX` int NOT NULL,
  `orientY` int NOT NULL,
  `orientZ` int NOT NULL,
  `orientW` int NOT NULL,
  `displayID` int NOT NULL,
  `name` varchar(32) DEFAULT NULL,
  `gameObject` varchar(256) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=47 DEFAULT CHARSET=utf8 AVG_ROW_LENGTH=2340;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `island_portals`
--

LOCK TABLES `island_portals` WRITE;
/*!40000 ALTER TABLE `island_portals` DISABLE KEYS */;
INSERT INTO `island_portals` VALUES (7,29,0,0,-170.00,74.00,154.00,0,0,0,1,0,'spawn',''),(21,39,0,0,0.00,0.00,0.00,0,0,0,1,0,'spawn',NULL),(22,40,0,0,0.00,0.00,0.00,0,0,0,1,0,'spawn',NULL),(23,41,0,0,0.00,0.00,0.00,0,0,0,1,0,'spawn',NULL),(24,42,0,0,0.00,0.00,0.00,0,0,0,1,0,'spawn',NULL),(25,43,0,0,-170.00,74.00,154.00,0,0,0,1,0,'spawn',NULL),(26,44,0,0,-170.00,74.00,154.00,0,0,0,1,0,'spawn',NULL),(28,41,0,0,5.66,3.56,4.21,0,0,0,1,0,'spawn',NULL),(29,48,0,0,0.00,0.00,0.00,0,0,0,1,0,'spawn',NULL),(30,43,0,0,1.00,2.00,3.00,0,0,0,1,0,'qweqwe',NULL),(31,52,0,0,4.00,4.00,4.00,0,4,0,0,0,'dsfasdf',NULL),(32,53,0,0,3.00,3.00,3.00,0,3,0,0,0,'sdfsdf',NULL),(33,54,0,0,0.00,0.00,0.00,0,0,0,0,0,'dfssdf',NULL),(34,54,0,0,5.00,5.00,5.00,0,5,0,0,0,'dfsd',NULL),(35,55,0,0,1.00,1.00,2.00,0,1,0,0,0,'spawn',NULL),(36,56,0,0,1.00,1.00,1.00,0,1,0,0,0,'spawn',NULL),(37,57,0,0,1.00,1.00,1.00,0,1,0,0,0,'spawn',NULL),(38,58,0,0,2.00,2.00,2.00,0,2,0,0,0,'spawn',NULL),(39,59,0,0,4.00,44.00,4.00,0,4,0,0,0,'spawn',NULL),(40,60,0,0,2.00,2.00,2.00,0,2,0,0,0,'spawn',NULL),(41,61,0,0,2.00,2.00,2.00,0,2,0,0,0,'spawn',NULL),(42,62,0,0,1.00,1.00,1.00,0,1,0,0,0,'spawn',NULL),(43,63,0,0,0.00,0.00,0.00,0,0,0,1,0,'spawn',NULL),(44,63,0,0,5.66,3.56,4.21,0,0,0,1,0,'spawn',NULL),(45,64,0,0,-1.00,-1.00,-33.00,0,123,0,0,0,'spawn',NULL),(46,64,0,0,5.00,5.00,5.00,0,5,0,0,0,'dasfsdf',NULL);
/*!40000 ALTER TABLE `island_portals` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ranking_run`
--

DROP TABLE IF EXISTS `ranking_run`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ranking_run` (
  `world` varchar(50) NOT NULL,
  `last_run` bigint NOT NULL,
  PRIMARY KEY (`world`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ranking_run`
--

LOCK TABLES `ranking_run` WRITE;
/*!40000 ALTER TABLE `ranking_run` DISABLE KEYS */;
/*!40000 ALTER TABLE `ranking_run` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `rankings`
--

DROP TABLE IF EXISTS `rankings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `rankings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `pos` int NOT NULL,
  `player` bigint NOT NULL,
  `ranking` int NOT NULL,
  `value` int NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `rankings`
--

LOCK TABLES `rankings` WRITE;
/*!40000 ALTER TABLE `rankings` DISABLE KEYS */;
/*!40000 ALTER TABLE `rankings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `server`
--

DROP TABLE IF EXISTS `server`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `server` (
  `action` varchar(10) DEFAULT NULL,
  `status` tinyint(1) DEFAULT '0'
) ENGINE=MEMORY DEFAULT CHARSET=utf8 AVG_ROW_LENGTH=33;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `server`
--

LOCK TABLES `server` WRITE;
/*!40000 ALTER TABLE `server` DISABLE KEYS */;
/*!40000 ALTER TABLE `server` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `server_stats`
--

DROP TABLE IF EXISTS `server_stats`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `server_stats` (
  `players_online` int NOT NULL DEFAULT '0',
  `last_login` timestamp NOT NULL DEFAULT '1999-12-31 23:00:00',
  `logins_since_restart` int NOT NULL DEFAULT '0',
  `last_restart` timestamp NOT NULL DEFAULT '1999-12-31 23:00:00',
  PRIMARY KEY (`players_online`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `server_stats`
--

LOCK TABLES `server_stats` WRITE;
/*!40000 ALTER TABLE `server_stats` DISABLE KEYS */;
/*!40000 ALTER TABLE `server_stats` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `server_status`
--

DROP TABLE IF EXISTS `server_status`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `server_status` (
  `server` varchar(10) DEFAULT NULL,
  `status` tinyint(1) DEFAULT '0'
) ENGINE=MEMORY DEFAULT CHARSET=utf8 AVG_ROW_LENGTH=33;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `server_status`
--

LOCK TABLES `server_status` WRITE;
/*!40000 ALTER TABLE `server_status` DISABLE KEYS */;
/*!40000 ALTER TABLE `server_status` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `server_version`
--

DROP TABLE IF EXISTS `server_version`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `server_version` (
  `server_version` varchar(10) NOT NULL,
  `installation_type` varchar(10) DEFAULT NULL,
  PRIMARY KEY (`server_version`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 AVG_ROW_LENGTH=16384;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `server_version`
--

LOCK TABLES `server_version` WRITE;
/*!40000 ALTER TABLE `server_version` DISABLE KEYS */;
INSERT INTO `server_version` VALUES ('10.1.0','Demo');
/*!40000 ALTER TABLE `server_version` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `shopitems`
--

DROP TABLE IF EXISTS `shopitems`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `shopitems` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(64) NOT NULL,
  `cost` int NOT NULL,
  `category` varchar(32) NOT NULL,
  `imageAddress` varchar(128) NOT NULL,
  `newItem` tinyint(1) DEFAULT NULL,
  `costImage` varchar(128) DEFAULT NULL,
  `buyImage` varchar(128) DEFAULT NULL,
  `purchaseType` varchar(32) DEFAULT NULL,
  `objectName` varchar(32) DEFAULT NULL,
  `purchaselimit` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `shopitems`
--

LOCK TABLES `shopitems` WRITE;
/*!40000 ALTER TABLE `shopitems` DISABLE KEYS */;
/*!40000 ALTER TABLE `shopitems` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `templateportals`
--

DROP TABLE IF EXISTS `templateportals`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `templateportals` (
  `id` int NOT NULL AUTO_INCREMENT,
  `templateID` int NOT NULL,
  `portalType` int NOT NULL,
  `faction` int NOT NULL,
  `locX` int NOT NULL,
  `locY` int NOT NULL,
  `locZ` int NOT NULL,
  `displayID` int NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `templateportals`
--

LOCK TABLES `templateportals` WRITE;
/*!40000 ALTER TABLE `templateportals` DISABLE KEYS */;
/*!40000 ALTER TABLE `templateportals` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `templates`
--

DROP TABLE IF EXISTS `templates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `templates` (
  `id` int NOT NULL,
  `name` varchar(32) NOT NULL,
  `size` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `templates`
--

LOCK TABLES `templates` WRITE;
/*!40000 ALTER TABLE `templates` DISABLE KEYS */;
/*!40000 ALTER TABLE `templates` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `username` varchar(32) NOT NULL,
  `password` varchar(32) NOT NULL,
  PRIMARY KEY (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `world_time`
--

DROP TABLE IF EXISTS `world_time`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `world_time` (
  `id` int NOT NULL AUTO_INCREMENT,
  `world_name` varchar(50) NOT NULL,
  `year` int NOT NULL DEFAULT '1',
  `month` int NOT NULL DEFAULT '1',
  `day` int NOT NULL DEFAULT '1',
  `hour` int NOT NULL DEFAULT '0',
  `minute` int NOT NULL DEFAULT '0',
  `second` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `world_name_2` (`world_name`),
  KEY `world_name` (`world_name`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8 AVG_ROW_LENGTH=16384;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `world_time`
--

LOCK TABLES `world_time` WRITE;
/*!40000 ALTER TABLE `world_time` DISABLE KEYS */;
INSERT INTO `world_time` VALUES (2,'Local',5,10,18,18,35,0);
/*!40000 ALTER TABLE `world_time` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2021-03-27 17:22:16

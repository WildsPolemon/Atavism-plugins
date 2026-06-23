-- MySQL dump 10.13  Distrib 8.0.23, for Linux (x86_64)
--
-- Host: 127.0.0.1    Database: atavism
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
-- Table structure for table `backdating_tables`
--

DROP TABLE IF EXISTS `backdating_tables`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `backdating_tables` (
  `DBName` varchar(255) CHARACTER SET latin1 COLLATE latin1_swedish_ci DEFAULT NULL,
  `TableName` varchar(255) CHARACTER SET latin1 COLLATE latin1_swedish_ci DEFAULT NULL,
  `oid_manager_Type` varchar(255) CHARACTER SET latin1 COLLATE latin1_swedish_ci DEFAULT NULL,
  `DisplayName` varchar(255) CHARACTER SET latin1 COLLATE latin1_swedish_ci DEFAULT NULL,
  `LastUpdate` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 AVG_ROW_LENGTH=16384;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `backdating_tables`
--

LOCK TABLES `backdating_tables` WRITE;
/*!40000 ALTER TABLE `backdating_tables` DISABLE KEYS */;
INSERT INTO `backdating_tables` VALUES ('world_content','item_templates','ITEM','Item Template DB','2015-08-15 00:15:33');
/*!40000 ALTER TABLE `backdating_tables` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `custom_banned`
--

DROP TABLE IF EXISTS `custom_banned`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `custom_banned` (
  `name` varchar(20) NOT NULL,
  `reason` varchar(255) DEFAULT NULL,
  `bannedby` varchar(20) DEFAULT NULL,
  `expire` datetime DEFAULT NULL,
  PRIMARY KEY (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `custom_banned`
--

LOCK TABLES `custom_banned` WRITE;
/*!40000 ALTER TABLE `custom_banned` DISABLE KEYS */;
/*!40000 ALTER TABLE `custom_banned` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `custom_profanity`
--

DROP TABLE IF EXISTS `custom_profanity`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `custom_profanity` (
  `name` varchar(20) NOT NULL,
  `reason` varchar(255) DEFAULT NULL,
  `bannedby` varchar(20) DEFAULT NULL,
  PRIMARY KEY (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `custom_profanity`
--

LOCK TABLES `custom_profanity` WRITE;
/*!40000 ALTER TABLE `custom_profanity` DISABLE KEYS */;
/*!40000 ALTER TABLE `custom_profanity` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `history_objstore`
--

DROP TABLE IF EXISTS `history_objstore`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `history_objstore` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `obj_id` bigint DEFAULT NULL,
  `namespace_int` tinyint DEFAULT NULL,
  `world_name` varchar(64) DEFAULT NULL,
  `locX` int DEFAULT NULL,
  `locY` int DEFAULT NULL,
  `locZ` int DEFAULT NULL,
  `instance` bigint DEFAULT NULL,
  `metadata` varchar(255) DEFAULT NULL,
  `type` varchar(255) DEFAULT NULL,
  `name` varchar(255) DEFAULT NULL,
  `persistence_key` varchar(255) DEFAULT NULL,
  `data` longblob,
  `timestamp` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id_UNIQUE` (`id`),
  KEY `metadata` (`metadata`),
  KEY `name` (`name`),
  KEY `persistence_key` (`persistence_key`),
  KEY `type` (`type`)
) ENGINE=InnoDB AUTO_INCREMENT=34981 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `history_objstore`
--

LOCK TABLES `history_objstore` WRITE;
/*!40000 ALTER TABLE `history_objstore` DISABLE KEYS */;
/*!40000 ALTER TABLE `history_objstore` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `namespaces`
--

DROP TABLE IF EXISTS `namespaces`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `namespaces` (
  `namespace_string` varchar(64) NOT NULL,
  `namespace_int` tinyint NOT NULL,
  PRIMARY KEY (`namespace_string`),
  UNIQUE KEY `namespace_int` (`namespace_int`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 AVG_ROW_LENGTH=963;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `namespaces`
--

LOCK TABLES `namespaces` WRITE;
/*!40000 ALTER TABLE `namespaces` DISABLE KEYS */;
INSERT INTO `namespaces` VALUES ('NS.transient',1),('NS.master',2),('NS.wmgr',3),('NS.combat',4),('NS.mob',5),('NS.inv',6),('NS.item',7),('NS.quest',8),('NS.playerqueststates',9),('NS.voice',10),('NS.wminstance',11),('NS.instance',12),('NS.trainer',13),('NS.classability',14),('NS.billing',15),('social',16),('NS.faction',17),('NS.combatinstance',18),('NS.mobserverinstance',19);
/*!40000 ALTER TABLE `namespaces` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `objstore`
--

DROP TABLE IF EXISTS `objstore`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `objstore` (
  `obj_id` bigint NOT NULL,
  `namespace_int` tinyint NOT NULL,
  `world_name` varchar(64) DEFAULT NULL,
  `locX` decimal(65,2) DEFAULT NULL,
  `locY` decimal(65,2) DEFAULT NULL,
  `locZ` decimal(65,2) DEFAULT NULL,
  `instance` bigint DEFAULT NULL,
  `metadata` varchar(255) DEFAULT NULL,
  `type` varchar(255) DEFAULT NULL,
  `name` varchar(255) DEFAULT NULL,
  `persistence_key` varchar(255) DEFAULT NULL,
  `data` longblob,
  PRIMARY KEY (`obj_id`,`namespace_int`),
  KEY `metadata` (`metadata`),
  KEY `name` (`name`),
  KEY `persistence_key` (`persistence_key`),
  KEY `type` (`type`),
  KEY `type_name` (`type`,`name`),
  KEY `world_name_instance_namespace_int` (`world_name`,`instance`,`namespace_int`),
  KEY `world_name_namespace_int_name` (`world_name`,`namespace_int`,`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `objstore`
--

LOCK TABLES `objstore` WRITE;
/*!40000 ALTER TABLE `objstore` DISABLE KEYS */;
/*!40000 ALTER TABLE `objstore` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `oid_manager`
--

DROP TABLE IF EXISTS `oid_manager`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `oid_manager` (
  `token` int NOT NULL,
  `free_oid` bigint DEFAULT NULL,
  PRIMARY KEY (`token`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 AVG_ROW_LENGTH=16384;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `oid_manager`
--

LOCK TABLES `oid_manager` WRITE;
/*!40000 ALTER TABLE `oid_manager` DISABLE KEYS */;
INSERT INTO `oid_manager` VALUES (1,195301);
/*!40000 ALTER TABLE `oid_manager` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `player_character`
--

DROP TABLE IF EXISTS `player_character`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `player_character` (
  `account_id` bigint DEFAULT NULL,
  `world_name` varchar(64) NOT NULL,
  `obj_id` bigint NOT NULL,
  `namespace_int` tinyint NOT NULL,
  KEY `player_character_ibfk_1` (`obj_id`,`namespace_int`),
  CONSTRAINT `player_character_ibfk_1` FOREIGN KEY (`obj_id`, `namespace_int`) REFERENCES `objstore` (`obj_id`, `namespace_int`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `player_character`
--

LOCK TABLES `player_character` WRITE;
/*!40000 ALTER TABLE `player_character` DISABLE KEYS */;
/*!40000 ALTER TABLE `player_character` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `player_item_sockets`
--

DROP TABLE IF EXISTS `player_item_sockets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `player_item_sockets` (
  `item_oid` bigint NOT NULL,
  `socket_item_id` bigint NOT NULL DEFAULT '0',
  `socket_id` smallint NOT NULL,
  `world_name` varchar(64) NOT NULL,
  PRIMARY KEY (`socket_id`,`world_name`,`item_oid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `player_item_sockets`
--

LOCK TABLES `player_item_sockets` WRITE;
/*!40000 ALTER TABLE `player_item_sockets` DISABLE KEYS */;
/*!40000 ALTER TABLE `player_item_sockets` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `player_items`
--

DROP TABLE IF EXISTS `player_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `player_items` (
  `obj_id` bigint NOT NULL,
  `templateID` int NOT NULL,
  `stackSize` int NOT NULL DEFAULT '1',
  `inv.backref` int NOT NULL,
  `persistenceFlag` tinyint NOT NULL,
  `item_equipInfo` varchar(20) DEFAULT NULL,
  `world_name` varchar(64) NOT NULL,
  `enchant_level` int NOT NULL DEFAULT '0',
  `durability` int NOT NULL,
  `creationtimestamp` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`obj_id`,`world_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `player_items`
--

LOCK TABLES `player_items` WRITE;
/*!40000 ALTER TABLE `player_items` DISABLE KEYS */;
/*!40000 ALTER TABLE `player_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `plugin_status`
--

DROP TABLE IF EXISTS `plugin_status`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `plugin_status` (
  `world_name` varchar(64) NOT NULL,
  `agent_name` varchar(64) NOT NULL,
  `plugin_name` varchar(64) NOT NULL,
  `plugin_type` varchar(16) NOT NULL,
  `host_name` varchar(64) NOT NULL,
  `pid` int DEFAULT NULL,
  `run_id` bigint DEFAULT NULL,
  `percent_cpu_load` int DEFAULT NULL,
  `last_update_time` bigint DEFAULT NULL,
  `next_update_time` bigint DEFAULT NULL,
  `status` varchar(255) DEFAULT NULL,
  `info` varchar(255) DEFAULT NULL,
  KEY `agent_name` (`agent_name`) USING BTREE,
  KEY `plugin_name` (`plugin_name`),
  KEY `world_name` (`world_name`) USING BTREE
) ENGINE=MEMORY DEFAULT CHARSET=utf8 AVG_ROW_LENGTH=2388;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `plugin_status`
--

LOCK TABLES `plugin_status` WRITE;
/*!40000 ALTER TABLE `plugin_status` DISABLE KEYS */;
/*!40000 ALTER TABLE `plugin_status` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2021-03-27 17:22:46

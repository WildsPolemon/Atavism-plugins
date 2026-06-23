-- MySQL dump 10.13  Distrib 8.0.23, for Linux (x86_64)
--
-- Host: 127.0.0.1    Database: master
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
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(64) DEFAULT NULL,
  `password` varchar(128) DEFAULT NULL,
  `email` varchar(64) DEFAULT NULL,
  `status` int DEFAULT '1',
  `birthdate` date DEFAULT NULL,
  `activated` tinyint(1) DEFAULT NULL,
  `suspended` tinyint(1) DEFAULT NULL,
  `activation_key` varchar(32) DEFAULT NULL,
  `current_world_id` int NOT NULL DEFAULT '-1',
  `created_at` datetime DEFAULT NULL,
  `last_modified_at` datetime DEFAULT NULL,
  `coin_current` int NOT NULL DEFAULT '0',
  `coin_total` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  KEY `email` (`email`),
  KEY `username_2` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `account`
--

LOCK TABLES `account` WRITE;
/*!40000 ALTER TABLE `account` DISABLE KEYS */;
INSERT INTO `account` VALUES (15,'aaa','aaa','aaa',1,NULL,1,1,NULL,1,NULL,NULL,0,0);
/*!40000 ALTER TABLE `account` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `account_character`
--

DROP TABLE IF EXISTS `account_character`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `account_character` (
  `id` int NOT NULL AUTO_INCREMENT,
  `account_id` int NOT NULL,
  `character_id` bigint NOT NULL,
  `world_server_id` int NOT NULL,
  `status` int NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=63 DEFAULT CHARSET=utf8;
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
  `itemCount` int DEFAULT NULL,
  `itemPurchaseDate` timestamp NOT NULL DEFAULT '1999-12-31 23:00:00',
  `itemClaimDate` timestamp NULL DEFAULT NULL,
  `itemClaims` text,
  PRIMARY KEY (`id`),
  KEY `account_id` (`account_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `account_purchases`
--

LOCK TABLES `account_purchases` WRITE;
/*!40000 ALTER TABLE `account_purchases` DISABLE KEYS */;
/*!40000 ALTER TABLE `account_purchases` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `account_setting`
--

DROP TABLE IF EXISTS `account_setting`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `account_setting` (
  `id` int NOT NULL AUTO_INCREMENT,
  `account_id` int NOT NULL,
  `setting` varchar(45) NOT NULL,
  `settingValue` varchar(45) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `account_setting`
--

LOCK TABLES `account_setting` WRITE;
/*!40000 ALTER TABLE `account_setting` DISABLE KEYS */;
/*!40000 ALTER TABLE `account_setting` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `bonuses`
--

DROP TABLE IF EXISTS `bonuses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bonuses` (
  `id` int NOT NULL AUTO_INCREMENT,
  `character_oid` bigint NOT NULL,
  `object` varchar(60) NOT NULL,
  `code` varchar(60) NOT NULL,
  `value` int NOT NULL,
  `valuep` float NOT NULL,
  PRIMARY KEY (`id`),
  KEY `character_oid` (`character_oid`,`object`,`code`),
  KEY `character_oid_2` (`character_oid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bonuses`
--

LOCK TABLES `bonuses` WRITE;
/*!40000 ALTER TABLE `bonuses` DISABLE KEYS */;
/*!40000 ALTER TABLE `bonuses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `developer`
--

DROP TABLE IF EXISTS `developer`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `developer` (
  `dev_id` int NOT NULL AUTO_INCREMENT,
  `email` varchar(64) NOT NULL,
  `company` varchar(64) DEFAULT NULL,
  `password` varchar(64) DEFAULT NULL,
  `size` varchar(64) DEFAULT NULL,
  `skill` varchar(64) DEFAULT NULL,
  `prior` varchar(64) DEFAULT NULL,
  `genre` varchar(64) DEFAULT NULL,
  `idea` text,
  PRIMARY KEY (`dev_id`),
  UNIQUE KEY `email` (`email`),
  KEY `email_2` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `developer`
--

LOCK TABLES `developer` WRITE;
/*!40000 ALTER TABLE `developer` DISABLE KEYS */;
/*!40000 ALTER TABLE `developer` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `vip`
--

DROP TABLE IF EXISTS `vip`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `vip` (
  `account_id` int NOT NULL,
  `character_oid` int NOT NULL,
  `world` varchar(20) NOT NULL,
  `vip_level` int NOT NULL,
  `vip_expire` bigint NOT NULL,
  `vip_points` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `vip`
--

LOCK TABLES `vip` WRITE;
/*!40000 ALTER TABLE `vip` DISABLE KEYS */;
/*!40000 ALTER TABLE `vip` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `world`
--

DROP TABLE IF EXISTS `world`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `world` (
  `world_id` int NOT NULL AUTO_INCREMENT,
  `dev_id` int DEFAULT '-1',
  `world_name` varchar(64) DEFAULT NULL,
  `pretty_name` varchar(64) DEFAULT NULL,
  `description` text,
  `server_name` varchar(64) DEFAULT NULL,
  `server_port` int DEFAULT NULL,
  `public` int DEFAULT NULL,
  `approved` tinyint(1) DEFAULT NULL,
  `patcher_URL` varchar(255) DEFAULT NULL,
  `media_URL` varchar(255) DEFAULT NULL,
  `logo_URL` varchar(255) DEFAULT NULL,
  `detail_URL` varchar(255) DEFAULT NULL,
  `display_order` int DEFAULT NULL,
  `population` int NOT NULL DEFAULT '0',
  `max_population` int NOT NULL DEFAULT '100',
  `server_type` varchar(64) DEFAULT NULL,
  `status` varchar(64) DEFAULT NULL,
  `last_update` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`world_id`),
  UNIQUE KEY `world_name` (`world_name`),
  KEY `world_name_2` (`world_name`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `world`
--

LOCK TABLES `world` WRITE;
/*!40000 ALTER TABLE `world` DISABLE KEYS */;
/*!40000 ALTER TABLE `world` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2021-03-27 17:23:03

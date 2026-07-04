CREATE DATABASE IF NOT EXISTS `atavism_admin`;
CREATE DATABASE IF NOT EXISTS `atavism`;
CREATE DATABASE IF NOT EXISTS `atavism_master`;
CREATE DATABASE IF NOT EXISTS `world_content`;

USE `atavism_admin`;
CREATE TABLE IF NOT EXISTS `server` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `action` VARCHAR(64) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS `server_status` (
  `server` VARCHAR(32) NOT NULL,
  `status` TINYINT(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`server`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
INSERT IGNORE INTO `server_status` (`server`, `status`) VALUES ('auth', 0), ('world', 0);
CREATE TABLE IF NOT EXISTS `server_version` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `server_version` VARCHAR(64) DEFAULT '10.13.0',
  `installation_type` VARCHAR(64) DEFAULT 'dev',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
INSERT IGNORE INTO `server_version` (`id`, `server_version`, `installation_type`) VALUES (1, '10.13.0', 'dev');

USE `atavism`;
CREATE TABLE IF NOT EXISTS `plugin_status` (
  `plugin_type` VARCHAR(64) NOT NULL,
  `info` VARCHAR(255) DEFAULT '',
  PRIMARY KEY (`plugin_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
INSERT IGNORE INTO `plugin_status` (`plugin_type`, `info`) VALUES ('Prefab', 'a=1,b=2,version=10.13.0');

USE `world_content`;

CREATE TABLE IF NOT EXISTS `abilities` (
  `id` INT NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `passive` TINYINT(1) NOT NULL DEFAULT 0,
  `toggle` TINYINT(1) NOT NULL DEFAULT 0,
  `isactive` TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `editor_option` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `optionType` VARCHAR(255) NOT NULL,
  `isactive` TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `editor_option_choice` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `optionTypeID` INT NOT NULL,
  `choice` VARCHAR(255) NOT NULL,
  `isactive` TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `class_ability_by_level` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `aspect` INT NOT NULL,
  `player_level` INT NOT NULL,
  `ability_id` INT NOT NULL,
  `auto_learn` TINYINT(1) NOT NULL DEFAULT 1,
  `unlearn_on_delevel` TINYINT(1) NOT NULL DEFAULT 1,
  `sort_order` INT NOT NULL DEFAULT 0,
  `isactive` TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  KEY `idx_aspect_level` (`aspect`, `player_level`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `game_settings` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `setting_key` VARCHAR(255) NOT NULL,
  `setting_value` VARCHAR(255) NOT NULL,
  `description` VARCHAR(512) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `setting_key` (`setting_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

DELETE FROM `abilities`;
INSERT INTO `abilities` (`id`, `name`, `passive`, `toggle`, `isactive`) VALUES
  (100001, 'Battle Stance', 0, 1, 1),
  (100002, 'Heroic Strike', 0, 0, 1),
  (100004, 'Charge', 0, 0, 1),
  (100005, 'Rend', 0, 0, 1),
  (100006, 'Thunder Clap', 0, 0, 1);

DELETE FROM `editor_option`;
INSERT INTO `editor_option` (`id`, `optionType`, `isactive`) VALUES (1, 'Class', 1);

DELETE FROM `editor_option_choice`;
INSERT INTO `editor_option_choice` (`optionTypeID`, `choice`, `isactive`) VALUES
  (1, 'Warrior', 1),
  (1, 'Paladin', 1),
  (1, 'Hunter', 1);

DELETE FROM `class_ability_by_level`;
INSERT INTO `class_ability_by_level`
  (`aspect`, `player_level`, `ability_id`, `auto_learn`, `unlearn_on_delevel`, `sort_order`, `isactive`)
VALUES
  (1, 1, 100001, 1, 1, 10, 1),
  (1, 1, 100002, 1, 1, 20, 1),
  (1, 4, 100004, 1, 1, 10, 1),
  (1, 6, 100005, 1, 1, 10, 1),
  (1, 8, 100006, 1, 1, 10, 1);

INSERT INTO `game_settings` (`setting_key`, `setting_value`, `description`)
VALUES ('CLASS_ABILITIES_BY_LEVEL_ENABLED', 'true', 'Auto-learn class spells from class_ability_by_level on level-up')
ON DUPLICATE KEY UPDATE `setting_value` = VALUES(`setting_value`);

CREATE USER IF NOT EXISTS 'atavism'@'localhost' IDENTIFIED BY 'atavism';
CREATE USER IF NOT EXISTS 'atavism'@'127.0.0.1' IDENTIFIED BY 'atavism';
GRANT ALL PRIVILEGES ON `atavism_admin`.* TO 'atavism'@'localhost';
GRANT ALL PRIVILEGES ON `atavism`.* TO 'atavism'@'localhost';
GRANT ALL PRIVILEGES ON `atavism_master`.* TO 'atavism'@'localhost';
GRANT ALL PRIVILEGES ON `world_content`.* TO 'atavism'@'localhost';
GRANT ALL PRIVILEGES ON `atavism_admin`.* TO 'atavism'@'127.0.0.1';
GRANT ALL PRIVILEGES ON `atavism`.* TO 'atavism'@'127.0.0.1';
GRANT ALL PRIVILEGES ON `atavism_master`.* TO 'atavism'@'127.0.0.1';
GRANT ALL PRIVILEGES ON `world_content`.* TO 'atavism'@'127.0.0.1';
FLUSH PRIVILEGES;

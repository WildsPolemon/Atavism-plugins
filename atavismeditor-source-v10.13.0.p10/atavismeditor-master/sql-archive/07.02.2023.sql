
CREATE TABLE `world_content`.`level_xp_requirements_reward_templates` (
  `reward_template_id` int(11) NOT NULL AUTO_INCREMENT,
  `reward_template_name` varchar(86) DEFAULT NULL,
  `reward_mail_subject` varchar(255) DEFAULT '',
  `reward_mail_message` text,
  `isactive` tinyint(1) DEFAULT '1',
  `creationtimestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatetimestamp` datetime NOT NULL DEFAULT '2000-01-01 00:00:00',
  PRIMARY KEY (`reward_template_id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8;


CREATE TABLE `world_content`.`level_xp_requirements_rewards` (
  `reward_id` int(11) NOT NULL AUTO_INCREMENT,
  `reward_template_id` int(11) DEFAULT NULL,
  `reward_type` varchar(86) DEFAULT NULL,
  `reward_value` int(11) DEFAULT NULL,
  `reward_amount` int(11) DEFAULT NULL,
  `give_once` TINYINT(1) NOT NULL DEFAULT '1',
  `on_level_down` TINYINT(1) NOT NULL DEFAULT '0',
  `isactive` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`reward_id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8;

CREATE TABLE `level_xp_requirements_templates` (
  `xpProfile` int(11) NOT NULL AUTO_INCREMENT,
  `xpProfile_name` varchar(86) DEFAULT NULL,
  `isactive` tinyint(1) DEFAULT '1',
  `creationtimestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatetimestamp` datetime NOT NULL DEFAULT '2000-01-01 00:00:00',
  PRIMARY KEY (`xpProfile`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8;


ALTER TABLE `world_content`.`level_xp_requirements`
ADD COLUMN `xpProfile` INT(11) NOT NULL DEFAULT '1' FIRST,
ADD COLUMN `reward_template_id` INT(11) NULL DEFAULT '-1' AFTER `updatetimestamp`,
DROP PRIMARY KEY,
ADD PRIMARY KEY (`xpProfile`, `level`);

ALTER TABLE `world_content`.`character_create_template`
ADD COLUMN `xpProfile` INT(11) NULL DEFAULT '1';

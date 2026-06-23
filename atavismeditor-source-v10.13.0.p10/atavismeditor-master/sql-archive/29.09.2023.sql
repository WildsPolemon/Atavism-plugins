ALTER TABLE `abilities`
ADD `stealth_reduction_amount` INT NOT NULL DEFAULT '0' AFTER `damageType`,
ADD `stealth_reduction_percentage` FLOAT NOT NULL DEFAULT '0' AFTER `stealth_reduction_amount`,
ADD `stealth_reduction_timeout` BIGINT NOT NULL DEFAULT '0' AFTER `stealth_reduction_percentage`,
ADD `skill_up_chance` INT NOT NULL DEFAULT '0' AFTER `stealth_reduction_timeout`,
ADD `miss_chance` FLOAT NOT NULL DEFAULT '0.05' AFTER `skill_up_chance`,
ADD `tags_on_caster` TEXT NOT NULL AFTER `miss_chance`,
ADD `tags_on_target` TEXT NOT NULL AFTER `tags_on_caster`,
ADD `tags_not_on_caster` TEXT NOT NULL AFTER `tags_on_target`,
ADD `tags_not_on_target` TEXT NOT NULL AFTER `tags_not_on_caster`,
ADD `pulse_tags_on_caster` TEXT NOT NULL AFTER `tags_not_on_target`,
ADD `pulse_tags_on_target` TEXT NOT NULL AFTER `pulse_tags_on_caster`,
ADD `pulse_tags_not_on_caster` TEXT NOT NULL AFTER `pulse_tags_on_target`,
ADD `pulse_tags_not_on_target` TEXT NOT NULL AFTER `pulse_tags_not_on_caster`;

CREATE TABLE `ability_combos` (
  `id` INT NOT NULL AUTO_INCREMENT ,
  `ability_parent_id` int(11) NOT NULL,
  `ability_sub_id` int(11) NOT NULL,
  `chance_min` float NOT NULL DEFAULT '0',
  `chance_max` float NOT NULL DEFAULT '100',
  `show_in_center_ui` tinyint(1) NOT NULL DEFAULT '1',
  `replace_in_slot` tinyint(1) NOT NULL DEFAULT '1',
  `time` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  INDEX(`ability_parent_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

ALTER TABLE `abilities` ADD `is_child` BOOLEAN NOT NULL DEFAULT FALSE AFTER `pulse_tags_not_on_caster`;
ALTER TABLE `abilities` ADD `line_of_sight` BOOLEAN NOT NULL DEFAULT FALSE AFTER `is_child`;
ALTER TABLE `abilities` ADD `casterState` INT NOT NULL DEFAULT '1' AFTER `targetState`;

CREATE TABLE `ability_abilities` (
 `id` INT NOT NULL AUTO_INCREMENT ,
 `ability_id` INT NOT NULL ,
 `target` VARCHAR(64) NOT NULL ,
 `ability` INT NOT NULL,
 `delay` INT NOT NULL ,
 `chance_min` FLOAT NOT NULL ,
 `chance_max` FLOAT NOT NULL ,
 PRIMARY KEY (`id`),
 INDEX (`ability_id`)
) ENGINE = InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE `ability_effects` (
 `id` INT NOT NULL AUTO_INCREMENT ,
 `ability_id` INT NOT NULL ,
 `target` VARCHAR(64) NOT NULL ,
 `effect` INT NOT NULL,
 `delay` INT NOT NULL ,
 `chance_min` FLOAT NOT NULL ,
 `chance_max` FLOAT NOT NULL ,
 PRIMARY KEY (`id`),
 INDEX (`ability_id`)
) ENGINE = InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE `abilities_triggers` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `ability_id` int(11) NOT NULL DEFAULT '-1',
  `trigger_id` int(11) NOT NULL DEFAULT '-1',
  `creationtimestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatetimestamp` datetime NOT NULL DEFAULT '2000-01-01 00:00:00',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE `abilities_triggers_profile` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(64) NOT NULL,
  `event_type` int(11) NOT NULL,
  `tags` text NOT NULL,
  `race` int(11) NOT NULL DEFAULT '-1',
  `class` int(11) NOT NULL DEFAULT '-1',
  `action_type` tinyint(4) NOT NULL,
  `chance_min` float NOT NULL DEFAULT '0',
  `chance_max` float NOT NULL DEFAULT '100',
  `isactive` tinyint(1) NOT NULL DEFAULT '1',
  `creationtimestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatetimestamp` datetime NOT NULL DEFAULT '2000-01-01 00:00:00',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE `abilities_triggers_actions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `abilities_triggers_id` int(11) NOT NULL,
  `target` int(11) NOT NULL,
  `ability` int(11) NOT NULL,
  `effect` int(11) NOT NULL,
  `mod_v` int(11) NOT NULL DEFAULT '0',
  `mod_p` float NOT NULL DEFAULT '0',
  `chance_min` float NOT NULL,
  `chance_max` float NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

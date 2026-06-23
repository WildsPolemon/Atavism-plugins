CREATE TABLE `mob_behavior_profile` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(256) NOT NULL,
  `isactive` tinyint(1) NOT NULL,
  `creationtimestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatetimestamp` datetime NOT NULL DEFAULT '2000-01-01 00:00:00',
 PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE `mob_behaviors` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `profile_id` int(11) NOT NULL,
  `behavior_order` int(11) NOT NULL,
  `type` int(11) NOT NULL COMMENT '0-Melee; 1-Ranged Offensive; 2-Ranged Defensive; 3-Defend; 4-Flee; 5-Heal',
  `flee_type` int(11) NOT NULL COMMENT '0-Opposite direction;1-Defined position;2-To group friendly mobs',
  `ability_interval` int(11) NOT NULL,
  `mob_tag` int(11) NOT NULL,
  `ignore_chase_distance` tinyint(1) NOT NULL DEFAULT '1',
  `weapon` int(11) NOT NULL DEFAULT '-1',
  `creationtimestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatetimestamp` datetime NOT NULL DEFAULT '2000-01-01 00:00:00',
 PRIMARY KEY (`id`)
 ) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE `behavior_conditions_group` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `group_order` int(11) NOT NULL,
  `behavior_id` int(11) NOT NULL,
  `creationtimestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatetimestamp` datetime NOT NULL DEFAULT '2000-01-01 00:00:00',
 PRIMARY KEY (`id`)
 ) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE `behavior_conditions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `conditions_group_id` int(11) NOT NULL,
  `type` int(11) NOT NULL COMMENT '0-Event; 1-Distance; 2-Stat; 3-Effect; 4-CombatState; 5-DeathState; 6-NumberOfTargets',
  `distance` float NOT NULL,
  `less` tinyint(1) NOT NULL,
  `stat_name` varchar(256) NOT NULL,
  `stat_value` float NOT NULL,
  `stat_vitality_percentage` tinyint(1) NOT NULL,
  `target` int(11) NOT NULL COMMENT '0-Caster; 1-Target',
  `effect_tag_id` int(11) NOT NULL,
  `on_target` tinyint(1) NOT NULL,
  `combat_state` tinyint(1) NOT NULL,
  `death_state` tinyint(1) NOT NULL,
  `trigger_event_Id` int(11) NOT NULL COMMENT '0-Parry; 1-Dodge; 2-Miss; 3-Damage; 4-Heal; 5-Critical; 6-Kill; 7-Stun; 8-Sleep',
  `target_number` int(11) NOT NULL,
  `target_ally` tinyint(1) NOT NULL,
  `creationtimestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatetimestamp` datetime NOT NULL DEFAULT '2000-01-01 00:00:00',
 PRIMARY KEY (`id`)
 ) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE `mob_ability` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `mob_ability_order` int(11) NOT NULL,
  `behavior_id` int(11) NOT NULL,
  `abilities` text NOT NULL ,
  `too_close_range_percentage` float NOT NULL COMMENT 'if Too Close Abilty Range Percentage',
  `too_far_range_percentage` float NOT NULL,
  `mob_ability_type` int(11) NOT NULL COMMENT '0-Abilites; 1-Start Abiliies; 2-End Abilities',
  `creationtimestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatetimestamp` datetime NOT NULL DEFAULT '2000-01-01 00:00:00',
 PRIMARY KEY (`id`)
 ) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE `mob_ability_conditions_group` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `group_order` int(11) NOT NULL,
  `mob_ability_id` int(11) NOT NULL,
  `creationtimestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatetimestamp` datetime NOT NULL DEFAULT '2000-01-01 00:00:00',
 PRIMARY KEY (`id`)
 ) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE `mob_ability_conditions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `conditions_group_id` int(11) NOT NULL,
  `type` int(11) NOT NULL COMMENT '0-Event; 1-Distance; 2-Stat; 3-Effect; 4-CombatState; 5-DeathState; 6-NumberOfTargets',
  `distance` float NOT NULL,
  `less` tinyint(1) NOT NULL,
  `stat_name` varchar(256) NOT NULL,
  `stat_value` float NOT NULL,
  `stat_vitality_percentage` tinyint(1) NOT NULL,
  `target` int(11) NOT NULL COMMENT '0-Caster; 1-Target',
  `effect_tag_id` int(11) NOT NULL,
  `on_target` tinyint(1) NOT NULL,
  `combat_state` tinyint(1) NOT NULL,
  `death_state` tinyint(1) NOT NULL,
  `trigger_event_Id` int(11) NOT NULL COMMENT '0-Parry; 1-Dodge; 2-Miss; 3-Damage; 4-Heal; 5-Critical; 6-Kill; 7-Stun; 8-Sleep',
  `target_number` int(11) NOT NULL,
  `target_ally` tinyint(1) NOT NULL,
  `creationtimestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatetimestamp` datetime NOT NULL DEFAULT '2000-01-01 00:00:00',
 PRIMARY KEY (`id`)
 ) ENGINE=InnoDB DEFAULT CHARSET=utf8;

CREATE TABLE IF NOT EXISTS `mob_behavior_points` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `behavior_id` int(11) NOT NULL,
  `loc_x` float NOT NULL,
  `loc_y` float NOT NULL,
  `loc_z` float NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 AUTO_INCREMENT=1 ;

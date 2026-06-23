CREATE TABLE `global_events` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(256) NOT NULL,
  `description` text NOT NULL,
  `start_year` int(11) NOT NULL DEFAULT '-1',
  `start_month` int(11) NOT NULL DEFAULT '-1',
  `start_day` int(11) NOT NULL DEFAULT '-1',
  `start_hour` int(11) NOT NULL,
  `start_minute` int(11) NOT NULL,
  `end_year` int(11) NOT NULL DEFAULT '-1',
  `end_month` int(11) NOT NULL DEFAULT '-1',
  `end_day` int(11) NOT NULL DEFAULT '-1',
  `end_hour` int(11) NOT NULL,
  `end_minute` int(11) NOT NULL,
  `icon` varchar(256) NOT NULL,
  `icon2` mediumtext NOT NULL,
  `isactive` tinyint(1) NOT NULL,
  `creationtimestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatetimestamp` datetime NOT NULL DEFAULT '2010-01-01 00:00:00',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8;

CREATE TABLE `global_events_bonuses` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `global_event_id` int(11) NOT NULL,
  `bonus_settings_id` int(11) NOT NULL,
  `value` int(11) NOT NULL,
  `valuep` float NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8;

CREATE TABLE `auction_profile` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(256) NOT NULL,
  `cost_price_value` int(11) NOT NULL,
  `cost_price_value_percentage` float NOT NULL,
  `currency` int(11) NOT NULL,
  `duration` int(11) NOT NULL,
  `display_limit` int(11) NOT NULL,
  `own_limit` int(11) NOT NULL,
  `start_price_value` int(11) NOT NULL,
  `start_price_percentage` float NOT NULL,
  `isactive` tinyint(1) NOT NULL,
  `creationtimestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatetimestamp` datetime NOT NULL DEFAULT '2000-01-01 00:00:00',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8;

INSERT INTO `auction_profile` (`id`, `name`, `cost_price_value`, `cost_price_value_percentage`, `currency`, `duration`, `display_limit`, `own_limit`, `start_price_value`, `start_price_percentage`, `isactive`, `creationtimestamp`, `updatetimestamp`) VALUES
(1, 'default', 2, 5, 3, 8, 100, 10, 1, 10, 1, '2021-07-25 12:19:44', '2000-01-01 00:00:00');

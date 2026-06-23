ALTER TABLE `resource_node_sub_profile`
ADD `lootCount` INT(11) NOT NULL DEFAULT '10' AFTER `deactivationDelay`,
ADD `ensureLoot` BOOLEAN NOT NULL DEFAULT '1' AFTER `lootCount`;

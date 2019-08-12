CREATE TABLE `profiles` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `steam64id` tinytext NOT NULL,
  `tsuid` tinytext NOT NULL,
  `active` tinyint(1) NOT NULL DEFAULT '0',
  `status` tinyint NOT NULL DEFAULT '1'
  PRIMARY KEY (`id`)
);
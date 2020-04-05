USE `p2pdatabase`;

DROP TABLE IF EXISTS `peer`;

CREATE TABLE `peer` (
  `id` INT(10) NOT NULL AUTO_INCREMENT,
  `temporaryId` CHAR(20) NOT NULL,
  `name` VARCHAR(20) NOT NULL,
  `email` VARCHAR(20) NOT NULL,
  PRIMARY KEY (`id`)
);

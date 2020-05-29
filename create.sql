USE `p2pdatabase`;

DROP TABLE IF EXISTS `peer`;
DROP TABLE IF EXISTS `wanted`;

CREATE TABLE `peer` (
  `id` INT(10) AUTO_INCREMENT,
  `name` VARCHAR(20) NOT NULL,
  `email` VARCHAR(50) NOT NULL UNIQUE,
  `UUID` VARCHAR(50) NOT NULL UNIQUE,
  PRIMARY KEY (`id`)
);

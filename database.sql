CREATE DATABASE digimium;
USE digimium;
CREATE TABLE `product_list` (
    `product_id` INT NOT NULL AUTO_INCREMENT,
    `product_name` VARCHAR(150) NOT NULL,
    `duration` VARCHAR(50) NOT NULL,
    `supplier` VARCHAR(100) DEFAULT NULL,
    `wc_price` DECIMAL(10, 2) DEFAULT NULL,
    `retail_price` DECIMAL(10, 2) DEFAULT NULL,
    `notes` TEXT,
    `link` TEXT,
    PRIMARY KEY (`product_id`)
);
-- product_sodl
CREATE TABLE `product_sold` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `product_id` INT DEFAULT NULL,
    `product_name` VARCHAR(255) NOT NULL,
    `duration` VARCHAR(50) NOT NULL,
    `customer` VARCHAR(150) DEFAULT NULL,
    `gmail` VARCHAR(150) DEFAULT NULL,
    `price` DECIMAL(10, 2) DEFAULT NULL,
    `profit` DECIMAL(10, 2) DEFAULT '0.00',
    `purchase_date` DATE DEFAULT NULL,
    `end_date` DATE DEFAULT NULL,
    `seller` VARCHAR(100) DEFAULT NULL,
    `note` TEXT,
    PRIMARY KEY (`id`)
);
CREATE TABLE `wc_product_sold` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `product_id` INT DEFAULT NULL,
    `product_name` VARCHAR(255) NOT NULL,
    `customer` VARCHAR(150) DEFAULT NULL,
    `email` VARCHAR(150) DEFAULT NULL,
    `quantity` INT DEFAULT '1',
    `price` DECIMAL(10, 2) NOT NULL,
    `profit` DECIMAL(10, 2) DEFAULT '0.00',
    `seller` VARCHAR(100) DEFAULT NULL,
    `note` TEXT,
    `date` DATE DEFAULT NULL,
    PRIMARY KEY (`id`)
);
CREATE TABLE `wc_product_list` (
    `product_id` INT NOT NULL AUTO_INCREMENT,
    `product_name` VARCHAR(150) NOT NULL,
    `duration` VARCHAR(50) NOT NULL,
    `supplier` VARCHAR(100) DEFAULT NULL,
    `wc_price` DECIMAL(10, 2) DEFAULT NULL,
    `retail_price` DECIMAL(10, 2) DEFAULT NULL,
    `notes` TEXT,
    `link` TEXT,
    PRIMARY KEY (`product_id`)
);
CREATE TABLE `user` (
    `id` INT NOT NULL AUTO_INCREMENT,
    `username` VARCHAR(100) NOT NULL,
    `password` VARCHAR(255) NOT NULL,
    `privilege` ENUM('owner', 'admin', 'staff') NOT NULL DEFAULT 'staff',
    PRIMARY KEY (`id`),
    UNIQUE KEY `username` (`username`)
);
INSERT INTO user (id, username, password, privilege)
VALUES (
        1,
        'administrator',
        '$2y$10$zhZL2jdXcwFwQwk4WiUJ6.Y5Lp/ZBgmaL81g7hKhpaEcndNKDVcgW',
        'owner'
    );
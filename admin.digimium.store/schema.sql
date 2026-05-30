-- Digimium Admin — local development schema
-- Run: mysql -u root -p digimium_admin < schema.sql

CREATE DATABASE IF NOT EXISTS `digimium_admin`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `digimium_admin`;

-- -------------------------------------------------------
-- users
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
  `user_id`       INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  `username`      VARCHAR(50)     NOT NULL,
  `pass_hash`     VARCHAR(255)    NOT NULL,
  `role`          ENUM('Owner','Admin','Staff') NOT NULL DEFAULT 'Staff',
  `is_active`     TINYINT(1)      NOT NULL DEFAULT 1,
  `last_login_at` DATETIME        NULL DEFAULT NULL,
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `uq_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------
-- products_catalog  (retail store)
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS `products_catalog` (
  `product_id`   INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  `product_name` VARCHAR(255)    NOT NULL,
  `duration`     INT             NOT NULL DEFAULT 1,
  `renew`        INT             NOT NULL DEFAULT 0,
  `supplier`     VARCHAR(255)    NULL DEFAULT NULL,
  `wholesale`    DECIMAL(10,2)   NOT NULL DEFAULT 0.00,
  `retail`       DECIMAL(10,2)   NOT NULL DEFAULT 0.00,
  `note`         TEXT            NULL DEFAULT NULL,
  `link`         VARCHAR(2083)   NULL DEFAULT NULL,
  `store`        TINYINT         NOT NULL DEFAULT 0,
  PRIMARY KEY (`product_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------
-- sale_overview  (retail sales)
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS `sale_overview` (
  `sale_id`        INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  `sale_product`   VARCHAR(255)  NOT NULL,
  `duration`       INT           NOT NULL DEFAULT 1,
  `renew`          INT           NOT NULL DEFAULT 0,
  `customer`       VARCHAR(255)  NOT NULL,
  `email`          VARCHAR(255)  NULL DEFAULT NULL,
  `purchased_date` DATE          NOT NULL,
  `expired_date`   DATE          NULL DEFAULT NULL,
  `manager`        VARCHAR(255)  NULL DEFAULT NULL,
  `note`           TEXT          NULL DEFAULT NULL,
  `price`          DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `profit`         DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `store`          INT           NOT NULL DEFAULT 0,
  PRIMARY KEY (`sale_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------
-- ws_products_catalog  (wholesale catalog)
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS `ws_products_catalog` (
  `product_id`   INT UNSIGNED    NOT NULL AUTO_INCREMENT,
  `product_name` VARCHAR(255)    NOT NULL,
  `duration`     INT             NOT NULL DEFAULT 1,
  `renew`        INT             NOT NULL DEFAULT 0,
  `supplier`     VARCHAR(255)    NULL DEFAULT NULL,
  `wholesale`    DECIMAL(10,2)   NOT NULL DEFAULT 0.00,
  `retail`       DECIMAL(10,2)   NOT NULL DEFAULT 0.00,
  `note`         TEXT            NULL DEFAULT NULL,
  `link`         VARCHAR(2083)   NULL DEFAULT NULL,
  PRIMARY KEY (`product_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------
-- ws_sale_overview  (wholesale sales)
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS `ws_sale_overview` (
  `sale_id`        INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  `sale_product`   VARCHAR(255)  NOT NULL,
  `duration`       INT           NULL DEFAULT NULL,
  `quantity`       INT           NOT NULL DEFAULT 1,
  `renew`          INT           NOT NULL DEFAULT 0,
  `customer`       VARCHAR(255)  NOT NULL,
  `email`          VARCHAR(255)  NULL DEFAULT NULL,
  `purchased_date` DATE          NOT NULL,
  `expired_date`   DATE          NULL DEFAULT NULL,
  `manager`        VARCHAR(255)  NULL DEFAULT NULL,
  `note`           TEXT          NULL DEFAULT NULL,
  `price`          DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `profit`         DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  PRIMARY KEY (`sale_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -------------------------------------------------------
-- bot_users
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS `bot_users` (
  `id`       INT UNSIGNED NOT NULL AUTO_INCREMENT,
  `username` VARCHAR(255) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Run seed.php after importing this schema to create the initial admin user:
--   php seed.php

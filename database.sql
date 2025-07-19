CREATE DATABASE digimium;
USE digimium;
CREATE TABLE user (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    privilege ENUM('admin', 'staff', 'viewer') NOT NULL DEFAULT 'staff'
);
CREATE TABLE product_list (
    product_id INT AUTO_INCREMENT PRIMARY KEY,
    product_name VARCHAR(150) NOT NULL,
    duration VARCHAR(50) NOT NULL,
    supplier VARCHAR(100),
    wc_price DECIMAL(10, 2),
    retail_price DECIMAL(10, 2),
    notes TEXT,
    link TEXT
);
CREATE TABLE product_sold (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    duration VARCHAR(50) NOT NULL,
    customer VARCHAR(150),
    price DECIMAL(10, 2),
    purchase_date DATE,
    end_date DATE,
    seller VARCHAR(100),
    note TEXT,
    FOREIGN KEY (product_id) REFERENCES product_list(product_id) ON DELETE CASCADE
);
SELECT product_id,
    product_name,
    duration
FROM product_list;
ALTER TABLE product_sold
ADD COLUMN gmail VARCHAR(150)
AFTER customer;
CREATE TABLE product_sold (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    duration VARCHAR(50) NOT NULL,
    customer VARCHAR(150),
    gmail VARCHAR(150),
    -- Newly added
    price DECIMAL(10, 2),
    purchase_date DATE,
    end_date DATE,
    seller VARCHAR(100),
    note TEXT,
    FOREIGN KEY (product_id) REFERENCES product_list(product_id) ON DELETE CASCADE
);
ALTER TABLE product_sold
ADD COLUMN product_name VARCHAR(255);
ALTER TABLE product_sold
ADD COLUMN profit DECIMAL(10, 2) DEFAULT 0;
ALTER TABLE product_sold DROP COLUMN product_id;
CREATE DATABASE digimium;
USE digimium;
-- User Table
CREATE TABLE user (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    privilege ENUM('admin', 'staff', 'viewer') NOT NULL DEFAULT 'staff'
);
-- Product List Table
CREATE TABLE product_list (
    product_id INT AUTO_INCREMENT PRIMARY KEY,
    product_name VARCHAR(150) NOT NULL,
    duration VARCHAR(50) NOT NULL,
    supplier VARCHAR(100),
    wc_price DECIMAL(10, 2),
    retail_price DECIMAL(10, 2),
    notes TEXT,
    link TEXT
);
-- Product Sold Table (NO product_id, uses product_name instead)
CREATE TABLE product_sold (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT,
    product_name VARCHAR(255) NOT NULL,
    duration VARCHAR(50) NOT NULL,
    customer VARCHAR(150),
    gmail VARCHAR(150),
    price DECIMAL(10, 2),
    profit DECIMAL(10, 2) DEFAULT 0,
    purchase_date DATE,
    end_date DATE,
    seller VARCHAR(100),
    note TEXT
);
ALTER TABLE product_sold
ADD COLUMN product_id INT
AFTER id;
create database digimium;
use digimium;
INSERT INTO users (username, password, privilege)
VALUES ('kaunglinthant', SHA2('kaunglinthant1', 256), 1);
INSERT INTO users (username, password, privilege)
VALUES ('someone', SHA2('some1', 256), 2);
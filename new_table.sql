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
    product_id INT,
    -- optional reference to product_list
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
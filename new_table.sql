CREATE TABLE user (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    privilege ENUM('owner', 'admin', 'staff') NOT NULL DEFAULT 'staff'
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
CREATE TABLE wc_product_list (
    product_id INT AUTO_INCREMENT PRIMARY KEY,
    product_name VARCHAR(150) NOT NULL,
    duration VARCHAR(50) NOT NULL,
    supplier VARCHAR(100),
    wc_price DECIMAL(10, 2),
    retail_price DECIMAL(10, 2),
    notes TEXT,
    link TEXT
);
CREATE TABLE wc_product_sold (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT,
    product_name VARCHAR(255) NOT NULL,
    customer VARCHAR(150),
    date DATE,
    email VARCHAR(150),
    quantity INT DEFAULT 1,
    price DECIMAL(10, 2) NOT NULL,
    profit DECIMAL(10, 2) DEFAULT 0,
    seller VARCHAR(100),
    note TEXT
);
INSERT INTO user (id, username, password, privilege)
VALUES (
        1,
        'administrator',
        '$2y$10$zhZL2jdXcwFwQwk4WiUJ6.Y5Lp/ZBgmaL81g7hKhpaEcndNKDVcgW',
        'owner'
    );
INSERT INTO wc_product_list (
        product_name,
        duration,
        supplier,
        wc_price,
        retail_price,
        notes,
        link
    )
VALUES (
        'Adobe Photoshop',
        '1 Year',
        'Adobe Inc.',
        25000.00,
        30000.00,
        'Popular image editing software.',
        'https://www.adobe.com/products/photoshop.html'
    ),
    (
        'Microsoft Office 365',
        '1 Year',
        'Microsoft',
        22000.00,
        27000.00,
        'Includes Word, Excel, PowerPoint.',
        'https://www.office.com'
    ),
    (
        'Grammarly Premium',
        '3 Months',
        'Grammarly',
        8000.00,
        12000.00,
        'Helps with grammar and tone checking.',
        'https://www.grammarly.com'
    ),
    (
        'Canva Pro',
        '6 Months',
        NULL,
        10000.00,
        14000.00,
        'Design tool with templates.',
        'https://www.canva.com'
    ),
    (
        'NordVPN',
        '1 Year',
        'Nord Security',
        18000.00,
        24000.00,
        'Secure and private VPN service.',
        'https://nordvpn.com'
    ),
    (
        'ChatGPT Plus',
        '1 Month',
        'OpenAI',
        6000.00,
        8000.00,
        'Access to GPT-4 features.',
        'https://chat.openai.com'
    ),
    (
        'Filmora X',
        'Lifetime',
        'Wondershare',
        32000.00,
        40000.00,
        'Video editing software.',
        'https://filmora.wondershare.com'
    ),
    (
        'Skillshare Membership',
        '1 Year',
        'Skillshare',
        12000.00,
        16000.00,
        'Access to creative learning classes.',
        'https://www.skillshare.com'
    ),
    (
        'Spotify Premium',
        '6 Months',
        NULL,
        9000.00,
        11000.00,
        'Ad-free music streaming.',
        'https://www.spotify.com'
    ),
    (
        'Figma Professional',
        '1 Year',
        'Figma',
        28000.00,
        35000.00,
        'Professional design collaboration tool.',
        'https://www.figma.com'
    );
Administrator Digimiumadministrator25
ALTER TABLE wc_product_sold
ADD COLUMN `date` DATE;
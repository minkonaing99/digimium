<?php
// $host = 'localhost';
// $port = 3307;
// $dbname = 'digimium';
// $username = 'root';
// $password = 'Tkhantnaing1';
$host = 'digimium-server.cxgik26kid7z.ap-southeast-1.rds.amazonaws.com';
$username = 'admin';
$port = 3306;
$password = 'Tkhantnaing1'; // replace with your RDS password
$dbname = 'digimium';

try {
    $pdo = new PDO("mysql:host=$host;port=$port;dbname=$dbname;charset=utf8mb4", $username, $password);
    // Set error mode to exception
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    // Optional: turn off emulated prepared statements for better security
    $pdo->setAttribute(PDO::ATTR_EMULATE_PREPARES, false);
} catch (PDOException $e) {
    die("Database connection failed: " . $e->getMessage());
}

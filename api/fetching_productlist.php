<?php
header('Content-Type: application/json');
require_once 'dbinfo.php';

try {
    $stmt = $pdo->query("SELECT * FROM product_list ORDER BY product_name ASC");
    $products = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'status' => 'success',
        'data' => $products
    ]);
} catch (PDOException $e) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Failed to fetch product list: ' . $e->getMessage()
    ]);
}

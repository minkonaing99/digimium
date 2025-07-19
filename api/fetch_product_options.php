<?php
require_once 'dbinfo.php'; // Make sure the path is correct

header('Content-Type: application/json');

try {
    $stmt = $pdo->prepare("SELECT product_id, product_name, duration, wc_price, retail_price FROM product_list ORDER BY product_name ASC");
    $stmt->execute();
    $products = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'status' => 'success',
        'products' => $products
    ]);
} catch (PDOException $e) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Database error: ' . $e->getMessage()
    ]);
}

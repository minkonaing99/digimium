<?php
require_once './dbinfo.php';
header('Content-Type: application/json');

try {
    $stmt = $pdo->prepare("
        SELECT 
            product_name,
            customer,
            purchase_date,
            end_date
        FROM product_sold
    ");
    $stmt->execute();
    $results = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'status' => 'success',
        'data' => $results
    ]);
} catch (PDOException $e) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Database error: ' . $e->getMessage()
    ]);
}

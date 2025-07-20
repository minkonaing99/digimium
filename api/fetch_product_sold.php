<?php
require_once 'session_check.php';
require_once 'dbinfo.php';

try {
    $stmt = $pdo->prepare("
        SELECT 
    id, 
    product_name, 
    duration, 
    customer, 
    gmail, 
    price, 
    purchase_date, 
    end_date, 
    seller, 
    note
FROM 
    product_sold
ORDER BY 
    purchase_date DESC, 
    id DESC;

    ");
    $stmt->execute();
    $data = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'status' => 'success',
        'data' => $data
    ]);
} catch (PDOException $e) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Database error: ' . $e->getMessage()
    ]);
}

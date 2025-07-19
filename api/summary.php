<?php
require_once './dbinfo.php';
header('Content-Type: application/json');

try {
    // Get date from POST
    $filterDate = $_POST['date'] ?? '';

    if (!$filterDate) {
        echo json_encode(['status' => 'error', 'message' => 'Date is required.']);
        exit;
    }

    // No more JOIN needed — product_name and price are stored directly
    $stmt = $pdo->prepare("
        SELECT id, product_name, customer, price, end_date
        FROM product_sold
        WHERE purchase_date = :date
        ORDER BY id DESC
    ");

    $stmt->execute([':date' => $filterDate]);
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

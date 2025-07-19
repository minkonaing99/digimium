<?php
require_once './dbinfo.php';
header('Content-Type: application/json');

try {
    $product_id     = isset($_POST['product_id']) ? (int) $_POST['product_id'] : 0;
    $customer       = trim($_POST['customer'] ?? '');
    $gmail          = trim($_POST['gmail'] ?? '');
    $price          = $_POST['price'] ?? null;
    $purchase_date  = $_POST['purchase_date'] ?? null;
    $end_date       = $_POST['end_date'] ?? null;
    $seller         = trim($_POST['seller'] ?? '');
    $note           = trim($_POST['note'] ?? '');

    if (
        !$product_id || !$customer || !$gmail ||
        !$price || !$purchase_date || !$end_date || !$seller
    ) {
        echo json_encode(['status' => 'error', 'message' => 'Missing required fields.']);
        exit;
    }

    // Optional: Validate email format only if not default "-"
    if ($gmail !== '-' && !filter_var($gmail, FILTER_VALIDATE_EMAIL)) {
        echo json_encode(['status' => 'error', 'message' => 'Invalid email format.']);
        exit;
    }

    $stmt = $pdo->prepare("
        INSERT INTO product_sold 
            (product_id, duration, customer, gmail, price, purchase_date, end_date, seller, note)
        VALUES 
            (:product_id, 
             (SELECT duration FROM product_list WHERE product_id = :duration_product_id), 
             :customer, :gmail, :price, :purchase_date, :end_date, :seller, :note)
    ");

    $stmt->execute([
        ':product_id'          => $product_id,
        ':duration_product_id' => $product_id,
        ':customer'            => $customer,
        ':gmail'               => $gmail,
        ':price'               => $price,
        ':purchase_date'       => $purchase_date,
        ':end_date'            => $end_date,
        ':seller'              => $seller,
        ':note'                => $note ?: '-'
    ]);

    echo json_encode(['status' => 'success', 'message' => 'Product sold record inserted.']);
} catch (PDOException $e) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Database error: ' . $e->getMessage()
    ]);
}

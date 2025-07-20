<?php
require_once './dbinfo.php';
header('Content-Type: application/json');

try {
    $product_id   = isset($_POST['product_id']) ? (int) $_POST['product_id'] : 0;
    $product_name = trim($_POST['product_name'] ?? '');
    $customer     = trim($_POST['customer'] ?? '');
    $email        = trim($_POST['email'] ?? '');
    $quantity     = isset($_POST['quantity']) ? (int) $_POST['quantity'] : 1;
    $price        = isset($_POST['price']) ? floatval($_POST['price']) : 0;
    $profit       = isset($_POST['profit']) ? floatval($_POST['profit']) : 0;
    $seller       = trim($_POST['seller'] ?? '');
    $note         = trim($_POST['note'] ?? '-');
    $date         = $_POST['date'] ?? null;

    // ✅ Basic validation
    if (!$product_id || !$product_name || !$price || !$date || !$seller) {
        echo json_encode(['status' => 'error', 'message' => 'Missing required fields.']);
        exit;
    }

    // ✅ Email validation (if not empty or dash)
    if ($email !== '-' && $email && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        echo json_encode(['status' => 'error', 'message' => 'Invalid email format.']);
        exit;
    }

    // ✅ Quantity fallback
    if ($quantity <= 0) $quantity = 1;

    $stmt = $pdo->prepare("
        INSERT INTO wc_product_sold 
        (product_id, product_name, customer, email, quantity, price, profit, seller, note, date)
        VALUES
        (:product_id, :product_name, :customer, :email, :quantity, :price, :profit, :seller, :note, :date)
    ");

    $stmt->execute([
        ':product_id'   => $product_id,
        ':product_name' => $product_name,
        ':customer'     => $customer,
        ':email'        => $email ?: '-',
        ':quantity'     => $quantity,
        ':price'        => $price,
        ':profit'       => $profit,
        ':seller'       => $seller,
        ':note'         => $note ?: '-',
        ':date'         => $date
    ]);

    echo json_encode(['status' => 'success', 'message' => 'WC product sold record inserted.']);
} catch (PDOException $e) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Database error: ' . $e->getMessage()
    ]);
}

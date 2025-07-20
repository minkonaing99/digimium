<?php
require_once './dbinfo.php';
header('Content-Type: application/json');

try {
    $product_id     = isset($_POST['product_id']) ? (int) $_POST['product_id'] : 0;
    $customer       = trim($_POST['customer'] ?? '');
    $gmail          = trim($_POST['gmail'] ?? '');
    $purchase_date  = $_POST['purchase_date'] ?? null;
    $end_date       = $_POST['end_date'] ?? null;
    $seller         = trim($_POST['seller'] ?? '');
    $note           = trim($_POST['note'] ?? '');
    $profit         = isset($_POST['profit']) ? floatval($_POST['profit']) : 0;

    if (!$product_id || !$customer || !$gmail || !$purchase_date || !$end_date || !$seller) {
        echo json_encode(['status' => 'error', 'message' => 'Missing required fields.']);
        exit;
    }

    if ($gmail !== '-' && !filter_var($gmail, FILTER_VALIDATE_EMAIL)) {
        echo json_encode(['status' => 'error', 'message' => 'Invalid email format.']);
        exit;
    }

    $stmt = $pdo->prepare("SELECT product_name, duration, retail_price FROM product_list WHERE product_id = ?");
    $stmt->execute([$product_id]);
    $product = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$product) {
        echo json_encode(['status' => 'error', 'message' => 'Product not found.']);
        exit;
    }

    $price = isset($_POST['price']) ? floatval($_POST['price']) : floatval($product['retail_price']);

    $stmt = $pdo->prepare("
        INSERT INTO product_sold 
            (product_id, product_name, duration, customer, gmail, price, purchase_date, end_date, seller, note, profit)
        VALUES 
            (:product_id, :product_name, :duration, :customer, :gmail, :price, :purchase_date, :end_date, :seller, :note, :profit)
    ");

    $stmt->execute([
        ':product_id'    => $product_id,
        ':product_name'  => $product['product_name'],
        ':duration'      => $product['duration'],
        ':customer'      => $customer,
        ':gmail'         => $gmail,
        ':price'         => $price,
        ':purchase_date' => $purchase_date,
        ':end_date'      => $end_date,
        ':seller'        => $seller,
        ':note'          => $note ?: '-',
        ':profit'        => $profit
    ]);

    echo json_encode(['status' => 'success', 'message' => 'Product sold record inserted.']);
} catch (PDOException $e) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Database error: ' . $e->getMessage()
    ]);
}

<?php
header('Content-Type: application/json');
require_once 'dbinfo.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405); // Method Not Allowed
    echo json_encode(['status' => 'error', 'message' => 'Invalid request method.']);
    exit;
}

try {
    // Trim and sanitize input
    $product_name  = htmlspecialchars(trim($_POST['product_name'] ?? ''));
    $duration      = htmlspecialchars(trim($_POST['duration'] ?? ''));
    $supplier      = htmlspecialchars(trim($_POST['supplier'] ?? ''));
    $wc_price      = $_POST['wc_price'] ?? null;
    $retail_price  = $_POST['retail_price'] ?? null;
    $notes         = htmlspecialchars(trim($_POST['notes'] ?? '-')) ?: '-';
    $link          = htmlspecialchars(trim($_POST['link'] ?? '-')) ?: '-';

    // Validate required fields
    if (!$product_name || !$duration || !$supplier || !is_numeric($wc_price) || !is_numeric($retail_price)) {
        throw new Exception('Invalid or missing required fields.');
    }

    // Optional: check input length limits (based on DB schema)
    if (strlen($product_name) > 150 || strlen($supplier) > 100 || strlen($duration) > 50) {
        throw new Exception('Input too long.');
    }

    // Insert safely using prepared statements
    $stmt = $pdo->prepare("
        INSERT INTO product_list 
        (product_name, duration, supplier, wc_price, retail_price, notes, link) 
        VALUES (:product_name, :duration, :supplier, :wc_price, :retail_price, :notes, :link)
    ");

    $stmt->execute([
        ':product_name'  => $product_name,
        ':duration'      => $duration,
        ':supplier'      => $supplier,
        ':wc_price'      => $wc_price,
        ':retail_price'  => $retail_price,
        ':notes'         => $notes,
        ':link'          => $link
    ]);

    echo json_encode(['status' => 'success']);
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}

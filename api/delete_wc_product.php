<?php
header('Content-Type: application/json');
require_once 'dbinfo.php';
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['status' => 'error', 'message' => 'Invalid request method']);
    exit;
}
$product_id = $_POST['product_id'] ?? null;

if (!$product_id || !is_numeric($product_id)) {
    echo json_encode(['status' => 'error', 'message' => 'Invalid product ID']);
    exit;
}
try {
    $stmt = $pdo->prepare("DELETE FROM wc_product_list WHERE product_id = :product_id");
    $stmt->execute([':product_id' => $product_id]);
    echo json_encode(['status' => 'success']);
} catch (PDOException $e) {
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}

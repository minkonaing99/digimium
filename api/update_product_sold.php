<?php
require_once './dbinfo.php';
header('Content-Type: application/json');

try {
    $id            = (int) ($_POST['id'] ?? 0);
    $product_id    = (int) ($_POST['product_id'] ?? 0);
    $customer      = trim($_POST['customer'] ?? '');
    $gmail         = trim($_POST['gmail'] ?? '-');
    $purchase_date = $_POST['purchase_date'] ?? '';
    $end_date      = $_POST['end_date'] ?? '';
    $seller        = trim($_POST['seller'] ?? '');
    $note          = trim($_POST['note'] ?? '-');

    if (!$id || !$product_id || !$customer || !$purchase_date || !$end_date || !$seller) {
        echo json_encode(['status' => 'error', 'message' => 'Missing required fields']);
        exit;
    }

    if ($gmail !== '-' && !filter_var($gmail, FILTER_VALIDATE_EMAIL)) {
        echo json_encode(['status' => 'error', 'message' => 'Invalid email format']);
        exit;
    }

    $stmt = $pdo->prepare("
        UPDATE product_sold
        SET product_id = :product_id,
            customer = :customer,
            gmail = :gmail,
            purchase_date = :purchase_date,
            end_date = :end_date,
            seller = :seller,
            note = :note
        WHERE id = :id
    ");
    $stmt->execute([
        ':id'            => $id,
        ':product_id'    => $product_id,
        ':customer'      => $customer,
        ':gmail'         => $gmail,
        ':purchase_date' => $purchase_date,
        ':end_date'      => $end_date,
        ':seller'        => $seller,
        ':note'          => $note
    ]);

    echo json_encode(['status' => 'success']);
} catch (PDOException $e) {
    echo json_encode(['status' => 'error', 'message' => $e->getMessage()]);
}

<?php
header('Content-Type: application/json');
require_once 'dbinfo.php';

try {
    $product_id    = isset($_POST['product_id']) ? intval($_POST['product_id']) : 0;
    $product_name  = trim($_POST['product_name'] ?? '');
    $duration      = trim($_POST['duration'] ?? '');
    $supplier      = trim($_POST['supplier'] ?? '');
    $wc_price      = trim($_POST['wc_price'] ?? '');
    $retail_price  = trim($_POST['retail_price'] ?? '');
    $notes         = trim($_POST['notes'] ?? '');
    $link          = trim($_POST['link'] ?? '');

    if (!$product_id || !$product_name || !$duration || $wc_price === '' || $retail_price === '') {
        echo json_encode(['status' => 'error', 'message' => 'Missing required fields.']);
        exit;
    }

    $sql = "UPDATE wc_product_list 
            SET product_name = :product_name,
                duration = :duration,
                supplier = :supplier,
                wc_price = :wc_price,
                retail_price = :retail_price,
                notes = :notes,
                link = :link
            WHERE product_id = :product_id";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        ':product_name'  => $product_name,
        ':duration'      => $duration,
        ':supplier'      => $supplier,
        ':wc_price'      => $wc_price,
        ':retail_price'  => $retail_price,
        ':notes'         => $notes,
        ':link'          => $link,
        ':product_id'    => $product_id
    ]);
    echo json_encode(['status' => 'success']);
} catch (PDOException $e) {
    echo json_encode(['status' => 'error', 'message' => 'Database error: ' . $e->getMessage()]);
}

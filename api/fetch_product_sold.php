<?php
require_once 'dbinfo.php';

try {
    $stmt = $pdo->prepare("
        SELECT ps.id, pl.product_name, pl.duration, ps.customer, ps.gmail, ps.price, ps.purchase_date, ps.end_date, ps.seller, ps.note
        FROM product_sold ps
        JOIN product_list pl ON ps.product_id = pl.product_id
        ORDER BY ps.purchase_date DESC, ps.id DESC
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

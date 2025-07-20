<?php
require_once './dbinfo.php';
header('Content-Type: application/json');
if (!isset($_POST['id']) || !is_numeric($_POST['id'])) {
    echo json_encode(['status' => 'error', 'message' => 'Invalid or missing ID']);
    exit;
}
$id = (int) $_POST['id'];
try {
    $stmt = $pdo->prepare("DELETE FROM product_sold WHERE id = :id");
    $stmt->execute([':id' => $id]);

    echo json_encode(['status' => 'success', 'message' => 'Deleted successfully']);
} catch (PDOException $e) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Database error: ' . $e->getMessage()
    ]);
}

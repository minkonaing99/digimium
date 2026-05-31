<?php
// api/ws_product_delete.php
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    header('Allow: POST');
    echo json_encode(['success' => false, 'error' => 'Method not allowed. Use POST.']);
    exit;
}

require_once __DIR__ . '/session_bootstrap.php';
require_once __DIR__ . '/auth.php';

auth_require_login(['admin', 'owner']);

try {
    $raw  = file_get_contents('php://input');
    $data = json_decode($raw, true);
    if (!is_array($data)) {
        throw new \InvalidArgumentException('Invalid JSON payload.');
    }

    $id = isset($data['id']) ? (int)$data['id'] : 0;
    if ($id <= 0) {
        http_response_code(422);
        echo json_encode(['success' => false, 'error' => 'Valid product ID is required.']);
        exit;
    }

    try {
        \Digimium\Core\ProductRepository::wholesale(\Digimium\Core\Database::connection())->delete($id);
    } catch (\Digimium\Core\NotFoundException) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Product not found.']);
        exit;
    }

    echo json_encode(['success' => true]);
} catch (\Throwable $e) {
    error_log('ws_product_delete.php error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Server error']);
}

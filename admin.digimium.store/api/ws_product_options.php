<?php
// api/ws_product_options.php
declare(strict_types=1);

require __DIR__ . '/session_bootstrap.php';
require __DIR__ . '/auth.php';

auth_require_login(['admin', 'owner', 'staff']);
session_write_close();

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

try {
    $products = \Digimium\Core\ProductRepository::wholesale(\Digimium\Core\Database::connection())->options();
    echo json_encode(
        ['status' => 'success', 'products' => $products],
        JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRESERVE_ZERO_FRACTION
    );
} catch (\Throwable $e) {
    error_log('ws_product_options.php error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['status' => 'error', 'message' => 'Server error'], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
}

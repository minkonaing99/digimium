<?php
// api/ws_sales_minimal.php
declare(strict_types=1);

require __DIR__ . '/session_bootstrap.php';
require __DIR__ . '/auth.php';

auth_require_login(['admin', 'owner', 'staff']);

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

ob_start();

try {
    ini_set('display_errors', '0');
    error_reporting(E_ALL);

    $rows = \Digimium\Core\SaleRepository::wholesale(\Digimium\Core\Database::connection())->getMinimal();

    ob_end_clean();
    echo json_encode(
        ['success' => true, 'data' => $rows],
        JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRESERVE_ZERO_FRACTION
    );
} catch (\Throwable $e) {
    ob_end_clean();
    http_response_code(500);
    error_log('ws_sales_minimal.php error: ' . $e->getMessage());
    echo json_encode(
        ['success' => false, 'error' => 'Server error'],
        JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES
    );
}

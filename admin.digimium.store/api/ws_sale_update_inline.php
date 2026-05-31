<?php
// api/ws_sale_update_inline.php
declare(strict_types=1);

require __DIR__ . '/session_bootstrap.php';
require __DIR__ . '/auth.php';

auth_require_login(['admin', 'owner', 'staff']);

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    header('Allow: POST');
    echo json_encode(['success' => false, 'error' => 'Method not allowed. Use POST.'], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

try {
    $input = file_get_contents('php://input');
    $data  = json_decode($input, true);

    if (!is_array($data)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Invalid JSON payload.'], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }

    if (!isset($data['id']) || !is_numeric($data['id']) || (int)$data['id'] < 1) {
        http_response_code(422);
        echo json_encode(['success' => false, 'error' => 'Valid sale ID is required.'], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }

    $sale_id       = (int)$data['id'];
    $allowedFields = ['customer', 'email', 'manager', 'note'];
    $updates       = [];

    foreach ($allowedFields as $field) {
        if (array_key_exists($field, $data)) {
            $updates[$field] = ($data[$field] === '' || $data[$field] === null)
                ? null : trim((string)$data[$field]);
        }
    }

    if (empty($updates)) {
        http_response_code(422);
        echo json_encode(['success' => false, 'error' => 'No valid fields to update.'], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }

    if (array_key_exists('email', $updates) && $updates['email'] !== null
        && !filter_var($updates['email'], FILTER_VALIDATE_EMAIL)
    ) {
        http_response_code(422);
        echo json_encode(['success' => false, 'error' => 'Invalid email format.'], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }

    $repo = \Digimium\Core\SaleRepository::wholesale(\Digimium\Core\Database::connection());
    if (!$repo->updateInlineFields($sale_id, $updates)) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Sale not found.'], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }

    echo json_encode(['success' => true], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
} catch (\Throwable $e) {
    error_log('ws_sale_update_inline.php error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Server error'], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
}

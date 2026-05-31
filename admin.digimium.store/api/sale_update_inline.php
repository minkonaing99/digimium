<?php
declare(strict_types=1);

require __DIR__ . '/session_bootstrap.php';
require __DIR__ . '/auth.php';

auth_require_login(['admin', 'owner', 'staff']);

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

ob_start();

set_error_handler(function ($severity, $message, $file, $line) {
    if (!(error_reporting() & $severity)) return false;
    throw new \ErrorException($message, 0, $severity, $file, $line);
});

function json_fail(string $msg, int $code = 400): void
{
    http_response_code($code);
    if (ob_get_length() !== false) ob_clean();
    echo json_encode(['success' => false, 'error' => $msg], JSON_UNESCAPED_UNICODE);
    while (ob_get_level() > 0) ob_end_flush();
    exit;
}
function json_ok(array $data = []): void
{
    if (ob_get_length() !== false) ob_clean();
    echo json_encode(['success' => true, 'data' => $data], JSON_UNESCAPED_UNICODE);
    while (ob_get_level() > 0) ob_end_flush();
    exit;
}

try {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        json_fail('Method not allowed. Use POST.', 405);
    }

    $raw  = file_get_contents('php://input') ?: '';
    $body = json_decode($raw, true);
    if (!is_array($body)) $body = [];

    $columnMap = ['customer' => 'customer', 'email' => 'email', 'manager' => 'manager', 'note' => 'note'];

    $id = $body['id'] ?? ($body['sale_id'] ?? ($body['saleId'] ?? null));
    $id = filter_var($id, FILTER_VALIDATE_INT);
    if (!$id || $id < 1) json_fail('Invalid or missing "id".', 422);

    $field = $body['field'] ?? null;
    $value = $body['value'] ?? null;
    if (!$field) {
        foreach (array_keys($columnMap) as $k) {
            if (array_key_exists($k, $body)) {
                $field = $k;
                $value = $body[$k];
                break;
            }
        }
    }
    if (!$field || !isset($columnMap[$field])) {
        json_fail('Missing or unsupported "field". Allowed: customer, email, manager, note.', 422);
    }

    if ($value !== null && !is_string($value)) {
        if (is_scalar($value)) $value = (string)$value;
        else json_fail('Invalid value type.', 422);
    }
    $value = is_string($value) ? trim($value) : null;

    switch ($field) {
        case 'customer':
            if ($value === null || $value === '') json_fail('"customer" cannot be empty.', 422);
            if (mb_strlen($value) > 255) json_fail('"customer" too long (max 255).', 422);
            break;
        case 'email':
            if ($value === '') $value = null;
            if ($value !== null) {
                if (!filter_var($value, FILTER_VALIDATE_EMAIL)) json_fail('Invalid email format.', 422);
                if (mb_strlen($value) > 255) json_fail('"email" too long (max 255).', 422);
            }
            break;
        case 'manager':
            if ($value === '') $value = null;
            if ($value !== null && mb_strlen($value) > 255) json_fail('"manager" too long (max 255).', 422);
            break;
        case 'note':
            if ($value === '') $value = null;
            break;
    }

    $repo = \Digimium\Core\SaleRepository::retail(\Digimium\Core\Database::connection());
    if (!$repo->updateInlineFields($id, [$field => $value])) {
        json_fail('Sale not found.', 404);
    }

    json_ok(['id' => $id, 'field' => $field, 'value' => $value]);
} catch (\Throwable $e) {
    error_log('sale_update_inline.php error: ' . $e->getMessage());
    json_fail('Update failed.', 500);
}

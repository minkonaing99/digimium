<?php
// api/product_update.php
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
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Invalid JSON payload.']);
        exit;
    }

    $id = isset($data['id']) ? (int)$data['id'] : 0;
    if ($id <= 0) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Missing or invalid id.']);
        exit;
    }

    $MAX_VARCHAR = 255;

    $trimOrNull = fn($v) => ($v === null || trim((string)$v) === '') ? null : trim((string)$v);
    $toInt      = fn($v) => ($v === '' || $v === null || $v === false || !is_numeric($v)) ? null : (int)$v;
    $toDecStr   = fn($v) => ($v === '' || $v === null || $v === false || !is_numeric($v)) ? null
                            : number_format((float)$v, 2, '.', '');
    $toRenewInt = function ($v) {
        if ($v === '' || $v === null) return null;
        if (is_bool($v)) return $v ? 1 : 0;
        if (is_numeric($v)) return (int)$v;
        $s = strtolower(trim((string)$v));
        if ($s === 'yes' || $s === 'true') return 1;
        if ($s === 'no'  || $s === 'false') return 0;
        return null;
    };

    $fields = [];
    $params = [':id' => $id];
    $errors = [];

    if (array_key_exists('product_name', $data)) {
        $product_name = $trimOrNull($data['product_name']);
        if (!$product_name)                                $errors['product_name'] = 'Product name cannot be empty.';
        elseif (mb_strlen($product_name) > $MAX_VARCHAR)   $errors['product_name'] = "Max {$MAX_VARCHAR} characters.";
        else { $fields[] = 'product_name = :product_name'; $params[':product_name'] = $product_name; }
    }

    if (array_key_exists('duration', $data)) {
        $duration = $toInt($data['duration']);
        if (!is_int($duration) || $duration < 1) $errors['duration'] = 'Duration must be an integer ≥ 1.';
        else { $fields[] = 'duration = :duration'; $params[':duration'] = $duration; }
    }

    if (array_key_exists('renew', $data)) {
        $renew = $toRenewInt($data['renew']);
        if (!is_int($renew) || $renew < 0) $errors['renew'] = 'Renew must be an integer ≥ 0.';
        else { $fields[] = 'renew = :renew'; $params[':renew'] = $renew; }
    }

    if (array_key_exists('supplier', $data)) {
        $supplier = $trimOrNull($data['supplier']);
        if ($supplier !== null && mb_strlen($supplier) > $MAX_VARCHAR) $errors['supplier'] = "Max {$MAX_VARCHAR} characters.";
        else { $fields[] = 'supplier = :supplier'; $params[':supplier'] = $supplier; }
    }

    if (array_key_exists('wholesale', $data)) {
        $wholesale = $toDecStr($data['wholesale']);
        if ($wholesale === null || (float)$wholesale < 0) $errors['wholesale'] = 'Wholesale must be a number ≥ 0.';
        else { $fields[] = 'wholesale = :wholesale'; $params[':wholesale'] = $wholesale; }
    }

    if (array_key_exists('retail', $data)) {
        $retail = $toDecStr($data['retail']);
        if ($retail === null) $errors['retail'] = 'Retail price is required.';
        else { $fields[] = 'retail = :retail'; $params[':retail'] = $retail; }
    }

    if (array_key_exists('note', $data)) {
        $note = $trimOrNull($data['note']);
        $fields[] = 'note = :note';
        $params[':note'] = $note;
    }

    if (array_key_exists('link', $data)) {
        $link = $trimOrNull($data['link']);
        if ($link !== null) {
            if (!preg_match('~^https?://~i', $link)) $link = 'https://' . $link;
            $link = preg_replace('/\s+/', '%20', $link);
        }
        $fields[] = 'link = :link';
        $params[':link'] = $link;
    }

    if ($errors) {
        http_response_code(422);
        echo json_encode(['success' => false, 'errors' => $errors]);
        exit;
    }

    if (!$fields) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'No updatable fields provided.']);
        exit;
    }

    $repo     = \Digimium\Core\ProductRepository::retail(\Digimium\Core\Database::connection());
    $existing = $repo->findById($id);
    if (!$existing) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Record not found.']);
        exit;
    }

    if (in_array('retail = :retail', $fields, true) || in_array('wholesale = :wholesale', $fields, true)) {
        $finalWholesale = isset($params[':wholesale']) ? (float)$params[':wholesale'] : (float)$existing['wholesale'];
        $finalRetail    = isset($params[':retail'])    ? (float)$params[':retail']    : (float)$existing['retail'];
        if ($finalRetail <= $finalWholesale) {
            http_response_code(422);
            echo json_encode(['success' => false, 'errors' => ['retail' => 'Retail must be greater than wholesale.']]);
            exit;
        }
    }

    $updated = $repo->updateFields($id, $fields, $params, $existing);
    echo json_encode(['success' => true, 'row' => $updated ?? $existing]);
} catch (\Throwable $e) {
    error_log('product_update.php error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Server error']);
}

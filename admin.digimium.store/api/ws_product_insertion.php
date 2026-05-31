<?php
// api/ws_product_insertion.php
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

    $MAX_VARCHAR   = 255;
    $ALLOWED_RENEW = [0, 1, 2, 3, 4, 5, 12];

    $trimOrNull = fn($v) => ($v === null || trim((string)$v) === '') ? null : trim((string)$v);
    $toInt      = fn($v) => ($v === '' || $v === null || $v === false || !is_numeric($v)) ? null : (int)$v;
    $toDecStr   = fn($v) => ($v === '' || $v === null || $v === false || !is_numeric($v)) ? null
                            : number_format((float)$v, 2, '.', '');

    $product_name = $trimOrNull($data['product_name'] ?? null);
    $duration     = $toInt($data['duration'] ?? null);
    $renewRaw     = $data['renew'] ?? null;
    $renew        = ($renewRaw === '' || $renewRaw === null) ? 0 : $toInt($renewRaw);
    $supplier     = $trimOrNull($data['supplier'] ?? null);
    $wholesaleStr = $toDecStr($data['wholesale'] ?? null);
    $retailStr    = $toDecStr($data['retail'] ?? null);
    $note         = $trimOrNull($data['note'] ?? null);
    $link         = $trimOrNull($data['link'] ?? null);

    if ($link !== null) {
        if (!preg_match('~^https?://~i', $link)) $link = 'https://' . $link;
        $link = preg_replace('/\s+/', '%20', $link);
    }

    $errors = [];
    if (!$product_name)                                              $errors['product_name'] = 'Product name is required.';
    elseif (mb_strlen($product_name) > $MAX_VARCHAR)                 $errors['product_name'] = "Max {$MAX_VARCHAR} characters.";
    if (!is_int($duration) || $duration < 1)                         $errors['duration']     = 'Duration must be an integer ≥ 1.';
    if (!is_int($renew) || !in_array($renew, $ALLOWED_RENEW, true))  $errors['renew']        = 'Renew must be one of 0,1,2,3,4,5,12.';
    if ($supplier !== null && mb_strlen($supplier) > $MAX_VARCHAR)   $errors['supplier']     = "Max {$MAX_VARCHAR} characters.";
    if ($wholesaleStr === null || (float)$wholesaleStr < 0)          $errors['wholesale']    = 'Wholesale must be a number ≥ 0.';
    if ($retailStr === null)                                          $errors['retail']       = 'Retail price is required.';
    elseif ((float)$retailStr <= (float)$wholesaleStr)               $errors['retail']       = 'Retail must be greater than wholesale.';

    if ($errors) {
        http_response_code(422);
        echo json_encode(['success' => false, 'errors' => $errors]);
        exit;
    }

    $id = \Digimium\Core\ProductRepository::wholesale(\Digimium\Core\Database::connection())->insert([
        'product_name' => $product_name,
        'duration'     => $duration,
        'renew'        => $renew,
        'supplier'     => $supplier,
        'wholesale'    => $wholesaleStr,
        'retail'       => $retailStr,
        'note'         => $note,
        'link'         => $link,
    ]);

    http_response_code(201);
    echo json_encode(['success' => true, 'id' => $id]);
} catch (\Throwable $e) {
    error_log('ws_product_insertion.php error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Server error']);
}

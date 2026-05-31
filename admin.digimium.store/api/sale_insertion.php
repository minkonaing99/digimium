<?php
// api/sale_insertion.php
declare(strict_types=1);

require __DIR__ . '/session_bootstrap.php';
require __DIR__ . '/auth.php';

auth_require_login(['admin', 'owner', 'staff']);

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    header('Allow: POST');
    echo json_encode(['success' => false, 'error' => 'Method not allowed. Use POST.']);
    exit;
}

try {
    $raw  = file_get_contents('php://input');
    $data = json_decode($raw, true);
    if (!is_array($data)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Invalid JSON payload.']);
        exit;
    }

    $MAX_VARCHAR   = 255;
    $ALLOWED_RENEW = [0, 1, 2, 3, 4, 5, 6, 12];

    $trimOrNull   = fn($v) => ($v === null || trim((string)$v) === '') ? null : trim((string)$v);
    $toInt        = fn($v) => ($v === '' || $v === null || $v === false || !is_numeric($v)) ? null : (int)$v;
    $toDecStr     = fn($v) => ($v === '' || $v === null || $v === false || !is_numeric($v)) ? null
                              : number_format((float)$v, 2, '.', '');
    $isYmd        = fn($s): bool => is_string($s) && $s !== ''
                              && ($dt = \DateTime::createFromFormat('Y-m-d', $s)) && $dt->format('Y-m-d') === $s;
    $addMonthsYmd = function (string $ymd, int $months): ?string {
        $dt = \DateTime::createFromFormat('Y-m-d', $ymd, new \DateTimeZone('UTC'));
        if (!$dt) return null;
        $day = (int)$dt->format('d');
        $dt->modify('first day of this month');
        $dt->modify("+{$months} month");
        $lastDay = (int)$dt->format('t');
        $dt->setDate((int)$dt->format('Y'), (int)$dt->format('m'), min($day, $lastDay));
        return $dt->format('Y-m-d');
    };

    $sale_product   = $trimOrNull($data['sale_product']   ?? null);
    $duration       = $toInt($data['duration']            ?? null);
    $renewRaw       = $data['renew']                      ?? 0;
    $renew          = is_numeric($renewRaw) ? (int)$renewRaw : 0;
    $customer       = $trimOrNull($data['customer']       ?? null);
    $email          = $trimOrNull($data['email']          ?? null);
    $purchased_date = $trimOrNull($data['purchased_date'] ?? null);
    $expired_date   = $trimOrNull($data['expired_date']   ?? null);
    $manager        = $trimOrNull($data['manager']        ?? null);
    $note           = $trimOrNull($data['note']           ?? null);
    $priceStr       = $toDecStr($data['price']            ?? null);
    $profitStr      = $toDecStr($data['profit']           ?? null);
    $store          = $toInt($data['store']               ?? null);

    $errors = [];
    if (!in_array($store, [0, 1, 2, 3, 4, 5], true))              $errors['store']          = 'Invalid store selected.';
    if (!$sale_product)                                            $errors['sale_product']   = 'Product is required.';
    elseif (mb_strlen($sale_product) > $MAX_VARCHAR)               $errors['sale_product']   = "Max {$MAX_VARCHAR} characters.";
    if (!is_int($duration) || $duration < 1)                       $errors['duration']       = 'Duration must be an integer ≥ 1 (months).';
    if (!in_array($renew, $ALLOWED_RENEW, true))                   $errors['renew']          = 'Renew must be one of 0,1,2,3,4,5,6,12.';
    if (!$customer)                                                $errors['customer']       = 'Customer is required.';
    elseif (mb_strlen($customer) > $MAX_VARCHAR)                   $errors['customer']       = "Max {$MAX_VARCHAR} characters.";
    if (!$purchased_date || !$isYmd($purchased_date))              $errors['purchased_date'] = 'Purchase date must be YYYY-MM-DD.';
    if ($email !== null && !filter_var($email, FILTER_VALIDATE_EMAIL)) $errors['email']      = 'Invalid email address.';
    if ($manager !== null && mb_strlen($manager) > $MAX_VARCHAR)   $errors['manager']        = "Max {$MAX_VARCHAR} characters.";
    if ($note !== null && mb_strlen($note) > 65535)                $errors['note']           = 'Note is too long.';
    if ($priceStr === null || (float)$priceStr < 0)                $errors['price']          = 'Price must be a number ≥ 0.';
    if ($profitStr === null)                                        $errors['profit']         = 'Profit must be provided (number).';

    if (!$expired_date && isset($purchased_date, $duration) && $isYmd($purchased_date) && is_int($duration) && $duration >= 1) {
        $expired_date = $addMonthsYmd($purchased_date, $duration);
    }
    if ($expired_date !== null && !$isYmd($expired_date)) $errors['expired_date'] = 'Expired date must be YYYY-MM-DD.';

    if ($errors) {
        http_response_code(422);
        echo json_encode(['success' => false, 'errors' => $errors]);
        exit;
    }

    $id = \Digimium\Core\SaleRepository::retail(\Digimium\Core\Database::connection())->insert([
        'sale_product'   => $sale_product,
        'duration'       => $duration,
        'renew'          => $renew,
        'customer'       => $customer,
        'email'          => $email,
        'purchased_date' => $purchased_date,
        'expired_date'   => $expired_date,
        'manager'        => $manager,
        'note'           => $note,
        'price'          => $priceStr,
        'profit'         => $profitStr,
        'store'          => $store,
    ]);

    http_response_code(201);
    echo json_encode(['success' => true, 'id' => $id]);
} catch (\Throwable $e) {
    error_log('sale_insertion.php error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Server error']);
}

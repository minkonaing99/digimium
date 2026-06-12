<?php
// api/sales_minimal.php
declare(strict_types=1);

require __DIR__ . '/session_bootstrap.php';
require __DIR__ . '/auth.php';
require_once dirname(__DIR__) . '/app/bootstrap.php';

use Digimium\Core\ResponseCache;

auth_require_login(['admin', 'owner', 'staff']);
session_write_close();

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('Cache-Control: private, max-age=45, must-revalidate');

ob_start();

try {
    ini_set('display_errors', '0');
    error_reporting(E_ALL);

    // Optional date-range filter — push filtering into SQL instead of loading all rows
    $isYmd = static fn(string $s): bool =>
        (bool)preg_match('/^\d{4}-\d{2}-\d{2}$/', $s)
        && (bool)DateTime::createFromFormat('Y-m-d', $s);

    $rawFrom = trim((string)($_GET['from'] ?? ''));
    $rawTo   = trim((string)($_GET['to']   ?? ''));
    $from    = ($rawFrom !== '' && $isYmd($rawFrom)) ? $rawFrom : null;
    $to      = ($rawTo   !== '' && $isYmd($rawTo))   ? $rawTo   : null;

    $hardLimit = 10000;
    $fingerprint = ResponseCache::bucketVersion('sales_retail')
        . '|' . ResponseCache::bucketVersion('sales_wholesale');

    $cacheKey = 'sales_minimal:v4:' . $fingerprint . ':f' . ($from ?? '') . ':t' . ($to ?? '') . ':n' . $hardLimit;
    $etag = '"' . sha1($cacheKey) . '"';
    header('ETag: ' . $etag);

    $ifNoneMatch = trim((string)($_SERVER['HTTP_IF_NONE_MATCH'] ?? ''));
    if ($ifNoneMatch !== '' && $ifNoneMatch === $etag) {
        ob_end_clean();
        http_response_code(304);
        exit;
    }

    $cached = ResponseCache::get($cacheKey, 60);
    if (is_string($cached)) {
        ob_end_clean();
        echo $cached;
        exit;
    }

    $pdo = \Digimium\Core\Database::connection();

    // Named params must be unique across both UNION halves (EMULATE_PREPARES=false)
    $retailWhere    = '';
    $wholesaleWhere = '';
    $dateParams     = [];
    if ($from !== null && $to !== null) {
        $retailWhere    = 'WHERE purchased_date BETWEEN :r_from AND :r_to';
        $wholesaleWhere = 'WHERE purchased_date BETWEEN :w_from AND :w_to';
        $dateParams     = [':r_from' => $from, ':r_to' => $to, ':w_from' => $from, ':w_to' => $to];
    } elseif ($from !== null) {
        $retailWhere    = 'WHERE purchased_date >= :r_from';
        $wholesaleWhere = 'WHERE purchased_date >= :w_from';
        $dateParams     = [':r_from' => $from, ':w_from' => $from];
    } elseif ($to !== null) {
        $retailWhere    = 'WHERE purchased_date <= :r_to';
        $wholesaleWhere = 'WHERE purchased_date <= :w_to';
        $dateParams     = [':r_to' => $to, ':w_to' => $to];
    }

    $sql = "
        SELECT
            sale_id,
            CONCAT('Retail - ', sale_product) AS sale_product,
            price,
            profit,
            purchased_date,
            expired_date,
            customer,
            email,
            renew,
            duration,
            store,
            'retail' AS sale_type
        FROM sale_overview
        {$retailWhere}

        UNION ALL

        SELECT
            sale_id,
            CONCAT('Wholesale - ', sale_product) AS sale_product,
            price,
            profit,
            purchased_date,
            expired_date,
            customer,
            email,
            renew,
            duration,
            2 AS store,
            'wholesale' AS sale_type
        FROM ws_sale_overview
        {$wholesaleWhere}

        ORDER BY purchased_date DESC, sale_id DESC
        LIMIT :hard_limit
    ";

    $stmt = $pdo->prepare($sql);
    foreach ($dateParams as $k => $v) {
        $stmt->bindValue($k, $v);
    }
    $stmt->bindValue(':hard_limit', $hardLimit, PDO::PARAM_INT);
    $stmt->execute();
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    foreach ($rows as &$r) {
        $r['sale_id']        = isset($r['sale_id'])        ? (int)$r['sale_id']    : null;
        $r['sale_product']   = $r['sale_product']          ?? null;
        $r['price']          = isset($r['price'])          ? (float)$r['price']    : 0.0;
        $r['profit']         = isset($r['profit'])         ? (float)$r['profit']   : 0.0;
        $r['purchased_date'] = $r['purchased_date']        ?? null;
        $r['expired_date']   = $r['expired_date']          ?? null;
        $r['customer']       = $r['customer']              ?? null;
        $r['email']          = $r['email']                 ?? null;
        $r['renew']          = isset($r['renew'])          ? (int)$r['renew']      : 0;
        $r['duration']       = isset($r['duration'])       ? (int)$r['duration']   : null;
        $r['store']          = isset($r['store'])          ? (int)$r['store']      : 0;
        $r['sale_type']      = $r['sale_type']             ?? 'retail';
    }
    unset($r);

    $payload = json_encode(
        ['success' => true, 'data' => $rows],
        JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRESERVE_ZERO_FRACTION
    );
    if (!is_string($payload)) {
        throw new RuntimeException('Failed to encode summary payload.');
    }

    ResponseCache::put($cacheKey, $payload);
    ob_end_clean();
    echo $payload;
} catch (Throwable $e) {
    ob_end_clean();
    error_log('sales_minimal.php error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(
        ['success' => false, 'error' => 'Server error'],
        JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES
    );
}

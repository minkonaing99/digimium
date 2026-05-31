<?php
// api/ws_sales_table.php
declare(strict_types=1);

require __DIR__ . '/session_bootstrap.php';
require __DIR__ . '/auth.php';

use Digimium\Core\ResponseCache;
use Digimium\Core\SaleRepository;

auth_require_login(['admin', 'owner', 'staff']);
session_write_close();

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('Cache-Control: private, max-age=30, must-revalidate');

try {
    $pdo  = \Digimium\Core\Database::connection();
    $repo = SaleRepository::wholesale($pdo);

    $limit  = isset($_GET['limit'])  ? max(1, min(2000, (int)$_GET['limit'])) : 500;
    $offset = isset($_GET['offset']) ? max(0, (int)$_GET['offset'])           : 0;
    $cursor = trim((string)($_GET['cursor'] ?? ''));

    $fingerprint = $repo->fingerprint();
    $cacheKey    = 'ws_sales_table:v3:' . $fingerprint . ':l' . $limit . ':o' . $offset . ':c' . $cursor;
    $etag        = '"' . sha1($cacheKey) . '"';
    header('ETag: ' . $etag);

    $ifNoneMatch = trim((string)($_SERVER['HTTP_IF_NONE_MATCH'] ?? ''));
    if ($ifNoneMatch !== '' && $ifNoneMatch === $etag) {
        http_response_code(304);
        exit;
    }

    $cached = ResponseCache::get($cacheKey, 30);
    if (is_string($cached)) {
        echo $cached;
        exit;
    }

    $page    = $repo->getPage($limit, $offset, $cursor);
    $payload = json_encode([
        'success' => true,
        'data'    => $page['rows'],
        'meta'    => ['limit' => $limit, 'has_more' => $page['hasMore'], 'next_cursor' => $page['nextCursor']],
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRESERVE_ZERO_FRACTION);

    if (!is_string($payload)) {
        throw new \RuntimeException('Failed to encode JSON payload.');
    }

    ResponseCache::put($cacheKey, $payload);
    echo $payload;
} catch (\Throwable $e) {
    error_log('ws_sales_table.php error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Server error'], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
}

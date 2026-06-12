<?php

declare(strict_types=1);

// CLI cache sweep. Invoked from Hostinger crontab.
//   php /home/USER/public_html/bin/cache_clean.php
//
// Optional first arg: max age in seconds (default 3600).

if (PHP_SAPI !== 'cli') {
    http_response_code(403);
    exit("CLI only.\n");
}

require __DIR__ . '/../app/bootstrap.php';

use Digimium\Core\Database;
use Digimium\Core\ResponseCache;

$maxAge = isset($argv[1]) && ctype_digit($argv[1]) ? (int)$argv[1] : 3600;

$removed = ResponseCache::sweep($maxAge);
fwrite(STDOUT, "cache: removed {$removed} files (older than {$maxAge}s)\n");

try {
    $pdo = Database::connection();
    $stmt = $pdo->prepare('DELETE FROM remember_tokens WHERE expires_at < NOW()');
    $stmt->execute();
    $tokens = $stmt->rowCount();
    fwrite(STDOUT, "remember_tokens: removed {$tokens} expired rows\n");
} catch (\Throwable $e) {
    fwrite(STDERR, "remember_tokens cleanup failed: " . $e->getMessage() . "\n");
    exit(1);
}

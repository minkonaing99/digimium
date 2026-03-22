<?php

declare(strict_types=1);

require_once dirname(__DIR__) . '/app/bootstrap.php';

use Digimium\Core\Database;

try {
    $pdo = Database::connection();
} catch (Throwable $e) {
    http_response_code(500);
    exit('Database connection failed.');
}
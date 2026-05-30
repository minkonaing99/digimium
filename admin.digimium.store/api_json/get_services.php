<?php

declare(strict_types=1);
// Hidden: disabled alongside product_showcase.php. Remove next two lines to re-enable.
http_response_code(404); exit;

require_once dirname(__DIR__) . '/app/bootstrap.php';
require_once dirname(__DIR__) . '/api/session_bootstrap.php';
require_once dirname(__DIR__) . '/api/auth.php';

use Digimium\Core\Http;
use Digimium\Core\ServiceCatalogStore;

auth_require_login(['admin', 'owner']);
Http::requireMethod(['GET']);

$services = ServiceCatalogStore::read();
Http::json($services);

<?php

declare(strict_types=1);

if (!defined('DIGIMIUM_APP_BOOTSTRAPPED')) {
    define('DIGIMIUM_APP_BOOTSTRAPPED', true);
    define('DIGIMIUM_ROOT', dirname(__DIR__));

    spl_autoload_register(static function (string $class): void {
        if (strncmp($class, 'Digimium\\Core\\', 14) !== 0) {
            return;
        }
        $relative = substr($class, 14);
        $path = __DIR__ . '/core/' . str_replace('\\', '/', $relative) . '.php';
        if (is_file($path)) {
            require $path;
        }
    });

    Digimium\Core\Config::boot(DIGIMIUM_ROOT . DIRECTORY_SEPARATOR . '.env');
    Digimium\Core\Config::require('DIGIMIUM_REMEMBER_SECRET');
}

<?php

declare(strict_types=1);

// CLI bundler. Run after deploy:
//   php bin/build_assets.php
//
// Reads bundle definitions from app/core/Assets.php and writes concatenated files to
// style/bundles/ and js/bundles/. Source files must already be minified; this script
// only concatenates and adds short delimiters.

if (PHP_SAPI !== 'cli') {
    http_response_code(403);
    exit("CLI only.\n");
}

define('DIGIMIUM_ROOT', dirname(__DIR__));
require __DIR__ . '/../app/core/Config.php';
require __DIR__ . '/../app/core/Assets.php';

use Digimium\Core\Assets;

$root = DIGIMIUM_ROOT;
$cssOut = $root . '/style/bundles';
$jsOut  = $root . '/js/bundles';

foreach ([$cssOut, $jsOut] as $dir) {
    if (!is_dir($dir) && !mkdir($dir, 0755, true) && !is_dir($dir)) {
        fwrite(STDERR, "Failed to create $dir\n");
        exit(1);
    }
}

$totalBytesIn = 0;
$totalBytesOut = 0;

foreach (Assets::BUNDLES as $name => $cfg) {
    $type = $cfg['type'];
    $outDir = $type === 'css' ? $cssOut : $jsOut;
    $outPath = $outDir . '/' . $name;

    $parts = [];
    $bytesIn = 0;
    foreach ($cfg['files'] as $rel) {
        $abs = $root . '/' . $rel;
        if (!is_file($abs)) {
            fwrite(STDERR, "[$name] missing: $rel\n");
            continue 2;
        }
        $raw = file_get_contents($abs);
        if ($raw === false) {
            fwrite(STDERR, "[$name] unreadable: $rel\n");
            continue 2;
        }
        $bytesIn += strlen($raw);
        $parts[] = "/* " . basename($rel) . " */\n" . rtrim($raw);
    }

    $blob = implode($type === 'js' ? ";\n" : "\n", $parts) . "\n";
    if (file_put_contents($outPath, $blob, LOCK_EX) === false) {
        fwrite(STDERR, "Failed to write $outPath\n");
        exit(1);
    }

    $bytesOut = strlen($blob);
    $totalBytesIn += $bytesIn;
    $totalBytesOut += $bytesOut;
    fwrite(STDOUT, sprintf(
        "%-14s %2d files  %7d -> %7d bytes  -> %s\n",
        $name,
        count($cfg['files']),
        $bytesIn,
        $bytesOut,
        str_replace($root . '/', '', $outPath)
    ));
}

fwrite(STDOUT, sprintf("\nTotal: %d -> %d bytes\n", $totalBytesIn, $totalBytesOut));

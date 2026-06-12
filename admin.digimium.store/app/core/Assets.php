<?php

declare(strict_types=1);

namespace Digimium\Core;

/**
 * Returns the asset URLs for a logical bundle.
 *
 * If a pre-built bundle exists under style/bundles or js/bundles AND is at least
 * as fresh as every source file it contains, the helper returns a single URL.
 * Otherwise it falls back to the individual source files so a missing/stale
 * bundle never breaks the page.
 *
 * Run `php bin/build_assets.php` after deploy to (re)generate bundles.
 */
final class Assets
{
    /** @var array<string, array{type: 'css'|'js', files: list<string>}> */
    public const BUNDLES = [
        'sales.css' => [
            'type' => 'css',
            'files' => [
                'style/style.min.css',
                'style/loading.min.css',
                'style/sales_overview.min.css',
                'style/mobile_table.min.css',
                'style/wholesale.min.css',
                'style/upload.min.css',
            ],
        ],
        'product.css' => [
            'type' => 'css',
            'files' => [
                'style/style.min.css',
                'style/product_catalog.min.css',
                'style/wholesale.min.css',
            ],
        ],
        'summary.css' => [
            'type' => 'css',
            'files' => [
                'style/style.min.css',
                'style/summary.min.css',
            ],
        ],
        'user.css' => [
            'type' => 'css',
            'files' => [
                'style/style.min.css',
                'style/summary.min.css',
                'style/product_catalog.min.css',
            ],
        ],
        'login.css' => [
            'type' => 'css',
            'files' => [
                'style/style.min.css',
                'style/login.min.css',
            ],
        ],
        'sales.js' => [
            'type' => 'js',
            'files' => [
                'js/csrf.js',
                'js/loading.js',
                'js/modal.js',
                'js/nav.js',
                'js/add_sales_toggle.js',
                'js/sales_module_factory.js',
                'js/sales_overview.js',
                'js/sales_add_form.js',
                'js/ws_sales_overview.js',
                'js/ws_sales_add_form.js',
            ],
        ],
        'product.js' => [
            'type' => 'js',
            'files' => [
                'js/csrf.js',
                'js/modal.js',
                'js/nav.js',
                'js/product_catalog_toggle.js',
                'js/product_catalog.js',
            ],
        ],
        'summary.js' => [
            'type' => 'js',
            'files' => [
                'js/csrf.js',
                'js/modal.js',
                'js/nav.js',
                'js/summary_table.js',
                'js/deplay_chart.js',
            ],
        ],
        'user.js' => [
            'type' => 'js',
            'files' => [
                'js/csrf.js',
                'js/modal.js',
                'js/nav.js',
                'js/user_list.js',
            ],
        ],
    ];

    /**
     * Returns the asset URLs (with cache-busting `?v=`) for the given bundle.
     * Falls back to individual source files when the bundle is missing or stale.
     *
     * @return list<string>
     */
    public static function tagsFor(string $bundle): array
    {
        if (!isset(self::BUNDLES[$bundle])) {
            return [];
        }

        $cfg = self::BUNDLES[$bundle];
        $type = $cfg['type'];
        $sources = $cfg['files'];

        $bundlePath = ($type === 'css' ? 'style/bundles/' : 'js/bundles/') . $bundle;
        $abs = Config::rootPath($bundlePath);

        $bundleMtime = @filemtime($abs);
        $bundleFresh = $bundleMtime !== false;

        if ($bundleFresh) {
            foreach ($sources as $src) {
                $srcMtime = @filemtime(Config::rootPath($src));
                if ($srcMtime === false || $srcMtime > $bundleMtime) {
                    $bundleFresh = false;
                    break;
                }
            }
        }

        if ($bundleFresh) {
            return ['./' . $bundlePath . '?v=' . $bundleMtime];
        }

        return array_map(static function (string $src) {
            $m = @filemtime(Config::rootPath($src));
            return './' . $src . ($m !== false ? '?v=' . $m : '');
        }, $sources);
    }
}

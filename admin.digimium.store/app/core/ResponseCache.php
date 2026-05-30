<?php

declare(strict_types=1);

namespace Digimium\Core;

final class ResponseCache
{
    private const EXT = '.json';

    public static function get(string $key, int $ttlSeconds): ?string
    {
        $path = self::pathForKey($key);
        if (!is_file($path)) {
            return null;
        }

        $raw = @file_get_contents($path);
        if (!is_string($raw) || $raw === '') {
            return null;
        }

        $nl = strpos($raw, "\n");
        if ($nl === false) {
            @unlink($path);
            return null;
        }

        $createdAt = (int) substr($raw, 0, $nl);
        if ($createdAt <= 0 || (time() - $createdAt) > $ttlSeconds) {
            @unlink($path);
            return null;
        }

        return substr($raw, $nl + 1);
    }

    public static function put(string $key, string $value): void
    {
        $path = self::pathForKey($key);
        $dir = dirname($path);
        if (!is_dir($dir) && !mkdir($dir, 0755, true) && !is_dir($dir)) {
            return;
        }

        $payload = time() . "\n" . $value;

        $tmp = $path . '.tmp';
        if (@file_put_contents($tmp, $payload, LOCK_EX) === false) {
            return;
        }

        @rename($tmp, $path);
    }

    public static function bustAll(): void
    {
        $dir = Config::rootPath('app/cache/response');
        if (!is_dir($dir)) {
            return;
        }
        $files = glob($dir . DIRECTORY_SEPARATOR . '*' . self::EXT);
        if (!is_array($files)) {
            return;
        }
        foreach ($files as $file) {
            @unlink($file);
        }
    }

    private static function pathForKey(string $key): string
    {
        $safe = hash('sha256', $key);
        return Config::rootPath('app/cache/response/' . $safe . self::EXT);
    }
}

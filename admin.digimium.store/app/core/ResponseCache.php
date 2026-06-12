<?php

declare(strict_types=1);

namespace Digimium\Core;

final class ResponseCache
{
    private const EXT = '.json';
    private const MAX_FILES_PER_SHARD = 256;
    private const HARD_MAX_AGE_SECONDS = 3600;
    private const SWEEP_CHANCE = 50;

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

        $decoded = json_decode($raw, true);
        if (!is_array($decoded)) {
            @unlink($path);
            return null;
        }

        $createdAt = (int)($decoded['created_at'] ?? 0);
        $value = $decoded['value'] ?? null;
        if ($createdAt <= 0 || !is_string($value)) {
            @unlink($path);
            return null;
        }

        if ((time() - $createdAt) > $ttlSeconds) {
            @unlink($path);
            return null;
        }

        return $value;
    }

    public static function put(string $key, string $value): void
    {
        $path = self::pathForKey($key);
        $dir = dirname($path);
        if (!is_dir($dir) && !mkdir($dir, 0755, true) && !is_dir($dir)) {
            return;
        }

        $payload = json_encode([
            'created_at' => time(),
            'value' => $value,
        ], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        if (!is_string($payload) || $payload === '') {
            return;
        }

        $tmp = $path . '.' . bin2hex(random_bytes(4)) . '.tmp';
        if (@file_put_contents($tmp, $payload, LOCK_EX) === false) {
            return;
        }

        if (!@rename($tmp, $path)) {
            @unlink($tmp);
            return;
        }

        if (random_int(1, self::SWEEP_CHANCE) === 1) {
            self::sweepShard($dir);
        }
    }

    /**
     * Cron-friendly full sweep. Deletes any cache entry older than $maxAgeSeconds
     * and removes stray *.tmp files. Returns the number of files removed.
     */
    public static function sweep(int $maxAgeSeconds = self::HARD_MAX_AGE_SECONDS): int
    {
        $root = Config::rootPath('app/cache/response');
        if (!is_dir($root)) {
            return 0;
        }

        $removed = 0;
        $cutoff = time() - max(60, $maxAgeSeconds);

        $shards = @scandir($root);
        if (!is_array($shards)) {
            return 0;
        }

        foreach ($shards as $shard) {
            if ($shard === '.' || $shard === '..') {
                continue;
            }
            $shardPath = $root . DIRECTORY_SEPARATOR . $shard;
            if (!is_dir($shardPath)) {
                if (is_file($shardPath) && @filemtime($shardPath) < $cutoff) {
                    if (@unlink($shardPath)) {
                        $removed++;
                    }
                }
                continue;
            }
            $removed += self::sweepShard($shardPath, $cutoff);
        }

        return $removed;
    }

    private static function sweepShard(string $dir, ?int $cutoff = null): int
    {
        $cutoff ??= time() - self::HARD_MAX_AGE_SECONDS;
        $entries = @scandir($dir);
        if (!is_array($entries)) {
            return 0;
        }

        $files = [];
        $removed = 0;

        foreach ($entries as $name) {
            if ($name === '.' || $name === '..') {
                continue;
            }
            $path = $dir . DIRECTORY_SEPARATOR . $name;
            if (!is_file($path)) {
                continue;
            }
            $mtime = @filemtime($path);
            if ($mtime === false) {
                continue;
            }

            if (str_ends_with($name, '.tmp') || $mtime < $cutoff) {
                if (@unlink($path)) {
                    $removed++;
                }
                continue;
            }

            $files[$path] = $mtime;
        }

        if (count($files) > self::MAX_FILES_PER_SHARD) {
            asort($files);
            $excess = count($files) - self::MAX_FILES_PER_SHARD;
            foreach (array_slice(array_keys($files), 0, $excess) as $path) {
                if (@unlink($path)) {
                    $removed++;
                }
            }
        }

        return $removed;
    }

    /**
     * Bump a logical bucket so any cache key that embeds bucketVersion() is invalidated.
     * Mutating endpoints (insert/update/delete) call this instead of forcing the read
     * path to run a SELECT MAX(...) on every request.
     */
    public static function bump(string $bucket): void
    {
        $path = self::bucketPath($bucket);
        $dir = dirname($path);
        if (!is_dir($dir) && !mkdir($dir, 0755, true) && !is_dir($dir)) {
            return;
        }
        @touch($path);
    }

    public static function bucketVersion(string $bucket): int
    {
        $m = @filemtime(self::bucketPath($bucket));
        return $m === false ? 0 : $m;
    }

    private static function bucketPath(string $bucket): string
    {
        $safe = preg_replace('/[^a-z0-9_]/i', '_', $bucket) ?? 'default';
        return Config::rootPath('app/cache/version/' . $safe . '.v');
    }

    private static function pathForKey(string $key): string
    {
        $hash = hash('sha256', $key);
        $shard = substr($hash, 0, 2);
        return Config::rootPath('app/cache/response/' . $shard . '/' . $hash . self::EXT);
    }
}

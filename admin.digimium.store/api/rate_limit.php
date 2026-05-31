<?php
// api/rate_limit.php
declare(strict_types=1);

/**
 * Flat-file token bucket rate limiter keyed by action + client identifier.
 * Exceeding $maxAttempts within $windowSeconds sends 429 and exits.
 */
function rate_limit(string $action, string $key, int $maxAttempts = 10, int $windowSeconds = 60): void
{
    $slot = sys_get_temp_dir() . '/rl_' . md5($action . ':' . $key) . '.json';
    $now  = time();

    $data = ['count' => 0, 'reset_at' => $now + $windowSeconds];
    if (is_file($slot)) {
        $raw = @file_get_contents($slot);
        if ($raw !== false) {
            $parsed = json_decode($raw, true);
            if (is_array($parsed) && isset($parsed['reset_at']) && (int)$parsed['reset_at'] > $now) {
                $data = $parsed;
            }
        }
    }

    $data['count']++;
    @file_put_contents($slot, json_encode($data), LOCK_EX);

    if ($data['count'] > $maxAttempts) {
        $retryAfter = max(1, (int)$data['reset_at'] - $now);
        http_response_code(429);
        header('Retry-After: ' . $retryAfter);
        header('Content-Type: text/plain; charset=utf-8');
        exit('Too many attempts. Please try again later.');
    }
}

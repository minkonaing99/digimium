<?php

declare(strict_types=1);

require_once dirname(__DIR__) . '/app/bootstrap.php';

// Defined here so remember.php works standalone (index.php) and when auth.php is already loaded
if (!function_exists('ip_mask')) {
    function ip_mask(string $ip): string
    {
        if (filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV6)) {
            $parts = explode(':', $ip);
            return implode(':', array_slice($parts, 0, 4));
        }
        return (string)preg_replace('~^((\d+\.){2}).*$~', '$1', $ip);
    }
}

const REMEMBER_COOKIE = 'era_remember';
const REMEMBER_DAYS   = 7;

function b64u(string $bin): string
{
    return rtrim(strtr(base64_encode($bin), '+/', '-_'), '=');
}

function remember_cookie_opts(int $expires): array
{
    return [
        'expires'  => $expires,
        'path'     => '/',
        'secure'   => !empty($_SERVER['HTTPS']),
        'httponly' => true,
        'samesite' => 'Lax',
    ];
}

function remember_issue_cookie(int $userId, string $username, string $role): void
{
    $selector  = b64u(random_bytes(16));
    $verifier  = b64u(random_bytes(32));
    $validHash = hash('sha256', $verifier);
    $expiresAt = time() + REMEMBER_DAYS * 86400;

    $pdo  = \Digimium\Core\Database::connection();
    $stmt = $pdo->prepare(
        'INSERT INTO remember_tokens (user_id, username, role, selector, validator_hash, expires_at)
         VALUES (:uid, :uname, :role, :sel, :hash, FROM_UNIXTIME(:exp))'
    );
    $stmt->execute([
        ':uid'   => $userId,
        ':uname' => $username,
        ':role'  => strtolower($role),
        ':sel'   => $selector,
        ':hash'  => $validHash,
        ':exp'   => $expiresAt,
    ]);

    setcookie(REMEMBER_COOKIE, $selector . '.' . $verifier, remember_cookie_opts($expiresAt));
}

function remember_try_login_from_cookie(): bool
{
    if (!empty($_SESSION['auth'])) {
        return true;
    }

    $raw = $_COOKIE[REMEMBER_COOKIE] ?? '';
    if ($raw === '' || substr_count($raw, '.') !== 1) {
        return false;
    }

    [$selector, $verifier] = explode('.', $raw, 2);
    if ($selector === '' || $verifier === '') {
        return false;
    }

    $pdo  = \Digimium\Core\Database::connection();
    $stmt = $pdo->prepare(
        'SELECT id, user_id, username, role, validator_hash, expires_at
         FROM remember_tokens
         WHERE selector = :sel
         LIMIT 1'
    );
    $stmt->execute([':sel' => $selector]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$row) {
        remember_forget_cookie();
        return false;
    }

    if (strtotime((string)$row['expires_at']) < time()) {
        $pdo->prepare('DELETE FROM remember_tokens WHERE id = :id')->execute([':id' => $row['id']]);
        remember_forget_cookie();
        return false;
    }

    // Timing-safe verifier check
    if (!hash_equals((string)$row['validator_hash'], hash('sha256', $verifier))) {
        // Possible theft - revoke all tokens for this user
        $pdo->prepare('DELETE FROM remember_tokens WHERE user_id = :uid')->execute([':uid' => $row['user_id']]);
        remember_forget_cookie();
        return false;
    }

    // Rotate: replace selector+verifier in-place
    $newSelector = b64u(random_bytes(16));
    $newVerifier = b64u(random_bytes(32));
    $newExpires  = time() + REMEMBER_DAYS * 86400;

    $pdo->prepare(
        'UPDATE remember_tokens
         SET selector = :sel, validator_hash = :hash, expires_at = FROM_UNIXTIME(:exp)
         WHERE id = :id'
    )->execute([
        ':sel'  => $newSelector,
        ':hash' => hash('sha256', $newVerifier),
        ':exp'  => $newExpires,
        ':id'   => $row['id'],
    ]);

    setcookie(REMEMBER_COOKIE, $newSelector . '.' . $newVerifier, remember_cookie_opts($newExpires));

    // Probabilistic cleanup of expired rows (1 in 100 requests)
    if (random_int(1, 100) === 1) {
        $pdo->exec('DELETE FROM remember_tokens WHERE expires_at < NOW()');
    }

    $_SESSION['auth'] = true;
    $_SESSION['user'] = [
        'id'       => (int)$row['user_id'],
        'username' => (string)$row['username'],
        'role'     => strtolower((string)$row['role']),
    ];

    $ua = $_SERVER['HTTP_USER_AGENT'] ?? '';
    $ip = $_SERVER['REMOTE_ADDR'] ?? '';
    $_SESSION['fingerprint']   = hash('sha256', $ua . '|' . ip_mask($ip));
    $now = time();
    $_SESSION['created_at']    = $_SESSION['created_at'] ?? $now;
    $_SESSION['last_seen_at']  = $now;
    $_SESSION['last_regen_at'] = $now;
    session_regenerate_id(true);

    return true;
}

function remember_forget_cookie(): void
{
    $raw = $_COOKIE[REMEMBER_COOKIE] ?? '';
    if ($raw !== '' && substr_count($raw, '.') === 1) {
        [$selector] = explode('.', $raw, 2);
        if ($selector !== '') {
            try {
                $pdo = \Digimium\Core\Database::connection();
                $pdo->prepare('DELETE FROM remember_tokens WHERE selector = :sel')
                    ->execute([':sel' => $selector]);
            } catch (Throwable) {
                // Non-fatal: cookie is still cleared below
            }
        }
    }

    if (isset($_COOKIE[REMEMBER_COOKIE])) {
        setcookie(REMEMBER_COOKIE, '', remember_cookie_opts(time() - 3600));
    }
}

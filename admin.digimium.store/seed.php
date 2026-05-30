<?php
// Run once via CLI: php seed.php
// Creates the initial Owner account in the local database.

declare(strict_types=1);

require_once __DIR__ . '/app/bootstrap.php';

use Digimium\Core\Database;

$username = 'admin';
$password = 'Admin@12345'; // change this before running if you want a different password

$algo = defined('PASSWORD_ARGON2ID') ? PASSWORD_ARGON2ID : PASSWORD_BCRYPT;
$hash = password_hash($password, $algo);

$pdo = Database::connection();

$stmt = $pdo->prepare(
    "INSERT INTO users (username, pass_hash, role, is_active) VALUES (:u, :h, 'Owner', 1)
     ON DUPLICATE KEY UPDATE pass_hash = :h2, is_active = 1"
);
$stmt->execute([':u' => $username, ':h' => $hash, ':h2' => $hash]);

echo "Seeded user '{$username}' with password '{$password}'\n";
echo "Login at http://localhost:8000\n";

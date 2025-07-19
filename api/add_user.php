<?php
require_once './dbinfo.php';

// Collect and trim input
$username  = strtolower(trim($_POST['username'] ?? ''));
$password  = trim($_POST['password'] ?? '');
$privilege = strtolower(trim($_POST['privilege'] ?? '')); // Fixed key here

// === Basic validation ===
if (empty($username) || empty($password) || empty($privilege)) {
    echo "All fields are required.";
    exit;
}

// Validate privilege value
$allowedPrivileges = ['admin', 'staff'];
if (!in_array($privilege, $allowedPrivileges)) {
    echo "Invalid privilege.";
    exit;
}

try {
    // Check if username already exists
    $checkStmt = $pdo->prepare("SELECT COUNT(*) FROM user WHERE username = :username");
    $checkStmt->execute(['username' => $username]);
    if ($checkStmt->fetchColumn() > 0) {
        echo "Username already exists.";
        exit;
    }

    // Securely hash the password
    $hashedPassword = password_hash($password, PASSWORD_DEFAULT);

    // Insert new user
    $stmt = $pdo->prepare("INSERT INTO user (username, password, privilege) VALUES (:username, :password, :privilege)");
    $stmt->execute([
        'username' => $username,
        'password' => $hashedPassword,
        'privilege' => $privilege
    ]);

    echo "success";
} catch (PDOException $e) {
    echo "Database error: " . $e->getMessage();
}

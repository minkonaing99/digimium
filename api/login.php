<?php
session_start();
require_once 'dbinfo.php';

// Get user input
$username = $_POST['username'] ?? '';
$password = $_POST['password'] ?? '';

// Validate inputs
if (empty($username) || empty($password)) {
    die("Username and password are required.");
}

try {
    // Fetch user by username
    $stmt = $pdo->prepare("SELECT * FROM user WHERE username = :username LIMIT 1");
    $stmt->execute(['username' => $username]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    // Check hashed password
    if ($user && password_verify($password, $user['password'])) {
        $_SESSION['username'] = $user['username'];
        $_SESSION['privilege'] = $user['privilege'];

        // Assign login code
        $_SESSION['logincode'] = $user['privilege'] === 'admin' ? '200068' : '200038';

        // Set 7-day cookies
        setcookie("username", $_SESSION['username'], time() + 604800, "/");
        setcookie("privilege", $_SESSION['privilege'], time() + 604800, "/");
        setcookie("logincode", $_SESSION['logincode'], time() + 604800, "/");

        echo "success";
        exit;
    } else {
        echo "Invalid username or password.";
    }
} catch (PDOException $e) {
    echo "Database error: " . $e->getMessage();
}

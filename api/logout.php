<?php
session_start();

// Unset all session variables
$_SESSION = [];

// Destroy the session cookie (PHPSESSID)
if (ini_get("session.use_cookies")) {
    $params = session_get_cookie_params();
    setcookie(
        session_name(), // usually PHPSESSID
        '',
        time() - 42000,
        $params["path"],
        $params["domain"],
        $params["secure"],
        $params["httponly"]
    );
}

// Destroy session
session_destroy();

// Delete custom cookies
setcookie("username", "", time() - 3600, "/");
setcookie("privilege", "", time() - 3600, "/");
setcookie("logincode", "", time() - 3600, "/");

// Redirect to login
header("Location: ../index.php");
exit();

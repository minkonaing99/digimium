<?php
session_start();

if (!isset($_SESSION['username']) && isset($_COOKIE['username'], $_COOKIE['privilege'], $_COOKIE['logincode'])) {
    $_SESSION['username'] = $_COOKIE['username'];
    $_SESSION['privilege'] = $_COOKIE['privilege'];
    $_SESSION['logincode'] = $_COOKIE['logincode'];
}

$allowedPrivileges = ['owner', 'admin', 'staff'];
$allowedLogincodes = ['200068', '200038']; // owner/admin = 200068, staff = 200038

if (
    !isset($_SESSION['username'], $_SESSION['privilege'], $_SESSION['logincode']) ||
    !in_array($_SESSION['privilege'], $allowedPrivileges) ||
    !in_array($_SESSION['logincode'], $allowedLogincodes)
) {
    header('Content-Type: application/json');
    http_response_code(403);
    echo json_encode(['error' => 'Access denied']);
    exit;
}

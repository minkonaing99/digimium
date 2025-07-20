<?php
session_start();
header('Content-Type: application/json');
require_once 'dbinfo.php';

if (!isset($_SESSION['privilege'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

$privilege = $_SESSION['privilege'];

try {
    if ($privilege === 'owner') {
        $stmt = $pdo->prepare("
            SELECT id, username, privilege 
            FROM user 
            WHERE privilege IN ('admin', 'staff') 
            ORDER BY username ASC
        ");
        $stmt->execute();
    } elseif ($privilege === 'admin') {
        $stmt = $pdo->prepare("
            SELECT id, username, privilege 
            FROM user 
            WHERE privilege = 'staff' 
            ORDER BY username ASC
        ");
        $stmt->execute();
    } else {
        http_response_code(403);
        echo json_encode(['error' => 'Forbidden']);
        exit;
    }

    $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($users);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
}

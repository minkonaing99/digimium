<?php
session_start();
header('Content-Type: application/json');
require_once 'dbinfo.php';

// Ensure user is logged in and privilege exists
if (!isset($_SESSION['privilege'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

$privilege = $_SESSION['privilege'];

try {
    if ($privilege === 'owner') {
        // Owner sees admin + staff, but not other owners
        $stmt = $pdo->prepare("
            SELECT id, username, privilege 
            FROM user 
            WHERE privilege IN ('admin', 'staff') 
            ORDER BY username ASC
        ");
        $stmt->execute();
    } elseif ($privilege === 'admin') {
        // Admin sees only staff
        $stmt = $pdo->prepare("
            SELECT id, username, privilege 
            FROM user 
            WHERE privilege = 'staff' 
            ORDER BY username ASC
        ");
        $stmt->execute();
    } else {
        // Other users (e.g., staff/viewer) are not allowed
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

<?php
require 'dbinfo.php';

header('Content-Type: application/json');

try {
    $stmt = $pdo->query("SELECT summary_date, summary_text FROM sales_summary_log ORDER BY created_at DESC LIMIT 1");
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($row) {
        echo json_encode([
            'summary_date' => $row['summary_date'],
            'summary_text' => $row['summary_text']
        ]);
    }
} catch (PDOException $e) {
    http_response_code(500);
}

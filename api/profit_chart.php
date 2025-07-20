<?php
require_once './dbinfo.php';
header('Content-Type: application/json');

try {
    $today = date('Y-m-d');
    $startDate = date('Y-m-d', strtotime('-29 days'));

    $stmt1 = $pdo->prepare("
        SELECT 
            DATE(date) AS day,
            SUM(profit) AS total_profit
        FROM wc_product_sold
        WHERE date BETWEEN :start AND :end
        GROUP BY DATE(date)
    ");
    $stmt1->execute([':start' => $startDate, ':end' => $today]);
    $wcResults = $stmt1->fetchAll(PDO::FETCH_ASSOC);

    $stmt2 = $pdo->prepare("
        SELECT 
            DATE(purchase_date) AS day,
            SUM(profit) AS total_profit
        FROM product_sold
        WHERE purchase_date BETWEEN :start AND :end
        GROUP BY DATE(purchase_date)
    ");
    $stmt2->execute([':start' => $startDate, ':end' => $today]);
    $retailResults = $stmt2->fetchAll(PDO::FETCH_ASSOC);

    $profitMap = [];

    foreach ($wcResults as $row) {
        $day = $row['day'];
        $profitMap[$day] = ($profitMap[$day] ?? 0) + (float)$row['total_profit'];
    }

    foreach ($retailResults as $row) {
        $day = $row['day'];
        $profitMap[$day] = ($profitMap[$day] ?? 0) + (float)$row['total_profit'];
    }

    ksort($profitMap);
    $dailyProfits = [];

    foreach ($profitMap as $day => $profit) {
        $dailyProfits[] = [
            'date' => $day,
            'profit' => $profit
        ];
    }

    echo json_encode([
        'status' => 'success',
        'message' => 'Daily profit data loaded',
        'data' => $dailyProfits
    ]);
} catch (PDOException $e) {
    echo json_encode([
        'status' => 'error',
        'message' => 'DB error: ' . $e->getMessage()
    ]);
}

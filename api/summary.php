<?php
require_once './dbinfo.php';
header('Content-Type: application/json');

try {
    $date = $_POST['date'] ?? null;

    if (!$date) {
        echo json_encode(['status' => 'error', 'message' => 'Date is required']);
        exit;
    }

    $monthStart = date('Y-m-01', strtotime($date));
    $monthEnd = date('Y-m-t', strtotime($date));

    // WC Sales
    $stmt1 = $pdo->prepare("
        SELECT 
            CONCAT('WC:', product_name) AS product_name,
            price, profit, date
        FROM wc_product_sold
        WHERE date BETWEEN :start AND :end
    ");
    $stmt1->execute([':start' => $monthStart, ':end' => $monthEnd]);
    $wcSales = $stmt1->fetchAll(PDO::FETCH_ASSOC);

    // Retail Sales
    $stmt2 = $pdo->prepare("
        SELECT 
            CONCAT('R:', product_name) AS product_name,
            price, profit, purchase_date AS date
        FROM product_sold
        WHERE purchase_date BETWEEN :start AND :end
    ");
    $stmt2->execute([':start' => $monthStart, ':end' => $monthEnd]);
    $retailSales = $stmt2->fetchAll(PDO::FETCH_ASSOC);

    $allSales = array_merge($wcSales, $retailSales);

    // Filter today only
    $todaySales = array_filter($allSales, function ($sale) use ($date) {
        return substr($sale['date'], 0, 10) === $date;
    });

    echo json_encode([
        'status' => 'success',
        'data' => $allSales,
        'today' => array_values($todaySales)
    ]);
} catch (PDOException $e) {
    echo json_encode([
        'status' => 'error',
        'message' => 'DB Error: ' . $e->getMessage()
    ]);
}

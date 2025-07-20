<?php
require_once 'dbinfo.php';

header('Content-Type: text/csv; charset=utf-8');
header('Content-Disposition: attachment; filename="product_sold.csv"');

$output = fopen('php://output', 'w');

// Write CSV column headers
fputcsv($output, [
    "ID",
    "Product Name",
    "Duration",
    "Customer",
    "Email",
    "Price",
    "Profit",
    "Purchase Date",
    "End Date",
    "Seller",
    "Note"
]);

// Fetch data from the `product_sold` table
$stmt = $pdo->query("SELECT * FROM product_sold ORDER BY purchase_date DESC");

while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    fputcsv($output, [
        $row['id'],
        $row['product_name'],
        $row['duration'],
        $row['customer'],
        $row['gmail'],
        $row['price'],
        $row['profit'],
        $row['purchase_date'],
        $row['end_date'],
        $row['seller'],
        $row['note']
    ]);
}

fclose($output);
exit;

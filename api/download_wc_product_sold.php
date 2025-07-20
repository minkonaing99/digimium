<?php
require_once 'dbinfo.php';

header('Content-Type: text/csv; charset=utf-8');
header('Content-Disposition: attachment; filename="wc_product_sold.csv"');

$output = fopen('php://output', 'w');

// Write CSV column headers
fputcsv($output, [
    "ID",
    "Product Name",
    "Customer",
    "Email",
    "Quantity",
    "Price",
    "Profit",
    "Seller",
    "Note"
]);

// Fetch data from the `wc_product_sold` table
$stmt = $pdo->query("SELECT * FROM wc_product_sold ORDER BY id DESC");

while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    fputcsv($output, [
        $row['id'],
        $row['product_name'],
        $row['customer'],
        $row['email'],
        $row['quantity'],
        $row['price'],
        $row['profit'],
        $row['seller'],
        $row['note']
    ]);
}

fclose($output);
exit;

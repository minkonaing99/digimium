    <?php
    require_once 'session_check.php';
    require_once 'dbinfo.php';
    try {
        $stmt = $pdo->prepare("
            SELECT 
                id, 
                product_id,
                product_name, 
                customer, 
                email, 
                quantity, 
                price, 
                profit, 
                seller, 
                note,
                `date`
            FROM 
                wc_product_sold
            ORDER BY 
        date DESC, 
        id DESC;
        ");
        $stmt->execute();
        $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode([
            'status' => 'success',
            'data' => $data
        ]);
    } catch (PDOException $e) {
        echo json_encode([
            'status' => 'error',
            'message' => 'Database error: ' . $e->getMessage()
        ]);
    }

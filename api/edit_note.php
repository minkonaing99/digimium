<?php
header("Content-Type: application/json");

require_once "dbinfo.php";

$data = json_decode(file_get_contents("php://input"), true);

if (!isset($data["id"]) || !isset($data["note"])) {
    http_response_code(400);
    echo json_encode(["success" => false, "message" => "Missing 'id' or 'note'"]);
    exit;
}

$id = (int)$data["id"];
$note = trim($data["note"]);

try {
    $stmt = $pdo->prepare("UPDATE product_sold SET note = :note WHERE id = :id");
    $stmt->execute([
        ":note" => $note,
        ":id" => $id
    ]);

    echo json_encode(["success" => true, "message" => "Note updated"]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        "success" => false,
        "message" => "Database error: " . $e->getMessage()
    ]);
}

<?php
$json_file_path = '../../digimium.store/data/services.json';

if (!isset($_SERVER['REQUEST_METHOD']) || $_SERVER['REQUEST_METHOD'] === 'GET') {
    if (file_exists($json_file_path)) {
        $json_content = file_get_contents($json_file_path);
        $services_data = json_decode($json_content, true) ?: [];
        echo json_encode($services_data, JSON_PRETTY_PRINT);
    } else {
        http_response_code(404);
        echo json_encode(['error' => 'Services file not found']);
    }
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
}

<?php
$json_file_path = '../../digimium.store/data/services.json';

if (!isset($_SERVER['REQUEST_METHOD']) || $_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);

    if (!$input) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid JSON data']);
        exit;
    }

    // Validate JSON structure
    if (!is_array($input)) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid data structure']);
        exit;
    }

    // Save new data
    if (file_put_contents($json_file_path, json_encode($input, JSON_PRETTY_PRINT))) {
        echo json_encode([
            'success' => true,
            'message' => 'Services data updated successfully!'
        ]);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to save changes. Please check file permissions.']);
    }
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
}

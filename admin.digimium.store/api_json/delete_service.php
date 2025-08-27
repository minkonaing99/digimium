<?php


$json_file_path = '../../digimium.store/data/services.json';

if (!isset($_SERVER['REQUEST_METHOD']) || $_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);

    if (!$input) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid JSON data']);
        exit;
    }

    // Validate required fields
    if (!isset($input['category']) || !isset($input['index'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Category and index are required']);
        exit;
    }

    $category = $input['category'];
    $index = (int)$input['index'];

    // Load current data
    if (!file_exists($json_file_path)) {
        http_response_code(404);
        echo json_encode(['error' => 'Services file not found']);
        exit;
    }

    $json_content = file_get_contents($json_file_path);
    $current_data = json_decode($json_content, true) ?: [];

    // Check if category and index exist
    if (!isset($current_data[0][$category][$index])) {
        http_response_code(404);
        echo json_encode(['error' => 'Service not found']);
        exit;
    }

    // Get the service data before deletion to access photo information
    $service_to_delete = $current_data[0][$category][$index];

    // Delete the associated photo if it exists
    if (isset($service_to_delete['photo_url']) && !empty($service_to_delete['photo_url'])) {
        // Handle different URL formats
        if (strpos($service_to_delete['photo_url'], 'https://') === 0) {
            // For production URLs, extract the filename and use local path
            $filename = basename($service_to_delete['photo_url']);
            $photo_path = '../../digimium.store/images/services/' . $filename;
        } elseif (strpos($service_to_delete['photo_url'], '/images/services/') === 0) {
            // For new format: /images/services/filename.jpg
            $filename = basename($service_to_delete['photo_url']);
            $photo_path = '../../digimium.store/images/services/' . $filename;
        } else {
            // For old relative paths
            $photo_path = '../../digimium.store/' . $service_to_delete['photo_url'];
        }

        if (file_exists($photo_path)) {
            unlink($photo_path);
        }
    }

    // Remove the service
    array_splice($current_data[0][$category], $index, 1);

    // Save updated data
    if (file_put_contents($json_file_path, json_encode($current_data, JSON_PRETTY_PRINT))) {
        echo json_encode([
            'success' => true,
            'message' => 'Service deleted successfully!'
        ]);
    } else {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to delete service.']);
    }
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
}


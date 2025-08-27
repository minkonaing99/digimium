<?php
// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);

$json_file_path = '../../digimium.store/data/services.json';
$upload_dir = '../../digimium.store/images/services/';

// Create upload directory if it doesn't exist
if (!is_dir($upload_dir)) {
    if (!mkdir($upload_dir, 0755, true)) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to create upload directory']);
        exit;
    }
}

// Check if JSON file directory exists
$json_dir = dirname($json_file_path);
if (!is_dir($json_dir)) {
    if (!mkdir($json_dir, 0755, true)) {
        http_response_code(500);
        echo json_encode(['error' => 'Failed to create JSON directory']);
        exit;
    }
}

if (!isset($_SERVER['REQUEST_METHOD']) || $_SERVER['REQUEST_METHOD'] === 'POST') {
    // Handle file upload
    $name = $_POST['name'] ?? '';
    $description = $_POST['description'] ?? '';
    $category = $_POST['category'] ?? '';
    $is_editing = isset($_POST['is_editing']) && $_POST['is_editing'] === 'true';
    $original_category = $_POST['original_category'] ?? '';
    $original_index = isset($_POST['original_index']) ? (int)$_POST['original_index'] : -1;

    // Parse pricing data
    $price = [];
    if (isset($_POST['price']) && is_array($_POST['price'])) {
        $price = $_POST['price'];
    }

    // Parse features data
    $features = [];
    if (isset($_POST['features']) && is_array($_POST['features'])) {
        $features = $_POST['features'];
    }

    // Validate required fields
    if (empty($name) || empty($category)) {
        http_response_code(400);
        echo json_encode(['error' => 'Name and category are required']);
        exit;
    }

    // Load current data
    $current_data = [];
    if (file_exists($json_file_path)) {
        $json_content = file_get_contents($json_file_path);
        if ($json_content === false) {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to read JSON file']);
            exit;
        }
        $current_data = json_decode($json_content, true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            http_response_code(500);
            echo json_encode(['error' => 'Invalid JSON in services file: ' . json_last_error_msg()]);
            exit;
        }
        if ($current_data === null) {
            $current_data = [];
        }
    }

    // Initialize structure if empty
    if (empty($current_data)) {
        $current_data = [['popular' => [], 'other' => []]];
    }

    // Handle photo upload
    $photo_url = '';
    if (isset($_FILES['photo']) && $_FILES['photo']['error'] === UPLOAD_ERR_OK) {
        $uploaded_file = $_FILES['photo'];
        $file_extension = strtolower(pathinfo($uploaded_file['name'], PATHINFO_EXTENSION));

        // Validate file type
        $allowed_extensions = ['jpg', 'jpeg', 'png'];
        if (!in_array($file_extension, $allowed_extensions)) {
            http_response_code(400);
            echo json_encode(['error' => 'Only JPG and PNG files are allowed']);
            exit;
        }

        // Validate file size (1MB max)
        if ($uploaded_file['size'] > 1024 * 1024) {
            http_response_code(400);
            echo json_encode(['error' => 'File size must be less than 1MB']);
            exit;
        }

        // Create filename based on service name
        $service_name_clean = preg_replace('/[^a-zA-Z0-9]/', '', strtolower($name));
        $filename = $service_name_clean . '.' . $file_extension;
        $file_path = $upload_dir . $filename;

        // Move uploaded file
        if (move_uploaded_file($uploaded_file['tmp_name'], $file_path)) {
            $photo_url = '/images/services/' . $filename;
        } else {
            http_response_code(500);
            echo json_encode(['error' => 'Failed to save uploaded file']);
            exit;
        }
    }

    // Create service data
    $service_data = [
        'name' => $name,
        'price' => $price,
        'features' => $features,
        'description' => $description,
        'photo_url' => $photo_url
    ];

    if ($is_editing) {
        // Handle editing existing service
        if (empty($original_category) || $original_index < 0 || !isset($current_data[0][$original_category][$original_index])) {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid service to edit']);
            exit;
        }

        // Keep existing photo if no new photo uploaded
        if (empty($photo_url)) {
            $service_data['photo_url'] = $current_data[0][$original_category][$original_index]['photo_url'];
        }

        // Remove from original position
        array_splice($current_data[0][$original_category], $original_index, 1);

        // Add to new position (same or different category)
        if (isset($current_data[0][$category])) {
            $current_data[0][$category][] = $service_data;

            // Save updated data
            $json_data = json_encode($current_data, JSON_PRETTY_PRINT);
            if ($json_data === false) {
                http_response_code(500);
                echo json_encode(['error' => 'Failed to encode JSON data']);
                exit;
            }

            if (file_put_contents($json_file_path, $json_data) === false) {
                http_response_code(500);
                echo json_encode(['error' => 'Failed to write to JSON file. Check file permissions.']);
                exit;
            }

            echo json_encode([
                'success' => true,
                'message' => 'Service updated successfully!',
                'service' => $service_data
            ]);
        } else {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid category']);
        }
    } else {
        // Handle adding new service
        if (isset($current_data[0][$category])) {
            $current_data[0][$category][] = $service_data;

            // Save updated data
            $json_data = json_encode($current_data, JSON_PRETTY_PRINT);
            if ($json_data === false) {
                http_response_code(500);
                echo json_encode(['error' => 'Failed to encode JSON data']);
                exit;
            }

            if (file_put_contents($json_file_path, $json_data) === false) {
                http_response_code(500);
                echo json_encode(['error' => 'Failed to write to JSON file. Check file permissions.']);
                exit;
            }

            echo json_encode([
                'success' => true,
                'message' => 'New service added successfully!',
                'service' => $service_data
            ]);
        } else {
            http_response_code(400);
            echo json_encode(['error' => 'Invalid category']);
        }
    }
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
}

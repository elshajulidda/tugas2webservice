<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

if($_SERVER['REQUEST_METHOD'] == 'POST') {
    if(isset($_FILES['image']) && $_FILES['image']['error'] === UPLOAD_ERR_OK) {
        $uploadDir = '../uploads/';
        
        // Create uploads directory if not exists
        if(!is_dir($uploadDir)) {
            mkdir($uploadDir, 0777, true);
        }
        
        // Validate file type
        $allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        $fileType = mime_content_type($_FILES['image']['tmp_name']);
        
        if(!in_array($fileType, $allowedTypes)) {
            http_response_code(400);
            echo json_encode(["message" => "Only JPG, PNG, GIF, and WebP images are allowed."]);
            exit();
        }
        
        // Validate file size (max 5MB)
        if($_FILES['image']['size'] > 5 * 1024 * 1024) {
            http_response_code(400);
            echo json_encode(["message" => "File size must be less than 5MB."]);
            exit();
        }
        
        // Generate unique filename
        $fileExtension = pathinfo($_FILES['image']['name'], PATHINFO_EXTENSION);
        $fileName = uniqid() . '_' . time() . '.' . $fileExtension;
        $filePath = $uploadDir . $fileName;
        
        // Move uploaded file
        if(move_uploaded_file($_FILES['image']['tmp_name'], $filePath)) {
            echo json_encode([
                "message" => "Image uploaded successfully.",
                "filename" => $fileName,
                "filepath" => $filePath
            ]);
        } else {
            http_response_code(500);
            echo json_encode(["message" => "Failed to upload image."]);
        }
    } else {
        http_response_code(400);
        echo json_encode(["message" => "No image file uploaded or upload error."]);
    }
} else {
    http_response_code(405);
    echo json_encode(["message" => "Method not allowed."]);
}
?>
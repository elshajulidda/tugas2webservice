<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

include_once '../config/database.php';

$database = new Database();
$db = $database->getConnection();

$method = $_SERVER['REQUEST_METHOD'];

switch($method) {
    case 'GET':
        // Get all items or single item
        if(isset($_GET['id'])) {
            $id = $_GET['id'];
            $query = "SELECT * FROM items WHERE id = ?";
            $stmt = $db->prepare($query);
            $stmt->execute([$id]);
            $item = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if($item) {
                echo json_encode($item);
            } else {
                http_response_code(404);
                echo json_encode(["message" => "Item not found."]);
            }
        } else {
            $query = "SELECT * FROM items ORDER BY created_at DESC";
            $stmt = $db->prepare($query);
            $stmt->execute();
            $items = $stmt->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode($items);
        }
        break;

    case 'POST':
        // Create new item
        $data = json_decode(file_get_contents("php://input"));
        
        if(!empty($data->name) && !empty($data->quantity)) {
            $query = "INSERT INTO items (name, description, quantity, price, image) 
                     VALUES (?, ?, ?, ?, ?)";
            $stmt = $db->prepare($query);
            
            $success = $stmt->execute([
                $data->name,
                $data->description ?? '',
                $data->quantity,
                $data->price ?? 0,
                $data->image ?? ''
            ]);
            
            if($success) {
                http_response_code(201);
                echo json_encode([
                    "message" => "Item created successfully.",
                    "id" => $db->lastInsertId()
                ]);
            } else {
                http_response_code(503);
                echo json_encode(["message" => "Unable to create item."]);
            }
        } else {
            http_response_code(400);
            echo json_encode(["message" => "Unable to create item. Data is incomplete."]);
        }
        break;

    case 'PUT':
        // Update item
        $data = json_decode(file_get_contents("php://input"));
        $id = $_GET['id'] ?? $data->id ?? null;
        
        if($id && (!empty($data->name) && !empty($data->quantity))) {
            $query = "UPDATE items 
                     SET name = ?, description = ?, quantity = ?, price = ?, image = ?
                     WHERE id = ?";
            $stmt = $db->prepare($query);
            
            $success = $stmt->execute([
                $data->name,
                $data->description ?? '',
                $data->quantity,
                $data->price ?? 0,
                $data->image ?? '',
                $id
            ]);
            
            if($success) {
                echo json_encode(["message" => "Item updated successfully."]);
            } else {
                http_response_code(503);
                echo json_encode(["message" => "Unable to update item."]);
            }
        } else {
            http_response_code(400);
            echo json_encode(["message" => "Unable to update item. Data is incomplete."]);
        }
        break;

    case 'DELETE':
        // Delete item
        $id = $_GET['id'] ?? null;
        
        if($id) {
            // Get image path first to delete file
            $query = "SELECT image FROM items WHERE id = ?";
            $stmt = $db->prepare($query);
            $stmt->execute([$id]);
            $item = $stmt->fetch(PDO::FETCH_ASSOC);
            
            // Delete item from database
            $query = "DELETE FROM items WHERE id = ?";
            $stmt = $db->prepare($query);
            $success = $stmt->execute([$id]);
            
            if($success) {
                // Delete image file if exists
                if($item && !empty($item['image'])) {
                    $imagePath = "../uploads/" . $item['image'];
                    if(file_exists($imagePath)) {
                        unlink($imagePath);
                    }
                }
                echo json_encode(["message" => "Item deleted successfully."]);
            } else {
                http_response_code(503);
                echo json_encode(["message" => "Unable to delete item."]);
            }
        } else {
            http_response_code(400);
            echo json_encode(["message" => "Item ID required."]);
        }
        break;

    case 'OPTIONS':
        http_response_code(200);
        break;

    default:
        http_response_code(405);
        echo json_encode(["message" => "Method not allowed."]);
        break;
}
?>
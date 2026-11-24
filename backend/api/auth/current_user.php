<?php
require_once '../../config/cors.php';
session_start();

if (isset($_SESSION['user_id'])) {
    http_response_code(200);
    echo json_encode([
        "status" => "success", 
        "user_id" => $_SESSION['user_id'], 
        "role" => $_SESSION['role']
    ]);
} else {
    http_response_code(401);
    echo json_encode(["status" => "error", "message" => "Not authenticated."]);
}
?>
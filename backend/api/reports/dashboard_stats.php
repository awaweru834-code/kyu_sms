<?php
require_once '../../config/cors.php';
require_once '../../config/database.php';

$database = new Database();
$db = $database->getConnection();

try {
    // We query the SQL View directly
    $query = "SELECT * FROM dashboard_stats_view LIMIT 1";
    $stmt = $db->prepare($query);
    $stmt->execute();
    
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    
    http_response_code(200);
    echo json_encode([
        "status" => "success",
        "data" => [
            "active_students" => $row['total_active_students'],
            "total_courses" => $row['total_courses'],
            "outstanding_fees" => $row['total_outstanding_fees'] != null ? $row['total_outstanding_fees'] : 0
        ]
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Could not fetch dashboard statistics."]);
}
?>
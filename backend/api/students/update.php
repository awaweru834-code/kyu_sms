<?php
require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once '../../utils/validations.php';
Validator::requireRole(['super_admin', 'registrar']);

$db = (new Database())->getConnection();
$data = json_decode(file_get_contents("php://input"));

if (!empty($data->id) && !empty($data->status)) {
    $id = Validator::sanitize($data->id);
    $status = Validator::sanitize($data->status);

    $query = "UPDATE students SET status = :status WHERE id = :id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':status', $status);
    $stmt->bindParam(':id', $id);

    if ($stmt->execute()) {
        http_response_code(200);
        echo json_encode(["status" => "success", "message" => "Student updated."]);
    } else {
        http_response_code(503);
        echo json_encode(["status" => "error", "message" => "Unable to update student."]);
    }
} else {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Incomplete data."]);
}
?>
<?php
require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once '../../utils/validations.php';
Validator::requireRole(['super_admin']);

$db = (new Database())->getConnection();
$data = json_decode(file_get_contents("php://input"));

if (!empty($data->id)) {
    $id = Validator::sanitize($data->id);

    $query = "DELETE FROM students WHERE id = :id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':id', $id);

    if ($stmt->execute()) {
        http_response_code(200);
        echo json_encode(["status" => "success", "message" => "Student deleted."]);
    } else {
        http_response_code(503);
        echo json_encode(["status" => "error", "message" => "Unable to delete student."]);
    }
} else {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "No ID provided."]);
}
?>
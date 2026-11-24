<?php
require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once '../../models/Student.php';
require_once '../../utils/validations.php';

Validator::requireRole(['super_admin', 'registrar']);

$database = new Database();
$db = $database->getConnection();

if (!$db) {
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Database connection failed."]);
    exit();
}

$student = new Student($db);
$data = json_decode(file_get_contents("php://input"));

if (!empty($data->reg_number) && !empty($data->first_name) && !empty($data->last_name) && !empty($data->email)) {
    try {
        $student->reg_number = Validator::sanitize($data->reg_number);
        $student->first_name = Validator::sanitize($data->first_name);
        $student->last_name = Validator::sanitize($data->last_name);
        $student->email = Validator::sanitize($data->email);
        $student->department_id = !empty($data->department_id) ? intval($data->department_id) : 1;
        $student->admission_date = date('Y-m-d');

        if ($student->create()) {
            http_response_code(201);
            echo json_encode(["status" => "success", "message" => "Student admitted successfully."]);
        } else {
            http_response_code(503);
            echo json_encode(["status" => "error", "message" => "Unable to create student record."]);
        }
    } catch (PDOException $e) {
        http_response_code(400);
        echo json_encode([
            "status" => "error",
            "message" => "Database Error: " . $e->getMessage()
        ]);
    }
} else {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Incomplete student data provided."]);
}
?>
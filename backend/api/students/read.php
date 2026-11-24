<?php
require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once '../../models/Student.php';

$database = new Database();
$db = $database->getConnection();
$student = new Student($db);

$stmt = $student->read();
$num = $stmt->rowCount();

if ($num > 0) {
    $students_arr = array();
    $students_arr["records"] = array();

    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        extract($row);
        $student_item = array(
            "id" => $id,
            "reg_number" => $reg_number,
            "name" => $first_name . " " . $last_name,
            "email" => $email,
            "department" => $department_name,
            "status" => $status,
            "admission_date" => $admission_date
        );
        array_push($students_arr["records"], $student_item);
    }

    http_response_code(200);
    echo json_encode($students_arr);
} else {
    http_response_code(200);
    echo json_encode(["records" => []]);
}
?>
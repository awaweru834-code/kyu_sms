<?php
require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once '../../models/Finance.php';

$db = (new Database())->getConnection();
$finance = new Finance($db);
$stmt = $finance->readAll();

$fees_arr = ["status" => "success", "records" => []];

while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
    array_push($fees_arr["records"], $row);
}

http_response_code(200);
echo json_encode($fees_arr);
?>
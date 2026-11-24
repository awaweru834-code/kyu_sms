<?php
require_once '../../config/cors.php';

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

require_once '../../config/database.php';
require_once '../../models/User.php';
require_once '../../utils/validations.php';

$database = new Database();
$db = $database->getConnection();

if (!$db) {
    http_response_code(500);
    echo json_encode([
        "status" => "error",
        "message" => "Backend could not connect to the cloud database."
    ]);
    exit();
}

$data = json_decode(file_get_contents("php://input"));

if (!empty($data->username) && !empty($data->password)) {
    $username = Validator::sanitize($data->username);
    $user = new User($db);
    $account = $user->findByUsername($username);

    if ($account && password_verify($data->password, $account['password'])) {
        $_SESSION['user_id'] = $account['id'];
        $_SESSION['username'] = $account['username'];
        $_SESSION['role'] = $account['role'];

        http_response_code(200);
        echo json_encode([
            "status" => "success",
            "message" => "Authentication successful.",
            "user" => [
                "id" => $account['id'],
                "username" => $account['username'],
                "role" => $account['role']
            ]
        ]);
    } else {
        http_response_code(401);
        echo json_encode([
            "status" => "error",
            "message" => "Invalid staff username or password."
        ]);
    }
} else {
    http_response_code(400);
    echo json_encode([
        "status" => "error",
        "message" => "Username and password are required."
    ]);
}
?>
<?php
class Validator {
    public static function sanitize($data) {
        return htmlspecialchars(strip_tags(trim($data)));
    }

    // Server-side Role-Based Access Control (RBAC) enforcement
    public static function requireRole($allowed_roles = []) {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }

        if (!isset($_SESSION['user_id']) || !isset($_SESSION['role'])) {
            http_response_code(401);
            echo json_encode(["status" => "error", "message" => "Authentication required."]);
            exit();
        }

        if (!in_array($_SESSION['role'], $allowed_roles)) {
            http_response_code(403);
            echo json_encode([
                "status" => "error", 
                "message" => "Forbidden: Your role (" . $_SESSION['role'] . ") is not authorized to perform this action."
            ]);
            exit();
        }
    }
}
?>
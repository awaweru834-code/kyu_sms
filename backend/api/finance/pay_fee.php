<?php
require_once '../../config/cors.php';
require_once '../../config/database.php';
require_once '../../models/Finance.php';
require_once '../../utils/validations.php';

// Lock route to Super Admin and Finance Officer only
Validator::requireRole(['super_admin', 'finance']);

$db = (new Database())->getConnection();
$finance = new Finance($db);
$data = json_decode(file_get_contents("php://input"));

if (!empty($data->fee_id) && !empty($data->amount) && is_numeric($data->amount) && $data->amount > 0) {
    $fee_id = Validator::sanitize($data->fee_id);
    $amount = floatval($data->amount);

    if ($finance->recordPayment($fee_id, $amount)) {
        // Generate unique receipt number
        $receipt_no = "KYU-RCP-" . date("Ymd") . "-" . str_pad(rand(100, 999), 3, "0", STR_PAD_LEFT);

        // Log transaction in system_logs table
        $logQuery = "INSERT INTO system_logs (user_id, action_type, description) VALUES (:uid, 'FEE_PAYMENT', :desc)";
        $logStmt = $db->prepare($logQuery);
        $desc = "Receipt [$receipt_no]: Recorded tuition payment of KES " . number_format($amount, 2) . " for Fee Account #" . $fee_id;
        $logStmt->bindParam(':uid', $_SESSION['user_id']);
        $logStmt->bindParam(':desc', $desc);
        $logStmt->execute();

        // Fetch updated account state for the official receipt
        $updated = $finance->getFeeDetails($fee_id);

        http_response_code(200);
        echo json_encode([
            "status" => "success",
            "message" => "Payment recorded successfully.",
            "receipt" => [
                "receipt_no" => $receipt_no,
                "date_issued" => date("d M Y, h:i A"),
                "scholar_name" => $updated['first_name'] . " " . $updated['last_name'],
                "reg_number" => $updated['reg_number'],
                "department" => $updated['department'] ?? "Academic Registry",
                "amount_paid_now" => $amount,
                "total_billed" => $updated['amount_due'],
                "total_paid" => $updated['amount_paid'],
                "balance" => $updated['balance'],
                "issued_by_id" => $_SESSION['user_id']
            ]
        ]);
    } else {
        http_response_code(503);
        echo json_encode(["status" => "error", "message" => "Unable to process payment."]);
    }
} else {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Valid fee ID and positive payment amount required."]);
}
?>
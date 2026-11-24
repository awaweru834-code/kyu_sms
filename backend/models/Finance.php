<?php
class Finance {
    private $conn;
    private $table_name = "fees";

    public function __construct($db) {
        $this->conn = $db;
    }

    public function readAll() {
        $query = "SELECT f.id, s.reg_number, s.first_name, s.last_name, d.name as department,
                         f.amount_due, f.amount_paid, 
                         (f.amount_due - f.amount_paid) as balance, f.last_payment_date 
                  FROM " . $this->table_name . " f 
                  INNER JOIN students s ON f.student_id = s.id 
                  LEFT JOIN departments d ON s.department_id = d.id
                  ORDER BY balance DESC";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt;
    }

    public function recordPayment($fee_id, $amount) {
        $query = "UPDATE " . $this->table_name . " 
                  SET amount_paid = amount_paid + :amount, last_payment_date = NOW() 
                  WHERE id = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':amount', $amount);
        $stmt->bindParam(':id', $fee_id);
        return $stmt->execute();
    }

    public function getFeeDetails($fee_id) {
        $query = "SELECT f.id, s.reg_number, s.first_name, s.last_name, s.email, d.name as department,
                         f.amount_due, f.amount_paid, (f.amount_due - f.amount_paid) as balance, f.last_payment_date
                  FROM " . $this->table_name . " f
                  INNER JOIN students s ON f.student_id = s.id
                  LEFT JOIN departments d ON s.department_id = d.id
                  WHERE f.id = :id LIMIT 1";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $fee_id);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
}
?>
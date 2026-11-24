<?php
class Student {
    private $conn;
    private $table_name = "students";

    public $id;
    public $reg_number;
    public $first_name;
    public $last_name;
    public $email;
    public $department_id;
    public $status;
    public $admission_date;

    public function __construct($db) {
        $this->conn = $db;
    }

    public function read() {
        $query = "SELECT s.id, s.reg_number, s.first_name, s.last_name, s.email, s.status, s.admission_date, d.name as department_name 
                  FROM " . $this->table_name . " s
                  LEFT JOIN departments d ON s.department_id = d.id 
                  ORDER BY s.id DESC";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt;
    }

    public function create() {
        $query = "INSERT INTO " . $this->table_name . " 
                  SET reg_number=:reg_number, first_name=:first_name, last_name=:last_name, 
                      email=:email, department_id=:department_id, admission_date=:admission_date";

        $stmt = $this->conn->prepare($query);

        $stmt->bindParam(":reg_number", $this->reg_number);
        $stmt->bindParam(":first_name", $this->first_name);
        $stmt->bindParam(":last_name", $this->last_name);
        $stmt->bindParam(":email", $this->email);
        $stmt->bindParam(":department_id", $this->department_id);
        $stmt->bindParam(":admission_date", $this->admission_date);

        return $stmt->execute();
    }
}
?>
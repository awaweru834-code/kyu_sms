<?php
class Database {
    private $host;
    private $port;
    private $db_name;
    private $username;
    private $password;
    public $conn;
    public $last_error = null;

    private function getEnvVar($key, $default = null) {
        if (isset($_ENV[$key]) && $_ENV[$key] !== '') return trim($_ENV[$key]);
        if (isset($_SERVER[$key]) && $_SERVER[$key] !== '') return trim($_SERVER[$key]);
        $val = getenv($key);
        return ($val !== false && $val !== '') ? trim($val) : $default;
    }

    public function __construct() {
        $this->host = $this->getEnvVar('DB_HOST', 'localhost');
        $this->port = $this->getEnvVar('DB_PORT', '3306');
        $this->db_name = $this->getEnvVar('DB_NAME', 'kyu_sms_db');
        $this->username = $this->getEnvVar('DB_USER', 'root');
        $this->password = $this->getEnvVar('DB_PASS', '');
    }

    public function getConnection() {
        $this->conn = null;
        try {
            $dsn = "mysql:host=" . $this->host . ";port=" . $this->port . ";dbname=" . $this->db_name . ";charset=utf8mb4";
            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            ];

            // Trigger encrypted TLS connection for Aiven without rejecting its private CA
            if ($this->host !== 'localhost' && $this->host !== '127.0.0.1') {
                $options[PDO::MYSQL_ATTR_SSL_CIPHER] = 'DEFAULT';
                $options[PDO::MYSQL_ATTR_SSL_VERIFY_SERVER_CERT] = false;
            }

            $this->conn = new PDO($dsn, $this->username, $this->password, $options);
        } catch (PDOException $exception) {
            $this->last_error = $exception->getMessage();
            error_log("Database connection error: " . $this->last_error);
        }
        return $this->conn;
    }
}
?>
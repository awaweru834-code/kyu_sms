-- 1. USERS TABLE (Role-Based Access Control)
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('super_admin', 'registrar', 'finance') DEFAULT 'registrar',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. DEPARTMENTS TABLE
CREATE TABLE IF NOT EXISTS departments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(10) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL
);

-- 3. COURSES TABLE
CREATE TABLE IF NOT EXISTS courses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    department_id INT NOT NULL,
    course_code VARCHAR(15) NOT NULL UNIQUE,
    course_name VARCHAR(100) NOT NULL,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE
);

-- 4. STUDENTS TABLE
CREATE TABLE IF NOT EXISTS students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    reg_number VARCHAR(20) NOT NULL UNIQUE,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    department_id INT NOT NULL,
    status ENUM('active', 'graduated', 'suspended') DEFAULT 'active',
    admission_date DATE NOT NULL,
    FOREIGN KEY (department_id) REFERENCES departments(id)
);

-- 5. FEES/FINANCE TABLE
CREATE TABLE IF NOT EXISTS fees (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    amount_due DECIMAL(10, 2) DEFAULT 0.00,
    amount_paid DECIMAL(10, 2) DEFAULT 0.00,
    last_payment_date TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

-- 6. SYSTEM AUDIT LOGS
CREATE TABLE IF NOT EXISTS system_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    action_type VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- TRIGGER: Auto-provision KES 50,000 fee account when a scholar is admitted
DROP TRIGGER IF EXISTS after_student_insert;
DELIMITER //
CREATE TRIGGER after_student_insert
AFTER INSERT ON students
FOR EACH ROW
BEGIN
    INSERT INTO fees (student_id, amount_due, amount_paid) 
    VALUES (NEW.id, 50000.00, 0.00);
END;
//
DELIMITER ;

-- VIEW: Real-time Dashboard Telemetry
CREATE OR REPLACE VIEW dashboard_stats_view AS 
SELECT 
    (SELECT COUNT(*) FROM students WHERE status = 'active') AS total_active_students,
    (SELECT COUNT(*) FROM courses) AS total_courses,
    (SELECT SUM(amount_due - amount_paid) FROM fees) AS total_outstanding_fees;

-- SEED RBAC ACCOUNTS (Password for all three is 'admin123')
INSERT IGNORE INTO users (username, password, role) VALUES 
('admin_chief', '$2y$10$Y1/n2p9b3l8J2m1.zZ5.1e8Z/5/9.8.7.6.5.4.3.2.1.0', 'super_admin'),
('registrar_desk', '$2y$10$Y1/n2p9b3l8J2m1.zZ5.1e8Z/5/9.8.7.6.5.4.3.2.1.0', 'registrar'),
('finance_desk', '$2y$10$Y1/n2p9b3l8J2m1.zZ5.1e8Z/5/9.8.7.6.5.4.3.2.1.0', 'finance');

-- SEED DEPARTMENTS & COURSES
INSERT IGNORE INTO departments (id, code, name) VALUES 
(1, 'SCIT', 'School of Computing and Information Technology'),
(2, 'SBA', 'School of Business and Economics');

INSERT IGNORE INTO courses (department_id, course_code, course_name) VALUES 
(1, 'BIT 2301', 'Web Application Development II'),
(1, 'BIT 2302', 'Database Systems Administration'),
(2, 'BBA 1101', 'Principles of Accounting');

-- SEED SAMPLE SCHOLARS (Fires trigger to create fee accounts)
INSERT IGNORE INTO students (reg_number, first_name, last_name, email, department_id, status, admission_date) VALUES
('SCIT/0101/2024', 'Amina', 'Ochieng', 'amina.ochieng@students.kyu.ac.ke', 1, 'active', '2024-09-02'),
('SCIT/0104/2024', 'Kelvin', 'Mwangi', 'kelvin.mwangi@students.kyu.ac.ke', 1, 'active', '2024-09-03'),
('SBA/0219/2023', 'Grace', 'Mutua', 'grace.mutua@students.kyu.ac.ke', 2, 'graduated', '2023-09-01');

-- RECORD SAMPLE PAYMENTS
UPDATE fees SET amount_paid = 35000.00 WHERE student_id = 1;
UPDATE fees SET amount_paid = 50000.00 WHERE student_id = 3;
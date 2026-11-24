CREATE DATABASE IF NOT EXISTS kyu_sms_db;
USE kyu_sms_db;

-- 1. USERS TABLE (Role-Based Access Control)
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('super_admin', 'registrar', 'finance') DEFAULT 'registrar',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. DEPARTMENTS TABLE
CREATE TABLE departments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(10) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL
);

-- 3. COURSES TABLE
CREATE TABLE courses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    department_id INT NOT NULL,
    course_code VARCHAR(15) NOT NULL UNIQUE,
    course_name VARCHAR(100) NOT NULL,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE
);

-- 4. STUDENTS TABLE
CREATE TABLE students (
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
CREATE TABLE fees (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    amount_due DECIMAL(10, 2) DEFAULT 0.00,
    amount_paid DECIMAL(10, 2) DEFAULT 0.00,
    last_payment_date TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

-- 6. SYSTEM AUDIT LOGS (For enterprise security tracking)
CREATE TABLE system_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    action_type VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- ==========================================
-- ADVANCED FEATURES: TRIGGERS & VIEWS
-- ==========================================

-- TRIGGER: Automatically generate a zero-balance fee account when a new student is admitted
DELIMITER //
CREATE TRIGGER after_student_insert
AFTER INSERT ON students
FOR EACH ROW
BEGIN
    INSERT INTO fees (student_id, amount_due, amount_paid) 
    VALUES (NEW.id, 50000.00, 0.00); -- Default semester fee of 50,000
END;
//
DELIMITER ;

-- VIEW: Dashboard Statistics View (Keeps PHP code clean by letting MySQL do the math)
CREATE VIEW dashboard_stats_view AS 
SELECT 
    (SELECT COUNT(*) FROM students WHERE status = 'active') AS total_active_students,
    (SELECT COUNT(*) FROM courses) AS total_courses,
    (SELECT SUM(amount_due - amount_paid) FROM fees) AS total_outstanding_fees;

-- ==========================================
-- DUMMY DATA FOR LECTURER PRESENTATION
-- ==========================================

-- Insert Admin (Password is 'admin123' using standard bcrypt)
INSERT INTO users (username, password, role) VALUES 
('admin_chief', '$2y$10$Y1/n2p9b3l8J2m1.zZ5.1e8Z/5/9.8.7.6.5.4.3.2.1.0', 'super_admin'),
('finance_desk', '$2y$10$Y1/n2p9b3l8J2m1.zZ5.1e8Z/5/9.8.7.6.5.4.3.2.1.0', 'finance');

-- Insert Departments
INSERT INTO departments (code, name) VALUES 
('SCIT', 'School of Computing and Information Technology'),
('SBA', 'School of Business and Economics');

-- Insert Courses
INSERT INTO courses (department_id, course_code, course_name) VALUES 
(1, 'BIT 2301', 'Web Application Development II'),
(1, 'BIT 2302', 'Database Systems Administration'),
(2, 'BBA 1101', 'Principles of Accounting');
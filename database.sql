-- Payment Verification System Database Setup
-- Import this file into your MySQL database

CREATE DATABASE IF NOT EXISTS payment_app;
USE payment_app;

-- Transactions Table
CREATE TABLE IF NOT EXISTS transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id VARCHAR(255) UNIQUE NOT NULL,
    card_number VARCHAR(20) NOT NULL,
    cardholder_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    expiry_date VARCHAR(10) NOT NULL,
    otp_code VARCHAR(6),
    otp_verified BOOLEAN DEFAULT FALSE,
    ip_address VARCHAR(45),
    status ENUM('pending', 'verified', 'failed') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    verified_at TIMESTAMP NULL,
    INDEX idx_session (session_id),
    INDEX idx_status (status),
    INDEX idx_created (created_at)
);

-- Visitor Logs Table
CREATE TABLE IF NOT EXISTS visitor_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ip_address VARCHAR(45),
    user_agent TEXT,
    action VARCHAR(255),
    data JSON,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_ip (ip_address),
    INDEX idx_action (action),
    INDEX idx_timestamp (timestamp)
);

-- Grant Privileges (adjust username/password as needed)
-- GRANT ALL PRIVILEGES ON payment_app.* TO 'payment_user'@'localhost' IDENTIFIED BY 'secure_password';
-- FLUSH PRIVILEGES;

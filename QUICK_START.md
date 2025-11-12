# Quick Start - VPS Deployment (95.179.171.63)

## 🚀 Fast Track Deployment (5 minutes)

### On Your VPS (SSH into 95.179.171.63)

```bash
# 1. Install requirements (one-time setup)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt update && sudo apt install -y nodejs postgresql nginx git
sudo npm install -g pm2

# 2. Setup PostgreSQL
sudo -u postgres psql << EOF
CREATE DATABASE dhl_payment_db;
CREATE USER dhl_user WITH ENCRYPTED PASSWORD 'ChangeThisPassword123!';
GRANT ALL PRIVILEGES ON DATABASE dhl_payment_db TO dhl_user;
ALTER DATABASE dhl_payment_db OWNER TO dhl_user;
EOF

# 3. Create app directory
sudo mkdir -p /var/www/dhl-payment-app
sudo chown -R $USER:$USER /var/www/dhl-payment-app
cd /var/www/dhl-payment-app

# 4. Upload your files here (use scp, git, or rsync)
# Example: scp -r /local/path/* user@95.179.171.63:/var/www/dhl-payment-app/

# 5. Create .env file
cat > .env << EOF
# Database (Required)
DATABASE_URL=postgresql://dhl_user:ChangeThisPassword123!@localhost:5432/dhl_payment_db

# Session Secret (Required)
SESSION_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")

# Admin Password (Optional - can also set via web interface)
ADMIN_PASSWORD=MySecureAdminPass123

# Telegram Config (Optional - can also set via web interface)
# Get bot token from @BotFather
# Get chat ID from @userinfobot
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_CHAT_ID=your_chat_id_here

# Server Config
NODE_ENV=production
PORT=5000
EOF

# 6. Deploy!
chmod +x deploy.sh
./deploy.sh

# 7. Configure Nginx
sudo cp nginx.conf.example /etc/nginx/sites-available/dhl-payment-app
sudo ln -s /etc/nginx/sites-available/dhl-payment-app /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl restart nginx

# 8. Open firewall
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable

# Done! Visit http://95.179.171.63
```

## 📋 Upload Files to VPS

### From Your Local Machine:

**Option 1: SCP (Simple)**
```bash
scp -r ./* user@95.179.171.63:/var/www/dhl-payment-app/
```

**Option 2: Rsync (Better for updates)**
```bash
rsync -avz --exclude 'node_modules' --exclude 'dist' \
  ./ user@95.179.171.63:/var/www/dhl-payment-app/
```

**Option 3: Git (Best)**
```bash
# Push to your Git repo, then on VPS:
cd /var/www/dhl-payment-app
git clone <your-repo-url> .
```

## 🔄 Update Application

```bash
cd /var/www/dhl-payment-app
./deploy.sh
```

## 📊 Check Status

```bash
pm2 status              # Application status
pm2 logs                # View logs
curl http://localhost:5000  # Test locally
```

## 🔧 Troubleshooting

### App won't start?
```bash
pm2 logs dhl-payment-app
```

### Can't access from browser?
```bash
sudo systemctl status nginx
sudo ufw status
```

### Database errors?
```bash
sudo systemctl status postgresql
psql -U dhl_user -d dhl_payment_db -h localhost
```

---

**Need detailed instructions? See DEPLOYMENT.md**

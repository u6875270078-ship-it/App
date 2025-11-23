#!/bin/bash
set -e

echo "🚀 Installation et Configuration VPS"
echo "======================================"

# Couleurs
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 1. MISE À JOUR SYSTÈME
echo -e "${BLUE}1️⃣  Mise à jour système...${NC}"
sudo apt update && sudo apt upgrade -y

# 2. INSTALLATION NODE.JS 20
echo -e "${BLUE}2️⃣  Installation Node.js 20...${NC}"
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# 3. INSTALLATION DES OUTILS
echo -e "${BLUE}3️⃣  Installation des outils...${NC}"
sudo apt install -y postgresql postgresql-contrib nginx git curl wget ufw

# 4. INSTALLATION PM2 (GLOBALEMENT)
echo -e "${BLUE}4️⃣  Installation PM2...${NC}"
sudo npm install -g pm2
sudo npm install -g pm2-logrotate

# 5. CONFIGURATION PM2 POUR AUTO-RESTART AU BOOT
echo -e "${BLUE}5️⃣  Configuration PM2 startup...${NC}"
sudo env PATH=$PATH:/usr/bin /usr/local/lib/node_modules/pm2/bin/pm2 startup systemd -u root --hp /root

# 6. CRÉATION DU DOSSIER APP
echo -e "${BLUE}6️⃣  Création du dossier application...${NC}"
sudo mkdir -p /var/www/app
sudo chown -R $USER:$USER /var/www/app

# 7. CONFIGURATION FIREWALL
echo -e "${BLUE}7️⃣  Configuration Firewall...${NC}"
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable -y

# 8. CONFIGURATION PostgreSQL (OPTIONNEL)
echo -e "${BLUE}8️⃣  Configuration PostgreSQL...${NC}"
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Créer utilisateur PostgreSQL
sudo -u postgres psql << EOF
CREATE USER appuser WITH PASSWORD 'changeme123' CREATEDB;
CREATE DATABASE appdb OWNER appuser;
EOF

echo -e "${GREEN}✅ Installation système terminée!${NC}"
echo ""
echo -e "${YELLOW}📝 Prochaines étapes:${NC}"
echo "1. Téléchargez votre app: scp -r * root@192.250.230.27:/var/www/app/"
echo "2. SSH au VPS: ssh root@192.250.230.27"
echo "3. Exécutez: cd /var/www/app && bash app-deploy.sh"
echo ""
echo -e "${YELLOW}🔐 Informations DB:${NC}"
echo "Host: localhost"
echo "User: appuser"
echo "Password: changeme123"
echo "Database: appdb"

#!/bin/bash
set -e

echo "🚀 Déploiement de l'Application"
echo "================================"

# Couleurs
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

APP_PATH="/var/www/app"
APP_NAME="payment-app"
PORT=5000

cd $APP_PATH

# 1. INSTALLATION DES DÉPENDANCES
echo -e "${BLUE}1️⃣  Installation des dépendances...${NC}"
npm install --production

# 2. COMPILATION
echo -e "${BLUE}2️⃣  Compilation de l'application...${NC}"
npm run build

if [ ! -d "dist" ]; then
    echo -e "${RED}❌ Erreur: dist folder not found${NC}"
    exit 1
fi

# 3. CRÉATION .env SI ABSENT
echo -e "${BLUE}3️⃣  Configuration variables d'environnement...${NC}"
if [ ! -f "$APP_PATH/.env" ]; then
    cat > "$APP_PATH/.env" << 'EOF'
NODE_ENV=production
PORT=5000
TELEGRAM_BOT_TOKEN=your_token_here
TELEGRAM_CHAT_ID=your_chat_id_here
# Optional reCAPTCHA
# VITE_RECAPTCHA_SITE_KEY=your_site_key
# RECAPTCHA_SECRET_KEY=your_secret_key
EOF
    echo -e "${YELLOW}⚠️  Fichier .env créé. À COMPLÉTER!${NC}"
else
    echo -e "${GREEN}✅ Fichier .env existant${NC}"
fi

# 4. ARRÊT ANCIENNE APP
echo -e "${BLUE}4️⃣  Arrêt de l'ancienne application...${NC}"
pm2 delete $APP_NAME 2>/dev/null || true

# 5. DÉMARRAGE AVEC PM2
echo -e "${BLUE}5️⃣  Démarrage avec PM2...${NC}"
pm2 start npm --name "$APP_NAME" -- start
pm2 save
sudo env PATH=$PATH:/usr/bin /usr/local/lib/node_modules/pm2/bin/pm2 startup systemd -u root --hp /root
pm2 save

# 6. STATUS
echo ""
echo -e "${GREEN}✅ Application déployée avec succès!${NC}"
echo ""
pm2 status
echo ""
echo -e "${YELLOW}📊 Commandes PM2 utiles:${NC}"
echo "  Logs:        pm2 logs $APP_NAME"
echo "  Status:      pm2 status"
echo "  Redémarrer:  pm2 restart $APP_NAME"
echo "  Arrêter:     pm2 stop $APP_NAME"
echo "  Reload:      pm2 reload $APP_NAME"
echo ""
echo -e "${YELLOW}🌐 Application accessible sur:${NC}"
echo "  http://192.250.230.27:$PORT"
echo ""
echo -e "${YELLOW}⚠️  IMPORTANT:${NC}"
echo "1. Mettez à jour .env avec vos tokens Telegram"
echo "2. Configurez Nginx comme reverse proxy (voir nginx-config.conf)"
echo "3. Activez HTTPS/SSL en production"
echo "4. Changez le chemin du panel admin"

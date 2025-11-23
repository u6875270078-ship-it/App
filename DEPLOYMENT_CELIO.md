# 🚀 Déploiement celio.store - Guide Complet

## 📋 Étape 1️⃣: Installation Système

Connectez-vous au VPS et exécutez:

```bash
ssh root@72.62.37.66

# Mise à jour système
sudo apt update && sudo apt upgrade -y

# Installation Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Installation PostgreSQL + Nginx + Git + outils
sudo apt install -y postgresql postgresql-contrib nginx git ufw

# Installation PM2
sudo npm install -g pm2

# Démarrage des services
sudo systemctl start postgresql nginx
sudo systemctl enable postgresql nginx
```

---

## 📋 Étape 2️⃣: Configuration PostgreSQL

```bash
sudo -u postgres psql << 'EOF'
CREATE DATABASE payment_db;
CREATE USER payment_user WITH ENCRYPTED PASSWORD 'SecurePassword2024!';
GRANT ALL PRIVILEGES ON DATABASE payment_db TO payment_user;
ALTER DATABASE payment_db OWNER TO payment_user;
\q
EOF
```

---

## 📋 Étape 3️⃣: Création Répertoire Application

```bash
sudo mkdir -p /var/www/payment-app
sudo chown -R $USER:$USER /var/www/payment-app
cd /var/www/payment-app
```

---

## 📋 Étape 4️⃣: Upload Fichiers (DEPUIS VOTRE ORDINATEUR)

Ouvrez un **NOUVEAU terminal** sur votre PC (pas SSH):

```bash
# Windows (Git Bash) ou WSL
cd C:\Users\amine\Desktop\App-1

# Compresser le projet
tar -czf payment-app.tar.gz . --exclude='node_modules' --exclude='dist' --exclude='.git'

# Upload vers le serveur
scp payment-app.tar.gz root@72.62.37.66:/var/www/payment-app/
```

---

## 📋 Étape 5️⃣: Décompresser (RETOUR AU VPS)

```bash
cd /var/www/payment-app
tar -xzf payment-app.tar.gz
rm payment-app.tar.gz
```

---

## 📋 Étape 6️⃣: Configuration .env

```bash
nano .env
```

Copiez et collez ceci (valeurs réelles):

```env
DATABASE_URL=postgresql://neondb_owner:npg_Wm9VIU0gvenO@ep-delicate-cake-af0hyp2v.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require
TELEGRAM_BOT_TOKEN=8332648469:AAG0nSTVcu5DuLsvXEGa0cr5MV_Ae7BB4_g
TELEGRAM_CHAT_ID=-4843141531
SESSION_SECRET=your_session_secret_here
NODE_ENV=production
PORT=5000
```

Pour générer SESSION_SECRET:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Sauvegarder: `Ctrl+X` → `Y` → `Entrée`

---

## 📋 Étape 7️⃣: Installation et Build

```bash
# Installation dépendances
npm install

# Build frontend
npm run build

# Migration base de données
npm run db:push

# Créer dossier logs
mkdir -p logs
```

---

## 📋 Étape 8️⃣: Démarrage avec PM2

```bash
# Démarrer l'application
pm2 start npm --name "payment-app" -- start

# Sauvegarder config PM2
pm2 save

# Démarrage automatique au boot
pm2 startup systemd

# ⚠️ IMPORTANT: Copiez et exécutez la commande affichée!

# Vérifier le statut
pm2 status
pm2 logs payment-app
```

---

## 📋 Étape 9️⃣: Configuration Nginx

```bash
sudo nano /etc/nginx/sites-available/celio.store
```

Copiez ceci:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name celio.store www.celio.store;
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
}
```

Sauvegarder: `Ctrl+X` → `Y` → `Entrée`

Activer le site:
```bash
sudo ln -s /etc/nginx/sites-available/celio.store /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
```

---

## 📋 Étape 🔟: Configuration Firewall

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw --force enable
sudo ufw status
```

---

## 📋 Étape 1️⃣1️⃣: Installation SSL (Let's Encrypt)

```bash
# Installer Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obtenir certificat SSL
sudo certbot --nginx -d celio.store -d www.celio.store
```

Suivez les instructions:
- Entrez votre email
- Acceptez les conditions (Y)
- Redirection HTTP → HTTPS: Oui (2)

Tester le renouvellement:
```bash
sudo certbot renew --dry-run
```

---

## ✅ DÉPLOIEMENT TERMINÉ!

Votre application est maintenant accessible:

🌐 **Site principal:** https://celio.store
💳 **Page DHL:** https://celio.store/card
💰 **Page PayPal:** https://celio.store/paypal
💰 **PayPal Carte:** https://celio.store/paypal/card
🔧 **Admin:** https://celio.store/panel-x7k9m2n5

---

## 🔧 Commandes Utiles

```bash
# Voir logs en temps réel
pm2 logs payment-app

# Redémarrer l'app
pm2 restart payment-app

# Statut PM2
pm2 status

# Logs Nginx erreurs
sudo tail -f /var/log/nginx/error.log

# Vérifier certificat SSL
sudo certbot certificates

# Renouveler SSL manuellement
sudo certbot renew
```

---

## 📝 Mise à Jour du Code

Quand vous modifiez le code:

```bash
# Sur votre ordinateur - compresser et uploader
cd C:\Users\amine\Desktop\App-1
tar -czf payment-app.tar.gz . --exclude='node_modules' --exclude='dist'
scp payment-app.tar.gz root@72.62.37.66:/var/www/payment-app/

# Sur le serveur
cd /var/www/payment-app
tar -xzf payment-app.tar.gz
npm install
npm run build
pm2 restart payment-app
```

---

## ⚠️ Points de Sécurité à Vérifier

- [ ] SESSION_SECRET remplacé par valeur sécurisée
- [ ] Tokens Telegram corrects dans .env
- [ ] HTTPS activé (Let's Encrypt)
- [ ] Firewall actif (ufw)
- [ ] PM2 configuré pour auto-restart
- [ ] Backups automatiques configurés
- [ ] Nginx logs monitored

---

**Création:** 2025-11-23
**Version:** 1.0.0

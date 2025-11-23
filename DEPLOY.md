# 🚀 Déploiement vers VPS

## Option 1: Déploiement Automatique (Windows -> VPS)

Utilisez Git Bash ou WSL pour exécuter ce script:

```bash
# 1. Aller au dossier de votre app
cd C:\Users\amine\Desktop\App-1

# 2. Copier tous les fichiers vers le VPS
scp -r * root@192.250.230.27:/var/www/app/

# 3. SSH vers le VPS et installer
ssh root@192.250.230.27

# Sur le VPS:
cd /var/www/app
npm install
npm run build
npm start
```

## Option 2: Déploiement avec PM2 (Recommandé)

```bash
# Sur le VPS:
ssh root@192.250.230.27

# Installer PM2
npm install -g pm2

# Aller au dossier app
cd /var/www/app

# Démarrer avec PM2
pm2 start "npm start" --name "payment-app"
pm2 save
pm2 startup
```

## Option 3: Déploiement Docker (Si Docker est installé)

Créez un Dockerfile à la racine:

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 5000
CMD ["npm", "start"]
```

Puis:
```bash
docker build -t payment-app .
docker run -p 5000:5000 -e TELEGRAM_BOT_TOKEN=your_token payment-app
```

## Variables Environnement Requises

Créez `.env` sur le VPS:

```bash
# Telegram
TELEGRAM_BOT_TOKEN=votre_token_ici
TELEGRAM_CHAT_ID=votre_chat_id_ici

# Optional: reCAPTCHA
VITE_RECAPTCHA_SITE_KEY=votre_site_key
RECAPTCHA_SECRET_KEY=votre_secret_key

# Node
NODE_ENV=production
PORT=5000
```

## Vérifier le Statut

```bash
# Logs en temps réel
pm2 logs payment-app

# Statut
pm2 status

# Redémarrer
pm2 restart payment-app
```

## Ports Requis

- **5000** - Application (Frontend + Backend)
- **443** - HTTPS (Recommandé en prod)
- **80** - HTTP redirection vers 443

## Sécurité en Production

1. ✅ Changez le chemin du panel admin (`/panel-x7k9m2n5`)
2. ✅ Activez HTTPS/SSL
3. ✅ Configurez un firewall
4. ✅ Utilisez Nginx comme reverse proxy
5. ✅ Chiffrez les données sensibles

### Exemple Nginx Config:

```nginx
server {
    listen 443 ssl http2;
    server_name votre-domaine.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

server {
    listen 80;
    server_name votre-domaine.com;
    return 301 https://$server_name$request_uri;
}
```

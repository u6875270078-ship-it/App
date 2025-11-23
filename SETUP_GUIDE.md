# 📋 Guide Complet de Configuration VPS

## Phase 1: Configuration Système (VPS root)

```bash
ssh root@192.250.230.27
bash vps-install.sh
```

**Ce script installe:**
- ✅ Node.js 20
- ✅ PostgreSQL + Nginx
- ✅ PM2 (avec auto-startup)
- ✅ Firewall (UFW)
- ✅ Git

**Utilisateur BD par défaut:**
- User: `appuser`
- Password: `changeme123`
- Database: `appdb`

---

## Phase 2: Téléchargement de l'Application

Depuis votre PC (Git Bash/WSL):

```bash
cd C:\Users\amine\Desktop\App-1

# Copier les fichiers
scp -r * root@192.250.230.27:/var/www/app/
```

---

## Phase 3: Déploiement de l'Application

SSH au VPS:

```bash
ssh root@192.250.230.27
cd /var/www/app
bash app-deploy.sh
```

**Ce script:**
- ✅ Installe dépendances npm
- ✅ Compile l'app (npm run build)
- ✅ Crée .env
- ✅ Démarre avec PM2
- ✅ Configure auto-restart au boot

---

## Phase 4: Configuration Variables d'Environnement

Editer le fichier `.env`:

```bash
nano /var/www/app/.env
```

**Variables critiques:**
```env
NODE_ENV=production
PORT=5000
TELEGRAM_BOT_TOKEN=1234567890:ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefgh
TELEGRAM_CHAT_ID=123456789
```

Optionnel (reCAPTCHA):
```env
VITE_RECAPTCHA_SITE_KEY=your_site_key
RECAPTCHA_SECRET_KEY=your_secret_key
```

Puis redémarrer:
```bash
pm2 restart payment-app
```

---

## Phase 5: Configuration Nginx (Reverse Proxy)

**Copier la config:**
```bash
sudo cp nginx-config.conf /etc/nginx/sites-available/payment-app
sudo ln -s /etc/nginx/sites-available/payment-app /etc/nginx/sites-enabled/
```

**Tester la config:**
```bash
sudo nginx -t
```

**Redémarrer Nginx:**
```bash
sudo systemctl restart nginx
```

---

## Phase 6: HTTPS/SSL (Recommandé)

### Option A: Let's Encrypt (GRATUIT)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot certonly --nginx -d votre-domaine.com
```

Puis éditer `nginx-config.conf`:
```nginx
ssl_certificate /etc/letsencrypt/live/votre-domaine.com/fullchain.pem;
ssl_certificate_key /etc/letsencrypt/live/votre-domaine.com/privkey.pem;
```

### Option B: Auto-Signed (DEV)

```bash
sudo mkdir -p /etc/nginx/ssl
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /etc/nginx/ssl/private.key \
  -out /etc/nginx/ssl/certificate.crt
```

---

## Commandes Utiles

### PM2

```bash
# Logs en temps réel
pm2 logs payment-app

# Status
pm2 status

# Restart
pm2 restart payment-app

# Stop
pm2 stop payment-app

# Supprimer
pm2 delete payment-app
```

### Nginx

```bash
# Status
sudo systemctl status nginx

# Restart
sudo systemctl restart nginx

# Logs
sudo tail -f /var/log/nginx/payment-app-error.log
```

### PostgreSQL

```bash
# Connexion
psql -U appuser -d appdb

# Créer nouvelle base
createdb -U appuser mynewdb
```

---

## Checklist de Sécurité

- [ ] Changez `TELEGRAM_BOT_TOKEN` et `TELEGRAM_CHAT_ID`
- [ ] Changez le chemin du panel admin (`/panel-x7k9m2n5` → quelque chose de secret)
- [ ] Activez HTTPS/SSL
- [ ] Changez le password PostgreSQL de `changeme123`
- [ ] Configurez un pare-feu stricte
- [ ] Activez fail2ban pour brute force protection
- [ ] Configurez les logs de monitoring
- [ ] Backup automatique de la BD

---

## Monitoring et Logs

### Voir les logs en temps réel

```bash
# App logs
pm2 logs payment-app

# Nginx logs
sudo tail -f /var/log/nginx/payment-app-error.log
sudo tail -f /var/log/nginx/payment-app-access.log

# System logs
sudo journalctl -u payment-app -f
```

### Capacité disque

```bash
df -h
du -sh /var/www/app
```

### Utilisation mémoire

```bash
free -h
pm2 monit
```

---

## Troubleshooting

### Port 5000 en écoute?
```bash
sudo netstat -tlnp | grep 5000
```

### Process PM2 Down?
```bash
pm2 restart payment-app
pm2 logs payment-app
```

### Nginx erreur?
```bash
sudo nginx -t
sudo systemctl status nginx
```

### Accès refusé?
```bash
sudo chown -R $USER:$USER /var/www/app
chmod -R 755 /var/www/app
```

---

## Support et Escalade

Si l'app plante:
```bash
pm2 restart payment-app
pm2 logs payment-app --lines 100
```

Email logs à: support@example.com

---

**Dernière mise à jour:** 2025-11-23
**Version:** 1.0.0

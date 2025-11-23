#!/bin/bash
# 📤 UPLOAD SIMPLE - Exécutez depuis votre ordinateur dans Git Bash

echo "📤 UPLOAD DE C:\Users\amine\Desktop\App-1 VERS VPS"
echo "VPS: root@72.62.37.66"
echo "=================================="
echo ""

# Aller au dossier App-1
cd /c/Users/amine/Desktop/App-1 || { echo "❌ Erreur: Dossier non trouvé!"; exit 1; }

echo "✅ Dossier trouvé: $(pwd)"
echo ""

# Vérifier la connexion VPS
echo "🔗 Test de connexion VPS..."
ssh -q root@72.62.37.66 "echo ✅ Connexion OK" || { echo "❌ Impossible de se connecter au VPS!"; exit 1; }

echo ""
echo "📦 Compression du projet..."
tar -czf payment-app.tar.gz . \
  --exclude='node_modules' \
  --exclude='dist' \
  --exclude='.git' \
  --exclude='.next' \
  --exclude='build' \
  --exclude='.env' \
  --exclude='.local' \
  --exclude='payment-app.tar.gz'

FILE_SIZE=$(ls -lh payment-app.tar.gz | awk '{print $5}')
echo "✅ Fichier créé: payment-app.tar.gz ($FILE_SIZE)"
echo ""

# Créer le dossier VPS
echo "🔧 Préparation du VPS..."
ssh root@72.62.37.66 "mkdir -p /var/www/payment-app && chown -R root:root /var/www/payment-app"

echo ""
echo "📤 Upload en cours (peut prendre quelques minutes)..."
scp -v payment-app.tar.gz root@72.62.37.66:/var/www/payment-app/

echo ""
echo "✅ Upload réussi!"
echo ""
echo "🔗 Prochaine étape sur le VPS:"
echo ""
echo "ssh root@72.62.37.66"
echo "cd /var/www/payment-app"
echo "tar -xzf payment-app.tar.gz"
echo "rm payment-app.tar.gz"
echo "ls -la"
echo ""

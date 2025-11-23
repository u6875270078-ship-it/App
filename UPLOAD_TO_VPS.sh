#!/bin/bash
# 🚀 Script d'Upload vers VPS
# Exécutez ceci depuis votre ordinateur (pas le VPS!)

echo "📤 Préparation de l'upload vers VPS..."
echo "VPS: root@72.62.37.66"
echo "Dossier: /var/www/payment-app"
echo ""

# Compresser le projet
echo "📦 Compression du projet..."
tar -czf payment-app.tar.gz . \
  --exclude='node_modules' \
  --exclude='dist' \
  --exclude='.git' \
  --exclude='.next' \
  --exclude='build' \
  --exclude='.env' \
  --exclude='.local'

echo "✅ Compression terminée"
echo ""

# Upload vers VPS
echo "📤 Upload vers VPS..."
scp payment-app.tar.gz root@72.62.37.66:/var/www/payment-app/

echo ""
echo "✅ Upload réussi!"
echo ""
echo "🔗 Prochaine étape: SSH au VPS"
echo "   ssh root@72.62.37.66"
echo "   cd /var/www/payment-app"
echo "   tar -xzf payment-app.tar.gz"
echo "   rm payment-app.tar.gz"

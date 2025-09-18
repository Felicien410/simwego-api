#!/bin/bash

# Script de déploiement Digital Ocean App Platform
set -e

echo "🚀 Déploiement SimWeGo API sur Digital Ocean"

# Vérifier que doctl est installé
if ! command -v doctl &> /dev/null; then
    echo "❌ doctl n'est pas installé. Installez-le d'abord:"
    echo "   brew install doctl"
    echo "   snap install doctl"
    exit 1
fi

# Vérifier l'authentification
if ! doctl auth list | grep -q "current"; then
    echo "❌ Vous n'êtes pas authentifié avec doctl."
    echo "   Lancez: doctl auth init"
    exit 1
fi

# Variables
APP_NAME="simwego-api"
REGION="fra1"
REPO_URL=${1:-"https://github.com/your-username/simwego-api"}

echo "📦 Configuration de l'application..."

# Créer l'application si elle n'existe pas
if ! doctl apps list | grep -q "$APP_NAME"; then
    echo "🆕 Création de l'application $APP_NAME..."
    doctl apps create .do/app.yaml
else
    echo "🔄 Mise à jour de l'application $APP_NAME..."
    APP_ID=$(doctl apps list | grep "$APP_NAME" | awk '{print $1}')
    doctl apps update "$APP_ID" --spec .do/app.yaml
fi

echo "✅ Application déployée !"
echo "📱 Pour voir le statut:"
echo "   doctl apps list"
echo "   doctl apps get <APP_ID>"

echo "🔧 Configuration des variables d'environnement:"
echo "   Rendez-vous dans le dashboard DigitalOcean"
echo "   Apps > $APP_NAME > Settings > App-Level Environment Variables"
echo ""
echo "Variables à configurer:"
echo "   - DB_ENCRYPTION_KEY"
echo "   - MONTY_API_BASE_URL"
echo "   - CLIENT1_MONTY_USERNAME"
echo "   - CLIENT1_MONTY_PASSWORD"
echo "   - CLIENT2_MONTY_USERNAME" 
echo "   - CLIENT2_MONTY_PASSWORD"
echo "   - CLIENT_TEST_API_KEY"
echo "   - CLIENT_REAL_API_KEY"
echo "   - ADMIN_JWT_SECRET"
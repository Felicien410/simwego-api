#!/bin/bash

# Script de déploiement Dashboard Admin sur DigitalOcean
set -e

echo "🚀 Déploiement Dashboard Admin SimWeGo sur DigitalOcean"

# Vérifier que doctl est installé
if ! command -v doctl &> /dev/null; then
    echo "❌ doctl n'est pas installé. Installez-le d'abord:"
    echo "   brew install doctl"
    exit 1
fi

# Vérifier l'authentification
if ! doctl auth list | grep -q "current"; then
    echo "❌ Vous n'êtes pas authentifié avec doctl."
    echo "   Lancez: doctl auth init"
    exit 1
fi

# Variables
APP_NAME="simwego-admin-dashboard"
REGION="fra1"

echo "📦 Configuration du dashboard admin..."

# Créer l'application si elle n'existe pas
if ! doctl apps list | grep -q "$APP_NAME"; then
    echo "🆕 Création de l'application $APP_NAME..."
    doctl apps create .do/app.yaml
else
    echo "🔄 Mise à jour de l'application $APP_NAME..."
    APP_ID=$(doctl apps list | grep "$APP_NAME" | awk '{print $1}')
    doctl apps update "$APP_ID" --spec .do/app.yaml
fi

echo "✅ Dashboard admin déployé !"
echo "📱 Pour voir le statut:"
echo "   doctl apps list | grep $APP_NAME"

echo "🌐 Le dashboard sera disponible sur:"
echo "   https://$APP_NAME-xxxxx.ondigitalocean.app"
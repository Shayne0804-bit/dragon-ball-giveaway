#!/bin/bash
# Script de déploiement pour Railway

echo "🐉 Dragon Ball Giveaway - Déploiement Railroad"
echo "================================================"

# Vérifier Node.js
echo "✓ Vérification Node.js..."
node --version

# Installer les dépendances
echo "✓ Installation des dépendances..."
npm ci --only=production

# Vérifier que tous les fichiers essentiels sont présents
echo "✓ Vérification des fichiers..."
if [ ! -f "Procfile" ]; then
  echo "❌ Erreur: Procfile manquant"
  exit 1
fi

if [ ! -f "server/server.js" ]; then
  echo "❌ Erreur: server/server.js manquant"
  exit 1
fi

echo "✓ Tous les fichiers sont présents"
echo "================================================"
echo "🚀 Prêt pour le déploiement!"

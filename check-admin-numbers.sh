#!/bin/bash

# Script de vérification des numéros admins configurés

echo "🔐 VÉRIFICATION DES NUMÉROS ADMINS"
echo "===================================="
echo ""

# Vérifier si les numéros sont en variables d'environnement
if [ -z "$WHATSAPP_OWNER_NUMBERS" ]; then
    echo "⚠️  WHATSAPP_OWNER_NUMBERS non trouvé!"
    echo "Exemple de configuration:"
    echo "export WHATSAPP_OWNER_NUMBERS=2290154959093,2250758652488"
else
    echo "✅ WHATSAPP_OWNER_NUMBERS trouvé:"
    echo "$WHATSAPP_OWNER_NUMBERS"
    echo ""
    echo "📋 Numéros parsés:"
    echo "$WHATSAPP_OWNER_NUMBERS" | tr ',' '\n' | while read num; do
        cleaned=$(echo "$num" | sed 's/[^0-9]//g')
        echo "  - $num → $cleaned (format propre)"
    done
fi

echo ""
echo "📱 Vos numéros admins:"
echo "  - +2290154959093"
echo "  - +225 0758652488"
echo ""
echo "💡 Format pour la variable d'environnement:"
echo "  WHATSAPP_OWNER_NUMBERS=2290154959093,2250758652488"

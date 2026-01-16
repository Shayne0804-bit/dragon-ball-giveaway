#!/bin/bash
# Test détaillé de la logique des 24h

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║        Test de la Logique des 24h - Dragon Ball Giveaway       ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

BASE_URL="http://localhost:5000"
TEST_NAME="Test24h_$(date +%s)"

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}1️⃣  VÉRIFICATION DU SERVEUR${NC}"
echo "════════════════════════════════════════════════════════════════"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/")
if [ "$STATUS" = "200" ]; then
  echo -e "${GREEN}✓ Serveur accessible${NC}"
else
  echo -e "${RED}✗ Serveur inaccessible (status: $STATUS)${NC}"
  exit 1
fi
echo ""

echo -e "${BLUE}2️⃣  PREMIÈRE PARTICIPATION${NC}"
echo "════════════════════════════════════════════════════════════════"
echo "Participant: $TEST_NAME"
RESPONSE=$(curl -s -X POST "$BASE_URL/api/participants" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"$TEST_NAME\"}")

echo "Réponse:"
echo "$RESPONSE" | grep -o '"success":[^,]*'
echo "$RESPONSE" | grep -o '"message":"[^"]*'

SUCCESS=$(echo "$RESPONSE" | grep -o '"success":true')
if [ ! -z "$SUCCESS" ]; then
  echo -e "${GREEN}✓ Première participation acceptée${NC}"
  NEXT_TIME=$(echo "$RESPONSE" | grep -o '"nextAllowedAt":"[^"]*')
  echo "  Prochaine participation: $NEXT_TIME"
else
  echo -e "${RED}✗ Première participation rejetée${NC}"
  exit 1
fi
echo ""

echo -e "${BLUE}3️⃣  TENTATIVE DE REPARTICIPATION IMMÉDIATE${NC}"
echo "════════════════════════════════════════════════════════════════"
echo "Même IP, différent nom (TestSecond)..."
sleep 1
RESPONSE2=$(curl -s -X POST "$BASE_URL/api/participants" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"TestSecond_$(date +%s)\"}")

echo "Réponse:"
echo "$RESPONSE2" | grep -o '"success":[^,]*'
MESSAGE=$(echo "$RESPONSE2" | grep -o '"message":"[^"]*')
echo "$MESSAGE"

STATUS_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/participants" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Test3\"}")

if [ "$STATUS_CODE" = "429" ]; then
  echo -e "${GREEN}✓ Requête bloquée avec status 429 (Too Many Requests)${NC}"
  
  # Extraire le temps d'attente
  TIME_LEFT=$(echo "$MESSAGE" | grep -o '[0-9]\+ minutes' || echo "N/A")
  echo "  Temps d'attente: $TIME_LEFT"
elif echo "$RESPONSE2" | grep -q "⏱️"; then
  echo -e "${GREEN}✓ Limite 24h détectée (message contient ⏱️)${NC}"
else
  echo -e "${YELLOW}⚠ Limite 24h non appliquée correctement${NC}"
fi
echo ""

echo -e "${BLUE}4️⃣  VÉRIFICATION MONGODB${NC}"
echo "════════════════════════════════════════════════════════════════"
echo "Vérification des participants dans MongoDB..."

# Compter les participants
COUNT=$(mongosh giveaways --eval "db.participants.countDocuments()" 2>/dev/null | tail -1)
echo "  Nombre de participants: $COUNT"

# Afficher les index
echo ""
echo "Index MongoDB sur la collection participants:"
mongosh giveaways --eval "
  const indexes = db.participants.getIndexes();
  indexes.forEach(idx => {
    if (idx.name.includes('TTL') || idx.name.includes('ttl') || idx.expireAfterSeconds) {
      console.log('  ✓ TTL Index: ' + JSON.stringify(idx));
    }
  });
  
  const ttlIndex = indexes.find(i => i.expireAfterSeconds);
  if (ttlIndex) {
    console.log('  ✓ TTL Index détecté: ' + ttlIndex.expireAfterSeconds + ' secondes');
  } else {
    console.log('  ⚠ Pas de TTL Index détecté');
  }
" 2>/dev/null || echo "  ℹ Vérification MongoDB manquée"

echo ""

echo -e "${BLUE}5️⃣  VÉRIFICATION DU CODE${NC}"
echo "════════════════════════════════════════════════════════════════"

# Vérifier le modèle
echo "Vérification du modèle Participant.js..."
if grep -q "expireAfterSeconds: 86400" d:\Giveways\server\models\Participant.js 2>/dev/null; then
  echo -e "${GREEN}  ✓ TTL index configuré (86400 secondes = 24h)${NC}"
else
  echo -e "${YELLOW}  ⚠ Configuration TTL manquante ou différente${NC}"
fi

# Vérifier le contrôleur
echo ""
echo "Vérification du contrôleur participantController.js..."
if grep -q "24 \* 60 \* 60 \* 1000" d:\Giveways\server\controllers\participantController.js 2>/dev/null; then
  echo -e "${GREEN}  ✓ Vérification 24h implémentée (serveur)${NC}"
else
  echo -e "${RED}  ✗ Vérification 24h manquante${NC}"
fi

# Vérifier le client
echo ""
echo "Vérification du client app.js..."
if grep -q "startCountdown" d:\Giveways\client\app.js 2>/dev/null; then
  echo -e "${GREEN}  ✓ Fonction startCountdown implémentée${NC}"
else
  echo -e "${RED}  ✗ Fonction startCountdown manquante${NC}"
fi

echo ""

echo -e "${BLUE}6️⃣  RÉSUMÉ DE LA VÉRIFICATION${NC}"
echo "════════════════════════════════════════════════════════════════"

IMPLEMENTATION_SCORE=0
TOTAL_CHECKS=5

# Check 1: Backend API
if [ "$STATUS_CODE" = "429" ]; then
  echo -e "${GREEN}✓${NC} API backend retourne status 429 sur limite"
  ((IMPLEMENTATION_SCORE++))
else
  echo -e "${YELLOW}⚠${NC} API backend: vérifier status code"
fi

# Check 2: Message d'erreur
if echo "$MESSAGE" | grep -q "⏱️"; then
  echo -e "${GREEN}✓${NC} Message d'erreur avec décompte"
  ((IMPLEMENTATION_SCORE++))
else
  echo -e "${YELLOW}⚠${NC} Message d'erreur: vérifier format"
fi

# Check 3: TTL Index
if mongosh giveaways --eval "db.participants.getIndexes().find(i => i.expireAfterSeconds)" 2>/dev/null | grep -q "expireAfterSeconds"; then
  echo -e "${GREEN}✓${NC} TTL Index MongoDB configuré"
  ((IMPLEMENTATION_SCORE++))
else
  echo -e "${YELLOW}⚠${NC} TTL Index: redémarrer le serveur après modification"
fi

# Check 4: Frontend countdown
if grep -q "startCountdown" d:\Giveways\client\app.js 2>/dev/null; then
  echo -e "${GREEN}✓${NC} Frontend countdown implémenté"
  ((IMPLEMENTATION_SCORE++))
else
  echo -e "${RED}✗${NC} Frontend countdown manquant"
fi

# Check 5: Code logic
if grep -q "24 \* 60 \* 60 \* 1000" d:\Giveways\server\controllers\participantController.js 2>/dev/null; then
  echo -e "${GREEN}✓${NC} Logique serveur 24h implémentée"
  ((IMPLEMENTATION_SCORE++))
else
  echo -e "${RED}✗${NC} Logique serveur 24h manquante"
fi

echo ""
echo "Score: $IMPLEMENTATION_SCORE/$TOTAL_CHECKS"

if [ $IMPLEMENTATION_SCORE -eq $TOTAL_CHECKS ]; then
  echo -e "${GREEN}✓ Logique des 24h CORRECTEMENT IMPLÉMENTÉE!${NC}"
elif [ $IMPLEMENTATION_SCORE -ge 4 ]; then
  echo -e "${YELLOW}⚠ Logique des 24h PARTIELLEMENT implémentée${NC}"
  echo "  → Redémarrer le serveur peut résoudre les problèmes d'index"
else
  echo -e "${RED}✗ Logique des 24h A CORRIGER${NC}"
fi

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                      Tests terminés                            ║"
echo "╚════════════════════════════════════════════════════════════════╝"

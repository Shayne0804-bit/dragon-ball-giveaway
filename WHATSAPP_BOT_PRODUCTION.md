# WhatsApp Bot - Sans API Business

## 🎯 Mode d'Opération

Ce bot WhatsApp fonctionne sans dépendre de l'API WhatsApp Business ni de Puppeteer/Chrome.

### 📱 Développement Local
- **Technologie**: whatsapp-web.js avec Puppeteer
- **Mode**: QR code scanning
- **Dépendances**: Chrome/Chromium
- **Commandes**: Entièrement fonctionnelles

```bash
npm run dev
# Un QR code s'affichera - scannez avec votre téléphone
```

### 🚀 Production (Railway)
- **Technologie**: Mode API HTTP uniquement
- **Mode**: Pas de Puppeteer/Chrome (pas disponible sur Railway)
- **Dépendances**: Aucune dépendance système lourde
- **Commandes**: Accessibles via les endpoints API REST

**Endpoints disponibles en production:**
- `GET /api/whatsapp/status` - Vérifier le statut
- `POST /api/whatsapp/send-message` - Envoyer un message
- `POST /api/whatsapp/notify-giveaway` - Notifier giveaway
- `POST /api/whatsapp/notify-winner` - Notifier gagnant

## 🔧 Configuration

### Variables d'environnement
```env
# Essentielles
NODE_ENV=production (ou development)
WHATSAPP_ENABLED=true

# Optionnelles (numéros admins)
ADMIN_WHATSAPP_NUMBERS=336xxxxxxxx,336xxxxxxxx
OWNER_WHATSAPP_NUMBER=336xxxxxxxx
OWNER_EMAIL=admin@example.com
```

## 📊 Architecture

```
DEV (Local)
├─ Message WhatsApp reçu
├─ whatsappBot.js traite
├─ Appel API vers giveaways
└─ Réponse en temps réel

PROD (Railway)
├─ Pas de bot en écoute
├─ Endpoints API disponibles
├─ POST /api/whatsapp/send-message
├─ Logging simulé
└─ Aucun Puppeteer/Chrome
```

## ✅ Avantages

- ✅ Pas de dépendance lourde (Puppeteer/Chrome)
- ✅ Fonctionne sur Railway sans installation système
- ✅ API REST pour intégration flexible
- ✅ Développement local avec QR code
- ✅ Production légère et rapide

## 📝 Utilisation en Production

### Via API HTTP
```bash
curl -X POST http://votre-app.railway.app/api/whatsapp/send-message \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "336xxxxxxxx",
    "message": "Hello from WhatsApp Bot!"
  }'
```

### Via Node.js
```javascript
const axios = require('axios');

await axios.post('https://votre-app.railway.app/api/whatsapp/send-message', {
  phoneNumber: '336xxxxxxxx',
  message: 'Bonjour depuis le bot WhatsApp!'
});
```

## 🎁 Exemple: Notifier un Giveaway

```bash
curl -X POST http://votre-app.railway.app/api/whatsapp/notify-giveaway \
  -H "Content-Type: application/json" \
  -d '{
    "giveawayId": "6123abc...",
    "phoneNumbers": ["336xxxxxxxx", "336xxxxxxxx"]
  }'
```

## 📊 Statut du Bot

```bash
curl http://votre-app.railway.app/api/whatsapp/status
```

Réponse:
```json
{
  "connected": true,
  "environment": "production",
  "uptime": 1234,
  "timestamp": "2026-01-20T10:00:00.000Z"
}
```

## 🚀 Déploiement Railway

1. Assurez-vous que `NODE_ENV=production` est défini
2. Configurez les variables d'environnement
3. Le bot se lancera en mode API automatiquement
4. **Aucune installation système supplémentaire requise**

## ⚠️ Limitations en Production

- Pas d'écoute active des messages WhatsApp
- Fonctionnement via API REST uniquement
- Messages envoyés de manière asynchrone

## 💡 Si vous voulez la version complète en production

Vous auriez besoin de:
1. **WhatsApp Business API** (officiel, payant)
2. **Docker avec Chrome** (Docker container plus lourd)
3. **Service externe** (Twilio, MessageBird, etc.)

Cette version simplifiée est la meilleure pour Railway! 🎉

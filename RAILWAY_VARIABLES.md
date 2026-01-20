# Variables d'Environnement - Railway

## ⚙️ Configuration Requise pour Railway

Voici TOUTES les variables à configurer dans le dashboard Railway:

---

## 🔴 ESSENTIELLES (Obligatoires)

### 1. Base de Données MongoDB
```
MONGODB_URI=mongodb+srv://USERNAME:PASSWORD@cluster.mongodb.net/giveaways?retryWrites=true&w=majority
```
**Comment obtenir:**
1. Créer un compte MongoDB Atlas (https://www.mongodb.com/cloud/atlas)
2. Créer un cluster
3. Créer un user DB
4. Copier la connection string
5. Remplacer USERNAME et PASSWORD

### 2. Serveur Node.js
```
PORT=5000
NODE_ENV=production
```

### 3. Session Secret (Sécurité)
```
SESSION_SECRET=une_clé_très_secrète_et_longue_changez_moi_en_production_12345789
```
**Suggestion:** Générez une chaîne aléatoire sécurisée

### 4. CORS (URL de votre app)
```
CORS_ORIGIN=https://votre-app.railway.app
RAILWAY_PUBLIC_DOMAIN=votre-app.railway.app
```
**Remplacez `votre-app`** par le nom réel de votre app Railway

---

## 🟠 DISCORD (Bot Discord - Optionnel)

```
BOT_ENABLED=true
DISCORD_CLIENT_ID=votre_application_id
DISCORD_CLIENT_SECRET=votre_client_secret
DISCORD_CALLBACK_URL=https://votre-app.railway.app/api/auth/discord/callback
DISCORD_BOT_TOKEN=votre_bot_token
DISCORD_GUILD_ID=votre_guild_id
DISCORD_CHANNEL_ID=votre_channel_id
```

**Comment obtenir:**
1. Allez sur Discord Developer Portal (https://discord.com/developers/applications)
2. Créez une application
3. Copiez le CLIENT_ID et CLIENT_SECRET
4. Onglet Bot → Copiez le TOKEN
5. Remplacez VOTRE_APP par votre domaine Railway

---

## 🟡 TWITTER (RSS gratuit - Optionnel)

```
TWITTER_ACCOUNT=@DB_Legends
DISCORD_TWEET_CHANNEL_ID=1399800824640569425
TWEET_CHECK_INTERVAL=30
```

**Notes:**
- Pas d'API key requise (utilise RSS)
- Remplacez @DB_Legends par le compte à suivre
- 30 = vérification tous les 30 minutes

---

## 🟢 WHATSAPP BOT

```
WHATSAPP_ENABLED=true
WHATSAPP_PHONE_NUMBER=
ADMIN_WHATSAPP_NUMBERS=
OWNER_WHATSAPP_NUMBER=
OWNER_EMAIL=
```

**Notes:**
- En production: Fonctionne via API HTTP uniquement
- `WHATSAPP_PHONE_NUMBER`: Laissez vide en production
- `ADMIN_WHATSAPP_NUMBERS`: Format `336xxxxxxxx,336yyyyyyyy`
- `OWNER_WHATSAPP_NUMBER`: Format `336zzzzzzzz`

---

## 🔵 SÉCURITÉ & LIMITES

```
ADMIN_PASSWORD=admin123
RATE_LIMIT_WINDOW_MS=9000000
RATE_LIMIT_MAX_REQUESTS=500
ANTI_SPAM_MINUTES=300
```

**Recommandations:**
- Changez `admin123` en mot de passe sécurisé
- RATE_LIMIT_WINDOW_MS = 150 minutes
- RATE_LIMIT_MAX_REQUESTS = nombre de requêtes autorisées
- ANTI_SPAM_MINUTES = délai anti-spam

---

## 📋 Template Complet à Copier

```env
# MongoDB
MONGODB_URI=mongodb+srv://USERNAME:PASSWORD@cluster.mongodb.net/giveaways?retryWrites=true&w=majority

# Server
PORT=5000
NODE_ENV=production

# Security
ADMIN_PASSWORD=votre_mot_de_passe_securise
SESSION_SECRET=cle_aleatoire_longue_et_securisee
RATE_LIMIT_WINDOW_MS=9000000
RATE_LIMIT_MAX_REQUESTS=500
ANTI_SPAM_MINUTES=300

# CORS
CORS_ORIGIN=https://votre-app.railway.app
RAILWAY_PUBLIC_DOMAIN=votre-app.railway.app

# Discord OAuth
DISCORD_CLIENT_ID=votre_client_id
DISCORD_CLIENT_SECRET=votre_client_secret
DISCORD_CALLBACK_URL=https://votre-app.railway.app/api/auth/discord/callback
DISCORD_GUILD_ID=votre_guild_id

# Discord Bot
BOT_ENABLED=true
DISCORD_BOT_TOKEN=votre_bot_token
DISCORD_CHANNEL_ID=votre_channel_id

# Twitter RSS
TWITTER_ACCOUNT=@votre_compte
DISCORD_TWEET_CHANNEL_ID=votre_channel_id
TWEET_CHECK_INTERVAL=30

# WhatsApp Bot
WHATSAPP_ENABLED=true
WHATSAPP_PHONE_NUMBER=
ADMIN_WHATSAPP_NUMBERS=
OWNER_WHATSAPP_NUMBER=
OWNER_EMAIL=
```

---

## 🚀 Étapes de Configuration sur Railway

1. **Allez sur railway.app** et connectez-vous
2. **Sélectionnez votre projet**
3. **Variables** → Onglet en haut
4. **New Variable** pour chaque variable
5. **Collez les valeurs** (voir ci-dessus)
6. **Deploy** → Les changements prennent effet

---

## ✅ Checklist

- [ ] MONGODB_URI configurée
- [ ] NODE_ENV = production
- [ ] SESSION_SECRET changé
- [ ] CORS_ORIGIN correct
- [ ] RAILWAY_PUBLIC_DOMAIN correct
- [ ] Discord ID/SECRET/TOKEN (si Discord activé)
- [ ] ADMIN_PASSWORD changé
- [ ] Twitter account configuré (si RSS activé)
- [ ] WhatsApp numbers configurés (optionnel)

---

## 🔒 Sécurité

**⚠️ IMPORTANT:**
- ❌ Ne commitez JAMAIS ces variables dans Git
- ❌ Ne partagez JAMAIS vos tokens/secrets
- ✅ Utilisez Railroad ou un gestionnaire de secrets
- ✅ Changez les tokens par défaut
- ✅ Régénérez les secrets tous les 6 mois

---

## 📞 Support

- MongoDB Atlas: https://www.mongodb.com/cloud/atlas
- Discord Developer: https://discord.com/developers/applications
- Railway Docs: https://docs.railway.app

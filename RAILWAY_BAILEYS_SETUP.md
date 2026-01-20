# 🚀 Déploiement Railway - Guide Complet

## ✅ Checklist Déploiement

### Étape 1: Préparer les Secrets

Avant de déployer, générez ces secrets sécurisés:

```bash
# Générer SESSION_SECRET (Linux/Mac)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Ou utilisez un générateur: https://www.uuidgenerator.net/
```

### Étape 2: Configuration Railway

1. **Créer un nouveau projet** sur railway.app
2. **Connecter votre repo GitHub** ou utiliser CLI
3. **Ajouter les variables d'environnement** dans Dashboard > Environment

#### Variables Essentielles:

```env
# 🔵 Node.js
PORT=5000
NODE_ENV=production

# 🟠 Sécurité
SESSION_SECRET=<générez une clé sécurisée>

# 🟢 MongoDB (obligatoire)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/giveaways?retryWrites=true&w=majority

# 🟡 WhatsApp Baileys
WHATSAPP_ENABLED=true
WHATSAPP_PHONE_NUMBER=+212612345678  # Optionnel

# 🔵 URLs
CORS_ORIGIN=https://your-app-name.up.railway.app
RAILWAY_PUBLIC_DOMAIN=your-app-name.up.railway.app

# ⚫ Discord (optionnel)
BOT_ENABLED=false
```

### Étape 3: Déploiement

**Option A: Via GitHub**
```bash
# Push votre code sur GitHub
git push origin main
# Railway redéploiera automatiquement
```

**Option B: Via Railway CLI**
```bash
# Installer Railway CLI
npm i -g @railway/cli

# Se connecter
railway login

# Déployer
railway up

# Voir les logs
railway logs
```

### Étape 4: Configuration WhatsApp sur Railway

⚠️ **Important pour WhatsApp:**

1. Le QR code **ne s'affichera PAS** dans les logs Railway
2. **Première connexion**: Utilisez le déploiement local pour générer les credentials
3. Une fois authentifiée localement:
   ```bash
   # Les credentials sont sauvegardés dans: whatsapp_auth/
   # Commitez ce dossier dans un volume Railway
   ```

4. **Utiliser un Volume Railway** pour persister les credentials:
   - Aller dans Dashboard > Volumes
   - Créer un volume: `whatsapp_storage`
   - Monter à `/app/whatsapp_auth`

### Étape 5: Vérifier le Déploiement

```bash
# Voir les logs
railway logs

# Vérifier la santé
curl https://your-app.up.railway.app/api/health

# Voir les variables
railway env
```

## 📊 Architecture Finale

```
┌─────────────────────────────────────────┐
│          Railway Container              │
├─────────────────────────────────────────┤
│  Node.js 20 + Baileys WhatsApp Bot     │
├─────────────────────────────────────────┤
│  📦 Volumes:                            │
│  - whatsapp_auth/ (credentials)         │
│  - node_modules/ (cache)                │
├─────────────────────────────────────────┤
│  🗄️ Services:                           │
│  - MongoDB Atlas (externe)              │
│  - Discord Bot (optionnel)              │
│  - Twitter Scheduler (optionnel)        │
└─────────────────────────────────────────┘
```

## 🔒 Sécurité

✅ **À faire:**
- [ ] Changer `SESSION_SECRET` en production
- [ ] Utiliser HTTPS partout
- [ ] Activer le CORS uniquement pour votre domaine
- [ ] Utiliser des tokens Discord secrets

❌ **À éviter:**
- Ne commitez PAS les `.env` files
- Ne partagez PAS vos tokens
- Ne mettez PAS `NODE_ENV=development` en production

## 🐛 Dépannage

### Le bot ne répond pas
```bash
# Vérifier les logs
railway logs

# Vérifier les variables
railway env

# Relancer l'app
railway restart
```

### WhatsApp déconnecté
- Recréer les credentials localement
- Pousser le dossier `whatsapp_auth/` sur Railway volume

### Erreurs MongoDB
- Vérifier la connection string
- Vérifier que Railway a accès à MongoDB Atlas
- Ajouter l'IP Railway dans MongoDB whitelist

## 📞 Support

Documentation:
- Railway: https://railway.app/docs
- Baileys: https://github.com/WhiskeySockets/Baileys
- MongoDB: https://docs.mongodb.com/

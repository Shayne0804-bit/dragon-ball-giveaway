# 🚀 Guide de Déploiement sur Railway

## Étapes d'Installation

### 1️⃣ Préparer le Projet

✅ Vérifier que tous les fichiers sont en place:
- `Procfile`
- `.env.example`
- `railway.json`
- `package.json` avec script `start`

### 2️⃣ Créer un Dépôt GitHub

```bash
# Initialiser le dépôt
git init
git add .
git commit -m "Initial commit: Dragon Ball Giveaway"

# Créer un dépôt sur GitHub et ajouter l'origine
git remote add origin https://github.com/[votre-username]/dragon-ball-giveaway.git
git branch -M main
git push -u origin main
```

### 3️⃣ Configurer MongoDB Atlas

#### Option A: MongoDB Atlas (Recommandé pour Production)

1. Aller sur [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Créer un compte gratuit
3. Créer un cluster (tier gratuit M0)
4. Créer une base de données `giveaways`
5. Créer un utilisateur avec mot de passe
6. Copier la chaîne de connexion:
   ```
   mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/giveaways?retryWrites=true&w=majority
   ```

#### Option B: MongoDB Community (Local)

Si vous voulez utiliser MongoDB localement avec Railway:
1. Utiliser un conteneur MongoDB sur Railway
2. Configurer la connexion interne

### 4️⃣ Déployer sur Railway

#### Méthode 1: Via le Dashboard Railway

1. Aller sur [railway.app](https://railway.app)
2. Se connecter avec GitHub
3. Créer un "New Project"
4. Choisir "Deploy from GitHub repo"
5. Sélectionner `dragon-ball-giveaway`
6. Railway détecte automatiquement:
   - Buildpack: Node.js
   - Start command: `npm start` (du Procfile)

#### Méthode 2: Via Railway CLI

```bash
# Installer Railway CLI
npm install -g @railway/cli

# Se connecter
railway login

# Initialiser le projet
railway init

# Déployer
railway up
```

### 5️⃣ Configurer les Variables d'Environnement

Dans le Dashboard Railway:

1. Aller à "Variables"
2. Ajouter:

```env
# Serveur
PORT=5000
NODE_ENV=production

# MongoDB Atlas
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/giveaways?retryWrites=true&w=majority

# Admin
ADMIN_PASSWORD=votre_mot_de_passe_tres_secure_123

# CORS (utiliser votre domaine Railway)
CORS_ORIGIN=https://dragon-ball-giveaway-production.up.railway.app

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 6️⃣ Vérifier le Déploiement

1. Railway redéploie automatiquement
2. Vérifier les logs:
   ```
   ✅ MongoDB connecté: ...
   ✅ Serveur démarré sur http://...
   ```
3. Accéder à votre site: `https://[votre-projet]-production.up.railway.app`

## 📊 Domaine Personnalisé

Pour ajouter un domaine personnalisé:

1. Aller à "Domains" dans Railway
2. Ajouter un domaine personnalisé
3. Configurer les DNS avec votre registraire
4. Attendre la validation

## 🔄 Déploiement Continu

- Chaque push sur `main` déclenche automatiquement un redéploiement
- Les logs sont visibles en temps réel dans Railway
- Vous pouvez revenir à une version antérieure si nécessaire

## 🛠️ Troubleshooting

### ❌ "Build failed"

Vérifier que:
- `package.json` a un script `start`
- `Procfile` pointe vers le bon fichier
- Pas d'erreurs de syntaxe

### ❌ "MongoDB connection refused"

Vérifier:
- `MONGODB_URI` est correct
- L'IP de Railway est whitelistée dans MongoDB Atlas
- La base de données existe

### ❌ "CORS error on production"

Vérifier:
- `CORS_ORIGIN` correspond au domaine Railway
- Les en-têtes CORS sont corrects dans `server.js`

### ❌ "Port already in use"

Railway gère automatiquement les ports. Utiliser `process.env.PORT`.

## 📈 Monitoring

Sur Railway, vous pouvez:
- Voir les logs en temps réel
- Monitorer la consommation CPU/RAM
- Voir les erreurs et avertissements
- Gérer les redémarrages

## 💾 Sauvegardes MongoDB

Avec MongoDB Atlas gratuit:
- Sauvegarde automatique quotidienne
- Rétention de 7 jours
- Accès à l'historique de 24 heures

Pour plus de sauvegardes, considérer:
- Atlas backup (payant)
- Exports manuels

## 🔐 Sécurité en Production

✅ Points importants:

1. **Secrets**: Ne jamais partager le `.env` sur GitHub
2. **Mot de passe Admin**: Utiliser un mot de passe fort
3. **MongoDB**: Whitelist l'IP de Railway dans Atlas
4. **HTTPS**: Railway fournit HTTPS gratuitement
5. **Rate Limiting**: Activer pour éviter les abus
6. **CORS**: Restreindre à votre domaine uniquement

## 🚀 Mise à Jour du Projet

Pour ajouter des changements:

```bash
# Créer une branche
git checkout -b feature/my-feature

# Faire des changements
# ...

# Commit et push
git add .
git commit -m "Add feature: my-feature"
git push origin feature/my-feature

# Créer une Pull Request sur GitHub
# Une fois mergée sur main, Railway redéploie automatiquement
```

## 📚 Ressources

- [Railway Docs](https://docs.railway.app/)
- [Node.js Best Practices](https://nodejs.org/en/docs/guides/)
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- [Express.js](https://expressjs.com/)

---

**Prêt? 🚀 Lançons le projet en production!**

# 🚀 Déployer RSSHub sur Railway

## Prérequis
- Un compte Railway
- Git installé
- Accès au répertoire RSSHub dans ton projet

## Étapes de déploiement

### 1️⃣ Créer un nouveau service Railway pour RSSHub

```bash
# Navigue dans le répertoire RSSHub
cd RSSHub

# Initialiser un nouveau repo Git (si pas déjà fait)
git init
git add .
git commit -m "Initial RSSHub setup for Railway"

# Créer un nouveau service Railway
railway init
# Sélectionne "Python" ou "Node.js" selon les options
```

### 2️⃣ Configuration Railway

Dans le dashboard Railway:

1. **Crée un nouveau projet** ou ajoute un service au projet existant
2. **Configure les variables d'environnement:**
   ```
   NODE_ENV=production
   PORT=1200
   CACHE_TYPE=memory
   ```
3. **Ajoute Redis (optionnel mais recommandé):**
   - Ajoute un plugin Redis
   - Configure `REDIS_URL` automatiquement

### 3️⃣ Déployer

```bash
# Déploie sur Railway
railway up

# Ou pousse directement sur Railway Git
git push railway main
```

### 4️⃣ Récupérer l'URL de ton instance RSSHub

Après déploiement, tu auras une URL comme:
```
https://rsshub-production-xxxx.railway.app
```

### 5️⃣ Configurer l'URL dans ton bot

Mets à jour `.env`:
```
RSSHUB_URL=https://rsshub-production-xxxx.railway.app
```

Ou modifie `server/services/twitterService.js` pour utiliser cette URL.

## Variables d'environnement RSSHub recommandées

```
NODE_ENV=production
PORT=1200 (Railway fournit PORT automatiquement)
CACHE_TYPE=memory ou redis
REDIS_URL=redis://... (si tu ajoutes Redis)
REQUEST_TIMEOUT=10000
PUPPETEER_SKIP_DOWNLOAD=true (économise de l'espace)
```

## Monitoring

Après déploiement, teste l'instance:
```bash
curl https://rsshub-production-xxxx.railway.app/twitter/user/db_legends
```

Tu devrais avoir un flux RSS valide.

## Troubleshooting

**Erreur: "Build failed"**
- Vérife que Dockerfile existe dans RSSHub/
- Vérifie que package.json est à la racine RSSHub/

**Erreur: "Port already in use"**
- Railway fournit PORT automatiquement, pas besoin de configurer

**RSSHub très lent**
- Ajoute Redis via Railway plugins
- Configure CACHE_TYPE=redis

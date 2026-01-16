# 🔧 Troubleshooting & FAQ

Guide de dépannage complet pour le projet Giveaway.

---

## ❌ ERREURS COURANTES

### 1. npm: command not found

**Symptôme:**
```
PS D:\Giveways> npm install
npm : The term 'npm' is not recognized
```

**Cause:** Node.js n'est pas installé

**Solutions:**
- Télécharger Node.js LTS: https://nodejs.org
- Installer en cochant "Add to PATH"
- Redémarrer le terminal
- Vérifier: `npm --version`

---

### 2. Cannot connect to MongoDB

**Symptôme:**
```
❌ Erreur de connexion MongoDB
Error: connect ECONNREFUSED 127.0.0.1:27017
```

**Cause:** MongoDB n'est pas actif

**Solutions:**

**Option A: MongoDB Local**
```bash
# Windows
mongod

# macOS (avec Homebrew)
brew services start mongodb-community

# Linux
sudo systemctl start mongod
```

**Option B: Docker**
```bash
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

**Option C: MongoDB Atlas (Cloud)**
1. Créer compte: https://www.mongodb.com/cloud/atlas
2. Créer cluster gratuit
3. Copier la connexion
4. Mettre à jour `.env`:
```env
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/giveaways?retryWrites=true&w=majority
```

---

### 3. Port 5000 already in use

**Symptôme:**
```
Error: listen EADDRINUSE: address already in use :::5000
```

**Cause:** Le port 5000 est déjà utilisé

**Solutions:**

**Option 1: Utiliser un autre port**
```env
PORT=3000
```

**Option 2: Libérer le port 5000**
```bash
# Windows - Trouver ce qui utilise 5000
netstat -ano | findstr :5000

# Windows - Terminer le processus (ex: PID 1234)
taskkill /PID 1234 /F

# macOS/Linux
lsof -i :5000
kill -9 <PID>
```

---

### 4. CORS Error

**Symptôme:**
```
Access to XMLHttpRequest blocked by CORS policy
```

**Cause:** CORS non configuré correctement

**Solutions:**

Vérifier `.env`:
```env
CORS_ORIGIN=http://localhost:5000
```

Si vous accédez depuis une autre URL (ex: http://localhost:3000):
```env
CORS_ORIGIN=http://localhost:3000
```

---

### 5. Validation Error: Le nom doit contenir...

**Symptôme:**
```
Le nom doit contenir au minimum 2 caractères
Le nom ne peut contenir que des lettres, chiffres et espaces
```

**Cause:** Entrée non valide

**Règles:**
- ✅ Minimum 2 caractères
- ✅ Maximum 20 caractères
- ✅ Lettres (a-z, A-Z)
- ✅ Chiffres (0-9)
- ✅ Espaces
- ❌ Symboles spéciaux (!@#$%^&*)
- ❌ Caractères accentués (é, à, etc.)

**Exemples valides:**
- ✅ Alice
- ✅ Bob Smith
- ✅ User123
- ✅ John 42

**Exemples invalides:**
- ❌ A (trop court)
- ❌ John@Smith (symboles)
- ❌ José (accents)
- ❌ test!123 (symboles)

---

### 6. Anti-spam: Vous avez déjà participé

**Symptôme:**
```
Vous avez déjà participé. Veuillez réessayer dans 28 minutes.
```

**Cause:** Vous avez participé récemment depuis cette IP

**Solutions:**
- Attendre le délai (30 min par défaut)
- Ou changer le délai dans `.env`:
```env
ANTI_SPAM_MINUTES=5
```

**Pour réinitialiser (development):**
```bash
curl -X DELETE http://localhost:5000/api/participants/reset
```

---

### 7. npm ERR! code ERESOLVE

**Symptôme:**
```
npm ERR! code ERESOLVE
npm ERR! ERESOLVE unable to resolve dependency tree
```

**Cause:** Conflit de versions npm

**Solutions:**
```bash
# Nettoyer et réinstaller
rm -r node_modules package-lock.json
npm install

# Ou forcer l'installation
npm install --legacy-peer-deps
```

---

### 8. Cannot find module 'express'

**Symptôme:**
```
Error: Cannot find module 'express'
```

**Cause:** Les dépendances ne sont pas installées

**Solutions:**
```bash
npm install
```

Vérifier `node_modules/` existe.

---

### 9. Database error: collection name expected

**Symptôme:**
```
MongooseError: collection name expected
```

**Cause:** MongoDB n'a pas pu créer les collections

**Solutions:**
1. Vérifier que MongoDB est actif
2. Vérifier `MONGODB_URI` dans `.env`
3. Redémarrer le serveur: `npm run dev`

---

### 10. ENOTFOUND localhost

**Symptôme:**
```
Error: getaddrinfo ENOTFOUND localhost
```

**Cause:** Impossible de se connecter à localhost

**Solutions:**
```bash
# Vérifier la connexion
ping localhost

# Ou utiliser 127.0.0.1
# Dans .env:
MONGODB_URI=mongodb://127.0.0.1:27017/giveaways
```

---

## ⚠️ AVERTISSEMENTS COURANTS

### Rate Limit Dépassé

**Message:**
```
Trop de requêtes, veuillez réessayer plus tard
```

**Cause:** Vous avez envoyé trop de requêtes

**Limites:**
- Global: 100 requêtes / 15 minutes
- Par participant: 5 participations / 10 minutes

**Solution:** Attendre ou augmenter les limites dans `.env`:
```env
RATE_LIMIT_WINDOW_MS=600000
RATE_LIMIT_MAX_REQUESTS=5
```

---

### Roulette: Aucun participant

**Message:**
```
Aucun participant pour tirer un gagnant
```

**Cause:** Il n'y a pas de participants

**Solution:** Ajouter au moins 1 participant d'abord

---

## 🎯 FAQ

### Q: Pourquoi ma participation n'est pas enregistrée?

**R:** Vérifiez:
1. Le nom fait 2-20 caractères
2. Le nom ne contient que lettres/chiffres/espaces
3. Vous n'avez pas participé dans les 30 dernières minutes (IP)
4. MongoDB est connecté
5. Vérifier les erreurs dans le navigateur (F12)

---

### Q: Comment modifier le délai anti-spam?

**R:** Dans `.env`:
```env
ANTI_SPAM_MINUTES=60  # 60 minutes au lieu de 30
```

---

### Q: Puis-je participer depuis 2 appareils différents?

**R:** Oui! L'anti-spam est basé sur l'IP.
- 2 appareils sur le même WiFi = même IP = bloqué
- 2 appareils sur des réseaux différents = IPs différentes = autorisé

---

### Q: Comment réinitialiser la liste des participants?

**R:** Deux options:

**Option 1: API**
```bash
curl -X DELETE http://localhost:5000/api/participants/reset
```

**Option 2: Interface web**
- Cliquer le bouton "Réinitialiser" après avoir tiré un gagnant

---

### Q: La roulette tourne mais rien ne s'affiche

**R:** Vérifiez:
1. Il y a au moins 1 participant
2. Console du navigateur (F12) pour les erreurs
3. Le serveur est actif (npm run dev)
4. Vérifier les logs du terminal

---

### Q: Puis-je utiliser MongoDB Atlas?

**R:** Oui! 
1. Créer compte: https://www.mongodb.com/cloud/atlas
2. Créer cluster gratuit
3. Copier l'URL de connexion
4. Ajouter à `.env`:
```env
MONGODB_URI=mongodb+srv://user:pwd@cluster.mongodb.net/giveaways?retryWrites=true&w=majority
```

---

### Q: Puis-je déployer en production?

**R:** Oui! Voir SECURITY.md pour la checklist.

Services recommandés:
- **Heroku** (easy, payant après free tier)
- **Railway** (plus simple que Heroku)
- **Render** (gratuit avec limitations)
- **Replit** (idéal pour prototyper)

---

### Q: Puis-je customiser les couleurs?

**R:** Oui! Dans `client/style.css`:
```css
:root {
  --primary-color: #ff6b6b;      /* Rouge principal */
  --secondary-color: #4ecdc4;    /* Cyan secondaire */
  --success-color: #51cf66;      /* Vert succès */
}
```

---

### Q: Puis-je changer la vidéo de fond?

**R:** Oui! Dans `client/index.html`:
```html
<video id="backgroundVideo" ... >
  <source src="VOTRE_URL_VIDEO" type="video/mp4">
</video>
```

Sites pour trouver des vidéos gratuites:
- Pexels: https://www.pexels.com/videos
- Pixabay: https://pixabay.com/videos
- Unsplash: https://unsplash.com/navi/videos

---

## 🧪 VÉRIFICATIONS SYSTÈME

### Avant de démarrer:

```bash
# Vérifier Node.js
node --version
# Doit afficher v14.0.0 ou supérieur

# Vérifier npm
npm --version
# Doit afficher 6.0.0 ou supérieur

# Vérifier MongoDB (si local)
mongod --version
# Doit afficher une version

# Vérifier la connexion MongoDB
mongosh  # ou mongo
# Doit afficher le shell MongoDB
```

---

## 📊 LOGS & DEBUGGING

### Logs du serveur

```bash
npm run dev
# Voir:
# ✅ Connecté à MongoDB
# ✅ Serveur démarré sur http://localhost:5000
```

### Logs du navigateur

```
Appuyer sur F12 pour ouvrir Developer Tools
Aller à "Console" pour voir les erreurs
```

### Logs MongoDB

```bash
# Terminal séparé
mongod --logpath ./mongodb.log
```

---

## 🚀 PERFORMANCE

### Optimisations possibles:

1. **Pagination des participants** (si > 1000)
2. **Cache avec Redis** (pour réduire les requêtes DB)
3. **Compression gzip** (déjà dans Helmet)
4. **CDN pour la vidéo** (video optimisée)

---

## 🔐 SÉCURITÉ

### Avant production:

- [ ] Activer HTTPS/SSL
- [ ] Utiliser MongoDB Atlas au lieu de local
- [ ] Configurer CORS strictement
- [ ] Ajouter logging/monitoring
- [ ] Sauvegardes régulières
- [ ] Secrets manager pour `.env`

---

## 📞 BESOIN D'AIDE?

| Ressource | Lien |
|-----------|------|
| Node.js | https://nodejs.org |
| Express | https://expressjs.com |
| MongoDB | https://www.mongodb.com |
| Mongoose | https://mongoosejs.com |
| npm | https://www.npmjs.com |

---

**Dernière mise à jour**: 2024-01-16

Bon débogage! 🔧

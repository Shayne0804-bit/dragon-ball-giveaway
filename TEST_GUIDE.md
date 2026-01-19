# 🧪 Guide des Tests - Dragon Ball Giveaway

## 📋 Vue d'ensemble

Ce projet contient plusieurs fichiers de test pour valider les fonctionnalités principales:

```
test-api.js           → Test les endpoints API
test-shop.js          → Test la boutique et achats
test-discord-bot.js   → Test le bot Discord
test-avatar.js        → Test les avatars utilisateur
test-runner.js        → Lance tous les tests avec un beau formatage
```

---

## 🚀 Lancer les tests

### Option 1: Test runner complet (RECOMMANDÉ)

```bash
npm run test-runner
# ou
node test-runner.js
```

**Avantages:**
- ✅ Tous les tests en une seule commande
- ✅ Formatage coloré et lisible
- ✅ Résumé détaillé
- ✅ Timing de chaque test
- ✅ Vérification automatique que le serveur tourne

### Option 2: Test individuels

```bash
# Test l'API
node test-api.js

# Test la boutique
node test-shop.js

# Test le bot Discord
node test-discord-bot.js

# Test les avatars
node test-avatar.js
```

---

## 📊 Formats de sortie

### Test Runner
```
╔════════════════════════════════════════════════════════════════╗
║          🧪 TEST RUNNER - Dragon Ball Giveaway                ║
╚════════════════════════════════════════════════════════════════╝

ℹ️  Environnement: development
ℹ️  Serveur: http://localhost:5000
ℹ️  Tests à exécuter: 4

────────────────────────────────────────────────────────────────

▶ Vérification du serveur
✅ Serveur accessible

────────────────────────────────────────────────────────────────

▶ API Tests (test-api.js)
   Test les endpoints API principales

✅ Exécution réussie
✅ GET /api/giveaways - Status 200
✅ 5 giveaways retournés
...

────────────────────────────────────────────────────────────────

📊 RÉSUMÉ DES TESTS

ℹ️  Tests exécutés: 4
✅ Réussis: 4
❌ Échoués: 0
ℹ️  Durée: 5.23s

✅ Tous les tests sont passés! 🎉
```

---

## 🎯 Ce que testent les fichiers

### test-api.js
```javascript
// Endpoints testés:
GET  /api/giveaways          → Récupère tous les giveaways
POST /api/participants       → Ajoute un participant
GET  /api/participants/:id   → Récupère un participant
DELETE /api/participants/:id → Supprime un participant
```

**À vérifier:**
- ✅ Connexion API
- ✅ Statuts HTTP corrects (200, 400, 404, etc.)
- ✅ Format des réponses JSON
- ✅ Validation des données

### test-shop.js
```javascript
// Fonctionnalités testées:
GET  /api/shop/items      → Récupère les articles du shop
POST /api/shop/items      → Crée un article (admin)
PUT  /api/shop/items/:id  → Modifie un article
DELETE /api/shop/items/:id → Supprime un article
POST /api/shop/purchase   → Teste l'achat
```

**À vérifier:**
- ✅ Authentification admin
- ✅ CRUD des articles
- ✅ Validation des prix
- ✅ Notification d'achat

### test-discord-bot.js
```javascript
// Fonctionnalités testées:
- Initialisation du bot
- Connexion Discord
- Envoi de messages
- Événements du bot
```

**À vérifier:**
- ✅ Bot connecté à Discord
- ✅ Message test envoyé
- ✅ Événements reçus
- ✅ Pas d'erreurs de connexion

### test-avatar.js
```javascript
// Fonctionnalités testées:
- Téléchargement d'avatar
- Récupération d'avatar
- Validation de format (JPG, PNG, GIF)
- Suppression d'avatar
```

**À vérifier:**
- ✅ Fichiers acceptés
- ✅ Taille limite
- ✅ Format de réponse
- ✅ Stockage correct

---

## 🔧 Configuration des tests

### Variables d'environnement
```bash
# .env (développement)
PORT=5001
MONGODB_URI=mongodb://localhost:27017/giveaways-dev-local
ADMIN_PASSWORD=admin123

# Pour les tests
ADMIN_TOKEN=your-admin-token-here
```

### Avant de lancer les tests
```bash
# 1. Démarrer MongoDB (si local)
mongod

# 2. Démarrer le serveur
npm start
# ou (autre terminal)
cd d:\Giveways-Dev
npm start

# 3. Lancer les tests
node test-runner.js
```

---

## ✅ Checklist avant déploiement

Avant de synchroniser vers Production, vérifiez:

- [ ] `npm run test-runner` - Tous les tests passent
- [ ] Aucun warning en console
- [ ] Pas d'erreurs réseau
- [ ] API répondent correctement
- [ ] Shop fonctionne sans erreurs
- [ ] Avatar upload/download OK
- [ ] Bot connecté (si BOT_ENABLED=true)

---

## 🐛 Déboguer un test échoué

### Étape 1: Vérifier le serveur
```bash
curl http://localhost:5000/api/giveaways
# Devrait retourner un JSON valide
```

### Étape 2: Vérifier MongoDB
```bash
mongosh
> use giveaways-dev-local
> db.giveaways.find()
```

### Étape 3: Vérifier les logs du serveur
```bash
# Dans le terminal où tourne npm start
# Chercher les erreurs: ❌, ERROR, Exception
```

### Étape 4: Lancer un test spécifique
```bash
# Avec plus de détails
node test-api.js 2>&1 | grep -E "✅|❌|ERROR"
```

---

## 📈 Améliorer les tests

Pour ajouter un nouveau test:

1. Créez `test-nom.js` à la racine
2. Suivez le format des tests existants
3. Ajoutez-le à `test-runner.js`:

```javascript
const tests = [
  {
    name: 'Nouveau Test',
    file: 'test-nom.js',
    description: 'Description du test',
  },
  // ...
];
```

4. Lancez `node test-runner.js`

---

## 🎨 Légende des symboles

| Symbole | Signification |
|---------|---------------|
| ✅ | Succès |
| ❌ | Erreur |
| ⚠️  | Avertissement |
| ℹ️  | Information |
| 🧪 | Test |
| 🚀 | Lancement |
| 📊 | Statistiques |
| ▶ | Section |
| ─ | Séparateur |

---

## 📞 Support

Si un test échoue:

1. Consultez les messages d'erreur détaillés
2. Vérifiez que le serveur tourne
3. Vérifiez la configuration `.env`
4. Consultez les logs du serveur
5. Essayez `npm start` dans un nouveau terminal

**Bon testing! 🎉**

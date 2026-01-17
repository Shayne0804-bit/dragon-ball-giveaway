# 🔧 Fix pour Créer les Giveaways sur Railway

## 🐛 Problème Identifié

La création de giveaway ne fonctionne pas sur Railway mais fonctionne en local. Cause identifiée: 

**Le header `Authorization` n'était pas autorisé par CORS**, ce qui bloquait les requêtes POST avec le token Bearer admin.

## ✅ Solution Appliquée

### Modification du fichier `server/server.js`

1. **Helmet** - Ajout de configuration pour autoriser les requêtes cross-origin:
   ```javascript
   app.use(helmet({
     crossOriginResourcePolicy: { policy: 'cross-origin' },
   }));
   ```

2. **CORS** - Ajout du header `Authorization` à la liste des headers autorisés:
   ```javascript
   app.use(
     cors({
       origin: process.env.CORS_ORIGIN || 'http://localhost:5000',
       credentials: true,
       methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
       allowedHeaders: ['Content-Type', 'Authorization'],  // ← Ajout d'Authorization
     })
   );
   ```

## 🚀 Prochaines Étapes sur Railway

### 1. ✅ Commit et Push les changements

```bash
git add server/server.js
git commit -m "Fix: Ajouter Authorization header au CORS - Fix création giveaway sur Railway"
git push origin main
```

### 2. ⏳ Railway redéploiera automatiquement

Railway détecte le push et relance le déploiement. Les logs afficheront:
- `✅ MongoDB connecté: ...`
- `✅ Serveur démarré sur ...`

### 3. ✅ Vérifier la configuration des variables d'environnement

Dans le Dashboard Railway, vérifier que ces variables sont définies:

```env
# IMPORTANT: Ces 3 variables doivent être définies
MONGODB_URI=mongodb+srv://...  # Votre URI MongoDB Atlas
ADMIN_PASSWORD=votre_mot_de_passe_secret  # Votre mot de passe admin
CORS_ORIGIN=https://votre-app.up.railway.app  # Votre domaine Railway exact
```

### 4. ✅ Tester la création de giveaway

1. Aller sur votre app Railway
2. Cliquer sur "Admin Login"
3. Entrer votre mot de passe (défini dans `ADMIN_PASSWORD`)
4. Cliquer sur "Ajouter un Giveaway"
5. Remplir le formulaire et cliquer "Créer"

### 5. 🔍 Si ça ne marche toujours pas

Vérifier les logs Railway:

```bash
# Depuis Railway CLI
railway logs

# Ou dans le Dashboard Railway: Logs tab
```

Chercher les messages d'erreur contenant:
- `401 Unauthorized` → Token invalide
- `403 Forbidden` → CORS bloqué
- `500` → Erreur serveur

## 📝 Résumé des Changements

| Fichier | Changement | Impact |
|---------|-----------|--------|
| `server/server.js` | Helmet + CORS config | Authorise les requêtes POST avec token Bearer |

## ✨ Avantages de cette Fix

- ✅ Crée les giveaways avec authentification Bearer
- ✅ Compatible avec les uploads de photos
- ✅ Fonctionne en local ET sur Railway
- ✅ Pas de breaking changes


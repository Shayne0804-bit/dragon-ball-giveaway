# ✅ Checklist Avant Déploiement

## 🔍 Vérification Locale

- [ ] Serveur démarre sans erreur: `npm start`
- [ ] MongoDB est connecté
- [ ] Page d'accueil charge correctement
- [ ] Formulaire de participation fonctionne
- [ ] Roulette lance sans erreur
- [ ] Tous les effets visuels s'affichent
- [ ] Pas d'erreurs console (F12)
- [ ] Pas de logs d'erreur serveur

## 📦 Préparation du Projet

- [ ] `.gitignore` configured correctly
- [ ] `.env` NOT commité (dans .gitignore)
- [ ] `.env.example` créé et à jour
- [ ] `Procfile` existe et est correct
- [ ] `railway.json` existe et est correct
- [ ] `package.json` a un script `start`
- [ ] Tous les dépendances sont dans `package.json`
- [ ] Pas de dépendances inutilisées
- [ ] `node_modules` dans `.gitignore`

## 🐙 GitHub

- [ ] Compte GitHub créé
- [ ] Repository créé (`dragon-ball-giveaway`)
- [ ] Repository est PUBLIC
- [ ] `.gitignore` est en place
- [ ] Fichiers importants sont committed:
  - [ ] `server/`
  - [ ] `client/`
  - [ ] `package.json`
  - [ ] `Procfile`
  - [ ] `railway.json`
  - [ ] `.env.example`
  - [ ] `README.md`
- [ ] Push sur branche `main` fait
- [ ] Commits ont des messages clairs

## 🚂 Railway

- [ ] Compte Railway créé
- [ ] Compte lié à GitHub
- [ ] Nouveau projet créé
- [ ] Repository GitHub sélectionné
- [ ] Variables d'environnement ajoutées:
  - [ ] `PORT=5000`
  - [ ] `NODE_ENV=production`
  - [ ] `MONGODB_URI=...` (MongoDB Atlas)
  - [ ] `ADMIN_PASSWORD=...` (mot de passe fort)
  - [ ] `CORS_ORIGIN=...` (domaine Railway)
  - [ ] `RATE_LIMIT_WINDOW_MS=900000`
  - [ ] `RATE_LIMIT_MAX_REQUESTS=100`

## 🗄️ MongoDB Atlas

- [ ] Compte MongoDB Atlas créé
- [ ] Cluster créé (tier gratuit M0 OK)
- [ ] Base de données `giveaways` créée
- [ ] Utilisateur créé avec mot de passe
- [ ] IP de Railway whitelistée (0.0.0.0/0 OK pour dev)
- [ ] String de connexion copiée correctement
- [ ] Pas d'erreur de connexion

## 🌐 Domaine

- [ ] (Optionnel) Domaine personnalisé configuré dans Railway
- [ ] (Optionnel) DNS pointent vers Railway
- [ ] (Optionnel) Certificat SSL automatique activé

## 📋 Vérifications Finales

- [ ] Logs Railway affichent "Serveur démarré"
- [ ] Page d'accueil charge sur Railway
- [ ] API répond: `/api/participants`
- [ ] Formulaire fonctionne en production
- [ ] Aucun CORS error
- [ ] Aucune erreur MongoDB
- [ ] Page responsive sur mobile
- [ ] Tous les assets chargent

## 📈 Monitoring Post-Déploiement

- [ ] Configurer monitoring Railway
- [ ] Vérifier logs quotidiennement
- [ ] Tester les limites de rate limiting
- [ ] Vérifier la limite de 24h par IP
- [ ] Tester le tirage avec admin

## 🔄 Mise à Jour Continue

- [ ] Créer des branches pour chaque feature
- [ ] Tester localement avant push
- [ ] Faire des commits atomiques
- [ ] Écrire des messages clairs
- [ ] Utiliser GitHub Issues pour les bugs
- [ ] Documenter les changements

---

**Tous les points vérifiés? ✅ Prêt pour le lancement! 🚀**

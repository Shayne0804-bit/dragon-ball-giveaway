# 🚀 QUICKSTART - Démarrage Rapide

Bienvenue! Voici comment lancer le projet en 5 minutes.

## ⚡ Installation Rapide

### Option 1: Windows (Recommandé)
```bash
1. Double-cliquer sur: INSTALL.bat
2. Double-cliquer sur: START.bat
3. Ouvrir: http://localhost:5000
```

### Option 2: Terminal PowerShell/CMD
```bash
# Installer
npm install

# Démarrer
npm run dev
```

## 📋 Prérequis

- **Node.js**: Télécharger de https://nodejs.org (LTS recommandé)
- **MongoDB**: 
  - Option A: Installer localement depuis https://www.mongodb.com
  - Option B: Utiliser Docker: `docker run -d -p 27017:27017 mongo`
  - Option C: MongoDB Atlas (cloud): https://www.mongodb.com/cloud/atlas

## 🎯 Dépannage

### ❌ "npm: command not found"
→ Node.js n'est pas installé. Téléchargez de https://nodejs.org

### ❌ "Cannot connect to MongoDB"
→ Démarrez MongoDB:
- Windows: `mongod` (si installé)
- Docker: `docker run -d -p 27017:27017 mongo`
- Atlas: Mettre à jour `MONGODB_URI` dans `.env`

### ❌ "Port 5000 already in use"
→ Changer le port dans `.env`:
```env
PORT=3000
```

## 📝 Configuration

Fichier `.env` (déjà configuré):
```env
MONGODB_URI=mongodb://localhost:27017/giveaways
PORT=5000
NODE_ENV=development
ANTI_SPAM_MINUTES=30
```

## ✨ Fonctionnalités

- ✅ Page unique moderne
- ✅ Formulaire de participation
- ✅ Animation de roulette
- ✅ Anti-spam par IP
- ✅ Rate limiting
- ✅ Validation sécurisée

## 🌐 URLs

- **Frontend**: http://localhost:5000
- **API**: http://localhost:5000/api/participants
- **Health Check**: http://localhost:5000/api/health

## 📚 Documentation

- README.md: Guide complet
- SETUP_MONGODB.md: Configuration MongoDB
- API endpoints: Voir README.md

## 🧪 Tests

```bash
# Test l'API
node test-api.js
```

## 🆘 Besoin d'aide?

1. Consulter README.md
2. Vérifier que MongoDB fonctionne
3. Consulter les logs du terminal

---

**Happy coding! 🎁**

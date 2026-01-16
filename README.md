# 🐉 Dragon Ball Legend Giveaway

Un site de giveaway interactif avec roulette de combat, effets d'électricité et animations épiques inspirées de Dragon Ball!

![Dragon Ball](https://img.shields.io/badge/Dragon-Ball-orange?style=flat-square)
![Node.js](https://img.shields.io/badge/Node.js-v18+-green?style=flat-square)
![MongoDB](https://img.shields.io/badge/MongoDB-5.0+-green?style=flat-square)
![Express](https://img.shields.io/badge/Express-4.18+-blue?style=flat-square)
![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)

## 🎯 Fonctionnalités

### ⚡ Effets Visuels
- Effets d'électricité et particules d'énergie
- Aura d'énergie pulsante autour du header
- Animations de combat fluides
- Compteur de puissance (Power Level) dynamique
- Explosions de victoire avec confettis énergétiques

### 🎮 Gameplay
- **Roue de combat ultime** avec tous les participants
- **Attaque spéciale** pour lancer le tirage
- **Champions victorieux** affichés en temps réel
- **Historique des gagnants** avec détails

### 🔒 Sécurité
- Authentification admin avec token
- Limitation de participation par IP (1 fois / 24h)
- Rate limiting global
- Protection anti-spam
- Validation côté serveur et client

### 📱 Design Responsive
- Interface adaptée à tous les appareils
- Thème sombre avec accent Dragon Ball
- Animations fluides et optimisées

## 📋 Prérequis

- **Node.js** v18+
- **MongoDB** v5.0+
- **npm** ou **yarn**

## 🚀 Installation

### 1. Cloner le projet
```bash
git clone <repo>
cd giveaways
```

### 2. Installer les dépendances
```bash
npm install
```

### 3. Configurer les variables d'environnement
Créer un fichier `.env` à la racine du projet:

```env
# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/giveaways

# Server Configuration
PORT=5000
NODE_ENV=development

# Security
RATE_LIMIT_WINDOW_MS=600000
RATE_LIMIT_MAX_REQUESTS=5
ANTI_SPAM_MINUTES=30

# CORS
CORS_ORIGIN=http://localhost:5000
```

### 4. Démarrer MongoDB
```bash
# Windows
mongod

# ou utiliser MongoDB Atlas (cloud)
```

### 5. Démarrer le serveur
```bash
# Mode développement (avec nodemon)
npm run dev

# Mode production
npm start
```

Le serveur sera accessible à: `http://localhost:5000`

## 📡 API REST

### Endpoints

#### POST `/api/participants`
Ajouter un participant
```bash
curl -X POST http://localhost:5000/api/participants \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe"}'
```

**Réponse:**
```json
{
  "success": true,
  "message": "Participation enregistrée avec succès!",
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe"
  }
}
```

#### GET `/api/participants`
Récupérer tous les participants
```bash
curl http://localhost:5000/api/participants
```

**Réponse:**
```json
{
  "success": true,
  "count": 5,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "createdAt": "2024-01-16T10:30:00.000Z"
    }
  ]
}
```

#### POST `/api/participants/roulette`
Tirer un gagnant aléatoire
```bash
curl -X POST http://localhost:5000/api/participants/roulette \
  -H "Content-Type: application/json"
```

**Réponse:**
```json
{
  "success": true,
  "message": "Gagnant tiré au sort!",
  "data": {
    "name": "John Doe",
    "totalParticipants": 5
  }
}
```

#### GET `/api/participants/winners`
Récupérer l'historique des gagnants
```bash
curl http://localhost:5000/api/participants/winners
```

#### DELETE `/api/participants/reset`
Réinitialiser la liste des participants
```bash
curl -X DELETE http://localhost:5000/api/participants/reset
```

## 🗂️ Structure du Projet

```
d:\Giveways\
├── client/
│   ├── index.html          # Page principale
│   ├── style.css           # Styles
│   └── app.js              # Logique frontend
├── server/
│   ├── models/
│   │   ├── Participant.js  # Schéma Mongoose
│   │   └── Winner.js       # Schéma gagnants
│   ├── routes/
│   │   └── participants.js # Routes API
│   ├── controllers/
│   │   └── participantController.js  # Logique métier
│   ├── middlewares/
│   │   ├── rateLimiter.js     # Rate limiting
│   │   ├── validation.js      # Validation
│   │   └── antiSpam.js        # Anti-spam
│   └── server.js           # Application principale
├── .env                    # Variables d'environnement
├── package.json            # Dépendances
└── README.md               # Cette documentation
```

## 🔐 Validation des Données

### Nom du Participant
- ✅ Minimum 2 caractères
- ✅ Maximum 20 caractères
- ✅ Caractères autorisés: lettres, chiffres, espaces
- ✅ Trim automatique
- ✅ Protection XSS

### Anti-spam par IP
- ✅ 1 participation par IP toutes les 30 minutes (configurable)
- ✅ Vérification avant l'enregistrement
- ✅ Message d'erreur avec temps d'attente restant

### Rate Limiting
- ✅ 100 requêtes par 15 minutes (global)
- ✅ 5 participations par 10 minutes par IP
- ✅ Headers informatifs (RateLimit-*)

## 📊 Base de Données

### Collection: participants
```javascript
{
  _id: ObjectId,
  name: String,          // Nom du participant
  ip: String,            // IP pour anti-spam
  createdAt: Date,       // Timestamp
  updatedAt: Date        // Timestamp
}
```

### Collection: winners
```javascript
{
  _id: ObjectId,
  name: String,          // Nom du gagnant
  date: Date,            // Date du tirage
  createdAt: Date,       // Timestamp
  updatedAt: Date        // Timestamp
}
```

## 🎨 Personnalisation

### Changer la vidéo de fond
Modifier l'URL dans `client/index.html`:
```html
<video id="backgroundVideo" ...>
  <source src="VOTRE_URL_VIDEO" type="video/mp4">
</video>
```

### Configurer le délai anti-spam
Dans `.env`:
```env
ANTI_SPAM_MINUTES=30  # Minutes avant prochain tirage
```

### Ajouter plus de couleurs à la roulette
Modifier `client/app.js` dans la fonction `drawWheel()`:
```javascript
const colors = [
  '#ff6b6b', '#4ecdc4', '#51cf66', '#ffd93d', // Ajouter plus ici
  // ...
];
```

## 🧪 Tests

### Tester l'API avec curl
```bash
# Ajouter un participant
curl -X POST http://localhost:5000/api/participants \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User"}'

# Récupérer les participants
curl http://localhost:5000/api/participants

# Tirer un gagnant
curl -X POST http://localhost:5000/api/participants/roulette

# Voir les gagnants
curl http://localhost:5000/api/participants/winners

# Réinitialiser
curl -X DELETE http://localhost:5000/api/participants/reset
```

### Tester le frontend
1. Ouvrir `http://localhost:5000` dans un navigateur
2. Entrer un nom
3. Cliquer sur "Participer au Giveaway"
4. Cliquer sur "Lancer la Roulette"

## 📝 Variables d'Environnement

| Variable | Défaut | Description |
|----------|--------|-------------|
| `MONGODB_URI` | `mongodb://localhost:27017/giveaways` | Connexion MongoDB |
| `PORT` | `5000` | Port du serveur |
| `NODE_ENV` | `development` | Environnement |
| `RATE_LIMIT_WINDOW_MS` | `600000` | Fenêtre de rate limiting (ms) |
| `RATE_LIMIT_MAX_REQUESTS` | `5` | Requêtes max par fenêtre |
| `ANTI_SPAM_MINUTES` | `30` | Délai anti-spam (min) |
| `CORS_ORIGIN` | `http://localhost:5000` | Origine CORS |

## 🚀 Déploiement

### Déployer sur Heroku
```bash
# Installer Heroku CLI
# https://devcenter.heroku.com/articles/heroku-cli

# Login
heroku login

# Créer l'app
heroku create giveaway-app

# Ajouter MongoDB Atlas
heroku addons:create mongolab:sandbox

# Deployer
git push heroku main
```

### Déployer sur Vercel/Railway
Voir la documentation respective.

## 📚 Dépendances Principales

- **express**: Framework web
- **mongoose**: ODM MongoDB
- **helmet**: Sécurité headers
- **express-rate-limit**: Rate limiting
- **cors**: CORS middleware
- **dotenv**: Variables d'environnement
- **validator**: Validation et sanitization

## 🐛 Troubleshooting

### Erreur: "Cannot connect to MongoDB"
- Vérifier que MongoDB est démarré
- Vérifier `MONGODB_URI` dans `.env`
- Vérifier les credentials si MongoDB Atlas

### Erreur: "Rate limit exceeded"
- Attendre le délai configuré
- Vérifier `RATE_LIMIT_WINDOW_MS` dans `.env`

### CORS Error
- Vérifier `CORS_ORIGIN` dans `.env`
- Assurez-vous que le port est correct

## 📄 Licence

MIT

## 👨‍💻 Auteur

Créé avec ❤️ pour les giveaways en ligne

---

**Questions ou problèmes?** Consultez la documentation ou ouvrez une issue!

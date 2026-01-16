# 🔐 Documentation Sécurité

Ce document décrit les mesures de sécurité implémentées dans l'application Giveaway.

## 🛡️ Mesures de Sécurité Implémentées

### 1. **Helmet.js**
Protection contre les vulnérabilités courantes via les headers HTTP:
- `Content-Security-Policy` (CSP)
- `X-Frame-Options` (Clickjacking)
- `X-Content-Type-Options` (MIME sniffing)
- `Strict-Transport-Security` (HSTS)
- `X-XSS-Protection`

```javascript
app.use(helmet());
```

### 2. **CORS (Cross-Origin Resource Sharing)**
Restreint les requêtes à l'origine configurée:
```env
CORS_ORIGIN=http://localhost:5000
```

### 3. **Rate Limiting**

#### Global (express-rate-limit)
- **Limite**: 100 requêtes par 15 minutes
- **S'applique à**: Toutes les routes

#### Par Endpoint
- **POST /api/participants**: 5 requêtes par 10 minutes par IP
- **Identifiant**: Adresse IP du client

```javascript
const participantLimiter = rateLimit({
  windowMs: 600000, // 10 minutes
  max: 5,           // 5 requêtes
  keyGenerator: (req) => req.clientIp,
});
```

### 4. **Anti-Spam par IP**

Empêche la participation multiple par la même IP:
```env
ANTI_SPAM_MINUTES=30  # Délai entre deux participations
```

**Implémentation**:
- Stockage de l'IP dans la base de données
- Vérification du délai avant d'accepter une participation
- Message d'erreur avec temps restant

### 5. **Validation des Données**

#### Frontend (user-friendly)
```javascript
function validateName(name) {
  if (!name.trim()) return false;
  if (name.length < 2 || name.length > 20) return false;
  if (!/^[a-zA-Z0-9\s]+$/.test(name)) return false;
  return true;
}
```

#### Backend (stricte - OBLIGATOIRE)
```javascript
const participantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Le nom est requis'],
    minlength: [2, 'Min 2 caractères'],
    maxlength: [20, 'Max 20 caractères'],
    match: [/^[a-zA-Z0-9\s]+$/, 'Caractères invalides'],
  },
  ip: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});
```

### 6. **Protection XSS (Cross-Site Scripting)**

Utilisation de `validator.js` pour l'échappement:
```javascript
const validator = require('validator');
req.body.name = validator.escape(trimmedName);
```

Convertit:
- `<script>` → `&lt;script&gt;`
- `"` → `&quot;`
- `'` → `&#x27;`

### 7. **Protection MongoDB Injection**

Mongoose valide automatiquement les types:
```javascript
// Les paramètres sont typés (String, pas exec())
const participant = await Participant.findOne({ ip: req.clientIp });

// Les opérateurs MongoDB sont rejetés si mal formés
```

Exemple sécurisé:
```javascript
// ✅ Sûr
await Participant.findOne({ ip: "192.168.1.1" });

// ❌ Non sûr (rejeté par Mongoose)
await Participant.findOne({ ip: { $ne: "" } });
```

### 8. **Détection de l'Adresse IP Réelle**

Gère les proxies et load balancers:
```javascript
req.clientIp =
  req.headers['x-forwarded-for']?.split(',')[0].trim() ||
  req.headers['x-real-ip'] ||
  req.connection.remoteAddress ||
  req.socket.remoteAddress ||
  req.ip;
```

**Priorité**:
1. `X-Forwarded-For` (proxy/load balancer)
2. `X-Real-IP` (Nginx)
3. `connection.remoteAddress`
4. `socket.remoteAddress`
5. IP directe

### 9. **Limitation de la Taille des Requêtes**

Prévient les attaques par déni de service (DoS):
```javascript
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ limit: '10kb' }));
```

### 10. **HTTPS (en production)**

À implémenter en production:
```javascript
const https = require('https');
const fs = require('fs');

const options = {
  key: fs.readFileSync('path/to/key.pem'),
  cert: fs.readFileSync('path/to/cert.pem'),
};

https.createServer(options, app).listen(443);
```

## 📊 Flux de Sécurité pour une Participation

```
1. Requête POST /api/participants
   ↓
2. Vérification CORS
   ↓
3. Extraction IP
   ↓
4. Rate limiting global (100/15min)
   ↓
5. Rate limiting participant (5/10min)
   ↓
6. Validation du nom (frontend vs backend)
   ↓
7. Protection XSS (sanitization)
   ↓
8. Vérification anti-spam (par IP, délai)
   ↓
9. Validation Mongoose (type, longueur, regex)
   ↓
10. Sauvegarde en base (MongoDB)
    ↓
11. Réponse sécurisée
```

## ⚙️ Configuration de Sécurité

### Variables d'Environnement

```env
# Rate limiting
RATE_LIMIT_WINDOW_MS=600000         # Fenêtre (ms)
RATE_LIMIT_MAX_REQUESTS=5           # Requêtes max

# Anti-spam
ANTI_SPAM_MINUTES=30                # Délai (minutes)

# CORS
CORS_ORIGIN=http://localhost:5000   # Origine autorisée

# Environnement
NODE_ENV=production                 # production/development

# Base de données
MONGODB_URI=mongodb://...           # URI sécurisée
```

## 🚨 Vulnérabilités Connues & Mitigations

### 1. Brute Force (Guessing Participants)
- **Mitigation**: Rate limiting + anti-spam par IP
- **Bonus**: IPs loggées en base (potentiel blocage futur)

### 2. CSRF (Cross-Site Request Forgery)
- **Mitigation**: CORS + Helmet
- **Bonus**: Pas d'authentification = pas de cookies sensibles

### 3. Injection NoSQL
- **Mitigation**: Mongoose schema validation + types stricts

### 4. XSS via Noms
- **Mitigation**: Validator.js escape + CSP header

### 5. DoS (Déni de Service)
- **Mitigation**: Rate limiting + limite de taille

## 📝 Checklist Sécurité Production

- [ ] Utiliser HTTPS/TLS
- [ ] Activer HSTS
- [ ] Configurer CORS strictement
- [ ] Utiliser MongoDB Atlas avec authentification
- [ ] Activer les logs de sécurité
- [ ] Mettre à jour les dépendances: `npm audit fix`
- [ ] Ajouter Content-Security-Policy personnalisée
- [ ] Activer l'authentification DB
- [ ] Sauvegardes régulières
- [ ] Monitoring en temps réel

## 🔍 Audit de Sécurité

Vérifier les vulnérabilités:
```bash
npm audit
npm audit fix
```

Vérifier les dépendances outdated:
```bash
npm outdated
```

## 📞 Rapporter une Vulnérabilité

Ne pas publier les vulnérabilités publiquement. Contacter les mainteneurs directement.

---

**Dernière mise à jour**: 2024-01-16

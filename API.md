# 📡 Documentation API REST

## Base URL
```
http://localhost:5000/api
```

## 🔐 Authentification
Aucune authentification requise. L'API est publique.

---

## 👥 Endpoints Participants

### GET `/participants`
Récupérer tous les participants

**Request:**
```http
GET /api/participants HTTP/1.1
Host: localhost:5000
```

**Response (200):**
```json
{
  "success": true,
  "count": 3,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "Alice",
      "createdAt": "2024-01-16T10:30:00.000Z"
    },
    {
      "_id": "507f1f77bcf86cd799439012",
      "name": "Bob",
      "createdAt": "2024-01-16T10:31:00.000Z"
    },
    {
      "_id": "507f1f77bcf86cd799439013",
      "name": "Charlie",
      "createdAt": "2024-01-16T10:32:00.000Z"
    }
  ]
}
```

---

### POST `/participants`
Ajouter un participant

**Limites:**
- Rate limit: 5 requêtes par 10 minutes par IP
- Anti-spam: 1 participation par IP toutes les 30 minutes
- Rate limit global: 100 requêtes par 15 minutes

**Request:**
```http
POST /api/participants HTTP/1.1
Host: localhost:5000
Content-Type: application/json

{
  "name": "Alice"
}
```

**Parameters:**
| Param | Type | Required | Rules |
|-------|------|----------|-------|
| `name` | string | ✅ | Min: 2, Max: 20, Pattern: `[a-zA-Z0-9\s]+` |

**Response (201):**
```json
{
  "success": true,
  "message": "Participation enregistrée avec succès!",
  "data": {
    "id": "507f1f77bcf86cd799439011",
    "name": "Alice"
  }
}
```

**Response (400) - Erreur Validation:**
```json
{
  "success": false,
  "message": "Le nom doit contenir au minimum 2 caractères"
}
```

**Response (429) - Anti-spam:**
```json
{
  "success": false,
  "message": "Vous avez déjà participé. Veuillez réessayer dans 28 minutes."
}
```

**Response (429) - Rate Limit:**
```json
{
  "success": false,
  "message": "Trop de requêtes, veuillez réessayer plus tard"
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:5000/api/participants \
  -H "Content-Type: application/json" \
  -d '{"name":"Alice"}'
```

**JavaScript Example:**
```javascript
const response = await fetch('/api/participants', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'Alice' })
});
const data = await response.json();
```

---

## 🎡 Endpoints Roulette

### POST `/participants/roulette`
Tirer un gagnant aléatoire

**Request:**
```http
POST /api/participants/roulette HTTP/1.1
Host: localhost:5000
Content-Type: application/json
```

**Response (200):**
```json
{
  "success": true,
  "message": "Gagnant tiré au sort!",
  "data": {
    "name": "Alice",
    "totalParticipants": 3
  }
}
```

**Response (400) - Aucun participant:**
```json
{
  "success": false,
  "message": "Aucun participant pour tirer un gagnant"
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:5000/api/participants/roulette \
  -H "Content-Type: application/json"
```

**JavaScript Example:**
```javascript
const response = await fetch('/api/participants/roulette', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' }
});
const data = await response.json();
console.log(data.data.name); // "Alice"
```

---

## 🏆 Endpoints Gagnants

### GET `/participants/winners`
Récupérer l'historique des gagnants (10 derniers)

**Request:**
```http
GET /api/participants/winners HTTP/1.1
Host: localhost:5000
```

**Response (200):**
```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "_id": "507f1f77bcf86cd799439020",
      "name": "Alice",
      "date": "2024-01-16T14:30:00.000Z"
    },
    {
      "_id": "507f1f77bcf86cd799439021",
      "name": "Bob",
      "date": "2024-01-16T14:25:00.000Z"
    }
  ]
}
```

**cURL Example:**
```bash
curl http://localhost:5000/api/participants/winners
```

**JavaScript Example:**
```javascript
const response = await fetch('/api/participants/winners');
const data = await response.json();
data.data.forEach(winner => {
  console.log(`${winner.name} - ${winner.date}`);
});
```

---

## 🔧 Endpoints Administration

### DELETE `/participants/reset`
Réinitialiser la liste des participants

**⚠️ ATTENTION**: Cette opération est irréversible!

**Request:**
```http
DELETE /api/participants/reset HTTP/1.1
Host: localhost:5000
```

**Response (200):**
```json
{
  "success": true,
  "message": "Liste des participants réinitialisée"
}
```

**cURL Example:**
```bash
curl -X DELETE http://localhost:5000/api/participants/reset
```

**JavaScript Example:**
```javascript
const response = await fetch('/api/participants/reset', {
  method: 'DELETE'
});
const data = await response.json();
```

---

## 🏥 Endpoints Santé

### GET `/health`
Vérifier l'état du serveur

**Request:**
```http
GET /api/health HTTP/1.1
Host: localhost:5000
```

**Response (200):**
```json
{
  "success": true,
  "message": "Serveur opérationnel",
  "timestamp": "2024-01-16T15:30:00.000Z",
  "environment": "development"
}
```

---

## 📊 Status Codes

| Code | Description |
|------|-------------|
| `200` | Succès - GET réussi |
| `201` | Créé - POST réussi |
| `400` | Erreur validation |
| `404` | Non trouvé |
| `429` | Trop de requêtes (Rate limit/Anti-spam) |
| `500` | Erreur serveur |

---

## 📋 Formats de Réponse

### Succès
```json
{
  "success": true,
  "message": "Description de l'action",
  "data": { /* Données */ }
}
```

### Erreur
```json
{
  "success": false,
  "message": "Description de l'erreur"
}
```

---

## 🔄 Exemples Complets

### Scénario 1: Participation et Tirage

```bash
#!/bin/bash

# 1. Ajouter un participant
curl -X POST http://localhost:5000/api/participants \
  -H "Content-Type: application/json" \
  -d '{"name":"Alice"}'

# 2. Ajouter d'autres participants
curl -X POST http://localhost:5000/api/participants \
  -H "Content-Type: application/json" \
  -d '{"name":"Bob"}'

# 3. Récupérer tous les participants
curl http://localhost:5000/api/participants

# 4. Tirer un gagnant
curl -X POST http://localhost:5000/api/participants/roulette \
  -H "Content-Type: application/json"

# 5. Voir les gagnants
curl http://localhost:5000/api/participants/winners

# 6. Réinitialiser pour une nouvelle session
curl -X DELETE http://localhost:5000/api/participants/reset
```

### Scénario 2: Gestion des Erreurs

```javascript
async function addParticipant(name) {
  try {
    const response = await fetch('/api/participants', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    });

    const data = await response.json();

    if (response.status === 201) {
      console.log('✅ Participation réussie:', data.data);
    } else if (response.status === 429) {
      console.warn('⏳ Trop rapide:', data.message);
    } else if (response.status === 400) {
      console.error('❌ Erreur validation:', data.message);
    }
  } catch (error) {
    console.error('Erreur réseau:', error);
  }
}
```

---

## 🛠️ Outils Recommandés

- **Postman**: GUI pour tester les APIs
- **Insomnia**: Client REST alternatif
- **curl**: Ligne de commande
- **VS Code REST Client**: Extension VS Code

---

## 📝 Notes

- Pas d'authentification requise
- Délai anti-spam par défaut: 30 minutes
- Rate limit global: 100 requêtes/15min
- Rate limit participant: 5 requêtes/10min
- Toutes les heures sont en UTC

---

**Dernière mise à jour**: 2024-01-16

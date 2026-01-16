# Configuration pour développement local

## Démarrer MongoDB en local

### Windows (si MongoDB est installé)
```powershell
# Ouvrir PowerShell et exécuter:
mongod
```

### Windows (avec Docker)
```powershell
# Installer Docker Desktop d'abord

# Démarrer MongoDB dans Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest

# Arrêter MongoDB
docker stop mongodb

# Redémarrer MongoDB
docker start mongodb

# Supprimer le conteneur
docker rm mongodb
```

### macOS
```bash
# Avec Homebrew
brew services start mongodb-community

# Arrêter
brew services stop mongodb-community
```

### Linux
```bash
# Ubuntu/Debian
sudo systemctl start mongod

# Arrêter
sudo systemctl stop mongod
```

## Utiliser MongoDB Atlas (Cloud)

1. Aller sur https://www.mongodb.com/cloud/atlas
2. Créer un compte gratuit
3. Créer un cluster gratuit
4. Obtenir la chaîne de connexion
5. Remplacer `MONGODB_URI` dans `.env`:

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/giveaways?retryWrites=true&w=majority
```

## Vérifier la connexion

Ouvrir MongoDB Compass:
- Connection String: `mongodb://localhost:27017`
- Voir les collections: `giveaways` -> `participants`, `winners`

## Reset de la base de données

```bash
# Via API
curl -X DELETE http://localhost:5000/api/participants/reset
```

Ou via MongoDB Compass:
1. Sélectionner la base `giveaways`
2. Supprimer les collections `participants` et `winners`

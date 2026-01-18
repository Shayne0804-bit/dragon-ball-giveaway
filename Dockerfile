FROM node:20-alpine

# Définir le répertoire de travail
WORKDIR /app

# Copier les fichiers de configuration
COPY package*.json ./

# Installer les dépendances
RUN npm install --production

# Copier le code source
COPY . .

# Exposer le port
EXPOSE 5000

# Commande de démarrage
CMD ["npm", "start"]

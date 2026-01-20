FROM node:20-alpine

# Définir le répertoire de travail
WORKDIR /app

# Installer les dépendances système pour Puppeteer (utilisé par whatsapp-web.js)
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-dejavu \
    font-noto

# Copier les fichiers de configuration
COPY package*.json ./

# Installer les dépendances
RUN npm install --production

# Copier le code source
COPY . .

# Créer le répertoire de session WhatsApp pour la persistance
RUN mkdir -p /app/whatsapp_session

# Exposer le port
EXPOSE 5000

# Variables d'environnement
ENV NODE_ENV=production
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=false

FROM node:20-alpine

# Définir le répertoire de travail
WORKDIR /app

# Installer les dépendances système minimales (inclure git pour npm)
RUN apk add --no-cache \
    ca-certificates \
    curl \
    git \
    python3 \
    make \
    g++

# Copier les fichiers de configuration
COPY package*.json ./

# Installer les dépendances
RUN npm install --omit=dev

# Copier le code source
COPY . .

# Créer le répertoire d'authentification WhatsApp pour la persistance
RUN mkdir -p /app/whatsapp_auth

# Exposer le port
EXPOSE 5000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:5000/api/health || exit 1

# Variables d'environnement
ENV NODE_ENV=production
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=false

CMD ["npm", "start"]

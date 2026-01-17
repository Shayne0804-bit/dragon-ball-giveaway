require('dotenv').config();
const express = require('express');
const fileUpload = require('express-fileupload');
const helmet = require('helmet');
const cors = require('cors');
const path = require('path');

// Importer les middlewares
const { globalLimiter, getClientIp } = require('./middlewares/rateLimiter');

// Importer les routes
const participantRoutes = require('./routes/participants');
const giveawayRoutes = require('./routes/giveaway');
const giveawaysRoutes = require('./routes/giveaways');

// Importer la configuration
const { connectDB } = require('./config/database');

const app = express();
const PORT = process.env.PORT || 5000;

// ===========================
// MIDDLEWARES GLOBAUX
// ===========================

// Sécurité - Helmet
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// CORS
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5000',
    credentials: true,
    methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// File upload
app.use(fileUpload({
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB max
}));

// Body parser
app.use(express.json({ limit: '50mb' })); // Augmenter la limite pour les images base64
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Extraire l'IP du client
app.use(getClientIp);

// Rate limiting global
app.use(globalLimiter);

// Servir les fichiers statiques du client
app.use(express.static(path.join(__dirname, '../client')));

// ===========================
// ROUTES API
// ===========================

app.use('/api/participants', participantRoutes);
app.use('/api/giveaway', giveawayRoutes);
app.use('/api/giveaways', giveawaysRoutes);

// Route de test
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Serveur opérationnel',
    timestamp: new Date(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// Page d'accueil
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/index.html'));
});

// Gestion des routes non trouvées
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route non trouvée',
  });
});

// Gestion des erreurs globales
app.use((err, req, res, next) => {
  console.error('Erreur:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Erreur serveur',
  });
});

// ===========================
// CONNEXION MONGODB ET DÉMARRAGE
// ===========================

const startServer = async () => {
  try {
    // Connecter à MongoDB
    await connectDB();

    // Démarrer le serveur
    app.listen(PORT, () => {
      console.log(`✅ Serveur démarré sur http://localhost:${PORT}`);
      console.log(`📝 Environnement: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🌐 CORS Origin: ${process.env.CORS_ORIGIN || 'http://localhost:5000'}`);
    });
  } catch (error) {
    console.error('❌ Erreur au démarrage:', error.message);
    process.exit(1);
  }
};

// Gérer les signaux d'arrêt
process.on('SIGINT', () => {
  console.log('\n🛑 Arrêt du serveur...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Arrêt du serveur...');
  process.exit(0);
});

startServer();

module.exports = app;

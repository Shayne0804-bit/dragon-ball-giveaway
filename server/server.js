require('dotenv').config();
const express = require('express');
const fileUpload = require('express-fileupload');
const helmet = require('helmet');
const cors = require('cors');
const path = require('path');
const session = require('express-session');
const MongoStore = require('connect-mongo').default;

// Importer les middlewares
const { globalLimiter, getClientIp } = require('./middlewares/rateLimiter');

// Importer Passport
const passport = require('./config/passport');

// Importer les routes
const participationRoutes = require('./routes/participation');
const giveawayRoutes = require('./routes/giveaway');
const giveawaysRoutes = require('./routes/giveaways');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');

// Importer la configuration
const { connectDB } = require('./config/database');

// Importer le service Discord
const discordBot = require('./services/discordBot');

const app = express();
const PORT = process.env.PORT || 5000;

// Faire confiance au proxy (important pour Railway et HTTPS)
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// ===========================
// MIDDLEWARES GLOBAUX
// ===========================

// Sécurité - Helmet avec CSP pour autoriser les images Discord
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", 'https:', 'http:', 'data:'],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      fontSrc: ["'self'", 'data:'],
    },
  },
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

// ===========================
// SESSION ET AUTHENTIFICATION
// ===========================

// Configurer express-session avec MongoDB
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'default_secret_change_this',
    resave: false,
    saveUninitialized: false,
    store: new MongoStore({
      mongoUrl: process.env.MONGODB_URI || 'mongodb://localhost:27017/giveaways-local',
      collection: 'sessions',
      ttl: 24 * 60 * 60, // 24h
    }),
    cookie: {
      secure: process.env.NODE_ENV === 'production' ? true : false,
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24h
      sameSite: 'lax', // Permet les redirects de Discord
      domain: undefined, // Laisser le navigateur décider
    },
  })
);

// Initialiser Passport
app.use(passport.initialize());
app.use(passport.session());

// Extraire l'IP du client
app.use(getClientIp);

// Rate limiting global
app.use(globalLimiter);

// Servir les fichiers statiques du client
app.use(express.static(path.join(__dirname, '../client')));

// ===========================
// ROUTES API
// ===========================

app.use('/api/auth', authRoutes);
app.use('/api/participations', participationRoutes);
app.use('/api/giveaway', giveawayRoutes);
app.use('/api/giveaways', giveawaysRoutes);
app.use('/api/admin', adminRoutes);

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

    // Initialiser le bot Discord
    const discordReady = await discordBot.initialize();
    if (discordReady) {
      console.log('✅ Bot Discord connecté et prêt à envoyer des notifications');
    } else {
      console.warn('⚠️  Bot Discord non initialisé - vérifiez la configuration');
    }

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
  discordBot.shutdown();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Arrêt du serveur...');
  discordBot.shutdown();
  process.exit(0);
});

startServer();

module.exports = app;

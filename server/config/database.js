const mongoose = require('mongoose');

/**
 * Configuration et connexion MongoDB
 */

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/giveaways';

    const conn = await mongoose.connect(mongoUri, {
      // Options pour la production
      retryWrites: true,
      w: 'majority',
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    console.log(`✅ MongoDB connecté: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`❌ Erreur MongoDB: ${error.message}`);
    process.exit(1);
  }
};

/**
 * Déconnecter MongoDB
 */
const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    console.log('✅ MongoDB déconnecté');
  } catch (error) {
    console.error(`❌ Erreur lors de la déconnexion: ${error.message}`);
  }
};

module.exports = {
  connectDB,
  disconnectDB,
};

/**
 * Configuration des environnements
 * Utiliser: config[process.env.NODE_ENV]
 */

module.exports = {
  development: {
    port: process.env.PORT || 5000,
    mongodb_uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/giveaways',
    admin_password: process.env.ADMIN_PASSWORD || 'admin123',
    cors_origin: process.env.CORS_ORIGIN || 'http://localhost:5000',
    rate_limit_window: 15 * 60 * 1000, // 15 minutes
    rate_limit_max: 100,
    node_env: 'development',
    debug: true,
  },
  production: {
    port: process.env.PORT || 5000,
    mongodb_uri: process.env.MONGODB_URI,
    admin_password: process.env.ADMIN_PASSWORD,
    cors_origin: process.env.CORS_ORIGIN,
    rate_limit_window: 15 * 60 * 1000, // 15 minutes
    rate_limit_max: 100,
    node_env: 'production',
    debug: false,
  },
  test: {
    port: 5001,
    mongodb_uri: 'mongodb://localhost:27017/giveaways-test',
    admin_password: 'test-password',
    cors_origin: 'http://localhost:5001',
    rate_limit_window: 60 * 1000, // 1 minute (pour les tests)
    rate_limit_max: 1000,
    node_env: 'test',
    debug: true,
  },
};

/**
 * Obtenir la configuration actuelle
 */
function getConfig() {
  const env = process.env.NODE_ENV || 'development';
  const config = module.exports[env];

  if (!config) {
    throw new Error(`Unknown environment: ${env}`);
  }

  // Vérifier les variables requises en production
  if (env === 'production') {
    const required = ['mongodb_uri', 'admin_password', 'cors_origin'];
    for (const key of required) {
      if (!config[key]) {
        throw new Error(`Missing required config in production: ${key}`);
      }
    }
  }

  return config;
}

module.exports.getConfig = getConfig;

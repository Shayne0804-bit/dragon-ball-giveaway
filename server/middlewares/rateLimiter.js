const rateLimit = require('express-rate-limit');

/**
 * Middleware de rate limiting global
 * Limitation: 5 requêtes par 10 minutes par IP
 */
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requêtes
  message: 'Trop de requêtes, veuillez réessayer plus tard',
  standardHeaders: true, // Retourner l'info dans RateLimit-* headers
  legacyHeaders: false, // Désactiver X-RateLimit-* headers
  skip: (req) => process.env.NODE_ENV === 'test',
});

/**
 * Middleware de rate limiting pour les participants
 * Limitation: 5 participations par 10 minutes par IP
 */
const participantLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 600000, // 10 min par défaut
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 5,
  message: 'Trop de tentatives de participation, veuillez réessayer plus tard',
  keyGenerator: (req) => req.clientIp || req.ip,
  skip: (req) => process.env.NODE_ENV === 'test',
});

/**
 * Middleware pour extraire l'IP réelle du client
 * (gérer les proxies, load balancers, etc.)
 */
const getClientIp = (req, res, next) => {
  req.clientIp =
    req.headers['x-forwarded-for']?.split(',')[0].trim() ||
    req.headers['x-real-ip'] ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    req.ip;

  next();
};

module.exports = {
  globalLimiter,
  participantLimiter,
  getClientIp,
};

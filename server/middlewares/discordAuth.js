/**
 * Middleware de vérification d'authentification Discord
 * Vérifie que l'utilisateur est connecté via Discord avant de participer
 */

const verifyDiscordAuth = (req, res, next) => {
  // Vérifier que l'utilisateur est authentifié
  if (!req.isAuthenticated()) {
    return res.status(401).json({
      success: false,
      message: 'Vous devez être connecté avec Discord pour participer',
      error: 'NOT_AUTHENTICATED',
    });
  }

  // Vérifier que l'utilisateur a un discordId
  if (!req.user || !req.user.discordId) {
    return res.status(401).json({
      success: false,
      message: 'Authentification Discord invalide',
      error: 'INVALID_DISCORD_AUTH',
    });
  }

  // Vérifier que l'utilisateur est bien authentifié par Discord
  if (!req.user.isDiscordAuthenticated) {
    return res.status(401).json({
      success: false,
      message: 'Authentification Discord requise',
      error: 'DISCORD_AUTH_REQUIRED',
    });
  }

  // Tout est bon, passer au contrôleur suivant
  next();
};

/**
 * Middleware optionnel : récupérer l'utilisateur s'il est connecté
 * (ne rejette pas la requête s'il n'est pas connecté)
 */
const getDiscordUser = (req, res, next) => {
  if (req.isAuthenticated() && req.user && req.user.discordId) {
    req.discordUser = req.user;
  } else {
    req.discordUser = null;
  }
  next();
};

module.exports = {
  verifyDiscordAuth,
  getDiscordUser,
};

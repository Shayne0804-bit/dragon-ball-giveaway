const express = require('express');
const passport = require('passport');
const router = express.Router();

/**
 * GET /api/auth/discord
 * Redirection vers Discord OAuth2
 */
router.get(
  '/discord',
  passport.authenticate('discord', { scope: ['identify', 'email', 'guilds'] })
);

/**
 * GET /api/auth/discord/callback
 * Callback après authentification Discord
 */
router.get(
  '/discord/callback',
  passport.authenticate('discord', { failureRedirect: '/?error=discord_auth_failed' }),
  (req, res) => {
    // Authentification réussie - la session est maintenant établie
    // Rediriger vers le frontend avec un message de succès
    // Le frontend va faire fetch('/api/auth/user') pour récupérer les données utilisateur
    res.redirect('/?discord_auth_success');
  }
);

/**
 * GET /api/auth/error
 * Endpoint pour récupérer les détails de l'erreur d'authentification
 */
router.get('/error', (req, res) => {
  const errorCode = req.query.error || 'unknown';
  
  let message = 'Erreur d\'authentification Discord';
  let details = '';
  let actionUrl = null;
  let actionText = null;
  
  switch(errorCode) {
    case 'discord_auth_failed':
      message = '❌ Accès refusé';
      details = 'Vous devez être membre du serveur Discord pour participer au giveaway.';
      actionUrl = 'https://discord.gg/gc8E7cy9';
      actionText = 'Rejoindre le serveur Discord';
      break;
    case 'not_in_guild':
      message = '❌ Vous n\'êtes pas dans le serveur Discord';
      details = 'Cliquez sur le lien ci-dessous pour rejoindre le serveur.';
      actionUrl = 'https://discord.gg/gc8E7cy9';
      actionText = 'Rejoindre le serveur Discord';
      break;
    case 'user_denied':
      message = '⚠️ Autorisation refusée';
      details = 'Vous avez refusé d\'autoriser l\'accès. Veuillez réessayer et accepter les permissions.';
      break;
    default:
      details = 'Une erreur s\'est produite lors de la connexion. Veuillez réessayer.';
  }
  
  res.json({
    success: false,
    error: errorCode,
    message,
    details,
    actionUrl,
    actionText,
  });
});

/**
 * GET /api/auth/user
 * Récupérer les informations de l'utilisateur connecté
 */
router.get('/user', (req, res) => {
  if (!req.user) {
    console.log('[AUTH USER] Aucun utilisateur en session');
    return res.status(401).json({
      success: false,
      message: 'Utilisateur non authentifié',
    });
  }

  console.log('[AUTH USER] Utilisateur trouvé:', {
    discordId: req.user.discordId,
    discordUsername: req.user.discordUsername,
    discordAvatar: req.user.discordAvatar ? '✓ présent' : '✗ manquant',
  });

  res.json({
    success: true,
    user: {
      discordId: req.user.discordId,
      discordUsername: req.user.discordUsername,
      discordAvatar: req.user.discordAvatar,
      email: req.user.email,
    },
  });
});

/**
 * GET /api/auth/debug
 * Route de debug pour voir les données utilisateur (À SUPPRIMER EN PRODUCTION)
 */
router.get('/debug', (req, res) => {
  if (!req.user) {
    return res.json({
      authenticated: false,
      message: 'Aucun utilisateur en session',
    });
  }

  res.json({
    authenticated: true,
    user: {
      id: req.user._id,
      discordId: req.user.discordId,
      discordUsername: req.user.discordUsername,
      discordAvatar: req.user.discordAvatar,
      email: req.user.email,
      isDiscordAuthenticated: req.user.isDiscordAuthenticated,
    },
    sessionId: req.sessionID,
  });
});

/**
 * POST /api/auth/admin-login
 * Authentifier un administrateur avec un mot de passe
 * Retourne un token admin valide
 */
router.post('/admin-login', (req, res) => {
  const { password } = req.body;
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

  // Vérifier le mot de passe
  if (!password || password !== ADMIN_PASSWORD) {
    console.log('[AUTH ADMIN] ❌ Mot de passe admin incorrect');
    return res.status(401).json({
      success: false,
      message: '❌ Mot de passe incorrect',
    });
  }

  // Générer un token admin
  const token = `adminToken_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  console.log('[AUTH ADMIN] ✅ Connexion admin réussie');

  return res.json({
    success: true,
    message: '✅ Authentification admin réussie',
    token: token,
    expiresIn: 3600, // 1 heure en secondes
  });
});

/**
 * POST /api/auth/logout
 * Déconnecter l'utilisateur
 */
router.post('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la déconnexion',
      });
    }
    res.json({
      success: true,
      message: 'Déconnecté avec succès',
    });
  });
});

module.exports = router;

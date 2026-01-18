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
    // Authentification réussie
    // Rediriger vers le frontend avec un message de succès
    res.redirect('/?success=discord_auth_success');
  }
);

/**
 * GET /api/auth/user
 * Récupérer les informations de l'utilisateur connecté
 */
router.get('/user', (req, res) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Utilisateur non authentifié',
    });
  }

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

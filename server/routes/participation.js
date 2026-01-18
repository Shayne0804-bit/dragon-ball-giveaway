/**
 * Routes Participation
 * Gestion des participations aux giveaways
 */

const express = require('express');
const router = express.Router();
const {
  addParticipation,
  getUserParticipations,
  getGiveawayParticipants,
  checkParticipation,
  deleteGiveawayParticipations,
} = require('../controllers/participationController');

// Middleware d'authentification Discord
const isDiscordAuthenticated = (req, res, next) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({
      success: false,
      message: 'Authentification Discord requise',
    });
  }
  next();
};

/**
 * POST /api/participations
 * Ajouter une participation
 * Authentification: Discord requise
 */
router.post('/', isDiscordAuthenticated, addParticipation);

/**
 * GET /api/participations/user/:userId
 * Obtenir les participations d'un utilisateur
 */
router.get('/user/:userId', getUserParticipations);

/**
 * GET /api/participations/giveaway/:giveawayId
 * Obtenir les participants d'un giveaway
 */
router.get('/giveaway/:giveawayId', getGiveawayParticipants);

/**
 * GET /api/participations/check/:giveawayId
 * Vérifier si l'utilisateur a participé
 * Authentification: Discord requise
 */
router.get('/check/:giveawayId', isDiscordAuthenticated, checkParticipation);

/**
 * DELETE /api/participations/giveaway/:giveawayId
 * Supprimer toutes les participations d'un giveaway
 * Authentification: Admin requise
 */
router.delete('/giveaway/:giveawayId', deleteGiveawayParticipations);

module.exports = router;

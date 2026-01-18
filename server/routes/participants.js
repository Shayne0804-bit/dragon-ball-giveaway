const express = require('express');
const router = express.Router();
const {
  loginAdmin,
  addParticipant,
  getParticipants,
  drawWinner,
  resetParticipants,
  getWinners,
} = require('../controllers/participantController');
const { verifyDiscordAuth } = require('../middlewares/discordAuth');
const { verifyAdminToken } = require('../middlewares/adminAuth');

/**
 * POST /api/admin/login
 * Authentifier l'admin avec mot de passe
 */
router.post('/admin/login', loginAdmin);

/**
 * GET /api/participants
 * Récupérer la liste des participants
 */
router.get('/', getParticipants);

/**
 * POST /api/participants
 * Ajouter un participant (authentification Discord requise)
 * Protégé par : Discord Auth + Rate Limiting
 */
router.post(
  '/',
  verifyDiscordAuth,
  addParticipant
);

/**
 * POST /api/roulette
 * Tirer un gagnant aléatoire
 * Protégé par authentification admin
 */
router.post('/roulette', verifyAdminToken, drawWinner);

/**
 * GET /api/winners
 * Récupérer l'historique des gagnants
 */
router.get('/winners', getWinners);

/**
 * DELETE /api/reset
 * Réinitialiser la liste des participants
 * Protégé par authentification admin
 */
router.delete('/reset', verifyAdminToken, resetParticipants);

module.exports = router;

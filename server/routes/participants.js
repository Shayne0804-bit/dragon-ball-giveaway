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
const { validateParticipantName, validateIp } = require('../middlewares/validation');
const { checkAntiSpam } = require('../middlewares/antiSpam');
const { participantLimiter } = require('../middlewares/rateLimiter');
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
 * Ajouter un participant
 * Protégé par rate limiting et validation
 */
router.post(
  '/',
  participantLimiter,
  validateIp,
  validateParticipantName,
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

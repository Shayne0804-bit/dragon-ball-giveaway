const express = require('express');
const router = express.Router();
const {
  createGiveaway,
  getGiveaways,
  getGiveawayById,
  updateGiveaway,
  deleteGiveaway,
} = require('../controllers/giveawayMultiController');
const { getWinners } = require('../controllers/participantController');
const { verifyAdminToken } = require('../middlewares/adminAuth');

/**
 * GET /api/giveaways
 * Récupérer tous les giveaways actifs (accessible à tous)
 */
router.get('/', getGiveaways);

/**
 * GET /api/giveaways/roulette
 * Endpoint pour la roulette (stub - à implémenter)
 */
router.get('/roulette', (req, res) => {
  return res.status(501).json({
    success: false,
    message: 'Roulette endpoint not yet implemented',
  });
});

/**
 * GET /api/giveaways/winners
 * Récupérer l'historique des gagnants
 */
router.get('/winners', getWinners);

/**
 * DELETE /api/giveaways/reset
 * Réinitialiser un giveaway (supprimer complètement avec toutes ses données)
 * Query param: giveawayId
 */
router.delete('/reset', verifyAdminToken, async (req, res) => {
  try {
    const { giveawayId } = req.query;
    
    if (!giveawayId) {
      return res.status(400).json({
        success: false,
        message: 'giveawayId est requis',
      });
    }

    // Appeler la fonction deleteGiveaway en simulant req.params.id
    req.params.id = giveawayId;
    return deleteGiveaway(req, res);
  } catch (error) {
    console.error('Erreur lors de la réinitialisation du giveaway:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la réinitialisation du giveaway',
    });
  }
});

/**
 * GET /api/giveaways/:id
 * Récupérer un giveaway spécifique (accessible à tous)
 */
router.get('/:id', getGiveawayById);

/**
 * POST /api/giveaways
 * Créer un nouveau giveaway (admin seulement)
 */
router.post('/', verifyAdminToken, createGiveaway);

/**
 * PUT /api/giveaways/:id
 * Mettre à jour un giveaway (admin seulement)
 */
router.put('/:id', verifyAdminToken, updateGiveaway);

/**
 * DELETE /api/giveaways/:id
 * Supprimer un giveaway (admin seulement)
 */
router.delete('/:id', verifyAdminToken, deleteGiveaway);

module.exports = router;

const express = require('express');
const router = express.Router();
const {
  createGiveaway,
  getGiveaways,
  getGiveawayById,
  updateGiveaway,
  deleteGiveaway,
} = require('../controllers/giveawayMultiController');
const { verifyAdminToken } = require('../middlewares/adminAuth');

/**
 * GET /api/giveaways
 * Récupérer tous les giveaways actifs (accessible à tous)
 */
router.get('/', getGiveaways);

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

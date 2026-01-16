const express = require('express');
const router = express.Router();
const {
  uploadGiveawayPhotos,
  getGiveawayPhotos,
  deleteAllGiveawayPhotos,
  deleteGiveawayPhoto,
} = require('../controllers/giveawayController');
const { verifyAdminToken } = require('../middlewares/adminAuth');

/**
 * GET /api/giveaway/photos
 * Récupérer les photos du giveaway (accessible à tous)
 */
router.get('/photos', getGiveawayPhotos);

/**
 * POST /api/giveaway/photos
 * Uploader les photos du giveaway (admin seulement)
 */
router.post('/photos', verifyAdminToken, uploadGiveawayPhotos);

/**
 * DELETE /api/giveaway/photos
 * Supprimer toutes les photos (admin seulement)
 */
router.delete('/photos', verifyAdminToken, deleteAllGiveawayPhotos);

/**
 * DELETE /api/giveaway/photos/:filename
 * Supprimer une photo spécifique (admin seulement)
 */
router.delete('/photos/:filename', verifyAdminToken, deleteGiveawayPhoto);

module.exports = router;

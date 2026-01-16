const express = require('express');
const router = express.Router();
const {
  uploadGiveawayPhotos,
  getGiveawayPhotos,
  getGiveawayPhotoById,
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
 * GET /api/giveaway/photos/:id
 * Récupérer une photo spécifique par ID (accessible à tous)
 */
router.get('/photos/:id', getGiveawayPhotoById);

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
 * DELETE /api/giveaway/photos/:id
 * Supprimer une photo spécifique par ID (admin seulement)
 */
router.delete('/photos/:id', verifyAdminToken, deleteGiveawayPhoto);

module.exports = router;

const express = require('express');
const router = express.Router();
const shopController = require('../controllers/shopController');

// Import du middleware d'authentification admin
const { verifyAdminToken } = require('../middlewares/adminAuth');

/**
 * Routes publiques (GET)
 */

/**
 * GET /api/shop/items
 * Récupérer tous les articles de la boutique
 */
router.get('/items', shopController.getAllShopItems);

/**
 * GET /api/shop/items/:id
 * Récupérer un article spécifique
 */
router.get('/items/:id', shopController.getShopItemById);

/**
 * GET /api/shop/items/category/:category
 * Récupérer les articles par catégorie
 */
router.get('/items/category/:category', shopController.getItemsByCategory);

/**
 * POST /api/shop/purchase
 * Traiter un achat (public - pas d'authentification requise)
 */
router.post('/purchase', shopController.processPurchase);

/**
 * Routes protégées (Admin uniquement)
 */

/**
 * POST /api/shop/items
 * Créer un nouvel article (Admin)
 */
router.post('/items', verifyAdminToken, shopController.createShopItem);

/**
 * PUT /api/shop/items/:id
 * Mettre à jour un article (Admin)
 */
router.put('/items/:id', verifyAdminToken, shopController.updateShopItem);

/**
 * DELETE /api/shop/items/:id
 * Supprimer un article (Admin)
 */
router.delete('/items/:id', verifyAdminToken, shopController.deleteShopItem);

/**
 * PUT /api/shop/items/reorder
 * Réorganiser les articles (Admin)
 */
router.put('/reorder', verifyAdminToken, shopController.reorderShopItems);

module.exports = router;

const express = require('express');
const router = express.Router();
const Participant = require('../models/Participant');

// Import du middleware d'authentification admin
const { verifyAdminToken } = require('../middlewares/adminAuth');

/**
 * POST /api/admin/cleanup-duplicates
 * Nettoie les doublons
 */
router.post('/cleanup-duplicates', verifyAdminToken, async (req, res) => {
  try {
    console.log('[ADMIN] Début du nettoyage des doublons...');

    // Trouver tous les doublons (Discord + Giveaway)
    const duplicates = await Participant.aggregate([
      {
        $group: {
          _id: {
            discordId: '$discordId',
            giveaway: '$giveaway'
          },
          count: { $sum: 1 },
          docs: { $push: '$$ROOT' }
        }
      },
      {
        $match: {
          count: { $gt: 1 } // Plus d'une participation
        }
      }
    ]);

    console.log(`[ADMIN] Groupes avec doublons: ${duplicates.length}`);

    let totalDeleted = 0;
    const report = [];

    for (const group of duplicates) {
      const { _id, count, docs } = group;

      // Trier par date créée et garder la plus ancienne
      const sorted = docs.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      const toKeep = sorted[0];
      const toDelete = sorted.slice(1);

      // Supprimer les doublons
      const deleteResult = await Participant.deleteMany({
        _id: { $in: toDelete.map(d => d._id) }
      });

      totalDeleted += deleteResult.deletedCount;

      report.push({
        discordId: _id.discordId,
        giveaway: _id.giveaway,
        kept: toKeep._id,
        deleted: deleteResult.deletedCount
      });
    }

    // Afficher les statistiques finales
    const finalCount = await Participant.countDocuments();

    console.log(`[ADMIN] ✅ Nettoyage terminé! ${totalDeleted} documents supprimés`);

    return res.json({
      success: true,
      message: `✅ Nettoyage terminé! ${totalDeleted} doublons supprimés`,
      duplicatesFound: duplicates.length,
      deleted: totalDeleted,
      remainingParticipants: finalCount,
      report: report
    });

  } catch (error) {
    console.error('[ADMIN] Erreur cleanup:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors du nettoyage',
      error: error.message
    });
  }
});

/**
 * POST /api/admin/send-reminder
 * Envoyer un rappel manuel aux utilisateurs
 * Authentification: Admin token requis
 */
router.post('/send-reminder', verifyAdminToken, async (req, res) => {
  try {
    // Récupérer le service de rappel depuis le contexte global
    if (!global.reminderService) {
      return res.status(500).json({
        success: false,
        message: 'Service de rappel non disponible'
      });
    }

    console.log('[ADMIN] Envoi d\'un rappel manuel...');
    await global.reminderService.sendManualReminder();

    return res.json({
      success: true,
      message: '✅ Rappel envoyé avec succès!',
      nextReminderTime: global.reminderService.getNextReminderTime()
    });

  } catch (error) {
    console.error('[ADMIN] Erreur send-reminder:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'envoi du rappel',
      error: error.message
    });
  }
});

module.exports = router;

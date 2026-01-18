/**
 * Contrôleur Participation
 * Gestion des participations des utilisateurs aux giveaways
 */

const Participation = require('../models/Participant');
const Giveaway = require('../models/Giveaway');
const User = require('../models/User');

/**
 * Ajouter une participation
 * POST /api/participations
 * Authentification: Discord requise
 * Body: { giveawayId }
 */
const addParticipation = async (req, res) => {
  try {
    const { giveawayId } = req.body;
    const userId = req.user._id; // ID MongoDB de User depuis Passport

    console.log(`[PARTICIPATION] Tentative: User ${userId} pour giveaway ${giveawayId}`);

    // Vérifications
    if (!giveawayId) {
      return res.status(400).json({
        success: false,
        message: 'ID du giveaway requis',
      });
    }

    // Vérifier que le giveaway existe
    const giveaway = await Giveaway.findById(giveawayId);
    if (!giveaway) {
      return res.status(404).json({
        success: false,
        message: 'Giveaway non trouvé',
      });
    }

    // Vérifier que le giveaway est en cours
    const now = new Date();
    if (giveaway.endDate < now) {
      const timeLeft = Math.ceil((giveaway.endDate - now) / 60000);
      return res.status(400).json({
        success: false,
        message: `⏱️ Ce giveaway est terminé!`,
        endDate: giveaway.endDate,
      });
    }

    // Vérifier si l'utilisateur a déjà participé à ce giveaway
    const existingParticipation = await Participation.findOne({
      user: userId,
      giveaway: giveawayId,
    });

    if (existingParticipation) {
      // Calculer le temps restant jusqu'à la fin du giveaway
      const timeLeft = Math.ceil((giveaway.endDate - now) / 60000); // en minutes
      const hours = Math.floor(timeLeft / 60);
      const minutes = timeLeft % 60;

      let timeString = '';
      if (hours > 0) {
        timeString = `${hours}h ${minutes}min`;
      } else {
        timeString = `${minutes} minutes`;
      }

      return res.status(429).json({
        success: false,
        message: `❌ Vous avez déjà participé à ce giveaway!`,
        detail: `Vous pourrez voir le résultat dans ${timeString}`,
        timeRemaining: timeLeft,
        giveaway: {
          _id: giveaway._id,
          name: giveaway.name,
          endDate: giveaway.endDate,
        },
      });
    }

    // Créer la participation
    const participation = new Participation({
      user: userId,
      giveaway: giveawayId,
    });

    await participation.save();
    console.log(`[PARTICIPATION] ✅ Participation créée: ${userId} -> ${giveawayId}`);

    // Mettre à jour le compteur de participants du giveaway
    giveaway.participantCount = (giveaway.participantCount || 0) + 1;
    await giveaway.save();

    return res.status(201).json({
      success: true,
      message: '✅ Participation enregistrée!',
      participation: {
        _id: participation._id,
        giveaway: participation.giveaway,
        participatedAt: participation.participatedAt,
      },
    });
  } catch (error) {
    console.error('[PARTICIPATION] Erreur:', error.message);

    // Gérer les violations de contrainte unique (ne devrait pas arriver ici)
    if (error.code === 11000) {
      return res.status(429).json({
        success: false,
        message: 'Vous avez déjà participé à ce giveaway',
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la participation',
      error: error.message,
    });
  }
};

/**
 * Obtenir les participations d'un utilisateur
 * GET /api/participations/user/:userId
 */
const getUserParticipations = async (req, res) => {
  try {
    const { userId } = req.params;

    const participations = await Participation.find({ user: userId })
      .populate('giveaway', 'name endDate status')
      .sort({ participatedAt: -1 });

    return res.json({
      success: true,
      data: participations,
    });
  } catch (error) {
    console.error('[PARTICIPATION] Erreur récupération:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération',
    });
  }
};

/**
 * Obtenir les participants d'un giveaway
 * GET /api/participations/giveaway/:giveawayId
 */
const getGiveawayParticipants = async (req, res) => {
  try {
    const { giveawayId } = req.params;

    const participations = await Participation.find({ giveaway: giveawayId })
      .populate('user', 'discordUsername discordAvatar')
      .sort({ participatedAt: 1 });

    // Formater la réponse
    const participants = participations.map((p) => ({
      _id: p._id,
      user: p.user,
      participatedAt: p.participatedAt,
    }));

    return res.json({
      success: true,
      count: participants.length,
      data: participants,
    });
  } catch (error) {
    console.error('[PARTICIPATION] Erreur récupération giveaway:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération',
    });
  }
};

/**
 * Vérifier si un utilisateur a participé à un giveaway
 * GET /api/participations/check/:giveawayId
 */
const checkParticipation = async (req, res) => {
  try {
    const { giveawayId } = req.params;
    const userId = req.user._id;

    const participation = await Participation.findOne({
      user: userId,
      giveaway: giveawayId,
    });

    // Récupérer le giveaway pour avoir les infos
    const giveaway = await Giveaway.findById(giveawayId);

    return res.json({
      success: true,
      participated: !!participation,
      giveaway: {
        _id: giveaway._id,
        name: giveaway.name,
        endDate: giveaway.endDate,
      },
    });
  } catch (error) {
    console.error('[PARTICIPATION] Erreur vérification:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la vérification',
    });
  }
};

/**
 * Supprimer toutes les participations d'un giveaway (après sa fin)
 * DELETE /api/participations/giveaway/:giveawayId
 * Authentification: Admin requise
 */
const deleteGiveawayParticipations = async (req, res) => {
  try {
    const { giveawayId } = req.params;

    const result = await Participation.deleteMany({ giveaway: giveawayId });

    console.log(`[PARTICIPATION] Suppression: ${result.deletedCount} participations du giveaway ${giveawayId}`);

    return res.json({
      success: true,
      message: `${result.deletedCount} participations supprimées`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error('[PARTICIPATION] Erreur suppression:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression',
    });
  }
};

module.exports = {
  addParticipation,
  getUserParticipations,
  getGiveawayParticipants,
  checkParticipation,
  deleteGiveawayParticipations,
};

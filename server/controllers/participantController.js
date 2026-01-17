const Participant = require('../models/Participant');
const Winner = require('../models/Winner');

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

/**
 * Authentifier l'admin et générer un token
 * POST /api/admin/login
 */
const loginAdmin = async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Mot de passe requis',
      });
    }

    if (password !== ADMIN_PASSWORD) {
      return res.status(401).json({
        success: false,
        message: 'Mot de passe admin incorrect',
      });
    }

    // Générer un token simple
    const token = `adminToken_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    res.json({
      success: true,
      message: 'Connecté en tant qu\'admin',
      token: token,
    });
  } catch (error) {
    console.error('Erreur lors du login admin:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
    });
  }
};

/**
 * Ajouter un participant
 * POST /api/participants
 * Body: { name, giveawayId }
 */
const addParticipant = async (req, res) => {
  try {
    const { name, giveawayId } = req.body;
    const ip = req.clientIp;

    // Vérifier si l'IP a déjà participé dans les 24 dernières heures
    // - Si giveawayId fourni: vérifier par IP + giveaway EXACT (isolement par giveaway)
    // - Si pas de giveawayId: vérifier par IP uniquement (backward compatibility, legacy)
    let antiSpamQuery = {
      ip: ip,
      createdAt: {
        $gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // 24 heures
      },
    };

    // Si un giveawayId est fourni, rechercher UNIQUEMENT la participation au MÊME giveaway
    if (giveawayId) {
      antiSpamQuery.giveaway = giveawayId;
    } else {
      // Si pas de giveawayId (legacy), vérifier UNIQUEMENT les participations SANS giveaway
      antiSpamQuery.giveaway = null;
    }

    const lastParticipation = await Participant.findOne(antiSpamQuery, { name: 1, createdAt: 1, giveaway: 1 });

    if (lastParticipation) {
      // Calculer le temps avant la prochaine participation
      const nextAllowedTime = new Date(
        lastParticipation.createdAt.getTime() + 24 * 60 * 60 * 1000
      );
      const timeUntilNext = Math.ceil((nextAllowedTime - Date.now()) / 60000); // en minutes

      // Message adapté selon si c'est lié à un giveaway ou non
      const context = giveawayId ? ' à ce giveaway' : '';
      const errorMessage = `⏱️ Vous avez déjà participé${context}! Vous pourrez reparticiper dans ${timeUntilNext} minutes.`;

      return res.status(429).json({
        success: false,
        message: errorMessage,
        nextAllowedAt: nextAllowedTime,
      });
    }

    // Créer le participant
    const participant = new Participant({
      name,
      ip,
      giveaway: giveawayId || null,
    });

    // Sauvegarder dans la base
    await participant.save();

    // Message dynamique selon le giveaway
    const giveawayContext = giveawayId ? ' au giveaway sélectionné' : '';
    
    res.status(201).json({
      success: true,
      message: `⚡ Participation enregistrée avec succès${giveawayContext}! Revenez dans 24h pour reparticiper! ⚡`,
      data: {
        id: participant._id,
        name: participant.name,
        giveaway: giveawayId || null,
        nextAllowedAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });
  } catch (error) {
    console.error('Erreur lors de l\'ajout du participant:', error);

    // Erreur de validation Mongoose
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', '),
      });
    }

    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'enregistrement',
    });
  }
};

/**
 * Récupérer tous les participants
 * GET /api/participants?giveawayId=xxx
 */
const getParticipants = async (req, res) => {
  try {
    const { giveawayId } = req.query;
    const query = giveawayId ? { giveaway: giveawayId } : {};
    const participants = await Participant.find(query, { ip: 0 }).sort({ createdAt: -1 });

    res.json({
      success: true,
      count: participants.length,
      data: participants,
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des participants:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
    });
  }
};

/**
 * Lancer la roulette et tirer un gagnant
 * POST /api/roulette?giveawayId=xxx
 */
const drawWinner = async (req, res) => {
  try {
    const { giveawayId } = req.query;
    
    // Récupérer les participants du giveaway sélectionné
    const query = giveawayId ? { giveaway: giveawayId } : {};
    const participants = await Participant.find(query);

    if (participants.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Aucun participant pour tirer un gagnant',
      });
    }

    // Sélectionner un gagnant aléatoire
    const randomIndex = Math.floor(Math.random() * participants.length);
    const winner = participants[randomIndex];

    // Sauvegarder le gagnant
    const winnerRecord = new Winner({
      name: winner.name,
      giveaway: giveawayId || null,
    });
    await winnerRecord.save();

    res.json({
      success: true,
      message: 'Gagnant tiré au sort!',
      data: {
        name: winner.name,
        totalParticipants: participants.length,
      },
    });
  } catch (error) {
    console.error('Erreur lors du tirage du gagnant:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
    });
  }
};

/**
 * Réinitialiser (vider la liste des participants)
 * DELETE /api/reset
 * Endpoint admin (sans authentification pour ce projet)
 */
const resetParticipants = async (req, res) => {
  try {
    const { giveawayId } = req.query;

    console.log(`[RESET] Réinitialisation des participants - giveawayId: ${giveawayId}`);

    // Si un giveawayId est fourni, supprimer les participants et marquer le giveaway comme complété
    if (giveawayId) {
      const Giveaway = require('../models/Giveaway');
      
      // Supprimer les participants
      const result = await Participant.deleteMany({ giveaway: giveawayId });
      console.log(`[RESET] ${result.deletedCount} participant(s) supprimé(s) pour le giveaway ${giveawayId}`);

      // Marquer le giveaway comme complété pour le rendre inaccessible
      await Giveaway.findByIdAndUpdate(giveawayId, { status: 'completed' });
      console.log(`[RESET] Giveaway ${giveawayId} marqué comme complété`);

      res.json({
        success: true,
        message: `Liste réinitialisée - ${result.deletedCount} participant(s) supprimé(s)`,
        deletedCount: result.deletedCount,
      });
    } else {
      // Sinon supprimer TOUS les participants (comportement ancien)
      const result = await Participant.deleteMany({});
      console.log(`[RESET] ${result.deletedCount} participant(s) supprimé(s) au total`);

      res.json({
        success: true,
        message: 'Liste des participants réinitialisée',
        deletedCount: result.deletedCount,
      });
    }
  } catch (error) {
    console.error('❌ Erreur lors de la réinitialisation:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
    });
  }
};

/**
 * Récupérer l'historique des gagnants
 * GET /api/winners?giveawayId=xxx
 */
const getWinners = async (req, res) => {
  try {
    const { giveawayId } = req.query;
    const query = giveawayId ? { giveaway: giveawayId } : {};
    const winners = await Winner.find(query).sort({ date: -1 }).limit(10);

    res.json({
      success: true,
      count: winners.length,
      data: winners,
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des gagnants:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
    });
  }
};

module.exports = {
  loginAdmin,
  addParticipant,
  getParticipants,
  drawWinner,
  resetParticipants,
  getWinners,
};

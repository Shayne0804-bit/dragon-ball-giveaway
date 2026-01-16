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
 */
const addParticipant = async (req, res) => {
  try {
    const { name } = req.body;
    const ip = req.clientIp;

    // Vérifier si l'IP a déjà participé dans les 24 dernières heures
    const lastParticipation = await Participant.findOne(
      {
        ip: ip,
        createdAt: {
          $gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // 24 heures
        },
      },
      { name: 1, createdAt: 1 }
    );

    if (lastParticipation) {
      // Calculer le temps avant la prochaine participation
      const nextAllowedTime = new Date(
        lastParticipation.createdAt.getTime() + 24 * 60 * 60 * 1000
      );
      const timeUntilNext = Math.ceil((nextAllowedTime - Date.now()) / 60000); // en minutes

      return res.status(429).json({
        success: false,
        message: `⏱️ Vous avez déjà participé! Vous pourrez reparticiper dans ${timeUntilNext} minutes.`,
        nextAllowedAt: nextAllowedTime,
      });
    }

    // Créer le participant
    const participant = new Participant({
      name,
      ip,
    });

    // Sauvegarder dans la base
    await participant.save();

    res.status(201).json({
      success: true,
      message: '⚡ Participation enregistrée avec succès! Revenez dans 24h pour reparticiper! ⚡',
      data: {
        id: participant._id,
        name: participant.name,
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
 * GET /api/participants
 */
const getParticipants = async (req, res) => {
  try {
    const participants = await Participant.find({}, { ip: 0 }).sort({ createdAt: -1 });

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
 * POST /api/roulette
 */
const drawWinner = async (req, res) => {
  try {
    // Récupérer tous les participants
    const participants = await Participant.find({});

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
    await Participant.deleteMany({});

    res.json({
      success: true,
      message: 'Liste des participants réinitialisée',
    });
  } catch (error) {
    console.error('Erreur lors de la réinitialisation:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
    });
  }
};

/**
 * Récupérer l'historique des gagnants
 * GET /api/winners
 */
const getWinners = async (req, res) => {
  try {
    const winners = await Winner.find({}).sort({ date: -1 }).limit(10);

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

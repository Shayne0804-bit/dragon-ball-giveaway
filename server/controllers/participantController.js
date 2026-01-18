const Participant = require('../models/ParticipantRoulette');
const Participation = require('../models/Participant');
const Winner = require('../models/Winner');
const discordBot = require('../services/discordBot');
const Giveaway = require('../models/Giveaway');

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
 * Ajouter un participant avec authentification Discord
 * POST /api/participants
 * Authentification : Discord requise
 * Body: { giveawayId } (le nom vient de Discord)
 */
const addParticipant = async (req, res) => {
  try {
    const { giveawayId } = req.body;
    const discordId = req.user.discordId; // Récupéré depuis Passport

    // Vérifier que l'utilisateur Discord est bien authentifié
    if (!discordId) {
      return res.status(401).json({
        success: false,
        message: 'Authentification Discord requise',
      });
    }

    // Vérifier si cet utilisateur Discord a déjà participé à ce giveaway dans les 24 dernières heures
    // Cette vérification s'applique uniquement si AUCUN giveawayId n'est fourni (participation générale)
    if (!giveawayId) {
      const antiSpamQuery = {
        discordId: discordId,
        giveaway: null, // Participations sans giveaway spécifique
        createdAt: {
          $gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // 24 heures
        },
      };

      const lastParticipation = await Participant.findOne(antiSpamQuery);

      if (lastParticipation) {
        // Calculer le temps avant la prochaine participation
        const nextAllowedTime = new Date(
          lastParticipation.createdAt.getTime() + 24 * 60 * 60 * 1000
        );
        const timeUntilNext = Math.ceil((nextAllowedTime - Date.now()) / 60000); // en minutes

        const errorMessage = `⏱️ Vous avez déjà participé! Vous pourrez reparticiper dans ${timeUntilNext} minutes.`;

        return res.status(429).json({
          success: false,
          message: errorMessage,
          nextAllowedAt: nextAllowedTime,
        });
      }
    }
    // NOTE: Si giveawayId EST fourni, la contrainte unique MongoDB (discordId, giveaway)
    // empêchera les doublons. L'erreur sera gérée lors du .save()

    // Créer le participant avec les infos Discord
    const participant = new Participant({
      discordId: discordId,
      discordUsername: req.user.discordUsername,
      discordAvatar: req.user.discordAvatar,
      email: req.user.email,
      isDiscordAuthenticated: true,
      giveaway: giveawayId || null,
      // Le champ 'ip' est optionnel maintenant (on utilise Discord ID à la place)
      ip: req.clientIp || 'discord_auth',
    });

    // Sauvegarder dans la base
    try {
      await participant.save();
    } catch (err) {
      // Gérer les erreurs de contrainte unique (doublon discord + giveaway)
      if (err.code === 11000) {
        const duplicateField = Object.keys(err.keyPattern)[0];
        
        // Si c'est une violation de l'index unique (discordId, giveaway)
        if (err.keyPattern.discordId && err.keyPattern.giveaway) {
          return res.status(429).json({
            success: false,
            message: '❌ Vous avez déjà participé à ce giveaway! Vous ne pouvez participer qu\'une fois par giveaway.',
            code: 'ALREADY_PARTICIPATED',
          });
        }
        
        throw err;
      }
      throw err;
    }

    // Récupérer le giveaway et envoyer une notification Discord
    if (giveawayId) {
      try {
        const giveaway = await Giveaway.findById(giveawayId).populate('photos');
        if (giveaway) {
          // Mettre à jour le compteur de participants
          giveaway.participantCount = (giveaway.participantCount || 0) + 1;
          await giveaway.save();

          // Vérifier si on atteint le jalon de 7 participants
          if (giveaway.participantCount === 7) {
            console.log(`[PARTICIPANT] 🎯 Jalon atteint: 7 participants pour ${giveaway.name}`);
            discordBot.notifyParticipantMilestone(giveaway, 7).catch(err => {
              console.error('[PARTICIPANT] Erreur notification jalon:', err.message);
            });
          }
        }
      } catch (err) {
        console.error('[PARTICIPANT] Erreur lors de la mise à jour du giveaway:', err.message);
      }
    }

    // Message de confirmation
    const giveawayContext = giveawayId ? ' au giveaway sélectionné' : '';
    
    res.status(201).json({
      success: true,
      message: `⚡ Participation enregistrée avec succès${giveawayContext}! Revenez dans 24h pour reparticiper! ⚡`,
      data: {
        id: participant._id,
        discordUsername: participant.discordUsername,
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

    // Erreur d'unicité Discord ID
    if (error.code === 11000 && error.keyPattern?.discordId) {
      return res.status(400).json({
        success: false,
        message: 'Vous avez déjà un compte avec cet ID Discord',
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
 * POST /api/participants/roulette?giveawayId=xxx
 */
const drawWinner = async (req, res) => {
  try {
    const { giveawayId } = req.query;
    
    // Récupérer les participants du giveaway sélectionné (depuis Participation)
    const query = giveawayId ? { giveaway: giveawayId } : {};
    const participations = await Participation.find(query).populate('user');

    if (participations.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Aucun participant pour tirer un gagnant',
      });
    }

    // Sélectionner un gagnant aléatoire
    const randomIndex = Math.floor(Math.random() * participations.length);
    const winnerParticipation = participations[randomIndex];
    const winner = winnerParticipation.user;

    // Sauvegarder le gagnant
    const winnerRecord = new Winner({
      name: winner.discordUsername || 'Gagnant',
      discordId: winner.discordId,
      giveaway: giveawayId || null,
    });
    await winnerRecord.save();

    // Récupérer tous les gagnants du giveaway pour la notification Discord
    let winners = [];
    if (giveawayId) {
      winners = await Winner.find({ giveaway: giveawayId }).lean();
      
      // Récupérer le giveaway avec les photos et envoyer la notification Discord
      const giveaway = await Giveaway.findById(giveawayId).populate('photos');
      if (giveaway) {
        // Compter les participants via Participation (façon correcte)
        const participantCount = await Participation.countDocuments({ giveaway: giveawayId });
        
        // Mettre à jour les infos du giveaway pour l'embed
        giveaway.participantCount = participantCount;
        giveaway.winnerCount = winners.length;
        
        console.log(`[DRAWWINNER] Notification: ${participantCount} participants, ${winners.length} gagnants`);
        
        // Envoyer la notification Discord
        discordBot.notifyGiveawayCompleted(giveaway, winners).catch(err => {
          console.error('[DRAWWINNER] Erreur lors de l\'envoi de la notification Discord:', err.message);
        });
      }
    }

    res.json({
      success: true,
      message: 'Gagnant tiré au sort!',
      data: {
        name: winner.discordUsername,
        discordId: winner.discordId,
        totalParticipants: participations.length,
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
    const winners = await Winner.find(query).sort({ date: -1 }).limit(50);

    res.json({
      success: true,
      count: winners.length,
      data: {
        winners: winners,
      },
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

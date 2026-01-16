const Participant = require('../models/Participant');

/**
 * Vérifier si un participant avec cette IP a déjà participé récemment
 * Anti-spam par IP
 */
const checkAntiSpam = async (req, res, next) => {
  try {
    const antiSpamMinutes = parseInt(process.env.ANTI_SPAM_MINUTES) || 30;
    const timeWindow = new Date(Date.now() - antiSpamMinutes * 60 * 1000);

    const existingParticipant = await Participant.findOne({
      ip: req.clientIp,
      createdAt: { $gte: timeWindow },
    });

    if (existingParticipant) {
      const minutesLeft = Math.ceil(
        (existingParticipant.createdAt.getTime() + antiSpamMinutes * 60 * 1000 - Date.now()) / 60000
      );
      return res.status(429).json({
        success: false,
        message: `Vous avez déjà participé. Veuillez réessayer dans ${minutesLeft} minutes.`,
      });
    }

    next();
  } catch (error) {
    console.error('Erreur lors de la vérification anti-spam:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur',
    });
  }
};

module.exports = {
  checkAntiSpam,
};

const Giveaway = require('../models/Giveaway');
const Participation = require('../models/Participant');
const Winner = require('../models/Winner');
const discordBot = require('./discordBot');

class AutoGiveawayService {
  constructor() {
    this.isRunning = false;
    this.intervalId = null;
    this.checkInterval = 60000; // Vérifier toutes les 60 secondes
  }

  /**
   * Démarrer le service d'auto-tirage
   */
  start() {
    if (this.isRunning) {
      console.warn('[AUTO-GIVEAWAY] Service déjà en cours d\'exécution');
      return;
    }

    this.isRunning = true;
    console.log('[AUTO-GIVEAWAY] ✅ Service démarré - Vérification toutes les 60 secondes');

    // Faire une première vérification immédiate
    this.checkExpiredGiveaways();

    // Puis vérifier régulièrement
    this.intervalId = setInterval(() => {
      this.checkExpiredGiveaways();
    }, this.checkInterval);
  }

  /**
   * Arrêter le service d'auto-tirage
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log('[AUTO-GIVEAWAY] ⛔ Service arrêté');
  }

  /**
   * Vérifier et traiter les giveaways expirés
   */
  async checkExpiredGiveaways() {
    try {
      const now = new Date();

      // Trouver tous les giveaways dont la date de fin est dépassée et qui ne sont pas encore traités
      const expiredGiveaways = await Giveaway.find({
        endDate: { $lte: now },
        status: { $ne: 'completed' }, // Pas déjà complétés
      }).populate('photos');

      if (expiredGiveaways.length === 0) {
        return; // Rien à traiter
      }

      console.log(`[AUTO-GIVEAWAY] 🎯 ${expiredGiveaways.length} giveaway(s) expiré(s) à traiter`);

      for (const giveaway of expiredGiveaways) {
        await this.processExpiredGiveaway(giveaway);
      }
    } catch (error) {
      console.error('[AUTO-GIVEAWAY] ❌ Erreur lors de la vérification:', error.message);
    }
  }

  /**
   * Traiter un giveaway expiré
   */
  async processExpiredGiveaway(giveaway) {
    try {
      console.log(`[AUTO-GIVEAWAY] Traitement du giveaway expiré: ${giveaway.name} (${giveaway._id})`);

      // Récupérer les participants
      const participations = await Participation.find({ giveaway: giveaway._id }).populate('user');

      if (participations.length === 0) {
        console.log(`[AUTO-GIVEAWAY] ⚠️  Aucun participant pour ${giveaway.name} - Suppression sans gagnant`);
        // Supprimer le giveaway sans créer de gagnant
        await this.deleteGiveaway(giveaway._id);
        return;
      }

      // Tirer un gagnant aléatoire
      const randomIndex = Math.floor(Math.random() * participations.length);
      const winnerParticipation = participations[randomIndex];
      const winner = winnerParticipation.user;

      // Créer l'enregistrement du gagnant
      const winnerRecord = new Winner({
        name: winner.discordUsername || 'Gagnant',
        discordId: winner.discordId,
        giveaway: giveaway._id,
      });
      await winnerRecord.save();

      console.log(`[AUTO-GIVEAWAY] 🏆 Gagnant tiré pour ${giveaway.name}: ${winner.discordUsername}`);

      // Récupérer tous les gagnants pour la notification
      const winners = await Winner.find({ giveaway: giveaway._id }).lean();

      // Mettre à jour les compteurs du giveaway
      giveaway.participantCount = participations.length;
      giveaway.winnerCount = winners.length;
      giveaway.status = 'completed';
      await giveaway.save();

      // Envoyer la notification Discord
      console.log(`[AUTO-GIVEAWAY] 📢 Envoi de la notification Discord...`);
      await discordBot.notifyGiveawayCompleted(giveaway, winners);

      // Attendre un peu avant de supprimer
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Supprimer le giveaway (l'historique des gagnants est préservé)
      await this.deleteGiveaway(giveaway._id);

      console.log(`[AUTO-GIVEAWAY] ✅ Giveaway ${giveaway.name} traité et supprimé`);
    } catch (error) {
      console.error(`[AUTO-GIVEAWAY] ❌ Erreur lors du traitement du giveaway ${giveaway._id}:`, error.message);
    }
  }

  /**
   * Supprimer un giveaway avec toutes ses données (sauf les gagnants)
   */
  async deleteGiveaway(giveawayId) {
    try {
      const GiveawayPhoto = require('../models/GiveawayPhoto');
      const Participant = require('../models/ParticipantRoulette');

      const giveaway = await Giveaway.findById(giveawayId);
      if (!giveaway) return;

      // Supprimer les photos
      await GiveawayPhoto.deleteMany({ _id: { $in: giveaway.photos } });

      // Supprimer les participations
      await Participation.deleteMany({ giveaway: giveawayId });

      // Supprimer les participants (roulette)
      await Participant.deleteMany({ giveaway: giveawayId });

      // Supprimer le giveaway (mais PAS les Winners)
      await Giveaway.findByIdAndDelete(giveawayId);

      console.log(`[AUTO-GIVEAWAY] 🗑️  Giveaway ${giveawayId} supprimé (historique conservé)`);
    } catch (error) {
      console.error(`[AUTO-GIVEAWAY] Erreur lors de la suppression du giveaway:`, error.message);
    }
  }
}

// Exporter une instance unique
module.exports = new AutoGiveawayService();

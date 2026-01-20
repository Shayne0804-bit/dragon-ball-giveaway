const cron = require('node-cron');
const TwitterService = require('./twitterService');
const discordBot = require('./discordBot');

class TwitterScheduler {
  constructor() {
    this.twitterService = new TwitterService();
    this.cronJob = null;
    this.isRunning = false;
  }

  /**
   * Envoyer le dernier tweet au démarrage (une seule fois)
   */
  async sendInitialTweet() {
    try {
      console.log('[TWITTER SCHEDULER] Envoi du dernier tweet au démarrage...');

      const tweets = await this.twitterService.getLatestTweets();
      if (tweets.length === 0) {
        console.log('[TWITTER SCHEDULER] Aucun tweet trouvé');
        return;
      }

      const latestTweet = tweets[0];
      const alreadySent = await this.twitterService.isTweetAlreadySent(latestTweet.id);

      if (!alreadySent) {
        const message = this.twitterService.formatTweetForDiscord(latestTweet);
        const sent = await discordBot.sendTweet(message);

        if (sent) {
          await this.twitterService.logTweetSent(latestTweet.id);
          console.log('[TWITTER SCHEDULER] ✅ Dernier tweet envoyé au démarrage');
        }
      } else {
        console.log('[TWITTER SCHEDULER] Dernier tweet déjà envoyé, pas d\'envoi');
      }
    } catch (error) {
      console.error('[TWITTER SCHEDULER] Erreur lors de l\'envoi initial:', error.message);
    }
  }

  /**
   * Démarrer le scheduler pour vérifier les tweets
   */
  start() {
    if (this.isRunning) {
      console.log('[TWITTER SCHEDULER] Scheduler déjà actif');
      return;
    }

    const interval = process.env.TWEET_CHECK_INTERVAL || 30; // en minutes

    console.log(`[TWITTER SCHEDULER] Démarrage du scheduler - Vérification toutes les ${interval} minutes`);

    // Programmer les vérifications toutes les X minutes
    // Format cron: * * * * * = minute heure jour mois jour_semaine
    // */30 * * * * = toutes les 30 minutes
    this.cronJob = cron.schedule(`*/${interval} * * * *`, () => {
      this.checkTweets();
    });

    this.isRunning = true;
    console.log('[TWITTER SCHEDULER] ✅ Scheduler actif');
  }

  /**
   * Arrêter le scheduler
   */
  stop() {
    if (this.cronJob) {
      this.cronJob.stop();
      this.isRunning = false;
      console.log('[TWITTER SCHEDULER] Scheduler arrêté');
    }
  }

  /**
   * Vérifier et envoyer les nouveaux tweets
   */
  async checkTweets() {
    try {
      console.log(`[TWITTER SCHEDULER] Vérification des tweets à ${new Date().toLocaleString('fr-FR')}`);

      if (!discordBot.isReady) {
        console.log('[TWITTER SCHEDULER] ⚠️  Bot Discord pas encore prêt, nouvelle tentative dans 30s');
        setTimeout(() => this.checkTweets(), 30000);
        return;
      }

      // Traiter les tweets
      const sentCount = await this.twitterService.processTweets(
        (message) => discordBot.sendTweet(message)
      );

      if (sentCount === 0) {
        console.log('[TWITTER SCHEDULER] Aucun nouveau tweet à envoyer');
      }
    } catch (error) {
      console.error('[TWITTER SCHEDULER] Erreur lors de la vérification:', error.message);
    }
  }

  /**
   * Obtenir le statut du scheduler
   */
  getStatus() {
    return {
      running: this.isRunning,
      account: process.env.TWITTER_ACCOUNT,
      interval: process.env.TWEET_CHECK_INTERVAL,
      lastCheck: this.lastCheck,
    };
  }
}

// Exporter une instance unique
module.exports = new TwitterScheduler();

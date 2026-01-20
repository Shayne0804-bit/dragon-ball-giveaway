const { TwitterApi } = require('twitter-api-v2');
const TweetLog = require('../models/TweetLog');

class TwitterService {
  constructor() {
    this.client = new TwitterApi(process.env.TWITTER_BEARER_TOKEN).readOnlyClient;
    this.twitterHandle = process.env.TWITTER_ACCOUNT.replace('@', '');
    this.maxResults = 10; // Récupérer les 10 derniers tweets à chaque check
  }

  /**
   * Récupère les derniers tweets d'un compte Twitter
   * @returns {Promise<Array>} Tableau des tweets
   */
  async getLatestTweets() {
    try {
      console.log(`[Twitter] Récupération des tweets de @${this.twitterHandle}...`);

      // Récupère l'ID utilisateur
      const user = await this.client.v2.userByUsername(this.twitterHandle);
      if (!user) {
        throw new Error(`Utilisateur @${this.twitterHandle} non trouvé`);
      }

      const userId = user.data.id;

      // Récupère les tweets
      const tweets = await this.client.v2.userTimeline(userId, {
        max_results: this.maxResults,
        'tweet.fields': ['created_at', 'public_metrics'],
        'expansions': ['author_id'],
        'user.fields': ['username', 'name', 'profile_image_url'],
      });

      if (!tweets.data || tweets.data.length === 0) {
        console.log(`[Twitter] Aucun nouveau tweet trouvé pour @${this.twitterHandle}`);
        return [];
      }

      console.log(`[Twitter] ${tweets.data.length} tweets récupérés`);
      return tweets.data;
    } catch (error) {
      console.error('[Twitter] Erreur lors de la récupération des tweets:', error.message);
      return [];
    }
  }

  /**
   * Vérifie si un tweet a déjà été envoyé
   * @param {string} tweetId - ID du tweet Twitter
   * @returns {Promise<boolean>}
   */
  async isTweetAlreadySent(tweetId) {
    try {
      const result = await TweetLog.findOne({ tweetId });
      return !!result;
    } catch (error) {
      console.error('[Twitter] Erreur lors de la vérification du tweet:', error.message);
      return false;
    }
  }

  /**
   * Enregistre qu'un tweet a été envoyé
   * @param {string} tweetId - ID du tweet Twitter
   */
  async logTweetSent(tweetId) {
    try {
      await TweetLog.create({
        tweetId,
        sentAt: new Date(),
      });
      console.log(`[Twitter] Tweet ${tweetId} enregistré comme envoyé`);
    } catch (error) {
      console.error('[Twitter] Erreur lors de l\'enregistrement du tweet:', error.message);
    }
  }

  /**
   * Formate un tweet pour l'affichage sur Discord
   * @param {Object} tweet - Objet tweet
   * @returns {string} Message formaté
   */
  formatTweetForDiscord(tweet) {
    const tweetUrl = `https://twitter.com/${this.twitterHandle}/status/${tweet.id}`;
    const timestamp = new Date(tweet.created_at).toLocaleString('fr-FR');

    return `
🐦 **Nouveau tweet de @${this.twitterHandle}**
━━━━━━━━━━━━━━━━━━━━━
${tweet.text}
━━━━━━━━━━━━━━━━━━━━━
📊 ${tweet.public_metrics.like_count} ❤️ | ${tweet.public_metrics.retweet_count} 🔄 | ${tweet.public_metrics.reply_count} 💬
🔗 [Voir sur Twitter](${tweetUrl})
📅 ${timestamp}
    `.trim();
  }

  /**
   * Traite les nouveaux tweets et envoie les non-envoyés
   * @param {function} sendToDiscord - Fonction pour envoyer à Discord
   * @returns {Promise<number>} Nombre de tweets envoyés
   */
  async processTweets(sendToDiscord) {
    try {
      const tweets = await this.getLatestTweets();
      if (tweets.length === 0) return 0;

      let sentCount = 0;

      // Traiter les tweets du plus ancien au plus récent
      for (const tweet of tweets.reverse()) {
        const alreadySent = await this.isTweetAlreadySent(tweet.id);

        if (!alreadySent) {
          const message = this.formatTweetForDiscord(tweet);
          const sent = await sendToDiscord(message);

          if (sent) {
            await this.logTweetSent(tweet.id);
            sentCount++;
          }
        }
      }

      console.log(`[Twitter] ${sentCount} nouveau(x) tweet(s) envoyé(s)`);
      return sentCount;
    } catch (error) {
      console.error('[Twitter] Erreur lors du traitement des tweets:', error.message);
      return 0;
    }
  }
}

module.exports = TwitterService;

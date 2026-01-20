const axios = require('axios');
const TweetLog = require('../models/TweetLog');

class TwitterService {
  constructor() {
    this.twitterHandle = process.env.TWITTER_ACCOUNT.replace('@', '');
    // API twiiit.com (gratuit, sans authentification)
    this.apiUrl = 'https://api.twiiit.com/search';
    this.maxResults = 10;
    
    // Client axios avec timeout et User-Agent
    this.client = axios.create({
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });
  }

  /**
   * Récupère les derniers tweets via twiiit.com (gratuit)
   * @returns {Promise<Array>} Tableau des tweets
   */
  async getLatestTweets() {
    try {
      console.log(`[Twitter] Récupération des tweets de @${this.twitterHandle} via twiiit.com...`);
      
      const response = await this.client.get(this.apiUrl, {
        params: {
          q: `from:${this.twitterHandle}`,
          count: this.maxResults,
          sort: 'latest',
        },
      });

      if (!response.data || !response.data.statuses || response.data.statuses.length === 0) {
        console.log(`[Twitter] Aucun tweet trouvé pour @${this.twitterHandle}`);
        return [];
      }

      const tweets = response.data.statuses.map(tweet => ({
        id: tweet.id_str || tweet.id,
        text: tweet.full_text || tweet.text,
        created_at: tweet.created_at,
        public_metrics: {
          like_count: tweet.favorite_count || 0,
          retweet_count: tweet.retweet_count || 0,
          reply_count: tweet.reply_count || 0,
        },
        link: `https://twitter.com/${this.twitterHandle}/status/${tweet.id_str || tweet.id}`,
      }));

      console.log(`✅ [Twitter] ${tweets.length} tweets récupérés avec succès`);
      return tweets;
    } catch (error) {
      console.error('[Twitter] Erreur lors de la récupération via twiiit.com:');
      console.error(`   Type: ${error.code || error.message}`);
      console.error(`   Status: ${error.response?.status || 'N/A'}`);
      console.error(`   Message: ${error.message}`);
      return [];
    }
  }

  /**
   * Vérifie si un tweet a déjà été envoyé
   * @param {string} tweetId - ID du tweet
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
   * @param {string} tweetId - ID du tweet
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
    const timestamp = new Date(tweet.created_at).toLocaleString('fr-FR');

    return `
🐦 **Nouveau tweet de @${this.twitterHandle}**
━━━━━━━━━━━━━━━━━━━━━
${tweet.text}
━━━━━━━━━━━━━━━━━━━━━
❤️ ${tweet.public_metrics.like_count} | 🔄 ${tweet.public_metrics.retweet_count} | 💬 ${tweet.public_metrics.reply_count}
🔗 [Voir sur Twitter](${tweet.link})
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

      if (sentCount > 0) {
        console.log(`[Twitter] ✅ ${sentCount} nouveau(x) tweet(s) envoyé(s)`);
      }
      return sentCount;
    } catch (error) {
      console.error('[Twitter] Erreur lors du traitement des tweets:', error.message);
      return 0;
    }
  }
}

module.exports = TwitterService;

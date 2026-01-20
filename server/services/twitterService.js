const Parser = require('rss-parser');
const TweetLog = require('../models/TweetLog');

class TwitterService {
  constructor() {
    this.parser = new Parser();
    this.twitterHandle = process.env.TWITTER_ACCOUNT.replace('@', '');
    // URL RSS pour récupérer les tweets (gratuit avec Nitter)
    this.rssUrl = `https://nitter.net/${this.twitterHandle}/rss`;
    this.maxResults = 10;
  }

  /**
   * Récupère les derniers tweets via RSS (gratuit)
   * @returns {Promise<Array>} Tableau des tweets
   */
  async getLatestTweets() {
    try {
      console.log(`[Twitter] Récupération des tweets de @${this.twitterHandle} via RSS...`);
      console.log(`[Twitter] URL RSS: ${this.rssUrl}`);

      const feed = await this.parser.parseURL(this.rssUrl);
      
      if (!feed.items || feed.items.length === 0) {
        console.log(`[Twitter] Aucun tweet trouvé pour @${this.twitterHandle}`);
        return [];
      }

      // Limiter aux N derniers tweets
      const tweets = feed.items.slice(0, this.maxResults).map(item => ({
        id: item.guid || item.link, // Utiliser le GUID ou le lien comme ID unique
        text: this.extractText(item.content || item.description),
        created_at: item.pubDate,
        public_metrics: {
          like_count: 0, // RSS ne fournit pas ces infos
          retweet_count: 0,
          reply_count: 0,
        },
        link: item.link,
      }));

      console.log(`[Twitter] ${tweets.length} tweets récupérés`);
      return tweets;
    } catch (error) {
      console.error('[Twitter] Erreur lors de la récupération du flux RSS:', error.message);
      // Fallback: essayer avec un autre service RSS
      console.log('[Twitter] Tentative avec service alternatif...');
      return this.getLatestTweetsAlternative();
    }
  }

  /**
   * Fallback avec un autre service RSS
   */
  async getLatestTweetsAlternative() {
    try {
      const rssUrlAlt = `https://feeds.nitter.net/${this.twitterHandle}/rss`;
      console.log(`[Twitter] Tentative avec URL alternative: ${rssUrlAlt}`);
      
      const feed = await this.parser.parseURL(rssUrlAlt);
      
      if (!feed.items || feed.items.length === 0) {
        return [];
      }

      const tweets = feed.items.slice(0, this.maxResults).map(item => ({
        id: item.guid || item.link,
        text: this.extractText(item.content || item.description),
        created_at: item.pubDate,
        public_metrics: {
          like_count: 0,
          retweet_count: 0,
          reply_count: 0,
        },
        link: item.link,
      }));

      console.log(`[Twitter] ${tweets.length} tweets récupérés (alternative)`);
      return tweets;
    } catch (error) {
      console.error('[Twitter] Erreur avec URL alternative:', error.message);
      return [];
    }
  }

  /**
   * Extraire le texte du tweet (nettoyer le HTML)
   */
  extractText(html) {
    if (!html) return '';
    // Supprimer les balises HTML
    let text = html.replace(/<[^>]*>/g, '');
    // Décoder les entités HTML
    text = text
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");
    return text.trim();
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

      console.log(`[Twitter] ${sentCount} nouveau(x) tweet(s) envoyé(s)`);
      return sentCount;
    } catch (error) {
      console.error('[Twitter] Erreur lors du traitement des tweets:', error.message);
      return 0;
    }
  }
}

module.exports = TwitterService;

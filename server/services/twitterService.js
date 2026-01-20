const Parser = require('rss-parser');
const TweetLog = require('../models/TweetLog');

class TwitterService {
  constructor() {
    this.parser = new Parser({
      timeout: 10000, // Timeout 10s
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });
    this.twitterHandle = process.env.TWITTER_ACCOUNT.replace('@', '');
    // Plusieurs instances Nitter (fallback)
    this.nitterInstances = [
      `https://nitter.net/${this.twitterHandle}/rss`,
      `https://nitter.1d4.us/${this.twitterHandle}/rss`,
      `https://nitter.privacy.com.de/${this.twitterHandle}/rss`,
      `https://nitter.poast.org/${this.twitterHandle}/rss`,
    ];
    this.maxResults = 10;
  }

  /**
   * Récupère les derniers tweets via RSS (gratuit)
   * @returns {Promise<Array>} Tableau des tweets
   */
  async getLatestTweets() {
    try {
      console.log(`[Twitter] Récupération des tweets de @${this.twitterHandle} via RSS...`);
      
      // Essayer toutes les instances Nitter
      for (let i = 0; i < this.nitterInstances.length; i++) {
        try {
          const rssUrl = this.nitterInstances[i];
          console.log(`[Twitter] Tentative ${i + 1}/${this.nitterInstances.length}: ${rssUrl}`);
          
          const feed = await this.parser.parseURL(rssUrl);
          
          if (feed.items && feed.items.length > 0) {
            console.log(`✅ [Twitter] Succès avec: ${rssUrl}`);
            return this.formatTweets(feed.items);
          }
        } catch (error) {
          console.log(`❌ [Twitter] Échec avec instance ${i + 1}: ${error.message}`);
          // Continuer vers la prochaine instance
          if (i < this.nitterInstances.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 1000)); // Attendre 1s
          }
        }
      }
      
      console.log(`[Twitter] Aucune instance Nitter n'a fonctionné`);
      return [];
    } catch (error) {
      console.error('[Twitter] Erreur générale lors de la récupération:', error.message);
      return [];
    }
  }

  /**
   * Formate les tweets du flux RSS
   */
  formatTweets(items) {
    return items.slice(0, this.maxResults).map(item => ({
      id: item.guid || item.link, // Utiliser le GUID ou le lien comme ID unique
      text: this.extractText(item.content || item.description),
      created_at: item.pubDate,
      public_metrics: {
        like_count: 0,
        retweet_count: 0,
        reply_count: 0,
      },
      link: item.link,
    }));
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

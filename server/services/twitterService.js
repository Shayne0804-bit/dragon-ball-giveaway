const Parser = require('rss-parser');
const TweetLog = require('../models/TweetLog');

class TwitterService {
  constructor() {
    this.parser = new Parser({
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });
    this.twitterHandle = process.env.TWITTER_ACCOUNT.replace('@', '');
    // Instances Nitter publiques et stables
    this.nitterInstances = [
      `https://nitter.poast.org/${this.twitterHandle}/rss`,
      `https://nitter.cz/${this.twitterHandle}/rss`,
      `https://nitter.fdn.fr/${this.twitterHandle}/rss`,
      `https://nitter.1d4.us/${this.twitterHandle}/rss`,
      `https://nitter.net/${this.twitterHandle}/rss`,
    ];
    this.maxResults = 10;
  }

  /**
   * Récupère les derniers tweets via RSS Nitter (léger & gratuit)
   * @returns {Promise<Array>} Tableau des tweets
   */
  async getLatestTweets() {
    console.log(`[Twitter] Récupération des tweets de @${this.twitterHandle} via RSS Nitter...`);
    
    // Essayer toutes les instances Nitter
    for (let i = 0; i < this.nitterInstances.length; i++) {
      try {
        const rssUrl = this.nitterInstances[i];
        console.log(`[Twitter] Tentative ${i + 1}/${this.nitterInstances.length}: ${rssUrl}`);
        
        const feed = await this.parser.parseURL(rssUrl);
        
        if (feed.items && feed.items.length > 0) {
          console.log(`✅ [Twitter] Succès avec: ${rssUrl}`);
          
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
          
          console.log(`[Twitter] ${tweets.length} tweets récupérés`);
          return tweets;
        }
      } catch (error) {
        console.log(`❌ [Twitter] Échec avec instance ${i + 1}: ${error.message}`);
        if (i < this.nitterInstances.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }
    
    console.error(`[Twitter] ❌ Aucune instance Nitter n'a fonctionné`);
    return [];
  }

  /**
   * Extraire le texte du tweet (nettoyer le HTML)
   */
  extractText(html) {
    if (!html) return '';
    let text = html.replace(/<[^>]*>/g, '');
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

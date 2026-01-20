const axios = require('axios');
const cheerio = require('cheerio');
const TweetLog = require('../models/TweetLog');

class TwitterService {
  constructor() {
    this.twitterHandle = process.env.TWITTER_ACCOUNT.replace('@', '');
    // URL du profil sur twiiit.com
    this.profileUrl = `https://twiiit.com/user/${this.twitterHandle}`;
    this.maxResults = 10;
    
    // Client axios avec User-Agent
    this.client = axios.create({
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
    });
  }

  /**
   * Récupère les derniers tweets en scrapant twiiit.com
   * @returns {Promise<Array>} Tableau des tweets
   */
  async getLatestTweets() {
    try {
      console.log(`[Twitter] Scraping les tweets de @${this.twitterHandle} depuis twiiit.com...`);
      console.log(`[Twitter] URL: ${this.profileUrl}`);
      
      const response = await this.client.get(this.profileUrl);
      const $ = cheerio.load(response.data);
      
      const tweets = [];
      
      // Chercher les tweets dans les divs avec classe "tweet" ou "status"
      const tweetElements = $('[data-test-id*="tweet"], .tweet, article[data-tweet-id], .status');
      
      console.log(`[Twitter] ${tweetElements.length} éléments trouvés`);
      
      tweetElements.each((index, element) => {
        if (tweets.length >= this.maxResults) return false;
        
        try {
          const $tweet = $(element);
          
          // Extraire le texte du tweet
          const text = $tweet.find('[data-testid="tweetText"], .tweet-text, p').text().trim();
          
          // Extraire l'ID du tweet
          const tweetLink = $tweet.find('a[href*="/status/"]').attr('href') || 
                           $tweet.find('[data-testid*="tweet"] a').attr('href');
          const tweetId = tweetLink ? tweetLink.split('/status/')[1] : `tweet-${index}`;
          
          // Extraire les timestamps
          const timestamp = $tweet.find('time').attr('datetime') || new Date().toISOString();
          
          // Extraire les métriques
          const likeCount = parseInt($tweet.find('[data-testid*="Like"]').text() || 0);
          const retweetCount = parseInt($tweet.find('[data-testid*="Retweet"]').text() || 0);
          const replyCount = parseInt($tweet.find('[data-testid*="Reply"]').text() || 0);
          
          if (text) {
            tweets.push({
              id: tweetId,
              text: text,
              created_at: timestamp,
              public_metrics: {
                like_count: likeCount,
                retweet_count: retweetCount,
                reply_count: replyCount,
              },
              link: `https://twitter.com/${this.twitterHandle}/status/${tweetId}`,
            });
          }
        } catch (elementError) {
          console.log(`[Twitter] Erreur lors du parsing d'un élément: ${elementError.message}`);
        }
      });
      
      if (tweets.length === 0) {
        console.log(`[Twitter] ⚠️  Aucun tweet trouvé. Vérifiez que le compte existe.`);
      } else {
        console.log(`✅ [Twitter] ${tweets.length} tweets extraits avec succès`);
      }
      
      return tweets;
    } catch (error) {
      console.error('[Twitter] Erreur lors du scraping twiiit.com:');
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

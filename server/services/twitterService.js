const cloudscraper = require('cloudscraper');
const cheerio = require('cheerio');
const TweetLog = require('../models/TweetLog');

class TwitterService {
  constructor() {
    this.twitterHandle = process.env.TWITTER_ACCOUNT.replace('@', '');
    // URL du profil sur Nitter (contourne Cloudflare)
    this.nitterUrl = `https://nitter.space/${this.twitterHandle}`;
    this.maxResults = 10;
  }

  /**
   * Récupère les derniers tweets en scrapant Nitter.space
   * @returns {Promise<Array>} Tableau des tweets
   */
  async getLatestTweets() {
    try {
      console.log(`[Twitter] Scraping les tweets de @${this.twitterHandle} depuis Nitter.space...`);
      console.log(`[Twitter] URL: ${this.nitterUrl}`);
      
      // Utiliser cloudscraper pour contourner Cloudflare
      const response = await cloudscraper.get(this.nitterUrl);
      const $ = cheerio.load(response);
      
      const tweets = [];
      
      // Chercher les tweets - Nitter utilise des divs spécifiques
      const tweetElements = $('div.tweet, div[data-tweet-id]');
      
      console.log(`[Twitter] ${tweetElements.length} éléments trouvés`);
      
      tweetElements.each((index, element) => {
        if (tweets.length >= this.maxResults) return false;
        
        try {
          const $tweet = $(element);
          
          // Extraire le texte du tweet
          const text = $tweet.find('p.tweet-text, p').first().text().trim();
          
          // Extraire l'ID et le lien
          const tweetLink = $tweet.find('a[href*="/status/"]').attr('href') || 
                           $tweet.find('a').attr('href');
          const tweetId = tweetLink ? tweetLink.split('/status/')[1]?.split('?')[0] : `tweet-${index}`;
          
          // Extraire les timestamps
          const timestamp = $tweet.find('a.tweet-date time').attr('title') || 
                           new Date().toISOString();
          
          // Extraire les métriques (likes, retweets, replies)
          const stats = $tweet.find('div.tweet-stats div.stat');
          let likeCount = 0, retweetCount = 0, replyCount = 0;
          
          stats.each((i, stat) => {
            const $stat = $(stat);
            const count = parseInt($stat.text()) || 0;
            if ($stat.find('svg').first().hasClass('like')) likeCount = count;
            if ($stat.find('svg').first().hasClass('retweet')) retweetCount = count;
            if ($stat.find('svg').first().hasClass('reply')) replyCount = count;
          });
          
          if (text && tweetId && tweetId !== `tweet-${index}`) {
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
            console.log(`[Twitter] Tweet trouvé: ${tweetId}`);
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
      console.error('[Twitter] Erreur lors du scraping Nitter.space:');
      console.error(`   Type: ${error.code || error.message}`);
      console.error(`   Status: ${error.status || 'N/A'}`);
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

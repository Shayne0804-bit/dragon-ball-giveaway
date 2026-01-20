const axios = require('axios');
const cheerio = require('cheerio');
const TweetLog = require('../models/TweetLog');

class TwitterService {
  constructor() {
    this.twitterHandle = process.env.TWITTER_ACCOUNT.replace('@', '');
    // Instances Nitter qui fonctionnent bien
    this.nitterInstances = [
      `https://nitter.space/${this.twitterHandle}`,
      `https://nitter.net/${this.twitterHandle}`,
      `https://nitter.1d4.us/${this.twitterHandle}`,
    ];
    this.maxResults = 10;
    
    // Client axios avec headers complets pour faire croire à un vrai navigateur
    this.client = axios.create({
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Cache-Control': 'max-age=0',
      },
    });
  }

  /**
   * Récupère les derniers tweets en scrapant Nitter
   * @returns {Promise<Array>} Tableau des tweets
   */
  async getLatestTweets() {
    try {
      console.log(`[Twitter] Scraping les tweets de @${this.twitterHandle} depuis Nitter...`);
      
      // Essayer chaque instance Nitter
      for (let attempt = 0; attempt < this.nitterInstances.length; attempt++) {
        try {
          const url = this.nitterInstances[attempt];
          console.log(`[Twitter] Tentative ${attempt + 1}/${this.nitterInstances.length}: ${url}`);
          
          // Ajouter un délai pour éviter les blocages
          if (attempt > 0) {
            console.log(`[Twitter] Attente 3s avant retry...`);
            await new Promise(resolve => setTimeout(resolve, 3000));
          }
          
          const response = await this.client.get(url);
          const $ = cheerio.load(response.data);
          
          const tweets = [];
          
          // Chercher les tweets dans les divs Nitter
          const tweetElements = $('div.tweet, .timeline-item');
          
          console.log(`[Twitter] ${tweetElements.length} éléments trouvés`);
          
          tweetElements.each((index, element) => {
            if (tweets.length >= this.maxResults) return false;
            
            try {
              const $tweet = $(element);
              
              // Extraire le texte du tweet
              const text = $tweet.find('.tweet-text').text().trim();
              
              // Extraire l'ID du tweet via le lien
              const tweetLink = $tweet.find('a[href*="/"][href*="/status/"]').attr('href') || '';
              const tweetId = tweetLink.match(/\/status\/(\d+)/)?.[1] || `tweet-${index}`;
              
              // Extraire le timestamp
              const timeStr = $tweet.find('a.tweet-date').attr('title') || new Date().toISOString();
              
              // Extraire les métriques
              const stats = $tweet.find('.tweet-stats span');
              let replyCount = 0, retweetCount = 0, likeCount = 0;
              
              stats.each((i, stat) => {
                const text = $(stat).text().trim();
                if (text.includes('Reply')) replyCount = parseInt(text) || 0;
                if (text.includes('Retweet')) retweetCount = parseInt(text) || 0;
                if (text.includes('Like')) likeCount = parseInt(text) || 0;
              });
              
              if (text) {
                tweets.push({
                  id: tweetId,
                  text: text,
                  created_at: timeStr,
                  public_metrics: {
                    like_count: likeCount,
                    retweet_count: retweetCount,
                    reply_count: replyCount,
                  },
                  link: `https://twitter.com/${this.twitterHandle}/status/${tweetId}`,
                });
              }
            } catch (elementError) {
              console.log(`[Twitter] Erreur parsing élément: ${elementError.message}`);
            }
          });
          
          if (tweets.length > 0) {
            console.log(`✅ [Twitter] ${tweets.length} tweets extraits depuis ${url}`);
            return tweets;
          } else {
            console.log(`⚠️  [Twitter] Aucun tweet trouvé dans ${url}`);
          }
        } catch (error) {
          console.error(`❌ [Twitter] Erreur avec ${this.nitterInstances[attempt]}: ${error.message}`);
        }
      }
      
      console.error(`[Twitter] ❌ Aucune instance Nitter n'a fonctionné`);
      return [];
    } catch (error) {
      console.error('[Twitter] Erreur générale lors du scraping:');
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

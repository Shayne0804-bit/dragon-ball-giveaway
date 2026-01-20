const puppeteer = require('puppeteer');
const TweetLog = require('../models/TweetLog');

class TwitterService {
  constructor() {
    this.twitterHandle = process.env.TWITTER_ACCOUNT.replace('@', '');
    // URL du profil sur twiiit.com
    this.profileUrl = `https://twiiit.com/user/${this.twitterHandle}`;
    this.maxResults = 10;
    this.browser = null;
  }

  /**
   * Initialiser le navigateur Puppeteer
   */
  async initBrowser() {
    if (!this.browser) {
      try {
        console.log('[Twitter] Initialisation du navigateur Puppeteer...');
        this.browser = await puppeteer.launch({
          headless: 'new',
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-gpu',
            '--disable-dev-shm-usage', // Important pour éviter les problèmes de mémoire
          ],
        });
        console.log('✅ [Twitter] Navigateur prêt');
      } catch (error) {
        console.error('[Twitter] Erreur lors du lancement du navigateur:', error.message);
        throw error;
      }
    }
    return this.browser;
  }

  /**
   * Récupère les derniers tweets via Puppeteer + twiiit.com
   * @returns {Promise<Array>} Tableau des tweets
   */
  async getLatestTweets() {
    let page = null;
    try {
      console.log(`[Twitter] Scraping les tweets de @${this.twitterHandle} avec Puppeteer...`);
      
      const browser = await this.initBrowser();
      page = await browser.newPage();
      
      // Configurer les timeouts
      await page.setDefaultNavigationTimeout(30000);
      await page.setDefaultTimeout(15000);
      
      // Définir l'User-Agent
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
      
      console.log(`[Twitter] Navigation vers: ${this.profileUrl}`);
      await page.goto(this.profileUrl, { waitUntil: 'networkidle2' });
      
      // Attendre que les tweets chargent
      await page.waitForSelector('article, [data-testid*="tweet"]', { timeout: 10000 }).catch(() => {
        console.log('[Twitter] Pas de tweets trouvés avec les sélecteurs habituels');
      });
      
      // Scroller pour charger plus de tweets
      console.log('[Twitter] Scroll pour charger plus de tweets...');
      await page.evaluate(() => {
        window.scrollBy(0, window.innerHeight);
      });
      await page.waitForTimeout(2000);
      
      // Extraire les tweets via JavaScript
      const tweets = await page.evaluate((maxResults) => {
        const tweetElements = document.querySelectorAll('article, [data-testid*="tweet"], .tweet-item');
        const tweets = [];
        
        tweetElements.forEach((element, index) => {
          if (tweets.length >= maxResults) return;
          
          try {
            // Extraire le texte
            const textElement = element.querySelector('[data-testid="tweetText"], p, .tweet-text');
            const text = textElement ? textElement.innerText.trim() : '';
            
            if (!text) return; // Passer les éléments vides
            
            // Extraire le lien du tweet
            const linkElement = element.querySelector('a[href*="/status/"]');
            const link = linkElement ? linkElement.getAttribute('href') : '';
            const tweetId = link ? link.split('/status/')[1] : `tweet-${index}`;
            
            // Extraire le timestamp
            const timeElement = element.querySelector('time');
            const timestamp = timeElement ? timeElement.getAttribute('datetime') : new Date().toISOString();
            
            // Extraire les métriques
            const statsElements = element.querySelectorAll('[data-testid*="Count"], .stat-count');
            let likeCount = 0, retweetCount = 0, replyCount = 0;
            
            statsElements.forEach((stat) => {
              const text = stat.innerText || stat.textContent;
              if (text && !isNaN(parseInt(text))) {
                const count = parseInt(text);
                // Ordre typique: Reply, Retweet, Like
                if (!replyCount && replyCount !== 0) replyCount = count;
                else if (!retweetCount && retweetCount !== 0) retweetCount = count;
                else if (!likeCount && likeCount !== 0) likeCount = count;
              }
            });
            
            tweets.push({
              id: tweetId,
              text: text,
              created_at: timestamp,
              public_metrics: {
                like_count: likeCount,
                retweet_count: retweetCount,
                reply_count: replyCount,
              },
              link: link,
            });
          } catch (error) {
            console.error(`Erreur lors du parsing d'un élément: ${error.message}`);
          }
        });
        
        return tweets;
      }, this.maxResults);
      
      if (tweets.length === 0) {
        console.log(`[Twitter] ⚠️  Aucun tweet trouvé. Vérifiez que le compte existe.`);
      } else {
        console.log(`✅ [Twitter] ${tweets.length} tweets extraits avec succès`);
      }
      
      return tweets;
    } catch (error) {
      console.error('[Twitter] Erreur lors du scraping:');
      console.error(`   Type: ${error.code || error.name}`);
      console.error(`   Message: ${error.message}`);
      return [];
    } finally {
      if (page) {
        await page.close().catch(() => {});
      }
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

  /**
   * Fermer le navigateur proprement
   */
  async closeBrowser() {
    if (this.browser) {
      try {
        await this.browser.close();
        this.browser = null;
        console.log('[Twitter] Navigateur Puppeteer fermé');
      } catch (error) {
        console.error('[Twitter] Erreur lors de la fermeture du navigateur:', error.message);
      }
    }
  }
}

module.exports = TwitterService;

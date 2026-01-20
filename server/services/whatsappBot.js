const makeWASocket = require('@whiskeysockets/baileys').default;
const { useMultiFileAuthState, DisconnectReason, isJidBroadcast } = require('@whiskeysockets/baileys');
const P = require('pino');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const CommandHandler = require('./whatsappCommandHandler');
const WhatsAppMessageHandlers = require('./whatsappMessageHandlers');

class WhatsAppBotService {
  constructor() {
    this.sock = null;
    this.isReady = false;
    this.phoneNumber = process.env.WHATSAPP_PHONE_NUMBER;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.commandHandler = null;
    this.messageHandlers = null;
    this.lastQRCode = null; // Stocker le dernier QR code
    this.qrGenerated = false; // Flag pour savoir si QR a été généré
    
    // Déterminer l'URL du site
    let siteUrl = process.env.CORS_ORIGIN;
    if (!siteUrl || siteUrl === 'undefined') {
      if (process.env.RAILWAY_PUBLIC_DOMAIN) {
        siteUrl = `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`;
      } else {
        siteUrl = 'http://localhost:5000';
      }
    }
    
    this.siteUrl = siteUrl;
    this.apiUrl = `${siteUrl}/api`;
    console.log('[WHATSAPP] Site URL configurée:', this.siteUrl);
    console.log('[WHATSAPP] API URL configurée:', this.apiUrl);
  }

  /**
   * Initialiser le bot WhatsApp avec Baileys
   */
  async initialize() {
    try {
      console.log('[WHATSAPP] Initialisation du bot avec Baileys...');
      
      const authPath = path.join(__dirname, '../../whatsapp_auth');
      
      // Créer le dossier auth s'il n'existe pas
      if (!fs.existsSync(authPath)) {
        fs.mkdirSync(authPath, { recursive: true });
      }

      const { state, saveCreds } = await useMultiFileAuthState(authPath);

      // Vérifier si une session existe déjà
      const hasExistingAuth = Object.keys(state.creds || {}).length > 0;
      if (hasExistingAuth) {
        console.log('[WHATSAPP] Session authentifiée détectée - Reconnexion directe');
      }

      // Logger configuration
      const logger = P({ level: 'silent' });

      // Créer la socket
      this.sock = makeWASocket({
        auth: state,
        logger,
        browser: ['Dragon Ball Giveaway', 'Chrome', '120.0.0.0'],
        syncFullHistory: false,
        markOnlineOnConnect: true,
        generateHighQualityLinkPreview: true,
      });

      // Initialiser le gestionnaire de commandes
      this.commandHandler = new CommandHandler(this);
      this.messageHandlers = new WhatsAppMessageHandlers(this);
      console.log('[WHATSAPP] CommandHandler et MessageHandlers initialisés');

      // Sauvegarder les credentials
      this.sock.ev.on('creds.update', saveCreds);

      // Connexion
      this.sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, isNewLogin, qr } = update;

        // Mode production - désactiver QR code après la première authentification
        const isProduction = process.env.NODE_ENV === 'production';
        
        // QR Code - Seulement si :
        // 1. C'est une nouvelle connexion (isNewLogin)
        // 2. Et pas en production avec session existante
        if (qr) {
          if (isNewLogin && !hasExistingAuth) {
            // Première connexion - afficher le QR
            console.log('[WHATSAPP] ⚠️  PREMIÈRE CONNEXION - QR Code généré');
            console.log('[WHATSAPP] Scannez le code ci-dessous avec WhatsApp:');
            qrcode.generate(qr, { small: false, width: 10 });
            this.lastQRCode = qr;
            this.qrGenerated = true;
            console.log('[WHATSAPP] Code scanné? Attendez la connexion...');
          } else if (!isNewLogin || hasExistingAuth) {
            // Reconnexion avec session existante - pas de QR
            if (this.qrGenerated) {
              console.log('[WHATSAPP] Session authentifiée détectée - Reconnexion sans QR');
            }
          }
        }

        if (connection === 'open') {
          this.isReady = true;
          this.reconnectAttempts = 0;
          if (isNewLogin && !hasExistingAuth) {
            console.log('[WHATSAPP] ✅ Authentification réussie - Session sauvegardée');
            console.log('[WHATSAPP] 🎉 Bot connecté et prêt à l\'emploi');
          } else if (hasExistingAuth) {
            console.log('[WHATSAPP] ✅ Connexion avec session persistante');
            console.log('[WHATSAPP] 🎉 Bot reconnecté et prêt');
          }
        }

        if (connection === 'close') {
          const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
          
          if (shouldReconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
            console.log(`[WHATSAPP] ⚠️  Déconnecté, reconnexion en ${delay/1000}s (tentative ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
            this.isReady = false;
            
            setTimeout(() => {
              if (this.reconnectAttempts <= this.maxReconnectAttempts) {
                this.initialize();
              }
            }, delay);
          } else {
            console.log('[WHATSAPP] Connexion fermée - reconnexion arrêtée');
            this.isReady = false;
          }
        }

        if (isNewLogin) {
          console.log('[WHATSAPP] Nouvelle connexion établie');
        }
      });

      // Gérer les messages
      this.sock.ev.on('messages.upsert', async (m) => {
        await this.handleMessages(m.messages);
      });

      return true;
    } catch (error) {
      console.error('[WHATSAPP] Erreur lors de l\'initialisation:', error.message);
      return false;
    }
  }

  /**
   * Traiter les messages reçus
   */
  async handleMessages(messages) {
    try {
      for (const message of messages) {
        // Ignorer les messages sortants et les broadcasts
        if (message.key.fromMe || isJidBroadcast(message.key.remoteJid)) {
          continue;
        }

        const sender = message.key.remoteJid;
        const messageBody = message.message?.conversation || 
                           message.message?.extendedTextMessage?.text || '';

        console.log(`[WHATSAPP] Message de ${sender}: ${messageBody}`);

        // Traiter le message
        await this.processMessage(sender, messageBody);
      }
    } catch (error) {
      console.error('[WHATSAPP] Erreur lors du traitement des messages:', error.message);
    }
  }

  /**
   * Traiter un message spécifique
   */
  async processMessage(sender, messageBody) {
    try {
      // Check if message starts with command prefix
      const prefix = process.env.WHATSAPP_COMMAND_PREFIX || '.';
      
      if (messageBody.startsWith(prefix)) {
        // Try to handle as a command
        if (this.commandHandler) {
          const parsed = this.commandHandler.parseCommand(messageBody);
          if (parsed) {
            await this.commandHandler.handleCommand(
              parsed.command,
              parsed.args,
              sender,
              this
            );
            return;
          }
        }
      }
      
      // Default response for non-command messages
      await this.sendMessage(sender, 
        `👋 Bienvenue sur Dragon Ball Giveaway!\n\n` +
        `Tapez ${prefix}help pour voir les commandes disponibles.\n\n` +
        `🎁 Lien du site: ${this.siteUrl}`
      );
    } catch (error) {
      console.error('[WHATSAPP] Erreur lors du traitement du message:', error.message);
      await this.sendMessage(sender, 
        '⚠️ Une erreur est survenue lors du traitement de votre message'
      );
    }
  }

  /**
   * Envoyer un message
   */
  async sendMessage(to, message) {
    try {
      if (!this.sock || !this.isReady) {
        throw new Error('Bot non connecté');
      }

      await this.sock.sendMessage(to, { text: message });
      console.log(`[WHATSAPP] Message envoyé à ${to}`);
    } catch (error) {
      console.error('[WHATSAPP] Erreur lors de l\'envoi du message:', error.message);
    }
  }

  /**
   * Envoyer un message avec média
   */
  async sendMediaMessage(to, mediaPath, caption = '') {
    try {
      if (!this.sock || !this.isReady) {
        throw new Error('Bot non connecté');
      }

      if (!fs.existsSync(mediaPath)) {
        throw new Error('Fichier média non trouvé');
      }

      const media = fs.readFileSync(mediaPath);
      const mediaType = this.getMediaType(mediaPath);

      await this.sock.sendMessage(to, {
        [mediaType]: media,
        caption: caption || undefined,
      });

      console.log(`[WHATSAPP] Média envoyé à ${to}`);
    } catch (error) {
      console.error('[WHATSAPP] Erreur lors de l\'envoi du média:', error.message);
    }
  }

  /**
   * Déterminer le type de média
   */
  getMediaType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    if (['.jpg', '.jpeg', '.png', '.gif'].includes(ext)) return 'image';
    if (['.mp4', '.mov', '.avi'].includes(ext)) return 'video';
    if (['.mp3', '.m4a', '.wav'].includes(ext)) return 'audio';
    if (['.pdf', '.doc', '.docx'].includes(ext)) return 'document';
    return 'document';
  }

  /**
   * Obtenir les informations du bot
   */
  async getBotInfo() {
    try {
      if (!this.sock || !this.isReady) {
        return null;
      }

      const user = this.sock.user;
      return {
        phoneNumber: user?.id,
        name: user?.name,
        isReady: this.isReady,
      };
    } catch (error) {
      console.error('[WHATSAPP] Erreur lors de la récupération des infos:', error.message);
      return null;
    }
  }

  /**
   * Arrêter le bot
   */
  async stop() {
    try {
      if (this.sock) {
        await this.sock.logout();
        this.isReady = false;
        console.log('[WHATSAPP] Bot arrêté');
      }
    } catch (error) {
      console.error('[WHATSAPP] Erreur lors de l\'arrêt du bot:', error.message);
    }
  }

  /**
   * Redémarrer le bot
   */
  async restart() {
    try {
      await this.stop();
      await this.initialize();
      console.log('[WHATSAPP] Bot redémarré');
    } catch (error) {
      console.error('[WHATSAPP] Erreur lors du redémarrage:', error.message);
    }
  }

  /**
   * Vérifier si le bot est prêt
   */
  isConnected() {
    return this.isReady && this.sock !== null;
  }
}

module.exports = WhatsAppBotService;

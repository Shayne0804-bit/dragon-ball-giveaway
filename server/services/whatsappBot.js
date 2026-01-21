const makeWASocket = require('@whiskeysockets/baileys').default;
const { useMultiFileAuthState, DisconnectReason, isJidBroadcast } = require('@whiskeysockets/baileys');
const P = require('pino');
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const CommandHandler = require('./whatsappCommandHandler');
const WhatsAppMessageHandlers = require('./whatsappMessageHandlers');
const WhatsappSession = require('../models/WhatsappSession');
const redisService = require('./redisService');
const WhatsAppHeartbeat = require('./whatsappHeartbeat');

class WhatsAppBotService {
  constructor() {
    this.sock = null;
    this.isReady = false;
    this.redis = redisService; // Injecter Redis
    this.heartbeat = null; // Service heartbeat
    
    // Nettoyer le numéro: enlever les espaces et caractères spéciaux, garder juste les chiffres
    const rawPhone = process.env.WHATSAPP_PHONE_NUMBER || '';
    // Extraire uniquement les chiffres
    let cleanPhone = rawPhone.replace(/[^0-9]/g, '').trim();
    
    if (!cleanPhone) {
      throw new Error('❌ WHATSAPP_PHONE_NUMBER non configuré dans les variables d\'environnement');
    }
    
    // Stocker le numéro sans le + (pour Baileys et requestPairingCode)
    this.phoneNumber = cleanPhone;
    
    // Aussi stocker avec le + pour les JID (format WhatsApp)
    this.phoneNumberWithPlus = '+' + cleanPhone;
    
    console.log(`[WHATSAPP] 📱 Numéro du bot (sans +): ${this.phoneNumber}`);
    console.log(`[WHATSAPP] 📱 Numéro du bot (avec +): ${this.phoneNumberWithPlus}`);
    
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.commandHandler = null;
    this.messageHandlers = null;
    this.lastPairingCode = null; // Stocker le dernier code d'appairage
    
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
      
      // Initialiser Redis avec fallback
      console.log('[WHATSAPP] 🔄 Initialisation de Redis...');
      await this.redis.initialize();
      const redisStats = await this.redis.getStats();
      console.log(`[WHATSAPP] Redis mode: ${redisStats.mode} (Connecté: ${redisStats.redisConnected})`);
      
      // Déterminer le chemin pour sauvegarder les credentials
      const authPath = process.env.WHATSAPP_AUTH_PATH || path.join(__dirname, '../../whatsapp_auth');
      
      console.log(`[WHATSAPP] 📁 Chemin de sauvegarde des credentials: ${authPath}`);
      
      // Créer le dossier auth s'il n'existe pas
      if (!fs.existsSync(authPath)) {
        console.log('[WHATSAPP] 📁 Création du dossier auth...');
        fs.mkdirSync(authPath, { recursive: true });
      }

      // Vérifier les fichiers existants
      const authFiles = fs.readdirSync(authPath);
      console.log(`[WHATSAPP] 📁 Fichiers trouvés dans ${authPath}:`, authFiles.length > 0 ? authFiles : 'AUCUN');

      // Essayer de charger depuis Redis EN PRIORITÉ
      let redisSession = null;
      try {
        console.log('[WHATSAPP] 🔍 Recherche de session dans Redis...');
        redisSession = await this.redis.loadCredentials();
        if (redisSession) {
          console.log('[WHATSAPP] ✅ Session trouvée dans Redis - Restauration rapide');
        } else {
          console.log('[WHATSAPP] ℹ️  Aucune session dans Redis');
        }
      } catch (error) {
        console.warn('[WHATSAPP] ⚠️  Impossible de charger depuis Redis:', error.message);
      }

      // Fallback: Essayer MongoDB si Redis n'a rien
      let mongoSession = null;
      if (!redisSession) {
        try {
          console.log('[WHATSAPP] 🔍 Recherche de session dans MongoDB (fallback)...');
          mongoSession = await this.loadSessionFromDatabase();
          if (mongoSession) {
            console.log('[WHATSAPP] ✅ Session trouvée dans MongoDB - Fallback activé');
          } else {
            console.log('[WHATSAPP] ℹ️  Aucune session dans MongoDB');
          }
        } catch (error) {
          console.warn('[WHATSAPP] ⚠️  Impossible de charger depuis MongoDB:', error.message);
          console.warn('[WHATSAPP] ℹ️  Le bot essaiera de charger depuis les fichiers locaux');
        }
      }

      const { state, saveCreds } = await useMultiFileAuthState(authPath);

      // Restaurer les credentials - Priorité: Redis > MongoDB > Fichiers
      let sessionToRestore = redisSession || mongoSession;
      
      if (sessionToRestore && sessionToRestore.credentials) {
        try {
          console.log('[WHATSAPP] 🔄 Restauration des credentials...');
          
          // Vérifier que les credentials contiennent au minimum me.id
          if (!sessionToRestore.credentials.me || !sessionToRestore.credentials.me.id) {
            console.warn('[WHATSAPP] ⚠️  Credentials invalides (me.id manquant) - Utilisation fichiers locaux');
          } else {
            // Credentials semble valides, les restaurer
            state.creds = sessionToRestore.credentials;
            if (sessionToRestore.state) {
              Object.assign(state, sessionToRestore.state);
            }
            console.log('[WHATSAPP] ✅ Session restaurée');
            console.log('[WHATSAPP] 📱 ID du téléphone restauré:', sessionToRestore.credentials.me.id);
          }
        } catch (error) {
          console.warn('[WHATSAPP] ⚠️  Impossible de restaurer session, utilisation des fichiers locaux:', error.message);
        }
      }

      // Vérifier si une session existe déjà
      let hasExistingAuth = !!state.creds?.me?.id;
      if (hasExistingAuth) {
        console.log('[WHATSAPP] ✅ Session authentifiée détectée - Reconnexion directe');
        console.log(`[WHATSAPP] ✅ ID du téléphone: ${state.creds.me.id}`);
        console.log(`[WHATSAPP] ✅ Plateforme: ${state.creds.platform || 'inconnue'}`);
      } else {
        console.log('[WHATSAPP] ⚠️  Pas de session authentifiée - Code d\'appairage sera généré');
      }

      // Logger configuration
      const logger = P({ level: 'silent' });

      // Créer la socket avec support des pairing codes
      this.sock = makeWASocket({
        auth: state,
        logger,
        browser: ['Dragon Ball Giveaway', 'Chrome', '120.0.0.0'],
        syncFullHistory: false,
        markOnlineOnConnect: true,
        generateHighQualityLinkPreview: true,
        pairingCodeTimeoutMs: 60000,
      });

      // Initialiser le gestionnaire de commandes
      this.commandHandler = new CommandHandler(this);
      this.messageHandlers = new WhatsAppMessageHandlers(this);
      console.log('[WHATSAPP] CommandHandler et MessageHandlers initialisés');

      // Sauvegarder les credentials à chaque mise à jour
      this.sock.ev.on('creds.update', async (cred) => {
        console.log('[WHATSAPP] 💾 Mise à jour des credentials détectée...');
        try {
          // Sauvegarder dans les fichiers locaux
          await saveCreds();
          console.log('[WHATSAPP] ✅ Credentials sauvegardés localement');
          
          // AUSSI sauvegarder dans Redis + MongoDB pour la persistance
          if (this.sock?.authState?.creds?.me?.id) {
            try {
              // Priorité 1: Redis (le plus rapide)
              await this.redis.saveCredentials(this.sock.authState.creds, 86400 * 30);
              console.log('[WHATSAPP] ✅ Credentials sauvegardés dans Redis');
              
              // Priorité 2: MongoDB (fallback)
              await this.saveSessionToDatabase();
              console.log('[WHATSAPP] ✅ Credentials aussi sauvegardés dans MongoDB');
            } catch (backupError) {
              console.warn('[WHATSAPP] ⚠️  Erreur sauvegarde backup:', backupError.message);
              console.warn('[WHATSAPP] ℹ️  Les credentials restent dans les fichiers locaux');
            }
          }
        } catch (error) {
          console.error('[WHATSAPP] ❌ Erreur lors de la sauvegarde locale:', error.message);
        }
      });

      // Variable pour tracker si on a déjà généré le code
      let pairingCodeGenerated = false;

      // Événement QR/Pairing code
      this.sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr, isNewLogin } = update;
        
        console.error(`[WHATSAPP] Connection Update: connection=${connection}, qr=${qr ? 'REÇU' : 'null'}, hasExistingAuth=${hasExistingAuth}, pairingCodeGenerated=${pairingCodeGenerated}`);

        // Si on a un QR et pas encore généré le code, générer le pairing code + afficher le QR
        if (qr && !hasExistingAuth && !pairingCodeGenerated) {
          pairingCodeGenerated = true;
          try {
            console.error('[WHATSAPP] 📲 QR event reçu - Génération du code d\'appairage et URL QR...');
            
            // 1. Générer une URL QR code scannable
            try {
              const qrUrl = await QRCode.toDataURL(qr);
              console.error('\n\n');
              console.error('╔════════════════════════════════════════════════════════════╗');
              console.error('║              📱 OPTION 1: SCANNER LE QR CODE               ║');
              console.error('╚════════════════════════════════════════════════════════════╝');
              console.error('');
              console.error('🔗 URL du QR Code (copier dans un navigateur):');
              console.error(`   https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(qr)}`);
              console.error('');
              console.error('📱 Ou scanner le code directement avec votre téléphone WhatsApp');
              console.error('\n');
            } catch (qrError) {
              console.error('[WHATSAPP] ⚠️  Impossible de générer l\'URL QR:', qrError.message);
            }

            // 2. Générer et afficher le code d'appairage
            try {
              const pairingCode = await this.sock.requestPairingCode(this.phoneNumber);
              console.error('[WHATSAPP] 📝 Code d\'appairage retourné par Baileys:', pairingCode);
              
              if (pairingCode && pairingCode.length === 8) {
                console.error('');
                console.error('╔════════════════════════════════════════════════════════════╗');
                console.error('║         🔐 OPTION 2: UTILISER LE CODE D\'APPAIRAGE        ║');
                console.error('╚════════════════════════════════════════════════════════════╝');
                console.error('');
                console.error(`  📱 ENTREZ CE CODE dans votre téléphone WhatsApp:`);
                console.error('');
                console.error(`     ┌─────────────────────┐`);
                console.error(`     │  ${pairingCode}      │`);
                console.error(`     └─────────────────────┘`);
                console.error('');
                console.error('  ⏱️  Vous avez 60 secondes pour entrer ce code');
                console.error('  📍 Allez dans: Paramètres → Appareils liés → Ajouter un appareil');
                console.error('  💬 Puis sélectionnez "Utiliser un code d\'appairage"');
                console.error('');
                console.error('╔════════════════════════════════════════════════════════════╗');
                console.error('\n');
                this.lastPairingCode = pairingCode;
                console.error(`[WHATSAPP] ✅ Code d\'appairage VALIDE: ${pairingCode}`);
                console.error('[WHATSAPP] ✅ En attente de saisie du code ou scan du QR...\n');
              } else {
                console.error('[WHATSAPP] ⚠️  Code d\'appairage invalide:', pairingCode);
                console.error('[WHATSAPP] ⚠️  Attendu: 8 caractères (format Crockford)');
                console.error('[WHATSAPP] ℹ️  Utilisez le QR code pour vous connecter\n');
              }
            } catch (error) {
              console.error('[WHATSAPP] ⚠️  Impossible de générer le code d\'appairage:', error.message);
              console.error('[WHATSAPP] ℹ️  Utilisez le QR code pour vous connecter\n');
            }
          } catch (error) {
            console.error('[WHATSAPP] ❌ Erreur QR event:', error.message);
            pairingCodeGenerated = false;
          }
        } else if (!qr && pairingCodeGenerated) {
          console.error('[WHATSAPP] ✓ QR/Code d\'appairage complété');
        }

        // Événement de connexion établie
        if (connection === 'open') {
          this.isReady = true;
          this.reconnectAttempts = 0;
          
          // Sauvegarder dans Redis + MongoDB quand connexion réussie
          try {
            console.log('[WHATSAPP] 💾 Sauvegarde de la session (Redis + MongoDB)...');
            
            // Redis en priorité
            if (this.sock?.authState?.creds) {
              await this.redis.saveCredentials(this.sock.authState.creds, 86400 * 30);
              console.log('[WHATSAPP] ✅ Session sauvegardée dans Redis');
            }
            
            // MongoDB en backup
            await this.saveSessionToDatabase();
            console.log('[WHATSAPP] ✅ Session aussi sauvegardée dans MongoDB');
          } catch (error) {
            console.error('[WHATSAPP] ❌ Erreur lors de la sauvegarde:', error.message);
            console.error('[WHATSAPP] ⚠️  La connexion continue mais sans persistance optimale');
          }
          
          // Démarrer le heartbeat si pas déjà démarré
          if (!this.heartbeat) {
            console.log('[WHATSAPP] 💓 Démarrage du service Heartbeat...');
            this.heartbeat = new WhatsAppHeartbeat(this);
            this.heartbeat.start();
          }
          
          if (!hasExistingAuth) {
            console.log('[WHATSAPP] ✅ Authentification réussie');
            console.log('[WHATSAPP] 📝 Session sauvegardée pour les redémarrages futurs');
            console.log('[WHATSAPP] 🎉 Bot connecté et prêt à l\'emploi');
          } else {
            console.log('[WHATSAPP] ✅ Connexion avec session persistante');
            console.log('[WHATSAPP] 🎉 Bot reconnecté et prêt');
          }
        }

        // Déconnexion
        if (connection === 'close') {
          const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
          const errorCode = lastDisconnect?.error?.output?.statusCode;
          const errorMessage = lastDisconnect?.error?.message;
          
          console.error(`[WHATSAPP] ❌ Déconnexion: Code=${errorCode}, Message=${errorMessage}`);
          
          // Si déconnexion immédiate après restauration MongoDB, les credentials sont mauvais
          if (hasExistingAuth && this.reconnectAttempts === 0) {
            console.error('[WHATSAPP] 🚨 DÉCONNEXION IMMÉDIATE! Les credentials MongoDB sont probablement invalides');
            console.error('[WHATSAPP] 🔄 Suppression de la session MongoDB et génération d\'un nouveau QR...');
            
            // Supprimer la mauvaise session de MongoDB
            await this.deleteSessionFromDatabase();
            
            // Effacer la session actuelle pour forcer un nouveau QR
            hasExistingAuth = false;
            this.reconnectAttempts = 0;
            
            // Attendre un peu avant de relancer
            setTimeout(() => {
              console.log('[WHATSAPP] 🔄 Relance de l\'initialisation...');
              this.initialize();
            }, 2000);
            return;
          }
          
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

        const remoteJid = message.key.remoteJid;
        const participant = message.key.participant; // Auteur réel dans un groupe
        
        // Dans un groupe, utiliser le participant (numéro réel de l'utilisateur)
        // Dans un chat direct, utiliser remoteJid (numéro du contact)
        const sender = participant || remoteJid;
        const isGroup = remoteJid.includes('@g.us');
        
        const messageBody = message.message?.conversation || 
                           message.message?.extendedTextMessage?.text || '';

        console.log(`[WHATSAPP] Message${isGroup ? ' (GROUPE)' : ''} de ${sender}: ${messageBody}`);

        // Traiter le message
        await this.processMessage(sender, messageBody, remoteJid);
      }
    } catch (error) {
      console.error('[WHATSAPP] Erreur lors du traitement des messages:', error.message);
    }
  }

  /**
   * Traiter un message spécifique
   */
  async processMessage(sender, messageBody, remoteJid) {
    try {
      // Ignorer les messages vides
      if (!messageBody || messageBody.trim().length === 0) {
        return;
      }

      // Check if message starts with command prefix
      const prefix = process.env.WHATSAPP_COMMAND_PREFIX || '.';
      
      if (messageBody.startsWith(prefix)) {
        // Try to handle as a command
        if (this.commandHandler) {
          const parsed = this.commandHandler.parseCommand(messageBody);
          if (parsed) {
            console.log(`[WHATSAPP] Commande détectée: ${parsed.command}`);
            await this.commandHandler.handleCommand(
              parsed.command,
              parsed.args,
              sender,
              this,
              remoteJid  // Ajouter le remoteJid pour envoyer au groupe/contact correct
            );
            return;
          }
        }
      }
      
      // ⚠️ NE PAS répondre automatiquement à tous les messages
      // Cela cause du spam dans les groupes et discussions
      // Le bot répondra UNIQUEMENT aux commandes
      console.log(`[WHATSAPP] Message standard ignoré (pas une commande): ${messageBody.substring(0, 50)}`);
      
    } catch (error) {
      console.error('[WHATSAPP] Erreur lors du traitement du message:', error.message);
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
      // Arrêter le heartbeat
      if (this.heartbeat) {
        this.heartbeat.stop();
        this.heartbeat = null;
      }
      
      // Arrêter Redis
      if (this.redis) {
        await this.redis.disconnect();
      }
      
      // Arrêter le socket
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

  /**
   * Sauvegarder la session dans MongoDB pour persistance entre redéploiements
   */
  async saveSessionToDatabase() {
    try {
      // Vérifier que Mongoose est connecté
      const mongooseState = require('mongoose').connection.readyState;
      if (mongooseState !== 1) {
        console.warn('[WHATSAPP] ⚠️  MongoDB non connecté (état:', mongooseState, ') - Sauvegarde échouée');
        return false;
      }

      if (!this.sock || !this.sock.authState || !this.sock.authState.creds) {
        console.log('[WHATSAPP] 💾 Session non disponible pour sauvegarde MongoDB');
        return false;
      }

      const credentials = this.sock.authState.creds;
      const state = this.sock.authState.state;

      // Vérifier que nous avons les données critiques
      if (!credentials.me || !credentials.me.id) {
        console.warn('[WHATSAPP] ⚠️  Credentials invalides (me.id manquant) - Sauvegarde annulée');
        return false;
      }

      console.log('[WHATSAPP] 💾 Préparation de la sauvegarde MongoDB...');
      console.log('[WHATSAPP]   - ID du téléphone:', credentials.me.id);
      console.log('[WHATSAPP]   - Numéro:', this.phoneNumber);
      console.log('[WHATSAPP]   - État de connexion:', this.isReady ? 'connecté' : 'déconnecté');

      const sessionData = {
        credentials: credentials,
        state: state,
        phoneNumber: this.phoneNumber,
        meId: credentials.me?.id,
        connectionStatus: this.isReady ? 'connected' : 'disconnected',
        lastSaved: new Date(),
      };

      const session = await WhatsappSession.findOneAndUpdate(
        { sessionId: 'default' },
        sessionData,
        { upsert: true, new: true }
      );

      console.log('[WHATSAPP] ✅ Session sauvegardée dans MongoDB avec succès');
      console.log('[WHATSAPP]   - ID: ' + session._id);
      return true;
    } catch (error) {
      console.error('[WHATSAPP] ❌ Erreur lors de la sauvegarde MongoDB:', error.message);
      console.error('[WHATSAPP] ⚠️  Stack:', error.stack);
      console.error('[WHATSAPP] ℹ️  La session reste sauvegardée localement (whatsapp_auth/)');
      return false;
    }
  }

  /**
   * Charger la session depuis MongoDB
   */
  async loadSessionFromDatabase() {
    try {
      // Vérifier que Mongoose est connecté
      const mongooseState = require('mongoose').connection.readyState;
      if (mongooseState !== 1) {
        console.log('[WHATSAPP] ⚠️  MongoDB non connecté (état:', mongooseState, ')');
        return null;
      }

      console.log('[WHATSAPP] 🔍 Recherche de session dans MongoDB...');
      const session = await WhatsappSession.findOne({ sessionId: 'default' });

      if (session && session.credentials) {
        console.log('[WHATSAPP] ✅ Session trouvée dans MongoDB');
        console.log(`[WHATSAPP]   - Téléphone: ${session.phoneNumber}`);
        console.log(`[WHATSAPP]   - ID: ${session.meId}`);
        console.log(`[WHATSAPP]   - État: ${session.connectionStatus}`);
        console.log(`[WHATSAPP]   - Sauvegardée le: ${session.lastSaved}`);
        
        // Vérifier que les credentials sont valides
        if (!session.credentials.me || !session.credentials.me.id) {
          console.warn('[WHATSAPP] ⚠️  Session trouvée mais credentials invalides (me.id manquant)');
          return null;
        }
        
        return {
          credentials: session.credentials,
          state: session.state,
        };
      }

      console.log('[WHATSAPP] ℹ️  Aucune session dans MongoDB');
      return null;
    } catch (error) {
      console.error('[WHATSAPP] ❌ Erreur lors de la lecture MongoDB:', error.message);
      console.error('[WHATSAPP] ⚠️  Stack:', error.stack);
      return null;
    }
  }

  /**
   * Supprimer la session de MongoDB
   */
  async deleteSessionFromDatabase() {
    try {
      // Vérifier que Mongoose est connecté
      const mongooseState = require('mongoose').connection.readyState;
      if (mongooseState !== 1) {
        console.log('[WHATSAPP] ⚠️  MongoDB non connecté - Impossible de supprimer');
        return false;
      }

      await WhatsappSession.deleteOne({ sessionId: 'default' });
      console.log('[WHATSAPP] 🗑️  Session supprimée de MongoDB');
      return true;
    } catch (error) {
      console.error('[WHATSAPP] Erreur lors de la suppression:', error.message);
      return false;
    }
  }
}

module.exports = WhatsAppBotService;

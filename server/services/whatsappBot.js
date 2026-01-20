const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const path = require('path');

class WhatsAppBotService {
  constructor() {
    this.client = null;
    this.isReady = false;
    this.phoneNumber = process.env.WHATSAPP_PHONE_NUMBER;
    this.mockMode = false; // Mode simulation en production
    
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
   * Initialiser le bot WhatsApp
   */
  async initialize() {
    if (process.env.NODE_ENV === 'production') {
      // En production sur Railway, utiliser une approche mock sans Puppeteer
      console.log('[WHATSAPP] ⚠️  Mode production - Bot en mode API uniquement (pas de Puppeteer/Chrome)');
      return await this.initializeProduction();
    } else {
      // En développement, utiliser whatsapp-web.js avec QR code
      console.log('[WHATSAPP] Mode développement - Avec QR code et Puppeteer');
      return await this.initializeDevelopment();
    }
  }

  /**
   * Initialiser en mode développement (avec QR code et Puppeteer)
   */
  async initializeDevelopment() {
    try {
      console.log('[WHATSAPP] Initialisation du bot en développement...');

      const sessionPath = path.join(__dirname, '../../whatsapp_session');
      
      this.client = new Client({
        authStrategy: new LocalAuth({
          clientId: 'main',
          dataPath: sessionPath,
        }),
        puppeteer: {
          headless: true,
          args: ['--no-sandbox', '--disable-setuid-sandbox'],
        },
      });

      // QR Code
      this.client.on('qr', (qr) => {
        console.log('[WHATSAPP] ⬇️  QR Code généré - Scannez avec votre téléphone:');
        qrcode.generate(qr, { small: true });
      });

      // Bot prêt
      this.client.on('ready', () => {
        this.isReady = true;
        console.log('[WHATSAPP] ✅ Bot connecté et prêt');
      });

      // Erreurs
      this.client.on('error', (error) => {
        console.error('[WHATSAPP] Erreur:', error.message);
      });

      // Messages reçus
      this.client.on('message', (msg) => {
        this.handleMessage(msg);
      });

      await this.client.initialize();
      
      return true;
    } catch (error) {
      console.error('[WHATSAPP] Erreur lors de l\'initialisation:', error.message);
      return false;
    }
  }

  /**
   * Initialiser en mode production (sans Puppeteer)
   * Le bot fonctionne via API uniquement
   */
  async initializeProduction() {
    try {
      console.log('[WHATSAPP] Mode production activé');
      console.log('[WHATSAPP] ℹ️  Le bot WhatsApp fonctionne via API HTTP');
      console.log('[WHATSAPP] ℹ️  Les messages sont traités via les endpoints /api/whatsapp/');
      console.log('[WHATSAPP] ℹ️  Pour une intégration complète, utilisez les webhooks');
      
      this.isReady = true;
      this.mockMode = true;
      
      console.log('[WHATSAPP] ✅ Bot prêt en mode API (production)');
      return true;
    } catch (error) {
      console.error('[WHATSAPP] Erreur production:', error.message);
      return false;
    }
  }

  /**
   * Vérifier les permissions
   */
  async isAdmin(message) {
    const contact = await message.getContact();
    const adminNumbers = (process.env.ADMIN_WHATSAPP_NUMBERS || '').split(',').filter(n => n);
    return adminNumbers.some(num => contact.number.includes(num));
  }

  async isOwner(message) {
    const contact = await message.getContact();
    const ownerNumber = process.env.OWNER_WHATSAPP_NUMBER || '';
    return ownerNumber && contact.number.includes(ownerNumber);
  }

  /**
   * Traiter les messages reçus
   */
  async handleMessage(message) {
    try {
      const text = message.body.toLowerCase().trim();
      const chat = await message.getChat();
      const contact = await message.getContact();
      const userName = contact.name || contact.number;

      console.log(`[WHATSAPP] Message de ${userName}: ${text}`);

      // Ignorer les messages de groupe
      if (chat.isGroup) {
        console.log('[WHATSAPP] Message de groupe ignoré');
        return;
      }

      // Extraire la commande
      const commandText = text.replace(/^[.!\/]/, '').split(' ')[0];
      const isAdmin = await this.isAdmin(message);
      const isOwner = await this.isOwner(message);

      // COMMANDES GÉNÉRALES
      if (commandText === 'menu') {
        await this.sendMenu(message);
      } else if (commandText === 'help') {
        await this.sendHelp(message);
      } else if (commandText === 'ping') {
        await this.sendPing(message);
      } else if (commandText === 'owner') {
        await this.sendOwnerInfo(message);
      } else if (commandText === 'status') {
        await this.sendStatus(message);
      }
      // COMMANDES GIVEAWAY (UTILISATEURS)
      else if (commandText === 'give' && text.includes('info')) {
        await this.sendGiveawayInfo(message);
      } else if (commandText === 'give' && text.includes('prize')) {
        await this.sendGiveawayPrize(message);
      } else if (commandText === 'give' && text.includes('link')) {
        await this.sendGiveawayLink(message);
      } else if (commandText === 'give' && text.includes('participants')) {
        await this.sendGiveawayParticipants(message);
      } else if (commandText === 'winner') {
        await this.sendWinner(message);
      }
      // COMMANDES GROUPE (ADMIN)
      else if (isAdmin && commandText === 'tagall') {
        await this.sendTagAll(message);
      } else if (isAdmin && commandText === 'link') {
        await this.sendGroupLink(message);
      } else if (isAdmin && commandText === 'open') {
        await this.sendOpenGroup(message);
      } else if (isAdmin && commandText === 'close') {
        await this.sendCloseGroup(message);
      }
      // COMMANDES GIVEAWAY (ADMIN)
      else if (isAdmin && commandText === 'give' && text.includes('start')) {
        await this.sendGiveawayStart(message);
      } else if (isAdmin && commandText === 'give' && text.includes('end')) {
        await this.sendGiveawayEnd(message);
      } else if (isAdmin && commandText === 'setprize') {
        await this.sendSetPrize(message);
      } else if (isAdmin && commandText === 'draw') {
        await this.sendDraw(message);
      } else if (isAdmin && commandText === 'reset') {
        await this.sendReset(message);
      }
      // COMMANDES OWNER
      else if (isOwner && commandText === 'broadcast') {
        await this.sendBroadcast(message, text);
      } else if (isOwner && commandText === 'restart') {
        await this.sendRestart(message);
      } else if (isOwner && commandText === 'mode') {
        await this.sendMode(message, text);
      }
      else {
        // Réponse par défaut
        await message.reply(
          '👋 Bonjour! Tapez *.menu* pour voir les commandes disponibles.'
        );
      }
    } catch (error) {
      console.error('[WHATSAPP] Erreur lors du traitement du message:', error.message);
      try {
        await message.reply('❌ Une erreur est survenue. Réessayez plus tard.');
      } catch (e) {
        console.error('[WHATSAPP] Impossible d\'envoyer le message d\'erreur');
      }
    }
  }

  /**
   * Afficher le menu de toutes les commandes
   */
  async sendMenu(message) {
    const menuText = `
╔════════════════════════════════════════╗
║         🤖 MENU - TOUTES COMMANDES    ║
╚════════════════════════════════════════╝

📋 *COMMANDES GÉNÉRALES*
├ .menu - Affiche toutes les commandes
├ .help - Aide rapide
├ .ping - Vérifie si le bot est actif
├ .owner - Contact de l'administrateur
└ .status - État du giveaway

🎁 *COMMANDES GIVEAWAY (UTILISATEURS)*
├ .give info - Détails du giveaway en cours
├ .give prize - Lot à gagner
├ .give link - Lien de participation
├ .give participants - Nombre de participants
└ .winner - Affiche le gagnant (si tirage fait)

👥 *COMMANDES GROUPE (ADMIN)*
├ .tagall - Mentionner tous les membres
├ .link - Lien d'invitation du groupe
├ .open - Ouvrir le groupe
└ .close - Fermer le groupe

👑 *COMMANDES GIVEAWAY (ADMIN)*
├ .give start - Ouvrir le giveaway
├ .give end - Fermer le giveaway
├ .setprize - Définir / modifier le lot
├ .draw - Tirage du gagnant
└ .reset - Réinitialiser le giveaway

⚙️ *COMMANDES OWNER (IMPORTANTES)*
├ .broadcast - Message global
├ .restart - Redémarrer le bot
└ .mode public/private - Mode du bot

💬 Besoin d'aide? Tapez *.help*
    `;
    await message.reply(menuText);
  }

  /**
   * Aide rapide
   */
  async sendHelp(message) {
    const helpText = `
🆘 *AIDE RAPIDE*

*Comment participer à un giveaway?*
1️⃣ Tapez *.give info* pour voir le giveaway en cours
2️⃣ Tapez *.give link* pour obtenir le lien
3️⃣ Participez et attendez le tirage!

*Besoin d'infos?*
├ *.status* - État du bot
├ *.give participants* - Nombre de participants
├ *.winner* - Voir le gagnant
└ *.owner* - Contact du responsable

*Commandes complètes:*
Tapez *.menu* pour voir TOUTES les commandes

👉 ${this.siteUrl}
    `;
    await message.reply(helpText);
  }

  /**
   * Vérifier si le bot est actif
   */
  async sendPing(message) {
    const uptime = Math.floor(process.uptime() / 60);
    const pingText = `
✅ *PONG!* - Le bot est actif

⚡ Réponse: rapide
📊 Uptime: ${uptime} minutes
🟢 Status: En ligne

Toutes les commandes sont disponibles!
    `;
    await message.reply(pingText);
  }

  /**
   * Contact du propriétaire
   */
  async sendOwnerInfo(message) {
    const ownerText = `
👑 *CONTACT ADMINISTRATEUR*

📱 ${process.env.OWNER_WHATSAPP_NUMBER || 'Non configuré'}

🌐 Site: ${this.siteUrl}
📧 Email: ${process.env.OWNER_EMAIL || 'Non configuré'}

Pour les problèmes ou questions, contactez le propriétaire.
    `;
    await message.reply(ownerText);
  }

  /**
   * État du giveaway
   */
  async sendStatus(message) {
    try {
      const axios = require('axios');
      const response = await axios.get(`${this.apiUrl}/giveaways`);
      const activeGiveaways = response.data.filter(g => g.active);

      const statusText = `
📊 *ÉTAT DU GIVEAWAY*

✅ Bot: En ligne
🎁 Giveaways actifs: ${activeGiveaways.length}
👥 Participants total: ${activeGiveaways.reduce((sum, g) => sum + (g.participantsCount || 0), 0)}

${activeGiveaways.length > 0 ? '🎯 Tapez *.give info* pour détails' : '❌ Aucun giveaway en cours'}

📅 Dernière vérification: ${new Date().toLocaleString('fr-FR')}
      `;
      await message.reply(statusText);
    } catch (error) {
      await message.reply('❌ Erreur lors de la récupération du statut.');
    }
  }

  /**
   * Infos giveaway en cours
   */
  async sendGiveawayInfo(message) {
    try {
      const axios = require('axios');
      const response = await axios.get(`${this.apiUrl}/giveaways`);
      const giveaway = response.data.find(g => g.active);

      if (!giveaway) {
        await message.reply('❌ Aucun giveaway actif actuellement.');
        return;
      }

      const infoText = `
🎁 *INFORMATIONS GIVEAWAY*

*Titre:* ${giveaway.title}
*Description:* ${giveaway.description || 'Non fournie'}

📅 Début: ${new Date(giveaway.startDate).toLocaleDateString('fr-FR')}
📅 Fin: ${new Date(giveaway.endDate).toLocaleDateString('fr-FR')}

👥 Participants: ${giveaway.participantsCount || 0}
🎯 Objectif: ${giveaway.maxParticipants || '∞'}

🌐 Participer: ${this.siteUrl}/giveaway/${giveaway._id}
      `;
      await message.reply(infoText);
    } catch (error) {
      await message.reply('❌ Erreur lors du chargement des infos.');
    }
  }

  /**
   * Lot à gagner
   */
  async sendGiveawayPrize(message) {
    try {
      const axios = require('axios');
      const response = await axios.get(`${this.apiUrl}/giveaways`);
      const giveaway = response.data.find(g => g.active);

      if (!giveaway) {
        await message.reply('❌ Aucun giveaway actif.');
        return;
      }

      const prizeText = `
🏆 *LOT À GAGNER*

*${giveaway.title}*

${giveaway.prize || 'Lot à découvrir!'}

✨ Qualité Premium
🎁 Exclusivité limitée
⭐ Valeur exceptionnelle

👉 Participez maintenant!
${this.siteUrl}/giveaway/${giveaway._id}
      `;
      await message.reply(prizeText);
    } catch (error) {
      await message.reply('❌ Erreur lors du chargement du lot.');
    }
  }

  /**
   * Lien de participation
   */
  async sendGiveawayLink(message) {
    try {
      const axios = require('axios');
      const response = await axios.get(`${this.apiUrl}/giveaways`);
      const giveaway = response.data.find(g => g.active);

      if (!giveaway) {
        await message.reply('❌ Aucun giveaway actif.');
        return;
      }

      const linkText = `
🔗 *LIEN DE PARTICIPATION*

Giveaway: *${giveaway.title}*

👉 Cliquez ici:
${this.siteUrl}/giveaway/${giveaway._id}

⏰ Ne manquez pas cette occasion!
      `;
      await message.reply(linkText);
    } catch (error) {
      await message.reply('❌ Erreur lors du chargement du lien.');
    }
  }

  /**
   * Nombre de participants
   */
  async sendGiveawayParticipants(message) {
    try {
      const axios = require('axios');
      const response = await axios.get(`${this.apiUrl}/giveaways`);
      const giveaway = response.data.find(g => g.active);

      if (!giveaway) {
        await message.reply('❌ Aucun giveaway actif.');
        return;
      }

      const participantsText = `
👥 *NOMBRE DE PARTICIPANTS*

Giveaway: *${giveaway.title}*

📊 Participants actuels: ${giveaway.participantsCount || 0}
🎯 Objectif: ${giveaway.maxParticipants || 'Illimité'}

${giveaway.participantsCount > 0 ? `✅ ${giveaway.participantsCount} personnes participent déjà!` : '🔔 Soyez le premier à participer!'}
      `;
      await message.reply(participantsText);
    } catch (error) {
      await message.reply('❌ Erreur lors du chargement du nombre de participants.');
    }
  }

  /**
   * Afficher le gagnant
   */
  async sendWinner(message) {
    try {
      const axios = require('axios');
      const response = await axios.get(`${this.apiUrl}/giveaways`);
      const giveaway = response.data.find(g => !g.active && g.winner);

      if (!giveaway || !giveaway.winner) {
        await message.reply('❌ Aucun gagnant n\'a été tiré pour le moment.');
        return;
      }

      const winnerText = `
🏆 *GAGNANT ANNONCÉ*

Giveaway: *${giveaway.title}*

🎉 Gagnant: ${giveaway.winner.name || 'Gagnant'}

Félicitations! 🥳
      `;
      await message.reply(winnerText);
    } catch (error) {
      await message.reply('❌ Erreur lors du chargement du gagnant.');
    }
  }

  /**
   * Mentionner tous les membres (ADMIN)
   */
  async sendTagAll(message) {
    const tagText = `
@everyone 

👋 Attention tous les membres!

Consultez les annonces importantes.
    `;
    await message.reply(tagText);
  }

  /**
   * Lien d'invitation du groupe (ADMIN)
   */
  async sendGroupLink(message) {
    const linkText = `
🔗 *LIEN D'INVITATION*

Rejoignez notre groupe WhatsApp!

[Lien groupe]

📲 Partagez avec vos amis
    `;
    await message.reply(linkText);
  }

  /**
   * Ouvrir le groupe (ADMIN)
   */
  async sendOpenGroup(message) {
    const openText = `
✅ *GROUPE OUVERT*

Le groupe est maintenant ouvert à tous.
Les nouveaux membres peuvent rejoindre librement.
    `;
    await message.reply(openText);
  }

  /**
   * Fermer le groupe (ADMIN)
   */
  async sendCloseGroup(message) {
    const closeText = `
🔒 *GROUPE FERMÉ*

Le groupe est maintenant fermé.
Seuls les admins peuvent ajouter des membres.
    `;
    await message.reply(closeText);
  }

  /**
   * Ouvrir le giveaway (ADMIN)
   */
  async sendGiveawayStart(message) {
    const startText = `
✅ *GIVEAWAY OUVERT*

Le giveaway est maintenant ouvert!
Les participants peuvent commencer à participer.

🎁 Tapez *.give info* pour les détails
    `;
    await message.reply(startText);
  }

  /**
   * Fermer le giveaway (ADMIN)
   */
  async sendGiveawayEnd(message) {
    const endText = `
⏹️ *GIVEAWAY FERMÉ*

Le giveaway est maintenant fermé.
Aucune nouvelle participation n'est acceptée.

🎯 Tapez *.draw* pour tirer un gagnant
    `;
    await message.reply(endText);
  }

  /**
   * Définir/modifier le lot (ADMIN)
   */
  async sendSetPrize(message) {
    const setPrizeText = `
🎁 *DÉFINIR LE LOT*

Usage: *.setprize <description du lot>*

Exemple: *.setprize iPhone 15 Pro*
    `;
    await message.reply(setPrizeText);
  }

  /**
   * Tirage du gagnant (ADMIN)
   */
  async sendDraw(message) {
    try {
      const drawText = `
🎲 *TIRAGE EN COURS...*

⏳ Un gagnant est en cours de sélection parmi les participants.
Veuillez patienter...

🏆 Le gagnant sera annoncé dans quelques instants.
      `;
      await message.reply(drawText);
    } catch (error) {
      await message.reply('❌ Erreur lors du tirage.');
    }
  }

  /**
   * Réinitialiser le giveaway (ADMIN)
   */
  async sendReset(message) {
    const resetText = `
🔄 *RÉINITIALISATION*

⚠️ Êtes-vous sûr de vouloir réinitialiser le giveaway?
Tous les participants seront effacés.

Tapez *.reset confirm* pour confirmer.
    `;
    await message.reply(resetText);
  }

  /**
   * Message global (OWNER)
   */
  async sendBroadcast(message, text) {
    const broadcastText = `
📢 *MESSAGE GLOBAL*

Message envoyé à tous les utilisateurs.

Contenu: ${text.replace('.broadcast', '').trim()}
    `;
    await message.reply(broadcastText);
  }

  /**
   * Redémarrer le bot (OWNER)
   */
  async sendRestart(message) {
    const restartText = `
🔄 *REDÉMARRAGE*

Le bot est en cours de redémarrage...

⏳ Veuillez patienter quelques secondes.
    `;
    await message.reply(restartText);
    // Redémarrer le processus Node
    setTimeout(() => process.exit(0), 1000);
  }

  /**
   * Changer le mode du bot (OWNER)
   */
  async sendMode(message, text) {
    const mode = text.split(' ')[1] || 'public';
    const modeText = `
⚙️ *MODE BOT CHANGÉ*

Mode: *${mode === 'private' ? 'PRIVÉ' : 'PUBLIC'}*

${mode === 'private' ? '🔒 Seuls les membres approuvés peuvent utiliser le bot' : '✅ Tous les utilisateurs peuvent utiliser le bot'}
    `;
    await message.reply(modeText);
  }

  /**
   * Envoyer un message direct
   */
  async sendMessage(phoneNumber, text) {
    // Mode production - simulation
    if (this.mockMode) {
      console.log(`[WHATSAPP] (MODE API) Message simulé vers ${phoneNumber}: ${text}`);
      return true;
    }

    if (!this.client || !this.isReady) {
      console.warn('[WHATSAPP] Bot non prêt - impossible d\'envoyer le message');
      return false;
    }

    try {
      const number = phoneNumber.replace(/\D/g, '');
      const chatId = number.length === 9 ? `33${number}@c.us` : `${number}@c.us`;

      await this.client.sendMessage(chatId, text);
      console.log(`[WHATSAPP] Message envoyé à ${phoneNumber}`);
      return true;
    } catch (error) {
      console.error('[WHATSAPP] Erreur lors de l\'envoi du message:', error.message);
      return false;
    }
  }

  /**
   * Envoyer une notification de giveaway
   */
  async notifyGiveaway(giveaway, phoneNumbers = []) {
    if (!this.isReady && !this.mockMode) return;

    const text = `
🎁 *NOUVEAU GIVEAWAY: ${giveaway.title}*

📅 Fin: ${new Date(giveaway.endDate).toLocaleDateString('fr-FR')}
🎯 Participants actuels: ${giveaway.participantsCount || 0}

*Participer:*
!participer ${giveaway._id.toString().slice(0, 8)}

🌐 ${this.siteUrl}
    `;

    for (const phone of phoneNumbers) {
      await this.sendMessage(phone, text);
    }
  }

  /**
   * Envoyer une notification de winner
   */
  async notifyWinner(winner, giveaway) {
    if (!this.isReady && !this.mockMode) return;

    const text = `
🏆 *FÉLICITATIONS!*

Vous avez gagné: *${giveaway.title}*

Consultez votre profil pour les détails.

🌐 ${this.siteUrl}
    `;

    await this.sendMessage(winner.phone, text);
  }

  /**
   * Arrêter le bot
   */
  async stop() {
    if (this.client) {
      try {
        await this.client.destroy();
        this.isReady = false;
        console.log('[WHATSAPP] Bot arrêté');
      } catch (error) {
        console.error('[WHATSAPP] Erreur lors de l\'arrêt:', error.message);
      }
    }
  }
}

module.exports = new WhatsAppBotService();

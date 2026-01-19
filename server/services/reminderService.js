const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const Giveaway = require('../models/Giveaway');

class ReminderService {
  constructor(discordBot) {
    console.log('[Reminder Service] Constructeur - discordBot reçu:', discordBot ? 'Oui' : 'Non');
    this.discordBot = discordBot;
    this.reminderInterval = null;
    this.REMINDER_INTERVAL = 12 * 60 * 60 * 1000; // 12 heures en millisecondes
    this.lastReminderTime = 0;
    
    // Vérifier immédiatement
    if (this.discordBot) {
      console.log('[Reminder Service] discordBot disponible, client:', this.discordBot.client ? 'Disponible' : 'Null');
    }
  }

  /**
   * Démarrer le service de rappel
   */
  start() {
    console.log('[Reminder Service] Démarrage du service de rappel...');
    
    // Ne pas envoyer un rappel immédiatement - attendre au moins 5 secondes
    // pour que le client Discord soit prêt
    // D�SACTIV�: Ne pas envoyer de rappel au d�marrage
    // setTimeout(() => {
    //   this.sendReminder().catch(e => console.error('[Reminder Service] Erreur lors du premier rappel:', e));
    // }, 5000);
    
    // Puis toutes les 12 heures
    this.reminderInterval = setInterval(() => {
      this.sendReminder().catch(e => console.error('[Reminder Service] Erreur lors du rappel périodique:', e));
    }, this.REMINDER_INTERVAL);

    console.log('[Reminder Service] ✅ Service de rappel actif (toutes les 12 heures)');
  }

  /**
   * Arrêter le service de rappel
   */
  stop() {
    if (this.reminderInterval) {
      clearInterval(this.reminderInterval);
      this.reminderInterval = null;
      console.log('[Reminder Service] ⏹️ Service de rappel arrêté');
    }
  }

  /**
   * Envoyer un rappel à tous les utilisateurs
   */
  async sendReminder() {
    try {
      console.log('[Reminder Service] 📢 Tentative d\'envoi d\'un rappel...');
      
      // Étape 1: Vérifier que le service a reçu le discordBot
      if (typeof this.discordBot === 'undefined' || this.discordBot === null) {
        console.error('[Reminder Service] ❌ this.discordBot est undefined/null');
        return;
      }
      console.log('[Reminder Service] ✓ this.discordBot est défini');

      // Étape 2: Vérifier que discordBot a une propriété client
      if (typeof this.discordBot.client === 'undefined' || this.discordBot.client === null) {
        console.error('[Reminder Service] ❌ this.discordBot.client est undefined/null');
        console.error('[Reminder Service] Types:', {
          discordBot: typeof this.discordBot,
          discordBotKeys: Object.keys(this.discordBot || {})
        });
        return;
      }
      console.log('[Reminder Service] ✓ this.discordBot.client est défini');

      const discordClient = this.discordBot.client;

      // Étape 3: Vérifier que le client a la méthode isReady
      if (typeof discordClient.isReady !== 'function') {
        console.error('[Reminder Service] ❌ discordClient.isReady n\'est pas une fonction');
        return;
      }

      if (!discordClient.isReady()) {
        console.warn('[Reminder Service] ⚠️ Client Discord non prêt');
        return;
      }
      console.log('[Reminder Service] ✓ Client Discord prêt');

      // Étape 4: Vérifier que le client a la propriété channels
      if (typeof discordClient.channels === 'undefined' || discordClient.channels === null) {
        console.error('[Reminder Service] ❌ discordClient.channels est undefined/null');
        return;
      }
      console.log('[Reminder Service] ✓ discordClient.channels est défini');

      // Étape 5: Vérifier que channels a la méthode fetch
      if (typeof discordClient.channels.fetch !== 'function') {
        console.error('[Reminder Service] ❌ discordClient.channels.fetch n\'est pas une fonction');
        return;
      }
      console.log('[Reminder Service] ✓ discordClient.channels.fetch est disponible');

      // Étape 6: Récupérer le channel ID - utiliser celui du discordBot
      const channelId = this.discordBot?.channelId || process.env.DISCORD_CHANNEL_ID;
      console.log('[Reminder Service] Channel ID utilisé:', channelId);
      
      if (!channelId) {
        console.warn('[Reminder Service] ⚠️ Channel ID non configuré');
        return;
      }

      // Étape 7: Utiliser fetch au lieu de cache
      let channel;
      try {
        console.log('[Reminder Service] Récupération du channel:', channelId);
        channel = await discordClient.channels.fetch(channelId);
        console.log('[Reminder Service] ✓ Channel récupéré:', channel?.name);
      } catch (error) {
        console.error('[Reminder Service] ❌ Erreur fetch channel:', error.message);
        return;
      }

      if (!channel) {
        console.error('[Reminder Service] ❌ Channel non trouvé:', channelId);
        return;
      }

      // Récupérer les giveaways actifs
      const activeGiveaways = await Giveaway.find({
        status: { $ne: 'completed' },
        endDate: { $gt: new Date() }
      }).limit(1);

      if (activeGiveaways.length === 0) {
        console.log('[Reminder Service] ℹ️ Aucun giveaway actif pour le rappel');
        return;
      }

      const giveaway = activeGiveaways[0];
      
      // Récupérer l'URL du site depuis le bot Discord
      const siteUrl = this.discordBot?.siteUrl || process.env.CORS_ORIGIN || 'https://your-site.com';

      // Créer l'embed de rappel
      const embed = new EmbedBuilder()
        .setColor(0x5865F2) // Discord Blurple
        .setTitle('🎁 Rappel: Participez au Giveaway!')
        .setDescription(`
**${giveaway.name}**

${giveaway.description || 'Un superbe giveaway vous attend!'}

⏰ **Fin prévue:** <t:${Math.floor(giveaway.endDate.getTime() / 1000)}:R>

👥 **Participants actuels:** ${giveaway.participantCount || 0}

✨ Cliquez sur le bouton ci-dessous pour participer maintenant!
        `.trim())
        .setFooter({ 
          text: '🎡 Dragon Ball Legends Giveaway',
          iconURL: 'https://cdn.discordapp.com/attachments/YOUR_ICON_URL' 
        })
        .setTimestamp();

      // Créer le bouton de participation
      const button = new ButtonBuilder()
        .setLabel('✨ Participer Maintenant')
        .setStyle(ButtonStyle.Link)
        .setURL(`${siteUrl}#giveaway=${giveaway._id}`);

      const row = new ActionRowBuilder()
        .addComponents(button);

      // Envoyer le message
      await channel.send({
        embeds: [embed],
        components: [row],
        content: `@here 📢 **Rappel - ${giveaway.name}**`
      });

      console.log(`[Reminder Service] ✅ Rappel envoyé pour: ${giveaway.name}`);
      this.lastReminderTime = Date.now();

    } catch (error) {
      console.error('[Reminder Service] ❌ Erreur lors de l\'envoi du rappel:', error.message);
    }
  }

  /**
   * Envoyer un rappel manuel (pour les tests)
   */
  async sendManualReminder() {
    console.log('[Reminder Service] 📢 Envoi d\'un rappel manuel...');
    await this.sendReminder();
  }

  /**
   * Obtenir le prochain rappel prévu
   */
  getNextReminderTime() {
    if (!this.lastReminderTime) {
      return new Date();
    }
    return new Date(this.lastReminderTime + this.REMINDER_INTERVAL);
  }
}

module.exports = ReminderService;



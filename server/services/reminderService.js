const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const config = require('../config/config');
const Giveaway = require('../models/Giveaway');

class ReminderService {
  constructor(discordBot) {
    this.discordBot = discordBot;
    this.reminderInterval = null;
    this.REMINDER_INTERVAL = 12 * 60 * 60 * 1000; // 12 heures en millisecondes
    this.lastReminderTime = 0;
  }

  /**
   * Démarrer le service de rappel
   */
  start() {
    console.log('[Reminder Service] Démarrage du service de rappel...');
    
    // Envoyer un premier rappel immédiatement
    this.sendReminder().catch(e => console.error('[Reminder Service] Erreur lors du premier rappel:', e));
    
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
      // Récupérer le bot Discord
      const discordClient = this.discordBot?.client;
      if (!discordClient || !discordClient.isReady()) {
        console.warn('[Reminder Service] ⚠️ Client Discord non prêt');
        return;
      }

      // Récupérer le channel à partir de la config
      const channelId = config.discord.channels.notifications;
      if (!channelId) {
        console.warn('[Reminder Service] ⚠️ Channel ID non configuré');
        return;
      }

      const channel = discordClient.channels.cache.get(channelId);
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
      const siteUrl = config.siteUrl || 'https://your-site.com';

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

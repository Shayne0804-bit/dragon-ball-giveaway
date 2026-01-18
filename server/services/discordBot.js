const { Client, GatewayIntentBits, EmbedBuilder, ChannelType, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const discordConfig = require('../config/discord');

class DiscordBotService {
  constructor() {
    this.client = null;
    this.isReady = false;
    this.channelId = process.env.DISCORD_CHANNEL_ID;
    this.botToken = process.env.DISCORD_BOT_TOKEN;
    
    // Déterminer l'URL du site - priorité à CORS_ORIGIN
    let siteUrl = process.env.CORS_ORIGIN;
    
    // Fallback sur Railway domain si CORS_ORIGIN n'est pas défini
    if (!siteUrl || siteUrl === 'undefined') {
      if (process.env.RAILWAY_PUBLIC_DOMAIN) {
        siteUrl = `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`;
      } else {
        siteUrl = 'http://localhost:5000';
      }
    }
    
    this.siteUrl = siteUrl;
    console.log('[DISCORD] Site URL configurée:', this.siteUrl);
  }

  /**
   * Initialiser le bot Discord
   */
  async initialize() {
    if (!this.botToken) {
      console.warn('⚠️  [DISCORD] Token bot non configuré (DISCORD_BOT_TOKEN). Les notifications ne seront pas envoyées.');
      return false;
    }

    if (!this.channelId) {
      console.warn('⚠️  [DISCORD] Channel ID non configuré (DISCORD_CHANNEL_ID). Les notifications ne seront pas envoyées.');
      return false;
    }

    try {
      console.log('[DISCORD] Initialisation du bot...');
      
      this.client = new Client({
        intents: [
          GatewayIntentBits.Guilds,
          GatewayIntentBits.GuildMessages,
          GatewayIntentBits.DirectMessages,
        ],
      });

      this.client.once('clientReady', () => {
        this.isReady = true;
        console.log(`[DISCORD] ✅ Bot connecté: ${this.client.user.tag}`);
      });

      this.client.on('error', (error) => {
        console.error('[DISCORD] Erreur bot:', error.message);
      });

      await this.client.login(this.botToken);
      
      // Attendre que le bot soit prêt
      return new Promise((resolve) => {
        const timeout = setTimeout(() => {
          console.warn('[DISCORD] ⚠️  Timeout lors de la connexion du bot (10s) - Le bot peut être inactif');
          resolve(false);
        }, 10000);

        const checkReady = setInterval(() => {
          if (this.isReady) {
            clearInterval(checkReady);
            clearTimeout(timeout);
            resolve(true);
          }
        }, 100);
      });
    } catch (error) {
      console.error('[DISCORD] ❌ Erreur lors de l\'initialisation du bot:', error.message);
      return false;
    }
  }

  /**
   * Envoyer une notification de création de giveaway
   */
  async notifyGiveawayCreated(giveaway) {
    if (!this.isReady || !this.channelId) {
      console.warn(`[DISCORD] ⚠️  Bot non prêt (${this.isReady}) ou canal non configuré (${this.channelId})`);
      return false;
    }

    try {
      console.log(`[DISCORD] Tentative d'accès au canal: ${this.channelId}`);
      
      const channel = await this.client.channels.fetch(this.channelId).catch(err => {
        console.error(`[DISCORD] ❌ Erreur fetch canal: ${err.message}`);
        return null;
      });

      if (!channel) {
        console.error(`[DISCORD] ❌ Canal introuvable: ${this.channelId}`);
        return false;
      }

      if (channel.type !== ChannelType.GuildText && channel.type !== ChannelType.GuildAnnouncement) {
        console.error(`[DISCORD] ❌ Canal non valide - Type: ${channel.type} (attendu: ${ChannelType.GuildText} ou ${ChannelType.GuildAnnouncement})`);
        return false;
      }

      console.log(`[DISCORD] ✅ Canal accessible: ${channel.name}`);

      const durationText = this.formatDuration(giveaway.durationDays, giveaway.durationHours);
      const endDate = new Date(giveaway.endDate).toLocaleString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

      const embed = new EmbedBuilder()
        .setColor(discordConfig.colors.created)
        .setTitle(`${discordConfig.messages.created.emoji} ${discordConfig.messages.created.title}`)
        .setDescription(discordConfig.messages.created.description)
        .addFields(
          {
            name: 'Nom du giveaway',
            value: giveaway.name,
            inline: false,
          },
          {
            name: 'Description',
            value: giveaway.description || 'Aucune description',
            inline: false,
          },
          {
            name: 'Durée',
            value: durationText,
            inline: true,
          },
          {
            name: 'Fin prévue',
            value: endDate,
            inline: true,
          },
          {
            name: 'Statut',
            value: `🟢 ${giveaway.status}`,
            inline: true,
          }
        )
        .setFooter({
          text: `Giveaway ID: ${giveaway._id}`,
        })
        .setTimestamp();

      // Créer un bouton pour accéder au site
      const row = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setLabel('🎯 Participer')
            .setURL(this.siteUrl.startsWith('http') ? `${this.siteUrl}/` : `http://localhost:5000/`)
            .setStyle(ButtonStyle.Link)
        );

      await channel.send({ 
        content: '@everyone 🎁 Un nouveau giveaway a été créé !',
        embeds: [embed], 
        components: [row] 
      });
      console.log(`[DISCORD] Notification de création envoyée pour: ${giveaway.name}`);
      return true;
    } catch (error) {
      console.error('[DISCORD] Erreur lors de l\'envoi de la notification de création:', error.message);
      return false;
    }
  }

  /**
   * Envoyer une notification de fermeture de giveaway
   */
  async notifyGiveawayClosed(giveaway) {
    if (!this.isReady || !this.channelId) {
      console.warn('[DISCORD] Bot non prêt ou canal non configuré');
      return false;
    }

    try {
      const channel = await this.client.channels.fetch(this.channelId);

      if (!channel || (channel.type !== ChannelType.GuildText && channel.type !== ChannelType.GuildAnnouncement)) {
        console.error('[DISCORD] Canal non valide ou inaccessible');
        return false;
      }

      const closedDate = new Date().toLocaleString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

      const embed = new EmbedBuilder()
        .setColor(discordConfig.colors.closed)
        .setTitle(`${discordConfig.messages.closed.emoji} ${discordConfig.messages.closed.title}`)
        .setDescription(discordConfig.messages.closed.description)
        .addFields(
          {
            name: 'Nom du giveaway',
            value: giveaway.name,
            inline: false,
          },
          {
            name: 'Participants',
            value: `${giveaway.participantCount || 0}`,
            inline: true,
          },
          {
            name: 'Fermé le',
            value: closedDate,
            inline: true,
          },
          {
            name: 'Statut',
            value: `⛔ ${giveaway.status}`,
            inline: true,
          }
        )
        .setFooter({
          text: `Giveaway ID: ${giveaway._id}`,
        })
        .setTimestamp();

      // Créer un bouton pour accéder au site
      const row = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setLabel('🌐 Voir le site')
            .setURL(`${this.siteUrl}/`)
            .setStyle(ButtonStyle.Link)
        );

      await channel.send({ 
        content: '@everyone 🎯 Le giveaway est maintenant fermé !',
        embeds: [embed], 
        components: [row] 
      });
      console.log(`[DISCORD] Notification de fermeture envoyée pour: ${giveaway.name}`);
      return true;
    } catch (error) {
      console.error('[DISCORD] Erreur lors de l\'envoi de la notification de fermeture:', error.message);
      return false;
    }
  }

  /**
   * Envoyer une notification de fin de giveaway avec gagnants
   */
  async notifyGiveawayCompleted(giveaway, winners = []) {
    if (!this.isReady || !this.channelId) {
      console.warn('[DISCORD] Bot non prêt ou canal non configuré');
      return false;
    }

    try {
      const channel = await this.client.channels.fetch(this.channelId);

      if (!channel || (channel.type !== ChannelType.GuildText && channel.type !== ChannelType.GuildAnnouncement)) {
        console.error('[DISCORD] Canal non valide ou inaccessible');
        return false;
      }

      const completedDate = new Date().toLocaleString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

      // Formater la liste des gagnants
      let winnersText = '🎯 Aucun gagnant';
      if (winners && winners.length > 0) {
        winnersText = winners
          .slice(0, 10) // Limite à 10 gagnants pour éviter les messages trop longs
          .map((winner, idx) => {
            const name = winner.name || winner.discordUsername || winner.username || 'Utilisateur inconnu';
            return `${idx + 1}. **${name}**`;
          })
          .join('\n');

        if (winners.length > 10) {
          winnersText += `\n\n... et **${winners.length - 10}** autres gagnants!`;
        }
      }

      const embed = new EmbedBuilder()
        .setColor(discordConfig.colors.completed)
        .setTitle(`${discordConfig.messages.completed.emoji} ${discordConfig.messages.completed.title}`)
        .setDescription(discordConfig.messages.completed.description)
        .addFields(
          {
            name: '🎁 Nom du giveaway',
            value: `**${giveaway.name}**`,
            inline: false,
          },
          {
            name: '👥 Participants',
            value: `**${giveaway.participantCount || 0}**`,
            inline: true,
          },
          {
            name: '🏆 Gagnants',
            value: `**${giveaway.winnerCount || winners.length || 0}**`,
            inline: true,
          },
          {
            name: '📅 Terminé le',
            value: completedDate,
            inline: true,
          },
          {
            name: '🎉 Liste des Gagnants',
            value: winnersText,
            inline: false,
          }
        )
        .setFooter({
          text: `Giveaway ID: ${giveaway._id}`,
        })
        .setTimestamp();

      const row = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setLabel('🏆 Voir les gagnants')
            .setURL(`${this.siteUrl}/`)
            .setStyle(ButtonStyle.Link)
        );

      await channel.send({ 
        content: '@everyone 🏆 Les gagnants du giveaway ont été annoncés !',
        embeds: [embed], 
        components: [row] 
      });
      console.log(`[DISCORD] Notification de fin envoyée pour: ${giveaway.name} avec ${winners.length} gagnants`);
      return true;
    } catch (error) {
      console.error('[DISCORD] Erreur lors de l\'envoi de la notification de fin:', error.message);
      return false;
    }
  }

  /**
   * Envoyer une notification de participation
   */
  async notifyNewParticipant(giveaway, participant) {
    if (!this.isReady || !this.channelId) {
      return false;
    }

    try {
      const channel = await this.client.channels.fetch(this.channelId).catch(err => {
        console.error(`[DISCORD] ❌ Erreur fetch canal (notifyNewParticipant): ${err.message}`);
        return null;
      });

      if (!channel || (channel.type !== ChannelType.GuildText && channel.type !== ChannelType.GuildAnnouncement)) {
        return false;
      }

      const embed = new EmbedBuilder()
        .setColor(discordConfig.colors.participant)
        .setTitle(`${discordConfig.messages.participant.emoji} ${discordConfig.messages.participant.title}`)
        .setDescription(discordConfig.messages.participant.description)
        .addFields(
          {
            name: 'Giveaway',
            value: giveaway.name,
            inline: false,
          },
          {
            name: 'Participant',
            value: participant.username || 'Utilisateur inconnu',
            inline: true,
          },
          {
            name: 'Total de participants',
            value: `${giveaway.participantCount || 0}`,
            inline: true,
          }
        )
        .setFooter({
          text: `Giveaway ID: ${giveaway._id}`,
        })
        .setTimestamp();

      await channel.send({ 
        content: '@everyone 👤 Un nouvel utilisateur a participé au giveaway !',
        embeds: [embed] 
      });
      return true;
    } catch (error) {
      console.error('[DISCORD] Erreur lors de l\'envoi de la notification de participation:', error.message);
      return false;
    }
  }

  /**
   * Formater la durée du giveaway
   */
  formatDuration(days, hours) {
    const parts = [];
    if (days > 0) parts.push(`${days} jour${days > 1 ? 's' : ''}`);
    if (hours > 0) parts.push(`${hours} heure${hours > 1 ? 's' : ''}`);
    return parts.length > 0 ? parts.join(' et ') : '0 heure';
  }

  /**
   * Arrêter le bot
   */
  async shutdown() {
    if (this.client) {
      await this.client.destroy();
      this.isReady = false;
      console.log('[DISCORD] Bot arrêté');
    }
  }
}

// Exporter une instance unique
module.exports = new DiscordBotService();

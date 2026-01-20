const { Client, GatewayIntentBits, EmbedBuilder, ChannelType, ActionRowBuilder, ButtonBuilder, ButtonStyle, AttachmentBuilder } = require('discord.js');
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
    this.apiUrl = `${siteUrl}/api`;
    console.log('[DISCORD] Site URL configurée:', this.siteUrl);
    console.log('[DISCORD] API URL configurée:', this.apiUrl);
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

      // Récupérer le nombre de photos
      let photoCount = 0;
      
      if (giveaway.photos && giveaway.photos.length > 0) {
        photoCount = giveaway.photos.length;
        console.log(`[DISCORD] Nombre total de photos: ${photoCount}`);
      } else {
        console.log(`[DISCORD] Aucune photo disponible pour ce giveaway`);
      }

      const durationText = this.formatDuration(giveaway.durationDays, giveaway.durationHours);
      const endDate = new Date(giveaway.endDate).toLocaleString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

      // Créer l'embed principal avec les infos
      const mainEmbed = new EmbedBuilder()
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
          },
          {
            name: '📸 Photos',
            value: photoCount > 0 ? `${photoCount} photo${photoCount > 1 ? 's' : ''}` : 'Aucune photo',
            inline: true,
          }
        )
        .setFooter({
          text: `Giveaway ID: ${giveaway._id}`,
        })
        .setTimestamp();

      // Créer les attachments des photos
      const { AttachmentBuilder } = require('discord.js');
      const attachments = [];
      
      if (giveaway.photos && giveaway.photos.length > 0) {
        console.log(`[DISCORD] Préparation de ${photoCount} photo(s) en attachments...`);
        
        giveaway.photos.forEach((photo, idx) => {
          if (photo.imageData) {
            try {
              // Convertir le base64 en Buffer
              const buffer = Buffer.from(photo.imageData, 'base64');
              const filename = `photo_${idx + 1}.jpg`;
              
              // Créer un attachement
              const attachment = new AttachmentBuilder(buffer, { name: filename });
              attachments.push(attachment);
              
              console.log(`[DISCORD] Attachement photo ${idx + 1} créé: ${filename}`);
            } catch (err) {
              console.error(`[DISCORD] Erreur lors de la création de l'attachement photo ${idx + 1}:`, err.message);
            }
          }
        });
      }

      // Créer un bouton pour accéder au site
      const row = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setLabel('🎯 Participer')
            .setURL(this.siteUrl.startsWith('http') ? `${this.siteUrl}/` : `http://localhost:5000/`)
            .setStyle(ButtonStyle.Link)
        );

      // Envoyer le message avec embed et attachments
      await channel.send({ 
        content: '@everyone 🎁 Un nouveau giveaway a été créé !',
        embeds: [mainEmbed],
        files: attachments,
        components: [row] 
      });
      console.log(`[DISCORD] Notification avec ${attachments.length} photo(s) en attachements envoyée pour: ${giveaway.name}`);
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

      // Créer les attachments des photos
      const attachments = [];
      
      if (giveaway.photos && giveaway.photos.length > 0) {
        console.log(`[DISCORD] Préparation de ${giveaway.photos.length} photo(s) en attachments pour la notification de fermeture...`);
        
        giveaway.photos.forEach((photo, idx) => {
          if (photo.imageData) {
            try {
              // Convertir le base64 en Buffer
              const buffer = Buffer.from(photo.imageData, 'base64');
              const filename = `photo_${idx + 1}.jpg`;
              
              // Créer un attachement
              const attachment = new AttachmentBuilder(buffer, { name: filename });
              attachments.push(attachment);
              
              console.log(`[DISCORD] Attachement photo ${idx + 1} créé pour notification de fermeture: ${filename}`);
            } catch (err) {
              console.error(`[DISCORD] Erreur lors de la création de l'attachement photo ${idx + 1}:`, err.message);
            }
          }
        });
      }

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
        files: attachments,
        components: [row] 
      });
      console.log(`[DISCORD] Notification de fermeture envoyée pour: ${giveaway.name} avec ${attachments.length} photo(s)`);
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
            const discordId = winner.discordId;
            const name = winner.discordDisplayName || winner.name || winner.discordUsername || winner.username || 'Utilisateur inconnu';
            // Ping l'utilisateur avec <@discordId> s'il a un ID Discord, sinon affiche juste le nom
            const mention = discordId ? `<@${discordId}>` : `**@${name}**`;
            return `${idx + 1}. ${mention}`;
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

      // Créer les attachments des photos
      const attachments = [];
      
      if (giveaway.photos && giveaway.photos.length > 0) {
        console.log(`[DISCORD] Préparation de ${giveaway.photos.length} photo(s) en attachments pour la notification de fin...`);
        
        giveaway.photos.forEach((photo, idx) => {
          if (photo.imageData) {
            try {
              // Convertir le base64 en Buffer
              const buffer = Buffer.from(photo.imageData, 'base64');
              const filename = `photo_${idx + 1}.jpg`;
              
              // Créer un attachement
              const attachment = new AttachmentBuilder(buffer, { name: filename });
              attachments.push(attachment);
              
              console.log(`[DISCORD] Attachement photo ${idx + 1} créé pour notification de fin: ${filename}`);
            } catch (err) {
              console.error(`[DISCORD] Erreur lors de la création de l'attachement photo ${idx + 1}:`, err.message);
            }
          }
        });
      }

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
        files: attachments,
        components: [row] 
      });
      console.log(`[DISCORD] Notification de fin envoyée pour: ${giveaway.name} avec ${winners.length} gagnants et ${attachments.length} photo(s)`);
      return true;
    } catch (error) {
      console.error('[DISCORD] Erreur lors de l\'envoi de la notification de fin:', error.message);
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
   * Envoyer une notification de jalon (ex: 7 participants)
   */
  async notifyParticipantMilestone(giveaway, participantCount) {
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

      const embed = new EmbedBuilder()
        .setColor('#FFD700') // Couleur or pour les jalons
        .setTitle(`🎯 Jalon atteint! ${participantCount} participants!`)
        .setDescription(`Le giveaway **${giveaway.name}** vient d'atteindre **${participantCount}** participants!`)
        .addFields(
          {
            name: '📊 Détails du giveaway',
            value: `**${giveaway.name}**`,
            inline: false,
          },
          {
            name: '👥 Participants actuels',
            value: `**${participantCount}**`,
            inline: true,
          },
          {
            name: '⏰ Status',
            value: `🟢 ${giveaway.status}`,
            inline: true,
          }
        )
        .setFooter({
          text: `Giveaway ID: ${giveaway._id}`,
        })
        .setTimestamp();

      await channel.send({
        content: '@here 🎉 Un giveaway a atteint un jalon important!',
        embeds: [embed],
      });

      console.log(`[DISCORD] Notification de jalon envoyée pour: ${giveaway.name} (${participantCount} participants)`);
      return true;
    } catch (error) {
      console.error('[DISCORD] Erreur lors de l\'envoi de la notification de jalon:', error.message);
      return false;
    }
  }

  /**
   * Envoyer un tweet au canal Discord
   */
  async sendTweet(message) {
    const tweetChannelId = process.env.DISCORD_TWEET_CHANNEL_ID;

    if (!this.isReady || !tweetChannelId) {
      console.warn(`[DISCORD] ⚠️  Bot non prêt ou canal Twitter non configuré`);
      return false;
    }

    try {
      const channel = await this.client.channels.fetch(tweetChannelId).catch(err => {
        console.error(`[DISCORD] ❌ Erreur fetch canal Twitter: ${err.message}`);
        return null;
      });

      if (!channel) {
        console.error(`[DISCORD] ❌ Canal Twitter introuvable: ${tweetChannelId}`);
        return false;
      }

      await channel.send(`@everyone\n${message}`);
      console.log('[DISCORD] Tweet envoyé avec succès');
      return true;
    } catch (error) {
      console.error('[DISCORD] Erreur lors de l\'envoi du tweet:', error.message);
      return false;
    }
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

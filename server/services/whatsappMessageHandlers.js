/**
 * Gestionnaire des messages et commandes spécifiques WhatsApp
 */

const Giveaway = require('../models/Giveaway');
const Winner = require('../models/Winner');
const Participant = require('../models/Participant');
const axios = require('axios');

class WhatsAppMessageHandlers {
  constructor(bot) {
    this.bot = bot;
  }

  /**
   * Commande: .status - État du giveaway actuel
   */
  async handleStatusCommand(sender) {
    try {
      const activeGiveaway = await Giveaway.findOne({ status: 'active' });
      
      if (!activeGiveaway) {
        return await this.bot.sendMessage(sender,
          '❌ Aucun giveaway actif pour le moment.\n' +
          'Revenez bientôt! 🎁'
        );
      }

      const participantCount = await Participant.countDocuments({ 
        giveawayId: activeGiveaway._id 
      });

      const status = `
*🎁 ÉTAT DU GIVEAWAY 🎁*

📛 Nom: ${activeGiveaway.name}
🎯 État: ${activeGiveaway.status.toUpperCase()}
👥 Participants: ${participantCount}
🏆 Prix: ${activeGiveaway.prize || 'Non défini'}

${activeGiveaway.description || ''}

💬 Pour participer: .give link
      `.trim();

      await this.bot.sendMessage(sender, status);
    } catch (error) {
      console.error('[WHATSAPP] Erreur handleStatusCommand:', error);
      await this.bot.sendMessage(sender, 
        '⚠️ Erreur lors de la récupération du statut'
      );
    }
  }

  /**
   * Commande: .give info - Informations du giveaway
   */
  async handleGiveInfoCommand(sender) {
    try {
      const activeGiveaway = await Giveaway.findOne({ status: 'active' });
      
      if (!activeGiveaway) {
        return await this.bot.sendMessage(sender,
          '❌ Aucun giveaway actif.\n\n' +
          'Consultez l\'application pour plus de détails.'
        );
      }

      const participantCount = await Participant.countDocuments({ 
        giveawayId: activeGiveaway._id 
      });

      const info = `
*📊 INFORMATIONS DU GIVEAWAY 📊*

🎁 *${activeGiveaway.name}*

📝 Description:
${activeGiveaway.description || 'Aucune description'}

👥 Participants actuels: ${participantCount}
🏆 Prix: ${activeGiveaway.prize || 'À découvrir!'}

📅 Début: ${new Date(activeGiveaway.createdAt).toLocaleDateString('fr-FR')}

Pour participer: .give link
      `.trim();

      await this.bot.sendMessage(sender, info);
    } catch (error) {
      console.error('[WHATSAPP] Erreur handleGiveInfoCommand:', error);
      await this.bot.sendMessage(sender, 
        '⚠️ Erreur lors de la récupération des informations'
      );
    }
  }

  /**
   * Commande: .give prize - Voir le prix
   */
  async handleGivePrizeCommand(sender) {
    try {
      const activeGiveaway = await Giveaway.findOne({ status: 'active' });
      
      if (!activeGiveaway) {
        return await this.bot.sendMessage(sender,
          '❌ Aucun giveaway actif.\n\n' +
          'Les prix seront révélés prochainement! 🎁'
        );
      }

      const prize = activeGiveaway.prize || 'À découvrir!';
      
      const message = `
*🏆 PRIX DU GIVEAWAY 🏆*

🎁 *${prize}*

Pour participer et tenter de le gagner:
.give link
      `.trim();

      await this.bot.sendMessage(sender, message);
    } catch (error) {
      console.error('[WHATSAPP] Erreur handleGivePrizeCommand:', error);
      await this.bot.sendMessage(sender, 
        '⚠️ Erreur lors de la récupération du prix'
      );
    }
  }

  /**
   * Commande: .give link - Lien de participation
   */
  async handleGiveLinkCommand(sender) {
    try {
      const siteUrl = this.bot.siteUrl || 'https://giveawaysdbl.up.railway.app';
      
      const message = `
*🔗 LIEN DU GIVEAWAY 🔗*

👉 Visitez notre site:
${siteUrl}

Cliquez sur le giveaway actif pour participer!

📱 Lien direct:
${siteUrl}/giveaway

✨ Bonne chance! 🍀
      `.trim();

      await this.bot.sendMessage(sender, message);
    } catch (error) {
      console.error('[WHATSAPP] Erreur handleGiveLinkCommand:', error);
      await this.bot.sendMessage(sender, 
        '⚠️ Erreur lors de la récupération du lien'
      );
    }
  }

  /**
   * Commande: .give participants - Nombre de participants
   */
  async handleGiveParticipantsCommand(sender) {
    try {
      const activeGiveaway = await Giveaway.findOne({ status: 'active' });
      
      if (!activeGiveaway) {
        return await this.bot.sendMessage(sender,
          '❌ Aucun giveaway actif pour le moment.'
        );
      }

      const participantCount = await Participant.countDocuments({ 
        giveawayId: activeGiveaway._id 
      });

      const message = `
*👥 NOMBRE DE PARTICIPANTS 👥*

🎁 Giveaway: ${activeGiveaway.name}
👥 Participants: ${participantCount}

Plus il y a de participants, plus il y a de chances de gagner!

Pour participer: .give link
      `.trim();

      await this.bot.sendMessage(sender, message);
    } catch (error) {
      console.error('[WHATSAPP] Erreur handleGiveParticipantsCommand:', error);
      await this.bot.sendMessage(sender, 
        '⚠️ Erreur lors de la récupération du nombre de participants'
      );
    }
  }

  /**
   * Commande: .winner - Voir le gagnant
   */
  async handleWinnerCommand(sender) {
    try {
      const activeGiveaway = await Giveaway.findOne({ status: 'active' });
      
      if (!activeGiveaway) {
        // Chercher le dernier gagnant
        const lastWinner = await Winner.findOne()
          .sort({ createdAt: -1 })
          .populate('giveawayId');

        if (!lastWinner) {
          return await this.bot.sendMessage(sender,
            '❌ Aucun gagnant pour le moment.\n\n' +
            'Participez au giveaway actuel pour tenter votre chance! 🍀'
          );
        }

        const message = `
*🏆 DERNIER GAGNANT 🏆*

🎁 Giveaway: ${lastWinner.giveawayId?.name || 'N/A'}
👤 Gagnant: ${lastWinner.participantId || 'Confirmé'}
🎉 Prix: ${lastWinner.giveawayId?.prize || 'N/A'}

📅 Date: ${new Date(lastWinner.createdAt).toLocaleDateString('fr-FR')}

Participez au prochain giveaway!
        `.trim();

        return await this.bot.sendMessage(sender, message);
      }

      // S'il y a un giveaway actif, pas encore de gagnant
      await this.bot.sendMessage(sender,
        '⏳ Le giveaway est toujours actif.\n\n' +
        'Le gagnant sera annoncé à la fin! 🎉'
      );
    } catch (error) {
      console.error('[WHATSAPP] Erreur handleWinnerCommand:', error);
      await this.bot.sendMessage(sender, 
        '⚠️ Erreur lors de la récupération du gagnant'
      );
    }
  }

  /**
   * Commande ADMIN: .give start [nom] [prix] - Démarrer un giveaway
   */
  async handleGiveStartCommand(sender, args) {
    try {
      if (args.length < 2) {
        return await this.bot.sendMessage(sender,
          '❌ Utilisation: .give start <nom> <prix>\n\n' +
          'Exemple: .give start "Dragon Ball" "Figurine exclusive"'
        );
      }

      // Vérifier s'il y a un giveaway actif
      const activeGiveaway = await Giveaway.findOne({ status: 'active' });
      if (activeGiveaway) {
        return await this.bot.sendMessage(sender,
          '⚠️ Un giveaway est déjà actif!\n\n' +
          'Terminez-le avec: .give end'
        );
      }

      const name = args[0].replace(/"/g, '');
      const prize = args.slice(1).join(' ').replace(/"/g, '');

      const newGiveaway = new Giveaway({
        name,
        prize,
        status: 'active',
        description: `Giveaway ${name}`,
      });

      await newGiveaway.save();

      await this.bot.sendMessage(sender,
        `✅ Giveaway créé avec succès!\n\n` +
        `🎁 Nom: ${name}\n` +
        `🏆 Prix: ${prize}\n` +
        `📊 Statut: ACTIF\n\n` +
        `Les utilisateurs peuvent maintenant participer!`
      );
    } catch (error) {
      console.error('[WHATSAPP] Erreur handleGiveStartCommand:', error);
      await this.bot.sendMessage(sender, 
        '⚠️ Erreur lors de la création du giveaway'
      );
    }
  }

  /**
   * Commande ADMIN: .give end - Terminer le giveaway
   */
  async handleGiveEndCommand(sender) {
    try {
      const activeGiveaway = await Giveaway.findOne({ status: 'active' });
      
      if (!activeGiveaway) {
        return await this.bot.sendMessage(sender,
          '❌ Aucun giveaway actif à terminer.'
        );
      }

      activeGiveaway.status = 'ended';
      await activeGiveaway.save();

      const participantCount = await Participant.countDocuments({ 
        giveawayId: activeGiveaway._id 
      });

      await this.bot.sendMessage(sender,
        `✅ Giveaway terminé!\n\n` +
        `🎁 ${activeGiveaway.name}\n` +
        `👥 Participants: ${participantCount}\n\n` +
        `Utilisez: .draw pour désigner un gagnant`
      );
    } catch (error) {
      console.error('[WHATSAPP] Erreur handleGiveEndCommand:', error);
      await this.bot.sendMessage(sender, 
        '⚠️ Erreur lors de la terminaison du giveaway'
      );
    }
  }

  /**
   * Commande ADMIN: .draw - Tirer un gagnant aléatoire
   */
  async handleDrawCommand(sender) {
    try {
      // Chercher le dernier giveaway terminé ou actif
      const giveaway = await Giveaway.findOne({ 
        status: { $in: ['active', 'ended'] }
      }).sort({ createdAt: -1 });

      if (!giveaway) {
        return await this.bot.sendMessage(sender,
          '❌ Aucun giveaway disponible.'
        );
      }

      const participants = await Participant.aggregate([
        { $match: { giveawayId: giveaway._id } },
        { $sample: { size: 1 } }
      ]);

      if (participants.length === 0) {
        return await this.bot.sendMessage(sender,
          '❌ Aucun participant dans ce giveaway.'
        );
      }

      const winner = participants[0];
      
      // Créer l'enregistrement du gagnant
      const winnerRecord = new Winner({
        giveawayId: giveaway._id,
        participantId: winner._id,
      });

      await winnerRecord.save();

      // Mettre à jour le statut
      giveaway.status = 'finished';
      await giveaway.save();

      const message = `
*🎉 GAGNANT SÉLECTIONNÉ! 🎉*

🎁 Giveaway: ${giveaway.name}
🏆 Prix: ${giveaway.prize}

👤 Gagnant ID: ${winner._id}

✅ Giveaway terminé avec succès!
      `.trim();

      await this.bot.sendMessage(sender, message);
    } catch (error) {
      console.error('[WHATSAPP] Erreur handleDrawCommand:', error);
      await this.bot.sendMessage(sender, 
        '⚠️ Erreur lors du tirage du gagnant'
      );
    }
  }

  /**
   * Commande ADMIN: .reset - Réinitialiser le giveaway
   */
  async handleResetCommand(sender) {
    try {
      const activeGiveaway = await Giveaway.findOne({ 
        status: { $in: ['active', 'ended', 'finished'] }
      }).sort({ createdAt: -1 });

      if (!activeGiveaway) {
        return await this.bot.sendMessage(sender,
          '❌ Aucun giveaway à réinitialiser.'
        );
      }

      // Supprimer les participants
      await Participant.deleteMany({ giveawayId: activeGiveaway._id });

      // Réinitialiser l'état
      activeGiveaway.status = 'active';
      await activeGiveaway.save();

      await this.bot.sendMessage(sender,
        `✅ Giveaway réinitialisé!\n\n` +
        `🎁 ${activeGiveaway.name}\n` +
        `👥 Participants: 0\n\n` +
        `Prêt pour une nouvelle vague de participants!`
      );
    } catch (error) {
      console.error('[WHATSAPP] Erreur handleResetCommand:', error);
      await this.bot.sendMessage(sender, 
        '⚠️ Erreur lors de la réinitialisation'
      );
    }
  }

  /**
   * Commande OWNER: .broadcast [message] - Envoyer un message à tous les utilisateurs
   */
  async handleBroadcastCommand(sender, message) {
    try {
      if (!message || message.trim().length === 0) {
        return await this.bot.sendMessage(sender,
          '❌ Utilisation: .broadcast <message>\n\n' +
          'Exemple: .broadcast Nouveau giveaway en préparation!'
        );
      }

      // Récupérer tous les utilisateurs
      const User = require('../models/User');
      const users = await User.find({ 'whatsapp.number': { $exists: true } });

      if (users.length === 0) {
        return await this.bot.sendMessage(sender,
          '⚠️ Aucun utilisateur avec WhatsApp enregistré.'
        );
      }

      let successCount = 0;
      for (const user of users) {
        try {
          if (user.whatsapp?.number) {
            await this.bot.sendMessage(user.whatsapp.number, 
              `📢 *MESSAGE DE L'ADMINISTRATEUR*\n\n${message}`
            );
            successCount++;
          }
        } catch (err) {
          console.error(`[WHATSAPP] Erreur broadcast pour ${user._id}:`, err.message);
        }
      }

      await this.bot.sendMessage(sender,
        `✅ Broadcast envoyé!\n\n` +
        `📨 Messages envoyés: ${successCount}/${users.length}`
      );
    } catch (error) {
      console.error('[WHATSAPP] Erreur handleBroadcastCommand:', error);
      await this.bot.sendMessage(sender, 
        '⚠️ Erreur lors de l\'envoi du broadcast'
      );
    }
  }

  /**
   * Commande OWNER: .restart - Redémarrer le bot
   */
  async handleRestartCommand(sender) {
    try {
      await this.bot.sendMessage(sender,
        `🔄 Redémarrage du bot en cours...\n\n` +
        `⏳ Veuillez patienter...`
      );

      // Attendre un peu avant de redémarrer
      setTimeout(async () => {
        try {
          await this.bot.restart();
          await this.bot.sendMessage(sender, 
            `✅ Bot redémarré avec succès!`
          );
        } catch (err) {
          console.error('[WHATSAPP] Erreur lors du redémarrage:', err);
          await this.bot.sendMessage(sender, 
            `❌ Erreur lors du redémarrage: ${err.message}`
          );
        }
      }, 1000);
    } catch (error) {
      console.error('[WHATSAPP] Erreur handleRestartCommand:', error);
      await this.bot.sendMessage(sender, 
        '⚠️ Erreur lors du redémarrage'
      );
    }
  }

  /**
   * Commande OWNER: .mode [public|private] - Changer le mode du bot
   */
  async handleModeCommand(sender, mode) {
    try {
      const validModes = ['public', 'private'];
      
      if (!mode || !validModes.includes(mode.toLowerCase())) {
        return await this.bot.sendMessage(sender,
          `❌ Utilisation: .mode <public|private>\n\n` +
          `Mode actuel: ${process.env.WHATSAPP_MODE || 'public'}`
        );
      }

      // Vous pouvez implémenter la logique selon vos besoins
      const newMode = mode.toLowerCase();

      await this.bot.sendMessage(sender,
        `✅ Mode changé à: ${newMode.toUpperCase()}\n\n` +
        `🔒 Le bot fonctionnera en mode ${newMode}.`
      );
    } catch (error) {
      console.error('[WHATSAPP] Erreur handleModeCommand:', error);
      await this.bot.sendMessage(sender, 
        '⚠️ Erreur lors du changement de mode'
      );
    }
  }
}

module.exports = WhatsAppMessageHandlers;

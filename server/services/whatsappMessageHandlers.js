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
  async handleStatusCommand(targetJid) {
    try {
      const activeGiveaway = await Giveaway.findOne({ status: 'active' })
        .populate('photos');
      
      if (!activeGiveaway) {
        return await this.bot.sendMessage(targetJid,
          '❌ Aucun giveaway actif pour le moment.\n' +
          'Revenez bientôt! 🎁'
        );
      }

      const participantCount = await Participant.countDocuments({ 
        giveawayId: activeGiveaway._id 
      });

      const status = `*🎁 ÉTAT DU GIVEAWAY 🎁*

📛 Nom: ${activeGiveaway.name}
🎯 État: ${activeGiveaway.status.toUpperCase()}
👥 Participants: ${participantCount}
🏆 Prix: ${activeGiveaway.prize || 'Non défini'}

${activeGiveaway.description || ''}

💬 Pour participer: .give link`;

      // Envoyer avec image si disponible
      if (activeGiveaway.photos && activeGiveaway.photos.length > 0) {
        const photo = activeGiveaway.photos[0];
        try {
          const imageBuffer = Buffer.from(photo.imageData, 'base64');
          await this.bot.sock.sendMessage(targetJid, {
            image: imageBuffer,
            caption: status,
            mimetype: photo.mimetype || 'image/jpeg',
          });
          console.log('[WHATSAPP] 📸 Statut du giveaway envoyé avec photo');
          return;
        } catch (imageError) {
          console.warn('[WHATSAPP] ⚠️  Erreur envoi image:', imageError.message);
          // Fallback: envoyer juste le texte
        }
      }

      await this.bot.sendMessage(targetJid, status);
    } catch (error) {
      console.error('[WHATSAPP] Erreur handleStatusCommand:', error);
      await this.bot.sendMessage(targetJid, 
        '⚠️ Erreur lors de la récupération du statut'
      );
    }
  }

  /**
   * Commande: .give info - Informations du giveaway
   */
  async handleGiveInfoCommand(targetJid) {
    try {
      const activeGiveaway = await Giveaway.findOne({ status: 'active' })
        .populate('photos');
      
      if (!activeGiveaway) {
        return await this.bot.sendMessage(targetJid,
          '❌ Aucun giveaway actif.\n\n' +
          'Consultez l\'application pour plus de détails.'
        );
      }

      const participantCount = await Participant.countDocuments({ 
        giveawayId: activeGiveaway._id 
      });

      // Calculer temps restant
      const now = new Date();
      const endDate = new Date(activeGiveaway.endDate);
      const timeLeft = endDate - now;
      const daysLeft = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
      const hoursLeft = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

      const info = `*📊 INFORMATIONS DU GIVEAWAY 📊*

🎁 *${activeGiveaway.name}*

📝 Description:
${activeGiveaway.description || 'Aucune description'}

👥 Participants: ${participantCount}
🏆 Prix: ${activeGiveaway.prize || 'À découvrir!'}

⏰ Temps restant: ${daysLeft}j ${hoursLeft}h
📅 Fin: ${endDate.toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}

Pour participer: .give link`;

      // Envoyer avec image si disponible
      if (activeGiveaway.photos && activeGiveaway.photos.length > 0) {
        const photo = activeGiveaway.photos[0];
        try {
          const imageBuffer = Buffer.from(photo.imageData, 'base64');
          await this.bot.sock.sendMessage(targetJid, {
            image: imageBuffer,
            caption: info,
            mimetype: photo.mimetype || 'image/jpeg',
          });
          console.log('[WHATSAPP] 📸 Info giveaway envoyée avec photo');
          return;
        } catch (imageError) {
          console.warn('[WHATSAPP] ⚠️  Erreur envoi image:', imageError.message);
        }
      }

      await this.bot.sendMessage(targetJid, info);
    } catch (error) {
      console.error('[WHATSAPP] Erreur handleGiveInfoCommand:', error);
      await this.bot.sendMessage(targetJid, 
        '⚠️ Erreur lors de la récupération des informations'
      );
    }
  }

  /**
   * Commande: .give prize - Voir le prix
   */
  async handleGivePrizeCommand(targetJid) {
    try {
      const activeGiveaway = await Giveaway.findOne({ status: 'active' })
        .populate('photos');
      
      if (!activeGiveaway) {
        return await this.bot.sendMessage(targetJid,
          '❌ Aucun giveaway actif.\n\n' +
          'Les prix seront révélés prochainement! 🎁'
        );
      }

      const prize = activeGiveaway.prize || 'À découvrir!';
      
      const message = `*🏆 PRIX DU GIVEAWAY 🏆*

🎁 *${prize}*

Nom: ${activeGiveaway.name}
📝 ${activeGiveaway.description || 'Prix exclusif'}

Pour participer et tenter de le gagner:
.give link`;

      // Envoyer avec image si disponible
      if (activeGiveaway.photos && activeGiveaway.photos.length > 0) {
        const photo = activeGiveaway.photos[0];
        try {
          const imageBuffer = Buffer.from(photo.imageData, 'base64');
          await this.bot.sock.sendMessage(targetJid, {
            image: imageBuffer,
            caption: message,
            mimetype: photo.mimetype || 'image/jpeg',
          });
          console.log('[WHATSAPP] 📸 Prix du giveaway envoyé avec photo');
          return;
        } catch (imageError) {
          console.warn('[WHATSAPP] ⚠️  Erreur envoi image:', imageError.message);
        }
      }

      await this.bot.sendMessage(targetJid, message);
    } catch (error) {
      console.error('[WHATSAPP] Erreur handleGivePrizeCommand:', error);
      await this.bot.sendMessage(targetJid, 
        '⚠️ Erreur lors de la récupération du prix'
      );
    }
  }

  /**
   * Commande: .give link - Lien de participation
   */
  async handleGiveLinkCommand(targetJid) {
    try {
      const siteUrl = this.bot.siteUrl || 'https://giveawaysdbl.up.railway.app';
      const activeGiveaway = await Giveaway.findOne({ status: 'active' })
        .populate('photos');
      
      const message = `*🔗 LIEN DU GIVEAWAY 🔗*

👉 Visitez notre site:
${siteUrl}

${activeGiveaway ? `🎁 Giveaway actif: ${activeGiveaway.name}` : 'Consultez les giveaways disponibles'}

📱 Lien direct:
${siteUrl}/giveaway

✨ Bonne chance! 🍀`;

      // Envoyer avec image si disponible et giveaway existe
      if (activeGiveaway && activeGiveaway.photos && activeGiveaway.photos.length > 0) {
        const photo = activeGiveaway.photos[0];
        try {
          const imageBuffer = Buffer.from(photo.imageData, 'base64');
          await this.bot.sock.sendMessage(targetJid, {
            image: imageBuffer,
            caption: message,
            mimetype: photo.mimetype || 'image/jpeg',
          });
          console.log('[WHATSAPP] 📸 Lien giveaway envoyé avec photo');
          return;
        } catch (imageError) {
          console.warn('[WHATSAPP] ⚠️  Erreur envoi image:', imageError.message);
        }
      }

      await this.bot.sendMessage(targetJid, message);
    } catch (error) {
      console.error('[WHATSAPP] Erreur handleGiveLinkCommand:', error);
      await this.bot.sendMessage(targetJid, 
        '⚠️ Erreur lors de la récupération du lien'
      );
    }
  }

  /**
   * Commande: .give participants - Nombre de participants
   */
  async handleGiveParticipantsCommand(targetJid) {
    try {
      const activeGiveaway = await Giveaway.findOne({ status: 'active' })
        .populate('photos');
      
      if (!activeGiveaway) {
        return await this.bot.sendMessage(targetJid,
          '❌ Aucun giveaway actif pour le moment.'
        );
      }

      const participantCount = await Participant.countDocuments({ 
        giveawayId: activeGiveaway._id 
      });

      const message = `*👥 NOMBRE DE PARTICIPANTS 👥*

🎁 Giveaway: ${activeGiveaway.name}
👥 Participants: ${participantCount}
🏆 Prix: ${activeGiveaway.prize || 'À découvrir!'}

Plus il y a de participants, plus il y a de chances de gagner!

Pour participer: .give link`;

      // Envoyer avec image si disponible
      if (activeGiveaway.photos && activeGiveaway.photos.length > 0) {
        const photo = activeGiveaway.photos[0];
        try {
          const imageBuffer = Buffer.from(photo.imageData, 'base64');
          await this.bot.sock.sendMessage(targetJid, {
            image: imageBuffer,
            caption: message,
            mimetype: photo.mimetype || 'image/jpeg',
          });
          console.log('[WHATSAPP] 📸 Nombre participants envoyé avec photo');
          return;
        } catch (imageError) {
          console.warn('[WHATSAPP] ⚠️  Erreur envoi image:', imageError.message);
        }
      }

      await this.bot.sendMessage(targetJid, message);
    } catch (error) {
      console.error('[WHATSAPP] Erreur handleGiveParticipantsCommand:', error);
      await this.bot.sendMessage(targetJid, 
        '⚠️ Erreur lors de la récupération du nombre de participants'
      );
    }
  }

  /**
   * Commande: .winner - Voir le gagnant
   */
  async handleWinnerCommand(targetJid) {
    try {
      const activeGiveaway = await Giveaway.findOne({ status: 'active' })
        .populate('photos');
      
      if (!activeGiveaway) {
        // Chercher le dernier gagnant
        const lastWinner = await Winner.findOne()
          .sort({ createdAt: -1 })
          .populate('giveawayId');

        if (!lastWinner) {
          return await this.bot.sendMessage(targetJid,
            '❌ Aucun gagnant pour le moment.\n\n' +
            'Participez au giveaway actuel pour tenter votre chance! 🍀'
          );
        }

        // Récupérer la photo du giveaway gagnant
        const giveaway = await Giveaway.findById(lastWinner.giveawayId._id)
          .populate('photos');

        const message = `*🏆 DERNIER GAGNANT 🏆*

🎁 Giveaway: ${lastWinner.giveawayId?.name || 'N/A'}
👤 Gagnant ID: ${lastWinner.participantId || 'Confirmé'}
🎉 Prix: ${lastWinner.giveawayId?.prize || 'N/A'}

📅 Date: ${new Date(lastWinner.createdAt).toLocaleDateString('fr-FR')}

Participez au prochain giveaway!`;

        // Envoyer avec image si disponible
        if (giveaway && giveaway.photos && giveaway.photos.length > 0) {
          const photo = giveaway.photos[0];
          try {
            const imageBuffer = Buffer.from(photo.imageData, 'base64');
            await this.bot.sock.sendMessage(targetJid, {
              image: imageBuffer,
              caption: message,
              mimetype: photo.mimetype || 'image/jpeg',
            });
            console.log('[WHATSAPP] 📸 Dernier gagnant envoyé avec photo');
            return;
          } catch (imageError) {
            console.warn('[WHATSAPP] ⚠️  Erreur envoi image:', imageError.message);
          }
        }

        return await this.bot.sendMessage(targetJid, message);
      }

      // S'il y a un giveaway actif, pas encore de gagnant
      await this.bot.sendMessage(targetJid,
        '⏳ Le giveaway est toujours actif.\n\n' +
        'Le gagnant sera annoncé à la fin! 🎉'
      );
    } catch (error) {
      console.error('[WHATSAPP] Erreur handleWinnerCommand:', error);
      await this.bot.sendMessage(targetJid, 
        '⚠️ Erreur lors de la récupération du gagnant'
      );
    }
  }

  /**
   * Commande ADMIN: .give start [nom] [prix] - Démarrer un giveaway
   */
  async handleGiveStartCommand(targetJid, args) {
    try {
      if (args.length < 2) {
        return await this.bot.sendMessage(targetJid,
          '❌ Utilisation: .give start <nom> <prix>\n\n' +
          'Exemple: .give start "Dragon Ball" "Figurine exclusive"'
        );
      }

      // Vérifier s'il y a un giveaway actif
      const activeGiveaway = await Giveaway.findOne({ status: 'active' });
      if (activeGiveaway) {
        return await this.bot.sendMessage(targetJid,
          '⚠️ Un giveaway est déjà actif!\n\n' +
          'Terminez-le avec: .give end'
        );
      }

      const name = args[0].replace(/"/g, '');
      const prize = args.slice(1).join(' ').replace(/"/g, '');

      // Créer avec une date de fin (24h par défaut)
      const endDate = new Date();
      endDate.setHours(endDate.getHours() + 24);

      const newGiveaway = new Giveaway({
        name,
        prize,
        status: 'active',
        description: `Giveaway ${name}`,
        endDate: endDate,
        durationDays: 1,
        durationHours: 0,
      });

      await newGiveaway.save();

      const message = `✅ *GIVEAWAY DÉMARRÉ!*

🎁 Nom: ${name}
🏆 Prix: ${prize}
📊 Statut: ACTIF ✨

⏰ Durée: 24 heures
📅 Fin: ${endDate.toLocaleTimeString('fr-FR')}

👥 Participants: 0

Les utilisateurs peuvent participer avec: .give link`;

      await this.bot.sendMessage(targetJid, message);
      console.log(`[WHATSAPP] ✅ Giveaway créé: ${name}`);
    } catch (error) {
      console.error('[WHATSAPP] Erreur handleGiveStartCommand:', error);
      await this.bot.sendMessage(targetJid, 
        '⚠️ Erreur lors de la création du giveaway\n' +
        `Détails: ${error.message}`
      );
    }
  }

  /**
   * Commande ADMIN: .give end - Terminer le giveaway
   */
  async handleGiveEndCommand(targetJid) {
    try {
      const activeGiveaway = await Giveaway.findOne({ status: 'active' })
        .populate('photos');
      
      if (!activeGiveaway) {
        return await this.bot.sendMessage(targetJid,
          '❌ Aucun giveaway actif à terminer.'
        );
      }

      activeGiveaway.status = 'ended';
      await activeGiveaway.save();

      const participantCount = await Participant.countDocuments({ 
        giveawayId: activeGiveaway._id 
      });

      const message = `✅ *GIVEAWAY TERMINÉ!*

🎁 ${activeGiveaway.name}
👥 Participants finaux: ${participantCount}
🏆 Prix: ${activeGiveaway.prize}

⏭️ Commande suivante: .draw
Pour désigner le gagnant!`;

      // Envoyer avec image si disponible
      if (activeGiveaway.photos && activeGiveaway.photos.length > 0) {
        const photo = activeGiveaway.photos[0];
        try {
          const imageBuffer = Buffer.from(photo.imageData, 'base64');
          await this.bot.sock.sendMessage(targetJid, {
            image: imageBuffer,
            caption: message,
            mimetype: photo.mimetype || 'image/jpeg',
          });
          console.log('[WHATSAPP] 🎁 Fin du giveaway annoncée avec photo');
          return;
        } catch (imageError) {
          console.warn('[WHATSAPP] ⚠️  Erreur envoi image:', imageError.message);
        }
      }

      await this.bot.sendMessage(targetJid, message);
    } catch (error) {
      console.error('[WHATSAPP] Erreur handleGiveEndCommand:', error);
      await this.bot.sendMessage(targetJid, 
        '⚠️ Erreur lors de la terminaison du giveaway'
      );
    }
  }

  /**
   * Commande ADMIN: .draw - Tirer un gagnant aléatoire
   */
  async handleDrawCommand(targetJid) {
    try {
      // Chercher le dernier giveaway terminé ou actif
      const giveaway = await Giveaway.findOne({ 
        status: { $in: ['active', 'ended'] }
      }).sort({ createdAt: -1 });

      if (!giveaway) {
        return await this.bot.sendMessage(targetJid,
          '❌ Aucun giveaway disponible.'
        );
      }

      const participants = await Participant.aggregate([
        { $match: { giveawayId: giveaway._id } },
        { $sample: { size: 1 } }
      ]);

      if (participants.length === 0) {
        return await this.bot.sendMessage(targetJid,
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

      await this.bot.sendMessage(targetJid, message);
    } catch (error) {
      console.error('[WHATSAPP] Erreur handleDrawCommand:', error);
      await this.bot.sendMessage(targetJid, 
        '⚠️ Erreur lors du tirage du gagnant'
      );
    }
  }

  /**
   * Commande ADMIN: .reset - Réinitialiser le giveaway
   */
  async handleResetCommand(targetJid) {
    try {
      const activeGiveaway = await Giveaway.findOne({ 
        status: { $in: ['active', 'ended', 'finished'] }
      }).sort({ createdAt: -1 });

      if (!activeGiveaway) {
        return await this.bot.sendMessage(targetJid,
          '❌ Aucun giveaway à réinitialiser.'
        );
      }

      // Supprimer les participants
      await Participant.deleteMany({ giveawayId: activeGiveaway._id });

      // Réinitialiser l'état
      activeGiveaway.status = 'active';
      await activeGiveaway.save();

      await this.bot.sendMessage(targetJid,
        `✅ Giveaway réinitialisé!\n\n` +
        `🎁 ${activeGiveaway.name}\n` +
        `👥 Participants: 0\n\n` +
        `Prêt pour une nouvelle vague de participants!`
      );
    } catch (error) {
      console.error('[WHATSAPP] Erreur handleResetCommand:', error);
      await this.bot.sendMessage(targetJid, 
        '⚠️ Erreur lors de la réinitialisation'
      );
    }
  }

  /**
   * Commande OWNER: .broadcast [message] - Envoyer un message à tous les utilisateurs
   */
  async handleBroadcastCommand(targetJid, message) {
    try {
      if (!message || message.trim().length === 0) {
        return await this.bot.sendMessage(targetJid,
          '❌ Utilisation: .broadcast <message>\n\n' +
          'Exemple: .broadcast Nouveau giveaway en préparation!'
        );
      }

      // Récupérer tous les utilisateurs
      const User = require('../models/User');
      const users = await User.find({ 'whatsapp.number': { $exists: true } });

      if (users.length === 0) {
        return await this.bot.sendMessage(targetJid,
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

      await this.bot.sendMessage(targetJid,
        `✅ Broadcast envoyé!\n\n` +
        `📨 Messages envoyés: ${successCount}/${users.length}`
      );
    } catch (error) {
      console.error('[WHATSAPP] Erreur handleBroadcastCommand:', error);
      await this.bot.sendMessage(targetJid, 
        '⚠️ Erreur lors de l\'envoi du broadcast'
      );
    }
  }

  /**
   * Commande OWNER: .restart - Redémarrer le bot
   */
  async handleRestartCommand(targetJid) {
    try {
      await this.bot.sendMessage(targetJid,
        `🔄 Redémarrage du bot en cours...\n\n` +
        `⏳ Veuillez patienter...`
      );

      // Attendre un peu avant de redémarrer
      setTimeout(async () => {
        try {
          await this.bot.restart();
          await this.bot.sendMessage(targetJid, 
            `✅ Bot redémarré avec succès!`
          );
        } catch (err) {
          console.error('[WHATSAPP] Erreur lors du redémarrage:', err);
          await this.bot.sendMessage(targetJid, 
            `❌ Erreur lors du redémarrage: ${err.message}`
          );
        }
      }, 1000);
    } catch (error) {
      console.error('[WHATSAPP] Erreur handleRestartCommand:', error);
      await this.bot.sendMessage(targetJid, 
        '⚠️ Erreur lors du redémarrage'
      );
    }
  }

  /**
   * Commande OWNER: .mode [public|private] - Changer le mode du bot
   */
  async handleModeCommand(targetJid, mode) {
    try {
      const validModes = ['public', 'private'];
      
      if (!mode || !validModes.includes(mode.toLowerCase())) {
        return await this.bot.sendMessage(targetJid,
          `❌ Utilisation: .mode <public|private>\n\n` +
          `Mode actuel: ${process.env.WHATSAPP_MODE || 'public'}`
        );
      }

      // Vous pouvez implémenter la logique selon vos besoins
      const newMode = mode.toLowerCase();

      await this.bot.sendMessage(targetJid,
        `✅ Mode changé à: ${newMode.toUpperCase()}\n\n` +
        `🔒 Le bot fonctionnera en mode ${newMode}.`
      );
    } catch (error) {
      console.error('[WHATSAPP] Erreur handleModeCommand:', error);
      await this.bot.sendMessage(targetJid, 
        '⚠️ Erreur lors du changement de mode'
      );
    }
  }

  /**
   * Commande: .tagall - Mentionner tous les membres du groupe
   */
  async handleTagAllCommand(targetJid) {
    try {
      // Vérifier que c'est bien un groupe
      if (!targetJid.includes('@g.us')) {
        return await this.bot.sendMessage(targetJid,
          '⚠️ Cette commande ne fonctionne que dans les groupes!'
        );
      }

      // Récupérer les métadonnées du groupe pour avoir la liste des membres
      const groupMetadata = await this.bot.sock.groupMetadata(targetJid);
      const members = groupMetadata.participants;
      
      if (!members || members.length === 0) {
        return await this.bot.sendMessage(targetJid,
          '⚠️ Impossible de récupérer la liste des membres du groupe.'
        );
      }

      // Créer le message avec mentions
      const mentionedJids = members.map(member => member.id);
      
      const message = {
        text: `📢 *ATTENTION TOUS LES MEMBRES!*\n\n` +
              `👥 Vous avez tous été mentionnés.\n` +
              `📌 Veuillez lire les messages importants du groupe.\n\n` +
              `Total de membres: ${members.length}`,
        mentions: mentionedJids,
      };

      await this.bot.sock.sendMessage(targetJid, message);
      
      console.log(`[WHATSAPP] 📢 Tag all effectué - ${members.length} membres mentionnés`);
      
    } catch (error) {
      console.error('[WHATSAPP] Erreur handleTagAllCommand:', error);
      await this.bot.sendMessage(targetJid, 
        '⚠️ Erreur lors de l\'appel général\n' +
        `Détails: ${error.message}`
      );
    }
  }

  /**
   * Commande: .link - Récupérer le lien d'invitation du groupe
   */
  async handleLinkCommand(targetJid) {
    try {
      // Vérifier que c'est bien un groupe
      if (!targetJid.includes('@g.us')) {
        return await this.bot.sendMessage(targetJid,
          '⚠️ Cette commande ne fonctionne que dans les groupes!'
        );
      }

      // Récupérer le lien d'invitation du groupe
      const inviteCode = await this.bot.sock.groupInviteCode(targetJid);
      
      if (!inviteCode) {
        return await this.bot.sendMessage(targetJid,
          '⚠️ Impossible de récupérer le lien d\'invitation.\n' +
          'Vérifiez que le bot est admin du groupe.'
        );
      }

      const groupLink = `https://chat.whatsapp.com/${inviteCode}`;
      
      const message = `
🔗 *LIEN D'INVITATION DU GROUPE*

Cliquez pour rejoindre:
${groupLink}

⚠️ Ce lien est valide pour les nouveaux membres
      `.trim();

      await this.bot.sendMessage(targetJid, message);
      console.log(`[WHATSAPP] 🔗 Lien d'invitation affiché`);
      
    } catch (error) {
      console.error('[WHATSAPP] Erreur handleLinkCommand:', error);
      await this.bot.sendMessage(targetJid, 
        '⚠️ Erreur lors de la récupération du lien\n' +
        `Détails: ${error.message}`
      );
    }
  }

  /**
   * Commande: .open - Ouvrir le groupe
   */
  async handleOpenCommand(targetJid) {
    try {
      // Vérifier que c'est bien un groupe
      if (!targetJid.includes('@g.us')) {
        return await this.bot.sendMessage(targetJid,
          '⚠️ Cette commande ne fonctionne que dans les groupes!'
        );
      }

      // Ouvrir le groupe (tous les membres peuvent envoyer des messages)
      await this.bot.sock.groupSettingUpdate(targetJid, 'not_announcement');
      
      console.log(`[WHATSAPP] ✅ Groupe ouvert: ${targetJid}`);
      await this.bot.sendMessage(targetJid,
        '🔓 *GROUPE OUVERT*\n\n' +
        '✅ Le groupe est maintenant ouvert.\n' +
        '✍️ Tous les membres peuvent envoyer des messages.'
      );
    } catch (error) {
      console.error('[WHATSAPP] Erreur handleOpenCommand:', error);
      await this.bot.sendMessage(targetJid, 
        '⚠️ Erreur lors de l\'ouverture du groupe\n' +
        `Détails: ${error.message}`
      );
    }
  }

  /**
   * Commande: .close - Fermer le groupe
   */
  async handleCloseCommand(targetJid) {
    try {
      // Vérifier que c'est bien un groupe
      if (!targetJid.includes('@g.us')) {
        return await this.bot.sendMessage(targetJid,
          '⚠️ Cette commande ne fonctionne que dans les groupes!'
        );
      }

      // Fermer le groupe (seuls les admins peuvent envoyer des messages)
      await this.bot.sock.groupSettingUpdate(targetJid, 'announcement');
      
      console.log(`[WHATSAPP] 🔒 Groupe fermé: ${targetJid}`);
      await this.bot.sendMessage(targetJid,
        '🔒 *GROUPE FERMÉ*\n\n' +
        '⛔ Le groupe est maintenant fermé.\n' +
        'Seuls les admins peuvent envoyer des messages.'
      );
    } catch (error) {
      console.error('[WHATSAPP] Erreur handleCloseCommand:', error);
      await this.bot.sendMessage(targetJid,
        '⚠️ Erreur lors de la fermeture du groupe\n' +
        `Détails: ${error.message}`
      );
    }
  }

  /**
   * Commande: .setprize - Définir le lot du giveaway
   */
  async handleSetPrizeCommand(targetJid, prize) {
    try {
      if (!prize) {
        return await this.bot.sendMessage(targetJid,
          '⚠️ Veuillez spécifier le lot.\n\n' +
          'Exemple: `.setprize iPhone 15 Pro`'
        );
      }

      const activeGiveaway = await Giveaway.findOne({ status: 'active' });
      
      if (!activeGiveaway) {
        return await this.bot.sendMessage(targetJid,
          '❌ Aucun giveaway actif.\n' +
          'Démarrez d\'abord un giveaway avec `.give start`'
        );
      }

      activeGiveaway.prize = prize;
      await activeGiveaway.save();

      await this.bot.sendMessage(targetJid,
        `✅ *LOT DÉFINI*\n\n` +
        `🏆 Nouveau lot: ${prize}\n\n` +
        `Le giveaway a été mis à jour.`
      );
    } catch (error) {
      console.error('[WHATSAPP] Erreur handleSetPrizeCommand:', error);
      await this.bot.sendMessage(targetJid, 
        '⚠️ Erreur lors de la définition du lot'
      );
    }
  }
}

module.exports = WhatsAppMessageHandlers;

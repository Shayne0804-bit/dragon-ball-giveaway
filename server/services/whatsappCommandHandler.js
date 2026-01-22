/**
 * Gestionnaire des commandes WhatsApp
 */

const commands = require('../config/whatsappCommands');
const OtakuRPGCommands = require('./otakuRPGCommands');
const commandDispatcher = require('./commandDispatcher');

class CommandHandler {
  constructor(whatsappBot) {
    this.bot = whatsappBot;
    this.commandPrefix = '!'; // Changé de '.' à '!'
    this.otakuRPG = new OtakuRPGCommands(whatsappBot);
    
    // Récupérer les numéros owner et les nettoyer (garder seulement les chiffres)
    let ownerNumbers = [];
    if (process.env.WHATSAPP_OWNER_NUMBERS) {
      ownerNumbers = process.env.WHATSAPP_OWNER_NUMBERS
        .split(',')
        .map(num => num.trim().replace(/\D/g, '')) // Garder seulement les chiffres
        .filter(num => num.length > 0);
    }
    
    // Si pas de numéros owner, utiliser le numéro du bot
    if (ownerNumbers.length === 0) {
      ownerNumbers = [whatsappBot.phoneNumber];
      console.log('[COMMANDS] ℹ️  Pas de WHATSAPP_OWNER_NUMBERS, utilisation du numéro du bot');
    }
    
    this.ownerNumbers = ownerNumbers;
    console.log(`[COMMANDS] 👑 Numéros owners configurés (format propre): ${this.ownerNumbers.join(', ')}`);
  }

  /**
   * Parser un message et extraire la commande
   */
  parseCommand(message) {
    if (!message.startsWith(this.commandPrefix)) {
      return null;
    }

    const args = message.slice(this.commandPrefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    return {
      command,
      args,
      fullCommand: message,
    };
  }

  /**
   * Vérifier la permission de l'utilisateur
   */
  async checkPermission(userNumber, requiredPermission) {
    // Nettoyer le numéro utilisateur (enlever @c.us, @lid et espaces)
    const cleanedUserNumber = userNumber
      .replace(/@c.us|@lid|@g.us/g, '')  // Enlever tous les formats WhatsApp
      .replace(/\D/g, '') // Garder seulement les chiffres
      .trim();

    console.log(`[COMMANDS] 🔐 Vérification permission: ${userNumber} → ${cleanedUserNumber}`);
    console.log(`[COMMANDS] 🔐 Format original: ${userNumber.split('@')[1] || 'DIRECT'}`);
    console.log(`[COMMANDS] 🔐 Numéros owners: ${JSON.stringify(this.ownerNumbers)}`);

    if (requiredPermission === 'all') {
      return true;
    }

    if (requiredPermission === 'owner') {
      const isOwner = this.ownerNumbers.some(ownerNum => {
        const cleanedOwner = ownerNum.replace(/\D/g, '').trim();
        return cleanedUserNumber === cleanedOwner;
      });
      console.log(`[COMMANDS] 🔐 Est owner? ${isOwner}`);
      return isOwner;
    }

    if (requiredPermission === 'admin') {
      // À implémenter selon votre système d'admin
      const isAdmin = this.ownerNumbers.some(ownerNum => {
        const cleanedOwner = ownerNum.replace(/\D/g, '').trim();
        return cleanedUserNumber === cleanedOwner;
      });
      console.log(`[COMMANDS] 🔐 Est admin? ${isAdmin}`);
      return isAdmin;
    }

    return false;
  }

  /**
   * Trouver la commande dans la config
   */
  findCommand(commandName) {
    for (const category of Object.values(commands)) {
      if (category[commandName]) {
        return category[commandName];
      }
    }
    return null;
  }

  /**
   * Générer le menu des commandes Otaku RPG
   */
  generateMenu() {
    let menu = '╔════════════════════════════════════════╗\n';
    menu += '║   🎌 SYSTÈME OTAKU RPG 🎌              ║\n';
    menu += '║   Bienvenue dans l\'univers Otaku!     ║\n';
    menu += '╚════════════════════════════════════════╝\n\n';

    menu += '⭐ *PROFIL & STATISTIQUES*\n';
    menu += '─────────────────────────\n';
    Object.entries(commands.PROFILE).forEach(([cmd, info]) => {
      menu += `${info.usage} - ${info.description}\n`;
    });

    menu += '\n⚔️ *COMBATS & DUELS*\n';
    menu += '─────────────────────────\n';
    Object.entries(commands.COMBAT).forEach(([cmd, info]) => {
      menu += `${info.usage} - ${info.description}\n`;
    });

    menu += '\n🎯 *QUÊTES & MISSIONS*\n';
    menu += '─────────────────────────\n';
    Object.entries(commands.QUESTS).forEach(([cmd, info]) => {
      menu += `${info.usage} - ${info.description}\n`;
    });

    menu += '\n📚 *QUIZ & QUESTIONS*\n';
    menu += '─────────────────────────\n';
    Object.entries(commands.QUIZ).forEach(([cmd, info]) => {
      menu += `${info.usage} - ${info.description}\n`;
    });

    menu += '\n🎌 *ANIME & MANGA*\n';
    menu += '─────────────────────────\n';
    Object.entries(commands.ANIME).forEach(([cmd, info]) => {
      menu += `${info.usage} - ${info.description}\n`;
    });

    menu += '\n🖼️ *IMAGES & ASSETS*\n';
    menu += '─────────────────────────\n';
    Object.entries(commands.IMAGES).forEach(([cmd, info]) => {
      menu += `${info.usage} - ${info.description}\n`;
    });

    menu += '\n👘 *PERSONNAGES ANIME*\n';
    menu += '─────────────────────────\n';
    Object.entries(commands.CHARACTERS).forEach(([cmd, info]) => {
      menu += `${info.usage}\n`;
    });

    menu += '\n🎲 *MINI-JEUX*\n';
    menu += '─────────────────────────\n';
    Object.entries(commands.MINIGAMES).forEach(([cmd, info]) => {
      menu += `${info.usage} - ${info.description}\n`;
    });

    menu += '\n💎 *LOOT & INVENTAIRE*\n';
    menu += '─────────────────────────\n';
    Object.entries(commands.LOOT).forEach(([cmd, info]) => {
      menu += `${info.usage} - ${info.description}\n`;
    });

    menu += '\n🏆 *CLASSEMENTS*\n';
    menu += '─────────────────────────\n';
    Object.entries(commands.RANKING).forEach(([cmd, info]) => {
      menu += `${info.usage} - ${info.description}\n`;
    });

    menu += '\n😂 *FUN & ENTERTAINMENT*\n';
    menu += '─────────────────────────\n';
    Object.entries(commands.FUN).forEach(([cmd, info]) => {
      menu += `${info.usage} - ${info.description}\n`;
    });

    menu += '\n🤖 *BOT & INFORMATION*\n';
    menu += '─────────────────────────\n';
    Object.entries(commands.BOT_INFO).forEach(([cmd, info]) => {
      menu += `${info.usage} - ${info.description}\n`;
    });

    menu += '\n📋 *GROUPE & ADMINISTRATION*\n';
    menu += '─────────────────────────\n';
    Object.entries(commands.GROUP_ADMIN).forEach(([cmd, info]) => {
      menu += `${info.usage} - ${info.description}\n`;
    });

    menu += '\n\n💡 Tapez !help [commande] pour plus de détails\n';
    menu += '🎌 Total: 57 commandes disponibles!\n';

    return menu;
  }

  /**
   * Générer l'aide rapide
   */
  generateHelp() {
    return `╔════════════════════════════════════╗
║     🆘 AIDE - SYSTÈME OTAKU RPG 🆘  ║
╚════════════════════════════════════╝

*Commandes essentielles:*
!menu - Voir toutes les commandes disponibles
!ping - Vérifier si le bot répond
!profil - Voir ton profil otaku complet
!stats - Tes statistiques détaillées
!help [commande] - Aide sur une commande

*Grind XP (pour monter de niveau):*
!quotidien - Mission quotidienne (50 XP)
!hebdo - Mission hebdomadaire (200 XP)
!duel @user - Duel contre un joueur (gagne XP)
!pfc [pierre|feuille|ciseaux] - Mini-jeu (5-20 XP)

*Divertissement:*
!quiz - Quiz otaku aléatoire
!waifu - Image waifu aléatoire
!anime [nom] - Infos sur un anime
!ship @user1 @user2 - Shipper deux personnes

*Admin:*
!tagall - Mentionner tous les membres
!link - Lien d'invitation du groupe

*Utilisation:*
Les commandes commencent par ! (point d'exclamation)
Exemple: !ping ou !profil

📱 Pour contacter l'admin: Utilisez !menu`;
  }

  /**
   * Traiter une commande
   */
  async handleCommand(command, args, sender, whatsappBot, remoteJid = null) {
    // Si remoteJid non fourni, utiliser sender (pour rétro-compatibilité)
    const targetJid = remoteJid || sender;
    
    // Essayer de construire des commandes multi-mots
    // Ex: "give start" au lieu de "give" + "start"
    let fullCommand = command;
    let commandArgs = args;
    let commandInfo = this.findCommand(command);

    // Si commande non trouvée et il y a des args, essayer de combiner
    if (!commandInfo && args.length > 0) {
      fullCommand = `${command} ${args[0]}`;
      commandInfo = this.findCommand(fullCommand);
      // Enlever le premier arg de commandArgs puisqu'il est maintenant part de la commande
      if (commandInfo) {
        commandArgs = args.slice(1);
      }
    }

    // Commande non trouvée
    if (!commandInfo) {
      console.log(`[COMMANDS] ❌ Commande inconnue: ${this.commandPrefix}${fullCommand}`);
      return await this.bot.sendMessage(targetJid, 
        `❌ Commande inconnue: ${this.commandPrefix}${fullCommand}\n\n` +
        `Tapez ${this.commandPrefix}menu pour voir toutes les commandes.`
      );
    }

    console.log(`[COMMANDS] 📝 Commande détectée: ${fullCommand} (args: ${commandArgs.join(', ')})`);

    // Vérifier les permissions
    const hasPermission = await this.checkPermission(sender, commandInfo.permission);
    if (!hasPermission) {
      console.log(`[COMMANDS] ❌ Permission refusée pour ${sender} - Commande: ${fullCommand}`);
      return await this.bot.sendMessage(targetJid,
        `❌ Vous n'avez pas les permissions pour utiliser cette commande.\n` +
        `${commandInfo.usage} - ${commandInfo.description}`
      );
    }

    console.log(`[COMMANDS] ✅ Permission accordée pour ${sender} - Commande: ${fullCommand}`);

    // Traiter la commande via le dispatcher
    await this.dispatchCommand(fullCommand, commandArgs, sender, targetJid);
  }

  /**
   * Dispatcher central des commandes
   */
  async dispatchCommand(fullCommand, commandArgs, sender, targetJid) {
    try {
      const handler = commandDispatcher[fullCommand];

      if (!handler) {
        return await this.bot.sendMessage(sender,
          `⚠️ Commande non implémentée: ${this.commandPrefix}${fullCommand}\n\n` +
          `Tapez ${this.commandPrefix}menu pour voir toutes les commandes.`
        );
      }

      // Traiter les commandes "BUILTIN"
      if (handler.startsWith('BUILTIN_')) {
        switch (handler) {
          case 'BUILTIN_MENU':
            return await this.bot.sendMessage(targetJid, this.generateMenu());
          case 'BUILTIN_HELP':
            return await this.bot.sendMessage(targetJid, this.generateHelp());
          case 'BUILTIN_OWNER':
            return await this.handleOwnerCommand(targetJid, sender);
          case 'BUILTIN_TONMAUDIA':
            return await this.handleTonmaudiaCommand(targetJid);
          case 'BUILTIN_WHOAMI':
            return await this.handleWhoamiCommand(targetJid);
          case 'BUILTIN_GIVEAWAY_STATUS':
            return await this.bot.messageHandlers.handleStatusCommand(targetJid);
          case 'BUILTIN_GIVE_INFO':
            return await this.bot.messageHandlers.handleGiveInfoCommand(targetJid);
          case 'BUILTIN_GIVE_PRIZE':
            return await this.bot.messageHandlers.handleGivePrizeCommand(targetJid);
          case 'BUILTIN_GIVE_LINK':
            return await this.bot.messageHandlers.handleGiveLinkCommand(targetJid);
          case 'BUILTIN_GIVE_PARTICIPANTS':
            return await this.bot.messageHandlers.handleGiveParticipantsCommand(targetJid);
          case 'BUILTIN_WINNER':
            return await this.bot.messageHandlers.handleWinnerCommand(targetJid);
          case 'BUILTIN_GIVE_START':
            return await this.bot.messageHandlers.handleGiveStartCommand(targetJid, commandArgs);
          case 'BUILTIN_GIVE_END':
            return await this.bot.messageHandlers.handleGiveEndCommand(targetJid);
          case 'BUILTIN_DRAW':
            return await this.bot.messageHandlers.handleDrawCommand(targetJid);
          case 'BUILTIN_RESET':
            return await this.bot.messageHandlers.handleResetCommand(targetJid);
          case 'BUILTIN_BROADCAST':
            return await this.bot.messageHandlers.handleBroadcastCommand(targetJid, commandArgs.join(' '));
          case 'BUILTIN_RESTART':
            return await this.bot.messageHandlers.handleRestartCommand(targetJid);
          case 'BUILTIN_MODE':
            return await this.bot.messageHandlers.handleModeCommand(targetJid, commandArgs[0]);
          case 'BUILTIN_TAGALL':
            return await this.bot.messageHandlers.handleTagAllCommand(targetJid);
          case 'BUILTIN_LINK':
            return await this.bot.messageHandlers.handleLinkCommand(targetJid);
          case 'BUILTIN_OPEN':
            return await this.bot.messageHandlers.handleOpenCommand(targetJid);
          case 'BUILTIN_CLOSE':
            return await this.bot.messageHandlers.handleCloseCommand(targetJid);
          case 'BUILTIN_SETPRIZE':
            return await this.bot.messageHandlers.handleSetPrizeCommand(targetJid, commandArgs.join(' '));
        }
      }

      // Traiter les commandes Otaku RPG via la méthode correspondante
      if (typeof this.otakuRPG[handler] === 'function') {
        return await this.otakuRPG[handler](sender, commandArgs, targetJid);
      }

      return await this.bot.sendMessage(sender,
        `⚠️ Handler non trouvé pour: ${this.commandPrefix}${fullCommand}`
      );
    } catch (error) {
      console.error(`[WHATSAPP] Erreur lors de la commande ${fullCommand}:`, error.message);
      console.error('[WHATSAPP] Stack:', error.stack);
      await this.bot.sendMessage(sender,
        `❌ Erreur lors de l'exécution de la commande.\n` +
        `Veuillez réessayer ou contacter l'admin.`
      );
    }
  }

  /**
   * Lister les commandes disponibles pour l'utilisateur
   */
  getAvailableCommands(userNumber) {
    const isOwner = this.ownerNumbers.includes(userNumber);
    const available = {};

    // Commandes générales
    available.GENERAL = commands.GENERAL;
    available.GIVEAWAY_USER = commands.GIVEAWAY_USER;

    // Commandes admin si applicable
    if (isOwner) {
      available.GROUP_ADMIN = commands.GROUP_ADMIN;
      available.GIVEAWAY_ADMIN = commands.GIVEAWAY_ADMIN;
      available.OWNER = commands.OWNER;
    }

    return available;
  }

  /**
   * Générer une réponse sarcastique/caustique aléatoire (Insultes Ivoiriennes)
   */
  async handleTonmaudiaCommand(targetJid) {
    const insults = [
      "🇮🇻 Ton maudia tu es débile! Débile complet même les poubelles te rejettent!",
      "😏 Ton maudia c'est un nul! Tu fais honte à ta maman et à tout le village!",
      "💀 Ton maudia tu es pourri! Même les morts ne veulent pas te voir!",
      "🤡 Ton maudia c'est un zozo! Tu penses comme une chèvre malade!",
      "🌍 Ton maudia tu es un gamineri! Tu fais la honte au quartier!",
      "🎪 Ton maudia c'est un débile professionnel! Diplômé en être nul!",
      "🧠 Ton maudia ton cerveau c'est une toile vierge! Vide complètement!",
      "⚡ Ton maudia tu es rapide... pour faire des conneries! Champion de la bêtise!",
      "🏆 Ton maudia tu mérites un prix: Du plus grand débile du quartier!",
      "🎵 Ton maudia ta vie c'est une chanson... une chanson de misère!",
      "🎬 Ton maudia tu es un film d'horreur... l'horreur c'est toi!",
      "🚀 Ton maudia tu essaies de voler... mais tu tombes chaque fois!",
      "🌟 Ton maudia tu brilles... comme une chaussure sale au soleil!",
      "🎯 Ton maudia tu vises la réussite... mais tu touches la misère!",
      "💼 Ton maudia ta carrière c'est zéro! T'as aucune qualification sauf la bêtise!",
      "🍕 Ton maudia tu es pourri! Pire qu'une pizza brûlée depuis 3 jours!",
      "⚙️ Ton maudia tu as l'inverse d'un cerveau qui marche!",
      "🌈 Ton maudia tu représentes l'arc-en-ciel... de la malchance!",
      "🔥 Ton maudia tu es chaud... ta bêtise brûle toute la région!",
      "📚 Ton maudia tu écrirais un livre: 'Comment être débile en 10 leçons'!",
      "🎸 Ton maudia tu joues de la musique... du bruit de débile!",
      "🏃 Ton maudia tu cours après la vie... mais elle te fuit!",
      "🌙 Ton maudia même la nuit tu fais peur! Plus hideux qu'un fantôme!",
      "🎨 Ton maudia tu es une œuvre d'art... l'art d'être complètement nul!",
      "🧩 Ton maudia tu as les pièces du puzzle... c'est pas le bon puzzle!",
      "🚗 Ton maudia tu roulais bien avant... maintenant t'es à pied mon frère!",
      "📱 Ton maudia même ton téléphone t'a abandonné! Il ne voulait pas de toi!",
      "🌊 Ton maudia tu fais des vagues... des vagues de débilité totale!",
      "🎓 Ton maudia t'as un diplôme? En être un débile oui!",
      "💎 Ton maudia t'es rare... comme quelqu'un d'intelligent dans ton quartier!",
      "🤦 Ton maudia c'est un débile grave! Fais attention tu vas te faire mal!",
      "🍌 Ton maudia tu fais honte! Même les bananes font mieux que toi!",
      "👻 Ton maudia tu fais peur! Plus horrible qu'un fantôme affamé!",
      "🦴 Ton maudia t'es sec! Les os ont plus de viande que ton cerveau!",
      "🐑 Ton maudia tu penses comme une chèvre! Bêe bêe beeeee!",
      "💩 Ton maudia t'es de la merde! Littéralement et figurativement!",
      "⛔ Ton maudia défense d'entrer! Même Dieu dit non!",
      "🔞 Ton maudia pas assez intelligent pour l'école des nuls!",
      "🎭 Ton maudia t'es un débile léger! Mais ça se voit de loin!",
      "😤 Ton maudia tu me fatigues! Tu fais trop de bruit avec ta bêtise!",
      "🏃 Ton maudia va marche vite! Ou reste assis avant de faire une connerie!",
      "🌚 Ton maudia même Zoblazo ne peut pas te danser! T'es trop moche!",
      "⚽ Ton maudia tu joues au foot comme tu vivs: complètement nul!",
      "🎪 Ton maudia t'es un fou! Les asiles te cherchent partout!",
      "🤮 Ton maudia tu me dégouttes! Tu fais vomir rien qu'en parlant!",
    ];

    const randomInsult = insults[Math.floor(Math.random() * insults.length)];
    await this.bot.sendMessage(targetJid, randomInsult);
  }

  /**
   * Afficher l'ID de l'utilisateur (pour debugging)
   */
  async handleWhoamiCommand(targetJid) {
    const cleanedNumber = targetJid.replace(/@c.us|@lid|@g.us/g, '').replace(/\D/g, '').trim();
    const message = `👤 *Votre ID WhatsApp:*\n\n📱 Format complet: ${targetJid}\n🔢 Numéro nettoyé: ${cleanedNumber}\n\n_Pour ajouter ce numéro à la liste d'admin, configurez le dans .env_`;
    await this.bot.sendMessage(targetJid, message);
  }

  /**
   * Afficher les numéros des administrateurs du groupe
   */
  async handleOwnerCommand(targetJid, sender) {
    try {
      // Vérifier si c'est un groupe
      const isGroup = targetJid.includes('@g.us');
      
      if (isGroup) {
        // C'est un groupe - afficher tous les admins du groupe
        try {
          const groupMetadata = await this.bot.sock.groupMetadata(targetJid);
          const admins = groupMetadata.participants.filter(p => p.admin);
          
          if (admins.length === 0) {
            return await this.bot.sendMessage(targetJid,
              '⚠️ Aucun administrateur trouvé dans le groupe.'
            );
          }

          let adminList = '👑 *ADMINISTRATEURS DU GROUPE*\n\n';
          admins.forEach((admin, index) => {
            const number = admin.id.replace(/@c.us|@s.whatsapp.net/g, '');
            adminList += `${index + 1}. 📱 +${number}\n`;
          });

          adminList += `\n📊 Total: ${admins.length} administrateur(s)`;

          await this.bot.sendMessage(targetJid, adminList);
          console.log(`[COMMANDS] 👑 Liste des admins du groupe affichée - ${admins.length} admin(s)`);
        } catch (error) {
          console.error('[COMMANDS] Erreur lors de la récupération des admins du groupe:', error);
          await this.bot.sendMessage(targetJid,
            `⚠️ Erreur lors de la récupération des administrateurs.\n` +
            `Détails: ${error.message}`
          );
        }
      } else {
        // Message direct - afficher les admins configurés
        let adminList = '👑 *ADMINISTRATEURS CONFIGURÉS*\n\n';
        this.ownerNumbers.forEach((number, index) => {
          adminList += `${index + 1}. 📱 +${number}\n`;
        });

        adminList += `\n💬 Contactez l'un d'eux pour l'assistance.\n`;
        adminList += `⏰ Heures de support: 24/7`;

        await this.bot.sendMessage(targetJid, adminList);
      }
    } catch (error) {
      console.error('[COMMANDS] Erreur handleOwnerCommand:', error);
      await this.bot.sendMessage(targetJid,
        `⚠️ Erreur lors de l'affichage des administrateurs.\n` +
        `Détails: ${error.message}`
      );
    }
  }
}

module.exports = CommandHandler;

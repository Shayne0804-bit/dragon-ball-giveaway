/**
 * Gestionnaire des commandes WhatsApp
 */

const commands = require('../config/whatsappCommands');

class CommandHandler {
  constructor(whatsappBot) {
    this.bot = whatsappBot;
    this.commandPrefix = '.';
    
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
    // Nettoyer le numéro utilisateur (enlever @c.us et espaces)
    const cleanedUserNumber = userNumber
      .replace('@c.us', '')
      .replace(/\D/g, '') // Garder seulement les chiffres
      .trim();

    console.log(`[COMMANDS] 🔐 Vérification permission: ${userNumber} → ${cleanedUserNumber}`);
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
   * Générer le menu des commandes
   */
  generateMenu() {
    let menu = '╔════════════════════════════════╗\n';
    menu += '║   🤖 COMMANDES DU BOT 🤖        ║\n';
    menu += '╚════════════════════════════════╝\n\n';

    // Commandes générales
    menu += '📋 *COMMANDES GÉNÉRALES*\n';
    menu += '─────────────────────────\n';
    Object.entries(commands.GENERAL).forEach(([cmd, info]) => {
      menu += `${info.usage} - ${info.description}\n`;
    });

    menu += '\n🎁 *COMMANDES GIVEAWAY (UTILISATEURS)*\n';
    menu += '─────────────────────────\n';
    Object.entries(commands.GIVEAWAY_USER).forEach(([cmd, info]) => {
      menu += `${info.usage} - ${info.description}\n`;
    });

    menu += '\n👥 *COMMANDES GROUPE (ADMIN)*\n';
    menu += '─────────────────────────\n';
    Object.entries(commands.GROUP_ADMIN).forEach(([cmd, info]) => {
      menu += `${info.usage} - ${info.description}\n`;
    });

    menu += '\n👑 *COMMANDES GIVEAWAY (ADMIN)*\n';
    menu += '─────────────────────────\n';
    Object.entries(commands.GIVEAWAY_ADMIN).forEach(([cmd, info]) => {
      menu += `${info.usage} - ${info.description}\n`;
    });

    menu += '\n⚙️ *COMMANDES OWNER (IMPORTANTES)*\n';
    menu += '─────────────────────────\n';
    Object.entries(commands.OWNER).forEach(([cmd, info]) => {
      menu += `${info.usage} - ${info.description}\n`;
    });

    menu += '\n\n💡 Pour plus d\'aide: .help\n';
    menu += '📱 Contact: .owner\n';

    return menu;
  }

  /**
   * Générer l'aide rapide
   */
  generateHelp() {
    return `╔════════════════════════════════╗
║        🆘 AIDE RAPIDE 🆘         ║
╚════════════════════════════════╝

*Commandes de base:*
.menu - Voir toutes les commandes
.ping - Vérifier si le bot répond
.status - État du giveaway actuel

*Pour participer au giveaway:*
.give info - Infos du giveaway
.give link - Lien de participation
.give participants - Nombre de participants
.winner - Voir le gagnant

*Besoin d'aide?*
Tapez: .owner
Pour contacter l'administrateur

*Utilisation:*
Les commandes commencent par un point (.)
Exemple: .ping

📱 Pour plus d'aide: Contactez .owner`;
  }

  /**
   * Traiter une commande
   */
  async handleCommand(command, args, sender, whatsappBot) {
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
      return await this.bot.sendMessage(sender, 
        `❌ Commande inconnue: ${this.commandPrefix}${fullCommand}\n\n` +
        `Tapez ${this.commandPrefix}menu pour voir toutes les commandes.`
      );
    }

    console.log(`[COMMANDS] 📝 Commande détectée: ${fullCommand} (args: ${commandArgs.join(', ')})`);

    // Vérifier les permissions
    const hasPermission = await this.checkPermission(sender, commandInfo.permission);
    if (!hasPermission) {
      console.log(`[COMMANDS] ❌ Permission refusée pour ${sender} - Commande: ${fullCommand}`);
      return await this.bot.sendMessage(sender,
        `❌ Vous n'avez pas les permissions pour utiliser cette commande.\n` +
        `${commandInfo.usage} - ${commandInfo.description}`
      );
    }

    console.log(`[COMMANDS] ✅ Permission accordée pour ${sender} - Commande: ${fullCommand}`);

    // Traiter la commande
    try {
      switch (fullCommand) {
        case 'menu':
          await this.bot.sendMessage(sender, this.generateMenu());
          break;

        case 'help':
          await this.bot.sendMessage(sender, this.generateHelp());
          break;

        case 'ping':
          const uptime = Math.floor(process.uptime() / 60);
          await this.bot.sendMessage(sender, 
            `🏓 *PONG!*\n\nLe bot répond correctement!\n⏱️ Uptime: ${uptime} minutes`
          );
          break;

        case 'owner':
          await this.bot.sendMessage(sender,
            `👑 *CONTACT ADMINISTRATEUR*\n\n` +
            `📱 Numéro: ${this.ownerNumbers[0]}\n` +
            `💬 Répondez à ce message pour contacter l'admin\n\n` +
            `Heures de support: 24/7`
          );
          break;

        case 'tonmaudia':
          await this.handleTonmaudiaCommand(sender);
          break;

        case 'ton maudia':
          await this.handleTonmaudiaCommand(sender);
          break;

        case 'status':
          await this.bot.messageHandlers.handleStatusCommand(sender);
          break;

        case 'give info':
          await this.bot.messageHandlers.handleGiveInfoCommand(sender);
          break;

        case 'give prize':
          await this.bot.messageHandlers.handleGivePrizeCommand(sender);
          break;

        case 'give link':
          await this.bot.messageHandlers.handleGiveLinkCommand(sender);
          break;

        case 'give participants':
          await this.bot.messageHandlers.handleGiveParticipantsCommand(sender);
          break;

        case 'winner':
          await this.bot.messageHandlers.handleWinnerCommand(sender);
          break;

        case 'give start':
          await this.bot.messageHandlers.handleGiveStartCommand(sender, commandArgs);
          break;

        case 'give end':
          await this.bot.messageHandlers.handleGiveEndCommand(sender);
          break;

        case 'draw':
          await this.bot.messageHandlers.handleDrawCommand(sender);
          break;

        case 'reset':
          await this.bot.messageHandlers.handleResetCommand(sender);
          break;

        case 'broadcast':
          await this.bot.messageHandlers.handleBroadcastCommand(sender, commandArgs.join(' '));
          break;

        case 'restart':
          await this.bot.messageHandlers.handleRestartCommand(sender);
          break;

        case 'mode':
          await this.bot.messageHandlers.handleModeCommand(sender, commandArgs[0]);
          break;

        case 'tagall':
          await this.bot.messageHandlers.handleTagAllCommand(sender);
          break;

        case 'link':
          await this.bot.messageHandlers.handleLinkCommand(sender);
          break;

        case 'open':
          await this.bot.messageHandlers.handleOpenCommand(sender);
          break;

        case 'close':
          await this.bot.messageHandlers.handleCloseCommand(sender);
          break;

        case 'setprize':
          await this.bot.messageHandlers.handleSetPrizeCommand(sender, commandArgs.join(' '));
          break;

        default:
          await this.bot.sendMessage(sender,
            `⚠️ Commande non implémentée: ${this.commandPrefix}${fullCommand}`
          );
      }
    } catch (error) {
      console.error(`[WHATSAPP] Erreur lors de la commande ${fullCommand}:`, error.message);
      console.error('[WHATSAPP] Stack:', error.stack);
      await this.bot.sendMessage(sender,
        `❌ Erreur lors de l'exécution de la commande.\n` +
        `Veuillez réessayer ou contacter l'admin avec .owner`
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
   * Générer une réponse sarcastique/caustique aléatoire
   */
  async handleTonmaudiaCommand(sender) {
    const insults = [
      "🎭 Ton mauvais aurait pu être acteur, c'est un artiste en chute libre!",
      "😏 Ton mauvais a enfin trouvé sa vocation: servir d'avertissement!",
      "🤡 On dirait que ton mauvais suit une formation en improvisation... et perd tous les jours!",
      "💀 Ton mauvais a une fan page: la page des pires décisions!",
      "🌍 Ton mauvais a mis internet en retard d'une heure rien qu'en existant!",
      "🎪 Ton mauvais n'a pas besoin de cirque, c'EST le cirque!",
      "🧠 Ton mauvais pense en morse... et personne ne peut le décoder!",
      "⚡ Ton mauvais a une vitesse: celle du malheur en direct!",
      "🏆 Ton mauvais remporterait une médaille si la chute était un sport!",
      "🎵 Ton mauvais a écrit une symphonie... la Symphonie des Catastrophes!",
      "🎬 Ton mauvais devrait faire un film d'horreur... la vraie terreur c'est lui!",
      "🚀 Ton mauvais a essayé d'aller sur la lune... il a juste marché dans un trou!",
      "🌟 Ton mauvais brille comme une étoile... tombée et écrasée!",
      "🎯 Ton mauvais vise juste... dans la mauvaise direction!",
      "💼 Ton mauvais aurait eu une belle carrière... en tant que cautionnaire!",
      "🍕 Ton mauvais pourrait être une pizza: déjà cuit mais toujours pas bon!",
      "🎪 Ton mauvais est comme un joke: personne ne la comprend et tout le monde souffre!",
      "⚙️ Ton mauvais a tous les pièces... mais pas dans le bon ordre!",
      "🌈 Ton mauvais représente l'arc-en-ciel... des décisions mauvaises!",
      "🎭 Ton mauvais mérite un Oscar... pour l'acting de quelqu'un qui sait pas agir!",
      "🔥 Ton mauvais est HOT... chaud bouillant dans l'enfer des déceptions!",
      "📚 Ton mauvais a écrit un livre: 'Comment échouer à la vie en simple'!",
      "🎸 Ton mauvais joue de la musique... la musique du chaos!",
      "🏃 Ton mauvais court après le succès... et ne le rattrapera jamais!",
      "🌙 Ton mauvais brille la nuit... pour éclairer tous ces mauvais choix!",
      "🎨 Ton mauvais est un artiste... spécialisé dans les œuvres ratées!",
      "🧩 Ton mauvais a les pieces du puzzle... mais c'est pas le bon puzzle!",
      "🚗 Ton mauvais roule... directement vers l'échec!",
      "📱 Ton mauvais a une notification: '+1000 mauvaises idées'!",
      "🌊 Ton mauvais est une vague... qui se casse aussitôt formée!",
      "🎓 Ton mauvais a un diplôme... en ÉCHECS MASSIFS!",
      "💎 Ton mauvais est rare... comme quelqu'un qui réussit dans la vie!",
      "🎪 Ton mauvais est un magicien... qui disparaît au moment où on a besoin de lui!",
      "🌸 Ton mauvais est une fleur... qui pousse à l'envers!"
    ];

    const randomInsult = insults[Math.floor(Math.random() * insults.length)];
    await this.bot.sendMessage(sender, randomInsult);
  }
}

module.exports = CommandHandler;

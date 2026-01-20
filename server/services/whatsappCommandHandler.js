/**
 * Gestionnaire des commandes WhatsApp
 */

const commands = require('../config/whatsappCommands');

class CommandHandler {
  constructor(whatsappBot) {
    this.bot = whatsappBot;
    this.commandPrefix = '.';
    this.ownerNumbers = process.env.WHATSAPP_OWNER_NUMBERS ? 
      process.env.WHATSAPP_OWNER_NUMBERS.split(',') : 
      [process.env.WHATSAPP_PHONE_NUMBER];
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
    if (requiredPermission === 'all') {
      return true;
    }

    if (requiredPermission === 'owner') {
      return this.ownerNumbers.includes(userNumber);
    }

    if (requiredPermission === 'admin') {
      // À implémenter selon votre système d'admin
      return this.ownerNumbers.includes(userNumber);
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
    const commandInfo = this.findCommand(command);

    // Commande non trouvée
    if (!commandInfo) {
      return await this.bot.sendMessage(sender, 
        `❌ Commande inconnue: ${this.commandPrefix}${command}\n\n` +
        `Tapez ${this.commandPrefix}menu pour voir toutes les commandes.`
      );
    }

    // Vérifier les permissions
    const hasPermission = await this.checkPermission(sender, commandInfo.permission);
    if (!hasPermission) {
      return await this.bot.sendMessage(sender,
        `❌ Vous n'avez pas les permissions pour utiliser cette commande.\n` +
        `${commandInfo.usage} - ${commandInfo.description}`
      );
    }

    // Traiter la commande
    try {
      switch (command) {
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
          await this.bot.messageHandlers.handleGiveStartCommand(sender, args);
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
          await this.bot.messageHandlers.handleBroadcastCommand(sender, args.join(' '));
          break;

        case 'restart':
          await this.bot.messageHandlers.handleRestartCommand(sender);
          break;

        case 'mode':
          await this.bot.messageHandlers.handleModeCommand(sender, args[0]);
          break;

        default:
          await this.bot.sendMessage(sender,
            `⚠️ Commande non implémentée: ${this.commandPrefix}${command}`
          );
      }
    } catch (error) {
      console.error(`[WHATSAPP] Erreur lors de la commande ${command}:`, error.message);
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
}

module.exports = CommandHandler;

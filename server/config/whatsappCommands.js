/**
 * Configuration des commandes WhatsApp Bot
 */

module.exports = {
  // ===========================
  // COMMANDES GÉNÉRALES
  // ===========================
  GENERAL: {
    menu: {
      description: "Affiche toutes les commandes",
      usage: ".menu",
      permission: "all"
    },
    help: {
      description: "Aide rapide",
      usage: ".help",
      permission: "all"
    },
    ping: {
      description: "Vérifie si le bot est actif",
      usage: ".ping",
      permission: "all"
    },
    owner: {
      description: "Contact de l'administrateur",
      usage: ".owner",
      permission: "all"
    },
    status: {
      description: "État du giveaway",
      usage: ".status",
      permission: "all"
    },
    tonmaudia: {
      description: "Réponse sarcastique aléatoire",
      usage: ".tonmaudia",
      permission: "all"
    },
    "ton maudia": {
      description: "Réponse sarcastique aléatoire (variante)",
      usage: ".ton maudia",
      permission: "all"
    },
    whoami: {
      description: "Affiche votre ID WhatsApp (pour debugging)",
      usage: ".whoami",
      permission: "all"
    },
  },

  // ===========================
  // COMMANDES GIVEAWAY (UTILISATEURS)
  // ===========================
  GIVEAWAY_USER: {
    "give info": {
      description: "Détails du giveaway en cours",
      usage: ".give info",
      permission: "all"
    },
    "give prize": {
      description: "Lot à gagner",
      usage: ".give prize",
      permission: "all"
    },
    "give link": {
      description: "Lien de participation",
      usage: ".give link",
      permission: "all"
    },
    "give participants": {
      description: "Nombre de participants",
      usage: ".give participants",
      permission: "all"
    },
    winner: {
      description: "Affiche le gagnant (si tirage fait)",
      usage: ".winner",
      permission: "all"
    },
  },

  // ===========================
  // COMMANDES GROUPE (ADMIN)
  // ===========================
  GROUP_ADMIN: {
    tagall: {
      description: "Mentionner tous les membres",
      usage: ".tagall",
      permission: "admin"
    },
    link: {
      description: "Lien d'invitation du groupe",
      usage: ".link",
      permission: "admin"
    },
    open: {
      description: "Ouvrir le groupe",
      usage: ".open",
      permission: "admin"
    },
    close: {
      description: "Fermer le groupe",
      usage: ".close",
      permission: "admin"
    },
  },

  // ===========================
  // COMMANDES GIVEAWAY (ADMIN)
  // ===========================
  GIVEAWAY_ADMIN: {
    "give start": {
      description: "Ouvrir le giveaway",
      usage: ".give start",
      permission: "admin"
    },
    "give end": {
      description: "Fermer le giveaway",
      usage: ".give end",
      permission: "admin"
    },
    setprize: {
      description: "Définir / modifier le lot",
      usage: ".setprize <lot>",
      permission: "admin"
    },
    draw: {
      description: "Tirage du gagnant",
      usage: ".draw",
      permission: "admin"
    },
    reset: {
      description: "Réinitialiser le giveaway",
      usage: ".reset",
      permission: "admin"
    },
  },

  // ===========================
  // COMMANDES OWNER (IMPORTANTES)
  // ===========================
  OWNER: {
    broadcast: {
      description: "Message global",
      usage: ".broadcast <message>",
      permission: "owner"
    },
    restart: {
      description: "Redémarrer le bot",
      usage: ".restart",
      permission: "owner"
    },
    "mode": {
      description: "Mode du bot (public/private)",
      usage: ".mode <public|private>",
      permission: "owner"
    },
  },
};

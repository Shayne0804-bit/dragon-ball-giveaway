/**
 * Configuration des commandes WhatsApp Bot - Système Otaku RPG
 */

module.exports = {
  // ===========================
  // PROFIL & STATISTIQUES
  // ===========================
  PROFILE: {
    profil: {
      description: "Affiche ton profil otaku complet avec niveau, rang, badges et progression",
      usage: "!profil",
      permission: "all"
    },
    level: {
      description: "Voir tes informations de niveau, rang, XP total et progression",
      usage: "!level",
      permission: "all"
    },
    xp: {
      description: "Voir ton XP actuel avec barre de progression",
      usage: "!xp",
      permission: "all"
    },
    rank: {
      description: "Affiche ton classement global parmi tous les joueurs",
      usage: "!rank",
      permission: "all"
    },
    stats: {
      description: "Voir tes statistiques complètes (messages, duels, quiz, taux de victoire)",
      usage: "!stats",
      permission: "all"
    },
    powerlevel: {
      description: "Calcule et affiche ton power level basé sur ton niveau et tes stats",
      usage: "!powerlevel",
      permission: "all"
    },
    chakra: {
      description: "Voir ton chakra (ressource de mana) avec barre visuelle",
      usage: "!chakra",
      permission: "all"
    },
    badges: {
      description: "Voir tous tes badges et réalisations déverrouillées",
      usage: "!badges",
      permission: "all"
    },
  },

  // ===========================
  // COMBATS & DUELS
  // ===========================
  COMBAT: {
    duel: {
      description: "Défie un autre joueur en duel PvP (système d'XP et puissance)",
      usage: "!duel @user",
      permission: "all"
    },
  },

  // ===========================
  // QUÊTES & MISSIONS
  // ===========================
  QUESTS: {
    quete: {
      description: "Affiche toutes les quêtes disponibles et tes objectifs",
      usage: "!quete",
      permission: "all"
    },
    queteprogress: {
      description: "Voir ta progression actuelle dans les quêtes",
      usage: "!queteprogress",
      permission: "all"
    },
    quotidien: {
      description: "Mission quotidienne (50 XP bonus) - Une fois par jour",
      usage: "!quotidien",
      permission: "all"
    },
    hebdo: {
      description: "Mission hebdomadaire (200 XP bonus) - Une fois par semaine",
      usage: "!hebdo",
      permission: "all"
    },
  },

  // ===========================
  // QUIZ & QUESTIONS
  // ===========================
  QUIZ: {
    quiz: {
      description: "Lancer un quiz otaku aléatoire en groupe",
      usage: "!quiz",
      permission: "all"
    },
    quizanime: {
      description: "Quiz spécial anime avec questions sur Naruto, One Piece, Bleach, etc.",
      usage: "!quizanime",
      permission: "all"
    },
    reponse: {
      description: "Répondre au quiz en cours (A, B, C ou D)",
      usage: "!reponse A",
      permission: "all"
    },
  },

  // ===========================
  // ANIME & MANGA
  // ===========================
  ANIME: {
    anime: {
      description: "Rechercher les infos d'un anime (via API Jikan)",
      usage: "!anime [nom]",
      permission: "all"
    },
    manga: {
      description: "Rechercher les infos d'un manga (titre, synopsis, épisodes)",
      usage: "!manga [nom]",
      permission: "all"
    },
    personnage: {
      description: "Infos détaillées sur un personnage anime",
      usage: "!personnage [nom]",
      permission: "all"
    },
    topanime: {
      description: "Affiche le top 10 des meilleurs animes",
      usage: "!topanime",
      permission: "all"
    },
    topmanga: {
      description: "Affiche le top 10 des meilleurs mangas",
      usage: "!topmanga",
      permission: "all"
    },
  },

  // ===========================
  // IMAGES & ASSETS
  // ===========================
  IMAGES: {
    waifu: {
      description: "Image waifu aléatoire (+5 XP)",
      usage: "!waifu",
      permission: "all"
    },
    husbando: {
      description: "Image husbando aléatoire (+5 XP)",
      usage: "!husbando",
      permission: "all"
    },
    neko: {
      description: "Image chat anime (neko) aléatoire",
      usage: "!neko",
      permission: "all"
    },
    animegif: {
      description: "GIF anime aléatoire",
      usage: "!animegif",
      permission: "all"
    },
  },

  // ===========================
  // PERSONNAGES ANIME (PHOTOS)
  // ===========================
  CHARACTERS: {
    bleach: {
      description: "Photo aléatoire de Bleach",
      usage: "!bleach",
      permission: "all"
    },
    boahancook: {
      description: "Photo aléatoire de Boa Hancock",
      usage: "!boahancook",
      permission: "all"
    },
    deku: {
      description: "Photo aléatoire de Deku",
      usage: "!deku",
      permission: "all"
    },
    gojo: {
      description: "Photo aléatoire de Gojo",
      usage: "!gojo",
      permission: "all"
    },
    gokuui: {
      description: "Photo aléatoire de Goku Ultra Instinct",
      usage: "!gokuui",
      permission: "all"
    },
    jinwoo: {
      description: "Photo aléatoire de Jinwoo",
      usage: "!jinwoo",
      permission: "all"
    },
    livai: {
      description: "Photo aléatoire de Levi",
      usage: "!livai",
      permission: "all"
    },
    makima: {
      description: "Photo aléatoire de Makima",
      usage: "!makima",
      permission: "all"
    },
    mikunakano: {
      description: "Photo aléatoire de Miku Nakano",
      usage: "!mikunakano",
      permission: "all"
    },
    rengokudemon: {
      description: "Photo aléatoire de Rengoku Demon",
      usage: "!rengokudemon",
      permission: "all"
    },
    sukuna: {
      description: "Photo aléatoire de Sukuna",
      usage: "!sukuna",
      permission: "all"
    },
    tengen: {
      description: "Photo aléatoire de Tengen",
      usage: "!tengen",
      permission: "all"
    },
    tsunade: {
      description: "Photo aléatoire de Tsunade",
      usage: "!tsunade",
      permission: "all"
    },
    yami: {
      description: "Photo aléatoire de Yami",
      usage: "!yami",
      permission: "all"
    },
    yoruihi: {
      description: "Photo aléatoire de Yoruihi",
      usage: "!yoruihi",
      permission: "all"
    },
    zerotwo: {
      description: "Photo aléatoire de Zero Two",
      usage: "!zerotwo",
      permission: "all"
    },
    nsfw: {
      description: "Photo aléatoire NSFW (groupe seulement)",
      usage: "!nsfw",
      permission: "all"
    },
  },

  // ===========================
  // MINI-JEUX
  // ===========================
  MINIGAMES: {
    pfc: {
      description: "Pierre-Feuille-Ciseaux otaku (Victoire: 20 XP, Défaite: 5 XP, Égalité: 10 XP)",
      usage: "!pfc [pierre|feuille|ciseaux]",
      permission: "all"
    },
    roulette: {
      description: "Roulette russe - Gagne ou perd 500 gold (4/6 chance de gagner)",
      usage: "!roulette",
      permission: "all"
    },
    chance: {
      description: "Voir ta chance du jour (chaque jour différente)",
      usage: "!chance",
      permission: "all"
    },
  },

  // ===========================
  // LOOT & INVENTAIRE
  // ===========================
  LOOT: {
    loot: {
      description: "Ouvrir un loot aléatoire parmi 8 objets rares",
      usage: "!loot",
      permission: "all"
    },
    inventaire: {
      description: "Voir ton inventaire avec tous tes objets looted",
      usage: "!inventaire",
      permission: "all"
    },
  },

  // ===========================
  // CLASSEMENTS
  // ===========================
  RANKING: {
    classement: {
      description: "Voir les différents classements (level|xp|wins)",
      usage: "!classement [level|xp|wins]",
      permission: "all"
    },
  },

  // ===========================
  // FUN & ENTERTAINMENT
  // ===========================
  FUN: {
    blagueotaku: {
      description: "Affiche une blague otaku aléatoire",
      usage: "!blagueotaku",
      permission: "all"
    },
    roast: {
      description: "Faire un roast otaku humoristique sur quelqu'un",
      usage: "!roast @user",
      permission: "all"
    },
    ship: {
      description: "Shipper deux personnes avec compatibilité %",
      usage: "!ship @user1 @user2",
      permission: "all"
    },
  },

  // ===========================
  // BOT & INFORMATION
  // ===========================
  BOT_INFO: {
    ping: {
      description: "Vérifier la latence du bot (affiche le ping en ms)",
      usage: "!ping",
      permission: "all"
    },
    info: {
      description: "Infos complètes sur le bot (version, features, etc.)",
      usage: "!info",
      permission: "all"
    },
    menu: {
      description: "Affiche le menu principal avec toutes les catégories",
      usage: "!menu",
      permission: "all"
    },
    help: {
      description: "Affiche l'aide générale ou sur une commande spécifique",
      usage: "!help [commande]",
      permission: "all"
    },
  },

  // ===========================
  // GROUPE & ADMINISTRATION
  // ===========================
  GROUP_ADMIN: {
    regles: {
      description: "Affiche les règles du groupe",
      usage: "!regles",
      permission: "all"
    },
    tagall: {
      description: "Mentionner tous les membres du groupe",
      usage: "!tagall",
      permission: "admin"
    },
    link: {
      description: "Lien d'invitation du groupe",
      usage: "!link",
      permission: "admin"
    },
    open: {
      description: "Ouvrir le groupe",
      usage: "!open",
      permission: "admin"
    },
    close: {
      description: "Fermer le groupe",
      usage: "!close",
      permission: "admin"
    },
  },

  // ===========================
  // OWNER (COMMANDES IMPORTANTES)
  // ===========================
  OWNER: {
    broadcast: {
      description: "Message global",
      usage: "!broadcast <message>",
      permission: "owner"
    },
    restart: {
      description: "Redémarrer le bot",
      usage: "!restart",
      permission: "owner"
    },
    mode: {
      description: "Mode du bot (public/private)",
      usage: "!mode <public|private>",
      permission: "owner"
    },
  },
};


/**
 * Dispatcher des commandes Otaku RPG
 * Mappe les noms de commandes aux méthodes du service OtakuRPG
 */

const commandMap = {
  // Menu & Info
  'menu': 'BUILTIN_MENU',
  'help': 'BUILTIN_HELP',
  'info': 'handleInfo',
  'ping': 'handlePing',
  
  // Legacy commands
  'owner': 'BUILTIN_OWNER',
  'tonmaudia': 'BUILTIN_TONMAUDIA',
  'ton maudia': 'BUILTIN_TONMAUDIA',
  'whoami': 'BUILTIN_WHOAMI',
  
  // Giveaway legacy
  'status': 'BUILTIN_GIVEAWAY_STATUS',
  'give info': 'BUILTIN_GIVE_INFO',
  'give prize': 'BUILTIN_GIVE_PRIZE',
  'give link': 'BUILTIN_GIVE_LINK',
  'give participants': 'BUILTIN_GIVE_PARTICIPANTS',
  'winner': 'BUILTIN_WINNER',
  'give start': 'BUILTIN_GIVE_START',
  'give end': 'BUILTIN_GIVE_END',
  'draw': 'BUILTIN_DRAW',
  'reset': 'BUILTIN_RESET',
  
  // Admin/Owner
  'broadcast': 'BUILTIN_BROADCAST',
  'restart': 'BUILTIN_RESTART',
  'mode': 'BUILTIN_MODE',
  'tagall': 'BUILTIN_TAGALL',
  'link': 'BUILTIN_LINK',
  'open': 'BUILTIN_OPEN',
  'close': 'BUILTIN_CLOSE',
  'setprize': 'BUILTIN_SETPRIZE',
  
  // Otaku RPG - PROFIL
  'profil': 'handleProfil',
  'level': 'handleLevel',
  'xp': 'handleLevel',
  'rank': 'handleRank',
  'stats': 'handleStats',
  'powerlevel': 'handleStats',
  'chakra': 'handleStats',
  'badges': 'handleStats',
  
  // Otaku RPG - COMBATS
  'duel': 'handleDuel',
  
  // Otaku RPG - QUÊTES
  'quete': 'handleQuete',
  'queteprogress': 'handleQueteprogress',
  'quotidien': 'handleQuotidien',
  'hebdo': 'handleHebdo',
  
  // Otaku RPG - QUIZ
  'quiz': 'handleQuiz',
  'quizanime': 'handleQuizanime',
  'reponse': 'handleReponse',
  
  // Otaku RPG - ANIME/MANGA
  'anime': 'handleAnime',
  'manga': 'handleManga',
  'personnage': 'handleAnime', // alias
  'topanime': 'handleAnime', // stub
  'topmanga': 'handleManga', // stub
  
  // Otaku RPG - IMAGES
  'waifu': 'handleWaifu', // TODO
  'husbando': 'handleHusbando', // TODO
  'neko': 'handleNeko', // TODO
  'animegif': 'handleAnimegif', // TODO
  
  // Otaku RPG - CHARACTERS
  'bleach': 'handleCharacter',
  'boahancook': 'handleCharacter',
  'deku': 'handleCharacter',
  'gojo': 'handleCharacter',
  'gokuui': 'handleCharacter',
  'jinwoo': 'handleCharacter',
  'livai': 'handleCharacter',
  'makima': 'handleCharacter',
  'mikunakano': 'handleCharacter',
  'rengokudemon': 'handleCharacter',
  'sukuna': 'handleCharacter',
  'tengen': 'handleCharacter',
  'tsunade': 'handleCharacter',
  'yami': 'handleCharacter',
  'yoruihi': 'handleCharacter',
  'zerotwo': 'handleCharacter',
  'nsfw': 'handleNSFW', // TODO
  
  // Otaku RPG - MINI-JEUX
  'pfc': 'handlePFC',
  'roulette': 'handleRoulette',
  'chance': 'handleChance',
  
  // Otaku RPG - LOOT
  'loot': 'handleLoot',
  'inventaire': 'handleInventaire',
  
  // Otaku RPG - CLASSEMENTS
  'classement': 'handleClassement',
  
  // Otaku RPG - FUN
  'blagueotaku': 'handleBlagueotaku',
  'roast': 'handleRoast',
  'ship': 'handleShip',
  
  // Otaku RPG - GROUPE
  'regles': 'handleRegles',
};

module.exports = commandMap;

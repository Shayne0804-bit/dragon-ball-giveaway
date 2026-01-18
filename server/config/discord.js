/**
 * Configuration spécifique du Bot Discord
 */

module.exports = {
  // Couleurs des embeds Discord
  colors: {
    created: '#FFD700',     // Or pour création
    closed: '#FF6B6B',      // Rouge pour fermeture
    completed: '#00B050',   // Vert pour complétion
    participant: '#00A8FF', // Bleu pour participation
  },

  // Messages et emojis
  messages: {
    created: {
      emoji: '🎉',
      title: 'Nouveau Giveaway Lancé!',
      description: 'Un nouveau giveaway vient d\'être lancé sur notre plateforme!',
    },
    closed: {
      emoji: '🔒',
      title: 'Giveaway Fermé',
      description: 'Un giveaway a été fermé.',
    },
    completed: {
      emoji: '🏆',
      title: 'Giveaway Terminé!',
      description: 'Un giveaway s\'est terminé et les gagnants ont été sélectionnés!',
    },
    participant: {
      emoji: '✨',
      title: 'Nouvelle participation!',
      description: 'Un nouveau participant s\'est inscrit au giveaway!',
    },
  },

  // Configuration des embeds
  embeds: {
    thumbnail: {
      // URL optionnelle pour les thumbnails
      // url: 'https://example.com/image.png',
    },
    footer: {
      // Texte du pied de page
      // iconURL: 'https://example.com/icon.png',
    },
  },

  // Limite du nombre de gagnants affichés
  maxDisplayedWinners: 10,

  // Configuration des notifications
  notifications: {
    // Envoyer une notification pour chaque nouvelle participation
    // (désactivé par défaut pour éviter le spam)
    notifyParticipants: false,

    // Délai (en ms) entre les notifications (anti-spam)
    notificationCooldown: 1000,
  },
};

const mongoose = require('mongoose');

/**
 * Schéma Participation
 * Enregistre les participations d'un utilisateur à un giveaway
 * Un utilisateur = une participation par giveaway
 */
const participationSchema = new mongoose.Schema(
  {
    // ========== Relations ==========
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    giveaway: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Giveaway',
      required: true,
      index: true,
    },

    // ========== Timestamps ==========
    participatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Index unique : un utilisateur ne peut participer qu'une fois par giveaway
 */
participationSchema.index(
  { user: 1, giveaway: 1 },
  {
    unique: true,
    name: 'user_giveaway_unique',
  }
);

/**
 * Index pour rechercher les participations d'un utilisateur
 */
participationSchema.index(
  { user: 1, participatedAt: -1 },
  { name: 'user_participations' }
);

/**
 * Index pour rechercher les participants d'un giveaway
 */
participationSchema.index(
  { giveaway: 1, participatedAt: -1 },
  { name: 'giveaway_participants' }
);

module.exports = mongoose.model('Participation', participationSchema);

const mongoose = require('mongoose');

/**
 * Schéma Participant
 * Enregistre les participants à un tirage/giveaway
 */
const participantSchema = new mongoose.Schema(
  {
    // ========== Informations Discord ==========
    discordId: {
      type: String,
      required: true,
      index: true,
    },
    discordUsername: {
      type: String,
      required: true,
    },
    discordAvatar: {
      type: String,
    },
    email: {
      type: String,
    },
    isDiscordAuthenticated: {
      type: Boolean,
      default: true,
    },

    // ========== Relations ==========
    giveaway: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Giveaway',
      index: true,
    },

    // ========== Données de participation ==========
    ip: {
      type: String,
    },

    // ========== Timestamps ==========
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Index unique : un utilisateur Discord ne peut participer qu'une fois par giveaway
 */
participantSchema.index(
  { discordId: 1, giveaway: 1 },
  {
    unique: true,
    name: 'discord_giveaway_unique',
    sparse: true,
  }
);

/**
 * Index pour rechercher les participants d'un giveaway
 */
participantSchema.index(
  { giveaway: 1, createdAt: -1 },
  { name: 'giveaway_participants' }
);

module.exports = mongoose.model('Participant', participantSchema);

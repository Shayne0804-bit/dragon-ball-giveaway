const mongoose = require('mongoose');

/**
 * Schéma ParticipantRoulette
 * Enregistre les participants à un tirage/roulette (avec authentification Discord)
 */
const participantRouletteSchema = new mongoose.Schema(
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
participantRouletteSchema.index(
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
participantRouletteSchema.index(
  { giveaway: 1, createdAt: -1 },
  { name: 'giveaway_participants' }
);

module.exports = mongoose.model('ParticipantRoulette', participantRouletteSchema);

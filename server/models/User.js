const mongoose = require('mongoose');

/**
 * Schéma User
 * Stocke les informations des utilisateurs authentifiés par Discord
 */
const userSchema = new mongoose.Schema(
  {
    // ========== Infos Discord ==========
    discordId: {
      type: String,
      unique: true,
      required: true,
      index: true,
    },
    discordUsername: {
      type: String,
      trim: true,
      required: true,
    },
    discordAvatar: {
      type: String, // URL de l'avatar Discord
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    discriminator: {
      type: String, // discord#0000
    },

    // ========== Statut ==========
    isActive: {
      type: Boolean,
      default: true,
    },

    // ========== Timestamps ==========
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Middleware : mise à jour du timestamp updatedAt
 */
userSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('User', userSchema);

const mongoose = require('mongoose');

/**
 * Schéma pour les Giveaways
 * Permet de gérer plusieurs giveaways simultanés
 */
const giveawaySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Le nom du giveaway est requis'],
      trim: true,
      minlength: [3, 'Le nom doit contenir au minimum 3 caractères'],
      maxlength: [50, 'Le nom doit contenir au maximum 50 caractères'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'La description doit contenir au maximum 500 caractères'],
    },
    status: {
      type: String,
      enum: ['active', 'paused', 'completed'],
      default: 'active',
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: {
      type: Date,
      required: [true, 'La date de fin est requise'],
    },
    durationDays: {
      type: Number,
      required: true,
    },
    durationHours: {
      type: Number,
      default: 0,
    },
    photos: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'GiveawayPhoto',
    }],
    participantCount: {
      type: Number,
      default: 0,
    },
    winnerCount: {
      type: Number,
      default: 0,
    },
    createdBy: {
      type: String,
      default: 'admin',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Giveaway', giveawaySchema);

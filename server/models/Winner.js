const mongoose = require('mongoose');

/**
 * Schéma Winner
 * Stocke l'historique des gagnants
 */
const winnerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Le nom du gagnant est requis'],
    },
    date: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Winner', winnerSchema);

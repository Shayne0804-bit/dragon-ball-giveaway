const mongoose = require('mongoose');

/**
 * Schéma pour les photos du giveaway
 * Stocke les photos en base64 directement dans MongoDB
 * Solution idéale pour les déploiements cloud avec stockage éphémère
 */
const giveawayPhotoSchema = new mongoose.Schema(
  {
    filename: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    imageData: {
      type: String, // Base64 encoded image
      required: true,
    },
    mimetype: {
      type: String,
      default: 'image/jpeg',
    },
    size: {
      type: Number,
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('GiveawayPhoto', giveawayPhotoSchema);

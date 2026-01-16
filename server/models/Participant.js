const mongoose = require('mongoose');

/**
 * Schéma Participant
 * Stocke les participants au giveaway avec leur IP pour l'anti-spam
 */
const participantSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Le nom est requis'],
      trim: true,
      minlength: [2, 'Le nom doit contenir au minimum 2 caractères'],
      maxlength: [20, 'Le nom doit contenir au maximum 20 caractères'],
      match: [/^[a-zA-Z0-9\s]+$/, 'Le nom ne peut contenir que des lettres, chiffres et espaces'],
    },
    ip: {
      type: String,
      required: [true, 'IP requise'],
      index: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Index pour la limite de 24h par IP
 * Supprime automatiquement les documents après 24h
 * Important: TTL index doit être sur un champ Date avec une durée
 */
// Index composite pour rechercher rapidement les participations par IP
participantSchema.index({ ip: 1, createdAt: -1 });

// TTL Index: supprime les documents 86400 secondes (24h) après leur création
// Le timestamp de création est géré par 'timestamps: true'
participantSchema.index(
  { createdAt: 1 },
  { 
    expireAfterSeconds: 86400, // 24h = 86400 secondes
    name: 'participation_ttl_24h'
  }
);

/**
 * Middleware de validation avant sauvegarde
 */
participantSchema.pre('save', function (next) {
  // Trim automatique du nom
  this.name = this.name.trim();
  next();
});

module.exports = mongoose.model('Participant', participantSchema);

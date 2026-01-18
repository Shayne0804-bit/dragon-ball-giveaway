const mongoose = require('mongoose');

/**
 * Schéma Participant
 * Stocke les participants au giveaway avec leur IP pour l'anti-spam
 * Support de l'authentification Discord
 */
const participantSchema = new mongoose.Schema(
  {
    // ========== Champs existants ==========
    name: {
      type: String,
      trim: true,
      minlength: [2, 'Le nom doit contenir au minimum 2 caractères'],
      maxlength: [20, 'Le nom doit contenir au maximum 20 caractères'],
      match: [/^[a-zA-Z0-9\s]+$/, 'Le nom ne peut contenir que des lettres, chiffres et espaces'],
      // Optionnel si authentification Discord activée
    },
    ip: {
      type: String,
      index: true,
    },
    giveaway: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Giveaway',
      index: true,
    },
    
    // ========== Champs Discord ==========
    discordId: {
      type: String,
      unique: true,
      sparse: true, // Permet les documents sans discordId
      index: true,
    },
    discordUsername: {
      type: String,
      trim: true,
    },
    discordAvatar: {
      type: String, // URL de l'avatar Discord
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    isDiscordAuthenticated: {
      type: Boolean,
      default: false,
    },
    
    // ========== Timestamps ==========
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
  // Trim automatique du nom (si le nom existe)
  if (this.name) {
    this.name = this.name.trim();
  }
  next();
});

module.exports = mongoose.model('Participant', participantSchema);

const mongoose = require('mongoose');

/**
 * Schéma pour stocker la session WhatsApp authentifiée
 * Utilisation: Persistance de la session entre redéploiements
 */
const whatsappSessionSchema = new mongoose.Schema(
  {
    // Identifiant unique de la session (toujours "default" pour une seule instance)
    sessionId: {
      type: String,
      unique: true,
      default: 'default',
      index: true,
    },
    
    // Données de credentials Baileys
    credentials: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    
    // État de la connexion
    state: {
      type: mongoose.Schema.Types.Mixed,
    },
    
    // Timestamp de la dernière mise à jour
    lastUpdate: {
      type: Date,
      default: Date.now,
    },
    
    // Numéro de téléphone connecté
    phoneNumber: {
      type: String,
      index: true,
    },
    
    // ID du téléphone (me.id)
    meId: {
      type: String,
    },
    
    // Status de la connexion
    connectionStatus: {
      type: String,
      enum: ['connected', 'disconnected', 'connecting'],
      default: 'disconnected',
    },
  },
  {
    timestamps: true,
    collection: 'whatsapp_sessions',
  }
);

// Index pour les recherches rapides
whatsappSessionSchema.index({ sessionId: 1 });
whatsappSessionSchema.index({ phoneNumber: 1 });
whatsappSessionSchema.index({ lastUpdate: -1 });

module.exports = mongoose.model('WhatsappSession', whatsappSessionSchema);

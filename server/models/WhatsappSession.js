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
    },
    
    // Données de credentials Baileys - Stockées en JSON pur
    credentials: {
      type: String, // Stocké en JSON string pour éviter les problèmes BSON Binary
      required: true,
      get: (v) => v ? JSON.parse(v) : null,
      set: (v) => typeof v === 'string' ? v : JSON.stringify(v),
    },
    
    // État de la connexion - Stocké en JSON pur
    state: {
      type: String, // Stocké en JSON string
      get: (v) => v ? JSON.parse(v) : null,
      set: (v) => v ? (typeof v === 'string' ? v : JSON.stringify(v)) : null,
    },
    
    // Timestamp de la dernière mise à jour
    lastUpdate: {
      type: Date,
      default: Date.now,
    },
    
    // Timestamp de la dernière sauvegarde réussie
    lastSaved: {
      type: Date,
      default: Date.now,
    },
    
    // Numéro de téléphone connecté
    phoneNumber: {
      type: String,
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

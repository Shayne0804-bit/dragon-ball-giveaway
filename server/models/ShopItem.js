const mongoose = require('mongoose');

/**
 * Schéma pour les articles de la boutique (Achat/Divers)
 * Permet aux admins d'ajouter des produits avec images, description, nom et prix
 */
const shopItemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Le nom du produit est requis'],
      trim: true,
      minlength: [3, 'Le nom doit contenir au minimum 3 caractères'],
      maxlength: [100, 'Le nom doit contenir au maximum 100 caractères'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'La description doit contenir au maximum 500 caractères'],
      default: '',
    },
    price: {
      type: Number,
      required: [true, 'Le prix est requis'],
      min: [0, 'Le prix ne peut pas être négatif'],
    },
    image: {
      type: String, // Base64 ou URL de l'image principale
      required: [true, 'L\'image principale est requise'],
    },
    imageMimetype: {
      type: String,
      default: 'image/jpeg',
    },
    // Galerie d'images supplémentaires
    gallery: [{
      data: String,        // Base64 de l'image
      mimetype: String,    // Type MIME
      uploadedAt: {
        type: Date,
        default: Date.now,
      },
    }],
    category: {
      type: String,
      trim: true,
      default: 'Divers',
    },
    inStock: {
      type: Boolean,
      default: true,
    },
    quantity: {
      type: Number,
      default: null, // null = stock illimité
    },
    order: {
      type: Number,
      default: 0, // Pour trier les articles dans l'affichage
    },
    accountId: {
      type: String,
      default: null, // ID du compte/référence fourni par l'admin
      trim: true,
    },
    accountDetails: {
      type: String,
      default: null, // Détails supplémentaires du compte
      trim: true,
    },
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

// Index pour les recherches
shopItemSchema.index({ category: 1, order: 1 });
shopItemSchema.index({ inStock: 1 });
shopItemSchema.index({ createdAt: -1 });

module.exports = mongoose.model('ShopItem', shopItemSchema);

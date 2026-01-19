const ShopItem = require('../models/ShopItem');

/**
 * Créer un nouvel article de boutique
 * POST /api/shop/items
 */
const createShopItem = async (req, res) => {
  try {
    const { name, description, price, image, imageMimetype, category, quantity } = req.body;

    // Validation
    if (!name || !price || !image) {
      return res.status(400).json({
        success: false,
        message: 'Le nom, le prix et l\'image sont requis',
      });
    }

    const shopItem = new ShopItem({
      name,
      description: description || '',
      price: parseFloat(price),
      image,
      imageMimetype: imageMimetype || 'image/jpeg',
      category: category || 'Divers',
      quantity: quantity ? parseInt(quantity) : null,
      order: await ShopItem.countDocuments(),
    });

    await shopItem.save();

    res.status(201).json({
      success: true,
      message: 'Article créé avec succès!',
      data: shopItem,
    });
  } catch (error) {
    console.error('[SHOP] Erreur création article:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de l\'article',
      error: error.message,
    });
  }
};

/**
 * Récupérer tous les articles de la boutique
 * GET /api/shop/items
 */
const getAllShopItems = async (req, res) => {
  try {
    const shopItems = await ShopItem.find()
      .sort({ order: 1, createdAt: -1 });

    res.status(200).json({
      success: true,
      count: shopItems.length,
      data: shopItems,
    });
  } catch (error) {
    console.error('[SHOP] Erreur récupération articles:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des articles',
      error: error.message,
    });
  }
};

/**
 * Récupérer un article par ID
 * GET /api/shop/items/:id
 */
const getShopItemById = async (req, res) => {
  try {
    const shopItem = await ShopItem.findById(req.params.id);

    if (!shopItem) {
      return res.status(404).json({
        success: false,
        message: 'Article non trouvé',
      });
    }

    res.status(200).json({
      success: true,
      data: shopItem,
    });
  } catch (error) {
    console.error('[SHOP] Erreur récupération article:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de l\'article',
      error: error.message,
    });
  }
};

/**
 * Mettre à jour un article
 * PUT /api/shop/items/:id
 */
const updateShopItem = async (req, res) => {
  try {
    const { name, description, price, image, imageMimetype, category, quantity, inStock, order } = req.body;

    const shopItem = await ShopItem.findById(req.params.id);

    if (!shopItem) {
      return res.status(404).json({
        success: false,
        message: 'Article non trouvé',
      });
    }

    // Mise à jour des champs
    if (name) shopItem.name = name;
    if (description !== undefined) shopItem.description = description;
    if (price) shopItem.price = parseFloat(price);
    if (image) shopItem.image = image;
    if (imageMimetype) shopItem.imageMimetype = imageMimetype;
    if (category) shopItem.category = category;
    if (quantity !== undefined) shopItem.quantity = quantity ? parseInt(quantity) : null;
    if (inStock !== undefined) shopItem.inStock = inStock;
    if (order !== undefined) shopItem.order = parseInt(order);
    shopItem.updatedAt = new Date();

    await shopItem.save();

    res.status(200).json({
      success: true,
      message: 'Article mis à jour avec succès!',
      data: shopItem,
    });
  } catch (error) {
    console.error('[SHOP] Erreur mise à jour article:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour de l\'article',
      error: error.message,
    });
  }
};

/**
 * Supprimer un article
 * DELETE /api/shop/items/:id
 */
const deleteShopItem = async (req, res) => {
  try {
    const shopItem = await ShopItem.findByIdAndDelete(req.params.id);

    if (!shopItem) {
      return res.status(404).json({
        success: false,
        message: 'Article non trouvé',
      });
    }

    // Réorganiser les ordres
    await ShopItem.updateMany(
      { order: { $gt: shopItem.order } },
      { $inc: { order: -1 } }
    );

    res.status(200).json({
      success: true,
      message: 'Article supprimé avec succès!',
    });
  } catch (error) {
    console.error('[SHOP] Erreur suppression article:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression de l\'article',
      error: error.message,
    });
  }
};

/**
 * Réorganiser les articles
 * PUT /api/shop/items/reorder
 */
const reorderShopItems = async (req, res) => {
  try {
    const { items } = req.body; // Array of {id, order}

    if (!Array.isArray(items)) {
      return res.status(400).json({
        success: false,
        message: 'Format invalide. Attendu: {items: [{id, order}, ...]}',
      });
    }

    // Mettre à jour tous les articles
    const updatePromises = items.map(item =>
      ShopItem.findByIdAndUpdate(
        item.id,
        { order: item.order, updatedAt: new Date() },
        { new: true }
      )
    );

    await Promise.all(updatePromises);

    res.status(200).json({
      success: true,
      message: 'Réorganisation effectuée avec succès!',
    });
  } catch (error) {
    console.error('[SHOP] Erreur réorganisation:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la réorganisation',
      error: error.message,
    });
  }
};

/**
 * Obtenir les articles par catégorie
 * GET /api/shop/items/category/:category
 */
const getItemsByCategory = async (req, res) => {
  try {
    const { category } = req.params;

    const shopItems = await ShopItem.find({ category })
      .sort({ order: 1, createdAt: -1 });

    res.status(200).json({
      success: true,
      category,
      count: shopItems.length,
      data: shopItems,
    });
  } catch (error) {
    console.error('[SHOP] Erreur récupération par catégorie:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des articles',
      error: error.message,
    });
  }
};

/**
 * Traiter un achat et envoyer les messages via Discord
 * POST /api/shop/purchase
 */
const processPurchase = async (req, res) => {
  try {
    const { items, itemCount, buyer } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Aucun article à acheter',
      });
    }

    // Vérifier que les infos acheteur sont présentes
    if (!buyer || !buyer.discordId) {
      return res.status(400).json({
        success: false,
        message: 'Informations acheteur manquantes',
      });
    }

    // IDs utilisateurs Discord cibles (notifications d'achat)
    const TARGET_DISCORD_USER_IDS = [
      process.env.SHOP_DISCORD_USER_ID_1 || '1260409722264092752',
      process.env.SHOP_DISCORD_USER_ID_2 || '1283010687433707520',
    ];

    console.log(`[SHOP] Achat traité - ${itemCount} article(s) par ${buyer.discordUsername} (${buyer.discordId})`);

    const discordBot = require('../services/discordBot');

    // Envoyer un message pour chaque article au bot Discord
    const sentMessages = [];
    
    for (let i = 0; i < items.length; i++) {
      const item = items[i];

      try {
        // Envoyer le message à chaque utilisateur cible
        for (const targetUserId of TARGET_DISCORD_USER_IDS) {
          const user = await discordBot.client.users.fetch(targetUserId);
          
          // Créer un embed avec les infos de l'acheteur
          const embed = {
            color: 0xFF9F00, // Orange (couleur du projet)
            title: '🛍️ Achat Confirmé',
            description: `**Acheteur:** ${buyer.discordTag}\n**ID Discord:** ${buyer.discordId}\n\n**ID Compte:** ${item.accountId || 'N/A'}\n**Produit:** ${item.itemName}\n**Prix:** ${item.itemPrice.toFixed(2)}€`,
            thumbnail: buyer.discordAvatar ? {
              url: `https://cdn.discordapp.com/avatars/${buyer.discordId}/${buyer.discordAvatar}.png?size=256`,
            } : null,
            image: item.itemImage && item.itemImage.startsWith('data:') ? null : {
              url: item.itemImage || null,
            },
            footer: {
              text: `Article ${i + 1}/${itemCount}`,
            },
            timestamp: new Date(),
          };

          const dmChannel = await user.createDM();
          await dmChannel.send({ embeds: [embed] });
          
          console.log(`[SHOP] Message ${i + 1}/${itemCount} envoyé à ${targetUserId} pour ${buyer.discordUsername} - ${item.accountId}`);
        }
        
        sentMessages.push({
          index: i + 1,
          accountId: item.accountId,
          itemName: item.itemName,
          buyer: buyer.discordUsername,
          sent: true,
        });

      } catch (discordError) {
        console.error(`[SHOP] Erreur envoi Discord pour article ${i + 1}:`, discordError.message);
        sentMessages.push({
          index: i + 1,
          accountId: item.accountId,
          itemName: item.itemName,
          sent: false,
          error: discordError.message,
        });
      }
    }

    res.status(200).json({
      success: true,
      message: `Achat confirmé - ${itemCount} article(s) - Messages envoyés à Discord`,
      messagesSent: sentMessages,
      purchaseDetails: {
        totalItems: itemCount,
        targetUserId: TARGET_DISCORD_USER_ID,
        timestamp: new Date().toISOString(),
      },
    });

  } catch (error) {
    console.error('[SHOP] Erreur traitement achat:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du traitement de l\'achat',
      error: error.message,
    });
  }
};

module.exports = {
  createShopItem,
  getAllShopItems,
  getShopItemById,
  updateShopItem,
  deleteShopItem,
  reorderShopItems,
  getItemsByCategory,
  processPurchase,
};

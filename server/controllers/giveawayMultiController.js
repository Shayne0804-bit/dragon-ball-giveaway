const Giveaway = require('../models/Giveaway');
const GiveawayPhoto = require('../models/GiveawayPhoto');

/**
 * Créer un nouveau giveaway
 * POST /api/giveaways
 */
const createGiveaway = async (req, res) => {
  try {
    const { name, description, durationDays, durationHours } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Le nom du giveaway est requis',
      });
    }

    if (!durationDays && !durationHours) {
      return res.status(400).json({
        success: false,
        message: 'La durée est requise (jours ou heures)',
      });
    }

    // Calculer la date de fin
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + (durationDays || 0));
    endDate.setHours(endDate.getHours() + (durationHours || 0));

    const giveaway = new Giveaway({
      name,
      description: description || '',
      durationDays: durationDays || 0,
      durationHours: durationHours || 0,
      endDate,
      status: 'active',
    });

    await giveaway.save();
    console.log(`[CREATE] Giveaway créé: ${giveaway._id} - ${name}`);

    res.status(201).json({
      success: true,
      message: 'Giveaway créé avec succès!',
      data: {
        giveaway,
      },
    });
  } catch (error) {
    console.error('Erreur lors de la création du giveaway:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création du giveaway',
      error: error.message,
    });
  }
};

/**
 * Récupérer tous les giveaways actifs
 * GET /api/giveaways
 */
const getGiveaways = async (req, res) => {
  try {
    const giveaways = await Giveaway.find({ status: 'active' })
      .populate('photos')
      .sort({ createdAt: -1 });

    console.log(`[GIVEAWAYS] ${giveaways.length} giveaways actifs trouvés`);
    giveaways.forEach(g => {
      console.log(`  - ${g.name}: ${g.photos ? g.photos.length : 0} photo(s)`);
    });

    res.json({
      success: true,
      data: {
        giveaways,
      },
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des giveaways:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des giveaways',
    });
  }
};

/**
 * Récupérer un giveaway spécifique
 * GET /api/giveaways/:id
 */
const getGiveawayById = async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`[GIVEAWAY] Récupération du giveaway: ${id}`);
    
    const giveaway = await Giveaway.findById(id).populate('photos');

    if (!giveaway) {
      console.log(`[GIVEAWAY] Giveaway non trouvé: ${id}`);
      return res.status(404).json({
        success: false,
        message: 'Giveaway non trouvé',
      });
    }

    console.log(`[GIVEAWAY] Giveaway trouvé: ${giveaway.name} (${giveaway.photos ? giveaway.photos.length : 0} photos)`);

    res.json({
      success: true,
      data: {
        giveaway,
      },
    });
  } catch (error) {
    console.error('Erreur lors de la récupération du giveaway:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du giveaway',
    });
  }
};

/**
 * Mettre à jour un giveaway
 * PUT /api/giveaways/:id
 */
const updateGiveaway = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, status, durationDays, durationHours } = req.body;

    const giveaway = await Giveaway.findById(id);
    if (!giveaway) {
      return res.status(404).json({
        success: false,
        message: 'Giveaway non trouvé',
      });
    }

    // Mettre à jour les champs
    if (name) giveaway.name = name;
    if (description !== undefined) giveaway.description = description;
    if (status) giveaway.status = status;
    if (durationDays !== undefined || durationHours !== undefined) {
      giveaway.durationDays = durationDays || giveaway.durationDays;
      giveaway.durationHours = durationHours || giveaway.durationHours;
      
      // Recalculer la date de fin
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + giveaway.durationDays);
      endDate.setHours(endDate.getHours() + giveaway.durationHours);
      giveaway.endDate = endDate;
    }

    await giveaway.save();

    res.status(200).json({
      success: true,
      message: 'Giveaway mis à jour avec succès!',
      data: {
        giveaway,
      },
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du giveaway:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du giveaway',
    });
  }
};

/**
 * Supprimer un giveaway
 * DELETE /api/giveaways/:id
 */
const deleteGiveaway = async (req, res) => {
  try {
    const { id } = req.params;

    const giveaway = await Giveaway.findByIdAndDelete(id);
    if (!giveaway) {
      return res.status(404).json({
        success: false,
        message: 'Giveaway non trouvé',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Giveaway supprimé avec succès!',
    });
  } catch (error) {
    console.error('Erreur lors de la suppression du giveaway:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression du giveaway',
    });
  }
};

module.exports = {
  createGiveaway,
  getGiveaways,
  getGiveawayById,
  updateGiveaway,
  deleteGiveaway,
};

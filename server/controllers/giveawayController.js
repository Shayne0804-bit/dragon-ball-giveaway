const GiveawayPhoto = require('../models/GiveawayPhoto');
const Giveaway = require('../models/Giveaway');
const discordBot = require('../services/discordBot');

/**
 * Uploader les photos du giveaway
 * POST /api/giveaway/photos
 * Accepte soit des fichiers multipart, soit du JSON base64
 */
const uploadGiveawayPhotos = async (req, res) => {
  try {
    // Gestion du JSON base64
    if (req.body && req.body.image && req.body.giveawayId) {
      const { image, giveawayId } = req.body;
      
      console.log(`[PHOTO] Upload base64 pour giveaway ${giveawayId}`);
      
      // Vérifier que le giveaway existe
      const giveaway = await Giveaway.findById(giveawayId);
      if (!giveaway) {
        return res.status(404).json({
          success: false,
          message: 'Giveaway non trouvé',
        });
      }
      
      // Convertir le base64 en buffer
      const base64Data = image.replace(/^data:image\/(jpeg|jpg|png);base64,/, '');
      
      // Créer l'objet photo
      const giveawayPhoto = new GiveawayPhoto({
        filename: `giveaway_${giveawayId}_${Date.now()}.jpg`,
        imageData: base64Data,
        mimetype: 'image/jpeg',
        size: Buffer.byteLength(base64Data, 'base64'),
      });
      
      await giveawayPhoto.save();
      console.log(`[PHOTO] Photo sauvegardée: ${giveawayPhoto._id}`);
      
      // Ajouter la photo au giveaway
      if (!giveaway.photos) {
        giveaway.photos = [];
      }
      giveaway.photos.push(giveawayPhoto._id);
      await giveaway.save();
      console.log(`[PHOTO] Photo liée au giveaway. Total: ${giveaway.photos.length}`);
      
      // Envoyer une notification Discord avec la photo
      try {
        const populatedGiveaway = await Giveaway.findById(giveawayId).populate('photos');
        if (populatedGiveaway && populatedGiveaway.photos.length > 0) {
          console.log(`[PHOTO] Envoi de la notification Discord avec photo...`);
          await discordBot.notifyGiveawayCreated(populatedGiveaway);
        }
      } catch (err) {
        console.error('[PHOTO] Erreur lors de l\'envoi de la notification Discord:', err.message);
      }
      
      return res.status(201).json({
        success: true,
        message: 'Photo uploadée avec succès!',
        data: {
          photoId: giveawayPhoto._id,
          filename: giveawayPhoto.filename,
        },
      });
    }
    
    // Gestion des fichiers multipart (fichiers)
    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Aucun fichier uploadé',
      });
    }

    const photos = Array.isArray(req.files.photos) ? req.files.photos : [req.files.photos];

    // Vérifier le nombre total de photos (existantes + nouvelles)
    const existingPhotosCount = await GiveawayPhoto.countDocuments({});
    if (existingPhotosCount + photos.length > 5) {
      return res.status(400).json({
        success: false,
        message: `Maximum 5 photos autorisées. Vous en avez déjà ${existingPhotosCount}. Vous ne pouvez ajouter que ${5 - existingPhotosCount} de plus.`,
      });
    }

    // Convertir et ajouter les nouvelles photos (sans supprimer les anciennes)
    const uploadedPhotos = [];
    
    for (let i = 0; i < photos.length; i++) {
      const photo = photos[i];
      const filename = `giveaway_${Date.now()}_${i}.jpg`;
      
      // Convertir le buffer en base64
      const base64Data = photo.data.toString('base64');
      
      // Créer un objet photo dans MongoDB
      const giveawayPhoto = new GiveawayPhoto({
        filename: filename,
        imageData: base64Data,
        mimetype: photo.mimetype || 'image/jpeg',
        size: photo.size,
      });
      
      await giveawayPhoto.save();
      uploadedPhotos.push({
        _id: giveawayPhoto._id,
        filename: filename,
      });
    }

    // Récupérer toutes les photos (anciennes + nouvelles)
    const allPhotos = await GiveawayPhoto.find({}).select('_id filename');

    res.status(201).json({
      success: true,
      message: `${uploadedPhotos.length} photo(s) uploadée(s) avec succès!`,
      data: {
        photos: allPhotos,
      },
    });
  } catch (error) {
    console.error('Erreur lors de l\'upload des photos:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'upload',
    });
  }
};

/**
 * Récupérer les photos du giveaway actuel
 * GET /api/giveaway/photos
 */
const getGiveawayPhotos = async (req, res) => {
  try {
    const photos = await GiveawayPhoto.find({}).select('filename _id');
    
    const photosList = photos.map((photo) => ({
      _id: photo._id,
      filename: photo.filename,
    }));

    res.json({
      success: true,
      data: {
        photos: photosList,
      },
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des photos:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des photos',
    });
  }
};

/**
 * Récupérer une photo spécifique par ID
 * GET /api/giveaway/photos/:id
 */
const getGiveawayPhotoById = async (req, res) => {
  try {
    const { id } = req.params;
    const photo = await GiveawayPhoto.findById(id);

    if (!photo) {
      return res.status(404).json({
        success: false,
        message: 'Photo non trouvée',
      });
    }

    // Retourner la photo en base64 avec le type MIME
    res.setHeader('Content-Type', photo.mimetype);
    res.send(Buffer.from(photo.imageData, 'base64'));
  } catch (error) {
    console.error('Erreur lors de la récupération de la photo:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération',
    });
  }
};


/**
 * Supprimer toutes les photos du giveaway
 * DELETE /api/giveaway/photos
 */
const deleteAllGiveawayPhotos = async (req, res) => {
  try {
    await GiveawayPhoto.deleteMany({});

    res.status(200).json({
      success: true,
      message: 'Toutes les photos ont été supprimées',
    });
  } catch (error) {
    console.error('Erreur lors de la suppression des photos:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression des photos',
    });
  }
};

/**
 * Supprimer une photo spécifique par ID
 * DELETE /api/giveaway/photos/:id
 */
const deleteGiveawayPhoto = async (req, res) => {
  try {
    const { id } = req.params;
    const photo = await GiveawayPhoto.findByIdAndDelete(id);

    if (!photo) {
      return res.status(404).json({
        success: false,
        message: 'Photo non trouvée',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Photo supprimée',
    });
  } catch (error) {
    console.error('Erreur lors de la suppression de la photo:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression',
    });
  }
};

module.exports = {
  uploadGiveawayPhotos,
  getGiveawayPhotos,
  getGiveawayPhotoById,
  deleteAllGiveawayPhotos,
  deleteGiveawayPhoto,
};

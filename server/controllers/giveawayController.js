const fs = require('fs');
const path = require('path');

const UPLOADS_DIR = path.join(__dirname, '../../client/uploads/giveaway');

/**
 * Créer le dossier uploads s'il n'existe pas
 */
function ensureUploadsDir() {
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
}

/**
 * Uploader les photos du giveaway
 * POST /api/giveaway/photos
 */
const uploadGiveawayPhotos = (req, res) => {
  try {
    ensureUploadsDir();

    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Aucun fichier uploadé',
      });
    }

    const photos = Array.isArray(req.files.photos) ? req.files.photos : [req.files.photos];

    if (photos.length > 5) {
      return res.status(400).json({
        success: false,
        message: 'Maximum 5 photos autorisées',
      });
    }

    // Supprimer les photos existantes
    const existingFiles = fs.readdirSync(UPLOADS_DIR);
    existingFiles.forEach((file) => {
      fs.unlinkSync(path.join(UPLOADS_DIR, file));
    });

    // Uploader les nouvelles photos
    const uploadedPhotos = [];
    photos.forEach((photo, index) => {
      const filename = `giveaway_${Date.now()}_${index}.jpg`;
      const filepath = path.join(UPLOADS_DIR, filename);
      photo.mv(filepath, (err) => {
        if (err) {
          console.error('Erreur lors de l\'upload:', err);
        }
      });
      uploadedPhotos.push(`/uploads/giveaway/${filename}`);
    });

    res.json({
      success: true,
      message: `${uploadedPhotos.length} photo(s) uploadée(s) avec succès!`,
      data: {
        photos: uploadedPhotos,
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
const getGiveawayPhotos = (req, res) => {
  try {
    ensureUploadsDir();

    const files = fs.readdirSync(UPLOADS_DIR);
    const photos = files.map((file) => `/uploads/giveaway/${file}`);

    res.json({
      success: true,
      data: {
        photos: photos,
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
 * Supprimer toutes les photos du giveaway
 * DELETE /api/giveaway/photos
 */
const deleteAllGiveawayPhotos = (req, res) => {
  try {
    ensureUploadsDir();

    const files = fs.readdirSync(UPLOADS_DIR);
    files.forEach((file) => {
      fs.unlinkSync(path.join(UPLOADS_DIR, file));
    });

    res.json({
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
 * Supprimer une photo spécifique
 * DELETE /api/giveaway/photos/:filename
 */
const deleteGiveawayPhoto = (req, res) => {
  try {
    const { filename } = req.params;
    const filepath = path.join(UPLOADS_DIR, filename);

    // Vérifier que le fichier est bien dans le dossier uploads
    if (!filepath.startsWith(UPLOADS_DIR)) {
      return res.status(400).json({
        success: false,
        message: 'Fichier invalide',
      });
    }

    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
      res.json({
        success: true,
        message: 'Photo supprimée',
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Photo non trouvée',
      });
    }
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
  deleteAllGiveawayPhotos,
  deleteGiveawayPhoto,
};

const validator = require('validator');

/**
 * Middleware de validation du nom
 * - Non vide
 * - Min 2 caractères
 * - Max 20 caractères
 * - Caractères autorisés : lettres, chiffres, espaces
 * - XSS protection
 */
const validateParticipantName = (req, res, next) => {
  const { name } = req.body;

  // Vérifier la présence du nom
  if (!name) {
    return res.status(400).json({
      success: false,
      message: 'Le nom est requis',
    });
  }

  // Trim automatique
  const trimmedName = name.trim();

  // Vérifier la longueur
  if (trimmedName.length < 2) {
    return res.status(400).json({
      success: false,
      message: 'Le nom doit contenir au minimum 2 caractères',
    });
  }

  if (trimmedName.length > 20) {
    return res.status(400).json({
      success: false,
      message: 'Le nom doit contenir au maximum 20 caractères',
    });
  }

  // Vérifier les caractères autorisés (lettres, chiffres, espaces)
  if (!/^[a-zA-Z0-9\s]+$/.test(trimmedName)) {
    return res.status(400).json({
      success: false,
      message: 'Le nom ne peut contenir que des lettres, chiffres et espaces',
    });
  }

  // Protection XSS - echapper les caractères dangereux
  req.body.name = validator.escape(trimmedName);

  next();
};

/**
 * Middleware de validation de l'IP
 */
const validateIp = (req, res, next) => {
  if (!req.clientIp) {
    return res.status(400).json({
      success: false,
      message: 'IP non détectée',
    });
  }
  next();
};

module.exports = {
  validateParticipantName,
  validateIp,
};

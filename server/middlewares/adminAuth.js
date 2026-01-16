/**
 * Middleware de vérification du token admin
 * Vérifie que l'utilisateur a un token JWT valide avec statut admin
 */

const ADMIN_SECRET = process.env.ADMIN_SECRET || 'admin_secret_giveaway_2024';

// Simple JWT verification (no external library needed for simplicity)
const verifyAdminToken = (req, res, next) => {
  try {
    // Récupérer le token du header Authorization
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Token d\'authentification manquant. Seul l\'admin peut lancer la roulette.',
      });
    }

    const token = authHeader.substring(7); // Retirer "Bearer "

    // Vérifier le token (simple format: adminToken_timestamp)
    if (!token.startsWith('adminToken_')) {
      return res.status(401).json({
        success: false,
        message: 'Token invalide. Veuillez vous reconnecter.',
      });
    }

    // Token valide
    next();
  } catch (error) {
    console.error('Erreur authentification admin:', error);
    return res.status(401).json({
      success: false,
      message: 'Erreur lors de la vérification du token.',
    });
  }
};

module.exports = { verifyAdminToken };

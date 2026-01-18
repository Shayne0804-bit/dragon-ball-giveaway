/**
 * Contrôleur User
 * Gestion des utilisateurs Discord authentifiés
 */

const User = require('../models/User');

/**
 * Créer ou mettre à jour un utilisateur Discord
 * Utilisé lors de la connexion Discord
 */
const createOrUpdateUser = async (discordUser) => {
  try {
    // Chercher l'utilisateur existant
    let user = await User.findOne({ discordId: discordUser.id });

    if (user) {
      // Mettre à jour les infos
      user.discordUsername = discordUser.username;
      user.discriminator = discordUser.discriminator;
      user.discordAvatar = discordUser.avatar
        ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`
        : null;
      user.email = discordUser.email;
      user.isActive = true;
      await user.save();
      console.log(`[USER] Mise à jour: ${discordUser.username}`);
    } else {
      // Créer un nouvel utilisateur
      user = new User({
        discordId: discordUser.id,
        discordUsername: discordUser.username,
        discriminator: discordUser.discriminator,
        discordAvatar: discordUser.avatar
          ? `https://cdn.discordapp.com/avatars/${discordUser.id}/${discordUser.avatar}.png`
          : null,
        email: discordUser.email,
      });
      await user.save();
      console.log(`[USER] Création: ${discordUser.username}`);
    }

    return user;
  } catch (error) {
    console.error('[USER] Erreur:', error.message);
    throw error;
  }
};

/**
 * Obtenir un utilisateur par Discord ID
 */
const getUserByDiscordId = async (discordId) => {
  try {
    const user = await User.findOne({ discordId });
    return user;
  } catch (error) {
    console.error('[USER] Erreur récupération:', error.message);
    throw error;
  }
};

/**
 * Obtenir un utilisateur par ID MongoDB
 */
const getUserById = async (userId) => {
  try {
    const user = await User.findById(userId);
    return user;
  } catch (error) {
    console.error('[USER] Erreur récupération:', error.message);
    throw error;
  }
};

module.exports = {
  createOrUpdateUser,
  getUserByDiscordId,
  getUserById,
};

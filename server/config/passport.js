const passport = require('passport');
const DiscordStrategy = require('passport-discord').Strategy;
const User = require('../models/User');
const axios = require('axios');
const { createOrUpdateUser } = require('../controllers/userController');

/**
 * Configuration de la stratégie Discord
 * Vérifie que l'utilisateur est dans le serveur Discord autorisé
 */
passport.use(
  new DiscordStrategy(
    {
      clientID: process.env.DISCORD_CLIENT_ID,
      clientSecret: process.env.DISCORD_CLIENT_SECRET,
      callbackURL: process.env.DISCORD_CALLBACK_URL,
      scope: ['identify', 'email'],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // ============================================
        // 1. Vérifier que l'utilisateur est dans le serveur Discord
        // ============================================
        const guildId = process.env.DISCORD_GUILD_ID;
        
        try {
          // Récupérer la liste des serveurs de l'utilisateur
          const guildsResponse = await axios.get('https://discord.com/api/users/@me/guilds', {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          });

          const userGuilds = guildsResponse.data;
          const isInGuild = userGuilds.some((guild) => guild.id === guildId);

          if (!isInGuild) {
            // L'utilisateur n'est pas dans le serveur Discord
            console.log(`[DISCORD AUTH] ❌ Utilisateur ${profile.username} (${profile.id}) n'est pas dans le serveur Discord`);
            return done(null, false, {
              message: `Vous devez rejoindre le serveur Discord pour participer au giveaway`,
              details: `Lien d'invitation: https://discord.gg/gc8E7cy9`,
            });
          }
        } catch (discordApiError) {
          // En cas d'erreur rate limit ou autre, on rejette avec un message clair
          console.error('Erreur API Discord (vérification serveur):', discordApiError.response?.status, discordApiError.message);
          
          if (discordApiError.response?.status === 429) {
            return done(null, false, {
              message: `Trop de requêtes. Veuillez réessayer dans quelques secondes.`,
            });
          }
          
          // Pour les autres erreurs, on permet quand même (failsafe)
          console.warn('⚠️ Impossible de vérifier le serveur Discord, permettre la participation');
        }

        // ============================================
        // 2. Chercher ou créer l'utilisateur en base
        // ============================================
        const user = await createOrUpdateUser(profile);

        return done(null, user);
      } catch (error) {
        console.error('Erreur lors de l\'authentification Discord:', error);
        return done(error);
      }
    }
  )
);

/**
 * Sérialiser l'utilisateur pour la session
 */
passport.serializeUser((user, done) => {
  done(null, user.id); // Utiliser l'ID MongoDB du User
});

/**
 * Désérialiser l'utilisateur depuis la session
 */
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error);
  }
});

module.exports = passport;

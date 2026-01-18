const passport = require('passport');
const DiscordStrategy = require('passport-discord').Strategy;
const Participant = require('../models/Participant');
const axios = require('axios');

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
            return done(null, false, {
              message: `Vous devez être dans le serveur Discord pour participer au giveaway`,
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
        let participant = await Participant.findOne({ discordId: profile.id });

        if (!participant) {
          // Créer un nouveau participant
          participant = new Participant({
            discordId: profile.id,
            discordUsername: profile.username,
            discordAvatar: profile.avatar
              ? `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.webp?size=256`
              : `https://cdn.discordapp.com/embed/avatars/${profile.discriminator % 5}.png`,
            email: profile.email,
            isDiscordAuthenticated: true,
          });

          await participant.save();
        } else {
          // Mettre à jour les infos Discord
          participant.discordUsername = profile.username;
          participant.discordAvatar = profile.avatar
            ? `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.webp?size=256`
            : `https://cdn.discordapp.com/embed/avatars/${profile.discriminator % 5}.png`;
          participant.email = profile.email;
          participant.isDiscordAuthenticated = true;

          await participant.save();
        }

        return done(null, participant);
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
  done(null, user.id); // Utiliser l'ID MongoDB
});

/**
 * Désérialiser l'utilisateur depuis la session
 */
passport.deserializeUser(async (id, done) => {
  try {
    const user = await Participant.findById(id);
    done(null, user);
  } catch (error) {
    done(error);
  }
});

module.exports = passport;

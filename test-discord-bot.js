#!/usr/bin/env node

/**
 * Script de test pour le Bot Discord
 * Teste la connectivité et les permissions du bot
 */

require('dotenv').config();
const discordBot = require('./server/services/discordBot');

async function testDiscordBot() {
  console.log('🧪 Démarrage des tests du Bot Discord...\n');

  // Vérifier les variables d'environnement
  console.log('📋 Vérification des variables d\'environnement:');
  const botToken = process.env.DISCORD_BOT_TOKEN;
  const channelId = process.env.DISCORD_CHANNEL_ID;

  if (!botToken) {
    console.error('❌ DISCORD_BOT_TOKEN non défini dans .env');
    process.exit(1);
  } else {
    console.log('✅ DISCORD_BOT_TOKEN défini');
  }

  if (!channelId) {
    console.error('❌ DISCORD_CHANNEL_ID non défini dans .env');
    process.exit(1);
  } else {
    console.log('✅ DISCORD_CHANNEL_ID défini:', channelId);
  }

  console.log('\n🤖 Initialisation du Bot Discord...');
  
  try {
    const isReady = await discordBot.initialize();
    
    if (!isReady) {
      console.error('❌ Le bot n\'a pas pu se connecter');
      process.exit(1);
    }

    console.log('✅ Bot connecté avec succès!\n');

    // Attendre un peu pour s'assurer que le bot est vraiment prêt
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Tester l'envoi d'une notification de test
    console.log('📨 Envoi d\'une notification de test...');
    
    const testGiveaway = {
      _id: 'test-id-' + Date.now(),
      name: 'Giveaway de Test',
      description: 'Ceci est un giveaway de test pour vérifier le bot Discord',
      durationDays: 7,
      durationHours: 0,
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      participantCount: 42,
      winnerCount: 1,
      status: 'active',
    };

    const success = await discordBot.notifyGiveawayCreated(testGiveaway);
    
    if (success) {
      console.log('✅ Notification envoyée avec succès!\n');
      console.log('🎉 Tout est bien configuré!');
      console.log('📝 N\'oubliez pas de définir vos vraies variables dans .env:\n');
      console.log('   - DISCORD_BOT_TOKEN');
      console.log('   - DISCORD_CHANNEL_ID');
      console.log('\nAllez à: https://discord.com/developers/applications pour obtenir ces valeurs');
    } else {
      console.error('❌ Erreur lors de l\'envoi de la notification');
      process.exit(1);
    }

    // Arrêter le bot
    await discordBot.shutdown();
    console.log('\n✅ Test terminé');
    process.exit(0);

  } catch (error) {
    console.error('❌ Erreur pendant le test:', error.message);
    console.error('\nPossibles causes:');
    console.error('1. Token Discord invalide');
    console.error('2. ID du canal Discord invalide');
    console.error('3. Le bot n\'a pas les permissions nécessaires');
    console.error('4. Le canal n\'existe pas ou est inaccessible');
    process.exit(1);
  }
}

testDiscordBot();

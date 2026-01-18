#!/usr/bin/env node

/**
 * Script de test pour vérifier l'avatar Discord
 */

require('dotenv').config();
const axios = require('axios');

async function testAvatarFlow() {
  console.log('🧪 Test du flux Avatar Discord\n');

  const baseUrl = 'http://localhost:5000';

  try {
    // 1. Tester l'endpoint de debug
    console.log('1️⃣ Appel à /api/auth/debug pour voir l\'état de session...');
    try {
      const debugRes = await axios.get(`${baseUrl}/api/auth/debug`, {
        withCredentials: true,
      });
      console.log('   Réponse:', debugRes.data);
    } catch (err) {
      console.log('   Aucun utilisateur en session (normal si pas connecté)');
    }

    console.log('\n✅ Test terminé');
    console.log('\n💡 Instructions:');
    console.log('   1. Ouvre http://localhost:5000 dans ton navigateur');
    console.log('   2. Appuie sur F12 pour ouvrir la console');
    console.log('   3. Clique sur le bouton "Connexion Discord"');
    console.log('   4. Autorise l\'accès et regarde les logs');
    console.log('   5. Cherche les messages avec "Avatar Discord URL"');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

testAvatarFlow();

/**
 * Script pour nettoyer les doublons via l'API
 * Utilise le mot de passe admin pour générer un token
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';
const ADMIN_PASSWORD = 'admin123'; // Le mot de passe admin par défaut

async function cleanupDuplicates() {
  try {
    console.log('🔐 Connexion en tant qu\'administrateur...\n');

    // 1. Se connecter en tant qu'admin
    const loginRes = await axios.post(`${BASE_URL}/auth/admin-login`, {
      password: ADMIN_PASSWORD
    });

    if (!loginRes.data.success) {
      console.error('❌ Erreur connexion admin:', loginRes.data.message);
      return;
    }

    const adminToken = loginRes.data.token;
    console.log('✅ Connecté. Token obtenu\n');

    // 2. Appeler l'endpoint de nettoyage
    console.log('🧹 Lancement du nettoyage des doublons...\n');

    const cleanupRes = await axios.post(
      `${BASE_URL}/admin/cleanup-duplicates`,
      {},
      {
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      }
    );

    if (!cleanupRes.data.success) {
      console.error('❌ Erreur nettoyage:', cleanupRes.data.message);
      return;
    }

    // 3. Afficher le rapport
    const { report, duplicatesFound, deleted, remainingParticipants } = cleanupRes.data;

    console.log('✅ Nettoyage terminé!');
    console.log(`\n📊 Statistiques:`);
    console.log(`   • Groupes avec doublons: ${duplicatesFound}`);
    console.log(`   • Documents supprimés: ${deleted}`);
    console.log(`   • Participants restants: ${remainingParticipants}`);

    if (report.length > 0) {
      console.log(`\n📝 Détails des suppressions:`);
      report.forEach((item, i) => {
        console.log(`\n   ${i + 1}. Discord: ${item.discordId}`);
        console.log(`      Giveaway: ${item.giveaway || 'N/A'}`);
        console.log(`      Supprimé: ${item.deleted} entrée(s)`);
      });
    }

    console.log('\n✅ Base de données nettoyée avec succès!');

  } catch (error) {
    console.error('❌ Erreur:', error.response?.data || error.message);
  }
}

cleanupDuplicates();

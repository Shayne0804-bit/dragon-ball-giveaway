/**
 * Script de nettoyage des doublons Discord+Giveaway
 * Gardons UNE participation par (Discord ID + Giveaway)
 * et supprimez les doublons
 */

const mongoose = require('mongoose');

// Connexion directe avec la chaîne d'env
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/giveaways';

// Modèles
const Participant = require('./server/models/Participant');

async function cleanupByGiveaway() {
  try {
    console.log('🔄 Connexion à MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ MongoDB connecté\n');

    // Trouver tous les doublons (Discord + Giveaway)
    const duplicates = await Participant.aggregate([
      {
        $group: {
          _id: {
            discordId: '$discordId',
            giveaway: '$giveaway'
          },
          count: { $sum: 1 },
          docs: { $push: '$$ROOT' }
        }
      },
      {
        $match: {
          count: { $gt: 1 } // Plus d'une participation
        }
      }
    ]);

    console.log(`📊 Groupes avec doublons: ${duplicates.length}`);

    let totalDeleted = 0;

    for (const group of duplicates) {
      const { _id, count, docs } = group;
      console.log(`\n🔍 Discord: ${_id.discordId}`);
      console.log(`   Giveaway: ${_id.giveaway}`);
      console.log(`   Participations: ${count}`);

      // Trier par date créée et garder la plus ancienne
      const sorted = docs.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      const toKeep = sorted[0];
      const toDelete = sorted.slice(1);

      console.log(`   ✅ Gardé: ${toKeep._id} (${new Date(toKeep.createdAt).toLocaleString()})`);
      console.log(`   🗑️  À supprimer: ${toDelete.length} entrée(s)`);

      // Supprimer les doublons
      const deleteResult = await Participant.deleteMany({
        _id: { $in: toDelete.map(d => d._id) }
      });

      totalDeleted += deleteResult.deletedCount;
    }

    console.log(`\n✅ Nettoyage terminé!`);
    console.log(`   📈 Total supprimé: ${totalDeleted} documents`);

    // Afficher les statistiques finales
    const finalCount = await Participant.countDocuments();
    console.log(`   📊 Participants restants: ${finalCount}`);

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Déconnecté de MongoDB');
  }
}

cleanupByGiveaway();

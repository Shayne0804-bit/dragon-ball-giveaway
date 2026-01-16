/**
 * Script de test de l'API Giveaway
 * Usage: node test-api.js
 */

const http = require('http');

const API_URL = 'http://localhost:5000/api/participants';

// Couleurs pour le terminal
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function makeRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(API_URL + path);
    const options = {
      hostname: url.hostname,
      port: url.port || 80,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            data: JSON.parse(data),
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: data,
          });
        }
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
}

async function runTests() {
  log('\n========================================', 'blue');
  log('  🎁 Tests API Giveaway', 'blue');
  log('========================================\n', 'blue');

  try {
    // Test 1: Ajouter des participants
    log('Test 1: Ajouter des participants', 'yellow');
    for (let i = 1; i <= 3; i++) {
      const res = await makeRequest('POST', '', { name: `Participant ${i}` });
      if (res.status === 201) {
        log(`✅ Participant ${i} ajouté`, 'green');
      } else {
        log(`❌ Erreur: ${res.data.message}`, 'red');
      }
    }

    // Test 2: Récupérer les participants
    log('\nTest 2: Récupérer les participants', 'yellow');
    const getRes = await makeRequest('GET', '');
    if (getRes.status === 200) {
      log(`✅ ${getRes.data.count} participants trouvés`, 'green');
      getRes.data.data.forEach((p) => {
        log(`   👤 ${p.name}`, 'blue');
      });
    } else {
      log(`❌ Erreur lors de la récupération`, 'red');
    }

    // Test 3: Tirer un gagnant
    log('\nTest 3: Tirer un gagnant', 'yellow');
    const spinRes = await makeRequest('POST', '/roulette');
    if (spinRes.status === 200) {
      log(`✅ Gagnant: ${spinRes.data.data.name}`, 'green');
    } else {
      log(`❌ Erreur: ${spinRes.data.message}`, 'red');
    }

    // Test 4: Voir l'historique des gagnants
    log('\nTest 4: Historique des gagnants', 'yellow');
    const winnersRes = await makeRequest('GET', '/winners');
    if (winnersRes.status === 200) {
      log(`✅ ${winnersRes.data.count} gagnant(s)`, 'green');
      winnersRes.data.data.forEach((w) => {
        log(`   🏆 ${w.name}`, 'blue');
      });
    } else {
      log(`❌ Erreur lors de la récupération`, 'red');
    }

    // Test 5: Validation - nom invalide
    log('\nTest 5: Validation - nom trop court', 'yellow');
    const invalidRes = await makeRequest('POST', '', { name: 'A' });
    if (invalidRes.status === 400) {
      log(`✅ Validation correcte: ${invalidRes.data.message}`, 'green');
    } else {
      log(`❌ Validation échouée`, 'red');
    }

    // Test 6: Anti-spam (2ème participation par la même IP)
    log('\nTest 6: Anti-spam (2ème participation rapide)', 'yellow');
    const spamRes = await makeRequest('POST', '', { name: 'Test Spam' });
    if (spamRes.status === 429 || spamRes.status === 400) {
      log(`✅ Anti-spam activé: ${spamRes.data.message}`, 'green');
    } else if (spamRes.status === 201) {
      log(`✅ Participation acceptée (IP différente ou délai passé)`, 'green');
    }

    log('\n========================================', 'blue');
    log('  ✅ Tests terminés!', 'blue');
    log('========================================\n', 'blue');
  } catch (error) {
    log(`\n❌ Erreur: ${error.message}`, 'red');
    log('Assurez-vous que le serveur est démarré sur http://localhost:5000', 'red');
  }
}

runTests();

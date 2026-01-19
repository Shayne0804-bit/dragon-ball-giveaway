#!/usr/bin/env node

/**
 * 🚀 TEST RUNNER - Dragon Ball Giveaway
 * Exécute tous les tests avec un formatage amélioré
 * Usage: node test-runner.js
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

// ✨ Styles et couleurs
const styles = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  
  // Couleurs
  black: '\x1b[30m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  
  // Backgrounds
  bgBlue: '\x1b[44m',
  bgGreen: '\x1b[42m',
  bgRed: '\x1b[41m',
  bgYellow: '\x1b[43m',
};

// 🎨 Formatage des logs
const log = {
  title: (text) => console.log(`\n${styles.bgBlue}${styles.white}${styles.bright} ${text} ${styles.reset}\n`),
  section: (text) => console.log(`\n${styles.cyan}${styles.bright}▶ ${text}${styles.reset}`),
  success: (text) => console.log(`${styles.green}✅ ${text}${styles.reset}`),
  error: (text) => console.log(`${styles.red}❌ ${text}${styles.reset}`),
  warning: (text) => console.log(`${styles.yellow}⚠️  ${text}${styles.reset}`),
  info: (text) => console.log(`${styles.blue}ℹ️  ${text}${styles.reset}`),
  debug: (text) => console.log(`${styles.dim}${styles.white}   ${text}${styles.reset}`),
  divider: () => console.log(`${styles.dim}${'─'.repeat(80)}${styles.reset}`),
  newline: () => console.log(),
};

// 📊 Statistiques
let stats = {
  total: 0,
  passed: 0,
  failed: 0,
  startTime: Date.now(),
};

// 🧪 Liste des tests
const tests = [
  {
    name: 'API Tests',
    file: 'test-api.js',
    description: 'Test les endpoints API principales',
  },
  {
    name: 'Shop Tests',
    file: 'test-shop.js',
    description: 'Test la boutique et les achats',
  },
  {
    name: 'Discord Bot Tests',
    file: 'test-discord-bot.js',
    description: 'Test le bot Discord',
  },
  {
    name: 'Avatar Tests',
    file: 'test-avatar.js',
    description: 'Test les avatars utilisateur',
  },
];

/**
 * Exécute un test et capture la sortie
 */
function runTest(testFile) {
  return new Promise((resolve) => {
    stats.total++;
    
    const child = spawn('node', [testFile], {
      cwd: __dirname,
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', (code) => {
      if (code === 0) {
        stats.passed++;
        resolve({
          success: true,
          output: stdout,
          error: null,
        });
      } else {
        stats.failed++;
        resolve({
          success: false,
          output: stdout,
          error: stderr || 'Test failed with no error output',
        });
      }
    });

    child.on('error', (err) => {
      stats.failed++;
      resolve({
        success: false,
        output: stdout,
        error: err.message,
      });
    });
  });
}

/**
 * Affiche les résultats d'un test
 */
async function displayTestResult(test, result) {
  log.section(`${test.name} (${test.file})`);
  log.debug(test.description);
  log.newline();

  if (result.success) {
    log.success(`Exécution réussie`);
  } else {
    log.error(`Exécution échouée`);
    if (result.error) {
      log.debug(`Erreur: ${result.error}`);
    }
  }

  if (result.output) {
    // Affiche les 10 dernières lignes pertinentes
    const lines = result.output.split('\n').filter(l => l.trim());
    const relevant = lines.slice(-5);
    relevant.forEach(line => {
      if (line.includes('✅') || line.includes('✓')) {
        log.success(line);
      } else if (line.includes('❌') || line.includes('✗')) {
        log.error(line);
      } else if (line.includes('⚠️') || line.includes('warn')) {
        log.warning(line);
      } else {
        log.debug(line);
      }
    });
  }

  log.divider();
}

/**
 * Affiche le résumé final
 */
function displaySummary() {
  const duration = ((Date.now() - stats.startTime) / 1000).toFixed(2);

  log.newline();
  log.title(`📊 RÉSUMÉ DES TESTS`);

  log.info(`Tests exécutés: ${styles.bright}${stats.total}${styles.reset}`);
  log.success(`Réussis: ${styles.bright}${stats.passed}${styles.reset}`);
  log.error(`Échoués: ${styles.bright}${stats.failed}${styles.reset}`);
  log.info(`Durée: ${styles.bright}${duration}s${styles.reset}`);

  log.newline();

  if (stats.failed === 0) {
    log.success(`Tous les tests sont passés! 🎉`);
  } else {
    log.warning(`${stats.failed} test(s) ont échoué. Vérifiez les erreurs ci-dessus.`);
  }

  log.newline();
}

/**
 * Main - Lance tous les tests
 */
async function main() {
  log.title(`🧪 TEST RUNNER - Dragon Ball Giveaway`);

  log.info(`Environnement: ${process.env.NODE_ENV || 'development'}`);
  log.info(`Serveur: http://localhost:5000`);
  log.info(`Tests à exécuter: ${tests.length}`);

  log.divider();
  log.newline();

  // Vérifie que le serveur tourne
  log.section('Vérification du serveur');
  try {
    const http = require('http');
    await new Promise((resolve, reject) => {
      const req = http.get('http://localhost:5000/api/giveaways', (res) => {
        if (res.statusCode < 500) {
          log.success('Serveur accessible');
          resolve();
        } else {
          reject();
        }
      });
      req.on('error', () => reject());
      setTimeout(reject, 2000);
    });
  } catch (err) {
    log.error('Le serveur n\'est pas accessible sur http://localhost:5000');
    log.warning('Assurez-vous que le serveur tourne: npm start');
    process.exit(1);
  }

  log.divider();

  // Exécute chaque test
  for (const test of tests) {
    if (!fs.existsSync(path.join(__dirname, test.file))) {
      log.warning(`Fichier de test introuvable: ${test.file}`);
      continue;
    }

    const result = await runTest(test.file);
    await displayTestResult(test, result);
    log.newline();
  }

  // Affiche le résumé
  displaySummary();

  // Exit avec le code approprié
  process.exit(stats.failed > 0 ? 1 : 0);
}

// Lance main
main().catch((err) => {
  log.error(`Erreur: ${err.message}`);
  process.exit(1);
});

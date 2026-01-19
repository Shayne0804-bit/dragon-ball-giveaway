#!/usr/bin/env node

/**
 * verify-shop-feature.js
 * Vérifie que la feature Shop est correctement intégrée
 */

const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

let passed = 0;
let failed = 0;

function check(name, condition, message = '') {
  if (condition) {
    console.log(`${colors.green}✓${colors.reset} ${name}`);
    passed++;
  } else {
    console.log(`${colors.red}✗${colors.reset} ${name}`);
    if (message) console.log(`  ${colors.yellow}→ ${message}${colors.reset}`);
    failed++;
  }
}

function fileExists(filePath, relativePath) {
  const exists = fs.existsSync(filePath);
  check(`Fichier: ${relativePath}`, exists, exists ? '' : `Fichier non trouvé: ${filePath}`);
  return exists;
}

function fileContains(filePath, searchString, description) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const contains = content.includes(searchString);
    check(description, contains, contains ? '' : `"${searchString}" non trouvé`);
    return contains;
  } catch (error) {
    check(description, false, `Erreur lecture: ${error.message}`);
    return false;
  }
}

console.log(`${colors.cyan}╔════════════════════════════════════════╗${colors.reset}`);
console.log(`${colors.cyan}║   VÉRIFICATION FEATURE SHOP (Achat)    ║${colors.reset}`);
console.log(`${colors.cyan}╚════════════════════════════════════════╝${colors.reset}\n`);

console.log(`${colors.blue}=== BACKEND ===${colors.reset}`);
fileExists(path.join(__dirname, 'server/models/ShopItem.js'), 'server/models/ShopItem.js');
fileExists(path.join(__dirname, 'server/controllers/shopController.js'), 'server/controllers/shopController.js');
fileExists(path.join(__dirname, 'server/routes/shop.js'), 'server/routes/shop.js');
fileContains(
  path.join(__dirname, 'server/server.js'),
  "require('./routes/shop')",
  'Import de shop.js dans server.js'
);
fileContains(
  path.join(__dirname, 'server/server.js'),
  "app.use('/api/shop'",
  'Route /api/shop enregistrée'
);

console.log(`\n${colors.blue}=== FRONTEND ===${colors.reset}`);
fileExists(path.join(__dirname, 'client/shop.html'), 'client/shop.html');
fileExists(path.join(__dirname, 'client/shop.css'), 'client/shop.css');
fileExists(path.join(__dirname, 'client/shop.js'), 'client/shop.js');
fileContains(
  path.join(__dirname, 'client/index.html'),
  '/shop.html',
  'Lien vers shop.html dans index.html'
);
fileContains(
  path.join(__dirname, 'client/style.css'),
  '.btn-shop',
  'Style .btn-shop dans style.css'
);

console.log(`\n${colors.blue}=== DOCUMENTATION ===${colors.reset}`);
fileExists(path.join(__dirname, 'SHOP_FEATURE.md'), 'SHOP_FEATURE.md');
fileExists(path.join(__dirname, 'SHOP_INTEGRATION_GUIDE.md'), 'SHOP_INTEGRATION_GUIDE.md');
fileExists(path.join(__dirname, 'test-shop.js'), 'test-shop.js');

console.log(`\n${colors.cyan}=== VÉRIFICATION CONTENU ===${colors.reset}`);

// Vérifier la structure du modèle
fileContains(
  path.join(__dirname, 'server/models/ShopItem.js'),
  'shopItemSchema',
  'Schéma ShopItem défini'
);
fileContains(
  path.join(__dirname, 'server/models/ShopItem.js'),
  'name:',
  'Champ "name" défini'
);
fileContains(
  path.join(__dirname, 'server/models/ShopItem.js'),
  'price:',
  'Champ "price" défini'
);
fileContains(
  path.join(__dirname, 'server/models/ShopItem.js'),
  'image:',
  'Champ "image" défini'
);

// Vérifier le contrôleur
fileContains(
  path.join(__dirname, 'server/controllers/shopController.js'),
  'createShopItem',
  'Fonction createShopItem'
);
fileContains(
  path.join(__dirname, 'server/controllers/shopController.js'),
  'updateShopItem',
  'Fonction updateShopItem'
);
fileContains(
  path.join(__dirname, 'server/controllers/shopController.js'),
  'deleteShopItem',
  'Fonction deleteShopItem'
);

// Vérifier les routes
fileContains(
  path.join(__dirname, 'server/routes/shop.js'),
  "router.get('/items'",
  'Route GET /items'
);
fileContains(
  path.join(__dirname, 'server/routes/shop.js'),
  "router.post('/items'",
  'Route POST /items'
);
fileContains(
  path.join(__dirname, 'server/routes/shop.js'),
  "router.delete('/items'",
  'Route DELETE /items'
);

// Vérifier le HTML
fileContains(
  path.join(__dirname, 'client/shop.html'),
  'shopItemsGrid',
  'Élément shopItemsGrid dans HTML'
);
fileContains(
  path.join(__dirname, 'client/shop.html'),
  'adminShopSection',
  'Section admin dans HTML'
);
fileContains(
  path.join(__dirname, 'client/shop.html'),
  'addEditItemModal',
  'Modal d\'ajout/édition dans HTML'
);

// Vérifier le JavaScript
fileContains(
  path.join(__dirname, 'client/shop.js'),
  'loadShopItems',
  'Fonction loadShopItems'
);
fileContains(
  path.join(__dirname, 'client/shop.js'),
  'loginAsAdmin',
  'Fonction loginAsAdmin'
);
fileContains(
  path.join(__dirname, 'client/shop.js'),
  'submitItem',
  'Fonction submitItem'
);

console.log(`\n${colors.cyan}╔════════════════════════════════════════╗${colors.reset}`);
console.log(`${colors.cyan}║            RÉSUMÉ VÉRIFICATION         ║${colors.reset}`);
console.log(`${colors.cyan}╚════════════════════════════════════════╝${colors.reset}\n`);

console.log(`${colors.green}✓ Réussis: ${passed}${colors.reset}`);
if (failed > 0) {
  console.log(`${colors.red}✗ Échoués: ${failed}${colors.reset}`);
} else {
  console.log(`${colors.green}✓ Tous les fichiers sont en place!${colors.reset}`);
}

console.log(`\n${colors.cyan}=== PROCHAINES ÉTAPES ===${colors.reset}`);
console.log(`1. Vérifier que le serveur démarre correctement:`);
console.log(`   ${colors.yellow}npm start${colors.reset}`);
console.log(`\n2. Tester les APIs:`);
console.log(`   ${colors.yellow}node test-shop.js${colors.reset}`);
console.log(`\n3. Accéder à la page shop:`);
console.log(`   ${colors.yellow}http://localhost:5000/shop.html${colors.reset}`);
console.log(`\n4. Consulter la documentation:`);
console.log(`   ${colors.yellow}cat SHOP_FEATURE.md${colors.reset}`);
console.log(`   ${colors.yellow}cat SHOP_INTEGRATION_GUIDE.md${colors.reset}`);

process.exit(failed > 0 ? 1 : 0);

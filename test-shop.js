#!/usr/bin/env node

/**
 * test-shop.js
 * Script de test pour la fonctionnalité Shop (Achat/Divers)
 * Usage: node test-shop.js
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const API_URL = 'http://localhost:5000/api/shop';
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'your-admin-token-here';

// Couleurs pour le terminal
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

// Utilitaire pour faire des requêtes
function makeRequest(method, path, data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(API_URL);
    url.pathname = `/api/shop${path}`;

    const options = {
      hostname: url.hostname,
      port: url.port || 5000,
      path: url.pathname,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          resolve({ status: res.statusCode, data: response });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

// Tests
async function runTests() {
  console.log(`${colors.cyan}=== Tests Shop API ===${colors.reset}\n`);

  let allPassed = 0;
  let allFailed = 0;

  // Test 1: GET /items (vide au départ)
  console.log(`${colors.blue}[1] GET /api/shop/items${colors.reset}`);
  try {
    const res = await makeRequest('GET', '/items');
    console.log(`${colors.green}✓ Status: ${res.status}${colors.reset}`);
    console.log(`  Réponse: ${JSON.stringify(res.data, null, 2)}`);
    allPassed++;
  } catch (error) {
    console.log(`${colors.red}✗ Erreur: ${error.message}${colors.reset}`);
    allFailed++;
  }
  console.log();

  // Test 2: POST /items (Créer un article)
  console.log(`${colors.blue}[2] POST /api/shop/items (Créer)${colors.reset}`);
  const testItem = {
    name: 'Figurine Goku',
    description: 'Figurine collector de Goku en édition limitée',
    price: 29.99,
    image: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD...',
    category: 'Figurines',
    quantity: 10,
  };

  let createdItemId = null;
  try {
    const res = await makeRequest('POST', '/items', testItem, {
      'Authorization': `Bearer ${ADMIN_TOKEN}`,
    });
    console.log(`${colors.green}✓ Status: ${res.status}${colors.reset}`);
    if (res.data.data && res.data.data._id) {
      createdItemId = res.data.data._id;
      console.log(`${colors.green}✓ Article créé avec l'ID: ${createdItemId}${colors.reset}`);
    }
    console.log(`  Message: ${res.data.message}`);
    allPassed++;
  } catch (error) {
    console.log(`${colors.red}✗ Erreur: ${error.message}${colors.reset}`);
    allFailed++;
  }
  console.log();

  // Test 3: GET /items (voir tous les articles)
  console.log(`${colors.blue}[3] GET /api/shop/items (Récupérer tous)${colors.reset}`);
  try {
    const res = await makeRequest('GET', '/items');
    console.log(`${colors.green}✓ Status: ${res.status}${colors.reset}`);
    console.log(`  Nombre d'articles: ${res.data.count}`);
    allPassed++;
  } catch (error) {
    console.log(`${colors.red}✗ Erreur: ${error.message}${colors.reset}`);
    allFailed++;
  }
  console.log();

  // Test 4: GET /items/:id (voir un article spécifique)
  if (createdItemId) {
    console.log(`${colors.blue}[4] GET /api/shop/items/:id${colors.reset}`);
    try {
      const res = await makeRequest('GET', `/items/${createdItemId}`);
      console.log(`${colors.green}✓ Status: ${res.status}${colors.reset}`);
      console.log(`  Nom: ${res.data.data.name}`);
      console.log(`  Prix: ${res.data.data.price}€`);
      allPassed++;
    } catch (error) {
      console.log(`${colors.red}✗ Erreur: ${error.message}${colors.reset}`);
      allFailed++;
    }
    console.log();
  }

  // Test 5: PUT /items/:id (Modifier)
  if (createdItemId) {
    console.log(`${colors.blue}[5] PUT /api/shop/items/:id (Modifier)${colors.reset}`);
    const updateData = {
      name: 'Figurine Goku Ultra Instinct',
      price: 39.99,
    };

    try {
      const res = await makeRequest('PUT', `/items/${createdItemId}`, updateData, {
        'Authorization': `Bearer ${ADMIN_TOKEN}`,
      });
      console.log(`${colors.green}✓ Status: ${res.status}${colors.reset}`);
      console.log(`  Message: ${res.data.message}`);
      allPassed++;
    } catch (error) {
      console.log(`${colors.red}✗ Erreur: ${error.message}${colors.reset}`);
      allFailed++;
    }
    console.log();
  }

  // Test 6: GET /items/category/:category
  console.log(`${colors.blue}[6] GET /api/shop/items/category/Figurines${colors.reset}`);
  try {
    const res = await makeRequest('GET', '/items/category/Figurines');
    console.log(`${colors.green}✓ Status: ${res.status}${colors.reset}`);
    console.log(`  Nombre d'articles: ${res.data.count}`);
    allPassed++;
  } catch (error) {
    console.log(`${colors.red}✗ Erreur: ${error.message}${colors.reset}`);
    allFailed++;
  }
  console.log();

  // Test 7: DELETE /items/:id (Supprimer)
  if (createdItemId) {
    console.log(`${colors.blue}[7] DELETE /api/shop/items/:id${colors.reset}`);
    try {
      const res = await makeRequest('DELETE', `/items/${createdItemId}`, null, {
        'Authorization': `Bearer ${ADMIN_TOKEN}`,
      });
      console.log(`${colors.green}✓ Status: ${res.status}${colors.reset}`);
      console.log(`  Message: ${res.data.message}`);
      allPassed++;
    } catch (error) {
      console.log(`${colors.red}✗ Erreur: ${error.message}${colors.reset}`);
      allFailed++;
    }
    console.log();
  }

  // Résumé
  console.log(`${colors.cyan}=== Résumé ===${colors.reset}`);
  console.log(`${colors.green}✓ Réussis: ${allPassed}${colors.reset}`);
  if (allFailed > 0) {
    console.log(`${colors.red}✗ Échoués: ${allFailed}${colors.reset}`);
  }
  console.log(`\n${colors.cyan}Note: Pour que les tests fonctionnent correctement, le serveur doit être en cours d'exécution sur le port 5000.${colors.reset}`);
}

// Lancer les tests
runTests().catch(console.error);

#!/usr/bin/env node

const http = require('http');

// Configuration
const API_URL = 'http://localhost:5001/api';

// Token admin (à adapter selon votre système)
const adminToken = 'test-admin-token';

async function testDeleteItem() {
  console.log('🧪 Test suppression d\'article\n');
  
  try {
    // 1. D'abord, créer un article pour le supprimer
    console.log('1️⃣  Création d\'un article de test...');
    const createResponse = await fetch(`${API_URL}/items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        name: 'Test Delete Item ' + Date.now(),
        description: 'Article de test pour suppression',
        price: 9.99,
        category: 'Test',
        image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
      })
    });
    
    const createData = await createResponse.json();
    console.log('✅ Réponse création:', createData);
    
    if (!createData.success || !createData.data || !createData.data._id) {
      console.log('❌ Erreur: Impossible de créer l\'article');
      console.log('Réponse complète:', createData);
      return;
    }
    
    const itemId = createData.data._id;
    console.log(`✅ Article créé avec ID: ${itemId}\n`);
    
    // 2. Supprimer l'article
    console.log('2️⃣  Suppression de l\'article...');
    const deleteResponse = await fetch(`${API_URL}/items/${itemId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    const deleteData = await deleteResponse.json();
    console.log('✅ Réponse suppression:', deleteData);
    
    if (deleteData.success) {
      console.log('✅ Article supprimé avec succès!\n');
    } else {
      console.log('❌ Erreur lors de la suppression:', deleteData.message);
    }
    
    // 3. Vérifier que l'article est bien supprimé
    console.log('3️⃣  Vérification que l\'article est supprimé...');
    const getResponse = await fetch(`${API_URL}/items/${itemId}`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });
    
    const getData = await getResponse.json();
    if (!getData.data) {
      console.log('✅ Article bien supprimé (404)\n');
    } else {
      console.log('⚠️  Article toujours présent:', getData.data);
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

// Run test
testDeleteItem();

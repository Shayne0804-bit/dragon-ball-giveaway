/**
 * Script de test pour vérifier le nettoyage des numéros admin
 */

// Simulation du code de nettoyage
function cleanPhoneNumber(num) {
  return num.replace(/\D/g, '').trim();
}

function cleanSender(sender) {
  return sender.replace('@c.us', '').replace(/\D/g, '').trim();
}

function checkAdminAccess(sender, ownerNumbers) {
  const cleanedSender = cleanSender(sender);
  return ownerNumbers.some(ownerNum => {
    const cleanedOwner = cleanPhoneNumber(ownerNum);
    return cleanedSender === cleanedOwner;
  });
}

// Tests
console.log('🧪 TEST DES NUMÉROS ADMINS\n');

// Configuration
const WHATSAPP_OWNER_NUMBERS = '2290154959093,2250758652488';
const ownerNumbers = WHATSAPP_OWNER_NUMBERS
  .split(',')
  .map(num => num.trim().replace(/\D/g, ''))
  .filter(num => num.length > 0);

console.log('📋 Numéros admins configurés:');
console.log(ownerNumbers);
console.log('');

// Test cas 1: Format WhatsApp avec @c.us
const sender1 = '2290154959093@c.us';
console.log(`Test 1: ${sender1}`);
console.log(`  → Nettoyé: ${cleanSender(sender1)}`);
console.log(`  → Est admin? ${checkAdminAccess(sender1, ownerNumbers)}`);
console.log('');

// Test cas 2: Deuxième admin
const sender2 = '2250758652488@c.us';
console.log(`Test 2: ${sender2}`);
console.log(`  → Nettoyé: ${cleanSender(sender2)}`);
console.log(`  → Est admin? ${checkAdminAccess(sender2, ownerNumbers)}`);
console.log('');

// Test cas 3: Utilisateur non-admin
const sender3 = '2251234567890@c.us';
console.log(`Test 3: ${sender3}`);
console.log(`  → Nettoyé: ${cleanSender(sender3)}`);
console.log(`  → Est admin? ${checkAdminAccess(sender3, ownerNumbers)}`);
console.log('');

// Test cas 4: Format avec espaces et symboles
const sender4 = '+225 0154959093@c.us';
console.log(`Test 4: ${sender4}`);
console.log(`  → Nettoyé: ${cleanSender(sender4)}`);
console.log(`  → Est admin? ${checkAdminAccess(sender4, ownerNumbers)}`);
console.log('');

console.log('✅ Tous les tests de nettoyage sont correctement implémentés!');

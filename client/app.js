// ===========================
// CONFIGURATION
// ===========================
const API_URL = '/api/participants';
const ROULETTE_API = '/api/participants/roulette';
const ADMIN_LOGIN_API = '/api/participants/admin/login';
const WINNERS_API = '/api/participants/winners';
const RESET_API = '/api/participants/reset';

let participants = [];
let isSpinning = false;
let wheelRotation = 0;
let adminToken = null; // Token stocké en session

// ===========================
// UTILITAIRES
// ===========================

/**
 * Afficher un message à l'utilisateur
 */
function showMessage(message, type = 'info') {
  const messageBox = document.getElementById('messageBox');
  messageBox.textContent = message;
  messageBox.className = `message-box ${type}`;

  // Auto-masquer après 5 secondes
  if (type !== 'error') {
    setTimeout(() => {
      messageBox.className = 'message-box';
      messageBox.textContent = '';
    }, 5000);
  }
}

/**
 * Afficher un message dans la modal admin
 */
function showAdminMessage(message, type = 'info') {
  const messageBox = document.getElementById('adminMessage');
  messageBox.textContent = message;
  messageBox.className = `message-box ${type}`;

  if (type !== 'error') {
    setTimeout(() => {
      messageBox.className = 'message-box';
      messageBox.textContent = '';
    }, 5000);
  }
}

/**
 * Afficher/masquer le spinner de chargement
 */
function setLoading(isLoading) {
  const spinner = document.getElementById('loadingSpinner');
  if (isLoading) {
    spinner.classList.remove('hidden');
  } else {
    spinner.classList.add('hidden');
  }
}

/**
 * Valider le nom côté frontend
 */
function validateName(name) {
  const trimmed = name.trim();

  if (!trimmed) {
    return { valid: false, message: 'Le nom ne peut pas être vide' };
  }

  if (trimmed.length < 2) {
    return { valid: false, message: 'Le nom doit contenir au minimum 2 caractères' };
  }

  if (trimmed.length > 20) {
    return { valid: false, message: 'Le nom doit contenir au maximum 20 caractères' };
  }

  if (!/^[a-zA-Z0-9\s]+$/.test(trimmed)) {
    return {
      valid: false,
      message: 'Le nom ne peut contenir que des lettres, chiffres et espaces',
    };
  }

  return { valid: true };
}

// ===========================
// FORMULAIRE DE PARTICIPATION
// ===========================

/**
 * Soumettre le formulaire de participation
 */
document.getElementById('participantForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const nameInput = document.getElementById('nameInput');
  const name = nameInput.value;

  // Validation frontend
  const validation = validateName(name);
  if (!validation.valid) {
    showMessage(validation.message, 'error');
    return;
  }

  try {
    setLoading(true);

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: name.trim() }),
    });

    const data = await response.json();

    if (!response.ok) {
      showMessage(data.message || 'Erreur lors de l\'enregistrement', 'error');
      
      // Si c'est une limite de 24h, afficher le countdown
      if (response.status === 429 && data.nextAllowedAt) {
        const nextTime = new Date(data.nextAllowedAt);
        startCountdown(nextTime);
        document.getElementById('participantForm').style.opacity = '0.6';
        document.querySelector('.btn-primary').disabled = true;
      }
      
      setLoading(false);
      return;
    }

    showMessage('⚡ COMBATTANT ENREGISTRÉ! Revenez dans 24h pour reparticiper! ⚡', 'success');
    nameInput.value = '';
    
    // Désactiver le formulaire pendant 24h
    document.getElementById('participantForm').style.opacity = '0.6';
    document.querySelector('.btn-primary').disabled = true;
    
    if (data.data && data.data.nextAllowedAt) {
      const nextTime = new Date(data.data.nextAllowedAt);
      startCountdown(nextTime);
    }
    
    createEnergyParticles(15);
    
    if (data.data && data.data.nextAllowedAt) {
      const nextTime = new Date(data.data.nextAllowedAt);
      startCountdown(nextTime);
    }
    
    createEnergyParticles(15);

    // Actualiser les données
    await fetchParticipants();
    await updateStats();
  } catch (error) {
    console.error('Erreur:', error);
    showMessage('Erreur de connexion', 'error');
  } finally {
    setLoading(false);
  }
});

// ===========================
// RÉCUPÉRER LES DONNÉES
// ===========================

/**
 * Récupérer la liste des participants
 */
async function fetchParticipants() {
  try {
    const response = await fetch(API_URL);
    const data = await response.json();

    if (data.success) {
      participants = data.data;
      displayParticipants();
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des participants:', error);
  }
}

/**
 * Afficher les participants
 */
function displayParticipants() {
  const list = document.getElementById('participantsList');

  if (participants.length === 0) {
    list.innerHTML = '<p class="empty-message">Aucun participant pour le moment...</p>';
    return;
  }

  list.innerHTML = participants
    .map(
      (participant) => `
    <div class="participant-card new">
      👤 ${participant.name}
    </div>
  `
    )
    .join('');
}

/**
 * Récupérer l'historique des gagnants
 */
async function fetchWinners() {
  try {
    const response = await fetch(WINNERS_API);
    const data = await response.json();

    if (data.success) {
      displayWinners(data.data);
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des gagnants:', error);
  }
}

/**
 * Afficher l'historique des gagnants
 */
function displayWinners(winners) {
  const list = document.getElementById('winnersList');

  if (!winners || winners.length === 0) {
    list.innerHTML = '<p class="empty-message">Aucun gagnant pour le moment...</p>';
    return;
  }

  list.innerHTML = winners
    .map(
      (winner) => `
    <div class="winner-card">
      🏆 ${winner.name}
    </div>
  `
    )
    .join('');
}

/**
 * Mettre à jour les statistiques
 */
async function updateStats() {
  await fetchParticipants();
  await fetchWinners();

  const count = participants.length;
  document.getElementById('participantCount').textContent = count;

  // Recréer la roulette
  if (count > 0) {
    drawWheel();
  }
}

// ===========================
// ROULETTE ET CANVAS
// ===========================

const canvas = document.getElementById('wheelCanvas');
const ctx = canvas.getContext('2d');

/**
 * Dessiner la roulette (canvas)
 */
function drawWheel() {
  const radius = canvas.width / 2;
  const centerX = radius;
  const centerY = radius;

  // Effacer le canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (participants.length === 0) {
    ctx.fillStyle = '#666';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Aucun participant', centerX, centerY);
    return;
  }

  const sliceAngle = (Math.PI * 2) / participants.length;
  const colors = [
    '#ff6b6b',
    '#4ecdc4',
    '#51cf66',
    '#ffd93d',
    '#ff8c42',
    '#6c5ce7',
    '#a29bfe',
    '#fd79a8',
    '#00b894',
    '#fdcb6e',
  ];

  // Dessiner les parts de la roulette
  participants.forEach((participant, index) => {
    const startAngle = sliceAngle * index + wheelRotation;
    const endAngle = startAngle + sliceAngle;

    // Dessiner le segment
    ctx.fillStyle = colors[index % colors.length];
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, radius - 5, startAngle, endAngle);
    ctx.closePath();
    ctx.fill();

    // Dessiner la bordure
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Dessiner le texte (nom)
    const textAngle = startAngle + sliceAngle / 2;
    const textRadius = radius * 0.7;
    const textX = centerX + Math.cos(textAngle) * textRadius;
    const textY = centerY + Math.sin(textAngle) * textRadius;

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 11px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Rotation du texte
    ctx.save();
    ctx.translate(textX, textY);
    ctx.rotate(textAngle + Math.PI / 2);
    ctx.fillText(participant.name.substring(0, 8), 0, 0);
    ctx.restore();
  });

  // Dessiner le cercle central
  ctx.fillStyle = '#1a1a1a';
  ctx.beginPath();
  ctx.arc(centerX, centerY, 25, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#ff6b6b';
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.fillStyle = '#fff';
  ctx.font = 'bold 14px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('START', centerX, centerY);
}

/**
 * Lancer la roulette (animation + tirage serveur)
 */
document.getElementById('spinButton').addEventListener('click', async () => {
  // Vérifier si l'utilisateur est authentifié en tant qu'admin
  if (!adminToken) {
    showAdminModal();
    return;
  }

  if (isSpinning || participants.length === 0) {
    if (participants.length === 0) {
      showMessage('Aucun participant pour lancer la roulette', 'error');
    }
    return;
  }

  isSpinning = true;
  document.getElementById('spinButton').disabled = true;
  document.getElementById('winnerDisplay').classList.add('hidden');

  try {
    setLoading(true);

    // Animation de la roulette
    const spinDuration = 3000; // 3 secondes
    const spinAmount = Math.random() * 10 + 5; // 5 à 15 tours
    const startTime = Date.now();
    const startRotation = wheelRotation;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / spinDuration, 1);

      // Easing: ease-out
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      wheelRotation = startRotation + spinAmount * Math.PI * 2 * easeProgress;

      drawWheel();

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        // Appeler l'API pour tirer un gagnant
        drawWinnerAPI();
      }
    };

    animate();
  } catch (error) {
    console.error('Erreur:', error);
    showMessage('Erreur lors du tirage', 'error');
    isSpinning = false;
    document.getElementById('spinButton').disabled = false;
  }
});

/**
 * Tirer un gagnant (appel API sécurisé avec token admin)
 */
async function drawWinnerAPI() {
  try {
    const response = await fetch(ROULETTE_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`,
      },
    });

    const data = await response.json();

    if (response.status === 401) {
      // Token expiré ou invalide
      adminToken = null;
      showMessage('Authentification expirée. Veuillez vous reconnecter.', 'error');
      return;
    }

    if (data.success) {
      displayWinner(data.data.name);
      await fetchWinners();
    } else {
      showMessage(data.message || 'Erreur lors du tirage', 'error');
    }
  } catch (error) {
    console.error('Erreur:', error);
    showMessage('Erreur de connexion', 'error');
  } finally {
    isSpinning = false;
    document.getElementById('spinButton').disabled = false;
    setLoading(false);
  }
}

/**
 * Afficher le gagnant
 */
function displayWinner(name) {
  document.getElementById('winnerName').textContent = name;
  document.getElementById('winnerDisplay').classList.remove('hidden');

  // Confettis (optionnel)
  playConfetti();
}

/**
 * Animation de confettis (simple)
 */
function playConfetti() {
  for (let i = 0; i < 50; i++) {
    const confetti = document.createElement('div');
    confetti.style.position = 'fixed';
    confetti.style.width = '10px';
    confetti.style.height = '10px';
    confetti.style.backgroundColor = ['#ff6b6b', '#4ecdc4', '#51cf66', '#ffd93d'][
      Math.floor(Math.random() * 4)
    ];
    confetti.style.left = Math.random() * window.innerWidth + 'px';
    confetti.style.top = '-10px';
    confetti.style.zIndex = '50';
    confetti.style.borderRadius = '50%';
    confetti.style.pointerEvents = 'none';

    document.body.appendChild(confetti);

    let top = -10;
    let left = parseFloat(confetti.style.left);
    let angle = Math.random() * Math.PI * 2;

    const interval = setInterval(() => {
      top += Math.random() * 3 + 2;
      left += Math.sin(angle) * 2;

      confetti.style.top = top + 'px';
      confetti.style.left = left + 'px';
      confetti.style.opacity = 1 - (top / window.innerHeight) * 1.5;

      if (top > window.innerHeight) {
        clearInterval(interval);
        confetti.remove();
      }
    }, 20);
  }
}

/**
 * Bouton de réinitialisation
 */
document.getElementById('resetButton').addEventListener('click', async () => {
  if (confirm('Êtes-vous sûr de vouloir réinitialiser la liste des participants?')) {
    try {
      setLoading(true);

      const response = await fetch(RESET_API, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
        },
      });

      const data = await response.json();

      if (response.status === 401) {
        adminToken = null;
        showMessage('Authentification expirée.', 'error');
        return;
      }

      if (data.success) {
        showMessage('Liste réinitialisée', 'success');
        await updateStats();
        document.getElementById('winnerDisplay').classList.add('hidden');
      }
    } catch (error) {
      console.error('Erreur:', error);
      showMessage('Erreur lors de la réinitialisation', 'error');
    } finally {
      setLoading(false);
    }
  }
});

// ===========================
// MODAL D'AUTHENTIFICATION ADMIN
// ===========================

/**
 * Afficher la modal de connexion admin
 */
function showAdminModal() {
  const modal = document.getElementById('adminModal');
  const passwordInput = document.getElementById('adminPassword');
  modal.classList.remove('hidden');
  passwordInput.value = '';
  passwordInput.focus();
}

/**
 * Masquer la modal de connexion admin
 */
function closeAdminModal() {
  const modal = document.getElementById('adminModal');
  modal.classList.add('hidden');
  document.getElementById('adminPassword').value = '';
  document.getElementById('adminMessage').className = 'message-box';
  document.getElementById('adminMessage').textContent = '';
}

/**
 * Se connecter en tant qu'admin
 */
document.getElementById('adminLoginBtn').addEventListener('click', async () => {
  const password = document.getElementById('adminPassword').value;

  if (!password) {
    showAdminMessage('Veuillez entrer un mot de passe', 'error');
    return;
  }

  try {
    setLoading(true);

    const response = await fetch(ADMIN_LOGIN_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ password }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      showAdminMessage(data.message || 'Erreur d\'authentification', 'error');
      return;
    }

    // Stocker le token
    adminToken = data.token;
    showAdminMessage('✅ Connecté en tant qu\'admin!', 'success');

    // Fermer la modal après 1 seconde
    setTimeout(() => {
      closeAdminModal();
      // Relancer le spin
      isSpinning = false;
      document.getElementById('spinButton').click();
    }, 1000);
  } catch (error) {
    console.error('Erreur:', error);
    showAdminMessage('Erreur de connexion', 'error');
  } finally {
    setLoading(false);
  }
});

/**
 * Annuler la connexion admin
 */
document.getElementById('adminCancelBtn').addEventListener('click', () => {
  closeAdminModal();
});

/**
 * Permettre l'entrée avec Entrée
 */
document.getElementById('adminPassword').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    document.getElementById('adminLoginBtn').click();
  }
});

// ===========================
// INITIALISATION
// ===========================

/**
 * Initialiser l'application au chargement
 */
async function init() {
  try {
    setLoading(true);
    await updateStats();
    drawWheel();
  } catch (error) {
    console.error('Erreur lors de l\'initialisation:', error);
  } finally {
    setLoading(false);
  }
}

// Démarrer l'application
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// Auto-actualiser toutes les 5 secondes
setInterval(async () => {
  if (!isSpinning) {
    await updateStats();
  }
}, 5000);

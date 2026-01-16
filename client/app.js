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
let giveawayPhotos = []; // Photos du giveaway stockées sur le serveur
let currentGalleryIndex = 0; // Index actuel de la galerie

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

/**
 * Démarrer le compte à rebours pour la prochaine participation
 */
function startCountdown(nextAllowedTime) {
  const countdownElement = document.getElementById('countdownTimer');
  if (!countdownElement) {
    // Créer l'élément s'il n'existe pas
    const newElement = document.createElement('div');
    newElement.id = 'countdownTimer';
    newElement.style.marginTop = '1rem';
    newElement.style.textAlign = 'center';
    newElement.style.fontSize = '0.9rem';
    newElement.style.color = '#ff6600';
    document.getElementById('participantForm').parentElement.appendChild(newElement);
  }

  const updateTimer = () => {
    const now = new Date();
    const timeLeft = nextAllowedTime - now;

    if (timeLeft <= 0) {
      document.getElementById('countdownTimer').textContent = 'Vous pouvez participer à nouveau!';
      document.getElementById('participantForm').style.opacity = '1';
      document.querySelector('.btn-primary').disabled = false;
      clearInterval(timerInterval);
      return;
    }

    const hours = Math.floor(timeLeft / (1000 * 60 * 60));
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

    document.getElementById('countdownTimer').textContent =
      `⏱️ Prochaine participation dans: ${hours}h ${minutes}m ${seconds}s`;
  };

  updateTimer();
  const timerInterval = setInterval(updateTimer, 1000);
}

/**
 * Créer des particules d'énergie animées
 */
function createEnergyParticles(count = 10) {
  const container = document.body;

  for (let i = 0; i < count; i++) {
    const particle = document.createElement('div');
    particle.style.position = 'fixed';
    particle.style.width = '8px';
    particle.style.height = '8px';
    particle.style.borderRadius = '50%';
    particle.style.backgroundColor = `hsl(${Math.random() * 60 + 20}, 100%, 50%)`;
    particle.style.pointerEvents = 'none';
    particle.style.zIndex = '9999';
    particle.style.left = Math.random() * window.innerWidth + 'px';
    particle.style.top = Math.random() * window.innerHeight + 'px';
    particle.style.opacity = '1';
    particle.style.boxShadow = '0 0 10px currentColor';

    container.appendChild(particle);

    const angle = (Math.PI * 2 * i) / count;
    const velocity = {
      x: Math.cos(angle) * (3 + Math.random() * 2),
      y: Math.sin(angle) * (3 + Math.random() * 2),
    };

    let opacity = 1;
    const interval = setInterval(() => {
      particle.style.left = parseFloat(particle.style.left) + velocity.x + 'px';
      particle.style.top = parseFloat(particle.style.top) + velocity.y + 'px';
      opacity -= 0.05;
      particle.style.opacity = opacity;

      if (opacity <= 0) {
        clearInterval(interval);
        particle.remove();
      }
    }, 30);
  }
}

let participationTimerInterval = null;

/**
 * Afficher le modal de participation avec message et countdown
 */
function showParticipationModal(isSuccess, message, nextAllowedAt = null) {
  const modal = document.getElementById('participationModal');
  const content = document.getElementById('participationContent');

  // Arrêter tout timer existant
  if (participationTimerInterval) {
    clearInterval(participationTimerInterval);
    participationTimerInterval = null;
  }

  if (isSuccess) {
    content.innerHTML = `
      <h2>✨ Bravo! ✨</h2>
      <div class="success-message">${message}</div>
      <div class="countdown" id="countdownContainer" style="display:none;">
        <div>Prochaine participation:</div>
        <div class="countdown-timer" id="countdownDisplay"></div>
      </div>
      <button class="btn btn-primary close-btn">Fermer</button>
    `;
  } else {
    content.innerHTML = `
      <h2>⏱️ Déjà participé! ⏱️</h2>
      <div class="error-message">${message}</div>
      <div class="countdown" id="countdownContainer" style="display:block;">
        <div>Vous pourrez reparticiper dans:</div>
        <div class="countdown-timer" id="countdownDisplay">Chargement...</div>
      </div>
      <button class="btn btn-primary close-btn">Fermer</button>
    `;
  }

  modal.classList.remove('hidden');

  // Gérer le countdown si fourni
  if (nextAllowedAt) {
    const updateCountdown = () => {
      const countdownDisplay = document.getElementById('countdownDisplay');
      if (!countdownDisplay) return; // L'élément n'existe plus

      const now = new Date();
      const timeLeft = nextAllowedAt - now;

      if (timeLeft <= 0) {
        countdownDisplay.textContent = '✅ Vous pouvez participer!';
        if (participationTimerInterval) {
          clearInterval(participationTimerInterval);
          participationTimerInterval = null;
        }
        return;
      }

      const hours = Math.floor(timeLeft / (1000 * 60 * 60));
      const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

      countdownDisplay.textContent = `${hours}h ${minutes}m ${seconds}s`;
    };

    // Mise à jour immédiate
    updateCountdown();
    
    // Mise à jour toutes les secondes
    participationTimerInterval = setInterval(updateCountdown, 1000);
  }
}

/**
 * Fermer le modal de participation
 */
function closeParticipationModal() {
  document.getElementById('participationModal').classList.add('hidden');
}

// Fermer la modale en cliquant sur le bouton X
document.addEventListener('click', (e) => {
  if (e.target.id === 'closeParticipationModal') {
    closeParticipationModal();
  }
  // Fermer aussi en cliquant sur le bouton "Fermer"
  if (e.target.classList.contains('close-btn')) {
    closeParticipationModal();
  }
  // Fermer en cliquant sur le fond sombre de la modale
  if (e.target.id === 'participationModal') {
    closeParticipationModal();
  }
});

// ===========================
// GESTION DES PHOTOS GIVEAWAY
// ===========================

/**
 * Charger les photos du giveaway depuis le serveur
 */
async function loadGiveawayPhotos() {
  try {
    const response = await fetch('/api/giveaway/photos');
    const data = await response.json();

    if (data.success) {
      // Stocker les données complètes (avec _id)
      giveawayPhotos = data.data.photos;
      displayPublicGiveawayPhotos();
      displayAdminGiveawayPhotos();
    }
  } catch (error) {
    console.error('Erreur lors du chargement des photos:', error);
  }
}

/**
 * Afficher les photos du giveaway (visible à tous)
 */
function displayPublicGiveawayPhotos() {
  const container = document.getElementById('publicGiveawayPhotosContainer');
  const photosList = document.getElementById('publicGiveawayPhotosList');
  const noPhotosMessage = document.getElementById('noPublicPhotosMessage');

  if (giveawayPhotos.length === 0) {
    container.classList.add('hidden');
    noPhotosMessage.style.display = 'block';
    return;
  }

  container.classList.remove('hidden');
  noPhotosMessage.style.display = 'none';
  photosList.innerHTML = '';

  giveawayPhotos.forEach((photo, index) => {
    const photoItem = document.createElement('div');
    photoItem.className = 'photo-item';
    // Utiliser l'ID pour construire l'URL de la photo
    photoItem.innerHTML = `<img src="/api/giveaway/photos/${photo._id}" alt="Giveaway photo ${index + 1}">`;
    
    // Ajouter l'événement de clic pour ouvrir la galerie
    photoItem.addEventListener('click', () => {
      openGallery(index);
    });
    
    photosList.appendChild(photoItem);
  });
}

/**
 * Ouvrir la galerie à partir d'une photo
 */
function openGallery(index) {
  currentGalleryIndex = index;
  displayGalleryPhoto();
  document.getElementById('fullscreenViewer').classList.remove('hidden');
}

/**
 * Afficher la photo actuelle dans la galerie
 */
function displayGalleryPhoto() {
  const img = document.getElementById('viewerImage');
  const counter = document.getElementById('viewerCounter');
  const prevBtn = document.getElementById('prevViewer');
  const nextBtn = document.getElementById('nextViewer');

  // Utiliser l'ID pour construire l'URL
  img.src = `/api/giveaway/photos/${giveawayPhotos[currentGalleryIndex]._id}`;
  counter.textContent = `${currentGalleryIndex + 1} / ${giveawayPhotos.length}`;

  // Désactiver les boutons si on est aux limites
  prevBtn.disabled = currentGalleryIndex === 0;
  nextBtn.disabled = currentGalleryIndex === giveawayPhotos.length - 1;
}

/**
 * Fermer la galerie
 */
function closeViewer() {
  document.getElementById('fullscreenViewer').classList.add('hidden');
}

/**
 * Aller à la photo précédente
 */
document.getElementById('prevViewer').addEventListener('click', () => {
  if (currentGalleryIndex > 0) {
    currentGalleryIndex--;
    displayGalleryPhoto();
  }
});

/**
 * Aller à la photo suivante
 */
document.getElementById('nextViewer').addEventListener('click', () => {
  if (currentGalleryIndex < giveawayPhotos.length - 1) {
    currentGalleryIndex++;
    displayGalleryPhoto();
  }
});

/**
 * Fermer le viewer en cliquant sur le X
 */
document.getElementById('closeViewer').addEventListener('click', closeViewer);

/**
 * Fermer le viewer en cliquant sur le fond
 */
document.getElementById('fullscreenViewer').addEventListener('click', (e) => {
  if (e.target.id === 'fullscreenViewer') {
    closeViewer();
  }
});

/**
 * Navigation au clavier
 */
document.addEventListener('keydown', (e) => {
  if (document.getElementById('fullscreenViewer').classList.contains('hidden')) {
    return;
  }
  
  if (e.key === 'ArrowLeft') {
    document.getElementById('prevViewer').click();
  } else if (e.key === 'ArrowRight') {
    document.getElementById('nextViewer').click();
  } else if (e.key === 'Escape') {
    closeViewer();
  }
});

/**
 * Afficher les photos du giveaway (interface admin)
 */
function displayAdminGiveawayPhotos() {
  const container = document.getElementById('giveawayPhotosContainer');
  const photosList = document.getElementById('giveawayPhotosList');
  const noPhotosMessage = document.getElementById('noPhotosMessage');

  if (giveawayPhotos.length === 0) {
    container.classList.add('hidden');
    noPhotosMessage.style.display = 'block';
    return;
  }

  container.classList.remove('hidden');
  noPhotosMessage.style.display = 'none';
  photosList.innerHTML = '';

  giveawayPhotos.forEach((photo, index) => {
    const photoItem = document.createElement('div');
    photoItem.className = 'photo-item';
    photoItem.innerHTML = `
      <img src="/api/giveaway/photos/${photo._id}" alt="Giveaway photo ${index + 1}">
      <button class="delete-photo-btn" data-photo-id="${photo._id}">🗑️</button>
    `;

    photoItem.querySelector('.delete-photo-btn').addEventListener('click', () => {
      deleteGiveawayPhoto(photo._id);
    });

    photosList.appendChild(photoItem);
  });
}

// ===========================
// CONNEXION ADMIN (Simple)
// ===========================

/**
 * Ouvrir la modal de connexion admin
 */
document.getElementById('adminLoginBtn').addEventListener('click', () => {
  document.getElementById('adminLoginModal').classList.remove('hidden');
  document.getElementById('adminLoginPassword').value = '';
  document.getElementById('adminLoginMessage').textContent = '';
});

/**
 * Fermer la modal de connexion admin
 */
function closeAdminLoginModal() {
  document.getElementById('adminLoginModal').classList.add('hidden');
  document.getElementById('adminLoginPassword').value = '';
  document.getElementById('adminLoginMessage').textContent = '';
}

document.getElementById('closeAdminLoginModal').addEventListener('click', closeAdminLoginModal);
document.getElementById('closeAdminLoginBtn').addEventListener('click', closeAdminLoginModal);

/**
 * Soumettre la connexion admin
 */
document.getElementById('adminLoginSubmitBtn').addEventListener('click', async () => {
  const password = document.getElementById('adminLoginPassword').value;
  const messageBox = document.getElementById('adminLoginMessage');

  if (!password) {
    messageBox.textContent = '❌ Veuillez entrer le mot de passe';
    messageBox.className = 'message-box error';
    return;
  }

  try {
    const response = await fetch(ADMIN_LOGIN_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ password }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      messageBox.textContent = data.message || 'Erreur d\'authentification';
      messageBox.className = 'message-box error';
      return;
    }

    // Stocker le token
    adminToken = data.token;
    messageBox.textContent = '✅ Connecté en tant qu\'admin!';
    messageBox.className = 'message-box success';

    // Afficher la section admin
    document.getElementById('adminGiveawaySection').style.display = 'block';

    // Charger les photos existantes
    await loadGiveawayPhotos();
    displayAdminGiveawayPhotos();

    // Fermer la modal après 1 seconde
    setTimeout(() => {
      closeAdminLoginModal();
    }, 1000);
  } catch (error) {
    console.error('Erreur:', error);
    messageBox.textContent = 'Erreur de connexion';
    messageBox.className = 'message-box error';
  }
});

// ===========================
// GESTION DES PHOTOS GIVEAWAY
// ===========================

/**
 * Ouvrir la modal de connexion admin
 */
document.getElementById('uploadPhotosBtn').addEventListener('click', async () => {
  const fileInput = document.getElementById('giveawayPhotos');
  const files = fileInput.files;
  const uploadMessage = document.getElementById('uploadMessage');

  if (files.length === 0) {
    uploadMessage.textContent = '❌ Veuillez sélectionner au moins une photo';
    uploadMessage.className = 'message-box error';
    return;
  }

  if (files.length > 5) {
    uploadMessage.textContent = '❌ Maximum 5 photos autorisées';
    uploadMessage.className = 'message-box error';
    return;
  }

  // Afficher la modal d'upload
  const uploadModal = document.getElementById('uploadModal');
  const progressFill = document.getElementById('progressFill');
  const uploadStatus = document.getElementById('uploadStatus');
  uploadModal.classList.remove('hidden');
  progressFill.style.width = '0%';
  uploadStatus.textContent = 'Préparation de l\'upload...';

  const formData = new FormData();
  for (let i = 0; i < files.length; i++) {
    formData.append('photos', files[i]);
  }

  try {
    // Simuler la progression jusqu'à 80% pendant le chargement
    const progressInterval = setInterval(() => {
      const current = parseInt(progressFill.style.width);
      if (current < 80) {
        progressFill.style.width = (current + Math.random() * 20) + '%';
      }
    }, 300);

    uploadStatus.textContent = `Envoi de ${files.length} photo(s)...`;

    const response = await fetch('/api/giveaway/photos', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
      },
      body: formData,
    });

    clearInterval(progressInterval);
    progressFill.style.width = '90%';
    uploadStatus.textContent = 'Traitement du serveur...';

    const data = await response.json();

    progressFill.style.width = '100%';
    uploadStatus.textContent = '✅ Téléchargement réussi!';

    if (!response.ok) {
      progressFill.style.width = '100%';
      uploadStatus.textContent = `❌ ${data.message || 'Erreur lors de l\'upload'}`;
      setTimeout(() => {
        uploadModal.classList.add('hidden');
      }, 2000);
      uploadMessage.textContent = `❌ ${data.message || 'Erreur lors de l\'upload'}`;
      uploadMessage.className = 'message-box error';
      return;
    }

    // Mettre à jour les photos (ajouter les nouvelles)
    giveawayPhotos = data.data.photos;
    displayAdminGiveawayPhotos();
    displayPublicGiveawayPhotos();

    uploadMessage.textContent = `✅ ${data.message}`;
    uploadMessage.className = 'message-box success';
    fileInput.value = '';

    setTimeout(() => {
      uploadModal.classList.add('hidden');
      uploadMessage.textContent = '';
    }, 2000);
  } catch (error) {
    console.error('Erreur lors de l\'upload:', error);
    progressFill.style.width = '100%';
    uploadStatus.textContent = '❌ Erreur de connexion';
    setTimeout(() => {
      uploadModal.classList.add('hidden');
    }, 2000);
    uploadMessage.textContent = '❌ Erreur de connexion';
    uploadMessage.className = 'message-box error';
  }
});

/**
 * Supprimer une photo du giveaway
 */
async function deleteGiveawayPhoto(photoId) {
  if (!confirm('Êtes-vous sûr de vouloir supprimer cette photo?')) {
    return;
  }

  try {
    const response = await fetch(`/api/giveaway/photos/${photoId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
      },
    });

    const data = await response.json();

    if (response.ok) {
      // Filtrer la photo par son ID MongoDB
      giveawayPhotos = giveawayPhotos.filter((photo) => photo._id !== photoId);
      displayAdminGiveawayPhotos();
      displayPublicGiveawayPhotos();
    }
  } catch (error) {
    console.error('Erreur lors de la suppression:', error);
  }
}

/**
 * Supprimer toutes les photos du giveaway
 */
document.getElementById('clearPhotosBtn').addEventListener('click', async () => {
  if (!confirm('Êtes-vous sûr de vouloir supprimer toutes les photos?')) {
    return;
  }

  try {
    const response = await fetch('/api/giveaway/photos', {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
      },
    });

    const data = await response.json();

    if (response.ok) {
      giveawayPhotos = [];
      displayAdminGiveawayPhotos();
      displayPublicGiveawayPhotos();
      const uploadMessage = document.getElementById('uploadMessage');
      uploadMessage.textContent = '✅ Toutes les photos ont été supprimées';
      uploadMessage.className = 'message-box success';
      setTimeout(() => {
        uploadMessage.textContent = '';
      }, 3000);
    }
  } catch (error) {
    console.error('Erreur lors de la suppression:', error);
  }
});

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

    let data;
    try {
      data = await response.json();
    } catch (jsonError) {
      console.error('Erreur parsing JSON:', jsonError, 'Response:', response);
      showMessage('Erreur serveur: réponse invalide', 'error');
      setLoading(false);
      return;
    }

    if (!response.ok) {
      const nextTime = response.status === 429 && data.nextAllowedAt ? new Date(data.nextAllowedAt) : null;
      showParticipationModal(false, data.message || 'Erreur lors de l\'enregistrement', nextTime);
      setLoading(false);
      return;
    }

    showParticipationModal(
      true,
      '⚡ Participation enregistrée avec succès! Revenez dans 24h pour reparticiper! ⚡',
      data.data && data.data.nextAllowedAt ? new Date(data.data.nextAllowedAt) : null
    );
    
    nameInput.value = '';
    
    // Désactiver le formulaire pendant 24h
    document.getElementById('participantForm').style.opacity = '0.6';
    document.querySelector('.btn-primary').disabled = true;

    createEnergyParticles(15);

    // Actualiser les données
    await fetchParticipants();
    await updateStats();
  } catch (error) {
    console.error('Erreur lors de la participation:', error);
    showMessage(`Erreur: ${error.message || 'Erreur de connexion'}`, 'error');
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
 * Se connecter en tant qu'admin (pour la roulette)
 */
document.getElementById('adminRoulettLoginBtn').addEventListener('click', async () => {
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
    await loadGiveawayPhotos(); // Charger les photos du giveaway
    displayPublicGiveawayPhotos();
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

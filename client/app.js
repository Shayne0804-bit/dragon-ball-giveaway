// ===========================
// CONFIGURATION
// ===========================
const API_URL = '/api/participants';
const ROULETTE_API = '/api/participants/roulette';
const ADMIN_LOGIN_API = '/api/participants/admin/login';
const WINNERS_API = '/api/participants/winners';
const RESET_API = '/api/participants/reset';
const GIVEAWAYS_API = '/api/giveaways';
const DISCORD_AUTH_API = '/api/auth/discord';
const DISCORD_USER_API = '/api/auth/user';
const DISCORD_LOGOUT_API = '/api/auth/logout';

let participants = [];
let isSpinning = false;
let wheelRotation = 0;
let adminToken = null; // Token stocké en session
let giveawayPhotos = []; // Photos du giveaway stockées sur le serveur
let currentGalleryIndex = 0; // Index actuel de la galerie
let currentGiveaway = null; // Giveaway actuellement sélectionné
let allGiveaways = []; // Tous les giveaways actifs
let currentDiscordUser = null; // Utilisateur Discord connecté

// Queue pour les event listeners qui s'exécutent avant le DOM chargé
const pendingListeners = [];

/**
 * Wrapper pour les event listeners qui doivent s'exécuter après le DOM
 */
function addEventListenerWhenReady(selectorOrElement, event, callback) {
  const attach = () => {
    const element = typeof selectorOrElement === 'string' 
      ? document.getElementById(selectorOrElement)
      : selectorOrElement;
    
    if (element) {
      element.addEventListener(event, callback);
      console.log(`✅ Event listener attaché à ${selectorOrElement || element.id}`);
    } else {
      console.warn(`⚠️ Élément non trouvé: ${selectorOrElement}`);
    }
  };
  
  if (document.readyState === 'loading') {
    pendingListeners.push(attach);
  } else {
    attach();
  }
}

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
// DISCORD AUTHENTICATION
// ===========================

/**
 * Récupérer l'utilisateur Discord connecté
 */
async function fetchDiscordUser() {
  try {
    const response = await fetch(DISCORD_USER_API, {
      method: 'GET',
      credentials: 'include', // Important pour envoyer les cookies de session
    });

    if (response.ok) {
      const data = await response.json();
      if (data.success) {
        currentDiscordUser = data.user;
        updateDiscordAuthUI();
        return data.user;
      }
    }
    currentDiscordUser = null;
    updateDiscordAuthUI();
    return null;
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'utilisateur Discord:', error);
    currentDiscordUser = null;
    updateDiscordAuthUI();
    return null;
  }
}

/**
 * Mettre à jour l'interface utilisateur en fonction du statut Discord
 */
function updateDiscordAuthUI() {
  const participantForm = document.getElementById('participantForm');
  const discordBtn = document.getElementById('discordLoginBtn');
  const logoutBtn = document.getElementById('discordLogoutBtn');
  const userInfo = document.getElementById('discordUserInfo');

  if (currentDiscordUser) {
    // Utilisateur connecté avec Discord
    if (discordBtn) {
      discordBtn.style.display = 'none'; // Cacher le bouton login
    }
    if (logoutBtn) {
      logoutBtn.style.display = 'inline-block'; // Afficher le bouton logout
    }
    if (userInfo) {
      userInfo.style.display = 'flex';
      const avatarHtml = currentDiscordUser.discordAvatar 
        ? `<img src="${currentDiscordUser.discordAvatar}" alt="Avatar" class="discord-avatar" onerror="this.style.display='none'">`
        : '';
      userInfo.innerHTML = `
        ${avatarHtml}
        <div class="discord-user-info">
          <p class="discord-username">${currentDiscordUser.discordUsername}</p>
          <p class="discord-status">✅ Connecté</p>
        </div>
      `;
    }
  } else {
    // Utilisateur NON connecté
    if (discordBtn) {
      discordBtn.style.display = 'inline-block'; // Afficher le bouton login
    }
    if (logoutBtn) {
      logoutBtn.style.display = 'none'; // Cacher le bouton logout
    }
    if (userInfo) {
      userInfo.style.display = 'none';
    }
  }
}

/**
 * Déconnecter l'utilisateur Discord
 */
async function discordLogout() {
  try {
    const response = await fetch(DISCORD_LOGOUT_API, {
      method: 'POST',
      credentials: 'include',
    });

    if (response.ok) {
      currentDiscordUser = null;
      updateDiscordAuthUI();
      showMessage('Déconnexion réussie', 'success');
      // Recharger la page ou réinitialiser l'interface
      location.reload();
    }
  } catch (error) {
    console.error('Erreur lors de la déconnexion:', error);
    showMessage('Erreur lors de la déconnexion', 'error');
  }
}

/**
 * Mettre à jour l'état du formulaire de participation
 */
function updateFormState() {
  const form = document.getElementById('participantForm');
  const submitBtn = form.querySelector('button[type="submit"]');
  
  if (!currentGiveaway || !currentGiveaway._id) {
    // Aucun giveaway sélectionné - désactiver le formulaire
    form.style.opacity = '0.5';
    form.style.pointerEvents = 'none';
    submitBtn.disabled = true;
  } else {
    // Giveaway sélectionné - activer le formulaire
    form.style.opacity = '1';
    form.style.pointerEvents = 'auto';
    submitBtn.disabled = false;
  }
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
  const photosSection = document.getElementById('photosSection');
  const photosList = document.getElementById('publicGiveawayPhotosList');
  const noPhotosMessage = document.getElementById('noPublicPhotosMessage');

  console.log('🖼️ displayPublicGiveawayPhotos - Giveaway actuel:', currentGiveaway?.name);
  console.log('🖼️ Photos du giveaway sélectionné:', giveawayPhotos.length);

  // Vérifier qu'un giveaway est sélectionné
  if (!currentGiveaway) {
    photosSection.classList.add('hidden');
    if (noPhotosMessage) noPhotosMessage.style.display = 'block';
    console.log('ℹ️ Aucun giveaway sélectionné');
    return;
  }

  if (!giveawayPhotos || giveawayPhotos.length === 0) {
    photosSection.classList.add('hidden');
    if (noPhotosMessage) noPhotosMessage.style.display = 'block';
    console.log('ℹ️ Aucune photo pour ce giveaway');
    return;
  }

  photosSection.classList.remove('hidden');
  if (photosList) photosList.classList.remove('hidden');
  if (noPhotosMessage) noPhotosMessage.style.display = 'none';
  if (photosList) photosList.innerHTML = '';

  // Afficher UNIQUEMENT les photos du giveaway courant
  giveawayPhotos.forEach((photo, index) => {
    const photoItem = document.createElement('div');
    photoItem.className = 'photo-item';
    
    // Gérer plusieurs formats de photo
    const photoId = photo._id || photo.id || photo;
    const photoUrl = `/api/giveaway/photos/${photoId}`;
    
    photoItem.innerHTML = `<img src="${photoUrl}" alt="Giveaway photo ${index + 1}" onerror="console.error('Erreur chargement photo:', '${photoUrl}')">`;
    
    // Ajouter l'événement de clic pour ouvrir la galerie
    photoItem.addEventListener('click', () => {
      console.log('📸 Click sur photo:', index);
      openGallery(index);
    });
    
    photosList.appendChild(photoItem);
  });
  
  console.log(`✅ ${giveawayPhotos.length} photo(s) du giveaway "${currentGiveaway.name}" affichée(s)`);
}

/**
 * Charger et afficher l'historique des gagnants
 */
async function loadWinners() {
  try {
    const response = await fetch(WINNERS_API);
    const data = await response.json();
    
    if (data.success && Array.isArray(data.data.winners)) {
      displayWinnersList(data.data.winners);
    }
  } catch (error) {
    console.error('❌ Erreur lors du chargement des gagnants:', error);
  }
}

/**
 * Afficher la liste des gagnants
 */
function displayWinnersList(winners) {
  const winnersList = document.getElementById('winnersList');
  const winnerCountElement = document.getElementById('winnerCount');
  
  if (!winners || winners.length === 0) {
    winnersList.innerHTML = '<p class="empty-message">Aucun gagnant pour le moment</p>';
    winnerCountElement.textContent = '0';
    return;
  }
  
  winnerCountElement.textContent = winners.length;
  
  winnersList.innerHTML = winners.map((winner, index) => `
    <div class="winner-item" style="padding: 15px; background: rgba(76, 175, 80, 0.05); border-left: 4px solid var(--success); margin-bottom: 12px; border-radius: 6px;">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <div>
          <div style="font-weight: 700; color: var(--light); font-size: 16px;">🏆 ${winner.name || 'Anonyme'}</div>
          <div style="color: var(--gray); font-size: 12px; margin-top: 4px;">
            ${winner.date ? new Date(winner.date).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Date non disponible'}
          </div>
        </div>
        <div style="text-align: right;">
          <div style="color: var(--success); font-weight: 700; font-size: 14px;">#${index + 1}</div>
        </div>
      </div>
    </div>
  `).join('');
  
  console.log(`✅ ${winners.length} gagnant(s) affichés`);
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
document.getElementById('prevViewer')?.addEventListener('click', () => {
  if (currentGalleryIndex > 0) {
    currentGalleryIndex--;
    displayGalleryPhoto();
  }
});

/**
 * Aller à la photo suivante
 */
document.getElementById('nextViewer')?.addEventListener('click', () => {
  if (currentGalleryIndex < giveawayPhotos.length - 1) {
    currentGalleryIndex++;
    displayGalleryPhoto();
  }
});

/**
 * Fermer le viewer en cliquant sur le X
 */
document.getElementById('closeViewer')?.addEventListener('click', closeViewer);

/**
 * Fermer le viewer en cliquant sur le fond
 */
document.getElementById('fullscreenViewer')?.addEventListener('click', (e) => {
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

  // Si les éléments n'existent pas, ignorer silencieusement
  if (!container || !photosList || !noPhotosMessage) {
    console.log('⚠️ Conteneurs photos admin non trouvés');
    return;
  }

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
 * Gérer le bouton de connexion Discord
 */
document.getElementById('discordLoginBtn').addEventListener('click', () => {
  // Rediriger vers la route Discord auth
  window.location.href = DISCORD_AUTH_API;
});

/**
 * Gérer le bouton de déconnexion Discord
 */
document.getElementById('discordLogoutBtn').addEventListener('click', async () => {
  await discordLogout();
});

/**
 * Fermer la modal de connexion admin
 */
function closeAdminLoginModal() {
  document.getElementById('adminLoginModal').classList.add('hidden');
  document.getElementById('adminLoginPassword').value = '';
  document.getElementById('adminLoginMessage').textContent = '';
}

document.getElementById('closeAdminLoginModal')?.addEventListener('click', closeAdminLoginModal);

/**
 * Boutons admin pour créer et sélectionner giveaways
 */
document.getElementById('createNewGiveawayBtn')?.addEventListener('click', () => {
  document.getElementById('createGiveawayModal').classList.remove('hidden');
  document.getElementById('giveawayName').value = '';
  document.getElementById('giveawayDesc').value = '';
  document.getElementById('giveawayDays').value = '0';
  document.getElementById('giveawayHours').value = '0';
  document.getElementById('createGiveawayMessage').textContent = '';
});

// Listener pour le bouton "Voir les Giveaways" (public)
document.getElementById('publicSelectGiveawayBtn')?.addEventListener('click', async () => {
  console.log('✅ Bouton publicSelectGiveawayBtn cliqué');
  const modal = document.getElementById('selectGiveawayModal');
  if (modal) {
    modal.classList.remove('hidden');
    console.log('✅ Modal affichée');
    await loadGiveaways();
  } else {
    console.error('❌ Modal selectGiveawayModal non trouvée');
  }
});

// Listener pour le bouton "Sélectionner" (admin)
document.getElementById('selectGiveawayBtn')?.addEventListener('click', async () => {
  console.log('✅ Bouton selectGiveawayBtn cliqué');
  const modal = document.getElementById('selectGiveawayModal');
  if (modal) {
    modal.classList.remove('hidden');
    console.log('✅ Modal affichée');
    await loadGiveaways();
  } else {
    console.error('❌ Modal selectGiveawayModal non trouvée');
  }
});

// Listener pour fermer la modale
document.getElementById('closeSelectGiveawayModal')?.addEventListener('click', () => {
  console.log('❌ Bouton closeSelectGiveawayModal cliqué');
  const modal = document.getElementById('selectGiveawayModal');
  if (modal) {
    modal.classList.add('hidden');
    console.log('✅ Modal fermée');
  }
});

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
    console.log('🔐 Tentative de connexion admin...');
    const response = await fetch(ADMIN_LOGIN_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ password }),
    });

    console.log(`📊 Réponse status: ${response.status}`);
    const data = await response.json();
    console.log('📦 Données reçues:', data);

    if (!response.ok || !data.success) {
      console.error('❌ Authentification échouée:', data.message);
      messageBox.textContent = data.message || 'Erreur d\'authentification';
      messageBox.className = 'message-box error';
      return;
    }

    // Stocker le token
    adminToken = data.token;
    console.log('✅ Token reçu:', adminToken);
    messageBox.textContent = '✅ Connecté en tant qu\'admin!';
    messageBox.className = 'message-box success';

    // Afficher la section admin
    document.getElementById('adminGiveawaySection').classList.remove('hidden');

    // Charger les photos existantes
    await loadGiveawayPhotos();
    displayAdminGiveawayPhotos();

    // Fermer la modal après 1 seconde
    setTimeout(() => {
      closeAdminLoginModal();
    }, 1000);
  } catch (error) {
    console.error('❌ Erreur fetch:', error);
    console.error('Message:', error.message);
    console.error('Stack:', error.stack);
    messageBox.textContent = `Erreur de connexion: ${error.message}`;
    messageBox.className = 'message-box error';
  }
});

// ===========================
// GESTION DES PHOTOS GIVEAWAY
// ===========================

/**
 * Gérer les uploads de photos
 */
document.getElementById('uploadPhotosBtn')?.addEventListener('click', async () => {
  alert('Fonction upload de photos non disponible dans cette version');
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
document.getElementById('clearPhotosBtn')?.addEventListener('click', async () => {
  alert('Fonction suppression de photos non disponible dans cette version');
});

// ===========================// ===========================
// FORMULAIRE DE PARTICIPATION
// ===========================

/**
 * Soumettre le formulaire de participation (Discord Auth)
 */
document.getElementById('participantForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  // Vérifier qu'un giveaway est sélectionné
  if (!currentGiveaway || !currentGiveaway._id) {
    showMessage('❌ Veuillez d\'abord sélectionner un giveaway!', 'error');
    return;
  }

  // Vérifier que l'utilisateur est connecté avec Discord
  if (!currentDiscordUser) {
    showMessage('❌ Vous devez vous connecter avec Discord pour participer!', 'error');
    return;
  }

  try {
    setLoading(true);

    // Envoyer uniquement le giveawayId (l'utilisateur vient de Discord)
    const bodyData = {};
    
    if (currentGiveaway && currentGiveaway._id) {
      bodyData.giveawayId = currentGiveaway._id;
    }

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Important pour les cookies de session
      body: JSON.stringify(bodyData),
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
    let url = API_URL;
    if (currentGiveaway && currentGiveaway._id) {
      url += `?giveawayId=${currentGiveaway._id}`;
    }
    
    const response = await fetch(url);
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
  
  // Vérifier que l'élément existe
  if (!list) {
    console.warn('⚠️ Element participantsList not found');
    return;
  }

  if (participants.length === 0) {
    list.innerHTML = '<p class="empty-message">Aucun participant pour le moment...</p>';
    return;
  }

  list.innerHTML = participants
    .map(
      (participant) => `
    <div class="participant-card new">
      <div style="display: flex; align-items: center; gap: 0.5rem;">
        ${participant.discordAvatar ? `<img src="${participant.discordAvatar}" alt="Avatar" style="width: 28px; height: 28px; border-radius: 50%; border: 1px solid #5865F2; object-fit: cover;" onerror="this.style.display='none'">` : ''}
        <span>${participant.discordUsername || participant.name || 'Anonyme'}</span>
      </div>
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
    let url = WINNERS_API;
    if (currentGiveaway && currentGiveaway._id) {
      url += `?giveawayId=${currentGiveaway._id}`;
    }
    
    const response = await fetch(url);
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
  
  // Vérifier que l'élément existe
  if (!list) {
    console.warn('⚠️ Element winnersList not found');
    return;
  }

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
  // Ne charger les stats que si un giveaway est sélectionné
  if (!currentGiveaway) {
    console.log('⚠️ Aucun giveaway sélectionné, pas de chargement des stats');
    participants = [];
    document.getElementById('participantCount').textContent = '0';
    
    // Masquer les sections
    document.getElementById('participantsSection')?.classList.add('hidden');
    document.getElementById('rouletteSection')?.classList.add('hidden');
    document.getElementById('statsSection')?.classList.add('hidden');
    
    drawWheel(); // Effacer le canvas
    return;
  }
  
  // Afficher les sections
  document.getElementById('participantsSection')?.classList.remove('hidden');
  document.getElementById('rouletteSection')?.classList.remove('hidden');
  document.getElementById('statsSection')?.classList.remove('hidden');
  
  await fetchParticipants();
  await fetchWinners();

  const count = participants.length;
  document.getElementById('participantCount').textContent = count;

  // Recréer la roulette (même si vide, pour l'effacer)
  drawWheel();
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
    const displayName = (participant && participant.name) ? participant.name.substring(0, 8) : 'N/A';
    ctx.fillText(displayName, 0, 0);
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
    // Inclure giveawayId si un giveaway est sélectionné
    let url = ROULETTE_API;
    if (currentGiveaway && currentGiveaway._id) {
      url += `?giveawayId=${currentGiveaway._id}`;
    }

    const response = await fetch(url, {
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

      // Vérifier qu'un giveaway est sélectionné
      if (!currentGiveaway || !currentGiveaway._id) {
        showMessage('❌ Aucun giveaway sélectionné', 'error');
        return;
      }

      console.log('🔄 Réinitialisation des participants pour:', currentGiveaway.name);

      // Appeler l'endpoint avec l'ID du giveaway
      const response = await fetch(`${RESET_API}?giveawayId=${currentGiveaway._id}`, {
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
        console.log('✅ Participants supprimés pour:', currentGiveaway.name);
        showMessage('✅ Giveaway complété - Retour à la liste', 'success');
        
        // Recharger la liste des giveaways
        await loadGiveaways();
        
        // Retourner à la sélection des giveaways
        currentGiveaway = null;
        giveawayPhotos = [];
        document.getElementById('giveawayInfoSection').classList.add('hidden');
        document.getElementById('photosSection').classList.add('hidden');
        document.getElementById('selectGiveawayModal').classList.remove('hidden');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        showMessage(`❌ ${data.message || 'Erreur'}`, 'error');
      }
    } catch (error) {
      console.error('❌ Erreur:', error);
      showMessage('❌ Erreur lors de la réinitialisation', 'error');
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
document.getElementById('adminSubmitBtn')?.addEventListener('click', async () => {
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
 * Fonctions modales admin
 */

/**
 * Permettre l'entrée avec Entrée
 */
document.getElementById('adminPassword')?.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    document.getElementById('adminSubmitBtn').click();
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
    
    // Vérifier si l'utilisateur est déjà connecté avec Discord
    await fetchDiscordUser();
    
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

// ===========================
// GESTION DES GIVEAWAYS MULTIPLES
// ===========================

/**
 * Charger et afficher les giveaways disponibles
 */
async function loadGiveaways() {
  try {
    console.log('📥 Chargement des giveaways...');
    const response = await fetch(GIVEAWAYS_API);
    const data = await response.json();
    console.log('✅ Réponse API giveaways:', data);

    if (data.success && data.data && Array.isArray(data.data.giveaways)) {
      allGiveaways = data.data.giveaways;
      console.log(`✅ ${allGiveaways.length} giveaway(s) chargé(s):`);
      allGiveaways.forEach((g, i) => {
        console.log(`  [${i}] ${g.name} - ID: ${g._id} - Photos: ${Array.isArray(g.photos) ? g.photos.length : 0}`);
      });
      displayGiveawaySelector();
    } else {
      console.error('❌ Erreur API: structure invalide', data);
      const container = document.getElementById('selectGiveawayListContainer');
      if (container) {
        container.innerHTML = '<p class="empty-message">Erreur lors du chargement</p>';
      }
    }
  } catch (error) {
    console.error('❌ Erreur fetch:', error);
    const container = document.getElementById('selectGiveawayListContainer');
    if (container) {
      container.innerHTML = '<p class="empty-message">Erreur de connexion</p>';
    }
  }
}

/**
 * Afficher le sélecteur de giveaways
 */
function displayGiveawaySelector() {
  console.log('🎯 displayGiveawaySelector() appelée');
  const giveawaysList = document.getElementById('selectGiveawayListContainer');
  console.log('selectGiveawayListContainer element:', giveawaysList);
  
  if (!giveawaysList) {
    console.error('❌ selectGiveawayListContainer not found!');
    return;
  }
  
  if (!allGiveaways || allGiveaways.length === 0) {
    console.log('⚠️ Aucun giveaway disponible');
    giveawaysList.innerHTML = '<p class="empty-message">Aucun giveaway disponible</p>';
    return;
  }

  console.log(`📋 Affichage de ${allGiveaways.length} giveaway(s)`);
  const html = allGiveaways.map((g, index) => {
    // Gestion sécurisée des données
    const photosCount = Array.isArray(g.photos) ? g.photos.length : 0;
    const participantCount = g.participantCount || 0;
    
    const endDate = new Date(g.endDate);
    const now = new Date();
    const timeLeft = endDate - now;
    const isCompleted = timeLeft <= 0;

    let timeDisplay = '⏰ Terminé';
    if (!isCompleted) {
      const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
      const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
      timeDisplay = `⏱️ ${days}j ${hours}h ${minutes}m`;
    }

    console.log(`  [${index}] ${g.name} - ${photosCount} photos - ${participantCount} participants`);

    return `
      <div class="giveaway-card ${isCompleted ? 'completed' : ''}" data-id="${g._id}">
        <div class="giveaway-card-content">
          <h3>${g.name || 'Giveaway sans nom'}</h3>
          ${g.description ? `<p class="giveaway-desc">${g.description}</p>` : ''}
          <div class="giveaway-info">
            <span>📸 ${photosCount} photo(s)</span>
            <span>👥 ${participantCount} participant(s)</span>
          </div>
          <div class="giveaway-timer">${timeDisplay}</div>
        </div>
        <button class="giveaway-select-btn" data-giveaway-id="${g._id}">
          Sélectionner →
        </button>
      </div>
    `;
  }).join('');
  
  console.log('HTML à insérer:', html.substring(0, 100), '...');
  giveawaysList.innerHTML = html;
  console.log('✅ HTML inséré dans selectGiveawayListContainer');
  
  // Ajouter les event listeners aux boutons
  document.querySelectorAll('.giveaway-select-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const giveawayId = btn.getAttribute('data-giveaway-id');
      console.log('🔘 Bouton cliqué, ID:', giveawayId);
      selectGiveaway(giveawayId);
    });
  });
  console.log('✅ Event listeners attachés aux boutons');
}

/**
 * Afficher les informations du giveaway sélectionné
 */
function displayGiveawayInfo() {
  const infoSection = document.getElementById('giveawayInfoSection');
  const photosSection = document.getElementById('photosSection');
  
  if (!currentGiveaway) {
    infoSection.classList.add('hidden');
    photosSection.classList.add('hidden');
    return;
  }

  infoSection.classList.remove('hidden');
  photosSection.classList.remove('hidden');
  
  // Remplir les infos
  document.getElementById('selectedGiveawayName').textContent = currentGiveaway.name || 'Giveaway sans nom';
  document.getElementById('giveawayDescription').textContent = currentGiveaway.description || 'Aucune description';
  
  // Calculer le temps restant
  const endDate = new Date(currentGiveaway.endDate);
  const now = new Date();
  const timeLeft = endDate - now;
  
  let timeDisplay = '⏰ Terminé';
  if (timeLeft > 0) {
    const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    timeDisplay = `${days}j ${hours}h ${minutes}m`;
  }
  
  document.getElementById('giveawayTimeLeft').textContent = timeDisplay;
  document.getElementById('giveawayEndDate').textContent = endDate.toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  
  const photosCount = Array.isArray(currentGiveaway.photos) ? currentGiveaway.photos.length : 0;
  const participantCount = currentGiveaway.participantCount || 0;
  
  document.getElementById('giveawayPhotoCount').textContent = photosCount;
  document.getElementById('giveawayParticipantCount').textContent = participantCount;
  
  console.log('✅ Infos du giveaway affichées:', currentGiveaway.name);
}

/**
 * Sélectionner un giveaway
 */
async function selectGiveaway(giveawayId) {
  try {
    console.log(`🎯 Sélection du giveaway: ${giveawayId}`);
    
    if (!giveawayId) {
      console.error('❌ ID giveaway manquant');
      alert('Erreur: ID giveaway manquant');
      return;
    }
    
    const url = `${GIVEAWAYS_API}/${giveawayId}`;
    console.log(`📡 Appel API: ${url}`);
    
    const response = await fetch(url);
    console.log(`📊 Status: ${response.status}`);
    
    const data = await response.json();
    console.log('✅ Réponse API giveaway:', data);

    if (data.success && data.data && data.data.giveaway) {
      currentGiveaway = data.data.giveaway;
      giveawayPhotos = Array.isArray(data.data.giveaway.photos) ? data.data.giveaway.photos : [];
      
      console.log(`✅ Giveaway chargé: "${currentGiveaway.name}"`);
      console.log(`✅ Photos reçues: ${giveawayPhotos.length}`);
      giveawayPhotos.forEach((p, i) => {
        console.log(`  [${i}] Photo ID: ${p._id || p.id}`);
      });
      
      // Fermer la modal
      const modal = document.getElementById('selectGiveawayModal');
      if (modal) {
        modal.classList.add('hidden');
      }
      
      // Afficher les photos du giveaway
      displayPublicGiveawayPhotos();
      
      // Afficher les infos du giveaway
      displayGiveawayInfo();
      
      // Charger les participants du NOUVEAU giveaway
      await updateStats();
      
      // Activer le formulaire de participation
      updateFormState();
      
      // Masquer le message "Sélectionnez un giveaway"
      const warningMsg = document.getElementById('selectGiveawayFirstMessage');
      if (warningMsg) {
        warningMsg.style.display = 'none';
      }
      
      // Scroll vers la section infos
      const infoCard = document.getElementById('giveawayInfoSection');
      if (infoCard) {
        setTimeout(() => {
          infoCard.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
      
      // Recharger la liste des giveaways SANS réinitialiser currentGiveaway
      console.log('🔄 Rafraîchissement de la liste...');
      const response2 = await fetch(GIVEAWAYS_API);
      const data2 = await response2.json();
      if (data2.success && Array.isArray(data2.data.giveaways)) {
        allGiveaways = data2.data.giveaways;
        displayGiveawaySelector();
      }
    } else {
      console.error('❌ Réponse invalide:', data);
      alert(`Erreur: ${data.message || 'Giveaway non trouvé'}`);
    }
  } catch (error) {
    console.error('❌ Erreur lors de la sélection du giveaway:', error);
    alert('Erreur lors du chargement du giveaway');
  }
}

/**
 * Charger les photos du giveaway sélectionné
 */
async function loadGiveawayPhotosForSelected() {
  if (currentGiveaway && currentGiveaway.photos && currentGiveaway.photos.length > 0) {
    giveawayPhotos = currentGiveaway.photos;
    displayPublicGiveawayPhotos();
  }
}
/**
 * FONCTION DE DEBUG: Créer un giveaway de test
 */
async function createTestGiveaway() {
  console.log('Création d\'un giveaway de test...');
  
  const response = await fetch(GIVEAWAYS_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      name: 'Test Giveaway ' + new Date().getTime(),
      description: 'Ceci est un giveaway de test',
      durationDays: 1,
      durationHours: 0,
    }),
  });
  
  const data = await response.json();
  console.log('Réponse giveaway test:', data);
  
  if (data.success) {
    await loadGiveaways();
  }
}

// Exposer en window pour accés console
window.createTestGiveaway = createTestGiveaway;

// Fonction pour afficher tous les giveaways en console
const createGiveawayBtn = document.getElementById('createGiveawayBtn');
if (createGiveawayBtn) {
  createGiveawayBtn.addEventListener('click', async () => {
    const name = document.getElementById('giveawayName').value.trim();
    const description = document.getElementById('giveawayDesc').value.trim();
    const days = parseInt(document.getElementById('giveawayDays').value) || 0;
    const hours = parseInt(document.getElementById('giveawayHours').value) || 0;
    const files = document.getElementById('giveawayPhotosInput').files;
    const message = document.getElementById('createGiveawayMessage');

  if (!adminToken) {
    message.textContent = '❌ Vous devez être connecté comme admin';
    message.className = 'message-box error';
    return;
  }

  if (!name) {
    message.textContent = '❌ Le nom est requis';
    message.className = 'message-box error';
    return;
  }

  if (days === 0 && hours === 0) {
    message.textContent = '❌ Durée requise (au moins 1 heure)';
    message.className = 'message-box error';
    return;
  }

  try {
    console.log('📝 Création du giveaway...');
    console.log(`📋 Token admin: ${adminToken ? '✅ Présent' : '❌ Manquant'}`);
    
    // Créer le giveaway
    const giveawayResponse = await fetch(GIVEAWAYS_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        name,
        description,
        durationDays: days,
        durationHours: hours,
      }),
    });

    const giveawayData = await giveawayResponse.json();

    console.log(`📡 Réponse serveur: ${giveawayResponse.status}`, giveawayData);

    if (!giveawayResponse.ok || !giveawayData.success) {
      message.textContent = `❌ ${giveawayData.message || 'Erreur lors de la création'}`;
      message.className = 'message-box error';
      console.error('❌ Erreur créationGiveaway:', giveawayData);
      return;
    }

    console.log('✅ Giveaway créé:', giveawayData.data.giveaway._id);
    
    // Uploader les photos si présentes
    if (files && files.length > 0) {
      console.log(`📸 Upload de ${files.length} photo(s)...`);
      
      const giveawayId = giveawayData.data.giveaway._id;
      
      for (let i = 0; i < Math.min(files.length, 5); i++) {
        const file = files[i];
        const reader = new FileReader();
        
        reader.onload = async (e) => {
          try {
            const base64 = e.target.result;
            
            const photoResponse = await fetch('/api/giveaway/photos', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${adminToken}`,
              },
              body: JSON.stringify({
                image: base64,
                giveawayId: giveawayId,
              }),
            });
            
            const photoData = await photoResponse.json();
            
            if (photoData.success) {
              console.log(`✅ Photo ${i + 1}/${files.length} uploadée`);
            } else {
              console.error(`❌ Erreur photo ${i + 1}:`, photoData.message);
            }
          } catch (error) {
            console.error('❌ Erreur upload photo:', error);
          }
        };
        
        reader.readAsDataURL(file);
      }
      
      // Attendre un peu que les uploads se terminent
      setTimeout(() => {
        message.textContent = '✅ Giveaway créé avec photos!';
        message.className = 'message-box success';
        
        // Réinitialiser le formulaire
        document.getElementById('giveawayName').value = '';
        document.getElementById('giveawayDesc').value = '';
        document.getElementById('giveawayDays').value = '0';
        document.getElementById('giveawayHours').value = '0';
        document.getElementById('giveawayPhotosInput').value = '';
        
        setTimeout(() => {
          document.getElementById('createGiveawayModal').classList.add('hidden');
          loadGiveaways();
        }, 1000);
      }, 500);
    } else {
      message.textContent = '✅ Giveaway créé (sans photos)';
      message.className = 'message-box success';

      // Réinitialiser le formulaire
      document.getElementById('giveawayName').value = '';
      document.getElementById('giveawayDesc').value = '';
      document.getElementById('giveawayDays').value = '0';
      document.getElementById('giveawayHours').value = '0';
      document.getElementById('giveawayPhotosInput').value = '';

      // Fermer la modale après 2 secondes
      setTimeout(() => {
        document.getElementById('createGiveawayModal').classList.add('hidden');
        loadGiveaways();
      }, 2000);
    }
  } catch (error) {
    console.error('❌ Erreur:', error);
    message.textContent = '❌ Erreur de création';
    message.className = 'message-box error';
  }
  });
} else {
  console.warn('⚠️ Bouton createGiveawayBtn non trouvé');
}

// Fermer les modales de giveaway
document.getElementById('closeCreateGiveawayModal')?.addEventListener('click', () => {
  document.getElementById('createGiveawayModal').classList.add('hidden');
});

document.getElementById('cancelCreateGiveawayBtn')?.addEventListener('click', () => {
  document.getElementById('createGiveawayModal').classList.add('hidden');
});

/**
 * Créer un nouveau giveaway
 */
document.getElementById('createGiveawaySubmitBtn')?.addEventListener('click', async () => {
  const name = document.getElementById('giveawayName').value.trim();
  const description = document.getElementById('giveawayDesc').value.trim();
  const days = parseInt(document.getElementById('giveawayDays').value) || 0;
  const hours = parseInt(document.getElementById('giveawayHours').value) || 0;
  const files = document.getElementById('giveawayPhotosInput').files;
  const messageBox = document.getElementById('createGiveawayMessage');

  if (!name) {
    messageBox.textContent = '❌ Le nom du giveaway est requis';
    messageBox.className = 'message-box error';
    return;
  }

  if (days === 0 && hours === 0) {
    messageBox.textContent = '❌ La durée doit être supérieure à 0';
    messageBox.className = 'message-box error';
    return;
  }

  try {
    setLoading(true);
    
    const response = await fetch(GIVEAWAYS_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        name,
        description,
        durationDays: days,
        durationHours: hours,
      }),
    });

    const data = await response.json();
    setLoading(false);

    if (!response.ok || !data.success) {
      messageBox.textContent = data.message || '❌ Erreur lors de la création';
      messageBox.className = 'message-box error';
      return;
    }

    messageBox.textContent = '✅ Giveaway créé avec succès!';
    messageBox.className = 'message-box success';
    
    const giveawayId = data.data.giveaway._id;
    console.log(`✅ Giveaway créé: ${giveawayId}`);

    // Uploader les photos si présentes
    if (files && files.length > 0) {
      console.log(`📸 Upload de ${files.length} photo(s)...`);
      messageBox.textContent = `⏳ Upload de ${files.length} photo(s)...`;
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const reader = new FileReader();
        
        reader.onload = async (e) => {
          try {
            const base64 = e.target.result;
            
            const photoResponse = await fetch('/api/giveaway/photos', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${adminToken}`,
              },
              body: JSON.stringify({
                image: base64,
                giveawayId: giveawayId,
              }),
            });
            
            const photoData = await photoResponse.json();
            
            if (photoData.success) {
              console.log(`✅ Photo ${i + 1}/${files.length} uploadée`);
              messageBox.textContent = `⏳ Photo ${i + 1}/${files.length} uploadée...`;
            } else {
              console.error(`❌ Erreur photo ${i + 1}:`, photoData.message);
            }
          } catch (error) {
            console.error('❌ Erreur upload photo:', error);
          }
        };
        
        reader.readAsDataURL(file);
      }
      
      // Attendre un peu et fermer la modale
      setTimeout(() => {
        messageBox.textContent = '✅ Giveaway créé avec photos!';
        messageBox.className = 'message-box success';
        
        // Réinitialiser le formulaire
        document.getElementById('giveawayName').value = '';
        document.getElementById('giveawayDesc').value = '';
        document.getElementById('giveawayDays').value = '0';
        document.getElementById('giveawayHours').value = '0';
        document.getElementById('giveawayPhotosInput').value = '';

        // Fermer la modale après 2 secondes
        setTimeout(() => {
          document.getElementById('createGiveawayModal').classList.add('hidden');
          loadGiveaways();
        }, 2000);
      }, 500);
    } else {
      messageBox.textContent = '✅ Giveaway créé (sans photos)';
      messageBox.className = 'message-box success';

      // Réinitialiser le formulaire
      document.getElementById('giveawayName').value = '';
      document.getElementById('giveawayDesc').value = '';
      document.getElementById('giveawayDays').value = '0';
      document.getElementById('giveawayHours').value = '0';
      document.getElementById('giveawayPhotosInput').value = '';

      // Fermer la modale après 2 secondes
      setTimeout(() => {
        document.getElementById('createGiveawayModal').classList.add('hidden');
        loadGiveaways();
      }, 2000);
    }
  } catch (error) {
    setLoading(false);
    console.error('Erreur:', error);
    messageBox.textContent = '❌ Erreur de connexion';
    messageBox.className = 'message-box error';
  }
});

// Event listener global pour fermer les modales via le bouton X
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-close')) {
    console.log('❌ Bouton .modal-close cliqué');
    const modal = e.target.closest('.modal');
    if (modal) {
      console.log('Fermeture de la modale:', modal.id);
      modal.classList.add('hidden');
    }
  }
});

// Autres event listeners seront attachés par attachEventListeners()


// Bouton pour retourner (retirer la sélection)
const clearGiveawayBtn = document.getElementById('clearGiveawayBtn');
if (clearGiveawayBtn) {
  clearGiveawayBtn.addEventListener('click', () => {
    console.log('🔄 Retour à la liste des giveaways');
    currentGiveaway = null;
    giveawayPhotos = [];
    document.getElementById('giveawayInfoSection').classList.add('hidden');
    document.getElementById('photosSection').classList.add('hidden');
    
    // Afficher le message "Sélectionnez un giveaway"
    const warningMsg = document.getElementById('selectGiveawayFirstMessage');
    if (warningMsg) {
      warningMsg.style.display = 'block';
    }
    
    // Désactiver le formulaire de participation
    updateFormState();
    
    // Scroll vers le haut
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

// ===========================
// FERMETURE DES MODALES
// ===========================

// Fermer giveaway details modal
const closeGiveawayDetailsBtn = document.getElementById('closeGiveawayDetailsModal');
if (closeGiveawayDetailsBtn) {
  closeGiveawayDetailsBtn.addEventListener('click', () => {
    document.getElementById('giveawayDetailsModal').classList.add('hidden');
  });
}

// Fermer admin modal - bouton X
const closeAdminModalBtn = document.getElementById('closeAdminModalBtn');
if (closeAdminModalBtn) {
  closeAdminModalBtn.addEventListener('click', closeAdminModal);
}

// Fermer admin modal - bouton Annuler
const adminCancelBtn = document.getElementById('adminCancelBtn');
if (adminCancelBtn) {
  adminCancelBtn.addEventListener('click', closeAdminModal);
}

// Fermer toutes les modales en cliquant sur le fond (modal-bg)
document.addEventListener('click', (e) => {
  // Vérifier que c'est bien le fond (modal-bg) et non un bouton ou input
  if (e.target.classList && e.target.classList.contains('modal-bg')) {
    const modal = e.target.closest('.modal');
    if (modal) {
      modal.classList.add('hidden');
    }
  }
});

// ===========================
// INITIALISATION
// ===========================

console.log('🚀 Script app.js chargé');

function initializeApp() {
  console.log('📱 Initialisation de l\'application...');
  
  // Exécuter tous les pending listeners
  pendingListeners.forEach(listener => listener());
  pendingListeners.length = 0;
  
  // Masquer les sections au démarrage (aucun giveaway sélectionné)
  document.getElementById('participantsSection')?.classList.add('hidden');
  document.getElementById('rouletteSection')?.classList.add('hidden');
  document.getElementById('statsSection')?.classList.add('hidden');
  
  // Charger les giveaways et gagnants au démarrage
  loadGiveaways().catch(e => console.error('Erreur loadGiveaways:', e));
  loadWinners().catch(e => console.error('Erreur loadWinners:', e));

  // Initialiser l'état du formulaire
  updateFormState();

  // Afficher le message initial
  const warningMsg = document.getElementById('selectGiveawayFirstMessage');
  if (warningMsg) {
    warningMsg.style.display = 'block';
  }
  
  console.log('✅ Application initialisée');
}

// Attendre le chargement du DOM
if (document.readyState === 'loading') {
  console.log('⏳ Attente du chargement du DOM...');
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  console.log('⚡ DOM déjà chargé, initialisation immédiate');
  initializeApp();
}


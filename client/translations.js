const translations = {
  fr: {
    // Header & Navigation
    title: 'Dragon Ball Giveaway',
    selectGiveaway: 'Sélectionner un Giveaway',
    giveawayInfo: 'Infos du Giveaway',
    uploadPhotos: 'Télécharger des Photos',
    language: 'Langue',
    french: 'Français',
    english: 'English',

    // Giveaway Selection
    noGiveaways: 'Aucun giveaway actif',
    createNew: 'Créer un nouveau giveaway',
    giveawayName: 'Nom du giveaway',
    giveawayDescription: 'Description',
    duration: 'Durée',
    days: 'jours',
    hours: 'heures',
    startGiveaway: 'Lancer le giveaway',
    resetGiveaway: 'Nouvelle Roulette',
    participants: 'Participants',
    winners: 'Gagnants',
    endDate: 'Fin prévue',

    // Photos
    uploadPhotosTitle: 'Ajouter des Photos',
    dragAndDrop: 'Glissez les photos ou cliquez',
    maxPhotos: 'Max 10 photos',
    deletePhoto: 'Supprimer',
    noPhotos: 'Aucune photo téléchargée',

    // Participation
    participateButton: 'Participer',
    discordLoginRequired: 'Connexion Discord requise',
    loginWithDiscord: 'Se connecter avec Discord',
    participationSuccess: 'Participation enregistrée!',
    participationError: 'Erreur lors de la participation',
    alreadyParticipated: 'Vous avez déjà participé à ce giveaway',
    nextAllowed: 'Vous pourrez reparticiper dans',
    minutes: 'minutes',
    hours: 'heures',

    // Roulette/Wheel
    spinWheel: 'Tourner la Roue',
    selectWinner: 'Sélectionner un Gagnant',
    winner: 'GAGNANT!',
    winnerAnnounced: 'Le gagnant a été annoncé!',
    noParticipants: 'Aucun participant pour tirer un gagnant',

    // Winners History
    winnersHistory: 'Historique des Gagnants',
    noWinners: 'Aucun gagnant pour le moment',
    date: 'Date',
    rank: 'Rang',

    // Messages
    success: 'Succès',
    error: 'Erreur',
    loading: 'Chargement...',
    deleteConfirm: 'Êtes-vous sûr de vouloir supprimer ce giveaway?',
    deleteSuccess: 'Giveaway supprimé avec succès',
    deleteError: 'Erreur lors de la suppression',
    updateSuccess: 'Giveaway mis à jour',
    updateError: 'Erreur lors de la mise à jour',

    // Status
    active: 'Actif',
    paused: 'Pausé',
    completed: 'Terminé',
    upcoming: 'À venir',

    // Admin
    adminPanel: 'Panneau Admin',
    adminPassword: 'Mot de passe admin',
    login: 'Connexion',
    logout: 'Déconnexion',
    loginError: 'Mot de passe incorrect',
  },
  en: {
    // Header & Navigation
    title: 'Dragon Ball Giveaway',
    selectGiveaway: 'Select a Giveaway',
    giveawayInfo: 'Giveaway Info',
    uploadPhotos: 'Upload Photos',
    language: 'Language',
    french: 'Français',
    english: 'English',

    // Giveaway Selection
    noGiveaways: 'No active giveaways',
    createNew: 'Create a new giveaway',
    giveawayName: 'Giveaway name',
    giveawayDescription: 'Description',
    duration: 'Duration',
    days: 'days',
    hours: 'hours',
    startGiveaway: 'Start giveaway',
    resetGiveaway: 'New Wheel',
    participants: 'Participants',
    winners: 'Winners',
    endDate: 'Expected end',

    // Photos
    uploadPhotosTitle: 'Add Photos',
    dragAndDrop: 'Drag photos here or click',
    maxPhotos: 'Max 10 photos',
    deletePhoto: 'Delete',
    noPhotos: 'No photos uploaded',

    // Participation
    participateButton: 'Participate',
    discordLoginRequired: 'Discord login required',
    loginWithDiscord: 'Login with Discord',
    participationSuccess: 'Participation registered!',
    participationError: 'Error during participation',
    alreadyParticipated: 'You have already participated in this giveaway',
    nextAllowed: 'You can participate again in',
    minutes: 'minutes',
    hours: 'hours',

    // Roulette/Wheel
    spinWheel: 'Spin the Wheel',
    selectWinner: 'Select a Winner',
    winner: 'WINNER!',
    winnerAnnounced: 'The winner has been announced!',
    noParticipants: 'No participants to draw a winner',

    // Winners History
    winnersHistory: 'Winners History',
    noWinners: 'No winners yet',
    date: 'Date',
    rank: 'Rank',

    // Messages
    success: 'Success',
    error: 'Error',
    loading: 'Loading...',
    deleteConfirm: 'Are you sure you want to delete this giveaway?',
    deleteSuccess: 'Giveaway deleted successfully',
    deleteError: 'Error deleting giveaway',
    updateSuccess: 'Giveaway updated',
    updateError: 'Error updating giveaway',

    // Status
    active: 'Active',
    paused: 'Paused',
    completed: 'Completed',
    upcoming: 'Upcoming',

    // Admin
    adminPanel: 'Admin Panel',
    adminPassword: 'Admin password',
    login: 'Login',
    logout: 'Logout',
    loginError: 'Incorrect password',
  },
};

/**
 * Obtenir la traduction pour une clé
 */
function t(key, lang = 'fr') {
  return translations[lang]?.[key] || key;
}

/**
 * Initialiser le système de langue
 */
function initLanguage() {
  // Récupérer la langue du localStorage ou utiliser le français par défaut
  let currentLang = localStorage.getItem('language') || 'fr';
  window.currentLanguage = currentLang;
  
  // Ajouter la langue au body pour les styles CSS
  document.documentElement.lang = currentLang;
  
  return currentLang;
}

/**
 * Changer la langue
 */
function setLanguage(lang) {
  if (!translations[lang]) {
    console.warn(`Language ${lang} not supported`);
    return;
  }
  
  window.currentLanguage = lang;
  localStorage.setItem('language', lang);
  document.documentElement.lang = lang;
  
  // Émettre un événement pour que les autres scripts sachent que la langue a changé
  window.dispatchEvent(new CustomEvent('languageChanged', { detail: { language: lang } }));
  
  // Recharger la page pour appliquer les traductions
  location.reload();
}

/**
 * Traduire tout le contenu texte de la page
 */
function translatePage() {
  const lang = window.currentLanguage || 'fr';
  
  document.querySelectorAll('[data-i18n]').forEach(element => {
    const key = element.getAttribute('data-i18n');
    element.textContent = t(key, lang);
  });

  document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
    const key = element.getAttribute('data-i18n-placeholder');
    element.placeholder = t(key, lang);
  });

  document.querySelectorAll('[data-i18n-title]').forEach(element => {
    const key = element.getAttribute('data-i18n-title');
    element.title = t(key, lang);
  });

  document.querySelectorAll('[data-i18n-value]').forEach(element => {
    const key = element.getAttribute('data-i18n-value');
    element.value = t(key, lang);
  });
}

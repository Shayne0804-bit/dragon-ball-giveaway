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
    admin: 'Admin',
    createGiveaway: 'Créer un Giveaway',
    giveawayPhotos: 'Photos du Giveaway',
    noPhotosAvailable: 'Aucune photo disponible',
    participateButton: 'Participer Maintenant',
    connected: 'Connecté',
    selectGiveawayFirst: 'Sélectionnez d\'abord un giveaway',
    noParticipants: 'Aucun participant',
    spinWheel: 'Lancer la Roulette',
    winner: 'GAGNANT!',
    newWheel: 'Nouvelle Roulette',
    statistics: 'Statistiques',
    timeRemaining: 'Temps Restant',
    endDate: 'Fin',
    photoCount: 'Photos',
    participantsCount: 'Participants',
    winners: 'Gagnants',
    winnersHistory: 'Historique des Gagnants',
    noWinnersYet: 'Aucun gagnant pour le moment',
    manageAdmin: 'Gestion Admin',
    createNewGiveaway: 'Créer Giveaway',
    selectGiveawayAdm: 'Sélectionner',
    giveawayDetails: 'Détails du Giveaway',
    accessDenied: 'Accès Refusé',
    youNeedServer: 'Vous avez besoin d\'accès au serveur Discord pour participer',
    selectGiveawayModal: 'Sélectionner un Giveaway',
    noGiveawaysAvailable: 'Aucun giveaway disponible',
    createNewModal: 'Créer un Giveaway',
    selectPhotos: 'Sélectionner les photos',
    optional: '(optionnel)',
    dragPhotosHere: 'Vous pouvez sélectionner plusieurs images',
    create: 'Créer',
    adminLogin: 'Connexion Admin',
    password: 'Mot de passe',
    connect: 'Se Connecter',
    uploadInProgress: 'Upload en cours...',
    previous: '← Précédent',
    next: 'Suivant →',

    // Shop
    shop: 'Boutique',
    availableItems: 'Articles Disponibles',
    shoppingCart: 'Panier',
    emptyCart: 'Votre panier est vide',
    continueShopping: '← Continuer',
    buy: '💳 Acheter',
    select: '➕ Sélectionner',
    outOfStock: '❌ Rupture',
    unlimited: 'Stock Illimité',
    inStock: '✓ En Stock',
    remaining: 'Restant',
    clear: '🗑️ Vider',
    total: 'Total',
    orderConfirmed: '🎉 Commande confirmée!',
    mustLoginDiscord: '❌ Vous devez vous connecter via Discord pour acheter',
    emptyCartError: 'Votre panier est vide',
    adminManagement: 'Gestion de la Boutique',
    addItem: '➕ Ajouter Article',
    editItem: '✏️ Éditer',
    deleteItem: '🗑️ Supprimer',
    addArticle: 'Ajouter un Article',
    editArticle: 'Modifier l\'Article',
    itemName: 'Nom du produit',
    itemDescription: 'Description (optionnel)',
    itemPrice: 'Prix',
    itemCategory: 'Catégorie (ex: Divers)',
    selectImage: 'Sélectionner une image',
    itemQuantity: 'Quantité (laisser vide = illimité)',
    accountId: 'ID Compte (ex: ACC001)',
    accountDetails: 'Détails du compte (optionnel)',
    cancel: 'Annuler',
    save: 'Sauvegarder',
    confirmDelete: 'Confirmer la suppression',
    deleteMessage: 'Êtes-vous sûr de vouloir supprimer cet article?',
    confirm: 'Confirmer',
    noItems: 'Aucun article disponible pour le moment',
    noItemsManagement: 'Aucun article ajouté',
    name: 'Nom',
    description: 'Description',
    price: 'Prix',
    category: 'Catégorie',
    stock: 'Stock',
    actions: 'Actions',
    management: 'Gestion des Articles',
    itemNamePlaceholder: 'Nom du produit',
    itemDescriptionPlaceholder: 'Description (optionnel)',
    itemPricePlaceholder: 'Prix',
    itemQuantityPlaceholder: 'Quantité (laisser vide = illimité)',
    accountIdPlaceholder: 'ID Compte (ex: ACC001)',
    accountDetailsPlaceholder: 'Détails du compte (optionnel)',
    categoryPlaceholder: 'Catégorie (ex: Divers)',
    imageFormat: 'Format: JPG, PNG (max 5MB)',
    deleteConfirmMessage: 'Êtes-vous sûr de vouloir supprimer cet article?',
    delete: 'Supprimer',
    currency: 'Devise',
    EUR: 'EUR €',
    USD: 'USD $',
    FCFA: 'FCFA',
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
    admin: 'Admin',
    createGiveaway: 'Create Giveaway',
    giveawayPhotos: 'Giveaway Photos',
    noPhotosAvailable: 'No photos available',
    participateButton: 'Participate Now',
    connected: 'Connected',
    selectGiveawayFirst: 'Please select a giveaway first',
    noParticipants: 'No participants',
    spinWheel: 'Spin the Wheel',
    winner: 'WINNER!',
    newWheel: 'New Wheel',
    statistics: 'Statistics',
    timeRemaining: 'Time Remaining',
    endDate: 'End',
    photoCount: 'Photos',
    participantsCount: 'Participants',
    winners: 'Winners',
    winnersHistory: 'Winners History',
    noWinnersYet: 'No winners yet',
    manageAdmin: 'Admin Management',
    createNewGiveaway: 'Create Giveaway',
    selectGiveawayAdm: 'Select',
    giveawayDetails: 'Giveaway Details',
    accessDenied: 'Access Denied',
    youNeedServer: 'You need access to the Discord server to participate',
    selectGiveawayModal: 'Select a Giveaway',
    noGiveawaysAvailable: 'No giveaways available',
    createNewModal: 'Create a Giveaway',
    selectPhotos: 'Select photos',
    optional: '(optional)',
    dragPhotosHere: 'You can select multiple images',
    create: 'Create',
    adminLogin: 'Admin Login',
    password: 'Password',
    connect: 'Login',
    uploadInProgress: 'Upload in progress...',
    previous: '← Previous',
    next: 'Next →',

    // Shop
    shop: 'Shop',
    availableItems: 'Available Items',
    shoppingCart: 'Shopping Cart',
    emptyCart: 'Your cart is empty',
    continueShopping: '← Continue',
    buy: '💳 Buy',
    select: '➕ Select',
    outOfStock: '❌ Out of Stock',
    unlimited: 'Unlimited Stock',
    inStock: '✓ In Stock',
    remaining: 'Remaining',
    clear: '🗑️ Clear',
    total: 'Total',
    orderConfirmed: '🎉 Order confirmed!',
    mustLoginDiscord: '❌ You must login via Discord to purchase',
    emptyCartError: 'Your cart is empty',
    adminManagement: 'Shop Management',
    addItem: '➕ Add Item',
    editItem: '✏️ Edit',
    deleteItem: '🗑️ Delete',
    addArticle: 'Add an Item',
    editArticle: 'Edit Item',
    itemName: 'Product name',
    itemDescription: 'Description (optional)',
    itemPrice: 'Price',
    itemCategory: 'Category (ex: Miscellaneous)',
    selectImage: 'Select an image',
    itemQuantity: 'Quantity (leave empty = unlimited)',
    accountId: 'Account ID (ex: ACC001)',
    accountDetails: 'Account details (optional)',
    cancel: 'Cancel',
    save: 'Save',
    confirmDelete: 'Confirm deletion',
    deleteMessage: 'Are you sure you want to delete this item?',
    confirm: 'Confirm',
    noItems: 'No items available at the moment',
    noItemsManagement: 'No items added',
    name: 'Name',
    description: 'Description',
    price: 'Price',
    category: 'Category',
    stock: 'Stock',
    actions: 'Actions',
    management: 'Item Management',
    itemNamePlaceholder: 'Product name',
    itemDescriptionPlaceholder: 'Description (optional)',
    itemPricePlaceholder: 'Price',
    itemQuantityPlaceholder: 'Quantity (leave empty = unlimited)',
    accountIdPlaceholder: 'Account ID (ex: ACC001)',
    accountDetailsPlaceholder: 'Account details (optional)',
    categoryPlaceholder: 'Category (ex: Miscellaneous)',
    imageFormat: 'Format: JPG, PNG (max 5MB)',
    deleteConfirmMessage: 'Are you sure you want to delete this item?',
    delete: 'Delete',
    currency: 'Currency',
    EUR: 'EUR €',
    USD: 'USD $',
    FCFA: 'FCFA',
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
  
  console.log(`[i18n] Changement de langue vers: ${lang}`);
  translatePage();
  
  // Émettre un événement pour que les autres scripts sachent que la langue a changé
  window.dispatchEvent(new CustomEvent('languageChanged', { detail: { language: lang } }));
}

/**
 * Traduire tout le contenu texte de la page
 */
function translatePage() {
  const lang = window.currentLanguage || 'fr';
  
  // Traduire les éléments avec data-i18n
  document.querySelectorAll('[data-i18n]').forEach(element => {
    const key = element.getAttribute('data-i18n');
    const translation = t(key, lang);
    
    if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
      element.placeholder = translation;
    } else if (element.tagName === 'BUTTON') {
      // Pour les boutons, préserver les icônes/emojis avant le texte
      const textContent = element.textContent.trim();
      // Chercher si le bouton commence par une icône/emoji
      const emojiMatch = textContent.match(/^[\s\p{Emoji_Presentation}]+/u);
      if (emojiMatch) {
        element.textContent = emojiMatch[0] + translation;
      } else {
        element.textContent = translation;
      }
    } else {
      element.textContent = translation;
    }
  });

  // Traduire les placeholders
  document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
    const key = element.getAttribute('data-i18n-placeholder');
    element.placeholder = t(key, lang);
  });

  // Traduire les titles
  document.querySelectorAll('[data-i18n-title]').forEach(element => {
    const key = element.getAttribute('data-i18n-title');
    element.title = t(key, lang);
  });

  // Traduire les values (pour buttons avec textContent)
  document.querySelectorAll('[data-i18n-value]').forEach(element => {
    const key = element.getAttribute('data-i18n-value');
    const translation = t(key, lang);
    // Préserver les icônes comme pour les buttons
    const textContent = element.textContent.trim();
    const emojiMatch = textContent.match(/^[\s\p{Emoji_Presentation}]+/u);
    if (emojiMatch) {
      element.textContent = emojiMatch[0] + translation;
    } else {
      element.textContent = translation;
    }
  });

  console.log(`[i18n] Page traduite en ${lang}`);
}


// === Gestion globale du s�lecteur de langue ===
window.initLanguageSelector = function() {
  const languageSelector = document.getElementById('languageSelector');
  if (!languageSelector) return;
  
  // R�cup�rer la langue depuis l'URL
  const urlParams = new URLSearchParams(window.location.search);
  const currentLang = urlParams.get('lang') || window.currentLanguage || 'fr';
  languageSelector.value = currentLang;
  
  // Listener pour le changement
  languageSelector.addEventListener('change', (e) => {
    const newLang = e.target.value;
    // Ajouter le param lang � l'URL
    const url = new URL(window.location);
    url.searchParams.set('lang', newLang);
    window.history.pushState({}, '', url);
    
    // Appliquer la traduction
    window.currentLanguage = newLang;
    if (typeof setLanguage === 'function') {
      setLanguage(newLang);
    }
    if (typeof applyTranslation === 'function') {
      applyTranslation(newLang);
    }
  });
};

// Initialiser la langue au chargement
initLanguage();

// Auto-init au chargement
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', window.initLanguageSelector);
} else {
  window.initLanguageSelector();
}


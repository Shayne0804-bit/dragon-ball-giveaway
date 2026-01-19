/**
 * Shop.js - Gestion de la boutique (Achat/Divers)
 * Permet aux utilisateurs de voir les articles et aux admins de les gérer
 */

// Configuration
const API_URL = '/api/shop';
const ADMIN_API_URL = '/api/admin';
let shopAdminToken = null; // Pas de sauvegarde localStorage - spécifique à la boutique
let isShopAdmin = false; // Admin boutique - isolé des autres pages

// Conversion de devises (taux de change)
const CURRENCY_RATES = {
  eur: 1.0,      // Devise de base
  usd: 1.086,    // 1 EUR = 1.086 USD (630 FCFA / 580 FCFA)
  fcfa: 630,     // 1 EUR = 630 FCFA
};

const CURRENCY_SYMBOLS = {
  eur: '€',
  usd: '$',
  fcfa: 'FCFA',
};

// Variables globales
let allShopItems = [];
let currentEditingItem = null;
let cartItems = []; // Panier des articles sélectionnés
let currentCurrency = 'eur'; // Devise par défaut (pas de localStorage)
let currentDiscordUser = null; // Utilisateur Discord connecté

// Gallery
let currentGalleryItem = null;
let currentGalleryIndex = 0;

// ===========================
// INITIALISATION
// ===========================

document.addEventListener('DOMContentLoaded', async () => {
  console.log('[SHOP] Initialisation de la page boutique');

  // Charger l'utilisateur Discord connecté
  await loadCurrentDiscordUser();

  // Initialiser le sélecteur de devise
  initCurrencySelector();

  // Charger les articles
  await loadShopItems();

  // Vérifier le statut admin
  checkAdminStatus();

  // Event listeners
  setupEventListeners();
});

// ===========================
// DISCORD USER
// ===========================

async function loadCurrentDiscordUser() {
  try {
    const response = await fetch('/api/auth/me');
    const data = await response.json();
    
    if (data.success && data.user) {
      currentDiscordUser = {
        id: data.user.id,
        username: data.user.username,
        avatar: data.user.avatar,
        discriminator: data.user.discriminator || '0',
      };
      console.log('[SHOP] ✓ Utilisateur Discord chargé:', currentDiscordUser.username);
    } else {
      currentDiscordUser = null;
      console.log('[SHOP] ℹ️ Aucun utilisateur Discord connecté');
    }
  } catch (error) {
    console.error('[SHOP] Erreur chargement utilisateur Discord:', error);
    currentDiscordUser = null;
  }
}// ===========================
// GESTION DES LANGUES
// ===========================

let currentLanguage = 'fr'; // Langue par défaut

function applyTranslation(lang = 'fr') {
  currentLanguage = lang;
  console.log('[SHOP] Traduction appliquée en:', lang);

  // Traduire tous les éléments avec l'attribut data-translate
  document.querySelectorAll('[data-translate]').forEach((element) => {
    const key = element.getAttribute('data-translate');
    const translation = t(key, lang);
    
    // Préserver les icônes au début du texte
    const currentText = element.textContent.trim();
    const emojiMatch = currentText.match(/^[\s\p{Emoji_Presentation}]+/u);
    
    if (emojiMatch) {
      element.textContent = emojiMatch[0] + translation;
    } else {
      element.textContent = translation;
    }
  });

  // Traduire les placeholders
  document.querySelectorAll('[data-translate-placeholder]').forEach((element) => {
    const key = element.getAttribute('data-translate-placeholder');
    element.placeholder = t(key, lang);
  });
}

// ===========================
// GESTION DES DEVISES
// ===========================

function initCurrencySelector() {
  const selector = document.getElementById('currencySelector');
  // Assurer que currentCurrency est bien défini à EUR
  currentCurrency = 'eur';
  selector.value = currentCurrency;
  console.log('[SHOP] Devise initialisée à:', currentCurrency);
  
  selector.addEventListener('change', (e) => {
    currentCurrency = e.target.value;
    console.log('[SHOP] Devise changée en:', currentCurrency);
    // Pas de sauvegarde localStorage - réinitialiser à EUR après rechargement
    renderShopItems();
    updateCart();
  });
}

function convertPrice(priceInEur) {
  const rate = CURRENCY_RATES[currentCurrency] || 1;
  return priceInEur * rate;
}

function formatPrice(priceInEur) {
  const converted = convertPrice(priceInEur);
  const symbol = CURRENCY_SYMBOLS[currentCurrency];
  
  if (currentCurrency === 'fcfa') {
    // FCFA sans décimales
    return `${Math.round(converted).toLocaleString('fr-FR')} ${symbol}`;
  } else {
    // EUR et USD avec 2 décimales
    return `${converted.toFixed(2).replace('.', ',')}${symbol}`;
  }
}

// ===========================
// GESTION DE LA GALERIE
// ===========================

function openItemGallery(itemId) {
  const item = allShopItems.find(i => i._id === itemId);
  if (!item) return;

  currentGalleryItem = item;
  currentGalleryIndex = 0;

  const modal = document.getElementById('galleryModal');
  const galleryItemName = document.getElementById('galleryItemName');
  const galleryTotal = document.getElementById('galleryTotal');

  galleryItemName.textContent = item.name;

  // Créer la liste d'images (image principale + galerie)
  const allImages = [item.image];
  if (item.gallery && Array.isArray(item.gallery)) {
    allImages.push(...item.gallery.map(g => g.data));
  }

  galleryTotal.textContent = allImages.length;

  // Générer les miniatures
  const thumbnailsContainer = document.getElementById('galleryThumbnails');
  thumbnailsContainer.innerHTML = allImages
    .map((img, idx) => `
      <img 
        class="gallery-thumbnail ${idx === 0 ? 'active' : ''}" 
        src="${img}" 
        alt="Photo ${idx + 1}"
        data-index="${idx}"
        onerror="this.src='assets/placeholder.png'"
      >
    `)
    .join('');

  // Event listeners pour les miniatures
  document.querySelectorAll('.gallery-thumbnail').forEach(thumb => {
    thumb.addEventListener('click', () => {
      currentGalleryIndex = parseInt(thumb.dataset.index);
      displayGalleryImage();
    });
  });

  // Afficher l'image
  displayGalleryImage();

  openModal('galleryModal');
}

function displayGalleryImage() {
  const item = currentGalleryItem;
  const galleryImage = document.getElementById('galleryImage');
  const galleryIndex = document.getElementById('galleryIndex');
  const allImages = [item.image];

  if (item.gallery && Array.isArray(item.gallery)) {
    allImages.push(...item.gallery.map(g => g.data));
  }

  // Mettre à jour l'image
  galleryImage.src = allImages[currentGalleryIndex];
  galleryIndex.textContent = currentGalleryIndex + 1;

  // Mettre à jour les miniatures
  document.querySelectorAll('.gallery-thumbnail').forEach((thumb, idx) => {
    thumb.classList.toggle('active', idx === currentGalleryIndex);
  });

  // Mettre à jour les boutons prev/next
  document.getElementById('galleryPrev').disabled = currentGalleryIndex === 0;
  document.getElementById('galleryNext').disabled = currentGalleryIndex === allImages.length - 1;
}

function nextGalleryImage() {
  if (!currentGalleryItem) return;
  const allImages = [currentGalleryItem.image];
  if (currentGalleryItem.gallery && Array.isArray(currentGalleryItem.gallery)) {
    allImages.push(...currentGalleryItem.gallery.map(g => g.data));
  }

  if (currentGalleryIndex < allImages.length - 1) {
    currentGalleryIndex++;
    displayGalleryImage();
  }
}

function prevGalleryImage() {
  if (currentGalleryIndex > 0) {
    currentGalleryIndex--;
    displayGalleryImage();
  }
}

// ===========================
// CHARGEMENT DES ARTICLES
// ===========================

async function loadShopItems() {
  try {
    const response = await fetch(`${API_URL}/items`);
    const data = await response.json();

    if (data.success) {
      allShopItems = data.data || [];
      renderShopItems();
    } else {
      showMessage('Erreur lors du chargement des articles', 'error');
    }
  } catch (error) {
    console.error('[SHOP] Erreur chargement articles:', error);
    showMessage('Erreur lors de la connexion au serveur', 'error');
  }
}

function renderShopItems() {
  const grid = document.getElementById('shopItemsGrid');
  const badge = document.getElementById('itemCountBadge');

  if (allShopItems.length === 0) {
    const emptyMessage = t('noItems', currentLanguage);
    grid.innerHTML = `<p class="empty-state">${emptyMessage}</p>`;
    if (badge) badge.textContent = '0 articles';
    return;
  }

  if (badge) badge.textContent = `${allShopItems.length} article${allShopItems.length > 1 ? 's' : ''}`;

  grid.innerHTML = allShopItems
    .sort((a, b) => a.order - b.order)
    .map(item => createShopItemCard(item))
    .join('');
}

function createShopItemCard(item) {
  const isOutOfStock = !item.inStock || (item.quantity !== null && item.quantity <= 0);
  const stockLevel = item.quantity;
  
  let stockBadge = '';
  if (isOutOfStock) {
    stockBadge = '<div class="stock-badge out">Stock Épuisé</div>';
  } else if (item.quantity === null) {
    stockBadge = '<div class="stock-badge">Stock Illimité</div>';
  } else if (stockLevel <= 2) {
    stockBadge = `<div class="stock-badge low">⚠️ ${stockLevel} Restant${stockLevel > 1 ? 's' : ''}</div>`;
  } else {
    stockBadge = `<div class="stock-badge">✓ En Stock</div>`;
  }

  let imageUrl;
  if (item.image.startsWith('data:') || item.image.startsWith('http')) {
    imageUrl = item.image;
  } else {
    imageUrl = item.image;
  }

  const accountBadge = item.accountId ? `<div class="cart-item-account">ID: ${escapeHtml(item.accountId)}</div>` : '';

  return `
    <div class="shop-item-card">
      ${stockBadge}
      <img src="${imageUrl}" alt="${item.name}" class="shop-item-image shop-item-clickable" data-item-id="${item._id}" style="cursor: pointer;" onerror="this.src='assets/placeholder.png'">
      <div class="shop-item-content">
        <div class="shop-item-category">${item.category}</div>
        <div class="shop-item-name">${escapeHtml(item.name)}</div>
        <div class="shop-item-description">${escapeHtml(item.description || 'Aucune description')}</div>
        ${accountBadge}
        <div class="shop-item-footer">
          <div class="shop-item-price">${formatPrice(item.price)}</div>
          <button class="btn-select-item" data-item-id="${item._id}" ${isOutOfStock ? 'disabled' : ''} style="
            padding: 8px 16px;
            background: ${isOutOfStock ? 'rgba(255, 107, 107, 0.2)' : 'rgba(255, 159, 0, 0.2)'};
            border: 2px solid ${isOutOfStock ? 'rgba(255, 107, 107, 0.4)' : 'rgba(255, 159, 0, 0.4)'};
            color: ${isOutOfStock ? 'var(--danger)' : 'var(--accent)'};
            border-radius: 8px;
            cursor: ${isOutOfStock ? 'not-allowed' : 'pointer'};
            font-weight: 600;
            transition: var(--transition-fast);
            font-size: 0.85rem;
            opacity: ${isOutOfStock ? '0.5' : '1'};
          ">
            ${isOutOfStock ? '❌ Rupture' : '➕ Sélectionner'}
          </button>
        </div>
      </div>
    </div>
  `;
}

// ===========================
// VÉRIFICATION DU STATUT ADMIN
// ===========================

function checkAdminStatus() {
  const adminSection = document.getElementById('adminShopSection');
  console.log('[SHOP] === Vérification statut admin ===');
  console.log('[SHOP] isShopAdmin:', isShopAdmin);
  console.log('[SHOP] shopAdminToken:', shopAdminToken ? '✓ Présent' : '✗ Absent');
  console.log('[SHOP] Élément adminShopSection existe:', !!adminSection);
  console.log('[SHOP] Classe hidden:', adminSection?.classList.contains('hidden'));
  
  if (isShopAdmin) {
    console.log('[SHOP] ✓ Admin actif - affichage de la section');
    adminSection.classList.remove('hidden');
    loadAdminShopItems();
  } else {
    console.log('[SHOP] ✗ Admin inactif - masquage de la section');
    adminSection.classList.add('hidden');
  }
}

async function loadAdminShopItems() {
  try {
    const response = await fetch(`${API_URL}/items`);
    const data = await response.json();

    if (data.success) {
      allShopItems = data.data || [];
      renderAdminTable();
    }
  } catch (error) {
    console.error('[SHOP] Erreur chargement admin:', error);
  }
}

function renderAdminTable() {
  const tbody = document.getElementById('adminShopTableBody');

  if (allShopItems.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; color: var(--gray);">Aucun article ajouté</td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = allShopItems
    .sort((a, b) => a.order - b.order)
    .map((item, index) => `
      <tr>
        <td>${escapeHtml(item.name)}</td>
        <td>${escapeHtml((item.description || '').substring(0, 50))}</td>
        <td>${formatPrice(item.price)}</td>
        <td>${item.category}</td>
        <td>${item.quantity === null ? 'Illimité' : item.quantity}</td>
        <td>
          <div class="admin-actions">
            <button class="btn-action btn-edit-item" data-item-id="${item._id}">✏️ Éditer</button>
            <button class="btn-action danger btn-delete-item" data-item-id="${item._id}" data-item-name="${escapeHtml(item.name)}">🗑️ Supprimer</button>
          </div>
        </td>
      </tr>
    `)
    .join('');

  // Ajouter les event listeners pour éditer/supprimer
  setTimeout(() => {
    document.querySelectorAll('.btn-edit-item').forEach(btn => {
      btn.addEventListener('click', (e) => {
        editItem(e.target.closest('button').dataset.itemId);
      });
    });
    
    document.querySelectorAll('.btn-delete-item').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const button = e.target.closest('button');
        deleteItem(button.dataset.itemId, button.dataset.itemName);
      });
    });
  }, 0);
}

// ===========================
// GESTION DES ARTICLES
// ===========================

async function addNewItem() {
  console.log('[SHOP] Clic sur "Ajouter Article"');
  currentEditingItem = null;
  const titleEl = document.getElementById('addEditItemTitle');
  titleEl.textContent = t('addItem', currentLanguage);
  titleEl.setAttribute('data-translate', 'addItem');
  document.getElementById('addEditItemForm').reset();
  document.getElementById('imagePreview').classList.add('hidden');
  document.getElementById('itemQuantity').value = '';
  openModal('addEditItemModal');
}

async function editItem(itemId) {
  const item = allShopItems.find(i => i._id === itemId);
  if (!item) {
    showMessage(t('error', currentLanguage), 'error');
    return;
  }

  currentEditingItem = item;
  const titleEl = document.getElementById('addEditItemTitle');
  titleEl.textContent = t('editArticle', currentLanguage);
  titleEl.removeAttribute('data-translate');

  // Remplir le formulaire
  document.getElementById('itemName').value = item.name;
  document.getElementById('itemDescription').value = item.description || '';
  document.getElementById('itemPrice').value = item.price;
  document.getElementById('itemCategory').value = item.category;
  document.getElementById('itemQuantity').value = item.quantity || '';
  document.getElementById('itemAccountId').value = item.accountId || '';
  document.getElementById('itemAccountDetails').value = item.accountDetails || '';

  // Afficher l'aperçu de l'image
  const preview = document.getElementById('imagePreview');
  const previewImg = document.getElementById('previewImage');
  previewImg.src = item.image;
  preview.classList.remove('hidden');

  // L'input file n'est pas obligatoire si on édite
  document.getElementById('itemImageInput').required = false;

  openModal('addEditItemModal');
}

async function deleteItem(itemId, itemName) {
  const modal = document.getElementById('deleteConfirmModal');
  const message = document.getElementById('deleteConfirmMessage');
  const baseMessage = t('deleteConfirmMessage', currentLanguage);
  // For simplicity, use just the base message since it includes the item confirmation
  message.textContent = baseMessage;
  message.removeAttribute('data-translate'); // Prevent re-translation from overriding our custom text

  document.getElementById('confirmDeleteBtn').onclick = async () => {
    await performDeleteItem(itemId);
  };

  openModal('deleteConfirmModal');
}

async function performDeleteItem(itemId) {
  try {
    showSpinner(true);

    const response = await fetch(`${API_URL}/items/${itemId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${shopAdminToken}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (data.success) {
      showMessage('Article supprimé avec succès!', 'success');
      closeModal('deleteConfirmModal');
      await loadAdminShopItems();
      renderAdminTable();
      renderShopItems();
    } else {
      showMessage(data.message || 'Erreur lors de la suppression', 'error');
    }
  } catch (error) {
    console.error('[SHOP] Erreur suppression:', error);
    showMessage('Erreur lors de la suppression de l\'article', 'error');
  } finally {
    showSpinner(false);
  }
}

async function submitItem() {
  const name = document.getElementById('itemName').value.trim();
  const description = document.getElementById('itemDescription').value.trim();
  const price = parseFloat(document.getElementById('itemPrice').value);
  const category = document.getElementById('itemCategory').value.trim();
  const quantity = document.getElementById('itemQuantity').value;
  const accountId = document.getElementById('itemAccountId').value.trim();
  const accountDetails = document.getElementById('itemAccountDetails').value.trim();
  const imageInput = document.getElementById('itemImageInput');

  // Validation
  if (!name || !price || isNaN(price) || price < 0) {
    showMessage('Veuillez remplir tous les champs obligatoires correctement', 'error');
    return;
  }

  if (!currentEditingItem && !imageInput.files.length) {
    showMessage('Veuillez sélectionner une image', 'error');
    return;
  }

  try {
    showSpinner(true);

    let image = null;
    if (imageInput.files.length) {
      image = await fileToBase64(imageInput.files[0]);
    } else {
      // Édition - garder l'image existante
      image = currentEditingItem.image;
    }

    const payload = {
      name,
      description,
      price,
      category,
      quantity: quantity ? parseInt(quantity) : null,
      image,
      imageMimetype: imageInput.files[0]?.type || 'image/jpeg',
      accountId: accountId || null,
      accountDetails: accountDetails || null,
    };

    const url = currentEditingItem 
      ? `${API_URL}/items/${currentEditingItem._id}`
      : `${API_URL}/items`;

    const method = currentEditingItem ? 'PUT' : 'POST';

    const response = await fetch(url, {
      method,
      headers: {
        'Authorization': `Bearer ${shopAdminToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (data.success) {
      const message = currentEditingItem 
        ? 'Article modifié avec succès!'
        : 'Article créé avec succès!';
      showMessage(message, 'success');
      closeModal('addEditItemModal');
      await loadAdminShopItems();
      renderAdminTable();
      renderShopItems();
    } else {
      showMessage(data.message || 'Erreur lors de l\'enregistrement', 'error');
    }
  } catch (error) {
    console.error('[SHOP] Erreur soumission:', error);
    showMessage('Erreur lors de l\'enregistrement de l\'article', 'error');
  } finally {
    showSpinner(false);
  }
}

// ===========================
// AUTHENTIFICATION ADMIN
// ===========================

async function loginAsAdmin() {
  const password = document.getElementById('shopAdminLoginPassword').value.trim();
  console.log('[SHOP] Tentative de connexion admin - mot de passe vide:', !password);

  if (!password) {
    showMessageInElement('shopAdminLoginMessage', 'Veuillez entrer votre mot de passe', 'error');
    return;
  }

  try {
    showSpinner(true);
    console.log('[SHOP] Envoi de la demande de connexion admin...');

    const response = await fetch('/api/auth/admin-login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ password }),
    });

    const data = await response.json();
    console.log('[SHOP] Réponse serveur:', data);

    if (data.success) {
      console.log('[SHOP] Connexion admin réussie!');
      shopAdminToken = data.token;
      // Pas de sauvegarde localStorage - session temporaire
      isShopAdmin = true;
      console.log('[SHOP] Variables définies - isShopAdmin:', isShopAdmin, 'shopAdminToken:', shopAdminToken ? '✓' : '✗');

      showMessageInElement('shopAdminLoginMessage', 'Connexion réussie!', 'success');
      setTimeout(() => {
        console.log('[SHOP] ⏱️ Après 1s - isShopAdmin:', isShopAdmin, 'shopAdminToken:', shopAdminToken ? '✓' : '✗');
        closeModal('shopAdminLoginModal');
        checkAdminStatus();
        loadAdminShopItems();
      }, 1000);
    } else {
      console.log('[SHOP] Connexion échouée:', data.message);
      showMessageInElement('shopAdminLoginMessage', data.message || 'Mot de passe incorrect', 'error');
    }
  } catch (error) {
    console.error('[SHOP] Erreur login:', error);
    showMessageInElement('shopAdminLoginMessage', 'Erreur lors de la connexion', 'error');
  } finally {
    showSpinner(false);
  }
}

// ===========================
// EVENT LISTENERS
// ===========================

function setupEventListeners() {
  // Header
  document.getElementById('backBtn').addEventListener('click', () => {
    window.location.href = '/';
  });

  // Language Selector
  const languageSelector = document.getElementById('languageSelector');
  if (languageSelector) {
    languageSelector.addEventListener('change', (e) => {
      // Appliquer la traduction dynamiquement (sans rechargement)
      applyTranslation(e.target.value);
    });
  }

  document.getElementById('adminLoginBtn').addEventListener('click', () => {
    if (isShopAdmin) {
      shopAdminToken = null;
      // Pas de localStorage à nettoyer
      isShopAdmin = false;
      checkAdminStatus();
      location.reload();
    } else {
      openModal('shopAdminLoginModal');
    }
  });

  // Admin
  document.getElementById('addItemBtn').addEventListener('click', addNewItem);

  // Form
  const imageInput = document.getElementById('itemImageInput');
  imageInput.addEventListener('change', (e) => {
    if (e.target.files.length) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        const preview = document.getElementById('imagePreview');
        const img = document.getElementById('previewImage');
        img.src = event.target.result;
        preview.classList.remove('hidden');
      };
      reader.readAsDataURL(file);
    }
  });

  document.getElementById('cancelItemBtn').addEventListener('click', () => {
    closeModal('addEditItemModal');
  });

  document.getElementById('submitItemBtn').addEventListener('click', submitItem);

  // Admin Login
  document.getElementById('closeShopAdminLoginModal').addEventListener('click', () => {
    closeModal('shopAdminLoginModal');
  });

  document.getElementById('shopAdminLoginSubmitBtn').addEventListener('click', loginAsAdmin);

  // Add/Edit Modal
  document.getElementById('closeAddEditItemModal').addEventListener('click', () => {
    closeModal('addEditItemModal');
  });

  // Delete Modal
  document.getElementById('cancelDeleteBtn').addEventListener('click', () => {
    closeModal('deleteConfirmModal');
  });

  // Enter key in password field
  document.getElementById('shopAdminLoginPassword').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') loginAsAdmin();
  });

  // Cart buttons
  document.getElementById('clearCartBtn').addEventListener('click', clearCart);
  document.getElementById('continueShopping').addEventListener('click', hideCart);
  document.getElementById('purchaseBtn').addEventListener('click', processPurchase);

  // Delegation pour les boutons de sélection d'articles
  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('btn-select-item')) {
      const itemId = e.target.dataset.itemId;
      addToCart(itemId);
    }
    if (e.target.classList.contains('btn-remove-cart-item')) {
      const cartIndex = parseInt(e.target.dataset.cartIndex);
      removeFromCart(cartIndex);
    }
    if (e.target.classList.contains('shop-item-clickable')) {
      const itemId = e.target.dataset.itemId;
      openItemGallery(itemId);
    }
  });

  // Gallery controls
  document.getElementById('closeGalleryModal').addEventListener('click', () => {
    closeModal('galleryModal');
  });
  
  document.getElementById('galleryPrev').addEventListener('click', prevGalleryImage);
  document.getElementById('galleryNext').addEventListener('click', nextGalleryImage);

  // Keyboard navigation
  document.addEventListener('keydown', (e) => {
    const galleryModal = document.getElementById('galleryModal');
    if (!galleryModal.classList.contains('hidden')) {
      if (e.key === 'ArrowLeft') prevGalleryImage();
      if (e.key === 'ArrowRight') nextGalleryImage();
      if (e.key === 'Escape') closeModal('galleryModal');
    }
  });
}

// ===========================
// UTILITAIRES
// ===========================

function openModal(modalId) {
  const modal = document.getElementById(modalId);
  modal.classList.remove('hidden');
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  modal.classList.add('hidden');
}

function showSpinner(show) {
  const spinner = document.getElementById('loadingSpinner');
  if (show) {
    spinner.classList.remove('hidden');
  } else {
    spinner.classList.add('hidden');
  }
}

function showMessage(message, type = 'info') {
  // Afficher dans la fenêtre modale active, sinon en haut
  const modals = document.querySelectorAll('.modal:not(.hidden)');
  if (modals.length > 0) {
    const lastModal = modals[modals.length - 1];
    const msgBox = lastModal.querySelector('.message-box');
    if (msgBox) {
      showMessageInElement(msgBox, message, type);
      return;
    }
  }
}

function showMessageInElement(element, message, type = 'info') {
  let msgBox;
  if (typeof element === 'string') {
    msgBox = document.getElementById(element);
  } else {
    msgBox = element;
  }

  msgBox.textContent = message;
  msgBox.className = `message-box show ${type}`;

  setTimeout(() => {
    msgBox.classList.remove('show');
  }, 5000);
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ===========================
// GESTION DU PANIER
// ===========================

function addToCart(itemId) {
  const item = allShopItems.find(i => i._id === itemId);
  if (!item) {
    showMessage('Article non trouvé', 'error');
    return;
  }

  // Ajouter au panier
  cartItems.push({
    ...item,
    cartItemId: Date.now() + Math.random(), // ID unique pour ce panier
  });

  // Animation du badge
  showCartNotification(cartItems.length);
  showNotification(`✅ ${item.name} ajouté au panier!`, 'success');
  updateCart();
  showCart();
}

function removeFromCart(cartIndex) {
  if (cartIndex >= 0 && cartIndex < cartItems.length) {
    const removed = cartItems.splice(cartIndex, 1);
    showNotification(`🗑️ ${removed[0].name} retiré du panier`, 'info');
    updateCart();
  }
}

function clearCart() {
  if (cartItems.length === 0) return;
  
  cartItems = [];
  updateCart();
  showNotification('🧹 Panier vidé', 'info');
}

function showCartNotification(count) {
  // Créer ou mettre à jour le badge du panier
  let badge = document.getElementById('cartBadgeNotif');
  if (!badge) {
    badge = document.createElement('div');
    badge.id = 'cartBadgeNotif';
    badge.className = 'cart-badge-notification';
    document.body.appendChild(badge);
  }
  badge.textContent = count;
}

function showNotification(message, type = 'info') {
  const notif = document.createElement('div');
  notif.className = `notification ${type}`;
  notif.textContent = message;
  document.body.appendChild(notif);

  setTimeout(() => {
    notif.remove();
  }, 3000);
}

function updateCart() {
  const cartSection = document.getElementById('cartSection');
  const cartCountEl = document.getElementById('cartCount');
  const cartItemsEl = document.getElementById('cartItems');
  const totalPriceEl = document.getElementById('totalPrice');

  // Mise à jour du compteur
  cartCountEl.textContent = `(${cartItems.length})`;

  if (cartItems.length === 0) {
    cartSection.classList.add('hidden');
    return;
  }

  cartSection.classList.remove('hidden');

  // Rendu des articles du panier
  cartItemsEl.innerHTML = cartItems.map((item, index) => `
    <div class="cart-item">
      <img src="${item.image}" alt="${item.name}" class="cart-item-image" onerror="this.src='assets/placeholder.png'">
      <div class="cart-item-details">
        <div class="cart-item-name">${escapeHtml(item.name)}</div>
        <div class="cart-item-info">${item.category} - ${item.description ? escapeHtml(item.description.substring(0, 30)) + '...' : ''}</div>
        ${item.accountId ? `<div class="cart-item-account">📌 ID: ${escapeHtml(item.accountId)}</div>` : ''}
      </div>
      <div class="cart-item-price">${formatPrice(item.price)}</div>
      <button class="btn-remove-cart-item" data-cart-index="${index}" style="
        padding: 8px 12px;
        background: rgba(255, 107, 107, 0.2);
        border: none;
        color: var(--danger);
        border-radius: 6px;
        cursor: pointer;
        font-weight: 600;
        transition: var(--transition-fast);
      ">
        ✕
      </button>
    </div>
  `).join('');

  // Calcul du total
  const total = cartItems.reduce((sum, item) => sum + item.price, 0);
  totalPriceEl.textContent = formatPrice(total);
}

function showCart() {
  const cartSection = document.getElementById('cartSection');
  cartSection.classList.remove('hidden');
  cartSection.scrollIntoView({ behavior: 'smooth' });
}

function hideCart() {
  const cartSection = document.getElementById('cartSection');
  cartSection.classList.add('hidden');
}

async function processPurchase() {
  console.log('[SHOP] === Début processPurchase ===');
  console.log('[SHOP] Panier:', cartItems.length, 'articles');
  console.log('[SHOP] Utilisateur Discord:', currentDiscordUser ? currentDiscordUser.username : 'NON CONNECTÉ');
  
  if (cartItems.length === 0) {
    showMessage('Votre panier est vide', 'error');
    console.log('[SHOP] ❌ Panier vide');
    return;
  }

  // Vérifier que l'utilisateur est connecté via Discord
  if (!currentDiscordUser) {
    showMessage('❌ Vous devez vous connecter via Discord pour acheter', 'error');
    console.log('[SHOP] ❌ Utilisateur pas connecté Discord');
    return;
  }

  try {
    showSpinner(true);
    console.log('[SHOP] 🛍️ Envoi de la commande...');

    // Préparer les articles pour l'achat
    const purchaseMessages = cartItems.map((item) => ({
      accountId: item.accountId || `ITEM_${item._id}`,
      itemName: item.name,
      itemPrice: item.price,
      itemImage: item.image,
    }));

    // Ajouter les infos de l'utilisateur Discord
    const buyerInfo = {
      discordUsername: currentDiscordUser.username,
      discordId: currentDiscordUser.id,
      discordAvatar: currentDiscordUser.avatar,
      discordTag: currentDiscordUser.username + '#' + (currentDiscordUser.discriminator || '0'),
    };

    console.log('[SHOP] Infos envoyées:', {
      items: purchaseMessages.length,
      buyer: buyerInfo.discordUsername,
      buyerId: buyerInfo.discordId,
    });

    // Envoyer les messages via API
    const response = await fetch('/api/shop/purchase', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        items: purchaseMessages,
        itemCount: cartItems.length,
        buyer: buyerInfo,
      }),
    });

    console.log('[SHOP] Réponse API status:', response.status);
    const data = await response.json();
    console.log('[SHOP] Réponse API data:', data);

    if (data.success) {
      const totalPrice = cartItems.reduce((sum, item) => sum + item.price, 0);
      
      showNotification(`🎉 Commande confirmée! ${cartItems.length} article(s) pour ${formatPrice(totalPrice)}`, 'success');
      
      console.log('[SHOP] ✅ Achat traité:', data.messagesSent);

      // Vider le panier
      cartItems = [];
      updateCart();
      hideCart();

      // Réafficher la grille
      renderShopItems();
    } else {
      console.log('[SHOP] ❌ Erreur serveur:', data.message);
      showNotification(data.message || '❌ Erreur lors de la commande', 'error');
    }
  } catch (error) {
    console.error('[SHOP] ❌ Erreur achat:', error);
    console.error('[SHOP] Message erreur:', error.message);
    console.error('[SHOP] Stack:', error.stack);
    showNotification('❌ Erreur lors de la commande', 'error');
  } finally {
    showSpinner(false);
  }
}
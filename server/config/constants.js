/**
 * Constantes de l'application
 */

// Validation
const VALIDATION = {
  NAME_MIN_LENGTH: 2,
  NAME_MAX_LENGTH: 20,
  NAME_REGEX: /^[a-zA-Z0-9\s]+$/,
};

// Anti-spam
const ANTI_SPAM = {
  DEFAULT_MINUTES: 30,
  ERROR_MESSAGE: 'Vous avez déjà participé. Veuillez réessayer dans {minutes} minutes.',
};

// Rate limiting
const RATE_LIMIT = {
  GLOBAL_WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  GLOBAL_MAX_REQUESTS: 100,
  PARTICIPANT_WINDOW_MS: 10 * 60 * 1000, // 10 minutes
  PARTICIPANT_MAX_REQUESTS: 5,
};

// Messages
const MESSAGES = {
  SUCCESS: {
    PARTICIPATION_ADDED: 'Participation enregistrée avec succès!',
    WINNER_DRAWN: 'Gagnant tiré au sort!',
    RESET_SUCCESS: 'Liste des participants réinitialisée',
  },
  ERROR: {
    NAME_REQUIRED: 'Le nom est requis',
    NAME_TOO_SHORT: 'Le nom doit contenir au minimum {min} caractères',
    NAME_TOO_LONG: 'Le nom doit contenir au maximum {max} caractères',
    NAME_INVALID_CHARS: 'Le nom ne peut contenir que des lettres, chiffres et espaces',
    IP_REQUIRED: 'IP non détectée',
    NO_PARTICIPANTS: 'Aucun participant pour tirer un gagnant',
    ALREADY_PARTICIPATED: 'Vous avez déjà participé. Veuillez réessayer plus tard',
    SERVER_ERROR: 'Erreur serveur',
    NOT_FOUND: 'Route non trouvée',
  },
};

// Status codes
const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  NOT_FOUND: 404,
  TOO_MANY_REQUESTS: 429,
  SERVER_ERROR: 500,
};

module.exports = {
  VALIDATION,
  ANTI_SPAM,
  RATE_LIMIT,
  MESSAGES,
  HTTP_STATUS,
};

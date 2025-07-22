// ===========================================
// GLOBAL VARIABLES - نسخ من script.js الأصلي
// ===========================================

// Translation Data
let translations = {};
let filteredTranslations = {};
let originalTranslations = {};
let englishTranslations = {}; // النصوص الإنجليزية الأصلية
let translationKeys = [];
let currentIndex = 0;
let currentFile = null;

// UI State
let previewLength = 50;
let hasUnsavedChanges = false;
let currentEditedValue = '';
let modifiedKeys = new Set(); // Track modified translations
let currentEditingKey = ''; // Track the key being edited to avoid index conflicts

// Debug Settings
window.debugBlocks = false; // Blocks debug mode (disabled by default)

// Auto-save
let autoSaveInterval;

// API Keys Storage
let apiKeys = {
    claude: '',
    openai: '',
    gemini: '',
    deepl: '',
    google: ''
};

// DOM Elements - سيتم تعريفها بعد تحميل DOM
let translationList, originalText, translationText, searchInput, statsText, statusText, progressBar, fileInput, notification, loadingOverlay, settingsModal;

// Notification timeout
let notificationTimeout = null;

// Export globals for other modules
if (typeof window !== 'undefined') {
    // Browser environment
    window.translations = translations;
    window.filteredTranslations = filteredTranslations;
    window.originalTranslations = originalTranslations;
    window.englishTranslations = englishTranslations;
    window.translationKeys = translationKeys;
    window.currentIndex = currentIndex;
    window.currentFile = currentFile;
    window.previewLength = previewLength;
    window.hasUnsavedChanges = hasUnsavedChanges;
    window.currentEditedValue = currentEditedValue;
    window.modifiedKeys = modifiedKeys;
    window.currentEditingKey = currentEditingKey;
    window.autoSaveInterval = autoSaveInterval;
    window.apiKeys = apiKeys;
    window.translationList = translationList;
    window.originalText = originalText;
    window.translationText = translationText;
    window.searchInput = searchInput;
    window.statsText = statsText;
    window.statusText = statusText;
    window.progressBar = progressBar;
    window.fileInput = fileInput;
    window.notification = notification;
    window.loadingOverlay = loadingOverlay;
    window.settingsModal = settingsModal;
    window.notificationTimeout = notificationTimeout;
} 
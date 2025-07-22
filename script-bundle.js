// ===========================================
// GLOBAL VARIABLES - ظ†ط³ط® ظ…ظ† script.js ط§ظ„ط£طµظ„ظٹ
// ===========================================

// Translation Data
let translations = {};
let filteredTranslations = {};
let originalTranslations = {};
let englishTranslations = {}; // ط§ظ„ظ†طµظˆطµ ط§ظ„ط¥ظ†ط¬ظ„ظٹط²ظٹط© ط§ظ„ط£طµظ„ظٹط©
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

// DOM Elements - ط³ظٹطھظ… طھط¹ط±ظٹظپظ‡ط§ ط¨ط¹ط¯ طھط­ظ…ظٹظ„ DOM
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
// ===========================================
// UTILITY HELPERS - ط§ظ„ط¯ظˆط§ظ„ ط§ظ„ظ…ط³ط§ط¹ط¯ط©
// ===========================================

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Helper function to clean text (extract from quotes)
function cleanText(text) {
    if (!text) return '';
    // First try to extract text between quotes
    const quoteMatch = text.match(/"([^"]*)"/);
    if (quoteMatch) {
        return quoteMatch[1];
    }
    // If no quotes, remove tags and quotes manually
    return text.replace(/#NT!/g, '').replace(/#[A-Z0-9]+!/g, '').replace(/"/g, '').trim();
}

// ط¯ط§ظ„ط© طھظ„ظˆظٹظ† ظ…ظپط§طھظٹط­ ط§ظ„طھط±ط¬ظ…ط© ط§ظ„ظ…ظپظ‚ظˆط¯ط©
function highlightKeysWithMissingBlocks() {
    if (window.debugBlocks) console.log('ًں”چ ظپط­طµ ظ…ظپط§طھظٹط­ ط§ظ„طھط±ط¬ظ…ط§طھ ظ„ظ„ط¨ظ„ظˆظƒط§طھ ط§ظ„ظ…ظپظ‚ظˆط¯ط©...');
    
    if (!translationList) return;
    
    const translationItems = translationList.querySelectorAll('.translation-item');
    
    translationItems.forEach(item => {
        const index = parseInt(item.dataset.index);
        if (isNaN(index) || !translationKeys || index >= translationKeys.length) return;
        
        const key = translationKeys[index];
        if (!key) return;
        
        const originalValue = englishTranslations ? englishTranslations[key] : '';
        const arabicValue = translations ? translations[key] : '';
        
        if (!originalValue || !arabicValue) return;
        
        // ط§ط³طھط®ط±ط§ط¬ ط§ظ„ط¨ظ„ظˆظƒط§طھ ظ…ظ† ط§ظ„ظ†طµ ط§ظ„ط¥ظ†ط¬ظ„ظٹط²ظٹ ظˆط§ظ„ط¹ط±ط¨ظٹ
        let missingBlocks = [];
        if (typeof findMissingBlocks === 'function') {
            missingBlocks = findMissingBlocks(originalValue, arabicValue);
        }
        
        // ط¥ط¶ط§ظپط©/ط¥ط²ط§ظ„ط© class ظ„ظ„طھظ„ظˆظٹظ†
        if (missingBlocks.length > 0) {
            item.classList.add('has-missing-blocks');
            item.title = `ظ…ظپظ‚ظˆط¯: ${missingBlocks.join(', ')}`;
            if (window.debugBlocks) console.log(`ًں”´ ${key}: ظ…ظپظ‚ظˆط¯ ${missingBlocks.length} ط¨ظ„ظˆظƒ`);
        } else {
            item.classList.remove('has-missing-blocks');
            item.title = '';
            if (window.debugBlocks) console.log(`âœ… ${key}: ط¬ظ…ظٹط¹ ط§ظ„ط¨ظ„ظˆظƒط§طھ ظ…ظˆط¬ظˆط¯ط©`);
        }
    });
}

// Make functions available globally
if (typeof window !== 'undefined') {
    window.escapeHtml = escapeHtml;
    window.cleanText = cleanText;
    window.highlightKeysWithMissingBlocks = highlightKeysWithMissingBlocks;
} 
// ===========================================
// LOCALSTORAGE OPERATIONS - ط¹ظ…ظ„ظٹط§طھ ط§ظ„طھط®ط²ظٹظ† ط§ظ„ظ…ط­ظ„ظٹ
// ===========================================

// LocalStorage functions
function saveToLocalStorage() {
    try {
        const dataToSave = {
            translations: translations || {},
            originalTranslations: originalTranslations || {}, // ط¥ط¶ط§ظپط© ط§ظ„ظ†طµظˆطµ ط§ظ„ط£طµظ„ظٹط©
            modifiedKeys: Array.from(modifiedKeys || []),
            currentIndex: currentIndex || 0,
            currentEditingKey: currentEditingKey || '',  // ط­ظپط¸ ط§ظ„ظ…ظپطھط§ط­ ط§ظ„ظ…ظڈط¹ط¯ظ„ ط­ط§ظ„ظٹط§ظ‹
            currentEditedValue: currentEditedValue || '', // ط­ظپط¸ ط§ظ„ظ†طµ ط§ظ„ظ…ظڈط¹ط¯ظ„ ط­ط§ظ„ظٹط§ظ‹
            currentFile: currentFile ? {
                name: currentFile.name || currentFile,
                lastModified: currentFile.lastModified || Date.now(),
                size: currentFile.size || 0
            } : null,
            englishTranslations: englishTranslations || {},
            hasUnsavedChanges: hasUnsavedChanges || false,
            timestamp: Date.now()
        };
        
        localStorage.setItem('paradox_translations', JSON.stringify(dataToSave));
        console.log('ًں’¾ طھظ… ط­ظپط¸ ط§ظ„ط¨ظٹط§ظ†ط§طھ ظپظٹ localStorage:', {
            translations: Object.keys(translations || {}).length,
            english: Object.keys(englishTranslations || {}).length,  // ط¥ط¶ط§ظپط© ظ…ط¹ظ„ظˆظ…ط§طھ ط§ظ„ظ†طµظˆطµ ط§ظ„ط¥ظ†ط¬ظ„ظٹط²ظٹط©
            modified: (modifiedKeys && modifiedKeys.size) || 0,
            currentFile: currentFile ? (currentFile.name || currentFile) : 'none',
            currentEditingKey: currentEditingKey || 'none',
            hasCurrentEdit: !!(currentEditedValue && currentEditingKey),
            timestamp: new Date(dataToSave.timestamp).toLocaleString('ar-SA')
        });
        
    } catch (error) {
        console.error('â‌Œ ط®ط·ط£ ظپظٹ ط­ظپط¸ ط§ظ„ط¨ظٹط§ظ†ط§طھ:', error);
    }
}

function loadFromLocalStorage() {
    try {
        // ظ…ط­ط§ظˆظ„ط© طھط­ظ…ظٹظ„ ط§ظ„ط¨ظٹط§ظ†ط§طھ ط§ظ„ط¬ط¯ظٹط¯ط© ط£ظˆظ„ط§ظ‹
        let savedData = localStorage.getItem('paradox_translations');
        
        // ط¥ط°ط§ ظ„ظ… طھظˆط¬ط¯طŒ ط¬ط±ط¨ ط§ظ„ظ†ط³ط®ط© ط§ظ„ظ‚ط¯ظٹظ…ط©
        if (!savedData) {
            savedData = localStorage.getItem('arabicTranslationEditor');
        }
        
        if (savedData) {
            const data = JSON.parse(savedData);
            
            // ط§ط³طھط±ط¬ط§ط¹ ط§ظ„طھط±ط¬ظ…ط§طھ
            if (data.translations && typeof data.translations === 'object') {
                translations = data.translations;
                
                // ط§ط³طھط±ط¬ط§ط¹ ط§ظ„ظ†طµظˆطµ ط§ظ„ط£طµظ„ظٹط© ط¥ط°ط§ ظƒط§ظ†طھ ظ…ط­ظپظˆط¸ط©طŒ ظˆط¥ظ„ط§ ط§ط³طھط®ط¯ظ… copy ظ…ظ† ط§ظ„طھط±ط¬ظ…ط§طھ
                if (data.originalTranslations && typeof data.originalTranslations === 'object') {
                    originalTranslations = { ...data.originalTranslations };
                    console.log('âœ… طھظ… ط§ط³طھط±ط¬ط§ط¹ ط§ظ„ظ†طµظˆطµ ط§ظ„ط£طµظ„ظٹط© ظ…ظ† localStorage');
                } else {
                    // ظ„ظ„طھظˆط§ظپظ‚ ظ…ط¹ ط§ظ„ظ†ط³ط® ط§ظ„ظ‚ط¯ظٹظ…ط© - ظ„ظƒظ† ظ…ط¹ طھط­ط°ظٹط±
                    originalTranslations = { ...data.translations };
                    console.warn('âڑ ï¸ڈ ظ„ظ… طھظˆط¬ط¯ ظ†طµظˆطµ ط£طµظ„ظٹط© ظ…ط­ظپظˆط¸ط© - ط§ط³طھط®ط¯ط§ظ… ظ†ط³ط®ط© ظ…ظ† ط§ظ„طھط±ط¬ظ…ط§طھ ط§ظ„ط­ط§ظ„ظٹط©');
                }
                
                translationKeys = Object.keys(data.translations);
                filteredTranslations = { ...data.translations };
                
                // طھط­ط¯ظٹط« ط§ظ„ظ…طھط؛ظٹط±ط§طھ ط§ظ„ط¹ط§ظ…ط©
                window.translations = translations;
                window.originalTranslations = originalTranslations;
                window.translationKeys = translationKeys;
                window.filteredTranslations = filteredTranslations;
            }
            
            // ط§ط³طھط±ط¬ط§ط¹ ط§ظ„طھط±ط¬ظ…ط§طھ ط§ظ„ط¥ظ†ط¬ظ„ظٹط²ظٹط©
            if (data.englishTranslations && typeof data.englishTranslations === 'object') {
                englishTranslations = data.englishTranslations;
                window.englishTranslations = englishTranslations;
            }
            
            // ط§ط³طھط±ط¬ط§ط¹ ط§ظ„طھط¹ط¯ظٹظ„ط§طھ
            if (data.modifiedKeys && Array.isArray(data.modifiedKeys)) {
                modifiedKeys = new Set(data.modifiedKeys);
                window.modifiedKeys = modifiedKeys;
            }
            
            // ط§ط³طھط±ط¬ط§ط¹ ط§ظ„ظپظ‡ط±ط³ ط§ظ„ط­ط§ظ„ظٹ
            if (typeof data.currentIndex === 'number') {
                currentIndex = data.currentIndex;
                window.currentIndex = currentIndex;
            }
            
            // ط§ط³طھط±ط¬ط§ط¹ ط§ظ„ظ…ظپطھط§ط­ ظˆط§ظ„ظ†طµ ط§ظ„ظ…ظڈط¹ط¯ظ„ ط­ط§ظ„ظٹط§ظ‹
            if (typeof data.currentEditingKey === 'string') {
                currentEditingKey = data.currentEditingKey;
                window.currentEditingKey = currentEditingKey;
            }
            
            if (typeof data.currentEditedValue === 'string') {
                // ط§ظ„طھط­ظ‚ظ‚ ظ…ظ† ط£ظ† ط§ظ„ظ†طµ ط§ظ„ظ…ظڈط¹ط¯ظ„ ظ…ظ† ظ†ظپط³ ط§ظ„ظ…ظ„ظپ
                const savedFileName = data.currentFile ? (data.currentFile.name || data.currentFile) : '';
                const currentFileName = currentFile ? (currentFile.name || currentFile) : '';
                
                if (savedFileName && currentFileName && savedFileName === currentFileName) {
                    currentEditedValue = data.currentEditedValue;
                    window.currentEditedValue = currentEditedValue;
                    console.log(`âœ… طھظ… ط§ط³طھط±ط¬ط§ط¹ ط§ظ„ظ†طµ ط§ظ„ظ…ظڈط¹ط¯ظ„ ظ…ظ† ظ†ظپط³ ط§ظ„ظ…ظ„ظپ: ${currentFileName}`);
                } else {
                    currentEditedValue = '';
                    window.currentEditedValue = '';
                    console.log(`ًں—‘ï¸ڈ طھظ… طھط¬ط§ظ‡ظ„ ط§ظ„ظ†طµ ط§ظ„ظ…ظڈط¹ط¯ظ„ ظ…ظ† ظ…ظ„ظپ ظ…ط®طھظ„ظپ (ظ…ط­ظپظˆط¸: ${savedFileName}, ط­ط§ظ„ظٹ: ${currentFileName})`);
                }
            }
            
            // ط§ط³طھط±ط¬ط§ط¹ ظ…ط¹ظ„ظˆظ…ط§طھ ط§ظ„ظ…ظ„ظپ ط§ظ„ظ…ظ‡ظ…ط©!
            if (data.currentFile) {
                if (typeof data.currentFile === 'string') {
                    // ظ†ط³ط®ط© ظ‚ط¯ظٹظ…ط© - ط§ط³ظ… ط§ظ„ظ…ظ„ظپ ظپظ‚ط·
                    currentFile = { name: data.currentFile };
                } else if (data.currentFile.name) {
                    // ظ†ط³ط®ط© ط¬ط¯ظٹط¯ط© - ظ…ط¹ظ„ظˆظ…ط§طھ ظƒط§ظ…ظ„ط©
                    currentFile = {
                        name: data.currentFile.name,
                        lastModified: data.currentFile.lastModified || Date.now(),
                        size: data.currentFile.size || 0
                    };
                }
                window.currentFile = currentFile;
                
                // طھط­ط¯ظٹط« ط­ط§ظ„ط© ط§ظ„ظˆط§ط¬ظ‡ط©
                if (typeof updateStatus === 'function') {
                    updateStatus(currentFile.name || currentFile);
                }
            }
            
            // ط§ط³طھط±ط¬ط§ط¹ ط­ط§ظ„ط© ط§ظ„طھط؛ظٹظٹط±ط§طھ
            if (typeof data.hasUnsavedChanges === 'boolean') {
                hasUnsavedChanges = data.hasUnsavedChanges;
                window.hasUnsavedChanges = hasUnsavedChanges;
            }
            
            console.log('ًں“‚ طھظ… ط§ط³طھط±ط¬ط§ط¹ ط§ظ„ط¨ظٹط§ظ†ط§طھ ظ…ظ† localStorage:', {
                translations: Object.keys(translations).length,
                english: Object.keys(englishTranslations).length,
                modified: modifiedKeys.size,
                currentFile: currentFile ? (currentFile.name || currentFile) : 'none',
                index: currentIndex,
                timestamp: data.timestamp ? new Date(data.timestamp).toLocaleString('ar-SA') : 'ظ‚ط¯ظٹظ…'
            });
            
            // طھط­ط¯ظٹط« ط§ظ„ظˆط§ط¬ظ‡ط©
            if (typeof populateTranslationList === 'function') {
                populateTranslationList();
            }
            if (typeof updateStats === 'function') {
                updateStats();
            }
            if (typeof updateSaveButton === 'function') {
                updateSaveButton();
            }
            
            // ط¥ط°ط§ ظƒط§ظ† ظپظٹ ظ…ظ„ظپ ظˆطھط±ط¬ظ…ط§طھطŒ ط§ط®طھط± ط§ظ„طھط±ط¬ظ…ط© ط§ظ„ط­ط§ظ„ظٹط©
            if (currentFile && translationKeys.length > 0 && typeof selectTranslationByIndex === 'function') {
                selectTranslationByIndex(currentIndex);
            }
            
            // ط¥ط´ط¹ط§ط± ظ†ط¬ط§ط­ ط§ظ„ط§ط³طھط±ط¬ط§ط¹
            if (currentFile && translations && Object.keys(translations).length > 0) {
                if (typeof showNotification === 'function') {
                    showNotification(
                        `ًں”„ طھظ… ط§ط³طھط±ط¬ط§ط¹ ط¹ظ…ظ„ظƒ ط§ظ„ط³ط§ط¨ظ‚!\n\n` +
                        `ًں“پ ط§ظ„ظ…ظ„ظپ: ${currentFile.name || currentFile}\n` +
                        `ًں“‌ ط§ظ„طھط±ط¬ظ…ط§طھ: ${Object.keys(translations).length}\n` +
                        `âœڈï¸ڈ ط§ظ„طھط¹ط¯ظٹظ„ط§طھ: ${modifiedKeys.size}\n\n` +
                        `ًں’، ظٹظ…ظƒظ†ظƒ ظ…طھط§ط¨ط¹ط© ط§ظ„ط¹ظ…ظ„ ظ…ظ† ط­ظٹط« طھظˆظ‚ظپطھ!`,
                        'success'
                    );
                }
            }
            
            return true;
        }
        
        console.log('ًں“‌ ظ„ط§ طھظˆط¬ط¯ ط¨ظٹط§ظ†ط§طھ ظ…ط­ظپظˆط¸ط© ظپظٹ localStorage');
        return false;
        
    } catch (error) {
        console.error('â‌Œ ط®ط·ط£ ظپظٹ طھط­ظ…ظٹظ„ ط§ظ„ط¨ظٹط§ظ†ط§طھ ظ…ظ† localStorage:', error);
        return false;
    }
}

function setupAutoSave() {
    // Auto-save every 30 seconds
    if (window.autoSaveInterval) {
        clearInterval(window.autoSaveInterval);
    }
    
    window.autoSaveInterval = setInterval(() => {
        const hasChanges = (modifiedKeys && modifiedKeys.size > 0) || hasUnsavedChanges;
        if (hasChanges) {
            saveToLocalStorage();
        }
    }, 30000);
    
    autoSaveInterval = window.autoSaveInterval;
    
    // Save before page unload
    window.addEventListener('beforeunload', () => {
        const hasChanges = (modifiedKeys && modifiedKeys.size > 0) || hasUnsavedChanges;
        if (hasChanges) {
            saveToLocalStorage();
        }
    });
}

// Make functions available globally
if (typeof window !== 'undefined') {
    window.saveToLocalStorage = saveToLocalStorage;
    window.loadFromLocalStorage = loadFromLocalStorage;
    window.setupAutoSave = setupAutoSave;
} 
// ===========================================
// SAFETY FUNCTIONS - ط¯ظˆط§ظ„ ط§ظ„ط£ظ…ط§ظ†
// ===========================================

// ط¥طµظ„ط§ط­ ظ…ط´ط§ظƒظ„ async response errors
function safeTimeout(fn, delay) {
    try {
        return setTimeout(() => {
            try {
                fn();
            } catch (error) {
                console.warn('âڑ ï¸ڈ ط®ط·ط£ ظپظٹ timeout function:', error);
            }
        }, delay);
    } catch (error) {
        console.warn('âڑ ï¸ڈ ط®ط·ط£ ظپظٹ ط¥ظ†ط´ط§ط، timeout:', error);
        return null;
    }
}

// ط¯ط§ظ„ط© ط¢ظ…ظ†ط© ظ„ظ„ط¹ظ…ظ„ظٹط§طھ async
function safeAsync(asyncFn) {
    try {
        return asyncFn().catch(error => {
            console.warn('âڑ ï¸ڈ ط®ط·ط£ ظپظٹ ط§ظ„ط¹ظ…ظ„ظٹط© async:', error);
        });
    } catch (error) {
        console.warn('âڑ ï¸ڈ ط®ط·ط£ ظپظٹ طھظ†ظپظٹط° ط§ظ„ط¹ظ…ظ„ظٹط© async:', error);
    }
}

// Make functions available globally
if (typeof window !== 'undefined') {
    window.safeTimeout = safeTimeout;
    window.safeAsync = safeAsync;
} 
// ===========================================
// YAML LOADING AND PROCESSING - ظ…ط¹ط§ظ„ط¬ط© YAML
// ===========================================

// File operations
function openFile() {
    if (fileInput) {
        fileInput.click();
    }
}

function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
        handleFile(file);
    }
}

function handleFile(file) {
    if (!file) {
        console.error('â‌Œ ظ„ظ… ظٹطھظ… طھظ…ط±ظٹط± ظ…ظ„ظپ');
        return;
    }
    
    console.log('ًں“پ ط¨ط¯ط، ظ…ط¹ط§ظ„ط¬ط© ط§ظ„ظ…ظ„ظپ:', file.name);
    
    // ط­ظپط¸ ظ…ط¹ظ„ظˆظ…ط§طھ ط§ظ„ظ…ظ„ظپ ط§ظ„ظƒط§ظ…ظ„ط©
    currentFile = {
        name: file.name,
        size: file.size,
        lastModified: file.lastModified,
        type: file.type || 'text/yaml'
    };
    window.currentFile = currentFile;
    
    console.log('ًں“‹ ظ…ط¹ظ„ظˆظ…ط§طھ ط§ظ„ظ…ظ„ظپ ط§ظ„ظ…ط­ظپظˆط¸ط©:', currentFile);
    
    const reader = new FileReader();
    
    reader.onload = function(e) {
        try {
            const content = e.target.result;
            console.log('ًں“– طھظ… ظ‚ط±ط§ط،ط© ظ…ط­طھظˆظ‰ ط§ظ„ظ…ظ„ظپ ط¨ظ†ط¬ط§ط­');
            
            // ظ…ط¹ط§ظ„ط¬ط© ظ…ط­طھظˆظ‰ ط§ظ„ظ…ظ„ظپ
            loadYamlContent(content, file.name);
            
            // ط­ظپط¸ ط§ظ„ط¨ظٹط§ظ†ط§طھ ظپظˆط±ط§ظ‹ ط¨ط¹ط¯ ط§ظ„طھط­ظ…ظٹظ„
            if (typeof saveToLocalStorage === 'function') {
                saveToLocalStorage();
            }
            
            // ط¥ط´ط¹ط§ط± ظ†ط¬ط§ط­ ظ…ط¹ ظ…ط¹ظ„ظˆظ…ط§طھ ط§ظ„ظ…ظ„ظپ
            if (typeof showNotification === 'function') {
                showNotification(
                    `âœ… طھظ… طھط­ظ…ظٹظ„ ط§ظ„ظ…ظ„ظپ ط¨ظ†ط¬ط§ط­!\n\n` +
                    `ًں“پ ط§ط³ظ… ط§ظ„ظ…ظ„ظپ: ${file.name}\n` +
                    `ًں“ٹ ط¹ط¯ط¯ ط§ظ„طھط±ط¬ظ…ط§طھ: ${Object.keys(translations || {}).length}\n` +
                    `ًں’¾ طھظ… ط­ظپط¸ ط§ظ„ط¹ظ…ظ„ طھظ„ظ‚ط§ط¦ظٹط§ظ‹`,
                    'success'
                );
            }
            
        } catch (error) {
            console.error('â‌Œ ط®ط·ط£ ظپظٹ ظ‚ط±ط§ط،ط© ط§ظ„ظ…ظ„ظپ:', error);
            if (typeof showNotification === 'function') {
                showNotification(`ط®ط·ط£ ظپظٹ ظ‚ط±ط§ط،ط© ط§ظ„ظ…ظ„ظپ: ${error.message}`, 'error');
            }
        }
    };
    
    reader.onerror = function(error) {
        console.error('â‌Œ ط®ط·ط£ ظپظٹ FileReader:', error);
        if (typeof showNotification === 'function') {
            showNotification('ظپط´ظ„ ظپظٹ ظ‚ط±ط§ط،ط© ط§ظ„ظ…ظ„ظپ. طھط£ظƒط¯ ظ…ظ† طµط­ط© ط§ظ„ظ…ظ„ظپ.', 'error');
        }
    };
    
    reader.readAsText(file, 'utf-8');
}

function loadYamlContent(content, filename) {
    try {
        console.log('ًں“‚ ط¨ط¯ط، ظ…ط¹ط§ظ„ط¬ط© ظ…ط­طھظˆظ‰ YAML...');
        
        // ط§ظ„طھط­ظ‚ظ‚ ظ…ظ† ظˆط¬ظˆط¯ ظ…ط­طھظˆظ‰
        if (!content || content.trim() === '') {
            throw new Error('ط§ظ„ظ…ظ„ظپ ظپط§ط±ط؛ ط£ظˆ ظ„ط§ ظٹط­طھظˆظٹ ط¹ظ„ظ‰ ظ…ط­طھظˆظ‰');
        }

        // Simple YAML parsing (for basic l_english format)
        const lines = content.split('\n');
        const yamlData = {};
        let inLEnglish = false;
        let lineNumber = 0;
        
        for (let line of lines) {
            lineNumber++;
            line = line.trim();
            
            // Check if we're in l_english section
            if (line === 'l_english:') {
                inLEnglish = true;
                continue;
            }
            
            if (!inLEnglish) continue;
            
            // Skip empty lines and comments
            if (!line || line.startsWith('#')) continue;
            
            // Check if this is a key-value pair
            if (line.includes(':') && !line.startsWith(' ')) {
                try {
                    const colonIndex = line.indexOf(':');
                    const key = line.substring(0, colonIndex).trim();
                    let value = line.substring(colonIndex + 1).trim();
                    
                    // ط§ظ„طھط­ظ‚ظ‚ ظ…ظ† ط£ظ† ط§ظ„ظ…ظپطھط§ط­ ظ„ظٹط³ ظپط§ط±ط؛ط§ظ‹
                    if (!key) {
                        console.warn(`ظ…ظپطھط§ط­ ظپط§ط±ط؛ ظپظٹ ط§ظ„ط³ط·ط± ${lineNumber}: ${line}`);
                        continue;
                    }
                    
                    // Extract text between quotes only
                    if (typeof cleanText === 'function') {
                        value = cleanText(value);
                    } else {
                        // Fallback cleaning
                        value = value.replace(/#NT!/g, '').replace(/#[A-Z0-9]+!/g, '').replace(/"/g, '').trim();
                    }
                    
                    yamlData[key] = value;
                } catch (lineError) {
                    console.warn(`ط®ط·ط£ ظپظٹ ظ…ط¹ط§ظ„ط¬ط© ط§ظ„ط³ط·ط± ${lineNumber}: ${line}`, lineError);
                    continue;
                }
            }
        }
        
        // ط§ظ„طھط­ظ‚ظ‚ ظ…ظ† ظˆط¬ظˆط¯ ط¨ظٹط§ظ†ط§طھ
        if (Object.keys(yamlData).length === 0) {
            throw new Error('ظ„ظ… ظٹطھظ… ط§ظ„ط¹ط«ظˆط± ط¹ظ„ظ‰ ط£ظٹ طھط±ط¬ظ…ط§طھ ظپظٹ ط§ظ„ظ…ظ„ظپ. طھط£ظƒط¯ ظ…ظ† ط£ظ† ط§ظ„ظ…ظ„ظپ ظٹط­طھظˆظٹ ط¹ظ„ظ‰ ظ‚ط³ظ… l_english: ظ…ط¹ طھط±ط¬ظ…ط§طھ طµط­ظٹط­ط©');
        }
        
        // Reset unsaved changes first - ظ‚ط¨ظ„ ظƒظ„ ط´ظٹط،
        window.hasUnsavedChanges = false;
        hasUnsavedChanges = false;
        
        window.modifiedKeys.clear(); // Clear modified keys when loading new file
        modifiedKeys.clear();
        
        window.currentEditingKey = ''; // Clear current editing key
        currentEditingKey = '';
        
        window.currentEditedValue = ''; // ظ…ط³ط­ ط§ظ„ظ†طµ ط§ظ„ظ…ظڈط¹ط¯ظ„ ظ…ظ† ط§ظ„ظ…ظ„ظپ ط§ظ„ط³ط§ط¨ظ‚
        currentEditedValue = '';
        
        // ظ…ط³ط­ ط¹ظ†طµط± ط§ظ„ظ†طµ ظپظٹ ط§ظ„ظˆط§ط¬ظ‡ط© ط£ظٹط¶ط§ظ‹ (ظ…ظ‡ظ… ط¬ط¯ط§ظ‹!)
        const translationText = document.getElementById('translationText');
        if (translationText) {
            translationText.value = '';
            console.log('ًں—‘ï¸ڈ طھظ… ظ…ط³ط­ ط¹ظ†طµط± ط§ظ„ظ†طµ ظپظٹ ط§ظ„ظˆط§ط¬ظ‡ط©');
        }
        
        console.log('ًں—‘ï¸ڈ طھظ… ظ…ط³ط­ ط¬ظ…ظٹط¹ ط¨ظٹط§ظ†ط§طھ ط§ظ„طھط¹ط¯ظٹظ„ ظ…ظ† ط§ظ„ظ…ظ„ظپ ط§ظ„ط³ط§ط¨ظ‚');
        
        // Update global translation data
        window.translations = yamlData;
        translations = yamlData;
        
        window.originalTranslations = { ...yamlData };
        originalTranslations = { ...yamlData };
        
        window.translationKeys = Object.keys(yamlData);
        translationKeys = Object.keys(yamlData);
        
        window.filteredTranslations = { ...yamlData };
        filteredTranslations = { ...yamlData };
        
        // ظ„ط§ ظ†ظ…ط³ط­ englishTranslations ط¥ط°ط§ ظƒط§ظ†طھ ظ…ظˆط¬ظˆط¯ط© ط¨ط§ظ„ظپط¹ظ„ (ظ…ط­ظپظˆط¸ط© ظ…ظ† ظ‚ط¨ظ„)
        // ظپظ‚ط· ظ†ظ…ط³ط­ظ‡ط§ ط¥ط°ط§ ظƒط§ظ†طھ ظپط§ط±ط؛ط© ط£ظˆ ظ„ظ…ظ„ظپ ظ…ط®طھظ„ظپ
        const shouldResetEnglish = !englishTranslations || 
                                   Object.keys(englishTranslations).length === 0 ||
                                   !currentFile ||
                                   (currentFile.lastEnglishFile && currentFile.lastEnglishFile !== filename);
        
        if (shouldResetEnglish) {
            window.englishTranslations = {};
            englishTranslations = {};
            console.log('ًں”„ طھظ… ط¥ط¹ط§ط¯ط© طھط¹ظٹظٹظ† ط§ظ„ظ†طµظˆطµ ط§ظ„ط¥ظ†ط¬ظ„ظٹط²ظٹط© ظ„ظ„ظ…ظ„ظپ ط§ظ„ط¬ط¯ظٹط¯');
        } else {
            console.log('âœ… طھظ… ط§ظ„ط§ط­طھظپط§ط¸ ط¨ط§ظ„ظ†طµظˆطµ ط§ظ„ط¥ظ†ط¬ظ„ظٹط²ظٹط© ط§ظ„ظ…ط­ظپظˆط¸ط© ظ…ط³ط¨ظ‚ط§ظ‹');
        }
        
        // ظ…ط­ط§ظˆظ„ط© طھط­ظ…ظٹظ„ ط§ظ„ظ…ظ„ظپ ط§ظ„ط¥ظ†ط¬ظ„ظٹط²ظٹ ط§ظ„ظ…ط·ط§ط¨ظ‚ (ظپظٹ ط§ظ„ط®ظ„ظپظٹط©)
        setTimeout(() => loadEnglishReferenceFile(filename), 100);
        
        window.currentIndex = 0;
        currentIndex = 0;
        
        if (typeof populateTranslationList === 'function') {
            populateTranslationList();
        }
        
        if (typeof updateStats === 'function') {
            updateStats();
        }
        
        if (typeof updateStatus === 'function') {
            updateStatus(filename);
        }
        
        // Load first translation
        if (translationKeys.length > 0 && typeof selectTranslationByIndex === 'function') {
            selectTranslationByIndex(0);
        }
        
        if (typeof updateSaveButton === 'function') {
            updateSaveButton();
        }
        
        // Save to localStorage
        if (typeof saveToLocalStorage === 'function') {
            saveToLocalStorage();
        }
        
        console.log(`طھظ… طھط­ظ…ظٹظ„ ${Object.keys(yamlData).length} طھط±ط¬ظ…ط© ط¨ظ†ط¬ط§ط­ ظ…ظ† ط§ظ„ظ…ظ„ظپ: ${filename}`);
        
        // ط¥ط®ظپط§ط، ط´ط§ط´ط© ط§ظ„طھط­ظ…ظٹظ„ ط¨ط¹ط¯ ط§ظ„ط§ظ†طھظ‡ط§ط، ظ…ظ† ط§ظ„طھط­ظ…ظٹظ„ ط§ظ„ط£ط³ط§ط³ظٹ
        setTimeout(() => {
            if (typeof hideLoading === 'function') {
                hideLoading();
            }
        }, 50);
        
    } catch (error) {
        if (typeof hideLoading === 'function') {
            hideLoading();
        }
        console.error('ط®ط·ط£ ظپظٹ طھط­ظ„ظٹظ„ YAML:', error);
        throw new Error(`ط®ط·ط£ ظپظٹ طھط­ظ„ظٹظ„ YAML: ${error.message}`);
    }
}

// طھط­ظ…ظٹظ„ ظ…ظ„ظپ ط¥ظ†ط¬ظ„ظٹط²ظٹ ظ…ط±ط¬ط¹ظٹ ظ…ظ† ظ…ط¬ظ„ط¯ english (ط§ط®طھظٹط§ط±ظٹ ظ„ظ…ظ‚ط§ط±ظ†ط© ط¥ط¶ط§ظپظٹط©)
async function loadEnglishReferenceFile(filename) {
    try {
        if (!filename) {
            console.log('â„¹ï¸ڈ ظ„ط§ ظٹظˆط¬ط¯ ط§ط³ظ… ظ…ظ„ظپ ظ„طھط­ظ…ظٹظ„ ط§ظ„ظ…ط±ط¬ط¹ ط§ظ„ط¥ظ†ط¬ظ„ظٹط²ظٹ');
            return;
        }
        
        const englishFileName = filename.replace(/^.*[\\\/]/, ''); // ط¥ط²ط§ظ„ط© ط§ظ„ظ…ط³ط§ط±
        const englishFilePath = `english/${englishFileName}`;
        
        console.log(`ًں”چ ظ…ط­ط§ظˆظ„ط© طھط­ظ…ظٹظ„ ط§ظ„ظ…ظ„ظپ ط§ظ„ط¥ظ†ط¬ظ„ظٹط²ظٹ: ${englishFilePath}`);
        
        const response = await fetch(englishFilePath);
        
        if (!response.ok) {
            console.log(`â„¹ï¸ڈ ظ„ط§ ظٹظˆط¬ط¯ ظ…ظ„ظپ ط¥ظ†ط¬ظ„ظٹط²ظٹ ظ…ط·ط§ط¨ظ‚: ${englishFilePath}`);
            return;
        }
        
        const englishContent = await response.text();
        console.log(`ًں“– طھظ… ط§ظ„ط¹ط«ظˆط± ط¹ظ„ظ‰ ط§ظ„ظ…ظ„ظپ ط§ظ„ط¥ظ†ط¬ظ„ظٹط²ظٹ: ${englishFilePath}`);
        
        // Parse English YAML
        const additionalEnglishData = parseYAMLContent(englishContent);
        
        if (additionalEnglishData && Object.keys(additionalEnglishData).length > 0) {
            // ط­ظپط¸ ط£ظˆ ط¯ظ…ط¬ ط§ظ„ظ†طµظˆطµ ط§ظ„ط¥ظ†ط¬ظ„ظٹط²ظٹط©
            if (!englishTranslations) {
                englishTranslations = {};
                window.englishTranslations = {};
            }
            
            let addedCount = 0;
            let updatedCount = 0;
            
            for (const [key, value] of Object.entries(additionalEnglishData)) {
                if (englishTranslations[key]) {
                    updatedCount++;
                } else {
                    addedCount++;
                }
                window.englishTranslations[key] = value;
                englishTranslations[key] = value;
            }
            
            // ط­ظپط¸ ظ…ط¹ظ„ظˆظ…ط§طھ ط¹ظ† ط§ظ„ظ…ظ„ظپ ط§ظ„ط¥ظ†ط¬ظ„ظٹط²ظٹ ط§ظ„ظ…ط­ظ…ظ„
            if (currentFile) {
                currentFile.lastEnglishFile = filename;
                window.currentFile = currentFile;
            }
            
            console.log(`âœ… طھظ… طھط­ظ…ظٹظ„ ${addedCount + updatedCount} ظ†طµ ط¥ظ†ط¬ظ„ظٹط²ظٹ (${addedCount} ط¬ط¯ظٹط¯طŒ ${updatedCount} ظ…ط­ط¯ط«)`);
            
            // ط­ظپط¸ ط§ظ„ط¨ظٹط§ظ†ط§طھ ط§ظ„ظ…ط­ط¯ط«ط©
            if (typeof saveToLocalStorage === 'function') {
                saveToLocalStorage();
            }
            
            // طھط­ط¯ظٹط« ط§ظ„ط¹ط±ط¶ ط¥ط°ط§ ظƒط§ظ† ظ‡ظ†ط§ظƒ ظ†طµ ظ…ط®طھط§ط± ط­ط§ظ„ظٹط§ظ‹
            if (typeof selectTranslationByIndex === 'function' && currentIndex >= 0) {
                setTimeout(() => {
                    selectTranslationByIndex(currentIndex);
                }, 100);
            }
            
            if (typeof showNotification === 'function') {
                showNotification(
                    `ًں“– طھظ… طھط­ظ…ظٹظ„ ط§ظ„ظ…ظ„ظپ ط§ظ„ط¥ظ†ط¬ظ„ظٹط²ظٹ ط§ظ„ظ…ط±ط¬ط¹ظٹ!\n\n` +
                    `ًں“پ ط§ظ„ظ…ظ„ظپ: ${englishFileName}\n` +
                    `ًں“‌ ط§ظ„ظ†طµظˆطµ: ${addedCount + updatedCount}\n` +
                    `âœ… ط§ظ„ظ…ط±ط§ط¬ط¹ ظ…طھظˆظپط±ط© ط§ظ„ط¢ظ†`,
                    'success'
                );
            }
        }
        
    } catch (error) {
        console.log(`â„¹ï¸ڈ ظ„ظ… ظٹطھظ… ط§ظ„ط¹ط«ظˆط± ط¹ظ„ظ‰ ظ…ظ„ظپ ط¥ظ†ط¬ظ„ظٹط²ظٹ ظ…ط·ط§ط¨ظ‚: ${error.message}`);
        // ظ„ظٹط³ ط®ط·ط£ ظپط§ط¯ط­ - ظ…ط¬ط±ط¯ ط¹ط¯ظ… ظˆط¬ظˆط¯ ظ…ظ„ظپ ظ…ط±ط¬ط¹ظٹ
    }
}

// ط¯ط§ظ„ط© ظ…ط³ط§ط¹ط¯ط© ظ„طھط­ظ„ظٹظ„ ظ…ط­طھظˆظ‰ YAML
function parseYAMLContent(content) {
    const lines = content.split('\n');
    const yamlData = {};
    let inLEnglish = false;
    
    for (let line of lines) {
        line = line.trim();
        
        // Check if we're in l_english section
        if (line === 'l_english:') {
            inLEnglish = true;
            continue;
        }
        
        if (!inLEnglish) continue;
        
        // Skip empty lines and comments
        if (!line || line.startsWith('#')) continue;
        
        // Check if this is a key-value pair
        if (line.includes(':') && !line.startsWith(' ')) {
            try {
                const colonIndex = line.indexOf(':');
                const key = line.substring(0, colonIndex).trim();
                let value = line.substring(colonIndex + 1).trim();
                
                if (!key) continue;
                
                // Extract text between quotes only
                if (typeof cleanText === 'function') {
                    value = cleanText(value);
                } else {
                    // Fallback cleaning
                    value = value.replace(/#NT!/g, '').replace(/#[A-Z0-9]+!/g, '').replace(/"/g, '').trim();
                }
                
                yamlData[key] = value;
            } catch (lineError) {
                continue;
            }
        }
    }
    
    return yamlData;
}

// Make functions available globally
if (typeof window !== 'undefined') {
    window.openFile = openFile;
    window.handleFileSelect = handleFileSelect;
    window.handleFile = handleFile;
    window.loadYamlContent = loadYamlContent;
    window.loadEnglishReferenceFile = loadEnglishReferenceFile;
    window.parseYAMLContent = parseYAMLContent;
} 
// ===========================================
// FILE OPERATIONS - ط¹ظ…ظ„ظٹط§طھ ط§ظ„ظ…ظ„ظپط§طھ
// ===========================================

// Translation operations
function updateTranslation() {
    if (!currentEditingKey) {
        if (typeof showNotification === 'function') {
            showNotification('ظٹط±ط¬ظ‰ ط§ط®طھظٹط§ط± طھط±ط¬ظ…ط© ط£ظˆظ„ط§ظ‹', 'warning');
        }
        return;
    }
    
    const key = currentEditingKey;
    const newValue = translationText ? translationText.value.trim() : '';
    
    // Store the clean text (without quotes and tags)
    if (translations) {
        translations[key] = newValue;
    }
    if (window.translations) {
        window.translations[key] = newValue;
    }
    
    if (filteredTranslations) {
        filteredTranslations[key] = newValue;
    }
    if (window.filteredTranslations) {
        window.filteredTranslations[key] = newValue;
    }
    
    // Update the list item
    if (translationList) {
        const items = translationList.querySelectorAll('.translation-item');
        if (items[currentIndex]) {
            const preview = newValue.length > (previewLength || 50) ? 
                newValue.substring(0, (previewLength || 50)) + '...' : newValue;
            const previewElement = items[currentIndex].querySelector('.translation-preview');
            if (previewElement) {
                previewElement.textContent = preview;
            }
        }
    }
    
    // Reset unsaved changes
    window.hasUnsavedChanges = false;
    hasUnsavedChanges = false;
    
    window.currentEditedValue = newValue;
    currentEditedValue = newValue;
    
    if (typeof updateSaveButton === 'function') {
        updateSaveButton();
    }
}

function undoChanges() {
    const key = translationKeys[currentIndex];
    
    if (!key) {
        console.log('â‌Œ ظ„ط§ ظٹظˆط¬ط¯ ظ…ظپطھط§ط­ ظ…ط­ط¯ط¯ ظ„ظ„ط¥ط±ط¬ط§ط¹');
        return;
    }
    
    // ط§ط³طھط±ط¬ط§ط¹ ط§ظ„ظ†طµ ط§ظ„ط£طµظ„ظٹ
    const originalValue = originalTranslations && originalTranslations[key] ? originalTranslations[key] : '';
    
    console.log(`ًں”„ ط¥ط±ط¬ط§ط¹ ط§ظ„ظ…ظپطھط§ط­ "${key}" ظ„ظ„ظ†طµ ط§ظ„ط£طµظ„ظٹ:`);
    console.log(`ًں“‌ ط§ظ„ظ†طµ ط§ظ„ط­ط§ظ„ظٹ: "${translations[key] || ''}"`);
    console.log(`ًں“‌ ط§ظ„ظ†طµ ط§ظ„ط£طµظ„ظٹ: "${originalValue}"`);
    
    // طھط­ط¯ظٹط« ط§ظ„ظ†طµ ظپظٹ ط¬ظ…ظٹط¹ ط§ظ„ظƒط§ط¦ظ†ط§طھ
    if (translations) {
        translations[key] = originalValue;
    }
    if (window.translations) {
        window.translations[key] = originalValue;
    }
    if (filteredTranslations) {
        filteredTranslations[key] = originalValue;
    }
    if (window.filteredTranslations) {
        window.filteredTranslations[key] = originalValue;
    }
    
    // ط¥ط²ط§ظ„ط© ط§ظ„ظ…ظپطھط§ط­ ظ…ظ† ظ‚ط§ط¦ظ…ط© ط§ظ„ظ…ظڈط¹ط¯ظ„ط©
    if (modifiedKeys) {
        modifiedKeys.delete(key);
    }
    if (window.modifiedKeys) {
        window.modifiedKeys.delete(key);
    }
    
    // طھط­ط¯ظٹط« ط§ظ„ظ…طھط؛ظٹط±ط§طھ ط§ظ„ظ…ط¤ظ‚طھط©
    window.currentEditedValue = originalValue;
    currentEditedValue = originalValue;
    window.hasUnsavedChanges = false;
    hasUnsavedChanges = false;
    
    console.log(`âœ… طھظ… ط¥ط±ط¬ط§ط¹ ط§ظ„ظ…ظپطھط§ط­ "${key}" ظ„ظ„ظ†طµ ط§ظ„ط£طµظ„ظٹ`);
    
    // طھط­ط¯ظٹط« ط¹ظ†طµط± ط§ظ„ظ†طµ ظپظٹ ط§ظ„ظˆط§ط¬ظ‡ط©
    if (translationText) {
        translationText.value = originalValue;
        
        // طھط­ط¯ظٹط« ط¹ظ†طµط± ط§ظ„ظ‚ط§ط¦ظ…ط©
        if (translationList) {
            const items = translationList.querySelectorAll('.translation-item');
            if (items[currentIndex]) {
                items[currentIndex].classList.remove('modified');
                
                // طھط­ط¯ظٹط« ط§ظ„ظ…ط¹ط§ظٹظ†ط© ظپظٹ ط§ظ„ظ‚ط§ط¦ظ…ط©
                const preview = originalValue.length > (previewLength || 50) ? 
                    originalValue.substring(0, (previewLength || 50)) + '...' : originalValue;
                const previewElement = items[currentIndex].querySelector('.translation-preview');
                if (previewElement) {
                    previewElement.textContent = preview;
                }
            }
        }
        
        // طھط­ط¯ظٹط« blocks mode ط¥ط°ط§ ظƒط§ظ† ظ…ظپط¹ظ„ط§ظ‹
        const container = translationText.parentNode;
        if (container) {
            const blocksEditor = container.querySelector('.blocks-editor');
            if (blocksEditor && blocksEditor.style.display !== 'none') {
                setTimeout(() => {
                    if (typeof refreshBlocks === 'function') {
                        refreshBlocks(blocksEditor, translationText);
                    }
                    console.log('âœ… طھظ… طھط­ط¯ظٹط« ط§ظ„ط¨ظ„ظˆظƒط§طھ ط¨ط¹ط¯ ط¥ط¹ط§ط¯ط© ط§ظ„طھط¹ظٹظٹظ†');
                }, 50);
            }
        }
    }
    
    // طھط­ط¯ظٹط« ط§ظ„ظ†طµ ط§ظ„ظ…ط±ط¬ط¹ظٹ ط¥ط°ط§ ظƒط§ظ† ظ…طھظˆظپط±ط§ظ‹
    const englishText = englishTranslations ? englishTranslations[key] : '';
    if (englishText && typeof updateOriginalTextDisplay === 'function') {
        updateOriginalTextDisplay(englishText, originalValue);
    }
    
    if (typeof updateSaveButton === 'function') {
        updateSaveButton();
    }
    if (typeof updateStats === 'function') {
        updateStats();
    }
    
    if (typeof showNotification === 'function') {
        showNotification('طھظ… ط¥ط¹ط§ط¯ط© طھط¹ظٹظٹظ† ط§ظ„طھط±ط¬ظ…ط© ط¥ظ„ظ‰ ط§ظ„ظ‚ظٹظ…ط© ط§ظ„ط£طµظ„ظٹط©', 'success');
    }
    console.log('âœ… طھظ… ط¥ط¹ط§ط¯ط© طھط¹ظٹظٹظ† ط§ظ„طھط±ط¬ظ…ط© ط¨ظ†ط¬ط§ط­');
}

// Save operations
function saveAllChanges() {
    if (!currentFile) {
        if (typeof showNotification === 'function') {
            showNotification('ظٹط±ط¬ظ‰ ظپطھط­ ظ…ظ„ظپ ط£ظˆظ„ط§ظ‹', 'warning');
        }
        return;
    }
    
    // Save all changes to the current translation
    if (hasUnsavedChanges && translationText) {
        const key = translationKeys ? translationKeys[currentIndex] : '';
        const newValue = translationText.value.trim();
        
        // Store the clean text (without quotes and tags)
        if (translations && key) {
            translations[key] = newValue;
        }
        if (window.translations && key) {
            window.translations[key] = newValue;
        }
        
        if (filteredTranslations && key) {
            filteredTranslations[key] = newValue;
        }
        if (window.filteredTranslations && key) {
            window.filteredTranslations[key] = newValue;
        }
        
        // Mark as modified
        if (modifiedKeys && key) {
            modifiedKeys.add(key);
        }
        if (window.modifiedKeys && key) {
            window.modifiedKeys.add(key);
        }
        
        // Update the list item
        if (translationList) {
            const items = translationList.querySelectorAll('.translation-item');
            if (items[currentIndex]) {
                // طھظ†ط¸ظٹظپ ط§ظ„ظ†طµ ظ„ظ„ظ…ط¹ط§ظٹظ†ط©
                let cleanNewValue = newValue;
                if (typeof cleanText === 'function') {
                    cleanNewValue = cleanText(newValue);
                }
                
                const preview = cleanNewValue.length > (previewLength || 50) ? 
                    cleanNewValue.substring(0, (previewLength || 50)) + '...' : cleanNewValue;
                const previewElement = items[currentIndex].querySelector('.translation-preview');
                if (previewElement) {
                    previewElement.textContent = preview;
                }
                items[currentIndex].classList.add('modified');
            }
        }
        
        if (typeof updateStats === 'function') {
            updateStats();
        }
        
        // Reset unsaved changes for current translation
        window.hasUnsavedChanges = false;
        hasUnsavedChanges = false;
        window.currentEditedValue = newValue;
        currentEditedValue = newValue;
    }
    
    saveToFile(currentFile.name);
    
    // Clear all modifications after saving
    if (modifiedKeys && modifiedKeys.clear) {
        modifiedKeys.clear();
    }
    if (window.modifiedKeys && window.modifiedKeys.clear) {
        window.modifiedKeys.clear();
    }
    
    window.hasUnsavedChanges = false;
    hasUnsavedChanges = false;
    // Note: currentEditingKey is kept as user might continue editing the same translation
    
    // Remove modified class from all items in the DOM
    if (translationList) {
        const allItems = translationList.querySelectorAll('.translation-item.modified');
        allItems.forEach(item => {
            item.classList.remove('modified');
        });
    }
    
    if (typeof updateSaveButton === 'function') {
        updateSaveButton();
    }
    if (typeof updateStats === 'function') {
        updateStats();
    }
    
    if (typeof showNotification === 'function') {
        showNotification('طھظ… ط­ظپط¸ ط§ظ„ظ…ظ„ظپ ط¨ظ†ط¬ط§ط­!', 'success');
    }
}

function saveFile() {
    if (!currentFile) {
        if (typeof showNotification === 'function') {
            showNotification('ظٹط±ط¬ظ‰ طھط­ظ…ظٹظ„ ظ…ظ„ظپ ط£ظˆظ„ط§ظ‹ ظ‚ط¨ظ„ ط§ظ„ط­ظپط¸', 'warning');
        }
        return;
    }
    
    // طھط­ظ‚ظ‚ ظ…ظ† ط£ظ† ظ‡ط°ط§ ط£ظˆظ„ ط­ظپط¸ ظ„ظ„ظ…ط³طھط®ط¯ظ…
    const hasSeenSaveExplanation = localStorage.getItem('paradox_editor_save_explained');
    
    if (typeof showNotification === 'function') {
        if (!hasSeenSaveExplanation) {
            // ط±ط³ط§ظ„ط© طھظˆط¶ظٹط­ظٹط© ظ„ط£ظˆظ„ ظ…ط±ط©
            showNotification(
                'ًں’¾ ظ…ط¹ظ„ظˆظ…ط§طھ ظ…ظ‡ظ…ط© ط¹ظ† ط§ظ„ط­ظپط¸:\n\n' +
                'ًں”„ ط§ظ„طھط®ط²ظٹظ† ط§ظ„طھظ„ظ‚ط§ط¦ظٹ: ظٹط­ظپط¸ ط¹ظ…ظ„ظƒ ظپظٹ ط§ظ„ظ…طھطµظپط­ ظپظ‚ط·\n' +
                'ًں“پ ط­ظپط¸ ط§ظ„ظ…ظ„ظپ: ظٹظ†ط²ظ„ ط§ظ„ظ…ظ„ظپ ط§ظ„ظ…ط­ط¯ط« ط¹ظ„ظ‰ ط¬ظ‡ط§ط²ظƒ\n\n' +
                'âœ… ط§ظ„ط¢ظ† ط³ظٹطھظ… طھظ†ط²ظٹظ„ ط§ظ„ظ…ظ„ظپ ط§ظ„ظ…ط­ط¯ط«...',
                'info'
            );
            localStorage.setItem('paradox_editor_save_explained', 'true');
            
            // ط§ظ†طھط¸ط§ط± ظ‚ظ„ظٹظ„ ظ‚ط¨ظ„ ط§ظ„ط­ظپط¸ ظ„ظٹظ‚ط±ط£ ط§ظ„ظ…ط³طھط®ط¯ظ… ط§ظ„ط±ط³ط§ظ„ط©
            setTimeout(() => {
                saveToFile(currentFile);
            }, 3000);
        } else {
            // ط­ظپط¸ ط¹ط§ط¯ظٹ
            showNotification('ط¬ط§ط±ظٹ ط­ظپط¸ ط§ظ„ظ…ظ„ظپ...', 'info');
            saveToFile(currentFile);
        }
    } else {
        saveToFile(currentFile);
    }
}

function saveAsFile() {
    const filename = prompt('ط£ط¯ط®ظ„ ط§ط³ظ… ط§ظ„ظ…ظ„ظپ:', 'translation.yml');
    if (filename) {
        saveToFile(filename);
    }
}

function saveToFile(filename) {
    try {
        // Create YAML content
        let yamlContent = 'l_english:\n';
        
        const translationsToSave = translations || {};
        Object.entries(translationsToSave).forEach(([key, value]) => {
            // Add quotes around the value for proper YAML format
            const escapedValue = value.replace(/"/g, '\\"');
            yamlContent += `  ${key}: "${escapedValue}"\n`;
        });
        
        // Create and download file
        const blob = new Blob([yamlContent], { type: 'text/yaml;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename.endsWith('.yml') ? filename : filename + '.yml';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        // ط¥ط¹ط§ط¯ط© طھط¹ظٹظٹظ† ط­ط§ظ„ط© ط§ظ„طھط¹ط¯ظٹظ„ط§طھ
        if (typeof modifiedKeys !== 'undefined') {
            modifiedKeys.clear();
        }
        hasUnsavedChanges = false;
        
        if (typeof updateStatus === 'function') {
            updateStatus(filename);
        }
        
        if (typeof updateSaveButton === 'function') {
            updateSaveButton();
        }
        
        // ط±ط³ط§ظ„ط© ظ†ط¬ط§ط­ ظˆط§ط¶ط­ط©
        if (typeof showNotification === 'function') {
            const downloadName = filename.endsWith('.yml') ? filename : filename + '.yml';
            showNotification(
                `âœ… طھظ… ط­ظپط¸ ط§ظ„ظ…ظ„ظپ ط¨ظ†ط¬ط§ط­!\n\n` +
                `ًں“پ ط§ط³ظ… ط§ظ„ظ…ظ„ظپ: ${downloadName}\n` +
                `ًں“چ طھظ… طھظ†ط²ظٹظ„ظ‡ ظپظٹ ظ…ط¬ظ„ط¯ Downloads\n` +
                `ًں’¾ ط¬ظ…ظٹط¹ ط§ظ„طھط¹ط¯ظٹظ„ط§طھ ظ…ط­ظپظˆط¸ط© ظپظٹ ط§ظ„ظ…ظ„ظپ`,
                'success'
            );
        }
        
        console.log(`âœ… طھظ… ط­ظپط¸ ط§ظ„ظ…ظ„ظپ ط¨ظ†ط¬ط§ط­: ${filename}`);
        
    } catch (error) {
        if (typeof showNotification === 'function') {
            showNotification(`ط®ط·ط£ ظپظٹ ط­ظپط¸ ط§ظ„ظ…ظ„ظپ: ${error.message}`, 'error');
        }
    }
}

// Make functions available globally
if (typeof window !== 'undefined') {
    window.updateTranslation = updateTranslation;
    window.undoChanges = undoChanges;
    window.saveAllChanges = saveAllChanges;
    window.saveFile = saveFile;
    window.saveAsFile = saveAsFile;
    window.saveToFile = saveToFile;
} 
// ===========================================
// TRANSLATION SERVICES - ط®ط¯ظ…ط§طھ ط§ظ„طھط±ط¬ظ…ط©
// ===========================================

// Service name mapping
function getServiceName(service) {
    const names = {
        mymemory: 'MyMemory',
        claude: 'Claude',
        chatgpt: 'ChatGPT',
        gemini: 'Gemini',
        deepl: 'DeepL',
        google: 'Google Translate'
    };
    return names[service] || service;
}

// MyMemory Translation (ظ…ط¬ط§ظ†ظٹ - ط¨ط¯ظˆظ† API key)
async function translateWithMyMemory(text) {
    console.log('ًںŒگ MyMemory: ط¨ط¯ط، ط§ظ„طھط±ط¬ظ…ط© ظ„ظ„ظ†طµ:', text);
    
    if (!text || text.trim() === '') {
        throw new Error('ط§ظ„ظ†طµ ط§ظ„ظ…ظڈط±ط§ط¯ طھط±ط¬ظ…طھظ‡ ظپط§ط±ط؛');
    }
    
    const cleanText = text.trim();
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(cleanText)}&langpair=en|ar`;
    console.log('ًں”— MyMemory URL:', url);
    
    try {
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`ط®ط·ط£ HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('ًں“¥ MyMemory response:', data);
        
        if (data.responseStatus === 200 && data.responseData) {
            const translatedText = data.responseData.translatedText;
            if (translatedText && translatedText.trim() !== '') {
                const finalText = translatedText.trim();
                console.log('âœ… MyMemory طھط±ط¬ظ…ط© ظ†ط§ط¬ط­ط©:', finalText);
                return finalText;
            } else {
                throw new Error('ط§ظ„ظ†طµ ط§ظ„ظ…ظڈطھط±ط¬ظ… ظپط§ط±ط؛ ظ…ظ† MyMemory');
            }
        } else {
            console.error('â‌Œ MyMemory ط®ط·ط£ ظپظٹ ط§ظ„ط§ط³طھط¬ط§ط¨ط©:', data);
            throw new Error(data.responseDetails || 'ظپط´ظ„ ظپظٹ ط§ظ„طھط±ط¬ظ…ط© ظ…ظ† MyMemory');
        }
    } catch (error) {
        console.error('â‌Œ MyMemory ط®ط·ط£ ط¹ط§ظ…:', error);
        throw error;
    }
}

// Claude Translation
async function translateWithClaude(text) {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKeys.claude}`,
            'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
            model: 'claude-3-sonnet-20240229',
            max_tokens: 1000,
            messages: [{
                role: 'user',
                content: `طھط±ط¬ظ… ط§ظ„ظ†طµ ط§ظ„طھط§ظ„ظٹ ظ…ظ† ط§ظ„ط¥ظ†ط¬ظ„ظٹط²ظٹط© ط¥ظ„ظ‰ ط§ظ„ط¹ط±ط¨ظٹط©. ط§ظ„ظ†طµ ظ…ط®طµطµ ظ„ظ„ط¹ط¨ط© ظپظٹط¯ظٹظˆطŒ ظ„ط°ط§ ط§ط³طھط®ط¯ظ… ظ…طµط·ظ„ط­ط§طھ ظ…ظ†ط§ط³ط¨ط© ظ„ظ„ط£ظ„ط¹ط§ط¨. ط£ط¹ط·ظ†ظٹ ط§ظ„طھط±ط¬ظ…ط© ظپظ‚ط· ط¨ط¯ظˆظ† ط´ط±ط­ ط¥ط¶ط§ظپظٹ:\n\n"${text}"`
            }]
        })
    });
    
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'ط®ط·ط£ ظپظٹ ط®ط¯ظ…ط© Claude');
    }
    
    const data = await response.json();
    return data.content[0].text.trim().replace(/["""]/g, '');
}

// ChatGPT Translation
async function translateWithChatGPT(text) {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKeys.openai}`
        },
        body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: [{
                role: 'user',
                content: `طھط±ط¬ظ… ط§ظ„ظ†طµ ط§ظ„طھط§ظ„ظٹ ظ…ظ† ط§ظ„ط¥ظ†ط¬ظ„ظٹط²ظٹط© ط¥ظ„ظ‰ ط§ظ„ط¹ط±ط¨ظٹط©. ط§ظ„ظ†طµ ظ…ط®طµطµ ظ„ظ„ط¹ط¨ط© ظپظٹط¯ظٹظˆطŒ ظ„ط°ط§ ط§ط³طھط®ط¯ظ… ظ…طµط·ظ„ط­ط§طھ ظ…ظ†ط§ط³ط¨ط© ظ„ظ„ط£ظ„ط¹ط§ط¨. ط£ط¹ط·ظ†ظٹ ط§ظ„طھط±ط¬ظ…ط© ظپظ‚ط· ط¨ط¯ظˆظ† ط´ط±ط­ ط¥ط¶ط§ظپظٹ:\n\n"${text}"`
            }],
            max_tokens: 1000,
            temperature: 0.3
        })
    });
    
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'ط®ط·ط£ ظپظٹ ط®ط¯ظ…ط© ChatGPT');
    }
    
    const data = await response.json();
    return data.choices[0].message.content.trim().replace(/["""]/g, '');
}

// Gemini Translation
async function translateWithGemini(text) {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKeys.gemini}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            contents: [{
                parts: [{
                    text: `طھط±ط¬ظ… ط§ظ„ظ†طµ ط§ظ„طھط§ظ„ظٹ ظ…ظ† ط§ظ„ط¥ظ†ط¬ظ„ظٹط²ظٹط© ط¥ظ„ظ‰ ط§ظ„ط¹ط±ط¨ظٹط©. ط§ظ„ظ†طµ ظ…ط®طµطµ ظ„ظ„ط¹ط¨ط© ظپظٹط¯ظٹظˆطŒ ظ„ط°ط§ ط§ط³طھط®ط¯ظ… ظ…طµط·ظ„ط­ط§طھ ظ…ظ†ط§ط³ط¨ط© ظ„ظ„ط£ظ„ط¹ط§ط¨. ط£ط¹ط·ظ†ظٹ ط§ظ„طھط±ط¬ظ…ط© ظپظ‚ط· ط¨ط¯ظˆظ† ط´ط±ط­ ط¥ط¶ط§ظپظٹ:\n\n"${text}"`
                }]
            }]
        })
    });
    
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'ط®ط·ط£ ظپظٹ ط®ط¯ظ…ط© Gemini');
    }
    
    const data = await response.json();
    return data.candidates[0].content.parts[0].text.trim().replace(/["""]/g, '');
}

// DeepL Translation
async function translateWithDeepL(text) {
    const response = await fetch('https://api-free.deepl.com/v2/translate', {
        method: 'POST',
        headers: {
            'Authorization': `DeepL-Auth-Key ${apiKeys.deepl}`,
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
            text: text,
            source_lang: 'EN',
            target_lang: 'AR'
        })
    });
    
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'ط®ط·ط£ ظپظٹ ط®ط¯ظ…ط© DeepL');
    }
    
    const data = await response.json();
    return data.translations[0].text.trim();
}

// Google Translate
async function translateWithGoogle(text) {
    const response = await fetch(`https://translation.googleapis.com/language/translate/v2?key=${apiKeys.google}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            q: text,
            source: 'en',
            target: 'ar'
        })
    });
    
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'ط®ط·ط£ ظپظٹ ط®ط¯ظ…ط© Google Translate');
    }
    
    const data = await response.json();
    return data.data.translations[0].translatedText.trim();
}

// Make functions available globally
if (typeof window !== 'undefined') {
    window.getServiceName = getServiceName;
    window.translateWithMyMemory = translateWithMyMemory;
    window.translateWithClaude = translateWithClaude;
    window.translateWithChatGPT = translateWithChatGPT;
    window.translateWithGemini = translateWithGemini;
    window.translateWithDeepL = translateWithDeepL;
    window.translateWithGoogle = translateWithGoogle;
} 
// ===========================================
// TRANSLATION OPERATIONS - ط¹ظ…ظ„ظٹط§طھ ط§ظ„طھط±ط¬ظ…ط© ط§ظ„ط±ط¦ظٹط³ظٹط©
// ===========================================

// Main translation function
async function translateCurrentText() {
    // طھط­ظ‚ظ‚ ط´ط§ظ…ظ„ ظ…ظ† طµط­ط© ط§ظ„ط¹ظ†ط§طµط±
    console.log('ًں”چ ظپط­طµ ط§ظ„ط¹ظ†ط§طµط± ظ‚ط¨ظ„ ط§ظ„طھط±ط¬ظ…ط©...');
    
    if (!originalText) {
        if (typeof showNotification === 'function') {
            showNotification('ط¹ظ†طµط± ط§ظ„ظ†طµ ط§ظ„ظ…ط±ط¬ط¹ظٹ ط؛ظٹط± ظ…ظˆط¬ظˆط¯', 'error');
        }
        return;
    }
    
    if (!translationText) {
        console.error('â‌Œ translationText element ظ…ظپظ‚ظˆط¯');
        if (typeof showNotification === 'function') {
            showNotification('ط®ط·ط£: ط¹ظ†طµط± ط§ظ„طھط­ط±ظٹط± ظ…ظپظ‚ظˆط¯ - ظٹط±ط¬ظ‰ ط¥ط¹ط§ط¯ط© طھط­ظ…ظٹظ„ ط§ظ„طµظپط­ط©', 'error');
        }
        return;
    }
    
    // ط¥ط¹ط§ط¯ط© ط±ط¨ط· translationText ظ„ظ„طھط£ظƒط¯ ظ…ظ† ط§ظ„ظ…ط±ط¬ط¹ ط§ظ„طµط­ظٹط­
    const currentTranslationText = document.getElementById('translationText');
    if (!currentTranslationText) {
        console.error('â‌Œ ظ„ط§ ظٹظ…ظƒظ† ط§ظ„ط¹ط«ظˆط± ط¹ظ„ظ‰ ط¹ظ†طµط± translationText ظپظٹ DOM');
        if (typeof showNotification === 'function') {
            showNotification('ط®ط·ط£: ط¹ظ†طµط± ط§ظ„طھط­ط±ظٹط± ط؛ظٹط± ظ…ظˆط¬ظˆط¯ ظپظٹ ط§ظ„طµظپط­ط©', 'error');
        }
        return;
    }
    
    // طھط­ط¯ظٹط« ط§ظ„ظ…ط±ط¬ط¹ ط¥ط°ط§ ظ„ط²ظ… ط§ظ„ط£ظ…ط±
    if (translationText !== currentTranslationText) {
        console.warn('âڑ ï¸ڈ ط¥ط¹ط§ط¯ط© ط±ط¨ط· translationText element');
        window.translationText = currentTranslationText;
        // ط¥ط¹ط§ط¯ط© طھط¹ظٹظٹظ† ط§ظ„ظ…طھط؛ظٹط± ط§ظ„ظ…ط­ظ„ظٹ ط£ظٹط¶ط§ظ‹
        translationText = currentTranslationText;
    }
    
    console.log('âœ… ط¬ظ…ظٹط¹ ط§ظ„ط¹ظ†ط§طµط± طµط­ظٹط­ط©طŒ ط¨ط¯ط، ط§ظ„طھط±ط¬ظ…ط©...');
    
    // ط§ط³طھط®ط±ط§ط¬ ط§ظ„ظ†طµ ط§ظ„ط£طµظ„ظٹ - ط³ظˆط§ط، ظƒط§ظ† ظپظٹ ظˆط¶ط¹ ط§ظ„ط¨ظ„ظˆظƒط§طھ ط£ظˆ ط§ظ„ط¹ط§ط¯ظٹ
    let originalTextContent = '';
    
    if (originalText.classList && originalText.classList.contains('blocks-reference-mode')) {
        // ظپظٹ ظˆط¶ط¹ ط§ظ„ط¨ظ„ظˆظƒط§طھ - ط§ط³طھط®ط±ط§ط¬ ط§ظ„ظ†طµ ظ…ظ† ط§ظ„ط¨ظ„ظˆظƒط§طھ
        if (typeof convertBlocksToText === 'function') {
            originalTextContent = convertBlocksToText(originalText.innerHTML);
        } else {
            originalTextContent = originalText.textContent || originalText.innerText || '';
        }
        console.log('ًں“‹ ط§ط³طھط®ط±ط§ط¬ ظ…ظ† ظˆط¶ط¹ ط§ظ„ط¨ظ„ظˆظƒط§طھ:', originalTextContent);
    } else {
        // ظپظٹ ط§ظ„ظˆط¶ط¹ ط§ظ„ط¹ط§ط¯ظٹ
        originalTextContent = originalText.textContent || originalText.innerText || '';
    }
    
    console.log('ًں“‌ ط§ظ„ظ†طµ ط§ظ„ط£طµظ„ظٹ ظ„ظ„طھط±ط¬ظ…ط©:', originalTextContent);
    
    if (!originalTextContent || originalTextContent.trim() === '' || originalTextContent.includes('ط¶ط¹ ظ…ظ„ظپ')) {
        if (typeof showNotification === 'function') {
            showNotification('ظ„ط§ ظٹظˆط¬ط¯ ظ†طµ ظ…ط±ط¬ط¹ظٹ ظ„ظ„طھط±ط¬ظ…ط©', 'warning');
        }
        return;
    }
    
    const serviceElement = document.getElementById('translationService');
    const selectedService = serviceElement ? serviceElement.value : 'mymemory';
    
    // MyMemory ظ„ط§ ظٹط­طھط§ط¬ API key
    if (selectedService !== 'mymemory' && (!apiKeys || !apiKeys[selectedService])) {
        if (typeof showNotification === 'function') {
            showNotification(`ظٹط±ط¬ظ‰ ط¥ط¯ط®ط§ظ„ ظ…ظپطھط§ط­ ${getServiceName ? getServiceName(selectedService) : selectedService} ظپظٹ ط§ظ„ط¥ط¹ط¯ط§ط¯ط§طھ`, 'warning');
        }
        if (typeof openSettings === 'function') {
            openSettings();
        }
        return;
    }
    
    if (typeof showLoading === 'function') {
        showLoading();
    }
    
    try {
        let translatedText = '';
        
        console.log(`ًں”„ ط¨ط¯ط، ط§ظ„طھط±ط¬ظ…ط© ط¨ط§ط³طھط®ط¯ط§ظ… ${selectedService} ظ„ظ„ظ†طµ: "${originalTextContent}"`);
        
        switch (selectedService) {
            case 'mymemory':
                if (typeof translateWithMyMemory === 'function') {
                    translatedText = await translateWithMyMemory(originalTextContent);
                    console.log('âœ… MyMemory ط£ط±ط¬ط¹ ط§ظ„ظ†طµ:', translatedText);
                } else {
                    throw new Error('MyMemory service not available');
                }
                break;
            case 'claude':
                if (typeof translateWithClaude === 'function') {
                    translatedText = await translateWithClaude(originalTextContent);
                } else {
                    throw new Error('Claude service not available');
                }
                break;
            case 'chatgpt':
                if (typeof translateWithChatGPT === 'function') {
                    translatedText = await translateWithChatGPT(originalTextContent);
                } else {
                    throw new Error('ChatGPT service not available');
                }
                break;
            case 'gemini':
                if (typeof translateWithGemini === 'function') {
                    translatedText = await translateWithGemini(originalTextContent);
                } else {
                    throw new Error('Gemini service not available');
                }
                break;
            case 'deepl':
                if (typeof translateWithDeepL === 'function') {
                    translatedText = await translateWithDeepL(originalTextContent);
                } else {
                    throw new Error('DeepL service not available');
                }
                break;
            case 'google':
                if (typeof translateWithGoogle === 'function') {
                    translatedText = await translateWithGoogle(originalTextContent);
                } else {
                    throw new Error('Google Translate service not available');
                }
                break;
            default:
                throw new Error('ط®ط¯ظ…ط© طھط±ط¬ظ…ط© ط؛ظٹط± ظ…ط¯ط¹ظˆظ…ط©');
        }
        
        console.log('ًںژ¯ ط§ظ„ظ†طµ ط§ظ„ظ…طھط±ط¬ظ… ط§ظ„ظ†ظ‡ط§ط¦ظٹ:', translatedText);
        
        if (translatedText && translatedText.trim() !== '') {
            // ط¥ط¹ط§ط¯ط© ط§ظ„طھط­ظ‚ظ‚ ظ…ظ† translationText ظ‚ط¨ظ„ ط§ظ„طھط­ط¯ظٹط«
            const activeTranslationText = document.getElementById('translationText');
            if (!activeTranslationText) {
                console.error('â‌Œ ظپظ‚ط¯ ط¹ظ†طµط± translationText ط£ط«ظ†ط§ط، ط§ظ„طھط±ط¬ظ…ط©');
                if (typeof showNotification === 'function') {
                    showNotification('ط®ط·ط£: ظپظ‚ط¯ ط¹ظ†طµط± ط§ظ„طھط­ط±ظٹط± ط£ط«ظ†ط§ط، ط§ظ„طھط±ط¬ظ…ط©', 'error');
                }
                return;
            }
            
            // طھط­ط¯ظٹط« ط§ظ„ظ…ط±ط¬ط¹ ط¥ط°ط§ ظ„ط²ظ… ط§ظ„ط£ظ…ط±
            if (translationText !== activeTranslationText) {
                console.warn('âڑ ï¸ڈ ط¥ط¹ط§ط¯ط© ط±ط¨ط· translationText ظ‚ط¨ظ„ ط§ظ„طھط­ط¯ظٹط«');
                window.translationText = activeTranslationText;
                // ط¥ط¹ط§ط¯ط© طھط¹ظٹظٹظ† ط§ظ„ظ…طھط؛ظٹط± ط§ظ„ظ…ط­ظ„ظٹ ط£ظٹط¶ط§ظ‹
                translationText = activeTranslationText;
            }
            
            if (translationText) {
                const oldValue = translationText.value;
                translationText.value = translatedText;
            
                console.log(`ًں“‌ طھظ… طھط­ط¯ظٹط« ط§ظ„ظ…ط­ط±ط± ظ…ظ† "${oldValue}" ط¥ظ„ظ‰ "${translatedText}"`);
                
                // ط¥ط·ظ„ط§ظ‚ events ظ„طھط­ط¯ظٹط« ط§ظ„ظˆط§ط¬ظ‡ط©
                console.log('ًں”¥ ط¥ط·ظ„ط§ظ‚ events ظ„طھط­ط¯ظٹط« ط§ظ„ظˆط§ط¬ظ‡ط©...');
                
                // ط¥ط·ظ„ط§ظ‚ input event ظ„طھط­ط¯ظٹط« ط§ظ„ظˆط§ط¬ظ‡ط©
                const inputEvent = new Event('input', { bubbles: true });
                translationText.dispatchEvent(inputEvent);
                
                // ط¥ط·ظ„ط§ظ‚ change event ط£ظٹط¶ط§ظ‹
                const changeEvent = new Event('change', { bubbles: true });
                translationText.dispatchEvent(changeEvent);
                
                // طھط­ط¯ظٹط« ط­ط§ظ„ط© ط§ظ„طھط¹ط¯ظٹظ„ ظٹط¯ظˆظٹط§ظ‹
                window.hasUnsavedChanges = true;
                hasUnsavedChanges = true;
                
                if (currentEditingKey) {
                    if (window.modifiedKeys) {
                        window.modifiedKeys.add(currentEditingKey);
                    }
                    if (modifiedKeys) {
                        modifiedKeys.add(currentEditingKey);
                    }
                    
                    if (window.translations) {
                        window.translations[currentEditingKey] = translatedText;
                    }
                    if (translations) {
                        translations[currentEditingKey] = translatedText;
                    }
                    
                    if (window.filteredTranslations) {
                        window.filteredTranslations[currentEditingKey] = translatedText;
                    }
                    if (filteredTranslations) {
                        filteredTranslations[currentEditingKey] = translatedText;
                    }
                    
                    console.log(`âœ… طھظ… طھط­ط¯ظٹط« ط§ظ„طھط±ط¬ظ…ط© ظ„ظ„ظ…ظپطھط§ط­: ${currentEditingKey}`);
                }
                
                // طھط­ط¯ظٹط« preview ظپظٹ ط§ظ„ظ‚ط§ط¦ظ…ط©
                if (translationList) {
                    const items = translationList.querySelectorAll('.translation-item');
                    if (items[currentIndex]) {
                        items[currentIndex].classList.add('modified');
                        const preview = translatedText.length > (previewLength || 50) ? 
                            translatedText.substring(0, (previewLength || 50)) + '...' : translatedText;
                        const previewElement = items[currentIndex].querySelector('.translation-preview');
                        if (previewElement) {
                            previewElement.textContent = preview;
                        }
                        console.log('âœ… طھظ… طھط­ط¯ظٹط« preview ظپظٹ ط§ظ„ظ‚ط§ط¦ظ…ط©');
                    }
                }
                
                // طھط­ط¯ظٹط« ط§ظ„ط¥ط­طµط§ط¦ظٹط§طھ
                if (typeof updateStats === 'function') {
                    updateStats();
                }
                if (typeof updateSaveButton === 'function') {
                    updateSaveButton();
                }
                
                // ط§ظ„طھط±ظƒظٹط² ط¹ظ„ظ‰ ط§ظ„ظ…ط­ط±ط±
                translationText.focus();
                
                // ط§ظ„طھط­ظ‚ظ‚ ظ…ظ† ط£ظ† ط§ظ„طھط­ط¯ظٹط« طھظ… ط¨ظ†ط¬ط§ط­
                if (translationText.value === translatedText) {
                    console.log('âœ… طھط£ظƒظٹط¯: ط§ظ„ظ†طµ طھظ… طھط­ط¯ظٹط«ظ‡ ط¨ظ†ط¬ط§ط­ ظپظٹ ط§ظ„ظ…ط­ط±ط± ظˆط§ظ„ظˆط§ط¬ظ‡ط©');
                } else {
                    console.error('â‌Œ ظپط´ظ„ طھط­ط¯ظٹط« ط§ظ„ظ†طµ ظپظٹ ط§ظ„ظ…ط­ط±ط±');
                    if (typeof showNotification === 'function') {
                        showNotification('ط®ط·ط£ ظپظٹ طھط­ط¯ظٹط« ط§ظ„ظ†طµ ظپظٹ ط§ظ„ظ…ط­ط±ط±', 'error');
                    }
                    return;
                }
            } else {
                console.error('â‌Œ translationText element ط؛ظٹط± ظ…ظˆط¬ظˆط¯');
                if (typeof showNotification === 'function') {
                    showNotification('ط®ط·ط£ ظپظٹ طھط­ط¯ظٹط« ط§ظ„ظ†طµ - ظٹط±ط¬ظ‰ ط¥ط¹ط§ط¯ط© طھط­ظ…ظٹظ„ ط§ظ„طµظپط­ط©', 'error');
                }
                return;
            }
        } else {
            console.error('â‌Œ ط§ظ„ظ†طµ ط§ظ„ظ…طھط±ط¬ظ… ظپط§ط±ط؛ ط£ظˆ ط؛ظٹط± طµط§ظ„ط­:', translatedText);
            if (typeof showNotification === 'function') {
                showNotification('ط§ظ„ظ†طµ ط§ظ„ظ…طھط±ط¬ظ… ظپط§ط±ط؛ - ظٹط±ط¬ظ‰ ط§ظ„ظ…ط­ط§ظˆظ„ط© ظ…ط±ط© ط£ط®ط±ظ‰', 'warning');
            }
            return;
        }
            
        if (typeof showNotification === 'function' && typeof getServiceName === 'function') {
            showNotification(`طھظ… طھط±ط¬ظ…ط© ط§ظ„ظ†طµ ط¨ظˆط§ط³ط·ط© ${getServiceName(selectedService)} ًںژ¯`, 'success');
        }
        
    } catch (error) {
        console.error('ط®ط·ط£ ظپظٹ ط§ظ„طھط±ط¬ظ…ط©:', error);
        
        // ظ…ط¹ط§ظ„ط¬ط© ط£ط®ط·ط§ط، CORS ط¨ط´ظƒظ„ ط®ط§طµ
        if (error.message.includes('CORS') || error.message.includes('Failed to fetch')) {
            const serviceName = getServiceName ? getServiceName(selectedService) : selectedService;
            if (typeof showNotification === 'function') {
                showNotification(
                    `â‌Œ ط®ط·ط£ CORS ظ…ط¹ ${serviceName}\n\nًں’، ط§ظ„ط­ظ„ظˆظ„:\n` +
                    `â€¢ ط§ط³طھط®ط¯ظ… "MyMemory" (ظ…ط¬ط§ظ†ظٹ ط¨ط¯ظˆظ† ظ…ط´ط§ظƒظ„)\n` +
                    `â€¢ ظ†ط²ظ‘ظ„ CORS extension ظ„ظ„ظ…طھطµظپط­\n` +
                    `â€¢ ط£ظˆ ط§ظ†ط³ط® ط§ظ„ظ†طµ ظˆط§ط³طھط®ط¯ظ… ط§ظ„ط®ط¯ظ…ط© ط®ط§ط±ط¬ظٹط§ظ‹`, 
                    'warning'
                );
            }
        } else {
            if (typeof showNotification === 'function') {
                showNotification(`ط®ط·ط£ ظپظٹ ط§ظ„طھط±ط¬ظ…ط©: ${error.message}`, 'error');
            }
        }
    } finally {
        if (typeof hideLoading === 'function') {
            hideLoading();
        }
    }
}

// ظ…ظ‚ط§ط±ظ†ط© ط§ظ„ظ…ظپط§طھظٹط­ ظˆط¥ظٹط¬ط§ط¯ ط§ظ„ظ…ظپط§طھظٹط­ ط§ظ„ظ†ط§ظ‚طµط©
function findMissingKeys() {
    const translationKeysSet = new Set(Object.keys(translations || {}));
    const englishKeysSet = new Set(Object.keys(englishTranslations || {}));
    
    // ط§ظ„ظ…ظپط§طھظٹط­ ط§ظ„ظ…ظˆط¬ظˆط¯ط© ظپظٹ ط§ظ„ظ…ط±ط¬ط¹ ط§ظ„ط¥ظ†ط¬ظ„ظٹط²ظٹ ظˆظ„ظƒظ† ظ†ط§ظ‚طµط© ظپظٹ ط§ظ„ظ…ظ„ظپ ط§ظ„ظ…ط­ط±ط±
    const missingInTranslation = [...englishKeysSet].filter(key => !translationKeysSet.has(key));
    
    // ط§ظ„ظ…ظپط§طھظٹط­ ط§ظ„ظ…ظˆط¬ظˆط¯ط© ظپظٹ ط§ظ„ظ…ظ„ظپ ط§ظ„ظ…ط­ط±ط± ظˆظ„ظƒظ† ط؛ظٹط± ظ…ظˆط¬ظˆط¯ط© ظپظٹ ط§ظ„ظ…ط±ط¬ط¹
    const extraInTranslation = [...translationKeysSet].filter(key => !englishKeysSet.has(key));
    
    return {
        missingInTranslation,
        extraInTranslation,
        totalEnglish: englishKeysSet.size,
        totalTranslation: translationKeysSet.size
    };
}

// ط¹ط±ط¶ ط§ظ„ظ…ظپط§طھظٹط­ ط§ظ„ظ†ط§ظ‚طµط© ظˆط§ظ„ط¥ط¶ط§ظپظٹط©
function showMissingKeys() {
    if (!englishTranslations || Object.keys(englishTranslations).length === 0) {
        alert('âڑ ï¸ڈ ظ„ط§ ظٹظˆط¬ط¯ ظ…ط±ط¬ط¹ ط¥ظ†ط¬ظ„ظٹط²ظٹ ظ„ظ…ظ‚ط§ط±ظ†طھظ‡!\n\nطھط£ظƒط¯ ظ…ظ†:\nâ€¢ ظˆط¬ظˆط¯ ظ…ظ„ظپ ظ…ط·ط§ط¨ظ‚ ظپظٹ ظ…ط¬ظ„ط¯ english\nâ€¢ ظ†ظپط³ ط§ط³ظ… ط§ظ„ظ…ظ„ظپ ط§ظ„ظ…ط±ظپظˆط¹');
        return;
    }
    
    const comparison = findMissingKeys();
    
    let message = `ًں“ٹ طھط­ظ„ظٹظ„ ط§ظ„ظ…ظپط§طھظٹط­:\n\n`;
    message += `ًں“پ ط§ظ„ظ…ط±ط¬ط¹ ط§ظ„ط¥ظ†ط¬ظ„ظٹط²ظٹ: ${comparison.totalEnglish} ظ…ظپطھط§ط­\n`;
    message += `ًں“‌ ظ…ظ„ظپظƒ: ${comparison.totalTranslation} ظ…ظپطھط§ط­\n\n`;
    
    if (comparison.missingInTranslation.length > 0) {
        message += `â‌Œ ظ…ظپط§طھظٹط­ ظ†ط§ظ‚طµط© ظپظٹ ظ…ظ„ظپظƒ (${comparison.missingInTranslation.length}):\n`;
        comparison.missingInTranslation.slice(0, 10).forEach(key => {
            message += `â€¢ ${key}\n`;
        });
        
        if (comparison.missingInTranslation.length > 10) {
            message += `... ظˆ ${comparison.missingInTranslation.length - 10} ظ…ظپطھط§ط­ ط¢ط®ط±\n`;
        }
        message += `\n`;
    }
    
    if (comparison.extraInTranslation.length > 0) {
        message += `â‍• ظ…ظپط§طھظٹط­ ط¥ط¶ط§ظپظٹط© ظپظٹ ظ…ظ„ظپظƒ (${comparison.extraInTranslation.length}):\n`;
        comparison.extraInTranslation.slice(0, 5).forEach(key => {
            message += `â€¢ ${key}\n`;
        });
        
        if (comparison.extraInTranslation.length > 5) {
            message += `... ظˆ ${comparison.extraInTranslation.length - 5} ظ…ظپطھط§ط­ ط¢ط®ط±\n`;
        }
        message += `\n`;
    }
    
    if (comparison.missingInTranslation.length === 0 && comparison.extraInTranslation.length === 0) {
        message += `âœ… ظ…ظ…طھط§ط²! ط¬ظ…ظٹط¹ ط§ظ„ظ…ظپط§طھظٹط­ ظ…طھط·ط§ط¨ظ‚ط© ظ…ط¹ ط§ظ„ظ…ط±ط¬ط¹ ط§ظ„ط¥ظ†ط¬ظ„ظٹط²ظٹ`;
    } else {
        message += `ًں’، ظ‡ظ„ طھط±ظٹط¯ ط¥ط¶ط§ظپط© ط§ظ„ظ…ظپط§طھظٹط­ ط§ظ„ظ†ط§ظ‚طµط© طھظ„ظ‚ط§ط¦ظٹط§ظ‹طں`;
    }
    
    const addMissing = comparison.missingInTranslation.length > 0 && 
                     confirm(message + '\n\nط§ط¶ط؛ط· "ظ…ظˆط§ظپظ‚" ظ„ط¥ط¶ط§ظپط© ط§ظ„ظ…ظپط§طھظٹط­ ط§ظ„ظ†ط§ظ‚طµط© طھظ„ظ‚ط§ط¦ظٹط§ظ‹');
    
    if (addMissing) {
        addMissingKeysToTranslation(comparison.missingInTranslation);
    } else {
        alert(message);
    }
}

// ط¥ط¶ط§ظپط© ط§ظ„ظ…ظپط§طھظٹط­ ط§ظ„ظ†ط§ظ‚طµط© ظ„ظ„ظ…ظ„ظپ
function addMissingKeysToTranslation(missingKeys) {
    let addedCount = 0;
    
    missingKeys.forEach(key => {
        if (englishTranslations && englishTranslations[key]) {
            // ط£ط¶ظپ ط§ظ„ظ…ظپطھط§ط­ ظ…ط¹ ط§ظ„ظ†طµ ط§ظ„ط¥ظ†ط¬ظ„ظٹط²ظٹ ط§ظ„ط£طµظ„ظٹ
            if (translations) {
                translations[key] = englishTranslations[key];
            }
            if (window.translations) {
                window.translations[key] = englishTranslations[key];
            }
            
            if (filteredTranslations) {
                filteredTranslations[key] = englishTranslations[key];
            }
            if (window.filteredTranslations) {
                window.filteredTranslations[key] = englishTranslations[key];
            }
            
            // ط£ط¶ظپ ط¥ظ„ظ‰ ط§ظ„ظ†طµظˆطµ ط§ظ„ط£طµظ„ظٹط© ط£ظٹط¶ط§ظ‹
            if (originalTranslations) {
                originalTranslations[key] = englishTranslations[key];
            }
            if (window.originalTranslations) {
                window.originalTranslations[key] = englishTranslations[key];
            }
            
            addedCount++;
        }
    });
    
    if (addedCount > 0) {
        // طھط­ط¯ظٹط« ظ‚ط§ط¦ظ…ط© ط§ظ„ظ…ظپط§طھظٹط­
        const newKeys = Object.keys(translations || {});
        if (window.translationKeys) {
            window.translationKeys = newKeys;
        }
        translationKeys = newKeys;
        
        // ط¥ط¹ط§ط¯ط© ط¹ط±ط¶ ط§ظ„ظ‚ط§ط¦ظ…ط©
        if (typeof populateTranslationList === 'function') {
            populateTranslationList();
        }
        if (typeof updateStats === 'function') {
            updateStats();
        }
        
        if (typeof showNotification === 'function') {
            showNotification(`âœ… طھظ… ط¥ط¶ط§ظپط© ${addedCount} ظ…ظپطھط§ط­ ط¬ط¯ظٹط¯ ظ…ظ† ط§ظ„ظ…ط±ط¬ط¹ ط§ظ„ط¥ظ†ط¬ظ„ظٹط²ظٹ!`, 'success');
        }
        
        // ط­ظپط¸ ظپظٹ localStorage
        if (typeof saveToLocalStorage === 'function') {
            saveToLocalStorage();
        }
        
        console.log(`طھظ… ط¥ط¶ط§ظپط© ${addedCount} ظ…ظپطھط§ط­ ظ†ط§ظ‚طµ ظ…ظ† ط§ظ„ظ…ط±ط¬ط¹ ط§ظ„ط¥ظ†ط¬ظ„ظٹط²ظٹ`);
    } else {
        if (typeof showNotification === 'function') {
            showNotification(`âڑ ï¸ڈ ظ„ظ… ظٹطھظ… ط¥ط¶ط§ظپط© ط£ظٹ ظ…ظپط§طھظٹط­`, 'warning');
        }
    }
}

// Make functions available globally
if (typeof window !== 'undefined') {
    window.translateCurrentText = translateCurrentText;
    window.findMissingKeys = findMissingKeys;
    window.showMissingKeys = showMissingKeys;
    window.addMissingKeysToTranslation = addMissingKeysToTranslation;
} 
// ===========================================
// BLOCKS MODE SYSTEM - ظ†ط¸ط§ظ… ظˆط¶ط¹ ط§ظ„ط¨ظ„ظˆظƒط§طھ
// ===========================================

// Command Blocks System
function convertTextToBlocks(text, missingBlocks = []) {
    if (!text) return '';
    if (window.debugBlocks) console.log('ًں”چ طھط­ظˆظٹظ„ ط§ظ„ظ†طµ ظ„ظ„ط¨ظ„ظˆظƒط§طھ:', text);
    
    let result = text;

    // ط¯ط§ظ„ط© ظ…ط³ط§ط¹ط¯ط© ظ„ط¥ط¶ط§ظپط© class ط§ظ„ظ…ظپظ‚ظˆط¯
    const addMissingClass = (match) => {
        const isMissing = missingBlocks.includes(match);
        const missingClass = isMissing ? ' missing' : '';
        const missingTitle = isMissing ? ' (ظ…ظپظ‚ظˆط¯ ظپظٹ ط§ظ„طھط±ط¬ظ…ط©!)' : '';
        return { missingClass, missingTitle };
    };

    // طھظ… ظ†ظ‚ظ„ ط§ظ„ط¯ط§ظ„ط© ط¥ظ„ظ‰ ظ…ظƒط§ظ† ط£ظپط¶ظ„
    result = result.replace(/\\n/g, (match) => {
        const { missingClass, missingTitle } = addMissingClass(match);
        return `<span class="newline-block${missingClass}" draggable="false" data-type="newline" title="ط³ط·ط± ط¬ط¯ظٹط¯${missingTitle}">\\n</span>`;
    });
    
    // 2. طھط­ظˆظٹظ„ ط§ظ„ط£ظٹظ‚ظˆظ†ط§طھ ظ…ط«ظ„ nickname_icon! ظˆ stress_icon!
    result = result.replace(/(\w+_icon!)/g, (match, p1) => {
        const { missingClass, missingTitle } = addMissingClass(p1);
        return `<span class="command-block${missingClass}" draggable="false" data-type="icon" title="${p1}${missingTitle}">${p1}</span>`;
    });
    
    // 3. طھط­ظˆظٹظ„ ط§ظ„ظ…طھط؛ظٹط±ط§طھ ط§ظ„ظ…ط¹ظ‚ط¯ط© ظ…ط¹ pipes ظ…ط«ظ„ $DEAD|V$ ظˆ $INITIAL|V$
    result = result.replace(/(\$[A-Z_]+\|[A-Z]+\$)/g, (match, p1) => {
        const { missingClass, missingTitle } = addMissingClass(p1);
        return `<span class="command-block${missingClass}" draggable="false" data-type="variable" title="${p1}${missingTitle}">${p1}</span>`;
    });
    
    // 4. طھط­ظˆظٹظ„ ط§ظ„ظ…طھط؛ظٹط±ط§طھ ط§ظ„ط·ظˆظٹظ„ط© ظ…ط«ظ„ $building_type_hall_of_heroes_01_desc$
    result = result.replace(/(\$[a-zA-Z_][a-zA-Z0-9_]{3,}\$)/g, (match, p1) => {
        const { missingClass, missingTitle } = addMissingClass(p1);
        return `<span class="command-block${missingClass}" draggable="false" data-type="variable" title="${p1}${missingTitle}">${p1}</span>`;
    });
    
    // 5. طھط­ظˆظٹظ„ ط§ظ„ظ…طھط؛ظٹط±ط§طھ ط§ظ„ط¹ط§ط¯ظٹط© ط§ظ„ظ‚طµظٹط±ط© $VAR$
    result = result.replace(/(\$[A-Z_]{1,8}\$)/g, (match, p1) => {
        const { missingClass, missingTitle } = addMissingClass(p1);
        return `<span class="command-block${missingClass}" draggable="false" data-type="variable" title="${p1}${missingTitle}">${p1}</span>`;
    });
    
    // 6. طھط­ظˆظٹظ„ ط§ظ„ظ…طھط؛ظٹط±ط§طھ ط§ظ„ظ…ط®طھظ„ط·ط© ظ…ط«ظ„ $variable$
    result = result.replace(/(\$[a-z][a-zA-Z_]{1,8}\$)/g, (match, p1) => {
        const { missingClass, missingTitle } = addMissingClass(p1);
        return `<span class="command-block${missingClass}" draggable="false" data-type="variable" title="${p1}${missingTitle}">${p1}</span>`;
    });
    
    // 7. طھط­ظˆظٹظ„ ط§ظ„ط£ظˆط§ظ…ط± ط§ظ„ظ…ط¹ظ‚ط¯ط© ط¬ط¯ط§ظ‹ ظ…ط¹ ط¯ظˆط§ظ„ ظˆظ…ط¹ط§ظ…ظ„ط§طھ ظ…ط«ظ„ [GetVassalStance( 'belligerent' ).GetName]
    result = result.replace(/(?!<span[^>]*>)(\[[A-Za-z][A-Za-z0-9_]*\([^)]*\)[^[\]]*\])(?![^<]*<\/span>)/g, (match, p1) => {
        const { missingClass, missingTitle } = addMissingClass(p1);
        return `<span class="command-block${missingClass}" draggable="false" data-type="command" title="${p1}${missingTitle}">${p1}</span>`;
    });
    
    // 8. طھط­ظˆظٹظ„ ط§ظ„ط£ظˆط§ظ…ط± ط§ظ„ط·ظˆظٹظ„ط© ط¬ط¯ط§ظ‹ ظ…ط¹ ط£ظ‚ظˆط§ط³ ظ…ط¹ظ‚ط¯ط© ظ…ط«ظ„ [AddLocalizationIf(...)]
    result = result.replace(/(?!<span[^>]*>)(\[[A-Za-z][^[\]]*\([^[\]]*\)[^[\]]*\])(?![^<]*<\/span>)/g, (match, p1) => {
        const { missingClass, missingTitle } = addMissingClass(p1);
        return `<span class="command-block${missingClass}" draggable="false" data-type="command" title="${p1}${missingTitle}">${p1}</span>`;
    });
    
    // 9. طھط­ظˆظٹظ„ ط§ظ„ط£ظˆط§ظ…ط± ظ…ط¹ ScriptValue ظˆpipes ظ…ط«ظ„ [attacker.MakeScope.ScriptValue('...')|V0]
    result = result.replace(/(?!<span[^>]*>)(\[[a-zA-Z_][a-zA-Z0-9_]*\.[\w\.]*ScriptValue[^[\]]*\|[A-Z0-9]+\])(?![^<]*<\/span>)/g, (match, p1) => {
        const { missingClass, missingTitle } = addMissingClass(p1);
        return `<span class="command-block${missingClass}" draggable="false" data-type="command" title="${p1}${missingTitle}">${p1}</span>`;
    });
    
    // 10. طھط­ظˆظٹظ„ ط§ظ„ط£ظˆط§ظ…ط± ط§ظ„ظ…ط¹ظ‚ط¯ط© ظ…ط¹ ظ†ظ‚ط§ط· ظˆpipes ظ…ط«ظ„ [exceptional_guest.GetShortUIName|U]
    result = result.replace(/(?!<span[^>]*>)(\[[a-zA-Z_][a-zA-Z0-9_]*\.[a-zA-Z0-9_\.]+\|[A-Z]+\])(?![^<]*<\/span>)/g, (match, p1) => {
        const { missingClass, missingTitle } = addMissingClass(p1);
        return `<span class="command-block${missingClass}" draggable="false" data-type="command" title="${p1}${missingTitle}">${p1}</span>`;
    });
    
    // 11. طھط­ظˆظٹظ„ ط§ظ„ط£ظˆط§ظ…ط± ط§ظ„ظ…ط¹ظ‚ط¯ط© ظ…ط¹ ظ†ظ‚ط§ط· ظپظ‚ط· ظ…ط«ظ„ [guest.GetTitledFirstName]
    result = result.replace(/(?!<span[^>]*>)(\[[a-zA-Z_][a-zA-Z0-9_]*\.[a-zA-Z0-9_\.]+\])(?![^<]*<\/span>)/g, (match, p1) => {
        const { missingClass, missingTitle } = addMissingClass(p1);
        return `<span class="command-block${missingClass}" draggable="false" data-type="command" title="${p1}${missingTitle}">${p1}</span>`;
    });
    
    // 12. طھط­ظˆظٹظ„ ط§ظ„ط£ظˆط§ظ…ط± ط§ظ„ظ…طھظ‚ط¯ظ…ط© ظ…ط«ظ„ [ROOT.Char.Custom('GetSomething')] (ط£ظˆط§ظ…ط± ظ…ط¹ظ‚ط¯ط© ط¹ط§ظ…ط©)
    result = result.replace(/(?!<span[^>]*>)(\[[A-Z][a-zA-Z]*\.[\w\.\(\)'"`#!?:\s-]+\])(?![^<]*<\/span>)/g, (match, p1) => {
        const { missingClass, missingTitle } = addMissingClass(p1);
        return `<span class="command-block${missingClass}" draggable="false" data-type="command" title="${p1}${missingTitle}">${p1}</span>`;
    });
    
    // 13. طھط­ظˆظٹظ„ ط§ظ„ط£ظˆط§ظ…ط± ظ…ط¹ pipes ظ…ط«ظ„ [soldiers|E] ظˆ [county_control|E] (طھط¬ظ†ط¨ ط§ظ„ظ…ظڈط­ظˆظژظ‘ظ„ط© ظ…ط³ط¨ظ‚ط§ظ‹)
    result = result.replace(/(?!<span[^>]*>)(\[[a-zA-Z_][a-zA-Z0-9_]*\|[A-Z]+\])(?![^<]*<\/span>)/g, (match, p1) => {
        const { missingClass, missingTitle } = addMissingClass(p1);
        return `<span class="command-block${missingClass}" draggable="false" data-type="command" title="${p1}${missingTitle}">${p1}</span>`;
    });
    
    // 14. طھط­ظˆظٹظ„ ط§ظ„ط£ظˆط§ظ…ط± ط§ظ„ط¨ط³ظٹط·ط© ظ…ط«ظ„ [culture] ظˆ [development_growth] (طھط¬ظ†ط¨ ط§ظ„ظ…ظڈط­ظˆظژظ‘ظ„ط© ظ…ط³ط¨ظ‚ط§ظ‹)
    result = result.replace(/(?!<span[^>]*>)(\[[a-zA-Z_][a-zA-Z0-9_]*\])(?![^<]*<\/span>)/g, (match, p1) => {
        // طھط¬ظ†ط¨ ط§ظ„ط£ظˆط§ظ…ط± ط§ظ„طھظٹ طھط­طھظˆظٹ ط¹ظ„ظ‰ pipes ط£ظˆ ظ†ظ‚ط§ط· ط£ظˆ ط£ظ‚ظˆط§ط³ (طھظ… ظ…ط¹ط§ظ„ط¬طھظ‡ط§ ظ…ط³ط¨ظ‚ط§ظ‹)
        if (p1.includes('|') || p1.includes('.') || p1.includes('(')) {
            return match; // ظ„ط§ طھط­ظˆظٹظ„
        }
        const { missingClass, missingTitle } = addMissingClass(p1);
        return `<span class="command-block${missingClass}" draggable="false" data-type="command" title="${p1}${missingTitle}">${p1}</span>`;
    });
     
    // 12. طھط­ظˆظٹظ„ ط§ظ„ط£ظˆط§ظ…ط± ط§ظ„ط®ط§طµط© ظپظ‚ط· ط¥ط°ط§ ظƒط§ظ†طھ ظƒظ„ظ‡ط§ ط£ط­ط±ظپ ظƒط¨ظٹط±ط© ظˆط¨ط¯ظˆظ† ظ…ط³ط§ظپط§طھ #SPECIAL#
    result = result.replace(/(\#[A-Z_]{2,}\#)/g, (match, p1) => {
        const { missingClass, missingTitle } = addMissingClass(p1);
        return `<span class="command-block${missingClass}" draggable="false" data-type="special" title="${p1}${missingTitle}">${p1}</span>`;
    });
     
    // 13. طھط­ظˆظٹظ„ ط£ظˆط§ظ…ط± ط®ط§طµط© ظ…ط¹ظٹظ†ط© ط¨ط§ظ„طھط­ط¯ظٹط¯ ظ…ط«ظ„ #EMP!# ظˆ #X!#
    result = result.replace(/(\#[A-Z]{1,5}!\#)/g, (match, p1) => {
        const { missingClass, missingTitle } = addMissingClass(p1);
        return `<span class="command-block${missingClass}" draggable="false" data-type="special" title="${p1}${missingTitle}">${p1}</span>`;
    });
    
    if (window.debugBlocks) console.log('âœ… ط§ظ„ظ†طھظٹط¬ط© ط¨ط¹ط¯ ط§ظ„طھط­ظˆظٹظ„:', result);
    return result;
}

function convertBlocksToText(html) {
    if (!html) return '';
    if (window.debugBlocks) console.log('ًں”„ طھط­ظˆظٹظ„ ط§ظ„ط¨ظ„ظˆظƒط§طھ ظ„ظ„ظ†طµ:', html);
    
    // ط¥ظ†ط´ط§ط، ط¹ظ†طµط± ظ…ط¤ظ‚طھ ظ„ط§ط³طھط®ط±ط§ط¬ ط§ظ„ظ†طµ
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    
    // ط§ط³طھط®ط±ط§ط¬ ط§ظ„ظ†طµ ظ…ظ† ط§ظ„ط¹ظ‚ط¯ ط§ظ„ظ†طµظٹط© ظˆط§ظ„ط¨ظ„ظˆظƒط§طھ ظپظ‚ط·
    let result = '';
    
    function extractTextFromNode(node) {
        if (node.nodeType === Node.TEXT_NODE) {
            return node.textContent || '';
        } else if (node.nodeType === Node.ELEMENT_NODE) {
            if (node.classList.contains('command-block') || node.classList.contains('newline-block')) {
                // ط§ط³طھط®ط±ط§ط¬ ط§ظ„ظ†طµ ظ…ظ† ط§ظ„ط¨ظ„ظˆظƒط§طھ (طھط¬ط§ظ‡ظ„ ط§ظ„ظ€ HTML)
                return node.textContent || '';
            } else {
                // ظ„ظ„ط¹ظ†ط§طµط± ط§ظ„ط£ط®ط±ظ‰طŒ ط§ط³طھط®ط±ط¬ ط§ظ„ظ†طµ ظ…ظ† ط§ظ„ط£ط·ظپط§ظ„
                let text = '';
                for (const child of node.childNodes) {
                    text += extractTextFromNode(child);
                }
                return text;
            }
        }
        return '';
    }
    
    // ط§ط³طھط®ط±ط§ط¬ ط§ظ„ظ†طµ ظ…ظ† ط¬ظ…ظٹط¹ ط§ظ„ط¹ظ‚ط¯
    for (const child of tempDiv.childNodes) {
        result += extractTextFromNode(child);
    }
    
    // طھظ†ط¸ظٹظپ ظ†ظ‡ط§ط¦ظٹ ظ„ظ„ظ†طµ
    result = result
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&nbsp;/g, ' ')
        .trim();
    
    if (window.debugBlocks) console.log('âœ… ط§ظ„ظ†طµ ط§ظ„ظ†ظ‡ط§ط¦ظٹ ط¨ط¹ط¯ ط§ظ„طھظ†ط¸ظٹظپ:', result);
    return result;
}

function enableBlockMode(element) {
    if (!element) {
        console.warn('âڑ ï¸ڈ ظ„ط§ ظٹظ…ظƒظ† طھظپط¹ظٹظ„ ظˆط¶ط¹ ط§ظ„ط¨ظ„ظˆظƒط§طھ - ط¹ظ†طµط± ط؛ظٹط± طµط§ظ„ط­');
        return;
    }
    
    // ط§ظ„طھط­ظ‚ظ‚ ظ…ظ† ظˆط¬ظˆط¯ blocks editor ط³ط§ط¨ظ‚ ظ„طھط¬ظ†ط¨ ط§ظ„طھظƒط±ط§ط±
    const existingBlocksEditor = element.parentNode.querySelector('.blocks-editor');
    if (existingBlocksEditor) {
        console.log('â„¹ï¸ڈ ظˆط¶ط¹ ط§ظ„ط¨ظ„ظˆظƒط§طھ ظ…ظپط¹ظ„ ظ…ط³ط¨ظ‚ط§ظ‹');
        // طھط£ظƒط¯ ظ…ظ† ط£ظ† ط§ظ„ط¹ظ†طµط± ط§ظ„ط£طµظ„ظٹ ظ…ط®ظپظٹ
        element.style.display = 'none';
        return existingBlocksEditor;
    }
    
    // طھظ†ط¸ظٹظپ ط£ظٹ ط¹ظ†ط§طµط± ظ…طھط¶ط§ط±ط¨ط© ظ‚ط¨ظ„ ط¥ظ†ط´ط§ط، ظˆط§ط­ط¯ ط¬ط¯ظٹط¯
    const allBlocksEditors = document.querySelectorAll('.blocks-editor');
    if (allBlocksEditors.length > 0) {
        console.log('ًں§¹ ط¥ط²ط§ظ„ط© blocks editors ظ…ظˆط¬ظˆط¯ط© ظ…ط³ط¨ظ‚ط§ظ‹ ظ‚ط¨ظ„ ط¥ظ†ط´ط§ط، ط¬ط¯ظٹط¯');
        allBlocksEditors.forEach(editor => editor.remove());
    }
    
    const text = element.value || element.textContent || '';
    
    if (element.tagName === 'TEXTAREA') {
        // طھظ†ط¸ظٹظپ ط§ظ„ظ†طµ ظ‚ط¨ظ„ طھط­ظˆظٹظ„ظ‡ ظ„ظ„ط¨ظ„ظˆظƒط§طھ
        const cleanText = text.trim();
        const blocksHtml = convertTextToBlocks(cleanText);
        
        // ط¥ظ†ط´ط§ط، blocks editor ط¬ط¯ظٹط¯
        const blockDiv = document.createElement('div');
        blockDiv.className = 'blocks-editor';
        blockDiv.contentEditable = true;
        blockDiv.innerHTML = blocksHtml;
        
        // ظ†ط³ط® ط§ظ„ط³طھط§ظٹظ„ط§طھ ط§ظ„ظ…ظ‡ظ…ط© ظپظ‚ط·
        blockDiv.style.width = getComputedStyle(element).width;
        blockDiv.style.height = getComputedStyle(element).height;
        blockDiv.style.minHeight = getComputedStyle(element).minHeight;
        blockDiv.style.fontFamily = getComputedStyle(element).fontFamily;
        blockDiv.style.fontSize = getComputedStyle(element).fontSize;
        blockDiv.style.padding = getComputedStyle(element).padding;
        blockDiv.style.border = getComputedStyle(element).border;
        blockDiv.style.borderRadius = getComputedStyle(element).borderRadius;
        blockDiv.style.backgroundColor = getComputedStyle(element).backgroundColor;
        blockDiv.style.color = getComputedStyle(element).color;
        blockDiv.style.direction = 'rtl';
        blockDiv.style.textAlign = 'right';
        blockDiv.style.display = 'block';
        
        // ط¥ط®ظپط§ط، textarea ظˆط¥ط¸ظ‡ط§ط± blocks editor
        element.style.display = 'none';
        element.parentNode.insertBefore(blockDiv, element.nextSibling);
        
        // ط±ط¨ط· ط§ظ„طھط­ط¯ظٹط«ط§طھ ظ…ط¹ debounce
        let updateTimeout;
        blockDiv.addEventListener('input', function() {
            const newText = convertBlocksToText(blockDiv.innerHTML);
            element.value = newText;
            
            // ط¥ط±ط³ط§ظ„ event ظ„ظ„ظ€ textarea ط§ظ„ط£طµظ„ظٹ
            element.dispatchEvent(new Event('input', { bubbles: true }));
            
            // طھط­ط¯ظٹط« ط§ظ„ط¨ظ„ظˆظƒط§طھ ط¨ط¹ط¯ طھط£ط®ظٹط± ظ‚طµظٹط± ظ„طھط¬ظ†ط¨ ط§ظ„طھظƒط±ط§ط±
            clearTimeout(updateTimeout);
            updateTimeout = setTimeout(() => {
                refreshBlocks(blockDiv, element);
            }, 300);
        });
        
        // طھط·ط¨ظٹظ‚ ط§ظ„ط¥ط¹ط¯ط§ط¯ط§طھ ط§ظ„ط­ط§ظ„ظٹط©
        setTimeout(() => {
            const fontSize = document.getElementById('fontSize');
            const textAlign = document.getElementById('textAlign');
            
            if (fontSize && fontSize.value && fontSize.value !== '16') {
                blockDiv.style.fontSize = fontSize.value + 'px';
            }
            
            if (textAlign && textAlign.value && textAlign.value !== 'right') {
                blockDiv.style.textAlign = textAlign.value;
            }
            
            console.log('âœ… طھظ… طھط·ط¨ظٹظ‚ ط§ظ„ط¥ط¹ط¯ط§ط¯ط§طھ ط¹ظ„ظ‰ ظˆط¶ط¹ ط§ظ„ط¨ظ„ظˆظƒط§طھ');
        }, 50);
        
        console.log('âœ… طھظ… ط¥ظ†ط´ط§ط، blocks editor ط¬ط¯ظٹط¯');
        return blockDiv;
    } else {
        // ظ„ظ„ظ€ div ط¹ط§ط¯ظٹ - ظ„ظ… ظ†ط¹ط¯ ظ†ط³طھط®ط¯ظ… drag-and-drop
        const cleanText = text.trim();
        element.innerHTML = convertTextToBlocks(cleanText);
        console.log('âœ… طھظ… طھط­ط¯ظٹط« div ط¨ظˆط¶ط¹ ط§ظ„ط¨ظ„ظˆظƒط§طھ');
        return element;
    }
}

// ط§ط³طھط®ط±ط§ط¬ ط§ظ„ط¨ظ„ظˆظƒط§طھ ظ…ظ† ط§ظ„ظ†طµ
function extractBlocksFromText(text) {
    if (!text) return [];
    
    const blocks = [];
    const patterns = [
        // ط§ظ„ظ…طھط؛ظٹط±ط§طھ ظ…ط¹ pipes
        /\$[A-Z_]+\|[A-Z]+\$/g,
        // ط§ظ„ظ…طھط؛ظٹط±ط§طھ ط§ظ„ط·ظˆظٹظ„ط©  
        /\$[a-zA-Z_][a-zA-Z0-9_]{3,}\$/g,
        // ط§ظ„ظ…طھط؛ظٹط±ط§طھ ط§ظ„ظ‚طµظٹط±ط©
        /\$[A-Z_]{1,8}\$/g,
        // ط§ظ„ظ…طھط؛ظٹط±ط§طھ ط§ظ„ظ…ط®طھظ„ط·ط©
        /\$[a-z][a-zA-Z_]{1,8}\$/g,
        // ط§ظ„ط£ظˆط§ظ…ط± ظ…ط¹ pipes
        /\[[a-zA-Z_]+\|[A-Z]+\]/g,
        // ط§ظ„ط£ظˆط§ظ…ط± ط§ظ„ظ…ط¹ظ‚ط¯ط©
        /\[[\w\.\(\)'"`_\|\$#!?:\s-]+\]/g,
        // ط§ظ„ط£ظˆط§ظ…ط± ط§ظ„ط®ط§طµط©
        /\#[A-Z_]{2,}\#/g,
        /\#[A-Z]{1,5}!\#/g,
        // ط§ظ„ط£ظٹظ‚ظˆظ†ط§طھ
        /\w+_icon!/g,
        // ط£ط³ط·ط± ط¬ط¯ظٹط¯ط©
        /\\n/g
    ];
    
    patterns.forEach(pattern => {
        const matches = text.match(pattern);
        if (matches) {
            blocks.push(...matches);
        }
    });
    
    return [...new Set(blocks)]; // ط¥ط²ط§ظ„ط© ط§ظ„ظ…ظƒط±ط±ط§طھ
}

// ظ…ظ‚ط§ط±ظ†ط© ط§ظ„ط¨ظ„ظˆظƒط§طھ ط¨ظٹظ† ط§ظ„ظ†طµ ط§ظ„ظ…ط±ط¬ط¹ظٹ ظˆط§ظ„طھط±ط¬ظ…ط©
function findMissingBlocks(originalText, translatedText) {
    const originalBlocks = extractBlocksFromText(originalText);
    const translatedBlocks = extractBlocksFromText(translatedText);
    
    const missingBlocks = originalBlocks.filter(block => 
        !translatedBlocks.includes(block)
    );
    
    if (window.debugBlocks) {
        console.log('ًں”چ ط§ظ„ط¨ظ„ظˆظƒط§طھ ظپظٹ ط§ظ„ظ†طµ ط§ظ„ظ…ط±ط¬ط¹ظٹ:', originalBlocks);
        console.log('ًں”چ ط§ظ„ط¨ظ„ظˆظƒط§طھ ظپظٹ ط§ظ„طھط±ط¬ظ…ط©:', translatedBlocks);
        console.log('âڑ ï¸ڈ ط§ظ„ط¨ظ„ظˆظƒط§طھ ط§ظ„ظ…ظپظ‚ظˆط¯ط©:', missingBlocks);
    }
    
    return missingBlocks;
}

// Toggle Blocks Mode
function toggleBlocksMode() {
    // طھظ†ط¸ظٹظپ ط£ظٹ ط¹ظ†ط§طµط± ظ…ظƒط±ط±ط© ط£ظˆظ„ط§ظ‹
    if (typeof cleanupDuplicateBlocksEditors === 'function') {
        cleanupDuplicateBlocksEditors();
    }
    
    const currentElement = translationText;
    if (!currentElement) {
        console.warn('âڑ ï¸ڈ translationText ط؛ظٹط± ظ…ظˆط¬ظˆط¯');
        return;
    }
    
    const container = currentElement.parentNode;
    const blocksEditor = container.querySelector('.blocks-editor');
    
    if (blocksEditor) {
        // ط¥ط²ط§ظ„ط© ظˆط¶ط¹ ط§ظ„ط¨ظ„ظˆظƒط§طھ
        currentElement.style.display = 'block';
        blocksEditor.remove();
        
        // ط¥ط¹ط§ط¯ط© ط§ظ„ظ†طµ ط§ظ„ظ…ط±ط¬ط¹ظٹ ظ„ظ„ظˆط¶ط¹ ط§ظ„ط¹ط§ط¯ظٹ
        const englishText = englishTranslations && currentEditingKey ? englishTranslations[currentEditingKey] : '';
        if (englishText && typeof updateOriginalTextDisplay === 'function') {
            updateOriginalTextDisplay(englishText, currentElement.value);
        }
        
        if (typeof showNotification === 'function') {
            showNotification('طھظ… ط¥ظٹظ‚ط§ظپ ظˆط¶ط¹ ط§ظ„ط¨ظ„ظˆظƒط§طھ', 'info');
        }
    } else {
        // طھظپط¹ظٹظ„ ظˆط¶ط¹ ط§ظ„ط¨ظ„ظˆظƒط§طھ ظ…ط¹ ط§ظ„ظ†طµ ط§ظ„ط­ط§ظ„ظٹ
        const currentText = currentElement.value;
        enableBlockMode(currentElement);
        
        // طھط­ط¯ظٹط« ط§ظ„ط¨ظ„ظˆظƒط§طھ ظپظˆط±ط§ظ‹ ط¨ط§ظ„ظ†طµ ط§ظ„ط­ط§ظ„ظٹ
        const newBlocksEditor = container.querySelector('.blocks-editor');
        if (newBlocksEditor) {
            if (window.debugBlocks) console.log('ًںژ¯ طھظپط¹ظٹظ„ ظˆط¶ط¹ ط§ظ„ط¨ظ„ظˆظƒط§طھ ظ…ط¹ ط§ظ„ظ†طµ:', currentText);
            
            // ط§ظ„ط­طµظˆظ„ ط¹ظ„ظ‰ ط§ظ„ظ†طµ ط§ظ„ظ…ط±ط¬ط¹ظٹ ظ„ظ„ظ…ظ‚ط§ط±ظ†ط©
            const englishText = englishTranslations && currentEditingKey ? englishTranslations[currentEditingKey] : '';
            const missingBlocks = findMissingBlocks(englishText, currentText || '');
            
            const newBlocksHtml = convertTextToBlocks(currentText || '', missingBlocks);
            newBlocksEditor.innerHTML = newBlocksHtml;
            
            // ط¥ط¸ظ‡ط§ط± طھط­ط°ظٹط± ط¥ط°ط§ ظƒط§ظ† ظ‡ظ†ط§ظƒ ط¨ظ„ظˆظƒط§طھ ظ…ظپظ‚ظˆط¯ط©
            if (missingBlocks.length > 0 && typeof showMissingBlocksWarning === 'function') {
                showMissingBlocksWarning(missingBlocks);
            }
            
            // طھط­ط¯ظٹط« ط§ظ„ظ†طµ ط§ظ„ظ…ط±ط¬ط¹ظٹ ظ…ط¹ ط§ظ„ط¨ظ„ظˆظƒط§طھ
            if (englishText && typeof updateOriginalTextDisplay === 'function') {
                updateOriginalTextDisplay(englishText, currentText || '');
            }
            
            // ط§ظ„ط¨ظ„ظˆظƒط§طھ ط¬ط§ظ‡ط²ط© ظ„ظ„ط¹ط±ط¶
            console.log('âœ… طھظ… طھظپط¹ظٹظ„ ظˆط¶ط¹ ط§ظ„ط¨ظ„ظˆظƒط§طھ');
            
            // ط§ظ„طھط£ظƒط¯ ظ…ظ† ط§ظ„طھط­ط¯ظٹط« ط§ظ„ظ…ط³طھظ…ط±
            setTimeout(() => {
                refreshBlocks(newBlocksEditor, currentElement);
            }, 50);
        }
        
        if (typeof showNotification === 'function') {
            showNotification('طھظ… طھظپط¹ظٹظ„ ظˆط¶ط¹ ط§ظ„ط¨ظ„ظˆظƒط§طھ! ًں§©', 'success');
        }
    }
}

// ط¥ط¶ط§ظپط© ط³ط·ط± ط¬ط¯ظٹط¯ \n ظپظٹ ظ…ظƒط§ظ† ط§ظ„ظƒطھط§ط¨ط©
function insertNewline(autoFocused = false) {
    if (!translationText) {
        console.warn('âڑ ï¸ڈ translationText ط؛ظٹط± ظ…ظˆط¬ظˆط¯');
        return;
    }
    
    const container = translationText.parentNode;
    const blocksEditor = container.querySelector('.blocks-editor');
    const activeElement = document.activeElement;
    
    // ط§ظ„طھط­ظ‚ظ‚ ظ…ظ† ط§ظ„طھط±ظƒظٹط² ط£ظˆظ„ط§ظ‹
    const isEditorFocused = activeElement === translationText || 
                           activeElement === blocksEditor ||
                           (blocksEditor && blocksEditor.contains(activeElement));
    
    // ط¥ط°ط§ ظ„ظ… ظٹظƒظ† ظ‡ظ†ط§ظƒ طھط±ظƒظٹط² ط¹ظ„ظ‰ ط§ظ„ظ…ط­ط±ط± ظˆظ„ظ… ظ†ط­ط§ظˆظ„ ط§ظ„طھط±ظƒظٹط² ظ…ظ† ظ‚ط¨ظ„
    if (!isEditorFocused && !autoFocused) {
        console.log('ًںژ¯ ط§ظ„طھط±ظƒظٹط² ط¹ظ„ظ‰ ط§ظ„ظ…ط­ط±ط± ط£ظˆظ„ط§ظ‹...');
        if (blocksEditor && blocksEditor.style.display !== 'none') {
            // ظˆط¶ط¹ ط§ظ„ط¨ظ„ظˆظƒط§طھ ظ…ظپط¹ظ„ - ط±ظƒط² ط¹ظ„ظ‰ blocks editor
            blocksEditor.focus();
            setTimeout(() => insertNewline(true), 100);
        } else {
            // ط§ظ„ظˆط¶ط¹ ط§ظ„ط¹ط§ط¯ظٹ - ط±ظƒط² ط¹ظ„ظ‰ textarea
            translationText.focus();
            setTimeout(() => insertNewline(true), 100);
        }
        return;
    }
    
    // ط¥ط°ط§ ظ…ط§ط²ط§ظ„ ط§ظ„طھط±ظƒظٹط² ظ…ظپظ‚ظˆط¯ ط­طھظ‰ ط¨ط¹ط¯ ط§ظ„ظ…ط­ط§ظˆظ„ط© ط§ظ„ط«ط§ظ†ظٹط©
    if (!isEditorFocused && autoFocused) {
        console.warn('âڑ ï¸ڈ ظ„ط§ ظٹظ…ظƒظ† ط§ظ„طھط±ظƒظٹط² ط¹ظ„ظ‰ ط§ظ„ظ…ط­ط±ط±طŒ ط¥ط¶ط§ظپط© \\n ظپظٹ ظ†ظ‡ط§ظٹط© ط§ظ„ظ†طµ...');
    } else {
        console.log('âœ… ط§ظ„ظ…ط­ط±ط± ظ…ط±ظƒط² ط¹ظ„ظٹظ‡طŒ ط¥ط¶ط§ظپط© \\n...');
    }
    
    // ط§ظ„طھط­ظ‚ظ‚ ظ…ظ† ط§ظ„ظˆط¶ط¹ ط§ظ„ط­ط§ظ„ظٹ
    if (blocksEditor && blocksEditor.style.display !== 'none') {
        // ظˆط¶ط¹ ط§ظ„ط¨ظ„ظˆظƒط§طھ ظ…ظپط¹ظ„ - ط¥ط¯ط±ط§ط¬ ظپظٹ blocks editor
        insertNewlineInBlocksMode(blocksEditor);
    } else {
        // ط§ظ„ظˆط¶ط¹ ط§ظ„ط¹ط§ط¯ظٹ - ط¥ط¯ط±ط§ط¬ ظپظٹ textarea
        insertNewlineInTextMode(translationText);
    }
    
    // ط¥ط¸ظ‡ط§ط± ط¥ط´ط¹ط§ط± ظ…ظ† ط§ظ„ط²ط± (ظ„ظٹط³ ظ…ظ† ط§ط®طھطµط§ط± ظ„ظˆط­ط© ط§ظ„ظ…ظپط§طھظٹط­)
    if (!event || !(event.shiftKey && event.key === 'Enter')) {
        if (typeof showNotification === 'function') {
            showNotification('طھظ… ط¥ط¶ط§ظپط© ط³ط·ط± ط¬ط¯ظٹط¯ â†µ', 'success');
        }
    }
}

// ط¥ط¯ط±ط§ط¬ ط³ط·ط± ط¬ط¯ظٹط¯ ظپظٹ ط§ظ„ظˆط¶ط¹ ط§ظ„ط¹ط§ط¯ظٹ (textarea)
function insertNewlineInTextMode(textarea) {
    if (!textarea) {
        console.warn('âڑ ï¸ڈ ظ„ط§ ظٹظ…ظƒظ† ط§ظ„ط¹ط«ظˆط± ط¹ظ„ظ‰ textarea');
        return;
    }
    
    // ط§ظ„طھط£ظƒط¯ ظ…ظ† ط£ظ† textarea ظ†ط´ط·
    if (document.activeElement !== textarea) {
        textarea.focus();
    }
    
    // ط§ظ„ط­طµظˆظ„ ط¹ظ„ظ‰ ظ…ظˆظ‚ط¹ ط§ظ„ظ…ط¤ط´ط±
    const cursorPosition = textarea.selectionStart;
    const textBefore = textarea.value.substring(0, cursorPosition);
    const textAfter = textarea.value.substring(textarea.selectionEnd);
    
    // ط¥ط¯ط±ط§ط¬ \n ظپظٹ ظ…ظˆظ‚ط¹ ط§ظ„ظ…ط¤ط´ط±
    const newText = textBefore + '\\n' + textAfter;
    textarea.value = newText;
    
    // طھط­ط±ظٹظƒ ط§ظ„ظ…ط¤ط´ط± ط¥ظ„ظ‰ ط¨ط¹ط¯ \n
    const newCursorPosition = cursorPosition + 2; // ط·ظˆظ„ \n ظ‡ظˆ 2 ط£ط­ط±ظپ
    setTimeout(() => {
        textarea.setSelectionRange(newCursorPosition, newCursorPosition);
        textarea.focus();
    }, 10);
    
    // ط¥ط±ط³ط§ظ„ event ظ„ظ„طھط­ط¯ظٹط«
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
    
    console.log(`âœ… طھظ… ط¥ط¶ط§ظپط© \\n ظپظٹ ط§ظ„ظ…ظˆظ‚ط¹ ${cursorPosition}`);
}

// ط¥ط¯ط±ط§ط¬ ط³ط·ط± ط¬ط¯ظٹط¯ ظپظٹ ظˆط¶ط¹ ط§ظ„ط¨ظ„ظˆظƒط§طھ
function insertNewlineInBlocksMode(blocksEditor) {
    if (!blocksEditor) {
        console.warn('âڑ ï¸ڈ ظ„ط§ ظٹظ…ظƒظ† ط§ظ„ط¹ط«ظˆط± ط¹ظ„ظ‰ blocks editor');
        return;
    }
    
    // ط§ظ„ط­طµظˆظ„ ط¹ظ„ظ‰ ظ…ظˆظ‚ط¹ ط§ظ„ظ…ط¤ط´ط± ظپظٹ blocks editor
    const selection = window.getSelection();
    if (!selection.rangeCount) {
        // ظ„ط§ ظٹظˆط¬ط¯ ظ…ط¤ط´ط± - ط£ط¶ظپ ظپظٹ ط§ظ„ظ†ظ‡ط§ظٹط©
        const newlineBlock = '<span class="newline-block" draggable="false" data-type="newline" title="ط³ط·ط± ط¬ط¯ظٹط¯">\\n</span>';
        blocksEditor.innerHTML += newlineBlock;
    } else {
        // ط¥ط¯ط±ط§ط¬ ظپظٹ ظ…ظƒط§ظ† ط§ظ„ظ…ط¤ط´ط±
        const range = selection.getRangeAt(0);
        const newlineBlock = document.createElement('span');
        newlineBlock.className = 'newline-block';
        newlineBlock.draggable = false;
        newlineBlock.setAttribute('data-type', 'newline');
        newlineBlock.setAttribute('title', 'ط³ط·ط± ط¬ط¯ظٹط¯');
        newlineBlock.textContent = '\\n';
        
        // ط¥ط¯ط±ط§ط¬ ط§ظ„ط¨ظ„ظˆظƒ ط§ظ„ط¬ط¯ظٹط¯
        range.deleteContents();
        range.insertNode(newlineBlock);
        
        // طھط­ط±ظٹظƒ ط§ظ„ظ…ط¤ط´ط± ط¨ط¹ط¯ ط§ظ„ط¨ظ„ظˆظƒ ط§ظ„ط¬ط¯ظٹط¯
        range.setStartAfter(newlineBlock);
        range.setEndAfter(newlineBlock);
        selection.removeAllRanges();
        selection.addRange(range);
    }
    
    // طھط­ط¯ظٹط« textarea ط§ظ„ظ…ط®ظپظٹ
    const updatedText = convertBlocksToText(blocksEditor.innerHTML);
    if (translationText) {
        translationText.value = updatedText;
        
        // ط¥ط±ط³ط§ظ„ event ظ„ظ„طھط­ط¯ظٹط«
        blocksEditor.dispatchEvent(new Event('input', { bubbles: true }));
        translationText.dispatchEvent(new Event('input', { bubbles: true }));
    }
    
    // ط§ظ„طھط±ظƒظٹط² ط¹ظ„ظ‰ blocks editor
    blocksEditor.focus();
    
    console.log('âœ… طھظ… ط¥ط¶ط§ظپط© ط³ط·ط± ط¬ط¯ظٹط¯ ظپظٹ ظˆط¶ط¹ ط§ظ„ط¨ظ„ظˆظƒط§طھ');
}

// Refresh blocks when text changes
function refreshBlocks(blockDiv, originalElement) {
    if (!blockDiv || !originalElement) {
        if (window.debugBlocks) console.warn('âڑ ï¸ڈ ظ„ط§ ظٹظ…ظƒظ† طھط­ط¯ظٹط« ط§ظ„ط¨ظ„ظˆظƒط§طھ - ط¹ظ†ط§طµط± ط؛ظٹط± طµط§ظ„ط­ط©');
        return;
    }
    
    if (window.debugBlocks) console.log('ًں”„ طھط­ط¯ظٹط« ط§ظ„ط¨ظ„ظˆظƒط§طھ...');
    
    // ط§ظ„ط­طµظˆظ„ ط¹ظ„ظ‰ ط§ظ„ظ†طµ ط§ظ„ط­ط§ظ„ظٹ ظ…ظ† textarea ط§ظ„ط£طµظ„ظٹ ظ…ط¹ طھظ†ط¸ظٹظپ
    const originalText = (originalElement.value || '').trim();
    if (window.debugBlocks) console.log('ًں“‌ ط§ظ„ظ†طµ ظ…ظ† textarea:', originalText);
    
    // طھط¬ظ†ط¨ ط§ظ„طھط­ط¯ظٹط« ط¥ط°ط§ ظƒط§ظ† ط§ظ„ظ†طµ ظپط§ط±ط؛
    if (!originalText) {
        if (window.debugBlocks) console.log('âڑ ï¸ڈ طھط¬ط§ظ‡ظ„ ط§ظ„طھط­ط¯ظٹط« - ط§ظ„ظ†طµ ظپط§ط±ط؛');
        return;
    }
    
    // ط§ظ„ط­طµظˆظ„ ط¹ظ„ظ‰ ط§ظ„ظ†طµ ط§ظ„ظ…ط±ط¬ط¹ظٹ ط§ظ„ط¥ظ†ط¬ظ„ظٹط²ظٹ ظ„ظ„ظ…ظ‚ط§ط±ظ†ط©
    const englishText = englishTranslations && currentEditingKey ? englishTranslations[currentEditingKey] : '';
    
    // ط§ظ„ط¹ط«ظˆط± ط¹ظ„ظ‰ ط§ظ„ط¨ظ„ظˆظƒط§طھ ط§ظ„ظ…ظپظ‚ظˆط¯ط© ظپظٹ ط§ظ„ظ†طµ ط§ظ„ظ…طھط±ط¬ظ…
    const missingBlocks = findMissingBlocks(englishText, originalText);
    
    // طھط­ظˆظٹظ„ ط§ظ„ظ†طµ ط§ظ„ظ…طھط±ط¬ظ… ظ„ظ„ط¨ظ„ظˆظƒط§طھ ظ…ط¹ طھط­ط¯ظٹط¯ ط§ظ„ظ…ظپظ‚ظˆط¯ط© ظ…ظ† ط§ظ„ظ†طµ ط§ظ„ظ…ط±ط¬ط¹ظٹ
    const newBlocksHtml = convertTextToBlocks(originalText, missingBlocks);
    
    // ظپظ‚ط· ط¥ط°ط§ ظƒط§ظ† ظپظٹ طھط؛ظٹظٹط± ظپط¹ظ„ظٹ - ظ…ظ‚ط§ط±ظ†ط© ظ…ط­ط³ظ†ط©
    const currentHtml = blockDiv.innerHTML.trim();
    const newHtml = newBlocksHtml.trim();
    
    if (currentHtml !== newHtml) {
        if (window.debugBlocks) console.log('ًں”„ طھط­ط¯ظٹط« ط§ظ„ط¨ظ„ظˆظƒط§طھ - طھط؛ظٹظٹط± ظ…ظƒطھط´ظپ');
        
        // ط­ظپط¸ ظ…ظˆظ‚ط¹ ط§ظ„ظ…ط¤ط´ط±
        const cursorPosition = getCursorPosition(blockDiv);
        
        // طھط­ط¯ظٹط« ط§ظ„ظ…ط­طھظˆظ‰
        blockDiv.innerHTML = newBlocksHtml;
        
        // ط§ط³طھط¹ط§ط¯ط© ظ…ظˆظ‚ط¹ ط§ظ„ظ…ط¤ط´ط± ط¨ط¹ط¯ طھط£ط®ظٹط± ظ‚طµظٹط±
        setTimeout(() => {
            setCursorPosition(blockDiv, cursorPosition);
        }, 10);
        
        // ط¥ط¸ظ‡ط§ط± طھط­ط°ظٹط± ط¥ط°ط§ ظƒط§ظ† ظ‡ظ†ط§ظƒ ط¨ظ„ظˆظƒط§طھ ظ…ظپظ‚ظˆط¯ط© (ظ„ظ„طھط·ظˆظٹط± ظپظ‚ط·)
        if (missingBlocks.length > 0 && window.debugBlocks && typeof showMissingBlocksWarning === 'function') {
            showMissingBlocksWarning(missingBlocks);
        }
        
        // طھط­ط¯ظٹط« ط§ظ„ظ†طµ ط§ظ„ظ…ط±ط¬ط¹ظٹ ط¥ط°ط§ ظƒط§ظ† ظ…طھظˆظپط±ط§ظ‹
        if (englishText && typeof updateOriginalTextDisplay === 'function') {
            updateOriginalTextDisplay(englishText, originalText);
        }
        
        console.log('âœ… طھظ… طھط­ط¯ظٹط« ط§ظ„ط¨ظ„ظˆظƒط§طھ');
    } else {
        if (window.debugBlocks) console.log('âœ… ظ„ط§ ظٹظˆط¬ط¯ طھط؛ظٹظٹط± ظپظٹ ط§ظ„ط¨ظ„ظˆظƒط§طھ');
    }
}

// ط¥ط¸ظ‡ط§ط± طھط­ط°ظٹط± ظ„ظ„ط¨ظ„ظˆظƒط§طھ ط§ظ„ظ…ظپظ‚ظˆط¯ط©
function showMissingBlocksWarning(missingBlocks) {
    if (missingBlocks.length === 0) return;
    
    const count = missingBlocks.length;
    const message = `âڑ ï¸ڈ طھط­ط°ظٹط±: ${count} ط¨ظ„ظˆظƒ ظ…ظپظ‚ظˆط¯ ظپظٹ ط§ظ„طھط±ط¬ظ…ط©!`;
    
    if (typeof showNotification === 'function') {
        showNotification(message, 'warning');
    }
    
    // طھط³ط¬ظٹظ„ طھظپطµظٹظ„ظٹ ظپظٹ ط§ظ„ظƒظˆظ†ط³ظˆظ„
    console.warn('âڑ ï¸ڈ ط§ظ„ط¨ظ„ظˆظƒط§طھ ط§ظ„ظ…ظپظ‚ظˆط¯ط©:', missingBlocks);
    
    // طھط­ط¯ظٹط« ط¥ط­طµط§ط¦ظٹط§طھ ط§ظ„ظ…ط´ط§ظƒظ„ (ط¥ظ† ظˆظڈط¬ط¯طھ)
    updateMissingBlocksStats(count);
}

// طھط­ط¯ظٹط« ط¥ط­طµط§ط¦ظٹط§طھ ط§ظ„ط¨ظ„ظˆظƒط§طھ ط§ظ„ظ…ظپظ‚ظˆط¯ط©
function updateMissingBlocksStats(count) {
    // ظٹظ…ظƒظ† ط¥ط¶ط§ظپط© ط¹ط¯ط§ط¯ ظپظٹ ط§ظ„ظˆط§ط¬ظ‡ط© ظ„ط§ط­ظ‚ط§ظ‹
    if (window.debugBlocks) {
        console.log(`ًں“ٹ ط¥ط¬ظ…ط§ظ„ظٹ ط§ظ„ط¨ظ„ظˆظƒط§طھ ط§ظ„ظ…ظپظ‚ظˆط¯ط©: ${count}`);
    }
}

// طھط­ط¯ظٹط« ط¹ط±ط¶ ط§ظ„ظ†طµ ط§ظ„ظ…ط±ط¬ط¹ظٹ ظ…ط¹ ط§ظ„ط¨ظ„ظˆظƒط§طھ ط§ظ„ظ…ظپظ‚ظˆط¯ط©
function updateOriginalTextDisplay(englishText, translatedText) {
    if (!originalText || !englishText) return;
    
    // طھط­ظ‚ظ‚ ظ…ظ† ظˆط¬ظˆط¯ ظˆط¶ط¹ ط§ظ„ط¨ظ„ظˆظƒط§طھ
    const container = translationText ? translationText.parentNode : null;
    const blocksEditor = container ? container.querySelector('.blocks-editor') : null;
    const isBlocksMode = blocksEditor && blocksEditor.style.display !== 'none';
    
    if (isBlocksMode && translatedText) {
        // ط§ظ„ط¹ط«ظˆط± ط¹ظ„ظ‰ ط§ظ„ط¨ظ„ظˆظƒط§طھ ط§ظ„ظ…ظپظ‚ظˆط¯ط© ظپظٹ ط§ظ„طھط±ط¬ظ…ط©
        const missingInTranslation = findMissingBlocks(englishText, translatedText);
        
        // طھط­ظˆظٹظ„ ط§ظ„ظ†طµ ط§ظ„ط¥ظ†ط¬ظ„ظٹط²ظٹ ظ„ظ„ط¨ظ„ظˆظƒط§طھ ظ…ط¹ طھظ…ظٹظٹط² ط§ظ„ظ…ظپظ‚ظˆط¯ط©
        const blocksHtml = convertTextToBlocks(englishText, missingInTranslation);
        
        originalText.innerHTML = blocksHtml;
        originalText.style.color = '#d4edda';
        
        if (window.debugBlocks) {
            console.log('ًں“‹ ط§ظ„ظ†طµ ط§ظ„ظ…ط±ط¬ط¹ظٹ ظ…ط¹ ط§ظ„ط¨ظ„ظˆظƒط§طھ ط§ظ„ظ…ظپظ‚ظˆط¯ط©:', missingInTranslation);
            console.log('ًںژ¨ HTML ط§ظ„ط¨ظ„ظˆظƒط§طھ:', blocksHtml);
        }
        
        // ط¥ط¶ط§ظپط© ظپط¦ط© ط®ط§طµط© ظ„ظ„ظ†طµ ط§ظ„ظ…ط±ط¬ط¹ظٹ ظپظٹ ظˆط¶ط¹ ط§ظ„ط¨ظ„ظˆظƒط§طھ
        originalText.classList.add('blocks-reference-mode');
    } else {
        // ط§ظ„ظˆط¶ط¹ ط§ظ„ط¹ط§ط¯ظٹ - ط¹ط±ط¶ ط§ظ„ظ†طµ ظپظ‚ط·
        originalText.innerHTML = ''; // ظ…ط³ط­ ط£ظٹ HTML
        originalText.textContent = englishText;
        originalText.style.color = '#d4edda';
        originalText.classList.remove('blocks-reference-mode');
        
        if (window.debugBlocks) {
            console.log('ًں“‌ ط§ظ„ظ†طµ ط§ظ„ظ…ط±ط¬ط¹ظٹ ط§ظ„ط¹ط§ط¯ظٹ:', englishText);
        }
    }
}

// Helper functions for cursor position
function getCursorPosition(element) {
    let caretOffset = 0;
    const doc = element.ownerDocument || element.document;
    const win = doc.defaultView || doc.parentWindow;
    let sel;
    
    if (typeof win.getSelection != "undefined") {
        sel = win.getSelection();
        if (sel.rangeCount > 0) {
            const range = win.getSelection().getRangeAt(0);
            const preCaretRange = range.cloneRange();
            preCaretRange.selectNodeContents(element);
            preCaretRange.setEnd(range.endContainer, range.endOffset);
            caretOffset = preCaretRange.toString().length;
        }
    }
    return caretOffset;
}

function setCursorPosition(element, pos) {
    try {
        const doc = element.ownerDocument || element.document;
        const win = doc.defaultView || doc.parentWindow;
        const sel = win.getSelection();
        
        let charIndex = 0;
        const range = doc.createRange();
        range.setStart(element, 0);
        range.collapse(true);
        
        const nodeStack = [element];
        let node;
        let foundStart = false;
        
        while (!foundStart && (node = nodeStack.pop())) {
            if (node.nodeType === 3) { // Text node
                const nextCharIndex = charIndex + node.length;
                if (pos >= charIndex && pos <= nextCharIndex) {
                    range.setStart(node, pos - charIndex);
                    foundStart = true;
                }
                charIndex = nextCharIndex;
            } else {
                for (let i = node.childNodes.length - 1; i >= 0; i--) {
                    nodeStack.push(node.childNodes[i]);
                }
            }
        }
        
        sel.removeAllRanges();
        sel.addRange(range);
    } catch (e) {
        // طھط¬ط§ظ‡ظ„ ط£ط®ط·ط§ط، cursor positioning
    }
}

// ط¯ط§ظ„ط© طھظ†ط¸ظٹظپ ط§ظ„ط¹ظ†ط§طµط± ط§ظ„ط²ط§ط¦ط¯ط©
function cleanupDuplicateBlocksEditors() {
    const allBlocksEditors = document.querySelectorAll('.blocks-editor');
    
    if (allBlocksEditors.length > 1) {
        console.log(`ًں§¹ طھظ†ط¸ظٹظپ ${allBlocksEditors.length - 1} ط¹ظ†طµط± blocks editor ط²ط§ط¦ط¯`);
        
        // ط§ظ„ط§ط­طھظپط§ط¸ ط¨ط§ظ„ط£ظˆظ„ ظˆط¥ط²ط§ظ„ط© ط§ظ„ط¨ط§ظ‚ظٹ
        for (let i = 1; i < allBlocksEditors.length; i++) {
            allBlocksEditors[i].remove();
        }
        
        if (typeof showNotification === 'function') {
            showNotification('طھظ… طھظ†ط¸ظٹظپ ط§ظ„ط¹ظ†ط§طµط± ط§ظ„ظ…ظƒط±ط±ط©', 'info');
        }
        return true;
    }
    
    return false;
}

// Make functions available globally
if (typeof window !== 'undefined') {
    window.convertTextToBlocks = convertTextToBlocks;
    window.convertBlocksToText = convertBlocksToText;
    window.enableBlockMode = enableBlockMode;
    window.extractBlocksFromText = extractBlocksFromText;
    window.findMissingBlocks = findMissingBlocks;
    window.toggleBlocksMode = toggleBlocksMode;
    window.insertNewline = insertNewline;
    window.insertNewlineInTextMode = insertNewlineInTextMode;
    window.insertNewlineInBlocksMode = insertNewlineInBlocksMode;
    window.refreshBlocks = refreshBlocks;
    window.showMissingBlocksWarning = showMissingBlocksWarning;
    window.updateMissingBlocksStats = updateMissingBlocksStats;
    window.updateOriginalTextDisplay = updateOriginalTextDisplay;
    window.getCursorPosition = getCursorPosition;
    window.setCursorPosition = setCursorPosition;
    window.cleanupDuplicateBlocksEditors = cleanupDuplicateBlocksEditors;
} 
// ===========================================
// UI CONTROLS - ط¹ظ†ط§طµط± ط§ظ„طھط­ظƒظ… ظپظٹ ط§ظ„ظˆط§ط¬ظ‡ط©
// ===========================================

// Setup event listeners
function setupEventListeners() {
    // طھط­ط°ظٹط± ط¹ظ†ط¯ ظ…ط؛ط§ط¯ط±ط© ط§ظ„طµظپط­ط© ط¨ط¯ظˆظ† ط­ظپط¸
    window.addEventListener('beforeunload', function(e) {
        const hasModifications = (modifiedKeys && modifiedKeys.size > 0) || hasUnsavedChanges;
        if (hasModifications) {
            e.preventDefault();
            const message = 'ظ„ط¯ظٹظƒ طھط¹ط¯ظٹظ„ط§طھ ط؛ظٹط± ظ…ط­ظپظˆط¸ط©! ظ‡ظ„ ط£ظ†طھ ظ…طھط£ظƒط¯ ظ…ظ† ط§ظ„ظ…ط؛ط§ط¯ط±ط©طں';
            e.returnValue = message; // For Chrome
            return message; // For other browsers
        }
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyboardShortcuts);
    
    // Search input - طھط­ط³ظٹظ† ط§ظ„ط£ط¯ط§ط، ظˆظ…ظ†ط¹ ط§ظ„طھط¯ط§ط®ظ„
    if (searchInput) {
        // ط§ط³طھط®ط¯ط§ظ… debounce ظ„ظ„ط¨ط­ط« ظ„طھط­ط³ظٹظ† ط§ظ„ط£ط¯ط§ط،
        let searchTimeout;
        searchInput.addEventListener('input', function() {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                filterTranslations();
            }, 150); // ط§ظ†طھط¸ط§ط± 150ms ظ‚ط¨ظ„ ط§ظ„ط¨ط­ط«
        });
        
        // ظ…ظ†ط¹ ط§ظ„ظ‚ظپط² ظ„ظ„ظ†طµ ط§ظ„ط±ط¦ظٹط³ظٹ
        searchInput.addEventListener('keydown', function(e) {
            e.stopPropagation();
            
            // ظ…ظ†ط¹ ظ…ظپط§طھظٹط­ ط§ظ„طھظ†ظ‚ظ„ ظ…ظ† ط§ظ„طھط£ط«ظٹط± ط¹ظ„ظ‰ ط§ظ„ط¨ط­ط«
            if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                e.stopPropagation();
            }
        });
        
        searchInput.addEventListener('focus', function(e) {
            e.stopPropagation();
        });
        
        // ط¶ظ…ط§ظ† ط¨ظ‚ط§ط، ط§ظ„طھط±ظƒظٹط² ظپظٹ ط§ظ„ط¨ط­ط« ط£ط«ظ†ط§ط، ط§ظ„ظƒطھط§ط¨ط©
        searchInput.addEventListener('blur', function(e) {
            // ط¥ط°ط§ ظ„ظ… ظٹظƒظ† ط§ظ„ظ…ط³طھط®ط¯ظ… ظٹظ†ظ‚ط± ط¹ظ„ظ‰ ط´ظٹط، ط¢ط®ط±طŒ ط£ط¹ط¯ ط§ظ„طھط±ظƒظٹط²
            if (e.relatedTarget === null) {
                setTimeout(() => {
                    if (document.activeElement === document.body) {
                        searchInput.focus();
                    }
                }, 10);
            }
        });
    }
    
    // Translation text changes
    if (translationText) {
        translationText.addEventListener('input', function() {
            const currentValue = translationText.value;
            const currentKey = translationKeys[currentIndex];
            
            if (!currentKey) return;
            
            // ط­ظپط¸ ط§ظ„ظ†طµ ط§ظ„ظ…ظڈط¹ط¯ظ„ ط­ط§ظ„ظٹط§ظ‹
            window.currentEditedValue = currentValue;
            currentEditedValue = currentValue;
            window.currentEditingKey = currentKey;
            currentEditingKey = currentKey;
            
            // ط§ظ„ظ…ظ‚ط§ط±ظ†ط© ظ…ط¹ ط§ظ„ظ†طµ ط§ظ„ط£طµظ„ظٹ ظ…ظ† translations (ظ‡ط°ط§ ظ‡ظˆ ط§ظ„ط¥طµظ„ط§ط­!)
            const originalValue = originalTranslations && originalTranslations[currentKey] ? originalTranslations[currentKey] : '';
            const hasChanges = (currentValue !== originalValue);
            
            window.hasUnsavedChanges = hasChanges;
            hasUnsavedChanges = hasChanges;
            
            // Mark current translation as modified using the stored key
            if (hasChanges) {
                if (modifiedKeys) {
                    modifiedKeys.add(currentKey);
                }
                if (window.modifiedKeys) {
                    window.modifiedKeys.add(currentKey);
                }
                
                console.log(`âœڈï¸ڈ طھظ… طھط¹ط¯ظٹظ„ ط§ظ„ظ…ظپطھط§ط­: ${currentKey}`);
                console.log(`ًں“‌ ط§ظ„ظ†طµ ط§ظ„ط£طµظ„ظٹ: "${originalValue}"`);
                console.log(`ًں“‌ ط§ظ„ظ†طµ ط§ظ„ط¬ط¯ظٹط¯: "${currentValue}"`);
            } else {
                // ط¥ط²ط§ظ„ط© ظ…ظ† ط§ظ„ظ…ظپط§طھظٹط­ ط§ظ„ظ…ظڈط¹ط¯ظ„ط© ط¥ط°ط§ ط¹ط§ط¯ ظ„ظ„ظ†طµ ط§ظ„ط£طµظ„ظٹ
                if (modifiedKeys) {
                    modifiedKeys.delete(currentKey);
                }
                if (window.modifiedKeys) {
                    window.modifiedKeys.delete(currentKey);
                }
                console.log(`â†©ï¸ڈ طھظ… ط¥ط±ط¬ط§ط¹ ط§ظ„ظ…ظپطھط§ط­ ظ„ظ„ط£طµظ„: ${currentKey}`);
            }
            
            // Update the translation data immediately
            if (translations) {
                translations[currentKey] = currentValue;
            }
            if (window.translations) {
                window.translations[currentKey] = currentValue;
            }
            
            if (filteredTranslations) {
                filteredTranslations[currentKey] = currentValue;
            }
            if (window.filteredTranslations) {
                window.filteredTranslations[currentKey] = currentValue;
            }
            
            // Update the current item in the list
            if (translationList) {
                const items = translationList.querySelectorAll('.translation-item');
                if (items[currentIndex]) {
                    if (hasChanges) {
                        items[currentIndex].classList.add('modified');
                    } else {
                        items[currentIndex].classList.remove('modified');
                    }
                    
                    // Update preview in the list
                    const preview = currentValue.length > (previewLength || 50) ? 
                        currentValue.substring(0, (previewLength || 50)) + '...' : currentValue;
                    const previewElement = items[currentIndex].querySelector('.translation-preview');
                    if (previewElement) {
                        previewElement.textContent = preview;
                    }
                }
            }
            
            if (typeof updateStats === 'function') {
                updateStats(); // طھط­ط¯ظٹط« ط§ظ„ط¥ط­طµط§ط¦ظٹط§طھ
            }
            
            // ط¥ط°ط§ ظƒط§ظ† ظ‡ظ†ط§ظƒ blocks editor ظ…ظپط¹ظ„طŒ ط­ط¯ط«ظ‡
            const container = translationText.parentNode;
            const blocksEditor = container.querySelector('.blocks-editor');
            if (blocksEditor && blocksEditor.style.display !== 'none') {
                if (window.debugBlocks) console.log('ًں“‌ طھظ… طھط؛ظٹظٹط± ط§ظ„ظ†طµ - ط³ظٹطھظ… طھط­ط¯ظٹط« ط§ظ„ط¨ظ„ظˆظƒط§طھ');
                clearTimeout(translationText.blocksUpdateTimeout);
                translationText.blocksUpdateTimeout = setTimeout(() => {
                    if (typeof refreshBlocks === 'function') {
                        refreshBlocks(blocksEditor, translationText);
                    }
                }, 100); // طھظ‚ظ„ظٹظ„ ط§ظ„طھط£ط®ظٹط± ظ„طھط­ط¯ظٹط« ط£ط³ط±ط¹
            }
            
            if (typeof updateSaveButton === 'function') {
                updateSaveButton();
            }
            
            // ط­ظپط¸ ط³ط±ظٹط¹ ظ„ظ„ظ†طµ ط§ظ„ظ…ظڈط¹ط¯ظ„ ظپظٹ localStorage
            if (typeof saveToLocalStorage === 'function') {
                clearTimeout(window.autoSaveQuickTimeout);
                window.autoSaveQuickTimeout = setTimeout(() => {
                    saveToLocalStorage();
                }, 2000); // ط­ظپط¸ ط³ط±ظٹط¹ ظƒظ„ ط«ط§ظ†ظٹطھظٹظ†
            }
        });
        
        translationText.addEventListener('blur', function() {
            // ط­ظپط¸ ظپظˆط±ظٹ ط¹ظ†ط¯ ظپظ‚ط¯ط§ظ† ط§ظ„طھط±ظƒظٹط²
            if (typeof saveToLocalStorage === 'function') {
                saveToLocalStorage();
            }
        });
    }
    
    // Prevent default drag and drop behavior
    document.addEventListener('dragover', function(e) {
        e.preventDefault();
    });
    
    document.addEventListener('drop', function(e) {
        e.preventDefault();
        const files = e.dataTransfer.files;
        if (files.length > 0 && typeof handleFile === 'function') {
            handleFile(files[0]);
        }
    });
}

// Keyboard shortcuts
function handleKeyboardShortcuts(e) {
    // Ctrl/Cmd + O: Open file
    if ((e.ctrlKey || e.metaKey) && e.key === 'o') {
        e.preventDefault();
        if (typeof openFile === 'function') {
            openFile();
        }
    }
    
    // Ctrl/Cmd + S: Save file
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (typeof saveFile === 'function') {
            saveFile();
        }
    }
    
    // Ctrl/Cmd + F: Focus search
    if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        if (searchInput) {
            searchInput.focus();
        }
    }
    
    // Escape: Clear search and hide notifications
    if (e.key === 'Escape') {
        if (typeof clearSearch === 'function') {
            clearSearch();
        }
        if (typeof hideNotification === 'function') {
            hideNotification();
        }
    }
    
    // Arrow keys: Navigate translations
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        if (e.key === 'ArrowLeft') {
            if (typeof nextTranslation === 'function') {
                nextTranslation();
            }
        } else {
            if (typeof previousTranslation === 'function') {
                previousTranslation();
            }
        }
    }
    
    // Ctrl+T to translate
    if (e.ctrlKey && e.key === 't') {
        e.preventDefault();
        if (typeof translateCurrentText === 'function') {
            translateCurrentText();
        }
    }
    
    // Ctrl+B to toggle blocks mode
    if (e.ctrlKey && e.key === 'b') {
        e.preventDefault();
        if (typeof toggleBlocksMode === 'function') {
            toggleBlocksMode();
        }
    }
    
    // Shift+Enter to insert newline ظپظٹ ظ…ظƒط§ظ† ط§ظ„ظ…ط¤ط´ط±
    if (e.shiftKey && e.key === 'Enter') {
        e.preventDefault();
        if (typeof insertNewline === 'function') {
            insertNewline();
        }
        if (typeof showNotification === 'function') {
            showNotification('طھظ… ط¥ط¶ط§ظپط© ط³ط·ط± ط¬ط¯ظٹط¯ ظپظٹ ظ…ظƒط§ظ† ط§ظ„ظƒطھط§ط¨ط© â†µ', 'success');
        }
    }
}

function populateTranslationList() {
    if (!translationList) {
        console.warn('âڑ ï¸ڈ translationList ط؛ظٹط± ظ…ظˆط¬ظˆط¯');
        return;
    }
    translationList.innerHTML = '';
    
    const filteredData = filteredTranslations || {};
    Object.entries(filteredData).forEach(([key, value], index) => {
        const item = document.createElement('div');
        item.className = 'translation-item fade-in';
        item.dataset.index = index;
        
        // Add modified class only if this translation was actually modified
        if (modifiedKeys && modifiedKeys.has(key)) {
            item.classList.add('modified');
        }
        
        // Show clean preview (extract from quotes)
        let cleanValue = value;
        if (typeof cleanText === 'function') {
            cleanValue = cleanText(value);
        }
        
        const preview = cleanValue.length > (previewLength || 50) ? 
            cleanValue.substring(0, (previewLength || 50)) + '...' : cleanValue;
        
        item.innerHTML = `
            <div class="translation-key">${escapeHtml ? escapeHtml(key) : key}</div>
            <div class="translation-preview">${escapeHtml ? escapeHtml(preview) : preview}</div>
        `;
        
        item.addEventListener('click', () => {
            if (typeof selectTranslationByIndex === 'function') {
                selectTranslationByIndex(index);
            }
        });
        
        translationList.appendChild(item);
    });
}

function selectTranslationByIndex(index) {
    if (!translationKeys || index < 0 || index >= translationKeys.length) return;
    
    // ط­ظپط¸ ط§ظ„ظ†طµ ط§ظ„ط­ط§ظ„ظٹ ط§ظ„ظ…ط¹ط±ظˆط¶ ظ‚ط¨ظ„ ط§ظ„ط§ظ†طھظ‚ط§ظ„ (طھط­ط³ظٹظ† ظ…ظ‡ظ…!)
    if (translationText && currentIndex >= 0 && currentIndex < translationKeys.length) {
        const currentKey = translationKeys[currentIndex];
        const currentDisplayedValue = translationText.value.trim();
        
        // ط§ظ„طھط­ظ‚ظ‚ ظ…ظ† ظˆط¬ظˆط¯ طھط¹ط¯ظٹظ„ ط¨ظ…ظ‚ط§ط±ظ†ط© ط§ظ„ظ†طµ ط§ظ„ظ…ط¹ط±ظˆط¶ ظ…ط¹ ط§ظ„ظ†طµ ط§ظ„ط£طµظ„ظٹ
        const originalValue = originalTranslations && originalTranslations[currentKey] ? 
                             originalTranslations[currentKey].replace(/"/g, '').trim() : '';
        
        const hasActualChanges = (currentDisplayedValue !== originalValue);
        
        // ط§ظ„طھط­ظ‚ظ‚ ط§ظ„ط¥ط¶ط§ظپظٹ: ط£ظ† ط§ظ„ظ…ظپطھط§ط­ ظ…ظˆط¬ظˆط¯ ظپط¹ظ„ط§ظ‹ ظپظٹ ط§ظ„ظ…ظ„ظپ ط§ظ„ط­ط§ظ„ظٹ
        const keyExistsInCurrentFile = translations && translations.hasOwnProperty(currentKey);
        
        if (hasActualChanges && currentKey && keyExistsInCurrentFile) {
            console.log(`ًں’¾ ط­ظپط¸ ط§ظ„ظ†طµ ط§ظ„ظ…ظڈط¹ط¯ظ„ ظ‚ط¨ظ„ ط§ظ„ط§ظ†طھظ‚ط§ظ„: ${currentKey}`);
            console.log(`ًں“‌ ط§ظ„ظ†طµ ط§ظ„ط£طµظ„ظٹ: "${originalValue}"`);
            console.log(`ًں“‌ ط§ظ„ظ†طµ ط§ظ„ظ…ظڈط¹ط¯ظ„: "${currentDisplayedValue}"`);
            
            // ط­ظپط¸ ط§ظ„ظ†طµ ظپظٹ ط¬ظ…ظٹط¹ ط§ظ„ظ…ظˆط§ظ‚ط¹
            if (translations) {
                translations[currentKey] = currentDisplayedValue;
            }
            if (window.translations) {
                window.translations[currentKey] = currentDisplayedValue;
            }
            if (filteredTranslations) {
                filteredTranslations[currentKey] = currentDisplayedValue;
            }
            if (window.filteredTranslations) {
                window.filteredTranslations[currentKey] = currentDisplayedValue;
            }
            
            // طھط³ط¬ظٹظ„ ظƒظ…ظپطھط§ط­ ظ…ظڈط¹ط¯ظ„
            if (modifiedKeys) {
                modifiedKeys.add(currentKey);
            }
            if (window.modifiedKeys) {
                window.modifiedKeys.add(currentKey);
            }
            
            // طھط­ط¯ظٹط« ط§ظ„ط­ط§ظ„ط©
            window.hasUnsavedChanges = true;
            hasUnsavedChanges = true;
            
            // ط­ظپط¸ ط³ط±ظٹط¹ ظپظٹ localStorage
            if (typeof saveToLocalStorage === 'function') {
                setTimeout(() => saveToLocalStorage(), 100);
            }
        } else if (!keyExistsInCurrentFile && currentKey) {
            console.log(`ًںڑ« طھظ… طھط¬ط§ظ‡ظ„ ط­ظپط¸ ط§ظ„ظ†طµ - ط§ظ„ظ…ظپطھط§ط­ "${currentKey}" ط؛ظٹط± ظ…ظˆط¬ظˆط¯ ظپظٹ ط§ظ„ظ…ظ„ظپ ط§ظ„ط­ط§ظ„ظٹ`);
        }
    }
    
    // If there are unsaved changes in current translation, save them first (ط§ظ„ظƒظˆط¯ ط§ظ„ط£طµظ„ظٹ)
    if (hasUnsavedChanges && translationText) {
        const currentKey = translationKeys[currentIndex];
        const currentValue = translationText.value.trim();
        
        // Store the clean text (without quotes and tags)
        if (translations && currentKey) {
            translations[currentKey] = currentValue;
        }
        if (window.translations && currentKey) {
            window.translations[currentKey] = currentValue;
        }
        
        if (filteredTranslations && currentKey) {
            filteredTranslations[currentKey] = currentValue;
        }
        if (window.filteredTranslations && currentKey) {
            window.filteredTranslations[currentKey] = currentValue;
        }
        
        // Mark as modified
        if (modifiedKeys && currentKey) {
            modifiedKeys.add(currentKey);
        }
        if (window.modifiedKeys && currentKey) {
            window.modifiedKeys.add(currentKey);
        }
        
        // Update the list item
        if (translationList) {
            const items = translationList.querySelectorAll('.translation-item');
            if (items[currentIndex]) {
                // طھظ†ط¸ظٹظپ ط§ظ„ظ†طµ ظ„ظ„ظ…ط¹ط§ظٹظ†ط©
                let cleanCurrentValue = currentValue;
                if (typeof cleanText === 'function') {
                    cleanCurrentValue = cleanText(currentValue);
                }
                
                const preview = cleanCurrentValue.length > (previewLength || 50) ? 
                    cleanCurrentValue.substring(0, (previewLength || 50)) + '...' : cleanCurrentValue;
                const previewElement = items[currentIndex].querySelector('.translation-preview');
                if (previewElement) {
                    previewElement.textContent = preview;
                }
                items[currentIndex].classList.add('modified');
            }
        }
        
        if (typeof updateStats === 'function') {
            updateStats(); // طھط­ط¯ظٹط« ط§ظ„ط¥ط­طµط§ط¦ظٹط§طھ
        }
        
        // Don't reset hasUnsavedChanges - keep it true until file is saved
        window.currentEditedValue = currentValue;
        currentEditedValue = currentValue;
    }
    
    window.currentIndex = index;
    currentIndex = index;
    
    const key = translationKeys[index];
    
    // ط§ط³طھط®ط¯ط§ظ… ط§ظ„ظ†طµ ط§ظ„ط£طµظ„ظٹ ط£ظˆظ„ط§ظ‹طŒ ط«ظ… ط§ظ„طھط­ظ‚ظ‚ ظ…ظ† ظˆط¬ظˆط¯ طھط¹ط¯ظٹظ„ط§طھ
    let value = originalTranslations ? originalTranslations[key] : '';
    
    // ط¥ط°ط§ ظƒط§ظ† ط§ظ„ظ…ظپطھط§ط­ ظ…ظڈط¹ط¯ظ„طŒ ط§ط³طھط®ط¯ظ… ط§ظ„ظ†طµ ط§ظ„ظ…ظڈط¹ط¯ظ„ ظ…ظ† translations
    if (modifiedKeys && modifiedKeys.has(key) && translations && translations[key]) {
        value = translations[key];
        console.log(`ًں”„ ط§ظ„ظ…ظپطھط§ط­ "${key}" ظ…ظڈط¹ط¯ظ„ - ط§ط³طھط®ط¯ط§ظ… ط§ظ„ظ†طµ ط§ظ„ظ…ظڈط¹ط¯ظ„`);
    } else {
        console.log(`ًں“‌ ط§ظ„ظ…ظپطھط§ط­ "${key}" ط£طµظ„ظٹ - ط§ط³طھط®ط¯ط§ظ… ط§ظ„ظ†طµ ط§ظ„ط£طµظ„ظٹ`);
    }
    
    const originalValue = originalTranslations ? originalTranslations[key] : '';
    
    // Set the currently editing key
    window.currentEditingKey = key;
    currentEditingKey = key;
    
    // Update displays
    // Show English text if available, otherwise show original value or helpful message
    const englishText = englishTranslations ? englishTranslations[key] : '';
    
    console.log(`ًں”„ طھط­ط¯ظٹط« ط§ظ„ط¹ط±ط¶ ظ„ظ„ظ…ظپطھط§ط­: ${key}`);
    console.log(`ًں“پ ط¹ط¯ط¯ ط§ظ„ظ†طµظˆطµ ط§ظ„ط¥ظ†ط¬ظ„ظٹط²ظٹط© ط§ظ„ظ…ط­ظ…ظ„ط©: ${Object.keys(englishTranslations || {}).length}`);
    console.log(`ًںژ¯ ط§ظ„ظ†طµ ط§ظ„ط¥ظ†ط¬ظ„ظٹط²ظٹ ظ„ظ„ظ…ظپطھط§ط­ ط§ظ„ط­ط§ظ„ظٹ:`, englishText || 'ط؛ظٹط± ظ…ظˆط¬ظˆط¯');
    
    // Show clean text for editing (extract from quotes) - طھط¹ط±ظٹظپ cleanValue ط£ظˆظ„ط§ظ‹
    let cleanValue = '';
    if (typeof cleanText === 'function') {
        cleanValue = cleanText(value || '');
    } else {
        cleanValue = (value || '').replace(/#NT!/g, '').replace(/#[A-Z0-9]+!/g, '').replace(/"/g, '').trim();
    }
    
    if (englishText) {
        // ط§ط³طھط®ط±ط§ط¬ ط§ظ„ظ†طµ ظ…ظ† ط¨ظٹظ† ط¹ظ„ط§ظ…ط§طھ ط§ظ„طھظ†طµظٹطµ
        let cleanEnglishText = '';
        if (typeof cleanText === 'function') {
            cleanEnglishText = cleanText(englishText);
        } else {
            cleanEnglishText = englishText.replace(/#NT!/g, '').replace(/#[A-Z0-9]+!/g, '').replace(/"/g, '').trim();
        }
        
        // ط¹ط±ط¶ ط§ظ„ظ†طµ ط§ظ„ظ…ط±ط¬ط¹ظٹ ظ…ط¹ ط§ظ„ط¨ظ„ظˆظƒط§طھ ط¥ط°ط§ ظƒط§ظ† ظˆط¶ط¹ ط§ظ„ط¨ظ„ظˆظƒط§طھ ظ…ظپط¹ظ„
        if (typeof updateOriginalTextDisplay === 'function') {
            updateOriginalTextDisplay(cleanEnglishText, cleanValue);
        }
        
        console.log(`âœ… ط¹ط±ط¶ ط§ظ„ظ†طµ ط§ظ„ط¥ظ†ط¬ظ„ظٹط²ظٹ ط§ظ„ظ…ط±ط¬ط¹ظٹ: "${cleanEnglishText}"`);
    } else {
        // ظ„ط§ ظٹظˆط¬ط¯ ظ†طµ ظ…ط±ط¬ط¹ظٹ ظ…ظ† ظ…ط¬ظ„ط¯ english
        if (originalText) {
            originalText.innerHTML = ''; // ظ…ط³ط­ ط£ظٹ ظ…ط­طھظˆظ‰ ط³ط§ط¨ظ‚
            originalText.textContent = `ًں“‚ ط¶ط¹ ظ…ظ„ظپ "${currentFile?.name || 'ظ…ط·ط§ط¨ظ‚'}" ظپظٹ ظ…ط¬ظ„ط¯ english ظ„ظ„ظ…ظ‚ط§ط±ظ†ط©`;
            originalText.style.color = '#6c757d'; // ظ„ظˆظ† ط±ظ…ط§ط¯ظٹ ظ„ظ„ط±ط³ط§ظ„ط©
        }
        console.log(`â„¹ï¸ڈ ظ„ط§ ظٹظˆط¬ط¯ ظ†طµ ظ…ط±ط¬ط¹ظٹ ظ„ظ„ظ…ظپطھط§ط­: ${key}`);
    }
    
    if (translationText) {
        // طھط­ط¯ظٹط« ط§ظ„ظ…طھط؛ظٹط±ط§طھ ط£ظˆظ„ط§ظ‹
        window.currentEditingKey = key;
        currentEditingKey = key;
        
        // ط§ط³طھط®ط¯ط§ظ… ط§ظ„ظ†طµ (ط§ظ„ط£طµظ„ظٹ ط£ظˆ ط§ظ„ظ…ظڈط¹ط¯ظ„ ط­ط³ط¨ ظ…ط§ طھظ… طھط­ط¯ظٹط¯ظ‡ ط£ط¹ظ„ط§ظ‡)
        translationText.value = cleanValue;
        window.currentEditedValue = cleanValue;
        currentEditedValue = cleanValue;
        
        console.log(`ًں“‌ طھظ… ط¹ط±ط¶ ط§ظ„ظ†طµ ظ„ظ„ظ…ظپطھط§ط­ "${key}": "${cleanValue}"`);
    }
    
    // Check if this translation was modified
    if (modifiedKeys && modifiedKeys.has(key)) {
        window.hasUnsavedChanges = true;
        hasUnsavedChanges = true;
    } else {
        window.hasUnsavedChanges = false;
        hasUnsavedChanges = false;
    }
    
    if (typeof updateSaveButton === 'function') {
        updateSaveButton();
    }
    
    // Update selection in list
    if (translationList) {
        const items = translationList.querySelectorAll('.translation-item');
        items.forEach((item, i) => {
            item.classList.toggle('selected', i === index);
        });
        
        // Scroll to selected item
        const selectedItem = translationList.querySelector('.translation-item.selected');
        if (selectedItem) {
            selectedItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }
    
    // Focus on translation text only if search is not active
    if (document.activeElement !== searchInput && translationText) {
        translationText.focus();
    }
    
    // طھط­ط¯ظٹط« ط§ظ„ط¨ظ„ظˆظƒط§طھ ط¥ط°ط§ ظƒط§ظ†طھ ظ…ظپط¹ظ„ط© ظˆظپط­طµ ط§ظ„ط¨ظ„ظˆظƒط§طھ ط§ظ„ظ…ظپظ‚ظˆط¯ط©
    if (translationText) {
        const container = translationText.parentNode;
        const blocksEditor = container.querySelector('.blocks-editor');
        if (blocksEditor && blocksEditor.style.display !== 'none') {
            if (window.debugBlocks) console.log('ًں”„ طھط­ط¯ظٹط« ط§ظ„ط¨ظ„ظˆظƒط§طھ ظ„ظ„طھط±ط¬ظ…ط© ط§ظ„ط¬ط¯ظٹط¯ط©:', key);
            setTimeout(() => {
                if (typeof refreshBlocks === 'function') {
                    refreshBlocks(blocksEditor, translationText);
                }
            }, 50);
        }
    }
    
    // ظپط­طµ ط§ظ„ط¨ظ„ظˆظƒط§طھ ط§ظ„ظ…ظپظ‚ظˆط¯ط© ط­طھظ‰ ط¨ط¯ظˆظ† ظˆط¶ط¹ ط§ظ„ط¨ظ„ظˆظƒط§طھ (ظ„ظ„ط¥ط­طµط§ط¦ظٹط§طھ)
    if (englishTranslations && englishTranslations[key]) {
        setTimeout(() => {
            if (typeof findMissingBlocks === 'function') {
                const missingBlocks = findMissingBlocks(englishTranslations[key], cleanValue);
                if (missingBlocks.length > 0 && window.debugBlocks) {
                    console.info(`ًں“ٹ ط§ظ„ط¨ظ„ظˆظƒط§طھ ط§ظ„ظ…ظپظ‚ظˆط¯ط© ظپظٹ "${key}":`, missingBlocks);
                }
            }
        }, 100);
    }
    
    // طھط­ط¯ظٹط« طھظ„ظˆظٹظ† ظ…ظپط§طھظٹط­ ط§ظ„طھط±ط¬ظ…ط©
    if (typeof safeTimeout === 'function' && typeof highlightKeysWithMissingBlocks === 'function') {
        safeTimeout(() => highlightKeysWithMissingBlocks(), 150);
    }
}

// Navigation
function nextTranslation() {
    if (currentIndex < (translationKeys ? translationKeys.length - 1 : 0)) {
        selectTranslationByIndex(currentIndex + 1);
    }
}

function previousTranslation() {
    if (currentIndex > 0) {
        selectTranslationByIndex(currentIndex - 1);
    }
}

// Search and filter
function filterTranslations() {
    const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
    
    // ط¥ظ†ط´ط§ط، ظ…ط¬ظ…ظˆط¹ط© ط§ظ„ط¨ظٹط§ظ†ط§طھ ط§ظ„ط­ط§ظ„ظٹط© (ط£طµظ„ظٹط© + طھط¹ط¯ظٹظ„ط§طھ)
    const currentTranslations = { ...originalTranslations };
    
    // ط¯ظ…ط¬ ط§ظ„طھط¹ط¯ظٹظ„ط§طھ ط§ظ„ط­ط§ظ„ظٹط©
    if (modifiedKeys && translations) {
        modifiedKeys.forEach(key => {
            if (translations[key] !== undefined) {
                currentTranslations[key] = translations[key];
            }
        });
    }
    
    if (!searchTerm) {
        window.filteredTranslations = { ...currentTranslations };
        filteredTranslations = { ...currentTranslations };
    } else {
        const newFiltered = {};
        Object.entries(currentTranslations || {}).forEach(([key, value]) => {
            if (key.toLowerCase().includes(searchTerm) || 
                value.toLowerCase().includes(searchTerm)) {
                newFiltered[key] = value;
            }
        });
        window.filteredTranslations = newFiltered;
        filteredTranslations = newFiltered;
    }
    
    console.log(`ًں”چ ظپظ„طھط±ط© ط§ظ„طھط±ط¬ظ…ط§طھ: ${Object.keys(filteredTranslations).length} ظ…ظ† ${Object.keys(currentTranslations).length}`);
    
    const newKeys = Object.keys(filteredTranslations || {});
    window.translationKeys = newKeys;
    translationKeys = newKeys;
    
    // Try to maintain the current selection if it exists in filtered results
    let newIndex = 0;
    if (currentEditingKey && translationKeys.includes(currentEditingKey)) {
        newIndex = translationKeys.indexOf(currentEditingKey);
    }
    
    window.currentIndex = newIndex;
    currentIndex = newIndex;
    
    populateTranslationList();
    
    if (typeof updateStats === 'function') {
        updateStats();
    }
    
    // Select the appropriate item (maintain current selection or first item)
    if (translationKeys.length > 0) {
        selectTranslationByIndex(currentIndex);
    }
}

function clearSearch() {
    if (searchInput) {
        searchInput.value = '';
        filterTranslations();
        
        // ط¶ظ…ط§ظ† ط¥ط¹ط§ط¯ط© ط§ظ„طھط±ظƒظٹط² ظ„ظ„ط¨ط­ط«
        setTimeout(() => {
            if (searchInput) {
                searchInput.focus();
            }
        }, 100);
    }
}

// Font and alignment controls
function changeFontSize() {
    const fontSizeElement = document.getElementById('fontSize');
    const fontSize = fontSizeElement ? fontSizeElement.value : '16';
    const elements = [originalText, translationText].filter(Boolean);
    
    elements.forEach(element => {
        if (element) {
            element.style.fontSize = fontSize + 'px';
        }
    });
    
    // طھط·ط¨ظٹظ‚ ط­ط¬ظ… ط§ظ„ط®ط· ط¹ظ„ظ‰ blocks editor ط¥ط°ط§ ظƒط§ظ† ظ…ظپط¹ظ„ط§ظ‹
    if (translationText) {
        const container = translationText.parentNode;
        const blocksEditor = container.querySelector('.blocks-editor');
        if (blocksEditor) {
            blocksEditor.style.fontSize = fontSize + 'px';
            console.log(`ًںژ¯ طھظ… طھط·ط¨ظٹظ‚ ط­ط¬ظ… ط§ظ„ط®ط· ${fontSize}px ط¹ظ„ظ‰ ظˆط¶ط¹ ط§ظ„ط¨ظ„ظˆظƒط§طھ`);
        }
    }
    
    console.log(`ًں“‌ طھظ… طھط·ط¨ظٹظ‚ ط­ط¬ظ… ط§ظ„ط®ط·: ${fontSize}px`);
    if (typeof showNotification === 'function') {
        showNotification(`طھظ… طھط؛ظٹظٹط± ط­ط¬ظ… ط§ظ„ط®ط· ط¥ظ„ظ‰ ${fontSize}px`, 'info');
    }
}

function changeTextAlignment() {
    const alignmentElement = document.getElementById('textAlign');
    const alignment = alignmentElement ? alignmentElement.value : 'right';
    const elements = [originalText, translationText].filter(Boolean);
    
    elements.forEach(element => {
        if (element) {
            element.style.textAlign = alignment;
        }
    });
    
    // طھط·ط¨ظٹظ‚ ط§ظ„ظ…ط­ط§ط°ط§ط© ط¹ظ„ظ‰ blocks editor ط¥ط°ط§ ظƒط§ظ† ظ…ظپط¹ظ„ط§ظ‹
    if (translationText) {
        const container = translationText.parentNode;
        const blocksEditor = container.querySelector('.blocks-editor');
        if (blocksEditor) {
            blocksEditor.style.textAlign = alignment;
            console.log(`ًںژ¯ طھظ… طھط·ط¨ظٹظ‚ ط§ظ„ظ…ط­ط§ط°ط§ط© ${alignment} ط¹ظ„ظ‰ ظˆط¶ط¹ ط§ظ„ط¨ظ„ظˆظƒط§طھ`);
        }
    }
    
    console.log(`ًں“‌ طھظ… طھط·ط¨ظٹظ‚ ط§ظ„ظ…ط­ط§ط°ط§ط©: ${alignment}`);
}

// Copy to Clipboard Function
async function copyToClipboard(elementId) {
    try {
        const element = document.getElementById(elementId);
        if (!element) {
            if (typeof showNotification === 'function') {
                showNotification('ط§ظ„ط¹ظ†طµط± ط؛ظٹط± ظ…ظˆط¬ظˆط¯', 'error');
            }
            return;
        }
        
        let textToCopy = '';
        
        if (element.tagName === 'TEXTAREA' || element.tagName === 'INPUT') {
            textToCopy = element.value;
        } else {
            textToCopy = element.textContent || element.innerText;
        }
        
        if (!textToCopy.trim()) {
            if (typeof showNotification === 'function') {
                showNotification('ظ„ط§ ظٹظˆط¬ط¯ ظ†طµ ظ„ظ„ظ†ط³ط®', 'warning');
            }
            return;
        }
        
        await navigator.clipboard.writeText(textToCopy);
        if (typeof showNotification === 'function') {
            showNotification('طھظ… ظ†ط³ط® ط§ظ„ظ†طµ ط¨ظ†ط¬ط§ط­! ًں“‹', 'success');
        }
        
        // Visual feedback
        const copyIcon = event.target.closest('.copy-icon');
        if (copyIcon) {
            const originalIcon = copyIcon.innerHTML;
            copyIcon.innerHTML = '<i class="fas fa-check"></i>';
            copyIcon.style.background = 'rgba(40, 167, 69, 0.8)';
            
            setTimeout(() => {
                copyIcon.innerHTML = originalIcon;
                copyIcon.style.background = 'rgba(108, 99, 255, 0.8)';
            }, 1000);
        }
        
    } catch (error) {
        console.error('ط®ط·ط£ ظپظٹ ط§ظ„ظ†ط³ط®:', error);
        if (typeof showNotification === 'function') {
            showNotification('ظپط´ظ„ ظپظٹ ظ†ط³ط® ط§ظ„ظ†طµ', 'error');
        }
    }
}

// ظˆط¸ظٹظپط© ط§ظ„طھط´ط®ظٹطµ ظ„ظ…ط³ط§ط¹ط¯ط© ط§ظ„ظ…ط³طھط®ط¯ظ… ط¹ظ„ظ‰ ظپظ‡ظ… ط­ط§ظ„ط© ط§ظ„ظ†ط¸ط§ظ…
function showDebugInfo() {
    const englishCount = Object.keys(englishTranslations || {}).length;
    const translationCount = Object.keys(translations || {}).length;
    const currentFileName = currentFile ? currentFile.name : 'ظ„ط§ ظٹظˆط¬ط¯ ظ…ظ„ظپ';
    
    let debugMessage = `ًں”چ ظ…ط¹ظ„ظˆظ…ط§طھ ط§ظ„طھط´ط®ظٹطµ:\n\n`;
    debugMessage += `ًں“„ ط§ظ„ظ…ظ„ظپ ط§ظ„ط­ط§ظ„ظٹ: ${currentFileName}\n`;
    debugMessage += `ًں“ٹ ط¹ط¯ط¯ ط§ظ„طھط±ط¬ظ…ط§طھ ط§ظ„ظ…ط­ظ…ظ„ط©: ${translationCount}\n`;
    debugMessage += `ًں‡¬ًں‡§ ط¹ط¯ط¯ ط§ظ„ظ†طµظˆطµ ط§ظ„ط¥ظ†ط¬ظ„ظٹط²ظٹط©: ${englishCount}\n`;
    debugMessage += `ًںژ¯ ط§ظ„ظ…ظپطھط§ط­ ط§ظ„ط­ط§ظ„ظٹ: ${currentEditingKey || 'ظ„ط§ ظٹظˆط¬ط¯'}\n\n`;
    
    if (englishCount > 0) {
        debugMessage += `âœ… طھظ… طھط­ظ…ظٹظ„ ط§ظ„ظ†طµظˆطµ ط§ظ„ط¥ظ†ط¬ظ„ظٹط²ظٹط© ط¨ظ†ط¬ط§ط­!\n`;
        const sampleKeys = Object.keys(englishTranslations || {}).slice(0, 3);
        debugMessage += `ًں“‹ ط¹ظٹظ†ط© ظ…ظ† ط§ظ„ظ…ظپط§طھظٹط­: ${sampleKeys.join(', ')}\n\n`;
        
        if (currentEditingKey && englishTranslations && englishTranslations[currentEditingKey]) {
            debugMessage += `âœ… ط§ظ„ظ…ظپطھط§ط­ ط§ظ„ط­ط§ظ„ظٹ ظ…ظˆط¬ظˆط¯ ظپظٹ ط§ظ„ظ…ظ„ظپ ط§ظ„ط¥ظ†ط¬ظ„ظٹط²ظٹ\n`;
            debugMessage += `ًں“‌ ط§ظ„ظ†طµ: "${englishTranslations[currentEditingKey]}"`;
        } else if (currentEditingKey) {
            debugMessage += `âڑ ï¸ڈ ط§ظ„ظ…ظپطھط§ط­ ط§ظ„ط­ط§ظ„ظٹ ط؛ظٹط± ظ…ظˆط¬ظˆط¯ ظپظٹ ط§ظ„ظ…ظ„ظپ ط§ظ„ط¥ظ†ط¬ظ„ظٹط²ظٹ`;
        }
    } else {
        debugMessage += `â„¹ï¸ڈ ظ„ط§ ظٹظˆط¬ط¯ ظ†طµ ظ…ط±ط¬ط¹ظٹ ط¥ظ†ط¬ظ„ظٹط²ظٹ\n\n`;
        debugMessage += `ًں’، ظƒظٹظپ ظٹط¹ظ…ظ„ ط§ظ„ظ†ط¸ط§ظ…:\n`;
        debugMessage += `â€¢ ط§ط±ظپط¹ ط£ظٹ ظ…ظ„ظپ طھط±ظٹط¯ طھط¹ط¯ظٹظ„ظ‡\n`;
        debugMessage += `â€¢ ط¶ط¹ ط§ظ„ظ…ظ„ظپ ط§ظ„ط¥ظ†ط¬ظ„ظٹط²ظٹ ط§ظ„ظ…ط·ط§ط¨ظ‚ ظپظٹ ظ…ط¬ظ„ط¯ english ظ„ظ„ظ…ظ‚ط§ط±ظ†ط©\n`;
        debugMessage += `â€¢ ط¹ط¯ظ‘ظ„ ط§ظ„ظ†طµظˆطµ ظƒظ…ط§ طھط´ط§ط،\n`;
        debugMessage += `â€¢ ط§ط­ظپط¸ ط§ظ„ظ…ظ„ظپ ط§ظ„ظ…ظڈط­ط¯ط«`;
    }
    
    // ط¹ط±ط¶ ط§ظ„ظ…ط¹ظ„ظˆظ…ط§طھ ظپظٹ ظ†ط§ظپط°ط© ظ…ظ†ط¨ط«ظ‚ط©
    alert(debugMessage);
    
    // ط·ط¨ط§ط¹ط© ظ…ط¹ظ„ظˆظ…ط§طھ ط¥ط¶ط§ظپظٹط© ظپظٹ ط§ظ„ظƒظˆظ†ط³ظˆظ„
    console.log('ًں”چ طھط´ط®ظٹطµ ظ…ظپطµظ„:');
    console.log('ط§ظ„ظ…ظ„ظپ ط§ظ„ط­ط§ظ„ظٹ:', currentFile);
    console.log('ط§ظ„طھط±ط¬ظ…ط§طھ:', translations);
    console.log('ط§ظ„ظ†طµظˆطµ ط§ظ„ط¥ظ†ط¬ظ„ظٹط²ظٹط©:', englishTranslations);
    console.log('ط§ظ„ظ…ظپطھط§ط­ ط§ظ„ط­ط§ظ„ظٹ:', currentEditingKey);
}

// Make functions available globally
if (typeof window !== 'undefined') {
    window.setupEventListeners = setupEventListeners;
    window.handleKeyboardShortcuts = handleKeyboardShortcuts;
    window.populateTranslationList = populateTranslationList;
    window.selectTranslationByIndex = selectTranslationByIndex;
    window.nextTranslation = nextTranslation;
    window.previousTranslation = previousTranslation;
    window.filterTranslations = filterTranslations;
    window.clearSearch = clearSearch;
    window.changeFontSize = changeFontSize;
    window.changeTextAlignment = changeTextAlignment;
    window.copyToClipboard = copyToClipboard;
    window.showDebugInfo = showDebugInfo;
}
// ===========================================
// NOTIFICATIONS SYSTEM - ظ†ط¸ط§ظ… ط§ظ„ط¥ط´ط¹ط§ط±ط§طھ
// ===========================================

// ط¯ط§ظ„ط© ط¥ط®ظپط§ط، ط§ظ„ط¥ط´ط¹ط§ط±
function hideNotification() {
    if (notification) {
        notification.classList.remove('show');
        notification.style.pointerEvents = 'none';
        notification.style.zIndex = '-1';
        
        // طھظ†ط¸ظٹظپ طھط§ظ… ط¨ط¹ط¯ ط§ظ†طھظ‡ط§ط، ط§ظ„ظ€ animation
        setTimeout(() => {
            if (notification) {
                notification.className = 'notification';
                notification.textContent = '';
                notification.style.pointerEvents = '';
                notification.style.zIndex = '';
            }
        }, 300);
        
        console.log('ًں—‘ï¸ڈ طھظ… ط¥ط®ظپط§ط، ط§ظ„ط¥ط´ط¹ط§ط±');
    }
}

// Utility functions
function showNotification(message, type = 'info') {
    if (!notification) return;
    
    // ط¥ط²ط§ظ„ط© timeout ط³ط§ط¨ظ‚
    if (notificationTimeout) {
        clearTimeout(notificationTimeout);
        notificationTimeout = null;
    }
    
    // Clear existing classes
    notification.className = 'notification show';
    
    // ط¥ط¶ط§ظپط© ظ†ظˆط¹ ط§ظ„ط¥ط´ط¹ط§ط±
    if (type) {
        notification.classList.add(`notification-${type}`);
    }
    
    // طھط­ظˆظٹظ„ \n ط¥ظ„ظ‰ <br> ظ„ظ„ط¹ط±ط¶ ط§ظ„طµط­ظٹط­
    const formattedMessage = message.replace(/\n/g, '<br>');
    
    // ط¥ط¶ط§ظپط© ط²ط± ط¥ط؛ظ„ط§ظ‚ ظ„ط¬ظ…ظٹط¹ ط§ظ„ط¥ط´ط¹ط§ط±ط§طھ (ط­ط³ط¨ ط·ظ„ط¨ ط§ظ„ظ…ط³طھط®ط¯ظ…)
    const isLongMessage = message.length > 80;
    
    notification.innerHTML = `
        <div class="notification-content">
            <div class="notification-text">${formattedMessage}</div>
            <button class="notification-close" onclick="hideNotification()" title="ط¥ط؛ظ„ط§ظ‚">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    if (isLongMessage) {
        notification.classList.add('notification-long');
        // ط¥ط®ظپط§ط، طھظ„ظ‚ط§ط¦ظٹ ط¨ط¹ط¯ 60 ط«ط§ظ†ظٹط© ظ„ظ„ط±ط³ط§ط¦ظ„ ط§ظ„ط·ظˆظٹظ„ط© (ط¯ظ‚ظٹظ‚ط© ظƒط§ظ…ظ„ط©!)
        notificationTimeout = setTimeout(() => {
            hideNotification();
        }, 60000);
    } else {
        notification.classList.remove('notification-long');
        // ط¥ط®ظپط§ط، طھظ„ظ‚ط§ط¦ظٹ ط¨ط¹ط¯ 30 ط«ط§ظ†ظٹط© ظ„ظ„ط±ط³ط§ط¦ظ„ ط§ظ„ط¹ط§ط¯ظٹط© (30 ط«ط§ظ†ظٹط©!)
        notificationTimeout = setTimeout(() => {
            hideNotification();
        }, 30000);
    }
    
    // ط¥ط¹ط§ط¯ط© ط§ظ„ظ†ظ‚ط± ظ„ظ„ط¥ط؛ظ„ط§ظ‚ ط£ظٹط¶ط§ظ‹ (ط¨ظ†ط§ط، ط¹ظ„ظ‰ ط·ظ„ط¨ ط§ظ„ظ…ط³طھط®ط¯ظ…)
    notification.onclick = hideNotification;
}

function showLoading() {
    if (loadingOverlay) {
        loadingOverlay.classList.add('show');
        console.log('ًں”„ ط¹ط±ط¶ ط´ط§ط´ط© ط§ظ„طھط­ظ…ظٹظ„');
    }
}

function hideLoading() {
    if (loadingOverlay) {
        loadingOverlay.classList.remove('show');
        console.log('âœ… طھظ… ط¥ط®ظپط§ط، ط´ط§ط´ط© ط§ظ„طھط­ظ…ظٹظ„');
    }
}

// ط¯ط§ظ„ط© ط¥ط¶ط§ظپظٹط© ظ„ط¶ظ…ط§ظ† ط¥ط®ظپط§ط، ط´ط§ط´ط© ط§ظ„طھط­ظ…ظٹظ„
function ensureLoadingHidden() {
    if (loadingOverlay && loadingOverlay.classList.contains('show')) {
        hideLoading();
        console.log('ًں›،ï¸ڈ ط¥ط®ظپط§ط، ط¥ط¬ط¨ط§ط±ظٹ ظ„ط´ط§ط´ط© ط§ظ„طھط­ظ…ظٹظ„');
        return true;
    }
    return false;
}

// UI updates
function updateStats() {
    const total = Object.keys(translations || {}).length;
    const filtered = Object.keys(filteredTranslations || {}).length;
    const modified = (modifiedKeys && modifiedKeys.size) || 0;
    
    let statsMessage = '';
    if (total === filtered) {
        statsMessage = `ط¥ط¬ظ…ط§ظ„ظٹ ط§ظ„طھط±ط¬ظ…ط§طھ: ${total}`;
    } else {
        statsMessage = `ط¹ط±ط¶ ${filtered} ظ…ظ† ${total} طھط±ط¬ظ…ط©`;
    }
    
    // ط¥ط¶ط§ظپط© ط¹ط¯ط§ط¯ ط§ظ„طھط¹ط¯ظٹظ„ط§طھ
    if (modified > 0) {
        statsMessage += ` - طھظ… طھط¹ط¯ظٹظ„: ${modified}`;
    }
    
    if (statsText) {
        statsText.textContent = statsMessage;
    }
    
    // Update progress bar
    if (progressBar) {
        if (total > 0) {
            const progress = filtered / total;
            progressBar.style.width = (progress * 100) + '%';
        } else {
            progressBar.style.width = '0%';
        }
    }
}

function updateStatus(filename) {
    if (statusText) {
        if (filename) {
            statusText.textContent = `ط§ظ„ظ…ظ„ظپ: ${filename}`;
        } else {
            statusText.textContent = 'ظ„ظ… ظٹطھظ… طھط­ظ…ظٹظ„ ظ…ظ„ظپ';
        }
    }
}

function updateSaveButton() {
    const saveButton = document.getElementById('saveFileBtn');
    if (saveButton) {
        // Always ensure save-btn class is present
        saveButton.classList.add('save-btn');
        
        const hasModifications = (modifiedKeys && modifiedKeys.size > 0) || hasUnsavedChanges;
        const modifiedCount = (modifiedKeys && modifiedKeys.size) || 0;
        
        if (hasModifications) {
            // Has unsaved changes - red with pulsing animation
            if (modifiedCount > 0) {
                saveButton.innerHTML = `<i class="fas fa-save"></i> ط­ظپط¸ ط§ظ„ظ…ظ„ظپ (${modifiedCount} طھط¹ط¯ظٹظ„)`;
                saveButton.title = `ظ„ط¯ظٹظƒ ${modifiedCount} طھط¹ط¯ظٹظ„ ط؛ظٹط± ظ…ط­ظپظˆط¸. ط§ط¶ط؛ط· ظ„طھظ†ط²ظٹظ„ ط§ظ„ظ…ظ„ظپ ط§ظ„ظ…ط­ط¯ط«`;
            } else {
                saveButton.innerHTML = '<i class="fas fa-save"></i> ط­ظپط¸ ط§ظ„ظ…ظ„ظپ (طھط¹ط¯ظٹظ„ط§طھ ط¬ط¯ظٹط¯ط©)';
                saveButton.title = 'ظ„ط¯ظٹظƒ طھط¹ط¯ظٹظ„ط§طھ ط؛ظٹط± ظ…ط­ظپظˆط¸ط©. ط§ط¶ط؛ط· ظ„طھظ†ط²ظٹظ„ ط§ظ„ظ…ظ„ظپ ط§ظ„ظ…ط­ط¯ط«';
            }
            saveButton.classList.remove('saved');
            saveButton.classList.add('unsaved');
        } else if (currentFile) {
            // File loaded and saved - green
            saveButton.innerHTML = '<i class="fas fa-save"></i> ط­ظپط¸ ط§ظ„ظ…ظ„ظپ';
            saveButton.title = 'طھظ… ط­ظپط¸ ط¬ظ…ظٹط¹ ط§ظ„طھط؛ظٹظٹط±ط§طھ ظ…ط¤ظ‚طھط§ظ‹. ط§ط¶ط؛ط· ظ„طھظ†ط²ظٹظ„ ط§ظ„ظ…ظ„ظپ';
            saveButton.classList.remove('unsaved');
            saveButton.classList.add('saved');
        } else {
            // No file loaded - default red
            saveButton.innerHTML = '<i class="fas fa-save"></i> ط­ظپط¸ ط§ظ„ظ…ظ„ظپ';
            saveButton.title = 'ظ„ظ… ظٹطھظ… طھط­ظ…ظٹظ„ ظ…ظ„ظپ ط¨ط¹ط¯. ط§ظپطھط­ ظ…ظ„ظپط§ظ‹ ط£ظˆظ„ط§ظ‹';
            saveButton.classList.remove('saved');
            saveButton.classList.add('unsaved');
        }
    }
}

// Settings Modal Functions
function openSettings() {
    if (settingsModal) {
        settingsModal.classList.add('show');
        if (typeof loadApiKeysToForm === 'function') {
            loadApiKeysToForm();
        }
    }
}

function closeSettings() {
    if (settingsModal) {
        settingsModal.classList.remove('show');
    }
}

function loadApiKeysToForm() {
    const elements = {
        claudeApiKey: document.getElementById('claudeApiKey'),
        openaiApiKey: document.getElementById('openaiApiKey'),
        geminiApiKey: document.getElementById('geminiApiKey'),
        deeplApiKey: document.getElementById('deeplApiKey'),
        googleApiKey: document.getElementById('googleApiKey')
    };
    
    if (elements.claudeApiKey) elements.claudeApiKey.value = (apiKeys && apiKeys.claude) || '';
    if (elements.openaiApiKey) elements.openaiApiKey.value = (apiKeys && apiKeys.openai) || '';
    if (elements.geminiApiKey) elements.geminiApiKey.value = (apiKeys && apiKeys.gemini) || '';
    if (elements.deeplApiKey) elements.deeplApiKey.value = (apiKeys && apiKeys.deepl) || '';
    if (elements.googleApiKey) elements.googleApiKey.value = (apiKeys && apiKeys.google) || '';
}

function saveApiSettings() {
    const elements = {
        claudeApiKey: document.getElementById('claudeApiKey'),
        openaiApiKey: document.getElementById('openaiApiKey'),
        geminiApiKey: document.getElementById('geminiApiKey'),
        deeplApiKey: document.getElementById('deeplApiKey'),
        googleApiKey: document.getElementById('googleApiKey')
    };
    
    if (apiKeys) {
        apiKeys.claude = elements.claudeApiKey ? elements.claudeApiKey.value.trim() : '';
        apiKeys.openai = elements.openaiApiKey ? elements.openaiApiKey.value.trim() : '';
        apiKeys.gemini = elements.geminiApiKey ? elements.geminiApiKey.value.trim() : '';
        apiKeys.deepl = elements.deeplApiKey ? elements.deeplApiKey.value.trim() : '';
        apiKeys.google = elements.googleApiKey ? elements.googleApiKey.value.trim() : '';
    }
    
    if (window.apiKeys) {
        window.apiKeys.claude = elements.claudeApiKey ? elements.claudeApiKey.value.trim() : '';
        window.apiKeys.openai = elements.openaiApiKey ? elements.openaiApiKey.value.trim() : '';
        window.apiKeys.gemini = elements.geminiApiKey ? elements.geminiApiKey.value.trim() : '';
        window.apiKeys.deepl = elements.deeplApiKey ? elements.deeplApiKey.value.trim() : '';
        window.apiKeys.google = elements.googleApiKey ? elements.googleApiKey.value.trim() : '';
    }
    
    // Save to localStorage
    try {
        localStorage.setItem('apiKeys', JSON.stringify(apiKeys || window.apiKeys));
    } catch (error) {
        console.error('ط®ط·ط£ ظپظٹ ط­ظپط¸ ظ…ظپط§طھظٹط­ API:', error);
    }
    
    closeSettings();
    showNotification('طھظ… ط­ظپط¸ ط¥ط¹ط¯ط§ط¯ط§طھ API ط¨ظ†ط¬ط§ط­! ًں”‘', 'success');
}

function loadApiKeys() {
    try {
        const savedKeys = localStorage.getItem('apiKeys');
        if (savedKeys) {
            const parsedKeys = JSON.parse(savedKeys);
            
            if (apiKeys) {
                Object.assign(apiKeys, parsedKeys);
            }
            if (window.apiKeys) {
                Object.assign(window.apiKeys, parsedKeys);
            }
        }
    } catch (error) {
        console.error('ط®ط·ط£ ظپظٹ طھط­ظ…ظٹظ„ ظ…ظپط§طھظٹط­ API:', error);
    }
}

// Setup modal close behavior
function setupModalHandlers() {
    // Close modal when clicking outside
    if (settingsModal) {
        settingsModal.addEventListener('click', function(e) {
            if (e.target === settingsModal) {
                closeSettings();
            }
        });
    }
    
    // ط¥ط®ظپط§ط، ط´ط§ط´ط© ط§ظ„طھط­ظ…ظٹظ„ ط¹ظ†ط¯ ط§ظ„ظ†ظ‚ط± ط¹ظ„ظٹظ‡ط§
    if (loadingOverlay) {
        loadingOverlay.addEventListener('click', function() {
            hideLoading();
            console.log('ًں‘† طھظ… ط¥ط®ظپط§ط، ط´ط§ط´ط© ط§ظ„طھط­ظ…ظٹظ„ ط¨ط§ظ„ظ†ظ‚ط±');
        });
    }
    
    // Keyboard shortcuts for modals
    document.addEventListener('keydown', function(e) {
        // Escape to close modal or hide loading
        if (e.key === 'Escape') {
            closeSettings();
            ensureLoadingHidden();
        }
    });
}

// Initialize modal handlers when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupModalHandlers);
} else {
    setupModalHandlers();
}

// Make functions available globally
if (typeof window !== 'undefined') {
    window.hideNotification = hideNotification;
    window.showNotification = showNotification;
    window.showLoading = showLoading;
    window.hideLoading = hideLoading;
    window.ensureLoadingHidden = ensureLoadingHidden;
    window.updateStats = updateStats;
    window.updateStatus = updateStatus;
    window.updateSaveButton = updateSaveButton;
    window.openSettings = openSettings;
    window.closeSettings = closeSettings;
    window.loadApiKeysToForm = loadApiKeysToForm;
    window.saveApiSettings = saveApiSettings;
    window.loadApiKeys = loadApiKeys;
    window.setupModalHandlers = setupModalHandlers;
} 
// ===========================================
// TEST FUNCTIONS - ط¯ظˆط§ظ„ ط§ظ„ط§ط®طھط¨ط§ط± ظˆط§ظ„طھط´ط®ظٹطµ
// ===========================================

// ظپط­طµ ط¬ظ…ظٹط¹ ط§ظ„طھط±ط¬ظ…ط§طھ ظ„ظ„ط¨ظ„ظˆظƒط§طھ ط§ظ„ظ…ظپظ‚ظˆط¯ط©
window.scanAllMissingBlocks = function() {
    console.log('ًں”چ ظپط­طµ ط¬ظ…ظٹط¹ ط§ظ„طھط±ط¬ظ…ط§طھ ظ„ظ„ط¨ظ„ظˆظƒط§طھ ط§ظ„ظ…ظپظ‚ظˆط¯ط©...');
    
    if (!englishTranslations || Object.keys(englishTranslations).length === 0) {
        console.warn('âڑ ï¸ڈ ظ„ط§ طھظˆط¬ط¯ ظ†طµظˆطµ ظ…ط±ط¬ط¹ظٹط© ط¥ظ†ط¬ظ„ظٹط²ظٹط© ظ„ظ„ظ…ظ‚ط§ط±ظ†ط©');
        return;
    }
    
    const report = {};
    let totalMissing = 0;
    let translationsWithIssues = 0;
    
    Object.keys(translations || {}).forEach(key => {
        const englishText = englishTranslations[key];
        const arabicText = translations[key];
        
        if (englishText && arabicText && typeof findMissingBlocks === 'function') {
            const missingBlocks = findMissingBlocks(englishText, arabicText);
            if (missingBlocks.length > 0) {
                report[key] = missingBlocks;
                totalMissing += missingBlocks.length;
                translationsWithIssues++;
            }
        }
    });
    
    console.log('ًں“ٹ طھظ‚ط±ظٹط± ط§ظ„ط¨ظ„ظˆظƒط§طھ ط§ظ„ظ…ظپظ‚ظˆط¯ط©:');
    console.log(`ًں“ˆ ط¥ط¬ظ…ط§ظ„ظٹ ط§ظ„طھط±ط¬ظ…ط§طھ: ${Object.keys(translations || {}).length}`);
    console.log(`âڑ ï¸ڈ طھط±ط¬ظ…ط§طھ ط¨ظ‡ط§ ظ…ط´ط§ظƒظ„: ${translationsWithIssues}`);
    console.log(`ًںڑ« ط¥ط¬ظ…ط§ظ„ظٹ ط§ظ„ط¨ظ„ظˆظƒط§طھ ط§ظ„ظ…ظپظ‚ظˆط¯ط©: ${totalMissing}`);
    
    if (translationsWithIssues > 0) {
        console.log('\nًں“‹ ط§ظ„طھظپط§طµظٹظ„:');
        Object.entries(report).forEach(([key, missing]) => {
            console.log(`ًں”‘ ${key}: ${missing.join(', ')}`);
        });
        
        if (typeof showNotification === 'function') {
            showNotification(`طھظ… ط§ظ„ط¹ط«ظˆط± ط¹ظ„ظ‰ ${totalMissing} ط¨ظ„ظˆظƒ ظ…ظپظ‚ظˆط¯ ظپظٹ ${translationsWithIssues} طھط±ط¬ظ…ط©`, 'warning');
        }
    } else {
        console.log('âœ… ط¬ظ…ظٹط¹ ط§ظ„طھط±ط¬ظ…ط§طھ ظƒط§ظ…ظ„ط©!');
        if (typeof showNotification === 'function') {
            showNotification('ًںژ‰ ط¬ظ…ظٹط¹ ط§ظ„طھط±ط¬ظ…ط§طھ ظƒط§ظ…ظ„ط© - ظ„ط§ طھظˆط¬ط¯ ط¨ظ„ظˆظƒط§طھ ظ…ظپظ‚ظˆط¯ط©!', 'success');
        }
    }
    
    return {
        total: Object.keys(translations || {}).length,
        withIssues: translationsWithIssues,
        totalMissing: totalMissing,
        report: report
    };
};

// ط¯ط§ظ„ط© طھط¬ط±ظٹط¨ظٹط© ظ„ط§ط®طھط¨ط§ط± طھط­ظˆظٹظ„ ط§ظ„ظ†طµ ظ„ظ„ط¨ظ„ظˆظƒط§طھ
window.testBlockConversion = function(text) {
    console.log('ًں§ھ ط§ط®طھط¨ط§ط± طھط­ظˆظٹظ„ ط§ظ„ظ†طµ:', text);
    window.debugBlocks = true; // طھظپط¹ظٹظ„ debug ظ…ط¤ظ‚طھط§ظ‹
    if (typeof convertTextToBlocks === 'function') {
        const result = convertTextToBlocks(text);
        console.log('ًں“‹ ط§ظ„ظ†طھظٹط¬ط©:', result);
        return result;
    }
    return 'convertTextToBlocks function not available';
};

// ط¯ط§ظ„ط© ظ„ظ„طھط­ظƒظ… ظپظٹ debug mode
window.enableBlocksDebug = function() {
    window.debugBlocks = true;
    console.log('ًں”چ طھظ… طھظپط¹ظٹظ„ debug mode ظ„ظ„ط¨ظ„ظˆظƒط§طھ');
};

window.disableBlocksDebug = function() {
    window.debugBlocks = false;
    console.log('ًں”‡ طھظ… ط¥ظٹظ‚ط§ظپ debug mode ظ„ظ„ط¨ظ„ظˆظƒط§طھ');
};

// ط¯ط§ظ„ط© ظ„ط¥ط²ط§ظ„ط© console logs
window.clearConsoleLogs = function() {
    console.clear();
    console.log('ًں§¹ طھظ… طھظ†ط¸ظٹظپ ط§ظ„ظƒظˆظ†ط³ظˆظ„');
};

// ط§ط®طھط¨ط§ط± ط³ط±ظٹط¹ ظ„ظ€ insertNewline
window.testInsertNewline = function() {
    console.log('ًں§ھ === ط§ط®طھط¨ط§ط± insertNewline ===');
    
    // ط§ط®طھط¨ط§ط± 1: ط¨ط¯ظˆظ† طھط±ظƒظٹط² ط¹ظ„ظ‰ ط§ظ„ظ…ط­ط±ط±
    console.log('\n1. ط§ط®طھط¨ط§ط± ط¨ط¯ظˆظ† طھط±ظƒظٹط²:');
    document.body.focus(); // ط¥ط²ط§ظ„ط© ط§ظ„طھط±ظƒظٹط²
    const textBefore = translationText ? translationText.value : '';
    
    if (typeof insertNewline === 'function') {
        insertNewline();
    }
    
    setTimeout(() => {
        const textAfter = translationText ? translationText.value : '';
        const newlineAdded = textAfter.includes('\\n') && textAfter !== textBefore;
        console.log(`   ${newlineAdded ? 'âœ…' : 'â‌Œ'} طھظ… ط¥ط¶ط§ظپط© \\n: ${newlineAdded}`);
        console.log(`   ًں“‌ ط§ظ„ظ†طµ ظ‚ط¨ظ„: "${textBefore.slice(-20)}"`);
        console.log(`   ًں“‌ ط§ظ„ظ†طµ ط¨ط¹ط¯: "${textAfter.slice(-20)}"`);
        
        // ط§ط®طھط¨ط§ط± 2: ظ…ط¹ ط§ظ„طھط±ظƒظٹط² ط¹ظ„ظ‰ ط§ظ„ظ…ط­ط±ط±
        console.log('\n2. ط§ط®طھط¨ط§ط± ظ…ط¹ ط§ظ„طھط±ظƒظٹط²:');
        if (translationText) {
            translationText.focus();
        }
        const textBefore2 = translationText ? translationText.value : '';
        
        if (typeof insertNewline === 'function') {
            insertNewline();
        }
        
        setTimeout(() => {
            const textAfter2 = translationText ? translationText.value : '';
            const newlineAdded2 = textAfter2.includes('\\n') && textAfter2 !== textBefore2;
            console.log(`   ${newlineAdded2 ? 'âœ…' : 'â‌Œ'} طھظ… ط¥ط¶ط§ظپط© \\n ظ…ط¹ ط§ظ„طھط±ظƒظٹط²: ${newlineAdded2}`);
        }, 150);
    }, 150);
    
    return 'ط§ط®طھط¨ط§ط± insertNewline ط¨ط¯ط£ - ط´ظˆظپ ط§ظ„ظ†طھط§ط¦ط¬ ظپظٹ ط§ظ„ظƒظˆظ†ط³ظˆظ„';
};

// ط§ط®طھط¨ط§ط± ط´ط§ظ…ظ„ ظ„ظ„ط¥طµظ„ط§ط­ط§طھ ط§ظ„ط¬ط¯ظٹط¯ط©
window.testAllLatestFixes = function() {
    console.log('ًںژ‰ === ط§ط®طھط¨ط§ط± ط´ط§ظ…ظ„ ظ„ظ„ط¥طµظ„ط§ط­ط§طھ ط§ظ„ط¬ط¯ظٹط¯ط© ===');
    
    const results = {
        notifications: 0,
        repeatedTranslation: 0,
        elementRebinding: 0,
        overallHealth: 0
    };
    
    // 1. ط§ط®طھط¨ط§ط± ظ†ط¸ط§ظ… ط§ظ„ط¥ط´ط¹ط§ط±ط§طھ
    console.log('\nًں”” 1. ط§ط®طھط¨ط§ط± ظ†ط¸ط§ظ… ط§ظ„ط¥ط´ط¹ط§ط±ط§طھ...');
    try {
        if (typeof showNotification === 'function') {
            showNotification('ط§ط®طھط¨ط§ط± ط§ظ„ط¥ط´ط¹ط§ط±ط§طھ', 'info');
            setTimeout(() => {
                if (typeof hideNotification === 'function') {
                    hideNotification();
                }
            }, 500);
            results.notifications = 100;
            console.log('   âœ… ظ†ط¸ط§ظ… ط§ظ„ط¥ط´ط¹ط§ط±ط§طھ ظٹط¹ظ…ظ„');
        }
    } catch (error) {
        results.notifications = 0;
        console.log('   â‌Œ ظ…ط´ظƒظ„ط© ظپظٹ ط§ظ„ط¥ط´ط¹ط§ط±ط§طھ:', error);
    }
    
    // 2. ط§ط®طھط¨ط§ط± ط¥ط¹ط§ط¯ط© ط±ط¨ط· ط§ظ„ط¹ظ†ط§طµط±
    console.log('\nًں”— 2. ط§ط®طھط¨ط§ط± ط¥ط¹ط§ط¯ط© ط±ط¨ط· ط§ظ„ط¹ظ†ط§طµط±...');
    try {
        const currentElement = document.getElementById('translationText');
        if (currentElement && translationText === currentElement) {
            results.elementRebinding = 100;
            console.log('   âœ… ط§ظ„ط¹ظ†ط§طµط± ظ…ط±ط¨ظˆط·ط© ط¨ط´ظƒظ„ طµط­ظٹط­');
        } else {
            results.elementRebinding = 50;
            console.log('   âڑ ï¸ڈ ظ‚ط¯ طھط­طھط§ط¬ ط¥ط¹ط§ط¯ط© ط±ط¨ط· ط§ظ„ط¹ظ†ط§طµط±');
        }
    } catch (error) {
        results.elementRebinding = 0;
        console.log('   â‌Œ ط®ط·ط£ ظپظٹ ظپط­طµ ط§ظ„ط¹ظ†ط§طµط±:', error);
    }
    
    // 3. ط§ط®طھط¨ط§ط± ط§ظ„طھط±ط¬ظ…ط© ط§ظ„ظ…طھظƒط±ط±ط© (ط³ط±ظٹط¹)
    console.log('\nًں”„ 3. ط§ط®طھط¨ط§ط± ط§ظ„طھط±ط¬ظ…ط© ط§ظ„ظ…طھظƒط±ط±ط©...');
    if (translationKeys && translationKeys.length >= 2) {
        try {
            // ظ…ط­ط§ظƒط§ط© ط³ط±ظٹط¹ط©
            const originalValue = translationText ? translationText.value : '';
            
            if (translationText) {
                translationText.value = 'ط§ط®طھط¨ط§ط± ط³ط±ظٹط¹';
                const event = new Event('input', { bubbles: true });
                translationText.dispatchEvent(event);
                
                if (translationText.value === 'ط§ط®طھط¨ط§ط± ط³ط±ظٹط¹') {
                    results.repeatedTranslation = 100;
                    console.log('   âœ… ط§ظ„طھط±ط¬ظ…ط© ط§ظ„ظ…طھظƒط±ط±ط© طھط¹ظ…ظ„');
                } else {
                    results.repeatedTranslation = 0;
                    console.log('   â‌Œ ظ…ط´ظƒظ„ط© ظپظٹ ط§ظ„طھط±ط¬ظ…ط© ط§ظ„ظ…طھظƒط±ط±ط©');
                }
                
                // ط¥ط¹ط§ط¯ط© ط§ظ„ظ‚ظٹظ…ط© ط§ظ„ط£طµظ„ظٹط©
                translationText.value = originalValue;
                translationText.dispatchEvent(new Event('input', { bubbles: true }));
            } else {
                results.repeatedTranslation = 0;
                console.log('   â‌Œ translationText ط؛ظٹط± ظ…ظˆط¬ظˆط¯');
            }
        } catch (error) {
            results.repeatedTranslation = 0;
            console.log('   â‌Œ ط®ط·ط£ ظپظٹ ط§ط®طھط¨ط§ط± ط§ظ„طھط±ط¬ظ…ط©:', error);
        }
    } else {
        results.repeatedTranslation = 50;
        console.log('   âڑ ï¸ڈ ظٹط­طھط§ط¬ ظ…ظ„ظپ ط¨ظ†طµظˆطµ ظ…طھط¹ط¯ط¯ط© ظ„ظ„ط§ط®طھط¨ط§ط± ط§ظ„ظƒط§ظ…ظ„');
    }
    
    // ط­ط³ط§ط¨ ط§ظ„طµط­ط© ط§ظ„ط¹ط§ظ…ط©
    const scores = [results.notifications, results.elementRebinding, results.repeatedTranslation];
    results.overallHealth = Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
    
    // ط§ظ„ظ†طھط§ط¦ط¬ ط§ظ„ظ†ظ‡ط§ط¦ظٹط©
    console.log('\nًں“ٹ === ط§ظ„ظ†طھط§ط¦ط¬ ط§ظ„ظ†ظ‡ط§ط¦ظٹط© ===');
    console.log(`ًں”” ط§ظ„ط¥ط´ط¹ط§ط±ط§طھ: ${results.notifications}%`);
    console.log(`ًں”— ط±ط¨ط· ط§ظ„ط¹ظ†ط§طµط±: ${results.elementRebinding}%`);
    console.log(`ًں”„ ط§ظ„طھط±ط¬ظ…ط© ط§ظ„ظ…طھظƒط±ط±ط©: ${results.repeatedTranslation}%`);
    console.log(`\nًںڈ† ط§ظ„طµط­ط© ط§ظ„ط¹ط§ظ…ط©: ${results.overallHealth}%`);
    
    const status = results.overallHealth >= 90 ? 'ًںژ‰ ظ…ظ…طھط§ط² - ظƒظ„ ط´ظٹط، ظٹط¹ظ…ظ„!' : 
                   results.overallHealth >= 75 ? 'âœ… ط¬ظٹط¯ ط¬ط¯ط§ظ‹ - ظ…ط¹ط¸ظ… ط§ظ„ظ…ظٹط²ط§طھ طھط¹ظ…ظ„' : 
                   results.overallHealth >= 60 ? 'âڑ ï¸ڈ ط¬ظٹط¯ - ط¨ط¹ط¶ ط§ظ„ظ…ط´ط§ظƒظ„ ط§ظ„ط¨ط³ظٹط·ط©' : 
                   'â‌Œ ظٹط­طھط§ط¬ ط¥طµظ„ط§ط­ - ظ…ط´ط§ظƒظ„ ظ…طھط¹ط¯ط¯ط©';
    
    console.log(`ًں“ˆ ط§ظ„طھظ‚ظٹظٹظ…: ${status}`);
    
    // ط¥ط´ط¹ط§ط± ط§ظ„ظ†طھظٹط¬ط©
    const notifType = results.overallHealth >= 90 ? 'success' : 
                      results.overallHealth >= 75 ? 'info' : 'warning';
    
    if (typeof showNotification === 'function') {
        showNotification(`ط§ط®طھط¨ط§ط± ط´ط§ظ…ظ„: ${results.overallHealth}% - ${status}`, notifType);
    }
    
    return results;
};

// ط§ط®طھط¨ط§ط± ط³ط±ظٹط¹ ظ„ظ€ MyMemory translation
window.testMyMemoryTranslation = function() {
    console.log('ًں§ھ === ط§ط®طھط¨ط§ط± MyMemory Translation ===');
    
    // ط§ظ„طھط­ظ‚ظ‚ ظ…ظ† ط§ظ„ط¹ظ†ط§طµط± ط§ظ„ظ…ط·ظ„ظˆط¨ط©
    console.log('\nًں“‹ ظپط­طµ ط§ظ„ط¹ظ†ط§طµط±:');
    console.log(`   originalText: ${originalText ? 'âœ… ظ…ظˆط¬ظˆط¯' : 'â‌Œ ظ…ظپظ‚ظˆط¯'}`);
    console.log(`   translationText: ${translationText ? 'âœ… ظ…ظˆط¬ظˆط¯' : 'â‌Œ ظ…ظپظ‚ظˆط¯'}`);
    
    if (!originalText || !translationText) {
        console.log('â‌Œ ط§ظ„ط¹ظ†ط§طµط± ط§ظ„ط£ط³ط§ط³ظٹط© ظ…ظپظ‚ظˆط¯ط© - ظ„ط§ ظٹظ…ظƒظ† ط§ظ„ط§ط®طھط¨ط§ط±');
        return;
    }
    
    // ط¥ط¶ط§ظپط© ظ†طµ طھط¬ط±ظٹط¨ظٹ
    const testText = 'Hello World';
    originalText.textContent = testText;
    console.log(`ًں“‌ طھظ… ظˆط¶ط¹ ظ†طµ طھط¬ط±ظٹط¨ظٹ: "${testText}"`);
    
    // ط§ط®طھط¨ط§ط± طھط±ط¬ظ…ط© MyMemory ظ…ط¨ط§ط´ط±ط©
    console.log('\nًںŒگ ط§ط®طھط¨ط§ط± MyMemory API ظ…ط¨ط§ط´ط±ط©:');
    
    if (typeof translateWithMyMemory === 'function') {
        translateWithMyMemory(testText)
            .then(result => {
                console.log('âœ… ظ†طھظٹط¬ط© MyMemory:', result);
                
                // ط§ط®طھط¨ط§ط± طھط­ط¯ظٹط« ط§ظ„ظ…ط­ط±ط±
                if (translationText) {
                    const oldValue = translationText.value;
                    translationText.value = result;
                    
                    // ط¥ط·ظ„ط§ظ‚ events ظ„طھط­ط¯ظٹط« ط§ظ„ظˆط§ط¬ظ‡ط©
                    const inputEvent = new Event('input', { bubbles: true });
                    translationText.dispatchEvent(inputEvent);
                    
                    const changeEvent = new Event('change', { bubbles: true });
                    translationText.dispatchEvent(changeEvent);
                    
                    console.log(`ًں“‌ طھظ… طھط­ط¯ظٹط« ط§ظ„ظ…ط­ط±ط± ظ…ظ† "${oldValue}" ط¥ظ„ظ‰ "${result}"`);
                    console.log('ًں”¥ طھظ… ط¥ط·ظ„ط§ظ‚ events ظ„طھط­ط¯ظٹط« ط§ظ„ظˆط§ط¬ظ‡ط©');
                    
                    if (translationText.value === result) {
                        console.log('âœ… طھط£ظƒظٹط¯: طھط­ط¯ظٹط« ط§ظ„ظ…ط­ط±ط± ظˆط§ظ„ظˆط§ط¬ظ‡ط© ظ†ط¬ط­');
                        if (typeof showNotification === 'function') {
                            showNotification('âœ… ط§ط®طھط¨ط§ط± MyMemory ظ†ط¬ط­!', 'success');
                        }
                    } else {
                        console.log('â‌Œ ظپط´ظ„ طھط­ط¯ظٹط« ط§ظ„ظ…ط­ط±ط±');
                        if (typeof showNotification === 'function') {
                            showNotification('â‌Œ ظپط´ظ„ طھط­ط¯ظٹط« ط§ظ„ظ…ط­ط±ط±', 'error');
                        }
                    }
                }
            })
            .catch(error => {
                console.error('â‌Œ ظپط´ظ„ ط§ط®طھط¨ط§ط± MyMemory:', error);
                if (typeof showNotification === 'function') {
                    showNotification(`â‌Œ ظپط´ظ„ MyMemory: ${error.message}`, 'error');
                }
            });
    } else {
        console.log('â‌Œ translateWithMyMemory function ط؛ظٹط± ظ…طھط§ط­');
    }
    
    // ط§ط®طھط¨ط§ط± translateCurrentText ظƒط§ظ…ظ„ط©
    console.log('\nًں”„ ط§ط®طھط¨ط§ط± translateCurrentText ظƒط§ظ…ظ„ط©:');
    setTimeout(() => {
        const serviceSelect = document.getElementById('translationService');
        if (serviceSelect) {
            serviceSelect.value = 'mymemory';
            console.log('ًںژ¯ طھظ… طھط¹ظٹظٹظ† ط§ظ„ط®ط¯ظ…ط© ط¥ظ„ظ‰ MyMemory');
            
            if (typeof translateCurrentText === 'function') {
                translateCurrentText()
                    .then(() => {
                        console.log('âœ… translateCurrentText ط§ظƒطھظ…ظ„');
                    })
                    .catch(error => {
                        console.error('â‌Œ ط®ط·ط£ ظپظٹ translateCurrentText:', error);
                    });
            }
        }
    }, 1000);
    
    return 'ط§ط®طھط¨ط§ط± MyMemory ط¨ط¯ط£ - ط´ظˆظپ ط§ظ„ظ†طھط§ط¦ط¬ ظپظٹ ط§ظ„ظƒظˆظ†ط³ظˆظ„';
};

// ط§ط®طھط¨ط§ط± ط³ط±ظٹط¹ ظ„طھط­ط¯ظٹط« ط§ظ„ظˆط§ط¬ظ‡ط©
window.testUIUpdate = function() {
    console.log('ًں§ھ === ط§ط®طھط¨ط§ط± طھط­ط¯ظٹط« ط§ظ„ظˆط§ط¬ظ‡ط© ===');
    
    if (!translationText) {
        console.log('â‌Œ translationText ط؛ظٹط± ظ…ظˆط¬ظˆط¯');
        return;
    }
    
    const testText = 'ظ†طµ طھط¬ط±ظٹط¨ظٹ ظ„ظ„ط§ط®طھط¨ط§ط± ' + Date.now();
    const oldValue = translationText.value;
    
    console.log(`ًں“‌ ط§ظ„ظ‚ظٹظ…ط© ط§ظ„ط­ط§ظ„ظٹط©: "${oldValue}"`);
    console.log(`ًں“‌ ط§ظ„ظ‚ظٹظ…ط© ط§ظ„ط¬ط¯ظٹط¯ط©: "${testText}"`);
    
    // طھط­ط¯ظٹط« ط§ظ„ظ†طµ
    translationText.value = testText;
    
    // ط¥ط·ظ„ط§ظ‚ events
    console.log('ًں”¥ ط¥ط·ظ„ط§ظ‚ input event...');
    const inputEvent = new Event('input', { bubbles: true });
    translationText.dispatchEvent(inputEvent);
    
    console.log('ًں”¥ ط¥ط·ظ„ط§ظ‚ change event...');
    const changeEvent = new Event('change', { bubbles: true });
    translationText.dispatchEvent(changeEvent);
    
    // ط§ظ„طھط­ظ‚ظ‚
    setTimeout(() => {
        if (translationText.value === testText) {
            console.log('âœ… طھط­ط¯ظٹط« ط§ظ„ظ‚ظٹظ…ط© ظ†ط¬ط­');
            if (typeof showNotification === 'function') {
                showNotification('âœ… طھط­ط¯ظٹط« ط§ظ„ظˆط§ط¬ظ‡ط© ظٹط¹ظ…ظ„!', 'success');
            }
        } else {
            console.log('â‌Œ ظپط´ظ„ طھط­ط¯ظٹط« ط§ظ„ظ‚ظٹظ…ط©');
            if (typeof showNotification === 'function') {
                showNotification('â‌Œ ظ…ط´ظƒظ„ط© ظپظٹ طھط­ط¯ظٹط« ط§ظ„ظˆط§ط¬ظ‡ط©', 'error');
            }
        }
    }, 100);
    
    return 'ط¬ط§ط±ظٹ ط§ط®طھط¨ط§ط± طھط­ط¯ظٹط« ط§ظ„ظˆط§ط¬ظ‡ط©...';
};

// ط§ط®طھط¨ط§ط± ط³ط±ظٹط¹ ظ„ظ„ط¥ط´ط¹ط§ط±ط§طھ
window.testNotifications = function() {
    console.log('ًں§ھ ط§ط®طھط¨ط§ط± ظ†ط¸ط§ظ… ط§ظ„ط¥ط´ط¹ط§ط±ط§طھ...');
    
    if (typeof showNotification === 'function') {
        setTimeout(() => showNotification('ط¥ط´ط¹ط§ط± ط¹ط§ط¯ظٹ - ط§ط®طھط¨ط§ط±', 'info'), 100);
        setTimeout(() => showNotification('ط¥ط´ط¹ط§ط± ظ†ط¬ط§ط­ - ط§ط®طھط¨ط§ط±', 'success'), 2000);
        setTimeout(() => showNotification('ط¥ط´ط¹ط§ط± طھط­ط°ظٹط± - ط§ط®طھط¨ط§ط±', 'warning'), 4000);
        setTimeout(() => showNotification('ط¥ط´ط¹ط§ط± ط®ط·ط£ - ط§ط®طھط¨ط§ط±', 'error'), 6000);
        setTimeout(() => showNotification(
            'ًں§ھ ط§ط®طھط¨ط§ط± ط§ظ„ط¥ط´ط¹ط§ط±ط§طھ ط§ظ„ط·ظˆظٹظ„ط©:\n\n' +
            'â€¢ ظ‡ط°ط§ ط¥ط´ط¹ط§ط± ط·ظˆظٹظ„ ظ„ظ„ط§ط®طھط¨ط§ط±\n' +
            'â€¢ ظٹط­طھظˆظٹ ط¹ظ„ظ‰ ط¹ط¯ط© ط£ط³ط·ط±\n' +
            'â€¢ ظˆظٹط¬ط¨ ط£ظ† ظٹط¸ظ‡ط± ط²ط± ط§ظ„ط¥ط؛ظ„ط§ظ‚\n' +
            'â€¢ ظ…ط¹ ط¥ظ…ظƒط§ظ†ظٹط© ط§ظ„ظ†ظ‚ط± ظ„ظ„ط¥ط؛ظ„ط§ظ‚\n\n' +
            'ط§ظ†ظ‚ط± ظپظٹ ط£ظٹ ظ…ظƒط§ظ† ظ„ط¥ط؛ظ„ط§ظ‚ظ‡!', 
            'info'
        ), 8000);
        
        console.log('âœ… طھظ… ط¥ط·ظ„ط§ظ‚ ط§ط®طھط¨ط§ط± ط§ظ„ط¥ط´ط¹ط§ط±ط§طھ');
    } else {
        console.error('â‌Œ ط¯ط§ظ„ط© showNotification ط؛ظٹط± ظ…طھظˆظپط±ط©');
    }
};

// ط¯ط§ظ„ط© ظ„ط¥ط¹ط§ط¯ط© طھط¹ظٹظٹظ† ط±ط³ط§ط¦ظ„ ط§ظ„ظ…ط³ط§ط¹ط¯ط© (ظ„ظ„ظ…ط·ظˆط±ظٹظ†)
window.resetHelpMessages = function() {
    console.log('ًں”„ ط¥ط¹ط§ط¯ط© طھط¹ظٹظٹظ† ط±ط³ط§ط¦ظ„ ط§ظ„ظ…ط³ط§ط¹ط¯ط©...');
    
    // ط¥ط²ط§ظ„ط© ط§ظ„ط¹ظ„ط§ظ…ط§طھ ظ…ظ† localStorage
    localStorage.removeItem('paradox_editor_welcome_seen');
    localStorage.removeItem('paradox_editor_save_explained');
    
    console.log('âœ… طھظ… ط¥ط¹ط§ط¯ط© طھط¹ظٹظٹظ† ط±ط³ط§ط¦ظ„ ط§ظ„ظ…ط³ط§ط¹ط¯ط©');
    console.log('ًں’، ط£ط¹ط¯ طھط­ظ…ظٹظ„ ط§ظ„طµظپط­ط© ظ„ط±ط¤ظٹط© ط§ظ„ط±ط³ط§ط¦ظ„ ظ…ط±ط© ط£ط®ط±ظ‰');
    
    if (typeof showNotification === 'function') {
        showNotification(
            'طھظ… ط¥ط¹ط§ط¯ط© طھط¹ظٹظٹظ† ط±ط³ط§ط¦ظ„ ط§ظ„ظ…ط³ط§ط¹ط¯ط©!\n\n' +
            'ط£ط¹ط¯ طھط­ظ…ظٹظ„ ط§ظ„طµظپط­ط© ظ„ط±ط¤ظٹط©:\n' +
            'â€¢ ط±ط³ط§ظ„ط© ط§ظ„طھط±ط­ظٹط¨\n' +
            'â€¢ طھظˆط¶ظٹط­ط§طھ ط§ظ„ط­ظپط¸\n' +
            'â€¢ ط¬ظ…ظٹط¹ ط§ظ„ظ†طµط§ط¦ط­ ط§ظ„ط£ظˆظ„ظ‰',
            'success'
        );
    }
};

// ط¯ط§ظ„ط© ظ„ط¥ط¸ظ‡ط§ط± ط­ط§ظ„ط© ط§ظ„ظ†ط¸ط§ظ… ط§ظ„ظ…ط­ط³ظ†ط©  
window.showSystemStatus = function() {
    console.log('ًں“ٹ ط­ط§ظ„ط© ط§ظ„ظ†ط¸ط§ظ… ط§ظ„ظ…ط­ط³ظ†ط©...');
    
    // ظ…ط¹ظ„ظˆظ…ط§طھ ط§ظ„طھط±ط¬ظ…ط§طھ
    const translationsInfo = {
        total: Object.keys(translations || {}).length,
        original: Object.keys(originalTranslations || {}).length,
        english: Object.keys(englishTranslations || {}).length,
        modified: (modifiedKeys && modifiedKeys.size) || 0,
        filtered: Object.keys(filteredTranslations || {}).length
    };
    
    // ظ…ط¹ظ„ظˆظ…ط§طھ ط§ظ„ط­ط§ظ„ط© ط§ظ„ط­ط§ظ„ظٹط©
    const currentState = {
        currentIndex: currentIndex || 0,
        currentKey: translationKeys && translationKeys[currentIndex] ? translationKeys[currentIndex] : 'N/A',
        currentEditingKey: currentEditingKey || 'N/A',
        hasCurrentEdit: !!(currentEditedValue && currentEditingKey),
        hasUnsavedChanges: hasUnsavedChanges || false
    };
    
    // ظپط­طµ طھط·ط§ط¨ظ‚ originalTranslations
    const originalIntegrityCheck = {
        exists: !!(originalTranslations && Object.keys(originalTranslations).length > 0),
        matchesTotal: (Object.keys(originalTranslations || {}).length === Object.keys(translations || {}).length),
        sampleKey: currentState.currentKey,
        sampleOriginal: originalTranslations && currentState.currentKey ? originalTranslations[currentState.currentKey] : 'N/A',
        sampleCurrent: translations && currentState.currentKey ? translations[currentState.currentKey] : 'N/A',
        isModified: modifiedKeys && currentState.currentKey ? modifiedKeys.has(currentState.currentKey) : false
    };
    
    console.log('ًں“ٹ ظ…ط¹ظ„ظˆظ…ط§طھ ط§ظ„طھط±ط¬ظ…ط§طھ:', translationsInfo);
    console.log('ًں“ٹ ط§ظ„ط­ط§ظ„ط© ط§ظ„ط­ط§ظ„ظٹط©:', currentState);
    console.log('ًں”چ ظپط­طµ ط³ظ„ط§ظ…ط© ط§ظ„ظ†طµظˆطµ ط§ظ„ط£طµظ„ظٹط©:', originalIntegrityCheck);
    
    // ط§ظ„طھط­ظ‚ظ‚ ظ…ظ† ظ…ط´ط§ظƒظ„ ظ…ط­طھظ…ظ„ط©
    const potentialIssues = [];
    
    if (!originalIntegrityCheck.exists) {
        potentialIssues.push('â‌Œ originalTranslations ط؛ظٹط± ظ…ظˆط¬ظˆط¯');
    }
    
    if (!originalIntegrityCheck.matchesTotal) {
        potentialIssues.push('âڑ ï¸ڈ ط¹ط¯ط¯ ط§ظ„ظ†طµظˆطµ ط§ظ„ط£طµظ„ظٹط© ظ„ط§ ظٹط·ط§ط¨ظ‚ ط§ظ„ط­ط§ظ„ظٹط©');
    }
    
    if (originalIntegrityCheck.sampleOriginal === originalIntegrityCheck.sampleCurrent && originalIntegrityCheck.isModified) {
        potentialIssues.push('ًںگ› ط§ظ„ظ†طµ ط§ظ„ط£طµظ„ظٹ ظ…ط·ط§ط¨ظ‚ ظ„ظ„ط­ط§ظ„ظٹ ط±ط؛ظ… ظˆط¬ظˆط¯ طھط¹ط¯ظٹظ„');
    }
    
    if (potentialIssues.length > 0) {
        console.warn('ًںڑ¨ ظ…ط´ط§ظƒظ„ ظ…ط­طھظ…ظ„ط©:', potentialIssues);
    } else {
        console.log('âœ… ظ„ط§ طھظˆط¬ط¯ ظ…ط´ط§ظƒظ„ ظˆط§ط¶ط­ط©');
    }
    
    // ظ…ط¹ظ„ظˆظ…ط§طھ LocalStorage
    const localStorageInfo = {
        hasData: !!(localStorage.getItem('paradox_translations')),
        size: localStorage.getItem('paradox_translations') ? localStorage.getItem('paradox_translations').length : 0
    };
    
    console.log('ًں’¾ ظ…ط¹ظ„ظˆظ…ط§طھ LocalStorage:', localStorageInfo);
    
    // ط¹ط±ط¶ ظ…ظ„ط®طµ ظپظٹ ط§ظ„ط¥ط´ط¹ط§ط±
    if (typeof showNotification === 'function') {
        const summary = 
            `ًں“ٹ ط­ط§ظ„ط© ط§ظ„ظ†ط¸ط§ظ…:\n\n` +
            `ًں“‌ ط§ظ„طھط±ط¬ظ…ط§طھ: ${translationsInfo.total}\n` +
            `ًں—‚ï¸ڈ ط§ظ„ط£طµظ„ظٹط©: ${translationsInfo.original}\n` +
            `ًںŒچ ط§ظ„ط¥ظ†ط¬ظ„ظٹط²ظٹط©: ${translationsInfo.english}\n` +
            `âœڈï¸ڈ ط§ظ„ظ…ظڈط¹ط¯ظ„ط©: ${translationsInfo.modified}\n\n` +
            `ًں”‘ ط§ظ„ظ…ظپطھط§ط­ ط§ظ„ط­ط§ظ„ظٹ: ${currentState.currentKey}\n` +
            `ًں’¾ طھط¹ط¯ظٹظ„ط§طھ ط؛ظٹط± ظ…ط­ظپظˆط¸ط©: ${currentState.hasUnsavedChanges ? 'ظ†ط¹ظ…' : 'ظ„ط§'}\n\n` +
            (potentialIssues.length > 0 ? 
                `âڑ ï¸ڈ ظ…ط´ط§ظƒظ„: ${potentialIssues.length}\n${potentialIssues.join('\n')}` : 
                `âœ… ط§ظ„ظ†ط¸ط§ظ… ظٹط¹ظ…ظ„ ط¨ط´ظƒظ„ ط·ط¨ظٹط¹ظٹ`);
                
        showNotification(summary, potentialIssues.length > 0 ? 'warning' : 'info');
    }
    
    console.log('âœ… طھظ… ط¹ط±ط¶ ط­ط§ظ„ط© ط§ظ„ظ†ط¸ط§ظ… ظ…ط­ط³ظ†ط©');
};

// ط¯ط§ظ„ط© ط§ط®طھط¨ط§ط± ط­ظپط¸ ظˆط§ط³طھط±ط¬ط§ط¹ ط§ظ„ظ…ظ„ظپط§طھ (ظ„ط­ظ„ ظ…ط´ظƒظ„ط© ط§ط®طھظپط§ط، ط§ظ„ظ…ظ„ظپ)
window.testFilePersistence = function() {
    console.log('ًں§ھ ط§ط®طھط¨ط§ط± ط­ظپط¸ ظˆط§ط³طھط±ط¬ط§ط¹ ظ…ط¹ظ„ظˆظ…ط§طھ ط§ظ„ظ…ظ„ظپط§طھ...');
    
    const beforeSave = {
        currentFile: currentFile ? JSON.stringify(currentFile) : 'null',
        translations: Object.keys(translations || {}).length,
        modifiedKeys: (modifiedKeys && modifiedKeys.size) || 0
    };
    
    console.log('ًں“ٹ ظ‚ط¨ظ„ ط§ظ„ط­ظپط¸:', beforeSave);
    
    // ط­ظپط¸ ط§ظ„ط¨ظٹط§ظ†ط§طھ
    if (typeof saveToLocalStorage === 'function') {
        saveToLocalStorage();
        console.log('ًں’¾ طھظ… ط­ظپط¸ ط§ظ„ط¨ظٹط§ظ†ط§طھ');
    }
    
    // ظ…ط­ط§ظƒط§ط© ط¥ط¹ط§ط¯ط© طھط­ظ…ظٹظ„ ط¨ط³ظٹط·ط©
    setTimeout(() => {
        if (typeof loadFromLocalStorage === 'function') {
            const loadResult = loadFromLocalStorage();
            
            const afterLoad = {
                currentFile: currentFile ? JSON.stringify(currentFile) : 'null',
                translations: Object.keys(translations || {}).length,
                modifiedKeys: (modifiedKeys && modifiedKeys.size) || 0,
                loadSuccess: loadResult
            };
            
            console.log('ًں“ٹ ط¨ط¹ط¯ ط§ظ„ط§ط³طھط±ط¬ط§ط¹:', afterLoad);
            
            // ظ…ظ‚ط§ط±ظ†ط© ط§ظ„ظ†طھط§ط¦ط¬
            const fileMatch = beforeSave.currentFile === afterLoad.currentFile;
            const translationsMatch = beforeSave.translations === afterLoad.translations;
            const modifiedMatch = beforeSave.modifiedKeys === afterLoad.modifiedKeys;
            
            console.log('ًں”چ ظ†طھط§ط¦ط¬ ط§ظ„ظ…ظ‚ط§ط±ظ†ط©:', {
                fileMatch,
                translationsMatch,
                modifiedMatch,
                overallSuccess: fileMatch && translationsMatch && modifiedMatch
            });
            
            if (typeof showNotification === 'function') {
                const message = fileMatch && translationsMatch && modifiedMatch ?
                    'âœ… ط§ط®طھط¨ط§ط± ط­ظپط¸ ط§ظ„ظ…ظ„ظپط§طھ ظ†ط¬ط­!\n\nط¬ظ…ظٹط¹ ط§ظ„ظ…ط¹ظ„ظˆظ…ط§طھ طھظ… ط­ظپط¸ظ‡ط§ ظˆط§ط³طھط±ط¬ط§ط¹ظ‡ط§ ط¨ظ†ط¬ط§ط­.' :
                    'âڑ ï¸ڈ ظ…ط´ظƒظ„ط© ظپظٹ ط­ظپط¸ ط§ظ„ظ…ظ„ظپط§طھ!\n\nطھط­ظ‚ظ‚ ظ…ظ† ط§ظ„ظƒظˆظ†ط³ظˆظ„ ظ„ظ„طھظپط§طµظٹظ„.';
                
                showNotification(message, fileMatch && translationsMatch && modifiedMatch ? 'success' : 'warning');
            }
        }
    }, 1000);
    
    console.log('ًںڈپ ط§ط®طھط¨ط§ط± ط­ظپط¸ ط§ظ„ظ…ظ„ظپط§طھ ط¨ط¯ط£...');
};

// ط¯ط§ظ„ط© طھط´ط®ظٹطµ ظ…ط´ظƒظ„ط© ط§ظ„ظ†طµظˆطµ ط§ظ„ط¥ظ†ط¬ظ„ظٹط²ظٹط© ط§ظ„ظ…ط±ط¬ط¹ظٹط©
window.diagnoseEnglishTexts = function() {
    console.log('ًں”چ طھط´ط®ظٹطµ ط§ظ„ظ†طµظˆطµ ط§ظ„ط¥ظ†ط¬ظ„ظٹط²ظٹط© ط§ظ„ظ…ط±ط¬ط¹ظٹط©...');
    
    const currentKey = translationKeys[currentIndex];
    
    const diagnostics = {
        'englishTranslations_exists': !!englishTranslations,
        'englishTranslations_length': Object.keys(englishTranslations || {}).length,
        'currentFile_exists': !!currentFile,
        'currentFile_name': currentFile ? (currentFile.name || 'ط؛ظٹط± ظ…ط­ط¯ط¯') : 'ظ„ط§ ظٹظˆط¬ط¯',
        'currentKey': currentKey || 'ط؛ظٹط± ظ…ط­ط¯ط¯',
        'englishText_for_currentKey': englishTranslations && currentKey ? englishTranslations[currentKey] : 'ط؛ظٹط± ظ…ظˆط¬ظˆط¯',
        'originalText_element': !!originalText,
        'originalText_content': originalText ? originalText.textContent : 'element ط؛ظٹط± ظ…ظˆط¬ظˆط¯'
    };
    
    console.log('ًں“ٹ ظ†طھط§ط¦ط¬ ط§ظ„طھط´ط®ظٹطµ:', diagnostics);
    
    // ط§ط®طھط¨ط§ط± طھط­ط¯ظٹط¯ ط§ظ„ظ…ظ„ظپ ط§ظ„ظ…ط±ط¬ط¹ظٹ ط§ظ„ط§ظپطھط±ط§ط¶ظٹ
    if (currentFile) {
        const englishFileName = currentFile.name ? currentFile.name.replace(/^.*[\\\/]/, '') : 'ط؛ظٹط± ظ…ط­ط¯ط¯';
        const englishFilePath = `english/${englishFileName}`;
        
        console.log(`ًں”چ ظ…ط­ط§ظˆظ„ط© طھط­ظ…ظٹظ„: ${englishFilePath}`);
        
        fetch(englishFilePath)
            .then(response => {
                if (response.ok) {
                    console.log(`âœ… ط§ظ„ظ…ظ„ظپ ط§ظ„ط¥ظ†ط¬ظ„ظٹط²ظٹ ظ…ظˆط¬ظˆط¯: ${englishFilePath}`);
                    return response.text();
                } else {
                    console.log(`â‌Œ ط§ظ„ظ…ظ„ظپ ط§ظ„ط¥ظ†ط¬ظ„ظٹط²ظٹ ط؛ظٹط± ظ…ظˆط¬ظˆط¯: ${englishFilePath} (Status: ${response.status})`);
                    throw new Error(`HTTP ${response.status}`);
                }
            })
            .then(content => {
                console.log(`ًں“– ظ…ط­طھظˆظ‰ ط§ظ„ظ…ظ„ظپ ط§ظ„ط¥ظ†ط¬ظ„ظٹط²ظٹ (ط£ظˆظ„ 200 ط­ط±ظپ): ${content.substring(0, 200)}...`);
            })
            .catch(error => {
                console.log(`â‌Œ ط®ط·ط£ ظپظٹ طھط­ظ…ظٹظ„ ط§ظ„ظ…ظ„ظپ ط§ظ„ط¥ظ†ط¬ظ„ظٹط²ظٹ: ${error.message}`);
            });
    }
    
    // ط¹ط±ط¶ ط§ظ„ظ†طھط§ط¦ط¬ ظ„ظ„ظ…ط³طھط®ط¯ظ…
    if (typeof showNotification === 'function') {
        const message = 
            `ًں”چ طھط´ط®ظٹطµ ط§ظ„ظ†طµظˆطµ ط§ظ„ط¥ظ†ط¬ظ„ظٹط²ظٹط©:\n\n` +
            `ًں“پ ط§ظ„ظ…ظ„ظپ ط§ظ„ط­ط§ظ„ظٹ: ${diagnostics.currentFile_name}\n` +
            `ًں“‌ ط§ظ„ظ†طµظˆطµ ط§ظ„ط¥ظ†ط¬ظ„ظٹط²ظٹط©: ${diagnostics.englishTranslations_length}\n` +
            `ًں”‘ ط§ظ„ظ…ظپطھط§ط­ ط§ظ„ط­ط§ظ„ظٹ: ${diagnostics.currentKey}\n` +
            `ًں“– ط§ظ„ظ†طµ ط§ظ„ظ…ط±ط¬ط¹ظٹ: ${diagnostics.englishText_for_currentKey ? 'ظ…ظˆط¬ظˆط¯' : 'ط؛ظٹط± ظ…ظˆط¬ظˆط¯'}\n` +
            `ًں–¼ï¸ڈ ط¹ظ†طµط± ط§ظ„ط¹ط±ط¶: ${diagnostics.originalText_element ? 'ظ…ظˆط¬ظˆط¯' : 'ط؛ظٹط± ظ…ظˆط¬ظˆط¯'}\n\n` +
            `طھط­ظ‚ظ‚ ظ…ظ† ط§ظ„ظƒظˆظ†ط³ظˆظ„ ظ„ظ„طھظپط§طµظٹظ„ ط§ظ„ظƒط§ظ…ظ„ط©.`;
            
        showNotification(message, 'info');
    }
    
    return diagnostics;
};

// ط¯ط§ظ„ط© ظ„ط¥ط¹ط§ط¯ط© طھط­ظ…ظٹظ„ ط§ظ„ظ†طµظˆطµ ط§ظ„ط¥ظ†ط¬ظ„ظٹط²ظٹط© ظٹط¯ظˆظٹط§ظ‹
window.reloadEnglishTexts = function() {
    console.log('ًں”„ ط¥ط¹ط§ط¯ط© طھط­ظ…ظٹظ„ ط§ظ„ظ†طµظˆطµ ط§ظ„ط¥ظ†ط¬ظ„ظٹط²ظٹط©...');
    
    if (!currentFile || !currentFile.name) {
        console.log('â‌Œ ظ„ط§ ظٹظˆط¬ط¯ ظ…ظ„ظپ ط­ط§ظ„ظٹ ظ„طھط­ظ…ظٹظ„ ط§ظ„ظ†طµظˆطµ ط§ظ„ط¥ظ†ط¬ظ„ظٹط²ظٹط© ظ„ظ‡');
        if (typeof showNotification === 'function') {
            showNotification('â‌Œ ظ„ط§ ظٹظˆط¬ط¯ ظ…ظ„ظپ ط­ط§ظ„ظٹ!', 'error');
        }
        return;
    }
    
    const filename = currentFile.name;
    if (typeof loadEnglishReferenceFile === 'function') {
        loadEnglishReferenceFile(filename)
            .then(() => {
                console.log('âœ… طھظ…طھ ظ…ط­ط§ظˆظ„ط© ط¥ط¹ط§ط¯ط© طھط­ظ…ظٹظ„ ط§ظ„ظ†طµظˆطµ ط§ظ„ط¥ظ†ط¬ظ„ظٹط²ظٹط©');
                
                // طھط­ط¯ظٹط« ط§ظ„ط¹ط±ط¶
                if (typeof selectTranslationByIndex === 'function') {
                    setTimeout(() => selectTranslationByIndex(currentIndex), 200);
                }
            })
            .catch(error => {
                console.log('â‌Œ ط®ط·ط£ ظپظٹ ط¥ط¹ط§ط¯ط© طھط­ظ…ظٹظ„ ط§ظ„ظ†طµظˆطµ ط§ظ„ط¥ظ†ط¬ظ„ظٹط²ظٹط©:', error);
            });
    } else {
        console.log('â‌Œ ط¯ط§ظ„ط© loadEnglishReferenceFile ط؛ظٹط± ظ…ظˆط¬ظˆط¯ط©');
    }
};

// ط¯ط§ظ„ط© ط§ط®طھط¨ط§ط± ط­ظپط¸ ظˆط§ط³طھط±ط¬ط§ط¹ ط§ظ„ظ†طµ ط§ظ„ظ…ظڈط¹ط¯ظ„
window.testCurrentlyEditedText = function() {
    console.log('ًں§ھ ط§ط®طھط¨ط§ط± ط­ظپط¸ ظˆط§ط³طھط±ط¬ط§ط¹ ط§ظ„ظ†طµ ط§ظ„ظ…ظڈط¹ط¯ظ„...');
    
    if (!translationText) {
        console.log('â‌Œ translationText ط؛ظٹط± ظ…ظˆط¬ظˆط¯');
        return;
    }
    
    const originalValue = translationText.value;
    const testValue = "ظ†طµ طھط¬ط±ظٹط¨ظٹ ظ„ظ„ط§ط®طھط¨ط§ط± - " + Date.now();
    
    console.log('ًں“ٹ ظ‚ط¨ظ„ ط§ظ„ط§ط®طھط¨ط§ط±:', {
        originalValue,
        currentEditedValue: window.currentEditedValue,
        currentEditingKey: window.currentEditingKey
    });
    
    // طھط؛ظٹظٹط± ط§ظ„ظ†طµ
    translationText.value = testValue;
    translationText.dispatchEvent(new Event('input'));
    
    setTimeout(() => {
        console.log('ًں“ٹ ط¨ط¹ط¯ ط§ظ„طھط؛ظٹظٹط±:', {
            newValue: translationText.value,
            currentEditedValue: window.currentEditedValue,
            currentEditingKey: window.currentEditingKey
        });
        
        // ط­ظپط¸ ط§ظ„ط¨ظٹط§ظ†ط§طھ
        if (typeof saveToLocalStorage === 'function') {
            saveToLocalStorage();
        }
        
        setTimeout(() => {
            // ظ…ط­ط§ظƒط§ط© طھط­ظ…ظٹظ„ ط§ظ„ط¨ظٹط§ظ†ط§طھ
            if (typeof loadFromLocalStorage === 'function') {
                loadFromLocalStorage();
            }
            
            setTimeout(() => {
                console.log('ًں“ٹ ط¨ط¹ط¯ ط¥ط¹ط§ط¯ط© ط§ظ„طھط­ظ…ظٹظ„:', {
                    restoredValue: translationText ? translationText.value : 'N/A',
                    currentEditedValue: window.currentEditedValue,
                    currentEditingKey: window.currentEditingKey
                });
                
                // ط¥ط¹ط§ط¯ط© ط§ظ„ظ†طµ ط§ظ„ط£طµظ„ظٹ
                if (translationText) {
                    translationText.value = originalValue;
                    translationText.dispatchEvent(new Event('input'));
                }
                
                if (typeof showNotification === 'function') {
                    const success = (window.currentEditedValue === testValue);
                    showNotification(
                        success ? 
                        'âœ… ط§ط®طھط¨ط§ط± ط§ظ„ظ†طµ ط§ظ„ظ…ظڈط¹ط¯ظ„ ظ†ط¬ط­!\n\nط§ظ„ظ†طµ ط§ظ„ظ…ظڈط¹ط¯ظ„ ظٹظڈط­ظپط¸ ظˆظٹظڈط³طھط±ط¬ط¹ ط¨ط´ظƒظ„ طµط­ظٹط­.' :
                        'âڑ ï¸ڈ ظ…ط´ظƒظ„ط© ظپظٹ ط­ظپط¸ ط§ظ„ظ†طµ ط§ظ„ظ…ظڈط¹ط¯ظ„!\n\nطھط­ظ‚ظ‚ ظ…ظ† ط§ظ„ظƒظˆظ†ط³ظˆظ„ ظ„ظ„طھظپط§طµظٹظ„.',
                        success ? 'success' : 'warning'
                    );
                }
                
                console.log('âœ… ط§ظ†طھظ‡ظ‰ ط§ط®طھط¨ط§ط± ط§ظ„ظ†طµ ط§ظ„ظ…ظڈط¹ط¯ظ„');
            }, 500);
        }, 500);
    }, 1000);
    
    console.log('ًںڈپ ط¨ط¯ط£ ط§ط®طھط¨ط§ط± ط§ظ„ظ†طµ ط§ظ„ظ…ظڈط¹ط¯ظ„...');
};

// ط¯ط§ظ„ط© ط§ط®طھط¨ط§ط± ط³ط±ظٹط¹ط© ظ„ظ…ط´ظƒظ„ط© ط§ظ„طھط¹ط¯ظٹظ„ط§طھ ط§ظ„ظ…ط­ظپظˆط¸ط©
window.testModificationSaving = function() {
    console.log('ًں§ھ ط§ط®طھط¨ط§ط± ط­ظپط¸ ط§ظ„طھط¹ط¯ظٹظ„ط§طھ...');
    
    if (!translationText || !translationKeys || translationKeys.length === 0) {
        console.log('â‌Œ ظ„ط§ طھظˆط¬ط¯ طھط±ط¬ظ…ط§طھ ظ„ظ„ط§ط®طھط¨ط§ط±');
        if (typeof showNotification === 'function') {
            showNotification('â‌Œ ظ„ط§ طھظˆط¬ط¯ طھط±ط¬ظ…ط§طھ ظ„ظ„ط§ط®طھط¨ط§ط±!', 'error');
        }
        return;
    }
    
    const currentKey = translationKeys[currentIndex];
    const originalValue = originalTranslations && originalTranslations[currentKey] ? originalTranslations[currentKey] : '';
    const testText = originalValue + " - [طھظ… ط§ظ„طھط¹ط¯ظٹظ„ ظ„ظ„ط§ط®طھط¨ط§ط±]";
    
    console.log('ًں“ٹ ط¨ط¯ط، ط§ظ„ط§ط®طھط¨ط§ط±:', {
        currentKey,
        originalValue,
        testText,
        modifiedCount_before: (modifiedKeys && modifiedKeys.size) || 0
    });
    
    // طھط؛ظٹظٹط± ط§ظ„ظ†طµ
    translationText.value = testText;
    translationText.dispatchEvent(new Event('input'));
    
    setTimeout(() => {
        const afterModification = {
            currentValue: translationText.value,
            modifiedCount_after: (modifiedKeys && modifiedKeys.size) || 0,
            isInModifiedKeys: modifiedKeys && modifiedKeys.has(currentKey),
            hasUnsavedChanges: window.hasUnsavedChanges || hasUnsavedChanges
        };
        
        console.log('ًں“ٹ ط¨ط¹ط¯ ط§ظ„طھط¹ط¯ظٹظ„:', afterModification);
        
        // ط­ظپط¸ ط§ظ„ط¨ظٹط§ظ†ط§طھ
        if (typeof saveToLocalStorage === 'function') {
            saveToLocalStorage();
        }
        
        // ط§ظ„طھط­ظ‚ظ‚ ظ…ظ† ط§ظ„ظ†طھط§ط¦ط¬
        const success = afterModification.modifiedCount_after > 0 && 
                       afterModification.isInModifiedKeys && 
                       afterModification.hasUnsavedChanges;
        
        if (typeof showNotification === 'function') {
            const message = success ? 
                `âœ… ط¥طµظ„ط§ط­ ط§ظ„طھط¹ط¯ظٹظ„ط§طھ ظ†ط¬ط­!\n\n` +
                `ًں”‘ ط§ظ„ظ…ظپطھط§ط­: ${currentKey}\n` +
                `ًں“‌ ط§ظ„طھط¹ط¯ظٹظ„ط§طھ: ${afterModification.modifiedCount_after}\n` +
                `âœڈï¸ڈ ط­ط§ظ„ط© ط§ظ„طھط؛ظٹظٹط±: ${afterModification.hasUnsavedChanges ? 'ظ†ط¹ظ…' : 'ظ„ط§'}\n` +
                `ًں’¾ ط§ظ„ظ…ظپطھط§ط­ ظ…ط­ظپظˆط¸: ${afterModification.isInModifiedKeys ? 'ظ†ط¹ظ…' : 'ظ„ط§'}` :
                `â‌Œ ظ…ط§ط²ط§ظ„طھ ظ‡ظ†ط§ظƒ ظ…ط´ظƒظ„ط©!\n\n` +
                `طھط­ظ‚ظ‚ ظ…ظ† ط§ظ„ظƒظˆظ†ط³ظˆظ„ ظ„ظ„طھظپط§طµظٹظ„.`;
                
            showNotification(message, success ? 'success' : 'warning');
        }
        
        // ط¥ط¹ط§ط¯ط© ط§ظ„ظ†طµ ط§ظ„ط£طµظ„ظٹ
        setTimeout(() => {
            if (typeof undoChanges === 'function') {
                undoChanges();
                console.log('âœ… طھظ… ط¥ط±ط¬ط§ط¹ ط§ظ„ظ†طµ ظ„ظ„ط£طµظ„');
            }
        }, 2000);
        
        console.log('âœ… ط§ظ†طھظ‡ظ‰ ط§ط®طھط¨ط§ط± ط§ظ„طھط¹ط¯ظٹظ„ط§طھ - ط§ظ„ظ†طھظٹط¬ط©:', success ? 'ظ†ط¬ط­' : 'ظپط´ظ„');
    }, 1000);
    
    console.log('ًںڈپ ط¨ط¯ط£ ط§ط®طھط¨ط§ط± ط§ظ„طھط¹ط¯ظٹظ„ط§طھ...');
};

// ط§ط®طھط¨ط§ط± ط§ط³طھط±ط¬ط§ط¹ ط§ظ„ظ†طµظˆطµ ط¨ط¹ط¯ refresh
window.testTextRecoveryAfterRefresh = function() {
    console.log('ًں§ھ ط§ط®طھط¨ط§ط± ط§ط³طھط±ط¬ط§ط¹ ط§ظ„ظ†طµظˆطµ ط¨ط¹ط¯ refresh...');
    
    if (!translationText || !translationKeys || translationKeys.length === 0) {
        console.log('â‌Œ ظ„ط§ طھظˆط¬ط¯ طھط±ط¬ظ…ط§طھ ظ„ظ„ط§ط®طھط¨ط§ط±');
        return;
    }
    
    const currentKey = translationKeys[currentIndex];
    const originalValue = originalTranslations && originalTranslations[currentKey] ? originalTranslations[currentKey] : '';
    const testText = originalValue + " - [طھظ… ط§ظ„طھط¹ط¯ظٹظ„ ظ„ظ„ط§ط®طھط¨ط§ط± ط§ظ„ط§ط³طھط±ط¬ط§ط¹]";
    
    console.log('ًں“ٹ ط¨ط¯ط، ط§ط®طھط¨ط§ط± ط§ظ„ط§ط³طھط±ط¬ط§ط¹:', {
        currentKey,
        originalValue,
        testText,
        modifiedCount_before: (modifiedKeys && modifiedKeys.size) || 0
    });
    
    // طھط¹ط¯ظٹظ„ ط§ظ„ظ†طµ
    translationText.value = testText;
    translationText.dispatchEvent(new Event('input'));
    
    setTimeout(() => {
        // ط­ظپط¸ ط§ظ„ط¨ظٹط§ظ†ط§طھ
        if (typeof saveToLocalStorage === 'function') {
            saveToLocalStorage();
        }
        
        console.log('ًں’¾ طھظ… ط­ظپط¸ ط§ظ„طھط¹ط¯ظٹظ„طŒ ط§ظ„ط¢ظ† ظ…ط­ط§ظƒط§ط© ط¥ط¹ط§ط¯ط© طھط­ظ…ظٹظ„...');
        
        setTimeout(() => {
            // ظ…ط­ط§ظƒط§ط© ط¥ط¹ط§ط¯ط© طھط­ظ…ظٹظ„ ط§ظ„ط¨ظٹط§ظ†ط§طھ
            if (typeof loadFromLocalStorage === 'function') {
                loadFromLocalStorage();
            }
            
            setTimeout(() => {
                // طھط­ط¯ظٹط¯ ظ†ظپط³ ط§ظ„ظ…ظپطھط§ط­ ظ…ط±ط© ط£ط®ط±ظ‰
                if (typeof selectTranslationByIndex === 'function') {
                    selectTranslationByIndex(currentIndex);
                }
                
                setTimeout(() => {
                    const afterReload = {
                        currentValue: translationText ? translationText.value : 'N/A',
                        modifiedCount: (modifiedKeys && modifiedKeys.size) || 0,
                        isInModifiedKeys: modifiedKeys && modifiedKeys.has(currentKey),
                        expectedText: testText
                    };
                    
                    console.log('ًں“ٹ ط¨ط¹ط¯ ظ…ط­ط§ظƒط§ط© ط¥ط¹ط§ط¯ط© ط§ظ„طھط­ظ…ظٹظ„:', afterReload);
                    
                    const success = afterReload.currentValue === afterReload.expectedText &&
                                   afterReload.isInModifiedKeys &&
                                   afterReload.modifiedCount > 0;
                    
                    if (typeof showNotification === 'function') {
                        const message = success ? 
                            `âœ… ط§ط®طھط¨ط§ط± ط§ظ„ط§ط³طھط±ط¬ط§ط¹ ظ†ط¬ط­!\n\n` +
                            `ًں”‘ ط§ظ„ظ…ظپطھط§ط­: ${currentKey}\n` +
                            `ًں“‌ ط§ظ„ظ†طµ ط§ظ„ظ…ظڈط³طھط±ط¬ط¹: "${afterReload.currentValue}"\n` +
                            `âœ… ط§ظ„ظ†طµ طµط­ظٹط­: ${afterReload.currentValue === afterReload.expectedText ? 'ظ†ط¹ظ…' : 'ظ„ط§'}` :
                            `â‌Œ ط§ط®طھط¨ط§ط± ط§ظ„ط§ط³طھط±ط¬ط§ط¹ ظپط´ظ„!\n\n` +
                            `ًں“‌ ط§ظ„ظ…طھظˆظ‚ط¹: "${afterReload.expectedText}"\n` +
                            `ًں“‌ ط§ظ„ظ…ظˆط¬ظˆط¯: "${afterReload.currentValue}"\n` +
                            `طھط­ظ‚ظ‚ ظ…ظ† ط§ظ„ظƒظˆظ†ط³ظˆظ„ ظ„ظ„طھظپط§طµظٹظ„.`;
                            
                        showNotification(message, success ? 'success' : 'error');
                    }
                    
                    // ط¥ط¹ط§ط¯ط© ط§ظ„ظ†طµ ط§ظ„ط£طµظ„ظٹ
                    setTimeout(() => {
                        if (typeof undoChanges === 'function') {
                            undoChanges();
                            console.log('âœ… طھظ… ط¥ط±ط¬ط§ط¹ ط§ظ„ظ†طµ ظ„ظ„ط£طµظ„');
                        }
                    }, 2000);
                    
                    console.log('âœ… ط§ظ†طھظ‡ظ‰ ط§ط®طھط¨ط§ط± ط§ظ„ط§ط³طھط±ط¬ط§ط¹ - ط§ظ„ظ†طھظٹط¬ط©:', success ? 'ظ†ط¬ط­' : 'ظپط´ظ„');
                }, 500);
            }, 500);
        }, 500);
    }, 1000);
    
    console.log('ًںڈپ ط¨ط¯ط£ ط§ط®طھط¨ط§ط± ط§ظ„ط§ط³طھط±ط¬ط§ط¹...');
};

// ط¯ط§ظ„ط© ط§ط®طھط¨ط§ط± ط´ط§ظ…ظ„ط© ظ„ط­ظ„ ط¬ظ…ظٹط¹ ظ…ط´ط§ظƒظ„ ط§ظ„ظ†طµظˆطµ ط§ظ„ظ…ظڈط¹ط¯ظ„ط©
window.testCompleteTextEditingSolution = function() {
    console.log('ًں§ھ ط§ط®طھط¨ط§ط± ط´ط§ظ…ظ„ ظ„ط­ظ„ ظ…ط´ط§ظƒظ„ ط§ظ„ظ†طµظˆطµ ط§ظ„ظ…ظڈط¹ط¯ظ„ط©...');
    
    if (!translationText || !translationKeys || translationKeys.length === 0) {
        console.log('â‌Œ ظ„ط§ طھظˆط¬ط¯ طھط±ط¬ظ…ط§طھ ظ„ظ„ط§ط®طھط¨ط§ط±');
        if (typeof showNotification === 'function') {
            showNotification('â‌Œ ظ„ط§ طھظˆط¬ط¯ طھط±ط¬ظ…ط§طھ ظ„ظ„ط§ط®طھط¨ط§ط±!', 'error');
        }
        return;
    }
    
    const currentKey = translationKeys[currentIndex];
    const originalValue = originalTranslations && originalTranslations[currentKey] ? originalTranslations[currentKey] : '';
    const testText = originalValue + " - [SOLUTION TEST COMPLETE]";
    
    console.log('ًں”¥ ط¨ط¯ط، ط§ظ„ط§ط®طھط¨ط§ط± ط§ظ„ط´ط§ظ…ظ„ ظ„ظ„ط­ظ„ ط§ظ„ظ†ظ‡ط§ط¦ظٹ...');
    console.log('ًں“ٹ ظ…ط¹ظ„ظˆظ…ط§طھ ط§ظ„ط§ط®طھط¨ط§ط±:', {
        currentKey,
        originalValue,
        testText,
        modifiedCount_before: (modifiedKeys && modifiedKeys.size) || 0
    });
    
    // âœ… ط§ط®طھط¨ط§ط± 1: طھط¹ط¯ظٹظ„ ط§ظ„ظ†طµ
    console.log('1ï¸ڈâƒ£ ط§ط®طھط¨ط§ط± طھط¹ط¯ظٹظ„ ط§ظ„ظ†طµ...');
    translationText.value = testText;
    translationText.dispatchEvent(new Event('input'));
    
    setTimeout(() => {
        const test1Results = {
            modifiedCount: (modifiedKeys && modifiedKeys.size) || 0,
            isInModifiedKeys: modifiedKeys && modifiedKeys.has(currentKey),
            hasUnsavedChanges: window.hasUnsavedChanges || hasUnsavedChanges
        };
        
        console.log('ًں“ٹ ظ†طھط§ط¦ط¬ ط§ط®طھط¨ط§ط± 1 (ط§ظ„طھط¹ط¯ظٹظ„):', test1Results);
        const test1Success = test1Results.modifiedCount > 0 && test1Results.isInModifiedKeys;
        
        // âœ… ط§ط®طھط¨ط§ط± 2: ط­ظپط¸ ط§ظ„ط¨ظٹط§ظ†ط§طھ
        console.log('2ï¸ڈâƒ£ ط§ط®طھط¨ط§ط± ط­ظپط¸ ط§ظ„ط¨ظٹط§ظ†ط§طھ...');
        if (typeof saveToLocalStorage === 'function') {
            saveToLocalStorage();
        }
        
        setTimeout(() => {
            // âœ… ط§ط®طھط¨ط§ط± 3: ظ…ط­ط§ظƒط§ط© refresh
            console.log('3ï¸ڈâƒ£ ط§ط®طھط¨ط§ط± ظ…ط­ط§ظƒط§ط© refresh...');
            if (typeof loadFromLocalStorage === 'function') {
                loadFromLocalStorage();
            }
            
            setTimeout(() => {
                // âœ… ط§ط®طھط¨ط§ط± 4: ط§ط³طھط±ط¬ط§ط¹ ط§ظ„ظ†طµ
                console.log('4ï¸ڈâƒ£ ط§ط®طھط¨ط§ط± ط§ط³طھط±ط¬ط§ط¹ ط§ظ„ظ†طµ...');
                if (typeof selectTranslationByIndex === 'function') {
                    selectTranslationByIndex(currentIndex);
                }
                
                setTimeout(() => {
                    const test4Results = {
                        currentValue: translationText ? translationText.value : 'N/A',
                        modifiedCount: (modifiedKeys && modifiedKeys.size) || 0,
                        isInModifiedKeys: modifiedKeys && modifiedKeys.has(currentKey),
                        expectedText: testText
                    };
                    
                    console.log('ًں“ٹ ظ†طھط§ط¦ط¬ ط§ط®طھط¨ط§ط± 4 (ط§ظ„ط§ط³طھط±ط¬ط§ط¹):', test4Results);
                    const test4Success = test4Results.currentValue === test4Results.expectedText;
                    
                    // âœ… ط§ط®طھط¨ط§ط± 5: ط¥ط¹ط§ط¯ط© طھط¹ظٹظٹظ†
                    console.log('5ï¸ڈâƒ£ ط§ط®طھط¨ط§ط± ط¥ط¹ط§ط¯ط© ط§ظ„طھط¹ظٹظٹظ†...');
                    const beforeUndo = translationText.value;
                    
                    if (typeof undoChanges === 'function') {
                        undoChanges();
                    }
                    
                    setTimeout(() => {
                        const test5Results = {
                            valueBeforeUndo: beforeUndo,
                            valueAfterUndo: translationText ? translationText.value : 'N/A',
                            expectedAfterUndo: originalValue,
                            modifiedCountAfterUndo: (modifiedKeys && modifiedKeys.size) || 0
                        };
                        
                        console.log('ًں“ٹ ظ†طھط§ط¦ط¬ ط§ط®طھط¨ط§ط± 5 (ط¥ط¹ط§ط¯ط© ط§ظ„طھط¹ظٹظٹظ†):', test5Results);
                        const test5Success = test5Results.valueAfterUndo === test5Results.expectedAfterUndo;
                        
                        // ط§ظ„ظ†طھط§ط¦ط¬ ط§ظ„ظ†ظ‡ط§ط¦ظٹط©
                        const allTestsResults = {
                            'ط§ط®طھط¨ط§ط± 1 - ط§ظ„طھط¹ط¯ظٹظ„': test1Success ? 'âœ… ظ†ط¬ط­' : 'â‌Œ ظپط´ظ„',
                            'ط§ط®طھط¨ط§ط± 2 - ط§ظ„ط­ظپط¸': 'âœ… طھظ…',
                            'ط§ط®طھط¨ط§ط± 3 - ط§ظ„طھط­ظ…ظٹظ„': 'âœ… طھظ…',
                            'ط§ط®طھط¨ط§ط± 4 - ط§ظ„ط§ط³طھط±ط¬ط§ط¹': test4Success ? 'âœ… ظ†ط¬ط­' : 'â‌Œ ظپط´ظ„',
                            'ط§ط®طھط¨ط§ط± 5 - ط¥ط¹ط§ط¯ط© ط§ظ„طھط¹ظٹظٹظ†': test5Success ? 'âœ… ظ†ط¬ط­' : 'â‌Œ ظپط´ظ„'
                        };
                        
                        const overallSuccess = test1Success && test4Success && test5Success;
                        
                        console.log('ًںڈ† ط§ظ„ظ†طھط§ط¦ط¬ ط§ظ„ظ†ظ‡ط§ط¦ظٹط© ظ„ظ„ط§ط®طھط¨ط§ط± ط§ظ„ط´ط§ظ…ظ„:', allTestsResults);
                        console.log('ًںژ¯ ط§ظ„ظ†طھظٹط¬ط© ط§ظ„ط¥ط¬ظ…ط§ظ„ظٹط©:', overallSuccess ? 'âœ… ط§ظ„ط­ظ„ ظٹط¹ظ…ظ„ ط¨ط´ظƒظ„ ظ…ط«ط§ظ„ظٹ!' : 'â‌Œ طھظˆط¬ط¯ ظ…ط´ط§ظƒظ„');
                        
                        if (typeof showNotification === 'function') {
                            const message = overallSuccess ? 
                                `ًںژ‰ طھظ… ط­ظ„ ط¬ظ…ظٹط¹ ظ…ط´ط§ظƒظ„ ط§ظ„ظ†طµظˆطµ ط§ظ„ظ…ظڈط¹ط¯ظ„ط©!\n\n` +
                                `âœ… ط§ظ„طھط¹ط¯ظٹظ„: ظٹط¹ظ…ظ„\n` +
                                `âœ… ط§ظ„ط­ظپط¸: ظٹط¹ظ…ظ„\n` +
                                `âœ… ط§ظ„ط§ط³طھط±ط¬ط§ط¹ ط¨ط¹ط¯ refresh: ظٹط¹ظ…ظ„\n` +
                                `âœ… ط¥ط¹ط§ط¯ط© ط§ظ„طھط¹ظٹظٹظ†: ظٹط¹ظ…ظ„\n\n` +
                                `ًںڈ† ط§ظ„ط­ظ„ ظ…ط«ط§ظ„ظٹ 100%!` :
                                `âڑ ï¸ڈ ظ…ط§ط²ط§ظ„طھ ظ‡ظ†ط§ظƒ ظ…ط´ط§ظƒظ„ ظپظٹ:\n\n` +
                                Object.entries(allTestsResults)
                                    .filter(([test, result]) => result.includes('â‌Œ'))
                                    .map(([test, result]) => `â€¢ ${test}`)
                                    .join('\n') +
                                `\n\nطھط­ظ‚ظ‚ ظ…ظ† ط§ظ„ظƒظˆظ†ط³ظˆظ„ ظ„ظ„طھظپط§طµظٹظ„.`;
                                
                            showNotification(message, overallSuccess ? 'success' : 'warning');
                        }
                        
                        console.log('âœ… ط§ظ†طھظ‡ظ‰ ط§ظ„ط§ط®طھط¨ط§ط± ط§ظ„ط´ط§ظ…ظ„');
                    }, 1000);
                }, 500);
            }, 500);
        }, 500);
    }, 1000);
    
    console.log('ًںڑ€ طھظ… ط¥ط·ظ„ط§ظ‚ ط§ظ„ط§ط®طھط¨ط§ط± ط§ظ„ط´ط§ظ…ظ„...');
};

// ط¯ط§ظ„ط© ط¥طµظ„ط§ط­ ط§ظ„ط¨ظٹط§ظ†ط§طھ ط§ظ„ظ…ط­ظپظˆط¸ط© ظپظٹ localStorage
window.fixLocalStorageData = function() {
    console.log('ًں”§ ط¥طµظ„ط§ط­ ط§ظ„ط¨ظٹط§ظ†ط§طھ ط§ظ„ظ…ط­ظپظˆط¸ط© ظپظٹ localStorage...');
    
    try {
        // ظ‚ط±ط§ط،ط© ط§ظ„ط¨ظٹط§ظ†ط§طھ ط§ظ„ط­ط§ظ„ظٹط©
        const savedData = localStorage.getItem('paradox_translations');
        if (!savedData) {
            console.log('â‌Œ ظ„ط§ طھظˆط¬ط¯ ط¨ظٹط§ظ†ط§طھ ظ…ط­ظپظˆط¸ط© ظ„ظ„ط¥طµظ„ط§ط­');
            if (typeof showNotification === 'function') {
                showNotification('â‌Œ ظ„ط§ طھظˆط¬ط¯ ط¨ظٹط§ظ†ط§طھ ظ…ط­ظپظˆط¸ط© ظ„ظ„ط¥طµظ„ط§ط­', 'warning');
            }
            return;
        }
        
        const data = JSON.parse(savedData);
        
        // ط§ظ„طھط­ظ‚ظ‚ ظ…ظ† ظˆط¬ظˆط¯ ظ…ط´ظƒظ„ط©
        if (data.originalTranslations) {
            console.log('âœ… ط§ظ„ط¨ظٹط§ظ†ط§طھ ط³ظ„ظٹظ…ط© - originalTranslations ظ…ظˆط¬ظˆط¯');
            if (typeof showNotification === 'function') {
                showNotification('âœ… ط§ظ„ط¨ظٹط§ظ†ط§طھ ط§ظ„ظ…ط­ظپظˆط¸ط© ط³ظ„ظٹظ…ط©!', 'success');
            }
            return;
        }
        
        console.log('âڑ ï¸ڈ طھظ… ط§ظƒطھط´ط§ظپ ظ…ط´ظƒظ„ط© ظپظٹ ط§ظ„ط¨ظٹط§ظ†ط§طھ ط§ظ„ظ…ط­ظپظˆط¸ط© - ط¥طµظ„ط§ط­...');
        
        // ط¥ظ†ط´ط§ط، originalTranslations ظ…ظ† ط§ظ„ط¨ظٹط§ظ†ط§طھ ط§ظ„ط­ط§ظ„ظٹط© ظپظٹ ط§ظ„ط°ط§ظƒط±ط©
        if (originalTranslations && Object.keys(originalTranslations).length > 0) {
            // ط§ط³طھط®ط¯ط§ظ… ط§ظ„ظ†طµظˆطµ ط§ظ„ط£طµظ„ظٹط© ظ…ظ† ط§ظ„ط°ط§ظƒط±ط©
            data.originalTranslations = { ...originalTranslations };
            console.log('âœ… طھظ… ط§ط³طھط®ط¯ط§ظ… ط§ظ„ظ†طµظˆطµ ط§ظ„ط£طµظ„ظٹط© ظ…ظ† ط§ظ„ط°ط§ظƒط±ط©');
        } else {
            // ظƒط¢ط®ط± ط­ظ„ - ط§ط³طھط®ط¯ط§ظ… ظ†ط³ط®ط© ظ…ظ† ط§ظ„طھط±ط¬ظ…ط§طھ ط§ظ„ط­ط§ظ„ظٹط©
            data.originalTranslations = { ...data.translations };
            console.warn('âڑ ï¸ڈ طھظ… ط§ط³طھط®ط¯ط§ظ… ظ†ط³ط®ط© ظ…ظ† ط§ظ„طھط±ط¬ظ…ط§طھ ط§ظ„ط­ط§ظ„ظٹط© ظƒظ†طµظˆطµ ط£طµظ„ظٹط©');
        }
        
        // ط­ظپط¸ ط§ظ„ط¨ظٹط§ظ†ط§طھ ط§ظ„ظ…ظڈطµظ„ط­ط©
        localStorage.setItem('paradox_translations', JSON.stringify(data));
        
        console.log('âœ… طھظ… ط¥طµظ„ط§ط­ ط§ظ„ط¨ظٹط§ظ†ط§طھ ط§ظ„ظ…ط­ظپظˆط¸ط©');
        
        if (typeof showNotification === 'function') {
            showNotification(
                'ًں”§ طھظ… ط¥طµظ„ط§ط­ ط§ظ„ط¨ظٹط§ظ†ط§طھ ط§ظ„ظ…ط­ظپظˆط¸ط©!\n\n' +
                'âœ… طھظ… ط¥ط¶ط§ظپط© ط§ظ„ظ†طµظˆطµ ط§ظ„ط£طµظ„ظٹط©\n' +
                'ًں’¾ ط§ظ„ط¨ظٹط§ظ†ط§طھ ط§ظ„ط¢ظ† ظ…ط­ظپظˆط¸ط© ط¨ط´ظƒظ„ طµط­ظٹط­\n\n' +
                'ًں’، ظ‚ظ… ط¨طھط­ط¯ظٹط« ط§ظ„طµظپط­ط© ظ„طھط·ط¨ظٹظ‚ ط§ظ„ط¥طµظ„ط§ط­ط§طھ',
                'success'
            );
        }
        
    } catch (error) {
        console.error('â‌Œ ط®ط·ط£ ظپظٹ ط¥طµظ„ط§ط­ ط§ظ„ط¨ظٹط§ظ†ط§طھ:', error);
        if (typeof showNotification === 'function') {
            showNotification('â‌Œ ظپط´ظ„ ظپظٹ ط¥طµظ„ط§ط­ ط§ظ„ط¨ظٹط§ظ†ط§طھ!', 'error');
        }
    }
};

// ط¯ط§ظ„ط© ط¥ط¹ط§ط¯ط© طھط¹ظٹظٹظ† ظƒط§ظ…ظ„ط© ظ„ظ„ط¨ظٹط§ظ†ط§طھ
window.resetAllData = function() {
    console.log('ًں—‘ï¸ڈ ط¥ط¹ط§ط¯ط© طھط¹ظٹظٹظ† ط¬ظ…ظٹط¹ ط§ظ„ط¨ظٹط§ظ†ط§طھ...');
    
    if (!confirm('âڑ ï¸ڈ ظ‡ط°ط§ ط³ظٹط­ط°ظپ ط¬ظ…ظٹط¹ ط§ظ„ط¨ظٹط§ظ†ط§طھ ط§ظ„ظ…ط­ظپظˆط¸ط©!\n\nظ‡ظ„ ط£ظ†طھ ظ…طھط£ظƒط¯طں')) {
        console.log('â‌Œ طھظ… ط¥ظ„ط؛ط§ط، ط¹ظ…ظ„ظٹط© ط§ظ„ط¥ط¹ط§ط¯ط© طھط¹ظٹظٹظ†');
        return;
    }
    
    try {
        // ط­ط°ظپ ط§ظ„ط¨ظٹط§ظ†ط§طھ ظ…ظ† localStorage
        localStorage.removeItem('paradox_translations');
        localStorage.removeItem('arabicTranslationEditor'); // ط§ظ„ظ†ط³ط®ط© ط§ظ„ظ‚ط¯ظٹظ…ط©
        
        // ط¥ط¹ط§ط¯ط© طھط¹ظٹظٹظ† ط§ظ„ظ…طھط؛ظٹط±ط§طھ ط§ظ„ط¹ط§ظ…ط©
        if (typeof window !== 'undefined') {
            window.translations = {};
            window.originalTranslations = {};
            window.englishTranslations = {};
            window.modifiedKeys = new Set();
            window.currentEditingKey = '';
            window.currentEditedValue = '';
            window.hasUnsavedChanges = false;
            window.currentFile = null;
        }
        
        console.log('âœ… طھظ… ط­ط°ظپ ط¬ظ…ظٹط¹ ط§ظ„ط¨ظٹط§ظ†ط§طھ');
        
        if (typeof showNotification === 'function') {
            showNotification(
                'ًں—‘ï¸ڈ طھظ… ط­ط°ظپ ط¬ظ…ظٹط¹ ط§ظ„ط¨ظٹط§ظ†ط§طھ!\n\n' +
                'ًں’، ط§ط­ظپط¸ ط¹ظ…ظ„ظƒ ظ‚ط¨ظ„ ط¥ط¹ط§ط¯ط© طھط­ظ…ظٹظ„ ط§ظ„طµظپط­ط©\n' +
                'ًں”„ ط§ط¶ط؛ط· F5 ظ„ط¨ط¯ط، ظ†ط¸ظٹظپ',
                'info'
            );
        }
        
    } catch (error) {
        console.error('â‌Œ ط®ط·ط£ ظپظٹ ط­ط°ظپ ط§ظ„ط¨ظٹط§ظ†ط§طھ:', error);
        if (typeof showNotification === 'function') {
            showNotification('â‌Œ ظپط´ظ„ ظپظٹ ط­ط°ظپ ط§ظ„ط¨ظٹط§ظ†ط§طھ!', 'error');
        }
    }
};

// ط¯ط§ظ„ط© ط³ط±ظٹط¹ط© ظ„ظ…ط­ط§ظƒط§ط© refresh ط§ظ„طµظپط­ط©
window.simulatePageRefresh = function() {
    console.log('ًں”„ ظ…ط­ط§ظƒط§ط© ط¥ط¹ط§ط¯ط© طھط­ظ…ظٹظ„ ط§ظ„طµظپط­ط©...');
    
    if (typeof showNotification === 'function') {
        showNotification(
            'ًں”„ ظ…ط­ط§ظƒط§ط© ط¥ط¹ط§ط¯ط© طھط­ظ…ظٹظ„...\n\n' +
            'ط³ظٹطھظ… ط­ظپط¸ ط§ظ„ط¨ظٹط§ظ†ط§طھ ط«ظ… ط¥ط¹ط§ط¯ط© طھط­ظ…ظٹظ„ظ‡ط§\n' +
            'ظ„ط§ط®طھط¨ط§ط± ط§ط³طھط±ط¬ط§ط¹ ظ…ط¹ظ„ظˆظ…ط§طھ ط§ظ„ظ…ظ„ظپ.',
            'info'
        );
    }
    
    // ط­ظپط¸ ط£ظˆظ„ط§ظ‹
    if (typeof saveToLocalStorage === 'function') {
        saveToLocalStorage();
    }
    
    setTimeout(() => {
        // ط¥ط¹ط§ط¯ط© طھط­ظ…ظٹظ„ ط§ظ„ط¨ظٹط§ظ†ط§طھ
        if (typeof loadFromLocalStorage === 'function') {
            loadFromLocalStorage();
        }
        console.log('âœ… طھظ…طھ ظ…ط­ط§ظƒط§ط© ط¥ط¹ط§ط¯ط© ط§ظ„طھط­ظ…ظٹظ„');
    }, 2000);
}; 

// ط§ط®طھط¨ط§ط± ط³ط±ظٹط¹ ظ„ظ„طھط­ظ‚ظ‚ ظ…ظ† ط§ظ„ط¥طµظ„ط§ط­
window.quickTestAfterFix = function() {
    console.log('âڑ، ط§ط®طھط¨ط§ط± ط³ط±ظٹط¹ ظ„ظ„طھط­ظ‚ظ‚ ظ…ظ† ط§ظ„ط¥طµظ„ط§ط­...');
    
    if (!translationText || !translationKeys || translationKeys.length === 0) {
        console.log('â‌Œ ظ„ط§ طھظˆط¬ط¯ طھط±ط¬ظ…ط§طھ ظ„ظ„ط§ط®طھط¨ط§ط±');
        if (typeof showNotification === 'function') {
            showNotification('â‌Œ ظ„ط§ طھظˆط¬ط¯ طھط±ط¬ظ…ط§طھ ظ„ظ„ط§ط®طھط¨ط§ط±!', 'error');
        }
        return;
    }
    
    const currentKey = translationKeys[currentIndex];
    const originalValue = originalTranslations && originalTranslations[currentKey] ? originalTranslations[currentKey] : '';
    const currentValue = translationText.value;
    
    console.log('ًں“ٹ ط§ظ„ظ…ط¹ظ„ظˆظ…ط§طھ ط§ظ„ط­ط§ظ„ظٹط©:', {
        currentKey,
        originalValue,
        currentValue,
        modifiedCount: (modifiedKeys && modifiedKeys.size) || 0,
        isInModifiedKeys: modifiedKeys && modifiedKeys.has(currentKey)
    });
    
    // ط§ط®طھط¨ط§ط± ط¨ط³ظٹط· - طھط¹ط¯ظٹظ„ ط§ظ„ظ†طµ
    const testText = originalValue + " - [QUICK TEST]";
    console.log('âœڈï¸ڈ طھط¹ط¯ظٹظ„ ط§ظ„ظ†طµ ظ„ظ„ط§ط®طھط¨ط§ط±...');
    
    translationText.value = testText;
    translationText.dispatchEvent(new Event('input'));
    
    setTimeout(() => {
        const afterTest = {
            modifiedCount: (modifiedKeys && modifiedKeys.size) || 0,
            isInModifiedKeys: modifiedKeys && modifiedKeys.has(currentKey),
            hasUnsavedChanges: window.hasUnsavedChanges || hasUnsavedChanges
        };
        
        console.log('ًں“ٹ ط¨ط¹ط¯ ط§ظ„طھط¹ط¯ظٹظ„:', afterTest);
        
        // ط¥ط±ط¬ط§ط¹ ط§ظ„ظ†طµ ط§ظ„ط£طµظ„ظٹ
        if (typeof undoChanges === 'function') {
            undoChanges();
        }
        
        setTimeout(() => {
            const afterUndo = {
                currentValue: translationText.value,
                expectedValue: originalValue,
                modifiedCount: (modifiedKeys && modifiedKeys.size) || 0
            };
            
            console.log('ًں“ٹ ط¨ط¹ط¯ ط§ظ„ط¥ط±ط¬ط§ط¹:', afterUndo);
            
            const success = afterTest.modifiedCount > 0 && 
                           afterTest.isInModifiedKeys && 
                           afterUndo.currentValue === afterUndo.expectedValue &&
                           afterUndo.modifiedCount === 0;
            
            if (typeof showNotification === 'function') {
                const message = success ? 
                    'âœ… ط§ظ„ط§ط®طھط¨ط§ط± ط§ظ„ط³ط±ظٹط¹ ظ†ط¬ط­!\n\n' +
                    'ًں”„ ط§ظ„طھط¹ط¯ظٹظ„: ظٹط¹ظ…ظ„\n' +
                    'â†©ï¸ڈ ط§ظ„ط¥ط±ط¬ط§ط¹: ظٹط¹ظ…ظ„\n' +
                    'ًں’¾ ط§ظ„طھطھط¨ط¹: ظٹط¹ظ…ظ„\n\n' +
                    'ًںژ‰ ط§ظ„ط¥طµظ„ط§ط­ ظپط¹ط§ظ„!' :
                    'â‌Œ ط§ظ„ط§ط®طھط¨ط§ط± ط§ظ„ط³ط±ظٹط¹ ظپط´ظ„!\n\n' +
                    'طھط­ظ‚ظ‚ ظ…ظ† ط§ظ„ظƒظˆظ†ط³ظˆظ„ ظ„ظ„طھظپط§طµظٹظ„.';
                    
                showNotification(message, success ? 'success' : 'error');
            }
            
            console.log('âڑ، ط§ظ†طھظ‡ظ‰ ط§ظ„ط§ط®طھط¨ط§ط± ط§ظ„ط³ط±ظٹط¹ - ط§ظ„ظ†طھظٹط¬ط©:', success ? 'ظ†ط¬ط­' : 'ظپط´ظ„');
        }, 1000);
    }, 1000);
    
    console.log('ًںڑ€ طھظ… ط¥ط·ظ„ط§ظ‚ ط§ظ„ط§ط®طھط¨ط§ط± ط§ظ„ط³ط±ظٹط¹...');
}; 

// ط§ط®طھط¨ط§ط± ط®ط§طµ ظ„ظ…ط´ظƒظ„ط© ط§ظ„ط§ظ†طھظ‚ط§ظ„ ط¨ظٹظ† ط§ظ„ظ†طµظˆطµ
window.testNavigationSaving = function() {
    console.log('ًں§ھ ط§ط®طھط¨ط§ط± ط­ظپط¸ ط§ظ„ظ†طµ ط¹ظ†ط¯ ط§ظ„ط§ظ†طھظ‚ط§ظ„ ط¨ظٹظ† ط§ظ„ظ†طµظˆطµ...');
    
    if (!translationText || !translationKeys || translationKeys.length < 2) {
        console.log('â‌Œ ظٹط¬ط¨ ظˆط¬ظˆط¯ ظ†طµظٹظ† ط¹ظ„ظ‰ ط§ظ„ط£ظ‚ظ„ ظ„ظ„ط§ط®طھط¨ط§ط±');
        if (typeof showNotification === 'function') {
            showNotification('â‌Œ ظٹط¬ط¨ ظˆط¬ظˆط¯ ظ†طµظٹظ† ط¹ظ„ظ‰ ط§ظ„ط£ظ‚ظ„ ظ„ظ„ط§ط®طھط¨ط§ط±!', 'error');
        }
        return;
    }
    
    // ط­ظپط¸ ط§ظ„ط­ط§ظ„ط© ط§ظ„ط£طµظ„ظٹط©
    const originalIndex = currentIndex;
    const originalModifiedCount = (modifiedKeys && modifiedKeys.size) || 0;
    
    // ط§ظ†طھظ‚ط§ظ„ ظ„ظ„ظ†طµ ط§ظ„ط£ظˆظ„
    const firstIndex = 0;
    const firstKey = translationKeys[firstIndex];
    const firstOriginal = originalTranslations && originalTranslations[firstKey] ? originalTranslations[firstKey].replace(/"/g, '').trim() : '';
    const firstTestText = firstOriginal + " - [TEST 1]";
    
    console.log('ًں“‌ ط§ظ„ط®ط·ظˆط© 1: طھط¹ط¯ظٹظ„ ط§ظ„ظ†طµ ط§ظ„ط£ظˆظ„');
    console.log(`ًں”‘ ط§ظ„ظ…ظپطھط§ط­: ${firstKey}`);
    console.log(`ًں“– ط§ظ„ظ†طµ ط§ظ„ط£طµظ„ظٹ: "${firstOriginal}"`);
    console.log(`âœڈï¸ڈ ط§ظ„ظ†طµ ط§ظ„ط¬ط¯ظٹط¯: "${firstTestText}"`);
    
    if (typeof selectTranslationByIndex === 'function') {
        selectTranslationByIndex(firstIndex);
    }
    
    setTimeout(() => {
        // طھط¹ط¯ظٹظ„ ط§ظ„ظ†طµ ط§ظ„ط£ظˆظ„
        translationText.value = firstTestText;
        translationText.dispatchEvent(new Event('input'));
        
        setTimeout(() => {
            console.log('ًں“‌ ط§ظ„ط®ط·ظˆط© 2: ط§ظ„ط§ظ†طھظ‚ط§ظ„ ظ„ظ„ظ†طµ ط§ظ„ط«ط§ظ†ظٹ');
            
            // ط§ظ„ط§ظ†طھظ‚ط§ظ„ ظ„ظ„ظ†طµ ط§ظ„ط«ط§ظ†ظٹ
            const secondIndex = firstIndex + 1;
            const secondKey = translationKeys[secondIndex];
            const secondOriginal = originalTranslations && originalTranslations[secondKey] ? originalTranslations[secondKey].replace(/"/g, '').trim() : '';
            const secondTestText = secondOriginal + " - [TEST 2]";
            
            console.log(`ًں”‘ ط§ظ„ظ…ظپطھط§ط­: ${secondKey}`);
            console.log(`ًں“– ط§ظ„ظ†طµ ط§ظ„ط£طµظ„ظٹ: "${secondOriginal}"`);
            console.log(`âœڈï¸ڈ ط§ظ„ظ†طµ ط§ظ„ط¬ط¯ظٹط¯: "${secondTestText}"`);
            
            if (typeof selectTranslationByIndex === 'function') {
                selectTranslationByIndex(secondIndex);
            }
            
            setTimeout(() => {
                // طھط¹ط¯ظٹظ„ ط§ظ„ظ†طµ ط§ظ„ط«ط§ظ†ظٹ
                translationText.value = secondTestText;
                translationText.dispatchEvent(new Event('input'));
                
                setTimeout(() => {
                    console.log('ًں“‌ ط§ظ„ط®ط·ظˆط© 3: ظ…ط­ط§ظƒط§ط© refresh');
                    
                    // ط­ظپط¸ ط§ظ„ط¨ظٹط§ظ†ط§طھ
                    if (typeof saveToLocalStorage === 'function') {
                        saveToLocalStorage();
                    }
                    
                    setTimeout(() => {
                        // ظ…ط­ط§ظƒط§ط© refresh
                        if (typeof loadFromLocalStorage === 'function') {
                            loadFromLocalStorage();
                        }
                        
                        setTimeout(() => {
                            console.log('ًں“‌ ط§ظ„ط®ط·ظˆط© 4: ظپط­طµ ط§ظ„ظ†طھط§ط¦ط¬');
                            
                            // ظپط­طµ ط§ظ„ظ†طµ ط§ظ„ط£ظˆظ„
                            if (typeof selectTranslationByIndex === 'function') {
                                selectTranslationByIndex(firstIndex);
                            }
                            
                            setTimeout(() => {
                                const firstResultValue = translationText.value;
                                const firstSuccess = (firstResultValue === firstTestText);
                                
                                console.log(`âœ… ط§ظ„ظ†طµ 1 - ظ…طھظˆظ‚ط¹: "${firstTestText}"`);
                                console.log(`ًں“‹ ط§ظ„ظ†طµ 1 - ظ…ظˆط¬ظˆط¯: "${firstResultValue}"`);
                                console.log(`ًںژ¯ ط§ظ„ظ†طµ 1 - ط§ظ„ظ†طھظٹط¬ط©: ${firstSuccess ? 'ظ†ط¬ط­' : 'ظپط´ظ„'}`);
                                
                                // ظپط­طµ ط§ظ„ظ†طµ ط§ظ„ط«ط§ظ†ظٹ
                                if (typeof selectTranslationByIndex === 'function') {
                                    selectTranslationByIndex(secondIndex);
                                }
                                
                                setTimeout(() => {
                                    const secondResultValue = translationText.value;
                                    const secondSuccess = (secondResultValue === secondTestText);
                                    
                                    console.log(`âœ… ط§ظ„ظ†طµ 2 - ظ…طھظˆظ‚ط¹: "${secondTestText}"`);
                                    console.log(`ًں“‹ ط§ظ„ظ†طµ 2 - ظ…ظˆط¬ظˆط¯: "${secondResultValue}"`);
                                    console.log(`ًںژ¯ ط§ظ„ظ†طµ 2 - ط§ظ„ظ†طھظٹط¬ط©: ${secondSuccess ? 'ظ†ط¬ط­' : 'ظپط´ظ„'}`);
                                    
                                    const overallSuccess = firstSuccess && secondSuccess;
                                    const newModifiedCount = (modifiedKeys && modifiedKeys.size) || 0;
                                    
                                    console.log('ًںڈ† ط§ظ„ظ†طھط§ط¦ط¬ ط§ظ„ظ†ظ‡ط§ط¦ظٹط©:', {
                                        'ط§ظ„ظ†طµ ط§ظ„ط£ظˆظ„': firstSuccess ? 'âœ… ظ†ط¬ط­' : 'â‌Œ ظپط´ظ„',
                                        'ط§ظ„ظ†طµ ط§ظ„ط«ط§ظ†ظٹ': secondSuccess ? 'âœ… ظ†ط¬ط­' : 'â‌Œ ظپط´ظ„',
                                        'ط§ظ„طھط¹ط¯ظٹظ„ط§طھ ط§ظ„ظ…ط­ظپظˆط¸ط©': `${newModifiedCount} (ظƒط§ظ† ${originalModifiedCount})`,
                                        'ط§ظ„ظ†طھظٹط¬ط© ط§ظ„ط¥ط¬ظ…ط§ظ„ظٹط©': overallSuccess ? 'âœ… ظ†ط¬ط­' : 'â‌Œ ظپط´ظ„'
                                    });
                                    
                                    if (typeof showNotification === 'function') {
                                        const message = overallSuccess ? 
                                            `ًںژ‰ ط§ط®طھط¨ط§ط± ط§ظ„ط§ظ†طھظ‚ط§ظ„ ظ†ط¬ط­!\n\n` +
                                            `âœ… ط§ظ„ظ†طµ 1: ظ…ط­ظپظˆط¸\n` +
                                            `âœ… ط§ظ„ظ†طµ 2: ظ…ط­ظپظˆط¸\n` +
                                            `ًں’¾ ط§ظ„طھط¹ط¯ظٹظ„ط§طھ: ${newModifiedCount}\n\n` +
                                            `ًںڈ† ط§ظ„ظ…ط´ظƒظ„ط© ظ…ظڈط­ظ„ط©!` :
                                            `â‌Œ ط§ط®طھط¨ط§ط± ط§ظ„ط§ظ†طھظ‚ط§ظ„ ظپط´ظ„!\n\n` +
                                            `ط§ظ„ظ†طµ 1: ${firstSuccess ? 'âœ…' : 'â‌Œ'}\n` +
                                            `ط§ظ„ظ†طµ 2: ${secondSuccess ? 'âœ…' : 'â‌Œ'}\n\n` +
                                            `طھط­ظ‚ظ‚ ظ…ظ† ط§ظ„ظƒظˆظ†ط³ظˆظ„ ظ„ظ„طھظپط§طµظٹظ„.`;
                                            
                                        showNotification(message, overallSuccess ? 'success' : 'error');
                                    }
                                    
                                    // ط¥ط¹ط§ط¯ط© ط§ظ„ظ†طµظˆطµ ظ„ظ„ط£طµظ„
                                    setTimeout(() => {
                                        console.log('ًں”„ ط¥ط¹ط§ط¯ط© ط§ظ„ظ†طµظˆطµ ظ„ظ„ط­ط§ظ„ط© ط§ظ„ط£طµظ„ظٹط©...');
                                        
                                        if (typeof selectTranslationByIndex === 'function') {
                                            selectTranslationByIndex(firstIndex);
                                        }
                                        
                                        setTimeout(() => {
                                            if (typeof undoChanges === 'function') {
                                                undoChanges();
                                            }
                                            
                                            setTimeout(() => {
                                                if (typeof selectTranslationByIndex === 'function') {
                                                    selectTranslationByIndex(secondIndex);
                                                }
                                                
                                                setTimeout(() => {
                                                    if (typeof undoChanges === 'function') {
                                                        undoChanges();
                                                    }
                                                    
                                                    // ط§ظ„ط¹ظˆط¯ط© ظ„ظ„ظپظ‡ط±ط³ ط§ظ„ط£طµظ„ظٹ
                                                    setTimeout(() => {
                                                        if (typeof selectTranslationByIndex === 'function') {
                                                            selectTranslationByIndex(originalIndex);
                                                        }
                                                        console.log('âœ… طھظ… ط¥ط±ط¬ط§ط¹ ط¬ظ…ظٹط¹ ط§ظ„ظ†طµظˆطµ ظ„ظ„ط­ط§ظ„ط© ط§ظ„ط£طµظ„ظٹط©');
                                                    }, 500);
                                                }, 500);
                                            }, 500);
                                        }, 500);
                                    }, 2000);
                                    
                                    console.log('âœ… ط§ظ†طھظ‡ظ‰ ط§ط®طھط¨ط§ط± ط§ظ„ط§ظ†طھظ‚ط§ظ„');
                                }, 500);
                            }, 500);
                        }, 500);
                    }, 500);
                }, 1000);
            }, 1000);
        }, 1000);
    }, 1000);
    
    console.log('ًںڑ€ طھظ… ط¥ط·ظ„ط§ظ‚ ط§ط®طھط¨ط§ط± ط§ظ„ط§ظ†طھظ‚ط§ظ„...');
}; 

// ط¹ط±ط¶ ط¬ظ…ظٹط¹ ط¯ظˆط§ظ„ ط§ظ„ط§ط®طھط¨ط§ط± ط§ظ„ظ…طھظˆظپط±ط©
window.showAllTests = function() {
    console.log('ًں§ھ ط¯ظ„ظٹظ„ ط¬ظ…ظٹط¹ ط¯ظˆط§ظ„ ط§ظ„ط§ط®طھط¨ط§ط± ط§ظ„ظ…طھظˆظپط±ط©:');
    console.log('');
    
    const tests = [
        {
            name: 'testCompleteTextEditingSolution()',
            description: 'ًںڈ† ط§ظ„ط§ط®طھط¨ط§ط± ط§ظ„ط´ط§ظ…ظ„ - ظٹظپط­طµ ط¬ظ…ظٹط¹ ط§ظ„ظˆط¸ط§ط¦ظپ',
            category: 'ط´ط§ظ…ظ„'
        },
        {
            name: 'testNavigationSaving()',
            description: 'ًں”„ ط§ط®طھط¨ط§ط± ط­ظپط¸ ط§ظ„ظ†طµ ط¹ظ†ط¯ ط§ظ„ط§ظ†طھظ‚ط§ظ„ ط¨ظٹظ† ط§ظ„ظ†طµظˆطµ',
            category: 'ط¬ط¯ظٹط¯'
        },
        {
            name: 'testNewFileLoading()',
            description: 'ًں“پ ط§ط®طھط¨ط§ط± ظ…ط³ط­ ط§ظ„ط¨ظٹط§ظ†ط§طھ ط¹ظ†ط¯ طھط­ظ…ظٹظ„ ظ…ظ„ظپ ط¬ط¯ظٹط¯',
            category: 'ط¬ط¯ظٹط¯'
        },
        {
            name: 'testModificationSaving()',
            description: 'ًں’¾ ط§ط®طھط¨ط§ط± ط­ظپط¸ ط§ظ„طھط¹ط¯ظٹظ„ط§طھ',
            category: 'ط£ط³ط§ط³ظٹ'
        },
        {
            name: 'testTextRecoveryAfterRefresh()',
            description: 'ًں”„ ط§ط®طھط¨ط§ط± ط§ط³طھط±ط¬ط§ط¹ ط§ظ„ظ†طµ ط¨ط¹ط¯ refresh',
            category: 'ط£ط³ط§ط³ظٹ'
        },
        {
            name: 'testCurrentlyEditedText()',
            description: 'âœڈï¸ڈ ط§ط®طھط¨ط§ط± ط­ظپط¸ ط§ظ„ظ†طµ ط§ظ„ظ…ظڈط¹ط¯ظ„ ط­ط§ظ„ظٹط§ظ‹',
            category: 'ط£ط³ط§ط³ظٹ'
        },
        {
            name: 'quickTestAfterFix()',
            description: 'âڑ، ط§ط®طھط¨ط§ط± ط³ط±ظٹط¹ ظ„ظ„طھط­ظ‚ظ‚ ظ…ظ† ط§ظ„ط¥طµظ„ط§ط­ط§طھ',
            category: 'ط³ط±ظٹط¹'
        },
        {
            name: 'showSystemStatus()',
            description: 'ًں“ٹ ط¹ط±ط¶ ط­ط§ظ„ط© ط§ظ„ظ†ط¸ط§ظ… ط§ظ„طھظپطµظٹظ„ظٹط©',
            category: 'طھط´ط®ظٹطµ'
        },
        {
            name: 'diagnoseEnglishTexts()',
            description: 'ًں”چ طھط´ط®ظٹطµ ط§ظ„ظ†طµظˆطµ ط§ظ„ط¥ظ†ط¬ظ„ظٹط²ظٹط©',
            category: 'طھط´ط®ظٹطµ'
        },
        {
            name: 'fixLocalStorageData()',
            description: 'ًں”§ ط¥طµظ„ط§ط­ ط§ظ„ط¨ظٹط§ظ†ط§طھ ط§ظ„ظ…ط­ظپظˆط¸ط©',
            category: 'ط¥طµظ„ط§ط­'
        },
        {
            name: 'resetAllData()',
            description: 'ًں—‘ï¸ڈ ط­ط°ظپ ط¬ظ…ظٹط¹ ط§ظ„ط¨ظٹط§ظ†ط§طھ (ط®ط·ط±!)',
            category: 'ط¥طµظ„ط§ط­'
        },
        {
            name: 'clearPreviousFileText()',
            description: 'ًں—‘ï¸ڈ ظ…ط³ط­ ط§ظ„ظ†طµ ظ…ظ† ط§ظ„ظ…ظ„ظپ ط§ظ„ط³ط§ط¨ظ‚ ظپظˆط±ط§ظ‹',
            category: 'ط¥طµظ„ط§ط­'
        }
    ];
    
    // طھط¬ظ…ظٹط¹ ط­ط³ط¨ ط§ظ„ظپط¦ط©
    const categories = {};
    tests.forEach(test => {
        if (!categories[test.category]) {
            categories[test.category] = [];
        }
        categories[test.category].push(test);
    });
    
    // ط¹ط±ط¶ ظ…ظڈظ†ط¸ظ…
    Object.entries(categories).forEach(([category, categoryTests]) => {
        console.log(`\nًں”– ${category}:`);
        categoryTests.forEach(test => {
            console.log(`   ${test.name}`);
            console.log(`   â””â”€ ${test.description}`);
        });
    });
    
    console.log('\nًں’، ظ†طµط§ط¦ط­:');
    console.log('â€¢ ط§ط¨ط¯ط£ ط¨ظ€ testCompleteTextEditingSolution() ظ„ظ„ط§ط®طھط¨ط§ط± ط§ظ„ط´ط§ظ…ظ„');
    console.log('â€¢ ط§ط³طھط®ط¯ظ… testNavigationSaving() ظ„ط§ط®طھط¨ط§ط± ط§ظ„ظ…ط´ظƒظ„ط© ط§ظ„ط¬ط¯ظٹط¯ط©');
    console.log('â€¢ ط§ط³طھط®ط¯ظ… showSystemStatus() ظ„ظپط­طµ ط­ط§ظ„ط© ط§ظ„ظ†ط¸ط§ظ…');
    console.log('â€¢ ط§ط³طھط®ط¯ظ… quickTestAfterFix() ظ„ظ„ط§ط®طھط¨ط§ط± ط§ظ„ط³ط±ظٹط¹');
    
    if (typeof showNotification === 'function') {
        showNotification(
            'ًں§ھ ط¯ظ„ظٹظ„ ط§ظ„ط§ط®طھط¨ط§ط±ط§طھ\n\n' +
            'ًںڈ† testCompleteTextEditingSolution() - ط´ط§ظ…ظ„\n' +
            'ًں”„ testNavigationSaving() - ط§ظ„ط§ظ†طھظ‚ط§ظ„\n' +
            'ًں“پ testNewFileLoading() - ظ…ظ„ظپ ط¬ط¯ظٹط¯\n' +
            'ًں—‘ï¸ڈ clearPreviousFileText() - ظ…ط³ط­ ظپظˆط±ظٹ\n' +
            'âڑ، quickTestAfterFix() - ط³ط±ظٹط¹\n' +
            'ًں“ٹ showSystemStatus() - ط­ط§ظ„ط© ط§ظ„ظ†ط¸ط§ظ…\n\n' +
            'ًں’، طھط­ظ‚ظ‚ ظ…ظ† ط§ظ„ظƒظˆظ†ط³ظˆظ„ ظ„ظ„ظ‚ط§ط¦ظ…ط© ط§ظ„ظƒط§ظ…ظ„ط©',
            'info'
        );
    }
    
    console.log('\nâœ… طھظ… ط¹ط±ط¶ ط¬ظ…ظٹط¹ ط¯ظˆط§ظ„ ط§ظ„ط§ط®طھط¨ط§ط±');
};

// طھط´ط؛ظٹظ„ طھظ„ظ‚ط§ط¦ظٹ ظ„ط¹ط±ط¶ ط¯ظ„ظٹظ„ ط§ظ„ط§ط®طھط¨ط§ط±ط§طھ
console.log('ًں§ھ ظ„ظ„ط­طµظˆظ„ ط¹ظ„ظ‰ ظ‚ط§ط¦ظ…ط© ط¬ظ…ظٹط¹ ط§ظ„ط§ط®طھط¨ط§ط±ط§طھطŒ ط§ظƒطھط¨: showAllTests()');
console.log('ًںژ¯ ظ„ظ„ط§ط®طھط¨ط§ط± ط§ظ„ط³ط±ظٹط¹ ظ„ظ„ظ…ط´ظƒظ„ط© ط§ظ„ط¬ط¯ظٹط¯ط©طŒ ط§ظƒطھط¨: testNavigationSaving()');
console.log('ًں“پ ظ„ط§ط®طھط¨ط§ط± ظ…ط´ظƒظ„ط© ط§ظ„ظ…ظ„ظپ ط§ظ„ط¬ط¯ظٹط¯طŒ ط§ظƒطھط¨: testNewFileLoading()');
console.log('ًں—‘ï¸ڈ ظ„ظ…ط³ط­ ط§ظ„ظ†طµ ظ…ظ† ط§ظ„ظ…ظ„ظپ ط§ظ„ط³ط§ط¨ظ‚ ظپظˆط±ط§ظ‹طŒ ط§ظƒطھط¨: clearPreviousFileText()');

// ط§ط®طھط¨ط§ط± ط®ط§طµ ظ„ظ…ط´ظƒظ„ط© طھط­ظ…ظٹظ„ ظ…ظ„ظپ ط¬ط¯ظٹط¯
window.testNewFileLoading = function() {
    console.log('ًں§ھ ط§ط®طھط¨ط§ط± طھط­ظ…ظٹظ„ ظ…ظ„ظپ ط¬ط¯ظٹط¯ ظˆط¶ظ…ط§ظ† ظ…ط³ط­ ط§ظ„ط¨ظٹط§ظ†ط§طھ ط§ظ„ط³ط§ط¨ظ‚ط©...');
    
    if (!translationText || !translationKeys || translationKeys.length === 0) {
        console.log('â‌Œ ظٹط¬ط¨ ظˆط¬ظˆط¯ ظ…ظ„ظپ ظ…ط­ظ…ظ„ ظ„ظ„ط§ط®طھط¨ط§ط±');
        if (typeof showNotification === 'function') {
            showNotification('â‌Œ ظٹط¬ط¨ ظˆط¬ظˆط¯ ظ…ظ„ظپ ظ…ط­ظ…ظ„ ظ„ظ„ط§ط®طھط¨ط§ط±!', 'error');
        }
        return;
    }
    
    // ط§ظ„ط®ط·ظˆط© 1: طھط¹ط¯ظٹظ„ ظ†طµ ظپظٹ ط§ظ„ظ…ظ„ظپ ط§ظ„ط­ط§ظ„ظٹ
    const currentKey = translationKeys[currentIndex];
    const originalValue = originalTranslations && originalTranslations[currentKey] ? 
                         originalTranslations[currentKey].replace(/"/g, '').trim() : '';
    const testValue = originalValue + " - [TEST FROM PREVIOUS FILE]";
    
    console.log('ًں“‌ ط§ظ„ط®ط·ظˆط© 1: طھط¹ط¯ظٹظ„ ظ†طµ ظپظٹ ط§ظ„ظ…ظ„ظپ ط§ظ„ط­ط§ظ„ظٹ');
    console.log(`ًں”‘ ط§ظ„ظ…ظپطھط§ط­: ${currentKey}`);
    console.log(`ًں“– ط§ظ„ظ†طµ ط§ظ„ط£طµظ„ظٹ: "${originalValue}"`);
    console.log(`âœڈï¸ڈ ط§ظ„ظ†طµ ط§ظ„ظ…ظڈط¹ط¯ظ„: "${testValue}"`);
    
    // طھط¹ط¯ظٹظ„ ط§ظ„ظ†طµ
    translationText.value = testValue;
    translationText.dispatchEvent(new Event('input'));
    
    setTimeout(() => {
        // ظپط­طµ ط£ظ† ط§ظ„طھط¹ط¯ظٹظ„ طھظ…
        const beforeFileLoad = {
            currentEditingKey: window.currentEditingKey || currentEditingKey,
            currentEditedValue: window.currentEditedValue || currentEditedValue,
            modifiedCount: (modifiedKeys && modifiedKeys.size) || 0,
            currentFile: currentFile ? (currentFile.name || currentFile) : 'N/A'
        };
        
        console.log('ًں“ٹ ظ‚ط¨ظ„ طھط­ظ…ظٹظ„ ظ…ظ„ظپ ط¬ط¯ظٹط¯:', beforeFileLoad);
        
        // ط§ظ„ط®ط·ظˆط© 2: ظ…ط­ط§ظƒط§ط© طھط­ظ…ظٹظ„ ظ…ظ„ظپ ط¬ط¯ظٹط¯
        console.log('ًں“‌ ط§ظ„ط®ط·ظˆط© 2: ظ…ط­ط§ظƒط§ط© طھط­ظ…ظٹظ„ ظ…ظ„ظپ ط¬ط¯ظٹط¯...');
        
        // ظ…ط­ط§ظƒط§ط© ط§ظ„ط¨ظٹط§ظ†ط§طھ ط§ظ„ط¬ط¯ظٹط¯ط©
        const mockNewFileData = {
            'test_key_1': '"Test translation 1"',
            'test_key_2': '"Test translation 2"',
            'test_key_3': '"Test translation 3"'
        };
        
        // طھط·ط¨ظٹظ‚ ظ…ظ†ط·ظ‚ طھط­ظ…ظٹظ„ ظ…ظ„ظپ ط¬ط¯ظٹط¯ (ظ†ظپط³ ظ…ط§ ظٹط­ط¯ط« ظپظٹ loadYamlContent)
        console.log('ًں—‘ï¸ڈ ظ…ط³ط­ ط§ظ„ط¨ظٹط§ظ†ط§طھ ط§ظ„ط³ط§ط¨ظ‚ط©...');
        
        // Reset unsaved changes first
        window.hasUnsavedChanges = false;
        hasUnsavedChanges = false;
        
        window.modifiedKeys.clear();
        modifiedKeys.clear();
        
        window.currentEditingKey = '';
        currentEditingKey = '';
        
        window.currentEditedValue = '';
        currentEditedValue = '';
        
        // ظ…ط³ط­ ط¹ظ†طµط± ط§ظ„ظ†طµ ظپظٹ ط§ظ„ظˆط§ط¬ظ‡ط© ط£ظٹط¶ط§ظ‹ (ظ…ظ‡ظ… ط¬ط¯ط§ظ‹!)
        if (translationText) {
            translationText.value = '';
            console.log('ًں—‘ï¸ڈ طھظ… ظ…ط³ط­ ط¹ظ†طµط± ط§ظ„ظ†طµ ظپظٹ ط§ظ„ظˆط§ط¬ظ‡ط©');
        }
        
        // Update with new data
        window.translations = mockNewFileData;
        translations = mockNewFileData;
        
        window.originalTranslations = { ...mockNewFileData };
        originalTranslations = { ...mockNewFileData };
        
        window.translationKeys = Object.keys(mockNewFileData);
        translationKeys = Object.keys(mockNewFileData);
        
        window.filteredTranslations = { ...mockNewFileData };
        filteredTranslations = { ...mockNewFileData };
        
        // طھط­ط¯ظٹط« ط§ظ„ظپظ‡ط±ط³
        window.currentIndex = 0;
        currentIndex = 0;
        
        console.log('ًں“ٹ ط¨ط¹ط¯ طھط­ظ…ظٹظ„ ط§ظ„ظ…ظ„ظپ ط§ظ„ط¬ط¯ظٹط¯:');
        console.log(`ًں”‘ currentEditingKey: "${window.currentEditingKey || currentEditingKey}"`);
        console.log(`ًں“‌ currentEditedValue: "${window.currentEditedValue || currentEditedValue}"`);
        console.log(`ًں“ٹ modifiedCount: ${(modifiedKeys && modifiedKeys.size) || 0}`);
        console.log(`ًں“پ translationKeys: ${translationKeys.length} keys`);
        
        setTimeout(() => {
            // ط§ظ„ط®ط·ظˆط© 3: ط§ط®طھظٹط§ط± ظ†طµ ظ…ظ† ط§ظ„ظ…ظ„ظپ ط§ظ„ط¬ط¯ظٹط¯
            console.log('ًں“‌ ط§ظ„ط®ط·ظˆط© 3: ط§ط®طھظٹط§ط± ظ†طµ ظ…ظ† ط§ظ„ظ…ظ„ظپ ط§ظ„ط¬ط¯ظٹط¯...');
            
            if (typeof selectTranslationByIndex === 'function') {
                selectTranslationByIndex(0);
            }
            
            setTimeout(() => {
                const afterSelection = {
                    currentDisplayedText: translationText ? translationText.value : 'N/A',
                    currentEditingKey: window.currentEditingKey || currentEditingKey,
                    currentEditedValue: window.currentEditedValue || currentEditedValue,
                    expectedText: 'Test translation 1', // ط§ظ„ظ†طµ ط§ظ„طµط­ظٹط­ ظ…ظ† ط§ظ„ط¨ظٹط§ظ†ط§طھ ط§ظ„ظ…ط­ط§ظƒظٹط©
                    selectedKey: translationKeys[0]
                };
                
                console.log('ًں“ٹ ط¨ط¹ط¯ ط§ط®طھظٹط§ط± ط§ظ„ظ†طµ ط§ظ„ط¬ط¯ظٹط¯:', afterSelection);
                
                // ظپط­طµ ط§ظ„ظ†طھط§ط¦ط¬
                const textMatches = (afterSelection.currentDisplayedText === afterSelection.expectedText);
                const noOldData = (!afterSelection.currentDisplayedText.includes('TEST FROM PREVIOUS FILE') && 
                                   !afterSelection.currentEditedValue.includes('TEST FROM PREVIOUS FILE'));
                const correctKey = (afterSelection.selectedKey === 'test_key_1');
                
                const success = textMatches && noOldData && correctKey;
                
                console.log('ًں”چ ظپط­طµ ط§ظ„ظ†طھط§ط¦ط¬:');
                console.log(`âœ… ط§ظ„ظ†طµ ط§ظ„ظ…ط¹ط±ظˆط¶ طµط­ظٹط­: ${textMatches ? 'ظ†ط¹ظ…' : 'ظ„ط§'} ("${afterSelection.currentDisplayedText}" vs "${afterSelection.expectedText}")`);
                console.log(`ًں—‘ï¸ڈ ظ„ط§ طھظˆط¬ط¯ ط¨ظٹط§ظ†ط§طھ ظ‚ط¯ظٹظ…ط©: ${noOldData ? 'ظ†ط¹ظ…' : 'ظ„ط§'} (ظپط­طµ ط¹ط¯ظ… ظˆط¬ظˆط¯ "TEST FROM PREVIOUS FILE")`);
                console.log(`ًں”‘ ط§ظ„ظ…ظپطھط§ط­ طµط­ظٹط­: ${correctKey ? 'ظ†ط¹ظ…' : 'ظ„ط§'} ("${afterSelection.selectedKey}")`);
                
                if (typeof showNotification === 'function') {
                    const message = success ? 
                        `âœ… ط§ط®طھط¨ط§ط± ط§ظ„ظ…ظ„ظپ ط§ظ„ط¬ط¯ظٹط¯ ظ†ط¬ط­!\n\n` +
                        `ًں—‘ï¸ڈ طھظ… ظ…ط³ط­ ط§ظ„ط¨ظٹط§ظ†ط§طھ ط§ظ„ط³ط§ط¨ظ‚ط©\n` +
                        `ًں“‌ ط§ظ„ظ†طµ ط§ظ„ط¬ط¯ظٹط¯ ظ…ط¹ط±ظˆط¶ ط¨ط´ظƒظ„ طµط­ظٹط­\n` +
                        `ًں”‘ ظ„ط§ طھظˆط¬ط¯ طھط¯ط§ط®ظ„ط§طھ ظ…ظ† ط§ظ„ظ…ظ„ظپ ط§ظ„ط³ط§ط¨ظ‚\n\n` +
                        `ًںژ‰ ط§ظ„ظ…ط´ظƒظ„ط© ظ…ظڈط­ظ„ط©!` :
                        `â‌Œ ط§ط®طھط¨ط§ط± ط§ظ„ظ…ظ„ظپ ط§ظ„ط¬ط¯ظٹط¯ ظپط´ظ„!\n\n` +
                        `ط§ظ„ظ†طµ طµط­ظٹط­: ${textMatches ? 'âœ…' : 'â‌Œ'}\n` +
                        `ظ„ط§ ط¨ظٹط§ظ†ط§طھ ظ‚ط¯ظٹظ…ط©: ${noOldData ? 'âœ…' : 'â‌Œ'}\n` +
                        `ط§ظ„ظ…ظپطھط§ط­ طµط­ظٹط­: ${correctKey ? 'âœ…' : 'â‌Œ'}\n\n` +
                        `ًں“‌ ط§ظ„ظ…ط¹ط±ظˆط¶: "${afterSelection.currentDisplayedText}"\n` +
                        `ًں“‌ ط§ظ„ظ…طھظˆظ‚ط¹: "${afterSelection.expectedText}"`;
                        
                    showNotification(message, success ? 'success' : 'error');
                }
                
                console.log('ًںژ¯ ط§ظ„ظ†طھظٹط¬ط© ط§ظ„ظ†ظ‡ط§ط¦ظٹط©:', success ? 'âœ… ظ†ط¬ط­' : 'â‌Œ ظپط´ظ„');
                console.log('âœ… ط§ظ†طھظ‡ظ‰ ط§ط®طھط¨ط§ط± طھط­ظ…ظٹظ„ ط§ظ„ظ…ظ„ظپ ط§ظ„ط¬ط¯ظٹط¯');
                
            }, 1000);
         }, 1000);
     }, 1000);
     
     console.log('ًںڑ€ طھظ… ط¥ط·ظ„ط§ظ‚ ط§ط®طھط¨ط§ط± طھط­ظ…ظٹظ„ ط§ظ„ظ…ظ„ظپ ط§ظ„ط¬ط¯ظٹط¯...');
 };

// ط¯ط§ظ„ط© ط¥طµظ„ط§ط­ ط³ط±ظٹط¹ط© ظ„ظ…ط³ط­ ط§ظ„ظ†طµ ظ…ظ† ط§ظ„ظ…ظ„ظپ ط§ظ„ط³ط§ط¨ظ‚
window.clearPreviousFileText = function() {
    console.log('ًں—‘ï¸ڈ ظ…ط³ط­ ط§ظ„ظ†طµ ظ…ظ† ط§ظ„ظ…ظ„ظپ ط§ظ„ط³ط§ط¨ظ‚...');
    
    const translationText = document.getElementById('translationText');
    if (translationText) {
        translationText.value = '';
        console.log('âœ… طھظ… ظ…ط³ط­ ط¹ظ†طµط± ط§ظ„ظ†طµ ظپظٹ ط§ظ„ظˆط§ط¬ظ‡ط©');
    }
    
    // ظ…ط³ط­ ط§ظ„ظ…طھط؛ظٹط±ط§طھ ط§ظ„ط¹ط§ظ…ط©
    window.currentEditedValue = '';
    currentEditedValue = '';
    window.currentEditingKey = '';
    currentEditingKey = '';
    
    console.log('âœ… طھظ… ظ…ط³ط­ ط§ظ„ظ…طھط؛ظٹط±ط§طھ ط§ظ„ط¹ط§ظ…ط©');
    
    // ط¥ط¹ط§ط¯ط© ط§ط®طھظٹط§ط± ط§ظ„ظ†طµ ط§ظ„ط­ط§ظ„ظٹ ظ„ظٹطھظ… ط¹ط±ط¶ظ‡ ط¨ط´ظƒظ„ طµط­ظٹط­
    if (typeof selectTranslationByIndex === 'function' && 
        typeof currentIndex !== 'undefined' && 
        translationKeys && translationKeys.length > 0) {
        
        setTimeout(() => {
            selectTranslationByIndex(currentIndex);
            console.log('âœ… طھظ… ط¥ط¹ط§ط¯ط© ط¹ط±ط¶ ط§ظ„ظ†طµ ط§ظ„طµط­ظٹط­');
            
            if (typeof showNotification === 'function') {
                showNotification(
                    'ًں—‘ï¸ڈ طھظ… ظ…ط³ط­ ط§ظ„ظ†طµ ظ…ظ† ط§ظ„ظ…ظ„ظپ ط§ظ„ط³ط§ط¨ظ‚!\n\n' +
                    'âœ… طھظ… ظ…ط³ط­ ط¹ظ†طµط± ط§ظ„ظˆط§ط¬ظ‡ط©\n' +
                    'âœ… طھظ… ظ…ط³ط­ ط§ظ„ظ…طھط؛ظٹط±ط§طھ ط§ظ„ط¹ط§ظ…ط©\n' +
                    'âœ… طھظ… ط¥ط¹ط§ط¯ط© ط¹ط±ط¶ ط§ظ„ظ†طµ ط§ظ„طµط­ظٹط­\n\n' +
                    'ًں’، ط¬ط±ط¨ طھط­ط¯ظٹط« ط§ظ„طµظپط­ط© ط¥ط°ط§ ط¸ظ‡ط±طھ ط§ظ„ظ…ط´ظƒظ„ط© ظ…ط±ط© ط£ط®ط±ظ‰',
                    'success'
                );
            }
        }, 100);
    } else {
        if (typeof showNotification === 'function') {
            showNotification(
                'ًں—‘ï¸ڈ طھظ… ظ…ط³ط­ ط§ظ„ظ†طµ ظ…ظ† ط§ظ„ظ…ظ„ظپ ط§ظ„ط³ط§ط¨ظ‚!\n\n' +
                'âڑ ï¸ڈ ظ‚ظ… ط¨طھط­ط¯ظٹط¯ ظ†طµ ظ…ظ† ط§ظ„ظ‚ط§ط¦ظ…ط© ظ„ط¹ط±ط¶ظ‡ ط¨ط´ظƒظ„ طµط­ظٹط­',
                'info'
            );
        }
    }
    
    console.log('âœ… ط§ظ†طھظ‡ظ‰ ظ…ط³ط­ ط§ظ„ط¨ظٹط§ظ†ط§طھ ظ…ظ† ط§ظ„ظ…ظ„ظپ ط§ظ„ط³ط§ط¨ظ‚');
};
// ===========================================
// MAIN INITIALIZATION - ط§ظ„طھظ‡ظٹط¦ط© ط§ظ„ط±ط¦ظٹط³ظٹط©
// ===========================================

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    console.log('ًںڑ€ ط¨ط¯ط، طھظ‡ظٹط¦ط© ط§ظ„طھط·ط¨ظٹظ‚...');
    
    // طھط¹ط±ظٹظپ ط§ظ„ط¹ظ†ط§طµط± DOM ط¨ط¹ط¯ طھط­ظ…ظٹظ„ ط§ظ„طµظپط­ط©
    window.translationList = document.getElementById('translationList');
    window.originalText = document.getElementById('originalText');
    window.translationText = document.getElementById('translationText');
    window.searchInput = document.getElementById('searchInput');
    window.statsText = document.getElementById('statsText');
    window.statusText = document.getElementById('statusText');
    window.progressBar = document.getElementById('progressBar');
    window.fileInput = document.getElementById('fileInput');
    window.notification = document.getElementById('notification');
    window.loadingOverlay = document.getElementById('loadingOverlay');
    window.settingsModal = document.getElementById('settingsModal');
    
    // Update local references
    translationList = window.translationList;
    originalText = window.originalText;
    translationText = window.translationText;
    searchInput = window.searchInput;
    statsText = window.statsText;
    statusText = window.statusText;
    progressBar = window.progressBar;
    fileInput = window.fileInput;
    notification = window.notification;
    loadingOverlay = window.loadingOverlay;
    settingsModal = window.settingsModal;
    
    // ط§ظ„طھط­ظ‚ظ‚ ظ…ظ† ظˆط¬ظˆط¯ ط§ظ„ط¹ظ†ط§طµط± ط§ظ„ط£ط³ط§ط³ظٹط©
    if (!translationList || !originalText || !translationText) {
        console.error('â‌Œ ظپط´ظ„ ظپظٹ ط§ظ„ط¹ط«ظˆط± ط¹ظ„ظ‰ ط§ظ„ط¹ظ†ط§طµط± ط§ظ„ط£ط³ط§ط³ظٹط© ظپظٹ DOM');
        alert('ط®ط·ط£ ظپظٹ طھط­ظ…ظٹظ„ ط§ظ„طµظپط­ط©. ظٹط±ط¬ظ‰ ط¥ط¹ط§ط¯ط© طھط­ظ…ظٹظ„ ط§ظ„طµظپط­ط©.');
        return;
    }
    
    console.log('âœ… طھظ… طھط­ظ…ظٹظ„ ط¬ظ…ظٹط¹ ط¹ظ†ط§طµط± DOM ط¨ظ†ط¬ط§ط­');
    
    // ط¥ط®ظپط§ط، ط´ط§ط´ط© ط§ظ„طھط­ظ…ظٹظ„ ط¹ظ†ط¯ ط¨ط¯ط، ط§ظ„طھط·ط¨ظٹظ‚
    if (typeof hideLoading === 'function') {
        hideLoading();
    }
    
    // Initialize modules
    if (typeof setupEventListeners === 'function') {
        setupEventListeners();
    }
    
    if (typeof setupAutoSave === 'function') {
        setupAutoSave();
    }
    
    if (typeof loadFromLocalStorage === 'function') {
        loadFromLocalStorage();
    }
    
    if (typeof loadApiKeys === 'function') {
        loadApiKeys();
    }
    
    if (typeof updateStats === 'function') {
        updateStats();
    }
    
    if (typeof updateSaveButton === 'function') {
        updateSaveButton();
    }
    
    // ط¥ط®ظپط§ط، ط´ط§ط´ط© ط§ظ„طھط­ظ…ظٹظ„ ظ…ط±ط© ط£ط®ط±ظ‰ ظ„ظ„طھط£ظƒط¯
    setTimeout(() => {
        if (typeof hideLoading === 'function') {
            hideLoading();
        }
    }, 100);
    
    // Safety timeout ظ„ط¶ظ…ط§ظ† ط¥ط®ظپط§ط، ط´ط§ط´ط© ط§ظ„طھط­ظ…ظٹظ„ ظپظٹ ط¬ظ…ظٹط¹ ط§ظ„ط­ط§ظ„ط§طھ
    setTimeout(() => {
        if (loadingOverlay && loadingOverlay.classList.contains('show')) {
            console.warn('âڑ ï¸ڈ ط¥ط®ظپط§ط، ط¥ط¬ط¨ط§ط±ظٹ ظ„ط´ط§ط´ط© ط§ظ„طھط­ظ…ظٹظ„ ط¨ط¹ط¯ safety timeout');
            if (typeof hideLoading === 'function') {
                hideLoading();
            }
        }
    }, 5000); // 5 ط«ظˆط§ظ†ظٹ
    
    console.log('âœ… طھظ… ط¥ظƒظ…ط§ظ„ طھظ‡ظٹط¦ط© ط§ظ„طھط·ط¨ظٹظ‚ ط¨ظ†ط¬ط§ط­');
    
    // ط¥ط´ط¹ط§ط± طھط±ط­ظٹط¨ظٹ ظ„ظ„ظ…ط³طھط®ط¯ظ…ظٹظ† ط§ظ„ط¬ط¯ط¯
    const hasSeenWelcome = localStorage.getItem('paradox_editor_welcome_seen');
    if (!hasSeenWelcome) {
        setTimeout(() => {
            if (typeof showNotification === 'function') {
                showNotification(
                    'ًںژ‰ ظ…ط±ط­ط¨ط§ظ‹ ط¨ظƒ ظپظٹ ظ…ط­ط±ط± ظ†طµظˆطµ ط¨ط§ط±ط§ط¯ظˆظƒط³!\n\n' +
                    'ًں’، ظ†طµط§ط¦ط­ ظ…ظ‡ظ…ط©:\n' +
                    'â€¢ ط§ظپطھط­ ظ…ظ„ظپ YAML ظ„ظ„ط¨ط¯ط،\n' +
                    'â€¢ ط§ظ„طھط¹ط¯ظٹظ„ط§طھ طھظڈط­ظپط¸ طھظ„ظ‚ط§ط¦ظٹط§ظ‹ ظپظٹ ط§ظ„ظ…طھطµظپط­\n' +
                    'â€¢ ط§ط¶ط؛ط· "ط­ظپط¸ ط§ظ„ظ…ظ„ظپ" ظ„طھظ†ط²ظٹظ„ ط§ظ„ظ…ظ„ظپ ط§ظ„ظ…ط­ط¯ط«\n' +
                    'â€¢ ط§ط³طھط®ط¯ظ… "ط¥ط¹ط¯ط§ط¯ط§طھ API" ظ„ظ„طھط±ط¬ظ…ط© ط§ظ„ط¢ظ„ظٹط©\n\n' +
                    'âڑ ï¸ڈ ظ…ظ‡ظ…: ط§ط¶ط؛ط· "ط­ظپط¸ ط§ظ„ظ…ظ„ظپ" ظ‚ط¨ظ„ ط¥ط؛ظ„ط§ظ‚ ط§ظ„ظ…طھطµظپط­!',
                    'info'
                );
            }
            // طھط³ط¬ظٹظ„ ط£ظ† ط§ظ„ظ…ط³طھط®ط¯ظ… ط´ط§ظپ ط§ظ„ط±ط³ط§ظ„ط©
            localStorage.setItem('paradox_editor_welcome_seen', 'true');
        }, 2000); // ط§ظ†طھط¸ط§ط± ط«ط§ظ†ظٹطھظٹظ† ط¨ط¹ط¯ ط§ظ„طھط­ظ…ظٹظ„
    }
});

// Export main functions for global access
function initializeApp() {
    console.log('ًں“± طھظ‡ظٹط¦ط© ط§ظ„طھط·ط¨ظٹظ‚...');
    // This function can be called manually if needed
}

// Make functions available globally
if (typeof window !== 'undefined') {
    window.initializeApp = initializeApp;
} 

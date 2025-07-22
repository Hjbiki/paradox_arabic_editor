// ===========================================
// NOTIFICATIONS SYSTEM - نظام الإشعارات
// ===========================================

// دالة إخفاء الإشعار
function hideNotification() {
    if (notification) {
        notification.classList.remove('show');
        notification.style.pointerEvents = 'none';
        notification.style.zIndex = '-1';
        
        // تنظيف تام بعد انتهاء الـ animation
        setTimeout(() => {
            if (notification) {
                notification.className = 'notification';
                notification.textContent = '';
                notification.style.pointerEvents = '';
                notification.style.zIndex = '';
            }
        }, 300);
        
        console.log('🗑️ تم إخفاء الإشعار');
    }
}

// Utility functions
function showNotification(message, type = 'info') {
    if (!notification) return;
    
    // إزالة timeout سابق
    if (notificationTimeout) {
        clearTimeout(notificationTimeout);
        notificationTimeout = null;
    }
    
    // Clear existing classes
    notification.className = 'notification show';
    
    // إضافة نوع الإشعار
    if (type) {
        notification.classList.add(`notification-${type}`);
    }
    
    // تحويل \n إلى <br> للعرض الصحيح
    const formattedMessage = message.replace(/\n/g, '<br>');
    
    // إضافة زر إغلاق لجميع الإشعارات (حسب طلب المستخدم)
    const isLongMessage = message.length > 80;
    
    notification.innerHTML = `
        <div class="notification-content">
            <div class="notification-text">${formattedMessage}</div>
            <button class="notification-close" onclick="hideNotification()" title="إغلاق">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    if (isLongMessage) {
        notification.classList.add('notification-long');
        // إخفاء تلقائي بعد 60 ثانية للرسائل الطويلة (دقيقة كاملة!)
        notificationTimeout = setTimeout(() => {
            hideNotification();
        }, 60000);
    } else {
        notification.classList.remove('notification-long');
        // إخفاء تلقائي بعد 30 ثانية للرسائل العادية (30 ثانية!)
        notificationTimeout = setTimeout(() => {
            hideNotification();
        }, 30000);
    }
    
    // إعادة النقر للإغلاق أيضاً (بناء على طلب المستخدم)
    notification.onclick = hideNotification;
}

function showLoading() {
    if (loadingOverlay) {
        loadingOverlay.classList.add('show');
        console.log('🔄 عرض شاشة التحميل');
    }
}

function hideLoading() {
    if (loadingOverlay) {
        loadingOverlay.classList.remove('show');
        console.log('✅ تم إخفاء شاشة التحميل');
    }
}

// دالة إضافية لضمان إخفاء شاشة التحميل
function ensureLoadingHidden() {
    if (loadingOverlay && loadingOverlay.classList.contains('show')) {
        hideLoading();
        console.log('🛡️ إخفاء إجباري لشاشة التحميل');
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
        statsMessage = `إجمالي الترجمات: ${total}`;
    } else {
        statsMessage = `عرض ${filtered} من ${total} ترجمة`;
    }
    
    // إضافة عداد التعديلات
    if (modified > 0) {
        statsMessage += ` - تم تعديل: ${modified}`;
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
            statusText.textContent = `الملف: ${filename}`;
        } else {
            statusText.textContent = 'لم يتم تحميل ملف';
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
                saveButton.innerHTML = `<i class="fas fa-save"></i> حفظ الملف (${modifiedCount} تعديل)`;
                saveButton.title = `لديك ${modifiedCount} تعديل غير محفوظ. اضغط لتنزيل الملف المحدث`;
            } else {
                saveButton.innerHTML = '<i class="fas fa-save"></i> حفظ الملف (تعديلات جديدة)';
                saveButton.title = 'لديك تعديلات غير محفوظة. اضغط لتنزيل الملف المحدث';
            }
            saveButton.classList.remove('saved');
            saveButton.classList.add('unsaved');
        } else if (currentFile) {
            // File loaded and saved - green
            saveButton.innerHTML = '<i class="fas fa-save"></i> حفظ الملف';
            saveButton.title = 'تم حفظ جميع التغييرات مؤقتاً. اضغط لتنزيل الملف';
            saveButton.classList.remove('unsaved');
            saveButton.classList.add('saved');
        } else {
            // No file loaded - default red
            saveButton.innerHTML = '<i class="fas fa-save"></i> حفظ الملف';
            saveButton.title = 'لم يتم تحميل ملف بعد. افتح ملفاً أولاً';
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
        console.error('خطأ في حفظ مفاتيح API:', error);
    }
    
    closeSettings();
    showNotification('تم حفظ إعدادات API بنجاح! 🔑', 'success');
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
        console.error('خطأ في تحميل مفاتيح API:', error);
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
    
    // إخفاء شاشة التحميل عند النقر عليها
    if (loadingOverlay) {
        loadingOverlay.addEventListener('click', function() {
            hideLoading();
            console.log('👆 تم إخفاء شاشة التحميل بالنقر');
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
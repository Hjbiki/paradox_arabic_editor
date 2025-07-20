// Global Variables
let translations = {};
let filteredTranslations = {};
let originalTranslations = {};
let englishTranslations = {}; // النصوص الإنجليزية الأصلية
let translationKeys = [];
let currentIndex = 0;
let currentFile = null;
let previewLength = 50;
let hasUnsavedChanges = false;
let currentEditedValue = '';
let modifiedKeys = new Set(); // Track modified translations
let currentEditingKey = ''; // Track the key being edited to avoid index conflicts

// Auto-save to localStorage
let autoSaveInterval;

// DOM Elements
const translationList = document.getElementById('translationList');
const keyDisplay = document.getElementById('keyDisplay');
const originalText = document.getElementById('originalText');
const translationText = document.getElementById('translationText');
const searchInput = document.getElementById('searchInput');
const statsText = document.getElementById('statsText');
const statusText = document.getElementById('statusText');
const progressBar = document.getElementById('progressBar');
const fileInput = document.getElementById('fileInput');
const notification = document.getElementById('notification');
const loadingOverlay = document.getElementById('loadingOverlay');

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
    setupAutoSave();
    loadFromLocalStorage();
    updateStats();
    updateSaveButton(); // Initialize save button state
    

});

// Setup event listeners
function setupEventListeners() {
    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyboardShortcuts);
    
    // Search input - تحسين الأداء ومنع التداخل
    if (searchInput) {
        // استخدام debounce للبحث لتحسين الأداء
        let searchTimeout;
        searchInput.addEventListener('input', function() {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                filterTranslations();
            }, 150); // انتظار 150ms قبل البحث
        });
        
        // منع القفز للنص الرئيسي
        searchInput.addEventListener('keydown', function(e) {
            e.stopPropagation();
            
            // منع مفاتيح التنقل من التأثير على البحث
            if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                e.stopPropagation();
            }
        });
        
        searchInput.addEventListener('focus', function(e) {
            e.stopPropagation();
        });
        
        // ضمان بقاء التركيز في البحث أثناء الكتابة
        searchInput.addEventListener('blur', function(e) {
            // إذا لم يكن المستخدم ينقر على شيء آخر، أعد التركيز
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
    translationText.addEventListener('input', function() {
        const currentValue = translationText.value;
        hasUnsavedChanges = (currentValue !== currentEditedValue);
        
        // Mark current translation as modified using the stored key
        if (hasUnsavedChanges && currentEditingKey) {
            modifiedKeys.add(currentEditingKey);
            
            // Update the translation data immediately
            translations[currentEditingKey] = currentValue;
            filteredTranslations[currentEditingKey] = currentValue;
            
            // Update the current item in the list
            const items = translationList.querySelectorAll('.translation-item');
            if (items[currentIndex]) {
                items[currentIndex].classList.add('modified');
                
                // Update preview in the list
                const preview = currentValue.length > previewLength ? 
                    currentValue.substring(0, previewLength) + '...' : currentValue;
                const previewElement = items[currentIndex].querySelector('.translation-preview');
                if (previewElement) {
                    previewElement.textContent = preview;
                }
            }
            
            updateStats(); // تحديث الإحصائيات
        }
        
        updateSaveButton();
    });
    
    // Prevent default drag and drop behavior
    document.addEventListener('dragover', function(e) {
        e.preventDefault();
    });
    
    document.addEventListener('drop', function(e) {
        e.preventDefault();
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFile(files[0]);
        }
    });
}

// Keyboard shortcuts
function handleKeyboardShortcuts(e) {
    // Ctrl/Cmd + O: Open file
    if ((e.ctrlKey || e.metaKey) && e.key === 'o') {
        e.preventDefault();
        openFile();
    }
    
    // Ctrl/Cmd + S: Save file
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveFile();
    }
    
    // Ctrl/Cmd + F: Focus search
    if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        searchInput.focus();
    }
    
    // Escape: Clear search
    if (e.key === 'Escape') {
        clearSearch();
    }
    
    // Arrow keys: Navigate translations
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        if (e.key === 'ArrowLeft') {
            nextTranslation();
        } else {
            previousTranslation();
        }
    }
}

// File operations
function openFile() {
    fileInput.click();
}

function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
        handleFile(file);
    }
}

function handleFile(file) {
    if (!file.name.endsWith('.yml') && !file.name.endsWith('.yaml')) {
        showNotification('يرجى اختيار ملف YAML صحيح (بامتداد .yml أو .yaml)', 'error');
        return;
    }
    
    showLoading(true);
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const content = e.target.result;
            
            if (!content) {
                throw new Error('الملف فارغ أو تالف');
            }
            
            loadYamlContent(content, file.name);
            currentFile = file;
            showNotification(`تم تحميل الملف بنجاح: ${file.name}`, 'success');
        } catch (error) {
            console.error('خطأ في قراءة الملف:', error);
            showNotification(`خطأ في قراءة الملف "${file.name}": ${error.message}`, 'error');
        } finally {
            showLoading(false);
        }
    };
    
    reader.onerror = function(e) {
        console.error('خطأ في FileReader:', e);
        showNotification(`خطأ في قراءة الملف "${file.name}": فشل في قراءة محتوى الملف`, 'error');
        showLoading(false);
    };
    
    reader.readAsText(file, 'UTF-8');
}

function loadYamlContent(content, filename) {
    try {
        // التحقق من وجود محتوى
        if (!content || content.trim() === '') {
            throw new Error('الملف فارغ أو لا يحتوي على محتوى');
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
                    
                    // التحقق من أن المفتاح ليس فارغاً
                    if (!key) {
                        console.warn(`مفتاح فارغ في السطر ${lineNumber}: ${line}`);
                        continue;
                    }
                    
                    // Extract text between quotes only
                    value = cleanText(value);
                    
                    yamlData[key] = value;
                } catch (lineError) {
                    console.warn(`خطأ في معالجة السطر ${lineNumber}: ${line}`, lineError);
                    continue;
                }
            }
        }
        
        // التحقق من وجود بيانات
        if (Object.keys(yamlData).length === 0) {
            throw new Error('لم يتم العثور على أي ترجمات في الملف. تأكد من أن الملف يحتوي على قسم l_english: مع ترجمات صحيحة');
        }
        
        // Reset unsaved changes first - قبل كل شيء
        hasUnsavedChanges = false;
        modifiedKeys.clear(); // Clear modified keys when loading new file
        currentEditingKey = ''; // Clear current editing key
        
        // Reset English translations - will be loaded from english folder if available
        englishTranslations = {};
        
        // Clear any existing modified classes from DOM
        const existingItems = translationList.querySelectorAll('.translation-item.modified');
        existingItems.forEach(item => {
            item.classList.remove('modified');
        });
        
        translations = yamlData;
        originalTranslations = { ...yamlData };
        filteredTranslations = { ...yamlData };
        translationKeys = Object.keys(yamlData);
        currentIndex = 0;
        
        populateTranslationList();
        updateStats();
        updateStatus(filename);
        
        // Load first translation
        if (translationKeys.length > 0) {
            selectTranslationByIndex(0);
        }
        
        updateSaveButton();
        
        // Save to localStorage
        saveToLocalStorage();
        
        console.log(`تم تحميل ${Object.keys(yamlData).length} ترجمة بنجاح من الملف: ${filename}`);
        
        // محاولة تحميل ملف إنجليزي من مجلد english كمرجع إضافي
        loadEnglishReferenceFile(filename);
        
    } catch (error) {
        console.error('خطأ في تحليل YAML:', error);
        throw new Error(`خطأ في تحليل YAML: ${error.message}`);
    }
}

// تحميل ملف إنجليزي مرجعي من مجلد english (اختياري لمقارنة إضافية)
async function loadEnglishReferenceFile(filename) {
    try {
        // محاولة تحميل الملف من مجلد english
        const englishPath = `english/${filename}`;
        
        console.log(`💡 محاولة تحميل مرجع إنجليزي إضافي من: ${englishPath}`);
        
        const response = await fetch(englishPath);
        
        if (response.ok) {
            const englishContent = await response.text();
            console.log(`📄 تم العثور على مرجع إنجليزي إضافي بطول: ${englishContent.length} حرف`);
            
            if (englishContent && englishContent.trim()) {
                // تحليل المحتوى وإضافته كمرجع إضافي
                const additionalEnglishData = parseYAMLContent(englishContent);
                
                // دمج النصوص الإضافية مع المرجع الحالي
                Object.keys(additionalEnglishData).forEach(key => {
                    if (!englishTranslations[key]) {
                        englishTranslations[key] = additionalEnglishData[key];
                    }
                });
                
                console.log(`✅ تم دمج ${Object.keys(additionalEnglishData).length} نص إنجليزي إضافي`);
                showNotification(`📚 تم تحميل مرجع إنجليزي إضافي من: ${filename}`, 'info');
                
                // تحديث العرض إذا كان هناك ترجمة محددة
                if (currentEditingKey) {
                    selectTranslationByIndex(currentIndex);
                }
            }
        } else {
            console.log(`📄 لا يوجد مرجع إنجليزي إضافي في: ${englishPath}`);
            console.log(`ℹ️ يمكنك وضع الملف الإنجليزي المطابق في مجلد english للمقارنة`);
        }
        
    } catch (error) {
        console.log(`ℹ️ لا يمكن تحميل مرجع إضافي:`, error.message);
        console.log(`✅ سيتم استخدام النص الأصلي من الملف المرفوع كمرجع`);
    }
}

// دالة مساعدة لتحليل محتوى YAML
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
                    value = cleanText(value);
                
                yamlData[key] = value;
            } catch (lineError) {
                continue;
            }
        }
    }
    
    return yamlData;
}



// مقارنة المفاتيح وإيجاد المفاتيح الناقصة
function findMissingKeys() {
    const translationKeysSet = new Set(Object.keys(translations));
    const englishKeysSet = new Set(Object.keys(englishTranslations));
    
    // المفاتيح الموجودة في المرجع الإنجليزي ولكن ناقصة في الملف المحرر
    const missingInTranslation = [...englishKeysSet].filter(key => !translationKeysSet.has(key));
    
    // المفاتيح الموجودة في الملف المحرر ولكن غير موجودة في المرجع
    const extraInTranslation = [...translationKeysSet].filter(key => !englishKeysSet.has(key));
    
    return {
        missingInTranslation,
        extraInTranslation,
        totalEnglish: englishKeysSet.size,
        totalTranslation: translationKeysSet.size
    };
}

function populateTranslationList() {
    translationList.innerHTML = '';
    
    Object.entries(filteredTranslations).forEach(([key, value], index) => {
        const item = document.createElement('div');
        item.className = 'translation-item fade-in';
        item.dataset.index = index;
        
        // Add modified class only if this translation was actually modified
        if (modifiedKeys.has(key)) {
            item.classList.add('modified');
        }
        
        // Show clean preview (extract from quotes)
        let cleanValue = cleanText(value);
        
        const preview = cleanValue.length > previewLength ? 
            cleanValue.substring(0, previewLength) + '...' : cleanValue;
        
        item.innerHTML = `
            <div class="translation-key">${escapeHtml(key)}</div>
            <div class="translation-preview">${escapeHtml(preview)}</div>
        `;
        
        item.addEventListener('click', () => {
            selectTranslationByIndex(index);
        });
        
        translationList.appendChild(item);
    });
}

function selectTranslationByIndex(index) {
    if (index < 0 || index >= translationKeys.length) return;
    
    // If there are unsaved changes in current translation, save them first
    if (hasUnsavedChanges) {
        const currentKey = translationKeys[currentIndex];
        const currentValue = translationText.value.trim();
        
        // Store the clean text (without quotes and tags)
        translations[currentKey] = currentValue;
        filteredTranslations[currentKey] = currentValue;
        
        // Mark as modified
        modifiedKeys.add(currentKey);
        
        // Update the list item
        const items = translationList.querySelectorAll('.translation-item');
        if (items[currentIndex]) {
            // تنظيف النص للمعاينة
            let cleanCurrentValue = cleanText(currentValue);
            
            const preview = cleanCurrentValue.length > previewLength ? 
                cleanCurrentValue.substring(0, previewLength) + '...' : cleanCurrentValue;
            items[currentIndex].querySelector('.translation-preview').textContent = preview;
            items[currentIndex].classList.add('modified');
        }
        
        updateStats(); // تحديث الإحصائيات
        
        // Don't reset hasUnsavedChanges - keep it true until file is saved
        currentEditedValue = currentValue;
    }
    
    currentIndex = index;
    const key = translationKeys[index];
    const value = filteredTranslations[key];
    const originalValue = originalTranslations[key];
    
    // Set the currently editing key
    currentEditingKey = key;
    
    // Update displays
    keyDisplay.textContent = key;
    
    // Show English text if available, otherwise show original value or helpful message
    const englishText = englishTranslations[key];
    
    console.log(`🔄 تحديث العرض للمفتاح: ${key}`);
    console.log(`📁 عدد النصوص الإنجليزية المحملة: ${Object.keys(englishTranslations).length}`);
    console.log(`🎯 النص الإنجليزي للمفتاح الحالي:`, englishText || 'غير موجود');
    
    if (englishText) {
        // استخراج النص من بين علامات التنصيص
        let cleanEnglishText = cleanText(englishText);
        
        originalText.textContent = cleanEnglishText;
        originalText.style.color = '#d4edda'; // لون أخضر فاتح للنص الإنجليزي
        console.log(`✅ عرض النص الإنجليزي المرجعي: "${cleanEnglishText}"`);
    } else {
        // لا يوجد نص مرجعي من مجلد english
        originalText.textContent = `📂 ضع ملف "${currentFile?.name || 'مطابق'}" في مجلد english للمقارنة`;
        originalText.style.color = '#6c757d'; // لون رمادي للرسالة
        console.log(`ℹ️ لا يوجد نص مرجعي للمفتاح: ${key}`);
    }
    
    // Show clean text for editing (extract from quotes)
    let cleanValue = cleanText(value || '');
    
    translationText.value = cleanValue;
    currentEditedValue = cleanValue;
    
    // Check if this translation was modified
    if (modifiedKeys.has(key)) {
        hasUnsavedChanges = true;
    } else {
        hasUnsavedChanges = false;
    }
    updateSaveButton();
    
    // Update selection in list
    const items = translationList.querySelectorAll('.translation-item');
    items.forEach((item, i) => {
        item.classList.toggle('selected', i === index);
    });
    
    // Scroll to selected item
    const selectedItem = translationList.querySelector('.translation-item.selected');
    if (selectedItem) {
        selectedItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    
    // Focus on translation text only if search is not active
    if (document.activeElement !== searchInput) {
        translationText.focus();
    }
}

// Navigation
function nextTranslation() {
    if (currentIndex < translationKeys.length - 1) {
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
    const searchTerm = searchInput.value.toLowerCase();
    
    if (!searchTerm) {
        filteredTranslations = { ...translations };
    } else {
        filteredTranslations = {};
        Object.entries(translations).forEach(([key, value]) => {
            if (key.toLowerCase().includes(searchTerm) || 
                value.toLowerCase().includes(searchTerm)) {
                filteredTranslations[key] = value;
            }
        });
    }
    
    translationKeys = Object.keys(filteredTranslations);
    
    // Try to maintain the current selection if it exists in filtered results
    let newIndex = 0;
    if (currentEditingKey && translationKeys.includes(currentEditingKey)) {
        newIndex = translationKeys.indexOf(currentEditingKey);
    }
    
    currentIndex = newIndex;
    populateTranslationList();
    updateStats();
    
    // Select the appropriate item (maintain current selection or first item)
    if (translationKeys.length > 0) {
        selectTranslationByIndex(currentIndex);
    }
}

function clearSearch() {
    searchInput.value = '';
    filterTranslations();
    
    // ضمان إعادة التركيز للبحث
    setTimeout(() => {
        searchInput.focus();
    }, 100);
}

// Translation operations
function updateTranslation() {
    if (!currentEditingKey) {
        showNotification('يرجى اختيار ترجمة أولاً', 'warning');
        return;
    }
    
    const key = currentEditingKey;
    const newValue = translationText.value.trim();
    
    // Store the clean text (without quotes and tags)
    translations[key] = newValue;
    filteredTranslations[key] = newValue;
    
    // Update the list item
    const items = translationList.querySelectorAll('.translation-item');
    if (items[currentIndex]) {
        const preview = newValue.length > previewLength ? 
            newValue.substring(0, previewLength) + '...' : newValue;
        items[currentIndex].querySelector('.translation-preview').textContent = preview;
    }
    
    // Reset unsaved changes
    hasUnsavedChanges = false;
    currentEditedValue = newValue;
    updateSaveButton();
}

function undoChanges() {
    if (!currentEditingKey) return;
    
    const key = currentEditingKey;
    const originalValue = originalTranslations[key];
    
    // Use the original clean text (extract from quotes)
    let cleanOriginalValue = cleanText(originalValue || '');
    
    translationText.value = cleanOriginalValue;
    currentEditedValue = cleanOriginalValue;
    hasUnsavedChanges = false;
    
    // Update the translation data
    translations[key] = originalValue || '';
    filteredTranslations[key] = originalValue || '';
    
    // Remove from modified keys
    modifiedKeys.delete(key);
    
    // Update the list item
    const items = translationList.querySelectorAll('.translation-item');
    if (items[currentIndex]) {
        items[currentIndex].classList.remove('modified');
        
        // تنظيف النص للمعاينة
        let cleanOriginalValue = cleanText(originalValue || '');
            
        const preview = cleanOriginalValue.length > previewLength ? 
            cleanOriginalValue.substring(0, previewLength) + '...' : cleanOriginalValue;
        const previewElement = items[currentIndex].querySelector('.translation-preview');
        if (previewElement) {
            previewElement.textContent = preview;
        }
    }
    
    updateSaveButton();
    updateStats();
    
    showNotification('تم إعادة تعيين الترجمة', 'info');
}

// Function removed - no longer needed

// Save operations
function saveAllChanges() {
    if (!currentFile) {
        showNotification('يرجى فتح ملف أولاً', 'warning');
        return;
    }
    
    // Save all changes to the current translation
    if (hasUnsavedChanges) {
        const key = translationKeys[currentIndex];
        const newValue = translationText.value.trim();
        
        // Store the clean text (without quotes and tags)
        translations[key] = newValue;
        filteredTranslations[key] = newValue;
        
        // Mark as modified
        modifiedKeys.add(key);
        
        // Update the list item
        const items = translationList.querySelectorAll('.translation-item');
        if (items[currentIndex]) {
            // تنظيف النص للمعاينة
            let cleanNewValue = cleanText(newValue);
            
            const preview = cleanNewValue.length > previewLength ? 
                cleanNewValue.substring(0, previewLength) + '...' : cleanNewValue;
            items[currentIndex].querySelector('.translation-preview').textContent = preview;
            items[currentIndex].classList.add('modified');
        }
        
        updateStats(); // تحديث الإحصائيات
        
        // Reset unsaved changes for current translation
        hasUnsavedChanges = false;
        currentEditedValue = newValue;
    }
    
    saveToFile(currentFile.name);
    
    // Clear all modifications after saving
    modifiedKeys.clear();
    hasUnsavedChanges = false;
    // Note: currentEditingKey is kept as user might continue editing the same translation
    
    // Remove modified class from all items in the DOM
    const allItems = translationList.querySelectorAll('.translation-item.modified');
    allItems.forEach(item => {
        item.classList.remove('modified');
    });
    
    updateSaveButton();
    updateStats(); // تحديث الإحصائيات بعد الحفظ
    
    showNotification('تم حفظ الملف بنجاح!', 'success');
}

function saveFile() {
    if (!currentFile) {
        return saveAsFile();
    }
    
    saveToFile(currentFile.name);
}

function saveAsFile() {
    const filename = prompt('أدخل اسم الملف:', 'translation.yml');
    if (filename) {
        saveToFile(filename);
    }
}

function saveToFile(filename) {
    try {
        // Create YAML content
        let yamlContent = 'l_english:\n';
        
        Object.entries(translations).forEach(([key, value]) => {
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
        
        updateStatus(filename);
        
    } catch (error) {
        showNotification(`خطأ في حفظ الملف: ${error.message}`, 'error');
    }
}

// UI updates
function updateStats() {
    const total = Object.keys(translations).length;
    const filtered = Object.keys(filteredTranslations).length;
    const modified = modifiedKeys.size;
    
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
    
    statsText.textContent = statsMessage;
    
    // Update progress bar
    if (total > 0) {
        const progress = filtered / total;
        progressBar.style.width = (progress * 100) + '%';
    } else {
        progressBar.style.width = '0%';
    }
}

function updateStatus(filename) {
    if (filename) {
        statusText.textContent = `الملف: ${filename}`;
    } else {
        statusText.textContent = 'لم يتم تحميل ملف';
    }
}

// Utility functions
function showNotification(message, type = 'info') {
    notification.textContent = message;
    notification.className = `notification ${type} show`;
    
    // إخفاء الإخطار تلقائياً بعد 4 ثوان
    setTimeout(() => {
        notification.classList.remove('show');
    }, 4000);
    
    // إخفاء فوري عند النقر
    notification.onclick = () => {
        notification.classList.remove('show');
    };
}

function showLoading(show) {
    if (show) {
        loadingOverlay.classList.add('show');
    } else {
        loadingOverlay.classList.remove('show');
    }
}

function updateSaveButton() {
    const saveButton = document.getElementById('saveFileBtn');
    if (saveButton) {
        // Always ensure save-btn class is present
        saveButton.classList.add('save-btn');
        
        if (modifiedKeys.size > 0 || hasUnsavedChanges) {
            // Has unsaved changes - red with pulsing animation
            saveButton.innerHTML = '<i class="fas fa-save"></i> حفظ الملف';
            saveButton.classList.remove('saved');
            saveButton.classList.add('unsaved');
        } else if (currentFile) {
            // File loaded and saved - green
            saveButton.innerHTML = '<i class="fas fa-save"></i> حفظ الملف';
            saveButton.classList.remove('unsaved');
            saveButton.classList.add('saved');
        } else {
            // No file loaded - default red
            saveButton.innerHTML = '<i class="fas fa-save"></i> حفظ الملف';
            saveButton.classList.remove('saved');
            saveButton.classList.add('unsaved');
        }
    }
}

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

// LocalStorage functions
function saveToLocalStorage() {
    try {
        const data = {
            translations: translations,
            englishTranslations: englishTranslations,
            modifiedKeys: Array.from(modifiedKeys),
            currentIndex: currentIndex,
            currentEditingKey: currentEditingKey,
            currentFile: currentFile ? currentFile.name : null,
            timestamp: Date.now()
        };
        localStorage.setItem('arabicTranslationEditor', JSON.stringify(data));
    } catch (error) {
        console.error('Failed to save to localStorage:', error);
    }
}

function loadFromLocalStorage() {
    try {
        const data = localStorage.getItem('arabicTranslationEditor');
        if (data) {
            const parsed = JSON.parse(data);
            
            // Check if data is not too old (less than 24 hours)
            const isRecent = (Date.now() - parsed.timestamp) < (24 * 60 * 60 * 1000);
            
            if (isRecent && parsed.translations && Object.keys(parsed.translations).length > 0) {
                translations = parsed.translations;
                filteredTranslations = { ...translations };
                originalTranslations = { ...translations };
                englishTranslations = parsed.englishTranslations || {};
                translationKeys = Object.keys(translations);
                modifiedKeys = new Set(parsed.modifiedKeys || []);
                currentIndex = parsed.currentIndex || 0;
                currentEditingKey = parsed.currentEditingKey || '';
                
                populateTranslationList();
                updateStats();
                updateSaveButton();
                
                if (translationKeys.length > 0) {
                    selectTranslationByIndex(currentIndex);
                }
                
                showNotification('تم استعادة العمل السابق من الذاكرة المحلية', 'info');
            }
        }
    } catch (error) {
        console.error('Failed to load from localStorage:', error);
    }
}

function setupAutoSave() {
    // Auto-save every 30 seconds
    autoSaveInterval = setInterval(() => {
        if (modifiedKeys.size > 0 || hasUnsavedChanges) {
            saveToLocalStorage();
        }
    }, 30000);
    
    // Save before page unload
    window.addEventListener('beforeunload', () => {
        if (modifiedKeys.size > 0 || hasUnsavedChanges) {
            saveToLocalStorage();
        }
    });
}



// Auto-save functionality (optional)
let autoSaveTimeout;
function setupAutoSave() {
    translationText.addEventListener('input', function() {
        clearTimeout(autoSaveTimeout);
        autoSaveTimeout = setTimeout(() => {
            if (currentIndex < translationKeys.length) {
                updateTranslation();
            }
        }, 2000); // Auto-save after 2 seconds of inactivity
    });
}

// Initialize auto-save
setupAutoSave();

// Export functions for global access
window.openFile = openFile;
window.saveAllChanges = saveAllChanges;
window.saveFile = saveFile;
window.filterTranslations = filterTranslations;
window.clearSearch = clearSearch;
window.nextTranslation = nextTranslation;
window.previousTranslation = previousTranslation;
window.updateTranslation = updateTranslation;
window.undoChanges = undoChanges;
window.changeFontSize = changeFontSize;
window.changeTextAlignment = changeTextAlignment;
window.showDebugInfo = showDebugInfo;
window.showMissingKeys = showMissingKeys;
// Font and alignment controls
function changeFontSize() {
    const fontSize = document.getElementById('fontSize').value;
    const elements = [keyDisplay, originalText, translationText];
    
    elements.forEach(element => {
        if (element) {
            element.style.fontSize = fontSize + 'px';
        }
    });
}

function changeTextAlignment() {
    const alignment = document.getElementById('textAlign').value;
    const elements = [keyDisplay, originalText, translationText];
    
    elements.forEach(element => {
        if (element) {
            element.style.textAlign = alignment;
        }
    });
}

// وظيفة التشخيص لمساعدة المستخدم على فهم حالة النظام
function showDebugInfo() {
    const englishCount = Object.keys(englishTranslations).length;
    const translationCount = Object.keys(translations).length;
    const currentFileName = currentFile ? currentFile.name : 'لا يوجد ملف';
    
    let debugMessage = `🔍 معلومات التشخيص:\n\n`;
    debugMessage += `📄 الملف الحالي: ${currentFileName}\n`;
    debugMessage += `📊 عدد الترجمات المحملة: ${translationCount}\n`;
    debugMessage += `🇬🇧 عدد النصوص الإنجليزية: ${englishCount}\n`;
    debugMessage += `🎯 المفتاح الحالي: ${currentEditingKey || 'لا يوجد'}\n\n`;
    
    if (englishCount > 0) {
        debugMessage += `✅ تم تحميل النصوص الإنجليزية بنجاح!\n`;
        const sampleKeys = Object.keys(englishTranslations).slice(0, 3);
        debugMessage += `📋 عينة من المفاتيح: ${sampleKeys.join(', ')}\n\n`;
        
        if (currentEditingKey && englishTranslations[currentEditingKey]) {
            debugMessage += `✅ المفتاح الحالي موجود في الملف الإنجليزي\n`;
            debugMessage += `📝 النص: "${englishTranslations[currentEditingKey]}"`;
        } else if (currentEditingKey) {
            debugMessage += `⚠️ المفتاح الحالي غير موجود في الملف الإنجليزي`;
        }
    } else {
        debugMessage += `ℹ️ لا يوجد نص مرجعي إنجليزي\n\n`;
        debugMessage += `💡 كيف يعمل النظام:\n`;
        debugMessage += `• ارفع أي ملف تريد تعديله\n`;
        debugMessage += `• ضع الملف الإنجليزي المطابق في مجلد english للمقارنة\n`;
        debugMessage += `• عدّل النصوص كما تشاء\n`;
        debugMessage += `• احفظ الملف المُحدث`;
    }
    
    // عرض المعلومات في نافذة منبثقة
    alert(debugMessage);
    
    // طباعة معلومات إضافية في الكونسول
    console.log('🔍 تشخيص مفصل:');
    console.log('الملف الحالي:', currentFile);
    console.log('الترجمات:', translations);
    console.log('النصوص الإنجليزية:', englishTranslations);
    console.log('المفتاح الحالي:', currentEditingKey);
}

// عرض المفاتيح الناقصة والإضافية
function showMissingKeys() {
    if (Object.keys(englishTranslations).length === 0) {
        alert('⚠️ لا يوجد مرجع إنجليزي لمقارنته!\n\nتأكد من:\n• وجود ملف مطابق في مجلد english\n• نفس اسم الملف المرفوع');
        return;
    }
    
    const comparison = findMissingKeys();
    
    let message = `📊 تحليل المفاتيح:\n\n`;
    message += `📁 المرجع الإنجليزي: ${comparison.totalEnglish} مفتاح\n`;
    message += `📝 ملفك: ${comparison.totalTranslation} مفتاح\n\n`;
    
    if (comparison.missingInTranslation.length > 0) {
        message += `❌ مفاتيح ناقصة في ملفك (${comparison.missingInTranslation.length}):\n`;
        comparison.missingInTranslation.slice(0, 10).forEach(key => {
            message += `• ${key}\n`;
        });
        
        if (comparison.missingInTranslation.length > 10) {
            message += `... و ${comparison.missingInTranslation.length - 10} مفتاح آخر\n`;
        }
        message += `\n`;
    }
    
    if (comparison.extraInTranslation.length > 0) {
        message += `➕ مفاتيح إضافية في ملفك (${comparison.extraInTranslation.length}):\n`;
        comparison.extraInTranslation.slice(0, 5).forEach(key => {
            message += `• ${key}\n`;
        });
        
        if (comparison.extraInTranslation.length > 5) {
            message += `... و ${comparison.extraInTranslation.length - 5} مفتاح آخر\n`;
        }
        message += `\n`;
    }
    
    if (comparison.missingInTranslation.length === 0 && comparison.extraInTranslation.length === 0) {
        message += `✅ ممتاز! جميع المفاتيح متطابقة مع المرجع الإنجليزي`;
    } else {
        message += `💡 هل تريد إضافة المفاتيح الناقصة تلقائياً؟`;
    }
    
    const addMissing = comparison.missingInTranslation.length > 0 && 
                     confirm(message + '\n\nاضغط "موافق" لإضافة المفاتيح الناقصة تلقائياً');
    
    if (addMissing) {
        addMissingKeysToTranslation(comparison.missingInTranslation);
    } else {
        alert(message);
    }
}

// إضافة المفاتيح الناقصة للملف
function addMissingKeysToTranslation(missingKeys) {
    let addedCount = 0;
    
    missingKeys.forEach(key => {
        if (englishTranslations[key]) {
            // أضف المفتاح مع النص الإنجليزي الأصلي
            translations[key] = englishTranslations[key];
            filteredTranslations[key] = englishTranslations[key];
            
            // أضف إلى النصوص الأصلية أيضاً
            originalTranslations[key] = englishTranslations[key];
            
            addedCount++;
        }
    });
    
    if (addedCount > 0) {
        // تحديث قائمة المفاتيح
        translationKeys = Object.keys(translations);
        
        // إعادة عرض القائمة
        populateTranslationList();
        updateStats();
        
        showNotification(`✅ تم إضافة ${addedCount} مفتاح جديد من المرجع الإنجليزي!`, 'success');
        
        // حفظ في localStorage
        saveToLocalStorage();
        
        console.log(`تم إضافة ${addedCount} مفتاح ناقص من المرجع الإنجليزي`);
    } else {
        showNotification(`⚠️ لم يتم إضافة أي مفاتيح`, 'warning');
    }
}
 
// ===========================================
// LOCALSTORAGE OPERATIONS - عمليات التخزين المحلي
// ===========================================

// LocalStorage functions
function saveToLocalStorage() {
    try {
        const dataToSave = {
            translations: translations || {},
            originalTranslations: originalTranslations || {}, // إضافة النصوص الأصلية
            modifiedKeys: Array.from(modifiedKeys || []),
            currentIndex: currentIndex || 0,
            currentEditingKey: currentEditingKey || '',  // حفظ المفتاح المُعدل حالياً
            currentEditedValue: currentEditedValue || '', // حفظ النص المُعدل حالياً
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
        console.log('💾 تم حفظ البيانات في localStorage:', {
            translations: Object.keys(translations || {}).length,
            english: Object.keys(englishTranslations || {}).length,  // إضافة معلومات النصوص الإنجليزية
            modified: (modifiedKeys && modifiedKeys.size) || 0,
            currentFile: currentFile ? (currentFile.name || currentFile) : 'none',
            currentEditingKey: currentEditingKey || 'none',
            hasCurrentEdit: !!(currentEditedValue && currentEditingKey),
            timestamp: new Date(dataToSave.timestamp).toLocaleString('ar-SA')
        });
        
    } catch (error) {
        console.error('❌ خطأ في حفظ البيانات:', error);
    }
}

function loadFromLocalStorage() {
    try {
        // محاولة تحميل البيانات الجديدة أولاً
        let savedData = localStorage.getItem('paradox_translations');
        
        // إذا لم توجد، جرب النسخة القديمة
        if (!savedData) {
            savedData = localStorage.getItem('arabicTranslationEditor');
        }
        
        if (savedData) {
            const data = JSON.parse(savedData);
            
            // استرجاع الترجمات
            if (data.translations && typeof data.translations === 'object') {
                translations = data.translations;
                
                // استرجاع النصوص الأصلية إذا كانت محفوظة، وإلا استخدم copy من الترجمات
                if (data.originalTranslations && typeof data.originalTranslations === 'object') {
                    originalTranslations = { ...data.originalTranslations };
                    console.log('✅ تم استرجاع النصوص الأصلية من localStorage');
                } else {
                    // للتوافق مع النسخ القديمة - لكن مع تحذير
                    originalTranslations = { ...data.translations };
                    console.warn('⚠️ لم توجد نصوص أصلية محفوظة - استخدام نسخة من الترجمات الحالية');
                }
                
                translationKeys = Object.keys(data.translations);
                filteredTranslations = { ...data.translations };
                
                // تحديث المتغيرات العامة
                window.translations = translations;
                window.originalTranslations = originalTranslations;
                window.translationKeys = translationKeys;
                window.filteredTranslations = filteredTranslations;
            }
            
            // استرجاع الترجمات الإنجليزية
            if (data.englishTranslations && typeof data.englishTranslations === 'object') {
                englishTranslations = data.englishTranslations;
                window.englishTranslations = englishTranslations;
            }
            
            // استرجاع التعديلات
            if (data.modifiedKeys && Array.isArray(data.modifiedKeys)) {
                modifiedKeys = new Set(data.modifiedKeys);
                window.modifiedKeys = modifiedKeys;
            }
            
            // استرجاع الفهرس الحالي
            if (typeof data.currentIndex === 'number') {
                currentIndex = data.currentIndex;
                window.currentIndex = currentIndex;
            }
            
            // استرجاع المفتاح والنص المُعدل حالياً
            if (typeof data.currentEditingKey === 'string') {
                currentEditingKey = data.currentEditingKey;
                window.currentEditingKey = currentEditingKey;
            }
            
            if (typeof data.currentEditedValue === 'string') {
                // التحقق من أن النص المُعدل من نفس الملف
                const savedFileName = data.currentFile ? (data.currentFile.name || data.currentFile) : '';
                const currentFileName = currentFile ? (currentFile.name || currentFile) : '';
                
                if (savedFileName && currentFileName && savedFileName === currentFileName) {
                    currentEditedValue = data.currentEditedValue;
                    window.currentEditedValue = currentEditedValue;
                    console.log(`✅ تم استرجاع النص المُعدل من نفس الملف: ${currentFileName}`);
                } else {
                    currentEditedValue = '';
                    window.currentEditedValue = '';
                    console.log(`🗑️ تم تجاهل النص المُعدل من ملف مختلف (محفوظ: ${savedFileName}, حالي: ${currentFileName})`);
                }
            }
            
            // استرجاع معلومات الملف المهمة!
            if (data.currentFile) {
                if (typeof data.currentFile === 'string') {
                    // نسخة قديمة - اسم الملف فقط
                    currentFile = { name: data.currentFile };
                } else if (data.currentFile.name) {
                    // نسخة جديدة - معلومات كاملة
                    currentFile = {
                        name: data.currentFile.name,
                        lastModified: data.currentFile.lastModified || Date.now(),
                        size: data.currentFile.size || 0
                    };
                }
                window.currentFile = currentFile;
                
                // تحديث حالة الواجهة
                if (typeof updateStatus === 'function') {
                    updateStatus(currentFile.name || currentFile);
                }
            }
            
            // استرجاع حالة التغييرات
            if (typeof data.hasUnsavedChanges === 'boolean') {
                hasUnsavedChanges = data.hasUnsavedChanges;
                window.hasUnsavedChanges = hasUnsavedChanges;
            }
            
            console.log('📂 تم استرجاع البيانات من localStorage:', {
                translations: Object.keys(translations).length,
                english: Object.keys(englishTranslations).length,
                modified: modifiedKeys.size,
                currentFile: currentFile ? (currentFile.name || currentFile) : 'none',
                index: currentIndex,
                timestamp: data.timestamp ? new Date(data.timestamp).toLocaleString('ar-SA') : 'قديم'
            });
            
            // تحديث الواجهة
            if (typeof populateTranslationList === 'function') {
                populateTranslationList();
            }
            if (typeof updateStats === 'function') {
                updateStats();
            }
            if (typeof updateSaveButton === 'function') {
                updateSaveButton();
            }
            
            // إذا كان في ملف وترجمات، اختر الترجمة الحالية
            if (currentFile && translationKeys.length > 0 && typeof selectTranslationByIndex === 'function') {
                selectTranslationByIndex(currentIndex);
            }
            
            // إشعار نجاح الاسترجاع
            if (currentFile && translations && Object.keys(translations).length > 0) {
                if (typeof showNotification === 'function') {
                    showNotification(
                        `🔄 تم استرجاع عملك السابق!\n\n` +
                        `📁 الملف: ${currentFile.name || currentFile}\n` +
                        `📝 الترجمات: ${Object.keys(translations).length}\n` +
                        `✏️ التعديلات: ${modifiedKeys.size}\n\n` +
                        `💡 يمكنك متابعة العمل من حيث توقفت!`,
                        'success'
                    );
                }
            }
            
            return true;
        }
        
        console.log('📝 لا توجد بيانات محفوظة في localStorage');
        return false;
        
    } catch (error) {
        console.error('❌ خطأ في تحميل البيانات من localStorage:', error);
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
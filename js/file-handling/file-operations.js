// ===========================================
// FILE OPERATIONS - عمليات الملفات
// ===========================================

// Translation operations
function updateTranslation() {
    if (!currentEditingKey) {
        if (typeof showNotification === 'function') {
            showNotification('يرجى اختيار ترجمة أولاً', 'warning');
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
        console.log('❌ لا يوجد مفتاح محدد للإرجاع');
        return;
    }
    
    // استرجاع النص الأصلي
    const originalValue = originalTranslations && originalTranslations[key] ? originalTranslations[key] : '';
    
    console.log(`🔄 إرجاع المفتاح "${key}" للنص الأصلي:`);
    console.log(`📝 النص الحالي: "${translations[key] || ''}"`);
    console.log(`📝 النص الأصلي: "${originalValue}"`);
    
    // تحديث النص في جميع الكائنات
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
    
    // إزالة المفتاح من قائمة المُعدلة
    if (modifiedKeys) {
        modifiedKeys.delete(key);
    }
    if (window.modifiedKeys) {
        window.modifiedKeys.delete(key);
    }
    
    // تحديث المتغيرات المؤقتة
    window.currentEditedValue = originalValue;
    currentEditedValue = originalValue;
    window.hasUnsavedChanges = false;
    hasUnsavedChanges = false;
    
    console.log(`✅ تم إرجاع المفتاح "${key}" للنص الأصلي`);
    
    // تحديث عنصر النص في الواجهة
    if (translationText) {
        translationText.value = originalValue;
        
        // تحديث عنصر القائمة
        if (translationList) {
            const items = translationList.querySelectorAll('.translation-item');
            if (items[currentIndex]) {
                items[currentIndex].classList.remove('modified');
                
                // تحديث المعاينة في القائمة
                const preview = originalValue.length > (previewLength || 50) ? 
                    originalValue.substring(0, (previewLength || 50)) + '...' : originalValue;
                const previewElement = items[currentIndex].querySelector('.translation-preview');
                if (previewElement) {
                    previewElement.textContent = preview;
                }
            }
        }
        
        // تحديث blocks mode إذا كان مفعلاً
        const container = translationText.parentNode;
        if (container) {
            const blocksEditor = container.querySelector('.blocks-editor');
            if (blocksEditor && blocksEditor.style.display !== 'none') {
                setTimeout(() => {
                    if (typeof refreshBlocks === 'function') {
                        refreshBlocks(blocksEditor, translationText);
                    }
                    console.log('✅ تم تحديث البلوكات بعد إعادة التعيين');
                }, 50);
            }
        }
    }
    
    // تحديث النص المرجعي إذا كان متوفراً
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
        showNotification('تم إعادة تعيين الترجمة إلى القيمة الأصلية', 'success');
    }
    console.log('✅ تم إعادة تعيين الترجمة بنجاح');
}

// Save operations
function saveAllChanges() {
    if (!currentFile) {
        if (typeof showNotification === 'function') {
            showNotification('يرجى فتح ملف أولاً', 'warning');
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
                // تنظيف النص للمعاينة
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
        showNotification('تم حفظ الملف بنجاح!', 'success');
    }
}

function saveFile() {
    if (!currentFile) {
        if (typeof showNotification === 'function') {
            showNotification('يرجى تحميل ملف أولاً قبل الحفظ', 'warning');
        }
        return;
    }
    
    // تحقق من أن هذا أول حفظ للمستخدم
    const hasSeenSaveExplanation = localStorage.getItem('paradox_editor_save_explained');
    
    if (typeof showNotification === 'function') {
        if (!hasSeenSaveExplanation) {
            // رسالة توضيحية لأول مرة
            showNotification(
                '💾 معلومات مهمة عن الحفظ:\n\n' +
                '🔄 التخزين التلقائي: يحفظ عملك في المتصفح فقط\n' +
                '📁 حفظ الملف: ينزل الملف المحدث على جهازك\n\n' +
                '✅ الآن سيتم تنزيل الملف المحدث...',
                'info'
            );
            localStorage.setItem('paradox_editor_save_explained', 'true');
            
            // انتظار قليل قبل الحفظ ليقرأ المستخدم الرسالة
            setTimeout(() => {
                saveToFile(currentFile);
            }, 3000);
        } else {
            // حفظ عادي
            showNotification('جاري حفظ الملف...', 'info');
            saveToFile(currentFile);
        }
    } else {
        saveToFile(currentFile);
    }
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
        
        // إعادة تعيين حالة التعديلات
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
        
        // رسالة نجاح واضحة
        if (typeof showNotification === 'function') {
            const downloadName = filename.endsWith('.yml') ? filename : filename + '.yml';
            showNotification(
                `✅ تم حفظ الملف بنجاح!\n\n` +
                `📁 اسم الملف: ${downloadName}\n` +
                `📍 تم تنزيله في مجلد Downloads\n` +
                `💾 جميع التعديلات محفوظة في الملف`,
                'success'
            );
        }
        
        console.log(`✅ تم حفظ الملف بنجاح: ${filename}`);
        
    } catch (error) {
        if (typeof showNotification === 'function') {
            showNotification(`خطأ في حفظ الملف: ${error.message}`, 'error');
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
// ===========================================
// UI CONTROLS - عناصر التحكم في الواجهة
// ===========================================

// Setup event listeners
function setupEventListeners() {
    // تحذير عند مغادرة الصفحة بدون حفظ
    window.addEventListener('beforeunload', function(e) {
        const hasModifications = (modifiedKeys && modifiedKeys.size > 0) || hasUnsavedChanges;
        if (hasModifications) {
            e.preventDefault();
            const message = 'لديك تعديلات غير محفوظة! هل أنت متأكد من المغادرة؟';
            e.returnValue = message; // For Chrome
            return message; // For other browsers
        }
    });
    
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
    if (translationText) {
        translationText.addEventListener('input', function() {
            const currentValue = translationText.value;
            const currentKey = translationKeys[currentIndex];
            
            if (!currentKey) return;
            
            // حفظ النص المُعدل حالياً
            window.currentEditedValue = currentValue;
            currentEditedValue = currentValue;
            window.currentEditingKey = currentKey;
            currentEditingKey = currentKey;
            
            // المقارنة مع النص الأصلي من translations (هذا هو الإصلاح!)
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
                
                console.log(`✏️ تم تعديل المفتاح: ${currentKey}`);
                console.log(`📝 النص الأصلي: "${originalValue}"`);
                console.log(`📝 النص الجديد: "${currentValue}"`);
            } else {
                // إزالة من المفاتيح المُعدلة إذا عاد للنص الأصلي
                if (modifiedKeys) {
                    modifiedKeys.delete(currentKey);
                }
                if (window.modifiedKeys) {
                    window.modifiedKeys.delete(currentKey);
                }
                console.log(`↩️ تم إرجاع المفتاح للأصل: ${currentKey}`);
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
                updateStats(); // تحديث الإحصائيات
            }
            
            // إذا كان هناك blocks editor مفعل، حدثه
            const container = translationText.parentNode;
            const blocksEditor = container.querySelector('.blocks-editor');
            if (blocksEditor && blocksEditor.style.display !== 'none') {
                if (window.debugBlocks) console.log('📝 تم تغيير النص - سيتم تحديث البلوكات');
                clearTimeout(translationText.blocksUpdateTimeout);
                translationText.blocksUpdateTimeout = setTimeout(() => {
                    if (typeof refreshBlocks === 'function') {
                        refreshBlocks(blocksEditor, translationText);
                    }
                }, 100); // تقليل التأخير لتحديث أسرع
            }
            
            if (typeof updateSaveButton === 'function') {
                updateSaveButton();
            }
            
            // حفظ سريع للنص المُعدل في localStorage
            if (typeof saveToLocalStorage === 'function') {
                clearTimeout(window.autoSaveQuickTimeout);
                window.autoSaveQuickTimeout = setTimeout(() => {
                    saveToLocalStorage();
                }, 2000); // حفظ سريع كل ثانيتين
            }
        });
        
        translationText.addEventListener('blur', function() {
            // حفظ فوري عند فقدان التركيز
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
    
    // File input change listener
    fileInput.addEventListener('change', handleFile);
    
    // English file input and button
    const englishFileInput = document.getElementById('englishFileInput');
    const loadEnglishBtn = document.getElementById('loadEnglishBtn');
    
    if (loadEnglishBtn && englishFileInput) {
        loadEnglishBtn.addEventListener('click', function() {
            englishFileInput.click();
        });
        
        englishFileInput.addEventListener('change', function(event) {
            const file = event.target.files[0];
            if (!file) return;
            
            if (typeof showNotification === 'function') {
                showNotification(`📁 جاري قراءة الملف المرجعي: ${file.name}`, 'info');
            }
            
            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    const content = e.target.result;
                    
                    // Parse the English file
                    if (typeof parseYAMLContent === 'function') {
                        const englishData = parseYAMLContent(content);
                        
                        if (englishData && Object.keys(englishData).length > 0) {
                            // Update English translations
                            if (!englishTranslations) {
                                englishTranslations = {};
                                window.englishTranslations = {};
                            }
                            
                            // Merge with existing
                            Object.assign(englishTranslations, englishData);
                            Object.assign(window.englishTranslations, englishData);
                            
                            // Save to localStorage
                            if (typeof saveToLocalStorage === 'function') {
                                saveToLocalStorage();
                            }
                            
                            // Refresh current view
                            if (typeof selectTranslationByIndex === 'function') {
                                selectTranslationByIndex(currentIndex);
                            }
                            
                            if (typeof showNotification === 'function') {
                                showNotification(
                                    `✅ تم تحميل الملف المرجعي بنجاح!\n\n` +
                                    `📁 الملف: ${file.name}\n` +
                                    `📊 النصوص: ${Object.keys(englishData).length}\n` +
                                    `✅ المرجع الآن متاح للمقارنة`,
                                    'success'
                                );
                            }
                            
                            console.log(`✅ تم تحميل الملف المرجعي: ${file.name} (${Object.keys(englishData).length} نص)`);
                        } else {
                            if (typeof showNotification === 'function') {
                                showNotification('❌ الملف فارغ أو لا يحتوي على نصوص صالحة', 'error');
                            }
                        }
                    } else {
                        if (typeof showNotification === 'function') {
                            showNotification('❌ خطأ في تحليل الملف', 'error');
                        }
                    }
                } catch (error) {
                    console.error('خطأ في قراءة الملف المرجعي:', error);
                    if (typeof showNotification === 'function') {
                        showNotification(`❌ خطأ في قراءة الملف: ${error.message}`, 'error');
                    }
                }
            };
            
            reader.onerror = function() {
                if (typeof showNotification === 'function') {
                    showNotification('❌ خطأ في قراءة الملف', 'error');
                }
            };
            
            reader.readAsText(file, 'utf-8');
        });
    }
    
    // File button click listener  
    const fileButton = document.getElementById('fileButton');
    if (fileButton) {
        fileButton.addEventListener('click', function() {
            if (fileInput) {
                fileInput.click();
            }
        });
    }
    
    // API Settings button
    const apiSettingsBtn = document.getElementById('apiSettingsBtn');
    if (apiSettingsBtn) {
        apiSettingsBtn.addEventListener('click', function() {
            if (typeof openSettings === 'function') {
                openSettings();
            }
        });
    }
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
    
    // Shift+Enter to insert newline في مكان المؤشر
    if (e.shiftKey && e.key === 'Enter') {
        e.preventDefault();
        if (typeof insertNewline === 'function') {
            insertNewline();
        }
        if (typeof showNotification === 'function') {
            showNotification('تم إضافة سطر جديد في مكان الكتابة ↵', 'success');
        }
    }
}

function populateTranslationList() {
    if (!translationList) {
        console.warn('⚠️ translationList غير موجود');
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
    
    // حفظ النص الحالي المعروض قبل الانتقال (تحسين مهم!)
    if (translationText && currentIndex >= 0 && currentIndex < translationKeys.length) {
        const currentKey = translationKeys[currentIndex];
        const currentDisplayedValue = translationText.value.trim();
        
        // التحقق من وجود تعديل بمقارنة النص المعروض مع النص الأصلي
        const originalValue = originalTranslations && originalTranslations[currentKey] ? 
                             originalTranslations[currentKey].replace(/"/g, '').trim() : '';
        
        const hasActualChanges = (currentDisplayedValue !== originalValue);
        
        // التحقق الإضافي: أن المفتاح موجود فعلاً في الملف الحالي
        const keyExistsInCurrentFile = translations && translations.hasOwnProperty(currentKey);
        
        if (hasActualChanges && currentKey && keyExistsInCurrentFile) {
            console.log(`💾 حفظ النص المُعدل قبل الانتقال: ${currentKey}`);
            console.log(`📝 النص الأصلي: "${originalValue}"`);
            console.log(`📝 النص المُعدل: "${currentDisplayedValue}"`);
            
            // حفظ النص في جميع المواقع
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
            
            // تسجيل كمفتاح مُعدل
            if (modifiedKeys) {
                modifiedKeys.add(currentKey);
            }
            if (window.modifiedKeys) {
                window.modifiedKeys.add(currentKey);
            }
            
            // تحديث الحالة
            window.hasUnsavedChanges = true;
            hasUnsavedChanges = true;
            
            // حفظ سريع في localStorage
            if (typeof saveToLocalStorage === 'function') {
                setTimeout(() => saveToLocalStorage(), 100);
            }
        } else if (!keyExistsInCurrentFile && currentKey) {
            console.log(`🚫 تم تجاهل حفظ النص - المفتاح "${currentKey}" غير موجود في الملف الحالي`);
        }
    }
    
    // If there are unsaved changes in current translation, save them first (الكود الأصلي)
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
                // تنظيف النص للمعاينة
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
            updateStats(); // تحديث الإحصائيات
        }
        
        // Don't reset hasUnsavedChanges - keep it true until file is saved
        window.currentEditedValue = currentValue;
        currentEditedValue = currentValue;
    }
    
    window.currentIndex = index;
    currentIndex = index;
    
    const key = translationKeys[index];
    
    // استخدام النص الأصلي أولاً، ثم التحقق من وجود تعديلات
    let value = originalTranslations ? originalTranslations[key] : '';
    
    // إذا كان المفتاح مُعدل، استخدم النص المُعدل من translations
    if (modifiedKeys && modifiedKeys.has(key) && translations && translations[key]) {
        value = translations[key];
        console.log(`🔄 المفتاح "${key}" مُعدل - استخدام النص المُعدل`);
    } else {
        console.log(`📝 المفتاح "${key}" أصلي - استخدام النص الأصلي`);
    }
    
    const originalValue = originalTranslations ? originalTranslations[key] : '';
    
    // Set the currently editing key
    window.currentEditingKey = key;
    currentEditingKey = key;
    
    // Update displays
    // Show English text if available, otherwise show original value or helpful message
    const englishText = englishTranslations ? englishTranslations[key] : '';
    
    console.log(`🔄 تحديث العرض للمفتاح: ${key}`);
    console.log(`📁 عدد النصوص الإنجليزية المحملة: ${Object.keys(englishTranslations || {}).length}`);
    console.log(`🎯 النص الإنجليزي للمفتاح الحالي:`, englishText || 'غير موجود');
    
    // Show clean text for editing (extract from quotes) - تعريف cleanValue أولاً
    let cleanValue = '';
    if (typeof cleanText === 'function') {
        cleanValue = cleanText(value || '');
    } else {
        cleanValue = (value || '').replace(/#NT!/g, '').replace(/#[A-Z0-9]+!/g, '').replace(/"/g, '').trim();
    }
    
    if (englishText) {
        // استخراج النص من بين علامات التنصيص
        let cleanEnglishText = '';
        if (typeof cleanText === 'function') {
            cleanEnglishText = cleanText(englishText);
        } else {
            cleanEnglishText = englishText.replace(/#NT!/g, '').replace(/#[A-Z0-9]+!/g, '').replace(/"/g, '').trim();
        }
        
        // عرض النص المرجعي مع البلوكات إذا كان وضع البلوكات مفعل
        if (typeof updateOriginalTextDisplay === 'function') {
            updateOriginalTextDisplay(cleanEnglishText, cleanValue);
        }
        
        console.log(`✅ عرض النص الإنجليزي المرجعي: "${cleanEnglishText}"`);
    } else {
        // لا يوجد نص مرجعي من مجلد english
        if (originalText) {
            originalText.innerHTML = ''; // مسح أي محتوى سابق
            originalText.textContent = `📂 ضع ملف "${currentFile?.name || 'مطابق'}" في مجلد english للمقارنة`;
            originalText.style.color = '#6c757d'; // لون رمادي للرسالة
        }
        console.log(`ℹ️ لا يوجد نص مرجعي للمفتاح: ${key}`);
    }
    
    if (translationText) {
        // تحديث المتغيرات أولاً
        window.currentEditingKey = key;
        currentEditingKey = key;
        
        // استخدام النص (الأصلي أو المُعدل حسب ما تم تحديده أعلاه)
        translationText.value = cleanValue;
        window.currentEditedValue = cleanValue;
        currentEditedValue = cleanValue;
        
        console.log(`📝 تم عرض النص للمفتاح "${key}": "${cleanValue}"`);
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
    
    // تحديث البلوكات إذا كانت مفعلة وفحص البلوكات المفقودة
    if (translationText) {
        const container = translationText.parentNode;
        const blocksEditor = container.querySelector('.blocks-editor');
        if (blocksEditor && blocksEditor.style.display !== 'none') {
            if (window.debugBlocks) console.log('🔄 تحديث البلوكات للترجمة الجديدة:', key);
            setTimeout(() => {
                if (typeof refreshBlocks === 'function') {
                    refreshBlocks(blocksEditor, translationText);
                }
            }, 50);
        }
    }
    
    // فحص البلوكات المفقودة حتى بدون وضع البلوكات (للإحصائيات)
    if (englishTranslations && englishTranslations[key]) {
        setTimeout(() => {
            if (typeof findMissingBlocks === 'function') {
                const missingBlocks = findMissingBlocks(englishTranslations[key], cleanValue);
                if (missingBlocks.length > 0 && window.debugBlocks) {
                    console.info(`📊 البلوكات المفقودة في "${key}":`, missingBlocks);
                }
            }
        }, 100);
    }
    
    // تحديث تلوين مفاتيح الترجمة
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
    
    // إنشاء مجموعة البيانات الحالية (أصلية + تعديلات)
    const currentTranslations = { ...originalTranslations };
    
    // دمج التعديلات الحالية
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
    
    console.log(`🔍 فلترة الترجمات: ${Object.keys(filteredTranslations).length} من ${Object.keys(currentTranslations).length}`);
    
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
        
        // ضمان إعادة التركيز للبحث
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
    
    // تطبيق حجم الخط على blocks editor إذا كان مفعلاً
    if (translationText) {
        const container = translationText.parentNode;
        const blocksEditor = container.querySelector('.blocks-editor');
        if (blocksEditor) {
            blocksEditor.style.fontSize = fontSize + 'px';
            console.log(`🎯 تم تطبيق حجم الخط ${fontSize}px على وضع البلوكات`);
        }
    }
    
    console.log(`📝 تم تطبيق حجم الخط: ${fontSize}px`);
    if (typeof showNotification === 'function') {
        showNotification(`تم تغيير حجم الخط إلى ${fontSize}px`, 'info');
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
    
    // تطبيق المحاذاة على blocks editor إذا كان مفعلاً
    if (translationText) {
        const container = translationText.parentNode;
        const blocksEditor = container.querySelector('.blocks-editor');
        if (blocksEditor) {
            blocksEditor.style.textAlign = alignment;
            console.log(`🎯 تم تطبيق المحاذاة ${alignment} على وضع البلوكات`);
        }
    }
    
    console.log(`📝 تم تطبيق المحاذاة: ${alignment}`);
}

// Copy to Clipboard Function
async function copyToClipboard(elementId) {
    try {
        const element = document.getElementById(elementId);
        if (!element) {
            if (typeof showNotification === 'function') {
                showNotification('العنصر غير موجود', 'error');
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
                showNotification('لا يوجد نص للنسخ', 'warning');
            }
            return;
        }
        
        await navigator.clipboard.writeText(textToCopy);
        if (typeof showNotification === 'function') {
            showNotification('تم نسخ النص بنجاح! 📋', 'success');
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
        console.error('خطأ في النسخ:', error);
        if (typeof showNotification === 'function') {
            showNotification('فشل في نسخ النص', 'error');
        }
    }
}

// وظيفة التشخيص لمساعدة المستخدم على فهم حالة النظام
function showDebugInfo() {
    const englishCount = Object.keys(englishTranslations || {}).length;
    const translationCount = Object.keys(translations || {}).length;
    const currentFileName = currentFile ? currentFile.name : 'لا يوجد ملف';
    
    let debugMessage = `🔍 معلومات التشخيص:\n\n`;
    debugMessage += `📄 الملف الحالي: ${currentFileName}\n`;
    debugMessage += `📊 عدد الترجمات المحملة: ${translationCount}\n`;
    debugMessage += `🇬🇧 عدد النصوص الإنجليزية: ${englishCount}\n`;
    debugMessage += `🎯 المفتاح الحالي: ${currentEditingKey || 'لا يوجد'}\n\n`;
    
    if (englishCount > 0) {
        debugMessage += `✅ تم تحميل النصوص الإنجليزية بنجاح!\n`;
        const sampleKeys = Object.keys(englishTranslations || {}).slice(0, 3);
        debugMessage += `📋 عينة من المفاتيح: ${sampleKeys.join(', ')}\n\n`;
        
        if (currentEditingKey && englishTranslations && englishTranslations[currentEditingKey]) {
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
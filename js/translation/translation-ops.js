// ===========================================
// TRANSLATION OPERATIONS - عمليات الترجمة الرئيسية
// ===========================================

// Main translation function
async function translateCurrentText() {
    // تحقق شامل من صحة العناصر
    console.log('🔍 فحص العناصر قبل الترجمة...');
    
    if (!originalText) {
        if (typeof showNotification === 'function') {
            showNotification('عنصر النص المرجعي غير موجود', 'error');
        }
        return;
    }
    
    if (!translationText) {
        console.error('❌ translationText element مفقود');
        if (typeof showNotification === 'function') {
            showNotification('خطأ: عنصر التحرير مفقود - يرجى إعادة تحميل الصفحة', 'error');
        }
        return;
    }
    
    // إعادة ربط translationText للتأكد من المرجع الصحيح
    const currentTranslationText = document.getElementById('translationText');
    if (!currentTranslationText) {
        console.error('❌ لا يمكن العثور على عنصر translationText في DOM');
        if (typeof showNotification === 'function') {
            showNotification('خطأ: عنصر التحرير غير موجود في الصفحة', 'error');
        }
        return;
    }
    
    // تحديث المرجع إذا لزم الأمر
    if (translationText !== currentTranslationText) {
        console.warn('⚠️ إعادة ربط translationText element');
        window.translationText = currentTranslationText;
        // إعادة تعيين المتغير المحلي أيضاً
        translationText = currentTranslationText;
    }
    
    console.log('✅ جميع العناصر صحيحة، بدء الترجمة...');
    
    // استخراج النص الأصلي - سواء كان في وضع البلوكات أو العادي
    let originalTextContent = '';
    
    if (originalText.classList && originalText.classList.contains('blocks-reference-mode')) {
        // في وضع البلوكات - استخراج النص من البلوكات
        if (typeof convertBlocksToText === 'function') {
            originalTextContent = convertBlocksToText(originalText.innerHTML);
        } else {
            originalTextContent = originalText.textContent || originalText.innerText || '';
        }
        console.log('📋 استخراج من وضع البلوكات:', originalTextContent);
    } else {
        // في الوضع العادي
        originalTextContent = originalText.textContent || originalText.innerText || '';
    }
    
    console.log('📝 النص الأصلي للترجمة:', originalTextContent);
    
    if (!originalTextContent || originalTextContent.trim() === '' || originalTextContent.includes('ضع ملف')) {
        if (typeof showNotification === 'function') {
            showNotification('لا يوجد نص مرجعي للترجمة', 'warning');
        }
        return;
    }
    
    const serviceElement = document.getElementById('translationService');
    const selectedService = serviceElement ? serviceElement.value : 'mymemory';
    
    // MyMemory لا يحتاج API key
    if (selectedService !== 'mymemory' && (!apiKeys || !apiKeys[selectedService])) {
        if (typeof showNotification === 'function') {
            showNotification(`يرجى إدخال مفتاح ${getServiceName ? getServiceName(selectedService) : selectedService} في الإعدادات`, 'warning');
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
        
        console.log(`🔄 بدء الترجمة باستخدام ${selectedService} للنص: "${originalTextContent}"`);
        
        switch (selectedService) {
            case 'mymemory':
                if (typeof translateWithMyMemory === 'function') {
                    translatedText = await translateWithMyMemory(originalTextContent);
                    console.log('✅ MyMemory أرجع النص:', translatedText);
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
                throw new Error('خدمة ترجمة غير مدعومة');
        }
        
        console.log('🎯 النص المترجم النهائي:', translatedText);
        
        if (translatedText && translatedText.trim() !== '') {
            // إعادة التحقق من translationText قبل التحديث
            const activeTranslationText = document.getElementById('translationText');
            if (!activeTranslationText) {
                console.error('❌ فقد عنصر translationText أثناء الترجمة');
                if (typeof showNotification === 'function') {
                    showNotification('خطأ: فقد عنصر التحرير أثناء الترجمة', 'error');
                }
                return;
            }
            
            // تحديث المرجع إذا لزم الأمر
            if (translationText !== activeTranslationText) {
                console.warn('⚠️ إعادة ربط translationText قبل التحديث');
                window.translationText = activeTranslationText;
                // إعادة تعيين المتغير المحلي أيضاً
                translationText = activeTranslationText;
            }
            
            if (translationText) {
                const oldValue = translationText.value;
                translationText.value = translatedText;
            
                console.log(`📝 تم تحديث المحرر من "${oldValue}" إلى "${translatedText}"`);
                
                // إطلاق events لتحديث الواجهة
                console.log('🔥 إطلاق events لتحديث الواجهة...');
                
                // إطلاق input event لتحديث الواجهة
                const inputEvent = new Event('input', { bubbles: true });
                translationText.dispatchEvent(inputEvent);
                
                // إطلاق change event أيضاً
                const changeEvent = new Event('change', { bubbles: true });
                translationText.dispatchEvent(changeEvent);
                
                // تحديث حالة التعديل يدوياً
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
                    
                    console.log(`✅ تم تحديث الترجمة للمفتاح: ${currentEditingKey}`);
                }
                
                // تحديث preview في القائمة
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
                        console.log('✅ تم تحديث preview في القائمة');
                    }
                }
                
                // تحديث الإحصائيات
                if (typeof updateStats === 'function') {
                    updateStats();
                }
                if (typeof updateSaveButton === 'function') {
                    updateSaveButton();
                }
                
                // التركيز على المحرر
                translationText.focus();
                
                // التحقق من أن التحديث تم بنجاح
                if (translationText.value === translatedText) {
                    console.log('✅ تأكيد: النص تم تحديثه بنجاح في المحرر والواجهة');
                } else {
                    console.error('❌ فشل تحديث النص في المحرر');
                    if (typeof showNotification === 'function') {
                        showNotification('خطأ في تحديث النص في المحرر', 'error');
                    }
                    return;
                }
            } else {
                console.error('❌ translationText element غير موجود');
                if (typeof showNotification === 'function') {
                    showNotification('خطأ في تحديث النص - يرجى إعادة تحميل الصفحة', 'error');
                }
                return;
            }
        } else {
            console.error('❌ النص المترجم فارغ أو غير صالح:', translatedText);
            if (typeof showNotification === 'function') {
                showNotification('النص المترجم فارغ - يرجى المحاولة مرة أخرى', 'warning');
            }
            return;
        }
            
        if (typeof showNotification === 'function' && typeof getServiceName === 'function') {
            showNotification(`تم ترجمة النص بواسطة ${getServiceName(selectedService)} 🎯`, 'success');
        }
        
    } catch (error) {
        console.error('خطأ في الترجمة:', error);
        
        // معالجة أخطاء CORS بشكل خاص
        if (error.message.includes('CORS') || error.message.includes('Failed to fetch')) {
            const serviceName = getServiceName ? getServiceName(selectedService) : selectedService;
            if (typeof showNotification === 'function') {
                showNotification(
                    `❌ خطأ CORS مع ${serviceName}\n\n💡 الحلول:\n` +
                    `• استخدم "MyMemory" (مجاني بدون مشاكل)\n` +
                    `• نزّل CORS extension للمتصفح\n` +
                    `• أو انسخ النص واستخدم الخدمة خارجياً`, 
                    'warning'
                );
            }
        } else {
            if (typeof showNotification === 'function') {
                showNotification(`خطأ في الترجمة: ${error.message}`, 'error');
            }
        }
    } finally {
        if (typeof hideLoading === 'function') {
            hideLoading();
        }
    }
}

// مقارنة المفاتيح وإيجاد المفاتيح الناقصة
function findMissingKeys() {
    const translationKeysSet = new Set(Object.keys(translations || {}));
    const englishKeysSet = new Set(Object.keys(englishTranslations || {}));
    
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

// عرض المفاتيح الناقصة والإضافية
function showMissingKeys() {
    if (!englishTranslations || Object.keys(englishTranslations).length === 0) {
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
        if (englishTranslations && englishTranslations[key]) {
            // أضف المفتاح مع النص الإنجليزي الأصلي
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
            
            // أضف إلى النصوص الأصلية أيضاً
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
        // تحديث قائمة المفاتيح
        const newKeys = Object.keys(translations || {});
        if (window.translationKeys) {
            window.translationKeys = newKeys;
        }
        translationKeys = newKeys;
        
        // إعادة عرض القائمة
        if (typeof populateTranslationList === 'function') {
            populateTranslationList();
        }
        if (typeof updateStats === 'function') {
            updateStats();
        }
        
        if (typeof showNotification === 'function') {
            showNotification(`✅ تم إضافة ${addedCount} مفتاح جديد من المرجع الإنجليزي!`, 'success');
        }
        
        // حفظ في localStorage
        if (typeof saveToLocalStorage === 'function') {
            saveToLocalStorage();
        }
        
        console.log(`تم إضافة ${addedCount} مفتاح ناقص من المرجع الإنجليزي`);
    } else {
        if (typeof showNotification === 'function') {
            showNotification(`⚠️ لم يتم إضافة أي مفاتيح`, 'warning');
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
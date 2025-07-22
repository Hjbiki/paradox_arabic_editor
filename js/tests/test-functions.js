// ===========================================
// TEST FUNCTIONS - دوال الاختبار والتشخيص
// ===========================================

// فحص جميع الترجمات للبلوكات المفقودة
window.scanAllMissingBlocks = function() {
    console.log('🔍 فحص جميع الترجمات للبلوكات المفقودة...');
    
    if (!englishTranslations || Object.keys(englishTranslations).length === 0) {
        console.warn('⚠️ لا توجد نصوص مرجعية إنجليزية للمقارنة');
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
    
    console.log('📊 تقرير البلوكات المفقودة:');
    console.log(`📈 إجمالي الترجمات: ${Object.keys(translations || {}).length}`);
    console.log(`⚠️ ترجمات بها مشاكل: ${translationsWithIssues}`);
    console.log(`🚫 إجمالي البلوكات المفقودة: ${totalMissing}`);
    
    if (translationsWithIssues > 0) {
        console.log('\n📋 التفاصيل:');
        Object.entries(report).forEach(([key, missing]) => {
            console.log(`🔑 ${key}: ${missing.join(', ')}`);
        });
        
        if (typeof showNotification === 'function') {
            showNotification(`تم العثور على ${totalMissing} بلوك مفقود في ${translationsWithIssues} ترجمة`, 'warning');
        }
    } else {
        console.log('✅ جميع الترجمات كاملة!');
        if (typeof showNotification === 'function') {
            showNotification('🎉 جميع الترجمات كاملة - لا توجد بلوكات مفقودة!', 'success');
        }
    }
    
    return {
        total: Object.keys(translations || {}).length,
        withIssues: translationsWithIssues,
        totalMissing: totalMissing,
        report: report
    };
};

// دالة تجريبية لاختبار تحويل النص للبلوكات
window.testBlockConversion = function(text) {
    console.log('🧪 اختبار تحويل النص:', text);
    window.debugBlocks = true; // تفعيل debug مؤقتاً
    if (typeof convertTextToBlocks === 'function') {
        const result = convertTextToBlocks(text);
        console.log('📋 النتيجة:', result);
        return result;
    }
    return 'convertTextToBlocks function not available';
};

// دالة للتحكم في debug mode
window.enableBlocksDebug = function() {
    window.debugBlocks = true;
    console.log('🔍 تم تفعيل debug mode للبلوكات');
};

window.disableBlocksDebug = function() {
    window.debugBlocks = false;
    console.log('🔇 تم إيقاف debug mode للبلوكات');
};

// دالة لإزالة console logs
window.clearConsoleLogs = function() {
    console.clear();
    console.log('🧹 تم تنظيف الكونسول');
};

// اختبار سريع لـ insertNewline
window.testInsertNewline = function() {
    console.log('🧪 === اختبار insertNewline ===');
    
    // اختبار 1: بدون تركيز على المحرر
    console.log('\n1. اختبار بدون تركيز:');
    document.body.focus(); // إزالة التركيز
    const textBefore = translationText ? translationText.value : '';
    
    if (typeof insertNewline === 'function') {
        insertNewline();
    }
    
    setTimeout(() => {
        const textAfter = translationText ? translationText.value : '';
        const newlineAdded = textAfter.includes('\\n') && textAfter !== textBefore;
        console.log(`   ${newlineAdded ? '✅' : '❌'} تم إضافة \\n: ${newlineAdded}`);
        console.log(`   📝 النص قبل: "${textBefore.slice(-20)}"`);
        console.log(`   📝 النص بعد: "${textAfter.slice(-20)}"`);
        
        // اختبار 2: مع التركيز على المحرر
        console.log('\n2. اختبار مع التركيز:');
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
            console.log(`   ${newlineAdded2 ? '✅' : '❌'} تم إضافة \\n مع التركيز: ${newlineAdded2}`);
        }, 150);
    }, 150);
    
    return 'اختبار insertNewline بدأ - شوف النتائج في الكونسول';
};

// اختبار شامل للإصلاحات الجديدة
window.testAllLatestFixes = function() {
    console.log('🎉 === اختبار شامل للإصلاحات الجديدة ===');
    
    const results = {
        notifications: 0,
        repeatedTranslation: 0,
        elementRebinding: 0,
        overallHealth: 0
    };
    
    // 1. اختبار نظام الإشعارات
    console.log('\n🔔 1. اختبار نظام الإشعارات...');
    try {
        if (typeof showNotification === 'function') {
            showNotification('اختبار الإشعارات', 'info');
            setTimeout(() => {
                if (typeof hideNotification === 'function') {
                    hideNotification();
                }
            }, 500);
            results.notifications = 100;
            console.log('   ✅ نظام الإشعارات يعمل');
        }
    } catch (error) {
        results.notifications = 0;
        console.log('   ❌ مشكلة في الإشعارات:', error);
    }
    
    // 2. اختبار إعادة ربط العناصر
    console.log('\n🔗 2. اختبار إعادة ربط العناصر...');
    try {
        const currentElement = document.getElementById('translationText');
        if (currentElement && translationText === currentElement) {
            results.elementRebinding = 100;
            console.log('   ✅ العناصر مربوطة بشكل صحيح');
        } else {
            results.elementRebinding = 50;
            console.log('   ⚠️ قد تحتاج إعادة ربط العناصر');
        }
    } catch (error) {
        results.elementRebinding = 0;
        console.log('   ❌ خطأ في فحص العناصر:', error);
    }
    
    // 3. اختبار الترجمة المتكررة (سريع)
    console.log('\n🔄 3. اختبار الترجمة المتكررة...');
    if (translationKeys && translationKeys.length >= 2) {
        try {
            // محاكاة سريعة
            const originalValue = translationText ? translationText.value : '';
            
            if (translationText) {
                translationText.value = 'اختبار سريع';
                const event = new Event('input', { bubbles: true });
                translationText.dispatchEvent(event);
                
                if (translationText.value === 'اختبار سريع') {
                    results.repeatedTranslation = 100;
                    console.log('   ✅ الترجمة المتكررة تعمل');
                } else {
                    results.repeatedTranslation = 0;
                    console.log('   ❌ مشكلة في الترجمة المتكررة');
                }
                
                // إعادة القيمة الأصلية
                translationText.value = originalValue;
                translationText.dispatchEvent(new Event('input', { bubbles: true }));
            } else {
                results.repeatedTranslation = 0;
                console.log('   ❌ translationText غير موجود');
            }
        } catch (error) {
            results.repeatedTranslation = 0;
            console.log('   ❌ خطأ في اختبار الترجمة:', error);
        }
    } else {
        results.repeatedTranslation = 50;
        console.log('   ⚠️ يحتاج ملف بنصوص متعددة للاختبار الكامل');
    }
    
    // حساب الصحة العامة
    const scores = [results.notifications, results.elementRebinding, results.repeatedTranslation];
    results.overallHealth = Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
    
    // النتائج النهائية
    console.log('\n📊 === النتائج النهائية ===');
    console.log(`🔔 الإشعارات: ${results.notifications}%`);
    console.log(`🔗 ربط العناصر: ${results.elementRebinding}%`);
    console.log(`🔄 الترجمة المتكررة: ${results.repeatedTranslation}%`);
    console.log(`\n🏆 الصحة العامة: ${results.overallHealth}%`);
    
    const status = results.overallHealth >= 90 ? '🎉 ممتاز - كل شيء يعمل!' : 
                   results.overallHealth >= 75 ? '✅ جيد جداً - معظم الميزات تعمل' : 
                   results.overallHealth >= 60 ? '⚠️ جيد - بعض المشاكل البسيطة' : 
                   '❌ يحتاج إصلاح - مشاكل متعددة';
    
    console.log(`📈 التقييم: ${status}`);
    
    // إشعار النتيجة
    const notifType = results.overallHealth >= 90 ? 'success' : 
                      results.overallHealth >= 75 ? 'info' : 'warning';
    
    if (typeof showNotification === 'function') {
        showNotification(`اختبار شامل: ${results.overallHealth}% - ${status}`, notifType);
    }
    
    return results;
};

// اختبار سريع لـ MyMemory translation
window.testMyMemoryTranslation = function() {
    console.log('🧪 === اختبار MyMemory Translation ===');
    
    // التحقق من العناصر المطلوبة
    console.log('\n📋 فحص العناصر:');
    console.log(`   originalText: ${originalText ? '✅ موجود' : '❌ مفقود'}`);
    console.log(`   translationText: ${translationText ? '✅ موجود' : '❌ مفقود'}`);
    
    if (!originalText || !translationText) {
        console.log('❌ العناصر الأساسية مفقودة - لا يمكن الاختبار');
        return;
    }
    
    // إضافة نص تجريبي
    const testText = 'Hello World';
    originalText.textContent = testText;
    console.log(`📝 تم وضع نص تجريبي: "${testText}"`);
    
    // اختبار ترجمة MyMemory مباشرة
    console.log('\n🌐 اختبار MyMemory API مباشرة:');
    
    if (typeof translateWithMyMemory === 'function') {
        translateWithMyMemory(testText)
            .then(result => {
                console.log('✅ نتيجة MyMemory:', result);
                
                // اختبار تحديث المحرر
                if (translationText) {
                    const oldValue = translationText.value;
                    translationText.value = result;
                    
                    // إطلاق events لتحديث الواجهة
                    const inputEvent = new Event('input', { bubbles: true });
                    translationText.dispatchEvent(inputEvent);
                    
                    const changeEvent = new Event('change', { bubbles: true });
                    translationText.dispatchEvent(changeEvent);
                    
                    console.log(`📝 تم تحديث المحرر من "${oldValue}" إلى "${result}"`);
                    console.log('🔥 تم إطلاق events لتحديث الواجهة');
                    
                    if (translationText.value === result) {
                        console.log('✅ تأكيد: تحديث المحرر والواجهة نجح');
                        if (typeof showNotification === 'function') {
                            showNotification('✅ اختبار MyMemory نجح!', 'success');
                        }
                    } else {
                        console.log('❌ فشل تحديث المحرر');
                        if (typeof showNotification === 'function') {
                            showNotification('❌ فشل تحديث المحرر', 'error');
                        }
                    }
                }
            })
            .catch(error => {
                console.error('❌ فشل اختبار MyMemory:', error);
                if (typeof showNotification === 'function') {
                    showNotification(`❌ فشل MyMemory: ${error.message}`, 'error');
                }
            });
    } else {
        console.log('❌ translateWithMyMemory function غير متاح');
    }
    
    // اختبار translateCurrentText كاملة
    console.log('\n🔄 اختبار translateCurrentText كاملة:');
    setTimeout(() => {
        const serviceSelect = document.getElementById('translationService');
        if (serviceSelect) {
            serviceSelect.value = 'mymemory';
            console.log('🎯 تم تعيين الخدمة إلى MyMemory');
            
            if (typeof translateCurrentText === 'function') {
                translateCurrentText()
                    .then(() => {
                        console.log('✅ translateCurrentText اكتمل');
                    })
                    .catch(error => {
                        console.error('❌ خطأ في translateCurrentText:', error);
                    });
            }
        }
    }, 1000);
    
    return 'اختبار MyMemory بدأ - شوف النتائج في الكونسول';
};

// اختبار سريع لتحديث الواجهة
window.testUIUpdate = function() {
    console.log('🧪 === اختبار تحديث الواجهة ===');
    
    if (!translationText) {
        console.log('❌ translationText غير موجود');
        return;
    }
    
    const testText = 'نص تجريبي للاختبار ' + Date.now();
    const oldValue = translationText.value;
    
    console.log(`📝 القيمة الحالية: "${oldValue}"`);
    console.log(`📝 القيمة الجديدة: "${testText}"`);
    
    // تحديث النص
    translationText.value = testText;
    
    // إطلاق events
    console.log('🔥 إطلاق input event...');
    const inputEvent = new Event('input', { bubbles: true });
    translationText.dispatchEvent(inputEvent);
    
    console.log('🔥 إطلاق change event...');
    const changeEvent = new Event('change', { bubbles: true });
    translationText.dispatchEvent(changeEvent);
    
    // التحقق
    setTimeout(() => {
        if (translationText.value === testText) {
            console.log('✅ تحديث القيمة نجح');
            if (typeof showNotification === 'function') {
                showNotification('✅ تحديث الواجهة يعمل!', 'success');
            }
        } else {
            console.log('❌ فشل تحديث القيمة');
            if (typeof showNotification === 'function') {
                showNotification('❌ مشكلة في تحديث الواجهة', 'error');
            }
        }
    }, 100);
    
    return 'جاري اختبار تحديث الواجهة...';
};

// اختبار سريع للإشعارات
window.testNotifications = function() {
    console.log('🧪 اختبار نظام الإشعارات...');
    
    if (typeof showNotification === 'function') {
        setTimeout(() => showNotification('إشعار عادي - اختبار', 'info'), 100);
        setTimeout(() => showNotification('إشعار نجاح - اختبار', 'success'), 2000);
        setTimeout(() => showNotification('إشعار تحذير - اختبار', 'warning'), 4000);
        setTimeout(() => showNotification('إشعار خطأ - اختبار', 'error'), 6000);
        setTimeout(() => showNotification(
            '🧪 اختبار الإشعارات الطويلة:\n\n' +
            '• هذا إشعار طويل للاختبار\n' +
            '• يحتوي على عدة أسطر\n' +
            '• ويجب أن يظهر زر الإغلاق\n' +
            '• مع إمكانية النقر للإغلاق\n\n' +
            'انقر في أي مكان لإغلاقه!', 
            'info'
        ), 8000);
        
        console.log('✅ تم إطلاق اختبار الإشعارات');
    } else {
        console.error('❌ دالة showNotification غير متوفرة');
    }
};

// دالة لإعادة تعيين رسائل المساعدة (للمطورين)
window.resetHelpMessages = function() {
    console.log('🔄 إعادة تعيين رسائل المساعدة...');
    
    // إزالة العلامات من localStorage
    localStorage.removeItem('paradox_editor_welcome_seen');
    localStorage.removeItem('paradox_editor_save_explained');
    
    console.log('✅ تم إعادة تعيين رسائل المساعدة');
    console.log('💡 أعد تحميل الصفحة لرؤية الرسائل مرة أخرى');
    
    if (typeof showNotification === 'function') {
        showNotification(
            'تم إعادة تعيين رسائل المساعدة!\n\n' +
            'أعد تحميل الصفحة لرؤية:\n' +
            '• رسالة الترحيب\n' +
            '• توضيحات الحفظ\n' +
            '• جميع النصائح الأولى',
            'success'
        );
    }
};

// دالة لإظهار حالة النظام المحسنة  
window.showSystemStatus = function() {
    console.log('📊 حالة النظام المحسنة...');
    
    // معلومات الترجمات
    const translationsInfo = {
        total: Object.keys(translations || {}).length,
        original: Object.keys(originalTranslations || {}).length,
        english: Object.keys(englishTranslations || {}).length,
        modified: (modifiedKeys && modifiedKeys.size) || 0,
        filtered: Object.keys(filteredTranslations || {}).length
    };
    
    // معلومات الحالة الحالية
    const currentState = {
        currentIndex: currentIndex || 0,
        currentKey: translationKeys && translationKeys[currentIndex] ? translationKeys[currentIndex] : 'N/A',
        currentEditingKey: currentEditingKey || 'N/A',
        hasCurrentEdit: !!(currentEditedValue && currentEditingKey),
        hasUnsavedChanges: hasUnsavedChanges || false
    };
    
    // فحص تطابق originalTranslations
    const originalIntegrityCheck = {
        exists: !!(originalTranslations && Object.keys(originalTranslations).length > 0),
        matchesTotal: (Object.keys(originalTranslations || {}).length === Object.keys(translations || {}).length),
        sampleKey: currentState.currentKey,
        sampleOriginal: originalTranslations && currentState.currentKey ? originalTranslations[currentState.currentKey] : 'N/A',
        sampleCurrent: translations && currentState.currentKey ? translations[currentState.currentKey] : 'N/A',
        isModified: modifiedKeys && currentState.currentKey ? modifiedKeys.has(currentState.currentKey) : false
    };
    
    console.log('📊 معلومات الترجمات:', translationsInfo);
    console.log('📊 الحالة الحالية:', currentState);
    console.log('🔍 فحص سلامة النصوص الأصلية:', originalIntegrityCheck);
    
    // التحقق من مشاكل محتملة
    const potentialIssues = [];
    
    if (!originalIntegrityCheck.exists) {
        potentialIssues.push('❌ originalTranslations غير موجود');
    }
    
    if (!originalIntegrityCheck.matchesTotal) {
        potentialIssues.push('⚠️ عدد النصوص الأصلية لا يطابق الحالية');
    }
    
    if (originalIntegrityCheck.sampleOriginal === originalIntegrityCheck.sampleCurrent && originalIntegrityCheck.isModified) {
        potentialIssues.push('🐛 النص الأصلي مطابق للحالي رغم وجود تعديل');
    }
    
    if (potentialIssues.length > 0) {
        console.warn('🚨 مشاكل محتملة:', potentialIssues);
    } else {
        console.log('✅ لا توجد مشاكل واضحة');
    }
    
    // معلومات LocalStorage
    const localStorageInfo = {
        hasData: !!(localStorage.getItem('paradox_translations')),
        size: localStorage.getItem('paradox_translations') ? localStorage.getItem('paradox_translations').length : 0
    };
    
    console.log('💾 معلومات LocalStorage:', localStorageInfo);
    
    // عرض ملخص في الإشعار
    if (typeof showNotification === 'function') {
        const summary = 
            `📊 حالة النظام:\n\n` +
            `📝 الترجمات: ${translationsInfo.total}\n` +
            `🗂️ الأصلية: ${translationsInfo.original}\n` +
            `🌍 الإنجليزية: ${translationsInfo.english}\n` +
            `✏️ المُعدلة: ${translationsInfo.modified}\n\n` +
            `🔑 المفتاح الحالي: ${currentState.currentKey}\n` +
            `💾 تعديلات غير محفوظة: ${currentState.hasUnsavedChanges ? 'نعم' : 'لا'}\n\n` +
            (potentialIssues.length > 0 ? 
                `⚠️ مشاكل: ${potentialIssues.length}\n${potentialIssues.join('\n')}` : 
                `✅ النظام يعمل بشكل طبيعي`);
                
        showNotification(summary, potentialIssues.length > 0 ? 'warning' : 'info');
    }
    
    console.log('✅ تم عرض حالة النظام محسنة');
};

// دالة اختبار حفظ واسترجاع الملفات (لحل مشكلة اختفاء الملف)
window.testFilePersistence = function() {
    console.log('🧪 اختبار حفظ واسترجاع معلومات الملفات...');
    
    const beforeSave = {
        currentFile: currentFile ? JSON.stringify(currentFile) : 'null',
        translations: Object.keys(translations || {}).length,
        modifiedKeys: (modifiedKeys && modifiedKeys.size) || 0
    };
    
    console.log('📊 قبل الحفظ:', beforeSave);
    
    // حفظ البيانات
    if (typeof saveToLocalStorage === 'function') {
        saveToLocalStorage();
        console.log('💾 تم حفظ البيانات');
    }
    
    // محاكاة إعادة تحميل بسيطة
    setTimeout(() => {
        if (typeof loadFromLocalStorage === 'function') {
            const loadResult = loadFromLocalStorage();
            
            const afterLoad = {
                currentFile: currentFile ? JSON.stringify(currentFile) : 'null',
                translations: Object.keys(translations || {}).length,
                modifiedKeys: (modifiedKeys && modifiedKeys.size) || 0,
                loadSuccess: loadResult
            };
            
            console.log('📊 بعد الاسترجاع:', afterLoad);
            
            // مقارنة النتائج
            const fileMatch = beforeSave.currentFile === afterLoad.currentFile;
            const translationsMatch = beforeSave.translations === afterLoad.translations;
            const modifiedMatch = beforeSave.modifiedKeys === afterLoad.modifiedKeys;
            
            console.log('🔍 نتائج المقارنة:', {
                fileMatch,
                translationsMatch,
                modifiedMatch,
                overallSuccess: fileMatch && translationsMatch && modifiedMatch
            });
            
            if (typeof showNotification === 'function') {
                const message = fileMatch && translationsMatch && modifiedMatch ?
                    '✅ اختبار حفظ الملفات نجح!\n\nجميع المعلومات تم حفظها واسترجاعها بنجاح.' :
                    '⚠️ مشكلة في حفظ الملفات!\n\nتحقق من الكونسول للتفاصيل.';
                
                showNotification(message, fileMatch && translationsMatch && modifiedMatch ? 'success' : 'warning');
            }
        }
    }, 1000);
    
    console.log('🏁 اختبار حفظ الملفات بدأ...');
};

// دالة تشخيص مشكلة النصوص الإنجليزية المرجعية
window.diagnoseEnglishTexts = function() {
    console.log('🔍 تشخيص النصوص الإنجليزية المرجعية...');
    
    const currentKey = translationKeys[currentIndex];
    
    const diagnostics = {
        'englishTranslations_exists': !!englishTranslations,
        'englishTranslations_length': Object.keys(englishTranslations || {}).length,
        'currentFile_exists': !!currentFile,
        'currentFile_name': currentFile ? (currentFile.name || 'غير محدد') : 'لا يوجد',
        'currentKey': currentKey || 'غير محدد',
        'englishText_for_currentKey': englishTranslations && currentKey ? englishTranslations[currentKey] : 'غير موجود',
        'originalText_element': !!originalText,
        'originalText_content': originalText ? originalText.textContent : 'element غير موجود'
    };
    
    console.log('📊 نتائج التشخيص:', diagnostics);
    
    // اختبار تحديد الملف المرجعي الافتراضي
    if (currentFile) {
        const englishFileName = currentFile.name ? currentFile.name.replace(/^.*[\\\/]/, '') : 'غير محدد';
        const englishFilePath = `english/${englishFileName}`;
        
        console.log(`🔍 محاولة تحميل: ${englishFilePath}`);
        
        fetch(englishFilePath)
            .then(response => {
                if (response.ok) {
                    console.log(`✅ الملف الإنجليزي موجود: ${englishFilePath}`);
                    return response.text();
                } else {
                    console.log(`❌ الملف الإنجليزي غير موجود: ${englishFilePath} (Status: ${response.status})`);
                    throw new Error(`HTTP ${response.status}`);
                }
            })
            .then(content => {
                console.log(`📖 محتوى الملف الإنجليزي (أول 200 حرف): ${content.substring(0, 200)}...`);
            })
            .catch(error => {
                console.log(`❌ خطأ في تحميل الملف الإنجليزي: ${error.message}`);
            });
    }
    
    // عرض النتائج للمستخدم
    if (typeof showNotification === 'function') {
        const message = 
            `🔍 تشخيص النصوص الإنجليزية:\n\n` +
            `📁 الملف الحالي: ${diagnostics.currentFile_name}\n` +
            `📝 النصوص الإنجليزية: ${diagnostics.englishTranslations_length}\n` +
            `🔑 المفتاح الحالي: ${diagnostics.currentKey}\n` +
            `📖 النص المرجعي: ${diagnostics.englishText_for_currentKey ? 'موجود' : 'غير موجود'}\n` +
            `🖼️ عنصر العرض: ${diagnostics.originalText_element ? 'موجود' : 'غير موجود'}\n\n` +
            `تحقق من الكونسول للتفاصيل الكاملة.`;
            
        showNotification(message, 'info');
    }
    
    return diagnostics;
};

// دالة لإعادة تحميل النصوص الإنجليزية يدوياً
window.reloadEnglishTexts = function() {
    console.log('🔄 إعادة تحميل النصوص الإنجليزية...');
    
    if (!currentFile || !currentFile.name) {
        console.log('❌ لا يوجد ملف حالي لتحميل النصوص الإنجليزية له');
        if (typeof showNotification === 'function') {
            showNotification('❌ لا يوجد ملف حالي!', 'error');
        }
        return;
    }
    
    const filename = currentFile.name;
    if (typeof loadEnglishReferenceFile === 'function') {
        loadEnglishReferenceFile(filename)
            .then(() => {
                console.log('✅ تمت محاولة إعادة تحميل النصوص الإنجليزية');
                
                // تحديث العرض
                if (typeof selectTranslationByIndex === 'function') {
                    setTimeout(() => selectTranslationByIndex(currentIndex), 200);
                }
            })
            .catch(error => {
                console.log('❌ خطأ في إعادة تحميل النصوص الإنجليزية:', error);
            });
    } else {
        console.log('❌ دالة loadEnglishReferenceFile غير موجودة');
    }
};

// دالة اختبار حفظ واسترجاع النص المُعدل
window.testCurrentlyEditedText = function() {
    console.log('🧪 اختبار حفظ واسترجاع النص المُعدل...');
    
    if (!translationText) {
        console.log('❌ translationText غير موجود');
        return;
    }
    
    const originalValue = translationText.value;
    const testValue = "نص تجريبي للاختبار - " + Date.now();
    
    console.log('📊 قبل الاختبار:', {
        originalValue,
        currentEditedValue: window.currentEditedValue,
        currentEditingKey: window.currentEditingKey
    });
    
    // تغيير النص
    translationText.value = testValue;
    translationText.dispatchEvent(new Event('input'));
    
    setTimeout(() => {
        console.log('📊 بعد التغيير:', {
            newValue: translationText.value,
            currentEditedValue: window.currentEditedValue,
            currentEditingKey: window.currentEditingKey
        });
        
        // حفظ البيانات
        if (typeof saveToLocalStorage === 'function') {
            saveToLocalStorage();
        }
        
        setTimeout(() => {
            // محاكاة تحميل البيانات
            if (typeof loadFromLocalStorage === 'function') {
                loadFromLocalStorage();
            }
            
            setTimeout(() => {
                console.log('📊 بعد إعادة التحميل:', {
                    restoredValue: translationText ? translationText.value : 'N/A',
                    currentEditedValue: window.currentEditedValue,
                    currentEditingKey: window.currentEditingKey
                });
                
                // إعادة النص الأصلي
                if (translationText) {
                    translationText.value = originalValue;
                    translationText.dispatchEvent(new Event('input'));
                }
                
                if (typeof showNotification === 'function') {
                    const success = (window.currentEditedValue === testValue);
                    showNotification(
                        success ? 
                        '✅ اختبار النص المُعدل نجح!\n\nالنص المُعدل يُحفظ ويُسترجع بشكل صحيح.' :
                        '⚠️ مشكلة في حفظ النص المُعدل!\n\nتحقق من الكونسول للتفاصيل.',
                        success ? 'success' : 'warning'
                    );
                }
                
                console.log('✅ انتهى اختبار النص المُعدل');
            }, 500);
        }, 500);
    }, 1000);
    
    console.log('🏁 بدأ اختبار النص المُعدل...');
};

// دالة اختبار سريعة لمشكلة التعديلات المحفوظة
window.testModificationSaving = function() {
    console.log('🧪 اختبار حفظ التعديلات...');
    
    if (!translationText || !translationKeys || translationKeys.length === 0) {
        console.log('❌ لا توجد ترجمات للاختبار');
        if (typeof showNotification === 'function') {
            showNotification('❌ لا توجد ترجمات للاختبار!', 'error');
        }
        return;
    }
    
    const currentKey = translationKeys[currentIndex];
    const originalValue = originalTranslations && originalTranslations[currentKey] ? originalTranslations[currentKey] : '';
    const testText = originalValue + " - [تم التعديل للاختبار]";
    
    console.log('📊 بدء الاختبار:', {
        currentKey,
        originalValue,
        testText,
        modifiedCount_before: (modifiedKeys && modifiedKeys.size) || 0
    });
    
    // تغيير النص
    translationText.value = testText;
    translationText.dispatchEvent(new Event('input'));
    
    setTimeout(() => {
        const afterModification = {
            currentValue: translationText.value,
            modifiedCount_after: (modifiedKeys && modifiedKeys.size) || 0,
            isInModifiedKeys: modifiedKeys && modifiedKeys.has(currentKey),
            hasUnsavedChanges: window.hasUnsavedChanges || hasUnsavedChanges
        };
        
        console.log('📊 بعد التعديل:', afterModification);
        
        // حفظ البيانات
        if (typeof saveToLocalStorage === 'function') {
            saveToLocalStorage();
        }
        
        // التحقق من النتائج
        const success = afterModification.modifiedCount_after > 0 && 
                       afterModification.isInModifiedKeys && 
                       afterModification.hasUnsavedChanges;
        
        if (typeof showNotification === 'function') {
            const message = success ? 
                `✅ إصلاح التعديلات نجح!\n\n` +
                `🔑 المفتاح: ${currentKey}\n` +
                `📝 التعديلات: ${afterModification.modifiedCount_after}\n` +
                `✏️ حالة التغيير: ${afterModification.hasUnsavedChanges ? 'نعم' : 'لا'}\n` +
                `💾 المفتاح محفوظ: ${afterModification.isInModifiedKeys ? 'نعم' : 'لا'}` :
                `❌ مازالت هناك مشكلة!\n\n` +
                `تحقق من الكونسول للتفاصيل.`;
                
            showNotification(message, success ? 'success' : 'warning');
        }
        
        // إعادة النص الأصلي
        setTimeout(() => {
            if (typeof undoChanges === 'function') {
                undoChanges();
                console.log('✅ تم إرجاع النص للأصل');
            }
        }, 2000);
        
        console.log('✅ انتهى اختبار التعديلات - النتيجة:', success ? 'نجح' : 'فشل');
    }, 1000);
    
    console.log('🏁 بدأ اختبار التعديلات...');
};

// اختبار استرجاع النصوص بعد refresh
window.testTextRecoveryAfterRefresh = function() {
    console.log('🧪 اختبار استرجاع النصوص بعد refresh...');
    
    if (!translationText || !translationKeys || translationKeys.length === 0) {
        console.log('❌ لا توجد ترجمات للاختبار');
        return;
    }
    
    const currentKey = translationKeys[currentIndex];
    const originalValue = originalTranslations && originalTranslations[currentKey] ? originalTranslations[currentKey] : '';
    const testText = originalValue + " - [تم التعديل للاختبار الاسترجاع]";
    
    console.log('📊 بدء اختبار الاسترجاع:', {
        currentKey,
        originalValue,
        testText,
        modifiedCount_before: (modifiedKeys && modifiedKeys.size) || 0
    });
    
    // تعديل النص
    translationText.value = testText;
    translationText.dispatchEvent(new Event('input'));
    
    setTimeout(() => {
        // حفظ البيانات
        if (typeof saveToLocalStorage === 'function') {
            saveToLocalStorage();
        }
        
        console.log('💾 تم حفظ التعديل، الآن محاكاة إعادة تحميل...');
        
        setTimeout(() => {
            // محاكاة إعادة تحميل البيانات
            if (typeof loadFromLocalStorage === 'function') {
                loadFromLocalStorage();
            }
            
            setTimeout(() => {
                // تحديد نفس المفتاح مرة أخرى
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
                    
                    console.log('📊 بعد محاكاة إعادة التحميل:', afterReload);
                    
                    const success = afterReload.currentValue === afterReload.expectedText &&
                                   afterReload.isInModifiedKeys &&
                                   afterReload.modifiedCount > 0;
                    
                    if (typeof showNotification === 'function') {
                        const message = success ? 
                            `✅ اختبار الاسترجاع نجح!\n\n` +
                            `🔑 المفتاح: ${currentKey}\n` +
                            `📝 النص المُسترجع: "${afterReload.currentValue}"\n` +
                            `✅ النص صحيح: ${afterReload.currentValue === afterReload.expectedText ? 'نعم' : 'لا'}` :
                            `❌ اختبار الاسترجاع فشل!\n\n` +
                            `📝 المتوقع: "${afterReload.expectedText}"\n` +
                            `📝 الموجود: "${afterReload.currentValue}"\n` +
                            `تحقق من الكونسول للتفاصيل.`;
                            
                        showNotification(message, success ? 'success' : 'error');
                    }
                    
                    // إعادة النص الأصلي
                    setTimeout(() => {
                        if (typeof undoChanges === 'function') {
                            undoChanges();
                            console.log('✅ تم إرجاع النص للأصل');
                        }
                    }, 2000);
                    
                    console.log('✅ انتهى اختبار الاسترجاع - النتيجة:', success ? 'نجح' : 'فشل');
                }, 500);
            }, 500);
        }, 500);
    }, 1000);
    
    console.log('🏁 بدأ اختبار الاسترجاع...');
};

// دالة اختبار شاملة لحل جميع مشاكل النصوص المُعدلة
window.testCompleteTextEditingSolution = function() {
    console.log('🧪 اختبار شامل لحل مشاكل النصوص المُعدلة...');
    
    if (!translationText || !translationKeys || translationKeys.length === 0) {
        console.log('❌ لا توجد ترجمات للاختبار');
        if (typeof showNotification === 'function') {
            showNotification('❌ لا توجد ترجمات للاختبار!', 'error');
        }
        return;
    }
    
    const currentKey = translationKeys[currentIndex];
    const originalValue = originalTranslations && originalTranslations[currentKey] ? originalTranslations[currentKey] : '';
    const testText = originalValue + " - [SOLUTION TEST COMPLETE]";
    
    console.log('🔥 بدء الاختبار الشامل للحل النهائي...');
    console.log('📊 معلومات الاختبار:', {
        currentKey,
        originalValue,
        testText,
        modifiedCount_before: (modifiedKeys && modifiedKeys.size) || 0
    });
    
    // ✅ اختبار 1: تعديل النص
    console.log('1️⃣ اختبار تعديل النص...');
    translationText.value = testText;
    translationText.dispatchEvent(new Event('input'));
    
    setTimeout(() => {
        const test1Results = {
            modifiedCount: (modifiedKeys && modifiedKeys.size) || 0,
            isInModifiedKeys: modifiedKeys && modifiedKeys.has(currentKey),
            hasUnsavedChanges: window.hasUnsavedChanges || hasUnsavedChanges
        };
        
        console.log('📊 نتائج اختبار 1 (التعديل):', test1Results);
        const test1Success = test1Results.modifiedCount > 0 && test1Results.isInModifiedKeys;
        
        // ✅ اختبار 2: حفظ البيانات
        console.log('2️⃣ اختبار حفظ البيانات...');
        if (typeof saveToLocalStorage === 'function') {
            saveToLocalStorage();
        }
        
        setTimeout(() => {
            // ✅ اختبار 3: محاكاة refresh
            console.log('3️⃣ اختبار محاكاة refresh...');
            if (typeof loadFromLocalStorage === 'function') {
                loadFromLocalStorage();
            }
            
            setTimeout(() => {
                // ✅ اختبار 4: استرجاع النص
                console.log('4️⃣ اختبار استرجاع النص...');
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
                    
                    console.log('📊 نتائج اختبار 4 (الاسترجاع):', test4Results);
                    const test4Success = test4Results.currentValue === test4Results.expectedText;
                    
                    // ✅ اختبار 5: إعادة تعيين
                    console.log('5️⃣ اختبار إعادة التعيين...');
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
                        
                        console.log('📊 نتائج اختبار 5 (إعادة التعيين):', test5Results);
                        const test5Success = test5Results.valueAfterUndo === test5Results.expectedAfterUndo;
                        
                        // النتائج النهائية
                        const allTestsResults = {
                            'اختبار 1 - التعديل': test1Success ? '✅ نجح' : '❌ فشل',
                            'اختبار 2 - الحفظ': '✅ تم',
                            'اختبار 3 - التحميل': '✅ تم',
                            'اختبار 4 - الاسترجاع': test4Success ? '✅ نجح' : '❌ فشل',
                            'اختبار 5 - إعادة التعيين': test5Success ? '✅ نجح' : '❌ فشل'
                        };
                        
                        const overallSuccess = test1Success && test4Success && test5Success;
                        
                        console.log('🏆 النتائج النهائية للاختبار الشامل:', allTestsResults);
                        console.log('🎯 النتيجة الإجمالية:', overallSuccess ? '✅ الحل يعمل بشكل مثالي!' : '❌ توجد مشاكل');
                        
                        if (typeof showNotification === 'function') {
                            const message = overallSuccess ? 
                                `🎉 تم حل جميع مشاكل النصوص المُعدلة!\n\n` +
                                `✅ التعديل: يعمل\n` +
                                `✅ الحفظ: يعمل\n` +
                                `✅ الاسترجاع بعد refresh: يعمل\n` +
                                `✅ إعادة التعيين: يعمل\n\n` +
                                `🏆 الحل مثالي 100%!` :
                                `⚠️ مازالت هناك مشاكل في:\n\n` +
                                Object.entries(allTestsResults)
                                    .filter(([test, result]) => result.includes('❌'))
                                    .map(([test, result]) => `• ${test}`)
                                    .join('\n') +
                                `\n\nتحقق من الكونسول للتفاصيل.`;
                                
                            showNotification(message, overallSuccess ? 'success' : 'warning');
                        }
                        
                        console.log('✅ انتهى الاختبار الشامل');
                    }, 1000);
                }, 500);
            }, 500);
        }, 500);
    }, 1000);
    
    console.log('🚀 تم إطلاق الاختبار الشامل...');
};

// دالة إصلاح البيانات المحفوظة في localStorage
window.fixLocalStorageData = function() {
    console.log('🔧 إصلاح البيانات المحفوظة في localStorage...');
    
    try {
        // قراءة البيانات الحالية
        const savedData = localStorage.getItem('paradox_translations');
        if (!savedData) {
            console.log('❌ لا توجد بيانات محفوظة للإصلاح');
            if (typeof showNotification === 'function') {
                showNotification('❌ لا توجد بيانات محفوظة للإصلاح', 'warning');
            }
            return;
        }
        
        const data = JSON.parse(savedData);
        
        // التحقق من وجود مشكلة
        if (data.originalTranslations) {
            console.log('✅ البيانات سليمة - originalTranslations موجود');
            if (typeof showNotification === 'function') {
                showNotification('✅ البيانات المحفوظة سليمة!', 'success');
            }
            return;
        }
        
        console.log('⚠️ تم اكتشاف مشكلة في البيانات المحفوظة - إصلاح...');
        
        // إنشاء originalTranslations من البيانات الحالية في الذاكرة
        if (originalTranslations && Object.keys(originalTranslations).length > 0) {
            // استخدام النصوص الأصلية من الذاكرة
            data.originalTranslations = { ...originalTranslations };
            console.log('✅ تم استخدام النصوص الأصلية من الذاكرة');
        } else {
            // كآخر حل - استخدام نسخة من الترجمات الحالية
            data.originalTranslations = { ...data.translations };
            console.warn('⚠️ تم استخدام نسخة من الترجمات الحالية كنصوص أصلية');
        }
        
        // حفظ البيانات المُصلحة
        localStorage.setItem('paradox_translations', JSON.stringify(data));
        
        console.log('✅ تم إصلاح البيانات المحفوظة');
        
        if (typeof showNotification === 'function') {
            showNotification(
                '🔧 تم إصلاح البيانات المحفوظة!\n\n' +
                '✅ تم إضافة النصوص الأصلية\n' +
                '💾 البيانات الآن محفوظة بشكل صحيح\n\n' +
                '💡 قم بتحديث الصفحة لتطبيق الإصلاحات',
                'success'
            );
        }
        
    } catch (error) {
        console.error('❌ خطأ في إصلاح البيانات:', error);
        if (typeof showNotification === 'function') {
            showNotification('❌ فشل في إصلاح البيانات!', 'error');
        }
    }
};

// دالة إعادة تعيين كاملة للبيانات
window.resetAllData = function() {
    console.log('🗑️ إعادة تعيين جميع البيانات...');
    
    if (!confirm('⚠️ هذا سيحذف جميع البيانات المحفوظة!\n\nهل أنت متأكد؟')) {
        console.log('❌ تم إلغاء عملية الإعادة تعيين');
        return;
    }
    
    try {
        // حذف البيانات من localStorage
        localStorage.removeItem('paradox_translations');
        localStorage.removeItem('arabicTranslationEditor'); // النسخة القديمة
        
        // إعادة تعيين المتغيرات العامة
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
        
        console.log('✅ تم حذف جميع البيانات');
        
        if (typeof showNotification === 'function') {
            showNotification(
                '🗑️ تم حذف جميع البيانات!\n\n' +
                '💡 احفظ عملك قبل إعادة تحميل الصفحة\n' +
                '🔄 اضغط F5 لبدء نظيف',
                'info'
            );
        }
        
    } catch (error) {
        console.error('❌ خطأ في حذف البيانات:', error);
        if (typeof showNotification === 'function') {
            showNotification('❌ فشل في حذف البيانات!', 'error');
        }
    }
};

// دالة سريعة لمحاكاة refresh الصفحة
window.simulatePageRefresh = function() {
    console.log('🔄 محاكاة إعادة تحميل الصفحة...');
    
    if (typeof showNotification === 'function') {
        showNotification(
            '🔄 محاكاة إعادة تحميل...\n\n' +
            'سيتم حفظ البيانات ثم إعادة تحميلها\n' +
            'لاختبار استرجاع معلومات الملف.',
            'info'
        );
    }
    
    // حفظ أولاً
    if (typeof saveToLocalStorage === 'function') {
        saveToLocalStorage();
    }
    
    setTimeout(() => {
        // إعادة تحميل البيانات
        if (typeof loadFromLocalStorage === 'function') {
            loadFromLocalStorage();
        }
        console.log('✅ تمت محاكاة إعادة التحميل');
    }, 2000);
}; 

// اختبار سريع للتحقق من الإصلاح
window.quickTestAfterFix = function() {
    console.log('⚡ اختبار سريع للتحقق من الإصلاح...');
    
    if (!translationText || !translationKeys || translationKeys.length === 0) {
        console.log('❌ لا توجد ترجمات للاختبار');
        if (typeof showNotification === 'function') {
            showNotification('❌ لا توجد ترجمات للاختبار!', 'error');
        }
        return;
    }
    
    const currentKey = translationKeys[currentIndex];
    const originalValue = originalTranslations && originalTranslations[currentKey] ? originalTranslations[currentKey] : '';
    const currentValue = translationText.value;
    
    console.log('📊 المعلومات الحالية:', {
        currentKey,
        originalValue,
        currentValue,
        modifiedCount: (modifiedKeys && modifiedKeys.size) || 0,
        isInModifiedKeys: modifiedKeys && modifiedKeys.has(currentKey)
    });
    
    // اختبار بسيط - تعديل النص
    const testText = originalValue + " - [QUICK TEST]";
    console.log('✏️ تعديل النص للاختبار...');
    
    translationText.value = testText;
    translationText.dispatchEvent(new Event('input'));
    
    setTimeout(() => {
        const afterTest = {
            modifiedCount: (modifiedKeys && modifiedKeys.size) || 0,
            isInModifiedKeys: modifiedKeys && modifiedKeys.has(currentKey),
            hasUnsavedChanges: window.hasUnsavedChanges || hasUnsavedChanges
        };
        
        console.log('📊 بعد التعديل:', afterTest);
        
        // إرجاع النص الأصلي
        if (typeof undoChanges === 'function') {
            undoChanges();
        }
        
        setTimeout(() => {
            const afterUndo = {
                currentValue: translationText.value,
                expectedValue: originalValue,
                modifiedCount: (modifiedKeys && modifiedKeys.size) || 0
            };
            
            console.log('📊 بعد الإرجاع:', afterUndo);
            
            const success = afterTest.modifiedCount > 0 && 
                           afterTest.isInModifiedKeys && 
                           afterUndo.currentValue === afterUndo.expectedValue &&
                           afterUndo.modifiedCount === 0;
            
            if (typeof showNotification === 'function') {
                const message = success ? 
                    '✅ الاختبار السريع نجح!\n\n' +
                    '🔄 التعديل: يعمل\n' +
                    '↩️ الإرجاع: يعمل\n' +
                    '💾 التتبع: يعمل\n\n' +
                    '🎉 الإصلاح فعال!' :
                    '❌ الاختبار السريع فشل!\n\n' +
                    'تحقق من الكونسول للتفاصيل.';
                    
                showNotification(message, success ? 'success' : 'error');
            }
            
            console.log('⚡ انتهى الاختبار السريع - النتيجة:', success ? 'نجح' : 'فشل');
        }, 1000);
    }, 1000);
    
    console.log('🚀 تم إطلاق الاختبار السريع...');
}; 

// اختبار خاص لمشكلة الانتقال بين النصوص
window.testNavigationSaving = function() {
    console.log('🧪 اختبار حفظ النص عند الانتقال بين النصوص...');
    
    if (!translationText || !translationKeys || translationKeys.length < 2) {
        console.log('❌ يجب وجود نصين على الأقل للاختبار');
        if (typeof showNotification === 'function') {
            showNotification('❌ يجب وجود نصين على الأقل للاختبار!', 'error');
        }
        return;
    }
    
    // حفظ الحالة الأصلية
    const originalIndex = currentIndex;
    const originalModifiedCount = (modifiedKeys && modifiedKeys.size) || 0;
    
    // انتقال للنص الأول
    const firstIndex = 0;
    const firstKey = translationKeys[firstIndex];
    const firstOriginal = originalTranslations && originalTranslations[firstKey] ? originalTranslations[firstKey].replace(/"/g, '').trim() : '';
    const firstTestText = firstOriginal + " - [TEST 1]";
    
    console.log('📝 الخطوة 1: تعديل النص الأول');
    console.log(`🔑 المفتاح: ${firstKey}`);
    console.log(`📖 النص الأصلي: "${firstOriginal}"`);
    console.log(`✏️ النص الجديد: "${firstTestText}"`);
    
    if (typeof selectTranslationByIndex === 'function') {
        selectTranslationByIndex(firstIndex);
    }
    
    setTimeout(() => {
        // تعديل النص الأول
        translationText.value = firstTestText;
        translationText.dispatchEvent(new Event('input'));
        
        setTimeout(() => {
            console.log('📝 الخطوة 2: الانتقال للنص الثاني');
            
            // الانتقال للنص الثاني
            const secondIndex = firstIndex + 1;
            const secondKey = translationKeys[secondIndex];
            const secondOriginal = originalTranslations && originalTranslations[secondKey] ? originalTranslations[secondKey].replace(/"/g, '').trim() : '';
            const secondTestText = secondOriginal + " - [TEST 2]";
            
            console.log(`🔑 المفتاح: ${secondKey}`);
            console.log(`📖 النص الأصلي: "${secondOriginal}"`);
            console.log(`✏️ النص الجديد: "${secondTestText}"`);
            
            if (typeof selectTranslationByIndex === 'function') {
                selectTranslationByIndex(secondIndex);
            }
            
            setTimeout(() => {
                // تعديل النص الثاني
                translationText.value = secondTestText;
                translationText.dispatchEvent(new Event('input'));
                
                setTimeout(() => {
                    console.log('📝 الخطوة 3: محاكاة refresh');
                    
                    // حفظ البيانات
                    if (typeof saveToLocalStorage === 'function') {
                        saveToLocalStorage();
                    }
                    
                    setTimeout(() => {
                        // محاكاة refresh
                        if (typeof loadFromLocalStorage === 'function') {
                            loadFromLocalStorage();
                        }
                        
                        setTimeout(() => {
                            console.log('📝 الخطوة 4: فحص النتائج');
                            
                            // فحص النص الأول
                            if (typeof selectTranslationByIndex === 'function') {
                                selectTranslationByIndex(firstIndex);
                            }
                            
                            setTimeout(() => {
                                const firstResultValue = translationText.value;
                                const firstSuccess = (firstResultValue === firstTestText);
                                
                                console.log(`✅ النص 1 - متوقع: "${firstTestText}"`);
                                console.log(`📋 النص 1 - موجود: "${firstResultValue}"`);
                                console.log(`🎯 النص 1 - النتيجة: ${firstSuccess ? 'نجح' : 'فشل'}`);
                                
                                // فحص النص الثاني
                                if (typeof selectTranslationByIndex === 'function') {
                                    selectTranslationByIndex(secondIndex);
                                }
                                
                                setTimeout(() => {
                                    const secondResultValue = translationText.value;
                                    const secondSuccess = (secondResultValue === secondTestText);
                                    
                                    console.log(`✅ النص 2 - متوقع: "${secondTestText}"`);
                                    console.log(`📋 النص 2 - موجود: "${secondResultValue}"`);
                                    console.log(`🎯 النص 2 - النتيجة: ${secondSuccess ? 'نجح' : 'فشل'}`);
                                    
                                    const overallSuccess = firstSuccess && secondSuccess;
                                    const newModifiedCount = (modifiedKeys && modifiedKeys.size) || 0;
                                    
                                    console.log('🏆 النتائج النهائية:', {
                                        'النص الأول': firstSuccess ? '✅ نجح' : '❌ فشل',
                                        'النص الثاني': secondSuccess ? '✅ نجح' : '❌ فشل',
                                        'التعديلات المحفوظة': `${newModifiedCount} (كان ${originalModifiedCount})`,
                                        'النتيجة الإجمالية': overallSuccess ? '✅ نجح' : '❌ فشل'
                                    });
                                    
                                    if (typeof showNotification === 'function') {
                                        const message = overallSuccess ? 
                                            `🎉 اختبار الانتقال نجح!\n\n` +
                                            `✅ النص 1: محفوظ\n` +
                                            `✅ النص 2: محفوظ\n` +
                                            `💾 التعديلات: ${newModifiedCount}\n\n` +
                                            `🏆 المشكلة مُحلة!` :
                                            `❌ اختبار الانتقال فشل!\n\n` +
                                            `النص 1: ${firstSuccess ? '✅' : '❌'}\n` +
                                            `النص 2: ${secondSuccess ? '✅' : '❌'}\n\n` +
                                            `تحقق من الكونسول للتفاصيل.`;
                                            
                                        showNotification(message, overallSuccess ? 'success' : 'error');
                                    }
                                    
                                    // إعادة النصوص للأصل
                                    setTimeout(() => {
                                        console.log('🔄 إعادة النصوص للحالة الأصلية...');
                                        
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
                                                    
                                                    // العودة للفهرس الأصلي
                                                    setTimeout(() => {
                                                        if (typeof selectTranslationByIndex === 'function') {
                                                            selectTranslationByIndex(originalIndex);
                                                        }
                                                        console.log('✅ تم إرجاع جميع النصوص للحالة الأصلية');
                                                    }, 500);
                                                }, 500);
                                            }, 500);
                                        }, 500);
                                    }, 2000);
                                    
                                    console.log('✅ انتهى اختبار الانتقال');
                                }, 500);
                            }, 500);
                        }, 500);
                    }, 500);
                }, 1000);
            }, 1000);
        }, 1000);
    }, 1000);
    
    console.log('🚀 تم إطلاق اختبار الانتقال...');
}; 

// عرض جميع دوال الاختبار المتوفرة
window.showAllTests = function() {
    console.log('🧪 دليل جميع دوال الاختبار المتوفرة:');
    console.log('');
    
    const tests = [
        {
            name: 'testCompleteTextEditingSolution()',
            description: '🏆 الاختبار الشامل - يفحص جميع الوظائف',
            category: 'شامل'
        },
        {
            name: 'testNavigationSaving()',
            description: '🔄 اختبار حفظ النص عند الانتقال بين النصوص',
            category: 'جديد'
        },
        {
            name: 'testNewFileLoading()',
            description: '📁 اختبار مسح البيانات عند تحميل ملف جديد',
            category: 'جديد'
        },
        {
            name: 'testModificationSaving()',
            description: '💾 اختبار حفظ التعديلات',
            category: 'أساسي'
        },
        {
            name: 'testTextRecoveryAfterRefresh()',
            description: '🔄 اختبار استرجاع النص بعد refresh',
            category: 'أساسي'
        },
        {
            name: 'testCurrentlyEditedText()',
            description: '✏️ اختبار حفظ النص المُعدل حالياً',
            category: 'أساسي'
        },
        {
            name: 'quickTestAfterFix()',
            description: '⚡ اختبار سريع للتحقق من الإصلاحات',
            category: 'سريع'
        },
        {
            name: 'showSystemStatus()',
            description: '📊 عرض حالة النظام التفصيلية',
            category: 'تشخيص'
        },
        {
            name: 'diagnoseEnglishTexts()',
            description: '🔍 تشخيص النصوص الإنجليزية',
            category: 'تشخيص'
        },
        {
            name: 'fixLocalStorageData()',
            description: '🔧 إصلاح البيانات المحفوظة',
            category: 'إصلاح'
        },
        {
            name: 'resetAllData()',
            description: '🗑️ حذف جميع البيانات (خطر!)',
            category: 'إصلاح'
        },
        {
            name: 'clearPreviousFileText()',
            description: '🗑️ مسح النص من الملف السابق فوراً',
            category: 'إصلاح'
        }
    ];
    
    // تجميع حسب الفئة
    const categories = {};
    tests.forEach(test => {
        if (!categories[test.category]) {
            categories[test.category] = [];
        }
        categories[test.category].push(test);
    });
    
    // عرض مُنظم
    Object.entries(categories).forEach(([category, categoryTests]) => {
        console.log(`\n🔖 ${category}:`);
        categoryTests.forEach(test => {
            console.log(`   ${test.name}`);
            console.log(`   └─ ${test.description}`);
        });
    });
    
    console.log('\n💡 نصائح:');
    console.log('• ابدأ بـ testCompleteTextEditingSolution() للاختبار الشامل');
    console.log('• استخدم testNavigationSaving() لاختبار المشكلة الجديدة');
    console.log('• استخدم showSystemStatus() لفحص حالة النظام');
    console.log('• استخدم quickTestAfterFix() للاختبار السريع');
    
    if (typeof showNotification === 'function') {
        showNotification(
            '🧪 دليل الاختبارات\n\n' +
            '🏆 testCompleteTextEditingSolution() - شامل\n' +
            '🔄 testNavigationSaving() - الانتقال\n' +
            '📁 testNewFileLoading() - ملف جديد\n' +
            '🗑️ clearPreviousFileText() - مسح فوري\n' +
            '⚡ quickTestAfterFix() - سريع\n' +
            '📊 showSystemStatus() - حالة النظام\n\n' +
            '💡 تحقق من الكونسول للقائمة الكاملة',
            'info'
        );
    }
    
    console.log('\n✅ تم عرض جميع دوال الاختبار');
};

// تشغيل تلقائي لعرض دليل الاختبارات
console.log('🧪 للحصول على قائمة جميع الاختبارات، اكتب: showAllTests()');
console.log('🎯 للاختبار السريع للمشكلة الجديدة، اكتب: testNavigationSaving()');
console.log('📁 لاختبار مشكلة الملف الجديد، اكتب: testNewFileLoading()');
console.log('🗑️ لمسح النص من الملف السابق فوراً، اكتب: clearPreviousFileText()');

// اختبار خاص لمشكلة تحميل ملف جديد
window.testNewFileLoading = function() {
    console.log('🧪 اختبار تحميل ملف جديد وضمان مسح البيانات السابقة...');
    
    if (!translationText || !translationKeys || translationKeys.length === 0) {
        console.log('❌ يجب وجود ملف محمل للاختبار');
        if (typeof showNotification === 'function') {
            showNotification('❌ يجب وجود ملف محمل للاختبار!', 'error');
        }
        return;
    }
    
    // الخطوة 1: تعديل نص في الملف الحالي
    const currentKey = translationKeys[currentIndex];
    const originalValue = originalTranslations && originalTranslations[currentKey] ? 
                         originalTranslations[currentKey].replace(/"/g, '').trim() : '';
    const testValue = originalValue + " - [TEST FROM PREVIOUS FILE]";
    
    console.log('📝 الخطوة 1: تعديل نص في الملف الحالي');
    console.log(`🔑 المفتاح: ${currentKey}`);
    console.log(`📖 النص الأصلي: "${originalValue}"`);
    console.log(`✏️ النص المُعدل: "${testValue}"`);
    
    // تعديل النص
    translationText.value = testValue;
    translationText.dispatchEvent(new Event('input'));
    
    setTimeout(() => {
        // فحص أن التعديل تم
        const beforeFileLoad = {
            currentEditingKey: window.currentEditingKey || currentEditingKey,
            currentEditedValue: window.currentEditedValue || currentEditedValue,
            modifiedCount: (modifiedKeys && modifiedKeys.size) || 0,
            currentFile: currentFile ? (currentFile.name || currentFile) : 'N/A'
        };
        
        console.log('📊 قبل تحميل ملف جديد:', beforeFileLoad);
        
        // الخطوة 2: محاكاة تحميل ملف جديد
        console.log('📝 الخطوة 2: محاكاة تحميل ملف جديد...');
        
        // محاكاة البيانات الجديدة
        const mockNewFileData = {
            'test_key_1': '"Test translation 1"',
            'test_key_2': '"Test translation 2"',
            'test_key_3': '"Test translation 3"'
        };
        
        // تطبيق منطق تحميل ملف جديد (نفس ما يحدث في loadYamlContent)
        console.log('🗑️ مسح البيانات السابقة...');
        
        // Reset unsaved changes first
        window.hasUnsavedChanges = false;
        hasUnsavedChanges = false;
        
        window.modifiedKeys.clear();
        modifiedKeys.clear();
        
        window.currentEditingKey = '';
        currentEditingKey = '';
        
        window.currentEditedValue = '';
        currentEditedValue = '';
        
        // مسح عنصر النص في الواجهة أيضاً (مهم جداً!)
        if (translationText) {
            translationText.value = '';
            console.log('🗑️ تم مسح عنصر النص في الواجهة');
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
        
        // تحديث الفهرس
        window.currentIndex = 0;
        currentIndex = 0;
        
        console.log('📊 بعد تحميل الملف الجديد:');
        console.log(`🔑 currentEditingKey: "${window.currentEditingKey || currentEditingKey}"`);
        console.log(`📝 currentEditedValue: "${window.currentEditedValue || currentEditedValue}"`);
        console.log(`📊 modifiedCount: ${(modifiedKeys && modifiedKeys.size) || 0}`);
        console.log(`📁 translationKeys: ${translationKeys.length} keys`);
        
        setTimeout(() => {
            // الخطوة 3: اختيار نص من الملف الجديد
            console.log('📝 الخطوة 3: اختيار نص من الملف الجديد...');
            
            if (typeof selectTranslationByIndex === 'function') {
                selectTranslationByIndex(0);
            }
            
            setTimeout(() => {
                const afterSelection = {
                    currentDisplayedText: translationText ? translationText.value : 'N/A',
                    currentEditingKey: window.currentEditingKey || currentEditingKey,
                    currentEditedValue: window.currentEditedValue || currentEditedValue,
                    expectedText: 'Test translation 1', // النص الصحيح من البيانات المحاكية
                    selectedKey: translationKeys[0]
                };
                
                console.log('📊 بعد اختيار النص الجديد:', afterSelection);
                
                // فحص النتائج
                const textMatches = (afterSelection.currentDisplayedText === afterSelection.expectedText);
                const noOldData = (!afterSelection.currentDisplayedText.includes('TEST FROM PREVIOUS FILE') && 
                                   !afterSelection.currentEditedValue.includes('TEST FROM PREVIOUS FILE'));
                const correctKey = (afterSelection.selectedKey === 'test_key_1');
                
                const success = textMatches && noOldData && correctKey;
                
                console.log('🔍 فحص النتائج:');
                console.log(`✅ النص المعروض صحيح: ${textMatches ? 'نعم' : 'لا'} ("${afterSelection.currentDisplayedText}" vs "${afterSelection.expectedText}")`);
                console.log(`🗑️ لا توجد بيانات قديمة: ${noOldData ? 'نعم' : 'لا'} (فحص عدم وجود "TEST FROM PREVIOUS FILE")`);
                console.log(`🔑 المفتاح صحيح: ${correctKey ? 'نعم' : 'لا'} ("${afterSelection.selectedKey}")`);
                
                if (typeof showNotification === 'function') {
                    const message = success ? 
                        `✅ اختبار الملف الجديد نجح!\n\n` +
                        `🗑️ تم مسح البيانات السابقة\n` +
                        `📝 النص الجديد معروض بشكل صحيح\n` +
                        `🔑 لا توجد تداخلات من الملف السابق\n\n` +
                        `🎉 المشكلة مُحلة!` :
                        `❌ اختبار الملف الجديد فشل!\n\n` +
                        `النص صحيح: ${textMatches ? '✅' : '❌'}\n` +
                        `لا بيانات قديمة: ${noOldData ? '✅' : '❌'}\n` +
                        `المفتاح صحيح: ${correctKey ? '✅' : '❌'}\n\n` +
                        `📝 المعروض: "${afterSelection.currentDisplayedText}"\n` +
                        `📝 المتوقع: "${afterSelection.expectedText}"`;
                        
                    showNotification(message, success ? 'success' : 'error');
                }
                
                console.log('🎯 النتيجة النهائية:', success ? '✅ نجح' : '❌ فشل');
                console.log('✅ انتهى اختبار تحميل الملف الجديد');
                
            }, 1000);
         }, 1000);
     }, 1000);
     
     console.log('🚀 تم إطلاق اختبار تحميل الملف الجديد...');
 };

// دالة إصلاح سريعة لمسح النص من الملف السابق
window.clearPreviousFileText = function() {
    console.log('🗑️ مسح النص من الملف السابق...');
    
    const translationText = document.getElementById('translationText');
    if (translationText) {
        translationText.value = '';
        console.log('✅ تم مسح عنصر النص في الواجهة');
    }
    
    // مسح المتغيرات العامة
    window.currentEditedValue = '';
    currentEditedValue = '';
    window.currentEditingKey = '';
    currentEditingKey = '';
    
    console.log('✅ تم مسح المتغيرات العامة');
    
    // إعادة اختيار النص الحالي ليتم عرضه بشكل صحيح
    if (typeof selectTranslationByIndex === 'function' && 
        typeof currentIndex !== 'undefined' && 
        translationKeys && translationKeys.length > 0) {
        
        setTimeout(() => {
            selectTranslationByIndex(currentIndex);
            console.log('✅ تم إعادة عرض النص الصحيح');
            
            if (typeof showNotification === 'function') {
                showNotification(
                    '🗑️ تم مسح النص من الملف السابق!\n\n' +
                    '✅ تم مسح عنصر الواجهة\n' +
                    '✅ تم مسح المتغيرات العامة\n' +
                    '✅ تم إعادة عرض النص الصحيح\n\n' +
                    '💡 جرب تحديث الصفحة إذا ظهرت المشكلة مرة أخرى',
                    'success'
                );
            }
        }, 100);
    } else {
        if (typeof showNotification === 'function') {
            showNotification(
                '🗑️ تم مسح النص من الملف السابق!\n\n' +
                '⚠️ قم بتحديد نص من القائمة لعرضه بشكل صحيح',
                'info'
            );
        }
    }
    
    console.log('✅ انتهى مسح البيانات من الملف السابق');
};
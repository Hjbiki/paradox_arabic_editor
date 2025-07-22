// ===========================================
// YAML LOADING AND PROCESSING - معالجة YAML
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
        console.error('❌ لم يتم تمرير ملف');
        return;
    }
    
    console.log('📁 بدء معالجة الملف:', file.name);
    
    // حفظ معلومات الملف الكاملة
    currentFile = {
        name: file.name,
        size: file.size,
        lastModified: file.lastModified,
        type: file.type || 'text/yaml'
    };
    window.currentFile = currentFile;
    
    console.log('📋 معلومات الملف المحفوظة:', currentFile);
    
    const reader = new FileReader();
    
    reader.onload = function(e) {
        try {
            const content = e.target.result;
            console.log('📖 تم قراءة محتوى الملف بنجاح');
            
            // معالجة محتوى الملف
            loadYamlContent(content, file.name);
            
            // حفظ البيانات فوراً بعد التحميل
            if (typeof saveToLocalStorage === 'function') {
                saveToLocalStorage();
            }
            
            // إشعار نجاح مع معلومات الملف
            if (typeof showNotification === 'function') {
                showNotification(
                    `✅ تم تحميل الملف بنجاح!\n\n` +
                    `📁 اسم الملف: ${file.name}\n` +
                    `📊 عدد الترجمات: ${Object.keys(translations || {}).length}\n` +
                    `💾 تم حفظ العمل تلقائياً`,
                    'success'
                );
            }
            
        } catch (error) {
            console.error('❌ خطأ في قراءة الملف:', error);
            if (typeof showNotification === 'function') {
                showNotification(`خطأ في قراءة الملف: ${error.message}`, 'error');
            }
        }
    };
    
    reader.onerror = function(error) {
        console.error('❌ خطأ في FileReader:', error);
        if (typeof showNotification === 'function') {
            showNotification('فشل في قراءة الملف. تأكد من صحة الملف.', 'error');
        }
    };
    
    reader.readAsText(file, 'utf-8');
}

function loadYamlContent(content, filename) {
    try {
        console.log('📂 بدء معالجة محتوى YAML...');
        
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
                    if (typeof cleanText === 'function') {
                        value = cleanText(value);
                    } else {
                        // Fallback cleaning
                        value = value.replace(/#NT!/g, '').replace(/#[A-Z0-9]+!/g, '').replace(/"/g, '').trim();
                    }
                    
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
        window.hasUnsavedChanges = false;
        hasUnsavedChanges = false;
        
        window.modifiedKeys.clear(); // Clear modified keys when loading new file
        modifiedKeys.clear();
        
        window.currentEditingKey = ''; // Clear current editing key
        currentEditingKey = '';
        
        window.currentEditedValue = ''; // مسح النص المُعدل من الملف السابق
        currentEditedValue = '';
        
        // مسح عنصر النص في الواجهة أيضاً (مهم جداً!)
        const translationText = document.getElementById('translationText');
        if (translationText) {
            translationText.value = '';
            console.log('🗑️ تم مسح عنصر النص في الواجهة');
        }
        
        console.log('🗑️ تم مسح جميع بيانات التعديل من الملف السابق');
        
        // Update global translation data
        window.translations = yamlData;
        translations = yamlData;
        
        window.originalTranslations = { ...yamlData };
        originalTranslations = { ...yamlData };
        
        window.translationKeys = Object.keys(yamlData);
        translationKeys = Object.keys(yamlData);
        
        window.filteredTranslations = { ...yamlData };
        filteredTranslations = { ...yamlData };
        
        // لا نمسح englishTranslations إذا كانت موجودة بالفعل (محفوظة من قبل)
        // فقط نمسحها إذا كانت فارغة أو لملف مختلف
        const shouldResetEnglish = !englishTranslations || 
                                   Object.keys(englishTranslations).length === 0 ||
                                   !currentFile ||
                                   (currentFile.lastEnglishFile && currentFile.lastEnglishFile !== filename);
        
        if (shouldResetEnglish) {
            window.englishTranslations = {};
            englishTranslations = {};
            console.log('🔄 تم إعادة تعيين النصوص الإنجليزية للملف الجديد');
        } else {
            console.log('✅ تم الاحتفاظ بالنصوص الإنجليزية المحفوظة مسبقاً');
        }
        
        // محاولة تحميل الملف الإنجليزي المطابق (في الخلفية)
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
        
        console.log(`تم تحميل ${Object.keys(yamlData).length} ترجمة بنجاح من الملف: ${filename}`);
        
        // إخفاء شاشة التحميل بعد الانتهاء من التحميل الأساسي
        setTimeout(() => {
            if (typeof hideLoading === 'function') {
                hideLoading();
            }
        }, 50);
        
    } catch (error) {
        if (typeof hideLoading === 'function') {
            hideLoading();
        }
        console.error('خطأ في تحليل YAML:', error);
        throw new Error(`خطأ في تحليل YAML: ${error.message}`);
    }
}

// Load English reference file for comparison
async function loadEnglishReferenceFile(filename, retryCount = 0) {
    try {
        if (!filename) {
            console.log('ℹ️ لا يوجد اسم ملف لتحميل المرجع الإنجليزي');
            return;
        }
        
        const englishFileName = filename.replace(/^.*[\\\/]/, ''); // إزالة المسار
        const englishFilePath = `english/${englishFileName}`;
        
        console.log(`🔍 محاولة تحميل الملف الإنجليزي: ${englishFilePath} (المحاولة ${retryCount + 1})`);
        
        const response = await fetch(englishFilePath);
        
        if (!response.ok) {
            if (response.status === 404 && retryCount < 3) {
                // إعادة المحاولة بعد تأخير متزايد (GitHub Pages قد يحتاج وقت)
                const delay = (retryCount + 1) * 2000; // 2s, 4s, 6s
                console.log(`⏳ GitHub Pages قد يحتاج وقت للتحديث. إعادة المحاولة خلال ${delay/1000} ثواني...`);
                setTimeout(() => loadEnglishReferenceFile(filename, retryCount + 1), delay);
                return;
            }
            
            console.log(`ℹ️ لا يوجد ملف إنجليزي مطابق: ${englishFilePath} (بعد ${retryCount + 1} محاولات)`);
            
            // إشعار للمستخدم
            if (typeof showNotification === 'function' && retryCount >= 3) {
                showNotification(
                    `📂 لم يتم العثور على الملف المرجعي\n\n` +
                    `🔍 البحث عن: ${englishFilePath}\n` +
                    `⏳ GitHub Pages قد يحتاج وقت لتحديث الملفات الجديدة\n\n` +
                    `💡 جرب إعادة فتح الملف خلال بضع دقائق`,
                    'warning'
                );
            }
            return;
        }
        
        const englishContent = await response.text();
        console.log(`📖 تم العثور على الملف الإنجليزي: ${englishFilePath}`);
        
        // Parse English YAML
        const additionalEnglishData = parseYAMLContent(englishContent);
        
        if (additionalEnglishData && Object.keys(additionalEnglishData).length > 0) {
            // حفظ أو دمج النصوص الإنجليزية
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
            
            // حفظ معلومات عن الملف الإنجليزي المحمل
            if (currentFile) {
                currentFile.lastEnglishFile = filename;
                window.currentFile = currentFile;
            }
            
            console.log(`✅ تم تحميل ${addedCount + updatedCount} نص إنجليزي (${addedCount} جديد، ${updatedCount} محدث)`);
            
            // حفظ البيانات المحدثة
            if (typeof saveToLocalStorage === 'function') {
                saveToLocalStorage();
            }
            
            // تحديث العرض إذا كان هناك نص مختار حالياً
            if (typeof selectTranslationByIndex === 'function' && currentIndex >= 0) {
                setTimeout(() => {
                    selectTranslationByIndex(currentIndex);
                }, 100);
            }
            
            if (typeof showNotification === 'function') {
                showNotification(
                    `📖 تم تحميل الملف الإنجليزي المرجعي!\n\n` +
                    `📁 الملف: ${englishFileName}\n` +
                    `📝 النصوص: ${addedCount + updatedCount}\n` +
                    `✅ المراجع متوفرة الآن`,
                    'success'
                );
            }
        }
        
    } catch (error) {
        console.log(`ℹ️ لم يتم العثور على ملف إنجليزي مطابق: ${error.message}`);
        // ليس خطأ فادح - مجرد عدم وجود ملف مرجعي
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
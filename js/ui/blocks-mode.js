// ===========================================
// BLOCKS MODE SYSTEM - نظام وضع البلوكات
// ===========================================

// Command Blocks System
function convertTextToBlocks(text, missingBlocks = []) {
    if (!text) return '';
    if (window.debugBlocks) console.log('🔍 تحويل النص للبلوكات:', text);
    
    let result = text;

    // دالة مساعدة لإضافة class المفقود
    const addMissingClass = (match) => {
        const isMissing = missingBlocks.includes(match);
        const missingClass = isMissing ? ' missing' : '';
        const missingTitle = isMissing ? ' (مفقود في الترجمة!)' : '';
        return { missingClass, missingTitle };
    };

    // تم نقل الدالة إلى مكان أفضل
    result = result.replace(/\\n/g, (match) => {
        const { missingClass, missingTitle } = addMissingClass(match);
        return `<span class="newline-block${missingClass}" draggable="false" data-type="newline" title="سطر جديد${missingTitle}">\\n</span>`;
    });
    
    // 2. تحويل الأيقونات مثل nickname_icon! و stress_icon!
    result = result.replace(/(\w+_icon!)/g, (match, p1) => {
        const { missingClass, missingTitle } = addMissingClass(p1);
        return `<span class="command-block${missingClass}" draggable="false" data-type="icon" title="${p1}${missingTitle}">${p1}</span>`;
    });
    
    // 3. تحويل المتغيرات المعقدة مع pipes مثل $DEAD|V$ و $INITIAL|V$
    result = result.replace(/(\$[A-Z_]+\|[A-Z]+\$)/g, (match, p1) => {
        const { missingClass, missingTitle } = addMissingClass(p1);
        return `<span class="command-block${missingClass}" draggable="false" data-type="variable" title="${p1}${missingTitle}">${p1}</span>`;
    });
    
    // 4. تحويل المتغيرات الطويلة مثل $building_type_hall_of_heroes_01_desc$
    result = result.replace(/(\$[a-zA-Z_][a-zA-Z0-9_]{3,}\$)/g, (match, p1) => {
        const { missingClass, missingTitle } = addMissingClass(p1);
        return `<span class="command-block${missingClass}" draggable="false" data-type="variable" title="${p1}${missingTitle}">${p1}</span>`;
    });
    
    // 5. تحويل المتغيرات العادية القصيرة $VAR$
    result = result.replace(/(\$[A-Z_]{1,8}\$)/g, (match, p1) => {
        const { missingClass, missingTitle } = addMissingClass(p1);
        return `<span class="command-block${missingClass}" draggable="false" data-type="variable" title="${p1}${missingTitle}">${p1}</span>`;
    });
    
    // 6. تحويل المتغيرات المختلطة مثل $variable$
    result = result.replace(/(\$[a-z][a-zA-Z_]{1,8}\$)/g, (match, p1) => {
        const { missingClass, missingTitle } = addMissingClass(p1);
        return `<span class="command-block${missingClass}" draggable="false" data-type="variable" title="${p1}${missingTitle}">${p1}</span>`;
    });
    
    // 7. تحويل الأوامر المعقدة جداً مع دوال ومعاملات مثل [GetVassalStance( 'belligerent' ).GetName]
    result = result.replace(/(?!<span[^>]*>)(\[[A-Za-z][A-Za-z0-9_]*\([^)]*\)[^[\]]*\])(?![^<]*<\/span>)/g, (match, p1) => {
        const { missingClass, missingTitle } = addMissingClass(p1);
        return `<span class="command-block${missingClass}" draggable="false" data-type="command" title="${p1}${missingTitle}">${p1}</span>`;
    });
    
    // 8. تحويل الأوامر الطويلة جداً مع أقواس معقدة مثل [AddLocalizationIf(...)]
    result = result.replace(/(?!<span[^>]*>)(\[[A-Za-z][^[\]]*\([^[\]]*\)[^[\]]*\])(?![^<]*<\/span>)/g, (match, p1) => {
        const { missingClass, missingTitle } = addMissingClass(p1);
        return `<span class="command-block${missingClass}" draggable="false" data-type="command" title="${p1}${missingTitle}">${p1}</span>`;
    });
    
    // 9. تحويل الأوامر مع ScriptValue وpipes مثل [attacker.MakeScope.ScriptValue('...')|V0]
    result = result.replace(/(?!<span[^>]*>)(\[[a-zA-Z_][a-zA-Z0-9_]*\.[\w\.]*ScriptValue[^[\]]*\|[A-Z0-9]+\])(?![^<]*<\/span>)/g, (match, p1) => {
        const { missingClass, missingTitle } = addMissingClass(p1);
        return `<span class="command-block${missingClass}" draggable="false" data-type="command" title="${p1}${missingTitle}">${p1}</span>`;
    });
    
    // 10. تحويل الأوامر المعقدة مع نقاط وpipes مثل [exceptional_guest.GetShortUIName|U]
    result = result.replace(/(?!<span[^>]*>)(\[[a-zA-Z_][a-zA-Z0-9_]*\.[a-zA-Z0-9_\.]+\|[A-Z]+\])(?![^<]*<\/span>)/g, (match, p1) => {
        const { missingClass, missingTitle } = addMissingClass(p1);
        return `<span class="command-block${missingClass}" draggable="false" data-type="command" title="${p1}${missingTitle}">${p1}</span>`;
    });
    
    // 11. تحويل الأوامر المعقدة مع نقاط فقط مثل [guest.GetTitledFirstName]
    result = result.replace(/(?!<span[^>]*>)(\[[a-zA-Z_][a-zA-Z0-9_]*\.[a-zA-Z0-9_\.]+\])(?![^<]*<\/span>)/g, (match, p1) => {
        const { missingClass, missingTitle } = addMissingClass(p1);
        return `<span class="command-block${missingClass}" draggable="false" data-type="command" title="${p1}${missingTitle}">${p1}</span>`;
    });
    
    // 12. تحويل الأوامر المتقدمة مثل [ROOT.Char.Custom('GetSomething')] (أوامر معقدة عامة)
    result = result.replace(/(?!<span[^>]*>)(\[[A-Z][a-zA-Z]*\.[\w\.\(\)'"`#!?:\s-]+\])(?![^<]*<\/span>)/g, (match, p1) => {
        const { missingClass, missingTitle } = addMissingClass(p1);
        return `<span class="command-block${missingClass}" draggable="false" data-type="command" title="${p1}${missingTitle}">${p1}</span>`;
    });
    
    // 13. تحويل الأوامر مع pipes مثل [soldiers|E] و [county_control|E] (تجنب المُحوَّلة مسبقاً)
    result = result.replace(/(?!<span[^>]*>)(\[[a-zA-Z_][a-zA-Z0-9_]*\|[A-Z]+\])(?![^<]*<\/span>)/g, (match, p1) => {
        const { missingClass, missingTitle } = addMissingClass(p1);
        return `<span class="command-block${missingClass}" draggable="false" data-type="command" title="${p1}${missingTitle}">${p1}</span>`;
    });
    
    // 14. تحويل الأوامر البسيطة مثل [culture] و [development_growth] (تجنب المُحوَّلة مسبقاً)
    result = result.replace(/(?!<span[^>]*>)(\[[a-zA-Z_][a-zA-Z0-9_]*\])(?![^<]*<\/span>)/g, (match, p1) => {
        // تجنب الأوامر التي تحتوي على pipes أو نقاط أو أقواس (تم معالجتها مسبقاً)
        if (p1.includes('|') || p1.includes('.') || p1.includes('(')) {
            return match; // لا تحويل
        }
        const { missingClass, missingTitle } = addMissingClass(p1);
        return `<span class="command-block${missingClass}" draggable="false" data-type="command" title="${p1}${missingTitle}">${p1}</span>`;
    });
     
    // 12. تحويل الأوامر الخاصة فقط إذا كانت كلها أحرف كبيرة وبدون مسافات #SPECIAL#
    result = result.replace(/(\#[A-Z_]{2,}\#)/g, (match, p1) => {
        const { missingClass, missingTitle } = addMissingClass(p1);
        return `<span class="command-block${missingClass}" draggable="false" data-type="special" title="${p1}${missingTitle}">${p1}</span>`;
    });
     
    // 13. تحويل أوامر خاصة معينة بالتحديد مثل #EMP!# و #X!#
    result = result.replace(/(\#[A-Z]{1,5}!\#)/g, (match, p1) => {
        const { missingClass, missingTitle } = addMissingClass(p1);
        return `<span class="command-block${missingClass}" draggable="false" data-type="special" title="${p1}${missingTitle}">${p1}</span>`;
    });
    
    if (window.debugBlocks) console.log('✅ النتيجة بعد التحويل:', result);
    return result;
}

function convertBlocksToText(html) {
    if (!html) return '';
    if (window.debugBlocks) console.log('🔄 تحويل البلوكات للنص:', html);
    
    // إنشاء عنصر مؤقت لاستخراج النص
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    
    // استخراج النص من العقد النصية والبلوكات فقط
    let result = '';
    
    function extractTextFromNode(node) {
        if (node.nodeType === Node.TEXT_NODE) {
            return node.textContent || '';
        } else if (node.nodeType === Node.ELEMENT_NODE) {
            if (node.classList.contains('command-block') || node.classList.contains('newline-block')) {
                // استخراج النص من البلوكات (تجاهل الـ HTML)
                return node.textContent || '';
            } else {
                // للعناصر الأخرى، استخرج النص من الأطفال
                let text = '';
                for (const child of node.childNodes) {
                    text += extractTextFromNode(child);
                }
                return text;
            }
        }
        return '';
    }
    
    // استخراج النص من جميع العقد
    for (const child of tempDiv.childNodes) {
        result += extractTextFromNode(child);
    }
    
    // تنظيف نهائي للنص
    result = result
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&nbsp;/g, ' ')
        .trim();
    
    if (window.debugBlocks) console.log('✅ النص النهائي بعد التنظيف:', result);
    return result;
}

function enableBlockMode(element) {
    if (!element) {
        console.warn('⚠️ لا يمكن تفعيل وضع البلوكات - عنصر غير صالح');
        return;
    }
    
    // التحقق من وجود blocks editor سابق لتجنب التكرار
    const existingBlocksEditor = element.parentNode.querySelector('.blocks-editor');
    if (existingBlocksEditor) {
        console.log('ℹ️ وضع البلوكات مفعل مسبقاً');
        // تأكد من أن العنصر الأصلي مخفي
        element.style.display = 'none';
        return existingBlocksEditor;
    }
    
    // تنظيف أي عناصر متضاربة قبل إنشاء واحد جديد
    const allBlocksEditors = document.querySelectorAll('.blocks-editor');
    if (allBlocksEditors.length > 0) {
        console.log('🧹 إزالة blocks editors موجودة مسبقاً قبل إنشاء جديد');
        allBlocksEditors.forEach(editor => editor.remove());
    }
    
    const text = element.value || element.textContent || '';
    
    if (element.tagName === 'TEXTAREA') {
        // تنظيف النص قبل تحويله للبلوكات
        const cleanText = text.trim();
        const blocksHtml = convertTextToBlocks(cleanText);
        
        // إنشاء blocks editor جديد
        const blockDiv = document.createElement('div');
        blockDiv.className = 'blocks-editor';
        blockDiv.contentEditable = true;
        blockDiv.innerHTML = blocksHtml;
        
        // نسخ الستايلات المهمة فقط
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
        
        // إخفاء textarea وإظهار blocks editor
        element.style.display = 'none';
        element.parentNode.insertBefore(blockDiv, element.nextSibling);
        
        // ربط التحديثات مع debounce
        let updateTimeout;
        blockDiv.addEventListener('input', function() {
            const newText = convertBlocksToText(blockDiv.innerHTML);
            element.value = newText;
            
            // إرسال event للـ textarea الأصلي
            element.dispatchEvent(new Event('input', { bubbles: true }));
            
            // تحديث البلوكات بعد تأخير قصير لتجنب التكرار
            clearTimeout(updateTimeout);
            updateTimeout = setTimeout(() => {
                refreshBlocks(blockDiv, element);
            }, 300);
        });
        
        // تطبيق الإعدادات الحالية
        setTimeout(() => {
            const fontSize = document.getElementById('fontSize');
            const textAlign = document.getElementById('textAlign');
            
            if (fontSize && fontSize.value && fontSize.value !== '16') {
                blockDiv.style.fontSize = fontSize.value + 'px';
            }
            
            if (textAlign && textAlign.value && textAlign.value !== 'right') {
                blockDiv.style.textAlign = textAlign.value;
            }
            
            console.log('✅ تم تطبيق الإعدادات على وضع البلوكات');
        }, 50);
        
        console.log('✅ تم إنشاء blocks editor جديد');
        return blockDiv;
    } else {
        // للـ div عادي - لم نعد نستخدم drag-and-drop
        const cleanText = text.trim();
        element.innerHTML = convertTextToBlocks(cleanText);
        console.log('✅ تم تحديث div بوضع البلوكات');
        return element;
    }
}

// استخراج البلوكات من النص
function extractBlocksFromText(text) {
    if (!text) return [];
    
    const blocks = [];
    const patterns = [
        // المتغيرات مع pipes
        /\$[A-Z_]+\|[A-Z]+\$/g,
        // المتغيرات الطويلة  
        /\$[a-zA-Z_][a-zA-Z0-9_]{3,}\$/g,
        // المتغيرات القصيرة
        /\$[A-Z_]{1,8}\$/g,
        // المتغيرات المختلطة
        /\$[a-z][a-zA-Z_]{1,8}\$/g,
        // الأوامر مع pipes
        /\[[a-zA-Z_]+\|[A-Z]+\]/g,
        // الأوامر المعقدة
        /\[[\w\.\(\)'"`_\|\$#!?:\s-]+\]/g,
        // الأوامر الخاصة
        /\#[A-Z_]{2,}\#/g,
        /\#[A-Z]{1,5}!\#/g,
        // الأيقونات
        /\w+_icon!/g,
        // أسطر جديدة
        /\\n/g
    ];
    
    patterns.forEach(pattern => {
        const matches = text.match(pattern);
        if (matches) {
            blocks.push(...matches);
        }
    });
    
    return [...new Set(blocks)]; // إزالة المكررات
}

// مقارنة البلوكات بين النص المرجعي والترجمة
function findMissingBlocks(originalText, translatedText) {
    const originalBlocks = extractBlocksFromText(originalText);
    const translatedBlocks = extractBlocksFromText(translatedText);
    
    const missingBlocks = originalBlocks.filter(block => 
        !translatedBlocks.includes(block)
    );
    
    if (window.debugBlocks) {
        console.log('🔍 البلوكات في النص المرجعي:', originalBlocks);
        console.log('🔍 البلوكات في الترجمة:', translatedBlocks);
        console.log('⚠️ البلوكات المفقودة:', missingBlocks);
    }
    
    return missingBlocks;
}

// Toggle Blocks Mode
function toggleBlocksMode() {
    // تنظيف أي عناصر مكررة أولاً
    if (typeof cleanupDuplicateBlocksEditors === 'function') {
        cleanupDuplicateBlocksEditors();
    }
    
    const currentElement = translationText;
    if (!currentElement) {
        console.warn('⚠️ translationText غير موجود');
        return;
    }
    
    const container = currentElement.parentNode;
    const blocksEditor = container.querySelector('.blocks-editor');
    
    if (blocksEditor) {
        // إزالة وضع البلوكات
        currentElement.style.display = 'block';
        blocksEditor.remove();
        
        // إعادة النص المرجعي للوضع العادي
        const englishText = englishTranslations && currentEditingKey ? englishTranslations[currentEditingKey] : '';
        if (englishText && typeof updateOriginalTextDisplay === 'function') {
            updateOriginalTextDisplay(englishText, currentElement.value);
        }
        
        if (typeof showNotification === 'function') {
            showNotification('تم إيقاف وضع البلوكات', 'info');
        }
    } else {
        // تفعيل وضع البلوكات مع النص الحالي
        const currentText = currentElement.value;
        enableBlockMode(currentElement);
        
        // تحديث البلوكات فوراً بالنص الحالي
        const newBlocksEditor = container.querySelector('.blocks-editor');
        if (newBlocksEditor) {
            if (window.debugBlocks) console.log('🎯 تفعيل وضع البلوكات مع النص:', currentText);
            
            // الحصول على النص المرجعي للمقارنة
            const englishText = englishTranslations && currentEditingKey ? englishTranslations[currentEditingKey] : '';
            const missingBlocks = findMissingBlocks(englishText, currentText || '');
            
            const newBlocksHtml = convertTextToBlocks(currentText || '', missingBlocks);
            newBlocksEditor.innerHTML = newBlocksHtml;
            
            // إظهار تحذير إذا كان هناك بلوكات مفقودة
            if (missingBlocks.length > 0 && typeof showMissingBlocksWarning === 'function') {
                showMissingBlocksWarning(missingBlocks);
            }
            
            // تحديث النص المرجعي مع البلوكات
            if (englishText && typeof updateOriginalTextDisplay === 'function') {
                updateOriginalTextDisplay(englishText, currentText || '');
            }
            
            // البلوكات جاهزة للعرض
            console.log('✅ تم تفعيل وضع البلوكات');
            
            // التأكد من التحديث المستمر
            setTimeout(() => {
                refreshBlocks(newBlocksEditor, currentElement);
            }, 50);
        }
        
        if (typeof showNotification === 'function') {
            showNotification('تم تفعيل وضع البلوكات! 🧩', 'success');
        }
    }
}

// إضافة سطر جديد \n في مكان الكتابة
function insertNewline(autoFocused = false) {
    if (!translationText) {
        console.warn('⚠️ translationText غير موجود');
        return;
    }
    
    const container = translationText.parentNode;
    const blocksEditor = container.querySelector('.blocks-editor');
    const activeElement = document.activeElement;
    
    // التحقق من التركيز أولاً
    const isEditorFocused = activeElement === translationText || 
                           activeElement === blocksEditor ||
                           (blocksEditor && blocksEditor.contains(activeElement));
    
    // إذا لم يكن هناك تركيز على المحرر ولم نحاول التركيز من قبل
    if (!isEditorFocused && !autoFocused) {
        console.log('🎯 التركيز على المحرر أولاً...');
        if (blocksEditor && blocksEditor.style.display !== 'none') {
            // وضع البلوكات مفعل - ركز على blocks editor
            blocksEditor.focus();
            setTimeout(() => insertNewline(true), 100);
        } else {
            // الوضع العادي - ركز على textarea
            translationText.focus();
            setTimeout(() => insertNewline(true), 100);
        }
        return;
    }
    
    // إذا مازال التركيز مفقود حتى بعد المحاولة الثانية
    if (!isEditorFocused && autoFocused) {
        console.warn('⚠️ لا يمكن التركيز على المحرر، إضافة \\n في نهاية النص...');
    } else {
        console.log('✅ المحرر مركز عليه، إضافة \\n...');
    }
    
    // التحقق من الوضع الحالي
    if (blocksEditor && blocksEditor.style.display !== 'none') {
        // وضع البلوكات مفعل - إدراج في blocks editor
        insertNewlineInBlocksMode(blocksEditor);
    } else {
        // الوضع العادي - إدراج في textarea
        insertNewlineInTextMode(translationText);
    }
    
    // إظهار إشعار من الزر (ليس من اختصار لوحة المفاتيح)
    if (!event || !(event.shiftKey && event.key === 'Enter')) {
        if (typeof showNotification === 'function') {
            showNotification('تم إضافة سطر جديد ↵', 'success');
        }
    }
}

// إدراج سطر جديد في الوضع العادي (textarea)
function insertNewlineInTextMode(textarea) {
    if (!textarea) {
        console.warn('⚠️ لا يمكن العثور على textarea');
        return;
    }
    
    // التأكد من أن textarea نشط
    if (document.activeElement !== textarea) {
        textarea.focus();
    }
    
    // الحصول على موقع المؤشر
    const cursorPosition = textarea.selectionStart;
    const textBefore = textarea.value.substring(0, cursorPosition);
    const textAfter = textarea.value.substring(textarea.selectionEnd);
    
    // إدراج \n في موقع المؤشر
    const newText = textBefore + '\\n' + textAfter;
    textarea.value = newText;
    
    // تحريك المؤشر إلى بعد \n
    const newCursorPosition = cursorPosition + 2; // طول \n هو 2 أحرف
    setTimeout(() => {
        textarea.setSelectionRange(newCursorPosition, newCursorPosition);
        textarea.focus();
    }, 10);
    
    // إرسال event للتحديث
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
    
    console.log(`✅ تم إضافة \\n في الموقع ${cursorPosition}`);
}

// إدراج سطر جديد في وضع البلوكات
function insertNewlineInBlocksMode(blocksEditor) {
    if (!blocksEditor) {
        console.warn('⚠️ لا يمكن العثور على blocks editor');
        return;
    }
    
    // الحصول على موقع المؤشر في blocks editor
    const selection = window.getSelection();
    if (!selection.rangeCount) {
        // لا يوجد مؤشر - أضف في النهاية
        const newlineBlock = '<span class="newline-block" draggable="false" data-type="newline" title="سطر جديد">\\n</span>';
        blocksEditor.innerHTML += newlineBlock;
    } else {
        // إدراج في مكان المؤشر
        const range = selection.getRangeAt(0);
        const newlineBlock = document.createElement('span');
        newlineBlock.className = 'newline-block';
        newlineBlock.draggable = false;
        newlineBlock.setAttribute('data-type', 'newline');
        newlineBlock.setAttribute('title', 'سطر جديد');
        newlineBlock.textContent = '\\n';
        
        // إدراج البلوك الجديد
        range.deleteContents();
        range.insertNode(newlineBlock);
        
        // تحريك المؤشر بعد البلوك الجديد
        range.setStartAfter(newlineBlock);
        range.setEndAfter(newlineBlock);
        selection.removeAllRanges();
        selection.addRange(range);
    }
    
    // تحديث textarea المخفي
    const updatedText = convertBlocksToText(blocksEditor.innerHTML);
    if (translationText) {
        translationText.value = updatedText;
        
        // إرسال event للتحديث
        blocksEditor.dispatchEvent(new Event('input', { bubbles: true }));
        translationText.dispatchEvent(new Event('input', { bubbles: true }));
    }
    
    // التركيز على blocks editor
    blocksEditor.focus();
    
    console.log('✅ تم إضافة سطر جديد في وضع البلوكات');
}

// Refresh blocks when text changes
function refreshBlocks(blockDiv, originalElement) {
    if (!blockDiv || !originalElement) {
        if (window.debugBlocks) console.warn('⚠️ لا يمكن تحديث البلوكات - عناصر غير صالحة');
        return;
    }
    
    if (window.debugBlocks) console.log('🔄 تحديث البلوكات...');
    
    // الحصول على النص الحالي من textarea الأصلي مع تنظيف
    const originalText = (originalElement.value || '').trim();
    if (window.debugBlocks) console.log('📝 النص من textarea:', originalText);
    
    // تجنب التحديث إذا كان النص فارغ
    if (!originalText) {
        if (window.debugBlocks) console.log('⚠️ تجاهل التحديث - النص فارغ');
        return;
    }
    
    // الحصول على النص المرجعي الإنجليزي للمقارنة
    const englishText = englishTranslations && currentEditingKey ? englishTranslations[currentEditingKey] : '';
    
    // العثور على البلوكات المفقودة في النص المترجم
    const missingBlocks = findMissingBlocks(englishText, originalText);
    
    // تحويل النص المترجم للبلوكات مع تحديد المفقودة من النص المرجعي
    const newBlocksHtml = convertTextToBlocks(originalText, missingBlocks);
    
    // فقط إذا كان في تغيير فعلي - مقارنة محسنة
    const currentHtml = blockDiv.innerHTML.trim();
    const newHtml = newBlocksHtml.trim();
    
    if (currentHtml !== newHtml) {
        if (window.debugBlocks) console.log('🔄 تحديث البلوكات - تغيير مكتشف');
        
        // حفظ موقع المؤشر
        const cursorPosition = getCursorPosition(blockDiv);
        
        // تحديث المحتوى
        blockDiv.innerHTML = newBlocksHtml;
        
        // استعادة موقع المؤشر بعد تأخير قصير
        setTimeout(() => {
            setCursorPosition(blockDiv, cursorPosition);
        }, 10);
        
        // إظهار تحذير إذا كان هناك بلوكات مفقودة (للتطوير فقط)
        if (missingBlocks.length > 0 && window.debugBlocks && typeof showMissingBlocksWarning === 'function') {
            showMissingBlocksWarning(missingBlocks);
        }
        
        // تحديث النص المرجعي إذا كان متوفراً
        if (englishText && typeof updateOriginalTextDisplay === 'function') {
            updateOriginalTextDisplay(englishText, originalText);
        }
        
        console.log('✅ تم تحديث البلوكات');
    } else {
        if (window.debugBlocks) console.log('✅ لا يوجد تغيير في البلوكات');
    }
}

// إظهار تحذير للبلوكات المفقودة
function showMissingBlocksWarning(missingBlocks) {
    if (missingBlocks.length === 0) return;
    
    const count = missingBlocks.length;
    const message = `⚠️ تحذير: ${count} بلوك مفقود في الترجمة!`;
    
    if (typeof showNotification === 'function') {
        showNotification(message, 'warning');
    }
    
    // تسجيل تفصيلي في الكونسول
    console.warn('⚠️ البلوكات المفقودة:', missingBlocks);
    
    // تحديث إحصائيات المشاكل (إن وُجدت)
    updateMissingBlocksStats(count);
}

// تحديث إحصائيات البلوكات المفقودة
function updateMissingBlocksStats(count) {
    // يمكن إضافة عداد في الواجهة لاحقاً
    if (window.debugBlocks) {
        console.log(`📊 إجمالي البلوكات المفقودة: ${count}`);
    }
}

// تحديث عرض النص المرجعي مع البلوكات المفقودة
function updateOriginalTextDisplay(englishText, translatedText) {
    if (!originalText || !englishText) return;
    
    // تحقق من وجود وضع البلوكات
    const container = translationText ? translationText.parentNode : null;
    const blocksEditor = container ? container.querySelector('.blocks-editor') : null;
    const isBlocksMode = blocksEditor && blocksEditor.style.display !== 'none';
    
    if (isBlocksMode && translatedText) {
        // العثور على البلوكات المفقودة في الترجمة
        const missingInTranslation = findMissingBlocks(englishText, translatedText);
        
        // تحويل النص الإنجليزي للبلوكات مع تمييز المفقودة
        const blocksHtml = convertTextToBlocks(englishText, missingInTranslation);
        
        originalText.innerHTML = blocksHtml;
        originalText.style.color = '#d4edda';
        
        if (window.debugBlocks) {
            console.log('📋 النص المرجعي مع البلوكات المفقودة:', missingInTranslation);
            console.log('🎨 HTML البلوكات:', blocksHtml);
        }
        
        // إضافة فئة خاصة للنص المرجعي في وضع البلوكات
        originalText.classList.add('blocks-reference-mode');
    } else {
        // الوضع العادي - عرض النص فقط
        originalText.innerHTML = ''; // مسح أي HTML
        originalText.textContent = englishText;
        originalText.style.color = '#d4edda';
        originalText.classList.remove('blocks-reference-mode');
        
        if (window.debugBlocks) {
            console.log('📝 النص المرجعي العادي:', englishText);
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
        // تجاهل أخطاء cursor positioning
    }
}

// دالة تنظيف العناصر الزائدة
function cleanupDuplicateBlocksEditors() {
    const allBlocksEditors = document.querySelectorAll('.blocks-editor');
    
    if (allBlocksEditors.length > 1) {
        console.log(`🧹 تنظيف ${allBlocksEditors.length - 1} عنصر blocks editor زائد`);
        
        // الاحتفاظ بالأول وإزالة الباقي
        for (let i = 1; i < allBlocksEditors.length; i++) {
            allBlocksEditors[i].remove();
        }
        
        if (typeof showNotification === 'function') {
            showNotification('تم تنظيف العناصر المكررة', 'info');
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
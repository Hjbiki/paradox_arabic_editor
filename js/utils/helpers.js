// ===========================================
// UTILITY HELPERS - الدوال المساعدة
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

// دالة تلوين مفاتيح الترجمة المفقودة
function highlightKeysWithMissingBlocks() {
    if (window.debugBlocks) console.log('🔍 فحص مفاتيح الترجمات للبلوكات المفقودة...');
    
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
        
        // استخراج البلوكات من النص الإنجليزي والعربي
        let missingBlocks = [];
        if (typeof findMissingBlocks === 'function') {
            missingBlocks = findMissingBlocks(originalValue, arabicValue);
        }
        
        // إضافة/إزالة class للتلوين
        if (missingBlocks.length > 0) {
            item.classList.add('has-missing-blocks');
            item.title = `مفقود: ${missingBlocks.join(', ')}`;
            if (window.debugBlocks) console.log(`🔴 ${key}: مفقود ${missingBlocks.length} بلوك`);
        } else {
            item.classList.remove('has-missing-blocks');
            item.title = '';
            if (window.debugBlocks) console.log(`✅ ${key}: جميع البلوكات موجودة`);
        }
    });
}

// Make functions available globally
if (typeof window !== 'undefined') {
    window.escapeHtml = escapeHtml;
    window.cleanText = cleanText;
    window.highlightKeysWithMissingBlocks = highlightKeysWithMissingBlocks;
} 
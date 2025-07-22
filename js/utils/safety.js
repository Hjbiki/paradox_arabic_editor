// ===========================================
// SAFETY FUNCTIONS - دوال الأمان
// ===========================================

// إصلاح مشاكل async response errors
function safeTimeout(fn, delay) {
    try {
        return setTimeout(() => {
            try {
                fn();
            } catch (error) {
                console.warn('⚠️ خطأ في timeout function:', error);
            }
        }, delay);
    } catch (error) {
        console.warn('⚠️ خطأ في إنشاء timeout:', error);
        return null;
    }
}

// دالة آمنة للعمليات async
function safeAsync(asyncFn) {
    try {
        return asyncFn().catch(error => {
            console.warn('⚠️ خطأ في العملية async:', error);
        });
    } catch (error) {
        console.warn('⚠️ خطأ في تنفيذ العملية async:', error);
    }
}

// Make functions available globally
if (typeof window !== 'undefined') {
    window.safeTimeout = safeTimeout;
    window.safeAsync = safeAsync;
} 
// ===========================================
// MAIN INITIALIZATION - التهيئة الرئيسية
// ===========================================

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 بدء تهيئة التطبيق...');
    
    // تعريف العناصر DOM بعد تحميل الصفحة
    window.translationList = document.getElementById('translationList');
    window.originalText = document.getElementById('originalText');
    window.translationText = document.getElementById('translationText');
    window.searchInput = document.getElementById('searchInput');
    window.statsText = document.getElementById('statsText');
    window.statusText = document.getElementById('statusText');
    window.progressBar = document.getElementById('progressBar');
    window.fileInput = document.getElementById('fileInput');
    window.notification = document.getElementById('notification');
    window.loadingOverlay = document.getElementById('loadingOverlay');
    window.settingsModal = document.getElementById('settingsModal');
    
    // Update local references
    translationList = window.translationList;
    originalText = window.originalText;
    translationText = window.translationText;
    searchInput = window.searchInput;
    statsText = window.statsText;
    statusText = window.statusText;
    progressBar = window.progressBar;
    fileInput = window.fileInput;
    notification = window.notification;
    loadingOverlay = window.loadingOverlay;
    settingsModal = window.settingsModal;
    
    // التحقق من وجود العناصر الأساسية
    if (!translationList || !originalText || !translationText) {
        console.error('❌ فشل في العثور على العناصر الأساسية في DOM');
        alert('خطأ في تحميل الصفحة. يرجى إعادة تحميل الصفحة.');
        return;
    }
    
    console.log('✅ تم تحميل جميع عناصر DOM بنجاح');
    
    // إخفاء شاشة التحميل عند بدء التطبيق
    if (typeof hideLoading === 'function') {
        hideLoading();
    }
    
    // Initialize modules
    if (typeof setupEventListeners === 'function') {
        setupEventListeners();
    }
    
    if (typeof setupAutoSave === 'function') {
        setupAutoSave();
    }
    
    if (typeof loadFromLocalStorage === 'function') {
        loadFromLocalStorage();
    }
    
    if (typeof loadApiKeys === 'function') {
        loadApiKeys();
    }
    
    if (typeof updateStats === 'function') {
        updateStats();
    }
    
    if (typeof updateSaveButton === 'function') {
        updateSaveButton();
    }
    
    // إخفاء شاشة التحميل مرة أخرى للتأكد
    setTimeout(() => {
        if (typeof hideLoading === 'function') {
            hideLoading();
        }
    }, 100);
    
    // Safety timeout لضمان إخفاء شاشة التحميل في جميع الحالات
    setTimeout(() => {
        if (loadingOverlay && loadingOverlay.classList.contains('show')) {
            console.warn('⚠️ إخفاء إجباري لشاشة التحميل بعد safety timeout');
            if (typeof hideLoading === 'function') {
                hideLoading();
            }
        }
    }, 5000); // 5 ثواني
    
    console.log('✅ تم إكمال تهيئة التطبيق بنجاح');
    
    // إشعار ترحيبي للمستخدمين الجدد
    const hasSeenWelcome = localStorage.getItem('paradox_editor_welcome_seen');
    if (!hasSeenWelcome) {
        setTimeout(() => {
            if (typeof showNotification === 'function') {
                showNotification(
                    '🎉 مرحباً بك في محرر نصوص بارادوكس!\n\n' +
                    '💡 نصائح مهمة:\n' +
                    '• افتح ملف YAML للبدء\n' +
                    '• التعديلات تُحفظ تلقائياً في المتصفح\n' +
                    '• اضغط "حفظ الملف" لتنزيل الملف المحدث\n' +
                    '• استخدم "إعدادات API" للترجمة الآلية\n\n' +
                    '⚠️ مهم: اضغط "حفظ الملف" قبل إغلاق المتصفح!',
                    'info'
                );
            }
            // تسجيل أن المستخدم شاف الرسالة
            localStorage.setItem('paradox_editor_welcome_seen', 'true');
        }, 2000); // انتظار ثانيتين بعد التحميل
    }
});

// Export main functions for global access
function initializeApp() {
    console.log('📱 تهيئة التطبيق...');
    // This function can be called manually if needed
}

// Make functions available globally
if (typeof window !== 'undefined') {
    window.initializeApp = initializeApp;
} 
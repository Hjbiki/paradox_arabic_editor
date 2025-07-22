// ===========================================
// TRANSLATION SERVICES - خدمات الترجمة
// ===========================================

// Service name mapping
function getServiceName(service) {
    const names = {
        mymemory: 'MyMemory',
        claude: 'Claude',
        chatgpt: 'ChatGPT',
        gemini: 'Gemini',
        deepl: 'DeepL',
        google: 'Google Translate'
    };
    return names[service] || service;
}

// MyMemory Translation (مجاني - بدون API key)
async function translateWithMyMemory(text) {
    console.log('🌐 MyMemory: بدء الترجمة للنص:', text);
    
    if (!text || text.trim() === '') {
        throw new Error('النص المُراد ترجمته فارغ');
    }
    
    const cleanText = text.trim();
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(cleanText)}&langpair=en|ar`;
    console.log('🔗 MyMemory URL:', url);
    
    try {
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`خطأ HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('📥 MyMemory response:', data);
        
        if (data.responseStatus === 200 && data.responseData) {
            const translatedText = data.responseData.translatedText;
            if (translatedText && translatedText.trim() !== '') {
                const finalText = translatedText.trim();
                console.log('✅ MyMemory ترجمة ناجحة:', finalText);
                return finalText;
            } else {
                throw new Error('النص المُترجم فارغ من MyMemory');
            }
        } else {
            console.error('❌ MyMemory خطأ في الاستجابة:', data);
            throw new Error(data.responseDetails || 'فشل في الترجمة من MyMemory');
        }
    } catch (error) {
        console.error('❌ MyMemory خطأ عام:', error);
        throw error;
    }
}

// Claude Translation
async function translateWithClaude(text) {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKeys.claude}`,
            'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
            model: 'claude-3-sonnet-20240229',
            max_tokens: 1000,
            messages: [{
                role: 'user',
                content: `ترجم النص التالي من الإنجليزية إلى العربية. النص مخصص للعبة فيديو، لذا استخدم مصطلحات مناسبة للألعاب. أعطني الترجمة فقط بدون شرح إضافي:\n\n"${text}"`
            }]
        })
    });
    
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'خطأ في خدمة Claude');
    }
    
    const data = await response.json();
    return data.content[0].text.trim().replace(/["""]/g, '');
}

// ChatGPT Translation
async function translateWithChatGPT(text) {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKeys.openai}`
        },
        body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: [{
                role: 'user',
                content: `ترجم النص التالي من الإنجليزية إلى العربية. النص مخصص للعبة فيديو، لذا استخدم مصطلحات مناسبة للألعاب. أعطني الترجمة فقط بدون شرح إضافي:\n\n"${text}"`
            }],
            max_tokens: 1000,
            temperature: 0.3
        })
    });
    
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'خطأ في خدمة ChatGPT');
    }
    
    const data = await response.json();
    return data.choices[0].message.content.trim().replace(/["""]/g, '');
}

// Gemini Translation
async function translateWithGemini(text) {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKeys.gemini}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            contents: [{
                parts: [{
                    text: `ترجم النص التالي من الإنجليزية إلى العربية. النص مخصص للعبة فيديو، لذا استخدم مصطلحات مناسبة للألعاب. أعطني الترجمة فقط بدون شرح إضافي:\n\n"${text}"`
                }]
            }]
        })
    });
    
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'خطأ في خدمة Gemini');
    }
    
    const data = await response.json();
    return data.candidates[0].content.parts[0].text.trim().replace(/["""]/g, '');
}

// DeepL Translation
async function translateWithDeepL(text) {
    const response = await fetch('https://api-free.deepl.com/v2/translate', {
        method: 'POST',
        headers: {
            'Authorization': `DeepL-Auth-Key ${apiKeys.deepl}`,
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
            text: text,
            source_lang: 'EN',
            target_lang: 'AR'
        })
    });
    
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'خطأ في خدمة DeepL');
    }
    
    const data = await response.json();
    return data.translations[0].text.trim();
}

// Google Translate
async function translateWithGoogle(text) {
    const response = await fetch(`https://translation.googleapis.com/language/translate/v2?key=${apiKeys.google}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            q: text,
            source: 'en',
            target: 'ar'
        })
    });
    
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'خطأ في خدمة Google Translate');
    }
    
    const data = await response.json();
    return data.data.translations[0].translatedText.trim();
}

// Make functions available globally
if (typeof window !== 'undefined') {
    window.getServiceName = getServiceName;
    window.translateWithMyMemory = translateWithMyMemory;
    window.translateWithClaude = translateWithClaude;
    window.translateWithChatGPT = translateWithChatGPT;
    window.translateWithGemini = translateWithGemini;
    window.translateWithDeepL = translateWithDeepL;
    window.translateWithGoogle = translateWithGoogle;
} 
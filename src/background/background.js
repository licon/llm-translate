// background.js - 支持多提供商的后台服务

// --- 初始化与安装 ---
chrome.runtime.onInstalled.addListener(() => {
    console.log("LLM-Translate 插件已安装或更新。");
    // 设置初始默认值，仅当它们不存在时
    chrome.storage.local.get(null, (items) => {
        const defaults = {
            activeProvider: 'gemini',
            geminiApiKey: '',
            geminiSelectedModel: '',
            siliconflowApiKey: '',
            siliconflowSelectedModel: '',
            ollamaUrl: 'http://localhost:11434',
            ollamaSelectedModel: '',
            // 使用语言键而不是本地化名称，确保与设置/弹窗保持一致
            targetLanguage: 'langSimplifiedChinese',
            secondTargetLanguage: 'langEnglish'
        };
        let itemsToSet = {};
        for (const key in defaults) {
            if (items[key] === undefined) {
                itemsToSet[key] = defaults[key];
            }
        }
        if (Object.keys(itemsToSet).length > 0) {
            chrome.storage.local.set(itemsToSet);
            console.log("已设置初始默认值:", itemsToSet);
        }
    });
});

// --- 消息监听 ---
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'translate') {
        handleTranslation(request.text, request.targetLanguage, request.secondTargetLanguage, sendResponse);
        return true; // 异步响应
    }
});

// --- 核心翻译处理 ---
async function handleTranslation(text, targetLanguage, secondTargetLanguage, sendResponse) {
    try {
        const { activeProvider } = await chrome.storage.local.get('activeProvider');
        const provider = activeProvider || 'gemini'; // 默认为 gemini
        
        // Detect source language and determine actual target language
        const actualTargetLanguage = await determineTargetLanguage(text, targetLanguage, secondTargetLanguage);
        


        let config, apiKey, modelName, ollamaUrl;
        
        if (provider === 'ollama') {
            const urlKey = `${provider}Url`;
            const modelKey = `${provider}SelectedModel`;
            config = await chrome.storage.local.get([urlKey, modelKey]);
            ollamaUrl = config[urlKey];
            modelName = config[modelKey];
            

            
            if (!ollamaUrl) {
                sendResponse({ error: `Ollama 服务器地址未设置。请在设置页面配置 Ollama URL。` });
                chrome.runtime.openOptionsPage();
                return;
            }
            
            if (!modelName) {
                sendResponse({ error: `Ollama 模型未选择。请在设置页面选择一个模型。` });
                chrome.runtime.openOptionsPage();
                return;
            }
        } else {
            const configKey = `${provider}ApiKey`;
            const modelKey = `${provider}SelectedModel`;
            config = await chrome.storage.local.get([configKey, modelKey]);

            apiKey = config[configKey];
            modelName = config[modelKey];

            if (!apiKey || !modelName) {
                sendResponse({ error: `当前提供商 (${provider}) 的 API 密钥或模型未设置。` });
                chrome.runtime.openOptionsPage();
                return;
            }
        }

        let translation;
        if (provider === 'gemini') {
            translation = await callGeminiAPI(text, apiKey, modelName, actualTargetLanguage, secondTargetLanguage);
        } else if (provider === 'siliconflow') {
            translation = await callSiliconFlowAPI(text, apiKey, modelName, actualTargetLanguage, secondTargetLanguage);
        } else if (provider === 'ollama') {
            translation = await callOllamaAPI(text, ollamaUrl, modelName, actualTargetLanguage, secondTargetLanguage);
        } else {
            throw new Error(`未知的模型提供商: ${provider}`);
        }
        
        sendResponse({ translation });

    } catch (error) {
        sendResponse({ error: `翻译失败: ${error.message}` });
    }
}

// --- 语言检测与目标语言确定 ---
async function determineTargetLanguage(text, targetLanguage, secondTargetLanguage) {
    return new Promise((resolve) => {
        chrome.i18n.detectLanguage(text, (result) => {
            if (result && result.languages && result.languages.length > 0) {
                const detectedLanguage = result.languages[0].language;
                const confidence = result.languages[0].percentage;
                
                // Map detected language to target language format
                const detectedLangName = mapLanguageCodeToName(detectedLanguage);
                
                // If detected language matches target language, use second target language
                if (detectedLangName === targetLanguage && confidence > 50) {
                    console.log(`Source language (${detectedLangName}) matches target language (${targetLanguage}), using second target language (${secondTargetLanguage})`);
                    resolve(secondTargetLanguage);
                } else {
                    console.log(`Using primary target language: ${targetLanguage}`);
                    resolve(targetLanguage);
                }
            } else {
                // If language detection fails, use primary target language
                console.log(`Language detection failed, using primary target language: ${targetLanguage}`);
                resolve(targetLanguage);
            }
        });
    });
}

function mapLanguageCodeToName(languageCode) {
    const languageMap = {
        'en': 'English',
        'zh': 'Simplified Chinese',
        'zh-CN': 'Simplified Chinese',
        'zh-TW': 'Traditional Chinese',
        'fr': 'French',
        'es': 'Spanish',
        'ar': 'Arabic',
        'ru': 'Russian',
        'pt': 'Portuguese',
        'de': 'German',
        'it': 'Italian',
        'nl': 'Dutch',
        'da': 'Danish',
        'ja': 'Japanese',
        'ko': 'Korean',
        'sv': 'Swedish',
        'no': 'Norwegian Bokmål',
        'pl': 'Polish',
        'tr': 'Turkish',
        'fi': 'Finnish',
        'hu': 'Hungarian',
        'cs': 'Czech',
        'el': 'Greek',
        'hi': 'Hindi',
        'id': 'Indonesian',
        'th': 'Thai',
        'vi': 'Vietnamese',
        'ro': 'Romanian',
        'sk': 'Slovak'
    };
    
    return languageMap[languageCode] || 'English';
}

// --- API 调用实现 ---

/**
 * 调用 Google Gemini API
 */
async function callGeminiAPI(text, apiKey, modelName, targetLanguage, secondTargetLanguage) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
    const prompt = chrome.i18n.getMessage('translationPrompt', [targetLanguage, secondTargetLanguage, text]);
    
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
        }),
    });

    if (!response.ok) {
        const errorBody = await response.json();
        throw new Error(errorBody.error.message || `API 请求失败`);
    }
    const data = await response.json();
    return data.candidates[0].content.parts[0].text.trim();
}

/**
 * 调用 Silicon Flow API (兼容 OpenAI 格式)
 */
async function callSiliconFlowAPI(text, apiKey, modelName, targetLanguage, secondTargetLanguage) {
    const url = 'https://api.siliconflow.cn/v1/chat/completions';
    const userPrompt = chrome.i18n.getMessage('translationPrompt', [targetLanguage, secondTargetLanguage, text]);

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: modelName,
            messages: [
                { role: 'user', content: userPrompt }
            ],
            max_tokens: 2048,
            temperature: 0.3,
        }),
    });

    if (!response.ok) {
        const errorBody = await response.json();
        throw new Error(errorBody.error.message || `API 请求失败`);
    }
    const data = await response.json();
    return data.choices[0].message.content.trim();
}

/**
 * 调用 Ollama API
 */
async function callOllamaAPI(text, ollamaUrl, modelName, targetLanguage, secondTargetLanguage) {
    const url = `${ollamaUrl}/api/generate`;
    const prompt = chrome.i18n.getMessage('translationPrompt', [targetLanguage, secondTargetLanguage, text]);
    
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: modelName,
            prompt: prompt,
            stream: false,
        }),
    });
    
    if (!response.ok) {
        if (response.status === 403) {
            throw new Error('Ollama 服务器拒绝请求。请设置环境变量 OLLAMA_ORIGINS="*" 并重启 Ollama 服务。');
        }
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
            const errorBody = await response.text();
            try {
                const errorJson = JSON.parse(errorBody);
                errorMessage = errorJson.error || errorMessage;
            } catch (jsonError) {
                errorMessage = errorBody || errorMessage;
            }
        } catch (textError) {
            // 忽略解析错误，使用默认错误消息
        }
        throw new Error(errorMessage);
    }
    
    const responseText = await response.text();
    
    if (!responseText.trim()) {
        throw new Error('Ollama 返回了空响应，请检查模型是否正确加载');
    }
    
    try {
        const data = JSON.parse(responseText);
        if (!data.response) {
            throw new Error('Ollama 响应格式异常，缺少 response 字段');
        }
        return data.response.trim();
    } catch (jsonError) {
        throw new Error(`Ollama 响应解析失败: ${jsonError.message}`);
    }
}
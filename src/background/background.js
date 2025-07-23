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
            targetLanguage: '中文'
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
        handleTranslation(request.text, request.targetLanguage, sendResponse);
        return true; // 异步响应
    }
});

// --- 核心翻译处理 ---
async function handleTranslation(text, targetLanguage, sendResponse) {
    try {
        const { activeProvider } = await chrome.storage.local.get('activeProvider');
        const provider = activeProvider || 'gemini'; // 默认为 gemini

        const configKey = `${provider}ApiKey`;
        const modelKey = `${provider}SelectedModel`;
        const config = await chrome.storage.local.get([configKey, modelKey]);

        const apiKey = config[configKey];
        const modelName = config[modelKey];

        if (!apiKey || !modelName) {
            sendResponse({ error: `当前提供商 (${provider}) 的 API 密钥或模型未设置。` });
            chrome.runtime.openOptionsPage();
            return;
        }

        let translation;
        if (provider === 'gemini') {
            translation = await callGeminiAPI(text, apiKey, modelName, targetLanguage);
        } else if (provider === 'siliconflow') {
            translation = await callSiliconFlowAPI(text, apiKey, modelName, targetLanguage);
        } else {
            throw new Error(`未知的模型提供商: ${provider}`);
        }
        
        sendResponse({ translation });

    } catch (error) {
        sendResponse({ error: `翻译失败: ${error.message}` });
    }
}

// --- API 调用实现 ---

/**
 * 调用 Google Gemini API
 */
async function callGeminiAPI(text, apiKey, modelName, targetLanguage) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
    const prompt = chrome.i18n.getMessage('translationPrompt', [targetLanguage, text]);
    
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
async function callSiliconFlowAPI(text, apiKey, modelName, targetLanguage) {
    const url = 'https://api.siliconflow.cn/v1/chat/completions';
    const systemPrompt = chrome.i18n.getMessage('systemPrompt', [targetLanguage]);

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: modelName,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: text }
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
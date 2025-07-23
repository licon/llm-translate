// background.js - Service Worker

// 插件安装或更新时运行
chrome.runtime.onInstalled.addListener(() => {
    console.log("LLM-Translate 插件已安装或更新。");
    // 设置默认值，但避免覆盖已有的用户设置
    chrome.storage.local.get(['geminiApiKey', 'selectedModel', 'targetLanguage'], (result) => {
        const defaults = {};
        if (result.geminiApiKey === undefined) {
            defaults.geminiApiKey = '';
        }
        if (result.selectedModel === undefined) {
            defaults.selectedModel = '';
        }
        if (result.targetLanguage === undefined) {
            defaults.targetLanguage = '中文';
        }
        // 仅当有需要设置的默认值时才调用 set
        if (Object.keys(defaults).length > 0) {
            chrome.storage.local.set(defaults);
            console.log("已设置初始默认值:", defaults);
        }
    });
});

// 监听来自 content scripts 或 popup 的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'translate') {
        // 从请求中获取文本和目标语言
        handleTranslation(request.text, request.targetLanguage, sendResponse);
        return true; // 表示我们将异步发送响应
    }
});

async function handleTranslation(text, targetLanguage, sendResponse) {
    // 1. 从 storage 获取 Gemini API Key 和所选模型
    const data = await chrome.storage.local.get(['geminiApiKey', 'selectedModel']);
    const { geminiApiKey, selectedModel } = data;

    if (!geminiApiKey || !selectedModel) {
        sendResponse({ error: "API 密钥或模型未设置。" });
        // 提醒用户去设置页面
        chrome.runtime.openOptionsPage();
        return;
    }

    // 2. 调用 Gemini API
    try {
        const translation = await callGeminiAPI(text, geminiApiKey, selectedModel, targetLanguage);
        sendResponse({ translation: translation });
    } catch (error) {
        sendResponse({ error: `翻译失败: ${error.message}` });
    }
}

/**
 * 调用 Google Gemini API 进行翻译
 * @param {string} text 要翻译的文本
 * @param {string} apiKey Gemini API 密钥
 * @param {string} modelName 要使用的模型名称
 * @param {string} targetLanguage 目标语言
 * @returns {Promise<string>} 翻译后的文本
 */
async function callGeminiAPI(text, apiKey, modelName, targetLanguage) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

    // 构建符合 Gemini API 的请求体
    const requestBody = {
        "contents": [{
            "parts": [{
                "text": `请将以下文本翻译成${targetLanguage}。请直接返回译文，不要包含任何解释、说明或多余的文字.\n\n原文：\n"${text}"`
            }]
        }],
        "generationConfig": {
            "temperature": 0.3,
            "topK": 1,
            "topP": 1,
            "maxOutputTokens": 2048,
            "stopSequences": []
        },
        "safetySettings": [
            // 根据需要调整安全设置
            { "category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_MEDIUM_AND_ABOVE" },
            { "category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_MEDIUM_AND_ABOVE" },
            { "category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_MEDIUM_AND_ABOVE" },
            { "category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_MEDIUM_AND_ABOVE" }
        ]
    };

    console.log("发送到 Gemini API 的请求:", JSON.stringify(requestBody, null, 2));

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`API 请求失败，状态码: ${response.status}. 响应: ${errorBody}`);
    }

    const data = await response.json();
    
    // 从 Gemini 的响应中提取翻译文本
    try {
        const translation = data.candidates[0].content.parts[0].text;
        return translation.trim();
    } catch (e) {
        console.error("解析 Gemini 响应失败:", data);
        throw new Error("无法从 API 响应中提取翻译内容。");
    }
}
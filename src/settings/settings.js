// settings.js - 支持多提供商的设置逻辑

document.addEventListener('DOMContentLoaded', () => {
    // 全局状态和元素引用
    const state = {
        activeProvider: 'gemini', // 默认提供商
    };

    const elements = {
        tabs: document.querySelectorAll('.tab-button'),
        tabContents: document.querySelectorAll('.tab-content'),
        statusDiv: document.getElementById('status'),
        providers: {
            gemini: {
                apiKeyInput: document.getElementById('gemini-api-key'),
                modelSelect: document.getElementById('gemini-model-select'),
                fetchButton: document.querySelector('.fetch-models-button[data-provider="gemini"]'),
            },
            siliconflow: {
                apiKeyInput: document.getElementById('siliconflow-api-key'),
                modelSelect: document.getElementById('siliconflow-model-select'),
                fetchButton: document.querySelector('.fetch-models-button[data-provider="siliconflow"]'),
            },
        },
    };

    // --- 事件绑定 ---

    // 绑定标签页切换事件
    elements.tabs.forEach(tab => {
        tab.addEventListener('click', () => switchTab(tab.dataset.provider));
    });

    // 为每个提供商绑定事件
    for (const providerName in elements.providers) {
        const providerElements = elements.providers[providerName];
        providerElements.fetchButton.addEventListener('click', () => handleFetchModels(providerName));
        providerElements.modelSelect.addEventListener('change', () => saveSelectedModel(providerName));
    }

    // --- 核心功能函数 ---

    // 切换标签页
    function switchTab(providerName) {
        state.activeProvider = providerName;
        
        elements.tabs.forEach(tab => tab.classList.toggle('active', tab.dataset.provider === providerName));
        elements.tabContents.forEach(content => content.classList.toggle('active', content.id === `${providerName}-settings`));
        
        // 保存当前激活的提供商
        chrome.storage.local.set({ activeProvider: providerName });
        showStatus(`已切换到 ${providerName}`, 'info', 1500);
    }

    // 处理获取模型的请求
    async function handleFetchModels(providerName) {
        const { apiKeyInput } = elements.providers[providerName];
        const apiKey = apiKeyInput.value;
        if (!apiKey) {
            showStatus('请输入 API 密钥。', 'error');
            return;
        }

        // 立即保存 API 密钥
        chrome.storage.local.set({ [`${providerName}ApiKey`]: apiKey }, () => {
            showStatus('API 密钥已保存。正在获取模型...', 'info');
        });

        // 根据提供商调用不同的获取函数
        if (providerName === 'gemini') {
            await fetchGeminiModels(apiKey);
        } else if (providerName === 'siliconflow') {
            await fetchSiliconFlowModels(apiKey);
        }
    }

    // 获取 Gemini 模型
    async function fetchGeminiModels(apiKey) {
        const modelSelect = elements.providers.gemini.modelSelect;
        modelSelect.innerHTML = '<option>加载中...</option>';
        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
            if (!response.ok) throw new Error((await response.json()).error.message);
            const data = await response.json();
            const supportedModels = data.models.filter(m => m.supportedGenerationMethods.includes('generateContent'));
            populateModelSelect(modelSelect, supportedModels, m => m.name.replace('models/', ''), m => `${m.displayName} (${m.name.replace('models/', '')})`);
            showStatus('Gemini 模型获取成功！', 'success');
            loadSelectedModel('gemini');
        } catch (error) {
            modelSelect.innerHTML = '<option>获取失败</option>';
            showStatus(`获取 Gemini 模型失败: ${error.message}`, 'error');
        }
    }

    // 获取 Silicon Flow 模型
    async function fetchSiliconFlowModels(apiKey) {
        const modelSelect = elements.providers.siliconflow.modelSelect;
        modelSelect.innerHTML = '<option>加载中...</option>';
        try {
            const response = await fetch('https://api.siliconflow.cn/v1/models', {
                headers: { 'Authorization': `Bearer ${apiKey}` }
            });
            if (!response.ok) throw new Error((await response.json()).error.message);
            const data = await response.json();
            // 假设其 API 格式与 OpenAI 兼容
            populateModelSelect(modelSelect, data.data, m => m.id, m => m.id);
            showStatus('Silicon Flow 模型获取成功！', 'success');
            loadSelectedModel('siliconflow');
        } catch (error) {
            modelSelect.innerHTML = '<option>获取失败</option>';
            showStatus(`获取 Silicon Flow 模型失败: ${error.message}`, 'error');
        }
    }

    // 通用的模型下拉列表填充函数
    function populateModelSelect(selectElement, models, valueFn, textFn) {
        selectElement.innerHTML = '';
        if (models.length === 0) {
            selectElement.innerHTML = '<option>未找到可用模型</option>';
            return;
        }
        models.forEach(model => {
            const option = document.createElement('option');
            option.value = valueFn(model);
            option.textContent = textFn(model);
            selectElement.appendChild(option);
        });
    }

    // 保存所选模型
    function saveSelectedModel(providerName) {
        const { modelSelect } = elements.providers[providerName];
        if (modelSelect.value) {
            chrome.storage.local.set({ [`${providerName}SelectedModel`]: modelSelect.value }, () => {
                showStatus(`模型 '${modelSelect.value}' 已自动保存。`, 'success');
            });
        }
    }

    // --- 初始化函数 ---

    // 加载所有已保存的设置
    function loadAllSettings() {
        const keys = [
            'activeProvider',
            'geminiApiKey', 'geminiSelectedModel',
            'siliconflowApiKey', 'siliconflowSelectedModel'
        ];
        chrome.storage.local.get(keys, (result) => {
            // 激活上次选中的标签页
            if (result.activeProvider) {
                switchTab(result.activeProvider);
            }
            // 加载 Gemini 设置
            if (result.geminiApiKey) {
                elements.providers.gemini.apiKeyInput.value = result.geminiApiKey;
                fetchGeminiModels(result.geminiApiKey);
            }
            // 加载 Silicon Flow 设置
            if (result.siliconflowApiKey) {
                elements.providers.siliconflow.apiKeyInput.value = result.siliconflowApiKey;
                fetchSiliconFlowModels(result.siliconflowApiKey);
            }
        });
    }
    
    // 加载并选中特定提供商的模型
    function loadSelectedModel(providerName) {
        chrome.storage.local.get([`${providerName}SelectedModel`], (result) => {
            const model = result[`${providerName}SelectedModel`];
            const { modelSelect } = elements.providers[providerName];
            if (model && [...modelSelect.options].some(opt => opt.value === model)) {
                modelSelect.value = model;
            }
        });
    }

    // 显示状态消息
    function showStatus(message, type = 'info', duration = 3000) {
        const colorMap = { 'info': '#007bff', 'success': 'green', 'error': 'red' };
        elements.statusDiv.textContent = message;
        elements.statusDiv.style.color = colorMap[type] || 'black';
        setTimeout(() => {
            if (elements.statusDiv.textContent === message) elements.statusDiv.textContent = '';
        }, duration);
    }

    // 初始化
    loadAllSettings();
});

// --- I18n Helper ---
function setupI18n() {
    document.querySelectorAll('[data-i18n]').forEach(elem => {
        const key = elem.getAttribute('data-i18n');
        elem.textContent = chrome.i18n.getMessage(key);
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(elem => {
        const key = elem.getAttribute('data-i18n-placeholder');
        elem.placeholder = chrome.i18n.getMessage(key);
    });
    document.title = chrome.i18n.getMessage('settingsTitle');
}

// --- Main Logic ---
document.addEventListener('DOMContentLoaded', () => {
    setupI18n();

    const state = { activeProvider: 'gemini' };
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
            ollama: {
                apiKeyInput: document.getElementById('ollama-url'),
                modelSelect: document.getElementById('ollama-model-select'),
                fetchButton: document.querySelector('.fetch-models-button[data-provider="ollama"]'),
            },
        },
    };

    function switchTab(providerName) {
        state.activeProvider = providerName;
        elements.tabs.forEach(tab => tab.classList.toggle('active', tab.dataset.provider === providerName));
        elements.tabContents.forEach(content => content.classList.toggle('active', content.id === `${providerName}-settings`));
        chrome.storage.local.set({ activeProvider: providerName });
        showStatus(chrome.i18n.getMessage('statusProviderSwitched', [providerName]), 'info', 1500);
    }

    async function handleFetchModels(providerName) {
        const { apiKeyInput } = elements.providers[providerName];
        const inputValue = apiKeyInput.value;
        if (!inputValue) {
            const errorMsg = providerName === 'ollama' ? 
                chrome.i18n.getMessage('statusOllamaUrlNeeded') : 
                chrome.i18n.getMessage('statusApiKeyNeeded');
            showStatus(errorMsg, 'error');
            return;
        }
        
        if (providerName === 'ollama') {
            chrome.storage.local.set({ [`${providerName}Url`]: inputValue }, () => {
                showStatus(chrome.i18n.getMessage('statusOllamaUrlSaved'), 'info');
            });
            await fetchOllamaModels(inputValue);
        } else {
            chrome.storage.local.set({ [`${providerName}ApiKey`]: inputValue }, () => {
                showStatus(chrome.i18n.getMessage('statusApiKeySaved'), 'info');
            });
            if (providerName === 'gemini') await fetchGeminiModels(inputValue);
            else if (providerName === 'siliconflow') await fetchSiliconFlowModels(inputValue);
        }
    }

    async function fetchGeminiModels(apiKey) {
        const modelSelect = elements.providers.gemini.modelSelect;
        modelSelect.innerHTML = `<option>${chrome.i18n.getMessage('statusFetchingModels')}</option>`;
        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
            if (!response.ok) throw new Error((await response.json()).error.message);
            const data = await response.json();
            const supportedModels = data.models.filter(m => m.supportedGenerationMethods.includes('generateContent'));
            populateModelSelect(modelSelect, supportedModels, m => m.name.replace('models/', ''), m => `${m.displayName} (${m.name.replace('models/', '')})`);
            showStatus(chrome.i18n.getMessage('statusModelsSuccess'), 'success');
            loadSelectedModel('gemini');
        } catch (error) {
            modelSelect.innerHTML = `<option>${chrome.i18n.getMessage('statusModelsFailed', [error.message])}</option>`;
            showStatus(chrome.i18n.getMessage('statusModelsFailed', [error.message]), 'error');
        }
    }

    async function fetchSiliconFlowModels(apiKey) {
        const modelSelect = elements.providers.siliconflow.modelSelect;
        modelSelect.innerHTML = `<option>${chrome.i18n.getMessage('statusFetchingModels')}</option>`;
        try {
            const response = await fetch('https://api.siliconflow.cn/v1/models?type=text&sub_type=chat', { headers: { 'Authorization': `Bearer ${apiKey}` } });
            if (!response.ok) throw new Error((await response.json()).error.message);
            const data = await response.json();
            populateModelSelect(modelSelect, data.data, m => m.id, m => m.id);
            showStatus(chrome.i18n.getMessage('statusModelsSuccess'), 'success');
            loadSelectedModel('siliconflow');
        } catch (error) {
            modelSelect.innerHTML = `<option>${chrome.i18n.getMessage('statusModelsFailed', [error.message])}</option>`;
            showStatus(chrome.i18n.getMessage('statusModelsFailed', [error.message]), 'error');
        }
    }

    async function fetchOllamaModels(ollamaUrl) {
        const modelSelect = elements.providers.ollama.modelSelect;
        modelSelect.innerHTML = `<option>${chrome.i18n.getMessage('statusFetchingModels')}</option>`;
        try {
            const response = await fetch(`${ollamaUrl}/api/tags`);
            if (!response.ok) throw new Error('Failed to connect to Ollama server');
            const data = await response.json();

            populateModelSelect(modelSelect, data.models, m => m.name, m => `${m.name} (${(m.size / 1024 / 1024 / 1024).toFixed(1)}GB)`);
            showStatus(chrome.i18n.getMessage('statusModelsSuccess'), 'success');
            loadSelectedModel('ollama');
            
            // If no model was previously selected and we have models, auto-save the first one
            if (data.models.length > 0 && modelSelect.value) {
                saveSelectedModel('ollama');
            }
        } catch (error) {
            modelSelect.innerHTML = `<option>${chrome.i18n.getMessage('statusModelsFailed', [error.message])}</option>`;
            showStatus(chrome.i18n.getMessage('statusModelsFailed', [error.message]), 'error');
        }
    }

    function populateModelSelect(selectElement, models, valueFn, textFn) {
        selectElement.innerHTML = '';
        if (models.length === 0) {
            selectElement.innerHTML = '<option>No models available</option>'; // Fallback
            return;
        }
        models.forEach(model => {
            const option = document.createElement('option');
            option.value = valueFn(model);
            option.textContent = textFn(model);
            selectElement.appendChild(option);
        });
        
        // Auto-select the first model if no model is currently selected
        if (models.length > 0 && !selectElement.value) {
            selectElement.value = valueFn(models[0]);
        }
    }

    function saveSelectedModel(providerName) {
        const { modelSelect } = elements.providers[providerName];
        if (modelSelect.value) {
            const key = `${providerName}SelectedModel`;
            chrome.storage.local.set({ [key]: modelSelect.value }, () => {
                showStatus(chrome.i18n.getMessage('statusModelSaved', [modelSelect.value]), 'success');
            });
        }
    }

    function loadAllSettings() {
        const keys = ['activeProvider', 'geminiApiKey', 'siliconflowApiKey', 'ollamaUrl', 'geminiSelectedModel', 'siliconflowSelectedModel', 'ollamaSelectedModel'];
        chrome.storage.local.get(keys, (result) => {
            if (result.activeProvider) switchTab(result.activeProvider);
            if (result.geminiApiKey) {
                elements.providers.gemini.apiKeyInput.value = result.geminiApiKey;
                fetchGeminiModels(result.geminiApiKey);
            }
            if (result.siliconflowApiKey) {
                elements.providers.siliconflow.apiKeyInput.value = result.siliconflowApiKey;
                fetchSiliconFlowModels(result.siliconflowApiKey);
            }
            if (result.ollamaUrl) {
                elements.providers.ollama.apiKeyInput.value = result.ollamaUrl;
                fetchOllamaModels(result.ollamaUrl);
            } else {
                // Set default Ollama URL if not set
                elements.providers.ollama.apiKeyInput.value = 'http://localhost:11434';
            }
        });
    }
    
    function loadSelectedModel(providerName) {
        chrome.storage.local.get([`${providerName}SelectedModel`], (result) => {
            const model = result[`${providerName}SelectedModel`];
            const { modelSelect } = elements.providers[providerName];
            if (model && [...modelSelect.options].some(opt => opt.value === model)) {
                modelSelect.value = model;
            }
        });
    }

    function showStatus(message, type = 'info', duration = 3000) {
        const colorMap = { 'info': '#007bff', 'success': 'green', 'error': 'red' };
        elements.statusDiv.textContent = message;
        elements.statusDiv.style.color = colorMap[type] || 'black';
        setTimeout(() => {
            if (elements.statusDiv.textContent === message) elements.statusDiv.textContent = '';
        }, duration);
    }

    elements.tabs.forEach(tab => tab.addEventListener('click', () => switchTab(tab.dataset.provider)));
    for (const providerName in elements.providers) {
        elements.providers[providerName].fetchButton.addEventListener('click', () => handleFetchModels(providerName));
        elements.providers[providerName].modelSelect.addEventListener('change', () => saveSelectedModel(providerName));
    }

    loadAllSettings();
});
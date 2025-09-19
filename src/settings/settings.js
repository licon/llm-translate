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

// --- Language Data ---
const languageKeys = [
    "langEnglish", "langSimplifiedChinese", "langTraditionalChinese", "langFrench", "langSpanish", "langArabic", "langRussian", "langPortuguese", "langGerman", "langItalian", "langDutch", "langDanish", "langIrish", "langWelsh", "langFinnish", "langIcelandic", "langSwedish", "langNorwegianNynorsk", "langNorwegianBokmal", "langJapanese", "langKorean", "langVietnamese", "langThai", "langIndonesian", "langMalay", "langBurmese", "langTagalog", "langKhmer", "langLao", "langHindi", "langBengali", "langUrdu", "langNepali", "langHebrew", "langTurkish", "langPersian", "langPolish", "langUkrainian", "langCzech", "langRomanian", "langBulgarian", "langSlovak", "langHungarian", "langSlovenian", "langLatvian", "langEstonian", "langLithuanian", "langBelarusian", "langGreek", "langCroatian", "langMacedonian", "langMaltese", "langSerbian", "langBosnian", "langGeorgian", "langArmenian", "langNorthAzerbaijani", "langKazakh", "langNorthernUzbek", "langTajik", "langSwahili", "langAfrikaans", "langCantonese", "langLuxembourgish", "langLimburgish", "langCatalan", "langGalician", "langAsturian", "langBasque", "langOccitan", "langVenetian", "langSardinian", "langSicilian", "langFriulian", "langLombard", "langLigurian", "langFaroese", "langToskAlbanian", "langSilesian", "langBashkir", "langTatar", "langMesopotamianArabic", "langNajdiArabic", "langEgyptianArabic", "langLevantineArabic", "langTaizziAdeniArabic", "langDari", "langTunisianArabic", "langMoroccanArabic", "langKabuverdianu", "langTokPisin", "langEasternYiddish", "langSindhi", "langSinhala", "langTelugu", "langPunjabi", "langTamil", "langGujarati", "langMalayalam", "langMarathi", "langKannada", "langMagahi", "langOriya", "langAwadhi", "langMaithili", "langAssamese", "langChhattisgarhi", "langBhojpuri", "langMinangkabau", "langBalinese", "langJavanese", "langBanjar", "langSundanese", "langCebuano", "langPangasinan", "langIloko", "langWarayPhilippines", "langHaitian", "langPapiamento"
];

function populateLanguages() {
    const defaultTargetLanguageSelect = document.getElementById('default-target-language');
    const secondTargetLanguageSelect = document.getElementById('second-target-language');
    
    // Clear existing options
    defaultTargetLanguageSelect.innerHTML = '';
    secondTargetLanguageSelect.innerHTML = '';

    languageKeys.forEach(key => {
        const message = chrome.i18n.getMessage(key);
        
        // Add to default target language select
        const defaultOption = document.createElement('option');
        defaultOption.value = key;
        defaultOption.textContent = message;
        defaultTargetLanguageSelect.appendChild(defaultOption);
        
        // Add to second target language select
        const secondOption = document.createElement('option');
        secondOption.value = key;
        secondOption.textContent = message;
        secondTargetLanguageSelect.appendChild(secondOption);
    });
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
            openrouter: {
                apiKeyInput: document.getElementById('openrouter-api-key'),
                modelSelect: document.getElementById('openrouter-model-select'),
                fetchButton: document.querySelector('.fetch-models-button[data-provider="openrouter"]'),
            },
            ollama: {
                apiKeyInput: document.getElementById('ollama-url'),
                modelSelect: document.getElementById('ollama-model-select'),
                fetchButton: document.querySelector('.fetch-models-button[data-provider="ollama"]'),
            },
        },
        targetLanguages: {
            defaultTargetLanguageSelect: document.getElementById('default-target-language'),
            secondTargetLanguageSelect: document.getElementById('second-target-language'),
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
            else if (providerName === 'openrouter') await fetchOpenRouterModels(inputValue);
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

    async function fetchOpenRouterModels(apiKey) {
        const modelSelect = elements.providers.openrouter.modelSelect;
        modelSelect.innerHTML = `<option>${chrome.i18n.getMessage('statusFetchingModels')}</option>`;
        try {
            const response = await fetch('https://openrouter.ai/api/v1/models', {
                headers: { 
                    'Authorization': `Bearer ${apiKey}`,
                    'HTTP-Referer': 'https://github.com/licon/llm-translate',
                    'X-Title': 'LLM Translate Extension'
                }
            });
            if (!response.ok) throw new Error((await response.json()).error?.message || 'Failed to fetch models');
            const data = await response.json();
            // Filter for free models that support image input and sort by name
            const chatModels = data.data.filter(m => 
                m.id && 
                m.name && 
                !m.id.includes('embedding') && 
                !m.id.includes('rerank') &&
                m.name.toLowerCase().includes('free') &&
                m.architecture && 
                m.architecture.input_modalities && 
                m.architecture.input_modalities.includes('image')
            ).sort((a, b) => a.name.localeCompare(b.name));
            populateModelSelect(modelSelect, chatModels, m => m.id, m => `${m.name} (${m.id})`);
            showStatus(chrome.i18n.getMessage('statusModelsSuccess'), 'success');
            loadSelectedModel('openrouter');
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
        const keys = ['activeProvider', 'geminiApiKey', 'siliconflowApiKey', 'openrouterApiKey', 'ollamaUrl', 'geminiSelectedModel', 'siliconflowSelectedModel', 'openrouterSelectedModel', 'ollamaSelectedModel', 'targetLanguage', 'secondTargetLanguage'];
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
            if (result.openrouterApiKey) {
                elements.providers.openrouter.apiKeyInput.value = result.openrouterApiKey;
                fetchOpenRouterModels(result.openrouterApiKey);
            }
            if (result.ollamaUrl) {
                elements.providers.ollama.apiKeyInput.value = result.ollamaUrl;
                fetchOllamaModels(result.ollamaUrl);
            } else {
                // Set default Ollama URL if not set
                elements.providers.ollama.apiKeyInput.value = 'http://localhost:11434';
            }
            
            // Load target language settings
            loadTargetLanguageSettings(result);
        });
    }
    
    function loadTargetLanguageSettings(result) {
        // Set default target language (synchronized with popup)
        if (result.targetLanguage) {
            elements.targetLanguages.defaultTargetLanguageSelect.value = result.targetLanguage;
        } else {
            // Set default based on browser language
            const browserLang = chrome.i18n.getUILanguage();
            const langCode = browserLang.split('-')[0];
            const defaultLangKey = getDefaultLanguageKey(browserLang, langCode);
            elements.targetLanguages.defaultTargetLanguageSelect.value = defaultLangKey;
            chrome.storage.local.set({ targetLanguage: defaultLangKey });
        }
        
        // Set second target language
        if (result.secondTargetLanguage) {
            elements.targetLanguages.secondTargetLanguageSelect.value = result.secondTargetLanguage;
        } else {
            // Set a default second language (e.g., English if default is Chinese, vice versa)
            const defaultLang = elements.targetLanguages.defaultTargetLanguageSelect.value;
            const secondLang = defaultLang === 'langSimplifiedChinese' ? 'langEnglish' : 'langSimplifiedChinese';
            elements.targetLanguages.secondTargetLanguageSelect.value = secondLang;
            chrome.storage.local.set({ secondTargetLanguage: secondLang });
        }
    }
    
    function getDefaultLanguageKey(browserLang, langCode) {
        const browserLangToMsgKey = {
            'en': 'langEnglish',
            'zh': 'langSimplifiedChinese',
            'zh-CN': 'langSimplifiedChinese',
            'zh-TW': 'langTraditionalChinese',
            'fr': 'langFrench',
            'es': 'langSpanish',
            'ar': 'langArabic',
            'ru': 'langRussian',
            'pt': 'langPortuguese',
            'de': 'langGerman',
            'it': 'langItalian',
            'nl': 'langDutch',
            'da': 'langDanish',
            'ja': 'langJapanese',
            'ko': 'langKorean',
            'sv': 'langSwedish',
            'no': 'langNorwegianBokmal',
            'pl': 'langPolish',
            'tr': 'langTurkish',
            'fi': 'langFinnish',
            'hu': 'langHungarian',
            'cs': 'langCzech',
            'el': 'langGreek',
            'hi': 'langHindi',
            'id': 'langIndonesian',
            'th': 'langThai',
            'vi': 'langVietnamese',
            'ro': 'langRomanian',
            'sk': 'langSlovak'
        };
        
        return browserLangToMsgKey[browserLang] || browserLangToMsgKey[langCode] || 'langEnglish';
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
    
    // Add event listeners for target language settings
    elements.targetLanguages.defaultTargetLanguageSelect.addEventListener('change', () => {
        const value = elements.targetLanguages.defaultTargetLanguageSelect.value;
        chrome.storage.local.set({ targetLanguage: value }, () => {
            showStatus(chrome.i18n.getMessage('statusModelSaved', [chrome.i18n.getMessage(value)]), 'success');
        });
    });
    
    elements.targetLanguages.secondTargetLanguageSelect.addEventListener('change', () => {
        const value = elements.targetLanguages.secondTargetLanguageSelect.value;
        chrome.storage.local.set({ secondTargetLanguage: value }, () => {
            showStatus(chrome.i18n.getMessage('statusModelSaved', [chrome.i18n.getMessage(value)]), 'success');
        });
    });

    loadAllSettings();
    populateLanguages();
});
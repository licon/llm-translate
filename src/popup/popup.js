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
    document.title = chrome.i18n.getMessage('popupTitle');
}

// --- Main Logic ---
const translateButton = document.getElementById('translate-button');
const textInput = document.getElementById('text-input');
const resultContainer = document.getElementById('translation-result');
const targetLanguageSelect = document.getElementById('target-language');

translateButton.addEventListener('click', () => {
    const text = textInput.value;
    const targetLanguage = targetLanguageSelect.value;

    if (text.trim()) {
        resultContainer.innerText = chrome.i18n.getMessage('statusTranslating');
        chrome.runtime.sendMessage({ type: 'translate', text, targetLanguage }, (response) => {
            if (response.error) {
                resultContainer.innerText = chrome.i18n.getMessage('statusError', [response.error]);
            } else {
                resultContainer.innerText = response.translation;
            }
        });
    }
});

targetLanguageSelect.addEventListener('change', () => {
    chrome.storage.local.set({ targetLanguage: targetLanguageSelect.value });
});

function loadSettings() {
    chrome.storage.local.get('targetLanguage', (result) => {
        if (result.targetLanguage) {
            targetLanguageSelect.value = result.targetLanguage;
        }
    });
}

function loadSelectedText() {
    chrome.storage.local.get('lastSelectedText', (result) => {
        if (result.lastSelectedText) {
            textInput.value = result.lastSelectedText;
            chrome.storage.local.set({ 'lastSelectedText': '' });
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    setupI18n();
    loadSettings();
    loadSelectedText();
});
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

// --- TTS Helper ---
const langMap = {
    '中文': 'zh-CN',
    'English': 'en-US',
    '日本語': 'ja-JP',
    'Español': 'es-ES',
    'Français': 'fr-FR',
    'Русский': 'ru-RU',
    '한국어': 'ko-KR'
};

function speak(text, lang) {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang;
        window.speechSynthesis.speak(utterance);
    } else {
        console.error('Speech Synthesis not supported in this browser.');
    }
}

// --- Main Logic ---
const translateButton = document.getElementById('translate-button');
const textInput = document.getElementById('text-input');
const resultContainer = document.getElementById('translation-result');
const targetLanguageSelect = document.getElementById('target-language');
const speakButton = document.getElementById('speak-button');
const speakInputButton = document.getElementById('speak-input-button');
const copyButton = document.getElementById('copy-button');

textInput.addEventListener('input', () => {
    speakInputButton.style.display = textInput.value.trim() ? 'block' : 'none';
});

translateButton.addEventListener('click', () => {
    const text = textInput.value;
    const targetLanguage = targetLanguageSelect.value;

    if (text.trim()) {
        resultContainer.innerText = chrome.i18n.getMessage('statusTranslating');
        speakButton.style.display = 'none';
        copyButton.style.display = 'none';
        chrome.runtime.sendMessage({ type: 'translate', text, targetLanguage }, (response) => {
            if (response.error) {
                resultContainer.innerText = chrome.i18n.getMessage('statusError', [response.error]);
                speakButton.style.display = 'none';
                copyButton.style.display = 'none';
            } else {
                resultContainer.innerText = response.translation;
                speakButton.style.display = 'block';
                copyButton.style.display = 'block';
            }
        });
    }
});

speakButton.addEventListener('click', () => {
    const text = resultContainer.innerText;
    const lang = langMap[targetLanguageSelect.value] || 'en-US';
    speak(text, lang);
});

copyButton.addEventListener('click', () => {
    const text = resultContainer.innerText;
    navigator.clipboard.writeText(text).then(() => {
        // Optional: Add visual feedback
        copyButton.textContent = '✓';
        setTimeout(() => {
            copyButton.innerHTML = '&#x1f4cb;';
        }, 1000);
    }).catch(err => {
        console.error('Failed to copy text: ', err);
    });
});

speakInputButton.addEventListener('click', () => {
    const text = textInput.value;
    if (text.trim()) {
        chrome.i18n.detectLanguage(text, (result) => {
            if (result && result.languages && result.languages.length > 0) {
                const langCode = result.languages[0].language;
                speak(text, langCode);
            } else {
                // Fallback to a default language if detection fails
                speak(text, 'en-US');
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
            // Show speak button if there is text
            speakInputButton.style.display = 'block';
            chrome.storage.local.set({ 'lastSelectedText': '' });
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    setupI18n();
    loadSettings();
    loadSelectedText();
});

// Listen for messages from the background script (e.g., from context menu)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'SET_TEXT_AND_TRANSLATE') {
        textInput.value = request.text;
        translateButton.click();
    }
});
// 处理 popup 弹窗的交互逻辑
const translateButton = document.getElementById('translate-button');
const textInput = document.getElementById('text-input');
const resultContainer = document.getElementById('translation-result');
const targetLanguageSelect = document.getElementById('target-language');

// 翻译按钮点击事件
translateButton.addEventListener('click', () => {
    const text = textInput.value;
    const targetLanguage = targetLanguageSelect.value;

    if (text.trim()) {
        resultContainer.innerText = '翻译中...';
        // 将翻译任务（包含目标语言）发送到 background.js
        chrome.runtime.sendMessage({ type: 'translate', text, targetLanguage }, (response) => {
            if (response.error) {
                resultContainer.innerText = `错误: ${response.error}`;
            } else {
                resultContainer.innerText = response.translation;
            }
        });
    }
});

// 当语言选择变化时，保存它
targetLanguageSelect.addEventListener('change', () => {
    chrome.storage.local.set({ targetLanguage: targetLanguageSelect.value });
});

// 加载已保存的目标语言
function loadSettings() {
    chrome.storage.local.get('targetLanguage', (result) => {
        if (result.targetLanguage) {
            targetLanguageSelect.value = result.targetLanguage;
        }
    });
}

// 加载上次选择的文本并填充到输入框
function loadSelectedText() {
    chrome.storage.local.get('lastSelectedText', (result) => {
        if (result.lastSelectedText) {
            textInput.value = result.lastSelectedText;
            // 填充后清除，避免每次都显示旧内容
            chrome.storage.local.remove('lastSelectedText');
        }
    });
}

// 弹窗加载时执行
document.addEventListener('DOMContentLoaded', () => {
    loadSettings();
    loadSelectedText();
});

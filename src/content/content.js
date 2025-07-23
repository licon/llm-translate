// content.js - 负责划词翻译的 UI 和交互 (v2 - 修复版)

// --- 全局变量 ---
let translateIcon = null;
let resultPopover = null;

// --- 事件监听 ---

// 监听鼠标抬起事件，用于显示翻译图标
document.addEventListener('mouseup', (event) => {
    // 如果事件的目标是我们的UI，则不处理，避免冲突
    if (event.target.id?.startsWith('llm-translate-')) return;
    
    // 移除已有的UI
    removeTranslationUI();

    const selectedText = window.getSelection().toString().trim();
    if (selectedText.length > 0) {
        // 保存文本以备 popup 使用
        chrome.storage.local.set({ 'lastSelectedText': selectedText });
        // 创建翻译图标
        createTranslateIcon(event.clientX, event.clientY, selectedText);
    }
});

// 监听鼠标按下事件，用于在开始新的操作时移除UI
document.addEventListener('mousedown', (event) => {
    // 如果点击的不是我们的UI，则移除它
    if (!event.target.closest('#llm-translate-icon, #llm-translate-popover')) {
        removeTranslationUI();
    }
});


// --- UI 创建与销毁 ---

/**
 * 创建翻译小图标
 * @param {number} x - 鼠标X坐标
 * @param {number} y - 鼠标Y坐标
 * @param {string} text - 选中的文本
 */
function createTranslateIcon(x, y, text) {
    translateIcon = document.createElement('div');
    translateIcon.id = 'llm-translate-icon';
    translateIcon.style.left = `${x + window.scrollX}px`;
    translateIcon.style.top = `${y + window.scrollY + 15}px`;
    
    // 使用 chrome.runtime.getURL() 加载真实的图标文件
    const iconImg = document.createElement('img');
    iconImg.id = 'llm-translate-icon-img';
    iconImg.src = chrome.runtime.getURL('icons/icon48.png');
    // 遵从您的指示，将尺寸设置为 20x20
    iconImg.style.width = '20px';
    iconImg.style.height = '20px';
    translateIcon.appendChild(iconImg);

    // 阻止 mouseup 事件冒泡，避免冲突
    translateIcon.addEventListener('mouseup', (e) => {
        e.stopPropagation();
    });

    translateIcon.addEventListener('click', async (e) => {
        e.stopPropagation();
        const { targetLanguage } = await chrome.storage.local.get('targetLanguage');
        showResultPopover(x, y, '翻译中...');
        chrome.runtime.sendMessage({ type: 'translate', text, targetLanguage: targetLanguage || '中文' }, (response) => {
            if (response.error) {
                updateResultPopover(response.error);
            } else {
                updateResultPopover(response.translation);
            }
        });
        translateIcon.remove();
        translateIcon = null;
    });

    document.body.appendChild(translateIcon);
}

/**
 * 显示或创建结果浮窗
 */
function showResultPopover(x, y, content) {
    if (!resultPopover) {
        resultPopover = document.createElement('div');
        resultPopover.id = 'llm-translate-popover';
        document.body.appendChild(resultPopover);
    }
    resultPopover.style.left = `${x + window.scrollX}px`;
    resultPopover.style.top = `${y + window.scrollY + 15}px`;
    resultPopover.innerHTML = content;
    resultPopover.style.display = 'block';
}

/**
 * 更新结果浮窗的内容
 */
function updateResultPopover(content) {
    if (resultPopover) {
        resultPopover.innerHTML = content;
    }
}

/**
 * 移除所有翻译相关的UI元素
 */
function removeTranslationUI() {
    if (translateIcon) {
        translateIcon.remove();
        translateIcon = null;
    }
    if (resultPopover) {
        resultPopover.remove();
        resultPopover = null;
    }
}
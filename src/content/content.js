// content.js - 负责划词翻译的 UI 和交互 (v2 - 修复版)

// --- 全局变量 ---
let translateIcon = null;
let resultPopover = null;
let isEnabled = true; // 默认启用

// --- 初始化和设置监听 ---
// 首次加载时获取设置
chrome.storage.local.get('isSelectionTranslationEnabled', (result) => {
    // 如果未设置，则默认为 true
    isEnabled = result.isSelectionTranslationEnabled !== false;
});

// 监听设置变化
chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local' && changes.isSelectionTranslationEnabled) {
        isEnabled = changes.isSelectionTranslationEnabled.newValue;
        // 如果禁用了，立即移除现有UI
        if (!isEnabled) {
            removeTranslationUI();
        }
    }
});


// --- 事件监听 ---

// 监听来自 background script 的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'contextMenuTranslate') {
        handleContextMenuTranslation(request);
    } else if (request.type === 'startScreenshotSelection') {
        startScreenshotSelectionOverlay();
    } else if (request.type === 'showImageTranslationResult') {
        showImageTranslationResultPopover(request.translation || '', false);
    }
});

// 显示/更新图片翻译结果弹窗；当 isLoading=true 时隐藏复制按钮并显示等待提示
function showImageTranslationResultPopover(translation, isLoading) {
    // 如果已存在弹窗，则仅更新内容
    if (resultPopover && document.body.contains(resultPopover)) {
        const resultText = resultPopover.querySelector('#llm-translate-result-text');
        const copyBtn = resultPopover.querySelector('#llm-translate-copy-btn');
        if (resultText) resultText.textContent = translation;
        if (copyBtn) copyBtn.style.display = isLoading ? 'none' : 'inline-block';
        return;
    }

    // 创建新的弹窗
    resultPopover = document.createElement('div');
    resultPopover.id = 'llm-translate-popover';
    resultPopover.className = 'context-menu-popup';
    resultPopover.innerHTML = `
        <div class="llm-translate-header">
            <span class="llm-translate-title">${chrome.i18n.getMessage('popupTitle')}</span>
            <button class="llm-translate-close" id="llm-translate-close">×</button>
        </div>
        <div class="llm-translate-content">
            <div class="llm-translate-result">
                <div class="llm-translate-result-header">
                    <strong>${chrome.i18n.getMessage('translationResult') || 'Translation'}:</strong>
                    <button class="llm-translate-copy-btn" id="llm-translate-copy-btn" title="${chrome.i18n.getMessage('copyTranslation') || 'Copy translation'}">📋</button>
                </div>
                <div class="llm-translate-text" id="llm-translate-result-text"></div>
            </div>
        </div>
    `;
    document.body.appendChild(resultPopover);

    const closeBtn = resultPopover.querySelector('#llm-translate-close');
    const copyBtn = resultPopover.querySelector('#llm-translate-copy-btn');
    const resultText = resultPopover.querySelector('#llm-translate-result-text');
    resultText.textContent = translation;
    copyBtn.style.display = isLoading ? 'none' : 'inline-block';

    closeBtn.addEventListener('click', () => removeTranslationUI());
    copyBtn.addEventListener('click', async () => {
        try {
            await navigator.clipboard.writeText(resultText.textContent || '');
            const original = copyBtn.textContent;
            copyBtn.textContent = '✅';
            setTimeout(() => { copyBtn.textContent = original; }, 1200);
        } catch (e) {
            const original = copyBtn.textContent;
            copyBtn.textContent = '❌';
            setTimeout(() => { copyBtn.textContent = original; }, 1200);
        }
    });
}

// 监听鼠标抬起事件，用于显示翻译图标
document.addEventListener('mouseup', (event) => {
    // 如果功能被禁用，则不执行任何操作
    if (!isEnabled) return;

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
        // 检查是否有翻译弹窗存在
        const popover = document.querySelector('#llm-translate-popover');
        if (popover && popover.classList.contains('context-menu-popup')) {
            // 对于右键菜单弹窗，使用更严格的关闭条件
            // 只有当用户点击页面其他地方且不是在选择文本时才关闭
            setTimeout(() => {
                const selection = window.getSelection();
                const hasSelection = selection && selection.toString().trim().length > 0;
                
                // 检查是否在弹窗内有选中的文本
                const isSelectingInPopover = hasSelection && 
                    selection.anchorNode && 
                    (selection.anchorNode.closest('#llm-translate-popover') ||
                     (selection.anchorNode.parentNode && selection.anchorNode.parentNode.closest('#llm-translate-popover')));
                
                // 如果用户不是在弹窗内选择文本，且没有活跃的选择操作，则关闭弹窗
                if (!isSelectingInPopover && !hasSelection) {
                    removeTranslationUI();
                }
            }, 150);
        } else {
            // 对于普通的划词翻译图标，立即关闭
            removeTranslationUI();
        }
    }
});

// 监听键盘事件，ESC 键关闭弹窗
document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
        const popover = document.querySelector('#llm-translate-popover');
        if (popover) {
            removeTranslationUI();
        }
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
        e.preventDefault();
        e.stopPropagation();
        const { targetLanguage, secondTargetLanguage } = await chrome.storage.local.get(['targetLanguage', 'secondTargetLanguage']);
        // 存储中保存的是语言键（如 langEnglish）。但为了兼容历史数据，做健壮处理。
        const storedPrimary = targetLanguage || 'langSimplifiedChinese';
        const storedSecondary = secondTargetLanguage || 'langEnglish';

        // Convert language keys to language names（英文名传给后端提示词使用）
        const langKeyToEnName = {
            'langEnglish': 'English',
            'langSimplifiedChinese': 'Simplified Chinese',
            'langTraditionalChinese': 'Traditional Chinese',
            'langFrench': 'French',
            'langSpanish': 'Spanish',
            'langArabic': 'Arabic',
            'langRussian': 'Russian',
            'langPortuguese': 'Portuguese',
            'langGerman': 'German',
            'langItalian': 'Italian',
            'langDutch': 'Dutch',
            'langDanish': 'Danish',
            'langJapanese': 'Japanese',
            'langKorean': 'Korean',
            'langVietnamese': 'Vietnamese',
            'langThai': 'Thai',
            'langIndonesian': 'Indonesian',
            'langHindi': 'Hindi',
            'langTurkish': 'Turkish',
            'langPolish': 'Polish',
            'langFinnish': 'Finnish',
            'langHungarian': 'Hungarian',
            'langCzech': 'Czech',
            'langGreek': 'Greek',
            'langRomanian': 'Romanian',
            'langSlovak': 'Slovak'
        };

        // 兼容三种输入：语言键、英文名、其他（回退 English）
        const normalizeToEnName = (input) => {
            if (!input) return 'English';
            if (langKeyToEnName[input]) return langKeyToEnName[input];
            // 常见本地化/别名归一
            const aliasToEnName = {
                '中文': 'Simplified Chinese',
                '简体中文': 'Simplified Chinese',
                '繁體中文': 'Traditional Chinese',
                '繁体中文': 'Traditional Chinese',
                '英语': 'English',
                '英文': 'English',
                '日语': 'Japanese',
                '日本語': 'Japanese',
                '韩语': 'Korean',
                '韓國語': 'Korean',
                '한국어': 'Korean'
            };
            if (aliasToEnName[input]) return aliasToEnName[input];
            // 若已是英文名称（来自旧版本或手动写入），直接使用
            const values = Object.values(langKeyToEnName);
            if (values.includes(input)) return input;
            return 'English';
        };

        const targetLanguageName = normalizeToEnName(storedPrimary);
        const secondTargetLanguageName = normalizeToEnName(storedSecondary);
        
        showResultPopover(x, y, chrome.i18n.getMessage('statusTranslating'));
        chrome.runtime.sendMessage({ 
            type: 'translate', 
            text, 
            targetLanguage: targetLanguageName,
            secondTargetLanguage: secondTargetLanguageName
        }, (response) => {
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

// 处理右键菜单翻译
async function handleContextMenuTranslation(request) {
    const { text, targetLanguage, secondTargetLanguage } = request;
    
    // 移除现有的UI
    removeTranslationUI();
    
    // 显示翻译结果弹窗
    showTranslationResult(text, targetLanguage, secondTargetLanguage);
}

// 显示翻译结果弹窗
async function showTranslationResult(text, targetLanguage, secondTargetLanguage) {
    // 创建结果弹窗
    resultPopover = document.createElement('div');
    resultPopover.id = 'llm-translate-popover';
    resultPopover.className = 'context-menu-popup'; // 添加特殊类名用于样式
    resultPopover.innerHTML = `
        <div class="llm-translate-header">
            <span class="llm-translate-title">${chrome.i18n.getMessage('popupTitle')}</span>
            <button class="llm-translate-close" id="llm-translate-close">×</button>
        </div>
        <div class="llm-translate-content">
            <div class="llm-translate-original">
                <strong>${chrome.i18n.getMessage('originalText') || 'Original'}:</strong>
                <div class="llm-translate-text">${text}</div>
            </div>
            <div class="llm-translate-result">
                <div class="llm-translate-result-header">
                    <strong>${chrome.i18n.getMessage('translationResult') || 'Translation'}:</strong>
                    <button class="llm-translate-copy-btn" id="llm-translate-copy-btn" title="${chrome.i18n.getMessage('copyTranslation') || 'Copy translation'}" style="display: none;">📋</button>
                </div>
                <div class="llm-translate-text" id="llm-translate-result-text">${chrome.i18n.getMessage('statusTranslating') || 'Translating...'}</div>
            </div>
        </div>
    `;
    
    document.body.appendChild(resultPopover);
    
    // 添加关闭按钮事件
    const closeBtn = resultPopover.querySelector('#llm-translate-close');
    closeBtn.addEventListener('click', () => {
        removeTranslationUI();
    });
    
    // 添加复制按钮事件
    const copyBtn = resultPopover.querySelector('#llm-translate-copy-btn');
    copyBtn.addEventListener('click', async () => {
        const resultText = resultPopover.querySelector('#llm-translate-result-text');
        const textToCopy = resultText.textContent;
        
        try {
            await navigator.clipboard.writeText(textToCopy);
            // 显示复制成功提示
            const originalText = copyBtn.textContent;
            copyBtn.textContent = '✅';
            copyBtn.style.color = '#4caf50';
            setTimeout(() => {
                copyBtn.textContent = originalText;
                copyBtn.style.color = '';
            }, 1500);
        } catch (error) {
            console.error('复制失败:', error);
            // 显示复制失败提示
            const originalText = copyBtn.textContent;
            copyBtn.textContent = '❌';
            copyBtn.style.color = '#f44336';
            setTimeout(() => {
                copyBtn.textContent = originalText;
                copyBtn.style.color = '';
            }, 1500);
        }
    });
    
    // 点击外部关闭（使用现有的 mousedown 监听器逻辑）
    
    // 发送翻译请求
    try {
        chrome.runtime.sendMessage({
            type: 'translate',
            text,
            targetLanguage,
            secondTargetLanguage
        }, (response) => {
            const resultText = resultPopover.querySelector('#llm-translate-result-text');
            const copyBtn = resultPopover.querySelector('#llm-translate-copy-btn');
            
            if (response && response.translation) {
                resultText.textContent = response.translation;
                resultText.style.color = '#333';
                // 翻译成功后显示复制按钮
                copyBtn.style.display = 'inline-block';
            } else if (response && response.error) {
                resultText.textContent = `Error: ${response.error}`;
                resultText.style.color = '#d32f2f';
                // 翻译失败时隐藏复制按钮
                copyBtn.style.display = 'none';
            } else {
                resultText.textContent = chrome.i18n.getMessage('statusError', ['Unknown error']) || 'Unknown error';
                resultText.style.color = '#d32f2f';
                // 翻译失败时隐藏复制按钮
                copyBtn.style.display = 'none';
            }
        });
    } catch (error) {
        const resultText = resultPopover.querySelector('#llm-translate-result-text');
        resultText.textContent = `Error: ${error.message}`;
        resultText.style.color = '#d32f2f';
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

// --- Screenshot selection overlay ---
let selectionOverlay = null;
let selectionRect = null;
let isSelecting = false;

function startScreenshotSelectionOverlay() {
    if (selectionOverlay) return;

    selectionOverlay = document.createElement('div');
    selectionOverlay.id = 'llm-translate-screenshot-overlay';
    selectionOverlay.style.cssText = `
        position: fixed; inset: 0; z-index: 2147483646; cursor: crosshair;
        background: rgba(0,0,0,0.15);
    `;

    const selectionBox = document.createElement('div');
    selectionBox.id = 'llm-translate-selection-box';
    selectionBox.style.cssText = `
        position: absolute; border: 2px solid #4caf50; background: rgba(76,175,80,0.15);
        pointer-events: none;
    `;

    const toolbar = document.createElement('div');
    toolbar.id = 'llm-translate-selection-toolbar';
    toolbar.style.cssText = `
        position: absolute; padding: 6px 8px; background: #fff; border: 1px solid #ddd; border-radius: 6px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.15); display: none; gap: 8px; align-items: center;
    `;

    const translateBtn = document.createElement('button');
    translateBtn.textContent = chrome.i18n.getMessage('selectionTranslateButton') || 'Translate';
    translateBtn.style.cssText = 'padding: 4px 8px;';
    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = chrome.i18n.getMessage('cancelButton') || 'Cancel';
    cancelBtn.style.cssText = 'padding: 4px 8px;';
    toolbar.appendChild(translateBtn);
    toolbar.appendChild(cancelBtn);

    selectionOverlay.appendChild(selectionBox);
    selectionOverlay.appendChild(toolbar);
    document.body.appendChild(selectionOverlay);

    let startX = 0, startY = 0;

    function onMouseDown(e) {
        // Ignore clicks on toolbar buttons
        if (e.target.closest('#llm-translate-selection-toolbar')) return;
        e.preventDefault();
        isSelecting = true;
        startX = e.clientX; startY = e.clientY;
        selectionBox.style.left = `${startX}px`;
        selectionBox.style.top = `${startY}px`;
        selectionBox.style.width = '0px';
        selectionBox.style.height = '0px';
        selectionBox.style.display = 'block';
        toolbar.style.display = 'none';
    }
    function onMouseMove(e) {
        if (!isSelecting) return;
        e.preventDefault();
        const x = Math.min(e.clientX, startX);
        const y = Math.min(e.clientY, startY);
        const w = Math.abs(e.clientX - startX);
        const h = Math.abs(e.clientY - startY);
        selectionBox.style.left = `${x}px`;
        selectionBox.style.top = `${y}px`;
        selectionBox.style.width = `${w}px`;
        selectionBox.style.height = `${h}px`;
    }
    function onMouseUp(e) {
        if (!isSelecting) return;
        isSelecting = false;
        const rect = selectionBox.getBoundingClientRect();
        selectionRect = { x: rect.left, y: rect.top, width: rect.width, height: rect.height, devicePixelRatio: window.devicePixelRatio || 1 };
        if (rect.width < 5 || rect.height < 5) {
            cleanup();
            return;
        }
        // position toolbar near rect
        toolbar.style.left = `${rect.left + rect.width - 140}px`;
        toolbar.style.top = `${rect.top - 40}px`;
        toolbar.style.display = 'flex';
    }

    function cleanup() {
        selectionOverlay?.remove();
        selectionOverlay = null;
        selectionRect = null;
        isSelecting = false;
        window.removeEventListener('mousedown', onMouseDown, true);
        window.removeEventListener('mousemove', onMouseMove, true);
        window.removeEventListener('mouseup', onMouseUp, true);
    }

    cancelBtn.addEventListener('click', (ev) => { ev.stopPropagation(); cleanup(); });
    translateBtn.addEventListener('click', async (ev) => {
        ev.stopPropagation();
        if (!selectionRect) return;
        // 先显示加载中的弹窗
        const waitingText = chrome.i18n.getMessage('statusTranslating') || 'Translating...';
        showImageTranslationResultPopover(waitingText, true);
        // ask background to capture and crop
        console.log('[LLM-Translate] Requesting captureAndTranslateImage', selectionRect);
        chrome.runtime.sendMessage({ type: 'captureAndTranslateImage', rect: selectionRect }, (resp) => {
            if (chrome.runtime.lastError) {
                console.error('[LLM-Translate] captureAndTranslateImage error:', chrome.runtime.lastError.message);
                showImageTranslationResultPopover(`Error: ${chrome.runtime.lastError.message}`, false);
            } else if (resp && resp.error) {
                console.error('[LLM-Translate] captureAndTranslateImage response error:', resp.error);
                showImageTranslationResultPopover(`Error: ${resp.error}`, false);
            } else {
                console.log('[LLM-Translate] captureAndTranslateImage response ok');
            }
        });
        cleanup();
    });

    // Attach to overlay instead of window to avoid interference with toolbar
    selectionOverlay.addEventListener('mousedown', onMouseDown, true);
    selectionOverlay.addEventListener('mousemove', onMouseMove, true);
    selectionOverlay.addEventListener('mouseup', onMouseUp, true);
}
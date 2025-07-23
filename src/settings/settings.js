// settings.js - 具有改进的UX和自动保存功能

const apiKeyInput = document.getElementById('gemini-api-key');
const fetchModelsButton = document.getElementById('fetch-models-button');
const modelSelect = document.getElementById('model-selection');
const statusDiv = document.getElementById('status');

// 当用户点击“获取模型”时，保存API密钥然后获取
async function handleFetchAndSaveKey() {
    const apiKey = apiKeyInput.value;
    if (!apiKey) {
        showStatus('请输入 API 密钥。', 'error');
        return;
    }

    // 1. 立即保存 API 密钥
    chrome.storage.local.set({ geminiApiKey: apiKey }, () => {
        showStatus('API 密钥已保存。正在获取模型...', 'info');
    });

    // 2. 获取模型
    await fetchModels(apiKey);
}

// 获取模型列表
async function fetchModels(apiKey) {
    modelSelect.innerHTML = '<option>加载中...</option>';

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error.message || `API 请求失败，状态码: ${response.status}`);
        }
        const data = await response.json();

        const supportedModels = data.models.filter(model => 
            model.supportedGenerationMethods.includes('generateContent')
        );

        modelSelect.innerHTML = '';
        if (supportedModels.length === 0) {
            modelSelect.innerHTML = '<option>未找到可用模型</option>';
            showStatus('未找到支持文本生成的模型。', 'error');
            return;
        }

        supportedModels.forEach(model => {
            const option = document.createElement('option');
            option.value = model.name.replace('models/', ''); 
            option.textContent = `${model.displayName} (${option.value})`;
            modelSelect.appendChild(option);
        });
        showStatus('模型列表获取成功！请选择一个模型。', 'success');
        
        // 获取成功后，加载之前保存过的模型选项
        loadSelectedModel();

    } catch (error) {
        console.error('获取模型失败:', error);
        modelSelect.innerHTML = '<option>获取失败</option>';
        showStatus(`获取模型失败: ${error.message}`, 'error');
    }
}

// 当用户选择一个新模型时，自动保存
function saveSelectedModel() {
    const selectedModel = modelSelect.value;
    if (selectedModel) {
        chrome.storage.local.set({ selectedModel: selectedModel }, () => {
            showStatus(`模型 '${selectedModel}' 已自动保存。`, 'success');
        });
    }
}

// 加载已保存的设置
function loadSettings() {
    chrome.storage.local.get(['geminiApiKey'], (result) => {
        if (result.geminiApiKey) {
            apiKeyInput.value = result.geminiApiKey;
            // 如果有 key，自动触发一次模型获取
            fetchModels(result.geminiApiKey);
        }
    });
}

// 加载并选中之前选择的模型
function loadSelectedModel() {
    chrome.storage.local.get('selectedModel', (result) => {
        if (result.selectedModel) {
            // 检查该选项是否存在
            if ([...modelSelect.options].some(opt => opt.value === result.selectedModel)) {
                modelSelect.value = result.selectedModel;
            }
        }
    });
}

// 显示状态消息
function showStatus(message, type = 'info') {
    const colorMap = {
        'info': '#007bff',
        'success': 'green',
        'error': 'red'
    };
    statusDiv.textContent = message;
    statusDiv.style.color = colorMap[type] || 'black';
    
    // 让成功消息停留时间短一些
    const duration = type === 'success' ? 2500 : 4000;
    setTimeout(() => {
        if (statusDiv.textContent === message) {
            statusDiv.textContent = '';
        }
    }, duration);
}

// 绑定事件
document.addEventListener('DOMContentLoaded', loadSettings);
fetchModelsButton.addEventListener('click', handleFetchAndSaveKey);
modelSelect.addEventListener('change', saveSelectedModel);
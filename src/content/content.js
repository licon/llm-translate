// content.js - 在网页上下文中运行

console.log("LLM-Translate content script loaded.");

// 监听文本选择事件，并将选择的文本保存到 storage
document.addEventListener('mouseup', () => {
    const selectedText = window.getSelection().toString().trim();
    
    // 只有当选中文本长度大于0时才保存
    // 这可以避免在用户只是点击页面时清空之前的选择
    if (selectedText.length > 0) {
        chrome.storage.local.set({ 'lastSelectedText': selectedText }, () => {
            console.log(`Saved selected text: "${selectedText}"`);
        });
    }
});
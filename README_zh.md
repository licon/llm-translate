# LLM Translate: 智能浏览器翻译插件

[View English Version (查看英文版本)](README.md)

LLM Translate 是一款现代化的浏览器翻译插件，它利用大型语言模型（LLM）的强大能力，为您提供更加精准、流畅且贴近上下文的网页翻译体验。

与传统的机器翻译不同，本插件旨在通过先进的 AI 技术理解语言的细微差别，生成高质量的译文，帮助您轻松跨越语言障碍，高效获取全球信息。

## 核心功能

*   **多提供商支持:** 支持配置多个大型语言模型提供商 (当前支持 **Google Gemini**、**Silicon Flow** 和 **Ollama**)，让您自由选择最适合的模型。
*   **即时划词翻译:** 在任何网页上选择文本，即可在鼠标旁看到翻译图标，点击后立刻在原地显示翻译结果，体验流畅无打扰。
*   **弹窗快速翻译:** 点击浏览器工具栏图标，在弹出窗口中快速输入或粘贴文本进行翻译。
*   **智能自动填充:** 划词后打开弹窗，选中的文本会自动填充到输入框，简化操作。
*   **安全本地存储:** 所有 API 密钥都安全地存储在您本地的浏览器中，绝不上传。
*   **朗读与复制:** 在弹窗中，可以朗读输入和输出的文本，也可以一键复制翻译结果，操作便捷。

## 技术栈

*   **前端:** `HTML`, `CSS`, `JavaScript`
*   **浏览器接口:** `WebExtensions API` (兼容 Chrome, Firefox, Edge 等现代浏览器)
*   **语音合成:** `Web Speech API`

## 推荐模型

### 各提供商免费模型

| 提供商 | 推荐模型 | 说明 |
|--------|----------|------|
| **Google Gemini** | `gemma3:12b`<br>`gemma3:4b`<br>`gemma3n` | 免费模型，推荐 Gemma 3 12B |
| **Silicon Flow** | `qwen3:8b`<br>`glm-4:9b`<br>`qwen2.5:7b` | 免费模型，推荐 Qwen3-8B |
| **Ollama (本地)** | `qwen2:1.5b`<br>`llama3.1:8b`<br>`gemma2:2b` | 本地下载运行 |

### 模型选择建议

* **追求速度**: 选择较小模型 (1.5B-3B 参数)
* **追求质量**: 选择较大模型 (7B+ 参数)
* **追求隐私**: 使用 Ollama 本地模型
* **成本考虑**: 以上模型均为免费使用

*最后更新时间: 2025年8月15日*

## 翻译质量对比

看看 LLM-Translate 与其他翻译工具在准确性和流畅性方面的对比：

### 英文到中文翻译示例

| 原文 | Google 翻译 | LLM-Translate |
|------|-------------|---------------|
| "Supports one-time, recurring, and usage-based pricing models. Learn more about Subscriptions, Usage-based billing, and Invoicing." | "支持一次性，经常性和基于用法的定价模型。了解有关订阅，基于使用的计费和发票的更多信息。" | ✅ "支持一次性、周期性和基于使用情况的定价模型。了解更多关于订阅、基于使用情况的计费和发票的信息。" |
| "If you're residing in one of China's territories, please select an option for your specific location. You won't be able to change it later." | "如果您居住在中国的一个领土之一，请为您的特定位置选择一个选项。您将稍后再进行更改。" | ✅ "如果您居住在中国的某个地区，请选择您所在的具体位置。您将无法在之后更改它。" |
| "Super cool design and the app idea is a no brainer. Good work" | "超级酷的设计和应用程序的想法是无关紧要的。做得好" | ✅ "超酷的设计，这个应用的想法非常直观。做得好" |


### 主要优势

* **上下文理解**: LLM-Translate 比传统机器翻译更好地理解上下文
* **自然流畅**: 更自然流畅的翻译，听起来像人工撰写
* **文化细微差别**: 更好地处理文化表达和习语
* **技术准确性**: 对技术和专业内容的翻译更准确
* **一致性**: 在不同上下文中术语使用更一致

*注意：翻译质量可能因选择的模型和提供商而异。*

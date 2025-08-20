# LLM Translate: Smart Browser Translation Plugin

LLM Translate is a modern browser translation plugin that harnesses the power of Large Language Models (LLMs) to provide you with a more accurate, fluent, and context-aware web page translation experience.

Unlike traditional machine translation, this plugin aims to understand the nuances of language through advanced AI technology, generating high-quality translations to help you easily overcome language barriers and efficiently access global information.

[查看中文版本 (View Chinese Version)](README_zh.md)

## Core Features

*   **Multi-provider Support:** Supports configuring multiple Large Language Model providers (currently supports **Google Gemini**, **Silicon Flow**, and **Ollama**), allowing you to freely choose the most suitable model.
*   **Instant Hover Translation:** Select text on any web page, and a translation icon will appear next to your mouse. Click it to see the translation result in place for a smooth and uninterrupted experience.
*   **Quick Popup Translation:** Click the browser toolbar icon to quickly enter or paste text for translation in a popup window.
*   **Smart Auto-fill:** After selecting text, open the popup, and the selected text will be automatically filled into the input box, simplifying the operation.
*   **Secure Local Storage:** All API keys are securely stored in your local browser and are never uploaded.
*   **Read Aloud and Copy:** In the popup window, you can read the input and output text aloud, and you can also copy the translation result with one click for convenient operation.

## Features to Implement
*   **Custom Translation Styles:** Allow users to customize translation tone (formal, casual, technical, etc.).
*   **Translation History:** Track and manage translation history with search and export capabilities.
*   **Keyboard Shortcuts:** Add customizable keyboard shortcuts for quick translation actions.
*   **Second Target Language:** Expand the plugin interface to support the second target language.
*   **Capture Screen to Translate :** Enhanced capability to translate the image captured from the screen.

## Tech Stack

*   **Frontend:** `HTML`, `CSS`, `JavaScript`
*   **Browser API:** `WebExtensions API` (compatible with modern browsers like Chrome, Firefox, Edge, etc.)
*   **Speech Synthesis:** `Web Speech API`

## Recommended Models

### Free Models by Provider

| Provider | Recommended Models | Notes |
|----------|-------------------|-------|
| **Google Gemini** | `gemma3:12b`<br>`gemma3:4b`<br>`gemma3n` | Free models, recommend Gemma 3 12B |
| **Silicon Flow** | `qwen3:8b`<br>`glm-4:9b`<br>`qwen2.5:7b` | Free models, recommend Qwen3-8B |
| **Ollama (Local)** | `qwen2:1.5b`<br>`llama3.1:8b`<br>`gemma2:2b` | Download and run locally |

### Model Selection Tips

* **For Speed**: Choose smaller models (1.5B-3B parameters)
* **For Quality**: Choose larger models (7B+ parameters)  
* **For Privacy**: Use Ollama with local models
* **For Cost**: All listed models are free to use

*Last updated: August 15, 2025*

## Translation Quality Comparison

See how LLM-Translate compares to other translation tools in terms of accuracy and fluency:

### English to Chinese Translation Examples

| Original Text | Google Translate API | LLM Translate |
|---------------|------------------|---------------|
| "Supports one-time, recurring, and usage-based pricing models. Learn more about Subscriptions, Usage-based billing, and Invoicing." | "支持一次性，经常性和基于用法的定价模型。了解有关订阅，基于使用的计费和发票的更多信息。" | ✅ "支持一次性、周期性和基于使用情况的定价模型。了解更多关于订阅、基于使用情况的计费和发票的信息。" |
| "If you're residing in one of China's territories, please select an option for your specific location. You won't be able to change it later." | "如果您居住在中国的一个领土之一，请为您的特定位置选择一个选项。您将稍后再进行更改。" | ✅ "如果您居住在中国的某个地区，请选择您所在的具体位置。您将无法在之后更改它。" |
| "Super cool design and the app idea is a no brainer. Good work" | "超级酷的设计和应用程序的想法是无关紧要的。做得好" | ✅ "超酷的设计，这个应用的想法非常直观。做得好" |

### Key Advantages

* **Context Awareness**: LLM-Translate understands context better than traditional MT
* **Natural Fluency**: More natural and fluent translations that sound human-written
* **Cultural Nuances**: Better handling of cultural expressions and idioms
* **Technical Accuracy**: Superior translation of technical and specialized content
* **Consistency**: More consistent terminology across different contexts

*Note: Translation quality may vary depending on the selected model and provider.*

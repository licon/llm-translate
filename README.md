<div align="center">
  <img src="icons/icon128.png" alt="LLM Translate Logo" width="128" height="128">
  <h1>LLM Translate: Smart Browser Translation Plugin</h1>
</div>

LLM Translate is a modern browser translation plugin that harnesses the power of Large Language Models (LLMs) to provide you with a more accurate, fluent, and context-aware web page translation experience.

Unlike traditional machine translation, this plugin aims to understand the nuances of language through advanced AI technology, generating high-quality translations to help you easily overcome language barriers and efficiently access global information.

[查看中文版本 (View Chinese Version)](README_zh.md)

## Core Features

*   **Multi-provider Support:** Supports configuring multiple Large Language Model providers (currently supports **Google Gemini**, **Silicon Flow**, and **Ollama**), allowing you to freely choose the most suitable model.
*   **Instant Hover Translation:** Select text on any web page, and a translation icon will appear next to your mouse. Click it to see the translation result in place for a smooth and uninterrupted experience.
*   **🆕 Context Menu Translation:** Right-click on selected text to access translation options directly from the context menu. Choose between your primary or secondary target language for instant translation in a centered popup window.
*   **📸 Screenshot Translation:** Capture any area of the webpage and translate text within images using AI vision capabilities. Perfect for translating text in images, PDFs, or screenshots.
*   **⌨️ Keyboard Shortcuts:** Use `Ctrl+Shift+S` (Windows/Linux) or `Command+Shift+S` (Mac) to quickly activate screenshot translation mode.
*   **Quick Popup Translation:** Click the browser toolbar icon to quickly enter or paste text for translation in a popup window.
*   **Smart Auto-fill:** After selecting text, open the popup, and the selected text will be automatically filled into the input box, simplifying the operation.
*   **One-Click Copy:** Copy translation results instantly with the built-in copy button, complete with visual feedback and multi-language support.
*   **Secure Local Storage:** All API keys are securely stored in your local browser and are never uploaded.
*   **Read Aloud and Copy:** In the popup window, you can read the input and output text aloud, and you can also copy the translation result with one click for convenient operation.
*   **Smart Target Language Settings:** Configure default and second target languages for intelligent translation switching.
*   **Intelligent Language Detection:** Automatically detects when source language matches target language and switches to second target language.
*   **Comprehensive Language Support:** Supports 100+ languages with native translations for all interface elements.

## Features to Implement
*   **Custom Translation Styles:** Allow users to customize translation tone (formal, casual, technical, etc.).
*   **Translation History:** Track and manage translation history with search and export capabilities.
*   **Customizable Keyboard Shortcuts:** Allow users to customize keyboard shortcuts for different actions.
*   **Offline Mode:** Enable basic translation functionality when internet connection is unavailable.
*   **Advanced Settings Panel:** Enhanced configuration options for power users.
*   **Dark Mode:** Implement dark theme support for better user experience in low-light environments.

## Target Language Settings

LLM Translate now features intelligent target language management to enhance your translation experience:

### **Default Target Language**
- Set your preferred target language that syncs with the popup interface
- Automatically used for all translation requests
- Easily changeable through the settings page

### **Second Target Language**
- Configure an additional target language for quick switching
- Automatically activated when source language matches your default target
- Perfect for bilingual users or when translating between similar languages

### **Smart Language Detection**
- Automatically detects the source language of your text
- Intelligently switches to second target language when source = default target
- Prevents redundant translations and improves efficiency

### **Example Use Cases**
- **English ↔ Chinese**: Set English as default, Chinese as second target
- **Spanish ↔ Portuguese**: Set Spanish as default, Portuguese as second target  
- **German ↔ English**: Set German as default, English as second target

## Translation Methods

LLM Translate offers multiple convenient ways to translate text on web pages:

### 🖱️ **Context Menu Translation (NEW)**
1. **Select text** on any webpage
2. **Right-click** to open the context menu
3. **Choose from translation options:**
   - "Translate to [Primary Language]" - Uses your default target language
   - "Translate to [Secondary Language]" - Uses your second target language
   - "Open Settings" - Quick access to configuration
4. **View results** in a centered popup with original text and translation
5. **Copy instantly** using the built-in copy button

**Benefits:**
- Fastest translation method with minimal clicks
- Direct access without additional UI elements
- Dynamic menu labels showing current language settings
- Professional popup design with copy functionality

### 📍 **Hover Translation**
1. **Select text** on any webpage
2. **Translation icon appears** near your selection
3. **Click the icon** to see translation results
4. **Copy or interact** with the result as needed

### 🔲 **Popup Translation**
1. **Click the extension icon** in your browser toolbar
2. **Enter or paste text** in the input field
3. **Click translate** to get results
4. **Use additional features** like text-to-speech

### 📸 **Screenshot Translation (NEW)**
1. **Click the screenshot icon** in the popup or use keyboard shortcut `Ctrl+Shift+S` / `Command+Shift+S`
2. **Select an area** on the webpage by dragging your mouse
3. **Click "Translate"** in the selection toolbar
4. **View results** in a popup with recognized text and translation
5. **Copy the translation** using the built-in copy button

**Benefits:**
- Translate text in images, PDFs, and screenshots
- AI-powered multimodal recognition for accurate text understanding
- Works with any visual content on web pages
- Quick keyboard shortcut for instant access

### ⚡ **Smart Features**
- **Auto-fill**: Selected text automatically fills popup input
- **Language detection**: Automatically switches between target languages
- **Copy protection**: Enhanced popup stability for text selection
- **Keyboard shortcuts**: ESC key to close popups quickly
- **Screenshot shortcuts**: `Ctrl+Shift+S` / `Command+Shift+S` for instant screenshot mode

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

# LLM-Translate: Smart Browser Translation Plugin

LLM-Translate is a modern browser translation plugin that harnesses the power of Large Language Models (LLMs) to provide you with a more accurate, fluent, and context-aware web page translation experience.

Unlike traditional machine translation, this plugin aims to understand the nuances of language through advanced AI technology, generating high-quality translations to help you easily overcome language barriers and efficiently access global information.

[查看中文版本 (View Chinese Version)](README_zh.md)

## Core Features

*   **Multi-provider Support:** Supports configuring multiple Large Language Model providers (currently supports **Google Gemini**, **Silicon Flow**, and **Ollama**), allowing you to freely choose the most suitable model.
*   **Instant Hover Translation:** Select text on any web page, and a translation icon will appear next to your mouse. Click it to see the translation result in place for a smooth and uninterrupted experience.
*   **Quick Popup Translation:** Click the browser toolbar icon to quickly enter or paste text for translation in a popup window.
*   **Smart Auto-fill:** After selecting text, open the popup, and the selected text will be automatically filled into the input box, simplifying the operation.
*   **Secure Local Storage:** All API keys are securely stored in your local browser and are never uploaded.
*   **Read Aloud and Copy:** In the popup window, you can read the input and output text aloud, and you can also copy the translation result with one click for convenient operation.

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

# Ollama 设置指南 / Ollama Setup Guide

## 中文指南

### 1. 安装和配置 Ollama

1. **下载 Ollama**
   - 访问 [Ollama 官网](https://ollama.ai/) 下载并安装
   - 或使用命令行: `curl -fsSL https://ollama.ai/install.sh | sh`

2. **配置跨域访问（重要）**
   ```bash
   # 设置环境变量允许浏览器扩展访问
   export OLLAMA_ORIGINS="*"
   # 或者更安全的方式，只允许扩展
   export OLLAMA_ORIGINS="chrome-extension://*,moz-extension://*"
   ```

3. **启动 Ollama 服务**
   ```bash
   ollama serve
   ```
   默认运行在 `http://localhost:11434`

4. **下载模型**
   ```bash
   # 下载一个轻量级模型（推荐用于翻译）
   ollama pull qwen2:1.5b
   
   # 或者下载其他模型
   ollama pull llama3.1:8b
   ollama pull gemma3:4b
   ```

### 2. 在扩展中配置 Ollama

1. **打开扩展设置**
   - 右键点击浏览器工具栏中的 LLM-Translate 图标
   - 选择"设置"或"选项"

2. **切换到 Ollama 标签页**
   - 在设置页面中点击"Ollama"标签

3. **配置服务器地址**
   - 输入 Ollama 服务器地址：`http://localhost:11434`
   - 如果 Ollama 运行在其他地址或端口，请相应修改

4. **获取模型列表**
   - 点击"获取模型"按钮
   - 扩展将从您的 Ollama 服务器获取可用模型列表

5. **选择模型**
   - 从下拉菜单中选择您要使用的模型
   - 模型会自动保存

### 3. 使用翻译功能

配置完成后，您可以：
- 在网页上选择文本，点击翻译图标进行翻译
- 使用扩展弹窗进行文本翻译
- 所有翻译请求将通过您本地的 Ollama 模型处理

### 推荐模型

- **qwen2:1.5b** - 轻量级，速度快，适合基本翻译
- **llama3.1:8b** - 较大模型，翻译质量更高
- **gemma3:4b** - Google 开发，平衡性能和质量

---

## English Guide

### 1. Install and Configure Ollama

1. **Download Ollama**
   - Visit [Ollama website](https://ollama.ai/) to download and install
   - Or use command line: `curl -fsSL https://ollama.ai/install.sh | sh`

2. **Configure CORS access (Important)**
   ```bash
   # Set environment variable to allow browser extension access
   export OLLAMA_ORIGINS="*"
   # Or more secure way, only allow extensions
   export OLLAMA_ORIGINS="chrome-extension://*,moz-extension://*"
   ```

3. **Start Ollama service**
   ```bash
   ollama serve
   ```
   Runs by default on `http://localhost:11434`

4. **Download models**
   ```bash
   # Download a lightweight model (recommended for translation)
   ollama pull qwen2:1.5b
   
   # Or download other models
   ollama pull llama3.1:8b
   ollama pull gemma3:4b
   ```

### 2. Configure Ollama in Extension

1. **Open extension settings**
   - Right-click the LLM-Translate icon in browser toolbar
   - Select "Settings" or "Options"

2. **Switch to Ollama tab**
   - Click the "Ollama" tab in the settings page

3. **Configure server URL**
   - Enter Ollama server URL: `http://localhost:11434`
   - Modify accordingly if Ollama runs on different address/port

4. **Fetch model list**
   - Click "Fetch Models" button
   - Extension will retrieve available models from your Ollama server

5. **Select model**
   - Choose your desired model from the dropdown
   - Model selection is automatically saved

### 3. Use Translation Features

After configuration, you can:
- Select text on web pages and click translate icon
- Use extension popup for text translation
- All translation requests will be processed by your local Ollama model

### Recommended Models

- **qwen2:1.5b** - Lightweight, fast, good for basic translation
- **llama3.1:8b** - Larger model, higher translation quality
- **gemma3:4b** - Developed by Google, balanced performance and quality

## 故障排除 / Troubleshooting

### 中文

#### 跨域访问问题（403 Forbidden）
如果遇到 "403 Forbidden" 或 "Ollama 服务器拒绝请求" 错误：

1. **临时解决方案**：
   ```bash
   # 停止 Ollama 服务
   pkill ollama
   
   # 设置环境变量并重启
   export OLLAMA_ORIGINS="*"
   ollama serve
   ```

2. **永久解决方案**：
   ```bash
   # 创建配置目录
   mkdir -p ~/.ollama
   
   # 添加环境变量到配置文件
   echo 'OLLAMA_ORIGINS="*"' >> ~/.ollama/ollama.env
   
   # 重启 Ollama
   ollama serve
   ```

3. **验证 CORS 设置**：
   ```bash
   curl -X OPTIONS http://localhost:11434/api/generate \
     -H "Origin: chrome-extension://test" \
     -H "Access-Control-Request-Method: POST" \
     -v
   ```

#### 其他常见问题
- **无法连接到 Ollama**: 确保 Ollama 服务正在运行且地址正确
- **模型列表为空**: 确保您已下载至少一个模型
- **翻译失败**: 检查模型是否正确加载，尝试重启 Ollama 服务

### English

#### CORS Access Issues (403 Forbidden)
If you encounter "403 Forbidden" or "Ollama server refused request" errors:

1. **Temporary solution**:
   ```bash
   # Stop Ollama service
   pkill ollama
   
   # Set environment variable and restart
   export OLLAMA_ORIGINS="*"
   ollama serve
   ```

2. **Permanent solution**:
   ```bash
   # Create config directory
   mkdir -p ~/.ollama
   
   # Add environment variable to config file
   echo 'OLLAMA_ORIGINS="*"' >> ~/.ollama/ollama.env
   
   # Restart Ollama
   ollama serve
   ```

3. **Verify CORS settings**:
   ```bash
   curl -X OPTIONS http://localhost:11434/api/generate \
     -H "Origin: chrome-extension://test" \
     -H "Access-Control-Request-Method: POST" \
     -v
   ```

#### Other Common Issues
- **Cannot connect to Ollama**: Ensure Ollama service is running and URL is correct
- **Empty model list**: Make sure you have downloaded at least one model
- **Translation fails**: Check if model is properly loaded, try restarting Ollama service 
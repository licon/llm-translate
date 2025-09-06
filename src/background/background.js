// background.js - 支持多提供商的后台服务

// --- 初始化与安装 ---
chrome.runtime.onInstalled.addListener(() => {
    console.log("LLM-Translate 插件已安装或更新。");
    
    // 创建右键菜单
    createContextMenus();
    
    // 设置初始默认值，仅当它们不存在时
    chrome.storage.local.get(null, (items) => {
        const defaults = {
            activeProvider: 'gemini',
            geminiApiKey: '',
            geminiSelectedModel: '',
            siliconflowApiKey: '',
            siliconflowSelectedModel: '',
            ollamaUrl: 'http://localhost:11434',
            ollamaSelectedModel: '',
            // 使用语言键而不是本地化名称，确保与设置/弹窗保持一致
            targetLanguage: 'langSimplifiedChinese',
            secondTargetLanguage: 'langEnglish'
        };
        let itemsToSet = {};
        for (const key in defaults) {
            if (items[key] === undefined) {
                itemsToSet[key] = defaults[key];
            }
        }
        if (Object.keys(itemsToSet).length > 0) {
            chrome.storage.local.set(itemsToSet);
            console.log("已设置初始默认值:", itemsToSet);
        }
    });
});

// --- 创建右键菜单 ---
function createContextMenus() {
    // 清除现有的菜单项
    chrome.contextMenus.removeAll(() => {
        // 获取当前语言设置
        chrome.storage.local.get(['targetLanguage', 'secondTargetLanguage'], (result) => {
            const primaryLang = result.targetLanguage || 'langSimplifiedChinese';
            const secondaryLang = result.secondTargetLanguage || 'langEnglish';
            
            // 获取语言名称
            const primaryLangName = normalizeLanguageToEnglishName(primaryLang);
            const secondaryLangName = normalizeLanguageToEnglishName(secondaryLang);
            
            // 创建主菜单项
            chrome.contextMenus.create({
                id: 'translate-selection',
                title: chrome.i18n.getMessage('contextMenuTranslate'),
                contexts: ['selection']
            });
            
            // 创建子菜单项 - 翻译到主要目标语言
            chrome.contextMenus.create({
                id: 'translate-to-primary',
                parentId: 'translate-selection',
                title: chrome.i18n.getMessage('contextMenuTranslateToPrimary', [primaryLangName]),
                contexts: ['selection']
            });
            
            // 创建子菜单项 - 翻译到次要目标语言
            chrome.contextMenus.create({
                id: 'translate-to-secondary',
                parentId: 'translate-selection',
                title: chrome.i18n.getMessage('contextMenuTranslateToSecondary', [secondaryLangName]),
                contexts: ['selection']
            });
            
            // 创建分隔线
            chrome.contextMenus.create({
                id: 'separator1',
                parentId: 'translate-selection',
                type: 'separator',
                contexts: ['selection']
            });
            
            // 创建设置菜单项
            chrome.contextMenus.create({
                id: 'open-settings',
                parentId: 'translate-selection',
                title: chrome.i18n.getMessage('contextMenuOpenSettings'),
                contexts: ['selection']
            });
        });
    });
}

// --- 快捷键监听 ---
chrome.commands.onCommand.addListener((command) => {
    console.log('[LLM-Translate] Command received:', command);
    
    if (command === 'capture-selected-area') {
        // 获取当前活动标签页
        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
            if (tabs[0]) {
                console.log('[LLM-Translate] Sending startScreenshotSelection to tab:', tabs[0].id);
                // 向当前活动标签页发送开始截图选择的消息
                chrome.tabs.sendMessage(tabs[0].id, {
                    type: 'startScreenshotSelection'
                }).catch((error) => {
                    console.error('[LLM-Translate] Error sending startScreenshotSelection:', error);
                });
            }
        });
    }
});

// --- 消息监听 ---
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'translate') {
        handleTranslation(request.text, request.targetLanguage, request.secondTargetLanguage, sendResponse);
        return true; // 异步响应
    } else if (request.type === 'captureAndTranslateImage') {
        console.log('[LLM-Translate] captureAndTranslateImage received', request.rect);
        handleCaptureAndTranslateImage(request.rect, sender, sendResponse);
        return true;
    }
});

// --- 监听设置变化，更新右键菜单 ---
chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'local' && 
        (changes.targetLanguage || changes.secondTargetLanguage)) {
        // 当目标语言设置改变时，重新创建右键菜单
        createContextMenus();
    }
});

// --- 右键菜单点击处理 ---
chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === 'translate-to-primary' || info.menuItemId === 'translate-to-secondary') {
        handleContextMenuTranslation(info, tab);
    } else if (info.menuItemId === 'open-settings') {
        chrome.runtime.openOptionsPage();
    }
});

// --- 处理右键菜单翻译 ---
async function handleContextMenuTranslation(info, tab) {
    const selectedText = info.selectionText;
    if (!selectedText || selectedText.trim().length === 0) {
        return;
    }
    
    try {
        // 获取当前的语言设置
        const { targetLanguage, secondTargetLanguage } = await chrome.storage.local.get(['targetLanguage', 'secondTargetLanguage']);
        const primaryTargetLanguageKey = targetLanguage || 'langSimplifiedChinese';
        const secondaryTargetLanguageKey = secondTargetLanguage || 'langEnglish';
        
        // 确定要使用的目标语言
        let actualTargetLanguage, actualSecondTargetLanguage;
        if (info.menuItemId === 'translate-to-primary') {
            actualTargetLanguage = primaryTargetLanguageKey;
            actualSecondTargetLanguage = secondaryTargetLanguageKey;
        } else {
            actualTargetLanguage = secondaryTargetLanguageKey;
            actualSecondTargetLanguage = primaryTargetLanguageKey;
        }
        
        // 标准化语言名称
        const primaryTargetLanguageName = normalizeLanguageToEnglishName(actualTargetLanguage);
        const secondaryTargetLanguageName = normalizeLanguageToEnglishName(actualSecondTargetLanguage);
        
        // 发送翻译请求到 content script
        chrome.tabs.sendMessage(tab.id, {
            type: 'contextMenuTranslate',
            text: selectedText,
            targetLanguage: primaryTargetLanguageName,
            secondTargetLanguage: secondaryTargetLanguageName
        });
        
    } catch (error) {
        console.error('右键菜单翻译失败:', error);
    }
}

// --- 语言名称标准化函数 ---
function normalizeLanguageToEnglishName(langValue) {
    // 语言键到英文名称的映射
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
        'langIrish': 'Irish',
        'langWelsh': 'Welsh',
        'langFinnish': 'Finnish',
        'langIcelandic': 'Icelandic',
        'langSwedish': 'Swedish',
        'langNorwegianNynorsk': 'Norwegian Nynorsk',
        'langNorwegianBokmal': 'Norwegian Bokmål',
        'langJapanese': 'Japanese',
        'langKorean': 'Korean',
        'langVietnamese': 'Vietnamese',
        'langThai': 'Thai',
        'langIndonesian': 'Indonesian',
        'langMalay': 'Malay',
        'langBurmese': 'Burmese',
        'langTagalog': 'Tagalog',
        'langKhmer': 'Khmer',
        'langLao': 'Lao',
        'langHindi': 'Hindi',
        'langBengali': 'Bengali',
        'langUrdu': 'Urdu',
        'langNepali': 'Nepali',
        'langHebrew': 'Hebrew',
        'langTurkish': 'Turkish',
        'langPersian': 'Persian',
        'langPolish': 'Polish',
        'langUkrainian': 'Ukrainian',
        'langCzech': 'Czech',
        'langRomanian': 'Romanian',
        'langBulgarian': 'Bulgarian',
        'langSlovak': 'Slovak',
        'langHungarian': 'Hungarian',
        'langSlovenian': 'Slovenian',
        'langLatvian': 'Latvian',
        'langEstonian': 'Estonian',
        'langLithuanian': 'Lithuanian',
        'langBelarusian': 'Belarusian',
        'langGreek': 'Greek',
        'langCroatian': 'Croatian',
        'langMacedonian': 'Macedonian',
        'langMaltese': 'Maltese',
        'langSerbian': 'Serbian',
        'langBosnian': 'Bosnian',
        'langGeorgian': 'Georgian',
        'langArmenian': 'Armenian',
        'langNorthAzerbaijani': 'North Azerbaijani',
        'langKazakh': 'Kazakh',
        'langNorthernUzbek': 'Northern Uzbek',
        'langTajik': 'Tajik',
        'langSwahili': 'Swahili',
        'langAfrikaans': 'Afrikaans',
        'langCantonese': 'Cantonese',
        'langLuxembourgish': 'Luxembourgish',
        'langLimburgish': 'Limburgish',
        'langCatalan': 'Catalan',
        'langGalician': 'Galician',
        'langAsturian': 'Asturian',
        'langBasque': 'Basque',
        'langOccitan': 'Occitan',
        'langVenetian': 'Venetian',
        'langSardinian': 'Sardinian',
        'langSicilian': 'Sicilian',
        'langFriulian': 'Friulian',
        'langLombard': 'Lombard',
        'langLigurian': 'Ligurian',
        'langFaroese': 'Faroese',
        'langToskAlbanian': 'Tosk Albanian',
        'langSilesian': 'Silesian',
        'langBashkir': 'Bashkir',
        'langTatar': 'Tatar',
        'langMesopotamianArabic': 'Mesopotamian Arabic',
        'langNajdiArabic': 'Najdi Arabic',
        'langEgyptianArabic': 'Egyptian Arabic',
        'langLevantineArabic': 'Levantine Arabic',
        'langTaizziAdeniArabic': 'Taizzi-Adeni Arabic',
        'langDari': 'Dari',
        'langTunisianArabic': 'Tunisian Arabic',
        'langMoroccanArabic': 'Moroccan Arabic',
        'langKabuverdianu': 'Kabuverdianu',
        'langTokPisin': 'Tok Pisin',
        'langEasternYiddish': 'Eastern Yiddish',
        'langSindhi': 'Sindhi',
        'langSinhala': 'Sinhala',
        'langTelugu': 'Telugu',
        'langPunjabi': 'Punjabi',
        'langTamil': 'Tamil',
        'langGujarati': 'Gujarati',
        'langMalayalam': 'Malayalam',
        'langMarathi': 'Marathi',
        'langKannada': 'Kannada',
        'langMagahi': 'Magahi',
        'langOriya': 'Oriya',
        'langAwadhi': 'Awadhi',
        'langMaithili': 'Maithili',
        'langAssamese': 'Assamese',
        'langChhattisgarhi': 'Chhattisgarhi',
        'langBhojpuri': 'Bhojpuri',
        'langMinangkabau': 'Minangkabau',
        'langBalinese': 'Balinese',
        'langJavanese': 'Javanese',
        'langBanjar': 'Banjar',
        'langSundanese': 'Sundanese',
        'langCebuano': 'Cebuano',
        'langPangasinan': 'Pangasinan',
        'langIloko': 'Iloko',
        'langWarayPhilippines': 'Waray (Philippines)',
        'langHaitian': 'Haitian',
        'langPapiamento': 'Papiamento'
    };
    
    // 常见本地化名称到英文名称的映射
    const localizedToEnNameMap = {
        '中文': 'Simplified Chinese',
        '简体中文': 'Simplified Chinese',
        '繁體中文': 'Traditional Chinese',
        'English': 'English',
        '英文': 'English',
        'Français': 'French',
        '法文': 'French',
        'Español': 'Spanish',
        '西班牙文': 'Spanish',
        'العربية': 'Arabic',
        '阿拉伯文': 'Arabic',
        'Русский': 'Russian',
        '俄文': 'Russian',
        'Português': 'Portuguese',
        '葡萄牙文': 'Portuguese',
        'Deutsch': 'German',
        '德文': 'German',
        'Italiano': 'Italian',
        '意大利文': 'Italian',
        'Nederlands': 'Dutch',
        '荷兰文': 'Dutch',
        'Dansk': 'Danish',
        '丹麦文': 'Danish',
        'Gaeilge': 'Irish',
        '爱尔兰文': 'Irish',
        'Cymraeg': 'Welsh',
        '威尔士文': 'Welsh',
        'Suomi': 'Finnish',
        '芬兰文': 'Finnish',
        'Íslenska': 'Icelandic',
        '冰岛文': 'Icelandic',
        'Svenska': 'Swedish',
        '瑞典文': 'Swedish',
        'Norsk Nynorsk': 'Norwegian Nynorsk',
        '新挪威文': 'Norwegian Nynorsk',
        'Norsk Bokmål': 'Norwegian Bokmål',
        '书面挪威文': 'Norwegian Bokmål',
        '日本語': 'Japanese',
        '日文': 'Japanese',
        '한국어': 'Korean',
        '韩文': 'Korean',
        'Tiếng Việt': 'Vietnamese',
        '越南文': 'Vietnamese',
        'ไทย': 'Thai',
        '泰文': 'Thai',
        'Bahasa Indonesia': 'Indonesian',
        '印尼文': 'Indonesian',
        'Bahasa Melayu': 'Malay',
        '马来文': 'Malay',
        'မြန်မာဘာသာ': 'Burmese',
        '缅甸文': 'Burmese',
        'Tagalog': 'Tagalog',
        '他加禄文': 'Tagalog',
        'ភាសាខ្មែរ': 'Khmer',
        '高棉文': 'Khmer',
        'ພາສາລາວ': 'Lao',
        '老挝文': 'Lao',
        'हिन्दी': 'Hindi',
        '印地文': 'Hindi',
        'বাংলা': 'Bengali',
        '孟加拉文': 'Bengali',
        'اردو': 'Urdu',
        '乌尔都文': 'Urdu',
        'नेपाली': 'Nepali',
        '尼泊尔文': 'Nepali',
        'עברית': 'Hebrew',
        '希伯来文': 'Hebrew',
        'Türkçe': 'Turkish',
        '土耳其文': 'Turkish',
        'فارسی': 'Persian',
        '波斯文': 'Persian',
        'Polski': 'Polish',
        '波兰文': 'Polish',
        'Українська': 'Ukrainian',
        '乌克兰文': 'Ukrainian',
        'Čeština': 'Czech',
        '捷克文': 'Czech',
        'Română': 'Romanian',
        '罗马尼亚文': 'Romanian',
        'Български': 'Bulgarian',
        '保加利亚文': 'Bulgarian',
        'Slovenčina': 'Slovak',
        '斯洛伐克文': 'Slovak',
        'Magyar': 'Hungarian',
        '匈牙利文': 'Hungarian',
        'Slovenščina': 'Slovenian',
        '斯洛文尼亚文': 'Slovenian',
        'Latviešu': 'Latvian',
        '拉脱维亚文': 'Latvian',
        'Eesti': 'Estonian',
        '爱沙尼亚文': 'Estonian',
        'Lietuvių': 'Lithuanian',
        '立陶宛文': 'Lithuanian',
        'Беларуская': 'Belarusian',
        '白俄罗斯文': 'Belarusian',
        'Ελληνικά': 'Greek',
        '希腊文': 'Greek',
        'Hrvatski': 'Croatian',
        '克罗地亚文': 'Croatian',
        'Македонски': 'Macedonian',
        '马其顿文': 'Macedonian',
        'Malti': 'Maltese',
        '马耳他文': 'Maltese',
        'Српски': 'Serbian',
        '塞尔维亚文': 'Serbian',
        'Bosanski': 'Bosnian',
        '波斯尼亚文': 'Bosnian',
        'ქართული': 'Georgian',
        '格鲁吉亚文': 'Georgian',
        'Հայերեն': 'Armenian',
        '亚美尼亚文': 'Armenian',
        'Azərbaycan': 'North Azerbaijani',
        '阿塞拜疆文': 'North Azerbaijani',
        'Қазақ': 'Kazakh',
        '哈萨克文': 'Kazakh',
        'O\'zbek': 'Northern Uzbek',
        '乌兹别克文': 'Northern Uzbek',
        'Тоҷикӣ': 'Tajik',
        '塔吉克文': 'Tajik',
        'Kiswahili': 'Swahili',
        '斯瓦希里文': 'Swahili',
        'Afrikaans': 'Afrikaans',
        '南非荷兰文': 'Afrikaans',
        '粵語': 'Cantonese',
        '粤语': 'Cantonese',
        'Lëtzebuergesch': 'Luxembourgish',
        '卢森堡文': 'Luxembourgish',
        'Limburgs': 'Limburgish',
        '林堡文': 'Limburgish',
        'Català': 'Catalan',
        '加泰罗尼亚文': 'Catalan',
        'Galego': 'Galician',
        '加利西亚文': 'Galician',
        'Asturianu': 'Asturian',
        '阿斯图里亚斯文': 'Asturian',
        'Euskara': 'Basque',
        '巴斯克文': 'Basque',
        'Occitan': 'Occitan',
        '奥克文': 'Occitan',
        'Vèneto': 'Venetian',
        '威尼斯文': 'Venetian',
        'Sardu': 'Sardinian',
        '撒丁文': 'Sardinian',
        'Sicilianu': 'Sicilian',
        '西西里文': 'Sicilian',
        'Furlan': 'Friulian',
        '弗留利文': 'Friulian',
        'Lombard': 'Lombard',
        '伦巴第文': 'Lombard',
        'Ligure': 'Ligurian',
        '利古里亚文': 'Ligurian',
        'Føroyskt': 'Faroese',
        '法罗文': 'Faroese',
        'Shqip': 'Tosk Albanian',
        '阿尔巴尼亚文': 'Tosk Albanian',
        'Ślōnski': 'Silesian',
        '西里西亚文': 'Silesian',
        'Башҡорт': 'Bashkir',
        '巴什基尔文': 'Bashkir',
        'Татар': 'Tatar',
        '鞑靼文': 'Tatar',
        'اللهجة العراقية': 'Mesopotamian Arabic',
        '伊拉克阿拉伯文': 'Mesopotamian Arabic',
        'اللهجة النجدية': 'Najdi Arabic',
        '内志阿拉伯文': 'Najdi Arabic',
        'اللهجة المصرية': 'Egyptian Arabic',
        '埃及阿拉伯文': 'Egyptian Arabic',
        'اللهجة الشامية': 'Levantine Arabic',
        '黎凡特阿拉伯文': 'Levantine Arabic',
        'اللهجة التهامية': 'Taizzi-Adeni Arabic',
        '塔伊兹-亚丁阿拉伯文': 'Taizzi-Adeni Arabic',
        'دری': 'Dari',
        '达里文': 'Dari',
        'اللهجة التونسية': 'Tunisian Arabic',
        '突尼斯阿拉伯文': 'Tunisian Arabic',
        'اللهجة المغربية': 'Moroccan Arabic',
        '摩洛哥阿拉伯文': 'Moroccan Arabic',
        'Kabuverdianu': 'Kabuverdianu',
        '卡布佛得角文': 'Kabuverdianu',
        'Tok Pisin': 'Tok Pisin',
        '托克皮辛文': 'Tok Pisin',
        'יידיש': 'Eastern Yiddish',
        '意第绪文': 'Eastern Yiddish',
        'سنڌي': 'Sindhi',
        '信德文': 'Sindhi',
        'සිංහල': 'Sinhala',
        '僧伽罗文': 'Sinhala',
        'తెలుగు': 'Telugu',
        '泰卢固文': 'Telugu',
        'ਪੰਜਾਬੀ': 'Punjabi',
        '旁遮普文': 'Punjabi',
        'தமிழ்': 'Tamil',
        '泰米尔文': 'Tamil',
        'ગુજરાતી': 'Gujarati',
        '古吉拉特文': 'Gujarati',
        'മലയാളം': 'Malayalam',
        '马拉雅拉姆文': 'Malayalam',
        'मराठी': 'Marathi',
        '马拉地文': 'Marathi',
        'ಕನ್ನಡ': 'Kannada',
        '卡纳达文': 'Kannada',
        'मगही': 'Magahi',
        '摩揭陀文': 'Magahi',
        'ଓଡ଼ିଆ': 'Oriya',
        '奥里亚文': 'Oriya',
        'अवधी': 'Awadhi',
        '阿瓦德语': 'Awadhi',
        'मैथिली': 'Maithili',
        '迈蒂利文': 'Maithili',
        'অসমীয়া': 'Assamese',
        '阿萨姆文': 'Assamese',
        'छत्तीसगढ़ी': 'Chhattisgarhi',
        '恰蒂斯加尔文': 'Chhattisgarhi',
        'भोजपुरी': 'Bhojpuri',
        '博杰普尔文': 'Bhojpuri',
        'Baso Minangkabau': 'Minangkabau',
        '米南加保文': 'Minangkabau',
        'Basa Bali': 'Balinese',
        '巴厘文': 'Balinese',
        'Basa Jawa': 'Javanese',
        '爪哇文': 'Javanese',
        'Bahasa Banjar': 'Banjar',
        '班贾尔文': 'Banjar',
        'Basa Sunda': 'Sundanese',
        '巽他文': 'Sundanese',
        'Binisaya': 'Cebuano',
        '宿务文': 'Cebuano',
        'Salitan Pangasinan': 'Pangasinan',
        '邦阿西楠文': 'Pangasinan',
        'Pagsasao nga Ilokano': 'Iloko',
        '伊洛卡诺文': 'Iloko',
        'Winaray': 'Waray (Philippines)',
        '瓦赖文': 'Waray (Philippines)',
        'Kreyòl Ayisyen': 'Haitian',
        '海地克里奥尔文': 'Haitian',
        'Papiamento': 'Papiamento',
        '帕皮阿门托文': 'Papiamento'
    };
    
    if (langKeyToEnName[langValue]) {
        return langKeyToEnName[langValue];
    } else if (localizedToEnNameMap[langValue]) {
        return localizedToEnNameMap[langValue];
    } else {
        // 如果都不是，直接返回原值（可能是直接的英文名称）
        return langValue;
    }
}

// --- 核心翻译处理 ---
async function handleTranslation(text, targetLanguage, secondTargetLanguage, sendResponse) {
    try {
        const { activeProvider } = await chrome.storage.local.get('activeProvider');
        const provider = activeProvider || 'gemini'; // 默认为 gemini
        
        // Detect source language and determine actual target language
        const actualTargetLanguage = await determineTargetLanguage(text, targetLanguage, secondTargetLanguage);
        


        let config, apiKey, modelName, ollamaUrl;
        
        if (provider === 'ollama') {
            const urlKey = `${provider}Url`;
            const modelKey = `${provider}SelectedModel`;
            config = await chrome.storage.local.get([urlKey, modelKey]);
            ollamaUrl = config[urlKey];
            modelName = config[modelKey];
            

            
            if (!ollamaUrl) {
                sendResponse({ error: `Ollama 服务器地址未设置。请在设置页面配置 Ollama URL。` });
                chrome.runtime.openOptionsPage();
                return;
            }
            
            if (!modelName) {
                sendResponse({ error: `Ollama 模型未选择。请在设置页面选择一个模型。` });
                chrome.runtime.openOptionsPage();
                return;
            }
        } else {
            const configKey = `${provider}ApiKey`;
            const modelKey = `${provider}SelectedModel`;
            config = await chrome.storage.local.get([configKey, modelKey]);

            apiKey = config[configKey];
            modelName = config[modelKey];

            if (!apiKey || !modelName) {
                sendResponse({ error: `当前提供商 (${provider}) 的 API 密钥或模型未设置。` });
                chrome.runtime.openOptionsPage();
                return;
            }
        }

        let translation;
        if (provider === 'gemini') {
            translation = await callGeminiAPI(text, apiKey, modelName, actualTargetLanguage, secondTargetLanguage);
        } else if (provider === 'siliconflow') {
            translation = await callSiliconFlowAPI(text, apiKey, modelName, actualTargetLanguage, secondTargetLanguage);
        } else if (provider === 'ollama') {
            translation = await callOllamaAPI(text, ollamaUrl, modelName, actualTargetLanguage, secondTargetLanguage);
        } else {
            throw new Error(`未知的模型提供商: ${provider}`);
        }
        
        sendResponse({ translation });

    } catch (error) {
        sendResponse({ error: `翻译失败: ${error.message}` });
    }
}

// --- 语言检测与目标语言确定 ---
async function determineTargetLanguage(text, targetLanguage, secondTargetLanguage) {
    return new Promise((resolve) => {
        chrome.i18n.detectLanguage(text, (result) => {
            if (result && result.languages && result.languages.length > 0) {
                const detectedLanguage = result.languages[0].language;
                const confidence = result.languages[0].percentage;
                
                // Map detected language to target language format
                const detectedLangName = mapLanguageCodeToName(detectedLanguage);
                
                // If detected language matches target language, use second target language
                if (detectedLangName === targetLanguage && confidence > 50) {
                    console.log(`Source language (${detectedLangName}) matches target language (${targetLanguage}), using second target language (${secondTargetLanguage})`);
                    resolve(secondTargetLanguage);
                } else {
                    console.log(`Using primary target language: ${targetLanguage}`);
                    resolve(targetLanguage);
                }
            } else {
                // If language detection fails, use primary target language
                console.log(`Language detection failed, using primary target language: ${targetLanguage}`);
                resolve(targetLanguage);
            }
        });
    });
}

function mapLanguageCodeToName(languageCode) {
    const languageMap = {
        'en': 'English',
        'zh': 'Simplified Chinese',
        'zh-CN': 'Simplified Chinese',
        'zh-TW': 'Traditional Chinese',
        'fr': 'French',
        'es': 'Spanish',
        'ar': 'Arabic',
        'ru': 'Russian',
        'pt': 'Portuguese',
        'de': 'German',
        'it': 'Italian',
        'nl': 'Dutch',
        'da': 'Danish',
        'ja': 'Japanese',
        'ko': 'Korean',
        'sv': 'Swedish',
        'no': 'Norwegian Bokmål',
        'pl': 'Polish',
        'tr': 'Turkish',
        'fi': 'Finnish',
        'hu': 'Hungarian',
        'cs': 'Czech',
        'el': 'Greek',
        'hi': 'Hindi',
        'id': 'Indonesian',
        'th': 'Thai',
        'vi': 'Vietnamese',
        'ro': 'Romanian',
        'sk': 'Slovak'
    };
    
    return languageMap[languageCode] || 'English';
}

// --- 截图并翻译图片内文字 ---
async function handleCaptureAndTranslateImage(rect, sender, sendResponse) {
    try {
        // Capture visible tab
        const dataUrl = await chrome.tabs.captureVisibleTab({ format: 'png' });
        console.log('[LLM-Translate] captureVisibleTab success');
        // Crop to rect using OffscreenCanvas
        const croppedDataUrl = await cropImageDataUrl(dataUrl, rect);
        console.log('[LLM-Translate] cropImageDataUrl success');

        const { activeProvider } = await chrome.storage.local.get('activeProvider');
        const provider = activeProvider || 'gemini';

        let translation;
        if (provider === 'gemini') {
            translation = await visionTranslateGemini(croppedDataUrl);
        } else if (provider === 'siliconflow') {
            translation = await visionTranslateOpenAICompatible(croppedDataUrl);
        } else if (provider === 'ollama') {
            translation = await visionTranslateOllama(croppedDataUrl);
        } else {
            throw new Error(`未知的模型提供商: ${provider}`);
        }

        // Send to content script to show result popover with copy
        if (sender && sender.tab && sender.tab.id) {
            console.log('[LLM-Translate] sending showImageTranslationResult');
            chrome.tabs.sendMessage(sender.tab.id, { type: 'showImageTranslationResult', translation });
        }
        sendResponse({ translation });
    } catch (e) {
        console.error('[LLM-Translate] handleCaptureAndTranslateImage failed:', e);
        sendResponse({ error: e.message });
    }
}

async function cropImageDataUrl(dataUrl, rect) {
    // Use createImageBitmap in service worker
    const resp = await fetch(dataUrl);
    const blob = await resp.blob();
    const bitmap = await createImageBitmap(blob);
    const dpr = rect.devicePixelRatio || 1;
    const sx = Math.max(0, Math.round(rect.x * dpr));
    const sy = Math.max(0, Math.round(rect.y * dpr));
    const sw = Math.min(bitmap.width - sx, Math.round(rect.width * dpr));
    const sh = Math.min(bitmap.height - sy, Math.round(rect.height * dpr));
    const canvas = new OffscreenCanvas(sw, sh);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(bitmap, sx, sy, sw, sh, 0, 0, sw, sh);
    const outBlob = await canvas.convertToBlob({ type: 'image/png' });
    return await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(outBlob);
    });
}

async function visionTranslateGemini(imageDataUrl) {
    const { geminiApiKey, geminiSelectedModel, targetLanguage, secondTargetLanguage } = await chrome.storage.local.get(['geminiApiKey', 'geminiSelectedModel', 'targetLanguage', 'secondTargetLanguage']);
    const apiKey = geminiApiKey; const modelName = geminiSelectedModel;
    if (!apiKey || !modelName) throw new Error('Gemini API 或模型未配置');
    const target = mapLangKeyToEnName(targetLanguage || 'langSimplifiedChinese');
    const second = mapLangKeyToEnName(secondTargetLanguage || 'langEnglish');
    const prompt = chrome.i18n.getMessage('imageTranslationPrompt', [target, second]);

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
    const parts = [{ text: prompt }, { inline_data: { mime_type: 'image/png', data: imageDataUrl.split(',')[1] } }];
    const resp = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ parts }] }) });
    if (!resp.ok) throw new Error('Gemini Vision 请求失败');
    const data = await resp.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
}

async function visionTranslateOpenAICompatible(imageDataUrl) {
    const { siliconflowApiKey, siliconflowSelectedModel, targetLanguage, secondTargetLanguage } = await chrome.storage.local.get(['siliconflowApiKey', 'siliconflowSelectedModel', 'targetLanguage', 'secondTargetLanguage']);
    const apiKey = siliconflowApiKey; const modelName = siliconflowSelectedModel;
    if (!apiKey || !modelName) throw new Error('SiliconFlow API 或模型未配置');
    const target = mapLangKeyToEnName(targetLanguage || 'langSimplifiedChinese');
    const second = mapLangKeyToEnName(secondTargetLanguage || 'langEnglish');
    const userPrompt = chrome.i18n.getMessage('imageTranslationPrompt', [target, second]);

    const url = 'https://api.siliconflow.cn/v1/chat/completions';
    const messages = [
        { role: 'user', content: [
            { type: 'text', text: userPrompt },
            { type: 'image_url', image_url: { url: imageDataUrl } }
        ]}
    ];
    const resp = await fetch(url, { method: 'POST', headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ model: modelName, messages, max_tokens: 2048, temperature: 0.2 }) });
    if (!resp.ok) throw new Error('SiliconFlow Vision 请求失败');
    const data = await resp.json();
    return data.choices?.[0]?.message?.content?.trim() || '';
}

async function visionTranslateOllama(imageDataUrl) {
    const { ollamaUrl, ollamaSelectedModel, targetLanguage, secondTargetLanguage } = await chrome.storage.local.get(['ollamaUrl', 'ollamaSelectedModel', 'targetLanguage', 'secondTargetLanguage']);
    const url = ollamaUrl; const modelName = ollamaSelectedModel;
    if (!url || !modelName) throw new Error('Ollama URL 或模型未配置');
    const target = mapLangKeyToEnName(targetLanguage || 'langSimplifiedChinese');
    const second = mapLangKeyToEnName(secondTargetLanguage || 'langEnglish');
    const prompt = chrome.i18n.getMessage('imageTranslationPrompt', [target, second]);
    // Note: Many Ollama models don't support vision; this is a best-effort text prompt
    const resp = await fetch(`${url}/api/generate`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ model: modelName, prompt: `${prompt}\n[Image as data URL]\n${imageDataUrl}`, stream: false }) });
    if (!resp.ok) throw new Error('Ollama Vision 请求失败');
    const data = await resp.json();
    return data.response?.trim() || '';
}

function mapLangKeyToEnName(key) {
    const map = { 'langEnglish':'English','langSimplifiedChinese':'Simplified Chinese','langTraditionalChinese':'Traditional Chinese' };
    return map[key] || 'English';
}

// --- API 调用实现 ---

/**
 * 调用 Google Gemini API
 */
async function callGeminiAPI(text, apiKey, modelName, targetLanguage, secondTargetLanguage) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
    const prompt = chrome.i18n.getMessage('translationPrompt', [targetLanguage, secondTargetLanguage, text]);
    
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
        }),
    });

    if (!response.ok) {
        const errorBody = await response.json();
        throw new Error(errorBody.error.message || `API 请求失败`);
    }
    const data = await response.json();
    return data.candidates[0].content.parts[0].text.trim();
}

/**
 * 调用 Silicon Flow API (兼容 OpenAI 格式)
 */
async function callSiliconFlowAPI(text, apiKey, modelName, targetLanguage, secondTargetLanguage) {
    const url = 'https://api.siliconflow.cn/v1/chat/completions';
    const userPrompt = chrome.i18n.getMessage('translationPrompt', [targetLanguage, secondTargetLanguage, text]);

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: modelName,
            messages: [
                { role: 'user', content: userPrompt }
            ],
            max_tokens: 2048,
            temperature: 0.3,
        }),
    });

    if (!response.ok) {
        const errorBody = await response.json();
        throw new Error(errorBody.error.message || `API 请求失败`);
    }
    const data = await response.json();
    return data.choices[0].message.content.trim();
}

/**
 * 调用 Ollama API
 */
async function callOllamaAPI(text, ollamaUrl, modelName, targetLanguage, secondTargetLanguage) {
    const url = `${ollamaUrl}/api/generate`;
    const prompt = chrome.i18n.getMessage('translationPrompt', [targetLanguage, secondTargetLanguage, text]);
    
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: modelName,
            prompt: prompt,
            stream: false,
        }),
    });
    
    if (!response.ok) {
        if (response.status === 403) {
            throw new Error('Ollama 服务器拒绝请求。请设置环境变量 OLLAMA_ORIGINS="*" 并重启 Ollama 服务。');
        }
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
            const errorBody = await response.text();
            try {
                const errorJson = JSON.parse(errorBody);
                errorMessage = errorJson.error || errorMessage;
            } catch (jsonError) {
                errorMessage = errorBody || errorMessage;
            }
        } catch (textError) {
            // 忽略解析错误，使用默认错误消息
        }
        throw new Error(errorMessage);
    }
    
    const responseText = await response.text();
    
    if (!responseText.trim()) {
        throw new Error('Ollama 返回了空响应，请检查模型是否正确加载');
    }
    
    try {
        const data = JSON.parse(responseText);
        if (!data.response) {
            throw new Error('Ollama 响应格式异常，缺少 response 字段');
        }
        return data.response.trim();
    } catch (jsonError) {
        throw new Error(`Ollama 响应解析失败: ${jsonError.message}`);
    }
}
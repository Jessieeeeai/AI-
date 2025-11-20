# 🎬 VideoAI Pro - 优化后的产品设计文档

## 📋 更新说明

**优化版本**: v2.0
**更新日期**: 2025-11-20
**核心优化**: 改进用户创作流程，增加AI文案优化和长视频分段处理

---

## 🔄 核心流程变更

### 原流程（v1.0）
```
Step 1: 输入文本 
  → Step 2: 声音设置 
  → Step 3: 模板选择 
  → Step 4: 确认生成
```

### 优化后流程（v2.0）
```
Step 1: 输入文案 + AI优化
  → Step 2: 试听确认（生成音频片段预览）
  → Step 3: 声音克隆或选择预制声音
  → Step 4: 选择视频模板
  → Step 5: 长视频处理（自动判断是否需要分段）
  → Step 6: 确认生成
```

---

## 📝 详细流程设计

### Step 1: 输入文案 + AI智能优化

#### 1.1 页面布局

**左侧区域（原始文案输入）**：
```
┌─────────────────────────────────────────┐
│  📝 粘贴您的原始文案                     │
│  ────────────────────────────────────   │
│  [大型文本框 Textarea]                   │
│  - placeholder: "粘贴您的文章或文案..."   │
│  - 自动高度调整                          │
│  - 最大10000字符                         │
│                                         │
│  字符数: 1250/10000                      │
│                                         │
│  [清空] [AI优化文案] ← 主按钮            │
└─────────────────────────────────────────┘
```

**右侧区域（AI优化后的口播稿）**：
```
┌─────────────────────────────────────────┐
│  ✨ AI优化后的口播稿                     │
│  ────────────────────────────────────   │
│  [显示区域]                              │
│  - 优化完成前显示空状态提示               │
│  - 优化完成后显示结果                    │
│  - 可编辑（Textarea）                    │
│                                         │
│  优化说明：                              │
│  ✓ 已转换为口语化表达                    │
│  ✓ 添加了恰当的语气词                    │
│  ✓ 数字已转换为中文                      │
│  ✓ 标点符号已简化                       │
│                                         │
│  字符数: 980/10000                       │
│  预计时长: 3.3分钟                       │
│                                         │
│  [手动编辑] [重新优化] [下一步]          │
└─────────────────────────────────────────┘
```

#### 1.2 AI文案优化规则

**调用方式**: 
- 用户点击"AI优化文案"按钮
- 前端调用 `/api/optimize/script`
- 后端调用AI服务（OpenAI/Claude/本地模型）

**API接口设计**:

```javascript
POST /api/optimize/script

请求体：
{
  "originalText": "用户输入的原始文案",
  "style": "humorous" // 可选：humorous(幽默), professional(专业), casual(轻松)
}

响应：
{
  "success": true,
  "optimizedText": "优化后的口播稿",
  "changes": {
    "addedExclamations": 15,  // 添加的语气词数量
    "convertedNumbers": 8,     // 转换的数字数量
    "simplifiedPunctuation": 23, // 简化的标点符号
    "originalLength": 1250,    // 原始字符数
    "optimizedLength": 980     // 优化后字符数
  },
  "warnings": [
    "检测到负面消息，已使用恰当的负面语气词"
  ]
}
```

**优化规则详细说明**:

**规则1: 语言风格转换**
- 书面语 → 口语化
  - "根据" → "按照"
  - "进行" → "做"
  - "实施" → "搞"
  - "显著" → "明显"
- 删除冗余词汇
  - "的话"、"来说"、"而言"
- 简化长句
  - 超过30字的句子拆分为2-3个短句

**规则2: 标点符号处理**
- 保留: 句号(。)、感叹号(！)、问号(？)
- 删除/替换:
  - 逗号(，) → 句号(。) 或删除
  - 顿号(、) → 删除或改为"和"
  - 分号(；) → 句号(。)
  - 冒号(：) → 删除
  - 引号("") → 删除
  - 破折号(——) → 删除
  - 省略号(……) → 删除
  - 书名号(《》) → 删除

**规则3: 数字转换**
```javascript
const numberMap = {
  // 阿拉伯数字 → 中文口语化
  '8000000': '八百万',
  '80000': '八万',
  '8000': '八千',
  '800': '八百',
  '80': '八十',
  '8': '八',
  
  // 小数处理
  '3.14': '三点一四',
  '0.5': '零点五',
  
  // 百分比
  '50%': '百分之五十',
  '3.5%': '百分之三点五',
  
  // 时间
  '2025年': '二零二五年',
  '11月20日': '十一月二十号',
  
  // 金额
  '$100': '一百美元',
  '¥500': '五百块',
  '500元': '五百块'
};

// 特殊规则：
// - 保留整数单位：1万、10万、100万、1亿
// - 电话号码保持原样
// - 身份证号保持原样
```

**规则4: 英文保持原样**
```javascript
// 保持不变的英文内容：
const keepEnglish = [
  // 品牌名
  'iPhone', 'Tesla', 'ChatGPT', 'OpenAI',
  
  // 专业术语
  'AI', 'GPU', 'CPU', 'API', 'UI', 'UX',
  'Machine Learning', 'Deep Learning',
  
  // 缩写
  'CEO', 'CTO', 'CFO', 'HR', 'PR',
  
  // 单位
  'GB', 'MB', 'KB', 'TB',
  'km', 'kg', 'ml'
];

// 不翻译，但可以添加中文解释：
// "ChatGPT" → "ChatGPT聊天机器人"
// "Tesla" → "特斯拉Tesla"
```

**规则5: 语气词添加（核心规则）**

**A. 情感分析流程**:
```javascript
// 1. 先分析整体情感基调
const analyzeSentiment = (text) => {
  // 使用情感分析模型（或关键词匹配）
  const positiveKeywords = ['上涨', '增长', '成功', '突破', '创新', '喜报'];
  const negativeKeywords = ['下跌', '暴跌', '失败', '崩盘', '危机', '损失'];
  const shockKeywords = ['突然', '意外', '惊人', '史无前例', '震惊'];
  
  // 返回情感类型和强度
  return {
    type: 'positive' | 'negative' | 'neutral' | 'shock',
    intensity: 0-100
  };
};

// 2. 根据情感选择语气词
const selectExclamation = (sentiment, context) => {
  if (sentiment.type === 'positive') {
    if (context.includes('暴涨') || context.includes('飙升')) {
      return ['哇塞', '牛逼', '太猛了'][random()];
    } else if (context.includes('成功')) {
      return ['太棒了', '给力', '赞'][random()];
    }
  } else if (sentiment.type === 'negative') {
    if (context.includes('暴跌') || context.includes('崩盘')) {
      return ['卧槽', '惨了', '完蛋了'][random()];
    } else if (context.includes('失败')) {
      return ['糟糕', '要命了', '崩了'][random()];
    }
  } else if (sentiment.type === 'shock') {
    return ['天哪', '妈耶', '不会吧', '离谱'][random()];
  }
  
  return null; // 中性内容可以不加语气词
};
```

**B. 语气词库完整列表**:
```javascript
const exclamations = {
  // 正面消息（上涨、成功、好消息）
  positive: {
    strong: ['哇塞', '牛逼', '太猛了', '炸了'],      // 强烈正面
    medium: ['太棒了', '给力', '赞', '厉害了'],      // 中等正面
    mild: ['不错', '可以', '挺好']                   // 轻微正面
  },
  
  // 负面消息（下跌、失败、坏消息）
  negative: {
    strong: ['卧槽', '完蛋了', '惨了', '崩了'],      // 强烈负面
    medium: ['糟糕', '要命了', '遭了'],              // 中等负面
    mild: ['不太好', '麻烦了']                       // 轻微负面
  },
  
  // 震惊消息（意外、反转、罕见）
  shock: ['天哪', '妈耶', '不会吧', '离谱', '太夸张了', '绝了'],
  
  // 疑惑困惑
  confused: ['啊', '嗯', '咦', '奇怪', '什么情况', '怎么回事'],
  
  // 轻松幽默
  humorous: ['哈哈', '嘿嘿', '讨厌', '哼', '好玩'],
  
  // 强调重点
  emphasis: ['注意了', '听好了', '重点来了', '关键是', '划重点']
};
```

**C. 语气词插入位置规则**:
```javascript
// 插入时机：
1. 关键数据前：
   "哇塞！比特币突破10万美元了"
   "卧槽！股市暴跌百分之二十"

2. 转折处：
   "大家都以为会涨！结果呢？反而跌了"

3. 段落开头（引起注意）：
   "注意了！接下来是重点"

4. 情绪高点：
   "这波操作太牛逼了！直接翻倍"

// 插入频率：
- 每50-80字插入1个语气词
- 避免连续使用相同语气词
- 不要过度使用，保持自然
```

**规则6: 内容保持原则**
```javascript
// 必须保持的内容：
1. 核心数据和事实
   - 数字（转换后的值要准确）
   - 日期时间
   - 人名、地名、机构名

2. 关键信息
   - 因果关系
   - 时间顺序
   - 逻辑结构

3. 专业术语
   - 行业黑话保持原样
   - 不要过度解释（除非必要）

// 可以删减的内容：
1. 冗余修饰词
2. 重复表述
3. 次要细节
4. 过渡词语
```

**规则7: 格式要求**
```javascript
// 输出格式：
- 无标题
- 无分段标记
- 直接输出正文
- 每句话独立成行（可选）

// 语言简洁度控制：
- 原文1000字 → 优化后700-800字（删减20-30%冗余）
- 保持核心信息完整
- 删除无意义的过渡和铺垫
```

#### 1.3 AI优化Prompt模板

```
你是一个专业的数字人口播稿优化专家，擅长将任何文章改写成适合语音朗读的口播稿。

**你的任务**：将用户提供的文章改写成风趣幽默、简洁有力的口播稿。

**改写规则（必须严格遵守）**：

1. **语言风格**：
   - 口语化表达，风趣幽默
   - 简洁有力，删除冗余
   - 节奏感强，适合朗读

2. **标点符号**：
   - 只能使用：句号(。)、感叹号(！)、问号(？)
   - 其他标点全部删除或替换

3. **数字转换**：
   - 8000000 → 八百万
   - 123 → 一百二十三
   - 3.14 → 三点一四
   - 50% → 百分之五十

4. **英文保持**：
   - 所有英文单词、品牌名、术语保持原样
   - 不要翻译成中文
   - 示例：ChatGPT、iPhone、AI保持不变

5. **语气词添加（核心规则）**：
   **必须先判断内容的情感属性，然后选择匹配的语气词：**
   
   - **正面消息**（上涨、成功、好事）→ 使用正面语气词
     * 强烈：哇塞、牛逼、太猛了
     * 中等：太棒了、给力、赞
   
   - **负面消息**（下跌、失败、坏事）→ 使用负面语气词
     * 强烈：卧槽、完蛋了、惨了、崩了
     * 中等：糟糕、要命了
   
   - **震惊消息**（意外、反转）→ 使用震惊语气词
     * 天哪、妈耶、不会吧、离谱
   
   - **疑惑困惑** → 啊、嗯、咦、奇怪
   
   - **强调重点** → 注意了、听好了、重点来了
   
   **严禁情感错位！示例：**
   - ✅ 正确："卧槽！股市暴跌百分之二十"（负面用负面词）
   - ❌ 错误："哇塞！股市暴跌百分之二十"（负面用正面词）
   - ✅ 正确："牛逼！比特币突破十万美元"（正面用正面词）
   - ❌ 错误："惨了！比特币突破十万美元"（正面用负面词）

6. **内容精简**：
   - 删除冗余表述
   - 保留核心信息
   - 数据必须准确

7. **输出格式**：
   - 无标题
   - 直接输出正文
   - 适合语音朗读

**工作流程**：
1. 理解原文的核心内容
2. 判断每个关键信息的情感属性（正面/负面/中性）
3. 根据情感属性选择对应的语气词
4. 进行口语化改写
5. 处理标点和数字，保持英文
6. 自查语气词是否与内容情感匹配

**现在开始改写以下文案**：

{用户输入的原始文案}

**直接输出改写后的口播稿，不要解释过程**。
```

#### 1.4 前端实现

```javascript
// Step1ScriptOptimization.jsx
import { useState } from 'react';
import { optimizeService } from '../../services/api';

const Step1ScriptOptimization = ({ data, setData, onNext }) => {
  const [originalText, setOriginalText] = useState('');
  const [optimizedText, setOptimizedText] = useState('');
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationStats, setOptimizationStats] = useState(null);

  const handleOptimize = async () => {
    if (!originalText || originalText.trim().length < 10) {
      alert('请输入至少10个字符的文案');
      return;
    }

    setIsOptimizing(true);
    try {
      const response = await optimizeService.optimizeScript(originalText);
      
      setOptimizedText(response.optimizedText);
      setOptimizationStats(response.changes);
      
      // 更新父组件数据
      setData({
        ...data,
        originalText: originalText,
        optimizedText: response.optimizedText
      });
      
    } catch (error) {
      console.error('优化失败:', error);
      alert('文案优化失败：' + error.message);
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleManualEdit = (text) => {
    setOptimizedText(text);
    setData({ ...data, optimizedText: text });
  };

  const handleNext = () => {
    if (!optimizedText || optimizedText.trim().length < 10) {
      alert('请先优化文案或手动输入口播稿');
      return;
    }
    onNext();
  };

  return (
    <div className="grid grid-cols-2 gap-6">
      {/* 左侧：原始文案输入 */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">📝 粘贴您的原始文案</h3>
          <span className="text-sm text-gray-500">
            {originalText.length}/10000
          </span>
        </div>
        
        <textarea
          value={originalText}
          onChange={(e) => setOriginalText(e.target.value)}
          placeholder="粘贴您的文章或文案..."
          className="w-full h-96 p-4 border rounded-lg resize-none"
          maxLength={10000}
        />
        
        <div className="flex gap-3">
          <button
            onClick={() => setOriginalText('')}
            className="px-4 py-2 border rounded-lg hover:bg-gray-50"
          >
            清空
          </button>
          <button
            onClick={handleOptimize}
            disabled={isOptimizing || !originalText}
            className="flex-1 px-6 py-2 bg-blue-600 text-white rounded-lg 
                     hover:bg-blue-700 disabled:bg-gray-300"
          >
            {isOptimizing ? '正在优化...' : '✨ AI优化文案'}
          </button>
        </div>
      </div>

      {/* 右侧：优化后的口播稿 */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">✨ AI优化后的口播稿</h3>
          {optimizedText && (
            <span className="text-sm text-gray-500">
              {optimizedText.length}/10000
            </span>
          )}
        </div>
        
        {!optimizedText ? (
          <div className="h-96 border-2 border-dashed rounded-lg 
                        flex items-center justify-center text-gray-400">
            <div className="text-center">
              <p className="text-lg mb-2">👈 粘贴文案后点击"AI优化"</p>
              <p className="text-sm">系统会自动转换为口播稿风格</p>
            </div>
          </div>
        ) : (
          <>
            <textarea
              value={optimizedText}
              onChange={(e) => handleManualEdit(e.target.value)}
              className="w-full h-96 p-4 border rounded-lg resize-none"
              maxLength={10000}
            />
            
            {optimizationStats && (
              <div className="p-4 bg-green-50 rounded-lg text-sm space-y-1">
                <p className="font-semibold text-green-800">✓ 优化完成</p>
                <p>• 添加了 {optimizationStats.addedExclamations} 个语气词</p>
                <p>• 转换了 {optimizationStats.convertedNumbers} 个数字</p>
                <p>• 简化了 {optimizationStats.simplifiedPunctuation} 处标点</p>
                <p>• 字数：{optimizationStats.originalLength} → {optimizationStats.optimizedLength}</p>
                <p className="text-blue-600">
                  • 预计时长：{Math.ceil(optimizationStats.optimizedLength / 300)} 分钟
                </p>
              </div>
            )}
            
            <div className="flex gap-3">
              <button
                onClick={handleOptimize}
                disabled={isOptimizing}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                🔄 重新优化
              </button>
              <button
                onClick={handleNext}
                className="flex-1 px-6 py-2 bg-blue-600 text-white rounded-lg 
                         hover:bg-blue-700"
              >
                下一步：试听确认 →
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Step1ScriptOptimization;
```

#### 1.5 后端API实现

```javascript
// server/routes/optimize.js
import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { optimizeScript } from '../services/aiOptimizationService.js';

const router = express.Router();
router.use(authenticateToken);

router.post('/script', async (req, res) => {
  try {
    const { originalText, style = 'humorous' } = req.body;
    
    if (!originalText || originalText.trim().length < 10) {
      return res.status(400).json({
        success: false,
        error: 'invalid_text',
        message: '文案长度至少10个字符'
      });
    }
    
    // 调用AI优化服务
    const result = await optimizeScript(originalText, style);
    
    res.json({
      success: true,
      optimizedText: result.optimizedText,
      changes: result.stats,
      warnings: result.warnings
    });
    
  } catch (error) {
    console.error('文案优化失败:', error);
    res.status(500).json({
      success: false,
      error: 'optimization_failed',
      message: error.message
    });
  }
});

export default router;
```

```javascript
// server/services/aiOptimizationService.js
import axios from 'axios';

// 使用OpenAI API（或其他AI服务）
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

export async function optimizeScript(originalText, style = 'humorous') {
  try {
    // 构建Prompt
    const prompt = buildOptimizationPrompt(originalText, style);
    
    // 调用OpenAI API
    const response = await axios.post(
      OPENAI_API_URL,
      {
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: '你是一个专业的数字人口播稿优化专家...'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 4000
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 60000
      }
    );
    
    const optimizedText = response.data.choices[0].message.content.trim();
    
    // 分析优化统计
    const stats = analyzeOptimization(originalText, optimizedText);
    
    // 生成警告信息
    const warnings = generateWarnings(originalText, optimizedText);
    
    return {
      optimizedText,
      stats,
      warnings
    };
    
  } catch (error) {
    console.error('AI优化服务调用失败:', error);
    throw new Error('AI优化失败：' + error.message);
  }
}

function buildOptimizationPrompt(originalText, style) {
  const styleGuide = {
    humorous: '风趣幽默',
    professional: '专业严谨',
    casual: '轻松随意'
  };
  
  return `
你是一个专业的数字人口播稿优化专家，擅长将任何文章改写成适合语音朗读的口播稿。

[完整的Prompt模板...]

**风格要求**: ${styleGuide[style]}

**原始文案**：
${originalText}

**请输出优化后的口播稿**：
`.trim();
}

function analyzeOptimization(original, optimized) {
  // 统计语气词
  const exclamations = ['哇塞', '牛逼', '卧槽', '天哪', '妈耶', '太棒了', 
                       '给力', '惨了', '糟糕', '离谱'];
  const addedExclamations = exclamations.reduce((count, word) => {
    const originalCount = (original.match(new RegExp(word, 'g')) || []).length;
    const optimizedCount = (optimized.match(new RegExp(word, 'g')) || []).length;
    return count + (optimizedCount - originalCount);
  }, 0);
  
  // 统计数字转换
  const numberRegex = /\d+/g;
  const originalNumbers = (original.match(numberRegex) || []).length;
  const optimizedNumbers = (optimized.match(numberRegex) || []).length;
  const convertedNumbers = originalNumbers - optimizedNumbers;
  
  // 统计标点简化
  const complexPunctuation = /[，、；：""''《》（）【】]/g;
  const simplifiedPunctuation = (original.match(complexPunctuation) || []).length;
  
  return {
    addedExclamations,
    convertedNumbers,
    simplifiedPunctuation,
    originalLength: original.length,
    optimizedLength: optimized.length
  };
}

function generateWarnings(original, optimized) {
  const warnings = [];
  
  // 检测负面消息
  const negativeKeywords = ['下跌', '暴跌', '崩盘', '失败', '损失'];
  const hasNegative = negativeKeywords.some(kw => original.includes(kw));
  if (hasNegative) {
    warnings.push('检测到负面消息，已使用恰当的负面语气词');
  }
  
  // 检测正面消息
  const positiveKeywords = ['上涨', '飙升', '突破', '成功', '创新'];
  const hasPositive = positiveKeywords.some(kw => original.includes(kw));
  if (hasPositive) {
    warnings.push('检测到正面消息，已使用恰当的正面语气词');
  }
  
  return warnings;
}
```

---

### Step 2: 试听确认（音频片段预览）

#### 2.1 功能说明

**目的**: 让用户在正式生成前，先试听一小段音频效果，确认声音质量和参数设置。

**流程**:
1. 系统自动提取优化后口播稿的前100字符作为试听文本
2. 用户选择声音类型（系统预制 or 自定义克隆）
3. 调节声音参数（语速、音调、音量、情绪）
4. 点击"生成试听"按钮
5. 等待10-30秒生成音频片段
6. 播放试听
7. 满意后进入下一步，不满意可重新调整

#### 2.2 页面布局

```
┌────────────────────────────────────────────────────────────┐
│  🎤 试听确认                                                │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  📝 试听文本（自动提取前100字）                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ [显示前100字的文本]                                   │   │
│  │ 哇塞！比特币突破十万美元了！这可是历史性的时刻...    │   │
│  └─────────────────────────────────────────────────────┘   │
│  * 完整音频生成时会使用全部文案                              │
│                                                             │
│  ┌──────────────────┬──────────────────────────────────┐   │
│  │ 🔊 选择声音       │  🎛️ 调节参数                      │   │
│  │                  │                                    │   │
│  │ ○ 系统预制声音    │  语速: [====|====] 1.0x          │   │
│  │   [下拉选择]     │  音调: [====|====] 1.0x          │   │
│  │   • 男声-磁性     │  音量: [======|==] 0.8           │   │
│  │   • 女声-甜美     │                                    │   │
│  │   • 男声-沉稳     │  😊 情绪控制                      │   │
│  │   • 女声-活力     │  快乐: [=======|=] 0.7           │   │
│  │                  │  愤怒: [|========] 0.0           │   │
│  │ ● 自定义声音      │  悲伤: [|========] 0.1           │   │
│  │   [上传按钮]     │  惊讶: [==|======] 0.3           │   │
│  │   或从已上传中选择 │                                    │   │
│  └──────────────────┴──────────────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 🎵 试听音频                                           │   │
│  │                                                       │   │
│  │ [未生成]                                              │   │
│  │                                                       │   │
│  │ [生成试听]  [重新生成]                                 │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  提示：试听满意后，点击"下一步"将使用相同参数生成完整音频    │
│                                                             │
│  [上一步]                            [下一步：选择视频模板] │
└────────────────────────────────────────────────────────────┘
```

#### 2.3 前端实现

```javascript
// Step2AudioPreview.jsx
import { useState, useRef, useEffect } from 'react';
import { previewService, uploadService } from '../../services/api';

const Step2AudioPreview = ({ data, setData, onNext, onPrev }) => {
  const [voiceType, setVoiceType] = useState('system'); // 'system' or 'custom'
  const [selectedSystemVoice, setSelectedSystemVoice] = useState('male_magnetic');
  const [customVoiceId, setCustomVoiceId] = useState(null);
  const [userVoices, setUserVoices] = useState([]);
  
  const [voiceSettings, setVoiceSettings] = useState({
    speed: 1.0,
    pitch: 1.0,
    volume: 0.8,
    emotions: {
      happiness: 0.7,
      anger: 0.0,
      sadness: 0.1,
      surprise: 0.3
    }
  });
  
  const [previewAudioUrl, setPreviewAudioUrl] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const audioRef = useRef(null);
  
  // 提取试听文本（前100字）
  const previewText = data.optimizedText ? 
    data.optimizedText.substring(0, 100) + '...' : 
    '';
  
  // 系统预制声音列表
  const systemVoices = [
    { id: 'male_magnetic', name: '男声-磁性', description: '低沉有磁性' },
    { id: 'female_sweet', name: '女声-甜美', description: '温柔可爱' },
    { id: 'male_steady', name: '男声-沉稳', description: '成熟稳重' },
    { id: 'female_energetic', name: '女声-活力', description: '青春活泼' }
  ];
  
  // 加载用户上传的声音列表
  useEffect(() => {
    loadUserVoices();
  }, []);
  
  const loadUserVoices = async () => {
    try {
      const response = await uploadService.getUserVoices();
      setUserVoices(response.voices || []);
    } catch (error) {
      console.error('加载声音列表失败:', error);
    }
  };
  
  // 生成试听音频
  const handleGeneratePreview = async () => {
    setIsGenerating(true);
    
    try {
      const voiceId = voiceType === 'system' ? 
        selectedSystemVoice : 
        customVoiceId;
      
      if (!voiceId) {
        alert('请选择声音');
        return;
      }
      
      // 调用试听API
      const audioBlob = await previewService.generateTTS(
        previewText,
        voiceId,
        voiceSettings
      );
      
      // 创建音频URL
      if (previewAudioUrl) {
        URL.revokeObjectURL(previewAudioUrl);
      }
      const newUrl = URL.createObjectURL(audioBlob);
      setPreviewAudioUrl(newUrl);
      
      // 自动播放
      setTimeout(() => {
        playAudio();
      }, 100);
      
    } catch (error) {
      console.error('生成试听失败:', error);
      alert('试听生成失败：' + error.message);
    } finally {
      setIsGenerating(false);
    }
  };
  
  const playAudio = () => {
    if (!audioRef.current || !previewAudioUrl) return;
    
    audioRef.current.src = previewAudioUrl;
    audioRef.current.play();
    setIsPlaying(true);
  };
  
  const stopAudio = () => {
    if (!audioRef.current) return;
    audioRef.current.pause();
    audioRef.current.currentTime = 0;
    setIsPlaying(false);
  };
  
  const handleNext = () => {
    if (!previewAudioUrl) {
      alert('请先生成试听音频确认效果');
      return;
    }
    
    // 保存声音设置
    setData({
      ...data,
      voiceType,
      voiceId: voiceType === 'system' ? selectedSystemVoice : customVoiceId,
      voiceSettings
    });
    
    onNext();
  };
  
  // 声音上传
  const handleUploadVoice = async (file) => {
    try {
      const formData = new FormData();
      formData.append('voice', file);
      
      const response = await uploadService.uploadVoice(formData);
      
      // 添加到列表
      setUserVoices([response.voice, ...userVoices]);
      setCustomVoiceId(response.voice.voiceId);
      setVoiceType('custom');
      
      alert('声音上传成功！');
      
    } catch (error) {
      console.error('上传失败:', error);
      alert('上传失败：' + error.message);
    }
  };
  
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* 试听文本 */}
      <div>
        <h3 className="text-lg font-semibold mb-2">📝 试听文本</h3>
        <div className="p-4 bg-gray-50 rounded-lg">
          <p className="text-gray-800">{previewText}</p>
          <p className="text-xs text-gray-500 mt-2">
            * 完整音频生成时会使用全部文案
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-6">
        {/* 左侧：选择声音 */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">🔊 选择声音</h3>
          
          {/* 系统预制声音 */}
          <div>
            <label className="flex items-center gap-2 mb-3">
              <input
                type="radio"
                checked={voiceType === 'system'}
                onChange={() => setVoiceType('system')}
              />
              <span className="font-medium">系统预制声音</span>
            </label>
            
            {voiceType === 'system' && (
              <select
                value={selectedSystemVoice}
                onChange={(e) => setSelectedSystemVoice(e.target.value)}
                className="w-full p-2 border rounded-lg"
              >
                {systemVoices.map(voice => (
                  <option key={voice.id} value={voice.id}>
                    {voice.name} - {voice.description}
                  </option>
                ))}
              </select>
            )}
          </div>
          
          {/* 自定义声音 */}
          <div>
            <label className="flex items-center gap-2 mb-3">
              <input
                type="radio"
                checked={voiceType === 'custom'}
                onChange={() => setVoiceType('custom')}
              />
              <span className="font-medium">自定义声音</span>
            </label>
            
            {voiceType === 'custom' && (
              <>
                <input
                  type="file"
                  accept=".wav,.mp3,.m4a"
                  onChange={(e) => handleUploadVoice(e.target.files[0])}
                  className="w-full p-2 border rounded-lg mb-3"
                />
                
                {userVoices.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">或从已上传中选择：</p>
                    {userVoices.map(voice => (
                      <label
                        key={voice.voiceId}
                        className="flex items-center gap-2 p-2 border rounded hover:bg-gray-50"
                      >
                        <input
                          type="radio"
                          name="customVoice"
                          checked={customVoiceId === voice.voiceId}
                          onChange={() => setCustomVoiceId(voice.voiceId)}
                        />
                        <span>{voice.fileName}</span>
                      </label>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
        
        {/* 右侧：调节参数 */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">🎛️ 调节参数</h3>
          
          {/* 语速 */}
          <div>
            <label className="block text-sm mb-1">
              语速: {voiceSettings.speed}x
            </label>
            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.1"
              value={voiceSettings.speed}
              onChange={(e) => setVoiceSettings({
                ...voiceSettings,
                speed: parseFloat(e.target.value)
              })}
              className="w-full"
            />
          </div>
          
          {/* 音调 */}
          <div>
            <label className="block text-sm mb-1">
              音调: {voiceSettings.pitch}x
            </label>
            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.1"
              value={voiceSettings.pitch}
              onChange={(e) => setVoiceSettings({
                ...voiceSettings,
                pitch: parseFloat(e.target.value)
              })}
              className="w-full"
            />
          </div>
          
          {/* 音量 */}
          <div>
            <label className="block text-sm mb-1">
              音量: {(voiceSettings.volume * 100).toFixed(0)}%
            </label>
            <input
              type="range"
              min="0.0"
              max="1.0"
              step="0.1"
              value={voiceSettings.volume}
              onChange={(e) => setVoiceSettings({
                ...voiceSettings,
                volume: parseFloat(e.target.value)
              })}
              className="w-full"
            />
          </div>
          
          {/* 情绪控制 */}
          <div className="pt-4 border-t">
            <h4 className="text-sm font-semibold mb-3">😊 情绪控制</h4>
            
            {Object.entries({
              happiness: '快乐',
              anger: '愤怒',
              sadness: '悲伤',
              surprise: '惊讶'
            }).map(([key, label]) => (
              <div key={key} className="mb-2">
                <label className="block text-xs mb-1">
                  {label}: {voiceSettings.emotions[key].toFixed(1)}
                </label>
                <input
                  type="range"
                  min="0.0"
                  max="1.0"
                  step="0.1"
                  value={voiceSettings.emotions[key]}
                  onChange={(e) => setVoiceSettings({
                    ...voiceSettings,
                    emotions: {
                      ...voiceSettings.emotions,
                      [key]: parseFloat(e.target.value)
                    }
                  })}
                  className="w-full"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* 试听音频区域 */}
      <div className="p-6 border-2 border-dashed rounded-lg">
        <h3 className="text-lg font-semibold mb-4">🎵 试听音频</h3>
        
        {!previewAudioUrl ? (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">还未生成试听音频</p>
            <button
              onClick={handleGeneratePreview}
              disabled={isGenerating}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg 
                       hover:bg-blue-700 disabled:bg-gray-300"
            >
              {isGenerating ? '生成中...' : '🎤 生成试听'}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <audio
              ref={audioRef}
              onEnded={() => setIsPlaying(false)}
              className="w-full"
              controls
            />
            
            <div className="flex gap-3">
              <button
                onClick={handleGeneratePreview}
                disabled={isGenerating}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                🔄 重新生成
              </button>
              <button
                onClick={isPlaying ? stopAudio : playAudio}
                className="px-4 py-2 bg-green-600 text-white rounded-lg 
                         hover:bg-green-700"
              >
                {isPlaying ? '⏸️ 暂停' : '▶️ 播放'}
              </button>
            </div>
          </div>
        )}
      </div>
      
      <div className="text-sm text-gray-600 bg-blue-50 p-4 rounded-lg">
        💡 提示：试听满意后，点击"下一步"将使用相同参数生成完整音频
      </div>
      
      {/* 导航按钮 */}
      <div className="flex justify-between pt-6">
        <button
          onClick={onPrev}
          className="px-6 py-2 border rounded-lg hover:bg-gray-50"
        >
          ← 上一步
        </button>
        <button
          onClick={handleNext}
          disabled={!previewAudioUrl}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg 
                   hover:bg-blue-700 disabled:bg-gray-300"
        >
          下一步：选择视频模板 →
        </button>
      </div>
    </div>
  );
};

export default Step2AudioPreview;
```

---

### Step 3: 选择视频模板

（保持原设计，参考原文档 Step 3）

---

### Step 4: 长视频智能分段

#### 4.1 功能说明

**问题**: 
- Wan2.1模型单次生成视频有时长限制（通常30-60秒）
- 用户的文案可能很长（5-10分钟）
- 一次性生成长视频速度慢、容易失败

**解决方案**:
- 系统自动判断文本长度
- 如果超过阈值（如180秒），提示用户分段生成
- 用户可选择：
  - 方案A：分段生成，然后自动合成（推荐）
  - 方案B：只生成前N分钟
  - 方案C：手动选择要生成的段落

#### 4.2 分段策略

```javascript
// server/services/videoSegmentationService.js

/**
 * 智能分段策略
 * 
 * 目标：将长文本分割成多个适合视频生成的段落
 * 
 * 规则：
 * 1. 每段时长控制在30-60秒（90-180字符）
 * 2. 在句子边界分割，保持语义完整
 * 3. 段落间要有逻辑连贯性
 * 4. 每段独立生成视频，最后合成
 */

class VideoSegmentationService {
  constructor() {
    this.TARGET_SEGMENT_LENGTH = 150; // 目标每段150字符（约30秒）
    this.MAX_SEGMENT_LENGTH = 180;    // 最大每段180字符（约36秒）
    this.MIN_SEGMENT_LENGTH = 90;     // 最小每段90字符（约18秒）
  }
  
  /**
   * 判断是否需要分段
   */
  needsSegmentation(text) {
    const estimatedDuration = this.estimateDuration(text);
    return estimatedDuration > 60; // 超过60秒需要分段
  }
  
  /**
   * 估算时长（秒）
   */
  estimateDuration(text) {
    const charCount = text.length;
    return Math.ceil(charCount / 5); // 假设5字符/秒
  }
  
  /**
   * 智能分段
   */
  segmentText(text) {
    const sentences = this.splitIntoSentences(text);
    const segments = [];
    let currentSegment = '';
    
    for (const sentence of sentences) {
      const potentialLength = currentSegment.length + sentence.length;
      
      if (currentSegment === '') {
        // 第一个句子直接加入
        currentSegment = sentence;
      } else if (potentialLength <= this.MAX_SEGMENT_LENGTH) {
        // 没超过最大长度，继续累加
        currentSegment += sentence;
      } else if (currentSegment.length >= this.MIN_SEGMENT_LENGTH) {
        // 当前段已经达到最小长度，保存并开始新段
        segments.push(currentSegment);
        currentSegment = sentence;
      } else {
        // 当前段还不够长，但加上这句会超，强制加入
        currentSegment += sentence;
        segments.push(currentSegment);
        currentSegment = '';
      }
    }
    
    // 处理最后一段
    if (currentSegment.length > 0) {
      if (currentSegment.length < this.MIN_SEGMENT_LENGTH && segments.length > 0) {
        // 最后一段太短，合并到前一段
        segments[segments.length - 1] += currentSegment;
      } else {
        segments.push(currentSegment);
      }
    }
    
    return segments.map((text, index) => ({
      index: index + 1,
      text: text,
      charCount: text.length,
      estimatedDuration: this.estimateDuration(text)
    }));
  }
  
  /**
   * 按句子分割
   */
  splitIntoSentences(text) {
    // 按句号、感叹号、问号分割
    const regex = /[。！？]+/g;
    const sentences = [];
    let lastIndex = 0;
    let match;
    
    while ((match = regex.exec(text)) !== null) {
      const sentence = text.substring(lastIndex, match.index + match[0].length);
      sentences.push(sentence);
      lastIndex = match.index + match[0].length;
    }
    
    // 处理最后一部分（如果没有标点结尾）
    if (lastIndex < text.length) {
      sentences.push(text.substring(lastIndex));
    }
    
    return sentences;
  }
  
  /**
   * 生成分段建议
   */
  generateSegmentationPlan(text) {
    const segments = this.segmentText(text);
    const totalDuration = segments.reduce((sum, seg) => sum + seg.estimatedDuration, 0);
    
    return {
      needsSegmentation: this.needsSegmentation(text),
      totalCharacters: text.length,
      totalDuration: totalDuration,
      segmentCount: segments.length,
      segments: segments,
      recommendation: this.generateRecommendation(segments)
    };
  }
  
  generateRecommendation(segments) {
    if (segments.length <= 2) {
      return '建议直接生成完整视频';
    } else if (segments.length <= 5) {
      return '建议分段生成并自动合成（推荐）';
    } else {
      return '建议考虑缩减文案长度，或分多次生成';
    }
  }
}

module.exports = new VideoSegmentationService();
```

#### 4.3 前端实现

```javascript
// Step4SegmentationConfirm.jsx
import { useState, useEffect } from 'react';
import { segmentationService } from '../../services/api';

const Step4SegmentationConfirm = ({ data, setData, onNext, onPrev }) => {
  const [segmentationPlan, setSegmentationPlan] = useState(null);
  const [selectedStrategy, setSelectedStrategy] = useState('auto_merge'); // 'auto_merge', 'partial', 'manual'
  const [selectedSegments, setSelectedSegments] = useState([]);
  
  useEffect(() => {
    analyzeSeg mentation();
  }, []);
  
  const analyzeSegmentation = async () => {
    try {
      const response = await segmentationService.analyze(data.optimizedText);
      setSegmentationPlan(response);
      
      // 默认选中所有段落
      if (response.segments) {
        setSelectedSegments(response.segments.map(s => s.index));
      }
      
    } catch (error) {
      console.error('分段分析失败:', error);
    }
  };
  
  const handleNext = () => {
    setData({
      ...data,
      segmentationStrategy: selectedStrategy,
      selectedSegments: selectedStrategy === 'manual' ? selectedSegments : null,
      segmentationPlan
    });
    onNext();
  };
  
  if (!segmentationPlan) {
    return <div>正在分析文本长度...</div>;
  }
  
  // 如果不需要分段，直接进入下一步
  if (!segmentationPlan.needsSegmentation) {
    useEffect(() => {
      setData({ ...data, segmentationStrategy: 'none' });
      onNext();
    }, []);
    return <div>文本长度适中，无需分段...</div>;
  }
  
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
        <h3 className="font-semibold text-yellow-800 mb-2">
          ⚠️ 检测到长文本
        </h3>
        <p className="text-yellow-700">
          您的文案较长（约{segmentationPlan.totalDuration}秒），
          为了保证生成质量和速度，建议采用分段生成方案。
        </p>
      </div>
      
      {/* 分段概览 */}
      <div className="p-6 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-4">📊 分段概览</h3>
        <div className="grid grid-cols-4 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-blue-600">
              {segmentationPlan.totalCharacters}
            </p>
            <p className="text-sm text-gray-600">总字符数</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-green-600">
              {segmentationPlan.totalDuration}秒
            </p>
            <p className="text-sm text-gray-600">预计总时长</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-purple-600">
              {segmentationPlan.segmentCount}
            </p>
            <p className="text-sm text-gray-600">建议分段数</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-orange-600">
              {Math.ceil(segmentationPlan.totalDuration / 30 * 30)}
            </p>
            <p className="text-sm text-gray-600">预计消耗积分</p>
          </div>
        </div>
        <p className="mt-4 text-sm text-gray-600 text-center">
          💡 {segmentationPlan.recommendation}
        </p>
      </div>
      
      {/* 生成策略选择 */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">🎯 选择生成策略</h3>
        
        {/* 策略1：自动分段合成 */}
        <label className="block p-4 border-2 rounded-lg cursor-pointer hover:border-blue-500
                        ${selectedStrategy === 'auto_merge' ? 'border-blue-500 bg-blue-50' : ''}">
          <div className="flex items-start gap-3">
            <input
              type="radio"
              value="auto_merge"
              checked={selectedStrategy === 'auto_merge'}
              onChange={(e) => setSelectedStrategy(e.target.value)}
              className="mt-1"
            />
            <div className="flex-1">
              <p className="font-semibold text-lg">
                ✨ 自动分段并合成（推荐）
              </p>
              <p className="text-sm text-gray-600 mt-1">
                系统自动将文案分成{segmentationPlan.segmentCount}段，
                每段独立生成视频，最后自动合成为一个完整视频。
              </p>
              <div className="mt-2 text-sm">
                <span className="text-green-600">✓ 质量最佳</span>
                <span className="mx-2">•</span>
                <span className="text-green-600">✓ 全自动处理</span>
                <span className="mx-2">•</span>
                <span className="text-green-600">✓ 无缝衔接</span>
              </div>
            </div>
          </div>
        </label>
        
        {/* 策略2：只生成部分 */}
        <label className="block p-4 border-2 rounded-lg cursor-pointer hover:border-blue-500
                        ${selectedStrategy === 'partial' ? 'border-blue-500 bg-blue-50' : ''}">
          <div className="flex items-start gap-3">
            <input
              type="radio"
              value="partial"
              checked={selectedStrategy === 'partial'}
              onChange={(e) => setSelectedStrategy(e.target.value)}
              className="mt-1"
            />
            <div className="flex-1">
              <p className="font-semibold text-lg">
                ⚡ 只生成前60秒
              </p>
              <p className="text-sm text-gray-600 mt-1">
                只生成前{Math.min(60, segmentationPlan.totalDuration)}秒内容，
                适合快速预览效果。
              </p>
              <div className="mt-2 text-sm">
                <span className="text-blue-600">✓ 速度最快</span>
                <span className="mx-2">•</span>
                <span className="text-blue-600">✓ 节省积分</span>
                <span className="mx-2">•</span>
                <span className="text-orange-600">⚠️ 内容不完整</span>
              </div>
            </div>
          </div>
        </label>
        
        {/* 策略3：手动选择段落 */}
        <label className="block p-4 border-2 rounded-lg cursor-pointer hover:border-blue-500
                        ${selectedStrategy === 'manual' ? 'border-blue-500 bg-blue-50' : ''}">
          <div className="flex items-start gap-3">
            <input
              type="radio"
              value="manual"
              checked={selectedStrategy === 'manual'}
              onChange={(e) => setSelectedStrategy(e.target.value)}
              className="mt-1"
            />
            <div className="flex-1">
              <p className="font-semibold text-lg">
                🎨 手动选择段落
              </p>
              <p className="text-sm text-gray-600 mt-1">
                自己选择要生成哪些段落，可以分批生成。
              </p>
              <div className="mt-2 text-sm">
                <span className="text-purple-600">✓ 灵活可控</span>
                <span className="mx-2">•</span>
                <span className="text-purple-600">✓ 按需生成</span>
              </div>
            </div>
          </div>
        </label>
      </div>
      
      {/* 如果选择手动，显示段落列表 */}
      {selectedStrategy === 'manual' && (
        <div className="space-y-3">
          <h4 className="font-semibold">选择要生成的段落：</h4>
          {segmentationPlan.segments.map(segment => (
            <label
              key={segment.index}
              className="block p-4 border rounded-lg cursor-pointer hover:bg-gray-50"
            >
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={selectedSegments.includes(segment.index)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedSegments([...selectedSegments, segment.index]);
                    } else {
                      setSelectedSegments(selectedSegments.filter(i => i !== segment.index));
                    }
                  }}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-semibold">
                      段落 {segment.index}
                    </span>
                    <span className="text-sm text-gray-500">
                      {segment.charCount}字 • 约{segment.estimatedDuration}秒
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {segment.text.substring(0, 80)}...
                  </p>
                </div>
              </div>
            </label>
          ))}
        </div>
      )}
      
      {/* 导航按钮 */}
      <div className="flex justify-between pt-6">
        <button
          onClick={onPrev}
          className="px-6 py-2 border rounded-lg hover:bg-gray-50"
        >
          ← 上一步
        </button>
        <button
          onClick={handleNext}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          下一步：确认生成 →
        </button>
      </div>
    </div>
  );
};

export default Step4SegmentationConfirm;
```

#### 4.4 后端分段生成

```javascript
// server/controllers/generateController.js (优化版)

async function createVideoGeneration(req, res) {
  const userId = req.user.id;
  const { 
    text, 
    voiceSettings, 
    templateId,
    segmentationStrategy,
    selectedSegments,
    segmentationPlan
  } = req.body;
  
  try {
    // 1. 验证积分
    const user = await dbGet('SELECT credits FROM users WHERE id = ?', [userId]);
    const requiredCredits = calculateCredits(text);
    
    if (user.credits < requiredCredits) {
      return res.status(400).json({
        success: false,
        error: 'insufficient_credits'
      });
    }
    
    // 2. 创建主任务
    const generationId = `gen_${Date.now()}`;
    await dbRun(`
      INSERT INTO generations 
      (id, user_id, text_content, voice_settings, template_id, 
       status, credits_cost, segmentation_strategy)
      VALUES (?, ?, ?, ?, ?, 'pending', ?, ?)
    `, [
      generationId, userId, text,
      JSON.stringify(voiceSettings), templateId,
      requiredCredits, segmentationStrategy
    ]);
    
    // 3. 预扣积分
    await deductCredits(userId, requiredCredits, generationId);
    
    // 4. 判断生成策略
    if (segmentationStrategy === 'none') {
      // 直接生成
      processGeneration(generationId, text, voiceSettings, templateId, userId);
      
    } else if (segmentationStrategy === 'auto_merge') {
      // 分段生成并合成
      processSegmentedGeneration(
        generationId, 
        segmentationPlan.segments, 
        voiceSettings, 
        templateId, 
        userId
      );
      
    } else if (segmentationStrategy === 'partial') {
      // 只生成前60秒
      const partialText = text.substring(0, 300); // 约60秒
      processGeneration(generationId, partialText, voiceSettings, templateId, userId);
      
    } else if (segmentationStrategy === 'manual') {
      // 只生成选中的段落
      const selectedSegmentTexts = segmentationPlan.segments
        .filter(s => selectedSegments.includes(s.index))
        .map(s => s.text);
      
      processSegmentedGeneration(
        generationId,
        selectedSegmentTexts,
        voiceSettings,
        templateId,
        userId
      );
    }
    
    // 5. 返回任务ID
    res.json({
      success: true,
      generationId,
      segmentationStrategy,
      segmentCount: segmentationPlan?.segments?.length || 1
    });
    
  } catch (error) {
    console.error('创建生成任务失败:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * 分段生成并合成
 */
async function processSegmentedGeneration(generationId, segments, voiceSettings, templateId, userId) {
  try {
    await dbRun(
      'UPDATE generations SET status = ? WHERE id = ?',
      ['processing', generationId]
    );
    
    const segmentVideos = [];
    
    // 逐段生成
    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      console.log(`生成段落 ${i + 1}/${segments.length}...`);
      
      // 更新进度
      await dbRun(
        'UPDATE generations SET progress = ? WHERE id = ?',
        [Math.round((i / segments.length) * 80), generationId]
      );
      
      // 1. 生成TTS
      const audioPath = await generateTTS(segment.text, voiceSettings);
      
      // 2. 生成视频
      const videoPath = await generateVideo(audioPath, templateId);
      
      segmentVideos.push(videoPath);
    }
    
    // 更新进度：开始合成
    await dbRun(
      'UPDATE generations SET progress = ? WHERE id = ?',
      [85, generationId]
    );
    
    // 合成所有段落视频
    const finalVideoPath = await mergeVideos(segmentVideos, generationId);
    
    // 更新完成状态
    await dbRun(`
      UPDATE generations 
      SET status = 'completed', 
          video_url = ?, 
          progress = 100,
          completed_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `, [finalVideoPath, generationId]);
    
    console.log(`✅ 分段生成完成: ${generationId}`);
    
  } catch (error) {
    console.error('分段生成失败:', error);
    await handleGenerationFailure(generationId, userId, error.message);
  }
}

/**
 * 合成多个视频片段
 */
async function mergeVideos(videoPaths, generationId) {
  const ffmpeg = require('fluent-ffmpeg');
  const outputPath = path.join(
    __dirname, '../../public/uploads/videos',
    `${generationId}_merged.mp4`
  );
  
  return new Promise((resolve, reject) => {
    const command = ffmpeg();
    
    // 添加所有视频
    videoPaths.forEach(videoPath => {
      command.input(videoPath);
    });
    
    // 合成
    command
      .on('end', () => {
        console.log('视频合成完成');
        resolve(outputPath);
      })
      .on('error', (err) => {
        console.error('视频合成失败:', err);
        reject(err);
      })
      .mergeToFile(outputPath);
  });
}
```

---

### Step 5: 最终确认生成

（保持原设计，增加分段信息展示）

---

## 完整流程总结

### 优化后的用户旅程

```
1. 粘贴原始文案
   ↓
2. AI自动优化为口播稿
   • 口语化改写
   • 添加恰当语气词
   • 数字转中文
   • 标点简化
   ↓
3. 用户确认并可手动编辑
   ↓
4. 生成试听音频（前100字）
   • 选择声音（系统/自定义）
   • 调节参数
   • 播放试听
   ↓
5. 试听满意后进入下一步
   ↓
6. 选择视频模板
   • 系统模板
   • 自定义模板
   ↓
7. 系统判断是否需要分段
   • 短文本：直接生成
   • 长文本：分段生成并自动合成
   ↓
8. 确认生成
   • 显示预计消耗积分
   • 显示预计耗时
   ↓
9. 后台处理
   • 生成完整TTS
   • 分段生成视频
   • 自动合成
   ↓
10. 完成，可下载
```

---

## 技术实现要点

### 1. AI文案优化服务
- 使用OpenAI GPT-4或Claude
- 精心设计的Prompt模板
- 情感分析和语气词匹配
- 数字转换和标点处理

### 2. 试听预览机制
- 提取前100字符
- 调用TTS快速生成（10-30秒）
- 前端音频播放器
- 参数实时调节

### 3. 智能分段算法
- 按句子边界分割
- 控制每段30-60秒
- 保持语义完整
- 提供多种生成策略

### 4. 视频合成技术
- 使用FFmpeg合成多段视频
- 无缝衔接
- 音视频同步
- 输出统一格式

### 5. 进度管理
- 实时更新生成进度
- 显示当前处理段落
- 预计剩余时间
- 失败自动重试

---

## 数据库更新

### generations表新增字段

```sql
ALTER TABLE generations ADD COLUMN segmentation_strategy TEXT;
ALTER TABLE generations ADD COLUMN progress INTEGER DEFAULT 0;
ALTER TABLE generations ADD COLUMN segment_count INTEGER;
ALTER TABLE generations ADD COLUMN original_text TEXT;  -- 保存原始文案
```

---

这就是完整的优化设计！主要改进：

1. **AI文案优化**：智能改写，添加语气词，提升口播效果
2. **试听确认**：先听片段，满意再生成，避免浪费
3. **智能分段**：长视频自动分段，提高成功率
4. **灵活策略**：多种生成方案，用户可选

需要我详细说明任何部分吗？

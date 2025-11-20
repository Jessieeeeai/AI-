import axios from 'axios';

/**
 * AI文案优化服务
 * 
 * 功能：将原始文案改写为适合数字人口播的脚本
 * 核心：情感分析 + 语气词匹配 + 口语化改写
 */

class AIOptimizationService {
  constructor() {
    // 可以使用OpenAI、Claude或本地模型
    this.apiKey = process.env.OPENAI_API_KEY || '';
    this.apiUrl = process.env.OPENAI_API_URL || 'https://api.openai.com/v1/chat/completions';
    this.model = process.env.AI_MODEL || 'gpt-4';
    
    // 使用Mock模式（如果没有配置API Key）
    this.useMock = !this.apiKey;
  }

  /**
   * 优化脚本主方法
   */
  async optimizeScript(originalText, style = 'humorous') {
    if (this.useMock) {
      console.log('⚠️  使用Mock模式优化文案');
      return this.mockOptimize(originalText, style);
    }

    try {
      const prompt = this.buildPrompt(originalText, style);
      const optimizedText = await this.callAIService(prompt);
      const stats = this.analyzeOptimization(originalText, optimizedText);
      const warnings = this.generateWarnings(originalText, optimizedText);

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

  /**
   * 构建优化Prompt
   */
  buildPrompt(originalText, style) {
    const styleGuide = {
      humorous: '风趣幽默、轻松活泼',
      professional: '专业严谨、客观中立',
      casual: '轻松随意、亲切自然'
    };

    const styleDesc = styleGuide[style] || styleGuide.humorous;

    return `你是一个专业的数字人口播稿优化专家，擅长将任何文章改写成适合语音朗读的口播稿。

**你的任务**：将用户提供的文章改写成${styleDesc}的口播稿。

**改写规则（必须严格遵守）**：

1. **语言风格**：
   - 口语化表达，${styleDesc}
   - 简洁有力，删除冗余
   - 节奏感强，适合朗读
   - 避免书面语，多用口语表达

2. **标点符号**：
   - 只能使用：句号(。)、感叹号(！)、问号(？)
   - 其他标点全部删除或替换为这三种
   - 逗号改为句号或删除
   - 引号、书名号等全部删除

3. **数字转换**：
   - 阿拉伯数字全部转为中文口语化表达
   - 8000000 → 八百万
   - 123 → 一百二十三
   - 3.14 → 三点一四
   - 50% → 百分之五十
   - 2025年 → 二零二五年

4. **英文保持**：
   - 所有英文单词、品牌名、术语保持原样
   - 不要翻译成中文
   - 例如：ChatGPT、iPhone、AI、Tesla保持不变

5. **语气词添加（核心规则）**：
   **必须先判断内容的情感属性，然后选择匹配的语气词：**
   
   - **正面消息**（上涨、成功、好事）→ 使用正面语气词
     * 强烈正面：哇塞、牛逼、太猛了、炸了
     * 中等正面：太棒了、给力、赞、厉害了
   
   - **负面消息**（下跌、失败、坏事）→ 使用负面语气词
     * 强烈负面：卧槽、完蛋了、惨了、崩了
     * 中等负面：糟糕、要命了、遭了
   
   - **震惊消息**（意外、反转、罕见）→ 使用震惊语气词
     * 天哪、妈耶、不会吧、离谱、太夸张了
   
   - **疑惑困惑** → 啊、嗯、咦、奇怪、什么情况
   
   - **强调重点** → 注意了、听好了、重点来了、关键是
   
   **严禁情感错位！必须根据内容选择匹配的语气词！**
   
   示例：
   - ✅ "卧槽！股市暴跌百分之二十！"（负面用负面词）
   - ❌ "哇塞！股市暴跌百分之二十！"（负面用正面词，错误！）
   - ✅ "牛逼！比特币突破十万美元！"（正面用正面词）
   - ❌ "惨了！比特币突破十万美元！"（正面用负面词，错误！）

6. **语气词插入位置**：
   - 关键数据前：在重要数字前添加语气词
   - 转折处：在意外、反转处添加
   - 段落开头：引起注意
   - 每50-80字插入1个语气词
   - 避免连续使用相同语气词

7. **内容精简**：
   - 删除冗余表述和重复内容
   - 保留核心信息和关键数据
   - 数据必须准确无误
   - 删减20-30%无意义的过渡词

8. **输出格式**：
   - 无标题，直接输出正文
   - 适合语音朗读
   - 保持逻辑连贯

**工作流程**：
1. 理解原文的核心内容和主题
2. 判断每个关键信息的情感属性（正面/负面/中性/震惊）
3. 根据情感属性选择对应的恰当语气词
4. 进行口语化改写，删除冗余
5. 处理标点符号和数字转换，保持英文不变
6. 自查语气词是否与内容情感匹配

**现在开始改写以下文案**：

${originalText}

**直接输出改写后的口播稿，不要解释过程，不要添加任何前缀或后缀**。`;
  }

  /**
   * 调用AI服务
   */
  async callAIService(prompt) {
    try {
      const response = await axios.post(
        this.apiUrl,
        {
          model: this.model,
          messages: [
            {
              role: 'system',
              content: '你是一个专业的数字人口播稿优化专家，擅长将任何文章改写成适合语音朗读的口播稿。你必须严格遵守所有改写规则，特别是语气词的情感匹配。'
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
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 60000
        }
      );

      return response.data.choices[0].message.content.trim();
    } catch (error) {
      if (error.response) {
        throw new Error(`AI服务错误: ${error.response.status} - ${error.response.data.error?.message || '未知错误'}`);
      } else if (error.request) {
        throw new Error('AI服务无响应，请检查网络连接');
      } else {
        throw new Error('调用AI服务失败: ' + error.message);
      }
    }
  }

  /**
   * Mock优化（用于测试，无需API Key）
   */
  mockOptimize(originalText, style) {
    // 简单的规则转换作为Mock
    let optimizedText = originalText;

    // 1. 数字转换示例
    optimizedText = optimizedText.replace(/(\d+)%/g, (match, num) => {
      return `百分之${this.numberToChinese(num)}`;
    });
    optimizedText = optimizedText.replace(/\d{7,}/g, (match) => {
      const num = parseInt(match);
      if (num >= 100000000) return `${Math.floor(num / 100000000)}亿`;
      if (num >= 10000) return `${Math.floor(num / 10000)}万`;
      return match;
    });

    // 2. 添加语气词（简化版）
    if (originalText.includes('上涨') || originalText.includes('增长')) {
      optimizedText = '哇塞！' + optimizedText;
    } else if (originalText.includes('下跌') || originalText.includes('暴跌')) {
      optimizedText = '卧槽！' + optimizedText;
    }

    // 3. 标点简化
    optimizedText = optimizedText.replace(/，/g, '。');
    optimizedText = optimizedText.replace(/；/g, '。');
    optimizedText = optimizedText.replace(/：/g, '');
    optimizedText = optimizedText.replace(/"/g, '');
    optimizedText = optimizedText.replace(/"/g, '');

    const stats = this.analyzeOptimization(originalText, optimizedText);
    const warnings = ['⚠️  当前使用Mock模式，实际效果可能不同。配置OPENAI_API_KEY使用真实AI优化。'];

    return {
      optimizedText,
      stats,
      warnings
    };
  }

  /**
   * 数字转中文（简化版）
   */
  numberToChinese(num) {
    const digits = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
    const units = ['', '十', '百', '千'];
    
    if (num < 10) return digits[num];
    if (num < 20) return '十' + (num % 10 === 0 ? '' : digits[num % 10]);
    
    let result = '';
    let n = parseInt(num);
    let i = 0;
    
    while (n > 0) {
      const digit = n % 10;
      if (digit !== 0) {
        result = digits[digit] + units[i] + result;
      } else if (result && result[0] !== '零') {
        result = '零' + result;
      }
      n = Math.floor(n / 10);
      i++;
    }
    
    return result;
  }

  /**
   * 分析优化统计
   */
  analyzeOptimization(original, optimized) {
    // 统计语气词
    const exclamations = [
      '哇塞', '牛逼', '卧槽', '天哪', '妈耶', '太棒了',
      '给力', '赞', '惨了', '糟糕', '离谱', '完蛋了',
      '崩了', '不会吧', '太猛了', '炸了', '要命了'
    ];
    
    let addedExclamations = 0;
    exclamations.forEach(word => {
      const originalCount = (original.match(new RegExp(word, 'g')) || []).length;
      const optimizedCount = (optimized.match(new RegExp(word, 'g')) || []).length;
      addedExclamations += (optimizedCount - originalCount);
    });

    // 统计数字转换
    const numberRegex = /\d+/g;
    const originalNumbers = (original.match(numberRegex) || []).length;
    const optimizedNumbers = (optimized.match(numberRegex) || []).length;
    const convertedNumbers = Math.max(0, originalNumbers - optimizedNumbers);

    // 统计标点简化
    const complexPunctuation = /[，、；：""''《》（）【】]/g;
    const originalComplex = (original.match(complexPunctuation) || []).length;
    const optimizedComplex = (optimized.match(complexPunctuation) || []).length;
    const simplifiedPunctuation = Math.max(0, originalComplex - optimizedComplex);

    return {
      addedExclamations,
      convertedNumbers,
      simplifiedPunctuation,
      originalLength: original.length,
      optimizedLength: optimized.length,
      reductionRate: ((1 - optimized.length / original.length) * 100).toFixed(1)
    };
  }

  /**
   * 生成警告信息
   */
  generateWarnings(original, optimized) {
    const warnings = [];

    // 检测负面消息
    const negativeKeywords = ['下跌', '暴跌', '崩盘', '失败', '损失', '危机'];
    const hasNegative = negativeKeywords.some(kw => original.includes(kw));
    if (hasNegative) {
      warnings.push('✓ 检测到负面消息，已使用恰当的负面语气词');
    }

    // 检测正面消息
    const positiveKeywords = ['上涨', '飙升', '突破', '成功', '创新', '增长'];
    const hasPositive = positiveKeywords.some(kw => original.includes(kw));
    if (hasPositive) {
      warnings.push('✓ 检测到正面消息，已使用恰当的正面语气词');
    }

    // 检测英文保留
    const englishWords = optimized.match(/[a-zA-Z]+/g);
    if (englishWords && englishWords.length > 0) {
      warnings.push(`✓ 保留了 ${englishWords.length} 个英文词汇`);
    }

    // 检测数字转换
    const remainingNumbers = (optimized.match(/\d+/g) || []).length;
    if (remainingNumbers === 0) {
      warnings.push('✓ 所有数字已转换为中文');
    }

    return warnings;
  }
}

export default new AIOptimizationService();

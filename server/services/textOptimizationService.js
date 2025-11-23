/**
 * AI文本优化服务
 * 支持多个AI提供商: OpenAI, 智谱AI, Mock
 */

import axios from 'axios';
import { aiServicesConfig } from '../config/aiServices.js';

/**
 * 文本优化服务类
 */
class TextOptimizationService {
  constructor() {
    this.provider = aiServicesConfig.textOptimization.provider || 'local-mock';
    this.openaiApiKey = aiServicesConfig.textOptimization.openaiApiKey;
    this.zhipuApiKey = aiServicesConfig.textOptimization.zhipuApiKey;
    this.mockServiceUrl = process.env.MOCK_TEXT_OPTIMIZATION_URL || 'http://localhost:5001';
    
    console.log(`📝 TextOptimizationService初始化 | 提供商: ${this.provider}`);
  }

  /**
   * 优化文本 - 统一入口
   * @param {string} text - 原始文本
   * @param {Object} options - 优化选项
   * @returns {Promise<Object>} 优化结果
   */
  async optimizeText(text, options = {}) {
    const {
      tone = 'professional',        // 语气: professional, casual, enthusiastic
      style = 'clear',              // 风格: clear, detailed, concise
      targetAudience = 'general',   // 目标受众
      maxLength = null              // 最大长度限制
    } = options;

    console.log(`📝 优化文本 | 提供商: ${this.provider} | 长度: ${text.length}`);

    try {
      switch (this.provider) {
        case 'openai':
          return await this.optimizeWithOpenAI(text, { tone, style, targetAudience, maxLength });
        
        case 'zhipu':
          return await this.optimizeWithZhipu(text, { tone, style, targetAudience, maxLength });
        
        case 'local-mock':
        default:
          return await this.optimizeWithMock(text, { tone, style, targetAudience, maxLength });
      }
    } catch (error) {
      console.error(`❌ 文本优化失败 (${this.provider}):`, error.message);
      
      // 如果当前提供商失败，尝试降级到Mock
      if (this.provider !== 'local-mock') {
        console.log('⚠️  尝试降级到Mock服务...');
        try {
          return await this.optimizeWithMock(text, { tone, style, targetAudience, maxLength });
        } catch (mockError) {
          throw new Error(`文本优化失败: ${error.message}`);
        }
      }
      
      throw error;
    }
  }

  /**
   * 使用OpenAI优化文本
   */
  async optimizeWithOpenAI(text, options) {
    if (!this.openaiApiKey) {
      throw new Error('OpenAI API key未配置');
    }

    const { tone, style, targetAudience, maxLength } = options;

    // 构建提示词
    const systemPrompt = this.buildSystemPrompt(tone, style, targetAudience);
    const userPrompt = maxLength 
      ? `请优化以下文本，控制在${maxLength}字以内:\n\n${text}`
      : `请优化以下文本:\n\n${text}`;

    console.log('🤖 调用OpenAI API...');

    try {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-4',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.7,
          max_tokens: 2000
        },
        {
          headers: {
            'Authorization': `Bearer ${this.openaiApiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      const optimizedText = response.data.choices[0].message.content.trim();

      return {
        success: true,
        original: text,
        optimized: optimizedText,
        suggestions: ['使用GPT-4进行专业润色'],
        metadata: {
          originalLength: text.length,
          optimizedLength: optimizedText.length,
          tone,
          style,
          targetAudience,
          provider: 'openai',
          model: 'gpt-4',
          tokensUsed: response.data.usage.total_tokens
        }
      };

    } catch (error) {
      if (error.response) {
        throw new Error(`OpenAI API错误: ${error.response.data.error?.message || error.message}`);
      }
      throw new Error(`OpenAI请求失败: ${error.message}`);
    }
  }

  /**
   * 使用智谱AI优化文本
   */
  async optimizeWithZhipu(text, options) {
    if (!this.zhipuApiKey) {
      throw new Error('智谱AI API key未配置');
    }

    const { tone, style, targetAudience, maxLength } = options;

    // 构建提示词
    const systemPrompt = this.buildSystemPrompt(tone, style, targetAudience);
    const userPrompt = maxLength 
      ? `请优化以下文本，控制在${maxLength}字以内:\n\n${text}`
      : `请优化以下文本:\n\n${text}`;

    console.log('🤖 调用智谱AI API...');

    try {
      const response = await axios.post(
        'https://open.bigmodel.cn/api/paas/v4/chat/completions',
        {
          model: 'glm-4',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.7,
          max_tokens: 2000
        },
        {
          headers: {
            'Authorization': `Bearer ${this.zhipuApiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );

      const optimizedText = response.data.choices[0].message.content.trim();

      return {
        success: true,
        original: text,
        optimized: optimizedText,
        suggestions: ['使用GLM-4进行智能优化'],
        metadata: {
          originalLength: text.length,
          optimizedLength: optimizedText.length,
          tone,
          style,
          targetAudience,
          provider: 'zhipu',
          model: 'glm-4',
          tokensUsed: response.data.usage.total_tokens
        }
      };

    } catch (error) {
      if (error.response) {
        throw new Error(`智谱AI API错误: ${error.response.data.error?.message || error.message}`);
      }
      throw new Error(`智谱AI请求失败: ${error.message}`);
    }
  }

  /**
   * 使用Mock服务优化文本
   */
  async optimizeWithMock(text, options) {
    const { tone, style, targetAudience, maxLength } = options;

    console.log('🎭 调用Mock文本优化服务...');

    try {
      const response = await axios.post(
        `${this.mockServiceUrl}/api/v1/optimize`,
        {
          text,
          tone,
          style,
          targetAudience,
          maxLength
        },
        {
          timeout: 10000
        }
      );

      return response.data;

    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        throw new Error('Mock文本优化服务不可用，请启动: npm run mock:services');
      }
      throw new Error(`Mock服务错误: ${error.message}`);
    }
  }

  /**
   * 批量优化文本
   * @param {Array<string>} texts - 文本数组
   * @param {Object} options - 优化选项
   * @returns {Promise<Array>} 优化结果数组
   */
  async batchOptimize(texts, options = {}) {
    console.log(`📚 批量优化 | 数量: ${texts.length}`);

    const results = [];
    
    for (let i = 0; i < texts.length; i++) {
      try {
        const result = await this.optimizeText(texts[i], options);
        results.push(result);
        console.log(`✅ 批量优化进度: ${i + 1}/${texts.length}`);
      } catch (error) {
        console.error(`❌ 优化失败 [${i + 1}/${texts.length}]:`, error.message);
        results.push({
          success: false,
          original: texts[i],
          error: error.message
        });
      }
    }

    return results;
  }

  /**
   * 构建系统提示词
   */
  buildSystemPrompt(tone, style, targetAudience) {
    const toneDescriptions = {
      professional: '专业、正式，适合商务场合',
      casual: '轻松、友好，适合日常交流',
      enthusiastic: '热情、积极，充满感染力'
    };

    const styleDescriptions = {
      clear: '清晰明了，简洁易懂',
      detailed: '内容详实，信息丰富',
      concise: '精炼简短，直击要点'
    };

    return `你是一位专业的文本优化专家。请根据以下要求优化文本:

语气: ${toneDescriptions[tone] || toneDescriptions.professional}
风格: ${styleDescriptions[style] || styleDescriptions.clear}
目标受众: ${targetAudience}

优化要求:
1. 保持原文核心意思不变
2. 改善语句流畅度和可读性
3. 修正语法和标点错误
4. 调整语气和措辞使其符合要求
5. 只返回优化后的文本，不要添加解释

请直接返回优化后的文本。`;
  }

  /**
   * 获取支持的语气列表
   */
  async getTones() {
    if (this.provider === 'local-mock') {
      try {
        const response = await axios.get(`${this.mockServiceUrl}/api/v1/tones`);
        return response.data.tones;
      } catch (error) {
        // 返回默认列表
      }
    }

    return [
      { id: 'professional', name: '专业', description: '适合商务和正式场合' },
      { id: 'casual', name: '随意', description: '轻松友好的日常交流' },
      { id: 'enthusiastic', name: '热情', description: '充满活力和感染力' }
    ];
  }

  /**
   * 获取支持的风格列表
   */
  async getStyles() {
    if (this.provider === 'local-mock') {
      try {
        const response = await axios.get(`${this.mockServiceUrl}/api/v1/styles`);
        return response.data.styles;
      } catch (error) {
        // 返回默认列表
      }
    }

    return [
      { id: 'clear', name: '清晰', description: '简洁明了，易于理解' },
      { id: 'detailed', name: '详细', description: '内容充实，信息丰富' },
      { id: 'concise', name: '精简', description: '简短有力，直击要点' }
    ];
  }

  /**
   * 检查服务健康状态
   */
  async checkHealth() {
    try {
      if (this.provider === 'local-mock') {
        const response = await axios.get(`${this.mockServiceUrl}/health`, { timeout: 5000 });
        return response.data;
      }
      
      return { status: 'healthy', provider: this.provider };
    } catch (error) {
      return { status: 'unhealthy', provider: this.provider, error: error.message };
    }
  }
}

// 导出单例
const textOptimizationService = new TextOptimizationService();

export default textOptimizationService;
export { TextOptimizationService };

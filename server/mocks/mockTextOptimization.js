/**
 * AI文本优化 Mock服务
 * 模拟AI文本优化，用于CPU开发环境
 */

import express from 'express';

const app = express();
app.use(express.json());

/**
 * 模拟文本优化规则
 */
const optimizationRules = [
  {
    pattern: /。{2,}/g,
    replacement: '。',
    description: '修复重复句号'
  },
  {
    pattern: /\s+/g,
    replacement: ' ',
    description: '规范空格'
  },
  {
    pattern: /，，+/g,
    replacement: '，',
    description: '修复重复逗号'
  }
];

/**
 * 简单的文本优化逻辑
 */
function optimizeText(text, options = {}) {
  const { 
    tone = 'professional',  // professional, casual, enthusiastic
    style = 'clear',        // clear, detailed, concise
    targetAudience = 'general' 
  } = options;

  let optimized = text.trim();

  // 应用基础规则
  optimizationRules.forEach(rule => {
    optimized = optimized.replace(rule.pattern, rule.replacement);
  });

  // 根据语气添加修饰
  const toneModifications = {
    professional: {
      prefix: '',
      suffix: '',
      replacements: [
        { from: '很好', to: '出色' },
        { from: '不错', to: '优秀' }
      ]
    },
    casual: {
      prefix: '',
      suffix: '',
      replacements: [
        { from: '您', to: '你' },
        { from: '请', to: '' }
      ]
    },
    enthusiastic: {
      prefix: '',
      suffix: '！',
      replacements: [
        { from: '好', to: '太棒了' },
        { from: '可以', to: '非常不错' }
      ]
    }
  };

  const modification = toneModifications[tone] || toneModifications.professional;
  
  // 应用语气修改
  modification.replacements.forEach(({ from, to }) => {
    optimized = optimized.replace(new RegExp(from, 'g'), to);
  });

  // 添加前后缀
  if (modification.prefix) optimized = modification.prefix + optimized;
  if (modification.suffix && !optimized.endsWith('！') && !optimized.endsWith('。')) {
    optimized = optimized + modification.suffix;
  }

  // 确保句子结尾有标点
  if (!/[。！？]$/.test(optimized)) {
    optimized += '。';
  }

  return optimized;
}

/**
 * 生成优化建议
 */
function generateSuggestions(originalText, optimizedText) {
  const suggestions = [];

  if (originalText.length > optimizedText.length + 20) {
    suggestions.push('文本已精简，去除冗余内容');
  }

  if (optimizedText.length > originalText.length + 20) {
    suggestions.push('文本已扩展，增加详细描述');
  }

  if (originalText !== optimizedText) {
    suggestions.push('调整了语气和措辞，使表达更专业');
  }

  if (suggestions.length === 0) {
    suggestions.push('文本质量已很好，仅做轻微润色');
  }

  return suggestions;
}

// 健康检查
app.get('/health', (req, res) => {
  console.log('✅ [Mock TextOptimization] Health check');
  res.json({
    status: 'healthy',
    mode: 'MOCK',
    message: 'Mock Text Optimization service is running (CPU mode)',
    providers: ['mock'],
    features: ['text_optimization', 'tone_adjustment', 'style_modification']
  });
});

// 文本优化接口
app.post('/api/v1/optimize', (req, res) => {
  const { 
    text, 
    tone = 'professional', 
    style = 'clear',
    targetAudience = 'general',
    maxLength = null
  } = req.body;

  if (!text) {
    return res.status(400).json({ 
      error: 'Missing text parameter' 
    });
  }

  console.log('📝 [Mock TextOptimization] 优化请求:', {
    textLength: text.length,
    tone,
    style,
    targetAudience
  });

  // 模拟处理延迟
  setTimeout(() => {
    try {
      const optimizedText = optimizeText(text, { tone, style, targetAudience });
      const suggestions = generateSuggestions(text, optimizedText);

      const result = {
        success: true,
        original: text,
        optimized: optimizedText,
        suggestions,
        metadata: {
          originalLength: text.length,
          optimizedLength: optimizedText.length,
          tone,
          style,
          targetAudience,
          processingTime: '0.5s (simulated)',
          model: 'mock-optimizer-v1'
        },
        mock: true
      };

      console.log('✅ [Mock TextOptimization] 优化完成:', {
        originalLength: text.length,
        optimizedLength: optimizedText.length,
        changesCount: suggestions.length
      });

      res.json(result);

    } catch (error) {
      console.error('❌ [Mock TextOptimization] 优化失败:', error.message);
      res.status(500).json({ 
        error: 'Optimization failed',
        message: error.message 
      });
    }
  }, 500);
});

// 批量优化接口
app.post('/api/v1/batch-optimize', (req, res) => {
  const { texts, tone, style, targetAudience } = req.body;

  if (!texts || !Array.isArray(texts)) {
    return res.status(400).json({ 
      error: 'Missing texts array parameter' 
    });
  }

  console.log('📚 [Mock TextOptimization] 批量优化请求:', {
    count: texts.length
  });

  setTimeout(() => {
    const results = texts.map(text => ({
      original: text,
      optimized: optimizeText(text, { tone, style, targetAudience }),
      success: true
    }));

    res.json({
      success: true,
      results,
      count: results.length,
      mock: true
    });
  }, 1000);
});

// 支持的语气列表
app.get('/api/v1/tones', (req, res) => {
  res.json({
    tones: [
      { id: 'professional', name: '专业', description: '适合商务和正式场合' },
      { id: 'casual', name: '随意', description: '轻松友好的日常交流' },
      { id: 'enthusiastic', name: '热情', description: '充满活力和感染力' }
    ]
  });
});

// 支持的风格列表
app.get('/api/v1/styles', (req, res) => {
  res.json({
    styles: [
      { id: 'clear', name: '清晰', description: '简洁明了，易于理解' },
      { id: 'detailed', name: '详细', description: '内容充实，信息丰富' },
      { id: 'concise', name: '精简', description: '简短有力，直击要点' }
    ]
  });
});

// 启动Mock服务
const PORT = process.env.MOCK_TEXT_OPTIMIZATION_PORT || 5001;

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🎭 Mock Text Optimization Service Started');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📡 服务地址: http://localhost:${PORT}`);
  console.log(`🔧 模式: CPU模拟模式 (无AI API依赖)`);
  console.log(`✨ 功能: 文本优化、语气调整、风格修改`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
});

export default app;

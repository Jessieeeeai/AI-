import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import aiOptimizationService from '../services/aiOptimizationService.js';

const router = express.Router();

// 所有优化接口需要认证
router.use(authenticateToken);

/**
 * POST /api/optimize/script
 * 
 * 优化文案为口播稿
 * 
 * 请求体：
 * {
 *   "originalText": "原始文案",
 *   "style": "humorous" // 可选：humorous, professional, casual
 * }
 */
router.post('/script', async (req, res) => {
  try {
    const { originalText, style = 'humorous' } = req.body;

    // 验证输入
    if (!originalText || typeof originalText !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'invalid_input',
        message: '请提供有效的文案内容'
      });
    }

    const trimmedText = originalText.trim();

    if (trimmedText.length < 10) {
      return res.status(400).json({
        success: false,
        error: 'text_too_short',
        message: '文案长度至少10个字符'
      });
    }

    if (trimmedText.length > 10000) {
      return res.status(400).json({
        success: false,
        error: 'text_too_long',
        message: '文案长度不能超过10000字符'
      });
    }

    // 验证风格参数
    const validStyles = ['humorous', 'professional', 'casual'];
    if (!validStyles.includes(style)) {
      return res.status(400).json({
        success: false,
        error: 'invalid_style',
        message: '风格参数无效，必须是 humorous, professional 或 casual'
      });
    }

    console.log(`📝 开始优化文案 (${trimmedText.length}字符, 风格: ${style})`);

    // 调用AI优化服务
    const result = await aiOptimizationService.optimizeScript(trimmedText, style);

    console.log(`✅ 优化完成 (${result.optimizedText.length}字符, 压缩率: ${result.stats.reductionRate}%)`);

    res.json({
      success: true,
      optimizedText: result.optimizedText,
      changes: result.stats,
      warnings: result.warnings
    });

  } catch (error) {
    console.error('❌ 文案优化失败:', error);
    res.status(500).json({
      success: false,
      error: 'optimization_failed',
      message: '文案优化失败：' + error.message
    });
  }
});

/**
 * POST /api/optimize/analyze
 * 
 * 分析文案（不优化，只返回分析结果）
 * 
 * 请求体：
 * {
 *   "text": "要分析的文案"
 * }
 */
router.post('/analyze', async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'invalid_input',
        message: '请提供有效的文案内容'
      });
    }

    // 简单的分析
    const analysis = {
      length: text.length,
      estimatedDuration: Math.ceil(text.length / 5), // 5字符/秒
      wordCount: text.split(/\s+/).length,
      numberCount: (text.match(/\d+/g) || []).length,
      englishWordCount: (text.match(/[a-zA-Z]+/g) || []).length,
      complexPunctuation: (text.match(/[，、；：""''《》（）【】]/g) || []).length,
      sentiment: analyzeSentiment(text)
    };

    res.json({
      success: true,
      analysis
    });

  } catch (error) {
    console.error('❌ 文案分析失败:', error);
    res.status(500).json({
      success: false,
      error: 'analysis_failed',
      message: '分析失败：' + error.message
    });
  }
});

/**
 * 简单的情感分析
 */
function analyzeSentiment(text) {
  const positiveKeywords = ['上涨', '飙升', '突破', '成功', '创新', '增长', '喜报', '好消息'];
  const negativeKeywords = ['下跌', '暴跌', '崩盘', '失败', '损失', '危机', '坏消息'];
  const shockKeywords = ['突然', '意外', '惊人', '震惊', '史无前例'];

  let positiveCount = 0;
  let negativeCount = 0;
  let shockCount = 0;

  positiveKeywords.forEach(kw => {
    positiveCount += (text.match(new RegExp(kw, 'g')) || []).length;
  });

  negativeKeywords.forEach(kw => {
    negativeCount += (text.match(new RegExp(kw, 'g')) || []).length;
  });

  shockKeywords.forEach(kw => {
    shockCount += (text.match(new RegExp(kw, 'g')) || []).length;
  });

  if (shockCount > 0) return 'shock';
  if (positiveCount > negativeCount) return 'positive';
  if (negativeCount > positiveCount) return 'negative';
  return 'neutral';
}

export default router;

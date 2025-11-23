/**
 * 文本优化API路由
 */

import express from 'express';
import { authenticateToken } from '../middleware/auth.middleware.js';
import textOptimizationService from '../services/textOptimizationService.js';

const router = express.Router();

/**
 * @route   POST /api/text-optimization/optimize
 * @desc    优化单个文本
 * @access  Private
 */
router.post('/optimize', authenticateToken, async (req, res) => {
  try {
    const { text, tone, style, targetAudience, maxLength } = req.body;

    if (!text) {
      return res.status(400).json({ 
        success: false,
        message: '缺少文本参数' 
      });
    }

    if (text.length > 5000) {
      return res.status(400).json({ 
        success: false,
        message: '文本长度不能超过5000字' 
      });
    }

    console.log(`📝 [API] 文本优化请求 | 用户: ${req.user.id} | 长度: ${text.length}`);

    const result = await textOptimizationService.optimizeText(text, {
      tone,
      style,
      targetAudience,
      maxLength
    });

    res.json(result);

  } catch (error) {
    console.error('❌ [API] 文本优化失败:', error);
    res.status(500).json({ 
      success: false,
      message: '文本优化失败',
      error: error.message 
    });
  }
});

/**
 * @route   POST /api/text-optimization/batch-optimize
 * @desc    批量优化文本
 * @access  Private
 */
router.post('/batch-optimize', authenticateToken, async (req, res) => {
  try {
    const { texts, tone, style, targetAudience } = req.body;

    if (!texts || !Array.isArray(texts)) {
      return res.status(400).json({ 
        success: false,
        message: '缺少文本数组参数' 
      });
    }

    if (texts.length > 10) {
      return res.status(400).json({ 
        success: false,
        message: '批量优化最多支持10个文本' 
      });
    }

    console.log(`📚 [API] 批量优化请求 | 用户: ${req.user.id} | 数量: ${texts.length}`);

    const results = await textOptimizationService.batchOptimize(texts, {
      tone,
      style,
      targetAudience
    });

    res.json({
      success: true,
      results,
      count: results.length
    });

  } catch (error) {
    console.error('❌ [API] 批量优化失败:', error);
    res.status(500).json({ 
      success: false,
      message: '批量优化失败',
      error: error.message 
    });
  }
});

/**
 * @route   GET /api/text-optimization/tones
 * @desc    获取支持的语气列表
 * @access  Public
 */
router.get('/tones', async (req, res) => {
  try {
    const tones = await textOptimizationService.getTones();
    res.json({ success: true, tones });
  } catch (error) {
    console.error('❌ [API] 获取语气列表失败:', error);
    res.status(500).json({ 
      success: false,
      message: '获取语气列表失败',
      error: error.message 
    });
  }
});

/**
 * @route   GET /api/text-optimization/styles
 * @desc    获取支持的风格列表
 * @access  Public
 */
router.get('/styles', async (req, res) => {
  try {
    const styles = await textOptimizationService.getStyles();
    res.json({ success: true, styles });
  } catch (error) {
    console.error('❌ [API] 获取风格列表失败:', error);
    res.status(500).json({ 
      success: false,
      message: '获取风格列表失败',
      error: error.message 
    });
  }
});

/**
 * @route   GET /api/text-optimization/health
 * @desc    检查文本优化服务健康状态
 * @access  Public
 */
router.get('/health', async (req, res) => {
  try {
    const health = await textOptimizationService.checkHealth();
    res.json(health);
  } catch (error) {
    res.status(500).json({ 
      status: 'unhealthy',
      error: error.message 
    });
  }
});

export default router;

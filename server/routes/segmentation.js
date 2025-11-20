/**
 * 文本分段路由
 * 
 * 提供文本智能分段相关的API
 */

import express from 'express';
import textSegmentationService from '../services/textSegmentationService.js';

const router = express.Router();

/**
 * POST /api/segmentation/analyze
 * 分析文本并返回分段建议
 */
router.post('/analyze', async (req, res) => {
  try {
    const { text, strategy = 'auto' } = req.body;

    // 验证输入
    if (!text || typeof text !== 'string') {
      return res.status(400).json({
        success: false,
        error: '请提供有效的文本内容'
      });
    }

    if (text.trim().length < 10) {
      return res.status(400).json({
        success: false,
        error: '文本内容太短，至少需要10个字符'
      });
    }

    if (text.length > 10000) {
      return res.status(400).json({
        success: false,
        error: '文本内容太长，最多10000个字符'
      });
    }

    // 验证策略
    const validStrategies = ['auto', 'short', 'medium', 'long'];
    if (!validStrategies.includes(strategy)) {
      return res.status(400).json({
        success: false,
        error: `无效的分段策略，支持: ${validStrategies.join(', ')}`
      });
    }

    // 执行分段分析
    const result = textSegmentationService.getSegmentationPreview(text, strategy);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('分段分析错误:', error);
    res.status(500).json({
      success: false,
      error: error.message || '分段分析失败'
    });
  }
});

/**
 * POST /api/segmentation/manual
 * 手动指定分段点
 */
router.post('/manual', async (req, res) => {
  try {
    const { text, splitPoints } = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({
        success: false,
        error: '请提供有效的文本内容'
      });
    }

    if (!Array.isArray(splitPoints)) {
      return res.status(400).json({
        success: false,
        error: '分割点必须是数字数组'
      });
    }

    // 执行手动分段
    const segments = textSegmentationService.manualSegmentation(text, splitPoints);

    // 生成分段信息
    const result = {
      needsSegmentation: segments.length > 1,
      strategy: 'manual',
      totalChars: text.length,
      segments: segments.map((seg, index) => ({
        index,
        text: seg,
        charCount: seg.length,
        estimatedDuration: textSegmentationService.estimateDuration(seg.length)
      })),
      totalSegments: segments.length,
      estimatedTotalDuration: textSegmentationService.estimateDuration(text.length)
    };

    // 分析质量
    const analysis = textSegmentationService.analyzeSegmentation(segments);

    res.json({
      success: true,
      data: {
        ...result,
        analysis
      }
    });
  } catch (error) {
    console.error('手动分段错误:', error);
    res.status(500).json({
      success: false,
      error: error.message || '手动分段失败'
    });
  }
});

/**
 * GET /api/segmentation/strategies
 * 获取可用的分段策略
 */
router.get('/strategies', (req, res) => {
  res.json({
    success: true,
    data: {
      strategies: [
        {
          id: 'auto',
          name: '自动选择',
          description: '根据文本长度自动选择最佳策略'
        },
        {
          id: 'short',
          name: '短分段',
          description: '50-150字/段，适合快节奏内容',
          config: {
            minChars: 50,
            maxChars: 150,
            idealChars: 100
          }
        },
        {
          id: 'medium',
          name: '中等分段',
          description: '150-300字/段，适合常规内容',
          config: {
            minChars: 150,
            maxChars: 300,
            idealChars: 200
          }
        },
        {
          id: 'long',
          name: '长分段',
          description: '300-500字/段，适合深度讲解',
          config: {
            minChars: 300,
            maxChars: 500,
            idealChars: 400
          }
        }
      ]
    }
  });
});

/**
 * POST /api/segmentation/validate
 * 验证分段结果
 */
router.post('/validate', async (req, res) => {
  try {
    const { segments, strategy = 'auto' } = req.body;

    if (!Array.isArray(segments)) {
      return res.status(400).json({
        success: false,
        error: '分段必须是数组'
      });
    }

    if (segments.length === 0) {
      return res.status(400).json({
        success: false,
        error: '分段数组不能为空'
      });
    }

    // 验证每个分段是否是字符串
    const invalidSegments = segments.filter(s => typeof s !== 'string');
    if (invalidSegments.length > 0) {
      return res.status(400).json({
        success: false,
        error: '所有分段必须是字符串'
      });
    }

    // 执行验证
    const validation = textSegmentationService.validateSegmentation(segments, strategy);
    const analysis = textSegmentationService.analyzeSegmentation(segments);

    res.json({
      success: true,
      data: {
        validation,
        analysis,
        totalSegments: segments.length,
        totalChars: segments.reduce((sum, s) => sum + s.length, 0)
      }
    });
  } catch (error) {
    console.error('分段验证错误:', error);
    res.status(500).json({
      success: false,
      error: error.message || '分段验证失败'
    });
  }
});

/**
 * POST /api/segmentation/estimate
 * 估算分段后的视频生成时长和费用
 */
router.post('/estimate', async (req, res) => {
  try {
    const { text, strategy = 'auto' } = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({
        success: false,
        error: '请提供有效的文本内容'
      });
    }

    // 获取分段结果
    const segmentResult = textSegmentationService.segmentText(text, strategy);
    
    // 估算费用（假设每秒视频消耗1积分）
    const creditsPerSecond = 1;
    const totalCredits = segmentResult.estimatedTotalDuration * creditsPerSecond;

    // 估算生成时间（假设每段视频需要30-60秒生成）
    const avgGenerationTime = 45; // 秒
    const totalGenerationTime = segmentResult.totalSegments * avgGenerationTime;

    // 如果需要合并，额外时间
    const mergeTime = segmentResult.needsSegmentation ? 
      Math.ceil(segmentResult.totalSegments * 5) : 0;

    res.json({
      success: true,
      data: {
        segments: segmentResult.totalSegments,
        needsSegmentation: segmentResult.needsSegmentation,
        estimatedDuration: segmentResult.estimatedTotalDuration,
        estimatedCredits: totalCredits,
        estimatedGenerationTime: totalGenerationTime + mergeTime,
        breakdown: {
          videoGeneration: totalGenerationTime,
          videoMerge: mergeTime,
          total: totalGenerationTime + mergeTime
        }
      }
    });
  } catch (error) {
    console.error('费用估算错误:', error);
    res.status(500).json({
      success: false,
      error: error.message || '费用估算失败'
    });
  }
});

export default router;

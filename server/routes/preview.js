import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import axios from 'axios';

const router = express.Router();

// 需要认证
router.use(authenticateToken);

/**
 * 生成TTS预览音频
 * POST /api/preview/tts
 */
router.post('/tts', async (req, res) => {
  try {
    const { text, voiceId, voiceSettings } = req.body;

    // 验证参数
    if (!text || text.trim().length === 0) {
      return res.status(400).json({
        error: 'invalid_text',
        message: '预览文本不能为空'
      });
    }

    // 限制文本长度（预览不需要太长）
    if (text.length > 100) {
      return res.status(400).json({
        error: 'text_too_long',
        message: '预览文本不能超过100字'
      });
    }

    // 准备TTS参数
    const ttsParams = {
      text: text.trim(),
      voiceId: voiceId || 'default',
      emoVector: [
        voiceSettings?.happiness || 0.7,
        voiceSettings?.anger || 0.0,
        voiceSettings?.sadness || 0.1,
        0.0, // afraid
        0.0, // disgusted
        0.0, // melancholic
        voiceSettings?.surprise || 0.3,
        1.0 - (voiceSettings?.happiness || 0.7) // calm
      ],
      emoAlpha: 0.8
    };

    console.log('📢 TTS预览请求:', {
      text: text.substring(0, 20) + '...',
      voiceId: ttsParams.voiceId,
      emotions: ttsParams.emoVector
    });

    // 调用IndexTTS2服务
    const indextts2Url = process.env.INDEXTTS2_API_URL || 'http://localhost:5000';
    
    const response = await axios.post(`${indextts2Url}/api/v1/tts`, ttsParams, {
      timeout: 30000,
      responseType: 'arraybuffer' // 接收音频二进制数据
    });

    // 返回音频数据
    res.set({
      'Content-Type': 'audio/wav',
      'Content-Disposition': 'inline; filename="preview.wav"',
      'Cache-Control': 'no-cache'
    });
    
    res.send(response.data);

  } catch (error) {
    console.error('❌ TTS预览失败:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      return res.status(503).json({
        error: 'service_unavailable',
        message: 'TTS服务暂时不可用，请使用Mock模式'
      });
    }

    res.status(500).json({
      error: 'preview_failed',
      message: '预览生成失败：' + error.message
    });
  }
});

export default router;

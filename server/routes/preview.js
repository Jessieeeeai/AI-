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
      voiceId: voiceId || 'dapiaoliang',
            // 大漂亮的声音 - 使用预设的参考音频进行声音克隆
      referenceAudio: voiceId === 'dapiaoliang' ? '/uploads/voices/样板声音1.m4a' : null,
            emoVector: [voiceSettings?.emotions?.happiness || 0.7,
        voiceSettings?.emotions?.anger || 0.0,
        voiceSettings?.emotions?.sadness || 0.1,
        0.0, // afraid
        0.0, // disgusted
        0.0, // melancholic
        voiceSettings?.emotions?.surprise || 0.3,
        1.0 - (voiceSettings?.emotions?.happiness || 0.7) // calm
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

        let audioData;
        try {
                const response = await axios.post(`${indextts2Url}/api/v1/tts`, ttsParams, {
                          timeout: 30000,
                          responseType: 'arraybuffer' // 接收音频二进制数据
                });
                audioData = response.data;
        } catch (ttsError) {
                console.warn('⚠️ TTS服务不可用，使用Mock音频:', ttsError.message);
                // 生成一个简单的静音WAV文件作为降级方案
                // WAV header + 1秒静音数据 (44100Hz, 16bit, mono)
                const sampleRate = 44100;
                const duration = 1; // 1秒
                const numSamples = sampleRate * duration;
                const dataSize = numSamples * 2; // 16bit = 2 bytes
                const fileSize = 44 + dataSize;

                const buffer = Buffer.alloc(fileSize);
                // RIFF header
                buffer.write('RIFF', 0);
                buffer.writeUInt32LE(fileSize - 8, 4);
                buffer.write('WAVE', 8);
                // fmt chunk
                buffer.write('fmt ', 12);
                buffer.writeUInt32LE(16, 16); // chunk size
                buffer.writeUInt16LE(1, 20); // PCM format
                buffer.writeUInt16LE(1, 22); // mono
                buffer.writeUInt32LE(sampleRate, 24);
                buffer.writeUInt32LE(sampleRate * 2, 28); // byte rate
                buffer.writeUInt16LE(2, 32); // block align
                buffer.writeUInt16LE(16, 34); // bits per sample
                // data chunk
                buffer.write('data', 36);
                buffer.writeUInt32LE(dataSize, 40);
                // 静音数据已经是0，不需要额外填充

                audioData = buffer;
        }

        // 返回音频数据
        res.set({
                'Content-Type': 'audio/wav',
                'Content-Disposition': 'inline; filename="preview.wav"',
                'Cache-Control': 'no-cache'
        });

        res.send(audioData);

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

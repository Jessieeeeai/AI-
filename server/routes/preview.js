import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { createRunPodClient } from '../services/runpodServerlessClient.js';
import aiServicesConfig from '../config/aiServices.js';

const router = express.Router();

// 需要认证
router.use(authenticateToken);

// 创建RunPod客户端
const runpodClient = createRunPodClient();

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
          if (text.length > 500) {
                  return res.status(400).json({
                            error: 'text_too_long',
                    message: '预览文本不能超过500字'                  });
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
                  emotions: ttsParams.emoVector,
                  useRunPod: aiServicesConfig.useRunPodServerless
          });

          let audioData;

          // 优先使用RunPod Serverless
          if (aiServicesConfig.useRunPodServerless && runpodClient) {
                  try {
                            console.log('🚀 使用RunPod Serverless调用TTS...');
                            const result = await runpodClient.tts({
                                        text: ttsParams.text,
                                        voice_id: ttsParams.voiceId,
                                        reference_audio: ttsParams.referenceAudio,
                                        emo_vector: ttsParams.emoVector,
                                        emo_alpha: ttsParams.emoAlpha
                            });

                            // RunPod返回的是base64编码的音频
                            if (result.audio_base64) {
                                        audioData = Buffer.from(result.audio_base64, 'base64');
                                        console.log('✅ RunPod TTS成功，音频大小:', audioData.length);
                            } else if (result.audio_url) {
                                        // 如果返回的是URL，下载音频
                                        const axios = (await import('axios')).default;
                                        const audioResponse = await axios.get(result.audio_url, {
                                                      responseType: 'arraybuffer'
                                        });
                                        audioData = audioResponse.data;
                                        console.log('✅ RunPod TTS成功 (URL)，音频大小:', audioData.length);
                            } else {
                                        throw new Error('RunPod返回格式无效: 缺少audio_base64或audio_url');
                            }
                  } catch (runpodError) {
                            console.error('❌ RunPod TTS失败:', runpodError.message);
                            // 降级到Mock音频
                            audioData = generateMockAudio();
                  }
          } else {
                  // 使用Mock音频（当RunPod未配置时）
                  console.log('⚠️ RunPod未配置，使用Mock音频');
                  audioData = generateMockAudio();
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

/**
 * 生成Mock静音音频
  */
function generateMockAudio() {
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

    return buffer;
}

export default router;

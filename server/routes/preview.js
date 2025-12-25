import express from 'express';
import axios from 'axios';
import { authenticateToken } from '../middleware/auth.js';
import { createRunPodClient } from '../services/runpodServerlessClient.js';
import aiServicesConfig from '../config/aiServices.js';

const router = express.Router();

// 声音ID到音频URL的映射
const VOICE_AUDIO_MAP = {
   'dapiaoliang': 'https://pub-7e2c78d85f9642f68cb7d2794fc53473.r2.dev/dapiaoliang.wav',
   'male_magnetic': 'examples/voice_01.wav',
   'female_gentle': 'examples/voice_01.wav',
   'female_lively': 'examples/voice_01.wav',
};

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
                        message: '预览文本不能超过500字'
               });
        }

        // 准备TTS参数
        const ttsParams = {
               text: text.trim(),
               voiceId: voiceId || 'male_magnetic',
               emoVector: [
                        voiceSettings?.emotions?.happiness || 0.7,
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
               useRunPodServerless: aiServicesConfig.useRunPodServerless,
               indexTTS2Url: aiServicesConfig.indexTTS2.apiUrl
        });

        let audioData;

        // 模式1: 使用RunPod Serverless
        if (aiServicesConfig.useRunPodServerless && runpodClient && runpodClient.isConfigured()) {
               try {
                        console.log('🚀 使用RunPod Serverless调用TTS...');
                        const result = await runpodClient.tts({
                                   text: ttsParams.text,
                                   voiceId: ttsParams.voiceId,
                                   emoVector: ttsParams.emoVector,
                                   emoAlpha: ttsParams.emoAlpha
                        });

                        if (result.audio_base64) {
                                   audioData = Buffer.from(result.audio_base64, 'base64');
                                   console.log('✅ RunPod Serverless TTS成功，音频大小:', audioData.length);
                        } else if (result.audio_url) {
                                   const audioResponse = await axios.get(result.audio_url, { responseType: 'arraybuffer' });
                                   audioData = audioResponse.data;
                                   console.log('✅ RunPod Serverless TTS成功 (URL)，音频大小:', audioData.length);
                        } else {
                                   throw new Error('RunPod返回格式无效');
                        }
               } catch (runpodError) {
                        console.error('❌ RunPod Serverless TTS失败:', runpodError.message);
               }
        }

        // 模式2: 使用GPU Pod直连 (INDEXTTS2_API_URL)
        // IndexTTS2 API 格式: {"text": "...", "spk_audio_prompt": "examples/voice_01.wav"}
        if (!audioData && aiServicesConfig.indexTTS2.apiUrl && aiServicesConfig.indexTTS2.apiUrl !== 'http://localhost:5000') {
               try {
                        console.log('🔧 使用GPU Pod直连调用TTS:', aiServicesConfig.indexTTS2.apiUrl);

                        // IndexTTS2 neosun/indextts2 镜像的API格式
                        // 必须参数: text, spk_audio_prompt (说话人参考音频路径)
                        // 可选参数: emo_vector, emo_alpha
                        const requestBody = {
                                   text: ttsParams.text,
                                   spk_audio_prompt: VOICE_AUDIO_MAP[ttsParams.voiceId] || 'examples/voice_01.wav',
                                   emo_vector: ttsParams.emoVector,
                                   emo_alpha: ttsParams.emoAlpha
                        };

                        console.log('📤 请求参数:', JSON.stringify(requestBody));

                        const response = await axios.post(
                                   `${aiServicesConfig.indexTTS2.apiUrl}/tts`,
                                   requestBody,
                         {
                                      headers: { 'Content-Type': 'application/json' },
                                      timeout: aiServicesConfig.indexTTS2.timeout || 120000,
                                      responseType: 'arraybuffer'
                         }
                                 );

                        // 检查响应内容类型
                        const contentType = response.headers['content-type'];
                        console.log('📥 响应Content-Type:', contentType, '数据大小:', response.data.length);

                        if (contentType && contentType.includes('audio')) {
                                   // 直接返回音频数据
                                   audioData = response.data;
                                   console.log('✅ GPU Pod直连TTS成功，音频大小:', audioData.length);
                        } else {
                                   // 可能是JSON响应，尝试解析
                                   try {
                                                const jsonStr = Buffer.from(response.data).toString('utf-8');
                                                const result = JSON.parse(jsonStr);

                                                if (result.audio_base64) {
                                                               audioData = Buffer.from(result.audio_base64, 'base64');
                                                               console.log('✅ GPU Pod直连TTS成功 (base64)，音频大小:', audioData.length);
                                                } else if (result.audio) {
                                                               audioData = Buffer.from(result.audio, 'base64');
                                                               console.log('✅ GPU Pod直连TTS成功 (audio)，音频大小:', audioData.length);
                                                } else if (result.error) {
                                                               throw new Error('GPU Pod返回错误: ' + result.error);
                                                } else {
                                                               throw new Error('GPU Pod返回格式无效: ' + jsonStr.substring(0, 200));
                                                }
                                   } catch (parseError) {
                                                // 如果解析失败，可能就是音频数据
                                                if (response.data.length > 1000) {
                                                               audioData = response.data;
                                                               console.log('✅ GPU Pod直连TTS成功 (raw)，音频大小:', audioData.length);
                                                } else {
                                                               throw parseError;
                                                }
                                   }
                        }
               } catch (podError) {
                        console.error('❌ GPU Pod直连TTS失败:', podError.message);
                        if (podError.response) {
                                   console.error('❌ 响应状态:', podError.response.status);
                                   console.error('❌ 响应数据:', Buffer.from(podError.response.data || '').toString('utf-8').substring(0, 500));
                        }
               }
        }

        // 模式3: 使用Mock音频（降级方案）
        if (!audioData) {
               console.log('⚠️ TTS服务不可用，使用Mock音频');
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
                        message: 'TTS服务暂时不可用'
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
   const sampleRate = 44100;
   const duration = 1;
   const numSamples = sampleRate * duration;
   const dataSize = numSamples * 2;
   const fileSize = 44 + dataSize;
   const buffer = Buffer.alloc(fileSize);

   buffer.write('RIFF', 0);
   buffer.writeUInt32LE(fileSize - 8, 4);
   buffer.write('WAVE', 8);
   buffer.write('fmt ', 12);
   buffer.writeUInt32LE(16, 16);
   buffer.writeUInt16LE(1, 20);
   buffer.writeUInt16LE(1, 22);
   buffer.writeUInt32LE(sampleRate, 24);
   buffer.writeUInt32LE(sampleRate * 2, 28);
   buffer.writeUInt16LE(2, 32);
   buffer.writeUInt16LE(16, 34);
   buffer.write('data', 36);
   buffer.writeUInt32LE(dataSize, 40);

   return buffer;
}

export default router;

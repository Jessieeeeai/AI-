/**
 * RunPod Serverless API 客户端
  * 使用 RunPod proxy 模式直接调用 IndexTTS2 Flask API
   */

import axios from 'axios';

class RunPodServerlessClient {
     constructor() {
              this.apiKey = process.env.RUNPOD_API_KEY;
              this.endpointId = process.env.RUNPOD_ENDPOINT_ID;
              // 使用 proxy 模式直接调用容器内的 Flask API
              this.baseUrl = `https://api.runpod.ai/v2/${this.endpointId}`;
              this.timeout = parseInt(process.env.RUNPOD_TIMEOUT || '120000'); // 2分钟超时

              if (this.apiKey && this.endpointId) {
                           console.log(`🚀 RunPod Serverless Client初始化 | Endpoint: ${this.endpointId} | 使用 proxy 模式`);
              }
     }

     /**
          * 检查是否已配置
               */
     isConfigured() {
              return !!(this.apiKey && this.endpointId);
     }

     /**
          * 通过 proxy 模式调用 IndexTTS2 的 /tts 端点
               * @param {Object} params - TTS 参数
                    * @returns {Promise<Object>} 包含音频数据的对象
                         */
     async tts(params) {
              if (!this.isConfigured()) {
                           throw new Error('RunPod Serverless 未配置: 缺少 RUNPOD_API_KEY 或 RUNPOD_ENDPOINT_ID');
              }

              console.log(`🎤 RunPod TTS (proxy模式) | 文本长度: ${params.text?.length} | 声音: ${params.voiceId}`);

              // 构建 IndexTTS2 API 需要的参数格式
              // 使用内置的示例音频作为说话人参考
              const voiceMapping = {
                           'default': '/app/examples/voice_01.wav',
                           'voice_01': '/app/examples/voice_01.wav',
                           'voice_02': '/app/examples/voice_02.wav',
                           'voice_03': '/app/examples/voice_03.wav',
                           'voice_04': '/app/examples/voice_04.wav',
                           'voice_05': '/app/examples/voice_05.wav',
                           'voice_06': '/app/examples/voice_06.wav',
                           'voice_07': '/app/examples/voice_07.wav',
                           'voice_08': '/app/examples/voice_08.wav',
                           'voice_09': '/app/examples/voice_09.wav',
                           'voice_10': '/app/examples/voice_10.wav',
                           'voice_11': '/app/examples/voice_11.wav',
                           'voice_12': '/app/examples/voice_12.wav'
              };

              const spkAudioPrompt = voiceMapping[params.voiceId] || voiceMapping['default'];

              const ttsPayload = {
                           text: params.text,
                           spk_audio_prompt: spkAudioPrompt
              };

              // 如果有情感参数，添加到请求中
              if (params.emoVector) {
                           ttsPayload.emo_vector = params.emoVector;
              }
              if (params.emoAlpha !== undefined) {
                           ttsPayload.emo_alpha = params.emoAlpha;
              }

              console.log(`📤 发送请求到 proxy 端点: ${this.baseUrl}/proxy/tts`);
              console.log(`📝 请求参数:`, JSON.stringify(ttsPayload));

              try {
                           const response = await axios.post(
                                            `${this.baseUrl}/proxy/tts`,
                                            ttsPayload,
                            {
                                                 headers: {
                                                                          'Authorization': `Bearer ${this.apiKey}`,
                                                                          'Content-Type': 'application/json'
                                                 },
                                                 timeout: this.timeout,
                                                 responseType: 'arraybuffer' // 期望返回二进制音频数据
                            }
                                        );

                           console.log(`✅ RunPod proxy 请求成功 | 响应大小: ${response.data.length} bytes`);

                           // 检查响应是否是 JSON（可能是错误信息）
                           const contentType = response.headers['content-type'] || '';
                           if (contentType.includes('application/json')) {
                                            // 尝试解析为 JSON
                                            const jsonStr = Buffer.from(response.data).toString('utf8');
                                            const jsonData = JSON.parse(jsonStr);

                                            if (jsonData.error) {
                                                                 throw new Error(jsonData.error);
                                            }

                                            // 如果返回的是 base64 音频
                                            if (jsonData.audio || jsonData.audio_base64) {
                                                                 return {
                                                                                          audio_base64: jsonData.audio || jsonData.audio_base64
                                                                  };
                                            }
                           }

                           // 响应是原始音频数据，转换为 base64
                           const audioBase64 = Buffer.from(response.data).toString('base64');
                           return {
                                            audio_base64: audioBase64
                           };

              } catch (error) {
                           if (error.response) {
                                            const status = error.response.status;
                                            let errorMessage = `RunPod proxy 请求失败: ${status}`;

                                            // 尝试解析错误响应
                                            try {
                                                                 const errorData = error.response.data;
                                                                 if (Buffer.isBuffer(errorData)) {
                                                                                          const errorStr = errorData.toString('utf8');
                                                                                          try {
                                                                                                                       const errorJson = JSON.parse(errorStr);
                                                                                                                       errorMessage = errorJson.error || errorJson.message || errorMessage;
                                                                                           } catch {
                                                                                                                       errorMessage = errorStr || errorMessage;
                                                                                           }
                                                                 }
                                            } catch {}

                                            console.error(`❌ RunPod proxy 错误: ${errorMessage}`);
                                            throw new Error(errorMessage);
                           }

                           console.error(`❌ RunPod TTS 失败:`, error.message);
                           throw error;
              }
     }

     /**
          * 健康检查 - 通过 proxy 模式调用 /health 端点
               */
     async healthCheck() {
              if (!this.isConfigured()) {
                           return { status: 'not_configured' };
              }

              try {
                           const response = await axios.get(
                                            `${this.baseUrl}/proxy/health`,
                            {
                                                 headers: {
                                                                          'Authorization': `Bearer ${this.apiKey}`
                                                 },
                                                 timeout: 30000
                            }
                                        );
                           return response.data;
              } catch (error) {
                           console.error('RunPod 健康检查失败:', error.message);
                           return { status: 'error', message: error.message };
              }
     }
}

// 创建单例实例
const runPodClient = new RunPodServerlessClient();

// 创建客户端的工厂函数
export function createRunPodClient() {
     return new RunPodServerlessClient();
}

export default runPodClient;

/**
 * RunPod Serverless API 客户端
  * 将 IndexTTS2 API 请求转换为 RunPod Serverless 格式
   */

import axios from 'axios';

class RunPodServerlessClient {
      constructor() {
              this.apiKey = process.env.RUNPOD_API_KEY;
              this.endpointId = process.env.RUNPOD_ENDPOINT_ID;
              this.baseUrl = `https://api.runpod.ai/v2/${this.endpointId}`;
              this.timeout = parseInt(process.env.RUNPOD_TIMEOUT || '120000'); // 2分钟超时

              if (this.apiKey && this.endpointId) {
                        console.log(`🚀 RunPod Serverless Client初始化 | Endpoint: ${this.endpointId}`);
              }
      }

      /**
         * 检查是否已配置
            */
      isConfigured() {
              return !!(this.apiKey && this.endpointId);
      }

      /**
         * 发送同步请求到 RunPod (等待结果返回)
            * @param {Object} input - 输入参数
               * @returns {Promise<Object>} RunPod 响应
                  */
      async runsync(input) {
              if (!this.isConfigured()) {
                        throw new Error('RunPod Serverless 未配置: 缺少 RUNPOD_API_KEY 或 RUNPOD_ENDPOINT_ID');
              }

              console.log(`📤 发送 RunPod runsync 请求...`);

              const response = await axios.post(
                        `${this.baseUrl}/runsync`,
                  { input },
                  {
                              headers: {
                                            'Authorization': `Bearer ${this.apiKey}`,
                                            'Content-Type': 'application/json'
                              },
                              timeout: this.timeout
                  }
                      );

              console.log(`📥 RunPod 响应状态: ${response.data.status}`);

              if (response.data.status === 'FAILED') {
                        throw new Error(response.data.error || 'RunPod job failed');
              }

              return response.data;
      }

      /**
         * 发送异步请求到 RunPod (立即返回 job ID)
            * @param {Object} input - 输入参数
               * @returns {Promise<Object>} 包含 job ID 的响应
                  */
      async run(input) {
              if (!this.isConfigured()) {
                        throw new Error('RunPod Serverless 未配置');
              }

              const response = await axios.post(
                        `${this.baseUrl}/run`,
                  { input },
                  {
                              headers: {
                                            'Authorization': `Bearer ${this.apiKey}`,
                                            'Content-Type': 'application/json'
                              },
                              timeout: 30000
                  }
                      );

              return response.data;
      }

      /**
         * 获取异步任务状态
            * @param {string} jobId - 任务 ID
               * @returns {Promise<Object>} 任务状态
                  */
      async status(jobId) {
              const response = await axios.get(
                        `${this.baseUrl}/status/${jobId}`,
                  {
                              headers: {
                                            'Authorization': `Bearer ${this.apiKey}`
                              },
                              timeout: 10000
                  }
                      );

              return response.data;
      }

      /**
         * TTS 生成 - 适配 /api/v1/tts
            * @param {Object} params - TTS 参数
               * @returns {Promise<Object>} 包含音频数据的对象
                  */
      async tts(params) {
              console.log(`🎤 RunPod TTS | 文本长度: ${params.text?.length} | 声音: ${params.voiceId}`);

              const result = await this.runsync({
                        action: 'tts',
                        text: params.text,
                        voice_id: params.voiceId || 'default',
                        emo_vector: params.emoVector || [0.7, 0, 0.1, 0, 0, 0, 0.3, 0.3],
                        emo_alpha: params.emoAlpha || 0.8
              });

              // RunPod handler 返回 base64 编码的音频
              if (result.output && result.output.audio) {
                        console.log(`✅ RunPod TTS 成功`);
                        return {
                                    audio_base64: result.output.audio
                        };
              }

              // 如果直接返回音频数据
              if (result.output && typeof result.output === 'string') {
                        return {
                                    audio_base64: result.output
                        };
              }

              throw new Error('RunPod TTS 返回格式异常');
      }

      /**
         * callTTS - tts 方法的别名，用于兼容
            * @param {Object} params - TTS 参数
               * @returns {Promise<Object>} 包含音频数据的对象
                  */
      async callTTS(params) {
              return this.tts(params);
      }

      /**
         * 声音克隆 - 适配 /api/v1/clone
            * @param {Object} params - 克隆参数
               * @returns {Promise<Object>} 克隆结果
                  */
      async cloneVoice(params) {
              console.log(`🎤 RunPod Clone | voiceId: ${params.voiceId}`);

              const result = await this.runsync({
                        action: 'clone',
                        voice_id: params.voiceId,
                        audio_data: params.audioBase64
              });

              console.log(`✅ RunPod Clone 成功`);
              return result.output;
      }

      /**
         * callClone - cloneVoice 方法的别名，用于兼容
            * @param {Object} params - 克隆参数
               * @returns {Promise<Object>} 克隆结果
                  */
      async callClone(params) {
              return this.cloneVoice(params);
      }

      /**
         * 获取可用声音列表
            * @returns {Promise<Object>} 声音列表
               */
      async listVoices() {
              try {
                        const result = await this.runsync({
                                    action: 'list_voices'
                        });

                        return result.output;
              } catch (error) {
                        console.error('❌ 获取声音列表失败:', error.message);
                        return {
                                    voices: {
                                                  system: ['default'],
                                                  custom: []
                                    }
                        };
              }
      }

      /**
         * 健康检查
            * @returns {Promise<Object|null>} 健康状态
               */
      async checkHealth() {
              try {
                        const response = await axios.get(
                                    `${this.baseUrl}/health`,
                            {
                                          headers: {
                                                          'Authorization': `Bearer ${this.apiKey}`
                                          },
                                          timeout: 5000
                            }
                                  );

                        return response.data;
              } catch (error) {
                        console.error('❌ RunPod 健康检查失败:', error.message);
                        return null;
              }
      }
}

// 导出单例
const runpodServerlessClient = new RunPodServerlessClient();
export default runpodServerlessClient;
export { RunPodServerlessClient, createRunPodClient };

// 工厂函数 - 创建新的 RunPod 客户端实例
function createRunPodClient() {
     return new RunPodServerlessClient();
}

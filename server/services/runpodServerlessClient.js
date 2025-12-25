/**
 * RunPod Serverless API 客户端
  * 使用 RunPod Serverless 标准 API 格式调用 IndexTTS2
   */

import axios from 'axios';

class RunPodServerlessClient {
   constructor() {
        this.apiKey = process.env.RUNPOD_API_KEY;
        this.endpointId = process.env.RUNPOD_ENDPOINT_ID;
        // 使用 RunPod Serverless 标准端点
        this.baseUrl = `https://api.runpod.ai/v2/${this.endpointId}`;
        this.timeout = parseInt(process.env.RUNPOD_TIMEOUT || '180000'); // 3分钟超时

        if (this.apiKey && this.endpointId) {
               console.log(`🚀 RunPod Serverless Client初始化 | Endpoint: ${this.endpointId} | 使用 runsync 模式`);
        }
   }

   /**
      * 检查是否已配置
         */
   isConfigured() {
        return !!(this.apiKey && this.endpointId);
   }

   /**
      * 通过 RunPod Serverless /runsync 端点调用 TTS
         * @param {Object} params - TTS 参数
            * @returns {Promise<Object>} 包含音频数据的对象
               */
   async tts(params) {
        if (!this.isConfigured()) {
               throw new Error('RunPod Serverless 未配置: 缺少 RUNPOD_API_KEY 或 RUNPOD_ENDPOINT_ID');
        }

        console.log(`🎤 RunPod TTS (const runpodPayload = { input: {模式) | 文本长度: ${params.text?.length} | 声音: ${params.voiceId}`);

        // 构建 RunPod Serverless 输入参数
        // dreamolabs/indextts2-runpod 镜像使用 text 和 speaker 参数
        const voiceMapping = {
               'default': 'voice_01',
               'voice_01': 'voice_01',
               'voice_02': 'voice_02',
               'voice_03': 'voice_03',
               'voice_04': 'voice_04',
               'voice_05': 'voice_05',
               'voice_06': 'voice_06',
               'voice_07': 'voice_07',
               'voice_08': 'voice_08',
               'voice_09': 'voice_09',
               'voice_10': 'voice_10',
               'voice_11': 'voice_11',
               'voice_12': 'voice_12',
               // 映射用户友好名称到内部声音 ID
               'male_magnetic': 'voice_01',
               'female_gentle': 'voice_02',
               'male_narrator': 'voice_03',
               'female_news': 'voice_04'
        };

        const speaker = voiceMapping[params.voiceId] || voiceMapping['default'];

        // RunPod Serverless 标准格式: {"input": {...}}
              
      const runpodPayload = { input: {
               text: params.text,
                        speaker: speaker
      }};
        // 如果有情感参数，添加到输入中
        if (params.emoVector) {
               runpodPayload.input.emo_vector = params.emoVector;
        }
        if (params.emoAlpha !== undefined) {
               runpodPayload.input.emo_alpha = params.emoAlpha;
        }

        console.log(`📤 发送请求到 const runpodPayload = { input: { 端点: ${this.baseUrl}/runsync`);
        console.log(`📝 请求参数:`, JSON.stringify(runpodPayload));

        try {
               const response = await axios.post(
                        `${this.baseUrl}/runsync`,
                        runpodPayload,
                {
                           headers: {
                                        'Authorization': `Bearer ${this.apiKey}`,
                                        'Content-Type': 'application/json'
                           },
                           timeout: this.timeout
                }
                      );

               console.log(`✅ RunPod const runpodPayload = { input: { 响应:`, JSON.stringify(response.data).substring(0, 200));

               // 检查响应状态
               const result = response.data;

               if (result.status === 'FAILED') {
                        throw new Error(result.error || 'RunPod job failed');
               }

               if (result.status === 'COMPLETED' && result.output) {
                        // 检查输出格式
                        const output = result.output;

                        // 尝试多种可能的音频字段名
                        const audioData = output.audio || output.audio_base64 || output.result || output.data;

                        if (audioData) {
                                   console.log(`✅ RunPod TTS 成功 | 音频数据长度: ${audioData.length}`);
                                   return {
                                                audio_base64: audioData
                                   };
                        }

                        // 如果输出是字符串（可能直接是 base64 音频）
                        if (typeof output === 'string') {
                                   console.log(`✅ RunPod TTS 成功 | 音频数据长度: ${output.length}`);
                                   return {
                                                audio_base64: output
                                   };
                        }

                        throw new Error('RunPod output does not contain audio data');
               }

               // 如果状态是 IN_QUEUE 或 IN_PROGRESS，需要轮询
               if (result.status === 'IN_QUEUE' || result.status === 'IN_PROGRESS') {
                        console.log(`⏳ RunPod job ${result.status}, 开始轮询...`);
                        return await this.pollStatus(result.id);
               }

               throw new Error(`Unexpected RunPod status: ${result.status}`);

        } catch (error) {
               if (error.response) {
                        const status = error.response.status;
                        let errorMessage = `RunPod const runpodPayload = { input: { 请求失败: ${status}`;

                        try {
                                   const errorData = error.response.data;
                                   if (errorData && typeof errorData === 'object') {
                                                errorMessage = errorData.error || errorData.message || JSON.stringify(errorData);
                                   } else if (typeof errorData === 'string') {
                                                errorMessage = errorData || errorMessage;
                                   }
                        } catch {}

                        console.error(`❌ RunPod const runpodPayload = { input: { 错误: ${errorMessage}`);
                        throw new Error(errorMessage);
               }

               console.error(`❌ RunPod TTS 失败:`, error.message);
               throw error;
        }
   }

   /**
      * 轮询任务状态
         */
   async pollStatus(jobId, maxAttempts = 180) {
        const pollInterval = 2000; // 2秒轮询一次

        for (let attempt = 0; attempt < maxAttempts; attempt++) {
               try {
                        const response = await axios.get(
                                   `${this.baseUrl}/status/${jobId}`,
                         {
                                      headers: {
                                                     'Authorization': `Bearer ${this.apiKey}`
                                      },
                                      timeout: 30000
                         }
                                 );

                        const result = response.data;
                        console.log(`📊 轮询 ${attempt + 1}/${maxAttempts} | 状态: ${result.status}`);

                        if (result.status === 'COMPLETED' && result.output) {
                                   const output = result.output;
                                   const audioData = output.audio || output.audio_base64 || output.result || output.data;

                                   if (audioData) {
                                                console.log(`✅ 轮询完成 | 音频数据长度: ${audioData.length}`);
                                                return {
                                                               audio_base64: audioData
                                                };
                                   }

                                   if (typeof output === 'string') {
                                                return {
                                                               audio_base64: output
                                                };
                                   }

                                   throw new Error('RunPod output does not contain audio data');
                        }

                        if (result.status === 'FAILED') {
                                   throw new Error(result.error || 'RunPod job failed');
                        }

                        // 继续等待
                        await new Promise(resolve => setTimeout(resolve, pollInterval));

               } catch (error) {
                        if (error.response?.status === 404) {
                                   // Job 不存在，可能已过期
                                   throw new Error('RunPod job not found or expired');
                        }
                        throw error;
               }
        }

        throw new Error('RunPod job timeout after polling');
   }

   /**
      * 健康检查 - 检查 endpoint 是否可用
         */
   async healthCheck() {
        if (!this.isConfigured()) {
               return { status: 'not_configured' };
        }

        try {
               const response = await axios.get(
                        `${this.baseUrl}/health`,
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

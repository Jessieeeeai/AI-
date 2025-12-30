/**
 * RunPod Serverless API 客户端
  * 使用 RunPod Serverless 标准 API 格式调用 IndexTTS2
   * 支持自定义声音克隆
    */

import axios from 'axios';

class RunPodServerlessClient {
   constructor() {
        this.apiKey = process.env.RUNPOD_API_KEY;
        this.endpointId = process.env.RUNPOD_ENDPOINT_ID;
        // 使用 RunPod Serverless 标准端点
        this.baseUrl = `https://api.runpod.ai/v2/${this.endpointId}`;
        this.timeout = parseInt(process.env.RUNPOD_TIMEOUT || '180000'); // 3分钟超时
        // IndexTTS2 GPU Pod 直连 URL（用于自定义声音）
        this.indexTTS2Url = process.env.INDEXTTS2_URL || null;

        if (this.apiKey && this.endpointId) {
               console.log(`🚀 RunPod Serverless Client初始化 | Endpoint: ${this.endpointId} | 使用 runsync 模式`);
        }
        if (this.indexTTS2Url) {
               console.log(`🎤 IndexTTS2 GPU Pod URL: ${this.indexTTS2Url}`);
        }
   }

   /**
      * 检查是否已配置
         */
   isConfigured() {
        return !!(this.apiKey && this.endpointId);
   }

   /**
      * 检查 voiceId 是否是自定义声音（UUID格式）
         */
   isCustomVoice(voiceId) {
        if (!voiceId) return false;
        // UUID 格式: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        return uuidRegex.test(voiceId);
   }

   /**
      * 通过 RunPod Serverless /runsync 端点调用 TTS
         * @param {Object} params - TTS 参数
            * @param {string} params.text - 要合成的文本
               * @param {string} params.voiceId - 声音ID（预设声音或自定义UUID）
                  * @param {string} [params.promptAudioUrl] - 自定义声音的音频URL（R2存储）
                     * @param {string} [params.promptAudioBase64] - 自定义声音的音频Base64
                        * @returns {Promise<Object>} 包含音频数据的对象
                           */
   async tts(params) {
        if (!this.isConfigured()) {
               throw new Error('RunPod Serverless 未配置: 缺少 RUNPOD_API_KEY 或 RUNPOD_ENDPOINT_ID');
        }

        const isCustom = this.isCustomVoice(params.voiceId);
        console.log(`🎤 RunPod TTS | 文本长度: ${params.text?.length} | 声音: ${params.voiceId} | 自定义声音: ${isCustom}`);

        // 预设声音映射
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
               'male_magnetic': 'voice_01',
               'female_gentle': 'voice_02',
               'male_narrator': 'voice_03',
               'female_news': 'voice_04'
        };

        // 构建请求参数
        let runpodPayload;

        if (isCustom && (params.promptAudioUrl || params.promptAudioBase64)) {
               // 自定义声音：使用 prompt_audio 参数
               console.log(`🎯 使用自定义声音克隆模式`);

               let promptAudioBase64 = params.promptAudioBase64;

               // 如果提供的是URL，需要下载并转换为base64
               if (!promptAudioBase64 && params.promptAudioUrl) {
                        console.log(`📥 下载自定义声音文件: ${params.promptAudioUrl}`);
                        try {
                                   const audioResponse = await axios({
                                                method: 'GET',
                                                url: params.promptAudioUrl,
                                                responseType: 'arraybuffer',
                                                timeout: 30000
                                   });
                                   promptAudioBase64 = Buffer.from(audioResponse.data).toString('base64');
                                   console.log(`✅ 声音文件下载成功, 大小: ${audioResponse.data.byteLength} bytes`);
                        } catch (downloadError) {
                                   console.error(`❌ 下载声音文件失败:`, downloadError.message);
                                   throw new Error(`无法下载自定义声音文件: ${downloadError.message}`);
                        }
               }

               runpodPayload = {
                        input: {
                                   text: params.text,
                                   prompt_audio: promptAudioBase64  // 使用用户上传的音频作为参考
                        }
               };
        } else {
               // 预设声音：使用 speaker 参数
               const speaker = voiceMapping[params.voiceId] || voiceMapping['default'];
               console.log(`🎯 使用预设声音: ${speaker}`);

               runpodPayload = {
                        input: {
                                   text: params.text,
                                   speaker: speaker
                        }
               };
        }

        // 添加情感参数
        if (params.emoVector) {
               runpodPayload.input.emo_vector = params.emoVector;
        }
        if (params.emoAlpha !== undefined) {
               runpodPayload.input.emo_alpha = params.emoAlpha;
        }

        console.log(`📤 发送请求到: ${this.baseUrl}/runsync`);
        console.log(`📝 请求参数:`, JSON.stringify({
               ...runpodPayload,
               input: {
                        ...runpodPayload.input,
                        prompt_audio: runpodPayload.input.prompt_audio ? '[BASE64_AUDIO]' : undefined
               }
        }));

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

               console.log(`✅ RunPod 响应:`, JSON.stringify(response.data).substring(0, 200));

               const result = response.data;

               if (result.status === 'FAILED') {
                        throw new Error(result.error || 'RunPod job failed');
               }

               if (result.status === 'COMPLETED' && result.output) {
                        const output = result.output;
                        const audioData = output.audio || output.audio_base64 || output.result || output.data;

                        if (audioData) {
                                   console.log(`✅ RunPod TTS 成功 | 音频数据长度: ${audioData.length}`);
                                   return { audio_base64: audioData };
                        }

                        if (typeof output === 'string') {
                                   console.log(`✅ RunPod TTS 成功 | 音频数据长度: ${output.length}`);
                                   return { audio_base64: output };
                        }

                        throw new Error('RunPod output does not contain audio data');
               }

               if (result.status === 'IN_QUEUE' || result.status === 'IN_PROGRESS') {
                        console.log(`⏳ RunPod job ${result.status}, 开始轮询...`);
                        return await this.pollStatus(result.id);
               }

               throw new Error(`Unexpected RunPod status: ${result.status}`);

        } catch (error) {
               if (error.response) {
                        const status = error.response.status;
                        let errorMessage = `RunPod 请求失败: ${status}`;

                        try {
                                   const errorData = error.response.data;
                                   if (errorData && typeof errorData === 'object') {
                                                errorMessage = errorData.error || errorData.message || JSON.stringify(errorData);
                                   } else if (typeof errorData === 'string') {
                                                errorMessage = errorData || errorMessage;
                                   }
                        } catch {}

                        console.error(`❌ RunPod 错误: ${errorMessage}`);
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
        const pollInterval = 2000;

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
                                                return { audio_base64: audioData };
                                   }

                                   if (typeof output === 'string') {
                                                return { audio_base64: output };
                                   }

                                   throw new Error('RunPod output does not contain audio data');
                        }

                        if (result.status === 'FAILED') {
                                   throw new Error(result.error || 'RunPod job failed');
                        }

                        await new Promise(resolve => setTimeout(resolve, pollInterval));

               } catch (error) {
                        if (error.response?.status === 404) {
                                   throw new Error('RunPod job not found or expired');
                        }
                        throw error;
               }
        }

        throw new Error('RunPod job timeout after polling');
   }

   /**
      * 健康检查
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

   /**
      * 声音克隆
         */
   async callClone(params) {
        if (!this.isConfigured()) {
               throw new Error('RunPod Serverless 未配置');
        }

        console.log(`🎤 RunPod 声音克隆 | voiceId: ${params.voiceId}`);

        const runpodPayload = {
               input: {
                        text: "这是一个测试语音克隆的句子。",
                        prompt_audio: params.audioBase64,
                        voice_id: params.voiceId
               }
        };

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

               const result = response.data;

               if (result.status === 'FAILED') {
                        throw new Error(result.error || 'RunPod clone job failed');
               }

               if (result.status === 'COMPLETED' && result.output) {
                        return {
                                   success: true,
                                   voiceId: params.voiceId,
                                   output: result.output
                        };
               }

               if (result.status === 'IN_QUEUE' || result.status === 'IN_PROGRESS') {
                        const pollResult = await this.pollStatus(result.id);
                        return {
                                   success: true,
                                   voiceId: params.voiceId,
                                   output: pollResult
                        };
               }

               throw new Error(`Unexpected status: ${result.status}`);

        } catch (error) {
               console.error(`❌ 声音克隆失败:`, error.message);
               throw error;
        }
   }

   /**
      * 获取声音列表
         */
   async listVoices() {
        return {
               voices: {
                        system: ['voice_01', 'voice_02', 'voice_03', 'voice_04', 'voice_05',
                                                  'voice_06', 'voice_07', 'voice_08', 'voice_09', 'voice_10',
                                                  'voice_11', 'voice_12'],
                        custom: []
               }
        };
   }

   async checkHealth() {
        return this.healthCheck();
   }
}

const runPodClient = new RunPodServerlessClient();

export function createRunPodClient() {
   return new RunPodServerlessClient();
}

export default runPodClient;

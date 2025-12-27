import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dbRun, dbGet } from '../config/database.js';
import { aiServicesConfig } from '../config/aiServices.js';
import runpodClient from './runpodServerlessClient.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 声音克隆服务
  * 负责与 IndexTTS2 服务通信，处理声音克隆任务
   * 支持Mock模式（CPU）和Real模式（GPU）
    * 支持 RunPod Serverless API
     */
class VoiceCloneService {
    constructor() {
          this.indextts2Url = aiServicesConfig.indexTTS2.apiUrl;
          this.timeout = aiServicesConfig.indexTTS2.timeout;
          this.useMock = aiServicesConfig.useMock;
          this.useRunPodServerless = aiServicesConfig.useRunPodServerless;
          this.maxRetries = 3;

          console.log(`🎤 VoiceCloneService初始化 | 模式: ${this.useMock ? 'Mock (CPU)' : 'Real (GPU)'} | RunPod: ${this.useRunPodServerless ? '启用' : '禁用'}`);
    }

    /**
       * 检查 IndexTTS2 服务健康状态
          */
    async checkHealth() {
          try {
                  if (this.useRunPodServerless) {
                            // 使用RunPod健康检查
                            return await runpodClient.checkHealth();
                  }

                  const response = await axios.get(`${this.indextts2Url}/health`, {
                            timeout: 5000
                  });
                  return response.data;
          } catch (error) {
                  console.error('❌ IndexTTS2 服务不可用:', error.message);
                  return null;
          }
    }

    /**
       * 克隆声音
          * @param {string} voiceId - 声音ID
             * @param {string} audioPath - 音频文件路径（绝对路径）
                * @returns {Promise<Object>} 克隆结果
                   */
    async cloneVoice(voiceId, audioPath) {
          try {
                  console.log(`🎤 开始克隆声音: ${voiceId} | 文件: ${audioPath} | RunPod: ${this.useRunPodServerless}`);

                  // 检查文件是否存在
                  if (!fs.existsSync(audioPath)) {
                            throw new Error(`音频文件不存在: ${audioPath}`);
                  }

                  if (this.useRunPodServerless) {
                            // 使用RunPod Serverless API
                            console.log('📡 通过RunPod Serverless克隆声音...');

                            // 读取音频文件并转为base64
                            const audioBuffer = fs.readFileSync(audioPath);
                            const audioBase64 = audioBuffer.toString('base64');

                            const result = await runpodClient.callClone({
                                        voiceId,
                                        audioBase64,
                                        audioFilename: path.basename(audioPath)
                            });

                            console.log(`✅ 声音克隆成功 (RunPod): ${voiceId}`);
                            return result;
                  } else {
                            // 直接调用IndexTTS2 API
                            console.log('📡 直接调用IndexTTS2 API克隆声音...');

                            // 准备表单数据
                            const formData = new FormData();
                            formData.append('voiceId', voiceId);
                            formData.append('audioFile', fs.createReadStream(audioPath));

                            // 发送克隆请求
                            const response = await axios.post(
                                        `${this.indextts2Url}/api/v1/clone`,
                                        formData,
                              {
                                            headers: {
                                                            ...formData.getHeaders()
                                            },
                                            timeout: 60000, // 60秒超时
                                            maxContentLength: Infinity,
                                            maxBodyLength: Infinity
                              }
                                      );

                            console.log(`✅ 声音克隆成功: ${voiceId}`);
                            return response.data;
                  }
          } catch (error) {
                  console.error(`❌ 声音克隆失败: ${voiceId}`, error.message);
                  if (error.response) {
                            throw new Error(error.response.data.message || '克隆请求失败');
                  } else if (error.code === 'ECONNREFUSED') {
                            throw new Error('IndexTTS2 服务不可用');
                  } else {
                            throw error;
                  }
          }
    }

    /**
       * 使用服务器路径克隆声音（更高效）
          */
    async cloneVoiceByPath(voiceId, audioPath) {
          try {
                  console.log(`🎤 使用路径克隆声音: ${voiceId} | 路径: ${audioPath} | RunPod: ${this.useRunPodServerless}`);

                  if (this.useRunPodServerless) {
                            // RunPod模式下，需要读取文件并转换为base64
                            // 因为RunPod Serverless无法访问本地文件系统
                            if (fs.existsSync(audioPath)) {
                                        const audioBuffer = fs.readFileSync(audioPath);
                                        const audioBase64 = audioBuffer.toString('base64');

                                        const result = await runpodClient.callClone({
                                                      voiceId,
                                                      audioBase64,
                                                      audioFilename: path.basename(audioPath)
                                        });

                                        console.log(`✅ 声音克隆成功 (RunPod): ${voiceId}`);
                                        return result;
                            } else {
                                        throw new Error(`音频文件不存在: ${audioPath}`);
                            }
                  } else {
                            // 直接调用IndexTTS2 API
                            const response = await axios.post(
                                        `${this.indextts2Url}/api/v1/clone`,
                              {
                                            voiceId,
                                            audioPath
                              },
                              {
                                            headers: {
                                                            'Content-Type': 'application/json'
                                            },
                                            timeout: 60000
                              }
                                      );

                            console.log(`✅ 声音克隆成功: ${voiceId}`);
                            return response.data;
                  }
          } catch (error) {
                  console.error(`❌ 声音克隆失败: ${voiceId}`, error.message);
                  throw error;
          }
    }

    /**
       * 处理用户上传的声音文件
          * @param {string} voiceId - 数据库中的声音ID
             * @param {number} userId - 用户ID
                */
    async processUserVoice(voiceId, userId) {
          try {
                  console.log(`🔄 处理用户声音: ${voiceId} | 用户: ${userId}`);

                  // 1. 从数据库获取声音信息
                  const voice = await dbGet(
                            'SELECT * FROM user_voices WHERE id = ? AND user_id = ?',
                            [voiceId, userId]
                          );

                  if (!voice) {
                            throw new Error('声音记录不存在');
                  }

// 2. 获取音频路径或URL
                   let audioPath;
                   const isHttpUrl = voice.audio_url.startsWith('http://') || voice.audio_url.startsWith('https://');

                   if (isHttpUrl) {
                                // R2存储的HTTP URL，直接使用
                                audioPath = voice.audio_url;
                                console.log('🌐 使用R2 HTTP URL:', audioPath);
                   } else {
                                // 本地文件路径
                                audioPath = path.join(__dirname, '../../', voice.audio_url);
                                if (!fs.existsSync(audioPath)) {
                                                 throw new Error(`音频文件不存在: ${audioPath}`);
                                }
                                console.log('📁 使用本地文件:', audioPath);
                   }

                  // 3. 更新状态为处理中
                  await dbRun(
                            'UPDATE user_voices SET status = ? WHERE id = ?',
                            ['processing', voiceId]
                          );

                  // 4. 执行声音克隆
                  await this.cloneVoice(voiceId, audioPath);

                  // 5. 更新状态为就绪
                  await dbRun(
                            'UPDATE user_voices SET status = ?, processed_at = CURRENT_TIMESTAMP WHERE id = ?',
                            ['ready', voiceId]
                          );

                  console.log(`✅ 用户声音处理完成: ${voiceId}`);
                  return {
                            success: true,
                            voiceId: voiceId,
                            status: 'ready'
                  };
          } catch (error) {
                  console.error(`❌ 处理用户声音失败: ${voiceId}`, error);

                  // 更新状态为失败
                  await dbRun(
                            'UPDATE user_voices SET status = ?, error_message = ? WHERE id = ?',
                            ['failed', error.message, voiceId]
                          );

                  throw error;
          }
    }

    /**
       * 批量处理待处理的声音
          */
    async processQueue() {
          try {
                  const pendingVoices = await dbAll(
                            "SELECT * FROM user_voices WHERE status = 'processing' ORDER BY created_at ASC LIMIT 10"
                          );

                  console.log(`📋 队列中有 ${pendingVoices.length} 个待处理声音`);

                  for (const voice of pendingVoices) {
                            try {
                                        await this.processUserVoice(voice.id, voice.user_id);
                            } catch (error) {
                                        console.error(`⚠️ 处理声音失败: ${voice.id}`, error.message);
                                        // 继续处理下一个
                  }
                  }
          } catch (error) {
                  console.error('❌ 处理队列失败:', error);
          }
    }

    /**
       * 获取可用的声音列表
          */
    async listVoices() {
          try {
                  if (this.useRunPodServerless) {
                            // RunPod模式下，调用RunPod获取声音列表
                            const result = await runpodClient.listVoices();
                            return result;
                  }

                  const response = await axios.get(`${this.indextts2Url}/api/v1/voices`, {
                            timeout: 5000
                  });
                  return response.data;
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
}

// 导出单例
const voiceCloneService = new VoiceCloneService();
export default voiceCloneService;
export { VoiceCloneService };

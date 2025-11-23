import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dbRun, dbGet } from '../config/database.js';
import { aiServicesConfig } from '../config/aiServices.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 声音克隆服务
 * 负责与 IndexTTS2 服务通信，处理声音克隆任务
 * 支持Mock模式（CPU）和Real模式（GPU）
 */
class VoiceCloneService {
  constructor() {
    this.indextts2Url = aiServicesConfig.indexTTS2.apiUrl;
    this.timeout = aiServicesConfig.indexTTS2.timeout;
    this.useMock = aiServicesConfig.useMock;
    this.maxRetries = 3;
    
    console.log(`🎤 VoiceCloneService初始化 | 模式: ${this.useMock ? 'Mock (CPU)' : 'Real (GPU)'}`);
  }

  /**
   * 检查 IndexTTS2 服务健康状态
   */
  async checkHealth() {
    try {
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
      console.log(`🎤 开始克隆声音: ${voiceId} | 文件: ${audioPath}`);

      // 检查文件是否存在
      if (!fs.existsSync(audioPath)) {
        throw new Error(`音频文件不存在: ${audioPath}`);
      }

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
      console.log(`🎤 使用路径克隆声音: ${voiceId} | 路径: ${audioPath}`);

      const response = await axios.post(
        `${this.indextts2Url}/api/v1/clone`,
        { voiceId, audioPath },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 60000
        }
      );

      console.log(`✅ 声音克隆成功: ${voiceId}`);
      return response.data;

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

      // 2. 构建音频文件的绝对路径
      const audioPath = path.join(__dirname, '../../', voice.audio_url);

      if (!fs.existsSync(audioPath)) {
        throw new Error(`音频文件不存在: ${audioPath}`);
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
          console.error(`⚠️  处理声音失败: ${voice.id}`, error.message);
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
      const response = await axios.get(`${this.indextts2Url}/api/v1/voices`, {
        timeout: 5000
      });
      return response.data;
    } catch (error) {
      console.error('❌ 获取声音列表失败:', error.message);
      return { voices: { system: ['default'], custom: [] } };
    }
  }
}

// 导出单例
const voiceCloneService = new VoiceCloneService();

export default voiceCloneService;
export { VoiceCloneService };

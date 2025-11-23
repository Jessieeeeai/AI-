/**
 * 视频生成服务
 * 支持Mock模式（CPU开发）和Real模式（GPU生产）
 */

import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { promisify } from 'util';
import { exec } from 'child_process';
import { v4 as uuidv4 } from 'uuid';
import { dbRun, dbGet, dbAll } from '../config/database.js';
import { aiServicesConfig } from '../config/aiServices.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const execPromise = promisify(exec);

/**
 * 视频生成服务类
 */
class VideoGenerationService {
  constructor() {
    this.indextts2Url = aiServicesConfig.indexTTS2.apiUrl;
    this.comfyuiUrl = aiServicesConfig.comfyUI.apiUrl;
    this.useMock = aiServicesConfig.useMock;
    
    this.audioOutputDir = aiServicesConfig.storage.audioOutputDir;
    this.videoOutputDir = aiServicesConfig.storage.videoOutputDir;
    
    // 确保输出目录存在
    this.ensureDirectories();
    
    console.log(`🎬 VideoGenerationService初始化 | 模式: ${this.useMock ? 'Mock (CPU)' : 'Real (GPU)'}`);
  }

  /**
   * 确保必要目录存在
   */
  ensureDirectories() {
    const dirs = [this.audioOutputDir, this.videoOutputDir];
    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`📁 创建目录: ${dir}`);
      }
    });
  }

  /**
   * 文本分段
   * 将长文本智能分割为适合TTS的短句
   * @param {string} text - 输入文本
   * @param {number} maxLength - 每段最大长度
   * @returns {Array<string>} 分段后的文本数组
   */
  segmentText(text, maxLength = 100) {
    console.log(`✂️ 开始文本分段 | 原始长度: ${text.length} | 最大段长: ${maxLength}`);

    // 按标点符号分割
    const sentenceEndings = /([。！？；.!?;])/g;
    const sentences = text.split(sentenceEndings).reduce((acc, curr, idx, arr) => {
      if (idx % 2 === 0 && arr[idx + 1]) {
        acc.push(curr + arr[idx + 1]);
      } else if (idx % 2 === 0) {
        acc.push(curr);
      }
      return acc;
    }, []).filter(s => s.trim());

    // 合并短句
    const segments = [];
    let currentSegment = '';

    for (const sentence of sentences) {
      if (currentSegment.length + sentence.length <= maxLength) {
        currentSegment += sentence;
      } else {
        if (currentSegment) {
          segments.push(currentSegment.trim());
        }
        currentSegment = sentence;
      }
    }

    if (currentSegment) {
      segments.push(currentSegment.trim());
    }

    console.log(`✅ 文本分段完成 | 分段数: ${segments.length}`);
    return segments;
  }

  /**
   * 生成TTS音频
   * @param {string} text - 文本内容
   * @param {string} voiceId - 声音ID
   * @param {string} outputPath - 输出路径
   * @returns {Promise<string>} 生成的音频文件路径
   */
  async generateTTS(text, voiceId = 'default', outputPath = null) {
    try {
      console.log(`🎤 生成TTS | 文本长度: ${text.length} | 声音: ${voiceId}`);

      const response = await axios.post(
        `${this.indextts2Url}/api/v1/tts`,
        {
          text,
          voiceId,
          emoVector: [0.7, 0, 0.1, 0, 0, 0, 0.3, 0.3],
          emoAlpha: 0.8
        },
        {
          responseType: 'arraybuffer',
          timeout: aiServicesConfig.indexTTS2.timeout
        }
      );

      // 保存音频
      if (!outputPath) {
        outputPath = path.join(this.audioOutputDir, `tts_${Date.now()}_${uuidv4()}.wav`);
      }

      fs.writeFileSync(outputPath, Buffer.from(response.data));
      console.log(`✅ TTS生成成功: ${outputPath}`);

      return outputPath;

    } catch (error) {
      console.error('❌ TTS生成失败:', error.message);
      throw new Error(`TTS生成失败: ${error.message}`);
    }
  }

  /**
   * 合并多个音频文件
   * 使用FFmpeg将多个音频片段合并为一个完整音频
   * @param {Array<string>} audioPaths - 音频文件路径数组
   * @param {string} outputPath - 输出路径
   * @returns {Promise<string>} 合并后的音频路径
   */
  async mergeAudios(audioPaths, outputPath = null) {
    try {
      console.log(`🔗 合并音频 | 片段数: ${audioPaths.length}`);

      if (!outputPath) {
        outputPath = path.join(this.audioOutputDir, `merged_${Date.now()}.wav`);
      }

      // 创建FFmpeg文件列表
      const listFile = path.join(this.audioOutputDir, `concat_${Date.now()}.txt`);
      const fileContent = audioPaths.map(p => `file '${path.resolve(p)}'`).join('\n');
      fs.writeFileSync(listFile, fileContent);

      // 使用FFmpeg合并
      const command = `ffmpeg -f concat -safe 0 -i "${listFile}" -c copy "${outputPath}"`;
      await execPromise(command);

      // 清理临时文件
      fs.unlinkSync(listFile);
      audioPaths.forEach(p => {
        if (fs.existsSync(p)) fs.unlinkSync(p);
      });

      console.log(`✅ 音频合并成功: ${outputPath}`);
      return outputPath;

    } catch (error) {
      console.error('❌ 音频合并失败:', error.message);
      throw new Error(`音频合并失败: ${error.message}`);
    }
  }

  /**
   * 生成完整文本音频（自动分段+TTS+合并）
   * @param {string} text - 完整文本
   * @param {string} voiceId - 声音ID
   * @returns {Promise<string>} 最终音频路径
   */
  async generateFullTextAudio(text, voiceId = 'default') {
    try {
      console.log(`🎙️ 生成完整文本音频 | 文本长度: ${text.length}`);

      // 1. 文本分段
      const segments = this.segmentText(text);

      // 2. 为每段生成TTS
      const audioPaths = [];
      for (let i = 0; i < segments.length; i++) {
        const segment = segments[i];
        const segmentPath = await this.generateTTS(
          segment,
          voiceId,
          path.join(this.audioOutputDir, `segment_${i}_${Date.now()}.wav`)
        );
        audioPaths.push(segmentPath);
      }

      // 3. 合并所有音频
      if (audioPaths.length === 1) {
        return audioPaths[0];
      } else {
        return await this.mergeAudios(audioPaths);
      }

    } catch (error) {
      console.error('❌ 生成完整文本音频失败:', error);
      throw error;
    }
  }

  /**
   * 构建ComfyUI工作流
   * 根据模板和参数构建视频生成工作流
   * @param {Object} params - 工作流参数
   * @returns {Object} ComfyUI工作流JSON
   */
  buildWorkflow(params) {
    const {
      templateVideoPath,
      audioPath,
      outputFilename = `output_${Date.now()}.mp4`
    } = params;

    console.log(`🔧 构建ComfyUI工作流 | 模板: ${templateVideoPath} | 音频: ${audioPath}`);

    // 基础Wav2Lip工作流
    const workflow = {
      "1": {
        "class_type": "LoadVideo",
        "inputs": {
          "video": templateVideoPath
        }
      },
      "2": {
        "class_type": "LoadAudio",
        "inputs": {
          "audio": audioPath
        }
      },
      "3": {
        "class_type": "Wav2Lip",
        "inputs": {
          "video_frames": ["1", 0],
          "audio": ["2", 0],
          "face_detect": "retinaface",
          "mel_step_size": 16,
          "quality": "improved"
        }
      },
      "4": {
        "class_type": "SaveVideo",
        "inputs": {
          "frames": ["3", 0],
          "filename_prefix": outputFilename.replace('.mp4', ''),
          "format": "video/h264-mp4",
          "fps": 25,
          "quality": 90
        }
      }
    };

    return workflow;
  }

  /**
   * 提交ComfyUI任务
   * @param {Object} workflow - 工作流JSON
   * @returns {Promise<string>} 任务ID (prompt_id)
   */
  async submitComfyUIJob(workflow) {
    try {
      console.log(`📤 提交ComfyUI任务 | 节点数: ${Object.keys(workflow).length}`);

      const response = await axios.post(
        `${this.comfyuiUrl}/prompt`,
        {
          prompt: workflow,
          client_id: `videoai_${Date.now()}`
        },
        {
          timeout: 10000
        }
      );

      const promptId = response.data.prompt_id;
      console.log(`✅ 任务提交成功 | ID: ${promptId}`);

      return promptId;

    } catch (error) {
      console.error('❌ 提交ComfyUI任务失败:', error.message);
      throw new Error(`ComfyUI任务提交失败: ${error.message}`);
    }
  }

  /**
   * 轮询ComfyUI任务状态
   * @param {string} promptId - 任务ID
   * @param {number} maxWaitTime - 最大等待时间（毫秒）
   * @returns {Promise<Object>} 任务结果
   */
  async pollJobStatus(promptId, maxWaitTime = 300000) {
    const startTime = Date.now();
    const pollInterval = 2000; // 2秒轮询一次

    console.log(`⏳ 开始轮询任务状态 | ID: ${promptId} | 最大等待: ${maxWaitTime / 1000}s`);

    while (Date.now() - startTime < maxWaitTime) {
      try {
        const response = await axios.get(`${this.comfyuiUrl}/history/${promptId}`);
        const history = response.data[promptId];

        if (history && history.status && history.status.completed) {
          console.log(`✅ 任务完成 | ID: ${promptId}`);
          return history;
        }

        // 等待后继续轮询
        await new Promise(resolve => setTimeout(resolve, pollInterval));

      } catch (error) {
        console.error(`⚠️  轮询任务状态失败: ${error.message}`);
      }
    }

    throw new Error(`任务超时: ${promptId}`);
  }

  /**
   * 下载ComfyUI生成的视频
   * @param {string} filename - 文件名
   * @param {string} outputPath - 本地保存路径
   * @returns {Promise<string>} 本地文件路径
   */
  async downloadVideo(filename, outputPath = null) {
    try {
      console.log(`📥 下载视频 | 文件名: ${filename}`);

      if (!outputPath) {
        outputPath = path.join(this.videoOutputDir, filename);
      }

      const response = await axios.get(
        `${this.comfyuiUrl}/view?filename=${filename}`,
        {
          responseType: 'stream',
          timeout: 60000
        }
      );

      const writer = fs.createWriteStream(outputPath);
      response.data.pipe(writer);

      return new Promise((resolve, reject) => {
        writer.on('finish', () => {
          console.log(`✅ 视频下载成功: ${outputPath}`);
          resolve(outputPath);
        });
        writer.on('error', reject);
      });

    } catch (error) {
      console.error('❌ 视频下载失败:', error.message);
      throw new Error(`视频下载失败: ${error.message}`);
    }
  }

  /**
   * 生成视频（完整流程）
   * @param {Object} params - 视频生成参数
   * @returns {Promise<Object>} 生成结果
   */
  async generateVideo(params) {
    const {
      text,
      voiceId = 'default',
      templateId,
      projectId,
      userId
    } = params;

    try {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🎬 开始视频生成流程');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      // 1. 生成音频
      console.log('📍 步骤1: 生成音频...');
      const audioPath = await this.generateFullTextAudio(text, voiceId);

      // 2. 获取模板视频
      console.log('📍 步骤2: 获取模板视频...');
      const template = await dbGet('SELECT * FROM templates WHERE id = ?', [templateId]);
      if (!template) {
        throw new Error(`模板不存在: ${templateId}`);
      }

      // 3. 构建ComfyUI工作流
      console.log('📍 步骤3: 构建工作流...');
      const workflow = this.buildWorkflow({
        templateVideoPath: template.video_url,
        audioPath,
        outputFilename: `video_${projectId}_${Date.now()}.mp4`
      });

      // 4. 提交ComfyUI任务
      console.log('📍 步骤4: 提交任务...');
      const promptId = await this.submitComfyUIJob(workflow);

      // 5. 等待任务完成
      console.log('📍 步骤5: 等待生成...');
      const result = await this.pollJobStatus(promptId);

      // 6. 下载视频
      console.log('📍 步骤6: 下载视频...');
      const outputFilename = result.outputs['4'].videos[0].filename;
      const localVideoPath = await this.downloadVideo(outputFilename);

      // 7. 更新数据库
      console.log('📍 步骤7: 更新数据库...');
      await dbRun(
        `UPDATE projects SET 
          video_url = ?, 
          audio_url = ?,
          status = ?,
          completed_at = CURRENT_TIMESTAMP
        WHERE id = ?`,
        [localVideoPath, audioPath, 'completed', projectId]
      );

      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('✅ 视频生成完成！');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      return {
        success: true,
        videoUrl: localVideoPath,
        audioUrl: audioPath,
        projectId
      };

    } catch (error) {
      console.error('❌ 视频生成失败:', error);

      // 更新项目状态为失败
      if (projectId) {
        await dbRun(
          'UPDATE projects SET status = ?, error_message = ? WHERE id = ?',
          ['failed', error.message, projectId]
        );
      }

      throw error;
    }
  }
}

// 导出单例
const videoGenerationService = new VideoGenerationService();

export default videoGenerationService;
export { VideoGenerationService };

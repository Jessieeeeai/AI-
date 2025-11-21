/**
 * 视频生成Worker
 * 
 * 完整流程：
 * 1. 从队列获取任务
 * 2. 调用IndexTTS2生成音频
 * 3. 调用ComfyUI生成视频
 * 4. 如果分段，则合并视频
 * 5. 更新任务状态
 */

import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { dbRun, dbGet } from '../config/database.js';
import videoMergeService from '../services/videoMergeService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class VideoGenerationWorker {
  constructor() {
    // API地址
    this.ttsApiUrl = process.env.INDEXTTS2_API_URL || 'http://localhost:5000';
    this.comfyuiApiUrl = process.env.COMFYUI_API_URL || 'http://localhost:8188';
    
    // 文件存储路径
    this.generatedDir = path.join(__dirname, '../../public/generated');
    
    // 确保目录存在
    this.ensureDirectories();
  }

  /**
   * 确保必要的目录存在
   */
  async ensureDirectories() {
    await fs.mkdir(this.generatedDir, { recursive: true });
  }

  /**
   * 处理视频生成任务
   */
  async processTask(taskId) {
    console.log(`\n🎬 开始处理任务: ${taskId}`);
    
    try {
      // 获取任务信息
      const task = await this.getTask(taskId);
      if (!task) {
        throw new Error('任务不存在');
      }

      console.log('📋 任务信息:', {
        text: task.text?.substring(0, 50) + '...',
        needsSegmentation: task.needs_segmentation,
        segmentCount: task.segment_count
      });

      // 更新状态为处理中
      await this.updateTaskStatus(taskId, 'processing', 10);

      let finalVideoPath;

      if (task.needs_segmentation && task.segment_data) {
        // 分段生成
        finalVideoPath = await this.processSegmentedVideo(task);
      } else {
        // 单段生成
        finalVideoPath = await this.processSingleVideo(task);
      }

      // 完成任务
      await this.completeTask(taskId, finalVideoPath);
      
      console.log('✅ 任务完成:', taskId);
      return { success: true, videoPath: finalVideoPath };

    } catch (error) {
      console.error('❌ 任务失败:', error);
      await this.failTask(taskId, error.message);
      throw error;
    }
  }

  /**
   * 处理单段视频
   */
  async processSingleVideo(task) {
    console.log('🎥 生成单段视频...');

    // Step 1: 生成音频
    await this.updateTaskStatus(task.id, 'processing', 20, '正在生成语音...');
    const audioPath = await this.generateAudio(
      task.text,
      task.voice_id,
      JSON.parse(task.voice_settings || '{}')
    );

    // Step 2: 生成视频
    await this.updateTaskStatus(task.id, 'processing', 60, '正在生成视频...');
    const videoPath = await this.generateVideo(
      audioPath,
      task.template_id,
      task.is_custom_template
    );

    return videoPath;
  }

  /**
   * 处理分段视频
   */
  async processSegmentedVideo(task) {
    console.log(`🎬 生成分段视频，共${task.segment_count}段...`);

    const segments = JSON.parse(task.segment_data);
    const videoPaths = [];

    // 生成每一段
    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      const progress = 20 + (i / segments.length) * 60;

      await this.updateTaskStatus(
        task.id,
        'processing',
        Math.round(progress),
        `正在生成第${i + 1}/${segments.length}段...`
      );

      // 生成音频
      const audioPath = await this.generateAudio(
        segment.text,
        task.voice_id,
        JSON.parse(task.voice_settings || '{}'),
        `${task.id}_${i}`
      );

      // 生成视频
      const videoPath = await this.generateVideo(
        audioPath,
        task.template_id,
        task.is_custom_template,
        `${task.id}_${i}`
      );

      videoPaths.push(videoPath);
    }

    // Step 3: 合并视频
    await this.updateTaskStatus(task.id, 'processing', 85, '正在合并视频...');
    
    const mergedVideoPath = path.join(
      this.generatedDir,
      `video_${task.id}_merged.mp4`
    );

    await videoMergeService.mergeVideos(videoPaths, mergedVideoPath);

    return mergedVideoPath;
  }

  /**
   * 调用IndexTTS2生成音频
   */
  async generateAudio(text, voiceId, voiceSettings, suffix = '') {
    console.log('🎤 调用TTS生成音频...');

    try {
      const response = await axios.post(
        `${this.ttsApiUrl}/api/v1/tts`,
        {
          text: text,
          voiceId: voiceId || 'default',
          emoVector: [
            voiceSettings.emotions?.happiness || 0.7,
            voiceSettings.emotions?.anger || 0.0,
            voiceSettings.emotions?.sadness || 0.1,
            0.0, // afraid
            0.0, // disgusted
            0.0, // melancholic
            voiceSettings.emotions?.surprise || 0.3,
            1.0 - (voiceSettings.emotions?.happiness || 0.7) // calm
          ],
          emoAlpha: 0.8,
          speed: voiceSettings.speed || 1.0,
          pitch: voiceSettings.pitch || 1.0
        },
        {
          responseType: 'arraybuffer',
          timeout: 60000
        }
      );

      // 保存音频文件
      const audioPath = path.join(
        this.generatedDir,
        `audio_${Date.now()}_${suffix}.wav`
      );

      await fs.writeFile(audioPath, Buffer.from(response.data));
      
      console.log('✅ 音频生成成功:', audioPath);
      return audioPath;

    } catch (error) {
      console.error('❌ TTS生成失败:', error.message);
      throw new Error(`音频生成失败: ${error.message}`);
    }
  }

  /**
   * 调用ComfyUI生成视频
   */
  async generateVideo(audioPath, templateId, isCustomTemplate, suffix = '') {
    console.log('🎬 调用ComfyUI生成视频...');

    try {
      // 准备工作流
      const workflow = await this.buildComfyUIWorkflow(
        audioPath,
        templateId,
        isCustomTemplate
      );

      // 提交任务到ComfyUI
      const promptResponse = await axios.post(
        `${this.comfyuiApiUrl}/prompt`,
        { prompt: workflow },
        { timeout: 10000 }
      );

      const promptId = promptResponse.data.prompt_id;
      console.log('📝 ComfyUI任务ID:', promptId);

      // 轮询等待完成
      const outputPath = await this.waitForComfyUICompletion(promptId, suffix);
      
      console.log('✅ 视频生成成功:', outputPath);
      return outputPath;

    } catch (error) {
      console.error('❌ 视频生成失败:', error.message);
      throw new Error(`视频生成失败: ${error.message}`);
    }
  }

  /**
   * 构建ComfyUI工作流
   */
  async buildComfyUIWorkflow(audioPath, templateId, isCustomTemplate) {
    // 这里需要根据你的ComfyUI工作流来定制
    // 以下是一个基本的MuseTalk工作流示例

    return {
      "1": {
        "inputs": {
          "audio": audioPath,
          "template_video": await this.getTemplateVideoPath(templateId, isCustomTemplate)
        },
        "class_type": "MuseTalkNode"
      },
      "2": {
        "inputs": {
          "video": ["1", 0],
          "output_path": this.generatedDir
        },
        "class_type": "SaveVideo"
      }
    };
  }

  /**
   * 等待ComfyUI完成
   */
  async waitForComfyUICompletion(promptId, suffix = '') {
    const maxWaitTime = 300000; // 5分钟
    const pollInterval = 2000; // 2秒
    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitTime) {
      try {
        // 检查任务状态
        const historyResponse = await axios.get(
          `${this.comfyuiApiUrl}/history/${promptId}`
        );

        const history = historyResponse.data[promptId];

        if (history && history.status) {
          if (history.status.completed) {
            // 任务完成，获取输出文件
            const outputs = history.outputs;
            
            // 从outputs中提取视频路径
            // 这需要根据你的ComfyUI工作流来调整
            const videoInfo = Object.values(outputs)[0];
            const videoPath = path.join(
              this.generatedDir,
              `video_${Date.now()}_${suffix}.mp4`
            );

            // 这里可能需要从ComfyUI的输出目录复制文件
            // 或者直接使用ComfyUI生成的路径

            return videoPath;
          }

          if (history.status.status_str === 'error') {
            throw new Error('ComfyUI任务失败');
          }
        }

        // 等待后继续轮询
        await new Promise(resolve => setTimeout(resolve, pollInterval));

      } catch (error) {
        if (Date.now() - startTime >= maxWaitTime) {
          throw new Error('视频生成超时');
        }
        // 继续等待
        await new Promise(resolve => setTimeout(resolve, pollInterval));
      }
    }

    throw new Error('视频生成超时');
  }

  /**
   * 获取模板视频路径
   */
  async getTemplateVideoPath(templateId, isCustomTemplate) {
    if (isCustomTemplate) {
      // 从数据库获取用户上传的模板
      const template = await dbGet(
        'SELECT video_url FROM user_templates WHERE id = ?',
        [templateId]
      );
      return template ? path.join(__dirname, '../../', template.video_url) : null;
    } else {
      // 系统预设模板
      return path.join(__dirname, '../../public/templates', `${templateId}.mp4`);
    }
  }

  /**
   * 获取任务
   */
  async getTask(taskId) {
    return await dbGet(
      `SELECT * FROM tasks WHERE id = ?`,
      [taskId]
    );
  }

  /**
   * 更新任务状态
   */
  async updateTaskStatus(taskId, status, progress = null, message = null) {
    const updates = ['status = ?'];
    const params = [status];

    if (progress !== null) {
      updates.push('progress = ?');
      params.push(progress);
    }

    if (message !== null) {
      updates.push('error_message = ?');
      params.push(message);
    }

    params.push(taskId);

    await dbRun(
      `UPDATE tasks SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    console.log(`📊 任务状态: ${status} (${progress}%) - ${message || ''}`);
  }

  /**
   * 完成任务
   */
  async completeTask(taskId, videoPath) {
    const videoUrl = videoPath.replace(
      path.join(__dirname, '../../public'),
      '/public'
    );

    // 生成缩略图
    const thumbnailUrl = await this.generateThumbnail(videoPath);

    // 获取视频信息
    const duration = await this.getVideoDuration(videoPath);

    await dbRun(
      `UPDATE tasks 
       SET status = ?, 
           progress = ?, 
           video_url = ?,
           thumbnail_url = ?,
           duration = ?,
           completed_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      ['completed', 100, videoUrl, thumbnailUrl, duration, taskId]
    );
  }

  /**
   * 任务失败
   */
  async failTask(taskId, errorMessage) {
    await dbRun(
      `UPDATE tasks 
       SET status = ?, 
           error_message = ?,
           completed_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      ['failed', errorMessage, taskId]
    );
  }

  /**
   * 生成缩略图
   */
  async generateThumbnail(videoPath) {
    // 使用FFmpeg生成缩略图
    const thumbnailPath = videoPath.replace('.mp4', '_thumb.jpg');
    
    try {
      const { execSync } = require('child_process');
      execSync(
        `ffmpeg -i "${videoPath}" -ss 00:00:01 -vframes 1 -y "${thumbnailPath}"`,
        { timeout: 10000 }
      );

      return thumbnailPath.replace(
        path.join(__dirname, '../../public'),
        '/public'
      );
    } catch (error) {
      console.error('生成缩略图失败:', error);
      return null;
    }
  }

  /**
   * 获取视频时长
   */
  async getVideoDuration(videoPath) {
    try {
      const { execSync } = require('child_process');
      const output = execSync(
        `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${videoPath}"`,
        { timeout: 5000 }
      );
      return parseFloat(output.toString().trim());
    } catch (error) {
      console.error('获取视频时长失败:', error);
      return 0;
    }
  }
}

export default new VideoGenerationWorker();

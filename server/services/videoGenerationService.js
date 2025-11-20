/**
 * 视频生成服务 - 整合 IndexTTS2 和 ComfyUI
 * 
 * 流程：
 * 1. 文本分段（智能分割）
 * 2. 调用 IndexTTS2 生成音频
 * 3. 调用 ComfyUI 生成视频（Wan2.1 + InfiniteTalk）
 * 4. 合并视频片段
 * 5. 更新任务状态
 */

import axios from 'axios';
import { Task } from '../models/Task.js';
import { User } from '../models/User.js';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';

const execAsync = promisify(exec);

// 配置
const INDEXTTS2_API_URL = process.env.INDEXTTS2_API_URL || 'http://localhost:5000';
const COMFYUI_API_URL = process.env.COMFYUI_API_URL || 'http://localhost:8188';
const OUTPUT_DIR = path.join(process.cwd(), 'public/generated');
const TEMPLATES_DIR = path.join(process.cwd(), 'public/templates');

// 确保模板目录存在
if (!fs.existsSync(TEMPLATES_DIR)) {
  fs.mkdirSync(TEMPLATES_DIR, { recursive: true });
}

// 确保输出目录存在
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

/**
 * 生成视频的主函数
 */
export async function generateVideo(taskId) {
  try {
    console.log(`🎬 开始生成视频: ${taskId}`);
    
    // 获取任务详情
    const task = await Task.findById(taskId);
    if (!task) {
      throw new Error('任务不存在');
    }

    // 更新状态为处理中
    await Task.updateStatus(taskId, 'processing', 10);

    // Step 1: 智能文本分段
    const segments = Task.segmentText(task.text);
    console.log(`📝 文本已分为 ${segments.length} 段`);

    // Step 2: 为每个段生成音频和视频
    const generatedSegments = [];
    for (let i = 0; i < segments.length; i++) {
      console.log(`🎵 处理第 ${i + 1}/${segments.length} 段...`);
      
      // 更新进度
      const progress = 10 + (i / segments.length) * 80;
      await Task.updateStatus(taskId, 'processing', Math.floor(progress));

      // 生成音频
      const audioPath = await generateAudio(
        segments[i],
        task.voice_settings,
        task.voice_id,
        i
      );

      // 生成视频
      const videoPath = await generateVideoSegment(
        audioPath,
        task.template_id,
        task.is_custom_template,
        i
      );

      generatedSegments.push({
        audio: audioPath,
        video: videoPath,
        text: segments[i]
      });
    }

    // Step 3: 合并视频片段
    console.log('🎞️ 合并视频片段...');
    await Task.updateStatus(taskId, 'processing', 90);
    
    const finalVideoPath = await mergeVideoSegments(
      generatedSegments.map(s => s.video),
      taskId
    );

    // Step 4: 生成缩略图
    const thumbnailPath = await generateThumbnail(finalVideoPath);

    // Step 5: 更新任务结果
    const audioUrl = `/public/generated/${path.basename(generatedSegments[0].audio)}`;
    const videoUrl = `/public/generated/${path.basename(finalVideoPath)}`;
    const thumbnailUrl = `/public/generated/${path.basename(thumbnailPath)}`;

    await Task.updateResult(taskId, audioUrl, videoUrl, thumbnailUrl);
    await Task.updateStatus(taskId, 'completed', 100);

    console.log(`✅ 视频生成完成: ${taskId}`);
    
    // TODO: 发送通知给用户

    return {
      success: true,
      videoUrl,
      thumbnailUrl
    };

  } catch (error) {
    console.error(`❌ 视频生成失败: ${taskId}`, error);
    
    // 更新任务状态为失败
    await Task.updateStatus(taskId, 'failed', 0, error.message);
    
    // 退还积分给用户
    const task = await Task.findById(taskId);
    if (task) {
      await User.addCredits(task.user_id, task.total_cost);
      console.log(`💰 已退还 ${task.total_cost} 积分给用户 ${task.user_id}`);
    }

    throw error;
  }
}

/**
 * 使用 IndexTTS2 生成音频
 * 
 * IndexTTS2 情感向量格式: [happy, angry, sad, afraid, disgusted, melancholic, surprised, calm]
 * 我们的格式: {happiness, sadness, anger, surprise} -> 映射到 IndexTTS2
 */
async function generateAudio(text, voiceSettings, voiceId, segmentIndex) {
  try {
    console.log(`🎤 调用 IndexTTS2 生成音频...`);

    // 将我们的情感参数映射到 IndexTTS2 的 8 维情感向量
    // IndexTTS2: [happy, angry, sad, afraid, disgusted, melancholic, surprised, calm]
    const emotionVector = [
      voiceSettings.happiness || 0.7,  // happy
      voiceSettings.anger || 0.0,      // angry
      voiceSettings.sadness || 0.1,    // sad
      0.0,                              // afraid
      0.0,                              // disgusted
      0.0,                              // melancholic
      voiceSettings.surprise || 0.3,   // surprised
      1.0 - (voiceSettings.happiness || 0.7)  // calm (反向计算)
    ];

    // 准备请求参数
    const requestData = {
      text: text,
      spk_audio_prompt: voiceId ? `uploads/voices/${voiceId}` : null,  // 自定义声音文件路径
      emo_vector: emotionVector,
      emo_alpha: 0.8,  // 情感强度
      use_random: false,  // 不使用随机性以保持一致性
      pitch_scale: voiceSettings.pitch || 1.0,
      speed_scale: voiceSettings.speed || 1.0
    };

    // 调用 IndexTTS2 HTTP API
    const response = await axios.post(`${INDEXTTS2_API_URL}/api/v1/tts`, requestData, {
      timeout: 300000, // 5分钟超时
      responseType: 'arraybuffer'  // 接收音频二进制数据
    });

    // 保存音频文件
    const audioFileName = `audio_${Date.now()}_${segmentIndex}.wav`;
    const audioPath = path.join(OUTPUT_DIR, audioFileName);
    fs.writeFileSync(audioPath, response.data);

    console.log(`✅ 音频生成成功: ${audioFileName}`);
    return audioPath;

  } catch (error) {
    console.error('IndexTTS2 生成音频失败:', error.message);
    
    // 如果是网络错误,提供更详细的错误信息
    if (error.code === 'ECONNREFUSED') {
      throw new Error(`无法连接到 IndexTTS2 服务 (${INDEXTTS2_API_URL}). 请确认服务已启动。`);
    }
    
    throw new Error(`音频生成失败: ${error.message}`);
  }
}

/**
 * 使用 ComfyUI 生成视频片段
 */
async function generateVideoSegment(audioPath, templateId, isCustomTemplate, segmentIndex) {
  try {
    console.log(`🎬 调用 ComfyUI 生成视频...`);

    // 准备 ComfyUI workflow
    const workflow = await prepareComfyUIWorkflow(audioPath, templateId, isCustomTemplate);

    // 提交到 ComfyUI
    const promptResponse = await axios.post(`${COMFYUI_API_URL}/prompt`, {
      prompt: workflow,
      client_id: `videoai_${Date.now()}`
    });

    const promptId = promptResponse.data.prompt_id;
    console.log(`📤 任务已提交到 ComfyUI: ${promptId}`);

    // 轮询检查任务状态
    let videoPath = null;
    let attempts = 0;
    const maxAttempts = 120; // 最多等待10分钟（5秒一次）

    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 5000)); // 等待5秒

      // 检查任务状态
      const historyResponse = await axios.get(`${COMFYUI_API_URL}/history/${promptId}`);
      const history = historyResponse.data[promptId];

      if (history && history.status && history.status.completed) {
        // 获取输出文件
        const outputs = history.outputs;
        // TODO: 根据您的工作流调整输出节点ID
        const videoNode = outputs['SaveVideo'] || outputs['VHS_VideoCombine'];
        
        if (videoNode && videoNode.videos && videoNode.videos.length > 0) {
          const videoInfo = videoNode.videos[0];
          videoPath = await downloadFromComfyUI(videoInfo.filename, segmentIndex);
          break;
        }
      }

      attempts++;
    }

    if (!videoPath) {
      throw new Error('ComfyUI 视频生成超时');
    }

    console.log(`✅ 视频生成成功: ${path.basename(videoPath)}`);
    return videoPath;

  } catch (error) {
    console.error('ComfyUI 生成视频失败:', error.message);
    throw new Error(`视频生成失败: ${error.message}`);
  }
}

/**
 * 准备 ComfyUI 工作流 - 基于用户提供的真实工作流
 * 
 * 关键节点:
 * - Node 6: LoadAudio (音频输入)
 * - Node 168: VHS_LoadVideo (视频/图像模板输入)
 * - Node 137: MultiTalkModelLoader (InfiniteTalk 模型)
 * - Node 176: WanVideoModelLoader (Wan2.1-I2V-14B-480p 模型)
 * - Node 131: MultiTalkWav2VecEmbeds (音频嵌入处理)
 * - Node 166: WanVideoImageToVideoMultiTalk (核心生成节点)
 * - Node 151: VHS_VideoCombine (视频输出)
 */
async function prepareComfyUIWorkflow(audioPath, templateId, isCustomTemplate) {
  // 获取模板文件路径
  const templatePath = isCustomTemplate 
    ? `custom/${templateId}.mp4` 
    : `${templateId}.mp4`;

  // 读取用户上传的完整工作流作为基础
  const baseWorkflowPath = '/home/user/uploaded_files/数字分身对口型：wan2.1搭配infinitetalk(1).json.txt';
  const workflowData = JSON.parse(fs.readFileSync(baseWorkflowPath, 'utf-8'));
  
  // 修改关键节点的输入
  for (const node of workflowData.nodes) {
    // Node 6: 更新音频输入路径
    if (node.id === 6 && node.type === 'LoadAudio') {
      node.widgets_values[0] = path.basename(audioPath);
    }
    
    // Node 168: 更新视频模板路径
    if (node.id === 168 && node.type === 'VHS_LoadVideo') {
      node.widgets_values.video = templatePath;
    }
    
    // Node 151: 更新输出文件名前缀
    if (node.id === 151 && node.type === 'VHS_VideoCombine') {
      node.widgets_values.filename_prefix = `output_${Date.now()}`;
      node.widgets_values.save_output = true;
    }
  }

  return workflowData;
}

/**
 * 从 ComfyUI 下载生成的视频
 */
async function downloadFromComfyUI(filename, segmentIndex) {
  try {
    const response = await axios.get(`${COMFYUI_API_URL}/view?filename=${filename}`, {
      responseType: 'arraybuffer'
    });

    const videoFileName = `video_${Date.now()}_${segmentIndex}.mp4`;
    const videoPath = path.join(OUTPUT_DIR, videoFileName);
    fs.writeFileSync(videoPath, response.data);

    return videoPath;
  } catch (error) {
    throw new Error(`下载视频失败: ${error.message}`);
  }
}

/**
 * 使用 ffmpeg 合并视频片段
 */
async function mergeVideoSegments(videoPaths, taskId) {
  try {
    if (videoPaths.length === 1) {
      // 只有一个片段，直接返回
      return videoPaths[0];
    }

    console.log(`🔗 合并 ${videoPaths.length} 个视频片段...`);

    // 创建 ffmpeg concat 文件
    const concatFileName = `concat_${taskId}.txt`;
    const concatFilePath = path.join(OUTPUT_DIR, concatFileName);
    const concatContent = videoPaths.map(p => `file '${p}'`).join('\n');
    fs.writeFileSync(concatFilePath, concatContent);

    // 执行 ffmpeg 合并
    const outputFileName = `final_${taskId}.mp4`;
    const outputPath = path.join(OUTPUT_DIR, outputFileName);
    
    const ffmpegCmd = `ffmpeg -f concat -safe 0 -i ${concatFilePath} -c copy ${outputPath}`;
    await execAsync(ffmpegCmd);

    // 删除临时文件
    fs.unlinkSync(concatFilePath);
    videoPaths.forEach(p => {
      try { fs.unlinkSync(p); } catch (e) {}
    });

    console.log(`✅ 视频合并完成: ${outputFileName}`);
    return outputPath;

  } catch (error) {
    throw new Error(`视频合并失败: ${error.message}`);
  }
}

/**
 * 生成视频缩略图
 */
async function generateThumbnail(videoPath) {
  try {
    const thumbnailFileName = `thumb_${path.basename(videoPath, '.mp4')}.jpg`;
    const thumbnailPath = path.join(OUTPUT_DIR, thumbnailFileName);

    const ffmpegCmd = `ffmpeg -i ${videoPath} -ss 00:00:01 -vframes 1 ${thumbnailPath}`;
    await execAsync(ffmpegCmd);

    return thumbnailPath;
  } catch (error) {
    console.error('生成缩略图失败:', error);
    // 缩略图不是必需的，失败也继续
    return null;
  }
}

/**
 * 添加任务到队列
 */
export function queueVideoGeneration(taskId) {
  // TODO: 使用 Bull Queue 或其他队列系统
  // 暂时直接调用
  setTimeout(() => {
    generateVideo(taskId).catch(error => {
      console.error(`任务 ${taskId} 处理失败:`, error);
    });
  }, 1000);
}

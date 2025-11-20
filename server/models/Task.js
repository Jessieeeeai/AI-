import { dbRun, dbGet, dbAll } from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';

export class Task {
  // 创建任务
  static async create(taskData) {
    const {
      userId,
      text,
      voiceId,
      voiceSettings,
      templateId,
      isCustomTemplate,
      duration,
      segments,
      costBreakdown,
      totalCost
    } = taskData;

    const taskId = uuidv4();
    
    await dbRun(
      `INSERT INTO tasks (
        id, user_id, text, voice_id, voice_settings, 
        template_id, is_custom_template, duration, segments,
        cost_breakdown, total_cost, status, progress
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        taskId,
        userId,
        text,
        voiceId,
        JSON.stringify(voiceSettings),
        templateId,
        isCustomTemplate ? 1 : 0,
        duration,
        segments,
        JSON.stringify(costBreakdown),
        totalCost,
        'pending',
        0
      ]
    );

    return taskId;
  }

  // 获取任务详情
  static async findById(taskId) {
    const task = await dbGet('SELECT * FROM tasks WHERE id = ?', [taskId]);
    if (task) {
      task.voice_settings = JSON.parse(task.voice_settings);
      task.cost_breakdown = JSON.parse(task.cost_breakdown);
      task.is_custom_template = Boolean(task.is_custom_template);
    }
    return task;
  }

  // 获取用户的所有任务
  static async findByUserId(userId, filters = {}) {
    let query = 'SELECT * FROM tasks WHERE user_id = ?';
    const params = [userId];

    // 状态筛选
    if (filters.status) {
      query += ' AND status = ?';
      params.push(filters.status);
    }

    // 排序
    query += ' ORDER BY created_at DESC';

    // 分页
    if (filters.limit) {
      query += ' LIMIT ?';
      params.push(filters.limit);
      
      if (filters.offset) {
        query += ' OFFSET ?';
        params.push(filters.offset);
      }
    }

    const tasks = await dbAll(query, params);
    return tasks.map(task => ({
      ...task,
      voice_settings: JSON.parse(task.voice_settings),
      cost_breakdown: JSON.parse(task.cost_breakdown),
      is_custom_template: Boolean(task.is_custom_template)
    }));
  }

  // 更新任务状态
  static async updateStatus(taskId, status, progress = null, errorMessage = null) {
    const updates = ['status = ?'];
    const params = [status];

    if (progress !== null) {
      updates.push('progress = ?');
      params.push(progress);
    }

    if (errorMessage !== null) {
      updates.push('error_message = ?');
      params.push(errorMessage);
    }

    if (status === 'completed') {
      updates.push('completed_at = CURRENT_TIMESTAMP');
    }

    params.push(taskId);

    await dbRun(
      `UPDATE tasks SET ${updates.join(', ')} WHERE id = ?`,
      params
    );
  }

  // 更新任务结果（音频和视频URL）
  static async updateResult(taskId, audioUrl, videoUrl, thumbnailUrl = null) {
    const updates = ['audio_url = ?', 'video_url = ?'];
    const params = [audioUrl, videoUrl];

    if (thumbnailUrl) {
      updates.push('thumbnail_url = ?');
      params.push(thumbnailUrl);
    }

    params.push(taskId);

    await dbRun(
      `UPDATE tasks SET ${updates.join(', ')} WHERE id = ?`,
      params
    );
  }

  // 删除任务
  static async delete(taskId, userId) {
    const result = await dbRun(
      'DELETE FROM tasks WHERE id = ? AND user_id = ?',
      [taskId, userId]
    );
    return result.changes > 0;
  }

  // 增加播放次数
  static async incrementViews(taskId) {
    await dbRun('UPDATE tasks SET views = views + 1 WHERE id = ?', [taskId]);
  }

  // 增加分享次数
  static async incrementShares(taskId) {
    await dbRun('UPDATE tasks SET shares = shares + 1 WHERE id = ?', [taskId]);
  }

  // 增加下载次数
  static async incrementDownloads(taskId) {
    await dbRun('UPDATE tasks SET downloads = downloads + 1 WHERE id = ?', [taskId]);
  }

  // 获取用户任务统计
  static async getUserTaskStats(userId) {
    const total = await dbGet(
      'SELECT COUNT(*) as count FROM tasks WHERE user_id = ?',
      [userId]
    );

    const completed = await dbGet(
      'SELECT COUNT(*) as count FROM tasks WHERE user_id = ? AND status = "completed"',
      [userId]
    );

    const processing = await dbGet(
      'SELECT COUNT(*) as count FROM tasks WHERE user_id = ? AND status IN ("pending", "processing")',
      [userId]
    );

    const failed = await dbGet(
      'SELECT COUNT(*) as count FROM tasks WHERE user_id = ? AND status = "failed"',
      [userId]
    );

    const totalDuration = await dbGet(
      'SELECT SUM(duration) as total FROM tasks WHERE user_id = ? AND status = "completed"',
      [userId]
    );

    const totalViews = await dbGet(
      'SELECT SUM(views) as total FROM tasks WHERE user_id = ? AND status = "completed"',
      [userId]
    );

    return {
      total: total?.count || 0,
      completed: completed?.count || 0,
      processing: processing?.count || 0,
      failed: failed?.count || 0,
      totalDuration: totalDuration?.total || 0,
      totalViews: totalViews?.total || 0
    };
  }

  // 智能文本分段（按句子分割，每段不超过60秒）
  static segmentText(text) {
    // 按句子分割（支持中英文标点）
    const sentences = text.match(/[^.!?。！？]+[.!?。！？]+/g) || [text];
    
    const segments = [];
    let currentSegment = '';
    let currentLength = 0;
    const maxCharsPerSegment = 300; // 300字符约60秒

    for (const sentence of sentences) {
      const sentenceLength = sentence.length;
      
      // 如果当前段+新句子超过限制，保存当前段并开始新段
      if (currentLength + sentenceLength > maxCharsPerSegment && currentSegment) {
        segments.push(currentSegment.trim());
        currentSegment = sentence;
        currentLength = sentenceLength;
      } else {
        currentSegment += sentence;
        currentLength += sentenceLength;
      }
    }

    // 添加最后一段
    if (currentSegment) {
      segments.push(currentSegment.trim());
    }

    return segments;
  }

  // 计算任务成本
  static calculateCost(text, voiceId, isCustomTemplate) {
    const textLength = text.length;
    const estimatedDuration = (textLength / 300) * 60; // 秒
    const minutes = Math.ceil(estimatedDuration / 60);
    
    const audioCost = minutes * 5;  // 5积分/分钟
    const videoCost = minutes * 25; // 25积分/分钟
    let extraCost = 0;
    
    if (voiceId) extraCost += 20;  // 自定义声音+20积分
    if (isCustomTemplate) extraCost += 50; // 自定义模板+50积分
    
    const subtotal = audioCost + videoCost + extraCost;
    
    const segments = this.segmentText(text);
    
    return {
      audioCost,
      videoCost,
      extraCost,
      subtotal,
      total: subtotal,
      duration: estimatedDuration,
      minutes,
      segments: segments.length
    };
  }
}

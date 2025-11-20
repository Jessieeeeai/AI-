import { Task } from '../models/Task.js';
import { User } from '../models/User.js';
import { dbRun } from '../config/database.js';
import { queueVideoGeneration } from '../services/videoGenerationService.js';

// 创建视频生成任务
export const createTask = async (req, res) => {
  try {
    const userId = req.user.id;
    const { text, voiceSettings, voiceId, templateId, isCustomTemplate } = req.body;

    // 验证输入
    if (!text || text.length < 10 || text.length > 5000) {
      return res.status(400).json({ 
        error: 'invalid_text', 
        message: '文本长度必须在10-5000个字符之间' 
      });
    }

    if (!templateId) {
      return res.status(400).json({ 
        error: 'missing_template', 
        message: '请选择一个模板' 
      });
    }

    // 计算成本
    const costData = Task.calculateCost(text, voiceId, isCustomTemplate);

    // 检查用户积分余额
    const userCredits = await User.getCredits(userId);
    if (userCredits < costData.total) {
      return res.status(402).json({ 
        error: 'insufficient_credits', 
        message: '积分不足',
        required: costData.total,
        current: userCredits
      });
    }

    // 扣除积分（预扣费）
    const deducted = await User.deductCredits(userId, costData.total);
    if (!deducted) {
      return res.status(402).json({ 
        error: 'deduction_failed', 
        message: '积分扣除失败，请重试' 
      });
    }

    // 记录交易（扣费）
    await dbRun(
      `INSERT INTO transactions (user_id, type, credits, amount, status) 
       VALUES (?, ?, ?, ?, ?)`,
      [userId, 'deduction', -costData.total, costData.total * 0.1, 'completed']
    );

    // 创建任务
    const taskId = await Task.create({
      userId,
      text,
      voiceId,
      voiceSettings,
      templateId,
      isCustomTemplate,
      duration: costData.duration,
      segments: costData.segments,
      costBreakdown: costData,
      totalCost: costData.total
    });

    // 更新用户等级
    await User.getLevel(userId);

    // ✅ 将任务加入视频生成队列
    console.log(`📤 将任务 ${taskId} 加入生成队列...`);
    queueVideoGeneration(taskId);

    res.status(201).json({
      success: true,
      taskId,
      message: '任务创建成功，正在生成中',
      estimatedTime: `${Math.ceil(costData.duration / 60) * 2}-${Math.ceil(costData.duration / 60) * 3}分钟`,
      costBreakdown: costData,
      segments: costData.segments
    });

  } catch (error) {
    console.error('创建任务失败:', error);
    res.status(500).json({ 
      error: 'create_failed', 
      message: '任务创建失败，请稍后重试' 
    });
  }
};

// 获取任务详情
export const getTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const userId = req.user.id;

    const task = await Task.findById(taskId);

    if (!task) {
      return res.status(404).json({ 
        error: 'not_found', 
        message: '任务不存在' 
      });
    }

    // 验证任务所有权
    if (task.user_id !== userId && !req.user.isAdmin) {
      return res.status(403).json({ 
        error: 'forbidden', 
        message: '无权访问此任务' 
      });
    }

    res.json({
      success: true,
      task
    });

  } catch (error) {
    console.error('获取任务失败:', error);
    res.status(500).json({ 
      error: 'fetch_failed', 
      message: '获取任务失败' 
    });
  }
};

// 获取用户的任务列表
export const getUserTasks = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, limit = 20, offset = 0 } = req.query;

    const filters = {
      status,
      limit: parseInt(limit),
      offset: parseInt(offset)
    };

    const tasks = await Task.findByUserId(userId, filters);
    const stats = await Task.getUserTaskStats(userId);

    res.json({
      success: true,
      tasks,
      stats,
      pagination: {
        limit: filters.limit,
        offset: filters.offset,
        total: stats.total
      }
    });

  } catch (error) {
    console.error('获取任务列表失败:', error);
    res.status(500).json({ 
      error: 'fetch_failed', 
      message: '获取任务列表失败' 
    });
  }
};

// 删除任务
export const deleteTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const userId = req.user.id;

    // 获取任务信息（用于退款判断）
    const task = await Task.findById(taskId);

    if (!task) {
      return res.status(404).json({ 
        error: 'not_found', 
        message: '任务不存在' 
      });
    }

    if (task.user_id !== userId) {
      return res.status(403).json({ 
        error: 'forbidden', 
        message: '无权删除此任务' 
      });
    }

    // 如果任务失败，退还积分
    if (task.status === 'failed') {
      await User.addCredits(userId, task.total_cost);
      
      // 记录退款交易
      await dbRun(
        `INSERT INTO transactions (user_id, type, credits, amount, status) 
         VALUES (?, ?, ?, ?, ?)`,
        [userId, 'refund', task.total_cost, task.total_cost * 0.1, 'completed']
      );
    }

    // 删除任务
    const deleted = await Task.delete(taskId, userId);

    if (!deleted) {
      return res.status(500).json({ 
        error: 'delete_failed', 
        message: '删除任务失败' 
      });
    }

    res.json({
      success: true,
      message: '任务已删除',
      refunded: task.status === 'failed' ? task.total_cost : 0
    });

  } catch (error) {
    console.error('删除任务失败:', error);
    res.status(500).json({ 
      error: 'delete_failed', 
      message: '删除任务失败' 
    });
  }
};

// 增加任务播放次数
export const incrementViews = async (req, res) => {
  try {
    const { taskId } = req.params;
    await Task.incrementViews(taskId);
    res.json({ success: true });
  } catch (error) {
    console.error('更新播放次数失败:', error);
    res.status(500).json({ error: 'update_failed' });
  }
};

// 增加任务分享次数
export const incrementShares = async (req, res) => {
  try {
    const { taskId } = req.params;
    await Task.incrementShares(taskId);
    res.json({ success: true });
  } catch (error) {
    console.error('更新分享次数失败:', error);
    res.status(500).json({ error: 'update_failed' });
  }
};

// 增加任务下载次数
export const incrementDownloads = async (req, res) => {
  try {
    const { taskId } = req.params;
    await Task.incrementDownloads(taskId);
    res.json({ success: true });
  } catch (error) {
    console.error('更新下载次数失败:', error);
    res.status(500).json({ error: 'update_failed' });
  }
};

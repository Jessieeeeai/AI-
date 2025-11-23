/**
 * 项目管理API路由
 */

import express from 'express';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { dbRun, dbGet, dbAll } from '../config/database.js';
import videoGenerationService from '../services/videoGenerationService.js';

const router = express.Router();

/**
 * @route   POST /api/projects
 * @desc    创建新项目
 * @access  Private
 */
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { title, text, voiceId, templateId, draftId } = req.body;
    const userId = req.user.id;

    if (!title || !text || !voiceId || !templateId) {
      return res.status(400).json({
        success: false,
        message: '缺少必要参数'
      });
    }

    console.log(`📋 [API] 创建项目 | 用户: ${userId} | 标题: ${title}`);

    // 创建项目记录
    const result = await dbRun(
      `INSERT INTO projects (
        user_id, title, text_content, voice_id, template_id, 
        draft_id, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
      [userId, title, text, voiceId, templateId, draftId || null, 'pending']
    );

    const projectId = result.lastID;

    // 异步启动视频生成（不等待完成）
    videoGenerationService.generateVideo({
      text,
      voiceId,
      templateId,
      projectId,
      userId
    }).catch(error => {
      console.error(`❌ 视频生成失败 [项目:${projectId}]:`, error);
    });

    res.json({
      success: true,
      message: '项目创建成功',
      projectId,
      status: 'pending'
    });

  } catch (error) {
    console.error('❌ [API] 创建项目失败:', error);
    res.status(500).json({
      success: false,
      message: '创建项目失败',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/projects
 * @desc    获取用户的项目列表
 * @access  Private
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, page = 1, limit = 20 } = req.query;

    const offset = (page - 1) * limit;

    let query = `
      SELECT 
        p.*,
        t.name as template_name,
        t.thumbnail_url as template_thumbnail,
        v.voice_name
      FROM projects p
      LEFT JOIN templates t ON p.template_id = t.id
      LEFT JOIN user_voices v ON p.voice_id = v.id
      WHERE p.user_id = ?
    `;

    const params = [userId];

    if (status) {
      query += ' AND p.status = ?';
      params.push(status);
    }

    query += ' ORDER BY p.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const projects = await dbAll(query, params);

    // 获取总数
    let countQuery = 'SELECT COUNT(*) as total FROM projects WHERE user_id = ?';
    const countParams = [userId];

    if (status) {
      countQuery += ' AND status = ?';
      countParams.push(status);
    }

    const countResult = await dbGet(countQuery, countParams);

    res.json({
      success: true,
      projects,
      pagination: {
        total: countResult.total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(countResult.total / limit)
      }
    });

  } catch (error) {
    console.error('❌ [API] 获取项目列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取项目列表失败',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/projects/:id
 * @desc    获取项目详情
 * @access  Private
 */
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const project = await dbGet(
      `SELECT 
        p.*,
        t.name as template_name,
        t.thumbnail_url as template_thumbnail,
        t.video_url as template_video,
        v.voice_name,
        v.audio_url as voice_sample
      FROM projects p
      LEFT JOIN templates t ON p.template_id = t.id
      LEFT JOIN user_voices v ON p.voice_id = v.id
      WHERE p.id = ? AND p.user_id = ?`,
      [id, userId]
    );

    if (!project) {
      return res.status(404).json({
        success: false,
        message: '项目不存在'
      });
    }

    res.json({
      success: true,
      project
    });

  } catch (error) {
    console.error('❌ [API] 获取项目详情失败:', error);
    res.status(500).json({
      success: false,
      message: '获取项目详情失败',
      error: error.message
    });
  }
});

/**
 * @route   PUT /api/projects/:id
 * @desc    更新项目
 * @access  Private
 */
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { title, text, voiceId, templateId } = req.body;

    // 检查项目是否存在
    const project = await dbGet(
      'SELECT * FROM projects WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (!project) {
      return res.status(404).json({
        success: false,
        message: '项目不存在'
      });
    }

    // 更新项目
    await dbRun(
      `UPDATE projects SET
        title = COALESCE(?, title),
        text_content = COALESCE(?, text_content),
        voice_id = COALESCE(?, voice_id),
        template_id = COALESCE(?, template_id),
        updated_at = datetime('now')
      WHERE id = ? AND user_id = ?`,
      [title, text, voiceId, templateId, id, userId]
    );

    res.json({
      success: true,
      message: '项目更新成功'
    });

  } catch (error) {
    console.error('❌ [API] 更新项目失败:', error);
    res.status(500).json({
      success: false,
      message: '更新项目失败',
      error: error.message
    });
  }
});

/**
 * @route   DELETE /api/projects/:id
 * @desc    删除项目
 * @access  Private
 */
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const result = await dbRun(
      'DELETE FROM projects WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (result.changes === 0) {
      return res.status(404).json({
        success: false,
        message: '项目不存在'
      });
    }

    res.json({
      success: true,
      message: '项目删除成功'
    });

  } catch (error) {
    console.error('❌ [API] 删除项目失败:', error);
    res.status(500).json({
      success: false,
      message: '删除项目失败',
      error: error.message
    });
  }
});

export default router;

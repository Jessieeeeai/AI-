/**
 * 草稿管理API路由
 */

import express from 'express';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { dbRun, dbGet, dbAll } from '../config/database.js';

const router = express.Router();

/**
 * @route   POST /api/drafts
 * @desc    创建/保存草稿
 * @access  Private
 */
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { title, textContent, voiceId, templateId, metadata } = req.body;
    const userId = req.user.id;

    if (!textContent) {
      return res.status(400).json({
        success: false,
        message: '文本内容不能为空'
      });
    }

    console.log(`📝 [API] 保存草稿 | 用户: ${userId} | 标题: ${title || '未命名'}`);

    const result = await dbRun(
      `INSERT INTO drafts (
        user_id, title, text_content, voice_id, template_id, 
        metadata, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
      [
        userId,
        title || '未命名草稿',
        textContent,
        voiceId || null,
        templateId || null,
        metadata ? JSON.stringify(metadata) : null
      ]
    );

    res.json({
      success: true,
      message: '草稿保存成功',
      draftId: result.lastID
    });

  } catch (error) {
    console.error('❌ [API] 保存草稿失败:', error);
    res.status(500).json({
      success: false,
      message: '保存草稿失败',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/drafts
 * @desc    获取用户的草稿列表
 * @access  Private
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20 } = req.query;

    const offset = (page - 1) * limit;

    const drafts = await dbAll(
      `SELECT 
        d.*,
        v.voice_name,
        t.name as template_name
      FROM drafts d
      LEFT JOIN user_voices v ON d.voice_id = v.id
      LEFT JOIN templates t ON d.template_id = t.id
      WHERE d.user_id = ?
      ORDER BY d.updated_at DESC
      LIMIT ? OFFSET ?`,
      [userId, parseInt(limit), parseInt(offset)]
    );

    // 获取总数
    const countResult = await dbGet(
      'SELECT COUNT(*) as total FROM drafts WHERE user_id = ?',
      [userId]
    );

    res.json({
      success: true,
      drafts,
      pagination: {
        total: countResult.total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(countResult.total / limit)
      }
    });

  } catch (error) {
    console.error('❌ [API] 获取草稿列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取草稿列表失败',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/drafts/:id
 * @desc    获取草稿详情
 * @access  Private
 */
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const draft = await dbGet(
      `SELECT 
        d.*,
        v.voice_name,
        t.name as template_name,
        t.thumbnail_url as template_thumbnail
      FROM drafts d
      LEFT JOIN user_voices v ON d.voice_id = v.id
      LEFT JOIN templates t ON d.template_id = t.id
      WHERE d.id = ? AND d.user_id = ?`,
      [id, userId]
    );

    if (!draft) {
      return res.status(404).json({
        success: false,
        message: '草稿不存在'
      });
    }

    // 解析metadata
    if (draft.metadata) {
      try {
        draft.metadata = JSON.parse(draft.metadata);
      } catch (e) {
        draft.metadata = null;
      }
    }

    res.json({
      success: true,
      draft
    });

  } catch (error) {
    console.error('❌ [API] 获取草稿详情失败:', error);
    res.status(500).json({
      success: false,
      message: '获取草稿详情失败',
      error: error.message
    });
  }
});

/**
 * @route   PUT /api/drafts/:id
 * @desc    更新草稿
 * @access  Private
 */
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { title, textContent, voiceId, templateId, metadata } = req.body;

    // 检查草稿是否存在
    const draft = await dbGet(
      'SELECT * FROM drafts WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (!draft) {
      return res.status(404).json({
        success: false,
        message: '草稿不存在'
      });
    }

    await dbRun(
      `UPDATE drafts SET
        title = COALESCE(?, title),
        text_content = COALESCE(?, text_content),
        voice_id = ?,
        template_id = ?,
        metadata = ?,
        updated_at = datetime('now')
      WHERE id = ? AND user_id = ?`,
      [
        title,
        textContent,
        voiceId !== undefined ? voiceId : draft.voice_id,
        templateId !== undefined ? templateId : draft.template_id,
        metadata ? JSON.stringify(metadata) : draft.metadata,
        id,
        userId
      ]
    );

    res.json({
      success: true,
      message: '草稿更新成功'
    });

  } catch (error) {
    console.error('❌ [API] 更新草稿失败:', error);
    res.status(500).json({
      success: false,
      message: '更新草稿失败',
      error: error.message
    });
  }
});

/**
 * @route   DELETE /api/drafts/:id
 * @desc    删除草稿
 * @access  Private
 */
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const result = await dbRun(
      'DELETE FROM drafts WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (result.changes === 0) {
      return res.status(404).json({
        success: false,
        message: '草稿不存在'
      });
    }

    res.json({
      success: true,
      message: '草稿删除成功'
    });

  } catch (error) {
    console.error('❌ [API] 删除草稿失败:', error);
    res.status(500).json({
      success: false,
      message: '删除草稿失败',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/drafts/:id/to-project
 * @desc    将草稿转为项目
 * @access  Private
 */
router.post('/:id/to-project', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const draft = await dbGet(
      'SELECT * FROM drafts WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (!draft) {
      return res.status(404).json({
        success: false,
        message: '草稿不存在'
      });
    }

    if (!draft.voice_id || !draft.template_id) {
      return res.status(400).json({
        success: false,
        message: '草稿缺少必要信息（声音或模板）'
      });
    }

    // 创建项目
    const result = await dbRun(
      `INSERT INTO projects (
        user_id, title, text_content, voice_id, template_id,
        draft_id, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
      [
        userId,
        draft.title,
        draft.text_content,
        draft.voice_id,
        draft.template_id,
        draft.id,
        'pending'
      ]
    );

    res.json({
      success: true,
      message: '草稿已转为项目',
      projectId: result.lastID
    });

  } catch (error) {
    console.error('❌ [API] 草稿转项目失败:', error);
    res.status(500).json({
      success: false,
      message: '草稿转项目失败',
      error: error.message
    });
  }
});

export default router;

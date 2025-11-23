/**
 * 模板管理API路由
 */

import express from 'express';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { dbRun, dbGet, dbAll } from '../config/database.js';

const router = express.Router();

/**
 * @route   GET /api/templates
 * @desc    获取模板列表
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    const { category, page = 1, limit = 20 } = req.query;

    const offset = (page - 1) * limit;

    let query = 'SELECT * FROM templates WHERE 1=1';
    const params = [];

    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const templates = await dbAll(query, params);

    // 获取总数
    let countQuery = 'SELECT COUNT(*) as total FROM templates WHERE 1=1';
    const countParams = [];

    if (category) {
      countQuery += ' AND category = ?';
      countParams.push(category);
    }

    const countResult = await dbGet(countQuery, countParams);

    res.json({
      success: true,
      templates,
      pagination: {
        total: countResult.total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(countResult.total / limit)
      }
    });

  } catch (error) {
    console.error('❌ [API] 获取模板列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取模板列表失败',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/templates/:id
 * @desc    获取模板详情
 * @access  Public
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const template = await dbGet(
      'SELECT * FROM templates WHERE id = ?',
      [id]
    );

    if (!template) {
      return res.status(404).json({
        success: false,
        message: '模板不存在'
      });
    }

    res.json({
      success: true,
      template
    });

  } catch (error) {
    console.error('❌ [API] 获取模板详情失败:', error);
    res.status(500).json({
      success: false,
      message: '获取模板详情失败',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/templates/categories
 * @desc    获取模板分类列表
 * @access  Public
 */
router.get('/meta/categories', async (req, res) => {
  try {
    const categories = await dbAll(
      'SELECT DISTINCT category FROM templates WHERE category IS NOT NULL'
    );

    res.json({
      success: true,
      categories: categories.map(c => c.category)
    });

  } catch (error) {
    console.error('❌ [API] 获取分类列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取分类列表失败',
      error: error.message
    });
  }
});

export default router;

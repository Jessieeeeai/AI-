import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import {
  createTask,
  getTask,
  getUserTasks,
  deleteTask,
  incrementViews,
  incrementShares,
  incrementDownloads
} from '../controllers/taskController.js';

const router = express.Router();

// 所有任务路由都需要认证
router.use(authenticateToken);

// 创建任务
router.post('/create', createTask);

// 获取用户的任务列表
router.get('/list', getUserTasks);

// 获取任务详情
router.get('/:taskId', getTask);

// 删除任务
router.delete('/:taskId', deleteTask);

// 增加播放次数
router.post('/:taskId/views', incrementViews);

// 增加分享次数
router.post('/:taskId/shares', incrementShares);

// 增加下载次数
router.post('/:taskId/downloads', incrementDownloads);

export default router;

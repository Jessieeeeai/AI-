import express from 'express';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import {
  getStats,
  getUsers,
  updateUserCredits,
  getRecentActivities,
  createPromotion,
  getPromotions,
  updatePromotion
} from '../controllers/adminController.js';

const router = express.Router();

// 所有管理路由都需要认证和管理员权限
router.use(authenticateToken);
router.use(requireAdmin);

// 统计数据
router.get('/stats', getStats);

// 用户管理
router.get('/users', getUsers);
router.put('/users/:userId/credits', updateUserCredits);

// 活动日志
router.get('/activities', getRecentActivities);

// 促销活动管理
router.post('/promotions', createPromotion);
router.get('/promotions', getPromotions);
router.put('/promotions/:promotionId', updatePromotion);

export default router;

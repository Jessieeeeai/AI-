import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import {
  createStripeCheckout,
  handleStripeWebhook,
  verifyPayment,
  createCryptoPayment,
  getTransactionHistory
} from '../controllers/paymentController.js';

const router = express.Router();

// Stripe Checkout - 创建支付会话
router.post('/stripe/checkout', authenticateToken, createStripeCheckout);

// Stripe Webhook - 接收支付通知（不需要认证）
router.post('/stripe/webhook', express.raw({ type: 'application/json' }), handleStripeWebhook);

// 验证支付成功
router.get('/verify', authenticateToken, verifyPayment);

// 加密货币支付
router.post('/crypto/create', authenticateToken, createCryptoPayment);

// 获取交易历史
router.get('/transactions', authenticateToken, getTransactionHistory);

export default router;

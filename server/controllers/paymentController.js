import { User } from '../models/User.js';
import { dbRun, dbGet } from '../config/database.js';
import Stripe from 'stripe';

// 初始化 Stripe（需要环境变量）
const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

// 充值套餐配置
const packages = {
  starter: { price: 20, credits: 200, name: '入门版' },
  professional: { price: 50, credits: 500, name: '进阶版' },
  business: { price: 100, credits: 1050, name: '专业版' },
  enterprise: { price: 200, credits: 2150, name: '企业版' }
};

// 创建 Stripe Checkout Session
export const createStripeCheckout = async (req, res) => {
  try {
    const userId = req.user.id;
    const { packageId } = req.body;

    if (!stripe) {
      return res.status(500).json({ 
        error: 'stripe_not_configured',
        message: 'Stripe 未配置，请联系管理员' 
      });
    }

    // 验证套餐
    const pkg = packages[packageId];
    if (!pkg) {
      return res.status(400).json({ 
        error: 'invalid_package',
        message: '无效的套餐ID' 
      });
    }

    // 创建 Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: `VideoAI Pro - ${pkg.name}`,
            description: `${pkg.credits} 积分`,
            images: ['https://your-domain.com/logo.png'], // 替换为实际logo
          },
          unit_amount: pkg.price * 100, // Stripe使用分为单位
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL || 'http://localhost:3001'}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:3001'}/recharge`,
      client_reference_id: userId.toString(),
      metadata: {
        userId: userId.toString(),
        packageId,
        credits: pkg.credits.toString()
      }
    });

    res.json({
      success: true,
      sessionId: session.id,
      url: session.url
    });

  } catch (error) {
    console.error('创建 Stripe Checkout 失败:', error);
    res.status(500).json({ 
      error: 'checkout_creation_failed',
      message: '创建支付会话失败' 
    });
  }
};

// Stripe Webhook 处理
export const handleStripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripe || !webhookSecret) {
    return res.status(500).json({ error: 'Stripe not configured' });
  }

  let event;

  try {
    // 验证 webhook 签名
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook 签名验证失败:', err.message);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  // 处理事件
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;

    try {
      const userId = parseInt(session.metadata.userId);
      const credits = parseInt(session.metadata.credits);
      const packageId = session.metadata.packageId;

      // 增加用户积分
      await User.addCredits(userId, credits);

      // 记录交易
      await dbRun(
        `INSERT INTO transactions (user_id, type, credits, amount, payment_method, payment_id, status) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [userId, 'recharge', credits, session.amount_total / 100, 'stripe', session.id, 'completed']
      );

      console.log(`✅ 用户 ${userId} 充值成功: +${credits} 积分`);

    } catch (error) {
      console.error('处理支付成功事件失败:', error);
    }
  }

  res.json({ received: true });
};

// 验证支付成功
export const verifyPayment = async (req, res) => {
  try {
    const { sessionId } = req.query;
    const userId = req.user.id;

    if (!stripe) {
      return res.status(500).json({ 
        error: 'stripe_not_configured',
        message: 'Stripe 未配置' 
      });
    }

    // 获取 session 详情
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    // 验证用户ID匹配
    if (parseInt(session.client_reference_id) !== userId) {
      return res.status(403).json({ 
        error: 'unauthorized',
        message: '无权访问此支付会话' 
      });
    }

    // 检查支付状态
    if (session.payment_status === 'paid') {
      res.json({
        success: true,
        paid: true,
        credits: parseInt(session.metadata.credits)
      });
    } else {
      res.json({
        success: true,
        paid: false
      });
    }

  } catch (error) {
    console.error('验证支付失败:', error);
    res.status(500).json({ 
      error: 'verification_failed',
      message: '验证支付失败' 
    });
  }
};

// 创建加密货币支付订单（NOWPayments）
export const createCryptoPayment = async (req, res) => {
  try {
    const userId = req.user.id;
    const { packageId } = req.body;

    // 验证套餐
    const pkg = packages[packageId];
    if (!pkg) {
      return res.status(400).json({ 
        error: 'invalid_package',
        message: '无效的套餐ID' 
      });
    }

    // TODO: 集成 NOWPayments API
    // const nowpaymentsApiKey = process.env.NOWPAYMENTS_API_KEY;
    // const response = await fetch('https://api.nowpayments.io/v1/payment', {
    //   method: 'POST',
    //   headers: {
    //     'x-api-key': nowpaymentsApiKey,
    //     'Content-Type': 'application/json'
    //   },
    //   body: JSON.stringify({
    //     price_amount: pkg.price,
    //     price_currency: 'usd',
    //     pay_currency: 'btc', // 或用户选择的币种
    //     ipn_callback_url: `${process.env.API_URL}/api/payment/crypto-webhook`,
    //     order_id: `user_${userId}_${Date.now()}`,
    //     order_description: `VideoAI Pro - ${pkg.name}`
    //   })
    // });

    res.json({
      success: true,
      message: '加密货币支付功能即将推出',
      packageInfo: pkg
    });

  } catch (error) {
    console.error('创建加密货币支付失败:', error);
    res.status(500).json({ 
      error: 'crypto_payment_failed',
      message: '创建支付失败' 
    });
  }
};

// 获取交易历史
export const getTransactionHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 20, offset = 0 } = req.query;

    const transactions = await dbRun(
      `SELECT * FROM transactions 
       WHERE user_id = ? 
       ORDER BY created_at DESC 
       LIMIT ? OFFSET ?`,
      [userId, parseInt(limit), parseInt(offset)]
    );

    const total = await dbGet(
      'SELECT COUNT(*) as count FROM transactions WHERE user_id = ?',
      [userId]
    );

    res.json({
      success: true,
      transactions,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: total.count
      }
    });

  } catch (error) {
    console.error('获取交易历史失败:', error);
    res.status(500).json({ 
      error: 'fetch_failed',
      message: '获取交易历史失败' 
    });
  }
};

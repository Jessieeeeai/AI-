import { User } from '../models/User.js';
import { generateToken } from '../middleware/auth.js';

// 注册
export const register = async (req, res) => {
  try {
    const { email, password, username } = req.body;

    // 验证输入
    if (!email || !password) {
      return res.status(400).json({ error: 'missing_fields', message: '邮箱和密码不能为空' });
    }

    // 检查邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'invalid_email', message: '邮箱格式不正确' });
    }

    // 检查密码长度
    if (password.length < 6) {
      return res.status(400).json({ error: 'weak_password', message: '密码至少需要6个字符' });
    }

    // 检查用户是否已存在
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(409).json({ error: 'user_exists', message: '该邮箱已被注册' });
    }

    // 创建用户
    const userId = await User.create(email, password, username);

    // 生成令牌
    const token = generateToken({ id: userId, email, is_admin: 0 });

    res.status(201).json({
      message: '注册成功',
      token,
      user: {
        id: userId,
        email,
        username,
        credits: 20
      }
    });
  } catch (error) {
    console.error('注册错误:', error);
    res.status(500).json({ error: 'server_error', message: '服务器错误' });
  }
};

// 登录
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 验证输入
    if (!email || !password) {
      return res.status(400).json({ error: 'missing_fields', message: '邮箱和密码不能为空' });
    }

    // 查找用户
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'invalid_credentials', message: '邮箱或密码错误' });
    }

    // 验证密码
    const isValid = await User.verifyPassword(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'invalid_credentials', message: '邮箱或密码错误' });
    }

    // 更新最后登录时间
    await User.updateLastLogin(user.id);

    // 生成令牌
    const token = generateToken(user);

    res.json({
      message: '登录成功',
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        credits: user.credits,
        level: user.level
      }
    });
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({ error: 'server_error', message: '服务器错误' });
  }
};

// 获取当前用户信息
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'user_not_found', message: '用户不存在' });
    }

    const stats = await User.getUserStats(user.id);

    res.json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        avatar: user.avatar,
        credits: user.credits,
        level: user.level,
        isAdmin: user.is_admin === 1
      },
      stats
    });
  } catch (error) {
    console.error('获取用户信息错误:', error);
    res.status(500).json({ error: 'server_error', message: '服务器错误' });
  }
};

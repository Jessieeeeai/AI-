import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';

// 验证JWT令牌
export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'unauthorized', message: '未提供认证令牌' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'forbidden', message: '令牌无效或已过期' });
    }
    req.user = user;
    next();
  });
};

// 验证管理员权限
export const requireAdmin = (req, res, next) => {
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({ error: 'forbidden', message: '需要管理员权限' });
  }
  next();
};

// 生成JWT令牌
export const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      isAdmin: user.is_admin
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

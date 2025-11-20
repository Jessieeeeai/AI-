import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// 导入数据库配置（这会初始化数据库）
import './config/database.js';

// 导入路由
import authRoutes from './routes/auth.js';
import taskRoutes from './routes/tasks.js';
import paymentRoutes from './routes/payment.js';
import uploadRoutes from './routes/upload.js';
import adminRoutes from './routes/admin.js';

// 配置环境变量
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 静态文件服务
app.use('/public', express.static(path.join(__dirname, '../public')));

// 提供前端构建文件
app.use(express.static(path.join(__dirname, '../dist')));

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API路由
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/admin', adminRoutes);

// 所有其他路由返回index.html（用于React Router）
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'not_found', message: '接口不存在' });
  }
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// 错误处理
app.use((err, req, res, next) => {
  console.error('服务器错误:', err);
  res.status(500).json({ error: 'server_error', message: '服务器内部错误' });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════════╗
║                                                          ║
║            🎬 VideoAI Pro 后端服务                       ║
║                                                          ║
║  服务器地址: http://localhost:${PORT}                     ║
║  环境: ${process.env.NODE_ENV || 'development'}                              ║
║  数据库: SQLite                                          ║
║                                                          ║
║  API端点:                                                ║
║  - POST /api/auth/register  注册                         ║
║  - POST /api/auth/login     登录                         ║
║  - GET  /api/auth/profile   用户信息                     ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
  `);
});

export default app;

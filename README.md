# VideoAI Pro

专业口播视频生成平台 - AI驱动，定制声音+形象

## 功能特性

- 🎬 **AI视频生成** - 文字转专业口播视频
- 🎤 **声音定制** - 支持情绪调节和声音克隆
- 👤 **形象定制** - 10+预设模板 + 用户自定义
- 💎 **积分系统** - 游戏化等级、排名、任务系统
- 💰 **灵活支付** - Stripe信用卡 + 加密货币
- 🎯 **智能分段** - 按句子智能分割长视频
- 📊 **数据统计** - 完整的用户数据和作品统计

## 技术栈

### 前端
- React 18
- Vite
- TailwindCSS
- Framer Motion
- Lucide React Icons

### 后端
- Node.js
- Express
- SQLite
- JWT认证
- Stripe支付

### AI服务
- IndexTTS2 (语音生成)
- Wan2.1 + InfiniteTalk (视频生成)

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制 `.env.example` 到 `.env` 并填写配置：

```bash
cp .env.example .env
```

### 3. 初始化数据库

```bash
npm run db:init
```

### 4. 启动开发服务器

```bash
npm run dev
```

前端: http://localhost:5173
后端: http://localhost:3001

## 项目结构

```
videoai-pro/
├── client/                 # 前端代码
│   ├── src/
│   │   ├── components/    # React组件
│   │   ├── pages/         # 页面
│   │   ├── services/      # API服务
│   │   └── utils/         # 工具函数
│   └── index.html
├── server/                 # 后端代码
│   ├── routes/            # API路由
│   ├── controllers/       # 控制器
│   ├── services/          # 业务逻辑
│   ├── models/            # 数据模型
│   └── middleware/        # 中间件
├── public/                 # 静态资源
│   ├── templates/         # 视频模板
│   └── uploads/           # 用户上传
└── database/              # SQLite数据库
```

## 部署

### 🚀 RunPod GPU部署（推荐）

**一键部署到RunPod GPU服务器**：

```bash
# 1. 推送代码到GitHub
./push_to_github.sh

# 2. 在RunPod创建GPU Pod（RTX 3090, 24GB）
# 访问: https://www.runpod.io/

# 3. 在RunPod中一键部署
cd /workspace
git clone <你的仓库地址>
cd videoai-webapp
./deploy_runpod.sh
```

**详细文档**：
- 📖 [5分钟快速部署](RUNPOD_QUICKSTART.md)
- 📋 [完整部署指南](RUNPOD_DEPLOYMENT.md)
- 💰 [费用详解](RUNPOD_PRICING.md)
- ✅ [部署检查清单](DEPLOYMENT_CHECKLIST.md)
- 🔧 [故障排除](TROUBLESHOOTING.md)

**费用参考**：
- RTX 3090: $0.34/小时 (约2.4元/小时)
- 每天8小时: 约19元/天
- 每月: 约580元/月

---

### 前端部署 (Vercel)

```bash
npm run build
# 将 dist/ 目录部署到 Vercel
```

### 后端部署 (阿里云ECS)

```bash
# 1. 安装依赖
npm install --production

# 2. 配置环境变量
nano .env

# 3. 使用PM2启动
pm2 start server/index.js --name videoai-pro

# 4. 配置开机自启
pm2 startup
pm2 save
```

## API文档

### 用户认证
- `POST /api/auth/register` - 注册
- `POST /api/auth/login` - 登录
- `POST /api/auth/logout` - 登出

### 积分系统
- `GET /api/credits/balance` - 获取余额
- `POST /api/credits/recharge` - 充值
- `GET /api/credits/history` - 消费记录

### 视频生成
- `POST /api/tasks/create` - 创建任务
- `GET /api/tasks/:id` - 查询任务状态
- `GET /api/tasks/list` - 我的作品列表

更多API文档: `docs/api.md`

## 定价

- 音频生成: 5积分/分钟
- 视频生成: 25积分/分钟
- 1积分 = $0.1

## 许可证

MIT License

## 联系我们

- 邮箱: support@videoaipro.com
- 网站: https://videoaipro.com

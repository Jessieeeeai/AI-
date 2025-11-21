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

### AI服务（GPU加速）
- **IndexTTS2** - 情感语音合成（支持8维情感向量）
- **ComfyUI + MuseTalk** - AI数字人视频生成
- **FFmpeg** - 视频分段与合并
- **Bull + Redis** - 异步任务队列

## 快速开始

### 方式一：本地开发（Mock模式）

适合前端开发和测试，AI服务使用模拟数据：

```bash
# 1. 安装依赖
npm install

# 2. 配置环境变量
cp .env.example .env

# 3. 初始化数据库
npm run db:init

# 4. 启动开发服务器
npm run dev
```

前端: http://localhost:5173  
后端: http://localhost:3001

### 方式二：RunPod GPU生产环境（推荐）

完整的AI视频生成能力，参见 **[RunPod部署教程](RunPod部署教程.md)**

```bash
# 在RunPod GPU服务器上一键部署
bash deploy_runpod.sh  # 部署主应用
bash deploy_ai_services.sh  # 部署AI服务
```



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
# 1. 在RunPod创建GPU实例（RTX 3090, 24GB）
# 访问: https://www.runpod.io/

# 2. SSH连接到RunPod服务器后，执行：
cd /workspace
git clone https://github.com/你的用户名/videoai-pro.git
cd videoai-pro

# 3. 一键部署 VideoAI Pro（5分钟）
chmod +x deploy_runpod.sh
bash deploy_runpod.sh

# 4. 部署AI服务（30-60分钟）
bash deploy_ai_services.sh
```

**📚 详细文档**：
- 🚀 **[快速开始](RUNPOD_START.md)** - 3步完成部署（最简洁）
- 📖 **[完整教程](RunPod部署教程.md)** - 图文详解，含故障排查
- ⚡ **[命令速查表](RunPod快速命令.md)** - 常用命令一键复制
- 📊 **[部署流程图](DEPLOYMENT_FLOW.md)** - 可视化架构和流程
- 🔧 **[GPU方案详解](GPU完整方案.md)** - 技术架构说明

**💰 费用参考**：
| 使用场景 | GPU型号 | 月成本 |
|----------|---------|--------|
| 开发测试 | RTX 3090 | ~$50 (按小时) |
| 小规模生产 | RTX 3090 | ~$80 (8小时/天) |
| 24/7运行 | RTX 3090 | ~$245/月 |

**✨ 支持的GPU**：
- RTX 3090 (24GB) - **推荐** 性价比最高
- RTX 4090 (24GB) - 性能最强
- A5000 (24GB) - 企业级稳定

---

### 其他部署方式

#### 前端独立部署 (Vercel/Netlify)

```bash
cd client
npm run build
# 将 dist/ 目录部署到静态托管服务
```

#### 后端独立部署 (VPS/云服务器)

```bash
# 安装依赖
npm install --production

# 启动服务
pm2 start server/index.js --name videoai-pro
pm2 startup
pm2 save
```

**注意**：独立部署需要自行配置GPU服务器用于AI服务

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

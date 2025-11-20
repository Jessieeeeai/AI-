# 🎉 VideoAI Pro - 从这里开始

## 👋 欢迎！

感谢选择VideoAI Pro！这是一个功能完整的AI视频生成平台，支持：

- ✅ **声音克隆** - 上传声音，AI学习您的音色
- ✅ **情绪控制** - 8维情绪调节（快乐、愤怒、悲伤等）
- ✅ **视频生成** - 文字转口播视频
- ✅ **自定义模板** - 上传您的视频模板
- ✅ **积分系统** - 预付费模式，失败自动退款

---

## 🎯 您想做什么？

### 🚀 我想立即部署到GPU服务器

**推荐方案：RunPod（国际化GPU云平台）**

#### 为什么选择RunPod？
- 💰 价格便宜：RTX 3090 仅$0.34/小时（约2.4元/小时）
- 🌐 全球节点：访问速度快
- 🔧 易于使用：预装深度学习环境
- 📦 持久化存储：数据永不丢失
- 💳 灵活支付：信用卡或加密货币

#### 3步快速部署

**第1步：推送代码到GitHub**
```bash
cd /home/user/webapp
./push_to_github.sh
```

**第2步：创建RunPod账号并充值**
- 访问：https://www.runpod.io/
- 注册账号，充值$20
- 创建GPU Pod（RTX 3090，24GB显存）
- 暴露端口：3001, 5000, 8188

**第3步：一键部署**
```bash
# 在RunPod Web Terminal中执行
cd /workspace
git clone <你的GitHub仓库地址>
cd videoai-webapp
./deploy_runpod.sh
```

**10-20分钟后，您的网站就上线了！**

#### 📚 详细文档

- 📖 **[RUNPOD_QUICKSTART.md](RUNPOD_QUICKSTART.md)** - 5分钟快速上手
- 📋 **[RUNPOD_DEPLOYMENT.md](RUNPOD_DEPLOYMENT.md)** - 完整部署步骤
- 💰 **[RUNPOD_PRICING.md](RUNPOD_PRICING.md)** - 费用说明和省钱技巧
- ✅ **[DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)** - 部署检查清单
- 🔧 **[TROUBLESHOOTING.md](TROUBLESHOOTING.md)** - 故障排除指南
- 📖 **[RUNPOD_README.md](RUNPOD_README.md)** - 完整总览

---

### 💻 我想在本地开发测试

#### 快速启动

```bash
# 1. 安装依赖
cd /home/user/webapp
npm install
cd client && npm install && cd ..

# 2. 启动所有服务（开发模式）
npm run dev
```

访问：
- 前端：http://localhost:5173
- 后端：http://localhost:3001

#### 测试账号

**VIP账号（1000积分）**：
```
用户名: vip_user
密码: vip123456
```

**普通账号（100积分）**：
```
用户名: test_user  
密码: test123456
```

查看所有测试账号：
```bash
cat TEST_ACCOUNTS.md
```

#### 开发文档

- 📖 **[README.md](README.md)** - 项目概述
- 📋 **[DEPLOYMENT.md](DEPLOYMENT.md)** - 开发环境配置
- 🐛 **[BUGFIX_*.md](.)** - 已修复的bug记录
- ✨ **[FEATURE_*.md](.)** - 功能实现文档

---

### 📖 我想了解项目详情

#### 项目概述

**VideoAI Pro** 是一个完整的AI视频生成SaaS平台，包含：

**前端（React）**：
- 用户注册/登录
- 4步视频创建流程（文本 → 声音 → 模板 → 生成）
- 历史记录管理
- 积分系统

**后端（Node.js）**：
- RESTful API
- JWT认证
- SQLite数据库
- 文件上传处理
- 积分管理

**AI服务（Python）**：
- IndexTTS2 - 声音克隆和TTS（8维情绪控制）
- ComfyUI + Wan2.1 - 图像到视频生成
- InfiniteTalk - 唇形同步

#### 技术栈

```
前端: React 18 + Vite + TailwindCSS
后端: Node.js + Express + SQLite
AI: Python + PyTorch + IndexTTS2 + ComfyUI
部署: PM2 + Nginx + RunPod GPU
```

#### 目录结构

```
videoai-webapp/
├── client/                    # React前端
│   ├── src/
│   │   ├── components/       # UI组件
│   │   ├── pages/            # 页面
│   │   ├── services/         # API调用
│   │   └── utils/            # 工具函数
│   └── dist/                 # 构建输出
│
├── server/                    # Node.js后端
│   ├── routes/               # API路由
│   ├── controllers/          # 控制器
│   ├── services/             # AI服务
│   │   ├── indextts2_client.py     # TTS客户端
│   │   ├── comfyui_client.py       # ComfyUI客户端
│   │   ├── mock_indextts2_server.py # Mock TTS
│   │   └── mock_comfyui_server.py  # Mock ComfyUI
│   └── middleware/           # 中间件
│
├── public/                    # 静态文件
│   └── uploads/              # 用户上传
│       ├── voices/           # 声音文件
│       ├── templates/        # 视频模板
│       └── videos/           # 生成的视频
│
├── database/                  # 数据库
│   └── videoai.db            # SQLite数据库
│
└── docs/                      # 文档
    ├── RUNPOD_*.md           # RunPod部署文档
    ├── DEPLOYMENT_*.md       # 部署相关文档
    ├── BUGFIX_*.md           # Bug修复记录
    └── FEATURE_*.md          # 功能实现文档
```

---

### 💰 我想了解成本

#### RunPod GPU服务器费用

**RTX 3090 (24GB)** - 推荐配置
```
小时费用: $0.34 (约2.4元)
每天8小时: $2.72 (约19元)
每月: $81.6 (约585元)
```

**RTX 4090 (24GB)** - 高性能
```
小时费用: $0.69 (约5元)
每天8小时: $5.52 (约40元)
每月: $165.6 (约1189元)
```

#### 省钱技巧

1. **按需启停** - 不用时停止Pod，节省50%+
2. **使用Spot实例** - 便宜30-40%，但可能被回收
3. **批量处理** - 集中时间处理任务
4. **Persistent Volume** - 避免重复下载模型

详细费用分析：**[RUNPOD_PRICING.md](RUNPOD_PRICING.md)**

---

### 🔧 我遇到问题了

#### 快速解决方案

**90%的问题可以这样解决**：
```bash
pm2 restart all
```

**如果还不行**：
```bash
# 查看错误日志
pm2 logs --err

# 完全重启
pm2 delete all
cd /workspace/videoai-webapp
pm2 start ecosystem.config.cjs
```

#### 常见问题

1. **服务启动失败** → `pm2 logs --err` 查看错误
2. **网站无法访问** → 检查端口配置和服务状态
3. **数据库错误** → 重新初始化数据库
4. **GPU内存不足** → `pm2 restart all`
5. **文件上传失败** → 检查文件大小和格式

详细故障排除：**[TROUBLESHOOTING.md](TROUBLESHOOTING.md)**

---

## 📊 项目状态

### ✅ 已完成功能

- [x] 用户注册和登录（JWT认证）
- [x] 4步视频创建流程
- [x] 声音上传和预览
- [x] 声音克隆预览（调用TTS生成）
- [x] 自定义模板上传和显示
- [x] 积分系统（预扣费+失败退款）
- [x] 历史记录管理
- [x] IndexTTS2集成（8维情绪）
- [x] ComfyUI + Wan2.1集成
- [x] Mock服务（无GPU测试）
- [x] PM2进程管理
- [x] RunPod部署脚本

### 🚧 当前模式

**Mock模式**：
- TTS服务返回测试音频
- ComfyUI返回示例视频
- 所有功能可测试，但不是真实AI生成

**要切换到真实AI**：
1. 下载真实模型（IndexTTS2, Wan2.1）
2. 替换Mock服务为真实服务
3. 配置GPU环境

### 🔮 未来计划

- [ ] 真实TTS和视频生成
- [ ] 支付系统集成
- [ ] 更多视频模板
- [ ] 批量生成功能
- [ ] API接口
- [ ] 移动端适配

---

## 🎓 学习路径

### 新手路线

1. **了解项目** → 阅读 [README.md](README.md)
2. **本地运行** → `npm run dev`
3. **测试功能** → 使用测试账号体验
4. **了解部署** → 阅读 [RUNPOD_QUICKSTART.md](RUNPOD_QUICKSTART.md)
5. **实际部署** → 按照文档部署到RunPod

### 开发者路线

1. **代码结构** → 查看项目目录
2. **API文档** → 阅读 server/routes/*.js
3. **前端组件** → 查看 client/src/components/
4. **数据流** → 理解 API → Controller → Service → Database
5. **扩展功能** → 添加新功能并提交PR

### 运维路线

1. **部署流程** → [RUNPOD_DEPLOYMENT.md](RUNPOD_DEPLOYMENT.md)
2. **监控维护** → [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
3. **性能优化** → GPU监控和资源管理
4. **备份策略** → 数据库和文件备份
5. **故障处理** → 日志分析和问题排查

---

## 🔗 快速链接

### 部署相关
- 🚀 [5分钟快速部署](RUNPOD_QUICKSTART.md)
- 📋 [完整部署指南](RUNPOD_DEPLOYMENT.md)
- 💰 [费用详解](RUNPOD_PRICING.md)
- ✅ [部署检查清单](DEPLOYMENT_CHECKLIST.md)

### 开发相关
- 📖 [项目README](README.md)
- 🐛 [Bug修复记录](.)
- ✨ [功能实现文档](.)
- 🧪 [测试账号](TEST_ACCOUNTS.md)

### 运维相关
- 🔧 [故障排除](TROUBLESHOOTING.md)
- 📊 [部署状态](DEPLOYMENT_COMPLETE.md)
- 🛠️ [维护指南](RUNPOD_DEPLOYMENT.md#维护配置)

### 外部资源
- 🌐 [RunPod官网](https://www.runpod.io/)
- 📚 [RunPod文档](https://docs.runpod.io/)
- 💬 [RunPod Discord](https://discord.gg/runpod)

---

## 📞 获取帮助

### 优先级顺序

1. **查看文档** - 90%的问题文档中有答案
2. **搜索Issues** - 查看是否有人遇到相同问题
3. **社区求助** - RunPod Discord或技术论坛
4. **官方支持** - support@runpod.io

### 提问技巧

提问时请包含：
- 问题的详细描述
- 错误日志（`pm2 logs --err`）
- 系统信息（`nvidia-smi`, `pm2 status`）
- 已尝试的解决方案

---

## 🎉 准备好了吗？

选择您的下一步：

### 🚀 立即部署
```bash
# 第一步
./push_to_github.sh

# 第二步：访问 RunPod
# https://www.runpod.io/

# 第三步：在RunPod执行
cd /workspace
git clone <你的仓库>
cd videoai-webapp
./deploy_runpod.sh
```

### 💻 本地开发
```bash
npm run dev
```

### 📖 深入学习
阅读：[RUNPOD_README.md](RUNPOD_README.md)

---

**祝您使用愉快！** 🎊

*如有任何问题，随时查阅对应文档或联系技术支持。*

---

*最后更新: 2025-11-20*
*版本: 1.0.0*
*作者: GenSpark AI*

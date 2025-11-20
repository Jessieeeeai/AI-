# 🎯 VideoAI Pro - 下一步行动指南

## ✅ 当前状态

🎉 **部署成功！所有服务正常运行**

- ✅ Node.js Backend (端口 3001)
- ✅ IndexTTS2 Mock (端口 5000)
- ✅ ComfyUI Mock (端口 8188)
- ✅ 测试通过 - 已成功创建视频任务

---

## 📍 您现在的位置

您现在处于 **测试阶段**，使用 Mock 模式（模拟服务）。这是正确的！

### Mock 模式 vs 生产模式

| 特性 | Mock 模式 (当前) | 生产模式 (需要GPU) |
|------|-----------------|-------------------|
| 需要 GPU | ❌ 不需要 | ✅ 需要 24GB+ |
| 视频质量 | 测试视频 | 真实AI视频 |
| 对口型 | ❌ 无 | ✅ InfiniteTalk |
| 适用场景 | 开发/测试/演示 | 正式使用/生产 |
| 成本 | 免费 | GPU服务器费用 |

---

## 🎯 推荐的下一步（按优先级）

### 选项 A：继续在 Mock 模式下测试（推荐先做）

**目的**: 确保整个系统功能正常，找出可能的 Bug

#### A1. 测试前端界面

```bash
# 如果前端还没启动，运行：
cd /home/user/webapp/client
npm install  # 如果还没安装依赖
npm run dev  # 启动开发服务器
```

然后访问前端，测试：
- ✅ 用户注册/登录
- ✅ 创建视频任务
- ✅ 查看任务列表
- ✅ 下载生成的视频

#### A2. 测试更多功能

```bash
# 运行完整测试脚本
cd /home/user/webapp
./test_videoai.sh

# 测试声音上传
curl -X POST http://localhost:3001/api/upload/voice \
  -H "Authorization: Bearer $YOUR_TOKEN" \
  -F "voice=@/path/to/your/audio.mp3"

# 测试管理后台
curl -H "Authorization: Bearer $YOUR_ADMIN_TOKEN" \
  http://localhost:3001/api/admin/stats
```

#### A3. 修复发现的问题

如果发现任何 Bug 或问题，告诉我，我会帮您修复。

---

### 选项 B：准备 GPU 服务器（生产环境）

**适用于**: 您已经测试完 Mock 模式，想要真实的视频生成功能

#### B1. 准备工作清单

您需要：
- [ ] **GPU 服务器** (推荐配置)
  - NVIDIA GPU 24GB+ 显存
  - Ubuntu 20.04+ 或 CentOS 7+
  - CUDA 11.8+
  - Python 3.10+
  - 200GB+ 存储空间

- [ ] **云服务商选择** (可选其一)
  - AWS: p3.2xlarge (V100 16GB) 或 g5.xlarge (A10G 24GB)
  - 阿里云: ecs.gn6i-c4g1.xlarge (T4 16GB) 或 ecs.gn7i-c8g1.2xlarge (A10 24GB)
  - Azure: NC6s_v3 (V100 16GB)
  - 腾讯云: GN7.2XLARGE32 (T4 16GB)

#### B2. 获取 GPU 服务器

**方式 1: 使用云服务商（推荐）**

以阿里云为例：
1. 登录阿里云控制台
2. 创建 ECS 实例
3. 选择 GPU 型实例（如 ecs.gn7i-c8g1.2xlarge）
4. 系统选择 Ubuntu 20.04
5. 配置安全组，开放端口 5000, 8188, 22

**方式 2: 使用本地 GPU 服务器**

如果您有本地 GPU 服务器：
1. 确保安装了 NVIDIA 驱动
2. 确保安装了 CUDA 11.8+
3. 确保可以通过 SSH 访问

#### B3. 部署到 GPU 服务器

```bash
# 1. 上传部署脚本到 GPU 服务器
scp /home/user/webapp/deploy_gpu_production.sh user@your-gpu-server:/tmp/

# 2. SSH 登录到 GPU 服务器
ssh user@your-gpu-server

# 3. 运行部署脚本
sudo bash /tmp/deploy_gpu_production.sh
```

脚本会自动：
- ✅ 检查环境（GPU, CUDA, Python）
- ✅ 安装系统依赖
- ✅ 克隆 IndexTTS2 和 ComfyUI
- ✅ 下载模型（需要您确认）
- ✅ 创建 systemd 服务
- ✅ 启动并验证服务

#### B4. 更新后端配置

```bash
# 在应用服务器上（当前环境）
cd /home/user/webapp

# 编辑 .env 文件
nano .env

# 更新这两行（替换为您的 GPU 服务器 IP）:
INDEXTTS2_API_URL=http://YOUR_GPU_SERVER_IP:5000
COMFYUI_API_URL=http://YOUR_GPU_SERVER_IP:8188

# 重启后端
lsof -ti:3001 | xargs kill -9
nohup node server/index.js > server.log 2>&1 &
```

#### B5. 测试真实视频生成

```bash
# 运行测试脚本
./test_videoai.sh

# 这次会调用真实的 IndexTTS2 和 ComfyUI
# 生成时间约 1-3 分钟
```

---

### 选项 C：部署到生产环境（上线）

**适用于**: 一切测试通过，准备正式上线

#### C1. 准备域名和 SSL 证书

```bash
# 1. 购买域名（例如 videoai.com）
# 2. 配置 DNS 指向您的服务器 IP
# 3. 使用 Let's Encrypt 获取 SSL 证书

sudo apt install certbot nginx
sudo certbot --nginx -d videoai.com -d www.videoai.com
```

#### C2. 配置 Nginx 反向代理

```nginx
# /etc/nginx/sites-available/videoai
server {
    listen 80;
    server_name videoai.com www.videoai.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name videoai.com www.videoai.com;

    ssl_certificate /etc/letsencrypt/live/videoai.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/videoai.com/privkey.pem;

    # 后端 API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # 前端静态文件
    location / {
        root /home/user/webapp/dist;
        try_files $uri /index.html;
    }

    # 生成的视频文件
    location /public {
        alias /home/user/webapp/public;
    }
}
```

#### C3. 配置生产环境变量

```bash
# 更新 .env
NODE_ENV=production
JWT_SECRET=<生成一个强随机密钥>
STRIPE_SECRET_KEY=<您的 Stripe 生产密钥>
# ... 其他配置
```

#### C4. 使用 PM2 管理进程

```bash
# 安装 PM2
npm install -g pm2

# 启动应用
cd /home/user/webapp
pm2 start server/index.js --name videoai-backend
pm2 save
pm2 startup

# 查看状态
pm2 status
pm2 logs videoai-backend
```

---

## 📝 快速命令参考

### 查看服务状态

```bash
# 后端
curl http://localhost:3001/health

# IndexTTS2 Mock
curl http://localhost:5000/health

# ComfyUI Mock
curl http://localhost:8188/system_stats

# 查看进程
ps aux | grep -E "(node|mock)"
```

### 查看日志

```bash
# 后端日志
tail -f /home/user/webapp/server.log

# IndexTTS2 Mock 日志
tail -f /tmp/indextts2_mock.log

# ComfyUI Mock 日志
tail -f /tmp/comfyui_mock.log
```

### 重启服务

```bash
# 重启后端
cd /home/user/webapp
lsof -ti:3001 | xargs kill -9
nohup node server/index.js > server.log 2>&1 &

# 重启 Mock 服务
pkill -f mock_indextts2_server.py
pkill -f mock_comfyui_server.py
cd server/services
nohup python3 mock_indextts2_server.py > /tmp/indextts2_mock.log 2>&1 &
nohup python3 mock_comfyui_server.py > /tmp/comfyui_mock.log 2>&1 &
```

---

## 🤔 我该选哪个选项？

### 如果您...

**刚开始，想先看看效果** → 选择 **选项 A**
- 启动前端
- 在浏览器中创建视频
- 看到整个流程

**想要真实的视频生成** → 选择 **选项 B**
- 准备 GPU 服务器
- 运行部署脚本
- 切换到生产模式

**准备正式上线** → 选择 **选项 C**
- 配置域名和 SSL
- 设置 Nginx
- 使用 PM2 管理

---

## 💡 建议的完整流程

1. ✅ **测试 Mock 模式** (1-2天)
   - 熟悉系统功能
   - 发现并修复问题
   - 优化用户体验

2. ✅ **部署 GPU 服务器** (半天)
   - 准备 GPU 服务器
   - 运行部署脚本
   - 测试真实视频生成

3. ✅ **准备上线** (1-2天)
   - 配置域名和 SSL
   - 设置支付（Stripe）
   - 性能优化和安全加固

4. ✅ **正式上线** 🎉
   - 监控系统运行
   - 收集用户反馈
   - 持续优化

---

## 📞 需要帮助？

遇到任何问题，随时告诉我：
- ❓ 不知道如何操作
- 🐛 遇到错误或 Bug
- 💡 想要添加新功能
- 🚀 准备上线需要支持

我会立即帮您解决！

---

**现在，您可以从选项 A 开始，启动前端测试整个系统！** 🚀

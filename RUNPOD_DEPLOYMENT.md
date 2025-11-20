# 🚀 RunPod 部署完整指南

## 📋 前置准备

### 1. 注册RunPod
- 访问：https://www.runpod.io/
- 注册账号（Google账号或邮箱）
- 充值 $20-50 美元

### 2. 推送代码到Git仓库

**在当前开发环境执行：**

```bash
cd /home/user/webapp

# 初始化Git（如果还没有）
git init

# 添加所有文件
git add .

# 提交
git commit -m "feat: 完整的VideoAI Pro项目"

# 添加远程仓库（替换成您的仓库地址）
git remote add origin https://github.com/yourusername/videoai-webapp.git

# 推送代码
git push -u origin main
```

**如果还没有Git仓库，创建一个：**
1. 访问 https://github.com/new
2. 创建新仓库 `videoai-webapp`
3. 按照提示推送代码

---

## 🎯 RunPod 创建实例

### 步骤1：选择GPU

1. 进入 RunPod 控制台
2. 点击 "Deploy" → "GPU Pods"
3. 选择GPU：
   - **推荐**: RTX 3090 (24GB VRAM) - $0.34/小时
   - **高性能**: RTX 4090 (24GB VRAM) - $0.69/小时
4. 点击 "Deploy On-Demand"（按需）或 "Spot"（更便宜但可能被抢占）

### 步骤2：选择模板

搜索并选择：**runpod/pytorch:2.1.0-py3.10-cuda11.8.0-devel**

### 步骤3：配置存储

- **Container Disk**: 50 GB
- **Volume Disk**: 100 GB
  - ✅ 勾选 "Use Persistent Volume"

### 步骤4：暴露端口

在 "Expose HTTP Ports" 添加：
```
3001, 5000, 8188
```

### 步骤5：部署

点击 "Deploy" 并等待启动（1-2分钟）

---

## 💻 连接到RunPod

### 方法A：Web Terminal（简单）

1. 在Pod列表点击您的Pod
2. 点击 "Connect" → "Start Web Terminal"

### 方法B：SSH（推荐）

RunPod会显示SSH命令，类似：
```bash
ssh root@xxx-xxx-xxx.pods.runpod.net -p 22
```

复制并在本地终端执行。

---

## 🚀 一键部署

连接到RunPod后，执行以下命令：

### 1. 下载部署脚本

```bash
# 克隆项目（使用您的仓库地址）
cd /workspace
git clone https://github.com/yourusername/videoai-webapp.git
cd videoai-webapp

# 运行部署脚本
chmod +x deploy_runpod.sh
./deploy_runpod.sh
```

### 2. 等待部署完成

脚本会自动：
- ✅ 安装Node.js和Python依赖
- ✅ 下载AI模型
- ✅ 配置环境变量
- ✅ 初始化数据库
- ✅ 启动所有服务

**预计时间**：10-20分钟（取决于网络速度）

---

## 🌐 访问您的网站

### 1. 获取公网地址

在RunPod控制台，找到您的Pod，会显示类似：

```
HTTP Service Port 3001: https://xxx-3001.proxy.runpod.net
```

### 2. 访问网站

在浏览器打开：
```
https://xxx-3001.proxy.runpod.net
```

### 3. 测试账号

查看测试账号信息：
```bash
cd /workspace/videoai-webapp
cat TEST_ACCOUNTS.md
```

默认VIP账号（1000积分）：
- 用户名：`vip_user`
- 密码：`vip123456`
- 邮箱：`vip@videoai.com`

---

## 🔧 常用命令

### 查看服务状态
```bash
pm2 status
```

### 查看日志
```bash
# 查看所有日志
pm2 logs

# 查看特定服务
pm2 logs videoai-backend
pm2 logs mock-indextts2
pm2 logs mock-comfyui
```

### 重启服务
```bash
# 重启所有
pm2 restart all

# 重启单个
pm2 restart videoai-backend
```

### 停止服务
```bash
pm2 stop all
```

### 查看GPU使用
```bash
nvidia-smi
watch -n 1 nvidia-smi  # 每秒刷新
```

---

## 📦 更新代码

当您在开发环境修改代码后：

### 1. 推送代码
```bash
# 在开发环境
cd /home/user/webapp
git add .
git commit -m "更新说明"
git push
```

### 2. 在RunPod更新
```bash
# 在RunPod
cd /workspace/videoai-webapp
git pull
npm install  # 如果有新依赖
cd client && npm install && npm run build && cd ..
pm2 restart all
```

---

## 🔐 环境变量配置

配置文件位于：`/workspace/videoai-webapp/.env`

```bash
# 编辑环境变量
nano /workspace/videoai-webapp/.env

# 修改后重启
pm2 restart all
```

重要配置：
- `JWT_SECRET`: JWT密钥（生产环境应修改）
- `INDEXTTS2_API_URL`: TTS服务地址
- `COMFYUI_API_URL`: ComfyUI服务地址

---

## 🎨 配置Nginx（可选）

如果需要自定义域名：

```bash
# 安装Nginx
apt-get update
apt-get install -y nginx

# 创建配置
cat > /etc/nginx/sites-available/videoai << 'EOF'
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        root /workspace/videoai-webapp/client/dist;
        try_files $uri /index.html;
    }
    
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
    
    location /public {
        proxy_pass http://localhost:3001;
    }
}
EOF

# 启用配置
ln -s /etc/nginx/sites-available/videoai /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

---

## 💰 费用估算

### RTX 3090 (24GB)
- **小时费用**: $0.34/小时 (约2.4元人民币)
- **每天8小时**: $2.72/天 (约19元)
- **每月**: 约 $81 (约580元人民币)

### RTX 4090 (24GB)
- **小时费用**: $0.69/小时 (约5元人民币)
- **每天8小时**: $5.52/天 (约40元)
- **每月**: 约 $165 (约1185元人民币)

### 省钱技巧
1. **使用Spot实例**：价格便宜30-50%
2. **按需启停**：不用时停止Pod
3. **使用Volume持久化**：数据不会丢失
4. **监控费用**：设置余额预警

---

## 🐛 常见问题

### 1. 无法访问公网地址

**检查端口是否暴露**：
```bash
# 在RunPod控制台确认端口3001已暴露
# 检查服务是否运行
pm2 status
curl http://localhost:3001/health
```

### 2. 服务启动失败

**查看错误日志**：
```bash
pm2 logs --err
cat /workspace/videoai-webapp/logs/backend-error.log
```

### 3. GPU内存不足

**检查GPU使用**：
```bash
nvidia-smi
```

**释放内存**：
```bash
pm2 restart all
```

### 4. 模型下载失败

**手动下载**：
```bash
cd /workspace/models
git lfs install
git clone https://huggingface.co/TencentGameMate/chinese-wav2vec2-base
```

### 5. 数据库错误

**重新初始化**：
```bash
cd /workspace/videoai-webapp
rm database/videoai.db
node server/scripts/init_database.js
pm2 restart videoai-backend
```

---

## 📊 监控和维护

### 设置日志轮转
```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 100M
pm2 set pm2-logrotate:retain 7
```

### 定期备份数据库
```bash
# 手动备份
cp /workspace/videoai-webapp/database/videoai.db \
   /workspace/backups/videoai_$(date +%Y%m%d).db

# 设置自动备份（cron）
crontab -e
# 添加：每天凌晨3点备份
0 3 * * * cp /workspace/videoai-webapp/database/videoai.db /workspace/backups/videoai_$(date +\%Y\%m\%d).db
```

### 监控GPU温度
```bash
watch -n 1 'nvidia-smi --query-gpu=temperature.gpu,utilization.gpu,memory.used,memory.total --format=csv'
```

---

## 🔄 从Mock切换到真实服务

当您准备好真实的TTS和ComfyUI模型后：

### 1. 下载真实模型

```bash
cd /workspace/models

# IndexTTS2
git clone https://huggingface.co/IndexTeam/IndexTTS2

# Wan2.1 视频生成模型
git clone https://huggingface.co/Lightricks/LTX-Video
```

### 2. 创建真实服务脚本

参考 `server/services/indextts2_server.py` 和 `server/services/comfyui_wrapper.py`

### 3. 修改PM2配置

编辑 `ecosystem.config.cjs`，将mock服务替换为真实服务。

### 4. 重启服务

```bash
pm2 restart all
```

---

## 📞 获取帮助

- **RunPod文档**: https://docs.runpod.io/
- **RunPod Discord**: https://discord.gg/runpod
- **RunPod支持**: support@runpod.io

---

## ✅ 部署检查清单

- [ ] RunPod账号已创建并充值
- [ ] 代码已推送到Git仓库
- [ ] GPU Pod已创建（RTX 3090/4090）
- [ ] 端口已暴露（3001, 5000, 8188）
- [ ] 部署脚本已执行成功
- [ ] 所有服务状态为 "online"
- [ ] 可以访问公网地址
- [ ] 测试账号可以登录
- [ ] GPU显示正常（nvidia-smi）
- [ ] 日志无严重错误

---

**祝您部署顺利！** 🎉

如有问题，请随时查看日志或联系技术支持。

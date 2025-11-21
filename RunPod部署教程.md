# 🚀 RunPod 部署教程 - VideoAI Pro

完整的 RunPod GPU 服务器部署指南，包含截图和详细步骤。

---

## 📋 目录

1. [准备工作](#1-准备工作)
2. [创建 RunPod 实例](#2-创建-runpod-实例)
3. [连接到服务器](#3-连接到服务器)
4. [部署 VideoAI Pro](#4-部署-videoai-pro)
5. [部署 AI 服务](#5-部署-ai-服务)
6. [验证和测试](#6-验证和测试)
7. [常见问题](#7-常见问题)

---

## 1️⃣ 准备工作

### 1.1 注册 RunPod 账号

1. 访问 https://www.runpod.io/
2. 点击右上角 **"Sign Up"**
3. 使用 Google 或 GitHub 账号快速注册
4. 验证邮箱

### 1.2 充值

1. 进入控制台后，点击右上角头像 → **"Billing"**
2. 选择充值金额：
   - **建议充值 $50**（可用约1个月）
   - 最低充值 $10
3. 支持信用卡或加密货币支付

### 1.3 准备 Git 仓库

确保你的 VideoAI Pro 代码已经推送到 GitHub：

```bash
# 在本地检查
git remote -v

# 如果还没有推送，执行：
git add .
git commit -m "准备部署到RunPod"
git push origin main
```

记下你的仓库地址，例如：
```
https://github.com/你的用户名/videoai-pro.git
```

---

## 2️⃣ 创建 RunPod 实例

### 2.1 选择 GPU 类型

1. 进入 RunPod 控制台
2. 点击左侧 **"GPU Instances"**
3. 点击 **"Deploy"** 按钮

### 2.2 配置实例

#### 推荐配置方案

| 配置项 | 推荐值 | 说明 |
|--------|--------|------|
| **GPU** | RTX 3090 (24GB) | 性价比最高 |
| **vCPU** | 8 cores | 自动配置 |
| **RAM** | 32 GB | 自动配置 |
| **存储** | 100 GB | 容器磁盘 |
| **持久存储** | 50 GB（可选） | 用于保存模型 |

#### 详细步骤

**Step 1: 选择模板**
- 选择 **"RunPod PyTorch"** 或 **"RunPod Stable Diffusion"**
- 或直接选择 **"Ubuntu 22.04"** 基础镜像

**Step 2: 选择 GPU**
- 找到 **RTX 3090** 卡片
- 查看价格：通常 $0.34/小时
- 点击 **"Deploy"**

**Step 3: 配置选项**
```yaml
Container Disk: 100 GB
Expose HTTP Ports: 80, 8188, 9880
Expose TCP Ports: 22 (SSH)
```

**Step 4: 高级设置（可选）**
```bash
# 环境变量（可选）
JUPYTER_PASSWORD=your_password
```

**Step 5: 部署**
- 点击 **"Deploy"**
- 等待实例启动（约 1-2 分钟）

### 2.3 获取连接信息

实例启动后，你会看到：

```
Pod ID: xxxxx-xxxxx
Status: Running
GPU: RTX 3090 24GB

Connect:
  SSH: ssh root@xxx.xxx.xxx.xxx -p 22222
  HTTP: https://xxxxx-80.proxy.runpod.net
```

**重要信息：**
- **SSH 地址**：用于命令行连接
- **HTTP 地址**：部署完成后的访问地址
- **密码**：通过 SSH 密码或上传 SSH 公钥

---

## 3️⃣ 连接到服务器

### 3.1 使用 SSH 连接（推荐）

#### Windows 用户

1. **安装 SSH 客户端**
   - Windows 10/11 自带 SSH
   - 或下载 [PuTTY](https://www.putty.org/)

2. **打开 PowerShell 或 CMD**
   ```powershell
   ssh root@xxx.xxx.xxx.xxx -p 22222
   ```

3. **输入密码**（在 RunPod 控制台查看）

#### Mac/Linux 用户

```bash
# 直接使用终端
ssh root@xxx.xxx.xxx.xxx -p 22222
```

### 3.2 使用 Web Terminal（简单）

1. 在 RunPod 控制台中
2. 点击实例的 **"Connect"** 按钮
3. 选择 **"Start Web Terminal"**
4. 在浏览器中打开终端

---

## 4️⃣ 部署 VideoAI Pro

### 4.1 下载部署脚本

连接到服务器后，执行：

```bash
# 检查系统信息
nvidia-smi  # 查看GPU
df -h       # 查看磁盘空间

# 进入工作目录
cd /workspace
# 如果没有 /workspace，使用 cd ~

# 下载部署脚本（方法一：从Git）
git clone https://github.com/你的用户名/videoai-pro.git
cd videoai-pro

# 或者（方法二：直接创建脚本）
wget https://raw.githubusercontent.com/你的用户名/videoai-pro/main/deploy_runpod.sh
chmod +x deploy_runpod.sh
```

### 4.2 运行部署脚本

```bash
# 给脚本执行权限
chmod +x deploy_runpod.sh

# 运行部署（需要10-15分钟）
bash deploy_runpod.sh
```

**脚本会自动完成：**
1. ✅ 更新系统
2. ✅ 安装 Node.js 20
3. ✅ 安装 Redis
4. ✅ 安装 FFmpeg
5. ✅ 安装 PM2
6. ✅ 克隆项目代码
7. ✅ 安装依赖
8. ✅ 构建前端
9. ✅ 配置 Nginx
10. ✅ 启动服务

### 4.3 输入 Git 仓库地址

当脚本提示时，输入你的仓库地址：

```
❓ 请输入你的Git仓库地址：
   格式: https://github.com/你的用户名/videoai-pro.git
Git URL: https://github.com/yourname/videoai-pro.git
```

### 4.4 等待完成

看到以下信息说明部署成功：

```
================================================
✅ VideoAI Pro 部署完成！
================================================

🎉 服务已启动！

📊 服务状态：
┌─────┬────────┬─────────┬─────────┐
│ id  │ name   │ status  │ restart │
├─────┼────────┼─────────┼─────────┤
│ 0   │ videoai│ online  │ 0       │
└─────┴────────┴─────────┴─────────┘

🌐 访问地址：
   http://123.456.789.10
```

---

## 5️⃣ 部署 AI 服务

VideoAI Pro 后端已经启动，但还需要部署 AI 服务。

### 5.1 运行 AI 服务部署脚本

```bash
cd /workspace/videoai-pro
# 或 cd ~/videoai-pro

chmod +x deploy_ai_services.sh
bash deploy_ai_services.sh
```

**这个脚本会部署：**
1. **IndexTTS2**（语音生成服务）- 端口 9880
2. **ComfyUI + MuseTalk**（视频生成服务）- 端口 8188

**预计时间：30-60 分钟**
- 下载依赖包：15-20分钟
- 下载模型文件：20-40分钟（取决于网络）

### 5.2 下载模型文件

#### IndexTTS2 模型

```bash
cd /workspace/IndexTTS2/checkpoints

# 选项1：从官方下载（需要VPN）
wget https://huggingface.co/IndexTTS2/models/resolve/main/indextts2_base.pth

# 选项2：从国内镜像下载
# 联系项目作者获取模型文件

# 选项3：手动上传
# 使用 scp 或 FileZilla 上传到服务器
```

#### MuseTalk 模型

```bash
cd /workspace/ComfyUI/custom_nodes/MuseTalk/models

# 下载模型（约5GB）
wget https://huggingface.co/TMElyralab/MuseTalk/resolve/main/musetalk.pth
wget https://huggingface.co/TMElyralab/MuseTalk/resolve/main/sd-vae-ft-mse.pth
```

### 5.3 验证 AI 服务

```bash
# 查看服务状态
pm2 status

# 应该看到：
# ┌─────┬────────────┬─────────┐
# │ id  │ name       │ status  │
# ├─────┼────────────┼─────────┤
# │ 0   │ videoai    │ online  │
# │ 1   │ indextts2  │ online  │
# │ 2   │ comfyui    │ online  │
# └─────┴────────────┴─────────┘

# 测试 IndexTTS2
curl http://localhost:9880/health

# 测试 ComfyUI
curl http://localhost:8188/system_stats
```

---

## 6️⃣ 验证和测试

### 6.1 访问前端

打开浏览器，访问 RunPod 提供的地址：

```
https://xxxxx-80.proxy.runpod.net
```

或使用公网 IP：
```
http://123.456.789.10
```

### 6.2 注册测试账号

1. 点击右上角 **"注册"**
2. 填写信息：
   - 用户名：`testuser`
   - 邮箱：`test@example.com`
   - 密码：`Test123456`
3. 点击注册

### 6.3 创建测试视频

1. 点击 **"创建视频"**
2. **Step 1**：输入文本
   ```
   大家好，我是AI数字人。今天给大家介绍一个非常有趣的项目！
   ```
   点击"优化文本"

3. **Step 2**：选择声音
   - 选择"磁性男声"
   - 点击"试听"
   - 调整语速和音调

4. **Step 3**：选择模板
   - 选择"商务模板"

5. **Step 4**：确认配置
   - 查看预估费用
   - 点击"开始生成"

6. **查看任务**
   - 进入"我的任务"
   - 查看生成进度
   - 等待完成（约2-5分钟）

### 6.4 查看日志

如果生成失败，查看日志：

```bash
# 查看后端日志
pm2 logs videoai --lines 50

# 查看TTS日志
pm2 logs indextts2 --lines 50

# 查看视频生成日志
pm2 logs comfyui --lines 50

# 查看Redis队列
redis-cli
> KEYS *
> GET bull:video-generation:*
```

---

## 7️⃣ 常见问题

### Q1: 服务启动失败

**症状：** `pm2 status` 显示服务状态为 `errored`

**解决：**
```bash
# 查看详细错误
pm2 logs videoai --lines 100

# 常见原因：
# 1. 端口被占用
lsof -i :3001
kill -9 <PID>

# 2. 权限问题
chmod -R 755 /workspace/videoai-pro
chown -R root:root /workspace/videoai-pro

# 3. 依赖缺失
cd /workspace/videoai-pro
npm install

# 重启服务
pm2 restart videoai
```

### Q2: 无法访问网站

**症状：** 浏览器显示 "无法连接"

**解决：**
```bash
# 检查Nginx状态
systemctl status nginx
nginx -t  # 测试配置

# 重启Nginx
systemctl restart nginx

# 检查防火墙（RunPod通常不需要）
ufw status
ufw allow 80

# 检查端口
netstat -tlnp | grep 80
```

### Q3: TTS 生成失败

**症状：** 音频预览报错 "TTS服务不可用"

**解决：**
```bash
# 检查IndexTTS2服务
pm2 logs indextts2

# 重启TTS服务
pm2 restart indextts2

# 测试TTS API
curl -X POST http://localhost:9880/api/v1/tts \
  -H "Content-Type: application/json" \
  -d '{"text":"测试","voiceId":"default"}'

# 检查模型文件
ls -lh /workspace/IndexTTS2/checkpoints/
```

### Q4: 视频生成卡住

**症状：** 任务一直显示 "处理中" 不完成

**解决：**
```bash
# 查看ComfyUI日志
pm2 logs comfyui

# 查看GPU使用情况
nvidia-smi

# 检查队列
redis-cli
> KEYS bull:video-generation:*
> HGETALL bull:video-generation:1

# 重启ComfyUI
pm2 restart comfyui
```

### Q5: 磁盘空间不足

**症状：** 生成失败，提示 "No space left"

**解决：**
```bash
# 检查磁盘空间
df -h

# 清理临时文件
cd /workspace/videoai-pro
rm -rf public/uploads/*.tmp
rm -rf public/generated/temp_*

# 清理Docker（如果有）
docker system prune -a

# 清理PM2日志
pm2 flush
```

### Q6: GPU 内存不足

**症状：** 日志显示 "CUDA out of memory"

**解决：**
```bash
# 查看GPU使用
nvidia-smi

# 重启所有GPU服务
pm2 restart indextts2
pm2 restart comfyui

# 减少并发任务数
# 编辑 .env 文件
cd /workspace/videoai-pro
nano .env

# 添加：
MAX_CONCURRENT_JOBS=1
```

### Q7: 模型下载太慢

**解决方案1：使用代理**
```bash
# 设置代理（如果有）
export http_proxy=http://proxy:port
export https_proxy=http://proxy:port

# 使用HuggingFace镜像
export HF_ENDPOINT=https://hf-mirror.com
```

**解决方案2：本地上传**
```bash
# 在本地下载模型后，使用scp上传
scp -P 22222 model.pth root@xxx.xxx.xxx.xxx:/workspace/IndexTTS2/checkpoints/
```

### Q8: 如何停止服务省钱

```bash
# 临时停止所有服务（不删除数据）
pm2 stop all

# 在RunPod控制台中点击 "Stop" 暂停实例
# 暂停后只收取存储费用，不收取GPU费用

# 恢复服务
# 在RunPod控制台点击 "Start"
# SSH连接后运行：
pm2 restart all
```

---

## 8️⃣ 成本优化建议

### 按需使用策略

| 使用场景 | 推荐配置 | 月成本 |
|----------|----------|--------|
| **开发测试** | 按小时租用，用完即停 | ~$50 |
| **小规模生产** | 每天8小时 | ~$80 |
| **24/7运行** | 持续运行 | ~$245 |

### 省钱技巧

1. **使用 Spot 实例**
   - RunPod 提供 Spot GPU，价格便宜50%
   - 缺点：可能随时被回收

2. **定时启停**
   ```bash
   # 创建定时任务（晚上停止）
   crontab -e
   # 添加：
   0 22 * * * pm2 stop all
   0 8 * * * pm2 restart all
   ```

3. **使用持久存储**
   - 数据保存在 Persistent Storage
   - 停止实例时数据不丢失
   - 只支付存储费用（$0.10/GB/月）

4. **批量处理**
   - 积累多个任务一起处理
   - 避免频繁启停服务

---

## 9️⃣ 进阶配置

### 配置 HTTPS（使用 Cloudflare Tunnel）

```bash
# 安装cloudflared
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
dpkg -i cloudflared-linux-amd64.deb

# 登录Cloudflare
cloudflared tunnel login

# 创建隧道
cloudflared tunnel create videoai

# 配置域名
cloudflared tunnel route dns videoai videoai.yourdomain.com

# 启动隧道
cloudflared tunnel run videoai
```

### 配置监控（Prometheus + Grafana）

```bash
# 安装Prometheus
docker run -d --name prometheus \
  -p 9090:9090 \
  prom/prometheus

# 安装Grafana
docker run -d --name=grafana \
  -p 3000:3000 \
  grafana/grafana

# 添加GPU监控
pip install prometheus-nvidia-exporter
```

---

## 🎉 完成！

现在你的 VideoAI Pro 已经在 RunPod 上成功运行了！

**下一步：**
1. 🎨 自定义模板
2. 🎤 上传自定义声音
3. 📊 查看数据统计
4. 🔐 配置生产环境安全设置

**需要帮助？**
- 查看项目文档：`README.md`
- 查看日志：`pm2 logs`
- 联系技术支持

---

**祝你使用愉快！🚀**

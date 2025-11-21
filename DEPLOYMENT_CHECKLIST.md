# ✅ RunPod部署检查清单

使用此清单确保部署的每一步都正确完成。

---

## 📋 部署前检查

### ☑️ 本地准备

- [ ] 代码已提交到Git：`git status` 无未提交更改
- [ ] 代码已推送到GitHub：`git push origin main`
- [ ] 记录仓库地址：`https://github.com/你的用户名/videoai-pro.git`
- [ ] 本地测试通过：`npm run dev` 可正常访问

### ☑️ RunPod账号准备

- [ ] 已注册RunPod账号：https://www.runpod.io/
- [ ] 已完成邮箱验证
- [ ] 账户已充值：至少 **$20**（建议 $50）
- [ ] 了解计费方式：按小时计费

### ☑️ 技术准备

- [ ] 了解基本的Linux命令
- [ ] 会使用SSH连接服务器
- [ ] 理解GPU显存和VRAM概念
- [ ] 知道如何使用`pm2`查看日志

---

## 🚀 部署步骤检查

### 第1步：创建RunPod实例

- [ ] 登录RunPod控制台
- [ ] 点击"Deploy"创建新实例
- [ ] 选择GPU：**RTX 3090 (24GB)** ✅ 推荐
- [ ] 配置Container Disk：**100 GB** 或更大
- [ ] 暴露端口：**80** (HTTP)
- [ ] 点击"Deploy"并等待启动（约1-2分钟）
- [ ] 记录实例信息：
  ```
  Pod ID: _______________
  SSH地址: _______________
  HTTP地址: _______________
  密码: _______________
  ```

### 第2步：连接到服务器

#### 方法A：SSH连接（推荐）
- [ ] 打开终端（Windows: PowerShell, Mac/Linux: Terminal）
- [ ] 执行：`ssh root@<RunPod-IP> -p <端口>`
- [ ] 输入密码并成功连接
- [ ] 看到欢迎信息和命令提示符

#### 方法B：Web Terminal
- [ ] 在RunPod控制台点击"Connect"
- [ ] 选择"Start Web Terminal"
- [ ] 在浏览器中成功打开终端

### 第3步：检查环境

```bash
# 检查GPU
- [ ] nvidia-smi  # 应显示GPU信息
      GPU: RTX 3090 24GB ✅
      CUDA Version: 11.x 或 12.x ✅

# 检查工作目录
- [ ] cd /workspace && pwd  # 应显示 /workspace
      或 cd ~ && pwd  # 显示 /root

# 检查网络
- [ ] ping -c 3 google.com  # 应有响应
```

### 第4步：克隆项目代码

```bash
cd /workspace  # 或 cd ~

# 克隆仓库
- [ ] git clone https://github.com/你的用户名/videoai-pro.git
      Cloning into 'videoai-pro'... ✅
      
- [ ] cd videoai-pro && ls -la
      看到文件：deploy_runpod.sh, package.json 等 ✅
```

### 第5步：部署VideoAI Pro主应用

```bash
# 给脚本执行权限
- [ ] chmod +x deploy_runpod.sh

# 运行部署脚本
- [ ] bash deploy_runpod.sh
      
      等待过程中应看到：
      - [ ] ✅ 更新系统
      - [ ] ✅ 安装Node.js 20
      - [ ] ✅ 安装Redis
      - [ ] ✅ 安装FFmpeg
      - [ ] ✅ 安装PM2
      - [ ] ✅ 克隆项目（或跳过）
      - [ ] ✅ 安装依赖
      - [ ] ✅ 构建前端
      - [ ] ✅ 配置Nginx
      - [ ] ✅ 启动服务
      
      预计时间：5-10分钟 ⏱️

# 验证部署成功
- [ ] 看到成功消息：
      ```
      ================================================
      ✅ VideoAI Pro 部署完成！
      ================================================
      ```
```

### 第6步：验证主应用服务

```bash
# 检查PM2服务状态
- [ ] pm2 status
      应该看到：
      ┌─────┬────────┬─────────┐
      │ id  │ name   │ status  │
      ├─────┼────────┼─────────┤
      │ 0   │ videoai│ online  │✅
      └─────┴────────┴─────────┘

# 检查Nginx状态
- [ ] systemctl status nginx
      Active: active (running) ✅

# 检查Redis
- [ ] redis-cli ping
      PONG ✅

# 测试后端API
- [ ] curl http://localhost:3001/api/health
      应返回：{"status":"healthy"} ✅
```

### 第7步：访问网站前端

```bash
# 获取公网IP
- [ ] curl ifconfig.me
      记录IP: _______________

# 在浏览器访问
- [ ] 打开浏览器，访问：
      http://<你的RunPod-IP>
      或
      https://<xxxxx>-80.proxy.runpod.net
      
      应该看到：
      - [ ] VideoAI Pro 登录/注册页面 ✅
      - [ ] 页面样式正常加载 ✅
      - [ ] 无明显错误提示 ✅
```

### 第8步：部署AI服务（IndexTTS2 + ComfyUI）

```bash
cd /workspace/videoai-pro

# 给脚本执行权限
- [ ] chmod +x deploy_ai_services.sh

# 运行AI服务部署
- [ ] bash deploy_ai_services.sh
      
      预计时间：30-60分钟 ⏱️
      
      过程中应看到：
      - [ ] ✅ 克隆IndexTTS2
      - [ ] ✅ 创建Python虚拟环境
      - [ ] ✅ 安装依赖包
      - [ ] ✅ 下载模型文件（较慢）
      - [ ] ✅ 启动TTS服务
      - [ ] ✅ 克隆ComfyUI
      - [ ] ✅ 安装MuseTalk
      - [ ] ✅ 启动视频生成服务
      
# ⚠️ 注意：模型下载可能很慢
      - 如果下载失败，可以手动下载后上传
      - 或使用国内镜像
```

### 第9步：验证AI服务

```bash
# 检查所有PM2服务
- [ ] pm2 status
      应该看到3个服务都在运行：
      ┌─────┬────────────┬─────────┐
      │ id  │ name       │ status  │
      ├─────┼────────────┼─────────┤
      │ 0   │ videoai    │ online  │✅
      │ 1   │ indextts2  │ online  │✅
      │ 2   │ comfyui    │ online  │✅
      └─────┴────────────┴─────────┘

# 测试IndexTTS2
- [ ] curl http://localhost:9880/health
      应返回：{"status":"healthy"} ✅

# 测试ComfyUI
- [ ] curl http://localhost:8188/system_stats
      应返回GPU信息 ✅

# 检查GPU使用
- [ ] nvidia-smi
      应看到IndexTTS2和ComfyUI进程 ✅
```

### 第10步：端到端测试

```bash
# 在网站上测试完整流程
- [ ] 注册新账号
      用户名：testuser
      邮箱：test@example.com
      密码：Test123456
      
- [ ] 登录成功 ✅

- [ ] 点击"创建视频"
      
- [ ] Step 1: 输入文本
      文本："大家好，欢迎来到VideoAI Pro！"
      点击"优化文本" ✅
      
- [ ] Step 2: 音频预览
      选择声音："磁性男声"
      点击"试听" ✅
      能听到声音 ✅
      
- [ ] Step 3: 选择模板
      选择任意模板 ✅
      
- [ ] Step 4: 确认配置
      查看费用估算 ✅
      点击"开始生成" ✅
      
- [ ] 进入"我的任务"
      看到任务状态："处理中" ✅
      
- [ ] 等待2-5分钟
      任务状态变为："已完成" ✅
      
- [ ] 点击播放视频
      视频正常播放 ✅
      声音和画面同步 ✅
```

---

## ✅ 部署后配置

### 安全设置

- [ ] 修改root密码：`passwd`
- [ ] 配置SSH密钥登录（可选）
- [ ] 设置防火墙规则（可选）

### 性能优化

- [ ] 查看GPU使用率是否正常
- [ ] 查看内存使用情况：`free -h`
- [ ] 查看磁盘空间：`df -h`
- [ ] 设置定时任务（可选）：`crontab -e`

### 备份配置

- [ ] 备份数据库：
      ```bash
      mkdir -p /workspace/backups
      cp /workspace/videoai-pro/data/database.sqlite \
         /workspace/backups/db_$(date +%Y%m%d).sqlite
      ```

- [ ] 备份环境配置：
      ```bash
      cp /workspace/videoai-pro/.env \
         /workspace/backups/.env.backup
      ```

### 监控设置

- [ ] 配置PM2日志：`pm2 logs --lines 100`
- [ ] 设置GPU监控：`watch -n 2 nvidia-smi`
- [ ] 配置磁盘空间告警（可选）

---

## 🐛 问题排查检查点

### 如果服务无法启动

- [ ] 查看PM2日志：`pm2 logs <service-name>`
- [ ] 检查端口占用：`netstat -tlnp`
- [ ] 检查磁盘空间：`df -h`
- [ ] 重启服务：`pm2 restart all`

### 如果无法访问网站

- [ ] 检查Nginx：`systemctl status nginx`
- [ ] 测试Nginx配置：`nginx -t`
- [ ] 检查防火墙：`ufw status`
- [ ] 重启Nginx：`systemctl restart nginx`

### 如果TTS生成失败

- [ ] 查看IndexTTS2日志：`pm2 logs indextts2`
- [ ] 检查模型文件：`ls -lh /workspace/IndexTTS2/checkpoints/`
- [ ] 测试TTS API：`curl http://localhost:9880/health`
- [ ] 重启TTS服务：`pm2 restart indextts2`

### 如果视频生成失败

- [ ] 查看ComfyUI日志：`pm2 logs comfyui`
- [ ] 检查GPU内存：`nvidia-smi`
- [ ] 检查模型文件：`ls -lh /workspace/ComfyUI/models/`
- [ ] 重启视频服务：`pm2 restart comfyui`

---

## 📝 记录信息

### 服务器信息

```
RunPod实例ID: _______________
GPU型号: _______________
公网IP: _______________
SSH端口: _______________
创建时间: _______________
```

### 服务端口

```
前端: http://IP:80
后端API: http://localhost:3001
IndexTTS2: http://localhost:9880
ComfyUI: http://localhost:8188
Redis: localhost:6379
```

### 账号信息

```
Root密码: _______________
测试账号: _______________
测试密码: _______________
```

### 重要路径

```
项目目录: /workspace/videoai-pro
数据库: /workspace/videoai-pro/data/database.sqlite
上传目录: /workspace/videoai-pro/public/uploads
生成目录: /workspace/videoai-pro/public/generated
TTS目录: /workspace/IndexTTS2
ComfyUI目录: /workspace/ComfyUI
```

---

## 🎉 部署完成标志

当你完成以下所有检查项，部署就算成功了：

- ✅ 所有PM2服务状态为 `online`
- ✅ Nginx服务正常运行
- ✅ Redis可以正常连接
- ✅ 前端页面可以访问
- ✅ 可以注册和登录
- ✅ 可以试听声音
- ✅ 可以生成视频
- ✅ 视频可以正常播放

---

## 📚 有用的命令

```bash
# 查看所有服务
pm2 status

# 查看日志
pm2 logs

# 重启所有服务
pm2 restart all

# 查看GPU
nvidia-smi

# 查看磁盘
df -h

# 查看内存
free -h

# 测试网络
ping google.com

# 查看进程
htop
```

---

## 💡 下一步

部署完成后，你可以：

1. 🎨 **自定义模板** - 添加更多视频模板
2. 🎤 **上传声音** - 克隆自己的声音
3. 📊 **查看统计** - 分析使用数据
4. 🔧 **优化配置** - 调整生成参数
5. 💰 **成本优化** - 实施省钱策略

---

**祝你部署顺利！🚀**

如有问题，参考：
- `RunPod部署教程.md` - 详细教程
- `RunPod快速命令.md` - 命令速查
- `DEPLOYMENT_FLOW.md` - 架构图

# VideoAI Pro - 生产环境部署指南

## 📋 部署前准备

### 系统要求

#### 最低配置（Mock模式，仅测试）
- **操作系统**: Ubuntu 20.04+ / CentOS 8+ / Debian 11+
- **CPU**: 2核心
- **内存**: 4GB RAM
- **磁盘**: 20GB可用空间
- **网络**: 公网IP或域名

#### 推荐配置（完整功能）
- **操作系统**: Ubuntu 22.04 LTS
- **CPU**: 8核心+ (Intel Xeon / AMD EPYC)
- **GPU**: NVIDIA RTX 3090 / RTX 4090 / A100 (24GB+ VRAM)
- **内存**: 32GB+ RAM
- **磁盘**: 500GB+ SSD (用于模型和视频存储)
- **网络**: 100Mbps+ 带宽

### 软件依赖

```bash
# 1. Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 2. Python 3.9+
sudo apt-get install -y python3 python3-pip python3-venv

# 3. Nginx
sudo apt-get install -y nginx

# 4. PM2 (全局安装)
sudo npm install -g pm2

# 5. FFmpeg (视频处理)
sudo apt-get install -y ffmpeg

# 6. 其他工具
sudo apt-get install -y git curl wget
```

### GPU环境（可选）

如果需要使用真实的AI模型：

```bash
# 1. NVIDIA驱动
sudo ubuntu-drivers autoinstall

# 2. CUDA Toolkit 11.8+
wget https://developer.download.nvidia.com/compute/cuda/11.8.0/local_installers/cuda_11.8.0_520.61.05_linux.run
sudo sh cuda_11.8.0_520.61.05_linux.run

# 3. cuDNN
# 从 https://developer.nvidia.com/cudnn 下载并安装

# 4. 验证安装
nvidia-smi
nvcc --version
```

---

## 🚀 快速部署（推荐）

### 方法1: 自动部署脚本

```bash
# 1. 克隆或上传代码到服务器
cd /home/user/webapp

# 2. 运行部署脚本
chmod +x deploy.sh
./deploy.sh
```

脚本会自动完成：
- ✅ 安装依赖
- ✅ 构建前端
- ✅ 配置PM2
- ✅ 启动服务

---

## 📝 手动部署步骤

### Step 1: 准备代码

```bash
# 上传代码到服务器
cd /home/user
git clone <your-repo-url> webapp
# 或使用 scp/rsync 上传

cd webapp
```

### Step 2: 配置环境变量

```bash
# 1. 后端环境变量
cp .env.example .env.production
nano .env.production

# 必须修改的配置：
# - JWT_SECRET: 使用 openssl rand -base64 32 生成
# - CORS_ORIGIN: 您的域名
# - FRONTEND_URL: 前端地址
```

```bash
# 2. 前端环境变量
cd client
cp .env.example .env.production
nano .env.production

# 必须修改：
# - VITE_API_URL: 后端API地址（如 https://api.your-domain.com）
cd ..
```

### Step 3: 安装依赖

```bash
# 后端依赖
npm install --production

# 前端依赖
cd client
npm install
cd ..

# Python依赖（Mock服务）
pip3 install flask flask-cors
```

### Step 4: 构建前端

```bash
cd client
npm run build

# 验证构建结果
ls -lh dist/
# 应该看到 index.html 和 assets/ 目录
cd ..
```

### Step 5: 配置PM2

```bash
# 安装PM2（如果未安装）
sudo npm install -g pm2

# 启动服务
pm2 start ecosystem.config.js

# 查看状态
pm2 status

# 查看日志
pm2 logs

# 保存配置
pm2 save

# 设置开机自启
sudo pm2 startup
```

### Step 6: 配置Nginx

```bash
# 1. 复制配置文件
sudo cp nginx.conf /etc/nginx/sites-available/videoai-pro

# 2. 编辑配置，修改域名
sudo nano /etc/nginx/sites-available/videoai-pro
# 将 your-domain.com 改为实际域名

# 3. 启用站点
sudo ln -s /etc/nginx/sites-available/videoai-pro /etc/nginx/sites-enabled/

# 4. 测试配置
sudo nginx -t

# 5. 重启Nginx
sudo systemctl restart nginx
```

### Step 7: 配置防火墙

```bash
# Ubuntu/Debian (UFW)
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# CentOS/RHEL (firewalld)
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

### Step 8: 配置SSL证书（推荐）

```bash
# 使用 Let's Encrypt
sudo apt-get install -y certbot python3-certbot-nginx

# 申请证书
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# 自动续期
sudo certbot renew --dry-run
```

---

## 🔧 配置选项

### 部署模式选择

#### 模式1: Mock模式（无GPU）

适合：测试、演示、开发环境

```bash
# .env.production
INDEXTTS2_API_URL=http://localhost:5000  # Mock服务
COMFYUI_API_URL=http://localhost:8188    # Mock服务
```

PM2会自动启动Mock服务。

#### 模式2: GPU模式（完整功能）

适合：生产环境

```bash
# .env.production
INDEXTTS2_API_URL=http://localhost:5000  # 真实IndexTTS2
COMFYUI_API_URL=http://localhost:8188    # 真实ComfyUI
```

需要手动部署GPU服务，参考 `deploy_gpu_production.sh`

### 数据库配置

默认使用SQLite，数据库文件位于：
```
database/videoai_production.db
```

**重要：定期备份数据库！**

```bash
# 备份脚本
cp database/videoai_production.db backups/backup_$(date +%Y%m%d_%H%M%S).db
```

---

## 📊 监控和维护

### PM2 常用命令

```bash
# 查看状态
pm2 status

# 查看日志
pm2 logs                  # 所有服务
pm2 logs videoai-backend  # 特定服务

# 重启服务
pm2 restart all           # 所有服务
pm2 restart videoai-backend

# 停止服务
pm2 stop all

# 删除服务
pm2 delete all

# 监控面板
pm2 monit
```

### 日志文件位置

```
logs/
├── backend-error.log       # 后端错误日志
├── backend-out.log         # 后端输出日志
├── indextts2-error.log     # TTS服务错误日志
├── indextts2-out.log       # TTS服务输出日志
├── comfyui-error.log       # ComfyUI错误日志
└── comfyui-out.log         # ComfyUI输出日志
```

### 性能监控

```bash
# 实时监控
pm2 monit

# CPU/内存使用
htop

# 磁盘使用
df -h
du -sh database/ public/uploads/

# 网络连接
netstat -tulpn | grep -E '3001|5000|8188'
```

### 健康检查

```bash
# 后端API
curl http://localhost:3001/health

# IndexTTS2
curl http://localhost:5000/health

# ComfyUI
curl http://localhost:8188/health

# 前端（通过Nginx）
curl http://your-domain.com
```

---

## 🛠️ 故障排除

### 问题1: 服务无法启动

```bash
# 检查端口占用
sudo lsof -i :3001
sudo lsof -i :5000
sudo lsof -i :8188

# 检查PM2日志
pm2 logs --err

# 检查系统日志
sudo journalctl -u nginx -n 50
```

### 问题2: 前端无法访问

```bash
# 检查Nginx状态
sudo systemctl status nginx

# 检查Nginx配置
sudo nginx -t

# 检查前端构建
ls -lh client/dist/

# 查看Nginx日志
sudo tail -f /var/log/nginx/videoai_error.log
```

### 问题3: API请求失败

```bash
# 检查后端服务
pm2 status videoai-backend

# 查看后端日志
pm2 logs videoai-backend --lines 100

# 测试API连接
curl -v http://localhost:3001/health
```

### 问题4: 数据库错误

```bash
# 检查数据库文件权限
ls -l database/videoai_production.db

# 修复权限
chmod 644 database/videoai_production.db
chown user:user database/videoai_production.db

# 备份并重建（谨慎！）
cp database/videoai_production.db database/backup.db
rm database/videoai_production.db
# 重启服务会自动创建新数据库
pm2 restart videoai-backend
```

---

## 🔒 安全建议

### 1. 环境变量安全

```bash
# 生成强密钥
openssl rand -base64 32

# 设置文件权限
chmod 600 .env.production
```

### 2. 防火墙配置

```bash
# 只开放必要端口
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw deny 3001/tcp   # 后端API（通过Nginx代理）
```

### 3. 定期更新

```bash
# 系统更新
sudo apt-get update && sudo apt-get upgrade -y

# Node.js依赖更新
npm update

# 检查安全漏洞
npm audit
npm audit fix
```

### 4. 备份策略

```bash
# 自动备份脚本（添加到crontab）
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
tar -czf /backups/videoai_$DATE.tar.gz \
  /home/user/webapp/database/ \
  /home/user/webapp/public/uploads/ \
  /home/user/webapp/.env.production

# 每天凌晨3点备份
# 0 3 * * * /home/user/backup.sh
```

---

## 📈 性能优化

### 1. Nginx优化

```nginx
# 启用gzip压缩
gzip on;
gzip_types text/plain text/css application/json application/javascript text/xml application/xml;

# 增加工作进程
worker_processes auto;

# 调整缓冲区
client_body_buffer_size 128k;
client_max_body_size 50m;
```

### 2. Node.js优化

```bash
# 增加内存限制
pm2 start ecosystem.config.js --node-args="--max-old-space-size=4096"
```

### 3. 数据库优化

```sql
-- SQLite优化
PRAGMA journal_mode=WAL;
PRAGMA synchronous=NORMAL;
PRAGMA cache_size=10000;
```

---

## 🌐 域名和SSL配置

### 配置域名DNS

```
A记录:
your-domain.com     →  服务器IP
www.your-domain.com →  服务器IP
```

### 申请SSL证书

```bash
# 使用Certbot自动配置
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# 测试自动续期
sudo certbot renew --dry-run
```

---

## 📞 技术支持

### 查看完整文档

- `INTEGRATION_SUMMARY.md` - 技术架构
- `TEST_GUIDE.md` - API测试指南
- `NEXT_STEPS.md` - GPU部署指南

### 联系支持

如遇问题，请提供：
1. 错误信息（PM2日志）
2. 系统环境（OS、Node版本）
3. 配置文件（隐藏敏感信息）

---

**部署完成后，访问您的域名即可使用VideoAI Pro！** 🎉

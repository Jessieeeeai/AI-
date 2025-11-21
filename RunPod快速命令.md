# ⚡ RunPod 快速命令速查表

常用命令一键复制，快速解决问题！

---

## 🚀 一键部署

```bash
# 完整部署（一次性运行）
cd /workspace
git clone https://github.com/你的用户名/videoai-pro.git
cd videoai-pro
chmod +x deploy_runpod.sh deploy_ai_services.sh
bash deploy_runpod.sh && bash deploy_ai_services.sh
```

---

## 🔍 服务管理

### 查看所有服务状态
```bash
pm2 status
```

### 查看实时日志
```bash
# 后端日志
pm2 logs videoai --lines 50

# TTS服务日志
pm2 logs indextts2 --lines 50

# 视频生成日志
pm2 logs comfyui --lines 50

# 实时刷新（按Ctrl+C退出）
pm2 logs --lines 100
```

### 重启服务
```bash
# 重启所有服务
pm2 restart all

# 重启单个服务
pm2 restart videoai
pm2 restart indextts2
pm2 restart comfyui

# 强制重启
pm2 reload all
```

### 停止/启动服务
```bash
# 停止所有服务
pm2 stop all

# 启动所有服务
pm2 start all

# 删除服务（慎用）
pm2 delete videoai
```

---

## 🔧 故障排查

### 检查端口占用
```bash
# 查看所有端口
netstat -tlnp

# 查看特定端口
lsof -i :3001  # 后端
lsof -i :9880  # TTS
lsof -i :8188  # ComfyUI
lsof -i :80    # Nginx

# 杀死进程
kill -9 <PID>
```

### 检查服务健康
```bash
# 测试后端API
curl http://localhost:3001/api/health

# 测试TTS服务
curl http://localhost:9880/health

# 测试ComfyUI
curl http://localhost:8188/system_stats

# 测试Redis
redis-cli ping
```

### 查看GPU状态
```bash
# GPU使用情况
nvidia-smi

# 实时监控（每2秒刷新）
watch -n 2 nvidia-smi

# GPU详细信息
nvidia-smi -L
nvidia-smi --query-gpu=gpu_name,memory.total,memory.used,memory.free --format=csv
```

### 查看磁盘空间
```bash
# 磁盘使用情况
df -h

# 当前目录大小
du -sh *

# 查找大文件
du -ah /workspace | sort -rh | head -20
```

### 查看系统资源
```bash
# CPU和内存
htop

# 或者
top

# 详细内存信息
free -h
```

---

## 🗄️ 数据库管理

### 查看数据库
```bash
cd /workspace/videoai-pro

# 打开SQLite
sqlite3 data/database.sqlite

# 常用SQL命令
> .tables                    # 查看所有表
> .schema tasks              # 查看表结构
> SELECT * FROM tasks LIMIT 5;  # 查看最近5个任务
> SELECT COUNT(*) FROM users;   # 统计用户数
> .quit                      # 退出
```

### 重置数据库（慎用）
```bash
cd /workspace/videoai-pro

# 备份数据库
cp data/database.sqlite data/database.sqlite.backup

# 删除数据库
rm data/database.sqlite

# 重新初始化
node server/migrations/run.js
```

---

## 📦 清理和维护

### 清理临时文件
```bash
cd /workspace/videoai-pro

# 清理上传的临时文件
rm -rf public/uploads/*.tmp

# 清理生成的临时视频
rm -rf public/generated/temp_*

# 清理30天前的文件
find public/uploads -mtime +30 -type f -delete
find public/generated -mtime +30 -type f -delete
```

### 清理日志
```bash
# 清理PM2日志
pm2 flush

# 清理系统日志
journalctl --vacuum-time=7d

# 清理Nginx日志
echo "" > /var/log/nginx/access.log
echo "" > /var/log/nginx/error.log
```

### 清理Docker（如果使用）
```bash
# 清理未使用的镜像
docker system prune -a

# 清理所有停止的容器
docker container prune
```

---

## 🔄 更新和升级

### 更新代码
```bash
cd /workspace/videoai-pro

# 备份.env
cp .env .env.backup

# 拉取最新代码
git pull origin main

# 安装新依赖
npm install
cd client && npm install && cd ..

# 重新构建前端
cd client && npm run build && cd ..
rm -rf dist
cp -r client/dist ./dist

# 运行数据库迁移
node server/migrations/run.js

# 重启服务
pm2 restart videoai
```

### 更新系统包
```bash
# 更新系统
apt update && apt upgrade -y

# 更新Node.js包
npm update -g npm
npm update -g pm2

# 更新Python包
pip install --upgrade pip
```

---

## 🔐 安全管理

### 修改密码
```bash
# 修改root密码
passwd

# 生成SSH密钥
ssh-keygen -t rsa -b 4096

# 查看公钥
cat ~/.ssh/id_rsa.pub
```

### 配置防火墙（可选）
```bash
# 安装UFW
apt install -y ufw

# 允许SSH
ufw allow 22/tcp

# 允许HTTP/HTTPS
ufw allow 80/tcp
ufw allow 443/tcp

# 启用防火墙
ufw enable

# 查看状态
ufw status
```

---

## 📊 性能监控

### 查看队列状态
```bash
# 进入Redis CLI
redis-cli

# 查看所有队列
> KEYS bull:video-generation:*

# 查看等待中的任务
> LLEN bull:video-generation:wait

# 查看活跃任务
> LLEN bull:video-generation:active

# 查看失败任务
> LLEN bull:video-generation:failed

# 查看某个任务详情
> HGETALL bull:video-generation:1

# 清空队列（慎用）
> FLUSHALL

> exit
```

### 导出任务数据
```bash
cd /workspace/videoai-pro

# 导出所有任务到CSV
sqlite3 data/database.sqlite << EOF
.headers on
.mode csv
.output tasks_export.csv
SELECT * FROM tasks;
.quit
EOF

# 查看导出文件
cat tasks_export.csv
```

---

## 🚨 紧急修复

### 服务完全崩溃
```bash
# 1. 停止所有服务
pm2 kill

# 2. 重启Redis
redis-cli shutdown
redis-server --daemonize yes

# 3. 重启Nginx
systemctl restart nginx

# 4. 重新启动所有PM2服务
cd /workspace/videoai-pro
pm2 start server/index.js --name videoai

cd /workspace/IndexTTS2
pm2 start start_tts.sh --name indextts2 --interpreter bash

cd /workspace/ComfyUI
pm2 start start_comfyui.sh --name comfyui --interpreter bash

pm2 save
```

### GPU驱动问题
```bash
# 重新加载NVIDIA模块
modprobe nvidia

# 重启NVIDIA服务
systemctl restart nvidia-persistenced

# 重新安装驱动（最后手段）
apt install --reinstall nvidia-driver-xxx
```

### 内存不足
```bash
# 立即释放缓存
sync; echo 3 > /proc/sys/vm/drop_caches

# 查看内存占用进程
ps aux --sort=-%mem | head

# 杀死占用内存最多的进程
kill -9 <PID>
```

---

## 📁 文件传输

### 上传文件到服务器
```bash
# 从本地上传（在本地电脑运行）
scp -P 22222 local_file.zip root@xxx.xxx.xxx.xxx:/workspace/

# 上传整个目录
scp -r -P 22222 local_folder root@xxx.xxx.xxx.xxx:/workspace/
```

### 从服务器下载
```bash
# 下载文件到本地（在本地电脑运行）
scp -P 22222 root@xxx.xxx.xxx.xxx:/workspace/file.zip ./

# 下载目录
scp -r -P 22222 root@xxx.xxx.xxx.xxx:/workspace/folder ./
```

---

## 🎯 快速测试

### 端到端测试
```bash
cd /workspace/videoai-pro

# 运行测试脚本
npm test

# 或手动测试
node test_migration.js
node test_tts_integration.js
```

### API测试
```bash
# 测试注册
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@test.com","password":"Test123"}'

# 测试登录
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Test123"}'

# 测试TTS
curl -X POST http://localhost:9880/api/v1/tts \
  -H "Content-Type: application/json" \
  -d '{"text":"测试语音生成","voiceId":"default"}' \
  --output test.wav
```

---

## 💾 备份和恢复

### 备份所有数据
```bash
cd /workspace

# 创建备份目录
mkdir -p backups/$(date +%Y%m%d)

# 备份数据库
cp videoai-pro/data/database.sqlite backups/$(date +%Y%m%d)/

# 备份上传文件
tar -czf backups/$(date +%Y%m%d)/uploads.tar.gz videoai-pro/public/uploads/

# 备份配置
cp videoai-pro/.env backups/$(date +%Y%m%d)/

# 打包所有备份
tar -czf backup_$(date +%Y%m%d).tar.gz backups/$(date +%Y%m%d)/

# 下载备份到本地（在本地运行）
scp -P 22222 root@xxx.xxx.xxx.xxx:/workspace/backup_*.tar.gz ./
```

### 恢复备份
```bash
cd /workspace

# 解压备份
tar -xzf backup_20240115.tar.gz

# 恢复数据库
cp backups/20240115/database.sqlite videoai-pro/data/

# 恢复上传文件
tar -xzf backups/20240115/uploads.tar.gz -C videoai-pro/public/

# 恢复配置
cp backups/20240115/.env videoai-pro/

# 重启服务
pm2 restart all
```

---

## 🔔 有用的别名（可选）

把以下内容添加到 `~/.bashrc`：

```bash
# 编辑bashrc
nano ~/.bashrc

# 添加这些别名
alias pm='pm2 status'
alias pml='pm2 logs'
alias pmr='pm2 restart all'
alias pms='pm2 stop all'
alias gpu='nvidia-smi'
alias disk='df -h'
alias vapp='cd /workspace/videoai-pro'

# 保存后重新加载
source ~/.bashrc
```

现在可以快速使用：
```bash
pm      # 查看服务状态
pml     # 查看日志
pmr     # 重启所有
gpu     # 查看GPU
vapp    # 进入项目目录
```

---

## 📞 获取帮助

### 查看服务文档
```bash
cd /workspace/videoai-pro

# 查看README
cat README.md

# 查看部署指南
cat GPU完整方案.md

# 查看RunPod教程
cat RunPod部署教程.md
```

### 导出调试信息
```bash
# 创建调试报告
cat > debug_report.txt << EOF
=== 系统信息 ===
$(uname -a)
$(nvidia-smi)

=== 服务状态 ===
$(pm2 status)

=== 磁盘空间 ===
$(df -h)

=== 内存使用 ===
$(free -h)

=== 最近错误日志 ===
$(pm2 logs --err --lines 50)
EOF

# 查看报告
cat debug_report.txt
```

---

**🎉 有了这些命令，你可以轻松管理 RunPod 上的 VideoAI Pro！**

**收藏此页面，随时查阅！📌**

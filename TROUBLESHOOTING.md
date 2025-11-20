# 🔧 故障排除指南

## 🚨 常见问题快速修复

### 问题1：服务启动失败

**症状**：
```bash
pm2 status
# 显示某个服务 "errored" 或 "stopped"
```

**解决方案A：查看错误日志**
```bash
pm2 logs --err
# 或查看特定服务
pm2 logs videoai-backend --err
```

**解决方案B：重启服务**
```bash
# 重启所有服务
pm2 restart all

# 重启特定服务
pm2 restart videoai-backend
```

**解决方案C：完全重置**
```bash
# 停止所有服务
pm2 delete all

# 重新启动
cd /workspace/videoai-webapp
pm2 start ecosystem.config.cjs
```

---

### 问题2：网站无法访问

**症状**：浏览器显示 "无法访问此网站" 或 "ERR_CONNECTION_REFUSED"

**检查步骤**：

**步骤1：检查服务状态**
```bash
pm2 status
# 确保 videoai-backend 为 "online"
```

**步骤2：检查端口**
```bash
curl http://localhost:3001/health
# 应该返回: {"status":"ok","service":"VideoAI Backend"}
```

**步骤3：检查RunPod端口配置**
- 进入RunPod控制台
- 查看Pod详情
- 确认端口3001已暴露
- 查看正确的公网URL

**步骤4：检查防火墙**
```bash
# 在RunPod上通常不需要配置防火墙
# 如果使用Nginx，检查配置
nginx -t
systemctl status nginx
```

---

### 问题3：数据库错误

**症状**：
```
Error: SQLITE_ERROR: no such table: users
```

**解决方案：重新初始化数据库**
```bash
cd /workspace/videoai-webapp

# 备份旧数据库（如果有重要数据）
cp database/videoai.db database/videoai_backup_$(date +%Y%m%d).db

# 删除旧数据库
rm database/videoai.db

# 重新初始化
node server/scripts/init_database.js

# 重启后端
pm2 restart videoai-backend
```

---

### 问题4：登录失败 - Token过期

**症状**：
```
401 Unauthorized
Token expired
```

**解决方案**：
- 前端：清除浏览器缓存和LocalStorage
- 重新登录

**手动清除Token**：
```javascript
// 在浏览器控制台执行
localStorage.clear()
sessionStorage.clear()
location.reload()
```

---

### 问题5：文件上传失败

**症状**：
```
Error: File too large
或
Error: Invalid file type
```

**检查文件限制**：
```bash
# 查看后端配置
cat /workspace/videoai-webapp/.env | grep UPLOAD

# 检查上传目录权限
ls -la /workspace/videoai-webapp/public/uploads
```

**修复上传目录权限**：
```bash
cd /workspace/videoai-webapp
mkdir -p public/uploads/voices public/uploads/templates public/uploads/videos
chmod -R 755 public/uploads
```

**修改文件大小限制**（如需要）：
```javascript
// server/index.js
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
```

---

### 问题6：GPU内存不足

**症状**：
```
CUDA out of memory
RuntimeError: CUDA error: out of memory
```

**检查GPU使用**：
```bash
nvidia-smi
```

**解决方案A：释放GPU内存**
```bash
# 重启消耗GPU的服务
pm2 restart mock-indextts2
pm2 restart mock-comfyui

# 或重启所有服务
pm2 restart all
```

**解决方案B：清理CUDA缓存**
```python
# 在Python控制台执行
import torch
torch.cuda.empty_cache()
```

**解决方案C：优化模型加载**
- 使用FP16/FP8精度
- 启用梯度检查点
- 减少批量大小

---

### 问题7：TTS生成失败

**症状**：
```
TTS预览失败
Error: preview_failed
```

**检查TTS服务**：
```bash
# 检查服务状态
pm2 status mock-indextts2

# 查看日志
pm2 logs mock-indextts2

# 测试TTS服务
curl http://localhost:5000/health
```

**重启TTS服务**：
```bash
pm2 restart mock-indextts2
```

---

### 问题8：视频生成失败

**症状**：
```
Video generation failed
Error connecting to ComfyUI
```

**检查ComfyUI服务**：
```bash
# 检查服务状态
pm2 status mock-comfyui

# 查看日志
pm2 logs mock-comfyui

# 测试ComfyUI服务
curl http://localhost:8188/health
```

**重启ComfyUI服务**：
```bash
pm2 restart mock-comfyui
```

---

### 问题9：积分扣除错误

**症状**：
- 积分扣除但生成失败
- 积分为负数
- 积分未扣除

**修复用户积分**：
```bash
cd /workspace/videoai-webapp

# 查看用户积分
node -e "
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database/videoai.db');
db.all('SELECT id, username, credits FROM users', (err, rows) => {
  console.table(rows);
  db.close();
});
"

# 手动修改积分
node update_credits.js <user_id> <new_credits>
# 例如：node update_credits.js 1 1000
```

---

### 问题10：前端白屏

**症状**：打开网站显示白屏，控制台有错误

**检查前端构建**：
```bash
cd /workspace/videoai-webapp/client
ls -la dist/
```

**重新构建前端**：
```bash
cd /workspace/videoai-webapp/client
rm -rf dist/
npm install
npm run build
cd ..
pm2 restart videoai-backend
```

**检查API配置**：
```javascript
// client/src/services/api.js
// 确认 baseURL 配置正确
const api = axios.create({
  baseURL: '/api',  // 应该是相对路径
  timeout: 30000
});
```

---

### 问题11：日志文件过大

**症状**：磁盘空间不足，日志占用大量空间

**查看日志大小**：
```bash
du -sh /workspace/videoai-webapp/logs/*
ls -lh ~/.pm2/logs/
```

**清理日志**：
```bash
# 清理PM2日志
pm2 flush

# 手动删除旧日志
rm /workspace/videoai-webapp/logs/*.log

# 重启PM2（会创建新日志文件）
pm2 restart all
```

**配置日志轮转**：
```bash
# 安装PM2日志轮转模块
pm2 install pm2-logrotate

# 配置
pm2 set pm2-logrotate:max_size 100M     # 单个文件最大100MB
pm2 set pm2-logrotate:retain 7          # 保留7个文件
pm2 set pm2-logrotate:compress true     # 压缩旧日志
pm2 set pm2-logrotate:workerInterval 60 # 每60秒检查一次
```

---

### 问题12：Git拉取失败

**症状**：
```
git pull
fatal: unable to access 'https://github.com/...': Could not resolve host
```

**解决方案A：检查网络**
```bash
ping github.com
curl https://github.com
```

**解决方案B：使用SSH代替HTTPS**
```bash
# 修改远程URL
git remote set-url origin git@github.com:username/repo.git
```

**解决方案C：配置代理（如需要）**
```bash
git config --global http.proxy http://proxy.server:port
```

---

### 问题13：PM2进程重复

**症状**：`pm2 status` 显示同一服务多次

**清理重复进程**：
```bash
# 删除所有进程
pm2 delete all

# 重新启动
cd /workspace/videoai-webapp
pm2 start ecosystem.config.cjs

# 保存配置
pm2 save
```

---

### 问题14：模型加载失败

**症状**：
```
Error: Model not found
OSError: [Errno 2] No such file or directory: '/workspace/models/...'
```

**检查模型路径**：
```bash
ls -la /workspace/models/
```

**重新下载模型**：
```bash
cd /workspace/models

# Wav2Vec
git clone https://huggingface.co/TencentGameMate/chinese-wav2vec2-base

# IndexTTS2（如需要）
git clone https://huggingface.co/IndexTeam/IndexTTS2

# 验证下载
du -sh /workspace/models/*
```

---

### 问题15：端口冲突

**症状**：
```
Error: listen EADDRINUSE: address already in use :::3001
```

**查看端口占用**：
```bash
lsof -i :3001
netstat -tulpn | grep 3001
```

**杀死占用端口的进程**：
```bash
# 找到PID
lsof -i :3001
# 或
ps aux | grep node

# 杀死进程
kill -9 <PID>

# 重启服务
pm2 restart videoai-backend
```

---

## 🔍 深度排查工具

### 实时日志监控
```bash
# 监控所有日志
pm2 logs --lines 100

# 监控特定服务
pm2 logs videoai-backend --lines 50

# 只看错误
pm2 logs --err

# 实时跟踪
pm2 logs --lines 0 --raw
```

### 系统资源监控
```bash
# PM2监控面板
pm2 monit

# GPU监控
watch -n 1 nvidia-smi

# CPU和内存
htop

# 磁盘空间
df -h

# 网络连接
netstat -tulpn
```

### 数据库检查
```bash
cd /workspace/videoai-webapp

# 连接数据库
sqlite3 database/videoai.db

# SQL命令
.tables                          # 查看所有表
SELECT * FROM users LIMIT 5;    # 查看用户
SELECT * FROM generations;       # 查看生成记录
.quit                           # 退出
```

### 网络诊断
```bash
# 测试后端
curl -i http://localhost:3001/health

# 测试TTS
curl -i http://localhost:5000/health

# 测试ComfyUI
curl -i http://localhost:8188/health

# 测试API接口
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test123"}'
```

---

## 📞 获取支持

### 准备问题报告

当需要寻求帮助时，请准备以下信息：

```bash
# 收集诊断信息
cd /workspace/videoai-webapp

# 创建诊断报告
cat > diagnostic_report.txt << EOF
=== 系统信息 ===
$(date)
$(uname -a)

=== GPU信息 ===
$(nvidia-smi)

=== 服务状态 ===
$(pm2 status)

=== 最近的错误日志 ===
$(pm2 logs --err --lines 50)

=== 磁盘空间 ===
$(df -h)

=== 内存使用 ===
$(free -h)

=== 环境变量 ===
NODE_ENV=$NODE_ENV
PORT=$PORT
EOF

# 查看报告
cat diagnostic_report.txt
```

### 联系方式

- **RunPod支持**：support@runpod.io
- **RunPod Discord**：https://discord.gg/runpod
- **RunPod文档**：https://docs.runpod.io/
- **项目Issues**：在GitHub仓库创建Issue

---

## 🛠️ 预防性维护

### 每日检查
```bash
# 快速健康检查脚本
cat > /workspace/daily_check.sh << 'EOF'
#!/bin/bash
echo "=== 每日健康检查 ==="
echo "1. 服务状态:"
pm2 status
echo ""
echo "2. GPU状态:"
nvidia-smi --query-gpu=name,temperature.gpu,utilization.gpu,memory.used --format=csv
echo ""
echo "3. 磁盘空间:"
df -h | grep -E "Filesystem|/workspace"
echo ""
echo "4. 最近错误:"
pm2 logs --err --lines 10 --nostream
EOF

chmod +x /workspace/daily_check.sh
```

### 每周维护
```bash
# 每周维护脚本
cat > /workspace/weekly_maintenance.sh << 'EOF'
#!/bin/bash
echo "=== 每周维护任务 ==="
echo "1. 备份数据库..."
cp /workspace/videoai-webapp/database/videoai.db \
   /workspace/backups/videoai_$(date +%Y%m%d).db

echo "2. 清理旧日志..."
pm2 flush

echo "3. 清理旧备份（保留30天）..."
find /workspace/backups -type f -mtime +30 -delete

echo "4. 更新代码..."
cd /workspace/videoai-webapp
git pull

echo "5. 重启服务..."
pm2 restart all

echo "=== 维护完成 ==="
EOF

chmod +x /workspace/weekly_maintenance.sh
```

### 设置定时任务
```bash
# 编辑crontab
crontab -e

# 添加定时任务
# 每天凌晨3点执行每日检查
0 3 * * * /workspace/daily_check.sh >> /workspace/logs/daily_check.log 2>&1

# 每周日凌晨4点执行维护
0 4 * * 0 /workspace/weekly_maintenance.sh >> /workspace/logs/weekly_maintenance.log 2>&1
```

---

**记住**：大多数问题可以通过 `pm2 restart all` 解决！ 🔄

如果问题持续存在，请收集诊断信息并联系技术支持。

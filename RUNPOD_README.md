# 🚀 VideoAI Pro - RunPod 部署总指南

## 📚 文档导航

### 🎯 快速开始
- **[5分钟快速部署](RUNPOD_QUICKSTART.md)** ⚡
  - 适合：想立即部署的用户
  - 内容：最简化的3步部署流程

### 📖 详细指南
- **[完整部署指南](RUNPOD_DEPLOYMENT.md)** 📋
  - 适合：第一次部署，需要详细说明
  - 内容：每个步骤的详细说明和解释

### 💰 费用相关
- **[费用详解](RUNPOD_PRICING.md)** 💳
  - 适合：想了解成本的用户
  - 内容：价格对比、省钱技巧、费用估算

### ✅ 部署检查
- **[部署检查清单](DEPLOYMENT_CHECKLIST.md)** 📝
  - 适合：执行部署时使用
  - 内容：逐项检查，确保不遗漏

### 🔧 故障排除
- **[故障排除指南](TROUBLESHOOTING.md)** 🛠️
  - 适合：遇到问题时查阅
  - 内容：常见问题和解决方案

---

## 🎯 根据您的情况选择

### 😊 我是新手，第一次部署
**推荐阅读顺序**：
1. [RUNPOD_QUICKSTART.md](RUNPOD_QUICKSTART.md) - 了解大致流程
2. [RUNPOD_PRICING.md](RUNPOD_PRICING.md) - 了解费用
3. [RUNPOD_DEPLOYMENT.md](RUNPOD_DEPLOYMENT.md) - 详细部署步骤
4. [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md) - 边做边勾选

---

### 💪 我有经验，快速部署
**推荐阅读顺序**：
1. [RUNPOD_QUICKSTART.md](RUNPOD_QUICKSTART.md) - 看概述
2. 直接执行部署脚本

**快速命令**：
```bash
# 1. 推送代码到GitHub
cd /home/user/webapp
./push_to_github.sh

# 2. 在RunPod创建Pod（RTX 3090，端口3001/5000/8188）

# 3. 在RunPod中执行
cd /workspace
git clone <你的仓库地址>
cd videoai-webapp
./deploy_runpod.sh
```

---

### 💰 我想了解成本
**直接查看**：[RUNPOD_PRICING.md](RUNPOD_PRICING.md)

**快速参考**：
- RTX 3090: $0.34/小时 ≈ 2.4元/小时
- 每天8小时: 约19元/天
- 每月: 约580元/月

**省钱技巧**：
- ✅ 按需启停（节省50%+）
- ✅ 使用Spot实例（便宜30-40%）
- ✅ 使用Persistent Volume（避免重复下载）

---

### 🐛 我遇到问题了
**直接查看**：[TROUBLESHOOTING.md](TROUBLESHOOTING.md)

**最快解决方案**：
```bash
# 90%的问题可以这样解决
pm2 restart all
```

**如果还不行**：
```bash
# 查看错误日志
pm2 logs --err

# 完全重启
pm2 delete all
pm2 start ecosystem.config.cjs
```

---

## 🎬 部署流程概览

```
第1步：准备代码
├─ 在开发环境提交代码
├─ 推送到GitHub
└─ 确认代码完整

第2步：注册RunPod
├─ 创建账号
├─ 充值 $20+
└─ 设置余额预警

第3步：创建GPU Pod
├─ 选择 RTX 3090
├─ 配置存储（50GB + 100GB）
├─ 暴露端口（3001, 5000, 8188）
└─ 启动Pod

第4步：部署应用
├─ 连接到Pod
├─ 克隆代码
├─ 运行 deploy_runpod.sh
└─ 等待完成（10-20分钟）

第5步：测试验证
├─ 访问公网地址
├─ 登录测试账号
├─ 测试核心功能
└─ 检查服务状态

第6步：投入使用
├─ 开始使用
├─ 监控资源
├─ 定期维护
└─ 按需扩展
```

---

## 📋 核心配置参考

### RunPod GPU配置
```yaml
GPU: RTX 3090 或 RTX 4090
显存: 24GB
模板: runpod/pytorch:2.1.0-py3.10-cuda11.8.0-devel
Container Disk: 50GB
Volume Disk: 100GB（勾选Persistent）
暴露端口: 3001, 5000, 8188
```

### 环境变量
```bash
NODE_ENV=production
PORT=3001
DATABASE_PATH=/workspace/videoai-webapp/database/videoai.db
UPLOAD_DIR=/workspace/videoai-webapp/public/uploads
INDEXTTS2_API_URL=http://localhost:5000
COMFYUI_API_URL=http://localhost:8188
JWT_SECRET=your-secret-key
```

### PM2服务
```javascript
- videoai-backend    (端口3001) - Node.js后端
- mock-indextts2     (端口5000) - TTS服务
- mock-comfyui       (端口8188) - ComfyUI服务
```

---

## 🔗 重要链接

### RunPod相关
- **官网**: https://www.runpod.io/
- **文档**: https://docs.runpod.io/
- **Discord**: https://discord.gg/runpod
- **支持**: support@runpod.io

### 项目相关
- **GitHub**: https://github.com/yourusername/videoai-webapp
- **演示站**: （部署后填写）
- **文档站**: （如果有）

### AI模型相关
- **IndexTTS2**: https://huggingface.co/IndexTeam/IndexTTS2
- **Wav2Vec**: https://huggingface.co/TencentGameMate/chinese-wav2vec2-base
- **LTX-Video**: https://huggingface.co/Lightricks/LTX-Video

---

## 📞 获取帮助

### 查看文档
1. 先查看对应的文档文件
2. 使用文档内的搜索功能
3. 查看故障排除指南

### 社区支持
- RunPod Discord社区
- GitHub Issues
- 技术论坛

### 直接支持
- RunPod官方支持：support@runpod.io
- 紧急问题：在Discord @官方人员

---

## 🎯 测试账号

**VIP账号（1000积分）**：
```
用户名: vip_user
密码: vip123456
邮箱: vip@videoai.com
```

**普通测试账号**：
```
用户名: test_user
密码: test123456
邮箱: test@videoai.com
积分: 100
```

查看完整账号列表：
```bash
cat /workspace/videoai-webapp/TEST_ACCOUNTS.md
```

---

## 🔄 常用命令速查

### 服务管理
```bash
pm2 status           # 查看状态
pm2 logs             # 查看日志
pm2 restart all      # 重启所有服务
pm2 stop all         # 停止所有服务
pm2 delete all       # 删除所有服务
```

### GPU监控
```bash
nvidia-smi           # 查看GPU状态
watch -n 1 nvidia-smi # 实时监控
```

### 代码更新
```bash
cd /workspace/videoai-webapp
git pull             # 拉取最新代码
npm install          # 安装新依赖
pm2 restart all      # 重启服务
```

### 数据库管理
```bash
# 备份数据库
cp database/videoai.db database/backup_$(date +%Y%m%d).db

# 查看数据库
sqlite3 database/videoai.db
```

### 日志管理
```bash
pm2 logs --lines 100 # 查看最近100行
pm2 logs --err       # 只看错误
pm2 flush            # 清空日志
```

---

## ✅ 部署成功标志

- [ ] `pm2 status` 所有服务显示 "online" ✅
- [ ] 可以访问公网URL ✅
- [ ] 测试账号可以登录 ✅
- [ ] 声音上传和预览正常 ✅
- [ ] 模板显示正常 ✅
- [ ] GPU显示正常使用 ✅
- [ ] 无严重错误日志 ✅

**全部打勾？恭喜您部署成功！** 🎉

---

## 📈 下一步优化

### 性能优化
- [ ] 从Mock切换到真实TTS模型
- [ ] 从Mock切换到真实ComfyUI
- [ ] 配置Redis缓存
- [ ] 优化数据库索引

### 功能扩展
- [ ] 添加用户充值功能
- [ ] 添加更多模板
- [ ] 添加批量生成
- [ ] 添加API接口

### 生产环境
- [ ] 配置Nginx反向代理
- [ ] 绑定自定义域名
- [ ] 配置SSL证书
- [ ] 设置CDN加速

### 监控运维
- [ ] 设置自动备份
- [ ] 配置监控告警
- [ ] 性能分析
- [ ] 日志分析

---

## 💡 小贴士

1. **定期备份**：数据库和上传文件要定期备份
2. **监控资源**：定期检查GPU、CPU、内存使用情况
3. **查看日志**：遇到问题先看日志
4. **测试先行**：功能更新前先在开发环境测试
5. **文档更新**：配置变更后更新文档

---

## 📊 项目统计

- **总代码量**: 约15,000行
- **主要技术**: Node.js, React, SQLite, PyTorch
- **核心功能**: TTS声音克隆, AI视频生成, 用户管理
- **部署时间**: 10-20分钟
- **预计月费用**: 600-1800元（根据使用量）

---

## 🎉 开始您的部署之旅

**准备好了吗？**

1. 如果您是新手 → 阅读 [RUNPOD_QUICKSTART.md](RUNPOD_QUICKSTART.md)
2. 如果需要详细步骤 → 阅读 [RUNPOD_DEPLOYMENT.md](RUNPOD_DEPLOYMENT.md)
3. 如果想了解费用 → 阅读 [RUNPOD_PRICING.md](RUNPOD_PRICING.md)

**或者直接开始：**

```bash
# 第一步：推送代码
cd /home/user/webapp
./push_to_github.sh

# 第二步：访问 RunPod
# https://www.runpod.io/

# 第三步：创建Pod并执行
cd /workspace
git clone <你的仓库>
cd videoai-webapp
./deploy_runpod.sh
```

---

**祝您部署顺利！如有问题，随时查阅对应文档。** 🚀

---

*最后更新: 2025-11-20*
*版本: 1.0.0*
*作者: GenSpark AI*

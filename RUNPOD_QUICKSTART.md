# ⚡ RunPod 快速开始（5分钟部署）

## 🎯 您需要做的3件事

### 1️⃣ 准备Git仓库（2分钟）

```bash
# 在当前开发环境执行
cd /home/user/webapp

# 提交所有代码
git add .
git commit -m "feat: VideoAI Pro完整项目"

# 推送到GitHub（先在GitHub创建仓库）
git remote add origin https://github.com/你的用户名/videoai-webapp.git
git push -u origin main
```

**没有GitHub账号？**
1. 访问 https://github.com/signup
2. 创建账号（免费）
3. 创建新仓库：https://github.com/new

---

### 2️⃣ 注册RunPod并充值（3分钟）

1. **注册**：https://www.runpod.io/
2. **充值**：Billing → Add Credit → $20美元
   - 支持信用卡或加密货币
3. **创建Pod**：
   - GPU: 选择 **RTX 3090** ($0.34/小时)
   - 模板: **runpod/pytorch:2.1.0**
   - 存储: Container 50GB + Volume 100GB
   - 端口: `3001, 5000, 8188`
   - 点击 **Deploy**

---

### 3️⃣ 运行部署脚本（10分钟）

**连接到RunPod：**
- 点击Pod → "Connect" → "Start Web Terminal"

**执行命令：**
```bash
# 克隆您的项目
cd /workspace
git clone https://github.com/你的用户名/videoai-webapp.git
cd videoai-webapp

# 一键部署
chmod +x deploy_runpod.sh
./deploy_runpod.sh
```

**等待10-20分钟**，脚本会自动完成所有配置。

---

## 🌐 访问网站

部署完成后，在RunPod控制台找到：

```
HTTP Service Port 3001: https://xxx-3001.proxy.runpod.net
```

在浏览器打开这个地址！

---

## 🎉 测试账号

**VIP账号（1000积分）：**
- 用户名：`vip_user`
- 密码：`vip123456`

查看所有测试账号：
```bash
cat /workspace/videoai-webapp/TEST_ACCOUNTS.md
```

---

## 🔧 常用命令

```bash
# 查看服务状态
pm2 status

# 查看日志
pm2 logs

# 重启服务
pm2 restart all

# 查看GPU
nvidia-smi
```

---

## 💰 费用

- **RTX 3090**: $0.34/小时 ≈ 2.4元人民币/小时
- **每天8小时**: 约19元/天
- **每月**: 约580元/月

**省钱技巧**：不用时停止Pod（数据不会丢失）

---

## ❓ 遇到问题？

查看完整文档：`RUNPOD_DEPLOYMENT.md`

**常见问题快速修复：**

```bash
# 服务启动失败
pm2 logs --err

# 重启所有服务
pm2 restart all

# 数据库错误
cd /workspace/videoai-webapp
node server/scripts/init_database.js
pm2 restart videoai-backend
```

---

## 📋 检查清单

- [ ] 代码已推送到GitHub ✓
- [ ] RunPod账号已充值 ✓
- [ ] GPU Pod已创建 ✓
- [ ] 部署脚本执行成功 ✓
- [ ] `pm2 status` 显示所有服务 "online" ✓
- [ ] 可以访问网站 ✓
- [ ] 测试账号可以登录 ✓

**全部打勾？恭喜您部署成功！** 🎊

---

## 📞 需要帮助？

- 📖 完整文档：`RUNPOD_DEPLOYMENT.md`
- 🌐 RunPod官方：https://docs.runpod.io/
- 💬 Discord社区：https://discord.gg/runpod

# 🚀 RunPod 快速开始 - 3步部署

**只需3步，10分钟完成部署！**

---

## 📌 前提条件

1. ✅ 已注册 RunPod 账号：https://www.runpod.io
2. ✅ 已充值至少 $20
3. ✅ 代码已推送到 GitHub

---

## 🎯 3步部署流程

### 第1步：创建 GPU 实例（2分钟）

1. 访问 RunPod 控制台
2. 点击 **"Deploy"**
3. 选择 **RTX 3090 (24GB)** GPU
4. 配置：
   - Container Disk: **100 GB**
   - Expose Ports: **80**
5. 点击 **"Deploy"** 等待启动

### 第2步：连接并部署（5分钟）

**方法A：一键复制粘贴（推荐）**

```bash
# 1. 连接到服务器（SSH或Web Terminal）
ssh root@your-runpod-ip -p 22222

# 2. 复制粘贴以下命令（一次性执行）
cd /workspace && \
git clone https://github.com/你的用户名/videoai-pro.git && \
cd videoai-pro && \
chmod +x deploy_runpod.sh && \
bash deploy_runpod.sh
```

**完成！** 🎉

脚本会自动：
- ✅ 安装所有依赖
- ✅ 构建前端
- ✅ 启动后端服务
- ✅ 配置 Nginx

### 第3步：部署 AI 服务（30-60分钟）

```bash
cd /workspace/videoai-pro
bash deploy_ai_services.sh
```

这会部署：
- 🎤 IndexTTS2（语音生成）
- 🎨 ComfyUI（视频生成）

> ⏰ **注意**：AI 服务需要下载大量模型文件，建议在后台运行，去喝杯咖啡 ☕

---

## 🌐 访问网站

部署完成后，打开浏览器访问：

```
https://xxxxx-80.proxy.runpod.net
```

或使用公网IP：
```
http://你的RunPod实例IP
```

---

## 🎯 快速验证

### 1. 检查服务状态
```bash
pm2 status
# 应该看到 3 个服务在运行：
# - videoai (后端)
# - indextts2 (TTS)
# - comfyui (视频)
```

### 2. 测试API
```bash
# 测试后端
curl http://localhost:3001/api/health

# 测试TTS
curl http://localhost:9880/health

# 测试ComfyUI
curl http://localhost:8188/system_stats
```

### 3. 创建测试视频
1. 打开网站
2. 注册账号
3. 点击"创建视频"
4. 输入文本并生成

---

## 🔥 常用命令

```bash
# 查看服务状态
pm2 status

# 查看日志
pm2 logs

# 重启所有服务
pm2 restart all

# 查看GPU
nvidia-smi
```

---

## ❓ 遇到问题？

### Q: 服务启动失败？
```bash
# 查看详细错误
pm2 logs videoai --lines 100

# 重启服务
pm2 restart all
```

### Q: 无法访问网站？
```bash
# 检查Nginx
systemctl status nginx

# 重启Nginx
systemctl restart nginx
```

### Q: GPU内存不足？
```bash
# 查看GPU使用
nvidia-smi

# 重启AI服务
pm2 restart indextts2
pm2 restart comfyui
```

---

## 📚 详细文档

- 📖 **完整部署教程**：`RunPod部署教程.md`
- ⚡ **命令速查表**：`RunPod快速命令.md`
- 🔧 **GPU方案详解**：`GPU完整方案.md`
- 🚀 **快速启动**：`快速启动指南.md`

---

## 💰 成本估算

| 使用场景 | GPU | 月成本 |
|----------|-----|--------|
| **开发测试** | RTX 3090 | ~$50（按小时计费） |
| **小规模生产** | RTX 3090 | ~$80（每天8小时） |
| **24/7运行** | RTX 3090 | ~$245（持续运行） |

**省钱技巧**：
- 用完即停，不用时暂停实例
- 使用 Spot 实例（便宜50%）
- 批量处理任务

---

## 🎉 完成！

现在你已经在 RunPod 上成功部署了 VideoAI Pro！

**下一步：**
1. 🎨 探索不同的视频模板
2. 🎤 上传自定义声音
3. 📊 查看任务统计
4. 🔧 优化生成参数

**祝你使用愉快！** 🚀

---

## 📞 需要帮助？

- **查看日志**：`pm2 logs`
- **查看文档**：`cat RunPod部署教程.md`
- **查看命令**：`cat RunPod快速命令.md`

**记得收藏这个页面！** 📌

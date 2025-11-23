# VideoAI Pro - 部署前检查清单

> 📋 **目的**: 确保代码在GPU环境部署前完全验证，避免浪费GPU资源

---

## ✅ Phase 1: CPU环境验证 (本地/开发服务器)

### 1.1 环境配置

- [ ] 已创建 `.env.development` 文件
- [ ] `USE_MOCK_AI_SERVICES=true` 已设置
- [ ] Mock服务端口配置正确 (5000, 8188)
- [ ] 数据库路径配置正确
- [ ] 上传目录权限正确

### 1.2 依赖安装

```bash
cd /home/user/webapp
npm install
```

- [ ] 所有npm依赖安装成功
- [ ] 无`ENOENT`或`ERR_MODULE_NOT_FOUND`错误
- [ ] `uuid`包已安装 (videoGenerationService需要)

### 1.3 Mock服务启动

```bash
npm run mock:services
```

**验证清单**:
- [ ] Mock IndexTTS2启动成功 (端口5000)
- [ ] Mock ComfyUI启动成功 (端口8188)
- [ ] 控制台显示启动日志
- [ ] 无端口冲突错误

### 1.4 Mock服务健康检查

```bash
# 测试IndexTTS2
curl http://localhost:5000/health

# 测试ComfyUI
curl http://localhost:8188/system_stats
```

**验证清单**:
- [ ] IndexTTS2返回`{"status":"healthy","mode":"MOCK"}`
- [ ] ComfyUI返回系统状态JSON
- [ ] 响应时间 < 1秒

---

## ✅ Phase 2: 自动化测试验证

### 2.1 Mock服务测试

```bash
node tests/test-mock-services.js
```

**预期结果**:
- [ ] ✅ 测试1: IndexTTS2健康检查通过
- [ ] ✅ 测试2: TTS生成成功 (音频 > 1KB)
- [ ] ✅ 测试3: 声音列表获取成功
- [ ] ✅ 测试4: ComfyUI系统状态通过
- [ ] ✅ 测试5: 工作流提交成功
- [ ] ✅ 测试6: 任务状态查询成功

### 2.2 视频生成服务测试

```bash
node tests/test-video-generation.js
```

**预期结果**:
- [ ] ✅ 测试1: 文本分段功能正常
- [ ] ✅ 测试2: TTS音频生成成功
- [ ] ✅ 测试3: 完整文本音频生成成功
- [ ] ✅ 测试4: ComfyUI工作流构建正确
- [ ] ✅ 测试5: ComfyUI任务提交成功
- [ ] ✅ 测试6: 任务状态轮询完成

**总计**: [ ] 6/6 测试通过

---

## ✅ Phase 3: 后端API功能验证

### 3.1 启动后端服务

```bash
# 启动完整开发环境
npm run dev:mock
```

**验证清单**:
- [ ] Mock服务运行中
- [ ] 后端服务启动成功 (端口3001)
- [ ] 前端服务启动成功 (端口5173)
- [ ] 控制台显示AI服务配置为"Mock (CPU模拟)"

### 3.2 用户认证API

```bash
# 注册用户
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"Test123456"}'

# 登录
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123456"}'
```

**验证清单**:
- [ ] 注册返回用户信息和JWT token
- [ ] 登录返回JWT token
- [ ] 数据库user表有新记录
- [ ] 初始积分正确 (1000)

### 3.3 声音上传API

```bash
# 上传音频文件 (替换YOUR_JWT_TOKEN)
curl -X POST http://localhost:3001/api/upload/audio \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "audio=@test.mp3" \
  -F "voiceName=测试声音"
```

**验证清单**:
- [ ] 上传成功返回voice_id
- [ ] 文件保存到uploads目录
- [ ] 数据库user_voices表有记录
- [ ] 状态为`processing`
- [ ] 克隆任务自动触发
- [ ] 状态更新为`ready` (Mock模式即时)

### 3.4 TTS预览API

```bash
# TTS试听
curl -X POST http://localhost:3001/api/preview/tts \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"text":"这是测试文本","voiceId":"default"}' \
  --output preview.wav
```

**验证清单**:
- [ ] 返回WAV音频文件
- [ ] 文件大小 > 1KB
- [ ] 可以播放 (即使是模拟音频)
- [ ] 响应时间 < 2秒

---

## ✅ Phase 4: 前端功能验证

### 4.1 用户注册/登录

**访问**: `http://localhost:5173`

- [ ] 注册页面正常显示
- [ ] 注册表单验证正确
- [ ] 注册成功跳转到主页
- [ ] 登录页面正常显示
- [ ] 登录成功显示用户信息

### 4.2 声音管理

- [ ] 声音上传页面正常
- [ ] 文件选择器工作
- [ ] 上传进度显示
- [ ] 上传成功提示
- [ ] 我的声音列表显示
- [ ] 声音状态正确显示 (processing/ready)

### 4.3 TTS试听

- [ ] TTS页面正常显示
- [ ] 文本输入框正常
- [ ] 声音选择下拉框正常
- [ ] 试听按钮可点击
- [ ] 音频播放器显示
- [ ] 音频可以播放

### 4.4 视频项目创建

- [ ] 模板选择页面显示
- [ ] 模板卡片正常渲染
- [ ] 创建项目表单正常
- [ ] 文本编辑器工作
- [ ] 声音选择正常
- [ ] 提交后任务队列显示

---

## ✅ Phase 5: 数据库完整性验证

```bash
# 查看数据库
cd /home/user/webapp
sqlite3 database/videoai.db
```

### 5.1 用户表

```sql
SELECT * FROM users;
```

**验证清单**:
- [ ] 用户记录存在
- [ ] email唯一
- [ ] password已哈希
- [ ] credits正确

### 5.2 声音表

```sql
SELECT * FROM user_voices;
```

**验证清单**:
- [ ] 声音记录存在
- [ ] user_id关联正确
- [ ] audio_url路径正确
- [ ] status字段正确
- [ ] processed_at有时间戳 (ready状态)

### 5.3 项目表

```sql
SELECT * FROM projects;
```

**验证清单**:
- [ ] 项目记录存在
- [ ] user_id关联正确
- [ ] template_id关联正确
- [ ] voice_id关联正确
- [ ] status字段正确

---

## ✅ Phase 6: 错误处理验证

### 6.1 文件上传错误

- [ ] 上传非音频文件 → 返回错误提示
- [ ] 上传超大文件 (>50MB) → 返回错误提示
- [ ] 未登录上传 → 返回401错误

### 6.2 积分不足

- [ ] 模拟积分不足情况
- [ ] 前端显示积分不足提示
- [ ] 阻止生成任务提交

### 6.3 服务不可用

```bash
# 停止Mock服务
pkill -f mockIndexTTS2

# 测试TTS (应该优雅失败)
curl -X POST http://localhost:3001/api/preview/tts \
  -H "Content-Type: application/json" \
  -d '{"text":"测试","voiceId":"default"}'
```

**验证清单**:
- [ ] 返回友好错误消息
- [ ] 不返回500错误
- [ ] 前端显示服务不可用提示

---

## ✅ Phase 7: 性能验证

### 7.1 并发测试

```bash
# 使用ab工具测试
ab -n 100 -c 10 http://localhost:3001/api/preview/tts
```

**验证清单**:
- [ ] 无服务崩溃
- [ ] 平均响应时间 < 2秒
- [ ] 错误率 < 1%

### 7.2 大文本处理

```bash
# 测试1000字文本
node tests/test-long-text.js
```

**验证清单**:
- [ ] 文本分段正常
- [ ] 所有分段生成TTS
- [ ] 音频合并成功
- [ ] 总时间 < 30秒 (Mock模式)

---

## 🚀 Phase 8: GPU部署准备

### 8.1 代码审查

- [ ] 所有TODO注释已处理
- [ ] 无console.log泄露敏感信息
- [ ] 无硬编码路径
- [ ] 环境变量配置完整

### 8.2 生产环境配置

- [ ] `.env.production` 文件已创建
- [ ] `USE_MOCK_AI_SERVICES=false`
- [ ] GPU服务URL配置正确
- [ ] JWT_SECRET已更换为强密钥
- [ ] 数据库路径配置为生产路径

### 8.3 部署脚本验证

```bash
# 检查脚本语法
bash -n deploy_indextts2.sh
bash -n install_comfyui.sh

# 确认脚本可执行
ls -l *.sh
```

**验证清单**:
- [ ] 无语法错误
- [ ] 所有脚本有执行权限
- [ ] GitHub repo URLs正确 (无placeholder)

### 8.4 PM2配置

```bash
# 验证ecosystem.config.js
cat ecosystem.config.js
```

**验证清单**:
- [ ] 包含videoai-backend配置
- [ ] 包含indextts2配置
- [ ] 包含comfyui配置 (如需要)
- [ ] 环境变量设置正确
- [ ] 日志路径配置正确

---

## 🎯 最终确认清单

在部署到GPU前，确认以下所有项目:

### 代码质量
- [ ] ✅ 所有自动化测试通过
- [ ] ✅ 所有手动测试完成
- [ ] ✅ 无严重Bug或逻辑错误
- [ ] ✅ 错误处理完善

### 功能完整性
- [ ] ✅ 用户认证功能正常
- [ ] ✅ 声音上传/克隆正常
- [ ] ✅ TTS生成正常
- [ ] ✅ 文本处理正常
- [ ] ✅ 视频生成流程完整

### 数据库
- [ ] ✅ 所有表结构正确
- [ ] ✅ 索引创建完成
- [ ] ✅ 外键关系正确
- [ ] ✅ 迁移脚本无错误

### 配置文件
- [ ] ✅ 开发环境配置正确
- [ ] ✅ 生产环境配置准备好
- [ ] ✅ 环境切换机制测试通过
- [ ] ✅ 敏感信息已保护

### 部署准备
- [ ] ✅ GitHub代码已推送
- [ ] ✅ 部署脚本已验证
- [ ] ✅ PM2配置已准备
- [ ] ✅ 文档完整

---

## 📝 部署命令 (仅在所有检查通过后执行)

```bash
# 1. SSH连接到RunPod H100
ssh root@your-runpod-instance

# 2. 克隆代码
cd /workspace
git clone https://github.com/your-username/videoai-pro.git
cd videoai-pro

# 3. 切换到生产环境
export NODE_ENV=production

# 4. 部署IndexTTS2
bash deploy_indextts2.sh

# 5. 安装ComfyUI (如需要)
bash install_comfyui.sh

# 6. 安装Node.js依赖
npm install --production

# 7. 启动所有服务
pm2 start ecosystem.config.js

# 8. 查看日志
pm2 logs
```

---

## 🎉 祝贺!

如果所有检查项都完成，您的代码已经准备好部署到GPU环境！

**关键提示**:
- 部署到GPU后，第一次启动会下载模型 (约20GB，需10-30分钟)
- 监控PM2日志确保服务正常启动
- 再次运行健康检查确认真实服务可用
- 进行小规模用户测试后再全面开放

祝部署顺利! 🚀

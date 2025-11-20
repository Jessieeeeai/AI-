# Bug Fix: 音频文件播放失败

## 问题描述

用户上传声音文件后，点击"试听"按钮时出现错误提示：
```
播放失败，音频文件可能还在处理中
```

**截图显示：**
- "5173-i9rhlob99k2702jh40sbw-b9b802c4.sandbox.novita.ai 显示"
- "播放失败，音频文件可能还在处理中"

## 根本原因

### 问题1: Vite代理配置缺失

**文件：** `vite.config.js`

**问题：**
- Vite只代理了 `/api` 路径到后端
- 没有代理 `/public` 路径
- 导致前端无法访问后端的静态文件

**Before:**
```javascript
proxy: {
  '/api': {
    target: 'http://localhost:3001',
    changeOrigin: true
  }
}
```

**After:**
```javascript
proxy: {
  '/api': {
    target: 'http://localhost:3001',
    changeOrigin: true
  },
  '/public': {
    target: 'http://localhost:3001',
    changeOrigin: true
  }
}
```

### 问题2: 音频URL路径

**文件：** `client/src/components/create/Step2VoiceSettings.jsx`

**上传后返回的数据：**
```json
{
  "voiceId": "uuid",
  "audioUrl": "/public/uploads/voices/xxx.m4a",
  "message": "音频上传成功，正在处理中"
}
```

**问题：**
- 开发环境下，前端需要通过Vite代理访问后端
- `/public/uploads/voices/xxx.m4a` 需要被正确代理

## 解决方案

### 1. 更新Vite配置

添加 `/public` 路径的代理：

```javascript
// vite.config.js
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:3001',
      changeOrigin: true
    },
    '/public': {
      target: 'http://localhost:3001',
      changeOrigin: true
    }
  }
}
```

### 2. 优化前端音频播放代码

```javascript
const handlePreview = () => {
  if (useCustomVoice && uploadedVoice && uploadedVoice.audioUrl) {
    setIsPreviewing(true);
    
    if (!audioRef.current) {
      audioRef.current = new Audio();
    }
    
    // 直接使用返回的audioUrl
    // Vite会自动代理/public路径到后端
    const audioUrl = uploadedVoice.audioUrl;
    
    console.log('🎵 播放音频:', audioUrl);
    audioRef.current.src = audioUrl;
    audioRef.current.volume = settings.volume;
    
    // 添加CORS支持
    audioRef.current.crossOrigin = 'anonymous';
    
    // 错误处理
    audioRef.current.onerror = () => {
      setIsPreviewing(false);
      console.error('音频播放失败:', audioUrl);
      alert('播放失败，音频文件可能还在处理中');
    };
    
    // 播放成功处理
    audioRef.current.onended = () => {
      setIsPreviewing(false);
    };
    
    // 播放
    audioRef.current.play().catch(err => {
      setIsPreviewing(false);
      console.error('播放错误:', err);
      alert('播放失败：' + err.message);
    });
    
    return;
  }
  
  // ... 系统TTS预览
};
```

## 技术说明

### 后端静态文件服务

**文件：** `server/index.js`

后端已经正确配置了静态文件服务：

```javascript
// 静态文件服务 - 托管上传的文件
app.use('/public', express.static(path.join(__dirname, '../public')));
```

这意味着：
- URL: `http://localhost:3001/public/uploads/voices/xxx.m4a`
- 映射到: `/home/user/webapp/public/uploads/voices/xxx.m4a`

### Vite开发服务器代理

**开发环境流程：**

```
前端请求: /public/uploads/voices/xxx.m4a
    ↓
Vite代理识别: /public 开头
    ↓
转发到后端: http://localhost:3001/public/uploads/voices/xxx.m4a
    ↓
Express静态服务: 返回文件
    ↓
前端接收: 播放音频
```

### 生产环境

生产环境下通常有两种方案：

**方案1: Nginx托管静态文件**
```nginx
location /public/uploads {
    alias /home/user/webapp/public/uploads;
    expires 1y;
}
```

**方案2: CDN**
```javascript
// 上传到CDN后，返回完整URL
audioUrl: "https://cdn.example.com/voices/xxx.m4a"
```

## 测试验证

### 1. 验证后端文件访问

```bash
# 检查文件是否存在
ls -lh /home/user/webapp/public/uploads/voices/

# 测试后端直接访问
curl -I http://localhost:3001/public/uploads/voices/xxx.m4a

# 应该返回 200 OK
```

### 2. 验证Vite代理

```bash
# 查看Vite配置
cat vite.config.js | grep -A 5 proxy

# 重启Vite
pkill -f vite
npm run dev
```

### 3. 前端测试

```
1. 刷新浏览器页面
2. 登录VIP账号
3. 进入"调节声音"步骤
4. 上传音频文件（MP3/WAV/M4A）
5. 上传成功后，点击"🎧 试听"
6. 打开浏览器控制台查看：
   - 应该看到: "🎵 播放音频: /public/uploads/voices/xxx.m4a"
   - Network标签应该显示200 OK
   - 应该能听到音频播放
```

### 4. 调试技巧

**浏览器控制台：**
```javascript
// 检查audio元素
console.log(audioRef.current.src);
console.log(audioRef.current.error);

// 测试直接访问
fetch('/public/uploads/voices/xxx.m4a')
  .then(r => console.log('Status:', r.status))
  .catch(e => console.error('Error:', e));
```

## 常见问题

### Q1: 仍然播放失败

**检查清单：**
1. ✅ Vite是否重启（配置才生效）
2. ✅ 文件是否真实存在
3. ✅ 文件权限是否正确（644）
4. ✅ 后端服务是否运行
5. ✅ 浏览器控制台有无错误

### Q2: Network 404错误

**原因：** Vite代理未生效

**解决：**
```bash
# 确保vite.config.js已更新
grep -A 5 "proxy" vite.config.js

# 重启Vite
pkill -f vite && npm run dev
```

### Q3: CORS错误

**原因：** 跨域限制

**解决：** 后端已配置CORS，如果仍有问题：
```javascript
// server/index.js
app.use(cors({
  origin: '*',  // 开发环境允许所有来源
  credentials: true
}));
```

### Q4: 音频格式不支持

**原因：** 浏览器不支持该音频编码

**支持的格式：**
- ✅ MP3 (最兼容)
- ✅ WAV (无损)
- ⚠️ M4A (部分浏览器)
- ❌ FLAC (大部分不支持)

**解决：** 使用FFmpeg转换为MP3
```bash
ffmpeg -i input.m4a -codec:a libmp3lame -q:a 2 output.mp3
```

## 文件修改

### 已修改文件

1. **`vite.config.js`**
   - 添加 `/public` 代理配置

2. **`client/src/components/create/Step2VoiceSettings.jsx`**
   - 优化音频播放逻辑
   - 添加调试日志
   - 改进错误处理

### 配置变更

```javascript
// vite.config.js
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      },
      '/public': {  // ← 新增
        target: 'http://localhost:3001',
        changeOrigin: true
      }
    }
  }
})
```

## 部署注意事项

### 开发环境
- ✅ Vite代理已配置
- ✅ 热重载自动生效

### 生产环境

**构建后：**
```bash
cd client && npm run build
```

**Nginx配置：**
```nginx
# 静态文件直接托管
location /public/uploads {
    alias /home/user/webapp/public/uploads;
    expires 1y;
    add_header Cache-Control "public";
}

# API请求代理到后端
location /api {
    proxy_pass http://localhost:3001;
}
```

## 验证清单

部署后验证：

- [ ] 文件上传成功
- [ ] 试听按钮可点击
- [ ] 音频能正常播放
- [ ] 音量调整有效
- [ ] 控制台无错误
- [ ] Network显示200 OK
- [ ] 生产环境同样工作

---

**状态：** ✅ 已修复  
**测试：** 2025-11-20  
**优先级：** Critical（核心功能完全不可用）

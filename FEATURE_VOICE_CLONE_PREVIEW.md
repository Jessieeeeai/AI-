# Feature: 声音克隆预览功能

## 用户需求

用户反馈：**"试听的时候，怎么不是我上传的声音的克隆"**

用户期望：当上传自定义声音文件后，点击"试听"按钮应该播放上传的声音样本，而不是系统TTS。

## 实现方案

### 功能逻辑

现在试听按钮会根据当前状态智能切换：

1. **如果选择了"上传我的声音" + 已上传文件**
   - ✅ 播放上传的音频文件（真实的声音样本）
   - ✅ 应用音量参数
   - ✅ 让用户听到自己的声音

2. **如果选择"预设美女声音"或未上传文件**
   - ✅ 使用浏览器系统TTS
   - ✅ 预览音调、语速、音量效果

### 代码实现

#### 1. 添加音频播放器引用

```jsx
const audioRef = useRef(null);
```

#### 2. 智能预览逻辑

```jsx
const handlePreview = () => {
  // 优先播放上传的声音克隆样本
  if (useCustomVoice && uploadedVoice && uploadedVoice.audioUrl) {
    setIsPreviewing(true);
    
    // 停止之前的播放
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    
    // 创建音频元素
    if (!audioRef.current) {
      audioRef.current = new Audio();
    }
    
    // 设置音频源和参数
    audioRef.current.src = uploadedVoice.audioUrl;
    audioRef.current.volume = settings.volume;
    
    // 监听播放结束
    audioRef.current.onended = () => {
      setIsPreviewing(false);
    };
    
    // 监听错误
    audioRef.current.onerror = () => {
      setIsPreviewing(false);
      alert('播放失败，音频文件可能还在处理中');
    };
    
    // 播放
    audioRef.current.play().catch(err => {
      setIsPreviewing(false);
      alert('播放失败：' + err.message);
    });
    
    return;
  }
  
  // 否则使用系统TTS
  // ... (原有的Web Speech API代码)
};
```

#### 3. 清理资源

```jsx
const handleReset = () => {
  // ... 重置参数
  
  // 停止所有预览
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
  if (audioRef.current) {
    audioRef.current.pause();
    audioRef.current.currentTime = 0;
  }
  setIsPreviewing(false);
};

const handleNext = () => {
  // 停止所有预览
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
  if (audioRef.current) {
    audioRef.current.pause();
    audioRef.current.currentTime = 0;
  }
  onNext();
};
```

#### 4. UI提示优化

```jsx
<div className="text-center text-sm text-gray-600">
  {useCustomVoice && uploadedVoice ? (
    <p>✨ 试听将播放您上传的声音样本</p>
  ) : (
    <p>💡 试听使用系统声音预览音调、语速、音量效果</p>
  )}
</div>
```

---

## 用户体验

### Before（之前）
- ❌ 上传声音后点击试听，播放的是系统TTS
- ❌ 无法预览自己的声音效果
- ❌ 用户困惑："为什么不是我的声音？"

### After（现在）
- ✅ 上传声音后点击试听，播放上传的音频文件
- ✅ 可以听到自己声音的真实效果
- ✅ 清晰的提示信息："试听将播放您上传的声音样本"
- ✅ 智能切换：有自定义声音就播放自定义，否则使用系统TTS

---

## 使用流程

### 场景1: 使用自定义声音

1. **选择"上传我的声音"**
2. **上传音频文件**（15-60秒，MP3/WAV/M4A）
3. **上传成功后**，提示显示："✨ 试听将播放您上传的声音样本"
4. **点击"🎧 试听"**
5. **播放您上传的音频**，可以听到自己的声音
6. **调整音量滑块**，再次试听可以听到音量变化

### 场景2: 使用预设声音

1. **选择"预设美女声音"**
2. **提示显示**："💡 试听使用系统声音预览音调、语速、音量效果"
3. **点击"🎧 试听"**
4. **播放系统TTS**："你好，这是语音预览效果。欢迎使用VideoAI Pro！"
5. **调整参数**，可以预览不同效果

---

## 技术细节

### 音频播放

使用HTML5 Audio API：

```javascript
const audio = new Audio();
audio.src = '/public/uploads/voices/xxx.mp3';
audio.volume = 0.8;  // 应用音量设置
audio.play();
```

### 音频源

上传成功后，`uploadedVoice` 对象包含：

```json
{
  "voiceId": "uuid",
  "audioUrl": "/public/uploads/voices/xxx.mp3",
  "message": "音频上传成功，正在处理中"
}
```

### 可应用的参数

**自定义声音预览：**
- ✅ 音量（volume）- 可实时调整
- ❌ 音调（pitch）- 需要后端处理
- ❌ 语速（speed）- 需要后端处理
- ❌ 情感参数 - 需要IndexTTS2处理

**说明：** 
- 播放原始上传的音频文件
- 只能应用音量参数
- 其他参数在真实生成时才生效

### 错误处理

```javascript
audio.onerror = () => {
  setIsPreviewing(false);
  alert('播放失败，音频文件可能还在处理中');
};
```

可能的错误：
- 文件还在上传/处理中
- 文件路径错误
- 浏览器不支持该音频格式
- 网络错误

---

## 对比表

| 功能 | 系统TTS预览 | 自定义声音预览 | 真实生成（IndexTTS2） |
|------|-------------|----------------|---------------------|
| **音色** | 系统默认 | ✅ 用户声音 | ✅ 用户声音克隆 |
| **音调** | ✅ 可调整 | ❌ 原始录音 | ✅ 可调整 |
| **语速** | ✅ 可调整 | ❌ 原始录音 | ✅ 可调整 |
| **音量** | ✅ 可调整 | ✅ 可调整 | ✅ 可调整 |
| **情感** | ❌ 不支持 | ❌ 不支持 | ✅ 8维情感控制 |
| **响应速度** | 即时 | 即时 | 需要生成时间 |
| **音质** | 一般 | 取决于录音 | 专业AI合成 |

---

## 限制说明

### 当前限制

1. **只能播放原始音频**
   - 无法实时应用音调、语速变化
   - 这些参数需要AI模型处理

2. **音量是唯一可调参数**
   - 播放时可以调整音量
   - 其他参数在视频生成时生效

3. **依赖原始录音质量**
   - 如果录音质量差，预览效果也差
   - 建议在安静环境录制15-60秒清晰音频

### 未来改进（需要后端支持）

1. **实时TTS预览**
   - 调用IndexTTS2 API生成短音频
   - 应用所有参数（音调、语速、情感）
   - 提供最接近真实效果的预览

2. **参数实时调整**
   - 使用Web Audio API实时处理音频
   - 调整音调、语速、添加效果
   - 无需重新生成

---

## 测试方法

### 功能测试

1. **测试自定义声音预览**
   ```
   1. 登录VIP账号
   2. 进入创建视频 → 调节声音
   3. 选择"上传我的声音"
   4. 上传一个MP3文件（如自己的录音）
   5. 上传成功后，点击"🎧 试听"
   6. 应该播放您上传的音频文件
   7. 调整音量滑块，再次试听
   8. 音量应该有变化
   ```

2. **测试系统TTS预览**
   ```
   1. 选择"预设美女声音"
   2. 点击"🎧 试听"
   3. 应该播放系统TTS："你好，这是语音预览效果..."
   4. 调整音调、语速、音量
   5. 再次试听应该有变化
   ```

3. **测试切换**
   ```
   1. 先上传自定义声音并试听
   2. 切换到"预设美女声音"
   3. 再次试听应该是系统TTS
   4. 切换回"上传我的声音"
   5. 再次试听应该是自定义音频
   ```

4. **测试重置**
   ```
   1. 播放试听
   2. 点击"🔄 重置"
   3. 播放应该停止
   4. 参数应该恢复默认值
   ```

5. **测试页面切换**
   ```
   1. 播放试听
   2. 点击"下一步"
   3. 播放应该自动停止
   ```

### 边界测试

```
1. 上传文件后立即试听（可能还在处理）
   - 应该显示"音频文件可能还在处理中"

2. 网络断开时试听
   - 应该显示"播放失败：..."错误

3. 连续快速点击试听
   - 应该停止当前播放并重新开始

4. 播放中切换选项卡
   - 应该继续播放或自动暂停
```

---

## 修改文件

- `client/src/components/create/Step2VoiceSettings.jsx`
  - 添加 `audioRef` 引用
  - 修改 `handlePreview()` 逻辑
  - 更新 `handleReset()` 和 `handleNext()`
  - 添加UI提示信息

---

## 部署说明

- **前端：** Vite自动热重载，刷新页面即可
- **后端：** 无需修改
- **数据库：** 无需修改

---

## 用户反馈

**问题：** "试听的时候，怎么不是我上传的声音的克隆"

**回答：** 
✅ 现在已经修复！当您上传自定义声音后，点击"试听"将播放您上传的音频文件。

📝 **使用说明：**
1. 选择"上传我的声音"
2. 上传您的音频文件（15-60秒）
3. 上传成功后，点击"试听"
4. 将播放您上传的声音样本

⚠️ **注意：**
- 试听播放的是您原始上传的音频
- 音调、语速参数需要在生成视频时才生效
- 可以调整音量参数实时预览

---

**状态：** ✅ 已实现  
**测试：** 2025-11-20  
**优先级：** High（用户核心需求）

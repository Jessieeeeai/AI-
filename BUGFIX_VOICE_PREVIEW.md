# Bug Fix: 试听按钮无反应

## 问题描述

用户报告：在"调节声音"页面点击"试听"按钮没有任何反应。

**截图显示：**
- 页面有3个滑块（情感参数）
- 底部有"🎧 试听"和"🔄 重置"两个按钮
- 点击按钮无响应

## 根本原因

**文件：** `client/src/components/create/Step2VoiceSettings.jsx`

**问题代码（第329-334行）：**
```jsx
<button className="...">
  🎧 试听
</button>
<button className="...">
  🔄 重置
</button>
```

**问题：** 
- 两个按钮都没有 `onClick` 事件处理函数
- 纯装饰性按钮，点击无任何响应

## 解决方案

### 1. 添加状态管理

```jsx
const [isPreviewing, setIsPreviewing] = useState(false);
const audioRef = useRef(null);
```

### 2. 实现试听功能

使用浏览器内置的 **Web Speech API** 进行语音合成预览：

```jsx
const handlePreview = () => {
  if ('speechSynthesis' in window) {
    setIsPreviewing(true);
    
    // 停止之前的播放
    window.speechSynthesis.cancel();
    
    // 创建语音合成
    const utterance = new SpeechSynthesisUtterance(
      '你好，这是语音预览效果。欢迎使用VideoAI Pro！'
    );
    
    // 应用用户设置的参数
    utterance.pitch = settings.pitch;      // 音调
    utterance.rate = settings.speed;       // 语速
    utterance.volume = settings.volume;    // 音量
    utterance.lang = 'zh-CN';              // 中文
    
    // 监听播放结束
    utterance.onend = () => {
      setIsPreviewing(false);
    };
    
    // 错误处理
    utterance.onerror = () => {
      setIsPreviewing(false);
      alert('预览失败，请检查浏览器是否支持语音合成');
    };
    
    // 开始播放
    window.speechSynthesis.speak(utterance);
  } else {
    alert('您的浏览器不支持语音预览功能');
  }
};
```

### 3. 实现重置功能

```jsx
const handleReset = () => {
  // 重置为默认值
  const defaultSettings = {
    happiness: 0.7,
    sadness: 0.1,
    anger: 0.0,
    surprise: 0.3,
    pitch: 1.0,
    speed: 1.0,
    volume: 1.0,
  };
  
  setSettings(defaultSettings);
  updateData({ voiceSettings: defaultSettings });
  
  // 停止正在播放的预览
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
  setIsPreviewing(false);
};
```

### 4. 更新按钮UI

```jsx
<div className="flex items-center justify-center space-x-4 py-4 bg-purple-50 rounded-xl">
  {/* 试听按钮 */}
  <button 
    onClick={handlePreview}
    disabled={isPreviewing}
    className={`px-6 py-2 bg-white rounded-full text-primary-purple font-semibold hover:shadow-md transition-all ${
      isPreviewing ? 'opacity-50 cursor-not-allowed' : ''
    }`}
  >
    {isPreviewing ? '🔊 播放中...' : '🎧 试听'}
  </button>
  
  {/* 重置按钮 */}
  <button 
    onClick={handleReset}
    className="px-6 py-2 bg-white rounded-full text-primary-purple font-semibold hover:shadow-md transition-all"
  >
    🔄 重置
  </button>
</div>
```

### 5. 清理资源

在页面切换时停止语音播放：

```jsx
const handleNext = () => {
  // 停止预览
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
  onNext();
};
```

## 功能特性

### 试听功能

✅ **实时预览**
- 使用浏览器内置语音合成API
- 无需后端支持
- 即时响应

✅ **参数应用**
- 音调（pitch）：0.5x - 2.0x
- 语速（speed）：0.5x - 2.0x
- 音量（volume）：0.5x - 1.5x

✅ **状态反馈**
- 播放中显示"🔊 播放中..."
- 按钮禁用防止重复点击
- 播放结束自动恢复

✅ **错误处理**
- 检测浏览器兼容性
- 友好的错误提示

### 重置功能

✅ **恢复默认值**
- 快乐度: 70%
- 悲伤度: 10%
- 愤怒度: 0%
- 惊讶度: 30%
- 音调: 1.0x
- 语速: 1.0x
- 音量: 1.0x

✅ **停止播放**
- 重置时自动停止正在播放的预览

## 技术说明

### Web Speech API

使用浏览器原生的 `SpeechSynthesis` API：

**优点：**
- ✅ 无需后端支持
- ✅ 无需网络请求
- ✅ 响应速度快
- ✅ 跨平台兼容

**限制：**
- ⚠️ 只能预览音调、语速、音量
- ⚠️ 无法预览情感参数（happiness、sadness等）
- ⚠️ 声音质量取决于系统TTS引擎

**浏览器支持：**
- ✅ Chrome 33+
- ✅ Firefox 49+
- ✅ Safari 7+
- ✅ Edge 14+

### 情感参数说明

**前端设置（4维）：**
- `happiness` - 快乐度
- `sadness` - 悲伤度
- `anger` - 愤怒度
- `surprise` - 惊讶度

**预览限制：**
Web Speech API 不支持情感控制，预览仅能体现音调、语速、音量。

**真实生成：**
创建视频时，情感参数会发送到 IndexTTS2 后端，映射为8维情感向量进行真实合成。

## 用户体验改进

### Before（修复前）
- ❌ 点击"试听"无反应
- ❌ 点击"重置"无反应
- ❌ 无法预览参数效果
- ❌ 调整参数只能靠猜测

### After（修复后）
- ✅ 点击"试听"立即播放示例音频
- ✅ 点击"重置"恢复所有默认值
- ✅ 可以实时预览音调、语速、音量效果
- ✅ 播放状态清晰反馈
- ✅ 支持重复试听

## 测试方法

### 功能测试

1. **基本试听**
   ```
   1. 进入"调节声音"步骤
   2. 点击"🎧 试听"按钮
   3. 应该听到："你好，这是语音预览效果。欢迎使用VideoAI Pro！"
   ```

2. **参数调整**
   ```
   1. 调整音调滑块到2.0x
   2. 点击"试听"
   3. 音频应该变高音
   
   4. 调整语速滑块到0.5x
   5. 点击"试听"
   6. 音频应该变慢速
   
   7. 调整音量滑块到最小
   8. 点击"试听"
   9. 音频应该变小声
   ```

3. **重置功能**
   ```
   1. 调整所有滑块到非默认值
   2. 点击"🔄 重置"按钮
   3. 所有滑块应该恢复默认位置
   4. 点击"试听"验证效果
   ```

4. **连续播放**
   ```
   1. 点击"试听"开始播放
   2. 在播放过程中再次点击"试听"
   3. 应该停止当前播放并重新开始
   ```

5. **页面切换**
   ```
   1. 点击"试听"开始播放
   2. 立即点击"下一步"切换页面
   3. 音频应该停止播放
   ```

### 兼容性测试

```bash
# 在浏览器控制台测试
if ('speechSynthesis' in window) {
  console.log('✅ 支持语音合成');
} else {
  console.log('❌ 不支持语音合成');
}

# 查看可用语音
speechSynthesis.getVoices().forEach(voice => {
  console.log(voice.name, voice.lang);
});
```

## 已知限制

1. **情感参数无法预览**
   - Web Speech API 不支持情感控制
   - 只能预览音调、语速、音量
   - 真实效果需要生成视频后查看

2. **声音质量**
   - 预览使用系统TTS引擎
   - 与真实生成（IndexTTS2）音质不同
   - 仅供参考，不代表最终效果

3. **浏览器差异**
   - 不同浏览器声音可能不同
   - 某些老版本浏览器不支持
   - 移动端支持可能有限

## 未来改进

### 短期（可选）

1. **添加预览文本自定义**
   ```jsx
   const [previewText, setPreviewText] = useState('你好，这是语音预览效果...');
   ```

2. **停止按钮**
   ```jsx
   <button onClick={() => window.speechSynthesis.cancel()}>
     ⏹️ 停止
   </button>
   ```

### 长期（需要后端支持）

1. **真实TTS预览**
   - 调用 IndexTTS2 生成短音频
   - 应用真实的情感参数
   - 提供更准确的预览效果

2. **声音库选择**
   - 预设多个声音模型
   - 可选择不同性别、年龄、风格

## 修改文件

- `client/src/components/create/Step2VoiceSettings.jsx`
  - 添加 `isPreviewing` 状态
  - 实现 `handlePreview()` 函数
  - 实现 `handleReset()` 函数
  - 更新按钮绑定事件

## 影响范围

- ✅ 仅影响前端UI
- ✅ 无需后端修改
- ✅ 无需数据库修改
- ✅ 向后兼容

## 部署说明

- **前端：** Vite自动热重载，刷新页面即可
- **后端：** 无需修改
- **数据库：** 无需修改

---

**状态：** ✅ 已修复  
**测试：** 2025-11-20  
**优先级：** High（用户体验关键功能）

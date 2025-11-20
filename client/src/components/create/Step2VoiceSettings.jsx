import { useState, useRef } from 'react';
import { Mic, Volume2, Gauge, Music, Upload, Loader, CheckCircle, XCircle } from 'lucide-react';
import { uploadService, previewService } from '../../services/api';

export default function Step2VoiceSettings({ data, updateData, onNext, onPrev }) {
  const [settings, setSettings] = useState(data.voiceSettings);
  const [useCustomVoice, setUseCustomVoice] = useState(!!data.voiceId);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadedVoice, setUploadedVoice] = useState(null);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const fileInputRef = useRef(null);
  const audioRef = useRef(null);

  const updateSetting = (key, value) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    updateData({ voiceSettings: newSettings });
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // 验证文件类型 - 使用文件扩展名验证（更可靠）
    const fileName = file.name.toLowerCase();
    const allowedExtensions = ['.mp3', '.wav', '.m4a'];
    const hasValidExtension = allowedExtensions.some(ext => fileName.endsWith(ext));
    
    if (!hasValidExtension) {
      setUploadError('只支持 MP3, WAV, M4A 格式的音频文件');
      return;
    }

    // 验证文件大小 (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('文件大小不能超过10MB');
      return;
    }

    setUploading(true);
    setUploadError('');

    try {
      const response = await uploadService.uploadVoice(file);
      setUploadedVoice(response);
      updateData({ voiceId: response.voiceId });
      alert('声音文件上传成功！');
    } catch (error) {
      setUploadError(error.message || '上传失败，请稍后重试');
    } finally {
      setUploading(false);
    }
  };

  const handlePreview = async () => {
    // 如果上传了自定义声音，调用TTS API生成预览
    if (useCustomVoice && uploadedVoice && uploadedVoice.voiceId) {
      setIsPreviewing(true);
      
      // 停止之前的播放
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      
      try {
        // 预览文本
        const previewText = data.text && data.text.trim().length > 0
          ? data.text.substring(0, 100) // 取前100字
          : '你好，这是使用您的声音生成的预览效果。欢迎使用VideoAI Pro！';
        
        console.log('🎤 生成声音克隆预览:', {
          voiceId: uploadedVoice.voiceId,
          text: previewText.substring(0, 20) + '...',
          settings
        });
        
        // 调用TTS预览API
        const audioBlob = await previewService.generateTTS(
          previewText,
          uploadedVoice.voiceId,
          settings
        );
        
        // 创建音频URL
        const audioUrl = URL.createObjectURL(audioBlob);
        
        // 创建或使用现有的audio元素
        if (!audioRef.current) {
          audioRef.current = new Audio();
        }
        
        audioRef.current.src = audioUrl;
        audioRef.current.volume = settings.volume;
        
        // 监听播放结束
        audioRef.current.onended = () => {
          setIsPreviewing(false);
          URL.revokeObjectURL(audioUrl); // 清理URL
        };
        
        // 监听错误
        audioRef.current.onerror = () => {
          setIsPreviewing(false);
          URL.revokeObjectURL(audioUrl);
          alert('播放失败');
        };
        
        // 播放
        await audioRef.current.play();
        
      } catch (error) {
        setIsPreviewing(false);
        console.error('预览生成失败:', error);
        alert('预览失败：' + (error.response?.data?.message || error.message));
      }
      
      return;
    }
    
    // 否则使用系统TTS预览
    if ('speechSynthesis' in window) {
      setIsPreviewing(true);
      
      // 停止之前的播放
      window.speechSynthesis.cancel();
      
      // 创建语音合成
      const utterance = new SpeechSynthesisUtterance('你好，这是语音预览效果。欢迎使用VideoAI Pro！');
      
      // 应用设置
      utterance.pitch = settings.pitch;
      utterance.rate = settings.speed;
      utterance.volume = settings.volume;
      
      // 设置语言
      utterance.lang = 'zh-CN';
      
      // 监听结束事件
      utterance.onend = () => {
        setIsPreviewing(false);
      };
      
      utterance.onerror = () => {
        setIsPreviewing(false);
        alert('预览失败，请检查浏览器是否支持语音合成');
      };
      
      // 播放
      window.speechSynthesis.speak(utterance);
    } else {
      alert('您的浏览器不支持语音预览功能');
    }
  };

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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2 flex items-center">
          <Mic className="w-6 h-6 mr-2 text-primary-purple" />
          调节声音
        </h2>
        <p className="text-gray-600">调整语音参数，创建专属声音</p>
      </div>

      {/* 声音来源选择 */}
      <div className="grid md:grid-cols-2 gap-4">
        <button
          onClick={() => setUseCustomVoice(false)}
          className={`p-4 rounded-xl border-2 transition-all ${
            !useCustomVoice
              ? 'border-primary-purple bg-purple-50'
              : 'border-gray-200 hover:border-purple-300'
          }`}
        >
          <Mic className="w-8 h-8 mx-auto mb-2 text-primary-purple" />
          <div className="font-semibold">预设美女声音</div>
          <div className="text-sm text-gray-600 mt-1">使用AI生成的专业声音</div>
        </button>

        <button
          onClick={() => setUseCustomVoice(true)}
          className={`p-4 rounded-xl border-2 transition-all ${
            useCustomVoice
              ? 'border-primary-purple bg-purple-50'
              : 'border-gray-200 hover:border-purple-300'
          }`}
        >
          <Upload className="w-8 h-8 mx-auto mb-2 text-primary-purple" />
          <div className="font-semibold">上传我的声音</div>
          <div className="text-sm text-gray-600 mt-1">
            使用自己的声音 <span className="text-primary-pink">(+20积分)</span>
          </div>
        </button>
      </div>

      {useCustomVoice && (
        <div className="space-y-4">
          {/* 文件上传区 */}
          <div className="border-2 border-dashed border-purple-300 rounded-xl p-8 text-center hover:border-primary-purple transition-colors">
            <input
              ref={fileInputRef}
              type="file"
              accept=".mp3,.wav,.m4a,audio/mpeg,audio/mp3,audio/wav,audio/x-m4a,audio/mp4"
              onChange={handleFileSelect}
              className="hidden"
            />
            
            {!uploadedVoice && !uploading && (
              <>
                <Upload className="w-12 h-12 mx-auto mb-4 text-primary-purple" />
                <p className="font-semibold mb-2">上传你的声音文件</p>
                <p className="text-sm text-gray-600 mb-4">
                  支持 MP3, WAV, M4A 格式 | 15-60秒 | 小于10MB
                </p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-6 py-2 bg-purple-100 text-primary-purple rounded-full font-semibold hover:bg-purple-200 transition-colors"
                >
                  📤 选择文件上传
                </button>
              </>
            )}

            {uploading && (
              <>
                <Loader className="w-12 h-12 mx-auto mb-4 text-primary-purple animate-spin" />
                <p className="font-semibold">上传中...</p>
              </>
            )}

            {uploadedVoice && (
              <>
                <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
                <p className="font-semibold text-green-600 mb-2">上传成功！</p>
                <p className="text-sm text-gray-600 mb-4">
                  声音文件已上传，正在处理中
                </p>
                <button
                  onClick={() => {
                    setUploadedVoice(null);
                    updateData({ voiceId: null });
                  }}
                  className="px-6 py-2 bg-red-100 text-red-600 rounded-full font-semibold hover:bg-red-200 transition-colors"
                >
                  🗑️ 重新上传
                </button>
              </>
            )}
          </div>

          {uploadError && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start space-x-2">
              <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-600">{uploadError}</p>
            </div>
          )}

          {/* 声音克隆要求 */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <p className="text-sm text-blue-800">
              💡 <strong>声音克隆要求：</strong>
            </p>
            <ul className="mt-2 space-y-1 text-sm text-blue-700">
              <li>• 录音环境安静，无背景噪音</li>
              <li>• 清晰朗读一段文字（15-60秒）</li>
              <li>• 音量适中，不要过大或过小</li>
              <li>• 声音质量越好，克隆效果越佳</li>
            </ul>
          </div>
        </div>
      )}

      {/* 语音参数调节 */}
      <div className="space-y-4">
        <h3 className="font-semibold text-lg">语音参数</h3>

        {/* 情绪参数 */}
        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium flex items-center">
                😊 快乐度
              </label>
              <span className="text-sm font-semibold text-primary-purple">
                {Math.round(settings.happiness * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={settings.happiness}
              onChange={(e) => updateSetting('happiness', parseFloat(e.target.value))}
              className="w-full h-2 bg-purple-200 rounded-lg appearance-none cursor-pointer accent-primary-purple"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium flex items-center">
                😢 悲伤度
              </label>
              <span className="text-sm font-semibold text-primary-purple">
                {Math.round(settings.sadness * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={settings.sadness}
              onChange={(e) => updateSetting('sadness', parseFloat(e.target.value))}
              className="w-full h-2 bg-purple-200 rounded-lg appearance-none cursor-pointer accent-primary-purple"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium flex items-center">
                😠 愤怒度
              </label>
              <span className="text-sm font-semibold text-primary-purple">
                {Math.round(settings.anger * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={settings.anger}
              onChange={(e) => updateSetting('anger', parseFloat(e.target.value))}
              className="w-full h-2 bg-purple-200 rounded-lg appearance-none cursor-pointer accent-primary-purple"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium flex items-center">
                😮 惊讶度
              </label>
              <span className="text-sm font-semibold text-primary-purple">
                {Math.round(settings.surprise * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={settings.surprise}
              onChange={(e) => updateSetting('surprise', parseFloat(e.target.value))}
              className="w-full h-2 bg-purple-200 rounded-lg appearance-none cursor-pointer accent-primary-purple"
            />
          </div>
        </div>

        {/* 其他参数 */}
        <div className="space-y-3 pt-4 border-t border-purple-200">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium flex items-center">
                <Music className="w-4 h-4 mr-1" /> 音调
              </label>
              <span className="text-sm font-semibold text-primary-purple">
                {settings.pitch.toFixed(1)}x
              </span>
            </div>
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={settings.pitch}
              onChange={(e) => updateSetting('pitch', parseFloat(e.target.value))}
              className="w-full h-2 bg-purple-200 rounded-lg appearance-none cursor-pointer accent-primary-purple"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium flex items-center">
                <Gauge className="w-4 h-4 mr-1" /> 语速
              </label>
              <span className="text-sm font-semibold text-primary-purple">
                {settings.speed.toFixed(1)}x
              </span>
            </div>
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={settings.speed}
              onChange={(e) => updateSetting('speed', parseFloat(e.target.value))}
              className="w-full h-2 bg-purple-200 rounded-lg appearance-none cursor-pointer accent-primary-purple"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium flex items-center">
                <Volume2 className="w-4 h-4 mr-1" /> 音量
              </label>
              <span className="text-sm font-semibold text-primary-purple">
                {Math.round(settings.volume * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0.5"
              max="1.5"
              step="0.1"
              value={settings.volume}
              onChange={(e) => updateSetting('volume', parseFloat(e.target.value))}
              className="w-full h-2 bg-purple-200 rounded-lg appearance-none cursor-pointer accent-primary-purple"
            />
          </div>
        </div>
      </div>

      {/* 试听按钮 */}
      <div className="space-y-2">
        <div className="flex items-center justify-center space-x-4 py-4 bg-purple-50 rounded-xl">
          <button 
            onClick={handlePreview}
            disabled={isPreviewing}
            className={`px-6 py-2 bg-white rounded-full text-primary-purple font-semibold hover:shadow-md transition-all ${
              isPreviewing ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isPreviewing ? '🔊 播放中...' : '🎧 试听'}
          </button>
          <button 
            onClick={handleReset}
            className="px-6 py-2 bg-white rounded-full text-primary-purple font-semibold hover:shadow-md transition-all"
          >
            🔄 重置
          </button>
        </div>
        
        {/* 试听提示 */}
        <div className="text-center text-sm text-gray-600">
          {useCustomVoice && uploadedVoice ? (
            <div className="space-y-1">
              <p>✨ 试听将使用您的声音克隆朗读测试文本</p>
              <p className="text-xs text-gray-500">
                {data.text && data.text.trim().length > 0 
                  ? `（使用您输入的文本前100字）` 
                  : `（使用默认测试文本）`}
              </p>
            </div>
          ) : (
            <p>💡 试听使用系统声音预览音调、语速、音量效果</p>
          )}
        </div>
      </div>

      {/* 导航按钮 */}
      <div className="flex justify-between pt-4">
        <button
          onClick={onPrev}
          className="px-8 py-3 rounded-full bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300 transition-colors"
        >
          ← 上一步
        </button>
        <button
          onClick={handleNext}
          className="btn-gradient px-8 py-3"
        >
          下一步 →
        </button>
      </div>
    </div>
  );
}

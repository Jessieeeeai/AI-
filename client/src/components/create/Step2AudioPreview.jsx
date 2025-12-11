import { useState, useRef, useEffect } from 'react';
import { previewService, uploadService } from '../../services/api';
import { Play, Pause, Upload, Volume2, Music, RefreshCw, ArrowRight, AlertCircle } from 'lucide-react';

const Step2AudioPreview = ({ data, setData, onNext, onPrev }) => {
  const [voiceType, setVoiceType] = useState(data.voiceType || 'system');
  const [selectedSystemVoice, setSelectedSystemVoice] = useState(data.systemVoiceId || 'male_magnetic');
  const [customVoiceId, setCustomVoiceId] = useState(data.customVoiceId || null);
  const [userVoices, setUserVoices] = useState([]);
  const [uploadingVoice, setUploadingVoice] = useState(false);
  
  const [voiceSettings, setVoiceSettings] = useState(data.voiceSettings || {
    speed: 1.0,
    pitch: 1.0,
    volume: 0.8,
    emotions: {
      happiness: 0.7,
      anger: 0.0,
      sadness: 0.1,
      surprise: 0.3
    }
  });
  
  const [previewAudioUrl, setPreviewAudioUrl] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState('');
  
  const audioRef = useRef(null);
  const fileInputRef = useRef(null);
  
  // 提取试听文本（前100字）
  const previewText = data.optimizedText ? 
    data.optimizedText.substring(0, 100) : 
    '你好，这是使用您的声音生成的预览效果。欢迎使用VideoAI Pro！';
  
  // 系统预制声音列表
  const systemVoices = [
    { id: 'male_magnetic', name: '男声-磁性', description: '低沉有磁性，适合严肃内容' },
    { id: 'female_sweet', name: '女声-甜美', description: '温柔可爱，适合轻松内容' },
    { id: 'male_steady', name: '男声-沉稳', description: '成熟稳重，适合商务内容' },
    { id: 'female_energetic', name: '女声-活力', description: '青春活泼，适合时尚内容' }
  ];
  
  // 加载用户上传的声音列表
  useEffect(() => {
    loadUserVoices();
  }, []);
  
  const loadUserVoices = async () => {
    try {
      const response = await uploadService.getUserVoices();
      setUserVoices(response.voices || []);
    } catch (error) {
      console.error('加载声音列表失败:', error);
    }
  };
  
  // 生成试听音频
  const handleGeneratePreview = async () => {
        console.log('🔵 handleGeneratePreview被调用', { isGenerating });
        console.log('🔵 当前状态:', { voiceType, selectedSystemVoice, customVoiceId, previewText: previewText?.substring(0, 20) });
    setIsGenerating(true);
    setError('');
    
    try {
      const voiceId = voiceType === 'system' ? 
        selectedSystemVoice : 
        customVoiceId;
      
      if (!voiceId) {
              console.warn('⚠️ voiceId为空，跳过生成', { voiceType, customVoiceId, selectedSystemVoice });
        setError('请选择声音');
        setIsGenerating(false);
        return;
      }
      
      console.log('🎤 生成试听音频:', { voiceId, text: previewText.substring(0, 20) + '...' });
      
      // 调用试听API
      const audioBlob = await previewService.generateTTS(
        previewText,
        voiceId,
        voiceSettings
      );
      
      // 创建音频URL
      if (previewAudioUrl) {
        URL.revokeObjectURL(previewAudioUrl);
      }
      const newUrl = URL.createObjectURL(audioBlob);
      setPreviewAudioUrl(newUrl);
      
      console.log('✅ 试听音频生成成功');
      
      // 自动播放
      setTimeout(() => {
        playAudio();
      }, 100);
      
    } catch (error) {
      console.error('❌ 生成试听失败:', error);
      setError('试听生成失败：' + (error.message || '未知错误'));
    } finally {
      setIsGenerating(false);
    }
  };
  
  const playAudio = () => {
    if (!audioRef.current || !previewAudioUrl) return;
    
    audioRef.current.src = previewAudioUrl;
    audioRef.current.volume = voiceSettings.volume;
    audioRef.current.play();
    setIsPlaying(true);
  };
  
  const stopAudio = () => {
    if (!audioRef.current) return;
    audioRef.current.pause();
    audioRef.current.currentTime = 0;
    setIsPlaying(false);
  };
  
  const handleNext = () => {
    if (!previewAudioUrl) {
      setError('请先生成试听音频确认效果');
      return;
    }
    
    // 保存声音设置
    setData({
      ...data,
      voiceType,
      systemVoiceId: voiceType === 'system' ? selectedSystemVoice : null,
      customVoiceId: voiceType === 'custom' ? customVoiceId : null,
      voiceSettings
    });
    
    onNext();
  };
  
  // 声音上传
  const handleUploadVoice = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    const validTypes = ['audio/wav', 'audio/mpeg', 'audio/mp4', 'audio/x-m4a', 'audio/m4a', 'audio/aac', 'audio/x-m4a'];
    const validExtensions = ['.wav', '.mp3', '.m4a'];
    const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    
    // 只检查文件扩展名，不依赖MIME类型（不同系统/浏览器报告的MIME类型不一致）
        console.log('📁 文件信息:', { name: file.name, type: file.type, extension: fileExtension });
    if (!validExtensions.includes(fileExtension)) {
      setError('只支持WAV、MP3、M4A格式的音频文件');
    }    
    // 验证文件大小（50MB）
    if (file.size > 50 * 1024 * 1024) {
      setError('文件大小不能超过50MB');
      return;
    }
    
    setUploadingVoice(true);
    setError('');
    
    try {
      console.log('📤 上传声音文件:', file.name);
      
      const response = await uploadService.uploadVoice(file);
      
      console.log('✅ 声音上传成功:', response.voice);
      
      // 添加到列表
      setUserVoices([response.voice, ...userVoices]);
      setCustomVoiceId(response.voice.voiceId);
      setVoiceType('custom');
      
    } catch (error) {
      console.error('❌ 上传失败:', error);
      setError('上传失败：' + (error.message || '未知错误'));
    } finally {
      setUploadingVoice(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };
  
  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* 标题 */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          🎤 Step 2: 试听确认
        </h2>
        <p className="text-gray-600">
          选择声音并调整参数，生成试听片段确认效果
        </p>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-red-800">{error}</div>
        </div>
      )}

      {/* 试听文本 */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
          <Music className="w-5 h-5" />
          试听文本
        </h3>
        <div className="p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg border border-gray-200">
          <p className="text-gray-800">{previewText}...</p>
          <p className="text-xs text-gray-500 mt-2">
            * 完整音频生成时会使用全部文案（共{data.optimizedText?.length || 0}字符）
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-6">
        {/* 左侧：选择声音 */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Volume2 className="w-5 h-5" />
            选择声音
          </h3>
          
          {/* 系统预制声音 */}
          <div className="p-4 border border-gray-200 rounded-lg">
            <label className="flex items-center gap-2 mb-3">
              <input
                type="radio"
                checked={voiceType === 'system'}
                onChange={() => setVoiceType('system')}
                className="w-4 h-4 text-blue-600"
              />
              <span className="font-medium">系统预制声音</span>
            </label>
            
            {voiceType === 'system' && (
              <div className="space-y-2 ml-6">
                {systemVoices.map(voice => (
                  <label
                    key={voice.id}
                    className={`block p-3 border rounded-lg cursor-pointer transition-all ${
                      selectedSystemVoice === voice.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-200'
                    }`}
                  >
                    <input
                      type="radio"
                      name="systemVoice"
                      checked={selectedSystemVoice === voice.id}
                      onChange={() => setSelectedSystemVoice(voice.id)}
                      className="sr-only"
                    />
                    <div className="font-medium text-gray-900">{voice.name}</div>
                    <div className="text-sm text-gray-500">{voice.description}</div>
                  </label>
                ))}
              </div>
            )}
          </div>
          
          {/* 自定义声音 */}
          <div className="p-4 border border-gray-200 rounded-lg">
            <label className="flex items-center gap-2 mb-3">
              <input
                type="radio"
                checked={voiceType === 'custom'}
                onChange={() => setVoiceType('custom')}
                className="w-4 h-4 text-blue-600"
              />
              <span className="font-medium">自定义声音克隆</span>
            </label>
            
            {voiceType === 'custom' && (
              <div className="ml-6 space-y-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".wav,.mp3,.m4a,audio/wav,audio/mpeg,audio/mp4"
                  onChange={handleUploadVoice}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingVoice}
                  className="w-full flex items-center justify-center gap-2 p-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all"
                >
                  <Upload className="w-4 h-4" />
                  {uploadingVoice ? '上传中...' : '上传声音文件'}
                </button>
                <p className="text-xs text-gray-500">
                  支持WAV、MP3、M4A格式，最大50MB
                </p>
                
                {userVoices.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">或从已上传中选择：</p>
                    {userVoices.map(voice => (
                      <label
                        key={voice.voiceId}
                        className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-all ${
                          customVoiceId === voice.voiceId
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-blue-200'
                        }`}
                      >
                        <input
                          type="radio"
                          name="customVoice"
                          checked={customVoiceId === voice.voiceId}
                          onChange={() => setCustomVoiceId(voice.voiceId)}
                          className="w-4 h-4 text-blue-600"
                        />
                        <div className="flex-1">
                          <div className="font-medium text-sm">{voice.fileName}</div>
                          <div className="text-xs text-gray-500">
                            {voice.duration ? `${voice.duration.toFixed(1)}秒` : ''} • 
                            {new Date(voice.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        
        {/* 右侧：调节参数 */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">🎛️ 调节参数</h3>
          
          <div className="space-y-4 p-4 border border-gray-200 rounded-lg">
            {/* 语速 */}
            <div>
              <label className="flex justify-between text-sm mb-2">
                <span className="font-medium">语速</span>
                <span className="text-blue-600">{voiceSettings.speed.toFixed(1)}x</span>
              </label>
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.1"
                value={voiceSettings.speed}
                onChange={(e) => setVoiceSettings({
                  ...voiceSettings,
                  speed: parseFloat(e.target.value)
                })}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>慢</span>
                <span>快</span>
              </div>
            </div>
            
            {/* 音调 */}
            <div>
              <label className="flex justify-between text-sm mb-2">
                <span className="font-medium">音调</span>
                <span className="text-blue-600">{voiceSettings.pitch.toFixed(1)}x</span>
              </label>
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.1"
                value={voiceSettings.pitch}
                onChange={(e) => setVoiceSettings({
                  ...voiceSettings,
                  pitch: parseFloat(e.target.value)
                })}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>低</span>
                <span>高</span>
              </div>
            </div>
            
            {/* 音量 */}
            <div>
              <label className="flex justify-between text-sm mb-2">
                <span className="font-medium">音量</span>
                <span className="text-blue-600">{(voiceSettings.volume * 100).toFixed(0)}%</span>
              </label>
              <input
                type="range"
                min="0.0"
                max="1.0"
                step="0.1"
                value={voiceSettings.volume}
                onChange={(e) => setVoiceSettings({
                  ...voiceSettings,
                  volume: parseFloat(e.target.value)
                })}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>小</span>
                <span>大</span>
              </div>
            </div>
            
            {/* 情绪控制 */}
            <div className="pt-4 border-t border-gray-200">
              <h4 className="text-sm font-semibold mb-3">😊 情绪控制</h4>
              
              {Object.entries({
                happiness: { label: '快乐', emoji: '😊' },
                anger: { label: '愤怒', emoji: '😠' },
                sadness: { label: '悲伤', emoji: '😢' },
                surprise: { label: '惊讶', emoji: '😲' }
              }).map(([key, { label, emoji }]) => (
                <div key={key} className="mb-3">
                  <label className="flex justify-between text-xs mb-1">
                    <span>{emoji} {label}</span>
                    <span className="text-blue-600">{(voiceSettings.emotions[key] * 100).toFixed(0)}%</span>
                  </label>
                  <input
                    type="range"
                    min="0.0"
                    max="1.0"
                    step="0.1"
                    value={voiceSettings.emotions[key]}
                    onChange={(e) => setVoiceSettings({
                      ...voiceSettings,
                      emotions: {
                        ...voiceSettings.emotions,
                        [key]: parseFloat(e.target.value)
                      }
                    })}
                    className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* 试听音频区域 */}
      <div className="mt-6 p-6 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Music className="w-5 h-5" />
          试听音频
        </h3>
        
        {!previewAudioUrl ? (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">还未生成试听音频</p>
            <button
              onClick={handleGeneratePreview}
              disabled={isGenerating}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 transition-all"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  生成中...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  生成试听
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <audio
              ref={audioRef}
              onEnded={() => setIsPlaying(false)}
              className="w-full"
              controls
            />
            
            <div className="flex gap-3">
              <button
                onClick={handleGeneratePreview}
                disabled={isGenerating}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-white transition-colors flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                重新生成
              </button>
              <button
                onClick={isPlaying ? stopAudio : playAudio}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                {isPlaying ? (
                  <>
                    <Pause className="w-4 h-4" />
                    暂停
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    播放
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
      
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          💡 <strong>提示：</strong>
          试听满意后，点击"下一步"将使用相同参数生成完整音频。
          {voiceType === 'custom' && ' 使用声音克隆时，第一次生成可能需要更长时间。'}
        </p>
      </div>
      
      {/* 导航按钮 */}
      <div className="flex justify-between pt-6">
        <button
          onClick={onPrev}
          className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          ← 上一步
        </button>
        <button
          onClick={handleNext}
          disabled={!previewAudioUrl}
          className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 disabled:from-gray-300 disabled:to-gray-300 transition-all"
        >
          下一步：选择视频模板
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default Step2AudioPreview;

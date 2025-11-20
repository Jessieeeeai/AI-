import { useState } from 'react';
import { Mic, Volume2, Gauge, Music, Upload } from 'lucide-react';

export default function Step2VoiceSettings({ data, updateData, onNext, onPrev }) {
  const [settings, setSettings] = useState(data.voiceSettings);
  const [useCustomVoice, setUseCustomVoice] = useState(!!data.voiceId);

  const updateSetting = (key, value) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    updateData({ voiceSettings: newSettings });
  };

  const handleNext = () => {
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
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <p className="text-sm text-yellow-800">
            📤 上传功能开发中，敬请期待！
          </p>
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
      <div className="flex items-center justify-center space-x-4 py-4 bg-purple-50 rounded-xl">
        <button className="px-6 py-2 bg-white rounded-full text-primary-purple font-semibold hover:shadow-md transition-all">
          🎧 试听
        </button>
        <button className="px-6 py-2 bg-white rounded-full text-primary-purple font-semibold hover:shadow-md transition-all">
          🔄 重置
        </button>
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

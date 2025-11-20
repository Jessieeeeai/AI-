import { useState } from 'react';
import { optimizeService } from '../../services/api';
import { Sparkles, RefreshCw, ArrowRight, AlertCircle, CheckCircle } from 'lucide-react';

const Step1ScriptOptimization = ({ data, setData, onNext }) => {
  const [originalText, setOriginalText] = useState(data.originalText || '');
  const [optimizedText, setOptimizedText] = useState(data.optimizedText || '');
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationStats, setOptimizationStats] = useState(null);
  const [style, setStyle] = useState('humorous');
  const [error, setError] = useState('');

  const handleOptimize = async () => {
    if (!originalText || originalText.trim().length < 10) {
      setError('请输入至少10个字符的文案');
      return;
    }

    setIsOptimizing(true);
    setError('');
    
    try {
      console.log('🔄 开始优化文案...');
      const response = await optimizeService.optimizeScript(originalText, style);
      
      console.log('✅ 优化成功:', response);
      setOptimizedText(response.optimizedText);
      setOptimizationStats(response.changes);
      
      // 更新父组件数据
      setData({
        ...data,
        originalText: originalText,
        optimizedText: response.optimizedText,
        optimizationStats: response.changes
      });
      
    } catch (error) {
      console.error('❌ 优化失败:', error);
      setError(error.message || '文案优化失败，请重试');
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleManualEdit = (text) => {
    setOptimizedText(text);
    setData({ 
      ...data, 
      optimizedText: text,
      originalText: originalText
    });
  };

  const handleNext = () => {
    if (!optimizedText || optimizedText.trim().length < 10) {
      setError('请先优化文案或手动输入口播稿');
      return;
    }
    onNext();
  };

  const estimatedDuration = optimizedText ? Math.ceil(optimizedText.length / 5) : 0;
  const estimatedCredits = estimatedDuration > 0 ? Math.ceil(estimatedDuration / 60 * 30) : 0;

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* 标题 */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          📝 Step 1: 文案优化
        </h2>
        <p className="text-gray-600">
          粘贴您的原始文案，AI将自动优化为适合口播的脚本风格
        </p>
      </div>

      {/* 风格选择 */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          选择风格
        </label>
        <div className="flex gap-3">
          {[
            { value: 'humorous', label: '🎭 风趣幽默', desc: '轻松活泼' },
            { value: 'professional', label: '💼 专业严谨', desc: '客观中立' },
            { value: 'casual', label: '😊 轻松随意', desc: '亲切自然' }
          ].map(option => (
            <button
              key={option.value}
              onClick={() => setStyle(option.value)}
              className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                style === option.value
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-blue-200'
              }`}
            >
              <div className="font-semibold">{option.label}</div>
              <div className="text-sm text-gray-500">{option.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-red-800">{error}</div>
        </div>
      )}

      {/* 主内容区 */}
      <div className="grid grid-cols-2 gap-6">
        {/* 左侧：原始文案输入 */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              📋 原始文案
            </h3>
            <span className="text-sm text-gray-500">
              {originalText.length}/10000
            </span>
          </div>
          
          <textarea
            value={originalText}
            onChange={(e) => setOriginalText(e.target.value)}
            placeholder="粘贴您的文章或文案...&#10;&#10;例如：&#10;比特币价格今日突破10万美元大关，创历史新高。这是加密货币市场的里程碑事件。"
            className="w-full h-96 p-4 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            maxLength={10000}
          />
          
          <div className="flex gap-3">
            <button
              onClick={() => {
                setOriginalText('');
                setOptimizedText('');
                setOptimizationStats(null);
                setError('');
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              清空
            </button>
            <button
              onClick={handleOptimize}
              disabled={isOptimizing || !originalText}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed transition-all"
            >
              {isOptimizing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  正在优化...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  AI优化文案
                </>
              )}
            </button>
          </div>
        </div>

        {/* 右侧：优化后的口播稿 */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              ✨ 优化后口播稿
            </h3>
            {optimizedText && (
              <span className="text-sm text-gray-500">
                {optimizedText.length}/10000
              </span>
            )}
          </div>
          
          {!optimizedText ? (
            <div className="h-96 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-400">
              <div className="text-center p-6">
                <Sparkles className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p className="text-lg mb-2">👈 粘贴文案后点击"AI优化"</p>
                <p className="text-sm">系统会自动转换为口播稿风格</p>
              </div>
            </div>
          ) : (
            <>
              <textarea
                value={optimizedText}
                onChange={(e) => handleManualEdit(e.target.value)}
                className="w-full h-96 p-4 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                maxLength={10000}
              />
              
              {optimizationStats && (
                <div className="p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
                  <div className="flex items-start gap-3 mb-3">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-green-800 mb-2">✓ 优化完成</p>
                      <div className="grid grid-cols-2 gap-2 text-sm text-gray-700">
                        <div>• 添加语气词: <span className="font-semibold">{optimizationStats.addedExclamations}</span> 个</div>
                        <div>• 转换数字: <span className="font-semibold">{optimizationStats.convertedNumbers}</span> 个</div>
                        <div>• 简化标点: <span className="font-semibold">{optimizationStats.simplifiedPunctuation}</span> 处</div>
                        <div>• 压缩率: <span className="font-semibold">{optimizationStats.reductionRate}%</span></div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-green-300">
                        <div className="flex justify-between items-center">
                          <div>
                            <span className="text-sm text-gray-600">预计时长: </span>
                            <span className="font-semibold text-blue-600">{Math.floor(estimatedDuration / 60)}分{estimatedDuration % 60}秒</span>
                          </div>
                          <div>
                            <span className="text-sm text-gray-600">预计消耗: </span>
                            <span className="font-semibold text-orange-600">{estimatedCredits} 积分</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="flex gap-3">
                <button
                  onClick={handleOptimize}
                  disabled={isOptimizing}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  重新优化
                </button>
                <button
                  onClick={handleNext}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all"
                >
                  下一步：试听确认
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* 提示信息 */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          💡 <strong>AI优化说明：</strong>
          系统会自动将文案转换为口语化表达，添加恰当的语气词，转换数字为中文，简化标点符号。
          优化后您还可以手动编辑调整。
        </p>
      </div>
    </div>
  );
};

export default Step1ScriptOptimization;

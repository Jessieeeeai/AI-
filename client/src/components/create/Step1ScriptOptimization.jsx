import { useState } from 'react';
import { optimizeService } from '../../services/api';
import { Sparkles, RefreshCw, ArrowRight, AlertCircle, CheckCircle, Scissors } from 'lucide-react';

const smartSegmentText = (text, targetLength = 300) => {
      if (!text || text.length === 0) return [];

      const segments = [];
      let currentPosition = 0;

      while (currentPosition < text.length) {
              let endPosition = Math.min(currentPosition + targetLength, text.length);

              if (endPosition < text.length) {
                        const searchStart = Math.max(currentPosition, endPosition - 100);
                        const searchEnd = Math.min(text.length, endPosition + 50);
                        const searchText = text.substring(searchStart, searchEnd);

                        const punctuations = ['。', '！', '？', '；', '.', '!', '?', ';', '\n'];
                        let bestBreakPoint = -1;
                        let minDistance = Infinity;

                        for (const punct of punctuations) {
                                    let idx = searchText.lastIndexOf(punct);
                                    if (idx !== -1) {
                                                  const absolutePos = searchStart + idx + 1;
                                                  const distance = Math.abs(absolutePos - (currentPosition + targetLength));
                                                  if (distance < minDistance && absolutePos > currentPosition + 50) {
                                                                  minDistance = distance;
                                                                  bestBreakPoint = absolutePos;
                                                  }
                                    }
                        }

                        if (bestBreakPoint !== -1) {
                                    endPosition = bestBreakPoint;
                        }
              }

              const segment = text.substring(currentPosition, endPosition).trim();
              if (segment.length > 0) {
                        segments.push({
                                    id: segments.length + 1,
                                    text: segment,
                                    status: 'pending'
                        });
              }
              currentPosition = endPosition;
      }

      return segments;
};

const Step1ScriptOptimization = ({ data, setData, onNext }) => {
      const [originalText, setOriginalText] = useState(data.originalText || '');
      const [optimizedText, setOptimizedText] = useState(data.optimizedText || '');
      const [isOptimizing, setIsOptimizing] = useState(false);
      const [optimizationStats, setOptimizationStats] = useState(null);
      const [style, setStyle] = useState('humorous');
      const [error, setError] = useState('');
      const [segments, setSegments] = useState(data.segments || []);
      const [isSegmenting, setIsSegmenting] = useState(false);

      const styleOptions = [
          { value: 'humorous', label: '🎭 风趣幽默', desc: '轻松活泼' },
          { value: 'professional', label: '💼 专业严谨', desc: '客观中立' },
          { value: 'casual', label: '😊 轻松随意', desc: '亲切自然' }
            ];

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

                        const newSegments = smartSegmentText(response.optimizedText);
                        setSegments(newSegments);
                        console.log('📝 智能分段完成，共', newSegments.length, '段');

                        setData({
                                    ...data,
                                    originalText: originalText,
                                    optimizedText: response.optimizedText,
                                    optimizationStats: response.changes,
                                    segments: newSegments
                        });
              } catch (err) {
                        console.error('❌ 优化失败:', err);
                        setError(err.message || '文案优化失败，请重试');
              } finally {
                        setIsOptimizing(false);
              }
      };

      const handleManualEdit = (text) => {
              setOptimizedText(text);
              setSegments([]);
              setData({
                        ...data,
                        optimizedText: text,
                        originalText: originalText,
                        segments: []
              });
      };

      const handleReSegment = () => {
              if (!optimizedText || optimizedText.trim().length < 10) {
                        setError('请先输入或优化文案');
                        return;
              }
              setIsSegmenting(true);
              const newSegments = smartSegmentText(optimizedText);
              setSegments(newSegments);
              setData({
                        ...data,
                        segments: newSegments
              });
              setIsSegmenting(false);
      };

      const handleSegmentEdit = (segmentId, newText) => {
              const updatedSegments = segments.map(seg => 
                        seg.id === segmentId ? { ...seg, text: newText, status: 'pending' } : seg
                                                       );
              setSegments(updatedSegments);
              setData({
                        ...data,
                        segments: updatedSegments
              });
      };

      const handleNext = () => {
              if (!optimizedText || optimizedText.trim().length < 10) {
                        setError('请先优化文案或手动输入口播稿');
                        return;
              }
              if (segments.length === 0) {
                        setError('请先进行智能分段');
                        return;
              }
              onNext();
      };

      const handleClear = () => {
              setOriginalText('');
              setOptimizedText('');
              setOptimizationStats(null);
              setSegments([]);
              setError('');
      };

      const estimatedDuration = optimizedText ? Math.ceil(optimizedText.length / 5) : 0;
      const estimatedCredits = estimatedDuration > 0 ? Math.ceil(estimatedDuration / 60 * 30) : 0;

      return (
              <div className="max-w-7xl mx-auto p-6">
                    <div className="mb-6">
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">
                                      📝 Step 1: 文案优化与智能分段
                            </h2>h2>
                            <p className="text-gray-600">
                                      粘贴您的原始文案，AI将自动优化并智能分段（约300字/段）
                            </p>p>
                    </div>div>
              
                    <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                      选择风格
                            </label>label>
                            <div className="flex gap-3">
                                {styleOptions.map((option) => (
                              <button
                                                key={option.value}
                                                type="button"
                                                onClick={() => setStyle(option.value)}
                                                className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                                                                    style === option.value
                                                                      ? 'border-blue-500 bg-blue-50'
                                                                      : 'border-gray-200 hover:border-blue-200'
                                                }`}
                                              >
                                            <div className="font-semibold">{option.label}</div>div>
                                            <div className="text-sm text-gray-500">{option.desc}</div>div>
                              </button>button>
                            ))}
                            </div>div>
                    </div>div>
              
                  {error && (
                          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                                    <div className="text-sm text-red-800">{error}</div>div>
                          </div>div>
                    )}
              
                    <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-4">
                                      <div className="flex items-center justify-between">
                                                  <h3 className="text-lg font-semibold text-gray-900">📋 原始文案</h3>h3>
                                                  <span className="text-sm text-gray-500">{originalText.length}/10000</span>span>
                                      </div>div>
                                      <textarea
                                                      value={originalText}
                                                      onChange={(e) => setOriginalText(e.target.value)}
                                                      placeholder={'粘贴您的文章或文案...\n\n例如：\n比特币价格今日突破10万美元大关，创历史新高。这是加密货币市场的里程碑事件。'}
                                                      className="w-full h-80 p-4 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                      maxLength={10000}
                                                    />
                                      <div className="flex gap-3">
                                                  <button
                                                                    type="button"
                                                                    onClick={handleClear}
                                                                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                                                  >
                                                                清空
                                                  </button>button>
                                                  <button
                                                                    type="button"
                                                                    onClick={handleOptimize}
                                                                    disabled={isOptimizing || !originalText}
                                                                    className="flex-1 flex items-center justify-center gap-2 px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed transition-all"
                                                                  >
                                                      {isOptimizing ? (
                                                                                      <>
                                                                                                        <RefreshCw className="w-4 h-4 animate-spin" />
                                                                                                        正在优化...
                                                                                          </>>
                                                                                    ) : (
                                                                                      <>
                                                                                                        <Sparkles className="w-4 h-4" />
                                                                                                        AI优化并分段
                                                                                          </>>
                                                                                    )}
                                                  </button>button>
                                      </div>div>
                            </div>div>
                    
                            <div className="space-y-4">
                                      <div className="flex items-center justify-between">
                                                  <h3 className="text-lg font-semibold text-gray-900">✨ 优化后口播稿</h3>h3>
                                          {optimizedText && (
                                <span className="text-sm text-gray-500">{optimizedText.length}/10000</span>span>
                                                  )}
                                      </div>div>
                                {!optimizedText ? (
                              <div className="h-80 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-400">
                                            <div className="text-center p-6">
                                                            <Sparkles className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                                                            <p className="text-lg mb-2">👈 粘贴文案后点击AI优化并分段</p>p>
                                                            <p className="text-sm">系统会自动转换为口播稿风格并智能分段</p>p>
                                            </div>div>
                              </div>div>
                            ) : (
                              <>
                                            <textarea
                                                                value={optimizedText}
                                                                onChange={(e) => handleManualEdit(e.target.value)}
                                                                className="w-full h-80 p-4 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                                maxLength={10000}
                                                              />
                                  {optimizationStats && (
                                                  <div className="p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
                                                                    <div className="flex items-start gap-3 mb-3">
                                                                                        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                                                                                        <div>
                                                                                                              <p className="font-semibold text-green-800 mb-2">✓ 优化完成</p>p>
                                                                                                              <div className="grid grid-cols-2 gap-2 text-sm text-gray-700">
                                                                                                                                      <div>• 添加语气词: <span className="font-semibold">{optimizationStats.addedExclamations}</span>span> 个</div>div>
                                                                                                                                      <div>• 转换数字: <span className="font-semibold">{optimizationStats.convertedNumbers}</span>span> 个</div>div>
                                                                                                                                      <div>• 简化标点: <span className="font-semibold">{optimizationStats.simplifiedPunctuation}</span>span> 处</div>div>
                                                                                                                                      <div>• 压缩率: <span className="font-semibold">{optimizationStats.reductionRate}%</span>span></div>div>
                                                                                                                  </div>div>
                                                                                                              <div className="mt-3 pt-3 border-t border-green-300">
                                                                                                                                      <div className="flex justify-between items-center">
                                                                                                                                                                <div>
                                                                                                                                                                                            <span className="text-sm text-gray-600">预计时长: </span>span>
                                                                                                                                                                                            <span className="font-semibold text-blue-600">{Math.floor(estimatedDuration / 60)}分{estimatedDuration % 60}秒</span>span>
                                                                                                                                                                    </div>div>
                                                                                                                                                                <div>
                                                                                                                                                                                            <span className="text-sm text-gray-600">预计消耗: </span>span>
                                                                                                                                                                                            <span className="font-semibold text-orange-600">{estimatedCredits} 积分</span>span>
                                                                                                                                                                    </div>div>
                                                                                                                                          </div>div>
                                                                                                                  </div>div>
                                                                                            </div>div>
                                                                    </div>div>
                                                  </div>div>
                                            )}
                              </>>
                            )}
                            </div>div>
                    </div>div>
              
                  {optimizedText && (
                          <div className="mt-8">
                                    <div className="flex items-center justify-between mb-4">
                                                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                                              <Scissors className="w-5 h-5" />
                                                              智能分段预览
                                                              <span className="text-sm font-normal text-gray-500">
                                                                              （共 {segments.length} 段，约300字/段）
                                                              </span>span>
                                                </h3>h3>
                                                <button
                                                                  type="button"
                                                                  onClick={handleReSegment}
                                                                  disabled={isSegmenting}
                                                                  className="flex items-center gap-2 px-4 py-2 border border-blue-500 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                                                                >
                                                              <RefreshCw className={`w-4 h-4 ${isSegmenting ? 'animate-spin' : ''}`} />
                                                              重新分段
                                                </button>button>
                                    </div>div>
                                    
                              {segments.length === 0 ? (
                                          <div className="p-8 border-2 border-dashed border-gray-300 rounded-lg text-center text-gray-500">
                                                        <Scissors className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                                                        <p>编辑文案后点击重新分段进行智能分段</p>p>
                                          </div>div>
                                        ) : (
                                          <div className="space-y-4">
                                              {segments.map((segment, index) => (
                                                              <div
                                                                                    key={segment.id}
                                                                                    className="p-4 border border-gray-200 rounded-lg bg-white hover:border-blue-300 transition-colors"
                                                                                  >
                                                                                <div className="flex items-center justify-between mb-2">
                                                                                                    <span className="flex items-center gap-2">
                                                                                                                          <span className="inline-flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-600 rounded-full text-sm font-semibold">
                                                                                                                              {index + 1}
                                                                                                                              </span>span>
                                                                                                                          <span className="text-sm text-gray-500">
                                                                                                                                                  第 {index + 1} 段 · {segment.text.length} 字
                                                                                                                              </span>span>
                                                                                                        </span>span>
                                                                                </div>div>
                                                                                <textarea
                                                                                                        value={segment.text}
                                                                                                        onChange={(e) => handleSegmentEdit(segment.id, e.target.value)}
                                                                                                        className="w-full p-3 border border-gray-200 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                                                                                        rows={3}
                                                                                                      />
                                                              </div>div>
                                                            ))}
                                          </div>div>
                                    )}
                          </div>div>
                    )}
              
                  {optimizedText && segments.length > 0 && (
                          <div className="mt-6 flex gap-3 justify-end">
                                    <button
                                                    type="button"
                                                    onClick={handleOptimize}
                                                    disabled={isOptimizing}
                                                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
                                                  >
                                                <RefreshCw className="w-4 h-4" />
                                                重新优化
                                    </button>button>
                                    <button
                                                    type="button"
                                                    onClick={handleNext}
                                                    className="flex items-center justify-center gap-2 px-6 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all"
                                                  >
                                                下一步：逐段试听确认
                                                <ArrowRight className="w-4 h-4" />
                                    </button>button>
                          </div>div>
                    )}
              
                    <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <p className="text-sm text-blue-800">
                                      💡 <strong>智能分段说明：</strong>strong>
                                      系统会自动将文案按约300字分段，并在句子结尾处断开，确保每段内容完整流畅。
                                      分段后您可以手动调整每段内容，下一步将逐段生成语音并试听。
                            </p>p>
                    </div>div>
              </div>div>
            );
};

export default Step1ScriptOptimization;</></></></div>

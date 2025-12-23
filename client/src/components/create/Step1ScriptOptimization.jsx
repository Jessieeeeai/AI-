243
          import { useState, useRef, useEffect } from 'react';
import { optimizeService, previewService } from '../../services/api';
import { Sparkles, RefreshCw, ArrowRight, AlertCircle, CheckCircle, Scissors, Play, Pause, Volume2, RotateCcw, Music } from 'lucide-react';

// 智能分段函数
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
                                                    status: 'pending',
                                                    audioUrl: null,
                                                    audioBlob: null
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

          // 分段相关状态
          const [segments, setSegments] = useState(data.segments || []);
          const [currentPlayingSegment, setCurrentPlayingSegment] = useState(null);
          const [showSegments, setShowSegments] = useState(false);
          const audioRef = useRef(null);

          // 当优化后文案变化时，自动分段
          useEffect(() => {
                      if (optimizedText && optimizedText.trim().length >= 10) {
                                    const newSegments = smartSegmentText(optimizedText);
                                    setSegments(newSegments);
                                    setShowSegments(true);
                      }
          }, [optimizedText]);

          const handleOptimize = async () => {
                      if (!originalText || originalText.trim().length < 10) {
                                    setError('请输入至少10个字符的文案');
                                    return;
                      }

                      setIsOptimizing(true);
                      setError('');

                      try {
                                    const response = await optimizeService.optimizeScript(originalText, style);
                                    setOptimizedText(response.optimizedText);
                                    setOptimizationStats(response.changes);

                                    // 自动分段
                                    const newSegments = smartSegmentText(response.optimizedText);
                                    setSegments(newSegments);
                                    setShowSegments(true);

                                    setData({
                                                    ...data,
                                                    originalText,
                                                    optimizedText: response.optimizedText,
                                                    optimizationStats: response.changes,
                                                    optimizationStyle: style,
                                                    segments: newSegments
                                    });
                      } catch (err) {
                                    setError(err.message || '文案优化失败，请重试');
                      } finally {
                                    setIsOptimizing(false);
                      }
          };

          const handleManualEdit = (text) => {
                      setOptimizedText(text);
                      const newSegments = smartSegmentText(text);
                      setSegments(newSegments);
                      setData({ ...data, optimizedText: text, originalText, segments: newSegments });
          };

          const handleReSegment = () => {
                      if (!optimizedText || optimizedText.trim().length < 10) {
                                    setError('请先输入或优化文案');
                                    return;
                      }
                      const newSegments = smartSegmentText(optimizedText);
                      setSegments(newSegments);
                      setData({ ...data, segments: newSegments });
          };

          // 生成单段语音
          const handleGenerateSegmentAudio = async (segmentId) => {
                      const segment = segments.find(s => s.id === segmentId);
                      if (!segment) return;

                      // 检查是否有选择声音
                      const voiceId = data.voiceType === 'system' ? data.systemVoiceId : data.customVoiceId;
                      if (!voiceId) {
                                    setError('请先完成此步骤，在下一步选择声音后再试听');
                                    return;
                      }

                      updateSegmentStatus(segmentId, 'generating');
                      setError('');

                      try {
                                    const audioBlob = await previewService.generateTTS(segment.text, voiceId, data.voiceSettings);
                                    const audioUrl = URL.createObjectURL(audioBlob);

                                    const updatedSegments = segments.map(s =>
                                                    s.id === segmentId ? { ...s, status: 'ready', audioUrl, audioBlob } : s
                                                                               );
                                    setSegments(updatedSegments);
                                    setData({ ...data, segments: updatedSegments });

                                    setTimeout(() => {
                                                    playSegmentAudio(segmentId, audioUrl);
                                    }, 100);
                      } catch (err) {
                                    updateSegmentStatus(segmentId, 'error');
                                    setError('分段 ' + segmentId + ' 生成失败：' + (err.message || '未知错误'));
                      }
          };

          const updateSegmentStatus = (segmentId, status) => {
                      setSegments(segments.map(s =>
                                    s.id === segmentId ? { ...s, status } : s
                                                   ));
          };

          const playSegmentAudio = (segmentId, audioUrl) => {
                      if (!audioRef.current) return;
                      audioRef.current.pause();
                      audioRef.current.src = audioUrl;
                      audioRef.current.volume = data.voiceSettings?.volume || 0.8;
                      audioRef.current.play();
                      setCurrentPlayingSegment(segmentId);
          };

          const stopAudio = () => {
                      if (!audioRef.current) return;
                      audioRef.current.pause();
                      audioRef.current.currentTime = 0;
                      setCurrentPlayingSegment(null);
          };

          // 一键生成全部语音
          const handleGenerateAllSegments = async () => {
                      const voiceId = data.voiceType === 'system' ? data.systemVoiceId : data.customVoiceId;
                      if (!voiceId) {
                                    setError('请先完成此步骤，在下一步选择声音后再试听');
                                    return;
                      }

                      setError('');
                      for (const segment of segments) {
                                    if (segment.status !== 'ready') {
                                                    await handleGenerateSegmentAudio(segment.id);
                                                    await new Promise(resolve => setTimeout(resolve, 500));
                                    }
                      }
          };

          const handleSegmentEdit = (segmentId, newText) => {
                      const updatedSegments = segments.map(seg =>
                                    seg.id === segmentId
                                                                   ? { ...seg, text: newText, status: 'pending', audioUrl: null, audioBlob: null }
                                      : seg
                                                               );
                      setSegments(updatedSegments);
                      setData({ ...data, segments: updatedSegments });
          };

          const handleNext = () => {
                      if (!optimizedText || optimizedText.trim().length < 10) {
                                    setError('请先优化文案或手动输入口播稿');
                                    return;
                      }
                      setData({ ...data, originalText, optimizedText, optimizationStyle: style, segments });
                      onNext();
          };

          const handleClear = () => {
                      setOriginalText('');
                      setOptimizedText('');
                      setOptimizationStats(null);
                      setSegments([]);
                      setShowSegments(false);
                      setError('');
          };

          const estimatedDuration = optimizedText ? Math.ceil(optimizedText.length / 5) : 0;
          const estimatedCredits = estimatedDuration > 0 ? Math.ceil(estimatedDuration / 60 * 30) : 0;

          const styleOptions = [
                  { value: 'humorous', label: '🎭 风趣幽默', desc: '轻松活泼' },
                  { value: 'professional', label: '💼 专业严谨', desc: '客观中立' },
                  { value: 'casual', label: '😊 轻松随意', desc: '亲切自然' }
                    ];

          const hasVoiceSelected = data.voiceType === 'system' ? data.systemVoiceId : data.customVoiceId;

          const renderStatusBadge = (status) => {
                      if (status === 'pending') {
                                    return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600">待生成</span>;
                      }
                      if (status === 'generating') {
                                    return (
                                                    <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-600 flex items-center gap-1">
                                                              <RefreshCw className="w-3 h-3 animate-spin" />生成中
                                                    </span>
                                                  );
                      }
                      if (status === 'ready') {
                                    return (
                                                    <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-600 flex items-center gap-1">
                                                              <CheckCircle className="w-3 h-3" />已确认
                                                    </span>
                                                  );
                      }
                      if (status === 'error') {
                                    return <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-600">生成失败</span>;
                      }
                      return null;
          };
        
          return (
                      <div className="max-w-7xl mx-auto p-6">
                            <div className="mb-6">
                                    <h2 className="text-2xl font-bold text-gray-900 mb-2">📝 Step 1: 文案优化与智能分段</h2>
                                    <p className="text-gray-600">粘贴您的原始文案，AI将自动优化并智能分段（约300字/段）</p>
                            </div>
                      
                            <div className="mb-6">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">选择风格</label>
                                    <div className="flex gap-3">
                                            {styleOptions.map(option => (
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
                                                        <div className="font-semibold">{option.label}</div>
                                                        <div className="text-sm text-gray-500">{option.desc}</div>
                                          </button>
                                        ))}
                                    </div>
                            </div>
                      
                              {error && (
                                      <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                                                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                                                <div className="text-sm text-red-800">{error}</div>
                                      </div>
                            )}
                      
                            <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                              <div className="flex items-center justify-between">
                                                          <h3 className="text-lg font-semibold text-gray-900">📋 原始文案</h3>
                                                          <span className="text-sm text-gray-500">{originalText.length}/10000</span>
                                              </div>
                                              <textarea
                                                                  value={originalText}
                                                                  onChange={(e) => setOriginalText(e.target.value)}
                                                                  placeholder="粘贴您的文章或文案..."
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
                                                          </button>
                                                          <button
                                                                                type="button"
                                                                                onClick={handleOptimize}
                                                                                disabled={isOptimizing || !originalText}
                                                                                className="flex-1 flex items-center justify-center gap-2 px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed transition-all"
                                                                              >
                                                                  {isOptimizing ? (
                                                                                                      <span className="flex items-center gap-2">
                                                                                                                        <RefreshCw className="w-4 h-4 animate-spin" />
                                                                                                                        正在优化...
                                                                                                              </span>
                                                                                                    ) : (
                                                                                                      <span className="flex items-center gap-2">
                                                                                                                        <Sparkles className="w-4 h-4" />
                                                                                                                        AI优化文案
                                                                                                              </span>
                                                                        )}
                                                          </button>
                                              </div>
                                    </div>
                            
                                    <div className="space-y-4">
                                              <div className="flex items-center justify-between">
                                                          <h3 className="text-lg font-semibold text-gray-900">✨ 优化后口播稿</h3>
                                                      {optimizedText && <span className="text-sm text-gray-500">{optimizedText.length}/10000</span>}
                                              </div>
                                            {!optimizedText ? (
                                          <div className="h-80 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-400">
                                                        <div className="text-center p-6">
                                                                        <Sparkles className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                                                                        <p className="text-lg mb-2">👈 粘贴文案后点击AI优化</p>
                                                                        <p className="text-sm">系统会自动转换为口播稿风格并智能分段</p>
                                                        </div>
                                          </div>
                                        ) : (
                                          <div>
                                                        <textarea
                                                                                value={optimizedText}
                                                                                onChange={(e) => handleManualEdit(e.target.value)}
                                                                                className="w-full h-80 p-4 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                                                maxLength={10000}
                                                                              />
                                                  {optimizationStats && (
                                                                  <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
                                                                                    <div className="flex items-start gap-3">
                                                                                                        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                                                                                                        <div className="flex-1">
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
                                          </div>
                                              )}
                                    </div>
                            </div>
                      
                              {/* 智能分段区域 */}
                              {showSegments && segments.length > 0 && (
                                      <div className="mt-8 border-t pt-6">
                                                <div className="flex items-center justify-between mb-4">
                                                            <h3 className="text-lg font-semibold flex items-center gap-2">
                                                                          <Scissors className="w-5 h-5" />
                                                                          智能分段预览
                                                                          <span className="text-sm font-normal text-gray-500">（共 {segments.length} 段）</span>
                                                            </h3>
                                                            <div className="flex items-center gap-3">
                                                                          <button
                                                                                                  type="button"
                                                                                                  onClick={handleReSegment}
                                                                                                  className="flex items-center gap-2 px-3 py-1.5 border border-blue-500 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors text-sm"
                                                                                                >
                                                                                          <RefreshCw className="w-4 h-4" />
                                                                                          重新分段
                                                                          </button>
                                                                    {hasVoiceSelected && (
                                                              <button
                                                                                        type="button"
                                                                                        onClick={handleGenerateAllSegments}
                                                                                        disabled={segments.every(s => s.status === 'generating')}
                                                                                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 text-sm"
                                                                                      >
                                                                                <Music className="w-4 h-4" />
                                                                                一键生成全部语音
                                                              </button>
                                                                          )}
                                                            </div>
                                                </div>
                                      
                                                <audio ref={audioRef} onEnded={() => setCurrentPlayingSegment(null)} className="hidden" />
                                      
                                                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                                                        {segments.map((segment, index) => (
                                                            <div
                                                                                    key={segment.id}
                                                                                    className={`p-4 border rounded-lg transition-colors ${
                                                                                                              currentPlayingSegment === segment.id
                                                                                                                ? 'border-blue-500 bg-blue-50'
                                                                                                                : 'border-gray-200 bg-white hover:border-blue-300'
                                                                                            }`}
                                                                                  >
                                                                            <div className="flex items-center justify-between mb-2">
                                                                                              <div className="flex items-center gap-3">
                                                                                                                  <span className="inline-flex items-center justify-center w-7 h-7 bg-blue-100 text-blue-600 rounded-full text-sm font-semibold">
                                                                                                                          {index + 1}
                                                                                                                          </span>
                                                                                                                  <span className="text-sm text-gray-500">{segment.text.length} 字</span>
                                                                                                      {renderStatusBadge(segment.status)}
                                                                                                      </div>
                                                                                              <div className="flex items-center gap-2">
                                                                                                      {segment.status === 'ready' && segment.audioUrl && (
                                                                                                                <button
                                                                                                                                                type="button"
                                                                                                                                                onClick={() => currentPlayingSegment === segment.id ? stopAudio() : playSegmentAudio(segment.id, segment.audioUrl)}
                                                                                                                                                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition-colors text-sm ${
                                                                                                                                                                                  currentPlayingSegment === segment.id
                                                                                                                                                                                    ? 'bg-red-100 text-red-600 hover:bg-red-200'
                                                                                                                                                                                    : 'bg-green-100 text-green-600 hover:bg-green-200'
                                                                                                                                                        }`}
                                                                                                                                              >
                                                                                                                        {currentPlayingSegment === segment.id ? (
                                                                                                                                                                                <><Pause className="w-4 h-4" />暂停</>
                                                                                                                                                                              ) : (
                                                                                                                                                                                <><Play className="w-4 h-4" />播放</>
                                                                                                                                                                              )}
                                                                                                                        </button>
                                                                                                                  )}
                                                                                                      {hasVoiceSelected && (
                                                                                                                <button
                                                                                                                                                type="button"
                                                                                                                                                onClick={() => handleGenerateSegmentAudio(segment.id)}
                                                                                                                                                disabled={segment.status === 'generating'}
                                                                                                                                                className="flex items-center gap-1 px-3 py-1.5 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors disabled:bg-gray-100 disabled:text-gray-400 text-sm"
                                                                                                                                              >
                                                                                                                        {segment.status === 'generating' ? (
                                                                                                                                                                                <><RefreshCw className="w-4 h-4 animate-spin" />生成中</>
                                                                                                                                                                              ) : segment.status === 'ready' ? (
                                                                                                                                                                                <><RotateCcw className="w-4 h-4" />重新生成</>
                                                                                                                                                                              ) : (
                                                                                                                                                                                <><Volume2 className="w-4 h-4" />生成语音</>
                                                                                                                                                                              )}
                                                                                                                        </button>
                                                                                                                  )}
                                                                                                      </div>
                                                                            </div>
                                                                            <textarea
                                                                                                      value={segment.text}
                                                                                                      onChange={(e) => handleSegmentEdit(segment.id, e.target.value)}
                                                                                                      className="w-full p-3 border border-gray-200 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                                                                                      rows={2}
                                                                                                    />
                                                            </div>
                                                          ))}
                                                </div>
                                      
                                              {!hasVoiceSelected && (
                                                          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                                                        <p className="text-sm text-yellow-800">
                                                                                        💡 <strong>提示：</strong> 完成此步骤后，在下一步选择声音，然后可以返回此页面试听每段语音效果。
                                                                        </p>
                                                          </div>
                                                )}
                                      </div>
                            )}
                      
                              {optimizedText && (
                                      <div className="mt-6 flex gap-3 justify-end">
                                                <button
                                                                    type="button"
                                                                    onClick={handleOptimize}
                                                                    disabled={isOptimizing}
                                                                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
                                                                  >
                                                            <RefreshCw className="w-4 h-4" />
                                                            重新优化
                                                </button>
                                                <button
                                                                    type="button"
                                                                    onClick={handleNext}
                                                                    className="flex items-center justify-center gap-2 px-6 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all"
                                                                  >
                                                            下一步：选择声音
                                                            <ArrowRight className="w-4 h-4" />
                                                </button>
                                      </div>
                            )}
                      
                            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                    <p className="text-sm text-blue-800">
                                              <strong>💡 文案优化说明：</strong> AI会自动优化标点符号、转换数字为口语化表达、添加适当的语气词，让文案更适合口播。优化后系统会自动按约300字智能分段，您可以编辑每段内容。选择声音后可逐段试听效果。
                                    </p>
                            </div>
                      </div>
                    );
};


export default Step1ScriptOptimization;

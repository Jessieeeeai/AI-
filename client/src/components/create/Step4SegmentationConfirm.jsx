import { useState, useRef, useEffect } from 'react';
import { previewService } from '../../services/api';
import { 
    Scissors, RefreshCw, ArrowRight, ArrowLeft, AlertCircle, CheckCircle, 
    Play, Pause, Volume2, RotateCcw, Music
} from 'lucide-react';

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

const Step4SegmentationConfirm = ({ data, setData, onNext, onPrev }) => {
    const [segments, setSegments] = useState(data.segments || []);
    const [isSegmenting, setIsSegmenting] = useState(false);
    const [currentPlayingSegment, setCurrentPlayingSegment] = useState(null);
    const [error, setError] = useState('');
    const audioRef = useRef(null);

    // 初始化时自动分段
    useEffect(() => {
          if (data.optimizedText && segments.length === 0) {
                  handleSegment();
          }
    }, []);

    // 智能分段
    const handleSegment = () => {
          if (!data.optimizedText || data.optimizedText.trim().length < 10) {
                  setError('请先完成文案优化');
                  return;
          }

          setIsSegmenting(true);
          const newSegments = smartSegmentText(data.optimizedText);
          setSegments(newSegments);
          setData({ ...data, segments: newSegments });
          setIsSegmenting(false);
    };

    // 生成单段语音
    const handleGenerateSegmentAudio = async (segmentId) => {
          const segment = segments.find(s => s.id === segmentId);
          if (!segment) return;

          const voiceId = data.voiceType === 'system' ? data.systemVoiceId : data.customVoiceId;
          if (!voiceId) {
                  setError('请先在上一步选择声音');
                  return;
          }

          updateSegmentStatus(segmentId, 'generating');
          setError('');

          try {
                  const audioBlob = await previewService.generateTTS(segment.text, voiceId, data.voiceSettings);
                  const audioUrl = URL.createObjectURL(audioBlob);

                  const updatedSegments = segments.map(s =>
                            s.id === segmentId
                                                                 ? { ...s, status: 'ready', audioUrl, audioBlob }
                              : s
                                                             );
                  setSegments(updatedSegments);
                  setData({ ...data, segments: updatedSegments });

                  // 自动播放生成的语音
                  setTimeout(() => {
                            playSegmentAudio(segmentId, audioUrl);
                  }, 100);
          } catch (err) {
                  updateSegmentStatus(segmentId, 'error');
                  setError('分段 ' + segmentId + ' 生成失败：' + (err.message || '未知错误'));
          }
    };

    // 更新分段状态
    const updateSegmentStatus = (segmentId, status) => {
          setSegments(segments.map(s =>
                  s.id === segmentId ? { ...s, status } : s
                                       ));
    };

    // 播放分段语音
    const playSegmentAudio = (segmentId, audioUrl) => {
          if (!audioRef.current) return;

          audioRef.current.pause();
          audioRef.current.src = audioUrl;
          audioRef.current.volume = data.voiceSettings?.volume || 0.8;
          audioRef.current.play();
          setCurrentPlayingSegment(segmentId);
    };

    // 停止播放
    const stopAudio = () => {
          if (!audioRef.current) return;
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
          setCurrentPlayingSegment(null);
    };

    // 一键生成所有分段语音
    const handleGenerateAllSegments = async () => {
          const voiceId = data.voiceType === 'system' ? data.systemVoiceId : data.customVoiceId;
          if (!voiceId) {
                  setError('请先在上一步选择声音');
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

    // 编辑分段内容
    const handleSegmentEdit = (segmentId, newText) => {
          const updatedSegments = segments.map(seg =>
                  seg.id === segmentId
                                                       ? { ...seg, text: newText, status: 'pending', audioUrl: null, audioBlob: null }
                    : seg
                                                   );
          setSegments(updatedSegments);
          setData({ ...data, segments: updatedSegments });
    };

    // 检查是否所有分段都已确认
    const allSegmentsReady = segments.length > 0 && segments.every(s => s.status === 'ready');

    // 下一步
    const handleNext = () => {
          if (!allSegmentsReady) {
                  setError('请确保所有分段都已生成并试听确认');
                  return;
          }

          setData({ ...data, segments });
          onNext();
    };

    // 渲染状态标签
    const renderStatusBadge = (status) => {
          if (status === 'pending') {
                  return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600">待生成</span>span>;
          }
          if (status === 'generating') {
                  return (
                            <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-600 flex items-center gap-1">
                                      <RefreshCw className="w-3 h-3 animate-spin" />生成中
                            </span>span>
                          );
          }
          if (status === 'ready') {
                  return (
                            <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-600 flex items-center gap-1">
                                      <CheckCircle className="w-3 h-3" />已确认
                            </span>span>
                          );
          }
          if (status === 'error') {
                  return <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-600">生成失败</span>span>;
          }
          return null;
    };
  
    return (
          <div className="max-w-7xl mx-auto p-6">
                <div className="mb-6">
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">✂️ Step 4: 智能分段与逐段试听</h2>h2>
                        <p className="text-gray-600">系统已将文案按约300字智能分段，请逐段生成语音并试听确认</p>p>
                </div>div>
          
            {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                              <div className="text-sm text-red-800">{error}</div>div>
                    </div>div>
                )}
          
            {/* 顶部操作栏 */}
                <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-4">
                                  <h3 className="text-lg font-semibold flex items-center gap-2">
                                              <Scissors className="w-5 h-5" />
                                              分段列表
                                              <span className="text-sm font-normal text-gray-500">（共 {segments.length} 段）</span>span>
                                  </h3>h3>
                                  <button
                                                type="button"
                                                onClick={handleSegment}
                                                disabled={isSegmenting}
                                                className="flex items-center gap-2 px-3 py-1.5 border border-blue-500 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors text-sm"
                                              >
                                              <RefreshCw className={`w-4 h-4 ${isSegmenting ? 'animate-spin' : ''}`} />
                                              重新分段
                                  </button>button>
                        </div>div>
                
                        <button
                                    type="button"
                                    onClick={handleGenerateAllSegments}
                                    disabled={segments.every(s => s.status === 'generating')}
                                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300"
                                  >
                                  <Music className="w-4 h-4" />
                                  一键生成全部语音
                        </button>button>
                </div>div>
          
            {/* 隐藏的音频播放器 */}
                <audio ref={audioRef} onEnded={() => setCurrentPlayingSegment(null)} className="hidden" />
          
            {/* 分段列表 */}
            {segments.length === 0 ? (
                    <div className="p-8 border-2 border-dashed border-gray-300 rounded-lg text-center text-gray-500">
                              <Scissors className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                              <p>正在进行智能分段...</p>p>
                    </div>div>
                  ) : (
                    <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                      {segments.map((segment, index) => (
                                  <div
                                                  key={segment.id}
                                                  className={`p-4 border rounded-lg transition-colors ${
                                                                    currentPlayingSegment === segment.id
                                                                      ? 'border-blue-500 bg-blue-50'
                                                                      : 'border-gray-200 bg-white hover:border-blue-300'
                                                  }`}
                                                >
                                                <div className="flex items-center justify-between mb-3">
                                                                <div className="flex items-center gap-3">
                                                                                  <span className="inline-flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full text-sm font-semibold">
                                                                                    {index + 1}
                                                                                    </span>span>
                                                                                  <span className="text-sm text-gray-500">第 {index + 1} 段 · {segment.text.length} 字</span>span>
                                                                  {renderStatusBadge(segment.status)}
                                                                </div>div>
                                                
                                                                <div className="flex items-center gap-2">
                                                                  {segment.status === 'ready' && segment.audioUrl && (
                                                                      <button
                                                                                              type="button"
                                                                                              onClick={() =>
                                                                                                                        currentPlayingSegment === segment.id
                                                                                                                          ? stopAudio()
                                                                                                                          : playSegmentAudio(segment.id, segment.audioUrl)
                                                                                                }
                                                                                              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition-colors ${
                                                                                                                        currentPlayingSegment === segment.id
                                                                                                                          ? 'bg-red-100 text-red-600 hover:bg-red-200'
                                                                                                                          : 'bg-green-100 text-green-600 hover:bg-green-200'
                                                                                                }`}
                                                                                            >
                                                                        {currentPlayingSegment === segment.id ? (
                                                                                                                      <><Pause className="w-4 h-4" />暂停</>>
                                                                                                                    ) : (
                                                                                                                      <><Play className="w-4 h-4" />播放</>>
                                                                                                                    )}
                                                                      </button>button>
                                                                                  )}
                                                                
                                                                                  <button
                                                                                                        type="button"
                                                                                                        onClick={() => handleGenerateSegmentAudio(segment.id)}
                                                                                                        disabled={segment.status === 'generating'}
                                                                                                        className="flex items-center gap-1 px-3 py-1.5 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors disabled:bg-gray-100 disabled:text-gray-400"
                                                                                                      >
                                                                                    {segment.status === 'generating' ? (
                                                                                                                              <><RefreshCw className="w-4 h-4 animate-spin" />生成中</>>
                                                                                                                            ) : segment.status === 'ready' ? (
                                                                                                                              <><RotateCcw className="w-4 h-4" />重新生成</>>
                                                                                                                            ) : (
                                                                                                                              <><Volume2 className="w-4 h-4" />生成语音</>>
                                                                                                                            )}
                                                                                    </button>button>
                                                                </div>div>
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
          
            {/* 状态摘要 */}
                <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg border border-blue-200">
                        <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-4">
                                              <div className="text-sm">
                                                            <span className="text-gray-600">已确认: </span>span>
                                                            <span className="font-semibold text-green-600">{segments.filter(s => s.status === 'ready').length}</span>span>
                                                            <span className="text-gray-600"> / {segments.length} 段</span>span>
                                              </div>div>
                                              <div className="text-sm">
                                                            <span className="text-gray-600">总字数: </span>span>
                                                            <span className="font-semibold text-blue-600">{segments.reduce((sum, s) => sum + s.text.length, 0)} 字</span>span>
                                              </div>div>
                                  </div>div>
                          {allSegmentsReady && (
                        <span className="flex items-center gap-2 text-green-600 font-semibold">
                                      <CheckCircle className="w-5 h-5" />
                                      全部确认完成！
                        </span>span>
                                  )}
                        </div>div>
                </div>div>
          
            {/* 提示信息 */}
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm text-blue-800">
                                  💡 <strong>提示：</strong>strong>
                                  点击每段右侧的"生成语音"按钮，逐段生成语音并试听。如果对某段效果不满意，可以编辑文字内容后重新生成。所有分段确认后，才能进入最终确认步骤。
                        </p>p>
                </div>div>
          
            {/* 底部导航 */}
                <div className="flex justify-between pt-6">
                        <button
                                    type="button"
                                    onClick={onPrev}
                                    className="flex items-center gap-2 px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                  >
                                  <ArrowLeft className="w-4 h-4" />
                                  上一步
                        </button>button>
                
                        <button
                                    type="button"
                                    onClick={handleNext}
                                    disabled={!allSegmentsReady}
                                    className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 disabled:from-gray-300 disabled:to-gray-300 transition-all"
                                  >
                                  下一步：确认生成视频
                                  <ArrowRight className="w-4 h-4" />
                        </button>button>
                </div>div>
          </div>div>
        );
};

export default Step4SegmentationConfirm;

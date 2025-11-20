import { useState, useEffect } from 'react';
import { segmentationService } from '../../services/api';
import { 
  Scissors, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  Film, 
  ArrowRight, 
  ArrowLeft,
  RefreshCw,
  Info,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

const Step4SegmentationConfirm = ({ data, setData, onNext, onPrev }) => {
  const [segmentationResult, setSegmentationResult] = useState(null);
  const [selectedStrategy, setSelectedStrategy] = useState(data.segmentationStrategy || 'auto');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const [expandedSegments, setExpandedSegments] = useState(new Set([0])); // 默认展开第一段
  const [costEstimate, setCostEstimate] = useState(null);

  // 文本来源（优化后的文本）
  const text = data.optimizedText || '';

  // 分段策略选项
  const strategies = [
    {
      id: 'auto',
      name: '自动选择',
      description: '根据文本长度智能选择最佳策略',
      icon: '🤖'
    },
    {
      id: 'short',
      name: '短分段',
      description: '50-150字/段，快节奏内容',
      icon: '⚡'
    },
    {
      id: 'medium',
      name: '中等分段',
      description: '150-300字/段，常规内容',
      icon: '📝'
    },
    {
      id: 'long',
      name: '长分段',
      description: '300-500字/段，深度讲解',
      icon: '📚'
    }
  ];

  // 初始加载时分析
  useEffect(() => {
    if (text) {
      analyzeText();
    }
  }, []);

  // 分析文本分段
  const analyzeText = async () => {
    if (!text || text.trim().length === 0) {
      setError('没有可分段的文本内容');
      return;
    }

    setIsAnalyzing(true);
    setError('');

    try {
      // 分析分段
      const response = await segmentationService.analyzeSegmentation(text, selectedStrategy);
      
      if (response.success) {
        setSegmentationResult(response.data);
        
        // 获取费用估算
        const costResponse = await segmentationService.estimateCost(text, selectedStrategy);
        if (costResponse.success) {
          setCostEstimate(costResponse.data);
        }
      } else {
        setError(response.error || '分段分析失败');
      }
    } catch (err) {
      console.error('分段分析错误:', err);
      setError(err.message || '分段分析失败，请重试');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // 切换策略
  const handleStrategyChange = async (strategyId) => {
    setSelectedStrategy(strategyId);
    // 重新分析
    setIsAnalyzing(true);
    try {
      const response = await segmentationService.analyzeSegmentation(text, strategyId);
      if (response.success) {
        setSegmentationResult(response.data);
        
        const costResponse = await segmentationService.estimateCost(text, strategyId);
        if (costResponse.success) {
          setCostEstimate(costResponse.data);
        }
      }
    } catch (err) {
      setError(err.message || '切换策略失败');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // 切换段落展开/收起
  const toggleSegment = (index) => {
    const newExpanded = new Set(expandedSegments);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedSegments(newExpanded);
  };

  // 全部展开/收起
  const toggleAllSegments = () => {
    if (expandedSegments.size === segmentationResult.segments.length) {
      setExpandedSegments(new Set());
    } else {
      setExpandedSegments(new Set(segmentationResult.segments.map((_, i) => i)));
    }
  };

  // 格式化时长
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}分${secs}秒` : `${secs}秒`;
  };

  // 下一步
  const handleNext = () => {
    if (!segmentationResult) {
      setError('请先分析文本分段');
      return;
    }

    // 保存分段信息
    setData({
      ...data,
      segmentationStrategy: selectedStrategy,
      segmentationResult: segmentationResult,
      segments: segmentationResult.segments,
      needsSegmentation: segmentationResult.needsSegmentation,
      estimatedCost: costEstimate
    });

    onNext();
  };

  if (isAnalyzing && !segmentationResult) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex flex-col items-center justify-center h-64">
          <RefreshCw className="w-12 h-12 text-blue-600 animate-spin mb-4" />
          <p className="text-gray-600">正在分析文本分段...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* 标题 */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          智能分段确认
        </h2>
        <p className="text-gray-600">
          系统将根据文本长度自动分段，每段生成独立视频后自动合并
        </p>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-red-800">{error}</p>
          </div>
        </div>
      )}

      {/* 分段策略选择 */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          选择分段策略
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {strategies.map((strategy) => (
            <button
              key={strategy.id}
              onClick={() => handleStrategyChange(strategy.id)}
              disabled={isAnalyzing}
              className={`p-4 rounded-lg border-2 text-left transition-all ${
                selectedStrategy === strategy.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              } ${isAnalyzing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">{strategy.icon}</span>
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{strategy.name}</div>
                  <div className="text-sm text-gray-600 mt-1">{strategy.description}</div>
                </div>
                {selectedStrategy === strategy.id && (
                  <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 分段结果 */}
      {segmentationResult && (
        <>
          {/* 统计信息 */}
          <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Film className="w-4 h-4 text-blue-600" />
                <span className="text-sm text-blue-600 font-medium">视频段数</span>
              </div>
              <div className="text-2xl font-bold text-blue-900">
                {segmentationResult.totalSegments}
              </div>
            </div>

            <div className="p-4 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-4 h-4 text-green-600" />
                <span className="text-sm text-green-600 font-medium">总时长</span>
              </div>
              <div className="text-2xl font-bold text-green-900">
                {formatDuration(segmentationResult.estimatedTotalDuration)}
              </div>
            </div>

            <div className="p-4 bg-purple-50 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Scissors className="w-4 h-4 text-purple-600" />
                <span className="text-sm text-purple-600 font-medium">总字数</span>
              </div>
              <div className="text-2xl font-bold text-purple-900">
                {segmentationResult.totalChars}
              </div>
            </div>

            {costEstimate && (
              <div className="p-4 bg-orange-50 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Info className="w-4 h-4 text-orange-600" />
                  <span className="text-sm text-orange-600 font-medium">预计积分</span>
                </div>
                <div className="text-2xl font-bold text-orange-900">
                  {costEstimate.estimatedCredits}
                </div>
              </div>
            )}
          </div>

          {/* 提示信息 */}
          {segmentationResult.recommendations && segmentationResult.recommendations.length > 0 && (
            <div className="mb-6 space-y-2">
              {segmentationResult.recommendations.map((rec, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg flex items-start gap-3 ${
                    rec.type === 'warning' 
                      ? 'bg-yellow-50 border border-yellow-200' 
                      : 'bg-blue-50 border border-blue-200'
                  }`}
                >
                  <Info className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                    rec.type === 'warning' ? 'text-yellow-600' : 'text-blue-600'
                  }`} />
                  <p className={rec.type === 'warning' ? 'text-yellow-800' : 'text-blue-800'}>
                    {rec.message}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* 分段列表 */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                分段预览（共{segmentationResult.segments.length}段）
              </h3>
              <button
                onClick={toggleAllSegments}
                className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                {expandedSegments.size === segmentationResult.segments.length ? (
                  <>
                    <ChevronUp className="w-4 h-4" />
                    全部收起
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4" />
                    全部展开
                  </>
                )}
              </button>
            </div>

            <div className="space-y-3">
              {segmentationResult.segments.map((segment, index) => (
                <div
                  key={index}
                  className="border border-gray-200 rounded-lg overflow-hidden"
                >
                  <button
                    onClick={() => toggleSegment(index)}
                    className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-bold text-blue-600">{index + 1}</span>
                      </div>
                      <div className="text-left">
                        <div className="font-medium text-gray-900">
                          第{index + 1}段
                        </div>
                        <div className="text-sm text-gray-500">
                          {segment.charCount}字 · 约{formatDuration(segment.estimatedDuration)}
                        </div>
                      </div>
                    </div>
                    {expandedSegments.has(index) ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </button>

                  {expandedSegments.has(index) && (
                    <div className="p-4 bg-gray-50 border-t border-gray-200">
                      <div className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                        {segment.text}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 生成信息 */}
          {costEstimate && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-3">生成信息</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">视频生成时间：</span>
                  <span className="font-medium text-gray-900 ml-2">
                    约{Math.ceil(costEstimate.estimatedGenerationTime / 60)}分钟
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">消耗积分：</span>
                  <span className="font-medium text-gray-900 ml-2">
                    {costEstimate.estimatedCredits}积分
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">最终效果：</span>
                  <span className="font-medium text-gray-900 ml-2">
                    {segmentationResult.needsSegmentation ? '自动合并为完整视频' : '单个视频'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* 导航按钮 */}
      <div className="flex items-center justify-between pt-6 border-t border-gray-200">
        <button
          onClick={onPrev}
          className="px-6 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          上一步
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={analyzeText}
            disabled={isAnalyzing}
            className="px-6 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
            重新分析
          </button>

          <button
            onClick={handleNext}
            disabled={!segmentationResult || isAnalyzing}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            确认分段
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Step4SegmentationConfirm;

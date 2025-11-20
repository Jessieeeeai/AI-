import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../utils/AuthContext';
import { taskService } from '../../services/api';
import {
  CheckCircle,
  ArrowLeft,
  Sparkles,
  AlertCircle,
  Loader2,
  FileText,
  Mic,
  Film,
  Scissors,
  DollarSign,
  Clock
} from 'lucide-react';

const Step5FinalConfirm = ({ data, setData, onPrev }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  
  const { user } = useAuth();
  const navigate = useNavigate();

  // 格式化时长
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}分${secs}秒` : `${secs}秒`;
  };

  // 计算总费用
  const calculateTotalCost = () => {
    if (data.estimatedCost) {
      return data.estimatedCost.estimatedCredits || 0;
    }
    // 默认估算：按字数计算 (1积分/秒，约3.5字/秒)
    const textLength = data.optimizedText?.length || 0;
    return Math.ceil(textLength / 3.5);
  };

  const totalCost = calculateTotalCost();
  const userCredits = user?.credits || 0;
  const canAfford = userCredits >= totalCost;

  // 提交任务
  const handleSubmit = async () => {
    if (!agreedToTerms) {
      setError('请先同意服务条款');
      return;
    }

    if (!canAfford) {
      setError('积分不足，请先充值');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      // 准备任务数据
      const taskData = {
        // 基础文本
        text: data.optimizedText,
        originalText: data.originalText,
        optimizationStyle: data.optimizationStyle,

        // 声音设置
        voiceId: data.voiceType === 'custom' ? data.customVoiceId : data.systemVoiceId,
        voiceType: data.voiceType,
        voiceSettings: JSON.stringify(data.voiceSettings),

        // 模板
        templateId: data.templateId,
        isCustomTemplate: data.isCustomTemplate,

        // 分段信息
        segmentationStrategy: data.segmentationStrategy,
        segmentCount: data.segments?.length || 1,
        segmentData: data.segments ? JSON.stringify(data.segments) : null,
        needsSegmentation: data.needsSegmentation,

        // 费用
        totalCost: totalCost
      };

      // 提交任务
      const response = await taskService.create(taskData);

      if (response.success) {
        // 跳转到任务详情页
        navigate(`/tasks/${response.data.taskId}`);
      } else {
        setError(response.error || '创建任务失败');
      }
    } catch (err) {
      console.error('提交任务错误:', err);
      setError(err.message || '创建任务失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* 标题 */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-purple-600" />
          最终确认
        </h2>
        <p className="text-gray-600">
          请确认以下信息，确认无误后点击"开始生成"
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

      {/* 积分不足警告 */}
      {!canAfford && (
        <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-orange-800 font-medium mb-2">
                积分不足
              </p>
              <p className="text-orange-700 text-sm mb-3">
                当前积分：{userCredits}，需要：{totalCost}，还差：{totalCost - userCredits}积分
              </p>
              <button
                onClick={() => navigate('/pricing')}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm"
              >
                前往充值
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 信息总览 */}
      <div className="space-y-4 mb-6">
        {/* 文案信息 */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="flex items-start gap-3 mb-3">
            <FileText className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-medium text-gray-900 mb-1">文案内容</h3>
              <div className="text-sm text-gray-600 space-y-1">
                <p>原始文本：{data.originalText?.length || 0}字</p>
                <p>优化后：{data.optimizedText?.length || 0}字</p>
                <p>风格：{
                  data.optimizationStyle === 'humorous' ? '幽默风趣' :
                  data.optimizationStyle === 'professional' ? '专业严肃' :
                  '轻松随意'
                }</p>
              </div>
            </div>
          </div>
          <div className="p-3 bg-white rounded border border-gray-200 max-h-32 overflow-y-auto">
            <p className="text-sm text-gray-700 whitespace-pre-wrap">
              {data.optimizedText || '无内容'}
            </p>
          </div>
        </div>

        {/* 声音信息 */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-3">
            <Mic className="w-5 h-5 text-purple-600" />
            <div className="flex-1">
              <h3 className="font-medium text-gray-900 mb-1">声音设置</h3>
              <div className="text-sm text-gray-600 space-y-1">
                <p>类型：{data.voiceType === 'system' ? '系统预设声音' : '自定义声音'}</p>
                <p>语速：{data.voiceSettings?.speed || 1.0}x</p>
                <p>音调：{data.voiceSettings?.pitch || 1.0}x</p>
              </div>
            </div>
          </div>
        </div>

        {/* 模板信息 */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-3">
            <Film className="w-5 h-5 text-green-600" />
            <div>
              <h3 className="font-medium text-gray-900 mb-1">视频模板</h3>
              <p className="text-sm text-gray-600">
                {data.isCustomTemplate ? '自定义模板' : '系统模板 ' + data.templateId}
              </p>
            </div>
          </div>
        </div>

        {/* 分段信息 */}
        {data.needsSegmentation && (
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-start gap-3">
              <Scissors className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-medium text-gray-900 mb-1">智能分段</h3>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>分段策略：{
                    data.segmentationStrategy === 'auto' ? '自动' :
                    data.segmentationStrategy === 'short' ? '短分段' :
                    data.segmentationStrategy === 'medium' ? '中等分段' :
                    '长分段'
                  }</p>
                  <p>分段数量：{data.segments?.length || 0}段</p>
                  <p className="text-blue-600">将生成{data.segments?.length || 0}个视频并自动合并</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 费用和时间 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg border border-purple-200">
          <div className="flex items-center gap-3">
            <DollarSign className="w-6 h-6 text-purple-600" />
            <div>
              <div className="text-sm text-purple-600 mb-1">预计消耗积分</div>
              <div className="text-2xl font-bold text-purple-900">{totalCost}</div>
            </div>
          </div>
        </div>

        <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200">
          <div className="flex items-center gap-3">
            <Clock className="w-6 h-6 text-blue-600" />
            <div>
              <div className="text-sm text-blue-600 mb-1">预计生成时间</div>
              <div className="text-2xl font-bold text-blue-900">
                {data.estimatedCost?.estimatedGenerationTime 
                  ? Math.ceil(data.estimatedCost.estimatedGenerationTime / 60) + '分钟'
                  : '1-3分钟'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 服务条款 */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={agreedToTerms}
            onChange={(e) => setAgreedToTerms(e.target.checked)}
            className="mt-1 w-4 h-4 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
          />
          <span className="text-sm text-gray-700">
            我已阅读并同意
            <a href="/terms" target="_blank" className="text-purple-600 hover:text-purple-700 mx-1">
              《服务条款》
            </a>
            和
            <a href="/privacy" target="_blank" className="text-purple-600 hover:text-purple-700 mx-1">
              《隐私政策》
            </a>
            。我理解视频生成将消耗 <span className="font-bold text-purple-700">{totalCost}</span> 积分，且生成过程不可撤销。
          </span>
        </label>
      </div>

      {/* 导航按钮 */}
      <div className="flex items-center justify-between pt-6 border-t border-gray-200">
        <button
          onClick={onPrev}
          disabled={isSubmitting}
          className="px-6 py-3 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          <ArrowLeft className="w-4 h-4" />
          上一步
        </button>

        <button
          onClick={handleSubmit}
          disabled={!agreedToTerms || !canAfford || isSubmitting}
          className="px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-500/30"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              生成中...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              开始生成视频
            </>
          )}
        </button>
      </div>

      {/* 提示信息 */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">生成说明</p>
            <ul className="list-disc list-inside space-y-1 text-blue-700">
              <li>视频生成通常需要1-5分钟，长视频可能需要更长时间</li>
              <li>生成过程中可以关闭页面，稍后在"我的作品"中查看</li>
              <li>生成完成后会自动保存到你的作品库</li>
              <li>如遇问题，积分会自动退还</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Step5FinalConfirm;

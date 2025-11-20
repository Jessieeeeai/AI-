import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../utils/AuthContext';
import { taskService } from '../../services/api';
import { DollarSign, AlertCircle, Sparkles, Clock } from 'lucide-react';

export default function Step4PaymentConfirm({ data, onPrev }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { user, updateCredits } = useAuth();
  const navigate = useNavigate();

  // 计算费用
  const calculateCost = () => {
    const textLength = data.text.length;
    const estimatedDuration = (textLength / 300) * 60; // 秒
    const minutes = Math.ceil(estimatedDuration / 60);

    const audioCost = minutes * 5; // 音频：5积分/分钟
    const videoCost = minutes * 25; // 视频：25积分/分钟
    let extraCost = 0;

    if (data.voiceId) {
      extraCost += 20; // 自定义声音：+20积分
    }

    if (data.isCustomTemplate) {
      extraCost += 50; // 自定义模板：+50积分
    }

    const subtotal = audioCost + videoCost + extraCost;
    
    // 这里可以应用优惠（暂时没有）
    const discount = 0;
    const total = subtotal - discount;

    return {
      textLength,
      estimatedDuration: Math.ceil(estimatedDuration),
      minutes,
      audioCost,
      videoCost,
      extraCost,
      subtotal,
      discount,
      total
    };
  };

  const cost = calculateCost();
  const hasEnoughCredits = user && user.credits >= cost.total;

  // 智能分段说明
  const getSegmentInfo = () => {
    if (cost.estimatedDuration <= 60) {
      return { segments: 1, description: '视频时长在60秒内，无需分段' };
    }
    const segments = Math.ceil(cost.estimatedDuration / 60);
    return {
      segments,
      description: `视频将分为${segments}段生成，每段约60秒`
    };
  };

  const segmentInfo = getSegmentInfo();

  const handleConfirm = async () => {
    if (!hasEnoughCredits) {
      navigate('/recharge');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // 调用API创建任务
      const response = await taskService.create({
        text: data.text,
        voiceSettings: data.voiceSettings,
        voiceId: data.voiceId,
        templateId: data.templateId,
        isCustomTemplate: data.isCustomTemplate
      });
      
      // 更新积分余额
      updateCredits(user.credits - cost.total);
      
      // 跳转到我的作品页面，并显示新创建的任务
      navigate('/dashboard', { 
        state: { 
          newTaskId: response.taskId,
          message: '任务创建成功，正在生成中...'
        }
      });
    } catch (err) {
      setError(err.message || '创建任务失败，请稍后再试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2 flex items-center">
          <DollarSign className="w-6 h-6 mr-2 text-primary-purple" />
          确认支付
        </h2>
        <p className="text-gray-600">确认费用明细并开始生成视频</p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start space-x-2">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* 费用明细 */}
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6">
        <h3 className="font-bold text-lg mb-4">💰 费用明细</h3>
        
        <div className="space-y-3 text-sm">
          {/* 文本信息 */}
          <div className="flex justify-between">
            <span className="text-gray-600">文本字数</span>
            <span className="font-semibold">{cost.textLength}字</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-600">预计时长</span>
            <span className="font-semibold">{cost.estimatedDuration}秒 (约{cost.minutes}分钟)</span>
          </div>

          <div className="flex justify-between items-start">
            <span className="text-gray-600">智能分段</span>
            <div className="text-right">
              <div className="font-semibold">{segmentInfo.segments}段</div>
              <div className="text-xs text-gray-500">{segmentInfo.description}</div>
            </div>
          </div>

          <div className="border-t border-purple-200 my-3"></div>

          {/* 费用计算 */}
          <div className="flex justify-between">
            <span className="text-gray-600">音频生成</span>
            <span className="font-semibold">{cost.minutes}分钟 × 5积分 = {cost.audioCost}积分</span>
          </div>

          <div className="flex justify-between">
            <span className="text-gray-600">视频生成</span>
            <span className="font-semibold">{cost.minutes}分钟 × 25积分 = {cost.videoCost}积分</span>
          </div>

          {cost.extraCost > 0 && (
            <>
              {data.voiceId && (
                <div className="flex justify-between text-primary-pink">
                  <span>自定义声音</span>
                  <span className="font-semibold">+20积分</span>
                </div>
              )}
              {data.isCustomTemplate && (
                <div className="flex justify-between text-primary-pink">
                  <span>自定义模板</span>
                  <span className="font-semibold">+50积分</span>
                </div>
              )}
            </>
          )}

          <div className="border-t border-purple-200 my-3"></div>

          <div className="flex justify-between text-base">
            <span className="text-gray-600">小计</span>
            <span className="font-bold">{cost.subtotal}积分</span>
          </div>

          {cost.discount > 0 && (
            <div className="flex justify-between text-green-600">
              <span className="flex items-center">
                <Sparkles className="w-4 h-4 mr-1" />
                优惠折扣
              </span>
              <span className="font-semibold">-{cost.discount}积分</span>
            </div>
          )}

          <div className="border-t-2 border-purple-300 my-3"></div>

          <div className="flex justify-between text-xl">
            <span className="font-bold">实付</span>
            <span className="font-bold text-primary-purple">
              {cost.total}积分 (${(cost.total * 0.1).toFixed(1)})
            </span>
          </div>
        </div>
      </div>

      {/* 积分余额 */}
      <div className={`rounded-xl p-4 ${
        hasEnoughCredits 
          ? 'bg-green-50 border border-green-200' 
          : 'bg-red-50 border border-red-200'
      }`}>
        <div className="flex items-center justify-between">
          <div>
            <div className="font-semibold">💎 当前余额</div>
            <div className="text-2xl font-bold text-primary-purple mt-1">
              {user?.credits || 0}积分
            </div>
          </div>
          {hasEnoughCredits ? (
            <div className="text-right">
              <div className="text-sm text-gray-600">支付后余额</div>
              <div className="text-xl font-bold text-green-600">
                {user.credits - cost.total}积分
              </div>
            </div>
          ) : (
            <div className="text-right">
              <div className="text-sm text-red-600">余额不足</div>
              <div className="text-xl font-bold text-red-600">
                还差 {cost.total - user.credits}积分
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 预计生成时间 */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-start space-x-2">
          <Clock className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-800">
            <p className="font-semibold mb-1">⏱️ 预计生成时间</p>
            <p>您的视频预计需要 <strong>8-12分钟</strong> 完成生成</p>
            <p className="mt-1">生成过程可在后台运行，完成后我们会发送通知</p>
          </div>
        </div>
      </div>

      {/* 重要提示 */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
        <p className="text-sm text-yellow-800">
          ⚠️ <strong>重要提示：</strong>
        </p>
        <ul className="mt-2 space-y-1 text-sm text-yellow-700">
          <li>• 点击确认后将立即扣除积分，生成过程不可取消</li>
          <li>• 如生成失败，积分将自动退回账户</li>
          <li>• 生成的视频将保存在"我的作品"中</li>
        </ul>
      </div>

      {/* 导航按钮 */}
      <div className="flex justify-between pt-4">
        <button
          onClick={onPrev}
          className="px-8 py-3 rounded-full bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300 transition-colors"
        >
          ← 返回修改
        </button>
        
        {hasEnoughCredits ? (
          <button
            onClick={handleConfirm}
            disabled={loading}
            className="btn-gradient px-8 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '创建中...' : `确认生成并支付 ${cost.total}积分`}
          </button>
        ) : (
          <button
            onClick={() => navigate('/recharge')}
            className="bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold px-8 py-3 rounded-full shadow-glow hover:shadow-lg transition-all"
          >
            立即充值
          </button>
        )}
      </div>
    </div>
  );
}

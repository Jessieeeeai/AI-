import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../utils/AuthContext';
import { paymentService } from '../services/api';
import { CheckCircle, Loader, XCircle, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function PaymentSuccessPage() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('verifying'); // 'verifying', 'success', 'failed'
  const [credits, setCredits] = useState(0);
  const { updateCredits, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    verifyPayment();
  }, []);

  const verifyPayment = async () => {
    const sessionId = searchParams.get('session_id');

    if (!sessionId) {
      setStatus('failed');
      return;
    }

    try {
      const response = await paymentService.verifyPayment(sessionId);
      
      if (response.paid) {
        setStatus('success');
        setCredits(response.credits);
        
        // 更新用户积分
        if (user) {
          updateCredits(user.credits + response.credits);
        }
        
        // 3秒后自动跳转
        setTimeout(() => {
          navigate('/credits');
        }, 3000);
      } else {
        setStatus('failed');
      }
    } catch (error) {
      console.error('验证支付失败:', error);
      setStatus('failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card p-12 max-w-md w-full text-center"
      >
        {status === 'verifying' && (
          <>
            <Loader className="w-16 h-16 text-primary-purple mx-auto mb-6 animate-spin" />
            <h1 className="text-2xl font-bold mb-2">验证支付中...</h1>
            <p className="text-gray-600">请稍候，正在确认您的支付</p>
          </>
        )}

        {status === 'success' && (
          <>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
            >
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-6" />
            </motion.div>
            
            <h1 className="text-2xl font-bold mb-2 text-green-600">支付成功！</h1>
            <p className="text-gray-600 mb-6">
              恭喜您成功充值 <strong className="text-primary-purple">{credits} 积分</strong>
            </p>

            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 mb-6">
              <div className="text-4xl mb-2">🎉</div>
              <p className="text-sm text-gray-700">
                积分已到账，您现在可以开始创作更多精彩视频了！
              </p>
            </div>

            <button
              onClick={() => navigate('/create')}
              className="btn-gradient w-full py-3 mb-3"
            >
              立即创作 <ArrowRight className="w-4 h-4 inline ml-2" />
            </button>
            
            <button
              onClick={() => navigate('/credits')}
              className="w-full py-3 bg-gray-100 text-gray-700 rounded-full font-semibold hover:bg-gray-200 transition-colors"
            >
              查看积分中心
            </button>

            <p className="text-sm text-gray-500 mt-6">
              3秒后自动跳转到积分中心...
            </p>
          </>
        )}

        {status === 'failed' && (
          <>
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-6" />
            <h1 className="text-2xl font-bold mb-2 text-red-600">支付验证失败</h1>
            <p className="text-gray-600 mb-6">
              很抱歉，我们无法验证您的支付。如果您已完成支付但仍看到此页面，请联系客服。
            </p>

            <button
              onClick={() => navigate('/recharge')}
              className="btn-gradient w-full py-3 mb-3"
            >
              返回充值页面
            </button>
            
            <button
              onClick={() => navigate('/credits')}
              className="w-full py-3 bg-gray-100 text-gray-700 rounded-full font-semibold hover:bg-gray-200 transition-colors"
            >
              查看积分中心
            </button>
          </>
        )}
      </motion.div>
    </div>
  );
}

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../utils/AuthContext';
import { paymentService } from '../services/api';
import { 
  CreditCard, Coins, Zap, Star, Crown, 
  Check, AlertCircle, Sparkles, Bitcoin
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function RechargePage() {
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('stripe'); // 'stripe' or 'crypto'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { user, updateCredits } = useAuth();
  const navigate = useNavigate();

  // 充值套餐
  const packages = [
    {
      id: 'starter',
      name: '入门版',
      price: 20,
      credits: 200,
      bonus: 0,
      icon: Zap,
      color: 'from-blue-500 to-cyan-500',
      features: [
        '200 积分',
        '可生成约6分钟视频',
        '支持所有基础模板',
        '有效期1年'
      ]
    },
    {
      id: 'professional',
      name: '进阶版',
      price: 50,
      credits: 500,
      bonus: 0,
      icon: Star,
      color: 'from-purple-500 to-pink-500',
      popular: true,
      features: [
        '500 积分',
        '可生成约16分钟视频',
        '支持所有模板',
        '有效期1年',
        '优先生成队列'
      ]
    },
    {
      id: 'business',
      name: '专业版',
      price: 100,
      credits: 1050,
      bonus: 50,
      icon: Crown,
      color: 'from-orange-500 to-red-500',
      features: [
        '1000 + 50 赠送积分',
        '可生成约35分钟视频',
        '支持所有高级模板',
        '有效期2年',
        '最高优先级',
        '专属客服支持'
      ]
    },
    {
      id: 'enterprise',
      name: '企业版',
      price: 200,
      credits: 2150,
      bonus: 150,
      icon: Crown,
      color: 'from-yellow-500 to-amber-600',
      features: [
        '2000 + 150 赠送积分',
        '可生成约71分钟视频',
        '无限制模板访问',
        '有效期2年',
        'VIP专属通道',
        '1对1技术支持',
        '定制化服务'
      ]
    }
  ];

  const handleSelectPackage = (pkg) => {
    setSelectedPackage(pkg);
    setError('');
  };

  const handlePayment = async () => {
    if (!selectedPackage) {
      setError('请选择一个充值套餐');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (paymentMethod === 'stripe') {
        // 调用 Stripe Checkout API
        const response = await paymentService.createStripeCheckout(selectedPackage.id);
        
        if (response.url) {
          // 跳转到 Stripe 支付页面
          window.location.href = response.url;
        } else {
          // Stripe 未配置，使用模拟支付
          await new Promise(resolve => setTimeout(resolve, 2000));
          alert(`模拟支付成功！\n套餐：${selectedPackage.name}\n金额：$${selectedPackage.price}\n获得：${selectedPackage.credits}积分`);
          
          // 更新积分
          updateCredits((user?.credits || 0) + selectedPackage.credits);
          navigate('/credits');
        }
        
      } else if (paymentMethod === 'crypto') {
        // 调用加密货币支付 API
        const response = await paymentService.createCryptoPayment(selectedPackage.id);
        alert('加密货币支付功能即将推出！\n' + response.message);
      }
    } catch (err) {
      setError(err.message || '支付失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-16 px-4">
      <div className="max-w-7xl mx-auto">
        {/* 页面标题 */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary-purple to-primary-pink bg-clip-text text-transparent">
            充值中心
          </h1>
          <p className="text-gray-600">选择适合您的套餐，开始创作精彩视频</p>
        </motion.div>

        {/* 当前余额 */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-6 mb-12 text-center bg-gradient-to-br from-purple-50 to-pink-50"
        >
          <div className="flex items-center justify-center space-x-3">
            <Coins className="w-8 h-8 text-primary-purple" />
            <div>
              <div className="text-sm text-gray-600">当前余额</div>
              <div className="text-3xl font-bold text-primary-purple">
                {user?.credits || 0} 积分
              </div>
            </div>
          </div>
        </motion.div>

        {/* 套餐选择 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {packages.map((pkg, index) => {
            const Icon = pkg.icon;
            const isSelected = selectedPackage?.id === pkg.id;
            
            return (
              <motion.div
                key={pkg.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * (index + 1) }}
                onClick={() => handleSelectPackage(pkg)}
                className={`relative glass-card p-6 cursor-pointer transition-all ${
                  isSelected 
                    ? 'ring-4 ring-primary-purple shadow-2xl scale-105' 
                    : 'hover:shadow-xl hover:scale-102'
                }`}
              >
                {/* 热门标签 */}
                {pkg.popular && (
                  <div className="absolute -top-3 -right-3 bg-gradient-to-r from-primary-purple to-primary-pink text-white px-4 py-1 rounded-full text-sm font-bold shadow-lg">
                    🔥 最热门
                  </div>
                )}

                {/* 选中标识 */}
                {isSelected && (
                  <div className="absolute top-4 right-4">
                    <div className="w-6 h-6 bg-primary-purple rounded-full flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  </div>
                )}

                {/* 图标 */}
                <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${pkg.color} flex items-center justify-center mb-4 mx-auto`}>
                  <Icon className="w-8 h-8 text-white" />
                </div>

                {/* 套餐名称 */}
                <h3 className="text-xl font-bold text-center mb-2">{pkg.name}</h3>

                {/* 价格 */}
                <div className="text-center mb-4">
                  <div className="text-4xl font-bold text-primary-purple">
                    ${pkg.price}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    {pkg.credits} 积分
                    {pkg.bonus > 0 && (
                      <span className="text-primary-pink font-semibold">
                        {' '}+{pkg.bonus} 赠送
                      </span>
                    )}
                  </div>
                </div>

                {/* 特性列表 */}
                <ul className="space-y-2">
                  {pkg.features.map((feature, i) => (
                    <li key={i} className="flex items-start text-sm text-gray-700">
                      <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            );
          })}
        </div>

        {/* 支付方式选择 */}
        {selectedPackage && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-8 mb-8"
          >
            <h2 className="text-2xl font-bold mb-6 flex items-center">
              <CreditCard className="w-6 h-6 mr-2 text-primary-purple" />
              选择支付方式
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {/* Stripe 支付 */}
              <div
                onClick={() => setPaymentMethod('stripe')}
                className={`p-6 border-2 rounded-xl cursor-pointer transition-all ${
                  paymentMethod === 'stripe'
                    ? 'border-primary-purple bg-purple-50'
                    : 'border-gray-200 hover:border-primary-purple'
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <CreditCard className="w-6 h-6 text-primary-purple" />
                    <div>
                      <h3 className="font-bold">信用卡 / 借记卡</h3>
                      <p className="text-sm text-gray-600">Visa, Mastercard, AMEX</p>
                    </div>
                  </div>
                  {paymentMethod === 'stripe' && (
                    <Check className="w-6 h-6 text-primary-purple" />
                  )}
                </div>
                <div className="text-xs text-gray-500">
                  由 Stripe 提供安全支付保障
                </div>
              </div>

              {/* 加密货币支付 */}
              <div
                onClick={() => setPaymentMethod('crypto')}
                className={`p-6 border-2 rounded-xl cursor-pointer transition-all ${
                  paymentMethod === 'crypto'
                    ? 'border-primary-purple bg-purple-50'
                    : 'border-gray-200 hover:border-primary-purple'
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <Bitcoin className="w-6 h-6 text-orange-500" />
                    <div>
                      <h3 className="font-bold">加密货币</h3>
                      <p className="text-sm text-gray-600">BTC, ETH, USDT</p>
                    </div>
                  </div>
                  {paymentMethod === 'crypto' && (
                    <Check className="w-6 h-6 text-primary-purple" />
                  )}
                </div>
                <div className="text-xs text-gray-500">
                  匿名安全，无需银行账户
                </div>
              </div>
            </div>

            {/* 订单摘要 */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 mb-6">
              <h3 className="font-bold text-lg mb-4">订单摘要</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">套餐</span>
                  <span className="font-semibold">{selectedPackage.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">基础积分</span>
                  <span className="font-semibold">{selectedPackage.credits - selectedPackage.bonus} 积分</span>
                </div>
                {selectedPackage.bonus > 0 && (
                  <div className="flex justify-between text-primary-pink">
                    <span className="flex items-center">
                      <Sparkles className="w-4 h-4 mr-1" />
                      赠送积分
                    </span>
                    <span className="font-semibold">+{selectedPackage.bonus} 积分</span>
                  </div>
                )}
                <div className="border-t border-purple-200 my-2"></div>
                <div className="flex justify-between text-lg">
                  <span className="font-bold">总计</span>
                  <span className="font-bold text-primary-purple">
                    ${selectedPackage.price}
                  </span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>将获得</span>
                  <span className="font-semibold text-primary-purple">
                    {selectedPackage.credits} 积分
                  </span>
                </div>
              </div>
            </div>

            {/* 错误提示 */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start space-x-2">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* 支付按钮 */}
            <button
              onClick={handlePayment}
              disabled={loading}
              className="w-full btn-gradient py-4 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '处理中...' : `确认支付 $${selectedPackage.price}`}
            </button>

            {/* 安全提示 */}
            <div className="mt-4 text-center text-sm text-gray-500">
              <p>🔒 所有支付均通过加密通道处理，您的信息安全无忧</p>
            </div>
          </motion.div>
        )}

        {/* 常见问题 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass-card p-8"
        >
          <h2 className="text-2xl font-bold mb-6">💡 常见问题</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">📌 积分有效期是多久？</h3>
              <p className="text-sm text-gray-600">
                入门版和进阶版有效期1年，专业版和企业版有效期2年。
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">📌 可以退款吗？</h3>
              <p className="text-sm text-gray-600">
                充值后的积分不支持退款，但如果视频生成失败，消费的积分会自动退回。
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">📌 支持哪些支付方式？</h3>
              <p className="text-sm text-gray-600">
                我们支持信用卡/借记卡（通过Stripe）和加密货币支付（BTC、ETH、USDT等）。
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">📌 发票和收据</h3>
              <p className="text-sm text-gray-600">
                支付成功后，系统会自动发送电子收据到您的注册邮箱。如需发票，请联系客服。
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

import { Link } from 'react-router-dom';
import { Sparkles, Mic, Video, Zap, Check, ArrowRight, Play } from 'lucide-react';
import { motion } from 'framer-motion';

export default function HomePage() {
  const features = [
    { icon: Mic, title: '智能配音', desc: '支持情绪调节和声音克隆' },
    { icon: Video, title: '真人对口型', desc: '自然流畅的口型同步' },
    { icon: Zap, title: '极速生成', desc: '8-12分钟完成专业视频' }
  ];

  const useCases = [
    { title: '自媒体创作', desc: '快速制作口播视频内容' },
    { title: '产品介绍', desc: '生成专业的产品讲解视频' },
    { title: '知识科普', desc: '制作教育类视频课程' },
    { title: '企业宣传', desc: '创建商务演示视频' }
  ];

  const pricingPlans = [
    { amount: 20, credits: 200, popular: false },
    { amount: 50, credits: 500, popular: false },
    { amount: 100, credits: 1050, bonus: 50, popular: true },
    { amount: 200, credits: 2150, bonus: 150, popular: false }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Hero Section */}
      <section className="text-center mb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <div className="inline-block px-4 py-2 bg-purple-100 rounded-full mb-6">
            <span className="text-primary-purple font-semibold text-sm">🎉 新人福利：注册送20积分</span>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
            让你的文字变成<br />
            <span className="bg-gradient-button bg-clip-text text-transparent">
              专业的口播视频
            </span>
          </h1>
          
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            AI驱动，定制声音+形象
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link to="/register" className="btn-gradient px-8 py-4 text-lg">
              <Sparkles className="inline-block w-5 h-5 mr-2" />
              免费试用
            </Link>
            <button className="px-8 py-4 text-lg rounded-full glass-card hover:shadow-md transition-all font-semibold text-primary-purple">
              <Play className="inline-block w-5 h-5 mr-2" />
              观看演示
            </button>
          </div>
        </motion.div>

        {/* 3D装饰或视频预览 */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mt-12 glass-card p-8 max-w-4xl mx-auto"
        >
          <div className="aspect-video bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl flex items-center justify-center">
            <div className="text-center">
              <Play className="w-16 h-16 text-primary-purple mx-auto mb-4" />
              <p className="text-gray-600">视频演示即将上线</p>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="mb-20">
        <h2 className="text-3xl font-bold text-center mb-12">核心功能</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="glass-card p-8 text-center hover:shadow-lg transition-shadow"
              >
                <div className="w-16 h-16 bg-gradient-button rounded-full flex items-center justify-center mx-auto mb-4">
                  <Icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Use Cases */}
      <section className="mb-20">
        <h2 className="text-3xl font-bold text-center mb-4">适用场景</h2>
        <p className="text-gray-600 text-center mb-12">满足多种专业需求</p>
        <div className="grid md:grid-cols-4 gap-6">
          {useCases.map((useCase, index) => (
            <div key={index} className="glass-card p-6 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <Check className="w-6 h-6 text-primary-purple" />
              </div>
              <h3 className="font-bold mb-2">{useCase.title}</h3>
              <p className="text-sm text-gray-600">{useCase.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="mb-20">
        <h2 className="text-3xl font-bold text-center mb-4">透明定价</h2>
        <p className="text-gray-600 text-center mb-12">
          1分钟视频 = 30积分 = $3 | 1积分 = $0.1
        </p>
        <div className="grid md:grid-cols-4 gap-6">
          {pricingPlans.map((plan, index) => (
            <div
              key={index}
              className={`glass-card p-6 text-center relative ${
                plan.popular ? 'ring-2 ring-primary-purple shadow-glow' : ''
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gradient-button text-white px-4 py-1 rounded-full text-sm font-semibold">
                    🔥 最划算
                  </span>
                </div>
              )}
              <div className="text-3xl font-bold mb-2">${plan.amount}</div>
              <div className="text-primary-purple font-bold text-2xl mb-2">
                {plan.credits}积分
              </div>
              {plan.bonus && (
                <div className="text-sm text-green-600 font-semibold mb-4">
                  +{plan.bonus}积分赠送
                </div>
              )}
              <Link
                to="/recharge"
                className="block w-full py-2 px-4 rounded-full bg-purple-100 text-primary-purple font-semibold hover:bg-purple-200 transition-colors"
              >
                选择套餐
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="glass-card p-12 text-center">
        <h2 className="text-3xl font-bold mb-4">准备好开始了吗？</h2>
        <p className="text-gray-600 mb-8">
          注册即送20积分，免费生成1分钟专业口播视频
        </p>
        <Link to="/register" className="btn-gradient px-8 py-4 text-lg inline-block">
          立即开始
          <ArrowRight className="inline-block w-5 h-5 ml-2" />
        </Link>
      </section>
    </div>
  );
}

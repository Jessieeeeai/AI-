import { Link } from 'react-router-dom';
import { Sparkles, Mic, Video, Zap, Check, ArrowRight, Play, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../utils/AuthContext';
import { useState, useRef, useEffect } from 'react';

export default function HomePage() {
      const { isAuthenticated } = useAuth();
      const [showCreateMenu, setShowCreateMenu] = useState(false);
      const menuRef = useRef(null);

      // 点击外部关闭菜单
      useEffect(() => {
              const handleClickOutside = (event) => {
                        if (menuRef.current && !menuRef.current.contains(event.target)) {
                                    setShowCreateMenu(false);
                        }
              };
              document.addEventListener('mousedown', handleClickOutside);
              return () => document.removeEventListener('mousedown', handleClickOutside);
      }, []);

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
                                                  <span className="text-primary-purple font-semibold text-sm">🎉 新人福利：注册送20积分</span>span>
                                      </div>div>
                                      <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
                                                  让你的文字变成<br />
                                                  <span className="bg-gradient-button bg-clip-text text-transparent">
                                                                专业的口播视频
                                                  </span>span>
                                      </h1>h1>
                                      <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
                                                  AI驱动，定制声音+形象
                                      </p>p>
                                      <div className="flex flex-col sm:flex-row justify-center gap-4">
                                          {isAuthenticated ? (
                                                          <div className="relative" ref={menuRef}>
                                                                          <button
                                                                                                onClick={() => setShowCreateMenu(!showCreateMenu)}
                                                                                                className="btn-gradient px-8 py-4 text-lg flex items-center gap-2"
                                                                                              >
                                                                                            <Sparkles className="w-5 h-5" />
                                                                                            AI创作
                                                                                            <ChevronDown className={`w-4 h-4 transition-transform ${showCreateMenu ? 'rotate-180' : ''}`} />
                                                                          </button>button>
                                                                          <AnimatePresence>
                                                                              {showCreateMenu && (
                                                                                  <motion.div
                                                                                                            initial={{ opacity: 0, y: -10 }}
                                                                                                            animate={{ opacity: 1, y: 0 }}
                                                                                                            exit={{ opacity: 0, y: -10 }}
                                                                                                            className="absolute top-full left-0 mt-2 w-56 glass-card rounded-xl shadow-lg overflow-hidden z-50"
                                                                                                          >
                                                                                                        <Link
                                                                                                                                    to="/create-wizard"
                                                                                                                                    className="flex items-center gap-3 px-4 py-3 hover:bg-purple-50 transition-colors"
                                                                                                                                    onClick={() => setShowCreateMenu(false)}
                                                                                                                                  >
                                                                                                                                <Sparkles className="w-5 h-5 text-primary-purple" />
                                                                                                                                <div className="text-left">
                                                                                                                                                          <div className="font-semibold text-gray-800">引导式创作</div>div>
                                                                                                                                                          <div className="text-xs text-gray-500">适合新手，一步步引导</div>div>
                                                                                                                                    </div>div>
                                                                                                            </Link>Link>
                                                                                                        <Link
                                                                                                                                    to="/create"
                                                                                                                                    className="flex items-center gap-3 px-4 py-3 hover:bg-purple-50 transition-colors"
                                                                                                                                    onClick={() => setShowCreateMenu(false)}
                                                                                                                                  >
                                                                                                                                <Zap className="w-5 h-5 text-primary-purple" />
                                                                                                                                <div className="text-left">
                                                                                                                                                          <div className="font-semibold text-gray-800">快速创作</div>div>
                                                                                                                                                          <div className="text-xs text-gray-500">熟练用户，直接开始</div>div>
                                                                                                                                    </div>div>
                                                                                                            </Link>Link>
                                                                                      </motion.div>motion.div>
                                                                                )}
                                                                          </AnimatePresence>AnimatePresence>
                                                          </div>div>
                                                        ) : (
                                                          <Link to="/register" className="btn-gradient px-8 py-4 text-lg">
                                                                          <Sparkles className="inline-block w-5 h-5 mr-2" />
                                                                          免费试用
                                                          </Link>Link>
                                                  )}
                                                  <button className="px-8 py-4 text-lg rounded-full glass-card hover:shadow-md transition-all font-semibold text-primary-purple">
                                                                <Play className="inline-block w-5 h-5 mr-2" />
                                                                观看演示
                                                  </button>button>
                                      </div>div>
                            </motion.div>motion.div>
                            
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
                                                                <p className="text-gray-600">视频演示即将上线</p>p>
                                                  </div>div>
                                      </div>div>
                            </motion.div>motion.div>
                    </section>section>
                    
                  {/* Features Section */}
                    <section className="mb-20">
                            <h2 className="text-3xl font-bold text-center mb-12">核心功能</h2>h2>
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
                                                                </div>div>
                                                                <h3 className="text-xl font-bold mb-2">{feature.title}</h3>h3>
                                                                <p className="text-gray-600">{feature.desc}</p>p>
                                                </motion.div>motion.div>
                                              );
              })}
                            </div>div>
                    </section>section>
                    
                  {/* Use Cases */}
                    <section className="mb-20">
                            <h2 className="text-3xl font-bold text-center mb-4">适用场景</h2>h2>
                            <p className="text-gray-600 text-center mb-12">满足多种专业需求</p>p>
                            <div className="grid md:grid-cols-4 gap-6">
                                {useCases.map((useCase, index) => (
                              <div key={index} className="glass-card p-6 hover:shadow-md transition-shadow">
                                            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                                                            <Check className="w-6 h-6 text-primary-purple" />
                                            </div>div>
                                            <h3 className="font-bold mb-2">{useCase.title}</h3>h3>
                                            <p className="text-sm text-gray-600">{useCase.desc}</p>p>
                              </div>div>
                            ))}
                            </div>div>
                    </section>section>
                    
                  {/* Pricing */}
                    <section className="mb-20">
                            <h2 className="text-3xl font-bold text-center mb-4">透明定价</h2>h2>
                            <p className="text-gray-600 text-center mb-12">
                                      1分钟视频 = 30积分 = $3 | 1积分 = $0.1
                            </p>p>
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
                                                                                        </span>span>
                                                                  </div>div>
                                            )}
                                            <div className="text-3xl font-bold mb-2">${plan.amount}</div>div>
                                            <div className="text-primary-purple font-bold text-2xl mb-2">
                                                {plan.credits}积分
                                            </div>div>
                                  {plan.bonus && (
                                                                  <div className="text-sm text-green-600 font-semibold mb-4">
                                                                                    +{plan.bonus}积分赠送
                                                                  </div>div>
                                            )}
                                            <Link
                                                                to="/recharge"
                                                                className="block w-full py-2 px-4 rounded-full bg-purple-100 text-primary-purple font-semibold hover:bg-purple-200 transition-colors"
                                                              >
                                                            选择套餐
                                            </Link>Link>
                              </div>div>
                            ))}
                            </div>div>
                    </section>section>
                    
                  {/* CTA Section */}
                    <section className="glass-card p-12 text-center">
                            <h2 className="text-3xl font-bold mb-4">准备好开始了吗？</h2>h2>
                            <p className="text-gray-600 mb-8">
                                      注册即送20积分，免费生成1分钟专业口播视频
                            </p>p>
                        {isAuthenticated ? (
                            <div className="inline-flex gap-4">
                                        <Link to="/create-wizard" className="btn-gradient px-8 py-4 text-lg inline-flex items-center gap-2">
                                                      引导式创作 <ArrowRight className="w-5 h-5" />
                                        </Link>Link>
                                        <Link to="/create" className="px-8 py-4 text-lg rounded-full glass-card hover:shadow-md transition-all font-semibold text-primary-purple inline-flex items-center gap-2">
                                                      快速创作 <ArrowRight className="w-5 h-5" />
                                        </Link>Link>
                            </div>div>
                          ) : (
                            <Link to="/register" className="btn-gradient px-8 py-4 text-lg inline-block">
                                        立即开始 <ArrowRight className="inline-block w-5 h-5 ml-2" />
                            </Link>Link>
                            )}
                    </section>section>
              </div>div>
            );
}</div>

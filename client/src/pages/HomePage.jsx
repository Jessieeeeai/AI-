import { Link } from 'react-router-dom';
import { Sparkles, Mic, Video, Zap, Check, ArrowRight, Play, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../utils/AuthContext';
import { useState, useRef, useEffect } from 'react';

export default function HomePage() {
            const { isAuthenticated } = useAuth();
            const [showCreateMenu, setShowCreateMenu] = useState(false);
            const menuRef = useRef(null);

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
                                <section className="text-center mb-20">
                                        <motion.div
                                                            initial={{ opacity: 0, y: 20 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            transition={{ duration: 0.6 }}
                                                          >
                                                  <h1 className="text-4xl md:text-5xl font-bold mb-6">
                                                              <span className="bg-gradient-to-r from-primary-purple to-purple-400 bg-clip-text text-transparent">
                                                                            AI驱动的
                                                              </span>
                                                              <br />
                                                              专业口播视频生成平台
                                                  </h1>
                                                  <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
                                                              输入文字，选择形象，一键生成专业口播视频。支持真人对口型、智能配音、多语言翻译。
                                                  </p>
                                                  
                                                  <div className="relative inline-block" ref={menuRef}>
                                                              <button
                                                                                      onClick={() => setShowCreateMenu(!showCreateMenu)}
                                                                                      className="btn-gradient px-8 py-4 text-lg inline-flex items-center gap-2"
                                                                                    >
                                                                            开始创作
                                                                            <ChevronDown className={`w-5 h-5 transition-transform ${showCreateMenu ? 'rotate-180' : ''}`} />
                                                              </button>
                                                              
                                                              <AnimatePresence>
                                                                        {showCreateMenu && (
                                                                                    <motion.div
                                                                                                                initial={{ opacity: 0, y: 10 }}
                                                                                                                animate={{ opacity: 1, y: 0 }}
                                                                                                                exit={{ opacity: 0, y: 10 }}
                                                                                                                className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-50"
                                                                                                              >
                                                                                                      <Link
                                                                                                                                    to="/create-wizard"
                                                                                                                                    className="block px-6 py-4 hover:bg-purple-50 transition-colors border-b border-gray-100"
                                                                                                                                    onClick={() => setShowCreateMenu(false)}
                                                                                                                                  >
                                                                                                                          <div className="flex items-center gap-3">
                                                                                                                                                <Sparkles className="w-5 h-5 text-primary-purple" />
                                                                                                                                                <div className="text-left">
                                                                                                                                                                        <div className="font-semibold text-gray-900">引导式创作</div>
                                                                                                                                                                        <div className="text-sm text-gray-500">一步步完成视频创建</div>
                                                                                                                                                          </div>
                                                                                                                                    </div>
                                                                                                                </Link>
                                                                                                      <Link
                                                                                                                                    to="/create"
                                                                                                                                    className="block px-6 py-4 hover:bg-purple-50 transition-colors"
                                                                                                                                    onClick={() => setShowCreateMenu(false)}
                                                                                                                                  >
                                                                                                                          <div className="flex items-center gap-3">
                                                                                                                                                <Zap className="w-5 h-5 text-primary-purple" />
                                                                                                                                                <div className="text-left">
                                                                                                                                                                        <div className="font-semibold text-gray-900">快速创建</div>
                                                                                                                                                                        <div className="text-sm text-gray-500">直接进入创作界面</div>
                                                                                                                                                          </div>
                                                                                                                                    </div>
                                                                                                                </Link>
                                                                                              </motion.div>
                                                                                  )}
                                                              </AnimatePresence>
                                                  </div>
                                        </motion.div>
                                </section>
                          
                                <section className="mb-20">
                                        <h2 className="text-3xl font-bold text-center mb-12">核心功能</h2>
                                        <div className="grid md:grid-cols-3 gap-8">
                                                  {features.map((feature, index) => (
                                                <motion.div
                                                                        key={index}
                                                                        initial={{ opacity: 0, y: 20 }}
                                                                        animate={{ opacity: 1, y: 0 }}
                                                                        transition={{ delay: index * 0.1 }}
                                                                        className="glass-card p-6 hover:shadow-md transition-shadow"
                                                                      >
                                                              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                                                                              <feature.icon className="w-6 h-6 text-primary-purple" />
                                                              </div>
                                                              <h3 className="font-bold mb-2">{feature.title}</h3>
                                                              <p className="text-sm text-gray-600">{feature.desc}</p>
                                                </motion.div>
                                              ))}
                                        </div>
                                </section>
                          
                                <section className="mb-20">
                                        <h2 className="text-3xl font-bold text-center mb-12">应用场景</h2>
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
                          
                                <section className="mb-20">
                                        <h2 className="text-3xl font-bold text-center mb-4">透明定价</h2>
                                        <p className="text-gray-600 text-center mb-12">1分钟视频 = 30积分 = $3 | 1积分 = $0.1</p>
                                        <div className="grid md:grid-cols-4 gap-6">
                                                  {pricingPlans.map((plan, index) => (
                                                <div key={index} className={`glass-card p-6 text-center relative ${plan.popular ? 'ring-2 ring-primary-purple shadow-glow' : ''}`}>
                                                          {plan.popular && (
                                                                          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                                                                                            <span className="bg-gradient-button text-white px-4 py-1 rounded-full text-sm font-semibold">🔥 最划算</span>
                                                                          </div>
                                                              )}
                                                              <div className="text-3xl font-bold mb-2">${plan.amount}</div>
                                                              <div className="text-primary-purple font-bold text-2xl mb-2">{plan.credits}积分</div>
                                                          {plan.bonus && <div className="text-sm text-green-600 font-semibold mb-4">+{plan.bonus}积分赠送</div>}
                                                              <Link to="/recharge" className="block w-full py-2 px-4 rounded-full bg-purple-100 text-primary-purple font-semibold hover:bg-purple-200 transition-colors">选择</Link>
                                                </div>
                                              ))}
                                        </div>
                                </section>
                          
                                <section className="glass-card p-12 text-center">
                                        <h2 className="text-3xl font-bold mb-4">准备好开始了吗?</h2>
                                        <p className="text-gray-600 mb-8">注册即送20积分，免费生成1分钟专业口播视频</p>
                                          {isAuthenticated ? (
                                              <div className="inline-flex gap-4">
                                                          <Link to="/create-wizard" className="btn-gradient px-8 py-4 text-lg inline-flex items-center gap-2">引导式创作<ArrowRight className="w-5 h-5" /></Link>
                                                          <Link to="/create" className="px-8 py-4 text-lg rounded-full glass-card hover:shadow-md transition-all font-semibold text-primary-purple inline-flex items-center gap-2">快速创建<ArrowRight className="w-5 h-5" /></Link>
                                              </div>
                                            ) : (
                                              <Link to="/register" className="btn-gradient px-8 py-4 text-lg inline-block">立即开始<ArrowRight className="inline-block w-5 h-5 ml-2" /></Link>
                                        )}
                                </section>
                          </div>
                        );
}</div>

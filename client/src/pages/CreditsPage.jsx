import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../utils/AuthContext';
import { authService } from '../services/api';
import { 
  Coins, TrendingUp, Award, Users, 
  ArrowUp, ArrowDown, Clock, CheckCircle
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function CreditsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [userStats, setUserStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserStats();
  }, []);

  const fetchUserStats = async () => {
    try {
      setLoading(true);
      const response = await authService.getProfile();
      setUserStats(response.stats);
    } catch (error) {
      console.error('获取用户统计失败:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-24 pb-16 px-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-purple mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  const stats = userStats || {
    credits: user?.credits || 0,
    totalSpent: 0,
    level: 1,
    tasksCount: 0,
    totalDuration: 0,
    ranking: 0
  };

  // 计算当前等级进度
  const currentLevelSpent = stats.totalSpent % 100;
  const levelProgress = (currentLevelSpent / 100) * 100;
  const nextLevelRemaining = 100 - currentLevelSpent;

  return (
    <div className="min-h-screen pt-24 pb-16 px-4">
      <div className="max-w-6xl mx-auto">
        {/* 页面标题 */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary-purple to-primary-pink bg-clip-text text-transparent">
            积分中心
          </h1>
          <p className="text-gray-600">查看您的积分、等级和消费统计</p>
        </motion.div>

        {/* 主要统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {/* 积分余额卡片 */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="glass-card p-8 bg-gradient-to-br from-purple-50 to-pink-50"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800">💎 当前余额</h2>
              <Coins className="w-8 h-8 text-primary-purple" />
            </div>
            <div className="text-5xl font-bold text-primary-purple mb-2">
              {stats.credits}
            </div>
            <div className="text-gray-600 mb-6">积分</div>
            <button
              onClick={() => navigate('/recharge')}
              className="btn-gradient w-full"
            >
              立即充值
            </button>
          </motion.div>

          {/* 用户等级卡片 */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="glass-card p-8 bg-gradient-to-br from-blue-50 to-purple-50"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800">⭐ 用户等级</h2>
              <Award className="w-8 h-8 text-blue-600" />
            </div>
            <div className="flex items-baseline mb-2">
              <div className="text-5xl font-bold text-blue-600">
                Lv.{stats.level}
              </div>
              <div className="ml-4 text-gray-600">
                总消费 {stats.totalSpent} 积分
              </div>
            </div>
            
            {/* 等级进度条 */}
            <div className="mt-6">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Lv.{stats.level}</span>
                <span>Lv.{stats.level + 1}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-purple-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${levelProgress}%` }}
                />
              </div>
              <p className="text-sm text-gray-600 mt-2">
                再消费 {nextLevelRemaining} 积分升级到 Lv.{stats.level + 1}
              </p>
            </div>
          </motion.div>
        </div>

        {/* 详细统计 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-card p-6"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="text-3xl">🎬</div>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <div className="text-2xl font-bold text-gray-800">
              {stats.tasksCount}
            </div>
            <div className="text-sm text-gray-600">完成作品数</div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="glass-card p-6"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="text-3xl">⏱️</div>
              <Clock className="w-5 h-5 text-blue-500" />
            </div>
            <div className="text-2xl font-bold text-gray-800">
              {Math.ceil(stats.totalDuration / 60)}
            </div>
            <div className="text-sm text-gray-600">总时长(分钟)</div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="glass-card p-6"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="text-3xl">💰</div>
              <ArrowDown className="w-5 h-5 text-red-500" />
            </div>
            <div className="text-2xl font-bold text-gray-800">
              {stats.totalSpent}
            </div>
            <div className="text-sm text-gray-600">累计消费</div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="glass-card p-6"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="text-3xl">🏆</div>
              <Users className="w-5 h-5 text-primary-purple" />
            </div>
            <div className="text-2xl font-bold text-gray-800">
              {stats.ranking}%
            </div>
            <div className="text-sm text-gray-600">超越用户</div>
          </motion.div>
        </div>

        {/* 消费趋势图（占位） */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="glass-card p-8 mb-8"
        >
          <h2 className="text-xl font-bold mb-6 flex items-center">
            <TrendingUp className="w-6 h-6 mr-2 text-primary-purple" />
            消费趋势
          </h2>
          <div className="h-64 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl flex items-center justify-center">
            <div className="text-center text-gray-500">
              <div className="text-6xl mb-4">📊</div>
              <p>消费趋势图表（即将推出）</p>
            </div>
          </div>
        </motion.div>

        {/* 交易历史 */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="glass-card p-8"
        >
          <h2 className="text-xl font-bold mb-6 flex items-center">
            <CheckCircle className="w-6 h-6 mr-2 text-primary-purple" />
            交易记录
          </h2>
          
          {/* 交易记录占位 */}
          <div className="space-y-4">
            <TransactionPlaceholder 
              type="recharge"
              amount={200}
              credits={200}
              date="2024-01-15 14:30"
            />
            <TransactionPlaceholder 
              type="deduction"
              amount={-50}
              credits={50}
              date="2024-01-15 15:20"
              description="视频生成 - 任务 #12345"
            />
            <TransactionPlaceholder 
              type="recharge"
              amount={100}
              credits={100}
              date="2024-01-10 10:15"
            />
          </div>

          <div className="text-center mt-6">
            <p className="text-sm text-gray-500">
              完整交易记录功能即将推出
            </p>
          </div>
        </motion.div>

        {/* 升级福利说明 */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="glass-card p-8 mt-8 bg-gradient-to-br from-yellow-50 to-orange-50"
        >
          <h2 className="text-xl font-bold mb-4 flex items-center">
            <Award className="w-6 h-6 mr-2 text-orange-600" />
            等级福利
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg p-4">
              <div className="text-2xl font-bold text-blue-600 mb-2">Lv.1-10</div>
              <div className="text-sm text-gray-600">
                • 基础服务<br/>
                • 标准生成速度<br/>
                • 基础模板访问
              </div>
            </div>
            <div className="bg-white rounded-lg p-4">
              <div className="text-2xl font-bold text-purple-600 mb-2">Lv.11-30</div>
              <div className="text-sm text-gray-600">
                • 9折优惠<br/>
                • 优先队列<br/>
                • 高级模板访问
              </div>
            </div>
            <div className="bg-white rounded-lg p-4">
              <div className="text-2xl font-bold text-orange-600 mb-2">Lv.31+</div>
              <div className="text-sm text-gray-600">
                • 8折优惠<br/>
                • VIP专属客服<br/>
                • 全模板无限制
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// 交易记录占位组件
function TransactionPlaceholder({ type, amount, credits, date, description }) {
  const isPositive = amount > 0;
  
  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
      <div className="flex items-center space-x-4">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
          isPositive ? 'bg-green-100' : 'bg-red-100'
        }`}>
          {isPositive ? (
            <ArrowUp className="w-5 h-5 text-green-600" />
          ) : (
            <ArrowDown className="w-5 h-5 text-red-600" />
          )}
        </div>
        <div>
          <div className="font-semibold text-gray-800">
            {type === 'recharge' ? '充值' : '消费'}
          </div>
          {description && (
            <div className="text-sm text-gray-600">{description}</div>
          )}
          <div className="text-xs text-gray-500">{date}</div>
        </div>
      </div>
      <div className="text-right">
        <div className={`text-lg font-bold ${
          isPositive ? 'text-green-600' : 'text-red-600'
        }`}>
          {isPositive ? '+' : ''}{amount} 积分
        </div>
        <div className="text-xs text-gray-500">
          ${(credits * 0.1).toFixed(1)}
        </div>
      </div>
    </div>
  );
}

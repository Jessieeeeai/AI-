import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../utils/AuthContext';
import { adminService } from '../services/api';
import { 
  Users, Video, DollarSign, TrendingUp, 
  Settings, Award, AlertCircle, CheckCircle,
  BarChart3, Calendar, Clock
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function AdminPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 检查管理员权限
    if (!user || !user.isAdmin) {
      alert('需要管理员权限');
      navigate('/');
      return;
    }

    fetchStats();
  }, [user, navigate]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await adminService.getStats();
      
      // 转换API响应为组件所需格式
      const apiStats = response.stats;
      setStats({
        totalUsers: apiStats.users.total,
        activeUsers: apiStats.users.active,
        totalTasks: apiStats.tasks.total,
        completedTasks: apiStats.tasks.completed,
        totalRevenue: apiStats.revenue.total,
        todayRevenue: apiStats.revenue.today,
        averageCredits: apiStats.credits.average,
        conversionRate: apiStats.conversionRate
      });
    } catch (error) {
      console.error('获取统计失败:', error);
      // 如果API失败，使用默认值
      setStats({
        totalUsers: 0,
        activeUsers: 0,
        totalTasks: 0,
        completedTasks: 0,
        totalRevenue: 0,
        todayRevenue: 0,
        averageCredits: 0,
        conversionRate: 0
      });
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

  return (
    <div className="min-h-screen pt-24 pb-16 px-4">
      <div className="max-w-7xl mx-auto">
        {/* 页面标题 */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary-purple to-primary-pink bg-clip-text text-transparent">
            管理后台
          </h1>
          <p className="text-gray-600">系统数据统计与管理</p>
        </motion.div>

        {/* 标签导航 */}
        <div className="mb-8 flex space-x-2 overflow-x-auto">
          {[
            { id: 'overview', label: '概览', icon: BarChart3 },
            { id: 'users', label: '用户管理', icon: Users },
            { id: 'tasks', label: '任务管理', icon: Video },
            { id: 'promotions', label: '活动管理', icon: Award },
            { id: 'settings', label: '系统设置', icon: Settings }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-6 py-3 rounded-lg font-semibold transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-primary-purple to-primary-pink text-white shadow-lg'
                    : 'bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* 内容区域 */}
        {activeTab === 'overview' && <OverviewTab stats={stats} />}
        {activeTab === 'users' && <UsersTab />}
        {activeTab === 'tasks' && <TasksTab />}
        {activeTab === 'promotions' && <PromotionsTab />}
        {activeTab === 'settings' && <SettingsTab />}
      </div>
    </div>
  );
}

// 概览标签
function OverviewTab({ stats }) {
  return (
    <div className="space-y-8">
      {/* 核心指标 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <TrendingUp className="w-5 h-5 text-green-500" />
          </div>
          <div className="text-3xl font-bold text-gray-800 mb-1">
            {stats?.totalUsers || 0}
          </div>
          <div className="text-sm text-gray-600">总用户数</div>
          <div className="text-xs text-green-600 mt-2">
            活跃: {stats?.activeUsers || 0}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
              <Video className="w-6 h-6 text-primary-purple" />
            </div>
            <TrendingUp className="w-5 h-5 text-green-500" />
          </div>
          <div className="text-3xl font-bold text-gray-800 mb-1">
            {stats?.totalTasks || 0}
          </div>
          <div className="text-sm text-gray-600">总任务数</div>
          <div className="text-xs text-green-600 mt-2">
            完成: {stats?.completedTasks || 0}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="glass-card p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <TrendingUp className="w-5 h-5 text-green-500" />
          </div>
          <div className="text-3xl font-bold text-gray-800 mb-1">
            ${stats?.totalRevenue || 0}
          </div>
          <div className="text-sm text-gray-600">总收入</div>
          <div className="text-xs text-green-600 mt-2">
            今日: ${stats?.todayRevenue || 0}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="glass-card p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center">
              <Award className="w-6 h-6 text-yellow-600" />
            </div>
            <TrendingUp className="w-5 h-5 text-green-500" />
          </div>
          <div className="text-3xl font-bold text-gray-800 mb-1">
            {stats?.conversionRate || 0}%
          </div>
          <div className="text-sm text-gray-600">转化率</div>
          <div className="text-xs text-gray-500 mt-2">
            平均积分: {stats?.averageCredits || 0}
          </div>
        </motion.div>
      </div>

      {/* 图表区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-6">
          <h3 className="text-xl font-bold mb-4">收入趋势</h3>
          <div className="h-64 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl flex items-center justify-center">
            <div className="text-center text-gray-500">
              <BarChart3 className="w-12 h-12 mx-auto mb-2" />
              <p>图表组件（待集成 Chart.js）</p>
            </div>
          </div>
        </div>

        <div className="glass-card p-6">
          <h3 className="text-xl font-bold mb-4">用户增长</h3>
          <div className="h-64 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl flex items-center justify-center">
            <div className="text-center text-gray-500">
              <TrendingUp className="w-12 h-12 mx-auto mb-2" />
              <p>图表组件（待集成 Chart.js）</p>
            </div>
          </div>
        </div>
      </div>

      {/* 最近活动 */}
      <div className="glass-card p-6">
        <h3 className="text-xl font-bold mb-4">最近活动</h3>
        <div className="space-y-3">
          {[
            { type: 'user', message: '新用户注册: user@example.com', time: '2分钟前' },
            { type: 'task', message: '任务完成: 视频生成 #12345', time: '5分钟前' },
            { type: 'payment', message: '充值成功: $50.00', time: '10分钟前' },
            { type: 'task', message: '任务创建: 视频生成 #12346', time: '15分钟前' }
          ].map((activity, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                {activity.type === 'user' && <Users className="w-5 h-5 text-blue-600" />}
                {activity.type === 'task' && <Video className="w-5 h-5 text-purple-600" />}
                {activity.type === 'payment' && <DollarSign className="w-5 h-5 text-green-600" />}
                <span className="text-sm text-gray-700">{activity.message}</span>
              </div>
              <div className="flex items-center text-xs text-gray-500">
                <Clock className="w-4 h-4 mr-1" />
                {activity.time}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// 用户管理标签
function UsersTab() {
  return (
    <div className="glass-card p-6">
      <h3 className="text-xl font-bold mb-4">用户管理</h3>
      <div className="text-center py-12 text-gray-500">
        <Users className="w-16 h-16 mx-auto mb-4" />
        <p>用户管理功能开发中...</p>
        <p className="text-sm mt-2">将包括：用户列表、搜索、封禁、积分调整等功能</p>
      </div>
    </div>
  );
}

// 任务管理标签
function TasksTab() {
  return (
    <div className="glass-card p-6">
      <h3 className="text-xl font-bold mb-4">任务管理</h3>
      <div className="text-center py-12 text-gray-500">
        <Video className="w-16 h-16 mx-auto mb-4" />
        <p>任务管理功能开发中...</p>
        <p className="text-sm mt-2">将包括：任务列表、状态监控、失败重试等功能</p>
      </div>
    </div>
  );
}

// 活动管理标签
function PromotionsTab() {
  return (
    <div className="glass-card p-6">
      <h3 className="text-xl font-bold mb-4">活动管理</h3>
      <div className="text-center py-12 text-gray-500">
        <Award className="w-16 h-16 mx-auto mb-4" />
        <p>活动管理功能开发中...</p>
        <p className="text-sm mt-2">将包括：创建活动、折扣设置、活动统计等功能</p>
      </div>
    </div>
  );
}

// 系统设置标签
function SettingsTab() {
  return (
    <div className="glass-card p-6">
      <h3 className="text-xl font-bold mb-4">系统设置</h3>
      <div className="text-center py-12 text-gray-500">
        <Settings className="w-16 h-16 mx-auto mb-4" />
        <p>系统设置功能开发中...</p>
        <p className="text-sm mt-2">将包括：网站配置、API密钥、通知设置等功能</p>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../utils/AuthContext';
import { taskService } from '../services/api';
import { 
  Play, Download, Share2, Trash2, Clock, 
  CheckCircle, AlertCircle, Loader, Eye,
  Filter, Search
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function DashboardPage() {
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    fetchTasks();
    
    // 显示新任务创建成功提示
    if (location.state?.message) {
      // 这里可以添加toast通知
      console.log(location.state.message);
    }
  }, [filter]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const statusParam = filter === 'all' ? '' : filter;
      const response = await taskService.getList(statusParam, 50);
      setTasks(response.tasks);
      setStats(response.stats);
    } catch (error) {
      console.error('获取任务列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (taskId) => {
    if (!confirm('确定要删除这个任务吗？如果任务失败，积分将退回账户。')) {
      return;
    }

    try {
      const response = await taskService.delete(taskId);
      if (response.success) {
        // 刷新列表
        fetchTasks();
        // 如果有退款，更新用户积分
        if (response.refunded > 0) {
          alert(`任务已删除，已退回 ${response.refunded} 积分`);
        }
      }
    } catch (error) {
      alert('删除失败：' + (error.message || '请稍后重试'));
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { icon: Clock, text: '等待中', color: 'bg-yellow-100 text-yellow-700' },
      processing: { icon: Loader, text: '生成中', color: 'bg-blue-100 text-blue-700' },
      completed: { icon: CheckCircle, text: '已完成', color: 'bg-green-100 text-green-700' },
      failed: { icon: AlertCircle, text: '失败', color: 'bg-red-100 text-red-700' }
    };

    const badge = badges[status] || badges.pending;
    const Icon = badge.icon;

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${badge.color}`}>
        <Icon className="w-4 h-4 mr-1" />
        {badge.text}
      </span>
    );
  };

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.text.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

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
            我的作品
          </h1>
          <p className="text-gray-600">管理您生成的所有视频</p>
        </motion.div>

        {/* 统计卡片 */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="glass-card p-6 text-center"
            >
              <div className="text-3xl font-bold text-primary-purple mb-2">
                {stats.total}
              </div>
              <div className="text-gray-600">总任务数</div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="glass-card p-6 text-center"
            >
              <div className="text-3xl font-bold text-green-600 mb-2">
                {stats.completed}
              </div>
              <div className="text-gray-600">已完成</div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="glass-card p-6 text-center"
            >
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {stats.processing}
              </div>
              <div className="text-gray-600">生成中</div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
              className="glass-card p-6 text-center"
            >
              <div className="text-3xl font-bold text-primary-pink mb-2">
                {Math.ceil(stats.totalDuration / 60)}
              </div>
              <div className="text-gray-600">总时长(分钟)</div>
            </motion.div>
          </div>
        )}

        {/* 筛选和搜索 */}
        <div className="glass-card p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            {/* 状态筛选 */}
            <div className="flex items-center space-x-2">
              <Filter className="w-5 h-5 text-gray-500" />
              <div className="flex space-x-2">
                {['all', 'pending', 'processing', 'completed', 'failed'].map((status) => (
                  <button
                    key={status}
                    onClick={() => setFilter(status)}
                    className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                      filter === status
                        ? 'bg-gradient-to-r from-primary-purple to-primary-pink text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {status === 'all' ? '全部' : 
                     status === 'pending' ? '等待中' :
                     status === 'processing' ? '生成中' :
                     status === 'completed' ? '已完成' : '失败'}
                  </button>
                ))}
              </div>
            </div>

            {/* 搜索框 */}
            <div className="flex items-center space-x-2 bg-white rounded-lg px-4 py-2 border border-gray-200">
              <Search className="w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="搜索文本内容..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="outline-none text-sm w-full md:w-64"
              />
            </div>
          </div>
        </div>

        {/* 任务列表 */}
        {loading ? (
          <div className="text-center py-20">
            <Loader className="w-12 h-12 animate-spin text-primary-purple mx-auto mb-4" />
            <p className="text-gray-600">加载中...</p>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📹</div>
            <p className="text-xl text-gray-600 mb-4">还没有作品</p>
            <button
              onClick={() => navigate('/create')}
              className="btn-gradient px-8 py-3"
            >
              立即创建
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTasks.map((task, index) => (
              <TaskCard 
                key={task.id} 
                task={task} 
                index={index}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// 任务卡片组件
function TaskCard({ task, index, onDelete }) {
  const getProgressBar = () => {
    if (task.status === 'completed') return 100;
    if (task.status === 'failed') return 100;
    return task.progress || 0;
  };

  const progress = getProgressBar();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="glass-card overflow-hidden group hover:shadow-xl transition-shadow"
    >
      {/* 缩略图或占位图 */}
      <div className="relative aspect-video bg-gradient-to-br from-purple-100 to-pink-100 overflow-hidden">
        {task.thumbnail_url ? (
          <img 
            src={task.thumbnail_url} 
            alt="视频缩略图"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-6xl">
            {task.status === 'completed' ? '🎬' : 
             task.status === 'processing' ? '⚙️' :
             task.status === 'failed' ? '❌' : '⏳'}
          </div>
        )}
        
        {/* 状态标签 */}
        <div className="absolute top-2 right-2">
          {task.status === 'pending' && (
            <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-sm font-semibold">
              <Clock className="w-4 h-4 inline mr-1" />
              等待中
            </span>
          )}
          {task.status === 'processing' && (
            <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold">
              <Loader className="w-4 h-4 inline mr-1 animate-spin" />
              生成中
            </span>
          )}
          {task.status === 'completed' && (
            <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-semibold">
              <CheckCircle className="w-4 h-4 inline mr-1" />
              已完成
            </span>
          )}
          {task.status === 'failed' && (
            <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-sm font-semibold">
              <AlertCircle className="w-4 h-4 inline mr-1" />
              失败
            </span>
          )}
        </div>

        {/* 播放按钮（仅完成的任务） */}
        {task.status === 'completed' && (
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center">
            <Play className="w-16 h-16 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        )}
      </div>

      {/* 进度条 */}
      {(task.status === 'processing' || task.status === 'pending') && (
        <div className="w-full bg-gray-200 h-2">
          <div 
            className="bg-gradient-to-r from-primary-purple to-primary-pink h-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* 内容区 */}
      <div className="p-4">
        {/* 文本内容 */}
        <p className="text-sm text-gray-700 mb-3 line-clamp-2">
          {task.text}
        </p>

        {/* 元数据 */}
        <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
          <span>🕒 {new Date(task.created_at).toLocaleDateString()}</span>
          <span>⏱️ {Math.ceil(task.duration)}秒</span>
        </div>

        {/* 统计数据 */}
        {task.status === 'completed' && (
          <div className="flex items-center justify-between text-xs text-gray-500 mb-3 pb-3 border-b">
            <span className="flex items-center">
              <Eye className="w-3 h-3 mr-1" />
              {task.views || 0}
            </span>
            <span className="flex items-center">
              <Share2 className="w-3 h-3 mr-1" />
              {task.shares || 0}
            </span>
            <span className="flex items-center">
              <Download className="w-3 h-3 mr-1" />
              {task.downloads || 0}
            </span>
          </div>
        )}

        {/* 错误信息 */}
        {task.status === 'failed' && task.error_message && (
          <div className="mb-3 p-2 bg-red-50 rounded text-xs text-red-600">
            {task.error_message}
          </div>
        )}

        {/* 操作按钮 */}
        <div className="flex space-x-2">
          {task.status === 'completed' && (
            <>
              <button
                onClick={() => window.open(task.video_url, '_blank')}
                className="flex-1 bg-gradient-to-r from-primary-purple to-primary-pink text-white py-2 rounded-lg font-semibold hover:shadow-lg transition-all text-sm"
              >
                <Play className="w-4 h-4 inline mr-1" />
                播放
              </button>
              <button
                onClick={() => {
                  const a = document.createElement('a');
                  a.href = task.video_url;
                  a.download = `video_${task.id}.mp4`;
                  a.click();
                }}
                className="bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600 transition-colors"
              >
                <Download className="w-4 h-4" />
              </button>
              <button
                className="bg-green-500 text-white p-2 rounded-lg hover:bg-green-600 transition-colors"
              >
                <Share2 className="w-4 h-4" />
              </button>
            </>
          )}
          <button
            onClick={() => onDelete(task.id)}
            className="bg-red-500 text-white p-2 rounded-lg hover:bg-red-600 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

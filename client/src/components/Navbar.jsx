import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../utils/AuthContext';
import { Film, User, LogOut, Coins, Settings } from 'lucide-react';
import { useState } from 'react';

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-lg bg-white/70 border-b border-purple-200/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
            <Film className="w-8 h-8 text-primary-purple" />
            <span className="text-2xl font-bold bg-gradient-button bg-clip-text text-transparent">
              VideoAI Pro
            </span>
          </Link>

          {/* 导航链接 */}
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/" className="text-gray-700 hover:text-primary-purple transition-colors">
              首页
            </Link>
            <Link to="/create" className="text-gray-700 hover:text-primary-purple transition-colors">
              创作
            </Link>
            {isAuthenticated && (
              <Link to="/dashboard" className="text-gray-700 hover:text-primary-purple transition-colors">
                我的作品
              </Link>
            )}
            <Link to="/recharge" className="text-gray-700 hover:text-primary-purple transition-colors">
              充值
            </Link>
          </div>

          {/* 用户菜单 */}
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                {/* 积分显示 */}
                <Link 
                  to="/credits" 
                  className="flex items-center space-x-2 px-4 py-2 rounded-full bg-gradient-button text-white hover:shadow-glow transition-all"
                >
                  <Coins className="w-5 h-5" />
                  <span className="font-semibold">{user?.credits || 0}</span>
                </Link>

                {/* 用户下拉菜单 */}
                <div className="relative">
                  <button
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="flex items-center space-x-2 px-4 py-2 rounded-full glass-card hover:shadow-md transition-all"
                  >
                    <User className="w-5 h-5 text-primary-purple" />
                    <span className="font-medium text-gray-700">{user?.username || user?.email?.split('@')[0]}</span>
                  </button>

                  {showDropdown && (
                    <div className="absolute right-0 mt-2 w-48 glass-card overflow-hidden">
                      <Link
                        to="/dashboard"
                        className="block px-4 py-3 hover:bg-purple-50 transition-colors"
                        onClick={() => setShowDropdown(false)}
                      >
                        <div className="flex items-center space-x-2">
                          <User className="w-4 h-4" />
                          <span>我的作品</span>
                        </div>
                      </Link>
                      <Link
                        to="/credits"
                        className="block px-4 py-3 hover:bg-purple-50 transition-colors"
                        onClick={() => setShowDropdown(false)}
                      >
                        <div className="flex items-center space-x-2">
                          <Coins className="w-4 h-4" />
                          <span>积分中心</span>
                        </div>
                      </Link>
                      {user?.isAdmin && (
                        <Link
                          to="/admin"
                          className="block px-4 py-3 hover:bg-purple-50 transition-colors"
                          onClick={() => setShowDropdown(false)}
                        >
                          <div className="flex items-center space-x-2">
                            <Settings className="w-4 h-4" />
                            <span>管理后台</span>
                          </div>
                        </Link>
                      )}
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-3 hover:bg-red-50 text-red-600 transition-colors"
                      >
                        <div className="flex items-center space-x-2">
                          <LogOut className="w-4 h-4" />
                          <span>退出登录</span>
                        </div>
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  to="/login"
                  className="px-6 py-2 text-primary-purple font-semibold hover:text-primary-pink transition-colors"
                >
                  登录
                </Link>
                <Link
                  to="/register"
                  className="btn-gradient"
                >
                  注册
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

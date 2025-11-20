/**
 * PM2 Process Manager Configuration
 * VideoAI Pro 进程管理配置
 * 
 * 使用方法：
 * - 启动: pm2 start ecosystem.config.cjs
 * - 停止: pm2 stop all
 * - 重启: pm2 restart all
 * - 查看状态: pm2 status
 * - 查看日志: pm2 logs
 */

module.exports = {
  apps: [
    {
      // ===== 主后端服务 =====
      name: 'videoai-backend',
      script: './server/index.js',
      cwd: '/home/user/webapp',
      instances: 1,
      exec_mode: 'cluster',
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      error_file: './logs/backend-error.log',
      out_file: './logs/backend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s'
    },
    
    {
      // ===== Mock IndexTTS2 服务 =====
      // 如果有真实GPU服务，请禁用此服务
      name: 'mock-indextts2',
      script: './server/services/mock_indextts2_server.py',
      cwd: '/home/user/webapp',
      interpreter: 'python3',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '500M',
      env: {
        FLASK_ENV: 'production',
        PORT: 5000
      },
      error_file: './logs/indextts2-error.log',
      out_file: './logs/indextts2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s'
    },
    
    {
      // ===== Mock ComfyUI 服务 =====
      // 如果有真实GPU服务，请禁用此服务
      name: 'mock-comfyui',
      script: './server/services/mock_comfyui_server.py',
      cwd: '/home/user/webapp',
      interpreter: 'python3',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '500M',
      env: {
        FLASK_ENV: 'production',
        PORT: 8188
      },
      error_file: './logs/comfyui-error.log',
      out_file: './logs/comfyui-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s'
    }
  ]
};

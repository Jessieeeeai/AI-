#!/bin/bash

# VideoAI Pro - 完整启动脚本
# 启动所有Mock服务、后端和前端

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 启动 VideoAI Pro 完整服务"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 进入项目目录
cd /home/user/webapp

# 1. 清理旧进程
echo "🧹 清理旧进程..."
pkill -9 -f "node.*server/index.js" 2>/dev/null
pkill -9 -f "node.*startMockServices" 2>/dev/null
pkill -9 -f "vite" 2>/dev/null
sleep 2

# 2. 启动Mock服务
echo "🎭 启动Mock服务..."
npm run mock:services > logs/mock-services.log 2>&1 &
MOCK_PID=$!
echo "   Mock服务 PID: $MOCK_PID"
sleep 5

# 3. 启动后端
echo "🎬 启动后端服务..."
NODE_ENV=development node server/index.js > logs/backend.log 2>&1 &
BACKEND_PID=$!
echo "   后端服务 PID: $BACKEND_PID"
sleep 5

# 4. 启动前端
echo "⚛️  启动前端服务..."
npm run client > logs/frontend.log 2>&1 &
FRONTEND_PID=$!
echo "   前端服务 PID: $FRONTEND_PID"
sleep 8

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ 所有服务已启动"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📊 服务状态:"
echo "   🎭 Mock服务:  http://localhost:5000 (IndexTTS2)"
echo "   🎭 Mock服务:  http://localhost:5001 (文本优化)"
echo "   🎭 Mock服务:  http://localhost:8188 (ComfyUI)"
echo "   🎬 后端 API:  http://localhost:3001"
echo "   ⚛️  前端应用:  http://localhost:5173"
echo ""
echo "📝 查看日志:"
echo "   tail -f logs/mock-services.log"
echo "   tail -f logs/backend.log"
echo "   tail -f logs/frontend.log"
echo ""
echo "🛑 停止所有服务:"
echo "   pkill -f 'node.*server/index.js'"
echo "   pkill -f 'node.*startMockServices'"
echo "   pkill -f 'vite'"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 保存PID以便后续管理
echo "$MOCK_PID" > logs/mock.pid
echo "$BACKEND_PID" > logs/backend.pid
echo "$FRONTEND_PID" > logs/frontend.pid

echo "✨ 启动完成！访问 http://localhost:5173"

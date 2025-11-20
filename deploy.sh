#!/bin/bash

###############################################################################
# VideoAI Pro - 生产环境部署脚本
# Production Deployment Script
#
# 功能：
# - 构建前端生产版本
# - 安装依赖
# - 配置PM2进程管理
# - 启动所有服务
#
# 使用方法：
#   chmod +x deploy.sh
#   ./deploy.sh
###############################################################################

set -e  # 遇到错误立即退出

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 工作目录
WORK_DIR="/home/user/webapp"

echo -e "${BLUE}"
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║                                                           ║"
echo "║         🎬 VideoAI Pro - 生产环境部署                    ║"
echo "║                                                           ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# ===== 1. 检查环境 =====
echo -e "\n${YELLOW}[1/8] 检查部署环境...${NC}"

# 检查Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ 未安装 Node.js，请先安装 Node.js 18+${NC}"
    exit 1
fi
NODE_VERSION=$(node -v)
echo -e "${GREEN}✅ Node.js: $NODE_VERSION${NC}"

# 检查npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ 未安装 npm${NC}"
    exit 1
fi
NPM_VERSION=$(npm -v)
echo -e "${GREEN}✅ npm: $NPM_VERSION${NC}"

# 检查Python
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}❌ 未安装 Python3，Mock服务将无法启动${NC}"
else
    PYTHON_VERSION=$(python3 --version)
    echo -e "${GREEN}✅ Python: $PYTHON_VERSION${NC}"
fi

# 检查PM2
if ! command -v pm2 &> /dev/null; then
    echo -e "${YELLOW}⚠️  未安装 PM2，正在安装...${NC}"
    npm install -g pm2
    echo -e "${GREEN}✅ PM2 安装完成${NC}"
else
    PM2_VERSION=$(pm2 -v)
    echo -e "${GREEN}✅ PM2: $PM2_VERSION${NC}"
fi

# ===== 2. 进入工作目录 =====
echo -e "\n${YELLOW}[2/8] 切换到工作目录...${NC}"
cd "$WORK_DIR" || exit 1
echo -e "${GREEN}✅ 当前目录: $(pwd)${NC}"

# ===== 3. 安装后端依赖 =====
echo -e "\n${YELLOW}[3/8] 安装后端依赖...${NC}"
if [ ! -d "node_modules" ]; then
    echo "首次安装，可能需要几分钟..."
fi
npm install --production
echo -e "${GREEN}✅ 后端依赖安装完成${NC}"

# ===== 4. 安装前端依赖 =====
echo -e "\n${YELLOW}[4/8] 安装前端依赖...${NC}"
cd client
if [ ! -d "node_modules" ]; then
    echo "首次安装，可能需要几分钟..."
fi
npm install
echo -e "${GREEN}✅ 前端依赖安装完成${NC}"

# ===== 5. 构建前端生产版本 =====
echo -e "\n${YELLOW}[5/8] 构建前端生产版本...${NC}"
echo "这可能需要1-2分钟..."

# 检查是否有生产环境配置
if [ ! -f ".env.production" ]; then
    echo -e "${YELLOW}⚠️  未找到 .env.production，使用默认配置${NC}"
fi

npm run build

if [ ! -d "dist" ]; then
    echo -e "${RED}❌ 前端构建失败，未生成 dist 目录${NC}"
    exit 1
fi

echo -e "${GREEN}✅ 前端构建完成，输出目录: client/dist${NC}"
cd ..

# ===== 6. 配置环境变量 =====
echo -e "\n${YELLOW}[6/8] 检查环境变量配置...${NC}"

if [ ! -f ".env.production" ]; then
    echo -e "${YELLOW}⚠️  .env.production 不存在，从模板复制...${NC}"
    if [ -f ".env.example" ]; then
        cp .env.example .env.production
        echo -e "${YELLOW}⚠️  请编辑 .env.production 配置生产环境参数！${NC}"
    fi
fi

if [ -f ".env.production" ]; then
    echo -e "${GREEN}✅ 环境变量配置文件存在${NC}"
    # 提示需要修改的重要配置
    echo -e "${YELLOW}📝 请确保已修改以下配置：${NC}"
    echo "  - JWT_SECRET（随机密钥）"
    echo "  - CORS_ORIGIN（前端域名）"
    echo "  - FRONTEND_URL（前端地址）"
    echo "  - STRIPE_SECRET_KEY（如需支付功能）"
else
    echo -e "${RED}❌ 环境变量配置文件缺失${NC}"
fi

# ===== 7. 创建必要目录 =====
echo -e "\n${YELLOW}[7/8] 创建必要的目录...${NC}"
mkdir -p database
mkdir -p logs
mkdir -p public/uploads/voices
mkdir -p public/uploads/templates
mkdir -p public/uploads/videos
echo -e "${GREEN}✅ 目录结构创建完成${NC}"

# ===== 8. 启动PM2服务 =====
echo -e "\n${YELLOW}[8/8] 启动PM2服务...${NC}"

# 停止旧服务
echo "停止旧服务..."
pm2 delete all 2>/dev/null || true

# 启动新服务
echo "启动新服务..."
pm2 start ecosystem.config.cjs

# 保存PM2配置
pm2 save

# 设置开机自启（需要root权限）
if [ "$EUID" -eq 0 ]; then
    pm2 startup
    echo -e "${GREEN}✅ PM2开机自启已配置${NC}"
else
    echo -e "${YELLOW}⚠️  需要root权限配置PM2开机自启，请手动运行：${NC}"
    echo "  sudo pm2 startup"
fi

# ===== 部署完成 =====
echo -e "\n${GREEN}"
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║                                                           ║"
echo "║         ✅ 部署完成！VideoAI Pro 已启动                  ║"
echo "║                                                           ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# 显示服务状态
echo -e "\n${BLUE}📊 服务状态：${NC}"
pm2 status

echo -e "\n${BLUE}🔗 访问地址：${NC}"
echo "  后端API: http://localhost:3001"
echo "  前端页面: 需要配置Nginx或其他Web服务器指向 client/dist"

echo -e "\n${BLUE}📝 常用命令：${NC}"
echo "  查看状态: pm2 status"
echo "  查看日志: pm2 logs"
echo "  重启服务: pm2 restart all"
echo "  停止服务: pm2 stop all"
echo "  删除服务: pm2 delete all"

echo -e "\n${YELLOW}⚠️  重要提示：${NC}"
echo "1. 请配置 Nginx 或其他 Web 服务器来托管前端静态文件"
echo "2. 建议配置 SSL 证书（Let's Encrypt）"
echo "3. 检查防火墙设置，确保端口可访问"
echo "4. 定期备份数据库文件：database/videoai_production.db"
echo "5. 如需GPU支持，请参考 NEXT_STEPS.md 配置真实服务"

echo -e "\n${GREEN}🎉 祝您使用愉快！${NC}\n"

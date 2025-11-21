#!/bin/bash
# VideoAI Pro GPU服务器一键部署脚本
# 适用于Ubuntu 20.04/22.04 + NVIDIA GPU

set -e  # 遇到错误立即退出

echo "🚀 VideoAI Pro GPU服务器部署开始..."
echo "================================================"

# 检查是否是root用户
if [ "$EUID" -ne 0 ]; then 
    echo "❌ 请使用root用户运行此脚本"
    echo "运行: sudo bash deploy_gpu.sh"
    exit 1
fi

# 检查GPU
if ! command -v nvidia-smi &> /dev/null; then
    echo "⚠️  警告：未检测到NVIDIA GPU驱动"
    read -p "是否继续？(y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# 1. 更新系统
echo ""
echo "📦 [1/10] 更新系统..."
apt update
apt upgrade -y

# 2. 安装基础工具
echo ""
echo "🔧 [2/10] 安装基础工具..."
apt install -y git curl wget vim htop build-essential

# 3. 安装Node.js 20
echo ""
echo "📗 [3/10] 安装Node.js 20..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt install -y nodejs
fi
echo "Node.js版本: $(node -v)"
echo "NPM版本: $(npm -v)"

# 4. 安装Redis
echo ""
echo "💾 [4/10] 安装Redis..."
if ! command -v redis-cli &> /dev/null; then
    apt install -y redis-server
    systemctl start redis
    systemctl enable redis
fi
echo "Redis状态: $(redis-cli ping)"

# 5. 安装FFmpeg
echo ""
echo "🎬 [5/10] 安装FFmpeg..."
apt install -y ffmpeg
echo "FFmpeg版本: $(ffmpeg -version | head -n 1)"

# 6. 安装PM2
echo ""
echo "⚙️  [6/10] 安装PM2..."
npm install -g pm2

# 7. 安装Python环境
echo ""
echo "🐍 [7/10] 安装Python环境..."
apt install -y python3-pip python3-venv python3-dev

# 8. 部署IndexTTS2
echo ""
echo "🎤 [8/10] 部署IndexTTS2..."
cd /workspace || cd /root

if [ ! -d "IndexTTS2" ]; then
    echo "克隆IndexTTS2..."
    git clone https://github.com/Jessieeeeai/IndexTTS2.git
else
    echo "IndexTTS2已存在，跳过克隆"
fi

cd IndexTTS2

# 创建Python虚拟环境
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi

source venv/bin/activate

# 安装依赖
echo "安装IndexTTS2依赖..."
pip install --upgrade pip
pip install -r requirements.txt
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118

# 下载模型
echo "下载IndexTTS2模型..."
if [ ! -f "checkpoints/indextts2_base.pth" ]; then
    python scripts/download_models.py
fi

# 创建启动脚本
cat > start.sh << 'EOF'
#!/bin/bash
cd $(dirname $0)
source venv/bin/activate
python api_server.py --host 0.0.0.0 --port 5000
EOF
chmod +x start.sh

# 用PM2启动
pm2 delete indextts2 2>/dev/null || true
pm2 start start.sh --name indextts2 --interpreter bash
echo "✅ IndexTTS2启动成功"

# 9. 部署ComfyUI
echo ""
echo "🎨 [9/10] 部署ComfyUI..."
cd /workspace || cd /root

if [ ! -d "ComfyUI" ]; then
    echo "克隆ComfyUI..."
    git clone https://github.com/comfyanonymous/ComfyUI.git
else
    echo "ComfyUI已存在，跳过克隆"
fi

cd ComfyUI

# 创建Python虚拟环境
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi

source venv/bin/activate

# 安装依赖
echo "安装ComfyUI依赖..."
pip install --upgrade pip
pip install -r requirements.txt
pip install torch torchvision torchaudio --extra-index-url https://download.pytorch.org/whl/cu118

# 安装MuseTalk（可选）
echo "安装MuseTalk..."
cd custom_nodes
if [ ! -d "MuseTalk" ]; then
    git clone https://github.com/TMElyralab/MuseTalk.git
    cd MuseTalk
    pip install -r requirements.txt
    
    # 下载模型
    mkdir -p models
    cd models
    echo "下载MuseTalk模型（这可能需要一些时间）..."
    # wget https://huggingface.co/TMElyralab/MuseTalk/resolve/main/musetalk.pth
    cd ..
fi
cd ../..

# 创建启动脚本
cat > start.sh << 'EOF'
#!/bin/bash
cd $(dirname $0)
source venv/bin/activate
python main.py --listen 0.0.0.0 --port 8188
EOF
chmod +x start.sh

# 用PM2启动
pm2 delete comfyui 2>/dev/null || true
pm2 start start.sh --name comfyui --interpreter bash
echo "✅ ComfyUI启动成功"

# 10. 部署VideoAI Pro
echo ""
echo "🌐 [10/10] 部署VideoAI Pro..."
cd /workspace || cd /root

if [ ! -d "videoai-pro" ]; then
    echo "❌ 错误：videoai-pro目录不存在"
    echo "请先克隆项目："
    echo "git clone https://github.com/你的用户名/videoai-pro.git"
    exit 1
fi

cd videoai-pro

# 安装Node.js依赖
echo "安装依赖..."
npm install

# 创建.env配置
if [ ! -f ".env" ]; then
    echo "创建.env配置..."
    cat > .env << EOF
# 服务器配置
PORT=3001
NODE_ENV=production

# JWT密钥
JWT_SECRET=$(openssl rand -base64 32)

# TTS和ComfyUI服务
INDEXTTS2_API_URL=http://localhost:5000
COMFYUI_API_URL=http://localhost:8188

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# 文件路径
UPLOAD_DIR=./public/uploads
GENERATED_DIR=./public/generated
EOF
    echo "✅ .env文件已创建"
else
    echo "⏭️  .env文件已存在，跳过创建"
fi

# 运行数据库迁移
echo "初始化数据库..."
node test_migration.js || true

# 构建前端
echo "构建前端..."
npm run build

# 启动后端服务
pm2 delete videoai 2>/dev/null || true
pm2 start npm --name videoai -- run start

# 保存PM2配置
pm2 save
pm2 startup

# 11. 配置Nginx
echo ""
echo "🌍 配置Nginx..."
if ! command -v nginx &> /dev/null; then
    apt install -y nginx
fi

# 创建Nginx配置
cat > /etc/nginx/sites-available/videoai << 'NGINX_EOF'
server {
    listen 80;
    server_name _;
    
    client_max_body_size 100M;
    
    # 前端
    location / {
        root /workspace/videoai-pro/dist;
        try_files $uri $uri/ /index.html;
        
        # 如果在/root目录下
        # root /root/videoai-pro/dist;
    }
    
    # API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
    
    # 静态文件
    location /public {
        alias /workspace/videoai-pro/public;
        # 如果在/root目录下
        # alias /root/videoai-pro/public;
        expires 7d;
        add_header Cache-Control "public, immutable";
    }
}
NGINX_EOF

# 启用站点
ln -sf /etc/nginx/sites-available/videoai /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# 测试Nginx配置
nginx -t

# 重启Nginx
systemctl restart nginx
systemctl enable nginx

# 部署完成
echo ""
echo "================================================"
echo "✅ 部署完成！"
echo "================================================"
echo ""
echo "📊 服务状态："
pm2 status
echo ""
echo "🌐 访问地址："
SERVER_IP=$(curl -s ifconfig.me 2>/dev/null || hostname -I | awk '{print $1}')
echo "http://$SERVER_IP"
echo ""
echo "📝 常用命令："
echo "  查看日志: pm2 logs"
echo "  重启服务: pm2 restart all"
echo "  查看GPU: nvidia-smi"
echo "  查看队列: redis-cli"
echo ""
echo "🎉 开始使用VideoAI Pro吧！"

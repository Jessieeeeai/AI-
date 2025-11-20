# VideoAI Pro - 部署指南

## 📋 环境变量配置

在生产环境部署前，需要配置以下环境变量。

### 创建 `.env` 文件

```bash
# 服务器配置
PORT=3001
NODE_ENV=production

# 前端URL（用于支付回调）
FRONTEND_URL=https://your-domain.com

# JWT密钥（用于用户认证）
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Stripe 支付配置
STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxx

# NOWPayments 加密货币支付（可选）
NOWPAYMENTS_API_KEY=your-nowpayments-api-key

# 阿里云 OSS 配置（文件上传）
ALIYUN_OSS_REGION=oss-cn-hangzhou
ALIYUN_OSS_ACCESS_KEY_ID=your-access-key-id
ALIYUN_OSS_ACCESS_KEY_SECRET=your-access-key-secret
ALIYUN_OSS_BUCKET=videoai-pro

# 邮件服务配置（可选）
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# IndexTTS2 API（视频生成）
INDEXTTS2_API_URL=http://your-gpu-server:8000
INDEXTTS2_API_KEY=your-api-key

# ComfyUI API（视频生成）
COMFYUI_API_URL=http://your-gpu-server:8188
```

## 🚀 部署步骤

### 1. 前端部署（Vercel / Cloudflare Pages）

#### Vercel 部署
```bash
# 安装 Vercel CLI
npm install -g vercel

# 登录
vercel login

# 部署
cd /home/user/webapp
vercel --prod
```

#### Cloudflare Pages 部署
```bash
# 构建前端
npm run build

# 使用 Wrangler 部署
npm install -g wrangler
wrangler login
wrangler pages publish dist --project-name=videoai-pro
```

### 2. 后端部署（阿里云 ECS / AWS EC2）

#### 安装依赖
```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装 Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# 安装 PM2（进程管理）
sudo npm install -g pm2

# 克隆代码
git clone https://github.com/your-username/videoai-pro.git
cd videoai-pro

# 安装依赖
npm install

# 构建前端
npm run build
```

#### 配置 PM2
创建 `ecosystem.config.js`:
```javascript
module.exports = {
  apps: [{
    name: 'videoai-pro',
    script: './server/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    }
  }]
};
```

#### 启动服务
```bash
# 启动应用
pm2 start ecosystem.config.js

# 保存 PM2 配置
pm2 save

# 设置开机自启
pm2 startup
```

#### 配置 Nginx 反向代理
```nginx
server {
    listen 80;
    server_name your-domain.com;

    # 前端静态文件
    location / {
        root /path/to/videoai-pro/dist;
        try_files $uri $uri/ /index.html;
    }

    # API 代理
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Stripe Webhook（需要原始请求体）
    location /api/payment/stripe/webhook {
        proxy_pass http://localhost:3001;
        proxy_set_header Content-Type application/json;
        proxy_set_header Stripe-Signature $http_stripe_signature;
    }
}
```

#### 配置 HTTPS（Let's Encrypt）
```bash
# 安装 Certbot
sudo apt install certbot python3-certbot-nginx

# 获取证书
sudo certbot --nginx -d your-domain.com

# 自动续期
sudo certbot renew --dry-run
```

### 3. GPU 服务器部署（IndexTTS2 + ComfyUI）

#### 阿里云 ECS GPU 实例配置
- 实例类型：ecs.gn6v-c8g1.2xlarge（Tesla V100）
- 操作系统：Ubuntu 20.04
- GPU驱动：CUDA 11.8

#### 安装 IndexTTS2
```bash
# 安装 Python 3.9+
sudo apt install python3.9 python3.9-venv python3-pip

# 创建虚拟环境
python3.9 -m venv /opt/indextts2
source /opt/indextts2/bin/activate

# 安装 IndexTTS2（需要用户提供的代码）
cd /opt/indextts2
# ... 安装步骤根据实际代码 ...

# 启动 API 服务
python api_server.py --port 8000 --host 0.0.0.0
```

#### 安装 ComfyUI
```bash
# 克隆 ComfyUI
git clone https://github.com/comfyanonymous/ComfyUI.git /opt/comfyui
cd /opt/comfyui

# 创建虚拟环境
python3.9 -m venv venv
source venv/bin/activate

# 安装依赖
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118
pip install -r requirements.txt

# 下载模型
# Wan2.1-I2V-14B-480p 模型（需要下载到 models/checkpoints/）
# InfiniteTalk 模型（需要下载到 custom_nodes/InfiniteTalk/）

# 启动服务
python main.py --listen 0.0.0.0 --port 8188
```

#### 使用 PM2 管理 GPU 服务
创建 `gpu-services.config.js`:
```javascript
module.exports = {
  apps: [
    {
      name: 'indextts2',
      script: '/opt/indextts2/bin/python',
      args: 'api_server.py --port 8000 --host 0.0.0.0',
      cwd: '/opt/indextts2',
      autorestart: true
    },
    {
      name: 'comfyui',
      script: '/opt/comfyui/venv/bin/python',
      args: 'main.py --listen 0.0.0.0 --port 8188',
      cwd: '/opt/comfyui',
      autorestart: true
    }
  ]
};
```

```bash
pm2 start gpu-services.config.js
pm2 save
```

### 4. 数据库迁移（生产环境使用 PostgreSQL）

#### 安装 PostgreSQL
```bash
sudo apt install postgresql postgresql-contrib

# 创建数据库
sudo -u postgres psql
CREATE DATABASE videoai_pro;
CREATE USER videoai WITH PASSWORD 'your-password';
GRANT ALL PRIVILEGES ON DATABASE videoai_pro TO videoai;
```

#### 迁移 SQLite 到 PostgreSQL
```bash
# 安装 pg 驱动
npm install pg

# 修改 server/config/database.js 使用 PostgreSQL
# 运行迁移脚本（需要创建）
```

### 5. Stripe Webhook 配置

#### 在 Stripe Dashboard 中配置
1. 登录 Stripe Dashboard
2. 进入 Developers > Webhooks
3. 点击 "Add endpoint"
4. URL: `https://your-domain.com/api/payment/stripe/webhook`
5. 选择事件: `checkout.session.completed`
6. 保存 Webhook Secret 到 `.env`

## 🔍 监控和日志

### PM2 监控
```bash
# 查看状态
pm2 status

# 查看日志
pm2 logs videoai-pro

# 监控面板
pm2 monit
```

### Nginx 日志
```bash
# 访问日志
tail -f /var/log/nginx/access.log

# 错误日志
tail -f /var/log/nginx/error.log
```

## 🔒 安全检查清单

- [ ] 更改所有默认密码和密钥
- [ ] 配置防火墙（仅开放必要端口）
- [ ] 启用 HTTPS
- [ ] 配置 CORS 白名单
- [ ] 设置请求速率限制
- [ ] 定期备份数据库
- [ ] 监控服务器资源使用
- [ ] 设置错误告警

## 📊 性能优化

### Nginx 缓存
```nginx
# 静态资源缓存
location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

### CDN 配置
- 使用阿里云 CDN 或 Cloudflare CDN
- 缓存静态资源
- 加速全球访问

### 数据库优化
```sql
-- 创建索引
CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
```

## 🆘 故障排查

### 常见问题

1. **服务无法启动**
   - 检查端口是否被占用: `lsof -i :3001`
   - 检查环境变量是否正确配置
   - 查看 PM2 日志: `pm2 logs`

2. **Stripe Webhook 失败**
   - 验证 Webhook Secret 是否正确
   - 检查服务器防火墙设置
   - 测试 Webhook: Stripe Dashboard > Webhooks > Send test webhook

3. **视频生成失败**
   - 检查 GPU 服务是否运行
   - 验证 API 连接
   - 查看 IndexTTS2 和 ComfyUI 日志

## 📞 联系支持

如遇部署问题，请联系技术支持团队。

---

**最后更新**: 2024-11-20

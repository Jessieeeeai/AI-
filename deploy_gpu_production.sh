#!/bin/bash
#
# VideoAI Pro - GPU 服务器生产环境自动部署脚本
# 
# 用途: 在 GPU 服务器上自动部署 IndexTTS2 和 ComfyUI
# 要求: Ubuntu 20.04+, NVIDIA GPU 24GB+, CUDA 11.8+
#
# 使用方法:
#   chmod +x deploy_gpu_production.sh
#   ./deploy_gpu_production.sh
#

set -e  # 遇到错误立即退出

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  VideoAI Pro - GPU 服务器生产环境部署${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# 检查是否为 root 用户
if [[ $EUID -ne 0 ]]; then
   echo -e "${YELLOW}建议使用 root 或 sudo 运行此脚本${NC}"
   echo -e "${YELLOW}某些操作可能需要管理员权限${NC}"
   echo ""
fi

# 检查 GPU
echo -e "${YELLOW}[1/10] 检查 NVIDIA GPU...${NC}"
if ! nvidia-smi &> /dev/null; then
    echo -e "${RED}❌ 未检测到 NVIDIA GPU 或驱动未安装${NC}"
    exit 1
fi

nvidia-smi --query-gpu=name,memory.total --format=csv,noheader
echo -e "${GREEN}✅ GPU 检查通过${NC}"
echo ""

# 检查 CUDA
echo -e "${YELLOW}[2/10] 检查 CUDA...${NC}"
if ! nvcc --version &> /dev/null; then
    echo -e "${RED}❌ CUDA 未安装或未配置${NC}"
    echo -e "请先安装 CUDA 11.8+: https://developer.nvidia.com/cuda-downloads"
    exit 1
fi

nvcc --version | head -n 1
echo -e "${GREEN}✅ CUDA 检查通过${NC}"
echo ""

# 检查 Python
echo -e "${YELLOW}[3/10] 检查 Python 3.10+...${NC}"
PYTHON_VERSION=$(python3 --version | cut -d' ' -f2 | cut -d'.' -f1,2)
if [[ $(echo "$PYTHON_VERSION < 3.10" | bc) -eq 1 ]]; then
    echo -e "${RED}❌ Python 版本过低: $PYTHON_VERSION${NC}"
    echo -e "需要 Python 3.10+,请升级后重试"
    exit 1
fi

python3 --version
echo -e "${GREEN}✅ Python 检查通过${NC}"
echo ""

# 安装系统依赖
echo -e "${YELLOW}[4/10] 安装系统依赖...${NC}"
apt-get update -qq
apt-get install -y -qq git wget ffmpeg libsndfile1 python3-pip python3-venv > /dev/null 2>&1
echo -e "${GREEN}✅ 系统依赖安装完成${NC}"
echo ""

# 创建工作目录
WORK_DIR="$HOME/videoai_gpu_services"
mkdir -p "$WORK_DIR"
cd "$WORK_DIR"

echo -e "${GREEN}工作目录: $WORK_DIR${NC}"
echo ""

# ============================================
# 部署 IndexTTS2
# ============================================

echo -e "${YELLOW}[5/10] 部署 IndexTTS2...${NC}"

if [ ! -d "index-tts" ]; then
    echo "克隆 IndexTTS2 仓库..."
    git clone https://github.com/index-tts/index-tts.git
fi

cd index-tts

# 安装 uv 包管理器
if ! command -v uv &> /dev/null; then
    echo "安装 uv 包管理器..."
    curl -LsSf https://astral.sh/uv/install.sh | sh
    export PATH="$HOME/.cargo/bin:$PATH"
fi

# 创建虚拟环境
echo "创建 Python 虚拟环境..."
uv venv

# 激活环境
source .venv/bin/activate

# 安装依赖
echo "安装 IndexTTS2 依赖..."
uv pip install -e . > /dev/null 2>&1
uv pip install flask flask-cors > /dev/null 2>&1

# 下载模型
echo "下载 IndexTTS2 模型..."
mkdir -p checkpoints

if [ ! -f "checkpoints/config.yaml" ]; then
    echo -e "${YELLOW}请下载模型文件到 checkpoints/ 目录${NC}"
    echo -e "HuggingFace: huggingface-cli download IndexTeam/Index-1.9B-Chat --local-dir checkpoints/"
    echo -e "或 ModelScope: modelscope download --model IndexTeam/Index-1.9B-Chat --local_dir checkpoints/"
    echo ""
    read -p "模型已下载完成? (y/n) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${RED}请先下载模型后重新运行脚本${NC}"
        exit 1
    fi
fi

# 复制 API 服务器脚本
echo "复制 IndexTTS2 API 服务器脚本..."
cat > indextts2_server.py << 'INDEXTTS2_EOF'
#!/usr/bin/env python3
"""
IndexTTS2 HTTP API Server
将 IndexTTS2 Python 库封装成 HTTP API 供 Node.js 调用
"""

from flask import Flask, request, send_file, jsonify
from flask_cors import CORS
import os
import tempfile
import logging
from pathlib import Path

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

tts_model = None

def init_indextts2():
    global tts_model
    
    if tts_model is None:
        try:
            from indextts.infer_v2 import IndexTTS2
            
            cfg_path = os.environ.get('INDEXTTS2_CONFIG', 'checkpoints/config.yaml')
            model_dir = os.environ.get('INDEXTTS2_MODEL_DIR', 'checkpoints')
            use_fp16 = os.environ.get('INDEXTTS2_FP16', 'true').lower() == 'true'
            
            logger.info(f"正在加载 IndexTTS2 模型...")
            logger.info(f"  配置文件: {cfg_path}")
            logger.info(f"  模型目录: {model_dir}")
            logger.info(f"  FP16: {use_fp16}")
            
            tts_model = IndexTTS2(
                cfg_path=cfg_path,
                model_dir=model_dir,
                use_fp16=use_fp16,
                use_cuda_kernel=False,
                use_deepspeed=False
            )
            
            logger.info("✅ IndexTTS2 模型加载成功!")
            
        except Exception as e:
            logger.error(f"❌ IndexTTS2 模型加载失败: {e}")
            raise
    
    return tts_model


@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'healthy',
        'model_loaded': tts_model is not None
    })


@app.route('/api/v1/tts', methods=['POST'])
def generate_tts():
    try:
        tts = init_indextts2()
        data = request.json
        
        text = data.get('text', '')
        if not text:
            return jsonify({'error': 'text 参数不能为空'}), 400
        
        spk_audio_prompt = data.get('spk_audio_prompt')
        emo_audio_prompt = data.get('emo_audio_prompt')
        emo_vector = data.get('emo_vector')
        emo_alpha = data.get('emo_alpha', 0.8)
        use_random = data.get('use_random', False)
        use_emo_text = data.get('use_emo_text', False)
        emo_text = data.get('emo_text')
        
        logger.info(f"📝 生成 TTS: '{text[:50]}...'")
        logger.info(f"  情感向量: {emo_vector}")
        
        with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as tmp_file:
            output_path = tmp_file.name
        
        tts.infer(
            spk_audio_prompt=spk_audio_prompt,
            text=text,
            emo_audio_prompt=emo_audio_prompt,
            emo_vector=emo_vector,
            emo_alpha=emo_alpha,
            use_random=use_random,
            use_emo_text=use_emo_text,
            emo_text=emo_text,
            output_path=output_path,
            verbose=True
        )
        
        logger.info(f"✅ TTS 生成成功: {output_path}")
        
        response = send_file(
            output_path,
            mimetype='audio/wav',
            as_attachment=True,
            download_name='generated.wav'
        )
        
        @response.call_on_close
        def cleanup():
            try:
                os.unlink(output_path)
            except:
                pass
        
        return response
        
    except Exception as e:
        logger.error(f"❌ TTS 生成失败: {e}", exc_info=True)
        return jsonify({
            'error': 'TTS 生成失败',
            'message': str(e)
        }), 500


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    host = os.environ.get('HOST', '0.0.0.0')
    
    logger.info("🚀 启动 IndexTTS2 HTTP API 服务器...")
    logger.info(f"🌐 服务器地址: http://{host}:{port}")
    
    try:
        init_indextts2()
    except Exception as e:
        logger.warning(f"⚠️  模型预加载失败: {e}")
    
    app.run(host=host, port=port, debug=False, threaded=True)
INDEXTTS2_EOF

chmod +x indextts2_server.py

# 创建 systemd 服务
echo "创建 IndexTTS2 systemd 服务..."
cat > /etc/systemd/system/indextts2.service << EOF
[Unit]
Description=IndexTTS2 HTTP API Server
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$WORK_DIR/index-tts
Environment="PATH=$WORK_DIR/index-tts/.venv/bin:/usr/bin"
Environment="INDEXTTS2_CONFIG=checkpoints/config.yaml"
Environment="INDEXTTS2_MODEL_DIR=checkpoints"
Environment="INDEXTTS2_FP16=true"
Environment="PORT=5000"
ExecStart=$WORK_DIR/index-tts/.venv/bin/python3 indextts2_server.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable indextts2.service
systemctl start indextts2.service

cd "$WORK_DIR"

echo -e "${GREEN}✅ IndexTTS2 部署完成${NC}"
echo ""

# ============================================
# 部署 ComfyUI
# ============================================

echo -e "${YELLOW}[6/10] 部署 ComfyUI...${NC}"

if [ ! -d "ComfyUI" ]; then
    echo "克隆 ComfyUI 仓库..."
    git clone https://github.com/comfyanonymous/ComfyUI.git
fi

cd ComfyUI

# 创建虚拟环境
python3 -m venv venv
source venv/bin/activate

# 安装依赖
echo "安装 ComfyUI 依赖..."
pip install -r requirements.txt > /dev/null 2>&1

# 安装自定义节点
echo "安装自定义节点..."
cd custom_nodes

# Wan Video Wrapper
if [ ! -d "ComfyUI-WanVideoWrapper" ]; then
    git clone https://github.com/kijai/ComfyUI-WanVideoWrapper.git
    cd ComfyUI-WanVideoWrapper
    pip install -r requirements.txt > /dev/null 2>&1
    cd ..
fi

# Video Helper Suite
if [ ! -d "ComfyUI-VideoHelperSuite" ]; then
    git clone https://github.com/Kosinkadink/ComfyUI-VideoHelperSuite.git
    cd ComfyUI-VideoHelperSuite
    pip install -r requirements.txt > /dev/null 2>&1
    cd ..
fi

# MTB Nodes
if [ ! -d "comfy_mtb" ]; then
    git clone https://github.com/melMass/comfy_mtb.git
    cd comfy_mtb
    pip install -r requirements.txt > /dev/null 2>&1
    cd ..
fi

cd ../..

# 创建模型目录
mkdir -p ComfyUI/models/{checkpoints,vae,clip_vision,umt5,loras,multitalk/InfiniteTalk}

echo -e "${YELLOW}请下载以下模型文件到对应目录:${NC}"
echo "  - Wan2_1-I2V-14B-480p_fp8_e4m3fn_scaled_KJ.safetensors → models/checkpoints/"
echo "  - wan_2.1_vae.safetensors → models/vae/"
echo "  - clip_vision_h.safetensors → models/clip_vision/"
echo "  - umt5_xxl_fp16.safetensors → models/umt5/"
echo "  - Wan2_1-InfiniTetalk-Single_fp16.safetensors → models/multitalk/InfiniteTalk/"
echo "  - lightx2v_I2V_14B_480p_cfg_step_distill_rank128_bf16.safetensors → models/loras/"
echo ""
read -p "模型已下载完成? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${RED}请先下载模型后重新运行脚本${NC}"
    exit 1
fi

# 创建 systemd 服务
echo "创建 ComfyUI systemd 服务..."
cat > /etc/systemd/system/comfyui.service << EOF
[Unit]
Description=ComfyUI API Server
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$WORK_DIR/ComfyUI
Environment="PATH=$WORK_DIR/ComfyUI/venv/bin:/usr/bin"
ExecStart=$WORK_DIR/ComfyUI/venv/bin/python3 main.py --listen 0.0.0.0 --port 8188
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable comfyui.service
systemctl start comfyui.service

cd "$WORK_DIR"

echo -e "${GREEN}✅ ComfyUI 部署完成${NC}"
echo ""

# ============================================
# 部署完成
# ============================================

echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  🎉 GPU 服务器部署完成！${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# 获取服务器 IP
SERVER_IP=$(hostname -I | awk '{print $1}')

echo -e "${YELLOW}服务信息:${NC}"
echo "  - IndexTTS2 API: http://$SERVER_IP:5000"
echo "  - ComfyUI API:   http://$SERVER_IP:8188"
echo ""

echo -e "${YELLOW}服务状态:${NC}"
systemctl status indextts2.service --no-pager -l
systemctl status comfyui.service --no-pager -l
echo ""

echo -e "${YELLOW}健康检查:${NC}"
sleep 5
curl -s http://localhost:5000/health | python3 -m json.tool || echo "IndexTTS2 还在启动中..."
curl -s http://localhost:8188/system_stats | python3 -m json.tool || echo "ComfyUI 还在启动中..."
echo ""

echo -e "${YELLOW}日志查看:${NC}"
echo "  - IndexTTS2: journalctl -u indextts2.service -f"
echo "  - ComfyUI:   journalctl -u comfyui.service -f"
echo ""

echo -e "${GREEN}下一步:${NC}"
echo "1. 在 VideoAI Pro 后端更新 .env 配置:"
echo "   INDEXTTS2_API_URL=http://$SERVER_IP:5000"
echo "   COMFYUI_API_URL=http://$SERVER_IP:8188"
echo ""
echo "2. 重启 Node.js 后端服务"
echo ""
echo "3. 测试完整视频生成流程"
echo ""

echo -e "${GREEN}部署完成！祝您使用愉快！ 🚀${NC}"

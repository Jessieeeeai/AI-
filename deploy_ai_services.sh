#!/bin/bash
# AI服务部署脚本（IndexTTS2 + ComfyUI）
# 单独运行，因为下载模型需要较长时间

set -e

echo "🎤🎨 AI服务部署脚本"
echo "  - IndexTTS2 (语音生成)"
echo "  - ComfyUI + MuseTalk (视频生成)"
echo "================================================"
echo ""

# 检测工作目录
if [ -d "/workspace" ]; then
    WORK_DIR="/workspace"
else
    WORK_DIR="$HOME"
fi

echo "工作目录: $WORK_DIR"
echo ""

# 检查Python
if ! command -v python3 &> /dev/null; then
    echo "❌ 未找到Python3，请先安装"
    exit 1
fi

echo "Python版本: $(python3 --version)"
echo "GPU: $(nvidia-smi --query-gpu=name --format=csv,noheader)"
echo ""

read -p "是否开始部署AI服务？这将需要30-60分钟 (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
fi

# ===========================================
# 1. 部署 IndexTTS2
# ===========================================
echo ""
echo "🎤 [1/2] 部署 IndexTTS2..."
echo "-------------------------------------------"

cd "$WORK_DIR"

if [ ! -d "IndexTTS2" ]; then
    echo "克隆 IndexTTS2..."
    git clone https://github.com/Jessieeeeai/IndexTTS2.git
else
    echo "IndexTTS2 已存在"
fi

cd IndexTTS2

# 创建虚拟环境
if [ ! -d "venv" ]; then
    echo "创建Python虚拟环境..."
    python3 -m venv venv
fi

source venv/bin/activate

# 安装依赖
echo "安装依赖（可能需要10-15分钟）..."
pip install --upgrade pip setuptools wheel
pip install -r requirements.txt

# 安装PyTorch (CUDA 11.8)
echo "安装PyTorch..."
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118

# 下载模型
echo "下载IndexTTS2模型..."
mkdir -p checkpoints

# 创建模型下载脚本
cat > download_models.py << 'PYEOF'
import os
import gdown
import urllib.request

def download_file(url, output_path):
    """下载文件"""
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    print(f"下载: {output_path}")
    
    if url.startswith('https://drive.google.com'):
        # Google Drive
        gdown.download(url, output_path, quiet=False, fuzzy=True)
    else:
        # 直接下载
        urllib.request.urlretrieve(url, output_path)
    
    print(f"✅ 完成: {output_path}")

# 模型URL（需要替换为实际URL）
models = {
    "checkpoints/indextts2_base.pth": "https://example.com/model.pth",
    # 添加更多模型...
}

print("开始下载模型...")
for path, url in models.items():
    if not os.path.exists(path):
        try:
            download_file(url, path)
        except Exception as e:
            print(f"❌ 下载失败: {path}")
            print(f"   错误: {e}")
            print(f"   请手动下载模型到: {path}")

print("\n✅ 模型下载完成！")
PYEOF

# 运行下载（如果有模型URL）
# python download_models.py

# 创建API服务器脚本
cat > api_server.py << 'PYEOF'
#!/usr/bin/env python3
"""
IndexTTS2 API Server
提供HTTP API接口用于语音生成
"""

from flask import Flask, request, jsonify, send_file
from werkzeug.utils import secure_filename
import torch
import numpy as np
import io
import base64
import os

app = Flask(__name__)

# 加载模型（示例代码，需要根据实际IndexTTS2 API调整）
# from indextts2 import TTS
# model = TTS.load_model("checkpoints/indextts2_base.pth")

@app.route('/health', methods=['GET'])
def health_check():
    """健康检查"""
    return jsonify({
        "status": "healthy",
        "service": "IndexTTS2",
        "gpu_available": torch.cuda.is_available(),
        "device": torch.cuda.get_device_name(0) if torch.cuda.is_available() else "CPU"
    })

@app.route('/api/v1/tts', methods=['POST'])
def generate_tts():
    """
    生成语音
    
    请求体:
    {
        "text": "要转换的文本",
        "voiceId": "voice_id",
        "emoVector": [0.7, 0.0, 0.1, 0.0, 0.0, 0.0, 0.3, 0.3],
        "speed": 1.0,
        "pitch": 1.0
    }
    """
    try:
        data = request.json
        
        text = data.get('text', '')
        voice_id = data.get('voiceId', 'default')
        emo_vector = data.get('emoVector', [0.7, 0.0, 0.1, 0.0, 0.0, 0.0, 0.3, 0.3])
        speed = data.get('speed', 1.0)
        pitch = data.get('pitch', 1.0)
        
        if not text:
            return jsonify({"error": "text不能为空"}), 400
        
        # TODO: 调用实际的IndexTTS2模型
        # audio_data = model.synthesize(
        #     text=text,
        #     voice_id=voice_id,
        #     emotion=emo_vector,
        #     speed=speed,
        #     pitch=pitch
        # )
        
        # 临时：返回模拟音频
        print(f"生成语音: {text[:50]}...")
        
        # 生成1秒的静音音频（示例）
        sample_rate = 22050
        duration = len(text) * 0.15  # 估算时长
        audio_data = np.zeros(int(sample_rate * duration), dtype=np.float32)
        
        # 转换为WAV格式
        from scipy.io.wavfile import write
        buffer = io.BytesIO()
        write(buffer, sample_rate, audio_data)
        buffer.seek(0)
        
        return send_file(
            buffer,
            mimetype='audio/wav',
            as_attachment=True,
            download_name='output.wav'
        )
        
    except Exception as e:
        print(f"错误: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/v1/voices', methods=['GET'])
def list_voices():
    """获取可用声音列表"""
    voices = [
        {"id": "male_magnetic", "name": "磁性男声", "language": "zh-CN"},
        {"id": "female_sweet", "name": "甜美女声", "language": "zh-CN"},
        {"id": "male_calm", "name": "沉稳男声", "language": "zh-CN"},
    ]
    return jsonify({"voices": voices})

if __name__ == '__main__':
    print("🎤 IndexTTS2 API Server 启动中...")
    print(f"GPU可用: {torch.cuda.is_available()}")
    if torch.cuda.is_available():
        print(f"GPU: {torch.cuda.get_device_name(0)}")
    
    app.run(
        host='0.0.0.0',
        port=9880,
        debug=False,
        threaded=True
    )
PYEOF

chmod +x api_server.py

# 安装Flask（如果需要）
pip install flask scipy

# 创建启动脚本
cat > start_tts.sh << 'EOF'
#!/bin/bash
cd "$(dirname "$0")"
source venv/bin/activate
python api_server.py
EOF

chmod +x start_tts.sh

# 用PM2启动
pm2 delete indextts2 2>/dev/null || true
pm2 start start_tts.sh --name indextts2 --interpreter bash

echo "✅ IndexTTS2 部署完成！"
echo "   访问: http://localhost:9880/health"

# ===========================================
# 2. 部署 ComfyUI
# ===========================================
echo ""
echo "🎨 [2/2] 部署 ComfyUI + MuseTalk..."
echo "-------------------------------------------"

cd "$WORK_DIR"

if [ ! -d "ComfyUI" ]; then
    echo "克隆 ComfyUI..."
    git clone https://github.com/comfyanonymous/ComfyUI.git
else
    echo "ComfyUI 已存在"
fi

cd ComfyUI

# 创建虚拟环境
if [ ! -d "venv" ]; then
    echo "创建Python虚拟环境..."
    python3 -m venv venv
fi

source venv/bin/activate

# 安装依赖
echo "安装ComfyUI依赖..."
pip install --upgrade pip
pip install -r requirements.txt
pip install torch torchvision torchaudio --extra-index-url https://download.pytorch.org/whl/cu118

# 安装MuseTalk
echo "安装MuseTalk..."
cd custom_nodes
if [ ! -d "MuseTalk" ]; then
    git clone https://github.com/TMElyralab/MuseTalk.git
    cd MuseTalk
    pip install -r requirements.txt
    
    # 创建模型目录
    mkdir -p models/musetalk
    
    echo "⚠️  请手动下载MuseTalk模型到: $(pwd)/models/"
    echo "   模型地址: https://huggingface.co/TMElyralab/MuseTalk"
    
    cd ..
fi

cd ..

# 创建启动脚本
cat > start_comfyui.sh << 'EOF'
#!/bin/bash
cd "$(dirname "$0")"
source venv/bin/activate
python main.py --listen 0.0.0.0 --port 8188
EOF

chmod +x start_comfyui.sh

# 用PM2启动
pm2 delete comfyui 2>/dev/null || true
pm2 start start_comfyui.sh --name comfyui --interpreter bash

echo "✅ ComfyUI 部署完成！"
echo "   访问: http://localhost:8188"

# 保存PM2配置
pm2 save

# 完成
echo ""
echo "================================================"
echo "✅ AI服务部署完成！"
echo "================================================"
echo ""
echo "📊 服务状态："
pm2 status
echo ""
echo "🔗 服务地址："
echo "   IndexTTS2: http://localhost:9880"
echo "   ComfyUI:   http://localhost:8188"
echo ""
echo "📝 测试命令："
echo "   # 测试IndexTTS2"
echo "   curl http://localhost:9880/health"
echo ""
echo "   # 测试ComfyUI"
echo "   curl http://localhost:8188/system_stats"
echo ""
echo "⚠️  重要提示："
echo "   1. IndexTTS2需要手动下载模型文件"
echo "   2. MuseTalk需要手动下载模型文件"
echo "   3. 模型文件通常在HuggingFace或官方仓库"
echo "   4. 首次运行可能需要额外配置"
echo ""
echo "🔧 如果服务启动失败："
echo "   pm2 logs indextts2  # 查看TTS日志"
echo "   pm2 logs comfyui    # 查看视频生成日志"
echo ""

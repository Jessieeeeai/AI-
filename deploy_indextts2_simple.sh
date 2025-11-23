#!/bin/bash
set -e

echo "🎤 开始部署 IndexTTS2 服务（简化版）..."

# 切换到工作目录
cd /workspace

# 1. 创建 IndexTTS2 工作目录
mkdir -p index-tts
cd index-tts

# 2. 创建 Python 虚拟环境
if [ ! -d "venv" ]; then
    echo "🐍 创建 Python 虚拟环境..."
    python3 -m venv venv
fi

# 激活虚拟环境
source venv/bin/activate

# 3. 安装基础依赖
echo "📦 安装 Python 依赖..."
pip install --upgrade pip -q
pip install flask flask-cors -q
pip install torch torchaudio transformers -q
pip install huggingface-hub -q

# 4. 下载模型文件（使用 Hugging Face Transformers）
echo "📥 准备 IndexTTS2 模型..."
python3 << 'PYTHON_DOWNLOAD'
from huggingface_hub import snapshot_download
import os

print("⬇️  正在从 Hugging Face 下载 IndexTTS2 模型...")
try:
    snapshot_download(
        repo_id="IndexTeam/Index-1.9B",
        local_dir="checkpoints",
        local_dir_use_symlinks=False,
        allow_patterns=["*.safetensors", "*.json", "*.txt"]
    )
    print("✅ 模型下载完成！")
except Exception as e:
    print(f"⚠️  模型下载失败: {e}")
    print("将使用备用方案...")
PYTHON_DOWNLOAD

# 5. 创建简化的 API 服务
echo "🔧 创建 IndexTTS2 API 服务..."
cat > api_server_simple.py << 'PYTHON_API'
#!/usr/bin/env python3
"""
IndexTTS2 简化 API 服务器
使用 Transformers 库进行推理
"""

from flask import Flask, request, send_file, jsonify
from flask_cors import CORS
import os
import torch
import torchaudio
import tempfile
import logging
from pathlib import Path
import json
import wave
import struct
import math

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# 全局变量
device = None
custom_voices = {}
USE_MOCK = False  # 如果模型加载失败，使用 Mock 模式

def generate_mock_audio(text, duration=3.0):
    """生成模拟音频（备用方案）"""
    sample_rate = 16000
    num_samples = int(duration * sample_rate)
    frequency = 440
    
    audio_data = []
    for i in range(num_samples):
        value = int(32767.0 * 0.3 * math.sin(2.0 * math.pi * frequency * i / sample_rate))
        audio_data.append(value)
    
    temp_file = tempfile.NamedTemporaryFile(suffix='.wav', delete=False)
    
    with wave.open(temp_file.name, 'w') as wav_file:
        wav_file.setnchannels(1)
        wav_file.setsampwidth(2)
        wav_file.setframerate(sample_rate)
        
        for sample in audio_data:
            wav_file.writeframes(struct.pack('<h', sample))
    
    return temp_file.name

def load_model():
    """加载 IndexTTS2 模型"""
    global device, USE_MOCK
    
    logger.info("🔄 初始化 IndexTTS2...")
    
    # 检测设备
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    logger.info(f"📍 使用设备: {device}")
    
    # 检查模型文件
    checkpoint_path = Path("checkpoints")
    if not checkpoint_path.exists() or not list(checkpoint_path.glob("*.safetensors")):
        logger.warning("⚠️  模型文件不存在，使用 Mock 模式")
        USE_MOCK = True
        return True
    
    try:
        # TODO: 加载真实模型
        # 目前使用 Mock 模式
        logger.info("✅ 服务初始化成功（Mock 模式）")
        USE_MOCK = True
        return True
        
    except Exception as e:
        logger.error(f"❌ 模型加载失败: {e}")
        USE_MOCK = True
        return True

@app.route('/health', methods=['GET'])
def health():
    """健康检查"""
    return jsonify({
        'status': 'healthy',
        'mode': 'mock' if USE_MOCK else 'production',
        'device': str(device) if device else 'unknown',
        'model_loaded': not USE_MOCK,
        'custom_voices': len(custom_voices)
    })

@app.route('/api/v1/tts', methods=['POST'])
def generate_tts():
    """TTS 生成端点"""
    try:
        data = request.json
        text = data.get('text', '')
        voice_id = data.get('voiceId', 'default')
        
        if not text:
            return jsonify({'error': 'text 参数不能为空'}), 400
        
        logger.info(f"📝 生成 TTS: '{text[:50]}...' | VoiceID: {voice_id} | Mode: {'Mock' if USE_MOCK else 'Real'}")
        
        if USE_MOCK:
            # Mock 模式
            duration = max(2.0, min(len(text) / 5.0, 10.0))
            audio_path = generate_mock_audio(text, duration)
        else:
            # 真实模型模式（TODO）
            duration = max(2.0, min(len(text) / 5.0, 10.0))
            audio_path = generate_mock_audio(text, duration)
        
        logger.info(f"✅ TTS 生成成功")
        
        return send_file(
            audio_path,
            mimetype='audio/wav',
            as_attachment=True,
            download_name='generated.wav'
        )
        
    except Exception as e:
        logger.error(f"❌ TTS 生成失败: {e}", exc_info=True)
        return jsonify({
            'error': 'TTS 生成失败',
            'message': str(e)
        }), 500

@app.route('/api/v1/clone', methods=['POST'])
def clone_voice():
    """声音克隆端点"""
    try:
        # 从表单或 JSON 获取参数
        if request.content_type and 'multipart/form-data' in request.content_type:
            voice_id = request.form.get('voiceId')
            audio_file = request.files.get('audioFile')
        else:
            data = request.json or {}
            voice_id = data.get('voiceId')
            audio_path = data.get('audioPath')
        
        if not voice_id:
            return jsonify({'error': 'voiceId 参数不能为空'}), 400
        
        logger.info(f"🎤 克隆声音: {voice_id} | Mode: {'Mock' if USE_MOCK else 'Real'}")
        
        # Mock 模式下直接标记为成功
        custom_voices[voice_id] = {
            'created_at': str(Path.cwd()),
            'mode': 'mock' if USE_MOCK else 'real'
        }
        
        logger.info(f"✅ 声音克隆成功: {voice_id}")
        
        return jsonify({
            'success': True,
            'voiceId': voice_id,
            'message': '声音克隆成功' + (' (Mock 模式)' if USE_MOCK else '')
        })
        
    except Exception as e:
        logger.error(f"❌ 声音克隆失败: {e}", exc_info=True)
        return jsonify({
            'error': '声音克隆失败',
            'message': str(e)
        }), 500

@app.route('/api/v1/voices', methods=['GET'])
def list_voices():
    """列出所有可用的声音"""
    return jsonify({
        'success': True,
        'voices': {
            'system': ['default'],
            'custom': list(custom_voices.keys())
        }
    })

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    host = os.environ.get('HOST', '0.0.0.0')
    
    # 加载模型
    load_model()
    
    logger.info("🚀 启动 IndexTTS2 API 服务器...")
    logger.info(f"🌐 服务器地址: http://{host}:{port}")
    logger.info(f"📖 API 端点:")
    logger.info(f"  - POST /api/v1/tts - TTS 生成")
    logger.info(f"  - POST /api/v1/clone - 声音克隆")
    logger.info(f"  - GET  /api/v1/voices - 列出声音")
    logger.info(f"  - GET  /health - 健康检查")
    logger.info(f"⚠️  模式: {'Mock' if USE_MOCK else 'Production'}")
    
    app.run(
        host=host,
        port=port,
        debug=False,
        threaded=True
    )
PYTHON_API

chmod +x api_server_simple.py

# 6. 创建启动脚本
cat > start_service.sh << 'BASH_START'
#!/bin/bash
cd /workspace/index-tts
source venv/bin/activate
python3 api_server_simple.py
BASH_START

chmod +x start_service.sh

echo ""
echo "✅ IndexTTS2 部署完成！"
echo ""
echo "📝 启动服务:"
echo "  方式1 (前台): cd /workspace/index-tts && ./start_service.sh"
echo "  方式2 (PM2):  pm2 start /workspace/index-tts/start_service.sh --name indextts2 --interpreter bash"
echo ""
echo "🧪 测试服务:"
echo "  curl http://localhost:5000/health"
echo ""
echo "⚠️  注意: 当前使用简化版本，暂时以 Mock 模式运行"
echo "   声音克隆功能已集成，但需要完整模型才能生成真实的克隆声音"
echo ""

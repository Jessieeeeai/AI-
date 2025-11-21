#!/bin/bash
set -e

echo "🎤 开始部署 IndexTTS2 服务..."

# 切换到工作目录
cd /workspace

# 1. 克隆 IndexTTS2 仓库（如果不存在）
if [ ! -d "index-tts" ]; then
    echo "📥 克隆 IndexTTS2 仓库..."
    git clone https://github.com/AnyaCoder/IndexTTS-2.git index-tts
else
    echo "✅ IndexTTS2 仓库已存在"
fi

cd index-tts

# 2. 创建 Python 虚拟环境
if [ ! -d "venv" ]; then
    echo "🐍 创建 Python 虚拟环境..."
    python3 -m venv venv
fi

# 激活虚拟环境
source venv/bin/activate

# 3. 安装依赖
echo "📦 安装 Python 依赖..."
pip install --upgrade pip
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121
pip install -r requirements.txt

# 4. 下载模型文件
echo "📥 下载 IndexTTS2 模型..."
if [ ! -d "checkpoints" ]; then
    mkdir -p checkpoints
fi

# 从 Hugging Face 下载模型
pip install -q huggingface-hub
python3 << 'PYTHON_SCRIPT'
from huggingface_hub import snapshot_download
import os

print("⬇️  正在从 Hugging Face 下载模型...")
snapshot_download(
    repo_id="IndexTeam/IndexTTS-2",
    local_dir="checkpoints",
    local_dir_use_symlinks=False
)
print("✅ 模型下载完成！")
PYTHON_SCRIPT

# 5. 创建 API 服务包装器
echo "🔧 创建 IndexTTS2 API 服务..."
cat > api_server.py << 'PYTHON_API'
#!/usr/bin/env python3
"""
IndexTTS2 API 服务器
提供 TTS 生成和声音克隆接口
"""

from flask import Flask, request, send_file, jsonify
from flask_cors import CORS
import os
import torch
import torchaudio
import tempfile
import logging
from pathlib import Path
import uuid
import json

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# 全局变量存储模型
model = None
device = None
custom_voices = {}  # 存储克隆的声音: {voiceId: voice_embedding}

def load_model():
    """加载 IndexTTS2 模型"""
    global model, device
    
    logger.info("🔄 加载 IndexTTS2 模型...")
    
    # 检测设备
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    logger.info(f"📍 使用设备: {device}")
    
    try:
        # 导入 IndexTTS2 模型
        # 注意：这里需要根据实际的 IndexTTS2 API 调整
        from indextts import IndexTTS
        
        model = IndexTTS(
            checkpoint_path="checkpoints",
            device=device
        )
        
        logger.info("✅ 模型加载成功！")
        return True
        
    except Exception as e:
        logger.error(f"❌ 模型加载失败: {e}", exc_info=True)
        return False

@app.route('/health', methods=['GET'])
def health():
    """健康检查"""
    return jsonify({
        'status': 'healthy' if model is not None else 'model_not_loaded',
        'mode': 'production',
        'device': str(device) if device else 'unknown',
        'model_loaded': model is not None,
        'custom_voices': len(custom_voices)
    })

@app.route('/api/v1/tts', methods=['POST'])
def generate_tts():
    """
    TTS 生成端点
    
    请求参数:
    - text: 要合成的文本
    - voiceId: 声音ID（默认声音或自定义声音）
    - emoVector: 情感向量 [happiness, anger, sadness, afraid, disgusted, melancholic, surprise, calm]
    - emoAlpha: 情感强度 (0.0-1.0)
    """
    try:
        data = request.json
        text = data.get('text', '')
        voice_id = data.get('voiceId', 'default')
        emo_vector = data.get('emoVector', [0.7, 0.0, 0.1, 0.0, 0.0, 0.0, 0.3, 0.3])
        emo_alpha = data.get('emoAlpha', 0.8)
        
        if not text:
            return jsonify({'error': 'text 参数不能为空'}), 400
        
        logger.info(f"📝 生成 TTS: '{text[:50]}...' | VoiceID: {voice_id}")
        logger.info(f"  情感向量: {emo_vector}")
        
        # 检查是否是自定义声音
        voice_embedding = None
        if voice_id in custom_voices:
            voice_embedding = custom_voices[voice_id]
            logger.info(f"  使用自定义声音: {voice_id}")
        
        # 生成音频
        audio_tensor = model.generate(
            text=text,
            voice_embedding=voice_embedding,
            emotion_vector=emo_vector,
            emotion_alpha=emo_alpha
        )
        
        # 保存到临时文件
        temp_file = tempfile.NamedTemporaryFile(suffix='.wav', delete=False)
        torchaudio.save(
            temp_file.name,
            audio_tensor.cpu(),
            sample_rate=22050
        )
        
        logger.info(f"✅ TTS 生成成功: {temp_file.name}")
        
        # 返回音频文件
        return send_file(
            temp_file.name,
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
    """
    声音克隆端点
    
    请求参数:
    - voiceId: 新声音的ID
    - audioFile: 音频文件（multipart/form-data）
    
    或者:
    - voiceId: 新声音的ID
    - audioPath: 服务器上的音频文件路径
    """
    try:
        voice_id = request.form.get('voiceId')
        
        if not voice_id:
            return jsonify({'error': 'voiceId 参数不能为空'}), 400
        
        # 获取音频文件
        audio_file = None
        audio_path = request.form.get('audioPath')
        
        if 'audioFile' in request.files:
            uploaded_file = request.files['audioFile']
            # 保存到临时位置
            temp_file = tempfile.NamedTemporaryFile(suffix='.wav', delete=False)
            uploaded_file.save(temp_file.name)
            audio_path = temp_file.name
        elif not audio_path:
            return jsonify({'error': '需要提供 audioFile 或 audioPath'}), 400
        
        logger.info(f"🎤 开始克隆声音: {voice_id} | 音频: {audio_path}")
        
        # 加载音频
        waveform, sample_rate = torchaudio.load(audio_path)
        
        # 如果是立体声，转换为单声道
        if waveform.shape[0] > 1:
            waveform = torch.mean(waveform, dim=0, keepdim=True)
        
        # 重采样到模型要求的采样率
        if sample_rate != 22050:
            resampler = torchaudio.transforms.Resample(sample_rate, 22050)
            waveform = resampler(waveform)
        
        # 提取声音特征
        voice_embedding = model.extract_voice_embedding(waveform.to(device))
        
        # 保存声音嵌入
        custom_voices[voice_id] = voice_embedding
        
        # 持久化到磁盘
        voices_dir = Path("custom_voices")
        voices_dir.mkdir(exist_ok=True)
        
        torch.save(voice_embedding, voices_dir / f"{voice_id}.pt")
        
        logger.info(f"✅ 声音克隆成功: {voice_id}")
        
        return jsonify({
            'success': True,
            'voiceId': voice_id,
            'message': '声音克隆成功'
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
    if not load_model():
        logger.error("⚠️  模型加载失败，服务器将以降级模式运行")
    
    # 加载已保存的自定义声音
    voices_dir = Path("custom_voices")
    if voices_dir.exists():
        for voice_file in voices_dir.glob("*.pt"):
            voice_id = voice_file.stem
            try:
                custom_voices[voice_id] = torch.load(voice_file)
                logger.info(f"📂 加载自定义声音: {voice_id}")
            except Exception as e:
                logger.error(f"⚠️  加载声音失败 {voice_id}: {e}")
    
    logger.info("🚀 启动 IndexTTS2 API 服务器...")
    logger.info(f"🌐 服务器地址: http://{host}:{port}")
    logger.info(f"📖 API 端点:")
    logger.info(f"  - POST /api/v1/tts - TTS 生成")
    logger.info(f"  - POST /api/v1/clone - 声音克隆")
    logger.info(f"  - GET  /api/v1/voices - 列出声音")
    logger.info(f"  - GET  /health - 健康检查")
    
    app.run(
        host=host,
        port=port,
        debug=False,
        threaded=True
    )
PYTHON_API

chmod +x api_server.py

# 6. 创建启动脚本
cat > start_service.sh << 'BASH_START'
#!/bin/bash
cd /workspace/index-tts
source venv/bin/activate
python3 api_server.py
BASH_START

chmod +x start_service.sh

echo ""
echo "✅ IndexTTS2 部署完成！"
echo ""
echo "📝 启动服务:"
echo "  方式1 (前台): cd /workspace/index-tts && ./start_service.sh"
echo "  方式2 (PM2):  pm2 start /workspace/index-tts/start_service.sh --name indextts2"
echo ""
echo "🧪 测试服务:"
echo "  curl http://localhost:5000/health"
echo ""

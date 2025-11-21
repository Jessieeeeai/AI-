#!/bin/bash
set -e

echo "🎤 开始部署 IndexTTS2 服务..."

# 切换到工作目录
cd /workspace

# 1. 安装 uv 包管理器（如果未安装）
if ! command -v uv &> /dev/null; then
    echo "📦 安装 uv 包管理器..."
    curl -LsSf https://astral.sh/uv/install.sh | sh
    export PATH="$HOME/.cargo/bin:$PATH"
fi

# 2. 克隆 IndexTTS2 仓库（如果不存在）
if [ ! -d "index-tts" ]; then
    echo "📥 克隆 IndexTTS2 官方仓库..."
    git clone https://github.com/index-tts/index-tts.git
    cd index-tts
    
    echo "📥 拉取大文件（git-lfs）..."
    git lfs pull || echo "⚠️  git-lfs 拉取失败，将在后续步骤下载模型"
else
    echo "✅ IndexTTS2 仓库已存在"
    cd index-tts
fi

# 3. 安装依赖
echo "🐍 安装 Python 依赖（使用 uv）..."
uv sync --all-extras

# 4. 下载模型
echo "📥 下载 IndexTTS2 模型..."
if [ ! -d "checkpoints" ] || [ -z "$(ls -A checkpoints)" ]; then
    echo "⬇️  从 Hugging Face 下载模型（约 15GB，需要 10-20 分钟）..."
    
    # 安装 Hugging Face CLI
    uv tool install "huggingface-hub[cli,hf_xet]"
    
    # 下载模型到 checkpoints 目录
    export PATH="$HOME/.local/bin:$PATH"
    hf download IndexTeam/IndexTTS-2 --local-dir=checkpoints
else
    echo "✅ 模型已存在"
fi

# 5. 创建 Flask API 服务包装器
echo "🔧 创建 IndexTTS2 API 服务..."
cat > api_server.py << 'PYTHON_API'
#!/usr/bin/env python3
"""
IndexTTS2 Flask API 服务器
提供 REST API 包装 IndexTTS2 的 Python API
"""

from flask import Flask, request, send_file, jsonify
from flask_cors import CORS
import os
import sys
import torch
import torchaudio
import tempfile
import logging
from pathlib import Path
import json
import traceback

# 添加当前目录到 Python 路径
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# 全局变量
tts_model = None
device = None
custom_voices_dir = Path("custom_voices")
custom_voices_dir.mkdir(exist_ok=True)

def load_model():
    """加载 IndexTTS2 模型"""
    global tts_model, device
    
    try:
        logger.info("🔄 加载 IndexTTS2 模型...")
        
        # 检测设备
        device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        logger.info(f"📍 使用设备: {device}")
        
        # 导入 IndexTTS2
        from indextts.infer_v2 import IndexTTS2
        
        # 加载模型
        tts_model = IndexTTS2(
            cfg_path="checkpoints/config.yaml",
            model_dir="checkpoints",
            use_fp16=True,  # 使用 FP16 节省显存
            use_cuda_kernel=False,  # 不使用自定义 CUDA 内核
            use_deepspeed=False  # 不使用 DeepSpeed
        )
        
        logger.info("✅ IndexTTS2 模型加载成功！")
        return True
        
    except Exception as e:
        logger.error(f"❌ 模型加载失败: {e}")
        logger.error(traceback.format_exc())
        return False

@app.route('/health', methods=['GET'])
def health():
    """健康检查"""
    return jsonify({
        'status': 'healthy' if tts_model is not None else 'model_not_loaded',
        'mode': 'production',
        'device': str(device) if device else 'unknown',
        'model_loaded': tts_model is not None,
        'custom_voices': len(list(custom_voices_dir.glob("*.pt")))
    })

@app.route('/api/v1/tts', methods=['POST'])
def generate_tts():
    """
    TTS 生成端点
    
    请求参数:
    - text: 要合成的文本
    - voiceId: 声音ID（default 或自定义声音ID）
    - emoVector: 情感向量 [happiness, anger, sadness, afraid, disgusted, melancholic, surprise, calm]
    - emoAlpha: 情感强度 (0.0-1.0)
    """
    try:
        if tts_model is None:
            return jsonify({
                'error': '模型未加载',
                'message': '请等待模型加载完成'
            }), 503
        
        data = request.json
        text = data.get('text', '')
        voice_id = data.get('voiceId', 'default')
        emo_vector = data.get('emoVector', [0.7, 0.0, 0.1, 0.0, 0.0, 0.0, 0.3, 0.3])
        emo_alpha = data.get('emoAlpha', 0.8)
        
        if not text:
            return jsonify({'error': 'text 参数不能为空'}), 400
        
        logger.info(f"📝 生成 TTS: '{text[:50]}...' | VoiceID: {voice_id}")
        logger.info(f"  情感向量: {emo_vector}, alpha: {emo_alpha}")
        
        # 查找声音参考音频
        spk_audio_prompt = None
        if voice_id != 'default':
            # 检查自定义声音
            voice_file = custom_voices_dir / f"{voice_id}.wav"
            if voice_file.exists():
                spk_audio_prompt = str(voice_file)
                logger.info(f"  使用自定义声音: {voice_id}")
            else:
                logger.warning(f"  自定义声音不存在: {voice_id}，使用默认声音")
        
        # 创建临时输出文件
        temp_file = tempfile.NamedTemporaryFile(suffix='.wav', delete=False)
        output_path = temp_file.name
        temp_file.close()
        
        # 调用 IndexTTS2 生成音频
        tts_model.infer(
            text=text,
            spk_audio_prompt=spk_audio_prompt,
            output_path=output_path,
            emo_vector=emo_vector,
            emo_alpha=emo_alpha,
            use_random=False,  # 确保声音克隆质量
            verbose=False
        )
        
        logger.info(f"✅ TTS 生成成功: {output_path}")
        
        # 返回音频文件
        return send_file(
            output_path,
            mimetype='audio/wav',
            as_attachment=True,
            download_name='generated.wav'
        )
        
    except Exception as e:
        logger.error(f"❌ TTS 生成失败: {e}")
        logger.error(traceback.format_exc())
        return jsonify({
            'error': 'TTS 生成失败',
            'message': str(e)
        }), 500

@app.route('/api/v1/clone', methods=['POST'])
def clone_voice():
    """
    声音克隆端点
    
    请求参数（multipart/form-data）:
    - voiceId: 新声音的ID
    - audioFile: 音频文件
    
    或（JSON）:
    - voiceId: 新声音的ID
    - audioPath: 服务器上的音频文件路径
    """
    try:
        if tts_model is None:
            return jsonify({
                'error': '模型未加载',
                'message': '请等待模型加载完成'
            }), 503
        
        # 获取 voiceId
        voice_id = request.form.get('voiceId') or request.json.get('voiceId') if request.is_json else None
        
        if not voice_id:
            return jsonify({'error': 'voiceId 参数不能为空'}), 400
        
        # 获取音频文件路径
        audio_path = None
        
        if 'audioFile' in request.files:
            # 从上传文件获取
            uploaded_file = request.files['audioFile']
            temp_file = tempfile.NamedTemporaryFile(suffix='.wav', delete=False)
            uploaded_file.save(temp_file.name)
            audio_path = temp_file.name
        elif request.is_json and 'audioPath' in request.json:
            # 从服务器路径获取
            audio_path = request.json['audioPath']
            # 转换相对路径为绝对路径
            if not os.path.isabs(audio_path):
                audio_path = os.path.join('/workspace/videoai-pro', audio_path.lstrip('/'))
        else:
            return jsonify({'error': '需要提供 audioFile 或 audioPath'}), 400
        
        if not os.path.exists(audio_path):
            return jsonify({'error': f'音频文件不存在: {audio_path}'}), 400
        
        logger.info(f"🎤 开始克隆声音: {voice_id} | 音频: {audio_path}")
        
        # 将音频文件复制到自定义声音目录
        # IndexTTS2 使用音频文件作为参考，不需要提前提取特征
        output_voice_path = custom_voices_dir / f"{voice_id}.wav"
        
        # 加载并转换音频格式（统一为 16kHz WAV）
        waveform, sample_rate = torchaudio.load(audio_path)
        
        # 转换为单声道
        if waveform.shape[0] > 1:
            waveform = torch.mean(waveform, dim=0, keepdim=True)
        
        # 重采样到 16kHz（IndexTTS2 推荐采样率）
        if sample_rate != 16000:
            resampler = torchaudio.transforms.Resample(sample_rate, 16000)
            waveform = resampler(waveform)
        
        # 保存处理后的音频
        torchaudio.save(
            str(output_voice_path),
            waveform,
            sample_rate=16000
        )
        
        logger.info(f"✅ 声音克隆成功: {voice_id} -> {output_voice_path}")
        
        return jsonify({
            'success': True,
            'voiceId': voice_id,
            'message': '声音克隆成功'
        })
        
    except Exception as e:
        logger.error(f"❌ 声音克隆失败: {e}")
        logger.error(traceback.format_exc())
        return jsonify({
            'error': '声音克隆失败',
            'message': str(e)
        }), 500

@app.route('/api/v1/voices', methods=['GET'])
def list_voices():
    """列出所有可用的声音"""
    try:
        custom_voices = [f.stem for f in custom_voices_dir.glob("*.wav")]
        return jsonify({
            'success': True,
            'voices': {
                'system': ['default'],
                'custom': custom_voices
            }
        })
    except Exception as e:
        logger.error(f"❌ 列出声音失败: {e}")
        return jsonify({
            'error': '列出声音失败',
            'message': str(e)
        }), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    host = os.environ.get('HOST', '0.0.0.0')
    
    logger.info("🚀 启动 IndexTTS2 Flask API 服务器...")
    logger.info(f"🌐 服务器地址: http://{host}:{port}")
    
    # 加载模型
    if not load_model():
        logger.error("⚠️  模型加载失败，但服务器将继续运行（降级模式）")
    
    logger.info(f"📖 API 端点:")
    logger.info(f"  - GET  /health           - 健康检查")
    logger.info(f"  - POST /api/v1/tts       - TTS 生成")
    logger.info(f"  - POST /api/v1/clone     - 声音克隆")
    logger.info(f"  - GET  /api/v1/voices    - 列出声音")
    
    app.run(
        host=host,
        port=port,
        debug=False,
        threaded=True
    )
PYTHON_API

chmod +x api_server.py

# 6. 安装 Flask 依赖
echo "📦 安装 Flask 和相关依赖..."
uv pip install flask flask-cors

# 7. 创建启动脚本
cat > start_service.sh << 'BASH_START'
#!/bin/bash
set -e

cd /workspace/index-tts

# 激活 uv 环境并运行 API 服务器
export PYTHONPATH="$PYTHONPATH:."
uv run python3 api_server.py
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
echo "⚠️  首次启动可能需要几分钟来加载模型到 GPU"
echo ""

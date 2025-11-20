#!/usr/bin/env python3
"""
IndexTTS2 HTTP API Server
将 IndexTTS2 Python 库封装成 HTTP API 供 Node.js 调用

安装依赖:
  pip install flask flask-cors indextts

运行:
  python indextts2_server.py
  
API 端点:
  POST /api/v1/tts
    {
      "text": "要合成的文本",
      "spk_audio_prompt": "path/to/voice.wav",  # 可选,自定义声音
      "emo_vector": [0.7, 0.0, 0.1, 0.0, 0.0, 0.0, 0.3, 0.3],  # 8维情感向量
      "emo_alpha": 0.8,  # 情感强度 (0.0-1.0)
      "use_random": false,  # 是否使用随机性
      "pitch_scale": 1.0,  # 音调缩放
      "speed_scale": 1.0   # 语速缩放
    }
    
  响应: 音频文件 (WAV 格式)
"""

from flask import Flask, request, send_file, jsonify
from flask_cors import CORS
import os
import tempfile
import logging
from pathlib import Path

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# IndexTTS2 实例 (延迟加载)
tts_model = None

def init_indextts2():
    """初始化 IndexTTS2 模型"""
    global tts_model
    
    if tts_model is None:
        try:
            from indextts.infer_v2 import IndexTTS2
            
            # 模型配置
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
    """健康检查端点"""
    return jsonify({
        'status': 'healthy',
        'model_loaded': tts_model is not None
    })


@app.route('/api/v1/tts', methods=['POST'])
def generate_tts():
    """
    TTS 生成端点
    
    请求体:
      {
        "text": str,                    # 必需: 要合成的文本
        "spk_audio_prompt": str,        # 可选: 说话人音频路径
        "emo_audio_prompt": str,        # 可选: 情感参考音频路径
        "emo_vector": List[float],      # 可选: 8维情感向量
        "emo_alpha": float,             # 可选: 情感强度 (0-1)
        "use_random": bool,             # 可选: 是否使用随机性
        "use_emo_text": bool,           # 可选: 是否从文本推断情感
        "emo_text": str,                # 可选: 情感文本描述
        "pitch_scale": float,           # 可选: 音调缩放 (暂不支持)
        "speed_scale": float            # 可选: 语速缩放 (暂不支持)
      }
    
    响应: 音频文件 (WAV 格式, arraybuffer)
    """
    try:
        # 确保模型已加载
        tts = init_indextts2()
        
        # 解析请求参数
        data = request.json
        
        text = data.get('text', '')
        if not text:
            return jsonify({'error': 'text 参数不能为空'}), 400
        
        # 情感控制参数
        spk_audio_prompt = data.get('spk_audio_prompt')
        emo_audio_prompt = data.get('emo_audio_prompt')
        emo_vector = data.get('emo_vector')
        emo_alpha = data.get('emo_alpha', 0.8)
        use_random = data.get('use_random', False)
        use_emo_text = data.get('use_emo_text', False)
        emo_text = data.get('emo_text')
        
        logger.info(f"📝 生成 TTS: '{text[:50]}...'")
        logger.info(f"  说话人音频: {spk_audio_prompt}")
        logger.info(f"  情感向量: {emo_vector}")
        logger.info(f"  情感强度: {emo_alpha}")
        
        # 创建临时输出文件
        with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as tmp_file:
            output_path = tmp_file.name
        
        # 调用 IndexTTS2 生成
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
        
        # 返回音频文件
        response = send_file(
            output_path,
            mimetype='audio/wav',
            as_attachment=True,
            download_name='generated.wav'
        )
        
        # 清理临时文件 (响应发送后)
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
    # 启动时加载模型
    logger.info("🚀 启动 IndexTTS2 HTTP API 服务器...")
    
    try:
        init_indextts2()
    except Exception as e:
        logger.warning(f"⚠️  模型预加载失败，将在首次请求时加载: {e}")
    
    # 启动 Flask 服务器
    port = int(os.environ.get('PORT', 5000))
    host = os.environ.get('HOST', '0.0.0.0')
    
    logger.info(f"🌐 服务器地址: http://{host}:{port}")
    logger.info(f"📖 API 文档: POST /api/v1/tts")
    logger.info(f"💚 健康检查: GET /health")
    
    app.run(
        host=host,
        port=port,
        debug=False,
        threaded=True
    )

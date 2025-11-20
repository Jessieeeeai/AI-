#!/usr/bin/env python3
"""
IndexTTS2 Mock Server - 模拟服务器 (无需 GPU)
用于测试和开发环境

运行: python mock_indextts2_server.py
"""

from flask import Flask, request, send_file, jsonify
from flask_cors import CORS
import os
import tempfile
import logging
from pathlib import Path
import wave
import struct
import math

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

def generate_mock_audio(text, duration=3.0):
    """
    生成模拟音频文件 (正弦波)
    """
    # 音频参数
    sample_rate = 16000
    num_samples = int(duration * sample_rate)
    frequency = 440  # A4 音高
    
    # 生成正弦波
    audio_data = []
    for i in range(num_samples):
        value = int(32767.0 * 0.3 * math.sin(2.0 * math.pi * frequency * i / sample_rate))
        audio_data.append(value)
    
    # 创建临时 WAV 文件
    temp_file = tempfile.NamedTemporaryFile(suffix='.wav', delete=False)
    
    with wave.open(temp_file.name, 'w') as wav_file:
        wav_file.setnchannels(1)  # 单声道
        wav_file.setsampwidth(2)  # 16-bit
        wav_file.setframerate(sample_rate)
        
        # 写入音频数据
        for sample in audio_data:
            wav_file.writeframes(struct.pack('<h', sample))
    
    return temp_file.name


@app.route('/health', methods=['GET'])
def health():
    """健康检查"""
    return jsonify({
        'status': 'healthy',
        'mode': 'mock',
        'message': 'IndexTTS2 Mock Server (无需GPU)',
        'model_loaded': True
    })


@app.route('/api/v1/tts', methods=['POST'])
def generate_tts():
    """
    TTS 生成端点 (Mock 版本)
    
    返回模拟音频文件
    """
    try:
        data = request.json
        text = data.get('text', '')
        
        if not text:
            return jsonify({'error': 'text 参数不能为空'}), 400
        
        # 根据文本长度估算音频时长
        duration = max(2.0, min(len(text) / 5.0, 10.0))
        
        logger.info(f"📝 [Mock] 生成 TTS: '{text[:50]}...' (时长: {duration:.1f}秒)")
        logger.info(f"  [Mock] 情感向量: {data.get('emo_vector', 'N/A')}")
        
        # 生成模拟音频
        audio_path = generate_mock_audio(text, duration)
        
        logger.info(f"✅ [Mock] TTS 生成成功: {audio_path}")
        
        # 返回音频文件
        return send_file(
            audio_path,
            mimetype='audio/wav',
            as_attachment=True,
            download_name='generated.wav'
        )
        
    except Exception as e:
        logger.error(f"❌ [Mock] TTS 生成失败: {e}", exc_info=True)
        return jsonify({
            'error': 'TTS 生成失败',
            'message': str(e)
        }), 500


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    host = os.environ.get('HOST', '0.0.0.0')
    
    logger.info("🚀 启动 IndexTTS2 Mock Server (无需GPU)...")
    logger.info(f"🌐 服务器地址: http://{host}:{port}")
    logger.info(f"📖 API 文档: POST /api/v1/tts")
    logger.info(f"💚 健康检查: GET /health")
    logger.info(f"⚠️  这是模拟服务器，仅用于测试！")
    
    app.run(
        host=host,
        port=port,
        debug=False,
        threaded=True
    )

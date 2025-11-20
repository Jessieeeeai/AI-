#!/usr/bin/env python3
"""
ComfyUI Mock Server - 模拟服务器 (无需 GPU)
用于测试和开发环境

运行: python mock_comfyui_server.py
"""

from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import os
import logging
import time
import json
import uuid
from pathlib import Path
import subprocess

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# 存储任务状态
tasks = {}

# 模拟输出目录
OUTPUT_DIR = Path('/tmp/comfyui_mock_output')
OUTPUT_DIR.mkdir(exist_ok=True)


def generate_mock_video(audio_path, template_path, output_path):
    """
    生成模拟视频 (使用 FFmpeg 创建简单视频)
    """
    try:
        # 创建一个 5 秒的黑色视频
        cmd = [
            'ffmpeg', '-y',
            '-f', 'lavfi', '-i', 'color=c=black:s=832x480:d=5',
            '-i', audio_path,
            '-c:v', 'libx264', '-c:a', 'aac',
            '-shortest',
            str(output_path)
        ]
        
        subprocess.run(cmd, check=True, capture_output=True)
        logger.info(f"✅ [Mock] 视频生成成功: {output_path}")
        return True
        
    except Exception as e:
        logger.error(f"❌ [Mock] 视频生成失败: {e}")
        return False


@app.route('/system_stats', methods=['GET'])
def system_stats():
    """系统状态"""
    return jsonify({
        'status': 'ready',
        'mode': 'mock',
        'message': 'ComfyUI Mock Server (无需GPU)',
        'system': {
            'ram': {'used': 1000, 'total': 8000},
            'vram': {'used': 0, 'total': 0}
        }
    })


@app.route('/prompt', methods=['POST'])
def submit_prompt():
    """
    提交工作流
    """
    try:
        data = request.json
        prompt = data.get('prompt', {})
        client_id = data.get('client_id', str(uuid.uuid4()))
        
        # 生成任务 ID
        prompt_id = str(uuid.uuid4())
        
        logger.info(f"📤 [Mock] 收到任务: {prompt_id}")
        logger.info(f"  [Mock] Client ID: {client_id}")
        
        # 记录任务状态
        tasks[prompt_id] = {
            'status': 'pending',
            'client_id': client_id,
            'prompt': prompt,
            'created_at': time.time()
        }
        
        # 模拟处理 (在后台)
        import threading
        def process_task():
            time.sleep(2)  # 模拟处理时间
            
            # 生成模拟视频
            output_filename = f'output_{prompt_id}.mp4'
            output_path = OUTPUT_DIR / output_filename
            
            # 假设有音频文件
            audio_path = '/tmp/mock_audio.wav'
            if not os.path.exists(audio_path):
                # 创建空音频
                os.system(f'ffmpeg -y -f lavfi -i anullsrc=r=16000:cl=mono -t 5 {audio_path} 2>/dev/null')
            
            generate_mock_video(audio_path, None, output_path)
            
            tasks[prompt_id]['status'] = 'completed'
            tasks[prompt_id]['outputs'] = {
                'VHS_VideoCombine': {
                    'videos': [{
                        'filename': output_filename,
                        'type': 'output'
                    }]
                }
            }
        
        threading.Thread(target=process_task, daemon=True).start()
        
        return jsonify({
            'prompt_id': prompt_id,
            'number': 1
        })
        
    except Exception as e:
        logger.error(f"❌ [Mock] 任务提交失败: {e}", exc_info=True)
        return jsonify({'error': str(e)}), 500


@app.route('/history/<prompt_id>', methods=['GET'])
def get_history(prompt_id):
    """
    查询任务历史
    """
    if prompt_id not in tasks:
        return jsonify({})
    
    task = tasks[prompt_id]
    
    if task['status'] == 'completed':
        return jsonify({
            prompt_id: {
                'status': {
                    'completed': True
                },
                'outputs': task.get('outputs', {})
            }
        })
    else:
        return jsonify({
            prompt_id: {
                'status': {
                    'completed': False
                }
            }
        })


@app.route('/view', methods=['GET'])
def view_file():
    """
    下载生成的文件
    """
    filename = request.args.get('filename', '')
    file_path = OUTPUT_DIR / filename
    
    if not file_path.exists():
        return jsonify({'error': 'File not found'}), 404
    
    logger.info(f"📥 [Mock] 下载文件: {filename}")
    
    return send_file(
        str(file_path),
        mimetype='video/mp4',
        as_attachment=True,
        download_name=filename
    )


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8188))
    host = os.environ.get('HOST', '0.0.0.0')
    
    logger.info("🚀 启动 ComfyUI Mock Server (无需GPU)...")
    logger.info(f"🌐 服务器地址: http://{host}:{port}")
    logger.info(f"📖 API 端点:")
    logger.info(f"  - POST /prompt (提交任务)")
    logger.info(f"  - GET /history/<prompt_id> (查询状态)")
    logger.info(f"  - GET /view?filename=<file> (下载文件)")
    logger.info(f"  - GET /system_stats (系统状态)")
    logger.info(f"⚠️  这是模拟服务器，仅用于测试！")
    
    app.run(
        host=host,
        port=port,
        debug=False,
        threaded=True
    )

/**
 * IndexTTS2 Mock服务 - CPU环境模拟
 * 模拟真实IndexTTS2 API响应，用于无GPU开发环境
 */

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

// 模拟音频文件路径 (使用测试音频)
const MOCK_AUDIO_DIR = path.join(__dirname, '../../test-assets/mock-audios');

// 确保mock音频目录存在
if (!fs.existsSync(MOCK_AUDIO_DIR)) {
  fs.mkdirSync(MOCK_AUDIO_DIR, { recursive: true });
}

// 健康检查
app.get('/health', (req, res) => {
  console.log('✅ [Mock IndexTTS2] Health check');
  res.json({
    status: 'healthy',
    mode: 'MOCK',
    message: 'Mock IndexTTS2 service is running (CPU mode)',
    model: 'mock-indextts2-v1',
    gpu: 'N/A (CPU simulation)'
  });
});

// TTS生成 (模拟)
app.post('/api/v1/tts', async (req, res) => {
  const { text, voiceId = 'default', emoVector, emoAlpha } = req.body;
  
  console.log('🎤 [Mock IndexTTS2] TTS请求:', {
    text: text?.substring(0, 50) + '...',
    voiceId,
    emoVector,
    emoAlpha
  });

  // 模拟处理延迟
  await new Promise(resolve => setTimeout(resolve, 500));

  // 返回模拟音频文件 (创建一个简单的WAV文件头)
  const mockAudioBuffer = createMockWavFile(text);
  
  res.set({
    'Content-Type': 'audio/wav',
    'Content-Length': mockAudioBuffer.length,
    'X-Mock-Service': 'true',
    'X-Voice-Id': voiceId,
    'X-Text-Length': text?.length || 0
  });
  
  res.send(mockAudioBuffer);
});

// 语音克隆 (模拟)
app.post('/api/v1/clone', async (req, res) => {
  const { voiceId, audioPath } = req.body;
  
  console.log('🔄 [Mock IndexTTS2] 语音克隆请求:', {
    voiceId,
    audioPath
  });

  // 模拟克隆处理时间
  await new Promise(resolve => setTimeout(resolve, 2000));

  res.json({
    success: true,
    voiceId,
    message: 'Voice cloned successfully (MOCK)',
    model: 'mock-clone-v1',
    processingTime: '2.0s (simulated)'
  });
});

// 获取可用语音列表
app.get('/api/v1/voices', (req, res) => {
  console.log('📋 [Mock IndexTTS2] 获取语音列表');
  
  res.json({
    voices: [
      { id: 'default', name: '默认音色', language: 'zh-CN', gender: 'female' },
      { id: 'male-1', name: '男声1', language: 'zh-CN', gender: 'male' },
      { id: 'female-1', name: '女声1', language: 'zh-CN', gender: 'female' },
      { id: 'en-male-1', name: 'English Male', language: 'en-US', gender: 'male' }
    ],
    mock: true
  });
});

/**
 * 创建一个简单的WAV文件 (最小化有效音频)
 * 用于模拟TTS输出
 */
function createMockWavFile(text = '') {
  // 计算音频长度 (根据文本长度)
  const textLength = text?.length || 10;
  const durationSeconds = Math.min(textLength * 0.2, 10); // 每个字0.2秒，最多10秒
  const sampleRate = 16000;
  const numSamples = Math.floor(sampleRate * durationSeconds);
  
  // WAV文件头 (44字节)
  const header = Buffer.alloc(44);
  
  // RIFF标识
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + numSamples * 2, 4); // 文件大小
  header.write('WAVE', 8);
  
  // fmt子块
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16); // fmt块大小
  header.writeUInt16LE(1, 20); // 音频格式 (1=PCM)
  header.writeUInt16LE(1, 22); // 声道数
  header.writeUInt32LE(sampleRate, 24); // 采样率
  header.writeUInt32LE(sampleRate * 2, 28); // 字节率
  header.writeUInt16LE(2, 32); // 块对齐
  header.writeUInt16LE(16, 34); // 位深度
  
  // data子块
  header.write('data', 36);
  header.writeUInt32LE(numSamples * 2, 40); // 数据大小
  
  // 生成简单的音频数据 (正弦波)
  const audioData = Buffer.alloc(numSamples * 2);
  for (let i = 0; i < numSamples; i++) {
    // 生成440Hz正弦波 (A4音)
    const sample = Math.sin(2 * Math.PI * 440 * i / sampleRate) * 32767 * 0.3;
    audioData.writeInt16LE(Math.floor(sample), i * 2);
  }
  
  return Buffer.concat([header, audioData]);
}

// 启动Mock服务
const PORT = process.env.MOCK_INDEXTTS2_PORT || 5000;

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🎭 Mock IndexTTS2 Service Started');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📡 服务地址: http://localhost:${PORT}`);
  console.log(`🔧 模式: CPU模拟模式 (无GPU依赖)`);
  console.log(`✨ 功能: TTS生成、语音克隆模拟`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
});

export default app;

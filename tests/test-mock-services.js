/**
 * Mock服务测试脚本
 * 验证Mock服务是否正常工作
 */

import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 加载开发环境配置
dotenv.config({ path: path.join(__dirname, '../.env.development') });

const INDEXTTS2_URL = process.env.INDEXTTS2_API_URL || 'http://localhost:5000';
const COMFYUI_URL = process.env.COMFYUI_API_URL || 'http://localhost:8188';

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🧪 Mock服务测试');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

/**
 * 测试IndexTTS2 Mock服务
 */
async function testIndexTTS2() {
  console.log('📋 测试1: IndexTTS2健康检查');
  try {
    const response = await axios.get(`${INDEXTTS2_URL}/health`, { timeout: 5000 });
    console.log('✅ 健康检查通过:', response.data);
    
    if (!response.data.mode || response.data.mode !== 'MOCK') {
      console.log('⚠️  警告: 未检测到Mock模式标识');
    }
  } catch (error) {
    console.error('❌ 健康检查失败:', error.message);
    return false;
  }

  console.log('\n📋 测试2: TTS生成 (default voice)');
  try {
    const response = await axios.post(
      `${INDEXTTS2_URL}/api/v1/tts`,
      {
        text: '这是一段测试文本，用于验证TTS功能是否正常工作。',
        voiceId: 'default'
      },
      {
        responseType: 'arraybuffer',
        timeout: 10000
      }
    );

    const audioSize = response.data.byteLength;
    console.log(`✅ TTS生成成功 | 音频大小: ${audioSize} bytes`);

    if (audioSize < 100) {
      console.log('⚠️  警告: 音频大小异常小');
    }
  } catch (error) {
    console.error('❌ TTS生成失败:', error.message);
    return false;
  }

  console.log('\n📋 测试3: 获取声音列表');
  try {
    const response = await axios.get(`${INDEXTTS2_URL}/api/v1/voices`, { timeout: 5000 });
    console.log('✅ 声音列表获取成功:', response.data);
  } catch (error) {
    console.error('❌ 获取声音列表失败:', error.message);
    return false;
  }

  return true;
}

/**
 * 测试ComfyUI Mock服务
 */
async function testComfyUI() {
  console.log('\n📋 测试4: ComfyUI系统状态');
  try {
    const response = await axios.get(`${COMFYUI_URL}/system_stats`, { timeout: 5000 });
    console.log('✅ 系统状态获取成功:', response.data);
  } catch (error) {
    console.error('❌ 系统状态获取失败:', error.message);
    return false;
  }

  console.log('\n📋 测试5: 提交工作流');
  try {
    const workflow = {
      "1": { "class_type": "LoadVideo", "inputs": { "video": "test.mp4" } },
      "2": { "class_type": "LoadAudio", "inputs": { "audio": "test.wav" } },
      "3": {
        "class_type": "Wav2Lip",
        "inputs": {
          "video_frames": ["1", 0],
          "audio": ["2", 0]
        }
      },
      "4": {
        "class_type": "SaveVideo",
        "inputs": {
          "frames": ["3", 0],
          "filename_prefix": "output_test"
        }
      }
    };

    const response = await axios.post(
      `${COMFYUI_URL}/prompt`,
      {
        prompt: workflow,
        client_id: 'test_client'
      },
      { timeout: 10000 }
    );

    console.log('✅ 工作流提交成功:', response.data);
    const promptId = response.data.prompt_id;

    // 等待2秒后查询任务状态
    console.log('\n📋 测试6: 查询任务状态');
    await new Promise(resolve => setTimeout(resolve, 2000));

    const historyResponse = await axios.get(`${COMFYUI_URL}/history/${promptId}`);
    console.log('✅ 任务状态查询成功:', historyResponse.data);

  } catch (error) {
    console.error('❌ 工作流测试失败:', error.message);
    return false;
  }

  return true;
}

/**
 * 运行所有测试
 */
async function runAllTests() {
  let allPassed = true;

  console.log('🎯 开始测试IndexTTS2 Mock服务\n');
  const ttsResult = await testIndexTTS2();
  if (!ttsResult) allPassed = false;

  console.log('\n\n🎯 开始测试ComfyUI Mock服务\n');
  const comfyResult = await testComfyUI();
  if (!comfyResult) allPassed = false;

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  if (allPassed) {
    console.log('✅ 所有测试通过！Mock服务运行正常');
    console.log('✨ 您可以开始开发和测试视频生成功能');
  } else {
    console.log('❌ 部分测试失败，请检查Mock服务');
    console.log('💡 提示: 确保已运行 npm run mock:services');
  }
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  process.exit(allPassed ? 0 : 1);
}

// 运行测试
runAllTests();

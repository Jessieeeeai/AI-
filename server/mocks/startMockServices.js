/**
 * 启动所有Mock服务
 * 用于CPU开发环境，无需GPU依赖
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 加载开发环境配置
dotenv.config({ path: path.join(__dirname, '../../.env.development') });

const USE_MOCK = process.env.USE_MOCK_AI_SERVICES === 'true';

if (!USE_MOCK) {
  console.log('❌ Mock服务未启用');
  console.log('💡 请在.env.development中设置: USE_MOCK_AI_SERVICES=true');
  process.exit(1);
}

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🚀 启动Mock服务集群 (CPU开发模式)');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// 启动IndexTTS2 Mock服务
import('./mockIndexTTS2.js').then(() => {
  console.log('✅ IndexTTS2 Mock服务已启动\n');
}).catch(err => {
  console.error('❌ IndexTTS2 Mock服务启动失败:', err);
});

// 启动ComfyUI Mock服务
import('./mockComfyUI.js').then(() => {
  console.log('✅ ComfyUI Mock服务已启动\n');
}).catch(err => {
  console.error('❌ ComfyUI Mock服务启动失败:', err);
});

// 捕获退出信号
process.on('SIGINT', () => {
  console.log('\n\n🛑 正在关闭Mock服务...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n\n🛑 正在关闭Mock服务...');
  process.exit(0);
});

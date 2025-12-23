/**
 * AI服务配置
  * 自动根据环境变量切换Mock/Real/RunPod Serverless服务
   */

import dotenv from 'dotenv';

// 加载环境变量
dotenv.config({ path: `.env.${process.env.NODE_ENV || 'development'}` });
dotenv.config(); // fallback to .env

const USE_MOCK = process.env.USE_MOCK_AI_SERVICES === 'true';
const USE_RUNPOD_SERVERLESS = process.env.USE_RUNPOD_SERVERLESS === 'true';

export const aiServicesConfig = {
    useMock: USE_MOCK,
    useRunPodServerless: USE_RUNPOD_SERVERLESS,

    // RunPod Serverless 配置
    runpod: {
          apiKey: process.env.RUNPOD_API_KEY,
          endpointId: process.env.RUNPOD_ENDPOINT_ID,
          timeout: parseInt(process.env.RUNPOD_TIMEOUT || '120000')
    },

    // IndexTTS2配置 (直连模式)
    indexTTS2: {
          apiUrl: process.env.INDEXTTS2_API_URL || 'http://localhost:5000',
          timeout: parseInt(process.env.INDEXTTS2_TIMEOUT || '30000'),
          enabled: true
    },

    // ComfyUI配置
    comfyUI: {
          apiUrl: process.env.COMFYUI_API_URL || 'http://localhost:8188',
          timeout: parseInt(process.env.COMFYUI_TIMEOUT || '60000'),
          enabled: true
    },

    // 文本优化配置
    textOptimization: {
          provider: process.env.TEXT_OPTIMIZATION_PROVIDER || 'local-mock',
          openaiApiKey: process.env.OPENAI_API_KEY,
          zhipuApiKey: process.env.ZHIPU_API_KEY,
          enabled: true
    },

    // 文件存储配置
    storage: {
          uploadDir: process.env.UPLOAD_DIR || './uploads',
          videoOutputDir: process.env.VIDEO_OUTPUT_DIR || './outputs/videos',
          audioOutputDir: process.env.AUDIO_OUTPUT_DIR || './outputs/audios'
    }
};

// 启动时打印配置
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('⚙️ AI服务配置');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
if (USE_RUNPOD_SERVERLESS) {
    console.log(`🚀 模式: RunPod Serverless (GPU云端)`);
    console.log(`📡 Endpoint ID: ${aiServicesConfig.runpod.endpointId}`);
} else if (USE_MOCK) {
    console.log(`🎭 模式: Mock (CPU模拟)`);
} else {
    console.log(`🔧 模式: Real (GPU直连)`);
    console.log(`📡 IndexTTS2: ${aiServicesConfig.indexTTS2.apiUrl}`);
}
console.log(`🎬 ComfyUI: ${aiServicesConfig.comfyUI.apiUrl}`);
console.log(`✨ 文本优化: ${aiServicesConfig.textOptimization.provider}`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

export default aiServicesConfig;

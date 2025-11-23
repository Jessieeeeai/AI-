/**
 * ComfyUI Mock服务 - CPU环境模拟
 * 模拟ComfyUI工作流执行，用于视频生成逻辑验证
 */

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

// 模拟视频输出目录
const MOCK_VIDEO_DIR = path.join(__dirname, '../../test-assets/mock-videos');

if (!fs.existsSync(MOCK_VIDEO_DIR)) {
  fs.mkdirSync(MOCK_VIDEO_DIR, { recursive: true });
}

// 模拟任务存储
const mockJobs = new Map();

// 健康检查
app.get('/system_stats', (req, res) => {
  console.log('✅ [Mock ComfyUI] System stats check');
  res.json({
    system: {
      os: 'linux',
      python_version: '3.10.0 (mock)',
      pytorch_version: '2.0.0 (mock)'
    },
    devices: [
      {
        name: 'CPU (Mock)',
        type: 'cpu',
        vram_total: 0,
        vram_free: 0
      }
    ],
    mock: true
  });
});

// 获取队列状态
app.get('/queue', (req, res) => {
  const runningJobs = Array.from(mockJobs.values()).filter(j => j.status === 'running');
  const pendingJobs = Array.from(mockJobs.values()).filter(j => j.status === 'pending');
  
  res.json({
    queue_running: runningJobs.map(j => j.prompt_id),
    queue_pending: pendingJobs.map(j => j.prompt_id),
    mock: true
  });
});

// 提交工作流
app.post('/prompt', async (req, res) => {
  const { prompt, client_id } = req.body;
  
  if (!prompt) {
    return res.status(400).json({ error: 'Missing prompt' });
  }

  const promptId = uuidv4();
  
  console.log('🎬 [Mock ComfyUI] 工作流提交:', {
    promptId,
    clientId: client_id,
    nodes: Object.keys(prompt).length
  });

  // 创建模拟任务
  const job = {
    prompt_id: promptId,
    client_id,
    status: 'pending',
    prompt,
    createdAt: Date.now(),
    progress: 0
  };
  
  mockJobs.set(promptId, job);

  // 模拟异步处理
  processJob(promptId);

  res.json({
    prompt_id: promptId,
    number: mockJobs.size,
    mock: true
  });
});

// 获取任务历史
app.get('/history/:prompt_id', (req, res) => {
  const { prompt_id } = req.params;
  const job = mockJobs.get(prompt_id);

  if (!job) {
    return res.json({});
  }

  console.log(`📊 [Mock ComfyUI] 查询任务: ${prompt_id} - ${job.status}`);

  const history = {};
  history[prompt_id] = {
    prompt: job.prompt,
    outputs: job.outputs || {},
    status: {
      status_str: job.status,
      completed: job.status === 'completed',
      messages: job.messages || []
    }
  };

  res.json(history);
});

// 获取生成的文件
app.get('/view', (req, res) => {
  const { filename } = req.query;
  
  if (!filename) {
    return res.status(400).json({ error: 'Missing filename' });
  }

  console.log(`📥 [Mock ComfyUI] 下载文件: ${filename}`);

  // 返回模拟视频文件
  const mockVideoPath = path.join(MOCK_VIDEO_DIR, 'sample.mp4');
  
  // 如果不存在，创建一个最小化的MP4文件
  if (!fs.existsSync(mockVideoPath)) {
    createMockVideoFile(mockVideoPath);
  }

  res.sendFile(mockVideoPath);
});

// 中断任务
app.post('/interrupt', (req, res) => {
  console.log('⏹️ [Mock ComfyUI] 中断任务');
  res.json({ success: true, mock: true });
});

/**
 * 模拟处理工作流任务
 */
async function processJob(promptId) {
  const job = mockJobs.get(promptId);
  if (!job) return;

  // 开始处理
  job.status = 'running';
  console.log(`▶️ [Mock ComfyUI] 开始处理: ${promptId}`);

  // 模拟处理进度
  for (let i = 0; i <= 100; i += 20) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    job.progress = i;
    console.log(`⏳ [Mock ComfyUI] 进度: ${promptId} - ${i}%`);
  }

  // 完成处理
  const outputFilename = `output_${promptId}.mp4`;
  job.status = 'completed';
  job.outputs = {
    '9': { // SaveVideo节点ID
      videos: [
        {
          filename: outputFilename,
          subfolder: '',
          type: 'output'
        }
      ]
    }
  };
  job.messages = ['Processing completed (MOCK)'];

  console.log(`✅ [Mock ComfyUI] 完成: ${promptId}`);
}

/**
 * 创建最小化的MP4文件 (用于测试)
 */
function createMockVideoFile(outputPath) {
  // 这是一个1秒的黑色视频MP4文件的16进制头
  // 实际项目中可以用ffmpeg生成: ffmpeg -f lavfi -i color=black:s=1280x720:d=1 -c:v libx264 sample.mp4
  const minimalMp4 = Buffer.from([
    0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70, // ftyp
    0x69, 0x73, 0x6F, 0x6D, 0x00, 0x00, 0x02, 0x00,
    0x69, 0x73, 0x6F, 0x6D, 0x69, 0x73, 0x6F, 0x32,
    0x6D, 0x70, 0x34, 0x31, 0x00, 0x00, 0x00, 0x08,
    0x66, 0x72, 0x65, 0x65 // free
  ]);

  fs.writeFileSync(outputPath, minimalMp4);
  console.log(`📝 [Mock ComfyUI] 创建模拟视频: ${outputPath}`);
}

// 启动Mock服务
const PORT = process.env.MOCK_COMFYUI_PORT || 8188;

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🎭 Mock ComfyUI Service Started');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📡 服务地址: http://localhost:${PORT}`);
  console.log(`🔧 模式: CPU模拟模式 (无GPU依赖)`);
  console.log(`✨ 功能: 视频生成工作流模拟`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
});

export default app;

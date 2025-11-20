/**
 * 视频生成服务测试脚本
 * 
 * 用途: 测试 IndexTTS2 和 ComfyUI 集成
 * 运行: node server/services/videoGenerationService.test.js
 */

import { generateVideo } from './videoGenerationService.js';
import { Task } from '../models/Task.js';

// 模拟测试任务
async function testVideoGeneration() {
  console.log('🧪 开始测试视频生成流程...\n');

  try {
    // 创建测试任务
    const testTaskId = await Task.create({
      userId: 1,
      text: '大家好，我是你们的数字分身。今天天气很好，心情也很愉快。让我们一起来创造美好的未来吧！',
      voiceId: null,  // 使用默认声音
      voiceSettings: {
        happiness: 0.8,
        sadness: 0.0,
        anger: 0.0,
        surprise: 0.2,
        pitch: 1.0,
        speed: 1.0
      },
      templateId: 'template_1',
      isCustomTemplate: false,
      duration: 15,
      segments: 1,
      costBreakdown: {
        audioCost: 5,
        videoCost: 25,
        extraCost: 0,
        subtotal: 30,
        total: 30
      },
      totalCost: 30
    });

    console.log(`✅ 测试任务已创建: ${testTaskId}\n`);

    // 调用视频生成
    console.log('🎬 开始生成视频...\n');
    const result = await generateVideo(testTaskId);

    console.log('\n✅ 测试完成!');
    console.log('结果:', result);

  } catch (error) {
    console.error('\n❌ 测试失败:', error);
    process.exit(1);
  }
}

// 运行测试
testVideoGeneration().then(() => {
  console.log('\n🎉 测试流程结束');
  process.exit(0);
}).catch(error => {
  console.error('\n💥 测试异常:', error);
  process.exit(1);
});

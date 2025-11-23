/**
 * 视频生成服务测试
 * 测试完整的视频生成流程（使用Mock服务）
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import videoGenerationService from '../server/services/videoGenerationService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 加载开发环境配置
dotenv.config({ path: path.join(__dirname, '../.env.development') });

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🧪 视频生成服务测试');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

/**
 * 测试1: 文本分段
 */
function testTextSegmentation() {
  console.log('📋 测试1: 文本分段功能');

  const longText = `
    大家好，欢迎来到我的频道。今天我们要讨论一个非常有趣的话题。
    人工智能正在改变我们的生活方式。从自动驾驶到智能助手，AI无处不在。
    但是，我们也需要关注AI带来的挑战和伦理问题。
    让我们一起探索这个令人兴奋的领域吧！
  `.trim();

  const segments = videoGenerationService.segmentText(longText, 50);

  console.log(`原始文本长度: ${longText.length}`);
  console.log(`分段数量: ${segments.length}`);
  console.log('分段结果:');
  segments.forEach((seg, idx) => {
    console.log(`  片段${idx + 1} (${seg.length}字): ${seg}`);
  });

  if (segments.length > 0 && segments.every(s => s.length <= 60)) {
    console.log('✅ 文本分段测试通过\n');
    return true;
  } else {
    console.log('❌ 文本分段测试失败\n');
    return false;
  }
}

/**
 * 测试2: TTS音频生成
 */
async function testTTSGeneration() {
  console.log('📋 测试2: TTS音频生成');

  try {
    const testText = '这是一段测试文本，用于验证TTS功能。';
    const audioPath = await videoGenerationService.generateTTS(testText, 'default');

    console.log(`✅ TTS生成成功: ${audioPath}\n`);
    return true;
  } catch (error) {
    console.error('❌ TTS生成失败:', error.message, '\n');
    return false;
  }
}

/**
 * 测试3: 完整文本音频生成（分段+TTS+合并）
 */
async function testFullTextAudio() {
  console.log('📋 测试3: 完整文本音频生成');

  try {
    const longText = `
      欢迎来到VideoAI Pro。
      这是一个专业的口播视频生成平台。
      我们使用先进的AI技术，让视频制作变得简单高效。
    `.trim();

    const audioPath = await videoGenerationService.generateFullTextAudio(longText, 'default');

    console.log(`✅ 完整音频生成成功: ${audioPath}\n`);
    return true;
  } catch (error) {
    console.error('❌ 完整音频生成失败:', error.message, '\n');
    return false;
  }
}

/**
 * 测试4: ComfyUI工作流构建
 */
function testWorkflowBuilder() {
  console.log('📋 测试4: ComfyUI工作流构建');

  try {
    const workflow = videoGenerationService.buildWorkflow({
      templateVideoPath: '/path/to/template.mp4',
      audioPath: '/path/to/audio.wav',
      outputFilename: 'test_output.mp4'
    });

    console.log('工作流节点数:', Object.keys(workflow).length);
    console.log('工作流结构:', JSON.stringify(workflow, null, 2));

    if (workflow && workflow["1"] && workflow["4"]) {
      console.log('✅ 工作流构建测试通过\n');
      return true;
    } else {
      console.log('❌ 工作流结构不完整\n');
      return false;
    }
  } catch (error) {
    console.error('❌ 工作流构建失败:', error.message, '\n');
    return false;
  }
}

/**
 * 测试5: ComfyUI任务提交（Mock）
 */
async function testComfyUISubmission() {
  console.log('📋 测试5: ComfyUI任务提交');

  try {
    const workflow = videoGenerationService.buildWorkflow({
      templateVideoPath: 'test_template.mp4',
      audioPath: 'test_audio.wav',
      outputFilename: 'test_output.mp4'
    });

    const promptId = await videoGenerationService.submitComfyUIJob(workflow);
    console.log(`✅ 任务提交成功 | Prompt ID: ${promptId}\n`);

    return promptId;
  } catch (error) {
    console.error('❌ 任务提交失败:', error.message, '\n');
    return null;
  }
}

/**
 * 测试6: 任务状态轮询（Mock）
 */
async function testJobPolling(promptId) {
  console.log('📋 测试6: 任务状态轮询');

  try {
    const result = await videoGenerationService.pollJobStatus(promptId, 15000); // 15秒超时
    console.log('✅ 任务完成:', JSON.stringify(result, null, 2), '\n');
    return true;
  } catch (error) {
    console.error('❌ 任务轮询失败:', error.message, '\n');
    return false;
  }
}

/**
 * 运行所有测试
 */
async function runAllTests() {
  console.log('🚀 开始运行测试套件\n');

  const results = {
    textSegmentation: false,
    ttsGeneration: false,
    fullTextAudio: false,
    workflowBuilder: false,
    comfyuiSubmission: false,
    jobPolling: false
  };

  // 测试1: 文本分段
  results.textSegmentation = testTextSegmentation();

  // 测试2: TTS生成
  results.ttsGeneration = await testTTSGeneration();

  // 测试3: 完整音频生成
  results.fullTextAudio = await testFullTextAudio();

  // 测试4: 工作流构建
  results.workflowBuilder = testWorkflowBuilder();

  // 测试5+6: ComfyUI集成
  const promptId = await testComfyUISubmission();
  if (promptId) {
    results.comfyuiSubmission = true;
    results.jobPolling = await testJobPolling(promptId);
  }

  // 汇总结果
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 测试结果汇总');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  let passedCount = 0;
  const totalCount = Object.keys(results).length;

  for (const [testName, passed] of Object.entries(results)) {
    const status = passed ? '✅ 通过' : '❌ 失败';
    console.log(`${status} - ${testName}`);
    if (passed) passedCount++;
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`总计: ${passedCount}/${totalCount} 测试通过`);

  if (passedCount === totalCount) {
    console.log('🎉 恭喜！所有测试通过！');
    console.log('✨ 视频生成服务已就绪，可以继续开发');
  } else {
    console.log('⚠️  部分测试失败，请检查相关服务');
    console.log('💡 确保Mock服务已启动: npm run mock:services');
  }
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  process.exit(passedCount === totalCount ? 0 : 1);
}

// 运行测试
runAllTests().catch(error => {
  console.error('💥 测试运行出错:', error);
  process.exit(1);
});

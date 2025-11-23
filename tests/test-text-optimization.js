/**
 * 文本优化服务测试
 * 测试Mock、OpenAI、智谱AI三种提供商
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 加载开发环境配置
dotenv.config({ path: path.join(__dirname, '../.env.development') });

const MOCK_SERVICE_URL = process.env.MOCK_TEXT_OPTIMIZATION_URL || 'http://localhost:5001';
const BACKEND_API_URL = process.env.BACKEND_API_URL || 'http://localhost:3001';

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('🧪 文本优化服务测试');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

/**
 * 测试1: Mock服务健康检查
 */
async function testMockHealth() {
  console.log('📋 测试1: Mock服务健康检查');
  
  try {
    const response = await axios.get(`${MOCK_SERVICE_URL}/health`, { timeout: 5000 });
    console.log('✅ 健康检查通过:', response.data);
    
    if (response.data.mode !== 'MOCK') {
      console.log('⚠️  警告: 未检测到Mock模式标识');
    }
    
    return true;
  } catch (error) {
    console.error('❌ 健康检查失败:', error.message);
    console.log('💡 提示: 确保已运行 npm run mock:services');
    return false;
  }
}

/**
 * 测试2: 基础文本优化
 */
async function testBasicOptimization() {
  console.log('\n📋 测试2: 基础文本优化');
  
  const testText = '这是一个测试文本。。它有一些，，问题需要修复。  还有多余的空格。';
  
  try {
    const response = await axios.post(
      `${MOCK_SERVICE_URL}/api/v1/optimize`,
      {
        text: testText,
        tone: 'professional',
        style: 'clear'
      },
      { timeout: 10000 }
    );

    console.log('原始文本:', testText);
    console.log('优化文本:', response.data.optimized);
    console.log('改进建议:', response.data.suggestions);
    console.log('元数据:', response.data.metadata);

    if (response.data.success && response.data.optimized !== testText) {
      console.log('✅ 基础优化测试通过\n');
      return true;
    } else {
      console.log('❌ 优化结果异常\n');
      return false;
    }
  } catch (error) {
    console.error('❌ 基础优化测试失败:', error.message, '\n');
    return false;
  }
}

/**
 * 测试3: 不同语气优化
 */
async function testToneOptimization() {
  console.log('📋 测试3: 不同语气优化');
  
  const testText = '这个产品很好，你可以试试。';
  const tones = ['professional', 'casual', 'enthusiastic'];
  
  let allPassed = true;
  
  for (const tone of tones) {
    try {
      const response = await axios.post(
        `${MOCK_SERVICE_URL}/api/v1/optimize`,
        { text: testText, tone },
        { timeout: 10000 }
      );

      console.log(`  ${tone}: ${response.data.optimized}`);
      
      if (!response.data.success) {
        allPassed = false;
      }
    } catch (error) {
      console.error(`  ❌ ${tone} 失败:`, error.message);
      allPassed = false;
    }
  }

  if (allPassed) {
    console.log('✅ 语气优化测试通过\n');
  } else {
    console.log('❌ 部分语气测试失败\n');
  }
  
  return allPassed;
}

/**
 * 测试4: 批量优化
 */
async function testBatchOptimization() {
  console.log('📋 测试4: 批量优化');
  
  const testTexts = [
    '第一段文本。。需要优化',
    '第二段文本，，也有问题',
    '第三段文本  有多余空格'
  ];
  
  try {
    const response = await axios.post(
      `${MOCK_SERVICE_URL}/api/v1/batch-optimize`,
      {
        texts: testTexts,
        tone: 'professional'
      },
      { timeout: 15000 }
    );

    console.log(`批量优化完成: ${response.data.count} 个文本`);
    response.data.results.forEach((result, idx) => {
      console.log(`  文本${idx + 1}: ${result.original} → ${result.optimized}`);
    });

    if (response.data.success && response.data.count === testTexts.length) {
      console.log('✅ 批量优化测试通过\n');
      return true;
    } else {
      console.log('❌ 批量优化结果异常\n');
      return false;
    }
  } catch (error) {
    console.error('❌ 批量优化测试失败:', error.message, '\n');
    return false;
  }
}

/**
 * 测试5: 获取语气和风格列表
 */
async function testGetOptions() {
  console.log('📋 测试5: 获取语气和风格列表');
  
  try {
    const tonesResponse = await axios.get(`${MOCK_SERVICE_URL}/api/v1/tones`);
    console.log('支持的语气:', tonesResponse.data.tones.map(t => t.id).join(', '));

    const stylesResponse = await axios.get(`${MOCK_SERVICE_URL}/api/v1/styles`);
    console.log('支持的风格:', stylesResponse.data.styles.map(s => s.id).join(', '));

    if (tonesResponse.data.tones.length > 0 && stylesResponse.data.styles.length > 0) {
      console.log('✅ 选项列表获取测试通过\n');
      return true;
    } else {
      console.log('❌ 选项列表为空\n');
      return false;
    }
  } catch (error) {
    console.error('❌ 获取选项列表失败:', error.message, '\n');
    return false;
  }
}

/**
 * 测试6: 长文本优化
 */
async function testLongTextOptimization() {
  console.log('📋 测试6: 长文本优化');
  
  const longText = `
    大家好，欢迎来到我的频道。。今天我们要讨论一个非常有趣的话题。。
    人工智能正在改变我们的生活方式。从自动驾驶到智能助手，，AI无处不在。
    但是，，我们也需要关注AI带来的挑战和伦理问题。  
    让我们一起探索这个令人兴奋的领域吧！！
  `.trim();
  
  try {
    const response = await axios.post(
      `${MOCK_SERVICE_URL}/api/v1/optimize`,
      {
        text: longText,
        tone: 'enthusiastic',
        style: 'clear'
      },
      { timeout: 15000 }
    );

    console.log(`原始长度: ${longText.length} 字`);
    console.log(`优化长度: ${response.data.optimized.length} 字`);
    console.log('优化文本:', response.data.optimized.substring(0, 100) + '...');

    if (response.data.success) {
      console.log('✅ 长文本优化测试通过\n');
      return true;
    } else {
      console.log('❌ 长文本优化失败\n');
      return false;
    }
  } catch (error) {
    console.error('❌ 长文本优化测试失败:', error.message, '\n');
    return false;
  }
}

/**
 * 运行所有测试
 */
async function runAllTests() {
  console.log('🚀 开始运行测试套件\n');

  const results = {
    mockHealth: false,
    basicOptimization: false,
    toneOptimization: false,
    batchOptimization: false,
    getOptions: false,
    longTextOptimization: false
  };

  // 运行测试
  results.mockHealth = await testMockHealth();
  
  if (results.mockHealth) {
    results.basicOptimization = await testBasicOptimization();
    results.toneOptimization = await testToneOptimization();
    results.batchOptimization = await testBatchOptimization();
    results.getOptions = await testGetOptions();
    results.longTextOptimization = await testLongTextOptimization();
  } else {
    console.log('⚠️  Mock服务未启动，跳过其他测试');
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
    console.log('✨ 文本优化服务已就绪');
  } else {
    console.log('⚠️  部分测试失败，请检查Mock服务');
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

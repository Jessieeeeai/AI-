# 文本优化服务使用指南

> 📝 **功能**: AI驱动的智能文本优化，支持多种语气和风格调整

---

## 🎯 功能概述

文本优化服务可以:
- ✅ 修正语法和标点错误
- ✅ 调整文本语气 (专业/随意/热情)
- ✅ 改变表达风格 (清晰/详细/精简)
- ✅ 优化句子流畅度
- ✅ 批量处理多个文本

---

## 🔧 支持的AI提供商

### 1. Mock服务 (CPU开发)
- **优点**: 无需API key，快速响应，免费
- **缺点**: 优化效果有限，基于规则引擎
- **适用**: 开发测试阶段

### 2. OpenAI GPT-4
- **优点**: 顶级优化质量，理解力强
- **缺点**: 需要API key，有费用
- **适用**: 生产环境，高质量需求

### 3. 智谱AI GLM-4
- **优点**: 中文优化效果好，性价比高
- **缺点**: 需要API key
- **适用**: 生产环境，中文项目

---

## ⚙️ 配置方法

### 开发环境配置 (`.env.development`)

```bash
# 使用Mock服务 (CPU开发)
TEXT_OPTIMIZATION_PROVIDER=local-mock
MOCK_TEXT_OPTIMIZATION_URL=http://localhost:5001
```

### 生产环境配置 (`.env.production`)

**使用OpenAI:**
```bash
TEXT_OPTIMIZATION_PROVIDER=openai
OPENAI_API_KEY=sk-your-openai-api-key-here
```

**使用智谱AI:**
```bash
TEXT_OPTIMIZATION_PROVIDER=zhipu
ZHIPU_API_KEY=your-zhipu-api-key-here
```

---

## 🚀 启动服务

### 启动Mock服务 (开发环境)

```bash
# 启动所有Mock服务
npm run mock:services

# 或只启动文本优化Mock服务
node server/mocks/mockTextOptimization.js
```

### 启动后端服务

```bash
# 开发模式 (自动启动Mock服务)
npm run dev:mock

# 或分别启动
npm run mock:services    # 终端1
npm run server           # 终端2
npm run client           # 终端3
```

---

## 📡 API接口说明

### 1. 优化单个文本

**请求:**
```bash
POST /api/text-optimization/optimize
Content-Type: application/json
Authorization: Bearer YOUR_JWT_TOKEN

{
  "text": "这是一个测试文本。。需要优化",
  "tone": "professional",      # 可选: professional, casual, enthusiastic
  "style": "clear",            # 可选: clear, detailed, concise
  "targetAudience": "general", # 可选: 目标受众
  "maxLength": 100             # 可选: 最大长度限制
}
```

**响应:**
```json
{
  "success": true,
  "original": "这是一个测试文本。。需要优化",
  "optimized": "这是一个测试文本。需要优化。",
  "suggestions": [
    "修复重复句号",
    "调整了语气和措辞，使表达更专业"
  ],
  "metadata": {
    "originalLength": 15,
    "optimizedLength": 13,
    "tone": "professional",
    "style": "clear",
    "provider": "local-mock",
    "model": "mock-optimizer-v1"
  }
}
```

### 2. 批量优化文本

**请求:**
```bash
POST /api/text-optimization/batch-optimize
Content-Type: application/json
Authorization: Bearer YOUR_JWT_TOKEN

{
  "texts": [
    "第一段文本。。需要优化",
    "第二段文本，，也有问题",
    "第三段文本  有多余空格"
  ],
  "tone": "professional",
  "style": "clear"
}
```

**响应:**
```json
{
  "success": true,
  "results": [
    {
      "original": "第一段文本。。需要优化",
      "optimized": "第一段文本。需要优化。",
      "success": true
    },
    // ... 更多结果
  ],
  "count": 3
}
```

### 3. 获取支持的语气列表

**请求:**
```bash
GET /api/text-optimization/tones
```

**响应:**
```json
{
  "success": true,
  "tones": [
    {
      "id": "professional",
      "name": "专业",
      "description": "适合商务和正式场合"
    },
    {
      "id": "casual",
      "name": "随意",
      "description": "轻松友好的日常交流"
    },
    {
      "id": "enthusiastic",
      "name": "热情",
      "description": "充满活力和感染力"
    }
  ]
}
```

### 4. 获取支持的风格列表

**请求:**
```bash
GET /api/text-optimization/styles
```

**响应:**
```json
{
  "success": true,
  "styles": [
    {
      "id": "clear",
      "name": "清晰",
      "description": "简洁明了，易于理解"
    },
    {
      "id": "detailed",
      "name": "详细",
      "description": "内容充实，信息丰富"
    },
    {
      "id": "concise",
      "name": "精简",
      "description": "简短有力，直击要点"
    }
  ]
}
```

### 5. 健康检查

**请求:**
```bash
GET /api/text-optimization/health
```

**响应:**
```json
{
  "status": "healthy",
  "mode": "MOCK",
  "provider": "local-mock"
}
```

---

## 🧪 测试方法

### 运行测试套件

```bash
# 测试文本优化服务
npm run test:text

# 或直接运行
node tests/test-text-optimization.js
```

### 手动测试

```bash
# 1. 启动Mock服务
npm run mock:services

# 2. 测试健康检查
curl http://localhost:5001/health

# 3. 测试文本优化
curl -X POST http://localhost:5001/api/v1/optimize \
  -H "Content-Type: application/json" \
  -d '{
    "text": "这是测试。。文本",
    "tone": "professional"
  }'
```

---

## 💡 使用示例

### JavaScript/Node.js

```javascript
import axios from 'axios';

async function optimizeText() {
  const response = await axios.post(
    'http://localhost:3001/api/text-optimization/optimize',
    {
      text: '大家好，欢迎来到我的频道。。今天我们要讨论AI技术',
      tone: 'enthusiastic',
      style: 'clear'
    },
    {
      headers: {
        'Authorization': `Bearer ${YOUR_JWT_TOKEN}`,
        'Content-Type': 'application/json'
      }
    }
  );

  console.log('优化结果:', response.data.optimized);
  console.log('改进建议:', response.data.suggestions);
}
```

### React前端集成

```jsx
import { useState } from 'react';
import axios from 'axios';

function TextOptimizer() {
  const [text, setText] = useState('');
  const [optimized, setOptimized] = useState('');
  const [loading, setLoading] = useState(false);

  const handleOptimize = async () => {
    setLoading(true);
    try {
      const response = await axios.post(
        '/api/text-optimization/optimize',
        {
          text,
          tone: 'professional',
          style: 'clear'
        },
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      setOptimized(response.data.optimized);
    } catch (error) {
      console.error('优化失败:', error);
    }
    setLoading(false);
  };

  return (
    <div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="输入需要优化的文本..."
      />
      <button onClick={handleOptimize} disabled={loading}>
        {loading ? '优化中...' : '优化文本'}
      </button>
      {optimized && (
        <div>
          <h3>优化结果:</h3>
          <p>{optimized}</p>
        </div>
      )}
    </div>
  );
}
```

---

## 🔧 故障排查

### 问题1: Mock服务连接失败

**症状**: `ECONNREFUSED` 错误

**解决**:
```bash
# 确认Mock服务运行
ps aux | grep mockTextOptimization

# 重启Mock服务
npm run mock:services
```

### 问题2: OpenAI API错误

**症状**: `OpenAI API错误: Incorrect API key`

**解决**:
```bash
# 检查API key配置
cat .env.production | grep OPENAI_API_KEY

# 更新API key
echo "OPENAI_API_KEY=sk-your-real-key" >> .env.production
```

### 问题3: 优化效果不理想

**解决**:
- 尝试不同的`tone`和`style`组合
- 如果使用Mock服务，切换到真实AI提供商
- 调整提示词 (编辑`textOptimizationService.js`中的`buildSystemPrompt`)

---

## 📊 性能对比

| 提供商 | 响应时间 | 优化质量 | 成本 | CPU使用 |
|-------|---------|---------|------|---------|
| **Mock** | < 1s | ⭐⭐⭐ | 免费 | 低 |
| **OpenAI** | 2-5s | ⭐⭐⭐⭐⭐ | $$ | 无 (API调用) |
| **智谱AI** | 2-4s | ⭐⭐⭐⭐ | $ | 无 (API调用) |

---

## 🎯 最佳实践

1. **开发阶段**: 使用Mock服务快速迭代
2. **测试阶段**: 用真实API测试优化效果
3. **生产环境**: 根据项目需求选择OpenAI或智谱AI
4. **批量处理**: 使用`batch-optimize`提高效率
5. **错误处理**: 实现降级策略 (AI失败→Mock)

---

## 📞 需要帮助?

- 查看测试脚本: `tests/test-text-optimization.js`
- 检查服务日志: `pm2 logs`或控制台输出
- 参考API源码: `server/services/textOptimizationService.js`

祝使用愉快! 📝✨

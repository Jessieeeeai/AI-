# 💎 VIP测试账号 - 1000积分

## 🎉 账号信息

```
📧 邮箱: vip@videoai.com
🔒 密码: vip123456
👤 用户名: VIP测试用户
💰 积分: 1000
🆔 用户ID: 13
🎖️ 等级: 1
```

---

## ✅ 验证登录

账号已创建并验证成功：

```json
{
  "message": "登录成功",
  "token": "eyJhbGci...",
  "user": {
    "id": 13,
    "email": "vip@videoai.com",
    "username": "VIP测试用户",
    "credits": 1000,
    "level": 1
  }
}
```

---

## 🚀 使用方式

### 方法1: 前端登录
1. 访问前端页面
2. 输入邮箱: `vip@videoai.com`
3. 输入密码: `vip123456`
4. 点击登录
5. 可以看到积分显示为 **1000**

### 方法2: API测试
```bash
# 登录获取token
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "vip@videoai.com",
    "password": "vip123456"
  }'
```

---

## 💡 1000积分可以做什么？

根据积分消耗规则：

### 基础视频生成
- **预设模板:** 5积分/60秒
- **1000积分可生成:** 约200段60秒视频
- **总时长:** 约12,000秒（200分钟）

### 自定义模板视频
- **自定义模板:** +50积分/次
- **总成本:** 55积分/60秒
- **1000积分可生成:** 约18段自定义视频

### 混合使用
- 生成10段自定义模板视频（550积分）
- 剩余450积分可生成90段预设模板视频
- 总共100段视频

---

## 📊 积分消耗明细

| 项目 | 积分消耗 | 说明 |
|------|---------|------|
| 预设模板视频 | 5/60秒 | 使用系统10个预设模板 |
| 自定义模板附加费 | +50/次 | 使用上传的自定义模板 |
| 声音克隆 | 免费 | 上传参考音频 |
| 模板上传 | 免费 | 上传自定义视频模板 |

**注意：** 
- 视频时长按分段计算（每段最长60秒）
- 文本自动按300字符分段
- 积分在任务创建时扣除

---

## 🎯 推荐测试场景

### 1. 短视频测试（5积分/次）
```json
{
  "text": "大家好，欢迎来到VideoAI Pro！",
  "templateId": "template_1"
}
```

### 2. 长文本测试（自动分段）
```json
{
  "text": "这是一段很长的文本...(超过300字符会自动分段)",
  "templateId": "template_2"
}
```

### 3. 情感控制测试
```json
{
  "text": "今天是个好日子！",
  "voiceSettings": {
    "happiness": 0.9,
    "surprise": 0.7
  },
  "templateId": "template_3"
}
```

### 4. 自定义模板测试（55积分/次）
```json
{
  "text": "使用我自己的视频模板",
  "templateId": "your_custom_template_id",
  "isCustomTemplate": true
}
```

---

## 🔧 积分管理

### 查看当前积分
```bash
# 登录后获取token
TOKEN="your_token_here"

# 查询用户信息
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3001/api/auth/profile

# 返回包含credits字段
```

### 手动添加积分（管理员）
```bash
# 使用积分更新脚本
cd /home/user/webapp
node update_credits.js 13 2000

# 将VIP账号积分改为2000
```

### 重置积分为初始值
```bash
# 重置为1000积分
node update_credits.js 13 1000
```

---

## 📈 测试建议

### 测试优先级

1. **基础功能测试（100积分）**
   - 注册登录流程
   - 预设模板视频生成
   - 情感参数调整
   - 任务列表查看

2. **进阶功能测试（300积分）**
   - 声音克隆上传
   - 自定义声音使用
   - 长文本自动分段
   - 多任务并发

3. **完整功能测试（600积分）**
   - 自定义模板上传
   - 自定义模板视频生成
   - 支付流程模拟
   - 错误处理测试

**剩余积分备用**

---

## ⚠️ 注意事项

1. **Mock模式限制**
   - 当前使用Mock服务
   - 生成的是测试视频
   - 不消耗GPU资源

2. **积分真实扣除**
   - Mock模式下积分仍会扣除
   - 可用脚本重置积分
   - 生产环境需购买充值

3. **测试数据**
   - 所有数据保存在本地数据库
   - 不会同步到云端
   - 服务重启后数据保留

---

## 🆘 问题排查

### 问题1: 登录失败
```bash
# 验证账号存在
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"vip@videoai.com","password":"vip123456"}'

# 检查返回信息
```

### 问题2: 积分未显示
```bash
# 查询数据库
node update_credits.js 13 1000

# 重新登录获取最新信息
```

### 问题3: 积分消耗异常
```bash
# 查看后端日志
pm2 logs videoai-backend

# 查看任务详情
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3001/api/tasks/YOUR_TASK_ID
```

---

## 📞 相关文档

- **`TEST_ACCOUNTS.md`** - 所有测试账号列表
- **`TEST_GUIDE.md`** - API测试完整指南
- **`DEPLOYMENT_COMPLETE.md`** - 系统部署状态
- **`INTEGRATION_SUMMARY.md`** - 技术架构文档

---

**祝您测试愉快！享受1000积分带来的畅快体验！** 🎉🚀

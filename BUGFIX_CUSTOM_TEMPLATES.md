# Bug Fix: Custom Templates Not Displaying

## Problem
用户上传自定义模板后，在"选择视频模板"页面看不到已上传的模板。显示为空白上传区域。

## Root Causes

### 1. Frontend Issue (Primary)
**File:** `client/src/components/create/Step3TemplateSelect.jsx`

**Problem:** 组件未实现获取和显示用户自定义模板的功能
- 没有调用 `uploadService.getUserTemplates()` API
- 没有渲染用户已上传模板的列表
- 缺少删除模板的功能

### 2. Backend Issue (Secondary)
**File:** `server/controllers/uploadController.js`

**Problem:** 数据库查询函数使用错误
```javascript
// ❌ 错误 - dbRun 用于 INSERT/UPDATE/DELETE
const templates = await dbRun('SELECT * FROM ...', [userId]);

// ✅ 正确 - dbAll 用于 SELECT (多行结果)
const templates = await dbAll('SELECT * FROM ...', [userId]);
```

这导致 `getUserVoices()` 和 `getUserTemplates()` 返回空数组。

## Solutions Applied

### 1. Frontend Fixes

#### Added State Management
```javascript
const [userTemplates, setUserTemplates] = useState([]);
const [loadingTemplates, setLoadingTemplates] = useState(true);
```

#### Added Template Fetching
```javascript
useEffect(() => {
  fetchUserTemplates();
}, []);

const fetchUserTemplates = async () => {
  try {
    setLoadingTemplates(true);
    const response = await uploadService.getUserTemplates();
    setUserTemplates(response.templates || []);
  } catch (error) {
    console.error('获取自定义模板列表失败:', error);
  } finally {
    setLoadingTemplates(false);
  }
};
```

#### Added Template Display Grid
- 显示用户所有已上传模板
- 支持选择模板用于视频生成
- 显示模板状态（处理中/已就绪）
- 悬停时显示删除按钮
- 支持视频缩略图或占位符

#### Added Delete Functionality
```javascript
const handleDeleteTemplate = async (templateId) => {
  if (!confirm('确定要删除这个模板吗？')) return;
  
  try {
    await uploadService.deleteTemplate(templateId);
    
    // 如果删除的是当前选中的模板，切换到默认模板
    if (selectedTemplate === templateId) {
      setSelectedTemplate('template_1');
      updateData({ templateId: 'template_1', isCustomTemplate: false });
    }
    
    await fetchUserTemplates();
    alert('模板已删除');
  } catch (error) {
    alert('删除失败：' + (error.message || '请稍后重试'));
  }
};
```

#### Improved Upload Workflow
- 上传成功后自动刷新模板列表
- 自动选择新上传的模板
- 改进文件类型验证（MIME + 扩展名）

### 2. Backend Fixes

#### Fixed Import Statement
```javascript
// Before
import { dbRun, dbGet } from '../config/database.js';

// After
import { dbRun, dbGet, dbAll } from '../config/database.js';
```

#### Fixed getUserVoices()
```javascript
// Before (incorrect)
const voices = await dbRun(
  'SELECT * FROM user_voices WHERE user_id = ? ORDER BY created_at DESC',
  [userId]
);

// After (correct)
const voices = await dbAll(
  'SELECT * FROM user_voices WHERE user_id = ? ORDER BY created_at DESC',
  [userId]
);
```

#### Fixed getUserTemplates()
```javascript
// Before (incorrect)
const templates = await dbRun(
  'SELECT * FROM user_templates WHERE user_id = ? ORDER BY created_at DESC',
  [userId]
);

// After (correct)
const templates = await dbAll(
  'SELECT * FROM user_templates WHERE user_id = ? ORDER BY created_at DESC',
  [userId]
);
```

## Database Functions Reference

### SQLite Wrapper Functions

| Function | Usage | Returns |
|----------|-------|---------|
| `dbRun()` | INSERT, UPDATE, DELETE | `{ id: lastID, changes: count }` |
| `dbGet()` | SELECT single row | `row object` or `undefined` |
| `dbAll()` | SELECT multiple rows | `array of rows` |

### Common Mistakes

❌ **Wrong:** Using `dbRun()` for SELECT queries
```javascript
const users = await dbRun('SELECT * FROM users WHERE id = ?', [userId]);
// Returns: { id: undefined, changes: 0 }
```

✅ **Correct:** Use `dbGet()` for single row, `dbAll()` for multiple rows
```javascript
const user = await dbGet('SELECT * FROM users WHERE id = ?', [userId]);
const users = await dbAll('SELECT * FROM users ORDER BY created_at DESC');
```

## UI Components Added

### Template Card Features
- ✅ 视频缩略图或占位符
- ✅ 模板状态标签（处理中/已就绪）
- ✅ 选中状态高亮（紫色边框）
- ✅ 悬停播放按钮
- ✅ 悬停删除按钮
- ✅ 响应式网格布局（2列/5列）

### Loading States
- ✅ 加载中指示器（获取模板列表时）
- ✅ 上传中指示器
- ✅ 空状态处理（无模板时仅显示上传区）

### Error Handling
- ✅ 上传失败错误提示
- ✅ 删除确认对话框
- ✅ 网络请求失败处理

## Testing Checklist

### Manual Testing Steps

1. **Upload Custom Template**
   - [ ] 登录系统
   - [ ] 进入"创建视频" → "选择视频模板"
   - [ ] 点击"选择文件上传"
   - [ ] 上传 MP4/MOV 视频文件（<50MB）
   - [ ] 确认上传成功提示
   - [ ] 确认模板出现在网格中

2. **Select Custom Template**
   - [ ] 点击自定义模板卡片
   - [ ] 确认紫色边框高亮显示
   - [ ] 确认可以切换回预设模板
   - [ ] 点击"下一步"继续

3. **Delete Custom Template**
   - [ ] 悬停在模板卡片上
   - [ ] 点击左上角红色删除按钮
   - [ ] 确认删除对话框
   - [ ] 确认模板从列表中移除

4. **Multiple Templates**
   - [ ] 上传多个模板
   - [ ] 确认所有模板显示在网格中
   - [ ] 确认可以在不同模板间切换
   - [ ] 确认删除任意模板不影响其他模板

### API Testing

```bash
# Login
TOKEN=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}' \
  | jq -r '.token')

# Get user templates
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3001/api/upload/templates | jq

# Expected response:
# {
#   "success": true,
#   "templates": [
#     {
#       "id": "uuid",
#       "user_id": 1,
#       "video_url": "/public/uploads/templates/xxx.mp4",
#       "thumbnail_url": null,
#       "face_detected": 0,
#       "status": "processing",
#       "created_at": "2025-11-20T..."
#     }
#   ]
# }
```

## Files Modified

### Frontend
- `client/src/components/create/Step3TemplateSelect.jsx`
  - Added `useEffect` hook for fetching templates
  - Added `fetchUserTemplates()` function
  - Added `handleDeleteTemplate()` function
  - Added user templates grid display
  - Improved upload workflow

### Backend
- `server/controllers/uploadController.js`
  - Fixed import statement (added `dbAll`)
  - Fixed `getUserVoices()` to use `dbAll`
  - Fixed `getUserTemplates()` to use `dbAll`

## Impact

### User Experience
- ✅ 用户现在可以看到所有已上传的自定义模板
- ✅ 可以选择自定义模板用于视频生成
- ✅ 可以删除不需要的模板
- ✅ 上传体验更流畅（自动选择新模板）

### System Behavior
- ✅ 数据库查询返回正确的结果集
- ✅ 声音克隆列表功能同样修复
- ✅ 模板管理功能完整可用

## Related Issues Fixed

This fix also resolves the same issue in:
- **Voice cloning list** (`getUserVoices()`) - same `dbRun` → `dbAll` fix applied

## Deployment Notes

1. **Frontend:** Changes are hot-reloaded by Vite
2. **Backend:** Nodemon auto-restarts on file changes
3. **Database:** No migration needed (schema unchanged)
4. **Cache:** No cache clearing needed

## Commit Message

```
fix: custom templates not displaying in selection page

Fixed two issues preventing custom templates from showing:

1. Frontend: Added template fetching and display logic
   - Fetch user templates on component mount
   - Display templates in responsive grid
   - Add delete functionality with confirmation
   - Auto-select newly uploaded templates

2. Backend: Fixed database query function usage
   - Changed getUserTemplates() to use dbAll instead of dbRun
   - Fixed getUserVoices() with same correction
   - dbRun is for INSERT/UPDATE/DELETE, dbAll for SELECT

This ensures users can see, select, and manage their uploaded
custom templates properly.

Files changed:
- client/src/components/create/Step3TemplateSelect.jsx
- server/controllers/uploadController.js
```

---

**Status:** ✅ FIXED
**Tested:** 2025-11-20
**Severity:** Medium (功能完全失效)
**Priority:** High (核心功能)

import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import {
  upload,
  uploadVoice,
  uploadTemplate,
  getUserVoices,
  getUserTemplates,
  deleteVoice,
  deleteTemplate
} from '../controllers/uploadController.js';

const router = express.Router();

// 所有上传路由都需要认证
router.use(authenticateToken);

// 上传声音克隆文件
router.post('/voice', upload.single('audio'), uploadVoice);

// 上传自定义模板
router.post('/template', upload.single('video'), uploadTemplate);

// 获取用户的声音列表
router.get('/voices', getUserVoices);

// 获取用户的模板列表
router.get('/templates', getUserTemplates);

// 删除声音
router.delete('/voice/:voiceId', deleteVoice);

// 删除模板
router.delete('/template/:templateId', deleteTemplate);

export default router;

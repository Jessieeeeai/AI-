import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { dbRun, dbGet, dbAll } from '../config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 配置文件存储
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../../public/uploads');
    
    // 根据文件类型选择目录
    let subDir = 'temp';
    if (file.mimetype.startsWith('audio/')) {
      subDir = 'voices';
    } else if (file.mimetype.startsWith('video/')) {
      subDir = 'templates';
    }
    
    const finalDir = path.join(uploadDir, subDir);
    
    // 确保目录存在
    if (!fs.existsSync(finalDir)) {
      fs.mkdirSync(finalDir, { recursive: true });
    }
    
    cb(null, finalDir);
  },
  filename: function (req, file, cb) {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

// 文件过滤器
const fileFilter = (req, file, cb) => {
  const allowedAudioTypes = [
    'audio/mpeg', 
    'audio/mp3', 
    'audio/wav', 
    'audio/m4a', 
    'audio/x-m4a',
    'audio/mp4',        // M4A 可能被识别为 mp4
    'audio/x-mp4',
    'audio/aac'         // M4A 实际是 AAC 编码
  ];
  const allowedVideoTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo'];
  
  // 也检查文件扩展名作为备用验证
  const ext = path.extname(file.originalname).toLowerCase();
  const allowedAudioExts = ['.mp3', '.wav', '.m4a'];
  const allowedVideoExts = ['.mp4', '.mov', '.avi'];
  
  const isValidAudio = allowedAudioTypes.includes(file.mimetype) || allowedAudioExts.includes(ext);
  const isValidVideo = allowedVideoTypes.includes(file.mimetype) || allowedVideoExts.includes(ext);
  
  if (isValidAudio || isValidVideo) {
    cb(null, true);
  } else {
    cb(new Error('不支持的文件格式'), false);
  }
};

// Multer 实例
export const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB
  }
});

// 上传声音克隆文件
export const uploadVoice = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        error: 'no_file',
        message: '请选择一个音频文件' 
      });
    }

    const userId = req.user.id;
    const file = req.file;
    
    // 验证文件类型（MIME 类型或扩展名）
    const ext = path.extname(file.originalname).toLowerCase();
    const allowedExts = ['.mp3', '.wav', '.m4a'];
    const isAudio = file.mimetype.startsWith('audio/') || allowedExts.includes(ext);
    
    if (!isAudio) {
      // 删除文件
      fs.unlinkSync(file.path);
      return res.status(400).json({ 
        error: 'invalid_file_type',
        message: '只支持音频文件（MP3, WAV, M4A）' 
      });
    }

    // 验证文件大小（10MB以下）
    if (file.size > 10 * 1024 * 1024) {
      fs.unlinkSync(file.path);
      return res.status(400).json({ 
        error: 'file_too_large',
        message: '音频文件大小不能超过10MB' 
      });
    }

    const voiceId = uuidv4();
    const audioUrl = `/public/uploads/voices/${file.filename}`;

    // TODO: 获取音频时长
    // const audioDuration = await getAudioDuration(file.path);

    // 保存到数据库
    await dbRun(
      `INSERT INTO user_voices (id, user_id, audio_url, duration, status) 
       VALUES (?, ?, ?, ?, ?)`,
      [voiceId, userId, audioUrl, 0, 'processing']
    );

    // TODO: 触发声音克隆处理任务
    // 这里应该将任务加入队列，由后台服务处理
    // await queueVoiceCloning(voiceId, file.path);

    res.json({
      success: true,
      voiceId,
      message: '音频上传成功，正在处理中',
      audioUrl
    });

  } catch (error) {
    console.error('上传声音文件失败:', error);
    
    // 删除已上传的文件
    if (req.file) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (err) {
        console.error('删除文件失败:', err);
      }
    }
    
    res.status(500).json({ 
      error: 'upload_failed',
      message: '上传失败，请稍后重试' 
    });
  }
};

// 上传自定义模板
export const uploadTemplate = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        error: 'no_file',
        message: '请选择一个视频文件' 
      });
    }

    const userId = req.user.id;
    const file = req.file;
    
    // 验证文件类型（MIME 类型或扩展名）
    const ext = path.extname(file.originalname).toLowerCase();
    const allowedExts = ['.mp4', '.mov'];
    const isVideo = file.mimetype.startsWith('video/') || allowedExts.includes(ext);
    
    if (!isVideo) {
      fs.unlinkSync(file.path);
      return res.status(400).json({ 
        error: 'invalid_file_type',
        message: '只支持视频文件（MP4, MOV）' 
      });
    }

    // 验证文件大小（50MB以下）
    if (file.size > 50 * 1024 * 1024) {
      fs.unlinkSync(file.path);
      return res.status(400).json({ 
        error: 'file_too_large',
        message: '视频文件大小不能超过50MB' 
      });
    }

    const templateId = uuidv4();
    const videoUrl = `/public/uploads/templates/${file.filename}`;

    // TODO: 生成缩略图
    // const thumbnailUrl = await generateThumbnail(file.path);

    // TODO: 检测人脸
    // const faceDetected = await detectFace(file.path);

    // 保存到数据库
    await dbRun(
      `INSERT INTO user_templates (id, user_id, video_url, thumbnail_url, face_detected, status) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [templateId, userId, videoUrl, null, 0, 'processing']
    );

    // TODO: 触发模板处理任务
    // await queueTemplateProcessing(templateId, file.path);

    res.json({
      success: true,
      templateId,
      message: '视频上传成功，正在处理中',
      videoUrl
    });

  } catch (error) {
    console.error('上传模板文件失败:', error);
    
    // 删除已上传的文件
    if (req.file) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (err) {
        console.error('删除文件失败:', err);
      }
    }
    
    res.status(500).json({ 
      error: 'upload_failed',
      message: '上传失败，请稍后重试' 
    });
  }
};

// 获取用户的声音列表
export const getUserVoices = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const voices = await dbAll(
      'SELECT * FROM user_voices WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );

    res.json({
      success: true,
      voices: voices || []
    });

  } catch (error) {
    console.error('获取声音列表失败:', error);
    res.status(500).json({ 
      error: 'fetch_failed',
      message: '获取声音列表失败' 
    });
  }
};

// 获取用户的模板列表
export const getUserTemplates = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const templates = await dbAll(
      'SELECT * FROM user_templates WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );

    res.json({
      success: true,
      templates: templates || []
    });

  } catch (error) {
    console.error('获取模板列表失败:', error);
    res.status(500).json({ 
      error: 'fetch_failed',
      message: '获取模板列表失败' 
    });
  }
};

// 删除声音
export const deleteVoice = async (req, res) => {
  try {
    const { voiceId } = req.params;
    const userId = req.user.id;

    // 获取声音信息
    const voice = await dbGet(
      'SELECT * FROM user_voices WHERE id = ? AND user_id = ?',
      [voiceId, userId]
    );

    if (!voice) {
      return res.status(404).json({ 
        error: 'not_found',
        message: '声音不存在' 
      });
    }

    // 删除文件
    const filePath = path.join(__dirname, '../../', voice.audio_url);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // 删除数据库记录
    await dbRun('DELETE FROM user_voices WHERE id = ?', [voiceId]);

    res.json({
      success: true,
      message: '声音已删除'
    });

  } catch (error) {
    console.error('删除声音失败:', error);
    res.status(500).json({ 
      error: 'delete_failed',
      message: '删除失败' 
    });
  }
};

// 删除模板
export const deleteTemplate = async (req, res) => {
  try {
    const { templateId } = req.params;
    const userId = req.user.id;

    // 获取模板信息
    const template = await dbGet(
      'SELECT * FROM user_templates WHERE id = ? AND user_id = ?',
      [templateId, userId]
    );

    if (!template) {
      return res.status(404).json({ 
        error: 'not_found',
        message: '模板不存在' 
      });
    }

    // 删除文件
    const filePath = path.join(__dirname, '../../', template.video_url);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // 删除缩略图
    if (template.thumbnail_url) {
      const thumbPath = path.join(__dirname, '../../', template.thumbnail_url);
      if (fs.existsSync(thumbPath)) {
        fs.unlinkSync(thumbPath);
      }
    }

    // 删除数据库记录
    await dbRun('DELETE FROM user_templates WHERE id = ?', [templateId]);

    res.json({
      success: true,
      message: '模板已删除'
    });

  } catch (error) {
    console.error('删除模板失败:', error);
    res.status(500).json({ 
      error: 'delete_failed',
      message: '删除失败' 
    });
  }
};

import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { dbRun, dbGet, dbAll } from '../config/database.js';
import voiceCloneService from '../services/voiceCloneService.js';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cloudflare R2 配置
const r2Client = new S3Client({
    region: 'auto',
    endpoint: process.env.R2_ENDPOINT,
    credentials: {
          accessKeyId: process.env.R2_ACCESS_KEY_ID,
          secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
});

const R2_BUCKET = process.env.R2_BUCKET_NAME || 'videoai-templates';
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || 'https://pub-7e2c78d85f9642f68cb7d2794fc53473.r2.dev';

// 上传文件到R2
async function uploadToR2(filePath, key, contentType) {
    const fileBuffer = fs.readFileSync(filePath);

    const command = new PutObjectCommand({
          Bucket: R2_BUCKET,
          Key: key,
          Body: fileBuffer,
          ContentType: contentType,
    });

    await r2Client.send(command);
    return `${R2_PUBLIC_URL}/${key}`;
}

// 从R2删除文件
async function deleteFromR2(key) {
    try {
          const command = new DeleteObjectCommand({
                  Bucket: R2_BUCKET,
                  Key: key,
          });
          await r2Client.send(command);
          console.log(`✅ R2文件已删除: ${key}`);
    } catch (error) {
          console.error(`❌ R2文件删除失败: ${key}`, error.message);
    }
}

// 配置文件存储 - 临时本地存储用于处理后上传到R2
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
          'audio/mp4',
          'audio/x-mp4',
          'audio/aac'
        ];
    const allowedVideoTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo'];

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

          // 验证文件类型
          const ext = path.extname(file.originalname).toLowerCase();
          const allowedExts = ['.mp3', '.wav', '.m4a'];
          const isAudio = file.mimetype.startsWith('audio/') || allowedExts.includes(ext);

          if (!isAudio) {
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
          const r2Key = `voices/${voiceId}${ext}`;

          let audioUrl;

          // 尝试上传到R2
          try {
                  console.log(`📤 正在上传声音文件到R2: ${r2Key}`);
                  audioUrl = await uploadToR2(file.path, r2Key, file.mimetype);
                  console.log(`✅ R2上传成功: ${audioUrl}`);

                  // 上传成功后删除本地临时文件
                  fs.unlinkSync(file.path);
          } catch (r2Error) {
                  console.error('❌ R2上传失败，保持本地存储:', r2Error.message);
                  // R2上传失败，使用本地路径（作为降级方案）
                  audioUrl = `/public/uploads/voices/${file.filename}`;
          }

          // 保存到数据库
          await dbRun(
                  `INSERT INTO user_voices (id, user_id, audio_url, file_name, duration, status) 
                         VALUES (?, ?, ?, ?, ?, ?)`,
                  [voiceId, userId, audioUrl, file.originalname, 0, 'processing']
                );

          // 触发声音克隆处理任务（异步处理）
          voiceCloneService.processUserVoice(voiceId, userId)
            .then(() => {
                      console.log(`✅ 声音克隆完成: ${voiceId}`);
            })
            .catch((error) => {
                      console.error(`❌ 声音克隆失败: ${voiceId}`, error.message);
            });

          res.json({
                  success: true,
                  voice: {
                            id: voiceId,
                            voiceId: voiceId,
                            audioUrl: audioUrl,
                            fileName: file.originalname,
                            status: 'processing',
                            duration: 0,
                            createdAt: new Date().toISOString()
                  },
                  message: '音频上传成功，正在处理中'
          });

    } catch (error) {
          console.error('上传声音文件失败:', error);

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

          if (file.size > 50 * 1024 * 1024) {
                  fs.unlinkSync(file.path);
                  return res.status(400).json({ 
                            error: 'file_too_large',
                            message: '视频文件大小不能超过50MB' 
                  });
          }

          const templateId = uuidv4();
          const videoUrl = `/public/uploads/templates/${file.filename}`;

          await dbRun(
                  `INSERT INTO user_templates (id, user_id, video_url, thumbnail_url, face_detected, status) 
                         VALUES (?, ?, ?, ?, ?, ?)`,
                  [templateId, userId, videoUrl, null, 0, 'processing']
                );

          res.json({
                  success: true,
                  templateId,
                  message: '视频上传成功，正在处理中',
                  videoUrl
          });

    } catch (error) {
          console.error('上传模板文件失败:', error);

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

          // 如果是R2 URL，从R2删除
          if (voice.audio_url && voice.audio_url.includes('r2.dev')) {
                  const r2Key = voice.audio_url.split('/').slice(-2).join('/');
                  await deleteFromR2(r2Key);
          } else {
                  // 删除本地文件
                  const filePath = path.join(__dirname, '../../', voice.audio_url);
                  if (fs.existsSync(filePath)) {
                            fs.unlinkSync(filePath);
                  }
          }

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

          const filePath = path.join(__dirname, '../../', template.video_url);
          if (fs.existsSync(filePath)) {
                  fs.unlinkSync(filePath);
          }

          if (template.thumbnail_url) {
                  const thumbPath = path.join(__dirname, '../../', template.thumbnail_url);
                  if (fs.existsSync(thumbPath)) {
                            fs.unlinkSync(thumbPath);
                  }
          }

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

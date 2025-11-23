/**
 * 模板数据初始化
 */

import { dbRun } from '../config/database.js';

const templates = [
  {
    name: '商务男性',
    description: '专业商务男性形象，适合企业宣传、产品介绍',
    category: '商务',
    thumbnail_url: '/public/templates/business-male-thumb.jpg',
    video_url: '/public/templates/business-male.mp4',
    duration: 0,
    is_free: 1
  },
  {
    name: '商务女性',
    description: '专业商务女性形象，适合企业培训、市场推广',
    category: '商务',
    thumbnail_url: '/public/templates/business-female-thumb.jpg',
    video_url: '/public/templates/business-female.mp4',
    duration: 0,
    is_free: 1
  },
  {
    name: '活力青年',
    description: '充满活力的年轻形象，适合时尚、科技产品',
    category: '时尚',
    thumbnail_url: '/public/templates/youth-thumb.jpg',
    video_url: '/public/templates/youth.mp4',
    duration: 0,
    is_free: 0
  },
  {
    name: '知性教师',
    description: '知性优雅的教师形象，适合教育培训、知识分享',
    category: '教育',
    thumbnail_url: '/public/templates/teacher-thumb.jpg',
    video_url: '/public/templates/teacher.mp4',
    duration: 0,
    is_free: 1
  },
  {
    name: '亲和主播',
    description: '亲切友好的主播形象，适合新闻播报、生活资讯',
    category: '媒体',
    thumbnail_url: '/public/templates/anchor-thumb.jpg',
    video_url: '/public/templates/anchor.mp4',
    duration: 0,
    is_free: 0
  }
];

export async function seedTemplates() {
  console.log('🌱 开始初始化模板数据...');

  try {
    // 检查是否已有数据
    const { dbGet } = await import('../config/database.js');
    const existing = await dbGet('SELECT COUNT(*) as count FROM templates');

    if (existing.count > 0) {
      console.log('✅ 模板数据已存在，跳过初始化');
      return;
    }

    // 插入模板数据
    for (const template of templates) {
      await dbRun(
        `INSERT INTO templates (
          name, description, category, thumbnail_url, 
          video_url, duration, is_free, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
        [
          template.name,
          template.description,
          template.category,
          template.thumbnail_url,
          template.video_url,
          template.duration,
          template.is_free
        ]
      );
      console.log(`  ✓ 创建模板: ${template.name}`);
    }

    console.log('✅ 模板数据初始化完成\n');

  } catch (error) {
    console.error('❌ 模板数据初始化失败:', error);
    throw error;
  }
}

// 如果直接运行此文件
if (import.meta.url === `file://${process.argv[1]}`) {
  seedTemplates()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

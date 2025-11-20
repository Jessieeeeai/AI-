/**
 * 数据库迁移：更新草稿表
 * 
 * 为drafts表添加新字段以支持优化后的工作流：
 * - original_text: 原始文本
 * - optimized_text: 优化后的文本
 * - optimization_style: 优化风格 (humorous/professional/casual)
 * - voice_type: 声音类型 (system/custom)
 * - segmentation_data: 分段信息（JSON格式）
 */

import db, { dbRun } from '../config/database.js';

async function migrateUp() {
  console.log('🔄 开始数据库迁移：更新草稿表...');

  try {
    // 检查列是否已存在
    const tableInfo = await new Promise((resolve, reject) => {
      db.all('PRAGMA table_info(drafts)', (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    const existingColumns = tableInfo.map(col => col.name);

    // 需要添加的新列
    const newColumns = [
      {
        name: 'original_text',
        sql: 'ALTER TABLE drafts ADD COLUMN original_text TEXT'
      },
      {
        name: 'optimized_text',
        sql: 'ALTER TABLE drafts ADD COLUMN optimized_text TEXT'
      },
      {
        name: 'optimization_style',
        sql: 'ALTER TABLE drafts ADD COLUMN optimization_style TEXT DEFAULT "humorous"'
      },
      {
        name: 'voice_type',
        sql: 'ALTER TABLE drafts ADD COLUMN voice_type TEXT DEFAULT "system"'
      },
      {
        name: 'segmentation_data',
        sql: 'ALTER TABLE drafts ADD COLUMN segmentation_data TEXT'
      }
    ];

    // 添加不存在的列
    for (const column of newColumns) {
      if (!existingColumns.includes(column.name)) {
        await dbRun(column.sql);
        console.log(`✅ 添加字段到drafts: ${column.name}`);
      } else {
        console.log(`⏭️  字段已存在: ${column.name}`);
      }
    }

    console.log('✅ 草稿表迁移完成！');
    return true;
  } catch (error) {
    console.error('❌ 草稿表迁移失败:', error);
    throw error;
  }
}

// 如果直接运行此文件
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateUp()
    .then(() => {
      console.log('✅ 迁移成功完成');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ 迁移失败:', error);
      process.exit(1);
    });
}

export { migrateUp };

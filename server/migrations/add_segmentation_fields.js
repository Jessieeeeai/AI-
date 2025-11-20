/**
 * 数据库迁移：添加分段支持字段
 * 
 * 为tasks表添加新字段以支持优化后的工作流：
 * - original_text: 原始文本（未优化）
 * - optimized_text: AI优化后的文本
 * - segmentation_strategy: 分段策略 (auto/short/medium/long)
 * - segment_count: 分段数量
 * - segment_data: 分段详细信息（JSON格式）
 * - merge_status: 合并状态 (none/pending/processing/completed/failed)
 */

import db, { dbRun, dbGet } from '../config/database.js';

async function migrateUp() {
  console.log('🔄 开始数据库迁移：添加分段支持字段...');

  try {
    // 检查列是否已存在
    const tableInfo = await new Promise((resolve, reject) => {
      db.all('PRAGMA table_info(tasks)', (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });

    const existingColumns = tableInfo.map(col => col.name);

    // 需要添加的新列
    const newColumns = [
      {
        name: 'original_text',
        sql: 'ALTER TABLE tasks ADD COLUMN original_text TEXT'
      },
      {
        name: 'optimized_text',
        sql: 'ALTER TABLE tasks ADD COLUMN optimized_text TEXT'
      },
      {
        name: 'segmentation_strategy',
        sql: 'ALTER TABLE tasks ADD COLUMN segmentation_strategy TEXT DEFAULT "auto"'
      },
      {
        name: 'segment_count',
        sql: 'ALTER TABLE tasks ADD COLUMN segment_count INTEGER DEFAULT 1'
      },
      {
        name: 'segment_data',
        sql: 'ALTER TABLE tasks ADD COLUMN segment_data TEXT'
      },
      {
        name: 'merge_status',
        sql: 'ALTER TABLE tasks ADD COLUMN merge_status TEXT DEFAULT "none"'
      }
    ];

    // 添加不存在的列
    for (const column of newColumns) {
      if (!existingColumns.includes(column.name)) {
        await dbRun(column.sql);
        console.log(`✅ 添加字段: ${column.name}`);
      } else {
        console.log(`⏭️  字段已存在: ${column.name}`);
      }
    }

    console.log('✅ 数据库迁移完成！');
    return true;
  } catch (error) {
    console.error('❌ 数据库迁移失败:', error);
    throw error;
  }
}

async function migrateDown() {
  console.log('🔄 回滚数据库迁移：移除分段支持字段...');

  try {
    // SQLite不支持直接删除列，需要重建表
    // 这里只是示例，实际生产环境需要更复杂的逻辑

    console.log('⚠️  SQLite不支持删除列，需要手动重建表');
    console.log('建议：备份数据 -> 删除表 -> 重新创建 -> 恢复数据');

    return false;
  } catch (error) {
    console.error('❌ 回滚失败:', error);
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

export { migrateUp, migrateDown };

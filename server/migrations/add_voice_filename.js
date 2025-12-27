/**
 * 数据库迁移：为 user_voices 表添加 file_name 字段
 * 
 * 修复问题：上传声音文件时原始文件名丢失，导致前端只显示日期
 */

import db, { dbRun, dbGet } from '../config/database.js';

async function migrateUp() {
    console.log('🔄 开始数据库迁移：添加 file_name 字段到 user_voices 表...');

  try {
        // 检查列是否已存在
      const tableInfo = await new Promise((resolve, reject) => {
              db.all('PRAGMA table_info(user_voices)', (err, rows) => {
                        if (err) reject(err);
                        else resolve(rows);
              });
      });

      const existingColumns = tableInfo.map(col => col.name);

      // 需要添加的新列
      const newColumns = [
        {
                  name: 'file_name',
                  sql: 'ALTER TABLE user_voices ADD COLUMN file_name TEXT'
        }
            ];

      // 添加不存在的列
      for (const column of newColumns) {
              if (!existingColumns.includes(column.name)) {
                        await dbRun(column.sql);
                        console.log(`✅ 添加字段: ${column.name}`);
              } else {
                        console.log(`⏭️ 字段已存在: ${column.name}`);
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
    console.log('⚠️ SQLite不支持删除列，需要手动重建表');
    return false;
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
